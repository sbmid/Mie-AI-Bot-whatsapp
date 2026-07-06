const menfessDB = require('../../lib/menfess_db');
const db = require('../../lib/database');

/**
 * MIE AI - Menfess System (Glow Up Edition) 
 * Aura: Sweet, Elegant, & Romantic 
 */
module.exports = {
    command: ['menfess', 'confess'],
    
    // --- [ FUNGSI 1: KIRIM PESAN ] ---
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;
        const sender = m.sender || m.key.remoteJid;
        const user = db.getUser(sender);

        if (from.endsWith('@g.us')) return sock.sendMessage(from, { 
            text: ` *Aduh Kakak sayang...* \nFitur penuh rahasia ini cuma bisa dipake di *Private Chat* ya, biar gak ada yang ngintip! ` 
        });

        if (!text || !text.includes('|')) return sock.sendMessage(from, { 
            text: `[!] *CARA KIRIM PESAN MANIS* [!]\n\nKetik: *${prefix + command} nomor|pesan*\nContoh: *${prefix + command} 62838xxx|Hai, aku diam-diam suka kamu..*\n\n _Sampaikan perasaanmu secara anonim bersama Mie AI_ ` 
        });

        if (user.balance < 200) return sock.sendMessage(from, { 
            text: ` *Yah, Saldo Kurang...* \n\nKamu butuh *200 Balance* buat kirim surat rahasia ini. Yuk, kumpulin balance lagi biar bisa confess ke doi! (｡•́︿•̀｡)` 
        });

        let [num, pesan] = text.split('|').map(v => v.trim());
        let target = num.includes('@') ? num : num.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        try {
            let mData = menfessDB.read();
            const id = "MF" + Math.floor(Math.random() * 10000);

            mData[id] = { id, from: sender, to: target, replyCount: 0, time: Date.now() };
            menfessDB.write(mData);

            user.balance -= 200;

            // Pesan Cantik ke Target
            await sock.sendMessage(target, { 
                text: ` *SESEORANG MENGIRIMKAN PESAN!* \n\n"_${pesan}_"\n\n━━━━━━━━━━━━━━\n*ID: ${id}*\n\n_Psst! Kamu bisa balas pesan ini langsung loh, cukup reply aja ya! (Maks 2x balas)_ ` 
            });

            // Laporan Manis ke Pengirim
            await sock.sendMessage(from, { 
                text: ` *YEAY! SURAT CINTA TERKIRIM!* \n\nID: *${id}*\nStatus: *Sukses Terkirim*\n[!] Sisa Saldo: *${user.balance.toLocaleString()}*\n\n_Semoga si dia membalas perasaanmu ya, Kakak!_ ` 
            });

        } catch (e) {
            sock.sendMessage(from, { text: "[!] *Aduh Maaf!* Sepertinya Mei gagal ngirim pesannya, pastikan nomornya bener ya Kak..." });
        }
    },

    // --- [ FUNGSI 2: NANGKEP BALASAN (AUTO-REPLY) ] ---
    before: async (sock, m, { body }) => {
        try {
            const contextInfo = m.message?.extendedTextMessage?.contextInfo;
            if (!contextInfo || !contextInfo.quotedMessage) return false;

            const quoted = contextInfo.quotedMessage;
            const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || "";
            
            if (!quotedText.includes('ID: MF')) return false;

            const idMatch = quotedText.match(/ID: (MF\d+)/);
            if (!idMatch) return false;

            const id = idMatch[1];
            const mData = menfessDB.read();
            const session = mData[id];

            if (!session) return false;

            if (!m.key.remoteJid.endsWith('@g.us')) {
                
                if (session.replyCount < 2) {
                    const pesanBalasan = body || m.message?.conversation || m.message?.extendedTextMessage?.text || "";
                    if (!pesanBalasan || pesanBalasan.startsWith('.')) return false;

                    session.replyCount += 1;
                    menfessDB.write(mData);

                    // Teruskan balasan ke pengirim awal
                    await sock.sendMessage(session.from, { 
                        text: `[!] *ADA KABAR DARI SI DIA!* (ID: ${id})\n\n"_${pesanBalasan}_"\n\n━━━━━━━━━━━━━━\n_Jatah balasan tersisa: ${2 - session.replyCount}_ ` 
                    });

                    // Notif sukses ke penerima
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: `[i] *BALASAN TERKIRIM!* \n\nMei sudah sampaikan pesanmu ke dia ya. (${session.replyCount}/2) ` 
                    }, { quoted: m });
                    return true; 
                } else {
                    await sock.sendMessage(m.key.remoteJid, { 
                        text: ` *Jatah Balasannya Habis...* \n\nMaaf Kakak, kamu cuma boleh balas 2 kali aja buat sesi ini. Bikin Menfess baru aja yuk! ` 
                    }, { quoted: m });
                    return true;
                }
            }
        } catch (e) {
            console.error("Error Menfess:", e);
        }
        return false;
    }
};