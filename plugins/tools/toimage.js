const { downloadMedia, uploadToCatbox } = require('../../lib/helper');

module.exports = {
    command: ['toimage', 'toimg'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat || m.key.remoteJid;
        
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let isSticker = quoted && quoted.stickerMessage;

        if (!isSticker) {
            return sock.sendMessage(from, { text: `[!] *Cara Pakai:* Balas (reply) stiker dengan ketik *${prefix + command}*` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: global.waitEmoji || '[~]', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: global.waitText || '_Sedang diproses..._' }, { quoted: m });
        }

        try {
            // Unduh buffer sticker pakai helper
            const buffer = await downloadMedia({ stickerMessage: quoted.stickerMessage });

            // Karena Sharp error di Windows tanpa C++ Redist, kita pakai API external yang gratis
            // 1. Upload sticker mentah (webp) ke catbox
            const catboxUrl = await uploadToCatbox(buffer);
            
            // 2. Gunakan wsrv.nl untuk convert link webp menjadi png secara otomatis
            const imageUrl = `https://wsrv.nl/?url=${encodeURIComponent(catboxUrl)}&output=png`;

            await sock.sendMessage(from, { 
                image: { url: imageUrl }, 
                caption: '[i] *Stiker berhasil diubah ke gambar!*' 
            }, { quoted: m });

        } catch (e) {
            console.error('ToImage Error:', e);
            return sock.sendMessage(from, { text: `[!] *Error:* Gagal mengonversi gambar. Pastikan stiker valid dan tidak korup.` }, { quoted: m });
        }
    }
};
