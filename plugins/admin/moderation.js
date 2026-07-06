const modDB = require('../../lib/modDB');

const parseTime = (timeStr) => {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === 's') return val * 1000;
    if (unit === 'm') return val * 60 * 1000;
    if (unit === 'h') return val * 60 * 60 * 1000;
    if (unit === 'd') return val * 24 * 60 * 60 * 1000;
    return null;
};

const fmtMs = (ms) => {
    const d = Math.floor(ms / (24 * 60 * 60 * 1000));
    const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    let str = [];
    if (d > 0) str.push(`${d} hari`);
    if (h > 0) str.push(`${h} jam`);
    if (m > 0) str.push(`${m} menit`);
    if (str.length === 0) return 'Kurang dari semenit';
    return str.join(' ');
};

module.exports = {
    command: ['warn', 'ban', 'unban'],
    category: ['admin', 'owner'],
    description: 'Sistem Moderasi Global Bot',

    handler: async (sock, m, { command, args, text, prefix }) => {
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        let isAdmin = false;

        if (m.isGroup || m.chat.endsWith('@g.us')) {
            try {
                const groupMetadata = await sock.groupMetadata(m.chat);
                const participants = groupMetadata.participants;
                const senderEntry = participants.find(p => p.id === m.sender || p.jid === m.sender || p.lid === m.sender);
                isAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';
            } catch (e) {}
        }

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(m.chat, { text: `⚠️ Maaf, perintah ini hanya untuk *Admin Grup* atau *Owner Bot*.` }, { quoted: m });
        }

        // Cari Target (dari Mention atau Reply)
        let target = '';
        if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        if (!target) {
            return await sock.sendMessage(m.chat, { text: `⚠️ Mohon tag atau balas pesan target yang ingin di eksekusi.\nContoh: *${prefix}${command} @user*` }, { quoted: m });
        }

        // Cek agar tidak memban owner atau bot
        if (target.startsWith(sock.user.id.split(':')[0])) return await sock.sendMessage(m.chat, { text: `⚠️ Kamu tidak bisa menindak Bot.` }, { quoted: m });
        const targetIsOwner = global.ownerNumber && global.ownerNumber.some(o => target === o || target.startsWith(o.split('@')[0]));
        if (targetIsOwner) return await sock.sendMessage(m.chat, { text: `⚠️ Kamu tidak bisa menindak Owner Bot.` }, { quoted: m });

        // --- COMMAND: WARN ---
        if (command === 'warn') {
            const { currentWarn, isBanned } = modDB.addWarn(target, 5);
            let msg = `⚠️ *@${target.split('@')[0]}* telah diberikan peringatan!\n\n*Peringatan saat ini:* ${currentWarn} / 5`;
            
            if (isBanned) {
                msg += `\n\n⛔ Pengguna telah mencapai batas *5 Peringatan* dan otomatis dijatuhi *Global Ban* selama 1 Hari!`;
            } else {
                msg += `\n\n_Hati-hati! Jika mencapai 5 peringatan, kamu akan diban dari bot._`;
            }

            return await sock.sendMessage(m.chat, { text: msg, mentions: [target] }, { quoted: m });
        }

        // --- COMMAND: BAN ---
        if (command === 'ban') {
            let timeArg = args[0]; // Format: 1d, 1h, 30m
            // Kalau dia tag di argument pertama, durasi di argumen kedua
            if (timeArg && timeArg.includes('@')) {
                timeArg = args[1];
            }

            if (!timeArg) {
                return await sock.sendMessage(m.chat, { text: `⚠️ Format salah. Sertakan durasi ban.\nContoh: *${prefix}ban @user 1d*\n(s=detik, m=menit, h=jam, d=hari)` }, { quoted: m });
            }

            const ms = parseTime(timeArg);
            if (!ms) {
                return await sock.sendMessage(m.chat, { text: `⚠️ Format waktu tidak valid.\nGunakan: *s* (detik), *m* (menit), *h* (jam), *d* (hari).\nContoh: *1d* atau *12h*` }, { quoted: m });
            }

            modDB.addBan(target, ms);
            const fmtStr = fmtMs(ms);

            return await sock.sendMessage(m.chat, { 
                text: `⛔ *@${target.split('@')[0]}* berhasil diban dari sistem bot!\n\n*Durasi:* ${fmtStr}\nPengguna tidak akan dilayani bot sampai waktu ban habis.`, 
                mentions: [target] 
            }, { quoted: m });
        }

        // --- COMMAND: UNBAN ---
        if (command === 'unban') {
            modDB.unban(target);
            return await sock.sendMessage(m.chat, { 
                text: `✅ *@${target.split('@')[0]}* berhasil di-*unban* dan status *warn*-nya telah direset. Pengguna sekarang dapat menggunakan bot kembali.`, 
                mentions: [target] 
            }, { quoted: m });
        }
    }
};
