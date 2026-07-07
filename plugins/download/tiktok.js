const axios = require('axios');
const FormData = require('form-data');
const { sendMediaSafe } = require('../../lib/helper');

const API = "https://api.tikmate.app/api/lookup";
const BASE_DOWNLOAD = "https://id.tikmate.app/download";
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36";

function addUrl(list, item) {
    if (!item.url) return;
    const exists = list.some(v => v.url === item.url);
    if (!exists) list.push(item);
}

function makeDownloadUrls(token, id) {
    const result = [];
    if (!token || !id) return result;
    addUrl(result, {
        type: "video",
        quality: "hd", // HD first
        url: `${BASE_DOWNLOAD}/${token}/${id}.mp4?hd=1`
    });
    addUrl(result, {
        type: "video",
        quality: "sd",
        url: `${BASE_DOWNLOAD}/${token}/${id}.mp4`
    });
    return result;
}

function cleanMetadata(data = {}) {
    return {
        id: data.id || null,
        author_id: data.author_id || null,
        author_name: data.author_name || null,
        author_avatar: data.author_avatar || null,
        description: data.desc || null,
        cover: data.cover || null,
        dynamic_cover: data.dynamic_cover || null,
        create_time: data.create_time || null,
        like_count: data.like_count ?? null,
        comment_count: data.comment_count ?? null,
        share_count: data.share_count ?? null
    };
}

function buildResult(data = {}) {
    const result = [];
    for (const item of makeDownloadUrls(data.token, data.id)) {
        addUrl(result, item);
    }
    if (data.video_url) {
        addUrl(result, { type: "video", quality: "default", url: data.video_url });
    }
    if (data.music_url) {
        addUrl(result, { type: "audio", url: data.music_url });
    } else if (data.audio_url) {
        addUrl(result, { type: "audio", url: data.audio_url });
    }
    if (Array.isArray(data.images)) {
        for (const [index, item] of data.images.entries()) {
            const url = typeof item === "string" ? item : item?.url;
            addUrl(result, { type: "photo", url });
        }
    }
    if (Array.isArray(data.photos)) {
        for (const [index, item] of data.photos.entries()) {
            const url = typeof item === "string" ? item : item?.url;
            addUrl(result, { type: "photo", url });
        }
    }
    return result;
}

async function scrapeTikmate(url) {
    const form = new FormData();
    form.append("url", url);

    const res = await axios.post(API, form, {
        timeout: 60000,
        validateStatus: () => true,
        headers: {
            ...form.getHeaders(),
            accept: "*/*",
            origin: "https://id.tikmate.app",
            referer: "https://id.tikmate.app/",
            "user-agent": UA,
            "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
            "sec-ch-ua-mobile": "?1",
            "sec-ch-ua-platform": '"Android"',
            "sec-fetch-site": "same-site",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        }
    });

    const data = res.data || {};
    const result = buildResult(data);

    if (res.status !== 200 || data.success !== true || result.length === 0) {
        throw new Error("Gagal mengambil data dari server Tikmate.");
    }

    return {
        metadata: cleanMetadata(data),
        result: result
    };
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

            const data = await scrapeTikmate(url);
            
            const caption = `
━ ⟨ *TIKTOK DOWNLOADER* ⟩ ━

> » *Author*: ${data.metadata.author_name || 'Tidak diketahui'}
> » *Deskripsi*: ${data.metadata.description || 'Tanpa Keterangan'}
> » *Likes*: ${data.metadata.like_count || 0}
`.trim();

            const photos = data.result.filter(x => x.type === 'photo');
            const videos = data.result.filter(x => x.type === 'video');
            const audios = data.result.filter(x => x.type === 'audio');

            if (photos.length > 0) {
                await sock.sendMessage(from, { text: `[i] *TikTok Slide Terdeteksi!*\nMengurutkan ${photos.length} foto untuk dikirim...` }, { quoted: m });
                for (let i = 0; i < photos.length; i++) {
                    await sendMediaSafe(sock, from, null, photos[i].url, 'image', i === 0 ? caption : '', m);
                    await new Promise(r => setTimeout(r, 1500));
                }
            } else if (videos.length > 0) {
                // Ambil kualitas HD jika ada, jika tidak fallback ke yang pertama
                const videoUrl = videos.find(v => v.quality === 'hd')?.url || videos[0].url;
                await sendMediaSafe(sock, from, null, videoUrl, 'video', caption, m);
            }

            // Kirim audio jika ada (hanya jika video tidak ditarik, atau bisa selalu)
            if (audios.length > 0) {
                await sendMediaSafe(sock, from, null, audios[0].url, 'audio', '', m);
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error Native TT DL:", e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });

            sock.sendMessage(from, {
                text: ` *Duh Maaf Kak...* \nGagal download TikTok: ${e.message}`
            }, { quoted: m });
        }
    }
};
