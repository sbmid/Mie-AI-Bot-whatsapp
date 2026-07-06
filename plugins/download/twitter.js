const axios = require('axios');
const { sendMediaSafe } = require('../../lib/helper');

module.exports = {
    command: ['tw', 'twdl', 'twitter', 'x'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `Format salah! [!]\nContoh: *${prefix + command}* https://x.com/username/status/xxxx` }, { quoted: m });

        try {
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            const response = await axios.get(`https://api.siputzx.my.id/api/d/ssstwiter?url=${encodeURIComponent(text)}`, { timeout: 25000 });
            const res = response.data;

            if (!res.status || !res.data || !res.data.url) {
                return sock.sendMessage(m.chat, { text: "[!] Gagal mengambil data dari Twitter. Pastikan link valid!" }, { quoted: m });
            }

            const videoList = res.data.url;
            const bestVideo = videoList.sort((a, b) => b.quality - a.quality)[0];
            const title = res.data.meta?.title || "Twitter Video";
            const caption = ` *Title:* ${title}\n[!] *Quality:* ${bestVideo.subname}p\n\n[i] _Success Download Twitter Video_`;

            // Download buffer, fallback ke URL jika besar
            let videoBuffer = null;
            try {
                const getMedia = await axios.get(bestVideo.url, { 
                    responseType: 'arraybuffer',
                    timeout: 60000 
                });
                videoBuffer = Buffer.from(getMedia.data);
            } catch (dlErr) {
                console.warn('[Twitter] Download buffer gagal, pakai URL langsung:', dlErr.message);
            }

            await sendMediaSafe(sock, m.chat, videoBuffer, bestVideo.url, 'video', caption, m);

            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error Twitter DL:", e);
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan atau timeout saat mendownload video X/Twitter." }, { quoted: m });
        }
    }
};