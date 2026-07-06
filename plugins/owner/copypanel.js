const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '../../panel_template.json');

module.exports = {
    command: ['copypanel', 'savepanel'],
    category: ['owner'],
    description: 'Copy atau simpan template pesan panel dari Customer Service',
    handler: async (sock, m) => {
        const sender = m.sender || m.key.remoteJid;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));

        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: `[!] Akses Ditolak. Khusus Owner.` }, { quoted: m });
        }

        const cmd = m.body?.split(' ')[0]?.replace(/^\./, '').toLowerCase();
        const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
        
        if (!quotedId) {
            return sock.sendMessage(m.chat, { 
                text: `[!] Cara pakai:\nReply pesan panel Customer Service dengan perintah *.copypanel* atau *.savepanel*` 
            }, { quoted: m });
        }

        if (!global.messageSpyDB || !global.messageSpyDB[quotedId]) {
            return sock.sendMessage(m.chat, { 
                text: `[!] Pesan tidak ada di memori!\nPancing panel baru, tunggu muncul, lalu langsung reply.` 
            }, { quoted: m });
        }

        const rawMessage = global.messageSpyDB[quotedId];

        // ====== MODE: .savepanel ======
        if (cmd === 'savepanel') {
            try {
                // Simpan HANYA bagian message-nya ke file permanen
                fs.writeFileSync(TEMPLATE_PATH, JSON.stringify(rawMessage.message, null, 2), 'utf-8');
                return sock.sendMessage(m.chat, { 
                    text: `[i] *TEMPLATE PANEL BERHASIL DISIMPAN!*\n\nSekarang ketik *.fakepanel* kapan saja untuk mengirim panel versi bot kamu dengan data real-time!\n\nTemplate disimpan di:\n\`panel_template.json\`` 
                }, { quoted: m });
            } catch (e) {
                return sock.sendMessage(m.chat, { text: `[!] Gagal simpan: ${e.message}` }, { quoted: m });
            }
        }

        // ====== MODE: .copypanel ======
        try {
            // 1. Relay 100% struktur murni
            await sock.relayMessage(m.chat, rawMessage.message, { 
                messageId: m.key.id + "CP"
            });

            // 2. Kirim juga file JSON-nya
            const jsonString = JSON.stringify(rawMessage, null, 2);
            await sock.sendMessage(m.chat, {
                document: Buffer.from(jsonString, 'utf-8'),
                mimetype: 'application/json',
                fileName: `COPAS_${quotedId}.json`,
                caption: `[i] *COPYPANEL BERHASIL*\n\nGunakan *.savepanel* (reply pesan yang sama) untuk menyimpan template agar *.fakepanel* bisa pakai data real-time!`
            }, { quoted: m });

        } catch (e) {
            await sock.sendMessage(m.chat, { text: `[!] Gagal: ${e.message}` }, { quoted: m });
        }
    }
};
