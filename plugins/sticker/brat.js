const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * MIE AI - Brat Sticker Generator (Public Version) 
 * Identitas Author: Netral / Bot Name 
 */
module.exports = {
    command: ['brat', 'sbrat'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;

        if (!text) {
            return sock.sendMessage(from, { 
                text: ` *Aduh Kakak sayang...* \nKetik teksnya juga dong! Contoh: *${prefix + command} hello brat* ` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            // [!] Panggil API Siputzx (Langsung dapet Buffer Gambar)
            const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`;
            
            const getImg = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(getImg.data);

            //  Setting Stiker Netral
            const sticker = new Sticker(imageBuffer, {
                pack: global.packname || 'Mie AI Sticker ', 
                author: global.author || 'Mie AI Bot ', // [!] Nama Bos sudah Mei hapus
                type: StickerTypes.FULL,
                categories: ['', ''],
                quality: 100
            });

            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error Brat API:", e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: ` *Duh Maaf...* Fitur stiker lagi ada gangguan. Coba lagi nanti ya! ` }, { quoted: m });
        }
    }
};