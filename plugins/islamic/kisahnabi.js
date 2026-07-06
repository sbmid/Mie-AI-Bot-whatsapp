const axios = require('axios');

module.exports = {
    command: ['kisahnabi'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        if (!text) {
            return sock.sendMessage(from, { text: `Masukkan nama nabi!\n*Contoh:* ${prefix + command} adam` }, { quoted: m });
        }

        try {
            const nabi = text.toLowerCase().trim();
            const res = await axios.get(`https://raw.githubusercontent.com/ZeroChanBot/Api-Freee/a9da6483809a1fbf164cdf1dfbfc6a17f2814577/data/kisahNabi/${nabi}.json`);
            const kisah = res.data;

            const hasil = `*[!] Kisah Nabi ${kisah.name} *

- [!] *Tahun Lahir:* ${kisah.thn_kelahiran || "-"}
-  *Tempat Lahir:* ${kisah.tmp || "-"}
- [~] *Usia:* ${kisah.usia || "-"}

[!] *Perjalanan Hidup / Kisah:*
${kisah.description || "-"}`;

            await sock.sendMessage(from, { text: hasil }, { quoted: m });
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
               return sock.sendMessage(from, { text: `*Kisah Nabi '${text}' tidak ditemukan!*\nCoba nama nabi lain, pastikan huruf kecil semua!` }, { quoted: m });
            }
            sock.sendMessage(from, { text: "[!] Terjadi kesalahan saat mengambil kisah nabi." }, { quoted: m });
        }
    }
};
