const axios = require('axios');
module.exports = {
    command: ['bmkg', 'gempa'],
    category: ['info'],
    handler: async (sock, m) => {
        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            const response = await axios.get('https://api.siputzx.my.id/api/info/bmkg');
            const res = response.data;
            if (!res.status) {
                return sock.sendMessage(m.chat, { text: "Gagal memuat data BMKG." }, { quoted: m });
            }

            const gempaInfo = res.data.auto.Infogempa.gempa;
            const dirasakan = res.data.dirasakan.Infogempa.gempa[0] || {};
            
            let reply = `* INFO GEMPA BMKG *\n\n`;
            reply += `[!] *Tanggal:* ${gempaInfo.Tanggal}\n`;
            reply += ` *Jam:* ${gempaInfo.Jam}\n`;
            reply += `[!] *Koordinat:* ${gempaInfo.Lintang}, ${gempaInfo.Bujur}\n`;
            reply += `[!] *Magnitude:* ${gempaInfo.Magnitude} SR\n`;
            reply += `[!] *Kedalaman:* ${gempaInfo.Kedalaman}\n`;
            reply += `[!] *Wilayah:* ${gempaInfo.Wilayah}\n`;
            reply += `[!] *Potensi:* ${gempaInfo.Potensi}\n`;
            if (gempaInfo.Dirasakan) reply += ` *Dirasakan:* ${gempaInfo.Dirasakan}\n`;
            
            if (gempaInfo.downloadShakemap) {
                await sock.sendMessage(m.chat, { 
                    image: { url: gempaInfo.downloadShakemap },
                    caption: reply
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
            }
            try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
        } catch (e) {
            console.error("Error BMKG:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
