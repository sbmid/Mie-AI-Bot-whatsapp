const { runtime } = require('../../lib/helper');

module.exports = {
    command: ['runtime', 'uptime'], 
    handler: async (sock, m) => {
        try {
            const uptimeSeconds = process.uptime();
            const aktifSelama = runtime(uptimeSeconds);

            const response = `[!] *BOT UPTIME* [!]\n\n` +
                             `Sistem telah berjalan selama:\n` +
                             `[!] *${aktifSelama}*\n\n` +
                             `_Status: Stabil_`;

            await sock.sendMessage(m.key.remoteJid, { 
                text: response 
            }, { quoted: m });
        } catch (e) {
            console.error(e);
        }
    }
};