const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    command: ["ainsfw", "nsfwai", "aiimage18"],
    category: ["ai"],
    handler: async (sock, msg, { text, command }) => {
        try {
            const sender = msg.sender;
            let filePath = path.join(__dirname, '../../database/nsfw_access.json');
            let data = { users: [] };
            
            if (fs.existsSync(filePath)) {
                data = JSON.parse(fs.readFileSync(filePath));
            }

            const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));
            const hasAccess = isOwner || data.users.includes(sender);

            if (!hasAccess) {
                return sock.sendMessage(msg.chat, {
                    text: `🔞 *Akses Ditolak*\n\n❌ Maaf, fitur ini hanya tersedia untuk orang yang diizinkan oleh Owner.\nSilakan hubungi Owner untuk meminta akses.`
                }, { quoted: msg });
            }

            if (!text || text.trim().length === 0) {
                return sock.sendMessage(msg.chat, {
                    text: `🔞 *AI NSFW Image Generator*\n\n📝 *Penggunaan:*\n.${command} <prompt>\n\n📌 *Contoh:*\n.${command} beautiful anime girl\n\n⚠️ *Catatan:*\n• Hanya untuk 18+\n• Penggunaan di bawah pengawasan Owner`
                }, { quoted: msg });
            }

            const prompt = text.trim();

            await sock.sendMessage(msg.chat, {
                text: `⏳ *MIE AI sedang memproses...*\n\nPrompt: ${prompt}\n\nMohon tunggu sebentar...`
            }, { quoted: msg });

            try {
                const encodedPrompt = encodeURIComponent(prompt);
                const apiUrl = `https://kyzzzneko-xvz1.vercel.app/api/ai/nsfwgen?q=${encodedPrompt}`;

                const apiResponse = await axios.get(apiUrl, {
                    timeout: 120000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (!apiResponse.data || !apiResponse.data.result || !apiResponse.data.result.images || apiResponse.data.result.images.length === 0) {
                    return sock.sendMessage(msg.chat, { text: `❌ MIE AI gagal mendapatkan gambar. Coba lagi nanti.` }, { quoted: msg });
                }

                const imageUrl = apiResponse.data.result.images[0];

                return sock.sendMessage(msg.chat, {
                    image: { url: imageUrl },
                    caption: `✅ *Berhasil Dibuat!*\n\n📝 *Prompt:*\n${prompt}\n\n👤 *User:* @${sender.split('@')[0]}\n🎨 *Powered by MIE AI*\n`,
                    mentions: [sender]
                }, { quoted: msg });

            } catch (apiError) {
                return sock.sendMessage(msg.chat, { text: `❌ *Error Generate Image:* ${apiError.message}` }, { quoted: msg });
            }
        } catch (error) {
            return sock.sendMessage(msg.chat, { text: `❌ *Error Sistem:* ${error.message}` }, { quoted: msg });
        }
    }
};
