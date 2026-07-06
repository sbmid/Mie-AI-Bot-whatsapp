const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

module.exports = {
    command: ['noiseremover', 'clearaudio'],
    category: ['tools'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;

        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        const isAudio = !!baseMsg?.audioMessage || !!baseMsg?.documentMessage?.mimetype?.includes('audio');

        if (!isAudio) {
            return sock.sendMessage(from, { text: `Kirim atau balas voice note / audio dengan tulisan ${prefix + command}` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        } else {
            await sock.sendMessage(from, { text: '_Membersihkan noise..._' }, { quoted: m });
        }

        try {
            const mediaData = baseMsg.audioMessage || baseMsg.documentMessage;
            const stream = await downloadContentFromMessage(mediaData, 'audio');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const audioUrl = await uploader(buffer);

            const apiKey = "sk_prod_f47671e1479aeee6f8927ec98ba58cd5";
            const apiLink = `https://api.alyachan.dev/api/tools/noiseremover?audio_url=${encodeURIComponent(audioUrl)}`;

            const res = await axios.get(apiLink, {
                headers: { "Authorization": `Bearer ${apiKey}` },
                timeout: 60000 
            });

            if (!res.data.status || !res.data.data.url) {
                throw new Error("Gagal membersihkan noise audio.");
            }

            await sock.sendMessage(from, {
                audio: { url: res.data.data.url },
                mimetype: 'audio/mpeg',
                ptt: !!baseMsg?.audioMessage?.ptt // tetap VN jika asalnya VN
            }, { quoted: m });

            try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); } catch(e){}

        } catch (e) {
            console.error('NoiseRemover Error:', e.message);
            sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};
