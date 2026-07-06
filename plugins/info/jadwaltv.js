const axios = require('axios');
module.exports = {
    command: ['jadwaltv'],
    category: ['info'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) {
            return sock.sendMessage(m.chat, { text: `[!] *Penggunaan:* ${prefix + command} [nama channel]\nContoh: *${prefix + command} sctv*\nChannel Populer: sctv, indosiar, rcti, trans7, transtv, antv, mnctv, gtv, dll.` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            const response = await axios.get(`https://api.siputzx.my.id/api/info/jadwaltv?channel=${encodeURIComponent(text.toLowerCase())}`);
            const res = response.data;
            if (!res.status || !res.data || res.data.length === 0) {
                return sock.sendMessage(m.chat, { text: "Gagal menemukan jadwal TV untuk channel tersebut. Pastikan nama channel sudah benar." }, { quoted: m });
            }

            let reply = `*[!] JADWAL TV: ${text.toUpperCase()} [!]*\n\n`;
            res.data.forEach(item => {
                reply += ` *${item.jam}* - ${item.acara}\n`;
            });
            
            await sock.sendMessage(m.chat, { text: reply.trim() }, { quoted: m });
            try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
        } catch (e) {
            console.error("Error Jadwal TV:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan saat memproses jadwal TV." }, { quoted: m });
        }
    }
};
