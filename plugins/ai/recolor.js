const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader'); 

/**
 * MIE AI - Image Recolor (B&W to Color) 
 * Status: Powered by SBMKU AI Engine (Official Mie AI) 
 * Aura: Sweet, Nostalgic & Colorful 
 */
module.exports = {
    command: ['recolor'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;

        // [!] 1. Deteksi Pesan Gambar (Support Quoted, ViewOnce, Ephemeral)
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        if (baseMsg?.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg?.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg?.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const isImage = !!baseMsg?.imageMessage;

        // Validasi Foto
        if (!isImage) {
            return sock.sendMessage(from, { 
                text: ` *Halo Kakak Sayang...* \n\nMie butuh foto hitam putih buat dikasih warna nih. Kirim atau balas foto dengan caption *${prefix + command}* ya! ` 
            }, { quoted: m });
        }

        // Reaksi Proses [~]
        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        }

        try {
            // 2. Download Media ke Buffer
            const mediaData = baseMsg.imageMessage;
            const stream = await downloadContentFromMessage(mediaData, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Upload via uploader untuk dapatkan URL
            const imageUrl = await uploader(buffer); 
            
            if (!imageUrl || !imageUrl.startsWith('http')) {
                throw new Error("Gagal mengunggah foto ke server Mie AI.");
            }

            // [!] 4. Panggil API SBMKU Recolor Official
            const apiRes = await axios.get(`https://api.sbmku.sbs/api/recolor`, {
                params: {
                    url: imageUrl
                },
                timeout: 60000 // Menunggu proses pewarnaan AI
            });

            const resData = apiRes.data;

            if (!resData.status || !resData.result?.url) {
                throw new Error("Server Mie AI sedang sibuk mewarnai gambar Kakak.");
            }

            const resultUrl = resData.result.url;

            // Buat Caption Aesthetic 
            const caption = `
> » *𝐑𝐄𝐂𝐎𝐋𝐎𝐑 𝐒𝐔𝐂𝐂𝐄𝐒𝐒* 

Sekarang foto jadulnya sudah berwarna dan hidup lagi! 
Gimana Kak, cantik banget kan hasilnya? 

_Pewarnaan ajaib by Mie AI_
`.trim();

            // 5. KIRIM HASIL KE USER
            await sock.sendMessage(from, { 
                image: { url: resultUrl }, 
                caption: caption
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('Recolor Error:', e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            
            sock.sendMessage(from, { 
                text: ` *Duh Maaf Kak...* \nMie gagal mewarnai fotonya: \n_${e.message}_ ` 
            }, { quoted: m });
        }
    }
};