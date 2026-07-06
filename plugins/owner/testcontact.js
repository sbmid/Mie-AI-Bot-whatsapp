// testcontact.js
module.exports = {
    command: ['testcontact'],
    isOwner: true,
    handler: async (sock, m) => {
        const from = m.chat;
        try {
            const baileys = require('@whiskeysockets/baileys');
            const { quickContact, createContactCards } = baileys;
            
            if (quickContact && createContactCards) {
                const c1 = quickContact('Alice', '6283809720392');
                const c2 = quickContact('Bob', '6281234567890');
                const cards = createContactCards([c1, c2]);
                await sock.sendMessage(from, cards, { quoted: m });
            } else {
                await sock.sendMessage(from, { text: 'Fungsi quickContact tidak ada.' }, { quoted: m });
            }
        } catch (e) {
            await sock.sendMessage(from, { text: e.message }, { quoted: m });
        }
    }
};
