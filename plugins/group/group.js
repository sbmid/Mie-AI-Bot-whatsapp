/**
 * Mie AI - Group Settings (Anti-LID & JID Conflict)
 */
module.exports = {
    command: ['group', 'grup'],
    handler: async (sock, m, { text, prefix, command, isOwner }) => {
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fitur ini cuma buat di grup!" }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(m.chat);
        const participants = groupMetadata.participants;

        // [!] CARI ID BOT SENDIRI (Paling Akurat)
        // Kita cek murni dari koneksi yang sedang aktif
        const botId = sock.user.id.split(':')[0];
        const botLid = sock.user.lid ? sock.user.lid.split(':')[0] : null;

        const botEntry = participants.find(p => 
            p.id.startsWith(botId) || (botLid && p.id.startsWith(botLid))
        );

        const botIsAdmin = botEntry?.admin === 'admin' || botEntry?.admin === 'superadmin';

        if (!botIsAdmin) {
            return sock.sendMessage(m.chat, { 
                text: "[!] Mei masih ngerasa bukan admin. Masalahnya nomor HP bot & ID LID di grup beda format. Coba *Demote* lalu *Promote* lagi Mei jadi admin biar sistemnya seger!" 
            }, { quoted: m });
        }

        // CEK IZIN PENGIRIM
        const senderEntry = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender);
        const senderIsAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';

        if (!senderIsAdmin && !isOwner) {
            return sock.sendMessage(m.chat, { text: "[!] Cuma Admin yang bisa mengatur grup!" }, { quoted: m });
        }

        if (!text) {
            return sock.sendMessage(m.chat, { text: `Gunakan:\n*${prefix + command} open*\n*${prefix + command} close*` }, { quoted: m });
        }

        const action = text.toLowerCase();
        try {
            if (action === 'open' || action === 'buka') {
                await sock.groupSettingUpdate(m.chat, 'not_announcement');
                return sock.sendMessage(m.chat, { text: "[i] *GROUP OPENED*" }, { quoted: m });
            } else if (action === 'close' || action === 'tutup') {
                await sock.groupSettingUpdate(m.chat, 'announcement');
                return sock.sendMessage(m.chat, { text: "[!] *GROUP CLOSED*" }, { quoted: m });
            }
        } catch (e) {
            console.error(e);
            return sock.sendMessage(m.chat, { text: "[!] Gagal merubah setelan. Pastikan Mei benar-benar Admin!" }, { quoted: m });
        }
    }
};