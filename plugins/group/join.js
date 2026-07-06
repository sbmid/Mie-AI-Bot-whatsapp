/**
 * Mie AI - Join Group Plugin (Owner Only)
 * Fungsi: Memasukkan bot ke grup melalui link undangan.
 */
module.exports = {
    command: ['join', 'joingc'],
    handler: async (sock, m, { text, prefix, command }) => {
        const sender = m.sender;

        const isOwner = global.ownerNumber.includes(sender);
        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nMaaf, hanya Owner yang bisa menarik Mei ke dalam grup.` 
            }, { quoted: m });
        }

        if (!text) {
            return sock.sendMessage(m.chat, { 
                text: `Mana link grupnya, bos? \n\nContoh:\n*${prefix + command} https://chat.whatsapp.com/ExAmPlE123*` 
            }, { quoted: m });
        }

        const inviteCode = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);

        if (!inviteCode) {
            return sock.sendMessage(m.chat, { 
                text: "Link-nya nggak valid tuh. Pastikan link undangan grup WhatsApp ya!" 
            }, { quoted: m });
        }

        const resCode = inviteCode[1];

        try {
            await sock.groupAcceptInvite(resCode);

            await sock.sendMessage(m.chat, { 
                text: `[i] *BERHASIL JOIN*\n\nMei sudah masuk ke grup tersebut, bos! Silakan cek.` 
            }, { quoted: m });

        } catch (err) {
            console.error("Error Join GC:", err);
            sock.sendMessage(m.chat, { 
                text: `[!] *GAGAL JOIN*\n\nMungkin link sudah kedaluwarsa, bot sudah dikeluarkan, atau Mei di-ban dari grup itu.` 
            }, { quoted: m });
        }
    }
};