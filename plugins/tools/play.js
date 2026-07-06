const axios = require('axios');

module.exports = {
    command: ['play'],
    category: ['tools'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const query = text.trim();

        if (!query) {
            return sock.sendMessage(from, { text: `Contoh: ${prefix + command} whatever you like` }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: "_Processing..._" }, { quoted: m });
        }

        try {
            // 1. Search song on YouTube using yt-search
            const yts = require('yt-search');
            const ytdl = require('@distube/ytdl-core');
            const fs = require('fs');
            const path = require('path');
            
            const searchRes = await yts(query);
            
            if (!searchRes || !searchRes.videos || searchRes.videos.length === 0) {
                return sock.sendMessage(from, { text: `Lagu "${query}" tidak ditemukan di YouTube.` }, { quoted: m });
            }

            const track = searchRes.videos[0];
            const trackUrl = track.url;

            const caption = ` *YOUTUBE PLAY*\n\n` +
                `[!] *Judul:* ${track.title}\n` +
                `[!] *Channel:* ${track.author?.name || 'YouTube'}\n` +
                `[!] *Link:* ${trackUrl}\n\n` +
                ` _Sedang mengunduh audio, mohon tunggu..._`;

            const bannerUrl = track.thumbnail || 'https://raw.githubusercontent.com/Click-E/Mie-AI/main/assets/thumb_doc_resized.jpg';
            
            // 1. Kirim Pesan Gambar Banner + Caption Info
            await sock.sendMessage(from, {
                image: { url: bannerUrl },
                caption: caption
            }, { quoted: m });

            // 2. Download Audio using @distube/ytdl-core
            const audioStream = ytdl(trackUrl, { filter: 'audioonly', quality: 'highestaudio' });
            
            const chunks = [];
            audioStream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            
            audioStream.on('end', async () => {
                const audioBuffer = Buffer.concat(chunks);
                
                // 3. Kirim Pesan Audio
                await sock.sendMessage(from, { 
                    audio: audioBuffer, 
                    mimetype: 'audio/mpeg'
                }, { quoted: m });
                
                if (global.waitMode === "react") {
                    try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
                }
            });

            audioStream.on('error', async (err) => {
                console.error('ytdl error:', err);
                await sock.sendMessage(from, { text: `Gagal mengunduh audio dari YouTube.` }, { quoted: m });
                if (global.waitMode === "react") {
                    try { await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch(e){}
                }
            });

        } catch (e) {
            console.error('Play Error:', e);
            return sock.sendMessage(from, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};