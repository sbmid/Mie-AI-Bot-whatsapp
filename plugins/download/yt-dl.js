const axios = require('axios');

module.exports = {
    command: ['ytmp3', 'ytmp4', 'ytdl', 'ytv', 'yta'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const url = text.trim();

        if (!url || !url.includes('youtu')) {
            return sock.sendMessage(from, { text: `[!] *Contoh:* ${prefix + command} https://youtu.be/xxx` }, { quoted: m });
        }

        const type = (command.includes('mp3') || command.includes('yta')) ? 'audio' : 'video';

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: global.waitEmoji || '[~]', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: `_Sedang memproses ${type}, mohon tunggu sebentar ya, Bestie... _` }, { quoted: m });
        }

        try {
            const ytdl = require('@distube/ytdl-core');
            
            if (!ytdl.validateURL(url)) {
                throw new Error("URL YouTube tidak valid.");
            }

            const info = await ytdl.getInfo(url);
            const videoDetails = info.videoDetails;

            const caption = `
˗ˏˋ  *𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑* ˎˊ˗

「 ɪɴғᴏʀᴍᴀsɪ ᴘᴇsᴀɴᴀɴ 」
 *Judul* : ${videoDetails.title}

 *Channel* : ${videoDetails.author.name}
[!] *Views* : ${Number(videoDetails.viewCount).toLocaleString('id-ID')}
 *Durasi* : ${videoDetails.lengthSeconds} detik

╰┈➤ *Selesai diproses!* (੭˃ᴗ˂)੭ `.trim();

            const thumbnail = videoDetails.thumbnails.length > 0 ? videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url : '';

            // Tentukan opsi download
            const options = type === 'audio' ? { filter: 'audioonly', quality: 'highestaudio' } : { filter: 'audioandvideo', quality: 'highest' };
            const stream = ytdl(url, options);

            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                
                if (type === 'audio') {
                    if (thumbnail) {
                        await sock.sendMessage(from, { image: { url: thumbnail }, caption: caption }, { quoted: m });
                    }
                    await sock.sendMessage(from, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: m });
                } else {
                    await sock.sendMessage(from, { video: buffer, caption: caption }, { quoted: m });
                }

                if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
            });

            stream.on('error', async (err) => {
                console.error('ytdl error:', err);
                await sock.sendMessage(from, { text: `[!] *Error:* Gagal mengunduh media dari YouTube.` }, { quoted: m });
                if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            });

        } catch (e) {
            console.error('YTDL Error:', e);
            await sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
        }
    }
};