const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['savedump', 'dumpwaf', 'collectwaf'],
    category: ['owner'],
    description: 'Menyimpan struktur pesan yang di-reply ke database lokal (untuk mengumpulkan unreleased WA feature payloads)',
    handler: async (sock, m, { text }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.` 
            }, { quoted: m });
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return sock.sendMessage(m.chat, { text: 'Reply pesan (Stiker, Button, Fitur Spesial) yang ingin disimpan datanya' }, { quoted: m });
        }

        const filePath = path.join(process.cwd(), 'special_wa_features.json');
        let currentData = [];

        if (fs.existsSync(filePath)) {
            try {
                currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                currentData = [];
            }
        }

        const payload = {
            savedAt: new Date().toISOString(),
            note: text || 'No Note',
            messageContent: quoted
        };

        currentData.push(payload);
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));

        return sock.sendMessage(m.chat, { text: `[i] Berhasil menyimpan struktur pesan ke special_wa_features.json\nTotal data terkumpul: ${currentData.length}` }, { quoted: m });
    }
};
