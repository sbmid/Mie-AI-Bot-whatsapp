const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter'); 
const db = require('../../lib/database'); 

/**
 * MIE AI - Brat Video/Gif Sticker 
 * Powered by: SBM API (Bos Azrial) 
 * Aura: Aesthetic, Fast & Girly Sultan 
 */
module.exports = {
    command: ['bratvid', 'bratgif'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;
        
        // [!] 1. Ambil Identitas Pembuat (Author)
        const user = db.getUser(m.sender);
        const authorName = user.registered && user.name ? user.name : "Warga Mie AI ";

        if (!text) {
            return sock.sendMessage(from, { 
                text: ` *CARA PAKAI BRATVID* \n\nKetik: *${prefix + command} teks kamu*\n\n_Contoh: ${prefix + command} Mie AI Cantik_ ` 
            }, { quoted: m });
        }

        // Reaksi loading (dihapus sesuai permintaan)

        try {
            // [!] 2. Panggil API Anabot (Raw Buffer Response)
            const apiUrl = `https://anabot.my.id/api/maker/bratGif?text=${encodeURIComponent(text)}&apikey=freeApikey`;
            const getVid = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            const vidBuf = Buffer.from(getVid.data);

            //  4. Masak jadi Sticker Animasi dengan wa-sticker-formatter
            const sticker = new Sticker(vidBuf, {
                pack: global.packname || 'Mie AI',
                author: global.author || 'Mie AI Bot',
                type: StickerTypes.FULL,
                quality: 50
            });
            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(from, { 
                sticker: stickerBuffer 
            }, { quoted: m });

        } catch (e) {
            console.error("Error BratVid SBM:", e.message);
            
            sock.sendMessage(from, { 
                text: ` *Aduh Bos Azrial...* \nSepertinya "kompor" API-nya lagi mati atau kegedean teksnya. Coba lagi ya! ` 
            }, { quoted: m });
        }
    }
};