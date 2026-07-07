const axios = require('axios');
const { sendMediaSafe, fetchBuffer } = require('../../lib/helper');

async function scrapeSiputZx(url) {
    let result = null;
    let data = null;

    try {
        const res1 = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
        if (res1.data && res1.data.status) {
            data = res1.data.data;
            result = {
                author: data.author || 'Tidak diketahui',
                desc: data.title || 'Tanpa Keterangan',
                videos: [],
                images: [],
                audio: null
            };

            if (data.media && Array.isArray(data.media)) {
                for (let m of data.media) {
                    if (m.type === 'video_hd' || m.quality === 'HD') {
                        result.videos.unshift(m.url); // HD di awal
                    } else if (m.type === 'video' || m.quality === 'SD') {
                        result.videos.push(m.url);
                    } else if (m.type === 'image') {
                        result.images.push(m.url);
                    }
                }
            }
            if (data.images && Array.isArray(data.images)) {
                result.images = [...result.images, ...data.images];
            }
        }
    } catch (e) {
        console.error("API 1 Error:", e.message);
    }

    if (!result || (result.videos.length === 0 && result.images.length === 0)) {
        try {
            const res2 = await axios.get(`https://api.siputzx.my.id/api/d/tiktok/v2?url=${encodeURIComponent(url)}`);
            if (res2.data && res2.data.status) {
                data = res2.data.data;
                result = {
                    author: data.author_nickname || 'Tidak diketahui',
                    desc: data.text || 'Tanpa Keterangan',
                    likes: data.like_count,
                    videos: [],
                    images: [],
                    audio: data.music_link || null
                };

                if (data.no_watermark_link_hd) result.videos.push(data.no_watermark_link_hd);
                if (data.no_watermark_link) result.videos.push(data.no_watermark_link);
                
                if (data.slides && Array.isArray(data.slides)) {
                    result.images = data.slides;
                } else if (data.images && Array.isArray(data.images)) {
                    result.images = data.images;
                }
            }
        } catch (e) {
            console.error("API 2 Error:", e.message);
        }
    }

    if (!result || (result.videos.length === 0 && result.images.length === 0)) {
        throw new Error("Gagal mengambil media. Pastikan link valid.");
    }

    return result;
}

module.exports = {
    command: ['tt', 'tiktok', 'ttdl'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.key.remoteJid;
        const url = args[0];

        if (!url) {
            return sock.sendMessage(from, {
                text: ` *Format Salah Kakak Sayang...* \nContoh: *${prefix + command}* https://vt.tiktok.com/xxxx`
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            const data = await scrapeSiputZx(url);
            
            const caption = `
━ ⟨ *TIKTOK DOWNLOADER* ⟩ ━

> » *Author*: ${data.author || 'Tidak diketahui'}
> » *Deskripsi*: ${data.desc || 'Tanpa Keterangan'}
`.trim() + (data.likes ? `\n> » *Likes*: ${data.likes}` : '');

            if (data.images && data.images.length > 0) {
                await sock.sendMessage(from, { text: `[i] *TikTok Slide Terdeteksi!*\nMengurutkan ${data.images.length} foto untuk dikirim...` }, { quoted: m });
                for (let i = 0; i < data.images.length; i++) {
                    await sendMediaSafe(sock, from, null, data.images[i], 'image', i === 0 ? caption : '', m);
                    await new Promise(r => setTimeout(r, 1500));
                }
            } else if (data.videos && data.videos.length > 0) {
                let vBuffer = await fetchBuffer(data.videos[0]).catch(() => null);
                await sendMediaSafe(sock, from, vBuffer, data.videos[0], 'video', caption, m);
            }

            if (data.audio) {
                let aBuffer = await fetchBuffer(data.audio).catch(() => null);
                await sendMediaSafe(sock, from, aBuffer, data.audio, 'audio', '', m);
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error TT DL:", e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });

            await sock.sendMessage(from, {
                text: ` *Duh Maaf Kak...* \nGagal download TikTok: ${e.message}`
            }, { quoted: m });
        }
    }
};
