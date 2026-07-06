/**
 * TESTBTN4 — AIRich Advanced Mix Lab
 *
 * Koleksi lengkap kombinasi AIRich + manipulasi pesan WA:
 *  1.  AIRich + Fake Reply teks biasa
 *  2.  AIRich + Fake Reply Produk Toko
 *  3.  AIRich + Business Badge Forward
 *  4.  AIRich setTitle + addText markdown lanjutan (heading, bold, link, quote, separator)
 *  5.  AIRich 5 gambar berurutan (image gallery via addImage berulang)
 *  6.  AIRich + addProduct single dengan fake-reply kontak
 *  7.  AIRich + addProduct 4 banner horizontal (max scroll)
 *  8.  AIRich addTable multi-tabel dalam 1 pesan
 *  9.  AIRich addCode multi-bahasa (js, python, bash)
 * 10.  AIRich full mix + contextInfo newsletter label
 * 11.  AIRich + Fake Reply pembayaran WA Pay
 * 12.  AIRich + addText style "laporan status bot"
 * 13.  AIRich + Fake Reply pesan troli belanja
 * 14.  AIRich addProduct 2 banner + addTable info harga
 * 15.  AIRich + addTip multi-tip berantai
 */

const {
    proto,
    generateWAMessageFromContent,
    generateWAMessage,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));

const getBuffer = async (url) => {
    try {
        const res = await axios({ method: 'get', url, responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(res.data);
    } catch (e) { return null; }
};

// ── Konstanta Bot Mie AI ──
const OWNER_NUMBER = '6283809720392';
const NEWSLETTER_JID = '120363424104414634@newsletter';
const NEWSLETTER_NAME = 'Bot Mie AI';

// ── Helper: contextInfo dengan forward badge + label saluran Mie AI ──
const mieCtx = (mentions = []) => ({
    mentionedJid: mentions,
    isForwarded: true,
    forwardingScore: 9999,
    businessMessageForwardInfo: {
        businessOwnerJid: `${OWNER_NUMBER}@s.whatsapp.net`
    },
    forwardedNewsletterMessageInfo: {
        newsletterName: NEWSLETTER_NAME,
        newsletterJid: NEWSLETTER_JID
    }
});

module.exports = {
    command: ['testbtn4', 'tb4'],
    isOwner: true,
    handler: async (sock, m, { prefix }) => {
        const from = m.chat;
        const sender = m.sender;
        const botJid = sock.user.id;
        const MB = require('baileys-mbuilder');
        const botName = global.botName || 'Mie AI';
        const ownerWa = `wa.me/${OWNER_NUMBER}`;

        // ── Gambar dummy (picsum stable seeds) ──
        const IMG = [
            'https://picsum.photos/seed/mieai_a/800/400',
            'https://picsum.photos/seed/mieai_b/800/400',
            'https://picsum.photos/seed/mieai_c/800/400',
            'https://picsum.photos/seed/mieai_d/400/400',
            'https://picsum.photos/seed/mieai_e/400/400',
            'https://picsum.photos/seed/mieai_f/400/400',
            'https://picsum.photos/seed/mieai_g/400/400',
        ];

        await sock.sendMessage(from, {
            text: `🧪 *TESTBTN4 — AIRich Advanced Mix Lab*\n\n_Menampilkan 15 kombinasi unik AIRich yang di-mix dengan fake reply, manipulasi pesan, forward badge, newsletter label, dan berbagai trik lainnya..._\n\n⏳ Setiap test dijalankan dengan jeda otomatis.`,
            contextInfo: mieCtx([sender])
        }, { quoted: m });
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 1: AIRich + Fake Reply TEKS BIASA
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣ *AIRich + Fake Reply Teks*\n_AIRich dikirim seolah membalas pesan teks dari status broadcast_' });
            await delay(600);

            const fakeReplyTeks = {
                key: { remoteJid: 'status@broadcast', participant: `${OWNER_NUMBER}@s.whatsapp.net` },
                message: { extendedTextMessage: { text: `📢 Pengumuman penting dari ${botName}!` } }
            };

            await new MB.AIRich(sock)
                .setTitle(`📣 ${botName} — Pengumuman`)
                .addTip('Pesan ini dikirim sebagai balasan dari status broadcast!')
                .addText(`
# 📢 Pengumuman Resmi

Halo semua! Bot **${botName}** kini hadir dengan fitur terbaru.

## ✨ Fitur Baru:
- AIRich Message System
- Fake Reply yang canggih
- Manipulasi pesan WA
- Dan masih banyak lagi!

> Gunakan dengan bijak dan bertanggung jawab.
                `)
                .addSuggest([`#${botName}`, '#Pengumuman', '#Update'])
                .send(from, { quoted: fakeReplyTeks, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test1]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 1 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 2: AIRich + Fake Reply PRODUK TOKO
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣ *AIRich + Fake Reply Produk Toko*\n_AIRich muncul seolah membalas produk dari WA Business_' });
            await delay(600);

            const fakeReplyProduk = {
                key: { fromMe: false, participant: `${OWNER_NUMBER}@s.whatsapp.net`, remoteJid: 'status@broadcast' },
                message: {
                    productMessage: {
                        product: {
                            productImage: { mimetype: 'image/jpeg', jpegThumbnail: '' },
                            title: `Produk ${botName} Premium`,
                            description: 'Script bot WhatsApp canggih',
                            currencyCode: 'IDR',
                            priceAmount1000: '150000000',
                            retailerId: `owner: ${OWNER_NUMBER}`,
                            productImageCount: 1
                        },
                        businessOwnerJid: `${OWNER_NUMBER}@s.whatsapp.net`
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('🛒 Info Produk Bot')
                .addTip('AIRich ini muncul sebagai balasan dari pesan produk WA Business!')
                .addTable([
                    ['Info', 'Detail'],
                    ['Produk', `${botName} Premium`],
                    ['Harga', 'Rp 150.000'],
                    ['Fitur', 'Lengkap + Update'],
                    ['Support', '24 Jam'],
                    ['Garansi', '30 Hari'],
                ])
                .addProduct({
                    title: `${botName} — Script Premium`,
                    brand: 'Mie AI Dev',
                    price: 'Diskon!',
                    sale_price: '150000',
                    image: IMG[0],
                    url: `https://${ownerWa}`
                })
                .addSuggest(['#Order', '#BeliSekarang', `#${botName}`])
                .send(from, { quoted: fakeReplyProduk, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test2]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 2 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 3: AIRich + Business Badge + Newsletter Label
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '3️⃣ *AIRich + Business Badge + Label Saluran*\n_Pesan terlihat diteruskan dari saluran resmi WA Business_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`🏢 ${botName} Official`)
                .addTip('Pesan ini memiliki badge "Diteruskan" + label nama saluran!')
                .addText(`
# 🏢 Pesan Resmi Bot

Ini adalah pesan yang terlihat seperti **diteruskan** dari akun WA Business resmi.

Perhatikan label di atas pesan:
- ✅ Badge "Diteruskan dari saluran"
- ✅ Nama saluran: **${NEWSLETTER_NAME}**
- ✅ Tanda bisnis terverifikasi

=={ Teknik: businessMessageForwardInfo + forwardedNewsletterMessageInfo }==
                `)
                .addSuggest([`#${botName}`, '#Official', '#Verified'])
                .send(from, {
                    contextInfo: mieCtx([sender]),
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test3]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 3 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 4: AIRich addText MARKDOWN LANJUTAN
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '4️⃣ *AIRich addText — Markdown Lanjutan*\n_Demo semua format teks yang didukung AIRich_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle('📝 Markdown Demo Lengkap')
                .addTip('addText() mendukung markdown WA dan format AIRich khusus!')
                .addText(`
# Heading H1 — Judul Besar
## Heading H2 — Sub Judul
### Heading H3 — Sub Sub Judul

---

**Teks Bold** dan *Teks Italic* bisa dikombinasikan

=={ Highlight Box Khusus AIRich }==

> Ini adalah blockquote / kutipan teks

---

## 📋 List Item:
- Item pertama
- Item kedua
- Item ketiga dengan **bold**

## 🔗 Link Interaktif:
[Hubungi Owner](https://${ownerWa})
[${botName}|200|200]<${IMG[3]}>

---

*Powered by ${botName} AIRich System*
                `)
                .addSuggest(['#Markdown', '#Format', '#AIRich'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test4]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 4 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 5: AIRich Gallery — 5 Gambar Berurutan
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '5️⃣ *AIRich Gallery — 5 Gambar Berurutan*\n_addImage() dipanggil 5x dalam 1 chain = gallery scroll vertikal_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`🖼️ Gallery ${botName}`)
                .addTip('Ini adalah 5 gambar berbeda dalam SATU pesan AIRich!')
                .addText('## 📸 Koleksi Gambar\n\nScroll ke bawah untuk melihat semua gambar:')
                .addImage(IMG[0])
                .addText('*Gambar 1* — Tampilan Utama')
                .addImage(IMG[1])
                .addText('*Gambar 2* — Fitur Spesial')
                .addImage(IMG[2])
                .addText('*Gambar 3* — Update Terbaru')
                .addImage(IMG[3])
                .addText('*Gambar 4* — Koleksi Eksklusif')
                .addImage(IMG[4])
                .addText('*Gambar 5* — Bonus Content')
                .addSuggest(['#Gallery', '#Foto', `#${botName}`])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test5]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 5 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 6: AIRich addProduct Single + Fake Reply Kontak
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '6️⃣ *AIRich + Fake Reply Kontak + addProduct*\n_AIRich dengan banner produk muncul sebagai balasan pesan kontak vCard_' });
            await delay(600);

            const fakeReplyKontak = {
                key: { participant: `${OWNER_NUMBER}@s.whatsapp.net`, remoteJid: 'status@broadcast' },
                message: {
                    contactMessage: {
                        displayName: global.ownerName || 'Owner',
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${global.ownerName || 'Owner'};;;\nFN:${global.ownerName || 'Owner'}\nitem1.TEL;waid=${OWNER_NUMBER}:+${OWNER_NUMBER}\nEND:VCARD`
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('👤 Info Owner Bot')
                .addTip('Pesan ini membalas kartu kontak owner!')
                .addText(`
## 📇 Profil Owner

**Nama:** ${global.ownerName || 'Owner'}
**WA:** +${OWNER_NUMBER}
**Bot:** ${botName}

> Hubungi owner untuk informasi lebih lanjut
                `)
                .addProduct({
                    title: `Hubungi ${global.ownerName || 'Owner'}`,
                    brand: `${botName} Support`,
                    price: 'Gratis Konsultasi',
                    sale_price: '0',
                    image: IMG[1],
                    url: `https://${ownerWa}`
                })
                .addSuggest(['#HubungiOwner', '#Support', '#Bantuan'])
                .send(from, { quoted: fakeReplyKontak, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test6]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 6 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 7: AIRich addProduct 4 Banner Horizontal
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '7️⃣ *AIRich addProduct 4 Banner Horizontal*\n_4 banner berbeda dalam 1 pesan = horizontal scroll maksimal_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle('🛍️ Paket Layanan Bot')
                .addTip('Geser kiri-kanan untuk melihat semua paket yang tersedia!')
                .addProduct([
                    {
                        title: '⚡ Paket Starter',
                        brand: `${botName}`,
                        price: 'Mulai dari',
                        sale_price: '30000',
                        image: IMG[0],
                        url: `https://${ownerWa}`
                    },
                    {
                        title: '🔥 Paket Basic',
                        brand: `${botName}`,
                        price: 'Populer!',
                        sale_price: '75000',
                        image: IMG[1],
                        url: `https://${ownerWa}`
                    },
                    {
                        title: '💎 Paket Premium',
                        brand: `${botName}`,
                        price: 'Best Value',
                        sale_price: '150000',
                        image: IMG[2],
                        url: `https://${ownerWa}`
                    },
                    {
                        title: '👑 Paket VIP',
                        brand: `${botName}`,
                        price: 'Eksklusif',
                        sale_price: '300000',
                        image: IMG[3],
                        url: `https://${ownerWa}`
                    }
                ])
                .addSuggest(['#Starter', '#Basic', '#Premium', '#VIP'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test7]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 7 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 8: AIRich Multi-Tabel dalam 1 Pesan
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '8️⃣ *AIRich Multi-Tabel*\n_addTable() dipanggil 4x = 4 tabel berbeda dalam 1 pesan_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`📊 Dashboard ${botName}`)
                .addTip('Laporan lengkap dengan 4 tabel berbeda dalam 1 pesan AIRich!')
                .addText('## 🖥️ Status Sistem')
                .addTable([
                    ['Metric', 'Value', 'Status'],
                    ['Latency', '45ms', '✅ Baik'],
                    ['Uptime', '99.9%', '✅ Stabil'],
                    ['RAM', '256MB', '✅ Normal'],
                    ['CPU', '12%', '✅ Ringan'],
                ])
                .addText('## 👥 Statistik User')
                .addTable([
                    ['Kategori', 'Jumlah'],
                    ['Total User', '1000+'],
                    ['User Aktif', '750'],
                    ['User Premium', '120'],
                    ['User Baru (7 hari)', '45'],
                ])
                .addText('## 📦 Fitur Bot')
                .addTable([
                    ['Kategori', 'Fitur', 'Status'],
                    ['AI', 'Gemini API', '✅ Aktif'],
                    ['Download', 'YouTube/IG/TT', '✅ Aktif'],
                    ['Tools', 'Sticker/OCR', '✅ Aktif'],
                    ['Fun', 'Game/Meme', '✅ Aktif'],
                ])
                .addText('## 💰 Info Harga Sewa Grup')
                .addTable([
                    ['Durasi', 'Harga', 'Bonus'],
                    ['1 Minggu', 'Rp 10.000', '-'],
                    ['1 Bulan', 'Rp 30.000', 'VIP 3 hari'],
                    ['3 Bulan', 'Rp 80.000', 'VIP 1 minggu'],
                    ['1 Tahun', 'Rp 250.000', 'VIP seumur hidup'],
                ])
                .addSuggest(['#Dashboard', '#Status', '#Statistik', '#Harga'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test8]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 8 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 9: AIRich Multi-Bahasa Code Block
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '9️⃣ *AIRich Multi-Bahasa Code Block*\n_addCode() 3x dengan bahasa berbeda: JS, Python, Bash_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle('💻 Code Snippet Collection')
                .addTip('3 code block berbeda dalam 1 pesan AIRich!')
                .addText('## 🟨 JavaScript — Kirim Pesan WA')
                .addCode('javascript', `// Kirim pesan teks dengan Baileys
await sock.sendMessage(chatId, {
    text: 'Halo dari ${botName}!',
    contextInfo: {
        isForwarded: true,
        forwardingScore: 9999
    }
}, { quoted: m });`)
                .addText('## 🐍 Python — Request API')
                .addCode('python', `import requests

# Ambil data dari API bot
response = requests.get(
    'https://api.example.com/bot',
    params={'key': 'API_KEY', 'q': 'query'}
)
data = response.json()
print(f"Result: {data['result']}")`)
                .addText('## 🐚 Bash — Deploy Bot')
                .addCode('bash', `#!/bin/bash
# Deploy ${botName} ke server

echo "🚀 Deploying ${botName}..."
git pull origin main
npm install --legacy-peer-deps
pm2 restart bot
echo "✅ Deploy selesai!"`)
                .addSuggest(['#JavaScript', '#Python', '#Bash', '#Code'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test9]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 9 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 10: AIRich Full Mix + Newsletter Label Saluran
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '🔟 *AIRich Full Mix + Label Saluran*\n_Kombinasi SEMUA method sekaligus dengan badge saluran Mie AI_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`🌟 ${botName} — Full Package`)
                .addTip('Ini adalah pesan AIRich terlengkap dengan label saluran resmi!')
                .addImage(IMG[0])
                .addText(`
# 🤖 ${botName} — Bot Terlengkap

=={ Versi Terbaru }==

**Bot ini dilengkapi dengan:**
- 💬 Auto AI Response
- 📥 Downloader All Platform
- 🎮 Game Interaktif
- 📊 Sistem Sewa Grup
- 🔐 Sistem Premium User

> *"Bot terbaik adalah bot yang selalu diperbarui"*

[Info Lengkap](https://${ownerWa})
                `)
                .addTable([
                    ['Fitur', 'Keterangan'],
                    ['AIRich', 'Pesan keren anti bosan'],
                    ['Fake Reply', '8+ jenis manipulasi'],
                    ['Album Foto', 'Grid foto dalam 1 pesan'],
                    ['Carousel', 'Kartu geser interaktif'],
                    ['Native Flow', 'Tombol canggih WA'],
                ])
                .addProduct([
                    {
                        title: `${botName} Basic`,
                        brand: 'Mie AI',
                        price: 'Terjangkau',
                        sale_price: '50000',
                        image: IMG[1],
                        url: `https://${ownerWa}`
                    },
                    {
                        title: `${botName} Premium`,
                        brand: 'Mie AI',
                        price: 'Terbaik!',
                        sale_price: '150000',
                        image: IMG[2],
                        url: `https://${ownerWa}`
                    }
                ])
                .addCode('javascript', `// ${botName} — AIRich Full Example
const MB = require('baileys-mbuilder');
await new MB.AIRich(sock)
    .setTitle('Judul')
    .addTip('Info penting')
    .addImage('https://img.url/photo.jpg')
    .addText('# Heading\\n**Bold** *Italic*')
    .addTable([['A','B'],['1','2']])
    .addProduct({ title:'Produk', price:'0', image:'url' })
    .addCode('js', 'console.log("Hello!")')
    .addSuggest(['#tag1', '#tag2'])
    .send(chatId, { forwarded: true, contextInfo: ctx });`)
                .addSuggest([`#${botName}`, '#FullPackage', '#AIRich', '#Terlengkap'])
                .send(from, {
                    contextInfo: mieCtx([sender]),
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test10]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 10 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 11: AIRich + Fake Reply WA Pay (Pembayaran)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣1️⃣ *AIRich + Fake Reply WA Pay*\n_AIRich muncul seolah membalas tagihan pembayaran_' });
            await delay(600);

            const fakeReplyPayment = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'pay_' + Date.now(), participant: '0@s.whatsapp.net' },
                message: {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'IDR',
                        amount1000: 75000000,
                        requestFrom: '0@s.whatsapp.net',
                        noteMessage: { extendedTextMessage: { text: `Pembayaran ${botName} Premium` } },
                        expiryTimestamp: 9999999999,
                        amount: { value: 75000, offset: 1000, currencyCode: 'IDR' }
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('💸 Konfirmasi Pembayaran')
                .addTip('AIRich ini muncul sebagai balasan tagihan WA Pay!')
                .addTable([
                    ['Detail', 'Info'],
                    ['Item', `${botName} Premium`],
                    ['Harga', 'Rp 75.000'],
                    ['Status', '⏳ Menunggu'],
                    ['Metode', 'WA Pay / Transfer'],
                    ['Rekening', `BCA - ${OWNER_NUMBER}`],
                ])
                .addText(`
## 📋 Cara Bayar:
1. Transfer ke rekening owner
2. Kirim bukti bayar ke WA
3. Bot langsung aktif otomatis

[Chat Owner](https://${ownerWa})
                `)
                .addSuggest(['#Bayar', '#Konfirmasi', '#Premium'])
                .send(from, { quoted: fakeReplyPayment, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test11]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 11 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 12: AIRich Style "Laporan Status Bot"
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣2️⃣ *AIRich Style Laporan Status Bot*\n_addText dengan format laporan teknis yang terstruktur rapi_' });
            await delay(600);

            const uptime = process.uptime();
            const uptimeStr = `${Math.floor(uptime / 3600)}j ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}d`;
            const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
            const memTotal = Math.round(process.memoryUsage().heapTotal / 1024 / 1024);
            const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

            await new MB.AIRich(sock)
                .setTitle(`📡 Status ${botName}`)
                .addTip('Laporan real-time kondisi bot saat ini!')
                .addText(`
# 🖥️ System Report

=={ ${now} }==

## ⚡ Performance:
- **Uptime:** ${uptimeStr}
- **RAM Used:** ${memUsed} MB / ${memTotal} MB
- **Node.js:** ${process.version}
- **Platform:** ${process.platform}

## 🌐 Koneksi:
- **WA Status:** 🟢 Online
- **Supabase:** 🟢 Terhubung
- **API Gemini:** 🟢 Aktif

## 📊 Session Info:
- **Bot JID:** ${botJid.split(':')[0]}@s.whatsapp.net
- **Mode:** Public

---

*Generated by ${botName} AIRich System*
                `)
                .addTable([
                    ['Komponen', 'Status', 'Latency'],
                    ['WhatsApp', '🟢 Online', '< 50ms'],
                    ['Database', '🟢 Sync', '< 100ms'],
                    ['AI Engine', '🟢 Ready', '< 2s'],
                    ['Downloader', '🟢 Ready', '< 5s'],
                ])
                .addSuggest(['#Status', '#Uptime', '#Online', `#${botName}`])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test12]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 12 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 13: AIRich + Fake Reply Troli Belanja
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣3️⃣ *AIRich + Fake Reply Troli Belanja*\n_AIRich muncul seolah membalas orderan dari WA Business_' });
            await delay(600);

            const fakeReplyTroli = {
                key: { fromMe: false, participant: sender, remoteJid: 'status@broadcast' },
                message: {
                    orderMessage: {
                        itemCount: 3,
                        status: 1,
                        surface: 1,
                        message: `Order ${botName} Premium`,
                        orderTitle: `Toko ${botName}`,
                        sellerJid: `${OWNER_NUMBER}@s.whatsapp.net`,
                        thumbnail: Buffer.alloc(100),
                        token: 'ORDER-' + Date.now()
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('🛒 Detail Pesanan')
                .addTip('AIRich ini membalas pesan troli belanja WA Business!')
                .addText(`
# 📦 Rincian Order

**Order ID:** ORD-${Date.now().toString().slice(-8)}
**Status:** ⏳ Diproses

## 🛍️ Item Pesanan:
- Bot Premium x1 — Rp 150.000
- Extra Plugin x2 — Rp 50.000
- Support 1 Bulan x1 — Gratis

---

**Total:** Rp 200.000
                `)
                .addTable([
                    ['Item', 'Qty', 'Harga'],
                    ['Bot Premium', '1', 'Rp 150.000'],
                    ['Extra Plugin', '2', 'Rp 25.000'],
                    ['Support', '1', 'Gratis'],
                    ['TOTAL', '', 'Rp 200.000'],
                ])
                .addSuggest(['#OrderConfirm', '#Bayar', '#TrackOrder'])
                .send(from, { quoted: fakeReplyTroli, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test13]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 13 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 14: AIRich 2 Banner + Tabel Harga + Gambar
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣4️⃣ *AIRich 2 Banner + Tabel Harga + Gambar*\n_Kombinasi visual: gambar header + tabel + 2 banner produk_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`🏪 Toko ${botName}`)
                .addTip('Kombinasi visual lengkap: gambar + tabel + banner scroll!')
                .addImage(IMG[0])
                .addText(`## 💰 Daftar Harga Resmi\n\nSemua paket sudah termasuk support dan update gratis:`)
                .addTable([
                    ['Paket', 'Durasi', 'Harga', 'Bonus'],
                    ['Basic', '1 Bulan', 'Rp 30K', '-'],
                    ['Standard', '3 Bulan', 'Rp 75K', '+Plugin'],
                    ['Premium', '6 Bulan', 'Rp 130K', '+VIP'],
                    ['Ultimate', '1 Tahun', 'Rp 200K', '+Semua'],
                ])
                .addText('## 🎯 Pilih Paket Favoritmu:')
                .addProduct([
                    {
                        title: `${botName} Standard`,
                        brand: 'Mie AI',
                        price: '3 Bulan',
                        sale_price: '75000',
                        image: IMG[4],
                        url: `https://${ownerWa}`
                    },
                    {
                        title: `${botName} Ultimate`,
                        brand: 'Mie AI',
                        price: '1 Tahun',
                        sale_price: '200000',
                        image: IMG[5],
                        url: `https://${ownerWa}`
                    }
                ])
                .addSuggest(['#BeliBot', '#Standard', '#Ultimate', '#Harga'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test14]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 14 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 15: AIRich Multi-Tip Berantai + Fake Reply Live Lokasi + Badge Saluran
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣5️⃣ *AIRich Multi-Tip + Fake Reply Live Lokasi + Badge Saluran*\n_Kombinasi paling unik: addTip 3x + fake reply live lokasi + label newsletter_' });
            await delay(600);

            const fakeReplyLiveLoc = {
                key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    liveLocationMessage: {
                        caption: `📍 Lokasi ${botName} Server`,
                        jpegThumbnail: ''
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('🗺️ Info Lokasi & Tips Bot')
                .addTip('💡 Tip 1: Gunakan AIRich untuk pesan yang lebih informatif dan menarik!')
                .addImage(IMG[6])
                .addTip('⚡ Tip 2: Kombinasikan dengan fake reply untuk efek yang lebih dramatis!')
                .addText(`
## 📍 Tentang ${botName}

**Server:** Cloud Hosting (Jakarta)
**Zona Waktu:** WIB (UTC+7)
**Bahasa:** Indonesia

=={ Bot ini dikelola penuh oleh owner }==

[Kontak Owner](https://${ownerWa})
                `)
                .addTip(`🔐 Tip 3: Semua fitur bot ini hanya untuk owner. Gunakan ${global.prefix || '.'}help untuk daftar perintah!`)
                .addTable([
                    ['Info Server', 'Detail'],
                    ['Lokasi', 'Indonesia 🇮🇩'],
                    ['Provider', 'Pterodactyl Panel'],
                    ['Node.js', process.version],
                    ['Uptime', `${Math.floor(process.uptime() / 60)} menit`],
                ])
                .addSuggest([`#${botName}`, '#Tips', '#LiveLocation', '#Canggih'])
                .send(from, {
                    quoted: fakeReplyLiveLoc,
                    contextInfo: mieCtx([sender]),
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test15]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 15 error: ${e.message}` });
        }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 16: AIRich + externalAdReply (Tampilan Iklan/Link Preview Palsu)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣6️⃣ *AIRich + externalAdReply*\n_AIRich dikombinasikan dengan link preview palsu seperti iklan_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle(`📢 ${botName} — Iklan Palsu`)
                .addTip('Pesan ini memiliki preview link seperti iklan/berita!')
                .addText(`
## 📰 Berita Terbaru

Bot **${botName}** kini hadir dengan teknologi AIRich terbaru yang memungkinkan:

- Pesan dengan preview iklan
- Thumbnail gambar kustom
- Judul dan deskripsi palsu
- Link yang bisa diklik

> Teknik: externalAdReply di dalam contextInfo
                `)
                .addSuggest([`#${botName}`, '#Iklan', '#LinkPreview'])
                .send(from, {
                    contextInfo: {
                        ...mieCtx([sender]),
                        externalAdReply: {
                            title: `${botName} — Bot WA Terlengkap`,
                            body: 'Klik untuk info lebih lanjut!',
                            thumbnailUrl: IMG[0],
                            sourceUrl: `https://wa.me/${OWNER_NUMBER}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    },
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test16]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 16 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 17: AIRich + Fake Reply dari BOT SENDIRI (fromMe)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣7️⃣ *AIRich + Fake Reply dari Bot Sendiri*\n_AIRich muncul seolah membalas pesan bot sendiri (fromMe: true)_' });
            await delay(600);

            const fakeReplyFromMe = {
                key: { remoteJid: from, fromMe: true, id: 'BOTMSG_' + Date.now() },
                message: {
                    extendedTextMessage: {
                        text: `🤖 Pesan otomatis dari ${botName}:\n_Sedang memproses permintaan kamu..._`
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('🔄 Bot Membalas Diri Sendiri')
                .addTip('AIRich ini terlihat membalas pesan yang dikirim bot sendiri!')
                .addText(`
## 🤖 Alur Respon Otomatis

Ini simulasi bot membalas pesannya sendiri:

1. Bot kirim pesan pertama
2. Bot otomatis follow-up dengan AIRich
3. Terlihat seperti percakapan bot ↔ bot

> Berguna untuk fitur auto-reminder atau notifikasi follow-up
                `)
                .addTable([
                    ['Jenis', 'fromMe', 'Efek'],
                    ['Normal Reply', 'false', 'Balas pesan user'],
                    ['Self Reply', 'true', 'Balas pesan bot sendiri'],
                    ['Broadcast', '-', 'Dari status@broadcast'],
                ])
                .addSuggest(['#BotReply', '#AutoMessage', '#SelfReply'])
                .send(from, { quoted: fakeReplyFromMe, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test17]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 17 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 18: AIRich + Carousel Interaktif (viewOnceMessageV2Extension)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣8️⃣ *AIRich + Carousel Interaktif*\n_Dua pesan berbeda: AIRich dulu, lalu Carousel dengan button_' });
            await delay(600);

            // Kirim AIRich dulu sebagai intro
            await new MB.AIRich(sock)
                .setTitle('🎠 Intro Carousel')
                .addTip('Setelah pesan ini, akan ada carousel interaktif dengan button!')
                .addText(`
## 🎴 Apa itu Carousel?

Carousel adalah pesan dengan **beberapa kartu** yang bisa digeser.

Setiap kartu bisa punya:
- Gambar header
- Teks body
- Footer info
- Button interaktif

> Carousel di bawah ini adalah DEMO dari fitur ini!
                `)
                .addSuggest(['#Carousel', '#Swipe', '#Interaktif'])
                .send(from, { forwarded: true });

            await delay(1500);

            // Lalu kirim carousel
            let uploadedImg = null;
            try {
                uploadedImg = await prepareWAMessageMedia(
                    { image: { url: IMG[0] } },
                    { upload: sock.waUploadToServer }
                ).catch(() => null);
            } catch (e) {}

            const carouselMsg = await generateWAMessageFromContent(from, {
                viewOnceMessageV2Extension: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: `🎠 *${botName} Carousel Demo*\nGeser kiri-kanan untuk melihat semua kartu!`
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards: [
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({
                                            title: `🤖 ${botName} — Fitur AI`,
                                            hasMediaAttachment: uploadedImg ? true : false,
                                            ...(uploadedImg ? uploadedImg : {})
                                        }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({ text: 'Bot ini dilengkapi AI Gemini yang bisa menjawab pertanyaan apapun!' }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: botName }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤖 Coba AI', id: `${prefix || '.'}ai halo` }) }]
                                        })
                                    },
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({ title: '📥 Fitur Download', hasMediaAttachment: false }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({ text: 'Download video dari YouTube, Instagram, TikTok, Twitter dalam sekejap!' }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: botName }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [
                                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📥 Coba Download', id: `${prefix || '.'}ytmp3` }) },
                                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Info', url: `https://wa.me/${OWNER_NUMBER}` }) }
                                            ]
                                        })
                                    },
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({ title: '👑 Paket Premium', hasMediaAttachment: false }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({ text: 'Dapatkan akses premium dengan fitur unlimited dan support prioritas!' }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: botName }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [
                                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '💎 Beli Premium', url: `https://wa.me/${OWNER_NUMBER}` }) },
                                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Salin No. Owner', id: 'cp_owner', copy_code: OWNER_NUMBER }) }
                                            ]
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });

            await sock.relayMessage(from, carouselMsg.message, { messageId: carouselMsg.key.id });
        } catch (e) {
            console.error('[TB4 Test18]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 18 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 19: AIRich + Fake Reply LOKASI MAP
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣9️⃣ *AIRich + Fake Reply Lokasi Map*\n_AIRich muncul seolah membalas pin lokasi_' });
            await delay(600);

            const fakeReplyLokasi = {
                key: { participant: `${OWNER_NUMBER}@s.whatsapp.net`, remoteJid: 'status@broadcast' },
                message: {
                    locationMessage: {
                        degreesLatitude: -6.2088,
                        degreesLongitude: 106.8456,
                        name: `Server ${botName}`,
                        address: 'Jakarta, Indonesia',
                        jpegThumbnail: ''
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('📍 Info Lokasi Server')
                .addTip('AIRich ini membalas pin lokasi dari peta!')
                .addText(`
## 🗺️ Detail Lokasi Server

**Nama:** Server ${botName}
**Koordinat:** -6.2088, 106.8456
**Kota:** Jakarta, Indonesia
**Zona Waktu:** WIB (UTC+7)

---

Server bot berjalan **24/7** tanpa henti di data center Jakarta untuk memastikan uptime terbaik buat semua pengguna.
                `)
                .addTable([
                    ['Lokasi', 'Detail'],
                    ['Negara', '🇮🇩 Indonesia'],
                    ['Kota', 'Jakarta'],
                    ['Lintang', '-6.2088°'],
                    ['Bujur', '106.8456°'],
                    ['ISP', 'Cloud Hosting'],
                ])
                .addSuggest(['#Server', '#Jakarta', '#Lokasi'])
                .send(from, { quoted: fakeReplyLokasi, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test19]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 19 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 20: AIRich + forwardingScore Ekstrem + Mention User
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣0️⃣ *AIRich + forwardingScore 9999 + Mention User*\n_Pesan terlihat sudah diteruskan ribuan kali + user di-mention_' });
            await delay(600);

            await new MB.AIRich(sock)
                .setTitle('🔁 Viral Message Simulation')
                .addTip(`Hei @${sender.split('@')[0]}! Kamu di-mention dalam pesan ini!`)
                .addText(`
## 🔥 Pesan Viral

Pesan ini terlihat sudah **diteruskan 9999x** oleh ribuan orang!

Teknik ini bisa dipakai untuk:
- Membuat pesan terkesan viral
- Simulasi berita/info yang menyebar luas
- Combine dengan label saluran resmi

> @${sender.split('@')[0]} — kamu adalah orang ke-9999 yang menerima ini!
                `)
                .addTable([
                    ['Manipulasi', 'Nilai', 'Efek Visual'],
                    ['isForwarded', 'true', 'Label "Diteruskan"'],
                    ['forwardingScore', '9999', 'Badge ribuan kali'],
                    ['mentionedJid', sender, 'User di-mention'],
                    ['newsletterName', NEWSLETTER_NAME, 'Label saluran'],
                ])
                .addSuggest(['#Viral', '#Forwarded', `@${sender.split('@')[0]}`])
                .send(from, {
                    contextInfo: {
                        mentionedJid: [sender],
                        isForwarded: true,
                        forwardingScore: 9999,
                        businessMessageForwardInfo: { businessOwnerJid: `${OWNER_NUMBER}@s.whatsapp.net` },
                        forwardedNewsletterMessageInfo: { newsletterName: NEWSLETTER_NAME, newsletterJid: NEWSLETTER_JID }
                    },
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test20]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 20 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 21: AIRich + Dokumen Palsu (JSON disamarkan jadi PDF)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣1️⃣ *AIRich + Dokumen Palsu sebelumnya*\n_AIRich dikirim SETELAH dokumen palsu sebagai penjelasan teknis_' });
            await delay(600);

            // Kirim dokumen palsu dulu
            let thumbBuf;
            try {
                const ppBotUrl = await sock.profilePictureUrl(botJid, 'image').catch(() => null);
                if (ppBotUrl) {
                    const raw = await getBuffer(ppBotUrl);
                    if (raw) thumbBuf = raw;
                }
            } catch (e) {}
            if (!thumbBuf) thumbBuf = Buffer.alloc(200);

            await sock.sendMessage(from, {
                document: require('fs').readFileSync(require('path').join(process.cwd(), 'package.json')),
                fileName: `Laporan_${botName}_2026.pdf`,
                mimetype: 'image/png',
                fileLength: 999000000000,
                pageCount: 999,
                headerType: 1,
                viewOnce: true,
                jpegThumbnail: thumbBuf,
                caption: `📄 *Laporan Rahasia ${botName}*\n_File ini berukuran 999 GB dengan 999 halaman_ 🤫`,
                contextInfo: mieCtx([sender])
            }, { quoted: m });

            await delay(1000);

            // Lalu AIRich sebagai penjelasan
            await new MB.AIRich(sock)
                .setTitle('🔍 Bedah Teknik Dokumen Palsu')
                .addTip('Dokumen di atas aslinya cuma file package.json biasa!')
                .addText(`
## 🕵️ Cara Kerja Dokumen Palsu

File JSON sederhana dimanipulasi agar terlihat seperti:
- **PDF** raksasa 999 GB
- Punya **999 halaman**
- Preview pakai **foto PP bot**

Kuncinya ada di property yang dimanipulasi:
                `)
                .addCode('javascript', `// Teknik dokumen palsu
await sock.sendMessage(chatId, {
    document: fs.readFileSync('./package.json'), // File asli kecil
    fileName: 'Laporan_Rahasia.pdf',
    mimetype: 'image/png',   // Klaim sebagai PNG!
    fileLength: 999000000000, // 999 GB palsu!
    pageCount: 999,           // 999 halaman palsu!
    jpegThumbnail: thumbBuf,  // Preview gambar custom
    caption: 'Dokumen Penting...'
});`)
                .addSuggest(['#DokumenPalsu', '#Teknik', '#Manipulasi'])
                .send(from, { forwarded: true });
        } catch (e) {
            console.error('[TB4 Test21]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 21 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 22: AIRich + Native Flow Button (All Types)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣2️⃣ *AIRich lalu Native Flow Button Lengkap*\n_AIRich intro + pesan native flow dengan semua jenis button_' });
            await delay(600);

            // AIRich intro dulu
            await new MB.AIRich(sock)
                .setTitle('🔘 Native Flow Button Demo')
                .addTip('Setelah ini ada pesan dengan 6 jenis button native flow WA!')
                .addText(`
## 📋 Jenis Button yang Tersedia:
- **quick_reply** — Tombol balas cepat
- **cta_url** — Buka link/website
- **cta_copy** — Salin teks
- **cta_call** — Telepon langsung
- **send_location** — Kirim lokasi
- **single_select** — Pilihan list menu
                `)
                .addSuggest(['#Button', '#NativeFlow', '#Interaktif'])
                .send(from, { forwarded: true });

            await delay(1000);

            // Native flow message
            const nativeFlowMsg = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: `🔥 *Semua Jenis Button ${botName}*\n\nBerikut semua button yang didukung WA saat ini!`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: botName }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: 'BUTTON COLLECTION', subtitle: botName, hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💬 Quick Reply', id: 'btn_qr' }) },
                                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka Web', url: `https://wa.me/${OWNER_NUMBER}` }) },
                                    { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Salin Nomor', id: 'btn_copy', copy_code: OWNER_NUMBER }) },
                                    { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📞 Hubungi Owner', id: 'btn_call', display_number: `+${OWNER_NUMBER}` }) },
                                    { name: 'send_location', buttonParamsJson: '' },
                                    {
                                        name: 'single_select',
                                        buttonParamsJson: JSON.stringify({
                                            title: '📋 Pilih Menu',
                                            sections: [{
                                                title: 'Kategori Fitur',
                                                rows: [
                                                    { header: 'AI', title: 'Fitur Kecerdasan Buatan', description: 'Gemini, ChatGPT, dll', id: 'menu_ai' },
                                                    { header: 'Download', title: 'Fitur Unduhan', description: 'YT, IG, TT, dll', id: 'menu_dl' },
                                                    { header: 'Tools', title: 'Alat Berguna', description: 'Sticker, OCR, dll', id: 'menu_tools' }
                                                ]
                                            }]
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });

            await sock.relayMessage(from, nativeFlowMsg.message, { messageId: nativeFlowMsg.key.id });
        } catch (e) {
            console.error('[TB4 Test22]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 22 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 23: AIRich + Album Message (Grid Foto)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣3️⃣ *AIRich + Album Message (Grid Foto)*\n_AIRich intro, lalu foto-foto dikirim sebagai album 1 grid_' });
            await delay(600);

            // AIRich intro
            await new MB.AIRich(sock)
                .setTitle(`📸 Album ${botName}`)
                .addTip('Setelah ini 3 foto akan muncul dalam 1 kotak grid album!')
                .addText(`
## 🖼️ Cara Kerja Album Message

Berbeda dari foto biasa yang terlihat **berjejer ke bawah**, Album Message menggabungkan beberapa foto jadi **1 kotak grid** yang rapi.

Teknik: **albumMessage** + **messageAssociation**
                `)
                .addSuggest(['#Album', '#Grid', '#FotoKoleksi'])
                .send(from, { forwarded: true });

            await delay(1000);

            // Album message
            const albumUrls = [IMG[0], IMG[1], IMG[2]];
            const albumMsg = await generateWAMessageFromContent(from, {
                messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                albumMessage: { expectedImageCount: albumUrls.length, expectedVideoCount: 0 }
            }, { userJid: botJid, quoted: m, upload: sock.waUploadToServer });

            await sock.relayMessage(from, albumMsg.message, { messageId: albumMsg.key.id });
            await delay(500);

            for (let i = 0; i < albumUrls.length; i++) {
                try {
                    const imgMsg = await generateWAMessage(from, {
                        image: { url: albumUrls[i] },
                        caption: i === 0 ? `📸 *Album ${botName}*\n(${albumUrls.length} foto dalam 1 grid)\n_Teknik: albumMessage + messageAssociation_` : undefined
                    }, { upload: sock.waUploadToServer });

                    imgMsg.message.messageContextInfo = {
                        messageSecret: crypto.randomBytes(32),
                        messageAssociation: { associationType: 1, parentMessageKey: albumMsg.key }
                    };

                    await sock.relayMessage(from, imgMsg.message, { messageId: imgMsg.key.id });
                    await delay(600);
                } catch (imgErr) {
                    console.error(`[TB4 Album] Error foto ${i}:`, imgErr.message);
                }
            }
        } catch (e) {
            console.error('[TB4 Test23]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 23 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 24: AIRich + Fake Reply dari ID 0 (Sistem WA)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣4️⃣ *AIRich + Fake Reply dari Sistem WA (0@s.whatsapp.net)*\n_AIRich muncul seolah membalas pesan dari sistem resmi WhatsApp_' });
            await delay(600);

            const fakeReplySystem = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'SYS_' + Date.now(), participant: '0@s.whatsapp.net' },
                message: {
                    extendedTextMessage: {
                        text: '🔔 WhatsApp: Akun kamu telah terverifikasi sebagai akun bisnis resmi.',
                        previewType: 0
                    }
                }
            };

            await new MB.AIRich(sock)
                .setTitle('✅ Verifikasi Akun Bisnis')
                .addTip('AIRich ini muncul seolah membalas notifikasi resmi dari WhatsApp!')
                .addText(`
## 🔐 Status Akun

Akun **${botName}** telah berhasil diverifikasi sebagai:
- ✅ Akun Business Terverifikasi
- ✅ Nomor Terdaftar
- ✅ Kebijakan Penggunaan Disetujui

---

Nomor pengirim: **0@s.whatsapp.net**
Ini adalah ID khusus untuk pesan sistem WhatsApp.

> Teknik: fake reply dari '0@s.whatsapp.net'
                `)
                .addSuggest(['#SystemMessage', '#Verified', '#WhatsApp'])
                .send(from, { quoted: fakeReplySystem, forwarded: true });
        } catch (e) {
            console.error('[TB4 Test24]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 24 error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 25: AIRich BERANTAI — 3 Pesan AIRich Berurutan Cepat
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣5️⃣ *AIRich Berantai — 3 Pesan AIRich Cepat*\n_3 pesan AIRich berbeda dikirim berurutan dengan jeda singkat_' });
            await delay(600);

            // AIRich 1: Notifikasi
            await new MB.AIRich(sock)
                .setTitle('🔔 Notifikasi 1/3')
                .addTip('Ini adalah pesan pertama dari 3 AIRich berantai!')
                .addText('**Status:** Pemrosesan dimulai...\n\n> Sistem sedang menyiapkan laporan lengkap kamu.')
                .addSuggest(['#Notifikasi', '#1dari3'])
                .send(from, { forwarded: true });

            await delay(1200);

            // AIRich 2: Progress
            await new MB.AIRich(sock)
                .setTitle('⚙️ Proses 2/3')
                .addTip('Ini adalah pesan kedua — update progress!')
                .addTable([
                    ['Tahap', 'Status'],
                    ['Inisialisasi', '✅ Selesai'],
                    ['Pengambilan Data', '✅ Selesai'],
                    ['Pemrosesan', '⏳ Berjalan...'],
                    ['Finalisasi', '⏸️ Menunggu'],
                ])
                .addSuggest(['#Progress', '#2dari3'])
                .send(from, { forwarded: true });

            await delay(1200);

            // AIRich 3: Hasil akhir
            await new MB.AIRich(sock)
                .setTitle('✅ Selesai 3/3')
                .addTip('Ini adalah pesan ketiga — laporan final!')
                .addImage(IMG[2])
                .addText(`
## 🏁 Laporan Final

Semua proses telah **selesai** dengan sukses!

**Ringkasan:**
- Total test dijalankan: **25 kombinasi**
- Jenis manipulasi: **15+ teknik unik**
- Library: **baileys-mbuilder + Baileys**

*${botName} — Advanced Message Lab selesai!*
                `)
                .addTable([
                    ['Tahap', 'Status'],
                    ['Inisialisasi', '✅ Selesai'],
                    ['Pengambilan Data', '✅ Selesai'],
                    ['Pemrosesan', '✅ Selesai'],
                    ['Finalisasi', '✅ Selesai'],
                ])
                .addSuggest([`#${botName}`, '#3dari3', '#Selesai', '#Done'])
                .send(from, {
                    contextInfo: mieCtx([sender]),
                    forwarded: true
                });
        } catch (e) {
            console.error('[TB4 Test25]', e);
            await sock.sendMessage(from, { text: `⚠️ Test 25 error: ${e.message}` });
        }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // SUMMARY FINAL
        // ════════════════════════════════════════════════════
        await new MB.AIRich(sock)
            .setTitle(`✅ TESTBTN4 Selesai! (25 Test)`)
            .addTip('Semua 25 kombinasi AIRich + manipulasi pesan berhasil dijalankan!')
            .addTable([
                ['No', 'Test', 'Teknik Utama'],
                ['1', 'AIRich + Fake Reply Teks', 'status@broadcast'],
                ['2', 'AIRich + Fake Reply Produk', 'productMessage'],
                ['3', 'AIRich + Business Badge', 'businessMessageForwardInfo'],
                ['4', 'AIRich Markdown Lanjutan', 'addText heading/bold/link'],
                ['5', 'AIRich Gallery 5 Gambar', 'addImage x5'],
                ['6', 'AIRich + Fake Kontak', 'contactMessage'],
                ['7', 'AIRich 4 Banner Scroll', 'addProduct array x4'],
                ['8', 'AIRich Multi-Tabel 4x', 'addTable x4'],
                ['9', 'AIRich Code 3 Bahasa', 'addCode x3'],
                ['10', 'AIRich Full Mix + Label', 'semua method'],
                ['11', 'AIRich + WA Pay', 'requestPaymentMessage'],
                ['12', 'AIRich Laporan Status', 'process.uptime() realtime'],
                ['13', 'AIRich + Troli Belanja', 'orderMessage'],
                ['14', 'AIRich 2 Banner + Harga', 'addProduct x2 + addTable'],
                ['15', 'Multi-Tip + Live Lokasi', 'addTip x3 + newsletter'],
                ['16', 'AIRich + externalAdReply', 'Link preview iklan palsu'],
                ['17', 'AIRich + Fake Reply Bot', 'fromMe: true self-reply'],
                ['18', 'AIRich + Carousel 3 Kartu', 'viewOnceMessageV2Extension'],
                ['19', 'AIRich + Fake Lokasi Map', 'locationMessage'],
                ['20', 'AIRich + Viral + Mention', 'forwardingScore 9999'],
                ['21', 'AIRich + Dokumen Palsu', 'mimetype palsu 999GB'],
                ['22', 'AIRich + Native Flow 6 Btn', 'viewOnceMessage + semua btn'],
                ['23', 'AIRich + Album Grid', 'albumMessage x3 foto'],
                ['24', 'AIRich + Fake Sistem WA', '0@s.whatsapp.net'],
                ['25', 'AIRich Berantai 3x', '3 AIRich berurutan cepat'],
            ])
            .addSuggest([`#${botName}`, '#TESTBTN4', '#AIRich', '#25Test', '#Done'])
            .send(from, {
                contextInfo: mieCtx([sender]),
                forwarded: true
            });
    }
};
