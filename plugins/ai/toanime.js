const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

module.exports = {
    command: ['toanime'],
    category: ['ai'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;

        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Prioritaskan gambar lampiran user duluan. Jika kosong, baru intip pesan quote
        let baseMsg = m.message;
        if (quoted && !m.message?.imageMessage && !m.message?.viewOnceMessageV2) {
            baseMsg = quoted;
        }

        if (baseMsg?.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg?.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg?.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const isImage = !!baseMsg?.imageMessage;

        if (!isImage) {
            return sock.sendMessage(from, { text: `Kirim atau balas gambar dengan tulisan ${prefix + command}` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: '_Processing..._' }, { quoted: m });
        }

        try {
            const mediaData = baseMsg.imageMessage;
            const stream = await downloadContentFromMessage(mediaData, 'image');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const imageUrl = await uploader(buffer);

            const apiKey = "sk_prod_f47671e1479aeee6f8927ec98ba58cd5";
            const apiLink = `https://api.alyachan.dev/api/ai/toanime?image_url=${encodeURIComponent(imageUrl)}&style=anime`;

            const res = await axios.get(apiLink, {
                headers: { "Authorization": `Bearer ${apiKey}` }
            });

            if (!res.data.status || !res.data.data.url) {
                throw new Error("Gagal mengubah gambar ke anime.");
            }

            await sock.sendMessage(from, {
                image: { url: res.data.data.url },
                caption: `Done!`
            }, { quoted: m });

            try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); } catch(e){}

        } catch (e) {
            console.error('ToAnime Error:', e.message);
            sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};
