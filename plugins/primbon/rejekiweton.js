const axios = require('axios');

module.exports = {
    command: ['rejekiweton', 'weton'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan tanggal lahir!\n\n[!] *Contoh:* ${prefix + command} 01/01/2025\nAtau: ${prefix + command} 01-01-2025` }, { quoted: m });

        let tgl, bln, thn;
        if (text.includes('/')) [tgl, bln, thn] = text.split('/');
        else if (text.includes('-')) [tgl, bln, thn] = text.split('-');
        else [tgl, bln, thn] = text.split(' ');

        if (!tgl || !bln || !thn) {
            return sock.sendMessage(m.chat, { text: `*[?]* Format tanggal salah!\n\n[!] *Contoh:* ${prefix + command} 01/01/2025` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/rejeki_hoki_weton?tgl=${tgl}&bln=${bln}&thn=${thn}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `*[!] REJEKI HOKI WETON [!]*\n\n`;
                reply += `*Hari Lahir:* ${res.hari_lahir}\n\n`;
                reply += `*Rejeki:*\n${res.rejeki}\n\n`;
                reply += `*Catatan:*\n_${res.catatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Rejeki Weton Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
