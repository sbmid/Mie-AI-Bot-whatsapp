const axios = require('axios');

module.exports = {
    command: ['thailand', 'cecan-thailand', 'rthailand'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '[!]', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: "_Sawasdee Ka! Sedang mencari foto tercantik dari Thailand..._ 🇹🇭" }, { quoted: m });
        }

        try {
            const apiUrl = `https://api.siputzx.my.id/api/r/cecan/thailand`;
            
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer' 
            });

            if (!response.data) throw new Error("Data gambar kosong.");

            await sock.sendMessage(from, { 
                image: Buffer.from(response.data)
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('CecanThailand Error:', e.message);
            await sock.sendMessage(from, { text: `[!] *Error:* Gagal memuat gambar. API sedang penuh atau down.` }, { quoted: m });
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        }
    }
};