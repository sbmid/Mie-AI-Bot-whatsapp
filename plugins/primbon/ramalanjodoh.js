const axios = require('axios');

module.exports = {
    command: ['ramalanjodoh', 'jodoh'],
    category: ['primbon'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Format salah!\n\n[!] *Contoh:* ${prefix + command} putu, 16/11/2007 | keyla, 01/01/2008` }, { quoted: m });

        let [pasangan1, pasangan2] = text.split('|').map(v => v ? v.trim() : '');
        if (!pasangan1 || !pasangan2) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan data kedua pasangan dipisah dengan '|'!\n\n[!] *Contoh:* ${prefix + command} putu, 16/11/2007 | keyla, 01/01/2008` }, { quoted: m });

        let [nama1, tglLahir1] = pasangan1.split(',').map(v => v ? v.trim() : '');
        let [nama2, tglLahir2] = pasangan2.split(',').map(v => v ? v.trim() : '');

        if (!nama1 || !tglLahir1 || !nama2 || !tglLahir2) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan nama dan tanggal lahir dipisah koma!\n\n[!] *Contoh:* ${prefix + command} putu, 16/11/2007 | keyla, 01/01/2008` }, { quoted: m });

        let tgl1, bln1, thn1, tgl2, bln2, thn2;
        if (tglLahir1.includes('/')) [tgl1, bln1, thn1] = tglLahir1.split('/');
        else if (tglLahir1.includes('-')) [tgl1, bln1, thn1] = tglLahir1.split('-');
        else [tgl1, bln1, thn1] = tglLahir1.split(' ');

        if (tglLahir2.includes('/')) [tgl2, bln2, thn2] = tglLahir2.split('/');
        else if (tglLahir2.includes('-')) [tgl2, bln2, thn2] = tglLahir2.split('-');
        else [tgl2, bln2, thn2] = tglLahir2.split(' ');

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/ramalanjodoh?nama1=${encodeURIComponent(nama1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&nama2=${encodeURIComponent(nama2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`);
            
            if (data.status && data.data && data.data.result) {
                const res = data.data.result;
                let reply = `*[i] RAMALAN JODOH [i]*\n\n`;
                reply += `[!] *Orang Pertama:* ${res.orang_pertama.nama} (${res.orang_pertama.tanggal_lahir})\n`;
                reply += `[!] *Orang Kedua:* ${res.orang_kedua.nama} (${res.orang_kedua.tanggal_lahir})\n\n`;
                
                reply += `*Deskripsi:*\n_${res.deskripsi}_\n\n`;
                reply += `*Hasil Ramalan:*\n`;
                res.hasil_ramalan.forEach((item, i) => {
                    reply += `${i+1}. ${item}\n\n`;
                });

                reply += `[!] *Peringatan:*\n_${data.data.peringatan}_`;

                await sock.sendMessage(m.chat, { text: reply }, { quoted: m });
                try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
            } else {
                await sock.sendMessage(m.chat, { text: "[!] Gagal memuat data dari API. Pastikan format tanggal benar." }, { quoted: m });
            }
        } catch (e) {
            console.error("Ramalan Jodoh Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses data." }, { quoted: m });
        }
    }
};
