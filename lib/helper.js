const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

/**
 * Mendownload media dari WhatsApp
 */
const downloadMedia = async (msg) => {
    try {
        const type = Object.keys(msg)[0];
        const stream = await downloadContentFromMessage(msg[type], type.split('Message')[0]);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (e) {
        console.error('Error at downloadMedia helper:', e);
        throw e;
    }
};

/**
 * Mengambil buffer dari URL dengan header browser
 */
const fetchBuffer = async (url) => {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            },
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data, 'binary');
    } catch (e) {
        console.error('Error at fetchBuffer:', e.message);
        throw e;
    }
};

/**
 * Upload buffer ke berbagai penyedia layanan penyimpanan
 * @param {Buffer} buffer 
 */
const uploadToCatbox = async (buffer) => {
    try {
        const { ext } = await fromBuffer(buffer);
        const bodyForm = new FormData();
        
        // Coba upload ke tmpfiles.org
        bodyForm.append("file", buffer, "file." + ext);
        const { data } = await axios.post("https://tmpfiles.org/api/v1/upload", bodyForm, {
            headers: bodyForm.getHeaders(),
            timeout: 20000
        });
        
        const match = data.data.url.match(/https:\/\/tmpfiles\.org\/(.*)/);
        return `https://tmpfiles.org/dl/${match[1]}`;
    } catch (e) {
        console.error('Error at uploadToTmpfiles:', e);
        try {
            // Coba ke uguu.se sebagai fallback
            const { ext } = await fromBuffer(buffer);
            const form = new FormData();
            form.append("files[]", buffer, "file." + ext);
            const { data } = await axios.post("https://uguu.se/upload.php", form, {
                headers: form.getHeaders(),
                timeout: 20000
            });
            return data.files[0].url;
        } catch (e2) {
            console.error('Error at uploadToUguu:', e2);
            throw e2;
        }
    }
};

const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? d + 'd ' : ''}${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
};

const formatSize = (bytes) => {
    if (bytes >= 1000000000) return (bytes / 1000000000).toFixed(2) + " GB";
    if (bytes >= 1000000) return (bytes / 1000000).toFixed(2) + " MB";
    if (bytes >= 1000) return (bytes / 1000).toFixed(2) + " KB";
    return bytes + " bytes";
};

const getGroupAdmins = (participants) => {
    return participants.filter(v => v.admin !== null).map(v => v.id);
};

const sendMediaSafe = async (sock, from, mediaBuffer, mediaUrl, type, caption = '', quotedMsg = null) => {
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB limit video native WA
    const opts = quotedMsg ? { quoted: quotedMsg } : {};

    const buildPayload = (source, isDocument = false) => {
        if (isDocument) {
            let ext = type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'jpg');
            let mime = type === 'video' ? 'video/mp4' : (type === 'audio' ? 'audio/mpeg' : 'image/jpeg');
            return {
                document: source,
                mimetype: mime,
                fileName: `MIE_AI_Downloader.${ext}`,
                caption: caption
            };
        }

        const base = { caption };
        if (type === 'video') return { ...base, video: source, mimetype: 'video/mp4' };
        if (type === 'audio') return { ...base, audio: source, mimetype: 'audio/mp4' };
        return { ...base, image: source };
    };

    // 1. Coba kirim via Buffer biasa jika ukurannya wajar (< 50MB)
    if (mediaBuffer && mediaBuffer.length < MAX_VIDEO_SIZE) {
        try {
            await sock.sendMessage(from, buildPayload(mediaBuffer, false), opts);
            return { success: true, method: 'buffer_native' };
        } catch (e) {
            console.warn('[sendMediaSafe] Buffer native gagal, lanjut paksa document...', e.message);
        }
    }

    // 2. Jika buffer >= 50MB atau kirim native gagal, PAKSA KIRIM SEBAGAI DOKUMEN (Bisa nampung sampai 2GB)
    if (mediaBuffer) {
        try {
            await sock.sendMessage(from, buildPayload(mediaBuffer, true), opts);
            return { success: true, method: 'buffer_document' };
        } catch (e) {
            console.warn('[sendMediaSafe] Buffer document gagal...', e.message);
        }
    }

    // 3. Jika buffer kosong (misal gagal didownload bot karena kelamaan), suruh Baileys yang download URL-nya
    if (mediaUrl) {
        try {
            // Coba kirim sebagai video native via URL
            await sock.sendMessage(from, buildPayload({ url: mediaUrl }, false), opts);
            return { success: true, method: 'url_native' };
        } catch (e) {
            try {
                // PAKSA KIRIM SEBAGAI DOKUMEN VIA URL
                await sock.sendMessage(from, buildPayload({ url: mediaUrl }, true), opts);
                return { success: true, method: 'url_document' };
            } catch (e2) {
                console.warn('[sendMediaSafe] URL kirim gagal total...', e2.message);
            }
        }
    }

    // 4. Fallback paling terpaksa (hanya jika server WA memang menolak mentah-mentah)
    if (mediaUrl) {
        const fallbackText = `${caption}\n\n📎 *Mohon Maaf, file ini terlalu ekstrim untuk dikirim langsung via WA.*\nSilakan klik link berikut untuk mengunduhnya sendiri:\n${mediaUrl}`;
        await sock.sendMessage(from, { text: fallbackText }, opts);
        return { success: true, method: 'text_fallback' };
    }

    return { success: false, method: 'none' };
};

module.exports = { 
    downloadMedia, 
    fetchBuffer,
    uploadToCatbox,
    sendMediaSafe,
    runtime, 
    formatSize, 
    getGroupAdmins 
};