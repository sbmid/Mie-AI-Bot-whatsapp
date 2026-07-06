const axios = require('axios');
const cheerio = require('cheerio');

async function pinterestdl(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
                }
            });
            const $ = cheerio.load(data);
            const tag = $('script[type="application/ld+json"]').html();
            const json = JSON.parse(tag);
            
            if (!json) return reject("Gagal mengambil data, pastikan link valid!");
            
            const result = {
                title: json.name || "Pinterest Media",
                type: json['@type'],
                image: json.image,
                video: json.video ? json.video[0]?.contentUrl : null
            };
            resolve(result);
        } catch (e) {
            reject(e);
        }
    });
}

// Export fungsinya
module.exports = { pinterestdl };