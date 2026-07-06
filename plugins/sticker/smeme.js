const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');
const db = require('../../lib/database');

/**
 * MIE AI - Smeme Premium (Transparency & Personalized)
 * Aura: Elegant, Versatile & Sultan 
 */
module.exports = {
    command: ['smeme'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const sender = m.sender;
        const user = db.getUser(sender);
        const userName = user.name || "Bos"; // Ambil nama dari DB

        // 1. Validasi Input Teks
        if (!text) return sock.sendMessage(from, { 
            text: ` *CARA PAKAI SMEME* \n\nKetik: *${prefix + command} teks atas | teks bawah*\n_Balas foto atau stiker untuk dijadikan meme!_` 
        }, { quoted: m });

        // 2. Deteksi Media
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        if (baseMsg?.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg?.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg?.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const isImage = !!baseMsg?.imageMessage;
        const isSticker = !!baseMsg?.stickerMessage;

        // --- CUSTOM ERROR MESSAGE (Sesuai Nama Database) ---
        if (!isImage && !isSticker) {
            return sock.sendMessage(from, { 
                text: `[!] *REPLY FOTO ATAU STIKERNYA DULU, ${userName.toUpperCase()}!*` 
            }, { quoted: m });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            // 3. Download Media
            const mediaType = isImage ? 'image' : 'sticker';
            const mediaData = isImage ? baseMsg.imageMessage : baseMsg.stickerMessage;
            
            const stream = await downloadContentFromMessage(mediaData, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 4. Upload ke Internet
            const imageUrl = await uploader(buffer);
            if (!imageUrl) throw new Error("Gagal mengunggah media ke uploader.");

            // 5. Format Teks (Memegen Style)
            // Karakter khusus di-escape agar API tidak error
            let [t1, t2] = text.split('|').map(v => v ? v.trim()
                .replace(/\s/g, '_')
                .replace(/\?/g, '~q')
                .replace(/\//g, '~s')
                .replace(/\#/g, '~h')
                .replace(/\%/g, '~p') : '_');
            
            // 6. Panggil Engine Memegen (Format .png untuk menjaga Transparansi)
            // Menggunakan ekstensi .png di akhir URL sangat penting untuk transparansi stiker!
            const memeUrl = `https://api.memegen.link/images/custom/${t1}/${t2 || '_'}.png?background=${imageUrl}`;

            const res = await axios.get(memeUrl, { responseType: 'arraybuffer' });

            // 7. Masak Jadi Stiker (Tanpa Background tambahan)
            const sticker = new Sticker(Buffer.from(res.data), {
                pack: global.botName || "Mie AI", 
                author: user.name || "Mie AI User",
                type: StickerTypes.FULL, // FULL agar tidak terpotong (menjaga aspek rasio transparan)
                quality: 100 // Kualitas tinggi agar garis tepi teks tajam
            });

            // 8. Kirim Hasil
            await sock.sendMessage(from, { sticker: await sticker.toBuffer() }, { quoted: m });
            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Smeme Error:", e.message);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: `[!] *ERROR:* ${e.message}` }, { quoted: m });
        }
    }
};