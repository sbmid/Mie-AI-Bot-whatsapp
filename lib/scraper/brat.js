const axios = require('axios');

/**
 * Brat Generator Scraper
 */
async function createBrat(text) {
    try {
        // Kita gunakan API siputzx untuk generate gambar brat
        const url = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`;
        
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000 
        });

        return Buffer.from(response.data);
    } catch (e) {
        throw new Error(`Gagal membuat Brat: ${e.message}`);
    }
}

module.exports = { createBrat };