const { pinterestdl } = require('../../lib/scraper/pinterest');

module.exports = {
    command: ['pin', 'pinterest'],
    handler: async (sock, m, { args }) => {
        const from = m.key.remoteJid;
        
        if (!args[0]) return sock.sendMessage(from, { text: `Contoh: *${global.prefix}pin [url]*` }, { quoted: m });

        try {
            await sock.sendMessage(from, { text: '_Tunggu sebentar..._ [~]' }, { quoted: m });

            const res = await pinterestdl(args[0]);

            if (res.video) {
                await sock.sendMessage(from, { 
                    video: { url: res.video }, 
                    caption: `[i] *Pinterest Video*\n[!] *Judul:* ${res.title}` 
                }, { quoted: m });
            } else {
                await sock.sendMessage(from, { 
                    image: { url: res.image }, 
                    caption: `[i] *Pinterest Image*\n[!] *Judul:* ${res.title}` 
                }, { quoted: m });
            }
        } catch (e) {
            await sock.sendMessage(from, { text: `[!] Error: ${e.message || e}` }, { quoted: m });
        }
    }
};