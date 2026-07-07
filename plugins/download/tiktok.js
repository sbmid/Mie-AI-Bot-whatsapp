const axios = require('axios');
const cheerio = require('cheerio');
const { sendMediaSafe } = require('../../lib/helper');

/**
 * Native SSSTik Scraper by Azrial Galih Prasetyo (AL)
 * Bebas API Key, langsung scrape dari sumbernya.
 */
async function scrapeSsstik(url) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    const { data } = await axios.get('https://ssstik.io/id', { headers });
    const $ = cheerio.load(data);
    const hxPost = $('form').attr('hx-post') || $('form').attr('action');
    const tt = $('input[name="tt"]').val() || '';

    const formData = new URLSearchParams();
    formData.append('id', url);
    formData.append('locale', 'id');
    formData.append('tt', tt);

    const postData = await axios.post(`https://ssstik.io${hxPost}`, formData.toString(), {
        headers: {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Hx-Request': 'true',
            'Hx-Target': 'target',
            'Hx-Current-Url': 'https://ssstik.io/id',
            'Origin': 'https://ssstik.io',
            'Referer': 'https://ssstik.io/id'
        }
    });

    const $result = cheerio.load(postData.data);
    
    // Cek error dari ssstik (misal video dihapus/private)
    if ($result('.alert-danger').length > 0) {
        throw new Error($result('.alert-danger').text().trim());
    }

    const videoNoWatermark = $result('a.without_watermark').attr('href');
    const mp3 = $result('a.download_audio').attr('href');
    const desc = $result('.maintext').text().trim();
    
    // Scrape slide foto (SSSTik menaruhnya dalam tag <img> di class slide)
    const slideImages = [];
    $result('img').each((i, el) => {
        const src = $result(el).attr('src');
        if (src && src.includes('tiktokcdn')) {
            slideImages.push(src);
        }
    });

    // Validasi ulang gambar slide (SSSTik struktur bisa berubah)
    const validSlides = slideImages.length > 0 ? slideImages : null;

    return {
        video: videoNoWatermark || null,
        images: validSlides,
        audio: mp3 || null,
        desc: desc || ''
    };
}

module.exports = {
    command: ['tt', 'tiktok', 'ttdl'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.key.remoteJid;
        const url = args[0];

        if (!url) {
            return sock.sendMessage(from, {
                text: ` *Format Salah Kakak Sayang...* \nContoh: *${prefix + command}* https://vt.tiktok.com/xxxx`
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            const data = await scrapeSsstik(url);
            
            if (!data.video && !data.images) {
                throw new Error("Gagal mengambil media. Pastikan link valid dan tidak privat.");
            }

            const caption = `
━ ⟨ *TIKTOK DOWNLOADER* ⟩ ━

> » *Deskripsi*: ${data.desc || 'Tanpa Keterangan'}
`.trim();

            if (data.images && data.images.length > 0 && !data.video) {
                await sock.sendMessage(from, { text: `[i] *TikTok Slide Terdeteksi!*\nMengurutkan ${data.images.length} foto untuk dikirim...` }, { quoted: m });
                
                for (let i = 0; i < data.images.length; i++) {
                    await sendMediaSafe(sock, from, null, data.images[i], 'image', i === 0 ? caption : '', m);
                    await new Promise(r => setTimeout(r, 1500));
                }
            } else if (data.video) {
                await sendMediaSafe(sock, from, null, data.video, 'video', caption, m);
            }

            // Kirim audio jika ada
            if (data.audio) {
                await sendMediaSafe(sock, from, null, data.audio, 'audio', '', m);
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error Native TT DL:", e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });

            sock.sendMessage(from, {
                text: ` *Duh Maaf Kak...* \nGagal scrape SSSTik: ${e.message}`
            }, { quoted: m });
        }
    }
};
