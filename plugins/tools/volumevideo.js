/*
 * Volume Changer (Video)
 * Ubah volume video dengan ffmpeg
 * Format: .volvideo <persen> (reply video)
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')
const axios = require('axios')
const execPromise = util.promisify(exec)

module.exports = {
    command: ['volvideo', 'volumevideo'],
    tags: ['tools'],
    handler: async (sock, msg, { text }) => {
        const chat = msg.chat;
        const Reply = (t) => sock.sendMessage(chat, { text: t }, { quoted: msg });

        // Dapatkan pesan yang di-reply
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctx?.quotedMessage;
        const quotedMime = quotedMsg?.videoMessage?.mimetype || quotedMsg?.documentMessage?.mimetype || '';

        if (!quotedMsg || !/video/.test(quotedMime)) {
            return Reply('❌ Reply video yang mau diubah volumenya!\n\n📌 *Contoh:*\n.volvideo 50%\n.volvideo 200%');
        }

        if (!text) return Reply(`📌 *Contoh:*\n.volvideo 50% (reply video)\n.volvideo 200% (reply video)`);

        const match = text.match(/^(\d+(?:\.\d+)?)%?$/);
        if (!match) return Reply('❌ Format salah! Gunakan angka persen\nContoh: .volvideo 50%');

        let percent = parseFloat(match[1]);
        if (isNaN(percent) || percent < 1 || percent > 500) {
            return Reply('❌ Volume harus antara 1% sampai 500%');
        }

        const volume = percent / 100;

        try { await sock.sendMessage(chat, { react: { text: '🔊', key: msg.key } }); } catch {}

        try {
            // Download quoted video
            const videoMsg = quotedMsg.videoMessage || quotedMsg.documentMessage;
            if (!videoMsg) throw new Error('Tidak bisa membaca file video');

            const directUrl = videoMsg.url;
            const response = await axios.get(directUrl, { responseType: 'arraybuffer', timeout: 60000 });
            const videoBuffer = Buffer.from(response.data);

            const tmpDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const ts = Date.now();
            const inputPath = path.join(tmpDir, `video_${ts}_in.mp4`);
            const outputPath = path.join(tmpDir, `video_${ts}_out.mp4`);

            fs.writeFileSync(inputPath, videoBuffer);

            await execPromise(`ffmpeg -y -i "${inputPath}" -vcodec copy -af "volume=${volume}" "${outputPath}"`);

            const result = fs.readFileSync(outputPath);

            await sock.sendMessage(chat, {
                video: result,
                mimetype: 'video/mp4',
                caption: `✅ *Volume video berhasil diubah*\n\n🔊 Volume: ${percent}%`
            }, { quoted: msg });

            try { await sock.sendMessage(chat, { react: { text: '✅', key: msg.key } }); } catch {}

            // Cleanup
            try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

        } catch (error) {
            console.error('[VOLVIDEO ERROR]', error.message);
            try { await sock.sendMessage(chat, { react: { text: '❌', key: msg.key } }); } catch {}
            Reply(`❌ Gagal mengubah volume video.\n\nPastikan ffmpeg sudah terinstall.\nError: ${error.message}`);
        }
    }
};