module.exports = {
    command: ['inspect', 'cekmeta'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;
        
        // Ambil konteks pesan yang di-reply jika ada
        const quotedContext = m.message.extendedTextMessage?.contextInfo;
        const quotedMsg = quotedContext?.quotedMessage;

        let targetData = m;
        if (quotedMsg) {
            targetData = quotedMsg;
        }

        // Dump data pesan ke JSON string
        const jsonDump = JSON.stringify(targetData, null, 2);

        await sock.sendMessage(from, { text: `[!] *METADATA PESAN*\n\n\`\`\`json\n${jsonDump}\n\`\`\`` }, { quoted: m });
    }
};
