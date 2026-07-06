const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Jimp = require('jimp');

module.exports = {
    command: ['fakeai'],
    category: ['owner'],
    description: 'Eksperimen fake link preview Meta AI dan Link Owner',
    handler: async (sock, m) => {
        const sender = m.sender || m.key.remoteJid;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));

        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: `[!] Akses Ditolak. Khusus Owner.` }, { quoted: m });
        }

        const thumbPath = path.join(process.cwd(), 'fakeai_thumb.jpg');
        let thumbBuffer;

        // Download & Resize gambar dari Pinterest jika belum ada di lokal
        if (!fs.existsSync(thumbPath)) {
            try {
                const imgUrl = "https://i.pinimg.com/736x/04/65/65/0465654a3c8c15d8661d12e485f7a83f.jpg";
                const res = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                const img = await Jimp.read(res.data);
                
                // BUGS FIX: Jangan di-resize jadi kotak 200x200 kalau mau dibikin Persegi Panjang!
                // Kita set lebarnya 600, tingginya AUTO (proporsional) agar gambarnya tidak pecah/hitam
                thumbBuffer = await img.resize(600, Jimp.AUTO).quality(80).getBufferAsync(Jimp.MIME_JPEG);
                fs.writeFileSync(thumbPath, thumbBuffer);
            } catch (e) {
                console.error("Gagal download thumb:", e);
                thumbBuffer = Buffer.from([]);
            }
        } else {
            thumbBuffer = fs.readFileSync(thumbPath);
        }

        // Ambil nomor owner pertama dari global config
        const ownerNum = global.ownerNumber && global.ownerNumber.length > 0 
            ? global.ownerNumber[0].split('@')[0] 
            : "6283809720392";

        try {
            // ==========================================
            // EKSPERIMEN 1: Tombol Asisten Meta AI Asli
            // ==========================================
            const fakeMsg1 = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: "1[i]⃣ *Eksperimen Meta AI*\nKlik tombol di bawah ini untuk mengobrol dengan Meta AI!\n\nhttps://wa.me/ais/718584497008509?s=5",
                    matchedText: "https://wa.me/ais/718584497008509?s=5",
                    description: "MIE AI siap membantu segala kebutuhan bisnismu kapanpun dimanapun. (Eksperimen 1)",
                    title: " MIE AI Assistant VIP",
                    previewType: "NONE",
                    jpegThumbnail: thumbBuffer // Ini untuk Link Preview kotak biasa
                }
            }, { userJid: sock.user.id });

            await sock.relayMessage(m.chat, fakeMsg1.message, { messageId: fakeMsg1.key.id });

            // Jeda 1.5 detik agar rapi
            await new Promise(resolve => setTimeout(resolve, 1500));

            // ==========================================
            // EKSPERIMEN 2: Kirim Gambar Asli Dulu + Teks Link Preview
            // ==========================================
            // 1. Kirim gambarnya secara penuh
            await sock.sendMessage(m.chat, {
                image: thumbBuffer,
                caption: "[!]‍[!] *Chat Owner MIE AI*\nHubungi Owner untuk menanyakan detail sewa, donasi, atau keluhan. Fast respon! (Eksperimen 2)"
            }, { quoted: m });

            // Jeda sebentar biar berurutan
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. Kirim pesan teks yang memancing tombol "Mulai Mengobrol"
            const fakeMsg2 = generateWAMessageFromContent(m.chat, {
                extendedTextMessage: {
                    text: `Klik tombol di bawah ini untuk Chat Owner secara langsung [!]\n\nhttps://wa.me/${ownerNum}`,
                    matchedText: `https://wa.me/${ownerNum}`,
                    description: "Chat Owner MIE AI (Fast Respon)",
                    title: "[!]‍[!] Hubungi Owner",
                    previewType: "NONE",
                    jpegThumbnail: thumbBuffer // Biarkan jadi kotak kecil bawaan
                }
            }, { userJid: sock.user.id });

            await sock.relayMessage(m.chat, fakeMsg2.message, { messageId: fakeMsg2.key.id });

        } catch (e) {
            console.error("Gagal mengirim fake AI:", e);
            await sock.sendMessage(m.chat, { text: `[!] Gagal: ${e.message}` }, { quoted: m });
        }
    }
};
