const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['tovn', 'vn'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;
        
        let quoted = m.quoted ? m.quoted : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let type = Object.keys(quoted || {})[0] || '';
        let isMedia = type === 'videoMessage' || type === 'audioMessage' || quoted?.videoMessage || quoted?.audioMessage || (quoted?.msg || quoted)?.mimetype?.includes('video') || (quoted?.msg || quoted)?.mimetype?.includes('audio');

        if (!isMedia) {
            return sock.sendMessage(from, { text: `[!] *Cara Pakai:* Balas video/audio dengan ketik *${prefix + command}*` }, { quoted: m });
        }
        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: global.waitEmoji, key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: global.waitText }, { quoted: m });
        }

        try {
            const target = m.quoted ? m.quoted : (quoted.videoMessage || quoted.audioMessage);
            const messageData = target.msg || target;
            const mediaType = type.replace('Message', '').split('/')[0] || 'video';
            
            const stream = await downloadContentFromMessage(messageData, mediaType === 'audio' ? 'audio' : 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const filename = path.join(tempDir, `${Date.now()}.${mediaType === 'audio' ? 'mp3' : 'mp4'}`);
            const audioPath = path.join(tempDir, `${Date.now()}.opus`); 
            
            fs.writeFileSync(filename, buffer);

            exec(`ffmpeg -i "${filename}" -c:a libopus -b:a 128k -vbr on -compression_level 10 -y "${audioPath}"`, async (err) => {
                if (fs.existsSync(filename)) fs.unlinkSync(filename);
                
                if (err) {
                    console.error('FFmpeg Error:', err);
                    return sock.sendMessage(from, { text: '[!] Gagal membuat Voice Note.' }, { quoted: m });
                }

                // 3. Kirim sebagai Voice Note (PTT)
                const audioBuffer = fs.readFileSync(audioPath);
                await sock.sendMessage(from, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mp4', // Mimetype mp4 tetap digunakan untuk OGG/OPUS di WA
                    ptt: true // INI YANG BIKIN JADI VOICE NOTE
                }, { quoted: m });

                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            });

        } catch (e) {
            console.error('ToVN Error:', e);
            return sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
        }
    }
};