const axios = require('axios');

module.exports = {
    command: ['tafsirmimpi', 'mimpi'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan kata kunci mimpi!\n\n[!] *Contoh:* ${prefix + command} bertemu` }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/tafsirmimpi?mimpi=${encodeURIComponent(text)}`);
            
            if (data.status && data.data && data.data.hasil && data.data.hasil.length > 0) {
                let reply = `*[!] TAFSIR MIMPI [!]*\nKatakunci: *${data.data.keyword}*\nTotal Hasil: ${data.data.total}\n\n`;
                
                // Batasi maksimal 15 hasil agar pesan tidak terlalu panjang
                const limit = Math.min(data.data.hasil.length, 15);
                for (let i = 0; i < limit; i++) {
                    const item = data.data.hasil[i];
                    reply += `[!] *Mimpi:* ${item.mimpi}\n`;
                    reply += `[!] *Tafsir:* ${item.tafsir}\n\n`;
                }

                if (data.data.hasil.length > 15) {
                    reply += `_Menaikkan batas hasil pencarian. Terdapat ${data.data.hasil.length - 15} hasil lainnya yang disembunyikan._\n\n`;
                }

                reply += `[!] *Solusi:*\n_${data.data.solusi.replace(/\n\s+/g, '\n')}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Tidak ditemukan tafsir untuk mimpi tersebut." }, { quoted: m });
            }
        } catch (e) {
            console.error("Tafsir Mimpi Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
