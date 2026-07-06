const axios = require('axios');

module.exports = {
    command: ['zodiak'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        let zodiakList = `* DAFTAR ZODIAK *\n\n`;
        zodiakList += `Pilih salah satu zodiak berdasarkan tanggal lahirmu:\n\n`;
        zodiakList += `1. *Aries* (21 Maret - 19 April)\n`;
        zodiakList += `2. *Taurus* (20 April - 20 Mei)\n`;
        zodiakList += `3. *Gemini* (21 Mei - 20 Juni)\n`;
        zodiakList += `4. *Cancer* (21 Juni - 22 Juli)\n`;
        zodiakList += `5. *Leo* (23 Juli - 22 Agustus)\n`;
        zodiakList += `6. *Virgo* (23 Agustus - 22 September)\n`;
        zodiakList += `7. *Libra* (23 September - 22 Oktober)\n`;
        zodiakList += `8. *Scorpio* (23 Oktober - 21 November)\n`;
        zodiakList += `9. *Sagitarius* (22 November - 21 Desember)\n`;
        zodiakList += `10. *Capricorn* (22 Desember - 19 Januari)\n`;
        zodiakList += `11. *Aquarius* (20 Januari - 18 Februari)\n`;
        zodiakList += `12. *Pisces* (19 Februari - 20 Maret)\n\n`;
        zodiakList += `[!] *Cara Penggunaan:*\nKetik *${prefix + command} [nama zodiak]*\nContoh: *${prefix + command} gemini*`;

        if (!text) {
            return sock.sendMessage(m.chat, { text: zodiakList }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${encodeURIComponent(text)}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `* RAMALAN ZODIAK: ${text.toUpperCase()} *\n\n`;
                reply += `*Nomor Keberuntungan:* ${res.nomor_keberuntungan}\n`;
                reply += `*Aroma Keberuntungan:* ${res.aroma_keberuntungan}\n`;
                reply += `*Planet:* ${res.planet_yang_mengitari}\n`;
                reply += `*Bunga:* ${res.bunga_keberuntungan}\n`;
                reply += `*Warna:* ${res.warna_keberuntungan}\n`;
                reply += `*Batu:* ${res.batu_keberuntungan}\n`;
                reply += `*Elemen:* ${res.elemen_keberuntungan}\n\n`;
                reply += `*Pasangan Zodiak/Ramalan:*\n${res.pasangan_zodiak.replace(/Zodiak\s/g, 'Zodiak\n')}\n\n`;
                reply += `*Sifat & Karakter:*\n${res.zodiak.replace(res.pasangan_zodiak, '')}`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: `[!] Zodiak tidak ditemukan atau gagal memuat data.\n\n${zodiakList}` }, { quoted: m });
            }
        } catch (e) {
            console.error("Zodiak Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
