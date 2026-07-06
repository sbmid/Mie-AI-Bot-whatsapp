const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
// Konfigurasi khusus agar content:encoded terbaca dengan benar
const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
        ]
    }
});
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

const STATE_FILE = path.join(process.cwd(), 'database', 'chnews_state.json');

// Initialize state
if (!fs.existsSync(path.dirname(STATE_FILE))) {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
}
if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastGuid: '', isAutoOn: false }));
}

// Function to fetch and post
async function fetchAndPostNews(sock, isManual = false, from = null) {
    try {
        const feed = await parser.parseURL('https://lapi.kumparan.com/v2.0/rss/');
        if (!feed.items || feed.items.length === 0) return false;

        const latest = feed.items[0];
        
        // Baca state
        let state = { lastGuid: '', isAutoOn: false };
        try { state = JSON.parse(fs.readFileSync(STATE_FILE)); } catch(e){}

        if (!isManual && state.lastGuid === latest.guid) {
            return false; // Berita masih sama (belum ada yang baru)
        }

        // Tentukan target pengiriman
        const channelId = process.env.NEWS_CHANNEL_ID;
        const target = isManual ? (from || channelId) : channelId;

        if (!target) {
            console.log('[CHNEWS] NEWS_CHANNEL_ID belum diset di .env');
            return false;
        }

        // Ekstrak gambar: prioritaskan enclosure, lalu dari dalam content:encoded
        let imageUrl = latest.enclosure?.url;
        const encodedContent = latest.contentEncoded || latest['content:encoded'] || latest.content || '';
        if (!imageUrl && encodedContent) {
            const imgMatch = encodedContent.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) imageUrl = imgMatch[1];
        }

        // Naikan resolusi gambar dari w_480 (default Kumparan) ke w_1080 (HD)
        if (imageUrl) {
            // Jika URL berupa path relatif (contoh: /v1634.../xxx.jpg), tambahkan base URL
            if (imageUrl.startsWith('/')) {
                imageUrl = `https://blue.kumparan.com/image/upload/fl_progressive,fl_lossy,c_fill,q_auto:best,w_1080,f_jpg${imageUrl}`;
            } else {
                imageUrl = imageUrl.replace(/w_\d+/g, 'w_1080');
            }
            console.log('[CHNEWS] Image URL (HD):', imageUrl);
        } else {
            console.log('[CHNEWS] Tidak ada gambar ditemukan untuk berita ini.');
        }

        // Ambil isi berita lengkap dari content:encoded, bersihkan dari tag HTML
        const cheerio = require('cheerio');
        const $ = cheerio.load(encodedContent);
        let paragraphs = [];
        $('p').each((i, el) => {
            let pText = $(el).text().trim();
            if (pText) paragraphs.push(pText);
        });
        const fullText = paragraphs.join('\n\n');

        // Siapkan pesan: 1 gambar + caption (judul + isi berita) — TANPA link/sumber
        const caption = `📰 *${latest.title}*\n\n${fullText || latest.contentSnippet || 'Tidak ada deskripsi'}`;

        let sendOptions = { text: caption };
        if (imageUrl) {
            try {
                // Download gambar ke buffer dulu agar Baileys tidak error "file bermasalah"
                const fetch = require('node-fetch');
                const imgRes = await fetch(imageUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' }
                });
                if (imgRes.ok) {
                    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
                    console.log('[CHNEWS] Gambar berhasil didownload, mengunggah ke server uploader...');
                    
                    const { uploader } = require('../../lib/uploader');
                    const uploadedUrl = await uploader(imgBuffer);
                    
                    if (uploadedUrl && uploadedUrl.startsWith('http')) {
                        sendOptions = { 
                            image: { url: uploadedUrl }, 
                            caption: caption
                        };
                        console.log('[CHNEWS] Gambar berhasil diunggah via uploader:', uploadedUrl);
                    } else {
                        console.log('[CHNEWS] Gagal upload ke server uploader, fallback ke buffer langsung.');
                        sendOptions = { 
                            image: imgBuffer, 
                            caption: caption
                        };
                    }
                } else {
                    console.log('[CHNEWS] Gagal unduh gambar, status:', imgRes.status, '— kirim teks saja');
                }
            } catch (imgErr) {
                console.log('[CHNEWS] Error unduh gambar:', imgErr.message, '— kirim teks saja');
            }
        }

        // Kirim
        await sock.sendMessage(target, sendOptions);

        // Jika otomatis (atau manual ke channel), update database agar tidak terkirim dua kali di sesi berikutnya
        if (!isManual || target === channelId) {
            state.lastGuid = latest.guid;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        }

        return true;
    } catch (e) {
        console.error('[CHNEWS] Fetch Error:', e);
        return false;
    }
}

// Global Background Worker untuk Auto-Poster
// Mencegah double interval saat live reload
if (global.newsInterval) clearInterval(global.newsInterval);

// Cek saat startup: kalau sebelum restart auto ON, langsung lanjut kirim
// (diberi delay 15 detik agar bot sempat connect dulu)
const startupState = (() => {
    try { return JSON.parse(fs.readFileSync(STATE_FILE)); } catch(e) { return { isAutoOn: false }; }
})();
if (startupState.isAutoOn) {
    console.log('[CHNEWS] Auto-mode masih aktif, melanjutkan setelah bot connect...');
    setTimeout(async () => {
        // Tunggu sampai sock tersedia (max 30 detik)
        let tries = 0;
        const waitSock = setInterval(async () => {
            tries++;
            if (global.sock) {
                clearInterval(waitSock);
                console.log('[CHNEWS] Bot terdeteksi online, langsung cek berita...');
                await fetchAndPostNews(global.sock, false);
            } else if (tries > 30) {
                clearInterval(waitSock);
                console.log('[CHNEWS] Timeout menunggu bot connect.');
            }
        }, 1000);
    }, 5000); // Tunggu 5 detik dulu sebelum mulai polling sock
}

// Polling setiap 10 Menit (600000 ms)
global.newsInterval = setInterval(async () => {
    if (!global.sock) return; // Tunggu bot konek dulu

    let state = { isAutoOn: false };
    try { state = JSON.parse(fs.readFileSync(STATE_FILE)); } catch(e){}

    if (state.isAutoOn) {
        await fetchAndPostNews(global.sock, false);
    }
}, 600000); 

module.exports = {
    command: ['chnews', 'news'],
    category: ['tools'],
    description: 'Auto-Poster berita Kumparan ke Saluran WA',
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.chat;
        const action = args[0]?.toLowerCase();

        let state = { lastGuid: '', isAutoOn: false };
        try { state = JSON.parse(fs.readFileSync(STATE_FILE)); } catch(e){}

        // Handle arguments
        if (action === 'nyala') {
            state.isAutoOn = true;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
            return sock.sendMessage(from, { text: '✅ *Auto-Poster Berita Kumparan* berhasil dinyalakan!\n\n_Bot akan memeriksa berita baru setiap 10 menit dan mengirimkannya ke Saluran otomatis._' }, { quoted: m });
        } else if (action === 'mati') {
            state.isAutoOn = false;
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
            return sock.sendMessage(from, { text: '❌ *Auto-Poster Berita Kumparan* berhasil dimatikan!' }, { quoted: m });
        } else if (action === 'manual') {
            await sock.sendMessage(from, { text: '⏳ Sedang mengambil berita terbaru dan mengirimnya ke Saluran...' }, { quoted: m });
            const success = await fetchAndPostNews(sock, true, process.env.NEWS_CHANNEL_ID);
            if (success) {
                return sock.sendMessage(from, { text: '✅ Berita terbaru berhasil dikirim secara manual ke Saluran WA!' }, { quoted: m });
            } else {
                return sock.sendMessage(from, { text: '❌ Gagal mengirim. Cek apakah NEWS_CHANNEL_ID di .env sudah benar, atau mungkin ini berita yang sama dengan yang terakhir dikirim.' }, { quoted: m });
            }
        }

        // Tampilkan Interactive Buttons
        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🟢 Nyalakan Otomatis",
                    id: `${prefix + command} nyala`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🔴 Matikan Otomatis",
                    id: `${prefix + command} mati`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "📤 Kirim Manual (Sekarang)",
                    id: `${prefix + command} manual`
                })
            }
        ];

        const msg = generateWAMessageFromContent(from, {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({
                            text: `📰 *KUMPARAN RSS TO CHANNEL*\n\nTarget Saluran: \`${process.env.NEWS_CHANNEL_ID || 'Belum di-set di .env'}\`\n\nPilih mode operasional bot berita di bawah ini:`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.create({
                            text: `Status Auto saat ini: ${state.isAutoOn ? 'Nyala 🟢' : 'Mati 🔴'}`
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: "Settings Channel News",
                            subtitle: "Mie AI",
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: buttons
                        })
                    })
                }
            }
        }, { quoted: m });

        await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
    }
};
