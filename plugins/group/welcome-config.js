const db = require('../../lib/database');

module.exports = {
    command: ['welcome', 'leave'],
    handler: async (sock, m, { text, prefix, command, isOwner }) => {
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fitur ini hanya untuk di dalam grup!" }, { quoted: m });
        }
        
        // Cek Admin
        const groupMetadata = await sock.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const sender = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender);
        const isAdmin = sender?.admin !== null || isOwner;

        if (!isAdmin) {
            return sock.sendMessage(m.chat, { text: "[!] Hanya Admin yang bisa mengakses perintah ini!" }, { quoted: m });
        }

        const group = db.getGroup(m.chat);
        const args = text.toLowerCase().trim();

        const validStyles = ['v1', 'v2', 'v4', 'v5'];

        if (args === 'on') {
            if (command === 'welcome') {
                group.welcome = true;
                group.welcomeStyle = group.welcomeStyle || 'v1';
                sock.sendMessage(m.chat, { text: `[i] *WELCOME* diaktifkan! (Style: ${group.welcomeStyle})` }, { quoted: m });
            } else {
                group.leave = true;
                group.leaveStyle = group.leaveStyle || 'v1';
                sock.sendMessage(m.chat, { text: `[i] *LEAVE* diaktifkan! (Style: ${group.leaveStyle})` }, { quoted: m });
            }
        } else if (args === 'off') {
            if (command === 'welcome') group.welcome = false;
            else group.leave = false;
            sock.sendMessage(m.chat, { text: `[!] *${command.toUpperCase()}* dimatikan.` }, { quoted: m });
        } else if (validStyles.includes(args)) {
            if (command === 'welcome') {
                group.welcome = true;
                group.welcomeStyle = args;
            } else {
                group.leave = true;
                group.leaveStyle = args;
            }
            sock.sendMessage(m.chat, { text: ` Style *${command.toUpperCase()}* diset menjadi ${args} (Aktif).` }, { quoted: m });
        } else {
            sock.sendMessage(m.chat, { 
                text: `Format salah! [!]\nKetik:\n*${prefix + command} on* / *off*\nAtau pilih style:\n*${prefix + command} v1* / *v2* / *v4* / *v5*` 
            }, { quoted: m });
        }

        // Data otomatis ter-update karena 'group' adalah referensi ke db.groups[m.chat]
    }
};