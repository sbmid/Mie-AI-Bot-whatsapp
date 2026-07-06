const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['deleteakses', 'delnsfw'],
    category: ['owner'],
    isOwner: true,
    handler: async (sock, msg, { text }) => {
        let target = false;

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (mentions && mentions.length > 0) {
            target = mentions[0];
        } else if (quoted) {
            target = quoted;
        } else if (text) {
            target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return sock.sendMessage(msg.chat, { text: 'Tag/Reply atau masukkan nomor user yang ingin dihapus akses NSFW-nya.' }, { quoted: msg });
        }

        let filePath = path.join(__dirname, '../../database/nsfw_access.json');
        let data = { users: [] };
        
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath));
        }
        
        if (!data.users.includes(target)) {
            return sock.sendMessage(msg.chat, { text: 'User tidak ada dalam daftar akses NSFW.' }, { quoted: msg });
        }
        
        data.users = data.users.filter(u => u !== target);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        return sock.sendMessage(msg.chat, { 
            text: `Berhasil menghapus akses NSFW untuk @${target.split('@')[0]}`, 
            mentions: [target] 
        }, { quoted: msg });
    }
};
