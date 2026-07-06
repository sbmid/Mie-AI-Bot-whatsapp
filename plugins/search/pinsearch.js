const axios = require('axios');

module.exports = {
    command: ['pinsearch', 'pinterestsearch'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.key.remoteJid;
        const query = args.join(" ");

        if (!query) {
            return sock.sendMessage(from, { text: `Contoh penggunaan:\n*${prefix}${command} cat*` }, { quoted: m });
        }

        try {
            await sock.sendMessage(from, { text: '_Mencari gambar di Pinterest..._ [~]' }, { quoted: m });

            const { data } = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}&type=image`);

            if (!data.status || !data.data || data.data.length === 0) {
                return sock.sendMessage(from, { text: '[!] Gambar tidak ditemukan untuk pencarian tersebut.' }, { quoted: m });
            }

            // Ambil maksimal 5 gambar teratas (idealnya 4-5 biar jadi UI Album Grid di WA)
            const images = data.data.slice(0, 5);

            for (let i = 0; i < images.length; i++) {
                // Mengirim gambar tanpa caption. 
                // Di WhatsApp ori, jika kita kirim banyak media tanpa jeda panjang,
                // WA akan OTOMATIS membungkus mereka menjadi tampilan 1 Album (Grid).
                await sock.sendMessage(from, { 
                    image: { url: images[i].image_url } 
                }, { quoted: m });
            }

        } catch (e) {
            console.error(e);
            await sock.sendMessage(from, { text: `[!] Terjadi kesalahan: ${e.message || e}` }, { quoted: m });
        }
    }
};
