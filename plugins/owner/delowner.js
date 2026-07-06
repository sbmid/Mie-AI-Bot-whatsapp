const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['delowner', 'removeowner'],
    isOwner: true,
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        if (!text) {
            return sock.sendMessage(from, { text: `Penggunaan: ${prefix + command} nomor\nContoh: ${prefix + command} 628123456789` }, { quoted: m });
        }

        let phone = text.replace(/\D/g, '');
        if (phone.startsWith('0')) phone = '62' + phone.substring(1);

        const jid = `${phone}@s.whatsapp.net`;

        if (!global.ownerNumber.includes(jid)) {
            return sock.sendMessage(from, { text: `❌ Nomor ${phone} tidak ditemukan dalam daftar owner.` }, { quoted: m });
        }

        // Jangan izinkan hapus owner utama (index 0 di config)
        if (phone === "6283809720392") {
            return sock.sendMessage(from, { text: `❌ Tidak bisa menghapus nomor Owner Utama dari database!` }, { quoted: m });
        }

        // Hapus dari memory global
        global.ownerNumber = global.ownerNumber.filter(num => num !== jid);
        global.ownerProfiles = global.ownerProfiles.filter(p => p.phone !== phone);

        // Hapus dari database/owners.json
        const file = path.join(__dirname, '../../database', 'owners.json');
        let data = { numbers: [], profiles: [] };
        if (fs.existsSync(file)) {
            data = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        
        data.numbers = data.numbers.filter(num => num !== jid);
        data.profiles = data.profiles.filter(p => p.phone !== phone);

        fs.writeFileSync(file, JSON.stringify(data, null, 2));

        await sock.sendMessage(from, { text: `✅ Berhasil menghapus owner dengan nomor +${phone}.` }, { quoted: m });
    }
};
