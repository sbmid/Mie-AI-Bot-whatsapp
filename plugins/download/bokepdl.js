const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Plugin: Bokep Downloader (XVideos, XNXX)
 * Akses: Owner + User yang diizinkan via .addakses
 * Kategori: download (NSFW gated)
 */

function checkNsfwAccess(sender) {
    try {
        const filePath = path.join(__dirname, '../../database/nsfw_access.json');
        if (!fs.existsSync(filePath)) return false;
        const data = JSON.parse(fs.readFileSync(filePath));
        return Array.isArray(data.users) && data.users.includes(sender);
    } catch {
        return false;
    }
}

module.exports = {
    command: ['bokepdl', 'xvdl', 'xvideodl', 'xvideosdl', 'xnxxdl'],
    tags: ['download'],
    handler: async (sock, msg, { text, command, prefix }) => {
        const sender = msg.sender;
        const chat = msg.chat;
        const Reply = (t) => sock.sendMessage(chat, { text: t }, { quoted: msg });

        // === NSFW Access Gate ===
        const isOwner = global.ownerNumber && global.ownerNumber.some(o =>
            sender === o || sender.startsWith(o.split('@')[0])
        );
        const hasAccess = isOwner || checkNsfwAccess(sender);

        if (!hasAccess) {
            return Reply(
                `🔞 *Akses Ditolak*\n\n` +
                `❌ Fitur ini hanya untuk pengguna yang diizinkan Owner.\n` +
                `Hubungi Owner untuk meminta akses.`
            );
        }

        // === Input Validation ===
        const isXvideos = ['bokepdl', 'xvdl', 'xvideodl', 'xvideosdl'].includes(command);
        const isXnxx = command === 'xnxxdl';

        if (!text) {
            const site = isXnxx ? 'xnxx.com' : 'xvideos.com';
            return Reply(
                `🔞 *Bokep Downloader*\n\n` +
                `📌 *Penggunaan:*\n` +
                `\`${prefix}${command} <url>\`\n\n` +
                `📎 *Contoh:*\n` +
                `\`${prefix}${command} https://www.${site}/...\`\n\n` +
                `⚠️ Hanya untuk pengguna yang diizinkan.`
            );
        }

        const url = text.trim();

        // Validate URL
        if (isXvideos && !url.includes('xvideos.com')) {
            return Reply(`❌ URL tidak valid. Gunakan link dari *xvideos.com*\n\nContoh:\n\`${prefix}${command} https://www.xvideos.com/...\``);
        }
        if (isXnxx && !url.includes('xnxx.com')) {
            return Reply(`❌ URL tidak valid. Gunakan link dari *xnxx.com*\n\nContoh:\n\`${prefix}${command} https://www.xnxx.com/...\``);
        }

        // React loading
        try { await sock.sendMessage(chat, { react: { text: '⏳', key: msg.key } }); } catch {}

        try {
            let title = 'Video';
            let downloadLink = null;

            // ── XVideos Scraper ──
            if (isXvideos) {
                const { data } = await axios.get(url, {
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                // Extract title
                const titleMatch = data.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) title = titleMatch[1].replace(' - XVIDEOS.COM', '').trim();

                // Extract video URL from html5player scripts
                const highMatch = data.match(/html5player\.setVideoUrlHigh\(['"](.*?)['"]\)/i);
                const lowMatch = data.match(/html5player\.setVideoUrlLow\(['"](.*?)['"]\)/i);

                downloadLink = (highMatch && highMatch[1]) || (lowMatch && lowMatch[1]) || null;

                // Fallback: try setVideoUrl
                if (!downloadLink) {
                    const fallback = data.match(/setVideoUrl\(['"](https?:\/\/[^'"]+\.mp4[^'"]*)['"]\)/i);
                    if (fallback) downloadLink = fallback[1];
                }
            }

            // ── XNXX Scraper ──
            if (isXnxx) {
                const { data } = await axios.get(url, {
                    timeout: 20000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                const titleMatch = data.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) title = titleMatch[1].replace(' - XNXX.COM', '').trim();

                const highMatch = data.match(/html5player\.setVideoUrlHigh\(['"](.*?)['"]\)/i);
                const lowMatch = data.match(/html5player\.setVideoUrlLow\(['"](.*?)['"]\)/i);

                downloadLink = (highMatch && highMatch[1]) || (lowMatch && lowMatch[1]) || null;
            }

            if (!downloadLink) {
                throw new Error('Link download tidak ditemukan. Video mungkin privat atau menggunakan proteksi. Coba video lain.');
            }

            // Trim title
            if (title.length > 100) title = title.substring(0, 97) + '...';

            // Send video
            await sock.sendMessage(chat, {
                video: { url: downloadLink },
                caption:
                    `✅ *Download Berhasil!*\n\n` +
                    `🎬 *Judul:* ${title}\n` +
                    `🔗 *Source:* ${url}\n\n` +
                    `🔞 _Konten dewasa – hanya untuk usia 18+_\n` +
                    `🤖 *Powered by MIE AI*`,
                mimetype: 'video/mp4',
                gifPlayback: false
            }, { quoted: msg });

            // React done
            try { await sock.sendMessage(chat, { react: { text: '✅', key: msg.key } }); } catch {}

        } catch (err) {
            try { await sock.sendMessage(chat, { react: { text: '❌', key: msg.key } }); } catch {}
            console.error(`[BOKEPDL ERROR]`, err.message);

            return Reply(
                `❌ *Gagal Download Video*\n\n` +
                `Kemungkinan penyebab:\n` +
                `• Video privat atau dihapus\n` +
                `• Proteksi DRM dari situs\n` +
                `• Timeout koneksi\n\n` +
                `🔄 Coba video lain.\n` +
                `📋 Error: _${err.message}_`
            );
        }
    }
};
