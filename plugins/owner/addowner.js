const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['addowner'],
    isOwner: true,
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        if (!text) {
            return sock.sendMessage(from, { text: `Penggunaan: ${prefix + command} nomor|nama\nContoh: ${prefix + command} 628123456789|Budi` }, { quoted: m });
        }

        let [phone, name] = text.split('|');
        if (!phone) return sock.sendMessage(from, { text: `❌ Nomor tidak boleh kosong.` }, { quoted: m });
        
        phone = phone.replace(/\D/g, '');
        if (!phone.startsWith('62')) {
            // Asumsi lokal Indo jika tanpa kode negara
            if (phone.startsWith('0')) phone = '62' + phone.substring(1);
        }
        
        name = name ? name.trim() : 'Owner Baru';

        const jid = `${phone}@s.whatsapp.net`;

        if (global.ownerNumber.includes(jid)) {
            return sock.sendMessage(from, { text: `❌ Nomor ${phone} sudah menjadi owner.` }, { quoted: m });
        }

        // Tambah ke memory global
        global.ownerNumber.push(jid);
        global.ownerProfiles.push({
            name: name,
            phone: phone,
            title: "Co-Owner",
            organization: "Mie AI"
        });

        // Simpan ke database/owners.json
        const dbPath = path.join(__dirname, '../../database');
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
        
        const file = path.join(dbPath, 'owners.json');
        let data = { numbers: [], profiles: [] };
        if (fs.existsSync(file)) {
            data = JSON.parse(fs.readFileSync(file, 'utf8'));
        }
        
        data.numbers.push(jid);
        data.profiles.push({
            name: name,
            phone: phone,
            title: "Co-Owner",
            organization: "Mie AI"
        });

        fs.writeFileSync(file, JSON.stringify(data, null, 2));

        await sock.sendMessage(from, { text: `✅ Berhasil menambahkan ${name} (+${phone}) sebagai Owner baru!\n\nPerubahan ini permanen dan langsung aktif. Silakan cek dengan command .owner` }, { quoted: m });
    }
};
