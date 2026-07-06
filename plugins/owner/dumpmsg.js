const util = require('util');
const fs = require('fs');

module.exports = {
    command: ['dump', 'dumpmsg'],
    category: ['owner'],
    description: 'Menampilkan struktur pesan JSON asli dari pesan yang di-reply (termasuk media, stiker, button, dll)',
    handler: async (sock, m, { command }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.` 
            }, { quoted: m });
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return sock.sendMessage(m.chat, { text: 'Reply pesan yang ingin dilihat struktur JSON-nya' }, { quoted: m });
        }

        const jsonStr = JSON.stringify(quoted, null, 2);
        
        if (jsonStr.length > 50000) {
            // Jika terlalu panjang, kirim sebagai file dokumen
            const buf = Buffer.from(jsonStr, 'utf-8');
            return sock.sendMessage(m.chat, {
                document: buf,
                mimetype: 'application/json',
                fileName: 'dump_message.json',
                caption: 'Struktur terlalu panjang, dikirim sebagai dokumen'
            }, { quoted: m });
        } else {
            return sock.sendMessage(m.chat, { text: jsonStr }, { quoted: m });
        }
    }
};
