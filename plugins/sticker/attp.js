const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * MIE AI - ATTP Sticker Generator 
 */
module.exports = {
    command: ['attp'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;

        if (!text) {
            return sock.sendMessage(from, { 
                text: ` *Format Salah Kakak Sayang...* \nContoh: *${prefix + command} haloo* ` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            // Panggil API AlyaChan
            const apiUrl = `https://api.alyachan.dev/api/canvas/attp?text=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${process.env.ALYACHAN_API_KEY}`
                },
                timeout: 30000
            });

            if (!response.data || !response.data.status || !response.data.data || !response.data.data.url) {
                throw new Error("Gagal generate ATTP dari server.");
            }

            const gifUrl = response.data.data.url;
            
            // Download GIF
            const getGif = await axios.get(gifUrl, { responseType: 'arraybuffer' });
            const gifBuffer = Buffer.from(getGif.data);

            // Setting Stiker dengan konfigurasi global
            const sticker = new Sticker(gifBuffer, {
                pack: global.packname || 'Mie AI Sticker', 
                author: global.author || 'Mie AI Bot',
                type: StickerTypes.FULL,
                quality: 100
            });

            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error ATTP API:", e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: ` *Duh Maaf...* Fitur stiker ATTP lagi ada gangguan. Coba lagi nanti ya! ` }, { quoted: m });
        }
    }
};
