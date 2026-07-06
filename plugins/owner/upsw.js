const { downloadMedia } = require('../../lib/helper');

module.exports = {
    command: ['upsw', 'upstatus', 'upstory'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat || m.key.remoteJid;
        const sender = m.sender || m.key.participant || from;

        // Validasi Owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
        if (!isOwner) {
            return sock.sendMessage(from, { text: '[!] *Akses Ditolak!* Fitur ini khusus untuk Owner Bot.' }, { quoted: m });
        }

        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;
        
        // Ekstrak pesan yang dibungkus
        if (baseMsg.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const type = Object.keys(baseMsg).find(v => 
            (v.endsWith('Message') || v.endsWith('message')) && 
            !['senderKeyDistributionMessage', 'protocolMessage', 'extendedTextMessage'].includes(v)
        );

        if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: global.waitEmoji || '[~]', key: m.key } });
        else if (global.waitMode === "text") await sock.sendMessage(from, { text: global.waitText || '_Sedang diproses..._' }, { quoted: m });

        try {
            // Dapatkan list kontak seluruh user di DB agar status terlihat oleh mereka
            // (Asumsi bot sudah pernah berinteraksi/menyimpan kontak mereka)
            const users = Object.keys(global.db?.users || {});
            
            // Tambahkan nomor owner ke dalam viewer (jaga-jaga)
            global.ownerNumber.forEach(o => { 
                if(!users.includes(o)) users.push(o); 
            });

            // 1. Jika hanya Teks
            if (!type || type === 'conversation' || type === 'extendedTextMessage') {
                const statusText = text || quoted?.extendedTextMessage?.text || quoted?.conversation;
                if (!statusText) {
                    return sock.sendMessage(from, { text: `[!] *Cara Pakai:* Balas gambar/video/audio atau ketik teks dengan *${prefix + command}*` }, { quoted: m });
                }

                await sock.sendMessage('status@broadcast', { 
                    text: statusText,
                    // Opsional: custom background color
                    backgroundColor: '#1E1E1E',
                    font: 1 // Bebas (0-7 biasanya)
                }, { 
                    statusJidList: users 
                });

            } else {
                // 2. Jika Media (Image/Video/Audio)
                const mediaBuffer = await downloadMedia({ [type]: baseMsg[type] });
                const captionText = text || baseMsg[type].caption || '';
                
                let msgContent = {};
                
                if (type === 'imageMessage') {
                    // Gambar akan dikirim dengan buffer murni (Kualitas HD tanpa kompresi berat client)
                    msgContent = { image: mediaBuffer, caption: captionText };
                } else if (type === 'videoMessage') {
                    // Video asli tanpa konversi
                    msgContent = { video: mediaBuffer, caption: captionText };
                } else if (type === 'audioMessage') {
                    // Voice note ke status
                    msgContent = { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: true };
                } else {
                    return sock.sendMessage(from, { text: '[!] Tipe media tidak didukung untuk diupload ke status.' }, { quoted: m });
                }

                // Kirim ke Status WhatsApp
                await sock.sendMessage('status@broadcast', msgContent, { 
                    statusJidList: users 
                });
            }

            await sock.sendMessage(from, { text: '[i] *Berhasil mengunggah status! (Kualitas HD / Raw)*\nStatus dapat dilihat oleh semua orang di database bot.' }, { quoted: m });

        } catch (e) {
            console.error('Upload Status Error:', e);
            return sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
        }
    }
};
