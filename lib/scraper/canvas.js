const axios = require('axios');

/**
 * Canvas e-KTP Generator
 * Mengubah data teks menjadi gambar KTP
 */
async function createKTP(obj) {
    try {
        const baseUrl = 'https://api.siputzx.my.id/api/canvas/ektp';
        
        // Menggunakan URLSearchParams agar semua karakter (spasi, tanda baca) aman di URL
        const params = new URLSearchParams(obj).toString();
        const fullUrl = `${baseUrl}?${params}`;

        // Kita ambil hasilnya sebagai Buffer (gambar mentah)
        const response = await axios.get(fullUrl, {
            responseType: 'arraybuffer'
        });

        return Buffer.from(response.data);
    } catch (e) {
        throw new Error("Gagal membuat Canvas KTP. Pastikan API sedang online.");
    }
}

module.exports = { createKTP };