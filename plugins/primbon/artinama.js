const axios = require('axios');

module.exports = {
    command: ['artinama', 'arti'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan nama!\n\n[!] *Contoh:* ${prefix + command} azrial` }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/artinama?nama=${encodeURIComponent(text)}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `*[i] ARTI NAMA [i]*\n\n`;
                reply += `[!] *Nama:* ${res.nama}\n\n`;
                reply += `[!] *Arti:*\n${res.arti}\n\n`;
                reply += `_${res.catatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data arti nama dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Arti Nama Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
