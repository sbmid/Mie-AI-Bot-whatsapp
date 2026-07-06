const db = require('../../lib/database');

module.exports = {
    command: ['antilinkall'],
    handler: async (sock, m, { args, command, prefix }) => {
        const from = m.chat;

        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "[!] Fitur ini khusus untuk Grup!" }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        const isAdmin = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender)?.admin;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));

        if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "[!] Hanya Admin Grup atau Owner yang bisa menggunakan fitur ini!" }, { quoted: m });

        const group = db.getGroup(from);
        const input = args[0]?.toLowerCase();

        if (input === 'on') {
            group.antilinkall = true;
            if (global.db && global.db.saveAll) global.db.saveAll();
            return sock.sendMessage(from, { text: "[i] Fitur *Anti Semua Link* berhasil diaktifkan." }, { quoted: m });
        } else if (input === 'off') {
            group.antilinkall = false;
            if (global.db && global.db.saveAll) global.db.saveAll();
            return sock.sendMessage(from, { text: "[i] Fitur *Anti Semua Link* berhasil dimatikan." }, { quoted: m });
        } else {
            return sock.sendMessage(from, { text: `[!] Format salah!\n\nKetik *${prefix + command} on* untuk menghidupkan\nKetik *${prefix + command} off* untuk mematikan.` }, { quoted: m });
        }
    }
};
