const axios = require('axios');

module.exports = {
    command: ['sifatusaha', 'usaha bisnis'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan tanggal lahir!\n\n[!] *Contoh:* ${prefix + command} 01/01/2000\nAtau: ${prefix + command} 01-01-2000` }, { quoted: m });

        let tgl, bln, thn;
        if (text.includes('/')) [tgl, bln, thn] = text.split('/');
        else if (text.includes('-')) [tgl, bln, thn] = text.split('-');
        else [tgl, bln, thn] = text.split(' ');

        if (!tgl || !bln || !thn) {
            return sock.sendMessage(m.chat, { text: `*[?]* Format tanggal salah!\n\n[!] *Contoh:* ${prefix + command} 01/01/2000` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/sifat_usaha_bisnis?tgl=${tgl}&bln=${bln}&thn=${thn}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `* SIFAT USAHA BISNIS *\n\n`;
                reply += `*Hari Lahir:* ${res.hari_lahir}\n\n`;
                reply += `*Sifat Usaha/Bisnis:*\n${res.usaha}\n\n`;
                reply += `*Catatan:*\n_${res.catatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Sifat Usaha Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
