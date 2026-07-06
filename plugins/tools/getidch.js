module.exports = {
    command: ['getidch'],
    handler: async (sock, m, { text, prefix, command }) => {
        // 1. Validasi Input
        if (!text) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *SALAH CARA NYA, BOS!*\n\nFormat: *${prefix + command}* [link saluran]\nContoh: *${prefix + command}* https://whatsapp.com/channel/0029Vb7nM2MLtOj4wWHC6G2Y` 
            }, { quoted: m });
        }

        // 2. Ekstrak Kode dari Link
        const inviteCode = text.split('channel/')[1] || text.split('/').pop();
        
        if (!inviteCode || inviteCode.length < 10) {
            return sock.sendMessage(m.chat, { text: "[!] *LINK TIDAK VALID!* Pastikan linknya benar ya." }, { quoted: m });
        }

        try {
            // 3. Ambil Metadata Saluran dari WhatsApp
            const res = await sock.newsletterMetadata("invite", inviteCode);

            // 4. Susun Pesan Informasi
            let info = `[!] *SALURAN / NEWSLETTER DATA* [!]\n\n` +
                       `◦ *Nama:* ${res.name || 'Tidak diketahui'}\n` +
                       `◦ *JID:* ${res.id}\n` +
                       `◦ *Followers:* ${res.subscribers || 'Disembunyikan'}\n` +
                       `◦ *Dibuat Pada:* ${res.creation_time ? new Date(res.creation_time * 1000).toLocaleDateString('id-ID') : '-'}\n` +
                       `◦ *Status Bot:* ${res.viewer_metadata?.role || 'Bukan Admin'}\n\n` +
                       `*ID di atas bisa gunakan untuk fitur broadcast atau monitoring!* [!]`;

            // 5. Kirim Hasil
            await sock.sendMessage(m.chat, { 
                image: { url: "https://i.pinimg.com/1200x/8a/02/08/8a02089281134858dbf54eaeaee46225.jpg" },
                caption: info
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            await sock.sendMessage(m.chat, { 
                text: `[!] *ERROR:* Saluran tidak ditemukan atau link sudah kadaluarsa.\n\n_Detail: ${e.message}_` 
            }, { quoted: m });
        }
    }
};