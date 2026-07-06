const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * MIE AI - Channel Uploader 
 * Format: .upch [id_saluran] [teks] jika media replay aja tanapa teks .upch [id_saluran]
 */

module.exports = {
    command: ['upch', 'postch'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;

        // Ambil Argumen ID dan Teks
        if (!text) return sock.sendMessage(from, { text: ` *Contoh:* ${prefix + command} [id] [teks]` }, { quoted: m });
        
        const args = text.trim().split(' ');
        let targetJid = args[0];
        const contentText = args.slice(1).join(' ');

        if (!targetJid.endsWith('@newsletter')) targetJid += '@newsletter';

        // DETEKSI MEDIA (ROBUST)
        const extractMedia = (msgObj) => {
            if (!msgObj) return null;
            const raw = msgObj.msg || msgObj.raw?.message || msgObj.message || msgObj;
            if (raw.mimetype) return raw;
            const type = Object.keys(raw).find(k => k.endsWith('Message') && k !== 'senderKeyDistributionMessage');
            if (type && raw[type]) return raw[type];
            return raw;
        };

        const quotedManual = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        let qContent = null;
        if (m.quoted) {
            qContent = extractMedia(m.quoted);
        } else if (quotedManual) {
            qContent = extractMedia(quotedManual);
        } else {
            qContent = extractMedia(m);
        }

        let mime = qContent?.mimetype || '';
        let msg = qContent;

        try {
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            // KALO MAU PAKEK MEDIA
            if (mime && /image|video|audio|sticker|document/.test(mime)) {
                const streamType = mime.split('/')[0];
                const stream = await downloadContentFromMessage(msg, streamType === 'sticker' ? 'sticker' : streamType === 'audio' ? 'audio' : streamType === 'video' ? 'video' : 'image');
                
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                let sendOptions = {};
                if (/image/.test(mime)) {
                    sendOptions = { image: buffer, caption: contentText };
                } else if (/video/.test(mime)) {
                    sendOptions = { video: buffer, caption: contentText };
                } else if (/audio/.test(mime)) {
                    sendOptions = { audio: buffer, mimetype: mime, ptt: false };
                } else if (/sticker/.test(mime)) {
                    sendOptions = { sticker: buffer };
                } else {
                    sendOptions = { document: buffer, mimetype: mime, fileName: msg.fileName || 'MieAI_File', caption: contentText };
                }

                await sock.sendMessage(targetJid, sendOptions);
            } 
            // INI KALOK TEKS SAJA
            else {
                await sock.sendMessage(targetJid, { text: contentText || text.replace(args[0], '').trim() });
            }

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
            return sock.sendMessage(from, { text: ` *Sukses Terkirim!* \nCek salurannya sekarang ya! ` }, { quoted: m });

        } catch (e) {
            console.error("Error Robust UpCH:", e);
            sock.sendMessage(from, { text: `[!] *Gagal Bos!* \nDetail: ${e.message}` }, { quoted: m });
        }
    }
}