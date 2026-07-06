const db = require('../../lib/database');

module.exports = {
    command: ['afk'],
    handler: async (sock, m, { text }) => {
        const data = db.read();
        const user = data.users[m.sender] || { afkTime: -1, afkReason: '' };

        user.afkTime = +new Date();
        user.afkReason = text || 'Tanpa Alasan';
        
        data.users[m.sender] = user;
        if(global.db && global.db.saveAll) global.db.saveAll();

        let startMsg = `╭───  「 *AFK MODE ON* 」  ───╮\n│\n`;
        startMsg += `│ [!] *User:* @${m.sender.split('@')[0]}\n`;
        startMsg += `│ [!] *Mulai:* ${new Date().toLocaleTimeString()}\n`;
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