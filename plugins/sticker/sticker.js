const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadMedia } = require('../../lib/helper');

module.exports = {
    command: ['s', 'stiker', 'sticker'],
    handler: async (sock, m) => {
        const from = m.key.remoteJid;
        
        // pesan utama atau yang di-reply
        let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        // Bongkar jika pesan dibungkus (View Once/Ephemeral)
        if (baseMsg.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        // Cek apakah ada media Image atau Video
        const isImage = !!baseMsg.imageMessage;
        const isVideo = !!baseMsg.videoMessage;

        if (!isImage && !isVideo) {
            return sock.sendMessage(from, { 
                text: `Kirim gambar/video atau balas media dengan caption *${global.prefix}s*` 
            }, { quoted: m });
        }

        try {
            

            const type = isImage ? 'imageMessage' : 'videoMessage';
            const mediaData = baseMsg[type];

            const buffer = await downloadMedia({ [type]: mediaData });

            const sticker = new Sticker(buffer, {
                pack: global.packname, 
                author: global.author,
                type: StickerTypes.FULL, 
                categories: ['', ''],
                id: '12345',
                quality: isVideo ? 50 : 75, 
            });

            const stickerBuffer = await sticker.toBuffer();
            
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

        } catch (e) {
            console.error(e);
            
            throw e; 
        }
    }
};