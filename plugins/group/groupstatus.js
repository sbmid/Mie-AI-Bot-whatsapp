const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * MIE AI - Group Status Uploader
 * Fungsi : Upload status ke grup (groupStatusMessageV2)
 * Command: .gstatus [teks]  — atau reply media + .gstatus [caption]
 * Khusus : Admin grup saja
 *
 * Support: text | image | video | audio
 */

module.exports = {
    command: ['gstatus', 'gs', 'groupstatus'],
    handler: async (sock, m, { text, isOwner }) => {
        const from = m.chat;

        // ── 1. Hanya boleh di dalam grup ──────────────────────────
        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, {
                text: '❌ Perintah ini hanya bisa digunakan di dalam grup!'
            }, { quoted: m });
        }

        // ── 2. Cek apakah pengirim adalah admin grup ───────────────
        let isAdmin = false;
        if (isOwner) {
            isAdmin = true;
        } else {
            try {
                const groupMeta = await sock.groupMetadata(from);
                isAdmin = groupMeta.participants.some(
                    p => (p.id === m.sender || p.jid === m.sender || p.lid === m.sender)
                        && (p.admin === 'admin' || p.admin === 'superadmin')
                );
            } catch (e) {
                return sock.sendMessage(from, { text: '❌ Gagal mengecek status admin (Rate limit/Koneksi).' }, { quoted: m });
            }
        }

        if (!isAdmin) {
            return sock.sendMessage(from, {
                text: '❌ Hanya *Admin Grup* yang bisa menggunakan perintah ini!'
            }, { quoted: m });
        }

        // ── 3. Tampilkan menu jika tidak ada argumen & tidak reply ──
        const hasQuoted = !!m.quoted;
        // Cek apakah pesan saat ini adalah media (gambar/video/audio)
        const isMedia = /image|video|audio|document/.test(m.mtype || m.messageType || Object.keys(m.raw?.message || m.message || {})[0] || '');
        
        if (!text && !hasQuoted && !isMedia) {
            return sock.sendMessage(from, {
                text: `📢 *GROUP STATUS UPLOADER*\n\nCara pakai:\n• *.gstatus [teks]* — status teks\n• Reply/Kirim gambar + *.gstatus [caption]* — status foto\n• Reply/Kirim video + *.gstatus [caption]* — status video\n• Reply/Kirim audio/suara + *.gstatus* — status audio\n\n_Hanya admin grup yang bisa menggunakan ini._`
            }, { quoted: m });
        }

        try {
            // Reaksi loading
            if (global.waitMode === 'react') {
                await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
            }

            // ── 4. Deteksi media secara tangguh (Robust Media Detection) ──────────
            const extractMedia = (msgObj) => {
                if (!msgObj) return null;
                const raw = msgObj.msg || msgObj.raw?.message || msgObj.message || msgObj;
                if (raw.mimetype) return raw;

                const type = Object.keys(raw).find(k => k.endsWith('Message') && k !== 'senderKeyDistributionMessage');
                if (type && raw[type]) return raw[type];

                return raw;
            };

            // Cari manual quoted message dari contextInfo jika m.quoted tidak di-parse oleh bot
            const quotedManual = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            let qContent = null;
            if (m.quoted) {
                qContent = extractMedia(m.quoted);
            } else if (quotedManual) {
                qContent = extractMedia(quotedManual);
            } else {
                qContent = extractMedia(m);
            }

            const mime = qContent?.mimetype || '';
            let statusPayload = null;

            // ── 4a. STATUS GAMBAR ──────────────────────────────────
            if (qContent && /image/.test(mime)) {
                const stream = await downloadContentFromMessage(qContent, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                statusPayload = {
                    image: buffer,
                    caption: text || '',
                    groupStatus: true
                };
            }

            // ── 4b. STATUS VIDEO ───────────────────────────────────
            else if (qContent && /video/.test(mime)) {
                const stream = await downloadContentFromMessage(qContent, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                statusPayload = {
                    video: buffer,
                    caption: text || '',
                    groupStatus: true
                };
            }

            // ── 4c. STATUS AUDIO / VOICE NOTE ─────────────────────
            else if (qContent && /audio/.test(mime)) {
                const stream = await downloadContentFromMessage(qContent, 'audio');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                statusPayload = {
                    audio: buffer,
                    mimetype: mime || 'audio/ogg; codecs=opus',
                    ptt: qContent.ptt || false,
                    groupStatus: true
                };
            }

            // ── 4d. STATUS TEKS ────────────────────────────────────
            else {
                const caption = text || qContent?.text || qContent?.caption || qContent?.conversation || '';

                if (!caption) {
                    return sock.sendMessage(from, {
                        text: '❌ Tidak ada teks yang dikirimkan. Ketik *.gstatus [teks]* atau reply media!'
                    }, { quoted: m });
                }
                statusPayload = {
                    text: caption,
                    groupStatus: true
                };
            }

            // ── 5. Kirim sebagai Status Grup ──────────────────────
            // Jeda 2 detik agar tidak rate-limited (429) oleh WhatsApp saat sendMessage memanggil groupMetadata internal
            if (!isOwner) await new Promise(resolve => setTimeout(resolve, 2000));
            
            await sock.sendMessage(from, statusPayload);

            // Reaksi sukses
            if (global.waitMode === 'react') {
                await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
            }

            return sock.sendMessage(from, {
                text: `✅ *Status grup berhasil diposting!*\n\n_Cek tab Status/Updates grup ini ya!_`
            }, { quoted: m });

        } catch (e) {
            console.error('[groupstatus] Error:', e);
            return sock.sendMessage(from, {
                text: `❌ *Gagal posting status grup!*\n\nDetail: ${e.message}`
            }, { quoted: m });
        }
    }
};
