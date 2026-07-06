const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

module.exports = {
    command: ['edit'],
    category: ['ai'],
    handler: async (sock, m, { prefix, command, text }) => {
        const from = m.key.remoteJid;
        const prompt = text.trim();

        if (!prompt) {
            return sock.sendMessage(from, { text: `Teks tidak boleh kosong.\nContoh: ${prefix + command} hitamkan` }, { quoted: m });
        }

        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        if (baseMsg?.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg?.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg?.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const isImage = !!baseMsg?.imageMessage;

        if (!isImage) {
            return sock.sendMessage(from, { text: `Kirim atau balas gambar dengan tulisan ${prefix + command} [prompt]` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        } else {
            await sock.sendMessage(from, { text: '_Memproses gambar (mungkin butuh waktu agak lama)..._' }, { quoted: m });
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
            const apiLink = `https://api.alyachan.dev/api/ai/edit?image_url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`;

            // Editing can take a while
            const res = await axios.get(apiLink, {
                headers: { "Authorization": `Bearer ${apiKey}` },
                timeout: 120000 // 2 minutes
            });

            if (!res.data.status || !res.data.data.images || res.data.data.images.length === 0) {
                throw new Error("Gagal mengedit gambar.");
            }

            await sock.sendMessage(from, {
                image: { url: res.data.data.images[0].url },
                caption: `Done!`
            }, { quoted: m });

            try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); } catch(e){}

        } catch (e) {
            console.error('Edit Error:', e.message);
            sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};
