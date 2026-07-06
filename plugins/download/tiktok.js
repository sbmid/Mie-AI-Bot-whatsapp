const axios = require('axios');
const { sendMediaSafe } = require('../../lib/helper');

/**
 * MIE AI - TikTok Downloader V3.6 
 * Fitur: Support Video HD & Slide Foto 
 * Fix: sendMediaSafe untuk file besar, timeout API 25s
 */
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

            let isSlide = false;
            let slideImages = [];
            let videoUrl = '';
            let desc = '';
            
            // Menggunakan Endpoint Tunggal AlyaChan sesuai instruksi
            const apiUrl = `https://api.alyachan.dev/api/downloader/tiktok?url=${encodeURIComponent(url)}&apikey=alyachan`;
            const response = await axios.get(apiUrl, { timeout: 25000 }).catch(e => e.response);
            
            if (response && response.data && response.data.status) {
                const data = response.data.data;
                desc = data.title || data.desc || '';
                
                // Pengecekan apakah hasil berupa slide gambar atau video
                if (data.images && data.images.length > 0) {
                    isSlide = true;
                    slideImages = data.images;
                } else if (data.video_no_watermark || data.video) {
                    videoUrl = data.video_no_watermark || data.video;
                }
            } else {
                throw new Error("Gagal mendapatkan data TikTok dari AlyaChan.");
            }

            if (!isSlide && !videoUrl) throw new Error("Link media gagal didapatkan.");

            // Header Caption Estetik 
            const caption = `
━ ⟨ *TIKTOK DOWNLOADER* ⟩ ━

> » *Deskripsi*: ${desc || 'Tanpa Keterangan'}
`.trim();

            if (isSlide && slideImages.length > 0) {
                await sock.sendMessage(from, { text: `[i] *TikTok Slide Terdeteksi!*\nMengurutkan ${slideImages.length} foto untuk dikirim...` }, { quoted: m });
                
                for (let i = 0; i < slideImages.length; i++) {
                    try {
                        let imgBuffer = null;
                        try {
                            const getImg = await axios({
                                method: 'get',
                                url: slideImages[i],
                                responseType: 'arraybuffer',
                                timeout: 20000
                            });
                            imgBuffer = Buffer.from(getImg.data);
                        } catch (dlErr) {
                            console.warn('Gagal download gambar slide, pakai URL langsung:', dlErr.message);
                        }

                        await sendMediaSafe(sock, from, imgBuffer, slideImages[i], 'image',
                            i === 0 ? caption : '', m);
                    } catch (err) {
                        console.error('Gagal kirim slide gambar ke-' + i, err.message);
                    }
                    await new Promise(r => setTimeout(r, 1500));
                }
            } else {
                let videoBuffer = null;
                try {
                    const getVid = await axios({
                        method: 'get',
                        url: videoUrl,
                        responseType: 'arraybuffer',
                        timeout: 90000
                    });
                    videoBuffer = Buffer.from(getVid.data);
                } catch (dlErr) {
                    console.warn('[TikTok] Download buffer gagal, akan pakai URL langsung:', dlErr.message);
                }

                await sendMediaSafe(sock, from, videoBuffer, videoUrl, 'video', caption, m);
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error TT DL Mie AI:", e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });

            sock.sendMessage(from, {
                text: ` *Duh Maaf Kak...* \nMie gagal memproses link ini. Server error atau salah link. `
            }, { quoted: m });
        }
    }
};
