const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const axios = require('axios');
const Jimp = require('jimp');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getBuffer = async (url) => {
    try {
        const res = await axios({
            method: "get",
            url,
            headers: { 'DNT': 1, 'Upgrade-Insecure-Requests': 1 },
            responseType: 'arraybuffer'
        });
        return Buffer.from(res.data);
    } catch (e) {
        return null;
    }
};

module.exports = {
    command: ['testbtn', 'allbtn', 'tesbutton'],
    handler: async (sock, m, { prefix }) => {
        const from = m.chat;

        await sock.sendMessage(from, { text: "[~] *MEMUAT KOLEKSI UI WA BUSINESS YANG 100% WORK...*\n\n_(Menyiapkan COMBO ULTIMATE: Bottom Sheet + Limited Offer + Location Header Custom Image + Semua Jenis Button!)_" }, { quoted: m });
        await delay(2000);

        // 1. STANDARD BUTTONS
        try {
            await sock.sendMessage(from, { text: "1[i]⃣ *Standard Buttons (Pilihan Ganda Biasa)*" });
            await sock.sendMessage(from, {
                text: "Ini adalah tipe Button Standar",
                footer: "Mie AI",
                headerType: 1,
                buttons: [
                    { buttonId: 'btn1', buttonText: { displayText: 'Pilihan 1' }, type: 1 },
                    { buttonId: 'btn2', buttonText: { displayText: 'Pilihan 2' }, type: 1 }
                ]
            });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 2. NATIVE FLOW V2 (BASIC)
        try {
            await sock.sendMessage(from, { text: "2[i]⃣ *Native Flow V2 (Copy Code & Link)*" });
            const interactiveMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: "Sistem Copy to Clipboard & Web Navigasi" }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Mie AI System" }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: "[!] *ADVANCED BUTTONS*", subtitle: "Basic", hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: " Website", url: "https://youtube.com", merchant_url: "https://youtube.com" }) },
                                    { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "[i] Salin Kode", id: "copy1", copy_code: "MIE-AI-X-2026" }) },
                                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "[!] Paham", id: "ok" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 3. NATIVE FLOW V2 (ADVANCED)
        try {
            await sock.sendMessage(from, { text: "3[i]⃣ *Native Flow V2 (Call, Request Location, Calendar, Address)*" });
            const interactiveAdvMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: "Tombol Integrasi HP (Telepon, Lokasi, Kalender, Form Alamat)." }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Mie AI System" }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: "[!] *ULTRA BUTTONS*", hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: "[!] Hubungi CS", id: "call1", phone_number: "+6283809720392" }) },
                                    { name: "send_location", buttonParamsJson: JSON.stringify({}) }, 
                                    { name: "cta_reminder", buttonParamsJson: JSON.stringify({ display_text: "[!] Ingatkan Saya", id: "rem1" }) },
                                    { name: "address_message", buttonParamsJson: JSON.stringify({ display_text: " Kirim Alamat", id: "addr" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, interactiveAdvMsg.message, { messageId: interactiveAdvMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 4. ORDER MESSAGE
        try {
            await sock.sendMessage(from, { text: "4[i]⃣ *Order Message (Tagihan Belanja)*" });
            await sock.sendMessage(from, {
                order: { itemCount: 3, status: 1, surface: 1, message: "Tagihan Order #99102", orderTitle: "Pembelian di Mie AI Shop", sellerJid: '1234567890@s.whatsapp.net', token: "ARBITRARY_TOKEN" }
            });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 5. POLL MESSAGE
        try {
            await sock.sendMessage(from, { text: "5[i]⃣ *Poll Message (Voting Jajak Pendapat)*" });
            await sock.sendMessage(from, {
                poll: { name: "Bahasa pemrograman terbaik?", values: ["JavaScript", "Python", "Go"], selectableCount: 1 }
            });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 6. PAYMENT REQUEST
        try {
            await sock.sendMessage(from, { text: "6[i]⃣ *Payment Request (Permintaan Transfer WA Pay)*" });
            const paymentMsg = generateWAMessageFromContent(from, {
                requestPaymentMessage: {
                    currencyCodeIso4217: "IDR", amount1000: 50000000, requestFrom: from, noteMessage: { extendedTextMessage: { text: "Tagihan WA Pay" } }, expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, paymentMsg.message, { messageId: paymentMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 7. LOCATION
        try {
            await sock.sendMessage(from, { text: "7[i]⃣ *Location (Maps)*" });
            await sock.sendMessage(from, {
                location: { degreesLatitude: -6.2088, degreesLongitude: 106.8456, name: "Monumen Nasional", address: "Jakarta" }
            });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 8. CONTACT ARRAY
        try {
            await sock.sendMessage(from, { text: "8[i]⃣ *Contacts Array (Multi vCard Kartu Nama)*" });
            const vcard1 = 'BEGIN:VCARD\nVERSION:3.0\nFN:Mie AI Dev 1\nORG:Mie AI Corp;\nTEL;type=CELL;type=VOICE;waid=6283809720392:+62 838-0972-0392\nEND:VCARD';
            const vcard2 = 'BEGIN:VCARD\nVERSION:3.0\nFN:Mie AI Support\nORG:Mie AI Corp;\nTEL;type=CELL;type=VOICE;waid=628123456789:+62 812-3456-7890\nEND:VCARD';
            await sock.sendMessage(from, { contacts: { displayName: "Tim Developer", contacts: [{ vcard: vcard1 }, { vcard: vcard2 }] } });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 9. REQUEST PHONE NUMBER
        try {
            await sock.sendMessage(from, { text: "9[i]⃣ *Request Phone Number (Minta Nomor User)*" });
            const reqPhoneMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        requestPhoneNumberMessage: proto.Message.RequestPhoneNumberMessage.create({
                            messageContextInfo: { messageSecret: crypto.randomBytes(32) }
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, reqPhoneMsg.message, { messageId: reqPhoneMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 10. NEWSLETTER ADMIN INVITE
        try {
            await sock.sendMessage(from, { text: "[!] *Newsletter Admin Invite (Undangan Admin Saluran)*" });
            const newsletterMsg = generateWAMessageFromContent(from, {
                newsletterAdminInviteMessage: {
                    newsletterJid: "120363000000000000@newsletter", newsletterName: "Saluran Informasi Mie AI", caption: "Jadilah admin saluran kami!", inviteExpiration: Math.floor(Date.now() / 1000) + 86400
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, newsletterMsg.message, { messageId: newsletterMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 11. INTERACTIVE MESSAGE DENGAN MEDIA (IMAGE HEADER)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣1[i]⃣ *Interactive Media (Image Header + URL Deep Link)*\n\n(Ini adalah format yang kamu kirimkan, dipadukan dengan Deep Link WA)" });
            const mediaInteractiveMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            header: proto.Message.InteractiveMessage.Header.create({
                                hasMediaAttachment: true,
                                imageMessage: { // Pakai dummy image
                                    url: "https://mmg.whatsapp.net/v/t62.7118-24/dummy",
                                    mimetype: "image/jpeg",
                                    fileSha256: crypto.randomBytes(32),
                                    fileLength: "12000",
                                    mediaKey: crypto.randomBytes(32),
                                    fileEncSha256: crypto.randomBytes(32),
                                    directPath: "/v/t62.7118-24/dummy",
                                    mediaKeyTimestamp: Math.floor(Date.now() / 1000)
                                }
                            }),
                            body: proto.Message.InteractiveMessage.Body.create({ text: "*Ini adalah Native Flow dengan Header Media!*\n\nCoba tombol di bawah, tombol tersebut menggunakan Deep Link rahasia WhatsApp (`whatsapp://settings`)." }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "[i] Buka Pengaturan WA", url: "whatsapp://settings" }) },
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: " Alat Bisnis", url: "whatsapp-smb://biztab/away-message" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, mediaInteractiveMsg.message, { messageId: mediaInteractiveMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 12. DEEP LINK MENU (Menu Cepat Pengaturan)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣2[i]⃣ *Deep Link Menu (Hacking OS Routing)*" });
            const deepLinkMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: "Tombol ini memanfaatkan URL Protocol `whatsapp://` untuk mengontrol aplikasi kamu dari dalam chat!" }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Mie AI OS Routing" }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: "[!] *SYSTEM SHORTCUTS*", hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "[!] Keamanan", url: "whatsapp://security" }) },
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "[!] Akun", url: "whatsapp://settings/account" }) },
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "[!] Tulis Status", url: "whatsapp://status" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, deepLinkMsg.message, { messageId: deepLinkMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 13. AUDIO MESSAGE (VOICE NOTE NATIVE)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣3[i]⃣ *Voice Note PTT Asli (Rekaman Suara)*" });
            const audioMsg = generateWAMessageFromContent(from, {
                audioMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7114-24/dummy",
                    mimetype: "audio/ogg; codecs=opus",
                    fileSha256: crypto.randomBytes(32),
                    fileLength: "5000",
                    seconds: 12,
                    ptt: true, // INI YANG BIKIN JADI VOICE NOTE (Bentuk Mic)
                    mediaKey: crypto.randomBytes(32),
                    fileEncSha256: crypto.randomBytes(32),
                    directPath: "/v/t62.7114-24/dummy",
                    mediaKeyTimestamp: Math.floor(Date.now() / 1000)
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, audioMsg.message, { messageId: audioMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);
        
        // 14. DOCUMENT MESSAGE WITH THUMBNAIL 
        try {
            await sock.sendMessage(from, { text: "1[i]⃣4[i]⃣ *Document dengan Gambar Thumbnail Penuh*" });
            const docMsg = generateWAMessageFromContent(from, {
                documentMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/dummy",
                    mimetype: "application/pdf",
                    title: "Buku_Panduan_Bot.pdf",
                    fileSha256: crypto.randomBytes(32),
                    fileLength: "15000",
                    pageCount: 42,
                    mediaKey: crypto.randomBytes(32),
                    fileName: "Panduan.pdf",
                    fileEncSha256: crypto.randomBytes(32),
                    directPath: "/v/t62.7118-24/dummy",
                    mediaKeyTimestamp: Math.floor(Date.now() / 1000),
                    jpegThumbnail: crypto.randomBytes(50) // Simulasi buffer thumbnail
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, docMsg.message, { messageId: docMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // --- THE ULTIMATE MEGA COMBO ---

        // 15. MEGA COMBO V2: IMAGE HEADER + BOTTOM SHEET + ALL BUTTONS
        try {
            await sock.sendMessage(from, { text: "1[i]⃣5[i]⃣ *THE ULTIMATE MEGA COMBO V2 (Header Image Full HD + Bottom Sheet + Semua Jenis Button)*" });
            
            const imageUrl = "https://files.catbox.moe/241iqj.png";
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: sock.waUploadToServer });

            const megaComboMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: "Ini adalah UI Kombinasi paling sempurna yang merangkum *Semua Fitur* Native Flow WhatsApp dalam 1 Chat!\n\nPerhatikan semua jenis tombol di bawah ini yang dibungkus rapi oleh Bottom Sheet!" }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: "Mie AI Ultimate Engine" }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: " THE MASTERPIECE V2",
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                messageParamsJson: JSON.stringify({
                                    limited_time_offer: {
                                        text: "Diskon 99% Hanya Hari Ini!",
                                        url: "https://youtube.com",
                                        copy_code: "COMBO-MIE-AI",
                                        expiration_time: Date.now() + (12 * 60 * 60 * 1000)
                                    },
                                    bottom_sheet: {
                                        in_thread_buttons_limit: 1, 
                                        divider_indices: [1, 5],
                                        list_title: "Master Menu Mie AI",
                                        button_title: "Buka Semua Aksi [!]"
                                    }
                                }),
                                buttons: [
                                    {
                                        name: "single_select",
                                        buttonParamsJson: JSON.stringify({
                                            title: "Pilih Menu Utama",
                                            sections: [{
                                                title: "Daftar Menu Keren",
                                                highlight_label: "BEST SELLER [!]",
                                                rows: [
                                                    { title: "Menu Satu", description: "Buka menu ke-1", id: "menu_1" },
                                                    { title: "Menu Dua", description: "Buka menu ke-2", id: "menu_2" }
                                                ]
                                            }],
                                            has_multiple_buttons: true
                                        })
                                    },
                                    { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "[!] Balas Cepat", id: "qr1" }) },
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: " Buka Browser", url: "https://www.google.com" }) },
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "[i] Pengaturan Privasi", url: "whatsapp://settings/privacy" }) },
                                    { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "[!] Salin ID", id: "cp", copy_code: "USER-12345" }) },
                                    { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: "📞 Telepon Dev", id: "cl", phone_number: "+6283809720392" }) },
                                    { name: "cta_reminder", buttonParamsJson: JSON.stringify({ display_text: "⏰ Ingatkan Saya", id: "rem_combo" }) },
                                    { name: "address_message", buttonParamsJson: JSON.stringify({ display_text: "📍 Isi Alamat", id: "addr_combo" }) },
                                    { name: "send_location", buttonParamsJson: JSON.stringify({}) },
                                    { name: "open_webview", buttonParamsJson: JSON.stringify({ title: "🌐 Buka Web di WA", link: { in_app_webview: true, url: "https://youtube.com" } }) },
                                    { name: "cta_catalog", buttonParamsJson: JSON.stringify({ business_phone_number: "6283809720392" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, megaComboMsg.message, { messageId: megaComboMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 16. CAROUSEL MESSAGE (GALLERY CARD)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣6[i]⃣ *Carousel Message (Galeri Swipe)*\n\nIni adalah tipe pesan baru dari WA Bisnis yang sangat jarang digunakan!" });
            
            const carouselMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: "Geser ke samping untuk melihat opsi lain! [!]" }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                                cards: [
                                    {
                                        header: proto.Message.InteractiveMessage.Header.create({ title: "Kartu 1", subtitle: "Deskripsi", hasMediaAttachment: false }),
                                        body: proto.Message.InteractiveMessage.Body.create({ text: "Ini adalah isi dari kartu pertama." }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                            buttons: [ { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Pilih 1", id: "c1" }) } ]
                                        })
                                    },
                                    {
                                        header: proto.Message.InteractiveMessage.Header.create({ title: "Kartu 2", subtitle: "Deskripsi", hasMediaAttachment: false }),
                                        body: proto.Message.InteractiveMessage.Body.create({ text: "Ini adalah isi dari kartu kedua." }),
                                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                            buttons: [ { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Pilih 2", id: "c2" }) } ]
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });
            await sock.relayMessage(from, carouselMsg.message, { messageId: carouselMsg.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 17. LIST MESSAGE V1 (KLASIK)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣7[i]⃣ *List Message V1 (Daftar Pilihan Klasik)*" });
            await sock.sendMessage(from, {
                text: "Ini adalah tampilan List Message versi lawas (V1).",
                footer: "Mie AI System",
                title: "Daftar Klasik",
                buttonText: "Buka List Klasik",
                sections: [
                    { title: "Kategori 1", rows: [{ title: "Opsi Klasik 1", rowId: "v1_1" }] },
                    { title: "Kategori 2", rows: [{ title: "Opsi Klasik 2", rowId: "v1_2" }] }
                ]
            });
        } catch (e) { console.error(e); }
        await delay(2000);

        // 18. TEMPLATE BUTTONS V1 (KLASIK)
        try {
            await sock.sendMessage(from, { text: "1[i]⃣8[i]⃣ *Template Buttons V1 (URL & Call Klasik)*" });
            await sock.sendMessage(from, {
                text: "Ini adalah tampilan Template Message versi lawas (V1).",
                footer: "Mie AI System",
                templateButtons: [
                    { index: 1, urlButton: { displayText: ' Buka Google', url: 'https://google.com' } },
                    { index: 2, callButton: { displayText: '[!] Call Me', phoneNumber: '+6283809720392' } },
                    { index: 3, quickReplyButton: { displayText: '[!] Balas Cepat', id: 'v1_reply' } }
                ]
            });
        } catch (e) { console.error(e); }

        await delay(1000);
        await sock.sendMessage(from, { text: "[i] *Selesai!* Seluruh test case UI telah dijalankan. Silakan pelajari fitur-fitur baru di bagian bawah!" });
    }
};
