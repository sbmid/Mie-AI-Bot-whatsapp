const axios = require('axios');

/**
 * TikTok Downloader Scraper
 * Source logic from ScraperCode
 */
async function tiktokdl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            // Menggunakan API tikwm (Metode paling stabil saat ini)
            const res = await axios.post('https://www.tikwm.com/api/', new URLSearchParams({
                url: url,
                count: 12,
                cursor: 0,
                web: 1
            }));

            const data = res.data.data;
            if (!data) return reject("Gagal mengambil data TikTok. Pastikan link benar!");

            const result = {
                title: data.title || "TikTok Video",
                author: data.author.nickname,
                view: data.play_count,
                comment: data.comment_count,
                share: data.share_count,
                // Pastikan URL selalu absolute (menghindari error ENOENT Windows)
                video: data.play.startsWith('http') ? data.play : 'https://www.tikwm.com' + data.play,
                audio: data.music.startsWith('http') ? data.music : 'https://www.tikwm.com' + data.music
            };
            resolve(result);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = { tiktokdl };