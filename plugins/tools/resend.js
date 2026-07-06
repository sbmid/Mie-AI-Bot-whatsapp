module.exports = {
    command: ['resend', 'kirimulang', 'teruskan'],
    category: ['tools'],
    description: 'Mengirim ulang pesan/media dari pesan yang direply atau dikirim',
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;
        
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Prioritaskan pesan yang direply
        let baseMsg = quoted || m.message;

        if (!baseMsg) {
            return sock.sendMessage(from, { text: "[!] Reply pesan atau sertakan media yang ingin dikirim ulang." }, { quoted: m });
        }

        try {
            // Melakukan relay message native dari payload asli tanpa harus mengunduh buffer
            await sock.relayMessage(from, baseMsg, {});
        } catch (e) {
            console.error('Resend Error:', e.message);
            // Fallback forwarding standard jika relay murni gagal
            try {
                await sock.sendMessage(from, { forward: m.hasQuotedMsg ? m.quoted : m });
            } catch (fallbackError) {
                return sock.sendMessage(from, { text: `Gagal mengirim ulang pesan: ${e.message}` }, { quoted: m });
            }
        }
    }
};
