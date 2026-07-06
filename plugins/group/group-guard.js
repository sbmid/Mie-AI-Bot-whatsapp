const db = require('../../lib/database');

module.exports = {
    command: ['gcon', 'gcoff'],
    handler: async (sock, m, { args, command, prefix }) => {
        const from = m.chat;

        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "[!] Fitur ini khusus untuk Grup!" }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        const isAdmin = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender)?.admin;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));

        if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "[!] Hanya Admin Grup atau Owner yang bisa menggunakan fitur ini!" }, { quoted: m });

        const group = db.getGroup(from);

        const featureList = [
            "antilinkgc",
            "antilinkch",
            "antilinkall",
            "antipromosi",
            "antisticker",
            "antitoxic",
            "antitagsw",
            "antilinktt",
            "antilinkig",
            "antilinkfb",
            "antilinkyt",
            "antilinkcapcut",
            "antiwame",
            "antivirtex"
        ];

        if (args.length === 0) {
            let teks = `[!] *GROUP PROTECTIONS*\n\n`;

            featureList.forEach((key, i) => {
                const status = group[key] ? 'ON [i]' : 'OFF [!]';
                teks += `[${i + 1}] ${key} : *${status}*\n`;
            });

            teks += `\n*Cara:* ${prefix + command} <nomor>`;
            teks += `\n*Contoh:* ${prefix + command} 1 3 5`;

            return sock.sendMessage(from, { text: teks }, { quoted: m });
        }

        const indexes = args.map(a => parseInt(a)).filter(n => !isNaN(n));

        if (indexes.length === 0) {
            return sock.sendMessage(from, { text: `*[?]* Masukkan nomor fitur yang valid.\nContoh: *${prefix + command} 1*` }, { quoted: m });
        }

        const targetValue = command === 'gcon';
        const updated = [];
        const failed = [];

        for (const i of indexes) {
            const key = featureList[i - 1];
            
            if (!key) continue;

            try {
                group[key] = targetValue;
                updated.push(key);
            } catch (e) {
                console.error(e);
                failed.push(key);
            }
        }

        if (global.db && global.db.saveAll) global.db.saveAll();

        let msg = `[!] Fitur berhasil di-*${command === 'gcon' ? 'aktifkan' : 'matikan'}*:\n`;
        if (updated.length > 0) msg += `- [✓] ${updated.join('\n- [✓] ')}`;
        if (failed.length > 0) msg += `\n\nGagal update: ${failed.join(', ')}`;

        return sock.sendMessage(from, { text: msg }, { quoted: m });
    }
};
