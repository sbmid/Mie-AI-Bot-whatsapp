/**
 * TESTBTN2 — Koleksi Teknik Pesan Canggih dari Hasil Riset Santanuy v13
 * 
 * PENEMUAN YANG DIIMPLEMENTASIKAN:
 * 1. Fake Reply Arsenal (8 jenis: teks, lokasi, live location, payment, produk, kontak, kontak+foto, troli order)
 * 2. Dokumen Palsu (File JSON disamarkan jadi gambar berpreview)
 * 3. businessMessageForwardInfo (Badge Bisnis + Saluran Label)
 * 4. Album Message (Kumpulan foto jadi 1 grid)
 * 5. AIRich dari baileys-mbuilder (Tabel, Code Block, Tip, Suggest)
 * 6. viewOnceMessageV2Extension Carousel
 */

const { proto, generateWAMessageFromContent, generateWAMessage, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const delay = ms => new Promise(r => setTimeout(r, ms));

const getBuffer = async (url) => {
    try {
        const res = await axios({ method: 'get', url, responseType: 'arraybuffer' });
        return Buffer.from(res.data);
    } catch (e) { return null; }
};

// Helper: contextInfo dengan Badge Bisnis & Label Saluran
const businessCtx = (mentions = []) => ({
    mentionedJid: mentions,
    isForwarded: true,
    forwardingScore: 9999,
    businessMessageForwardInfo: {
        businessOwnerJid: global.ownerNumber?.[0] || '6283809720392@s.whatsapp.net'
    },
    forwardedNewsletterMessageInfo: {
        newsletterName: 'Bot Mie AI',
        newsletterJid: '120363424104414634@newsletter'
    }
});

module.exports = {
    command: ['testbtn2', 'tb2'],
    isOwner: true,
    handler: async (sock, m, { prefix }) => {
        const from = m.chat;
        const sender = m.sender;
        const botJid = sock.user.id;

        await sock.sendMessage(from, {
            text: `🧪 *TESTBTN2 — LAB RISET PESAN WA*\n\n_Menampilkan semua teknik canggih yang ditemukan dari hasil riset mendalam..._\n\n⏳ Harap tunggu, setiap test dijalankan dengan jeda 2 detik.`
        }, { quoted: m });
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 1: FAKE REPLY ARSENAL (8 JENIS)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣ *FAKE REPLY ARSENAL* (8 Jenis Object)' });
            await delay(800);

            // 1a. Fake Reply TEKS
            await sock.sendMessage(from, { text: '🔷 [1a] Fake Reply *Teks*' });
            const qtext = {
                key: { remoteJid: 'status@broadcast', participant: '628551000185@s.whatsapp.net' },
                message: { extendedTextMessage: { text: global.botName || 'Mie AI' } }
            };
            await sock.sendMessage(from, { text: '✅ Ini membalas pesan teks dari status siaran!' }, { quoted: qtext });
            await delay(1500);

            // 1b. Fake Reply LOKASI
            await sock.sendMessage(from, { text: '🔷 [1b] Fake Reply *Lokasi Map*' });
            const qloc = {
                key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: { locationMessage: { name: global.botName || 'Mie AI', jpegThumbnail: '' } }
            };
            await sock.sendMessage(from, { text: '📍 Membalas pesan titik lokasi!' }, { quoted: qloc });
            await delay(1500);

            // 1c. Fake Reply LIVE LOCATION
            await sock.sendMessage(from, { text: '🔷 [1c] Fake Reply *Live Location*' });
            const qlive = {
                key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: { liveLocationMessage: { caption: `${global.botName || 'Mie AI'} Live`, jpegThumbnail: '' } }
            };
            await sock.sendMessage(from, { text: '🗺️ Membalas pesan lokasi terkini!' }, { quoted: qlive });
            await delay(1500);

            // 1d. Fake Reply PEMBAYARAN
            await sock.sendMessage(from, { text: '🔷 [1d] Fake Reply *Tagihan Pembayaran (WA Pay)*' });
            const qpayment = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'payrequest001', participant: '0@s.whatsapp.net' },
                message: {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'IDR',
                        amount1000: 50000000,
                        requestFrom: '0@s.whatsapp.net',
                        noteMessage: { extendedTextMessage: { text: global.botName || 'Mie AI' } },
                        expiryTimestamp: 999999999,
                        amount: { value: 50000, offset: 1000, currencyCode: 'IDR' }
                    }
                }
            };
            await sock.sendMessage(from, { text: '💸 Membalas tagihan pembayaran!' }, { quoted: qpayment });
            await delay(1500);

            // 1e. Fake Reply PRODUK TOKO
            await sock.sendMessage(from, { text: '🔷 [1e] Fake Reply *Produk Katalog WA Business*' });
            const qtoko = {
                key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    productMessage: {
                        product: {
                            productImage: { mimetype: 'image/jpeg', jpegThumbnail: '' },
                            title: `${global.botName || 'Mie AI'} Shop`,
                            description: 'Premium Bot',
                            currencyCode: 'IDR',
                            priceAmount1000: '999999999',
                            retailerId: `Powered By ${global.botName || 'Mie AI'}`,
                            productImageCount: 1
                        },
                        businessOwnerJid: '0@s.whatsapp.net'
                    }
                }
            };
            await sock.sendMessage(from, { text: '🛒 Membalas pesan produk toko!' }, { quoted: qtoko });
            await delay(1500);

            // 1f. Fake Reply KONTAK vCard
            await sock.sendMessage(from, { text: '🔷 [1f] Fake Reply *Kartu Kontak (vCard)*' });
            const qkontak = {
                key: { participant: '13135550002@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    contactMessage: {
                        displayName: m.pushName || 'User',
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:AI;Mie;;;\nFN:Mie AI\nitem1.TEL;waid=13135550002:+1 (313) 555-0002\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
                    }
                }
            };
            await sock.sendMessage(from, { text: '📇 Membalas pesan kartu kontak!' }, { quoted: qkontak });
            await delay(1500);

            // 1g. Fake Reply KONTAK dengan FOTO PP user asli
            await sock.sendMessage(from, { text: '🔷 [1g] Fake Reply *Kontak + Foto Profil Asli User*' });
            try {
                let ppUrl = await sock.profilePictureUrl(sender, 'image').catch(_ => null);
                let ppBase64 = '';
                if (ppUrl) {
                    const ppBuff = await getBuffer(ppUrl);
                    if (ppBuff) ppBase64 = ppBuff.toString('base64');
                }
                const qmeta = {
                    key: { participant: '628121214017@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'META_' + Date.now() },
                    message: {
                        contactMessage: {
                            displayName: m.pushName || 'User',
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${m.pushName || 'User'};;;\nFN:${m.pushName || 'User'}${ppBase64 ? '\nPHOTO;ENCODING=b;TYPE=JPEG:' + ppBase64 : ''}\nitem1.TEL;waid=${sender.split('@')[0]}:+${sender.split('@')[0]}\nEND:VCARD`
                        }
                    }
                };
                await sock.sendMessage(from, { text: '🖼️ Fake kontak dengan foto profil aslimu!' }, { quoted: qmeta });
            } catch (e) {
                await sock.sendMessage(from, { text: '⚠️ Gagal ambil foto profil: ' + e.message });
            }
            await delay(1500);

            // 1h. Fake Reply TROLI BELANJA (orderMessage) dengan foto PP
            await sock.sendMessage(from, { text: '🔷 [1h] Fake Reply *Troli Belanja (Order Message) + PP User*' });
            try {
                let ppUrl2 = await sock.profilePictureUrl(sender, 'image').catch(_ => null);
                let ppBuff2 = null;
                if (ppUrl2) ppBuff2 = await getBuffer(ppUrl2);
                if (!ppBuff2) ppBuff2 = Buffer.alloc(100);

                // Resize with Jimp
                const img2 = await Jimp.read(ppBuff2);
                const thumbBuff = await img2.resize(200, 200).getBufferAsync(Jimp.MIME_JPEG);

                const troli = {
                    key: { fromMe: false, participant: sender, remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            itemCount: 42,
                            status: 1,
                            surface: 1,
                            message: `🤖 Bot: ${global.botName || 'Mie AI'}\n⏱️ Uptime: Ready`,
                            orderTitle: global.botName || 'Mie AI',
                            sellerJid: '0@s.whatsapp.net',
                            thumbnail: thumbBuff,
                            token: 'MIEAI-TOKEN-' + Date.now()
                        }
                    }
                };
                await sock.sendMessage(from, { text: '🛒 Fake troli belanja dengan foto profil!' }, { quoted: troli });
            } catch (e) {
                await sock.sendMessage(from, { text: '⚠️ Gagal buat troli: ' + e.message });
            }
        } catch (e) { console.error('[TB2 Test1]', e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 2: DOKUMEN PALSU (JSON disamarkan sebagai gambar)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣ *DOKUMEN PALSU*\n_File JSON biasa disamarkan jadi dokumen bergambar premium!_\n_(fileLength: 999GB, pageCount: 100, mimetype: image/png)_' });
            await delay(800);

            // Ambil gambar thumbnail (foto profil bot / default)
            let thumbBuf;
            try {
                const ppBotUrl = await sock.profilePictureUrl(botJid, 'image').catch(_ => null);
                if (ppBotUrl) {
                    const raw = await getBuffer(ppBotUrl);
                    if (raw) {
                        const jimpImg = await Jimp.read(raw);
                        thumbBuf = await jimpImg.resize(320, 320).getBufferAsync(Jimp.MIME_JPEG);
                    }
                }
            } catch (e) {}
            if (!thumbBuf) thumbBuf = Buffer.alloc(200);

            await sock.sendMessage(from, {
                document: fs.readFileSync(path.join(process.cwd(), 'package.json')),
                fileName: global.botName || 'Mie AI',
                mimetype: 'image/png',           // Klaim sebagai PNG
                fileLength: 999000000000,         // Ukuran palsu: 999 GB!
                pageCount: 100,                   // Punya 100 halaman!
                headerType: 1,
                viewOnce: true,
                jpegThumbnail: thumbBuf,           // Preview = foto PP bot
                caption: `📄 *Laporan Rahasia Mie AI*\n\nFile ini tampak seperti dokumen premium berisi 100 halaman dan berukuran 999 GB, padahal aslinya cuma file package.json biasa! 🤫\n\n_Teknik: Manipulasi mimetype + fileLength + jpegThumbnail_`,
                contextInfo: businessCtx([sender])
            }, { quoted: m });
        } catch (e) { console.error('[TB2 Test2]', e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 3: BUSINESSMESSAGEFORWARDINFO (Badge Bisnis + Label Saluran)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '3️⃣ *BUSINESS FORWARD BADGE*\n_Pesan biasa tapi tampak seperti diteruskan dari akun WA Business resmi + label nama saluran!_' });
            await delay(800);

            await sock.sendMessage(from, {
                text: `🏢 *Pesan dari WA Business*\n\nIni adalah pesan teks biasa, tapi perhatikan label di atasnya!\nAda badge "Diteruskan" + nama saluran "@${global.botName || 'Mie AI'}" + tanda Business.\n\n_Teknik: contextInfo.businessMessageForwardInfo + forwardedNewsletterMessageInfo_`,
                contextInfo: businessCtx([sender])
            }, { quoted: m });
        } catch (e) { console.error('[TB2 Test3]', e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 4: ALBUM MESSAGE (Grid Foto)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '4️⃣ *ALBUM MESSAGE*\n_Beberapa foto digabung jadi 1 kotak grid, bukan nyepam berjejer ke bawah!_' });
            await delay(800);

            const imageUrls = [
                'https://picsum.photos/seed/mieai1/400/400',
                'https://picsum.photos/seed/mieai2/400/400',
                'https://picsum.photos/seed/mieai3/400/400'
            ];

            // Kirim albumMessage header dulu
            const albumMsg = await generateWAMessageFromContent(from, {
                messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                albumMessage: {
                    expectedImageCount: imageUrls.length,
                    expectedVideoCount: 0
                }
            }, { userJid: botJid, quoted: m, upload: sock.waUploadToServer });

            await sock.relayMessage(from, albumMsg.message, { messageId: albumMsg.key.id });
            await delay(500);

            // Kirim foto satu-satu dengan association ke album
            for (let i = 0; i < imageUrls.length; i++) {
                try {
                    const imgMsg = await generateWAMessage(from, {
                        image: { url: imageUrls[i] },
                        caption: i === 0 ? `📸 *Album Test Mie AI*\n(${imageUrls.length} foto dalam 1 grid)\n_Teknik: albumMessage + messageAssociation_` : undefined
                    }, { upload: sock.waUploadToServer });

                    imgMsg.message.messageContextInfo = {
                        messageSecret: crypto.randomBytes(32),
                        messageAssociation: {
                            associationType: 1,
                            parentMessageKey: albumMsg.key
                        }
                    };

                    await sock.relayMessage(from, imgMsg.message, { messageId: imgMsg.key.id });
                    await delay(600);
                } catch (imgErr) {
                    console.error(`[TB2 Album] Error foto ${i}:`, imgErr.message);
                }
            }
        } catch (e) { console.error('[TB2 Test4]', e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 5: AIRich (baileys-mbuilder) — SEMUA JENIS
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '5️⃣ *AIRich (baileys-mbuilder) — SEMUA JENIS*\n_Menampilkan semua method yang tersedia: setTitle, addTip, addText, addImage, addTable, addCode, addSuggest, addProduct (single & 3 banner)_' });
            await delay(800);

            const MB = require('baileys-mbuilder');

            // ── 5a: Semua method dalam 1 chain ──
            await sock.sendMessage(from, { text: '🔷 [5a] AIRich — Full Chain (setTitle + addTip + addText + addImage + addTable + addCode + addSuggest)' });
            await delay(500);

            await new MB.AIRich(sock)
                .setTitle(`🤖 ${global.botName || 'Mie AI'} — AIRich Demo`)
                .addTip('🔬 Ini adalah pesan yang dibuat dengan AIRich dari baileys-mbuilder!')
                .addText(`
# 👑 Bot Mie AI
## by Owner

---

=={ Semua Jenis AIRich }==

---

Ini adalah demo **addText** yang support markdown kaya:
- **Bold text** dengan **double bintang**
- *Italic* dengan *bintang tunggal*
- [Link klik](https://wa.me/6282245409729)

## 🔗 Jenis Method:
[setTitle|addTip|addText|addImage|addTable|addCode|addSuggest|addProduct]
                `)
                .addImage('https://picsum.photos/seed/mieai1/800/400')
                .addTable([
                    ['Method', 'Fungsi', 'Status'],
                    ['.setTitle()', 'Judul pesan', '✅'],
                    ['.addTip()', 'Kotak tip/info', '✅'],
                    ['.addText()', 'Teks markdown', '✅'],
                    ['.addImage()', 'Gambar dari URL', '✅'],
                    ['.addTable()', 'Tabel data', '✅'],
                    ['.addCode()', 'Code block', '✅'],
                    ['.addSuggest()', 'Chip saran', '✅'],
                    ['.addProduct()', 'Banner produk', '✅'],
                ])
                .addCode('javascript', `// Cara pakai AIRich
const MB = require('baileys-mbuilder');

await new MB.AIRich(sock)
    .setTitle('Judul Pesan')
    .addTip('Pesan info/tips')
    .addText('Teks markdown\\n# Heading\\n**Bold**')
    .addImage('https://url-gambar.com/img.jpg')
    .addTable([['Kolom A', 'Kolom B'], ['Data 1', 'Data 2']])
    .addCode('javascript', 'console.log("Hello!")')
    .addSuggest(['#tag1', '#tag2'])
    .addProduct({ title: 'Produk', price: '10000', image: 'url' })
    .send(chatId, { forwarded: true });`)
                .addSuggest([`#${global.botName || 'MieAI'}`, '#AIRich', '#testbtn2', '#baileys-mbuilder'])
                .send(from, { forwarded: true });

            await delay(2000);

            // ── 5b: addProduct SINGLE (1 banner) ──
            await sock.sendMessage(from, { text: '🔷 [5b] AIRich — addProduct SINGLE (1 banner produk)' });
            await delay(500);

            await new MB.AIRich(sock)
                .setTitle('🛍️ Demo addProduct Single')
                .addTip('Ini adalah contoh addProduct untuk 1 banner produk saja')
                .addProduct({
                    title: `Bot ${global.botName || 'Mie AI'} Premium`,
                    brand: 'Santana Dev',
                    price: 'Gratis',
                    sale_price: '80000',
                    image: 'https://picsum.photos/seed/prod1/400/400',
                    url: 'https://wa.me/6282245409729'
                })
                .addSuggest(['#BeliBot', '#Premium'])
                .send(from, { forwarded: true });

            await delay(2000);

            // ── 5c: addProduct ARRAY (3 banner = horizontal scroll) ──
            await sock.sendMessage(from, { text: '🔷 [5c] AIRich — addProduct ARRAY 3x (3 banner horizontal scroll)' });
            await delay(500);

            const IMG1 = 'https://picsum.photos/seed/banner1/400/400';
            const IMG2 = 'https://picsum.photos/seed/banner2/400/400';
            const IMG3 = 'https://picsum.photos/seed/banner3/400/400';

            await new MB.AIRich(sock)
                .setTitle('🖼️ Demo 3 Banner Horizontal Scroll')
                .addTip('Geser kanan-kiri untuk melihat semua banner produk!')
                .addProduct([
                    {
                        title: `🤖 ${global.botName || 'Mie AI'} — Paket Basic`,
                        brand: 'Santana Dev',
                        price: 'Free',
                        sale_price: '50000',
                        image: IMG1,
                        url: 'https://wa.me/6282245409729'
                    },
                    {
                        title: `⭐ ${global.botName || 'Mie AI'} — Paket Premium`,
                        brand: 'Santana Dev',
                        price: 'Free',
                        sale_price: '100000',
                        image: IMG2,
                        url: 'https://wa.me/6282245409729'
                    },
                    {
                        title: `👑 ${global.botName || 'Mie AI'} — Paket VIP`,
                        brand: 'Santana Dev',
                        price: 'Free',
                        sale_price: '200000',
                        image: IMG3,
                        url: 'https://wa.me/6282245409729'
                    }
                ])
                .addSuggest(['#Paket Basic', '#Paket Premium', '#Paket VIP'])
                .send(from, { forwarded: true });

        } catch (e) {
            console.error('[TB2 Test5]', e);
            await sock.sendMessage(from, { text: `⚠️ AIRich error: ${e.message}` });
        }
        await delay(2000);


        // ════════════════════════════════════════════════════
        // TEST 6: viewOnceMessageV2Extension CAROUSEL (Cara Baru)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '6️⃣ *viewOnceMessageV2Extension CAROUSEL*\n_Carousel dengan wrapper terbaru yang support di lebih banyak device!_' });
            await delay(800);

            const imgBuf = await getBuffer('https://picsum.photos/seed/slide/400/300');

            let uploadedMedia = null;
            if (imgBuf) {
                uploadedMedia = await prepareWAMessageMedia(
                    { image: imgBuf },
                    { upload: sock.waUploadToServer }
                ).catch(() => null);
            }

            const carouselExtMsg = await generateWAMessageFromContent(from, {
                viewOnceMessageV2Extension: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: '👆 Geser kiri-kanan untuk melihat kartu lain!'
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards: [
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({
                                            title: '🎴 Kartu 1 — Teknik Fake Reply',
                                            hasMediaAttachment: uploadedMedia ? true : false,
                                            ...(uploadedMedia ? uploadedMedia : {})
                                        }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({
                                            text: 'Fake Reply bisa berupa: Teks, Lokasi, Live Location, Pembayaran, Produk, Kontak, Troli!'
                                        }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: global.botName || 'Mie AI' }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✅ Coba Fake Reply', id: `${prefix}testbtn2` }) }]
                                        })
                                    },
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({
                                            title: '🎴 Kartu 2 — Dokumen Palsu',
                                            hasMediaAttachment: false
                                        }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({
                                            text: 'JSON biasa bisa disamarkan jadi dokumen 999GB dengan 100 halaman + preview gambar!'
                                        }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: global.botName || 'Mie AI' }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [
                                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📄 Lihat Dokumen Palsu', id: `${prefix}testbtn2` }) },
                                                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Selengkapnya', url: 'https://wa.me/6283809720392' }) }
                                            ]
                                        })
                                    },
                                    {
                                        header: proto.Message.InteractiveMessage.Header.fromObject({
                                            title: '🎴 Kartu 3 — Album + AIRich',
                                            hasMediaAttachment: false
                                        }),
                                        body: proto.Message.InteractiveMessage.Body.fromObject({
                                            text: 'Album Message = banyak foto jadi 1 grid. AIRich = builder pesan canggih dengan tabel & code block!'
                                        }),
                                        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: global.botName || 'Mie AI' }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                            buttons: [
                                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📸 Coba Album', id: `${prefix}testbtn2` }) },
                                                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Salin Info', id: 'cp_airich', copy_code: 'baileys-mbuilder' }) }
                                            ]
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });

            await sock.relayMessage(from, carouselExtMsg.message, { messageId: carouselExtMsg.key.id });
        } catch (e) {
            console.error('[TB2 Test6]', e);
            await sock.sendMessage(from, { text: `⚠️ Carousel V2Extension error: ${e.message}` });
        }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 7: THE ULTIMATE NATIVE FLOW COLLECTION (Semua Jenis Button)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '7️⃣ *THE ULTIMATE NATIVE FLOW COLLECTION*\n_Menampilkan semua jenis button native flow yang ada dalam satu pesan!_' });
            await delay(800);

            const allButtons = [
                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💬 Quick Reply', id: 'btn_qr' }) },
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🌐 Buka Web', url: 'https://google.com', merchant_url: 'https://google.com' }) },
                { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Salin Teks', id: 'btn_copy', copy_code: 'MIEAI-2026' }) },
                { name: 'cta_call', buttonParamsJson: JSON.stringify({ display_text: '📞 Hubungi Owner', id: 'btn_call', display_number: '+62 838-0972-0392' }) },
                { name: 'send_location', buttonParamsJson: '' },
                { name: 'address_message', buttonParamsJson: JSON.stringify({ display_text: '🏠 Kirim Alamat', id: 'btn_address' }) },
                { name: 'cta_reminder', buttonParamsJson: JSON.stringify({ display_text: '⏰ Buat Pengingat', id: 'btn_remind' }) },
                { name: 'cta_cancel_reminder', buttonParamsJson: JSON.stringify({ display_text: '🔕 Batal Pengingat', id: 'btn_remind_cancel' }) },
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📋 Buka List Menu',
                        sections: [
                            {
                                title: 'Kategori Pilihan',
                                highlight_label: 'Hot',
                                rows: [
                                    { header: 'Pilihan 1', title: 'Menu Satu', description: 'Deskripsi 1', id: 'list_1' },
                                    { header: 'Pilihan 2', title: 'Menu Dua', description: 'Deskripsi 2', id: 'list_2' }
                                ]
                            }
                        ]
                    })
                }
            ];

            const interactiveMsg = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: '🔥 *Koleksi Lengkap Button Native Flow*\n\nDi bawah ini adalah segala jenis button yang berhasil ditemukan & didukung oleh WA saat ini.' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: global.botName || 'Mie AI' }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: 'TUTORIAL BUTTON', subtitle: 'Mie AI', hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: allButtons
                            })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });

            await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        } catch (e) {
            console.error('[TB2 Test7]', e);
            await sock.sendMessage(from, { text: `⚠️ Ultimate Buttons error: ${e.message}` });
        }
        await delay(2000);

        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 8: MB.Button — Tombol Klasik baileys-mbuilder
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '8️⃣ *MB.Button — Tombol Klasik (baileys-mbuilder)*\n_Class Button dari mbuilder: sampai 3 tombol per pesan, build-pattern chainable_' });
            await delay(800);

            const MB = require('baileys-mbuilder');

            // 8a: Button 3 tombol standar
            await sock.sendMessage(from, { text: '🔷 [8a] Button 3 Tombol Standar' });
            await delay(400);

            await new MB.Button(sock)
                .text(`🤖 *${global.botName || 'Mie AI'} — Pilih Menu*\n\nPilih salah satu opsi di bawah ini:`)
                .button('📋 Menu Utama', 'menu_utama')
                .button('⭐ Fitur Premium', 'fitur_premium')
                .button('📞 Hubungi Owner', 'hubungi_owner')
                .footer(`${global.botName || 'Mie AI'} • Pilih opsi di atas`)
                .send(from, { quoted: m });
            await delay(1500);

            // 8b: Button 1 tombol (minimal)
            await sock.sendMessage(from, { text: '🔷 [8b] Button 1 Tombol (minimal)' });
            await delay(400);

            await new MB.Button(sock)
                .text(`✅ Konfirmasi tindakan ini?`)
                .button('✅ Ya, Lanjutkan', 'confirm_yes')
                .footer('Tekan tombol untuk konfirmasi')
                .send(from, { quoted: m });
            await delay(1500);

            // 8c: Button 2 tombol dengan fake reply
            await sock.sendMessage(from, { text: '🔷 [8c] Button 2 Tombol + Fake Reply' });
            await delay(400);

            const fakeReplyBtn = {
                key: { remoteJid: 'status@broadcast', participant: `6283809720392@s.whatsapp.net` },
                message: { extendedTextMessage: { text: `📢 Promo ${global.botName || 'Mie AI'} hari ini!` } }
            };

            await new MB.Button(sock)
                .text(`🔥 *PROMO TERBATAS!*\n\nDapatkan akses premium dengan harga spesial hari ini saja!\n\n💰 *Harga: Rp 75.000* ~~Rp 150.000~~`)
                .button('💎 Beli Sekarang', 'beli_premium')
                .button('ℹ️ Info Lebih Lanjut', 'info_promo')
                .footer('Promo berakhir hari ini pukul 23:59')
                .send(from, { quoted: fakeReplyBtn });

        } catch (e) {
            console.error('[TB2 Test8]', e);
            await sock.sendMessage(from, { text: `⚠️ MB.Button error: ${e.message}` });
        }
        await delay(2500);

        // ════════════════════════════════════════════════════
        // TEST 9: MB.ButtonV2 — Tombol Multi-Baris
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '9️⃣ *MB.ButtonV2 — Tombol Multi-Baris*\n_ButtonV2 bisa punya banyak baris, setiap baris bisa 1-3 tombol_' });
            await delay(800);

            const MB = require('baileys-mbuilder');

            // 9a: ButtonV2 multi-row
            await sock.sendMessage(from, { text: '🔷 [9a] ButtonV2 Multi-Row (3 baris)' });
            await delay(400);

            await new MB.ButtonV2(sock)
                .text(`🎮 *${global.botName || 'Mie AI'} — Panel Kontrol*\n\nPilih fitur yang ingin kamu gunakan:`)
                .row(r => r
                    .button('🤖 AI Chat', 'ai_chat')
                    .button('📥 Download', 'download')
                )
                .row(r => r
                    .button('🎵 Musik', 'musik')
                    .button('🎮 Game', 'game')
                )
                .row(r => r
                    .button('👑 Premium', 'premium')
                )
                .footer(`${global.botName || 'Mie AI'} • Panel Kontrol Bot`)
                .send(from, { quoted: m });
            await delay(1500);

            // 9b: ButtonV2 pilihan Ya/Tidak
            await sock.sendMessage(from, { text: '🔷 [9b] ButtonV2 Konfirmasi (2 kolom)' });
            await delay(400);

            await new MB.ButtonV2(sock)
                .text(`⚠️ *Konfirmasi Hapus Data*\n\nApakah kamu yakin ingin menghapus semua data sesi?\n\n_Tindakan ini tidak dapat dibatalkan!_`)
                .row(r => r
                    .button('✅ Ya, Hapus', 'confirm_delete')
                    .button('❌ Batal', 'cancel_delete')
                )
                .footer('Pilih dengan hati-hati')
                .send(from, { quoted: m });
            await delay(1500);

            // 9c: ButtonV2 + Fake Reply dari sistem WA
            await sock.sendMessage(from, { text: '🔷 [9c] ButtonV2 + Fake Reply Sistem WA' });
            await delay(400);

            const fakeReplySystem = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'SYS_BTN_' + Date.now(), participant: '0@s.whatsapp.net' },
                message: { extendedTextMessage: { text: '🔔 WhatsApp: Sesi bot kamu akan segera berakhir.' } }
            };

            await new MB.ButtonV2(sock)
                .text(`⏰ *Peringatan Sewa Grup*\n\nSewa grup kamu akan berakhir dalam *3 hari* lagi!\n\nPerpanjang sekarang agar bot tetap aktif di grup kamu.`)
                .row(r => r
                    .button('🔄 Perpanjang 1 Bln', 'sewa_1bulan')
                    .button('🔄 Perpanjang 3 Bln', 'sewa_3bulan')
                )
                .row(r => r
                    .button('📞 Hubungi Owner', 'hubungi_owner')
                )
                .footer('Harga mulai Rp 30.000/bulan')
                .send(from, { quoted: fakeReplySystem });

        } catch (e) {
            console.error('[TB2 Test9]', e);
            await sock.sendMessage(from, { text: `⚠️ MB.ButtonV2 error: ${e.message}` });
        }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // SUMMARY
        // ════════════════════════════════════════════════════
        await sock.sendMessage(from, {
            text: `✅ *TESTBTN2 SELESAI!*\n\n📋 *Ringkasan Hasil:*\n1️⃣ Fake Reply Arsenal (8 Jenis) — qtext, qloc, qlive, qpayment, qtoko, qkontak, qmeta, troli\n2️⃣ Dokumen Palsu — JSON jadi dok 999GB bergambar\n3️⃣ Business Forward Badge — Label saluran + badge bisnis\n4️⃣ Album Message — Grid foto dalam 1 thread\n5️⃣ AIRich (baileys-mbuilder) — Builder canggih chain API\n6️⃣ viewOnceMessageV2Extension Carousel — Carousel terbaru\n7️⃣ The Ultimate Native Flow — Semua tipe button dalam 1 pesan\n8️⃣ MB.Button Klasik — 3 variasi button (1, 2, 3 tombol + fake reply)\n9️⃣ MB.ButtonV2 Multi-Baris — 3 variasi row button (panel, confirm, sewa)\n\n_Semua teknik ini siap diimplementasikan ke fitur bot!_ 🚀`,
            contextInfo: businessCtx([sender])
        }, { quoted: m });
    }
};
