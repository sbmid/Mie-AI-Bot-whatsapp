const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['spremium', 'sprem', 'stikerprem', 'slottie'],
    handler: async (sock, m, { command, prefix }) => {
        const from = m.key.remoteJid;
        
        let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Handle bungkus view once / ephemeral
        if (quoted && quoted.viewOnceMessageV2) quoted = quoted.viewOnceMessageV2.message;
        if (quoted && quoted.viewOnceMessage) quoted = quoted.viewOnceMessage.message;
        if (quoted && quoted.ephemeralMessage) quoted = quoted.ephemeralMessage.message;

        if (!quoted || !quoted.stickerMessage) {
            return sock.sendMessage(from, { text: `⚠️ Reply stiker yang ingin dimodifikasi dengan perintah *${prefix}${command}*` }, { quoted: m });
        }

        try {
            // Clone objek stickerMessage mentah
            let newSticker = JSON.parse(JSON.stringify(quoted.stickerMessage));

            if (['spremium', 'sprem', 'stikerprem'].includes(command)) {
                // Manipulasi Premium Sticker
                newSticker.premium = 1;
                newSticker.emojis = "🌟 💎"; // Tambahkan emoji sultan
            } 
            else if (command === 'slottie') {
                // Manipulasi Lottie Sticker
                newSticker.isLottie = true;
                newSticker.isAnimated = true;
                newSticker.mimetype = "application/was"; // Spoof mimetype
                newSticker.emojis = "🪄 ✨"; // Tambahkan emoji sulap
            }

            // Buat objek raw WAMessage dari content yang sudah dimodifikasi
            const msg = generateWAMessageFromContent(from, proto.Message.fromObject({
                stickerMessage: newSticker
            }), { userJid: sock.user.id });

            // Kirim payload mentah via relayMessage (menghindari proses upload ulang file)
            await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

        } catch (e) {
            console.error(`Error modsticker [${command}]:`, e);
            throw e; // Lemparkan error agar ditangkap oleh fitur .cekerror di lib/handler.js
        }
    }
};
