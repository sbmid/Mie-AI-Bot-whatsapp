const axios = require('axios');

module.exports = {
    command: ['meta', 'metaai', 'meta'],
    category: ['ai'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Tanyakan sesuatu ke Meta AI!\n\n[!] *Contoh:* ${prefix + command} Siapa presiden indonesia?` }, { quoted: m });

        const from = m.chat;
        const sender = m.sender;

        // Reaksi loading
        try { await sock.sendMessage(from, { react: { text: '⏳', key: m.key } }); } catch (e) { }

        try {
            // Fake reply seakan dari WhatsApp Meta AI verified
            const fakeReply = {
                key: {
                    fromMe: false,
                    participant: `867051314767696@s.whatsapp.net`,
                    ...(m.isGroup ? { remoteJid: "status@broadcast" } : {})
                },
                message: {
                    conversation: "Meta AI"
                }
            };

            let aiResponse = "";
            try {
                // Endpoint AlyaChan Meta AI
                const alyachanKey = process.env.ALYACHAN_API_KEY;

                if (!alyachanKey) {
                    return sock.sendMessage(from, { text: "[!] Sistem terhenti: API Key (ALYACHAN_API_KEY) tidak ditemukan di file .env!" }, { quoted: m });
                }

                const url = `https://api.alyachan.dev/api/ai/meta?prompt=${encodeURIComponent(text)}`;

                const { data } = await axios.get(url, {
                    headers: {
                        "Authorization": `Bearer ${alyachanKey}`
                    }
                });

                if (data.status && data.data && data.data.content) {
                    aiResponse = data.data.content;
                } else {
                    aiResponse = "Gagal memuat respon dari Meta AI.";
                }
            } catch (err) {
                console.error("AlyaChan Meta AI Error:", err.message);
                aiResponse = "Maaf, API Meta AI sedang mengalami gangguan jaringan saat ini.";
            }

            if (!aiResponse) aiResponse = "Tidak dapat memuat jawaban.";

            // Kirim balasan dengan tag tersembunyi
            await sock.sendMessage(from, {
                text: aiResponse,
                mentions: [sender] // Tag disembunyikan
            }, { quoted: fakeReply }); // Menggunakan quote centang biru

            // Reaksi success
            try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); } catch (e) { }

        } catch (error) {
            console.error("Meta AI Error:", error);
            await sock.sendMessage(from, { text: "[!] Oops! Terjadi kesalahan internal saat memproses jawaban AI." }, { quoted: m });
        }
    }
};
