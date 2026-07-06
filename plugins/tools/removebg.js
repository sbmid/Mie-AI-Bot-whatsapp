const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader'); // Menggunakan uploader internal Kakak

/**
 * MIE AI - Remove Background 
 * Status: Powered by SBMKU AI Engine (Official Mie AI) 
 * Aura: Sweet, Fast & Transparent 
 */
module.exports = {
    command: ['removebg', 'removbg', 'rbg', 'nobg'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;

        // [!] 1. Deteksi Pesan Gambar (Support Quoted & ViewOnce)
        let quoted = m.quoted ? m.quoted : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        if (baseMsg?.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg?.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        
        const isImage = !!(baseMsg?.imageMessage || (baseMsg?.msg || baseMsg)?.mimetype?.includes('image'));

        if (!isImage) {
            return sock.sendMessage(from, { 
                text: ` *Halo Kakak Sayang...* \n\nMie butuh foto buat dihapus background-nya nih. Balas atau kirim foto dengan caption *${prefix + command}* ya! ` 
            }, { quoted: m });
        }

        // Reaksi Proses [~]
        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        } else {
            await sock.sendMessage(from, { text: `_Sedang menyulap background-nya... Mohon tunggu, Kak! _` }, { quoted: m });
        }

        try {
            // 2. Download Media ke Buffer
            const target = m.quoted ? m.quoted : baseMsg;
            const messageData = target.imageMessage || target.msg || target;
            const stream = await downloadContentFromMessage(messageData, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Upload via uploader untuk dapatkan URL
            const imageUrl = await uploader(buffer); 
            
            if (!imageUrl || !imageUrl.startsWith('http')) {
                throw new Error("Gagal mengunggah foto ke server Mie AI.");
            }

            // [!] 4. Panggil API SBMKU AI Engine Official
            const apiRes = await axios.get(`https://api.sbmku.sbs/api/removbg`, {
                params: {
                    url: imageUrl
                },
                timeout: 30000 
            });

            const resData = apiRes.data;

            if (!resData.status || !resData.result?.url) {
                throw new Error("Server Mie AI sedang sibuk, coba lagi nanti ya!");
            }

            const resultUrl = resData.result.url;

            // 5. KIRIM HASIL KE USER
            await sock.sendMessage(from, { 
                image: { url: resultUrl }, 
                caption: ` *REMOVE BG SUCCESS* \n\nTadaaa! Sekarang fotonya sudah transparan dan siap dijadiin stiker atau diedit lagi! \n\n_Background removed by Mie AI_` 
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('RemoveBG Error:', e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            
            sock.sendMessage(from, { 
                text: ` *Duh Maaf Kak...* \nMie gagal menghapus background-nya: \n_${e.message}_ ` 
            }, { quoted: m });
        }
    }
};