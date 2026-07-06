const axios = require('axios');

module.exports = {
    command: ['china', 'cecan-china', 'rchina'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;
        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '🏮', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: "_Mencari Xiao Jie Jie tercantik..._ " }, { quoted: m });
        }

        try {
            const apiUrl = `https://api.siputzx.my.id/api/r/cecan/china`;
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer' 
            });

            if (!response.data) throw new Error("Gagal mengambil data gambar.");
            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('CecanChina Error:', e.message);
            await sock.sendMessage(from, { text: `[!] *Error:* Gagal memuat gambar. Coba lagi nanti!` }, { quoted: m });
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        }
    }
};