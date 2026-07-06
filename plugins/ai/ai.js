const axios = require('axios');

module.exports = {
    command: ['ai', 'gpt', 'chatgpt', 'gpt4'],
    category: ['ai'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, {
            text: `*[?]* Tanyakan sesuatu ke AI!\n\n*Contoh:* ${prefix + command} Apa itu machine learning?`
        }, { quoted: m });

        const from = m.chat;
        const sender = m.sender;
        const MB = require('baileys-mbuilder');

        // Reaksi loading
        try { await sock.sendMessage(from, { react: { text: '⏳', key: m.key } }); } catch (e) { }

        try {
            const alyachanKey = process.env.ALYACHAN_API_KEY;

            if (!alyachanKey) {
                return sock.sendMessage(from, {
                    text: "⚠️ API Key (ALYACHAN_API_KEY) tidak ditemukan di file .env!"
                }, { quoted: m });
            }

            // Injeksi System Prompt
            const systemPrompt = `[SYSTEM INFO] Kamu adalah Mie AI. Jawablah pesan dengan ramah. Kamu DAPAT MENGATUR TAMPILAN PESAN dengan menggunakan "tag" berikut di dalam teks jawabanmu JIKA kamu mau (gunakan hanya jika dirasa pas):
- Untuk mengatur judul pesan, gunakan tag: [TITLE: Tulis Judul Disini]
- Untuk menyisipkan gambar utama, gunakan tag: [IMAGE: url_gambar_valid]
- Untuk memberikan tip/info dengan highlight kuning, gunakan tag: [TIP: isi tip singkat disini]
- Untuk merekomendasikan keyword lanjutan, gunakan tag: [SUGGEST: #keyword1, #keyword2]
PENTING: Jangan jelaskan fungsi tag ini ke user. Cukup letakkan tag di mana saja di dalam jawabanmu. Pertanyaan user:\n\n`;

            const url = `https://api.alyachan.dev/api/ai/gpt4?prompt=${encodeURIComponent(systemPrompt + text)}`;

            const { data } = await axios.get(url, {
                headers: { "Authorization": `Bearer ${alyachanKey}` },
                timeout: 30000
            });

            if (!data.status || !data.data || !data.data.content) {
                return sock.sendMessage(from, {
                    text: "❌ Gagal memuat respon dari AI."
                }, { quoted: m });
            }

            let aiContent = data.data.content;
            const related = data.data.related || [];
            const suggestions = data.data.sugesstion || []; // typo dari API (sugesstion)

            // Fake reply seolah dari sistem AI verified
            const fakeReply = {
                key: {
                    fromMe: false,
                    participant: `13135550002@s.whatsapp.net`,
                    ...(m.isGroup ? { remoteJid: "status@broadcast" } : {})
                },
                message: {
                    extendedTextMessage: { text: `🤖 AI GPT-4 Processing...` }
                }
            };

            // === EKSTRAK TAG UI DARI JAWABAN AI ===
            let aiTitle = `🤖 ${global.botName || 'Mie AI'} — GPT-4`;
            let aiTips = [`Pertanyaan: ${text.length > 80 ? text.substring(0, 80) + '...' : text}`];
            let aiSuggests = [];

            // Ekstrak TITLE
            aiContent = aiContent.replace(/\[TITLE:\s*(.*?)\]/ig, (match, title) => {
                aiTitle = title.trim();
                return ""; // hapus tag dari teks
            });

            // Ekstrak TIP
            aiContent = aiContent.replace(/\[TIP:\s*(.*?)\]/ig, (match, tip) => {
                aiTips.push(tip.trim());
                return "";
            });

            // Ekstrak SUGGEST
            aiContent = aiContent.replace(/\[SUGGEST:\s*(.*?)\]/ig, (match, suggests) => {
                aiSuggests = suggests.split(',').map(s => s.trim());
                return "";
            });

            // Cari kemungkinan ada gambar utama dari respons API
            let aiImage = null;
            if (suggestions.length > 0) {
                const s0 = suggestions[0];
                aiImage = s0.image || s0.thumbnail || s0.image_url || s0.meta_data?.image;
            }

            // Ekstrak IMAGE dari tag buatan AI (menimpa gambar dari API jika ada)
            aiContent = aiContent.replace(/\[IMAGE:\s*(.*?)\]/ig, (match, url) => {
                aiImage = url.trim();
                return "";
            });

            // === Bangun pesan AIRich ===
            const mb = new MB.AIRich(sock);

            mb.setTitle(aiTitle);
            aiTips.forEach(tip => mb.addTip(tip));

            if (aiImage) {
                mb.addImage(aiImage);
            }

            // Ekstrak blok kode markdown dari jawaban AI
            const codeBlocks = [];
            let cleanText = aiContent.replace(/```([\w-]*)\s*?\n([\s\S]*?)```/g, (match, lang, code) => {
                codeBlocks.push({ lang: lang || 'text', code: code.trim() });
                return `\n\n*(👇 Kode ${lang || 'snippet'} terlampir di bawah)*\n\n`;
            });

            // Konten jawaban AI teks biasa
            mb.addText(cleanText.trim());

            // Tambahkan semua blok kode yang diekstrak menggunakan fitur addCode AIRich
            codeBlocks.forEach(cb => mb.addCode(cb.lang, cb.code));

            // Kalau ada sumber/referensi dari API, jadikan banner produk
            if (suggestions.length > 0) {
                const validProducts = [];

                for (let i = 0; i < Math.min(suggestions.length, 5); i++) {
                    const s = suggestions[i];
                    if (s.name && s.url) {
                        const domain = s.meta_data?.domain_name || new URL(s.url).hostname;
                        
                        // Default thumbnail jika API tidak punya gambar untuk produk ini
                        const img = s.image || s.thumbnail || s.image_url || s.meta_data?.image || 'https://i.pinimg.com/736x/7e/59/3c/7e593c52ec3e79afb310db7600acc0b5.jpg';
                        
                        validProducts.push({
                            title: s.name.length > 50 ? s.name.substring(0, 50) + '...' : s.name,
                            brand: domain,
                            price: 'Klik untuk lihat',
                            sale_price: '0',
                            image: img,
                            url: s.url
                        });
                    }
                }

                if (validProducts.length > 0) {
                    mb.addProduct(validProducts);
                }
            }

            // Kalau ada related questions, tampilkan sebagai suggest chips (gabung dengan tag [SUGGEST] AI)
            let finalSuggests = [...aiSuggests];
            if (related.length > 0) {
                finalSuggests.push(...related.map(r => r.length > 40 ? r.substring(0, 40) + '...' : r));
            }
            if (finalSuggests.length === 0) {
                finalSuggests = ['#AI', '#GPT4', `#${global.botName || 'MieAI'}`];
            }
            
            // Filter unique & maks 5 chip
            finalSuggests = [...new Set(finalSuggests)].slice(0, 5);
            mb.addSuggest(finalSuggests);

            await mb.send(from, { quoted: fakeReply });

            // Reaksi success
            try { await sock.sendMessage(from, { react: { text: '✅', key: m.key } }); } catch (e) { }

        } catch (error) {
            console.error("AI GPT-4 Error:", error.message);
            await sock.sendMessage(from, {
                text: `❌ Error saat memproses AI: ${error.message}`
            }, { quoted: m });
            throw error; // Lempar ke error tracker global
        }
    }
};
