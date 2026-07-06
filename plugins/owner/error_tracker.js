const fs = require('fs');
const path = require('path');

module.exports = {
    command: ['cekerror', 'fix'],
    isOwner: true,
    handler: async (sock, msg, { command, args, prefix }) => {
        const { sender, chat } = msg;
        const MB = require('baileys-mbuilder');
        
        const errorFile = path.join(__dirname, '../../database/errors.json');
        let errorDB = [];
        if (fs.existsSync(errorFile)) {
            try { errorDB = JSON.parse(fs.readFileSync(errorFile, 'utf8')); } catch(e) {}
        }
        
        const now = Date.now();
        const window48h = 48 * 60 * 60 * 1000;
        
        // Bersihkan error yang kadaluarsa (lebih dari 48 jam)
        errorDB = errorDB.filter(e => now - e.timestamp < window48h);
        fs.writeFileSync(errorFile, JSON.stringify(errorDB, null, 2));

        if (command === 'cekerror') {
            if (errorDB.length === 0) {
                return sock.sendMessage(chat, { text: `✅ *Aman Terkendali!*\nTidak ada pesan error yang tercatat dalam 48 jam terakhir.` }, { quoted: msg });
            }

            let teks = `🛠️ *LAPORAN ERROR SISTEM*\n_Berikut adalah daftar error dari plugin yang gagal dieksekusi dalam 48 jam terakhir._\n\n`;
            
            errorDB.forEach((err, i) => {
                const waktu = new Date(err.last_seen).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                teks += `*#${i + 1} | Plugin:* \`${err.plugin}\`\n`;
                teks += `🔹 *Command:* .${err.command}\n`;
                teks += `🔹 *Kejadian:* ${err.count}x\n`;
                teks += `🔹 *Terakhir:* ${waktu}\n`;
                teks += `🔹 *Error:* ${err.error}\n\n`;
            });
            
            teks += `💡 *Tips:* Gunakan \`${prefix}fix <nomor>\` untuk menghapus error dari daftar jika sudah diperbaiki.`;

            // Fake reply sistem dari WA
            const fakeReplySystem = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'SYS_ERR_' + Date.now(), participant: '0@s.whatsapp.net' },
                message: { extendedTextMessage: { text: '🔔 Sistem Monitoring Aktif' } }
            };

            const mb = new MB.AIRich(sock);
            await mb.addText(teks)
                    .addImage('https://i.pinimg.com/736x/57/99/68/579968b0d8ae0b2a09c8fcbc18092cce.jpg')
                    .send(chat, { quoted: fakeReplySystem });
            
        } else if (command === 'fix') {
            if (!args[0]) return sock.sendMessage(chat, { text: `Penggunaan: ${prefix}fix <nomor>\nContoh: ${prefix}fix 1` }, { quoted: msg });
            const index = parseInt(args[0]) - 1;
            
            if (isNaN(index) || index < 0 || index >= errorDB.length) {
                return sock.sendMessage(chat, { text: `❌ Nomor error tidak valid.` }, { quoted: msg });
            }
            
            const removed = errorDB.splice(index, 1)[0];
            fs.writeFileSync(errorFile, JSON.stringify(errorDB, null, 2));
            
            // Fake reply sistem dari WA
            const fakeReplySystem = {
                key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: 'SYS_FIX_' + Date.now(), participant: '0@s.whatsapp.net' },
                message: { extendedTextMessage: { text: '🔔 Sistem Diperbarui' } }
            };

            const mb = new MB.AIRich(sock);
            await mb.addText(`✅ *ERROR DISELESAIKAN*\n\nError pada command \`.${removed.command}\` berhasil dihapus dari daftar.\n\nKerja bagus, Owner! 🛠️`)
                    .addImage('https://i.pinimg.com/736x/57/99/68/579968b0d8ae0b2a09c8fcbc18092cce.jpg')
                    .send(chat, { quoted: fakeReplySystem });
        }
    }
};
