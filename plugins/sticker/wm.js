const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadMedia } = require('../../lib/helper');

module.exports = {
    command: ['wm', 'watermark', 'colong'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;

        if (!text) {
            return sock.sendMessage(from, { 
                text: `[!] Format salah!\n\nKirim/balas stiker dengan caption:\n*${prefix + command} PackName|AuthorName*\n\nContoh: *${prefix + command} Stiker Lucu|Mei AI*`
            }, { quoted: m });
        }

        let [packname, author] = text.split('|');
        if (!packname) packname = global.packname;
        if (!author) author = global.author;

        let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        if (baseMsg.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const isImage = !!baseMsg.imageMessage;
        const isVideo = !!baseMsg.videoMessage;
        const isSticker = !!baseMsg.stickerMessage;

        if (!isImage && !isVideo && !isSticker) {
            return sock.sendMessage(from, { 
                text: `[!] Harap balas stiker/gambar/video yang ingin diubah watermark-nya!` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            const type = isImage ? 'imageMessage' : isVideo ? 'videoMessage' : 'stickerMessage';
            const mediaData = baseMsg[type];

            const buffer = await downloadMedia({ [type]: mediaData });

            const sticker = new Sticker(buffer, {
                pack: packname.trim(), 
                author: author.trim(),
                type: StickerTypes.FULL, 
                categories: ['', ''],
                id: '12345',
                quality: isVideo ? 50 : 75, 
            });

            const stickerBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('WM Error:', e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(from, { text: `[!] Gagal mengubah watermark! Pastikan media dapat diakses.` }, { quoted: m });
        }
    }
};
