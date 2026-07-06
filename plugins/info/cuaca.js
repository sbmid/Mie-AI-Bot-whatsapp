const axios = require('axios');
module.exports = {
    command: ['cuaca'],
    category: ['info'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) {
            return sock.sendMessage(m.chat, { text: `[!] *Penggunaan:* ${prefix + command} [nama kota/daerah]\nContoh: *${prefix + command} jakarta*` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            const response = await axios.get(`https://api.siputzx.my.id/api/info/cuaca?q=${encodeURIComponent(text)}`);
            const res = response.data;
            if (!res.status || !res.data) {
                return sock.sendMessage(m.chat, { text: "Gagal menemukan informasi cuaca untuk wilayah tersebut." }, { quoted: m });
            }

            const wilayah = res.data.wilayah;
            const weatherList = res.data.weather[0].cuaca.flat();
            const current = weatherList[0]; // Prediksi sekarang / terdekat
            
            let reply = `*[i] INFO CUACA [i]*\n\n`;
            reply += `[!] *Wilayah:* ${wilayah.nama}\n`;
            reply += `[!] *Waktu:* ${current.local_datetime}\n`;
            reply += `[i] *Suhu:* ${current.t}°C\n`;
            reply += `[!] *Kelembapan:* ${current.hu}%\n`;
            reply += `[!] *Angin:* ${current.ws} km/jam\n`;
            reply += `[i] *Cuaca:* ${current.weather_desc}\n\n`;
            
            reply += `*Prediksi Berikutnya:*\n`;
            for (let i = 1; i < Math.min(4, weatherList.length); i++) {
                reply += `- ${weatherList[i].local_datetime.split(' ')[1]}: ${weatherList[i].weather_desc} (${weatherList[i].t}°C)\n`;
            }

            if (current.image) {
                await sock.sendMessage(m.chat, { 
                    image: { url: current.image },
                    caption: reply
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
            }
            try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
        } catch (e) {
            console.error("Error Cuaca:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan saat memproses data cuaca." }, { quoted: m });
        }
    }
};
