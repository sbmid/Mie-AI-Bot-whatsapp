const db = require('../../lib/database');

module.exports = {
    command: ['status', 'groupinfo', 'info'],
    handler: async (sock, m, { prefix, command }) => {
        if (!m.chat.endsWith('@g.us')) {
            return sock.sendMessage(m.chat, { text: "[!] Fitur ini hanya untuk di dalam grup!" }, { quoted: m });
        }

        try {
            // 1. Tarik Metadata & Foto Profil Grup
            const metadata = await sock.groupMetadata(m.chat);
            const groupData = db.getGroup(m.chat);
            
            let ppGroup;
            try {
                ppGroup = await sock.profilePictureUrl(m.chat, 'image');
            } catch {
                ppGroup = 'https://telegra.ph/file/241d7169c0135a95b30b2.jpg'; // Default
            }

            // 2. Olah Data
            const groupName = metadata.subject;
            const totalMember = metadata.participants.length;
            const admins = metadata.participants.filter(p => p.admin !== null).length;
            const creationDate = new Date(metadata.creation * 1000).toLocaleDateString('id-ID', { 
                day: 'numeric', month: 'long', year: 'numeric' 
            });

            // Status Emoji
            const sWelcome = groupData.welcome ? "[!] *Active*" : "[!] *Disabled*";
            const sLeave = groupData.leave ? "[!] *Active*" : "[!] *Disabled*";

            // 3. Susun Tampilan (Estetik Mode)
            let statusMsg = `╭─── 「 *GROUP INFORMATION* 」 ───╮\n│\n`;
            statusMsg += `│ [i] *Nama:* ${groupName}\n`;
            statusMsg += `│ [!] *Dibuat:* ${creationDate}\n`;
            statusMsg += `│ [!] *Member:* ${totalMember}\n`;
            statusMsg += `│ [!] *Admin:* ${admins}\n`;
            statusMsg += `│\n`;
            statusMsg += `├─── 「 *BOT SETTINGS* 」────\n│\n`;
            statusMsg += `│ [!] *Welcome:* ${sWelcome}\n`;
            statusMsg += `│  *Leave:* ${sLeave}\n`;
            statusMsg += `│\n`;
            statusMsg += `╰──────────────────╯\n\n`;
            statusMsg += `_Ketik *${prefix}welcome on/off* untuk mengatur sapaan._`;

            // 4. Kirim sebagai Gambar Biasa
            await sock.sendMessage(m.chat, { 
                image: { url: ppGroup },
                caption: statusMsg
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.chat, { text: "[!] Gagal memuat status grup. Pastikan bot adalah admin!" }, { quoted: m });
        }
    }
};