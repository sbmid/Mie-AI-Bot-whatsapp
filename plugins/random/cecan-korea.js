const axios = require('axios');

module.exports = {
    command: ['korea', 'cecan-korea', 'rkorea'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;

        if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '🇰🇷', key: m.key } });

        try {
            const apiUrl = `https://api.siputzx.my.id/api/r/cecan/korea`;
            
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('CecanKorea Error:', e.message);
            await sock.sendMessage(from, { text: `[!] *Error:* Gagal memuat gambar. API sedang sibuk.` }, { quoted: m });
        }
    }
};