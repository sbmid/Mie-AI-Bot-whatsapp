const { getLivescore } = require('../../lib/scraper/goal');

module.exports = {
    command: ['livescore', 'bola', 'scorebola'],
    handler: async (sock, m, { prefix, command }) => {
        if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        try {
            const data = await getLivescore({ edisi: 'id' });
            if (!data || data.length === 0) {
                if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(m.chat, { text: 'Tidak ada pertandingan live saat ini.' }, { quoted: m });
            }

            let txt = '⚽ *GOAL.COM LIVE SCORE* ⚽\n\n';
            for (const grup of data) {
                txt += `🏆 *${grup.kompetisi}* (${grup.area})\n`;
                for (const match of grup.pertandingan) {
                    txt += `  [${match.status}] ${match.tuanRumah} ${match.skorTuanRumah ?? '-'} vs ${match.skorTandang ?? '-'} ${match.tandang}\n`;
                    if (match.waktu) {
                        txt += `  🕒 ${new Date(match.waktu).toLocaleTimeString('id-ID', {timeZone: 'Asia/Jakarta'})} WIB\n`;
                    }
                }
                txt += '\n';
            }

            await sock.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } catch (e) {
            console.error(e);
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(m.chat, { text: `Error: ${e.message}` }, { quoted: m });
        }
    }
};
