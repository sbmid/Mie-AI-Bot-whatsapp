/*
 * Volume Changer (Audio)
 * Ubah volume audio dengan ffmpeg
 * Format: .volume <persen> (reply audio)
 */

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')
const axios = require('axios')
const execPromise = util.promisify(exec)

module.exports = {
    command: ['volume'],
    tags: ['tools'],
    handler: async (sock, msg, { text }) => {
        const chat = msg.chat;
        const Reply = (t) => sock.sendMessage(chat, { text: t }, { quoted: msg });

        // Dapatkan pesan yang di-reply
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctx?.quotedMessage;
        const quotedMime = quotedMsg?.audioMessage?.mimetype || quotedMsg?.documentMessage?.mimetype || '';

        if (!quotedMsg || !/audio/.test(quotedMime)) {
            return Reply('❌ Reply audio yang mau diubah volumenya!\n\n📌 *Contoh:*\n.volume 50%\n.volume 200%');
        }

        if (!text) return Reply(`📌 *Contoh:*\n.volume 50% (reply audio)\n.volume 200% (reply audio)`);

        const match = text.match(/^(\d+(?:\.\d+)?)%?$/);
        if (!match) return Reply('❌ Format salah! Gunakan angka persen\nContoh: .volume 50%');

        let percent = parseFloat(match[1]);
        if (isNaN(percent) || percent < 1 || percent > 500) {
            return Reply('❌ Volume harus antara 1% sampai 500%');
        }

        const volume = percent / 100;

        try { await sock.sendMessage(chat, { react: { text: '🔊', key: msg.key } }); } catch {}

        try {
            // Download quoted audio
            const audioMsg = quotedMsg.audioMessage || quotedMsg.documentMessage;
            if (!audioMsg) throw new Error('Tidak bisa membaca file audio');

            const mediaKey = audioMsg.mediaKey;
            const directUrl = audioMsg.url;

            const response = await axios.get(directUrl, { responseType: 'arraybuffer', timeout: 30000 });
            const audioBuffer = Buffer.from(response.data);

            const tmpDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const ts = Date.now();
            const inputPath = path.join(tmpDir, `audio_${ts}_in.mp3`);
            const outputPath = path.join(tmpDir, `audio_${ts}_out.mp3`);

            fs.writeFileSync(inputPath, audioBuffer);

            await execPromise(`ffmpeg -y -i "${inputPath}" -af "volume=${volume}" -c:a libmp3lame -q:a 2 "${outputPath}"`);

            const result = fs.readFileSync(outputPath);

            await sock.sendMessage(chat, {
                audio: result,
                mimetype: 'audio/mpeg',
            }, { quoted: msg });

            try { await sock.sendMessage(chat, { react: { text: '✅', key: msg.key } }); } catch {}

            // Cleanup
            try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}

        } catch (error) {
            console.error('[VOLUME ERROR]', error.message);
            try { await sock.sendMessage(chat, { react: { text: '❌', key: msg.key } }); } catch {}
            Reply(`❌ Gagal mengubah volume.\n\nPastikan ffmpeg sudah terinstall.\nError: ${error.message}`);
        }
    }
};