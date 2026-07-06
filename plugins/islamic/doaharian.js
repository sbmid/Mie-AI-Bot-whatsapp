const axios = require('axios');

module.exports = {
    command: ['doaharian'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const args = text.trim().split(' ');
        const num = args[0];

        const teks = `Penggunaan *${prefix}${command} 1*
\`List Doa Harian:\`
1. Doa Sebelum Makan
2. Doa Sesudah Makan
3. Doa Sesudah Minum
4. Doa Ketika Makan Lupa Membaca Doa
5. Doa Sebelum Tidur
6. Doa Ketika Mimpi Buruk
7. Doa Ketika Mendapat Mimpi Baik
8. Doa Bangun Tidur
9. Doa Masuk Kamar Mandi Atau Toilet
10. Doa Istinja
11. Doa Keluar Kamar Mandi Atau Toilet
12. Doa Menjelang Sholat Shubuh
13. Doa Menyambut Pagi hari
14. Doa Menyambut Sore Hari
15. Doa Ketika Bercermin
16. Doa Masuk Rumah
17. Doa Keluar Rumah / Doa Bepergian
18. Doa Memakai Pakaian
19. Doa Memakai Pakaian Baru
20. Doa Melepas Pakaian
21. Doa Memohon Ilmu Yang Bermanfaat
22. Doa Sebelum Belajar
23. Doa Sesudah Belajar
24. Doa Berpergian
25. Doa Naik Kendaraan
26. Doa Naik Kapal
27. Doa Ketika Sampai di Tempat Tujuan
28. Doa Ketika Menuju Masjid
29. Doa Masuk Masjid
30. Doa Keluar Masjid
31. Doa Akan Membaca Al-Qur'an
32. Doa Setelah Membaca Al-Qur'an
33. Doa Niat Wudhu
34. Doa Setelah Wudhu
35. Doa akan Mandi`;

        if (!num || isNaN(num) || num < 1 || num > 35) {
            return sock.sendMessage(from, { text: teks }, { quoted: m });
        }

        try {
            const res = await axios.get('https://raw.githubusercontent.com/dcode-al/database/refs/heads/main/Islami/doaharian.json');
            const data = res.data.result.data[num];
            
            if (!data) return sock.sendMessage(from, { text: '[!] Doa tidak ditemukan.' }, { quoted: m });

            const toks = `Title: ${data.title}\nArabic: ${data.arabic}\nLatin: ${data.latin}\nArti: ${data.translation}`;
            await sock.sendMessage(from, { text: toks }, { quoted: m });
        } catch (e) {
            console.error(e);
            sock.sendMessage(from, { text: '[!] Terjadi kesalahan saat mengambil doa harian.' }, { quoted: m });
        }
    }
};
