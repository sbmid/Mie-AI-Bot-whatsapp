module.exports = {
    command: ['add', 'kick', 'promote', 'demote', 'open', 'close', 'tutup', 'buka', 'linkgc', 'revoke', 'setnamegc', 'setdesk'],
    handler: async (sock, m, { args, text, command, prefix }) => {
        const from = m.chat;

        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: "[!] Fitur ini khusus untuk Grup!" }, { quoted: m });

        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants;

        const botNumber = sock.user.id.split(':')[0].split('@')[0];

        const isAdmin = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender)?.admin;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));

        if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "[!] Hanya Admin Grup atau Owner yang bisa menggunakan fitur ini!" }, { quoted: m });

        const isBotAdmin = participants.find(p => p.id.startsWith(botNumber) || (p.jid && p.jid.startsWith(botNumber)))?.admin;
        if (!isBotAdmin) return sock.sendMessage(from, { text: "[!] Jadikan bot admin terlebih dahulu!" }, { quoted: m });

        let target = '';
        if (m.mentionedJid && m.mentionedJid[0]) {
            target = m.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } else if (text) {
            target = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        try {
            switch (command) {
                case 'add':
                    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(from, { text: `Contoh:\n${prefix}add 628xxx` }, { quoted: m });
                    await sock.groupParticipantsUpdate(from, [target], "add");
                    await sock.sendMessage(from, { text: `[i] Berhasil menambahkan @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
                    break;
                case 'kick':
                    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(from, { text: "Tag/Reply orang yang mau di-kick!" }, { quoted: m });
                    await sock.groupParticipantsUpdate(from, [target], "remove");
                    await sock.sendMessage(from, { text: `[i] Berhasil mengeluarkan @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
                    break;
                case 'promote':
                    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(from, { text: "Tag/Reply orang yang mau di-promote!" }, { quoted: m });
                    await sock.groupParticipantsUpdate(from, [target], "promote");
                    await sock.sendMessage(from, { text: `[i] @${target.split('@')[0]} sekarang adalah Admin!`, mentions: [target] }, { quoted: m });
                    break;
                case 'demote':
                    if (!target || target === '@s.whatsapp.net') return sock.sendMessage(from, { text: "Tag/Reply orang yang mau di-demote!" }, { quoted: m });
                    await sock.groupParticipantsUpdate(from, [target], "demote");
                    await sock.sendMessage(from, { text: `[i] @${target.split('@')[0]} telah diturunkan menjadi member biasa.`, mentions: [target] }, { quoted: m });
                    break;
                case 'open':
                case 'buka':
                    await sock.groupSettingUpdate(from, "not_announcement");
                    await sock.sendMessage(from, { text: "[i] Grup telah dibuka, semua anggota dapat mengirim pesan!" }, { quoted: m });
                    break;
                case 'close':
                case 'tutup':
                    await sock.groupSettingUpdate(from, "announcement");
                    await sock.sendMessage(from, { text: "[i] Grup telah ditutup, hanya admin yang dapat mengirim pesan!" }, { quoted: m });
                    break;
                case 'linkgc':
                    const code = await sock.groupInviteCode(from);
                    await sock.sendMessage(from, { text: `[!] *Link Group:*\nhttps://chat.whatsapp.com/${code}` }, { quoted: m });
                    break;
                case 'revoke':
                    await sock.groupRevokeInvite(from);
                    await sock.sendMessage(from, { text: "[i] Tautan undangan grup berhasil diatur ulang!" }, { quoted: m });
                    break;
                case 'setnamegc':
                    if (!text) return sock.sendMessage(from, { text: "Masukkan nama grup baru!" }, { quoted: m });
                    await sock.groupUpdateSubject(from, text);
                    await sock.sendMessage(from, { text: "[i] Nama grup berhasil diubah!" }, { quoted: m });
                    break;
                case 'setdesk':
                    if (!text) return sock.sendMessage(from, { text: "Masukkan deskripsi grup baru!" }, { quoted: m });
                    await sock.groupUpdateDescription(from, text);
                    await sock.sendMessage(from, { text: "[i] Deskripsi grup berhasil diubah!" }, { quoted: m });
                    break;
            }
        } catch (e) {
            console.error(e);
            sock.sendMessage(from, { text: `[!] Terjadi kesalahan:\n${e.message}` }, { quoted: m });
        }
    }
};
