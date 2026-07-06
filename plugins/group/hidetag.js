/**
 * Mie AI - Fitur Hidetag
 * Fungsi: Tag semua member grup secara tersembunyi
 */
module.exports = {
    command: ['hidetag', 'ht', 'h'],
    handler: async (sock, m, { text, isOwner }) => {
    
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fitur ini hanya bisa digunakan di dalam grup!" }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const isAdmin = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender)?.admin;

        if (!isAdmin && !isOwner) {
            return sock.sendMessage(m.chat, { text: "[!] Hanya Admin atau Owner yang bisa menggunakan hidetag!" }, { quoted: m });
        }
        const mems = participants.map(p => p.id);

        // Jika tidak ada teks, gunakan pesan default
        const messageText = text || "Panggilan Sayang untuk Semua Member! [!]";

        await sock.sendMessage(m.chat, { 
            text: messageText, 
            mentions: mems 
        }, { quoted: m });

    }
};