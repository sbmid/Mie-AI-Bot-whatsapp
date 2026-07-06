const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

/**
 * MIE AI - Image HD & Upscale 
 * Status: Powered by SBM API (Official Mie AI) 
 * Aura: Sweet & Crystal Clear 
 */
module.exports = {
    command: ['hd', 'remini', 'upscale', 'delhd'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.key.remoteJid;

        // --- HANDLE DELETE COMMAND ---
        if (command === 'delhd') {
            // Deteksi contextInfo dari berbagai tipe pesan (termasuk balasan tombol interactive)
            const msgObj = m.message?.extendedTextMessage || m.message?.interactiveResponseMessage || m.message?.templateButtonReplyMessage;
            const quotedMsg = msgObj?.contextInfo;
            
            if (!quotedMsg || !quotedMsg.stanzaId) {
                return sock.sendMessage(from, { text: '❌ Balas pesan gambar HD yang mau dihapus.' }, { quoted: m });
            }
            
            const targetId = quotedMsg.stanzaId;
            // Gunakan nomor bot jika participant kosong (karena ini pesan bot sendiri)
            const targetParticipant = quotedMsg.participant || sock.user.id.split(':')[0] + '@s.whatsapp.net';


            // Cek apakah user berhak menghapus (harus requester asli atau owner)
            const isOwner = global.ownerNumber.some(o => o.split('@')[0] === m.sender.split('@')[0]);
            const requester = global.hdRequests ? global.hdRequests[targetId] : null;

            if (requester !== m.sender && !isOwner) {
                return sock.sendMessage(from, { text: '❌ Hanya pengirim asli (yang me-request gambar ini) atau Owner yang boleh menghapusnya.' }, { quoted: m });
            }

            // Hapus pesan bot
            try {
                await sock.sendMessage(from, { 
                    delete: { remoteJid: from, fromMe: true, id: targetId, participant: targetParticipant } 
                });
                return sock.sendMessage(from, { text: '✅ Hasil HD berhasil dihapus.' }, { quoted: m });
            } catch (e) {
                return sock.sendMessage(from, { text: `❌ Gagal menghapus pesan: ${e.message}` }, { quoted: m });
            }
        }
        // ------------------------------


        // 1. Deteksi Pesan Gambar (Support ViewOnce, Quoted, & Interactive Reply)
        const msgObj = m.message?.extendedTextMessage || m.message?.interactiveResponseMessage || m.message?.templateButtonReplyMessage;
        let quoted = msgObj?.contextInfo?.quotedMessage;
        
        // Prioritaskan gambar lampiran user duluan. Jika kosong, baru intip pesan quote
        let baseMsg = m.message;
        if (quoted && !m.message?.imageMessage && !m.message?.viewOnceMessageV2) {
            baseMsg = quoted;
        }

        let mediaData = null;
        if (baseMsg?.imageMessage) {
            mediaData = baseMsg.imageMessage;
        } else if (baseMsg?.viewOnceMessageV2?.message?.imageMessage) {
            mediaData = baseMsg.viewOnceMessageV2.message.imageMessage;
        } else if (baseMsg?.viewOnceMessage?.message?.imageMessage) {
            mediaData = baseMsg.viewOnceMessage.message.imageMessage;
        } else if (baseMsg?.ephemeralMessage?.message?.imageMessage) {
            mediaData = baseMsg.ephemeralMessage.message.imageMessage;
        } else if (baseMsg?.viewOnceMessage?.message?.interactiveMessage?.header?.imageMessage) {
            mediaData = baseMsg.viewOnceMessage.message.interactiveMessage.header.imageMessage;
        } else if (baseMsg?.interactiveMessage?.header?.imageMessage) {
            mediaData = baseMsg.interactiveMessage.header.imageMessage;
        }

        const isImage = !!mediaData;

        if (!isImage) {
            return sock.sendMessage(from, {
                text: ` *Halo Kakak Sayang...* \n\nMie butuh foto buat dijernihin nih. Kirim atau balas foto dengan caption *${prefix + command}* ya! `
            }, { quoted: m });
        }

        // Reaksi Proses [~]
        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });
        }

        try {
            // 2. Download Media ke Buffer
            const stream = await downloadContentFromMessage(mediaData, 'image');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Upload via uploader untuk dapatkan URL
            const imageUrl = await uploader(buffer);

            if (!imageUrl || !imageUrl.startsWith('http')) {
                throw new Error("Gagal mengunggah foto ke server Mie AI.");
            }

            // 4. Proses Jernihkan via API SBM Official
            const apiRes = await axios.get(`https://api.sawit.biz.id/api/maker/upscale`, {
                headers: {
                    'accept': 'application/json'
                },
                params: {
                    url: imageUrl,
                    scale: 4
                }
            });

            const resData = apiRes.data;

            if (!resData.status || !resData.result?.url) {
                throw new Error("Server Mie AI sedang sibuk memproses gambar.");
            }

            const resultUrl = resData.result.url;

            // 5. KIRIM HASIL KE USER DENGAN TOMBOL HAPUS
            const { generateWAMessageFromContent, proto, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            
            const media = await prepareWAMessageMedia({ image: { url: resultUrl } }, { upload: sock.waUploadToServer });
            const msg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: ` *YEAY! FOTONYA SUDAH GLOW UP* \n\n_Klik tombol di bawah jika ingin menghapus hasil ini_`
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                hasMediaAttachment: true,
                                imageMessage: media.imageMessage
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "✨ HD in Lagi",
                                            id: `${prefix}hd`
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "🗑️ Hapus Hasil HD",
                                            id: `${prefix}delhd`
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { quoted: m });

            await sock.relayMessage(from, msg.message, { messageId: msg.key.id });

            // Simpan info siapa yang request HD ini di cache global agar hanya dia (atau owner) yang bisa hapus
            if (!global.hdRequests) global.hdRequests = {};
            global.hdRequests[msg.key.id] = m.sender;

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('HD Error:', e.message);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });

            sock.sendMessage(from, {
                text: ` *Duh Maaf Kak...* \nSepertinya ada gangguan pas mau jernihin fotonya: \n_${e.message}_ `
            }, { quoted: m });
        }
    }
};