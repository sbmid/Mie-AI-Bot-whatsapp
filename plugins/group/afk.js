const db = require('../../lib/database');

module.exports = {
    command: ['afk'],
    handler: async (sock, m, { text }) => {
        // Gunakan getUser agar data base (jid, level, dll) tidak hilang/undefined
        const user = global.db.getUser(m.sender);

        user.afkTime = +new Date();
        user.afkReason = text || 'Tanpa Alasan';
        
        let startMsg = `╭───  「 *AFK MODE ON* 」  ───╮\n│\n`;
        startMsg += `│ [!] *User:* @${m.sender.split('@')[0]}\n`;
        startMsg += `│ [!] *Mulai:* ${new Date().toLocaleTimeString('id-ID')}\n`;
        startMsg += `│ [!] *Alasan:* ${user.afkReason}\n`;
        startMsg += `│\n`;
        startMsg += `╰──────────────────╯\n`;
        startMsg += `_Mei akan memberitahu member lain kalau kamu sedang tidak ada!_`;

        await sock.sendMessage(m.chat, { 
            text: startMsg,
            mentions: [m.sender]
        }, { quoted: m });
    }
};