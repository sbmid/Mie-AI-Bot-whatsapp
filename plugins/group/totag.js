module.exports = {
    command: ['totag', 'tag'],
    handler: async (sock, m, { isOwner }) => {
        if (!m.chat.endsWith('@g.us')) return sock.sendMessage(m.chat, { text: "Cuma bisa di grup!" });

        const msgType = Object.keys(m.message || {})[0];
        const contextInfo = m.message[msgType]?.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;

        if (!quotedMessage) {
            console.log("RAW MSG STRUCTURE:", JSON.stringify(m.message, null, 2));
            return sock.sendMessage(m.chat, { text: "[!] Tetap nggak kedeteksi. Coba reply sekali lagi ya!" }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        const isAdmin = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender)?.admin;

        if (!isAdmin && !isOwner) return sock.sendMessage(m.chat, { text: "Hanya Admin/Owner!" });

        const mems = participants.map(p => p.id);

        try {
            const fakeQuoted = {
                key: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant || contextInfo.remoteJid
                },
                message: quotedMessage
            };

            await sock.sendMessage(m.chat, { 
                forward: fakeQuoted, 
                contextInfo: { 
                    mentionedJid: mems,
                    isForwarded: false 
                } 
            });

        } catch (e) {
            console.error("Error Totag Manual:", e);
            const content = quotedMessage.conversation || quotedMessage.extendedTextMessage?.text || "Panggilan Sayang! [!]";
            await sock.sendMessage(m.chat, { text: content, mentions: mems });
        }
    }
};