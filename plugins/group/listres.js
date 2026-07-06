const db = require('../../lib/database');

module.exports = {
    command: ['addres', 'delres', 'listres'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const sender = m.sender;
        const senderId = sender.split(':')[0] + '@s.whatsapp.net'; // Normalisasi JID untuk menghindari devisi port

        if (!m.isGroup) return sock.sendMessage(from, { text: "[!] Fitur khusus grup." }, { quoted: m });
        
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        // Validasi Admin Grup (support ID, JID, dan LID)
        const isGroupAdmin = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender)?.admin;
        // Validasi Owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => senderId.startsWith(o.split('@')[0]));
        
        // Gabungkan status: izinkan jika dia Admin Grup ATAU Owner
        const isAdmin = isGroupAdmin || isOwner;

        if (!isAdmin) return sock.sendMessage(from, { text: "[!] Akses Ditolak! Hanya untuk Admin." }, { quoted: m });

        const data = db.read();
        if (!data.chats) data.chats = {};
        if (!data.chats[from]) data.chats[from] = { listrs: {} };
        if (!data.chats[from].listrs) data.chats[from].listrs = {};

        if (command === 'addres') {
            let keyword, response;
            
            // Cek apakah perintah ini me-reply pesan
            let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted) {
                // Ekstrak teks dari pesan yang di-reply
                response = quoted.conversation || quoted.extendedTextMessage?.text || "";
                keyword = text.trim().toLowerCase();
                
                if (!keyword || !response) return sock.sendMessage(from, { text: `[!] Format: Reply pesan yang mau dijadikan respon, lalu ketik:\n${prefix + command} keyword` }, { quoted: m });
            } else {
                if (!text.includes('@')) return sock.sendMessage(from, { text: `[!] Format: ${prefix + command} keyword@respon\nAtau reply pesan dengan format:\n${prefix + command} keyword` }, { quoted: m });
                
                const [key, ...resArr] = text.split('@');
                response = resArr.join('@').trim();
                keyword = key.trim().toLowerCase();
            }

            data.chats[from].listrs[keyword] = response;
            // Panggil saveAll untuk autosync ke supabase jika tersedia
            if (db.saveAll) db.saveAll();
            
            return sock.sendMessage(from, { text: `[i] Berhasil menambah respon.\nKata: ${keyword}` }, { quoted: m });
        }

        if (command === 'delres') {
            if (!text) return sock.sendMessage(from, { text: `[!] Format: ${prefix + command} keyword` }, { quoted: m });
            
            const keyword = text.trim().toLowerCase();
            if (!data.chats[from].listrs[keyword]) return sock.sendMessage(from, { text: `[!] Keyword *${keyword}* tidak ada.` }, { quoted: m });

            delete data.chats[from].listrs[keyword];
            if (db.saveAll) db.saveAll();
            
            return sock.sendMessage(from, { text: `[!] Respon *${keyword}* dihapus.` }, { quoted: m });
        }

        if (command === 'listres') {
            const list = data.chats[from].listrs;
            const keys = Object.keys(list);

            if (keys.length === 0) return sock.sendMessage(from, { text: "[!] Belum ada daftar respon otomatis." }, { quoted: m });

            let txt = `[!] *LIST RESPON GRUP*\n\n`;
            keys.forEach((v) => {
                txt += `• ${v}\n`;
            });
            
            return sock.sendMessage(from, { text: txt.trim() }, { quoted: m });
        }
    },

    before: async (sock, m) => {
        if (!m.isGroup || !m.body || m.body.startsWith('.')) return false;

        const from = m.chat;
        const data = db.read();
        
        if (data.chats?.[from]?.listrs) {
            const keyword = m.body.toLowerCase().trim();
            const response = data.chats[from].listrs[keyword];

            if (response) {
                await sock.sendMessage(from, { text: response }, { quoted: m });
                return true; 
            }
        }
        return false;
    }
};
