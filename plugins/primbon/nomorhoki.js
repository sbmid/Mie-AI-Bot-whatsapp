const axios = require('axios');

module.exports = {
    command: ['nomorhoki'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan nomor HP!\n\n[!] *Contoh:* ${prefix + command} 6285658939117` }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/nomorhoki?phoneNumber=${encodeURIComponent(text)}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `*[!] CEK NOMOR HOKI [!]*\n\n`;
                reply += `[!] *Nomor:* ${res.nomor}\n\n`;
                
                reply += `[!] *Angka Bagua Shuzi: ${res.angka_bagua_shuzi.value}%*\n`;
                reply += `_${res.angka_bagua_shuzi.description}_\n\n`;
                
                reply += `[!] *Energi Positif: ${res.energi_positif.total}%*\n`;
                reply += `- Kekayaan: ${res.energi_positif.details.kekayaan}\n`;
                reply += `- Kesehatan: ${res.energi_positif.details.kesehatan}\n`;
                reply += `- Cinta: ${res.energi_positif.details.cinta}\n`;
                reply += `- Kestabilan: ${res.energi_positif.details.kestabilan}\n`;
                reply += `_${res.energi_positif.description}_\n\n`;

                reply += `[!] *Energi Negatif: ${res.energi_negatif.total}%*\n`;
                reply += `- Perselisihan: ${res.energi_negatif.details.perselisihan}\n`;
                reply += `- Kehilangan: ${res.energi_negatif.details.kehilangan}\n`;
                reply += `- Malapetaka: ${res.energi_negatif.details.malapetaka}\n`;
                reply += `- Kehancuran: ${res.energi_negatif.details.kehancuran}\n`;
                reply += `_${res.energi_negatif.description}_\n\n`;

                reply += `[!] *Analisis:*\n${res.analisis.description}`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Nomor Hoki Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
