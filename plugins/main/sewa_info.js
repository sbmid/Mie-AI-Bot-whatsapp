const db = require('../../lib/database');

module.exports = {
    command: ['listsewa', 'hargasewa'],
    handler: async (sock, msg, { command, args, prefix }) => {
        const { chat } = msg;
        const settings = db.getBotSettings();
        const info = settings.sewa_price_list || "Daftar Harga Sewa Bot Belum Diatur oleh Owner.";
        
        return sock.sendMessage(chat, { text: info }, { quoted: msg });
    }
};
