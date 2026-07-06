const axios = require('axios');
const { sendMediaSafe } = require('../../lib/helper');

/**
 * MIE AI - Instagram Downloader 
 * Fix: sendMediaSafe untuk file besar, timeout API 25s
 */
module.exports = {
    command: ['ig', 'igdl', 'instagram'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;

        if (!text) {
            return sock.sendMessage(from, { 
                text: ` *Format Salah Kakak Sayang...* \nContoh: *${prefix + command}* https://www.instagram.com/reel/xxx` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            const apiUrl = `https://api.alyachan.dev/api/downloader/ig?url=${encodeURIComponent(text)}&apikey=alyachan`;
            const response = await axios.get(apiUrl, { timeout: 25000 }).catch(e => e.response);
            
            let mediaList = null;
            if (response && response.data && response.data.status && response.data.data) {
                // Asumsi data array atau objek yang mengembalikan list hasil
                const result = response.data.data;
                if (Array.isArray(result)) {
                    mediaList = result.map(x => ({ url: x.url, type: x.type === 'video' ? 'video' : 'image' }));
                } else if (result.url) {
                    mediaList = [{ url: result.url, type: result.type === 'video' ? 'video' : 'image' }];
                }
            }

            if (!mediaList || mediaList.length === 0) {
                throw new Error("Gagal mengambil data Instagram dari AlyaChan.");
            }

            for (let item of mediaList) {
                const downloadUrl = item.url;
                if (!downloadUrl) continue;

                let mediaBuffer = null;
                try {
                    const getMedia = await axios.get(downloadUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 90000 
                    });
                    mediaBuffer = Buffer.from(getMedia.data);
                } catch (dlErr) {
                    console.warn('[IG] Download buffer gagal, pakai URL langsung:', dlErr.message);
                }

                await sendMediaSafe(sock, from, mediaBuffer, downloadUrl, item.type, '', m);
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error IG DL:", e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            
            sock.sendMessage(from, { 
                text: ` *Duh Maaf Kak...* \nGagal proses link Instagram ini. Server error atau akun IG diprivat! ` 
            }, { quoted: m });
        }
    }
};