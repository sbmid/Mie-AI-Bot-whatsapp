module.exports = {
    command: ['gcmute'],
    handler: async (sock, m, { prefix, command, text }) => {
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fitur ini cuma buat di grup!" }, { quoted: m });
        }

        const sender = m.sender || m.key.participant || m.key.remoteJid;

        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));

        let senderIsAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(m.chat);
            const participants = groupMetadata.participants;
            const senderEntry = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender);
            senderIsAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';
        } catch(e) {}

        if (!senderIsAdmin && !isOwner) {
            return sock.sendMessage(m.chat, { text: "[!] Cuma Admin yang bisa membungkam bot di grup ini!" }, { quoted: m });
        }

        const action = text ? text.toLowerCase().trim() : '';

        const groupData = global.db.getGroup(m.chat);

        if (action === 'on') {
            groupData.botmute = true;
            return sock.sendMessage(m.chat, { text: "[!] *Bot Mute Diaktifkan!*\nMember biasa tidak akan dibalas oleh bot.\nMulai sekarang bot *HANYA* merespon perintah dari *Admin Group*." }, { quoted: m });
        } else if (action === 'off') {
            groupData.botmute = false; // Turn off botmute
            return sock.sendMessage(m.chat, { text: "[!] *Bot Mute Dimatikan!*\nSemua member grup sekarang bisa menggunakan bot lagi." }, { quoted: m });
        } else {
            return sock.sendMessage(m.chat, { text: `Toggles mute bot khusus di grup ini.\nCara pakai:\n*${prefix + command} on* (Mute Member)\n*${prefix + command} off* (Cabut Mute)` }, { quoted: m });
        }
    }
};
