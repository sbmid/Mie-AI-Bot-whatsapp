const { performance } = require('perf_hooks');

module.exports = {
    command: ['ping', 'test'],
    handler: async (sock, m) => {
        const start = performance.now();
        const from = m.key.remoteJid;
        const MB = require('baileys-mbuilder');
        const os = require('os');

        // Menghitung Uptime
        const uptime = process.uptime();
        const d = Math.floor(uptime / (3600 * 24));
        const h = Math.floor(uptime % (3600 * 24) / 3600);
        const mins = Math.floor(uptime % 3600 / 60);
        const s = Math.floor(uptime % 60);
        const runtime = `${d}h ${h}j ${mins}m ${s}d`;

        const end = performance.now();
        const latensi = end - start;

        const teks = `📡 *Server Latency & Metrics*`;

        const fakeReplySystem = {
            key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'SYS_PING_' + Date.now(), participant: '0@s.whatsapp.net' },
            message: { extendedTextMessage: { text: `🔔 ${global.botName || 'System'} Ping` } }
        };

        const mb = new MB.AIRich(sock);
        await mb.setTitle(`🏓 ${global.botName || 'System'} — Ping`)
            .addTip(`Ping latency & server resources`)
            .addText(teks)
            .addTable([
                ['Metric', 'Detail'],
                ['🚀 Speed', `${latensi.toFixed(4)} ms`],
                ['⏳ Uptime', runtime],
                ['💻 Platform', `${os.platform()} ${os.arch()}`],
                ['🧠 RAM', `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`]
            ])
            .addSuggest(['#InfoSistem', '#StatusServer'])
            .addImage('https://i.pinimg.com/1200x/bb/95/4c/bb954c9b8b00833cad38b76718a2e62a.jpg')
            .send(from, { quoted: fakeReplySystem });
    }
};