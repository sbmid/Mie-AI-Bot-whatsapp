const axios = require('axios');

module.exports = {
    command: ['potensipenyakit', 'penyakit'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan tanggal lahir!\n\n[!] *Contoh:* ${prefix + command} 12/05/1998\nAtau: ${prefix + command} 12-05-1998` }, { quoted: m });

        let tgl, bln, thn;
        if (text.includes('/')) [tgl, bln, thn] = text.split('/');
        else if (text.includes('-')) [tgl, bln, thn] = text.split('-');
        else [tgl, bln, thn] = text.split(' ');

        if (!tgl || !bln || !thn) {
            return sock.sendMessage(m.chat, { text: `*[?]* Format tanggal salah!\n\n[!] *Contoh:* ${prefix + command} 12/05/1998` }, { quoted: m });
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/cek_potensi_penyakit?tgl=${tgl}&bln=${bln}&thn=${thn}`);
            
            if (data.status && data.data) {
                const res = data.data;
                let reply = `* CEK POTENSI PENYAKIT *\n\n`;
                reply += `*Analisa:* ${res.analisa}\n\n`;
                reply += `*Sektor:* ${res.sektor}\n\n`;
                reply += `*Elemen:*\n${res.elemen}\n\n`;
                reply += `*Catatan:*\n_${res.catatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API." }, { quoted: m });
            }
        } catch (e) {
            console.error("Potensi Penyakit Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
