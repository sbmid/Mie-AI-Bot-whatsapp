const axios = require('axios');

module.exports = {
    command: ['waifu', 'rwaifu'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '[!]', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: "_Sedang mencari waifu idamanmu..._ " }, { quoted: m });
        }

        try {
            const apiUrl = `https://api.siputzx.my.id/api/r/waifu`;
            
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer' 
            });

            if (!response.data) throw new Error("Gagal mengambil data waifu.");

            await sock.sendMessage(from, { 
                image: Buffer.from(response.data), 
                caption: `[!] *RANDOM WAIFU ANIME* [!]\n\nIni dia waifu pilihan Mie AI buat kamu, Bestie! ` 
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('Waifu Error:', e.message);
            await sock.sendMessage(from, { text: `[!] *Error:* Gagal memuat waifu. API sedang penuh atau down.` }, { quoted: m });
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        }
    }
};