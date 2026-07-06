const { downloadMedia } = require('../../lib/helper');

module.exports = {
    command: ['rvo', 'readviewonce'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;
        
        const quotedContext = m.message.extendedTextMessage?.contextInfo;
        const quotedMsg = quotedContext?.quotedMessage;

        if (!quotedMsg) {
            return sock.sendMessage(from, { text: `*[?]* Balas pesan sekali lihat (View Once) dengan perintah *${prefix}${command}*` }, { quoted: m });
        }

        // Mendapatkan konten pesan 1x lihat (Cek format baru & format lama Baileys)
        let isWrappedViewOnce = quotedMsg.viewOnceMessageV2 || quotedMsg.viewOnceMessage;
        let baseMsg = isWrappedViewOnce ? isWrappedViewOnce.message : quotedMsg;
        
        const isImage = !!baseMsg.imageMessage;
        const isVideo = !!baseMsg.videoMessage;
        const isAudio = !!baseMsg.audioMessage; 

        if (!isImage && !isVideo && !isAudio) {
            return sock.sendMessage(from, { text: `Media tidak didukung atau tidak dapat ditemukan.` }, { quoted: m });
        }

        const type = isImage ? 'imageMessage' : isVideo ? 'videoMessage' : 'audioMessage';
        const mediaData = baseMsg[type];

        // Pastikan media ini benar-benar pesan View Once
        if (!isWrappedViewOnce && !mediaData.viewOnce) {
             return sock.sendMessage(from, { text: `Itu bukan pesan sekali lihat (View Once) kak.` }, { quoted: m });
        }

        try {
            const type = isImage ? 'imageMessage' : isVideo ? 'videoMessage' : 'audioMessage';
            const mediaData = baseMsg[type];
            const caption = mediaData.caption || '';
            const buffer = await downloadMedia({ [type]: mediaData });

            if (isImage) {
                await sock.sendMessage(from, { image: buffer, caption: caption }, { quoted: m });
            } else if (isVideo) {
                await sock.sendMessage(from, { video: buffer, caption: caption }, { quoted: m });
            } else if (isAudio) {
                await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
            }
        } catch (e) {
            console.error(e);
            sock.sendMessage(from, { text: "[!] Gagal mengambil media dari pesan View Once." }, { quoted: m });
        }
    }
};
