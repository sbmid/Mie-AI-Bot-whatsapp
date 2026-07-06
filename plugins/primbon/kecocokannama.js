const axios = require('axios');

module.exports = {
    command: ['kecocokannama', 'cocoknama'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan dua nama pasangan dipisah dengan '|'!\n\n[!] *Contoh:* ${prefix + command} romi | yuli` }, { quoted: m });

        let [nama1, nama2] = text.split('|').map(v => v ? v.trim() : '');

        if (!nama1 || !nama2) {
            return sock.sendMessage(m.chat, { text: `*[?]* Pastikan nama1 dan nama2 dipisah dengan tanda '|'\n\n[!] *Contoh:* ${prefix + command} romi | yuli` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `*[!] KECOCOKAN NAMA PASANGAN [!]*\n\n`;
                reply += `[!] *Nama Anda:* ${res.nama_anda}\n`;
                reply += `[!] *Nama Pasangan:* ${res.nama_pasangan}\n\n`;
                
                reply += `*Sisi Positif:* ${res.sisi_positif}\n`;
                reply += `*Sisi Negatif:* ${res.sisi_negatif}\n\n`;
                
                reply += `*Catatan:*\n_${res.catatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Kecocokan Nama Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
