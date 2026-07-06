const { downloadMedia, uploadToCatbox } = require('../../lib/helper');

module.exports = {
    command: ['tourl', 'up'],
    handler: async (sock, m) => {
        const from = m.key.remoteJid;
        
        if (typeof uploadToCatbox !== 'function') {
            return sock.sendMessage(from, { text: '[!] Error: Fungsi upload tidak ditemukan. Restart bot!' });
        }

        let quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;
        if (baseMsg.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const type = Object.keys(baseMsg).find(v => 
            (v.endsWith('Message') || v.endsWith('message')) && 
            !['senderKeyDistributionMessage', 'protocolMessage', 'extendedTextMessage'].includes(v)
        );

        if (!type || !baseMsg[type]?.url) {
            return sock.sendMessage(from, { text: 'Balas (reply) media yang ingin diupload ke link!' }, { quoted: m });
        }

        try {
            const buffer = await downloadMedia({ [type]: baseMsg[type] });
            const link = await uploadToCatbox(buffer);

            await sock.sendMessage(from, { 
                text: `[i] *BERHASIL UPLOAD*\n\n[!] *URL:* ${link}\n[!] *Tipe:* ${type.replace('Message', '')}\n\n_File disimpan permanen di Catbox._` 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            throw e; 
        }
    }
};