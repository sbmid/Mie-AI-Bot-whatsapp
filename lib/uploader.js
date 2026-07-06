const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

/**
 * MEI AI - Uguu.se Uploader
 * Pengganti Catbox yang lagi maintenance
 */
const uploader = async (buffer) => {
    try {
        const { ext } = await fromBuffer(buffer);
        let form = new FormData();
        form.append('files[]', buffer, { 
            filename: `sbm-media.${ext}`, 
            contentType: `image/${ext}` 
        });

        const res = await axios.post('https://uguu.se/upload.php', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // Balikan: https://u.uguu.se/xxxx.png
        return res.data.files[0].url;
    } catch (e) {
        console.error("Uguu Uploader Error:", e.message);
        throw new Error('Gagal upload ke Uguu.se');
    }
};

module.exports = { uploader };