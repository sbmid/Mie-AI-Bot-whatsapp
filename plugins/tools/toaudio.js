const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['toaudio', 'tomp3'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;
        
        let quoted = m.quoted ? m.quoted : m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let type = Object.keys(quoted || {})[0] || '';
        let isVideo = type === 'videoMessage' || quoted?.videoMessage || (quoted?.msg || quoted)?.mimetype?.includes('video');

        console.log(`[Mie AI] Raw Type: ${type} | IsVideo: ${!!isVideo}`);

        if (!isVideo) {
            return sock.sendMessage(from, { text: `[!] *Cara Pakai:* Balas (reply) video dengan ketik *${prefix + command}*` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: global.waitEmoji, key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: global.waitText }, { quoted: m });
        }

        try {
            const target = m.quoted ? m.quoted : quoted.videoMessage;
            const messageData = target.msg || target;
            
            // Ambil stream konten dari Baileys
            const stream = await downloadContentFromMessage(messageData, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const filename = path.join(tempDir, `${Date.now()}.mp4`);
            const audioPath = path.join(tempDir, `${Date.now()}.mp3`);
            
            fs.writeFileSync(filename, buffer);

            // Konversi Pake FFmpeg
            exec(`ffmpeg -i "${filename}" -vn -ar 44100 -ac 2 -b:a 128k -y "${audioPath}"`, async (err) => {
                if (fs.existsSync(filename)) fs.unlinkSync(filename);
                
                if (err) {
                    console.error('FFmpeg Error:', err);
                    return sock.sendMessage(from, { text: '[!] FFmpeg gagal. Cek VPS kamu ya!' }, { quoted: m });
                }

                const audioBuffer = fs.readFileSync(audioPath);
                await sock.sendMessage(from, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mp4', 
                    fileName: `mie-ai-${Date.now()}.mp3` 
                }, { quoted: m });

                if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            }); 

        } catch (e) {
            console.error('ToAudio Error:', e);
            return sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
        }
    }
};