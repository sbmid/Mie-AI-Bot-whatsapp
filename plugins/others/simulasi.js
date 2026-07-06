const groupUpdate = require('../../lib/groupUpdate');

/**
 * Fungsi: Mengetes fitur welcome tanpa harus ada member asli yang join/out
 */
module.exports = {
    command: ['simulasi', 'welcome-test'],
    handler: async (sock, m, { text }) => {
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fit war ini cuma bisa di grup!" }, { quoted: m });
        }

        const args = text.toLowerCase().trim();
        if (args !== 'add' && args !== 'remove') {
            return sock.sendMessage(m.chat, { 
                text: "Gunakan format:\n*.simulasi add* (untuk tes masuk)\n*.simulasi remove* (untuk tes keluar)" 
            }, { quoted: m });
        }

        const fakeAnu = {
            id: m.chat,
            participants: [m.sender], 
            action: args
        };

        await sock.sendMessage(m.chat, { text: `[!] Memulai simulasi *${args}*...` }, { quoted: m });

        try {
            await groupUpdate(sock, fakeAnu);
        } catch (e) {
            console.error(e);
            sock.sendMessage(m.chat, { text: "[!] Terjadi error saat simulasi. Cek terminal!" }, { quoted: m });
        }
    }
};