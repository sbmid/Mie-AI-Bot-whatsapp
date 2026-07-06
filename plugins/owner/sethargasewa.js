const db = require('../../lib/database');

module.exports = {
    command: ['sethargasewa', 'setharga30hari'],
    handler: async (sock, m, { text, command, prefix }) => {
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(m.chat, { text: `[!] Fitur ini khusus Owner!` }, { quoted: m });

        if (!text || isNaN(text)) {
            return sock.sendMessage(m.chat, { text: `[!] Masukkan besaran nominal untuk 30 hari dasar!\n\nContoh:\n*${prefix + command} 5000*` }, { quoted: m });
        }

        const basePrice = parseInt(text);
        if (basePrice < 1000) {
            return sock.sendMessage(m.chat, { text: `[!] Base harga 30 hari minimal Rp 1.000` }, { quoted: m });
        }

        // Simpan ke database Supabase via bot_settings
        db.setBotSettings('sewa_harga_base', basePrice);
        
        await sock.sendMessage(m.chat, { text: `[i] Berhasil menetapkan harga patokan Sewa 30 Hari menjadi: *Rp ${basePrice.toLocaleString('id-ID')}*\n\n*(Harga harian otomatis dihitung berdasarkan nilai ini)*` }, { quoted: m });
    }
};
