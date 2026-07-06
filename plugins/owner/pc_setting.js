module.exports = {
    command: ['pc'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const isOwner = global.ownerNumber.includes(m.sender);
        
        if (!isOwner) return; 
        if (!text) return sock.sendMessage(from, { text: `[!] *Contoh:* ${prefix + command} on / off` }, { quoted: m });

        const data = global.db.read();
        
        if (!data.settings) data.settings = {};
        if (!data.settings[sock.user.jid]) {
            data.settings[sock.user.jid] = { publicModePC: false };
        }

        if (text === 'on') {
            data.settings[sock.user.jid].publicModePC = true;
            await sock.sendMessage(from, { text: "[i] *Mie AI Private Mode:* AKTIF\nUser level 5+ sekarang bisa chat privat." }, { quoted: m });
        } else if (text === 'off') {
            data.settings[sock.user.jid].publicModePC = false;
            await sock.sendMessage(from, { text: "[!] *Mie AI Private Mode:* MATI\nHanya Owner yang bisa chat privat." }, { quoted: m });
        }
    }
};