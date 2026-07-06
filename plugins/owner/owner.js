const { quickContact, createContactCards } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['owner', 'creator', 'dev'],
    handler: async (sock, m) => {
        const from = m.chat; // Gunakan m.chat agar dikirim ke grup jika command dipanggil di grup
        const bannerTop = global.thumb;

        // Ambil semua profil owner dari config
        const profiles = (global.ownerProfiles || []).filter(p => p && p.name && p.phone);
        if (profiles.length === 0) {
            return sock.sendMessage(from, { text: '❌ Belum ada data owner yang dikonfigurasi di config.js.' }, { quoted: m });
        }

        try {
            // 1. Kirim banner + caption daftar owner
            const captionLine = profiles.map((p, i) =>
                `${i + 1}. *${p.name}* — _${p.title || 'Owner'}_`
            ).join('\n');
            const ownerMsg = `👑 *Owner & Developer ${global.botName || 'Bot'}*\n\n${captionLine}\n\n_Tap kontak di bawah untuk langsung chat!_`;

            if (bannerTop && bannerTop.startsWith('http')) {
                await sock.sendMessage(from, { image: { url: bannerTop }, caption: ownerMsg }, { quoted: m });
            } else {
                await sock.sendMessage(from, { text: ownerMsg }, { quoted: m });
            }

            // 2. Buat array vcard untuk semua owner
            const vcards = profiles.map(p => {
                const phone = String(p.phone || '').replace(/\D/g, ''); // pastikan angka saja
                const name = p.name || 'Owner';
                const org = p.organization || p.title || 'Mie AI Corp';
                return {
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${org};\nTEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\nEND:VCARD`
                };
            });

            // 3. Kirim menggunakan API contacts standard
            await sock.sendMessage(from, { 
                contacts: { 
                    displayName: `Tim Owner ${global.botName || 'Bot'}`, 
                    contacts: vcards 
                } 
            }, { quoted: m });

        } catch (e) {
            console.error('[OWNER] Error:', e.message);
            // Fallback: kirim teks saja
            await sock.sendMessage(from, {
                text: `👑 *Owner ${global.botName || 'Bot'}*\n\n` + profiles.map((p, i) =>
                    `${i + 1}. *${p.name}*\n   📱 wa.me/${p.phone}\n   💼 ${p.title || ''}`
                ).join('\n\n')
            }, { quoted: m });
        }
    }
};