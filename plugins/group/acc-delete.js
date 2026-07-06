module.exports = {
    command: ['acc', 'reject', 'del', 'delete'],
    handler: async (sock, m, { text, command }) => {
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

        try {
            if (command === 'acc' || command === 'reject') {
                const requests = await sock.groupRequestParticipantsList(from);
                if (!requests || requests.length === 0) return sock.sendMessage(from, { text: "Tidak ada daftar permintaan bergabung!" }, { quoted: m });

                let action = command === "reject" ? "reject" : "approve";
                let targets = requests.map(e => e.jid);
                
                // If text is not 'all', accept/reject only the first one or target
                if (text && text.toLowerCase() !== "all") {
                    targets = [requests[0].jid]; // Just process one for simplicity if not 'all'
                }

                await sock.groupRequestParticipantsUpdate(from, targets, action);
                await sock.sendMessage(
                    from,
                    {
                        text: `[i] Sukses *${action}* @${targets.map(e => e.split("@")[0]).join(" @")}`,
                        mentions: targets
                    },
                    { quoted: m }
                );

            } else if (command === 'del' || command === 'delete') {
                if (!m.message?.extendedTextMessage?.contextInfo?.stanzaId) {
                    return sock.sendMessage(from, { text: "Reply pesan yang ingin dihapus!" }, { quoted: m });
                }

                const key = {
                    remoteJid: from,
                    fromMe: m.message.extendedTextMessage.contextInfo.participant.startsWith(botNumber),
                    id: m.message.extendedTextMessage.contextInfo.stanzaId,
                    participant: m.message.extendedTextMessage.contextInfo.participant
                };

                await sock.sendMessage(from, { delete: key });
            }
        } catch (e) {
            console.error("Error at acc-delete:", e);
            sock.sendMessage(from, { text: "[!] Terjadi kesalahan atau tidak punya izin." }, { quoted: m });
        }
    }
};
