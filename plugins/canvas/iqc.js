const axios = require('axios');

module.exports = {
    command: ['iqc'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        if (!text) return sock.sendMessage(from, { text: `*[?]* Teksnya mana Kak? \n*Contoh:* ${prefix + command} Mie AI Bot WhatsApp Keren` }, { quoted: m });

        try {
            const url = `https://api.alyachan.dev/api/canvas/iqc?text=${encodeURIComponent(text)}`;
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.ALYACHAN_API_KEY}`
                }
            });

            if (response.data && response.data.status) {
                const imgUrl = response.data.data.url;
                // Kirim langsung foto tanpa caption sesuai permintaan
                await sock.sendMessage(from, { image: { url: imgUrl } }, { quoted: m });
            } else {
                await sock.sendMessage(from, { text: "[!] Gagal menggenerate gambar canvas dari server." }, { quoted: m });
            }
        } catch (error) {
            console.error("Canvas IQC Error:", error);
            await sock.sendMessage(from, { text: "[!] Terjadi kesalahan atau server API sedang down." }, { quoted: m });
        }
    }
};
