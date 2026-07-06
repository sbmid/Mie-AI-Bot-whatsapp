const db = require('./database');
const { smsg } = require('./simple');
const afkDetector = require('./afkDetector');
const pcGuard = require('./pcGuard');
const modDB = require('./modDB'); // Moderation Database
const { getDevice } = require('@whiskeysockets/baileys');

// Memastikan database terikat secara global
global.db = db;

/**
 * Perubahan: Menggunakan sistem In-Memory (RAM) untuk leveling biar anti-delay.
 */
module.exports = async (sock, m, plugins, logger) => {
    // Tangkap semua raw message untuk fitur .spy & .copypanel SEBELUM difilter apapun
    if (m && m.key && m.key.id) {
        global.messageSpyDB = global.messageSpyDB || {};
        const keys = Object.keys(global.messageSpyDB);
        if (keys.length > 200) delete global.messageSpyDB[keys[0]]; // Dikurangi batas ke 200 untuk mencegah memory leak
        try { global.messageSpyDB[m.key.id] = JSON.parse(JSON.stringify(m)); } 
        catch (e) { global.messageSpyDB[m.key.id] = m; }
    }

    // Inisialisasi Pesan
    const msg = smsg(sock, m);
    if (!msg || !msg.message) return;

    await afkDetector(sock, m);

    const { sender, body, pushName, chat } = msg;
    
    // Deteksi Device
    msg.device = m.key.id ? getDevice(m.key.id) : 'unknown';

    // --- AUTOREAD SW (Story) ---
    if (chat === 'status@broadcast') {
        if (global.readsw) {
            try { await sock.readMessages([msg.key]); } catch(e) {}
        }
        return; // Abaikan pesan story agar tidak masuk respon biasa
    }

    // Deteksi Identitas (JID & LID)
    const isJid = sender.endsWith('@s.whatsapp.net'); 
    const isLid = sender.endsWith('@lid');             
    const isUser = isJid || isLid;                    

    if (!isUser) return; 

    // --- GLOBAL BAN INTERCEPT ---
    // Jika user sedang diban, abaikan SEMUA pesannya (tidak dapat merespon, leveling, dll)
    if (modDB.isBanned(sender)) {
        return; 
    }

    // --- AUTOREAD & AUTOTYPING BOTS ---
    if (global.autoread) {
        try { await sock.readMessages([msg.key]); } catch(e) {}
    }
    if (global.autotyping && body && body.startsWith(global.prefix || '.')) {
        try { await sock.sendPresenceUpdate('composing', chat); } catch(e) {}
    }

    // Ambil Data User
    const user = db.getUser(sender);
    const prefix = global.prefix || '.';

    if (body) {
        const typeLabel = isJid ? 'JID' : 'LID';
        logger.msg(`${pushName} [${typeLabel}]`, body);
    }

    // SISTEM LEVELING
    if (isUser) {
        const now = Date.now();
        // Cek cooldown chat
        if (now - user.lastChat > 60000) {
            const addXp = Math.floor(Math.random() * 21) + 10; 
            user.xp += addXp;
            user.lastChat = now;
        }

        // Logika Level Up (Dipisah dari cooldown chat agar RPG XP langsung terbaca)
        let oldLevel = user.level;
        let leveledUp = false;
        
        while (user.xp >= 500) {
            user.level += 1;
            user.xp -= 500;
            leveledUp = true;
        }

        if (leveledUp) {
            // Proses Level Up (Asynchronous, tidak menghambat command)
            (async () => {
                let ppUrl;
                try {
                    ppUrl = await sock.profilePictureUrl(sender, 'image');
                } catch {
                    ppUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
                }

                const displayName = user.name || pushName || "User";
                const name = encodeURIComponent(displayName);
                const avatar = encodeURIComponent(ppUrl);
                const background = encodeURIComponent("https://i.pinimg.com/1200x/16/24/b6/1624b6d67a2d9acc228390129d5b7fbc.jpg");
                const apiUrl = `https://api.siputzx.my.id/api/canvas/level-up?backgroundURL=${background}&avatarURL=${avatar}&fromLevel=${oldLevel}&toLevel=${user.level}&name=${name}`;

                await sock.sendMessage(chat, {
                    image: { url: apiUrl },
                    caption: `🎉 *LEVEL UP!* \n\nSelamat *@${sender.split('@')[0]}*, kamu berhasil naik dari level *${oldLevel}* ke level *${user.level}*! Mei bangga padamu!`,
                    mentions: [sender]
                }, { quoted: m });
            })();
        }
    }

    // PLUGIN BEFORE
    for (const name in plugins) {
        const plugin = plugins[name];
        if (plugin && typeof plugin.before === 'function') {
            if (await plugin.before(sock, msg, { user, body, prefix, plugins })) return;
        }
    }

    // --- MUTE BOT GROUP CHECK ---
    if (chat.endsWith('@g.us')) {
        let groupData = db.getGroup(chat);
        if (groupData.botmute) {
            const isOwnerCheck = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));
            if (!isOwnerCheck) {
                let senderIsAdmin = false;
                try {
                    const groupMetadata = await sock.groupMetadata(chat);
                    const participants = groupMetadata.participants;
                    const senderEntry = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender);
                    senderIsAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';
                } catch(e) {}
                
                if (!senderIsAdmin) return; // Silent return (member biasa dicuekin)
            }
        }
    }

    // --- ANTI-VIOLATION GROUP CHECK ---
    if (chat.endsWith('@g.us')) {
        let groupGuard = db.getGroup(chat);
        const groupMetadata = await sock.groupMetadata(chat).catch(() => null);
        if (groupMetadata) {
            const participants = groupMetadata.participants;
            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const isBotAdmin = participants.find(p => (p.id && p.id.startsWith(botNumber)) || (p.jid && p.jid.startsWith(botNumber)))?.admin;
            const isAdmin = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender)?.admin;
            const isSelf = sender.startsWith(botNumber);

            if (isBotAdmin && !isAdmin && !isSelf && !global.ownerNumber?.some(o => sender.startsWith(o.split('@')[0]))) {
                let isViolator = false;

                // 1. AntiLink GC
                if (groupGuard.antilinkgc && body.match(/chat\.whatsapp\.com\/[a-zA-Z0-9]+/i)) isViolator = true;
                // 2. AntiLink CH
                if (groupGuard.antilinkch && body.match(/whatsapp\.com\/channel\/[a-zA-Z0-9]+/i)) isViolator = true;
                // 3. AntiLink All
                if (groupGuard.antilinkall && body.match(/(https?:\/\/[^\s]+)/i)) isViolator = true;
                // 4. AntiSticker
                if (groupGuard.antisticker && msg.message?.stickerMessage) isViolator = true;
                // 5. AntiToxic
                const toxicWords = ['anjing', 'babi', 'kontol', 'memek', 'bangsat', 'ngentot', 'jembut', 'tolol'];
                if (groupGuard.antitoxic && toxicWords.some(word => body.toLowerCase().includes(word))) isViolator = true;
                // 6. AntiPromosi
                const promoWords = ['jual', 'open bo', 'promo', 'diskon', 'murah', 'sedia', 'order', 'pesan sekarang'];
                if (groupGuard.antipromosi && promoWords.some(word => body.toLowerCase().includes(word))) isViolator = true;
                // 7. AntiTagSW (Biasa terjadi kalau format quoted dari status update)
                if (groupGuard.antitagsw && msg.message?.extendedTextMessage?.contextInfo?.participant === 'status@broadcast') isViolator = true;
                // 8. AntiLink TikTok
                if (groupGuard.antilinktt && body.match(/tiktok\.com\//i)) isViolator = true;
                // 9. AntiLink Instagram
                if (groupGuard.antilinkig && body.match(/instagram\.com\//i)) isViolator = true;
                // 10. AntiLink Facebook
                if (groupGuard.antilinkfb && body.match(/facebook\.com\//i)) isViolator = true;
                // 11. AntiLink YouTube
                if (groupGuard.antilinkyt && body.match(/(youtube\.com\/|youtu\.be\/)/i)) isViolator = true;
                // 12. AntiLink CapCut
                if (groupGuard.antilinkcapcut && body.match(/capcut\.com\//i)) isViolator = true;
                // 13. AntiWame
                if (groupGuard.antiwame && body.match(/wa\.me\/\d+/i)) isViolator = true;
                // 14. AntiVirtex
                if (groupGuard.antivirtex && body.length > 5000) isViolator = true;

                if (isViolator) {
                    const key = {
                        remoteJid: chat,
                        fromMe: false,
                        id: msg.key.id,
                        participant: sender
                    };
                    await sock.sendMessage(chat, { delete: key });
                    return; // Stop any further processing
                }
            }
        } // end if groupMetadata
    }

    // SISTEM COMMAND ---
    if (!body || !body.startsWith(prefix)) return;
    if (await pcGuard(sock, msg)) return;

    const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');

    // --- SEWA CHECK & MUTE MODE ---
    if (chat.endsWith('@g.us')) {
        const sewaData = db.getSewa(chat);
        const isActiveSewa = sewaData && sewaData.expired > Date.now();
        
        if (!isActiveSewa) {
            const isOwnerStr = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));
            if (!isOwnerStr) {
                let senderIsAdmin = false;
                try {
                    const groupMetadata = await sock.groupMetadata(chat).catch(() => null);
                    const participants = groupMetadata ? groupMetadata.participants : [];
                    const senderEntry = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender);
                    senderIsAdmin = senderEntry?.admin === 'admin' || senderEntry?.admin === 'superadmin';
                } catch(e) {}
                
                if (senderIsAdmin) {
                    const ownerList = global.ownerNumber || ['628'];
                    const targetOwner = ownerList[0].split('@')[0];
                    await sock.sendMessage(chat, { text: `⚠️ *Akses Ditolak (Sewa Belum Aktif / Habis)*\n\nBot saat ini hanya melayani grup yang memiliki status *Sewa Aktif*.\nSilakan hubungi owner untuk menyewa bot dan mengaktifkan kembali layanannya:\nwa.me/${targetOwner}` }, { quoted: msg });
                }
                return; // Mute mode: stop eksekusi plugin untuk grup tak tersewa
            }
        }
    }

    // --- PCONLY / GCONLY GUARD ---
    const isSewaCmd = ['sewa', 'cekbayar', 'verifikasi'].includes(command);
    if (!isSewaCmd) {
        if (global.pconly && chat.endsWith('@g.us')) return; // Abaikan pesan grup jika PC_ONLY
        if (global.gconly && !chat.endsWith('@g.us')) {
            const isOwnerStr = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));
            if (!isOwnerStr && sender !== sock.user.id) return; // Abaikan pesan private jika GC_ONLY
        }
    }

    // --- FITUR TEMPORARY DEBUG JID & LID ---
    if (command === 'lihatjid') {
        const typeL = isLid ? "LID (Linked Device)" : "JID (Normal ID)";
        const msgTeks = `🛠️ *DEBUG METADATA (SEGERA DIHAPUS)*\n\nTipe Pengirim: ${typeL}\nSender ID: ${sender}\nChat ID: ${chat}`;
        return sock.sendMessage(chat, { text: msgTeks }, { quoted: m });
    }

    // EKSEKUSI PLUGIN ---
    for (const name in plugins) {
        const plugin = plugins[name];
        if (plugin.command && plugin.command.includes(command)) {
            // --- OWNER CHECK ---
            if (plugin.isOwner) {
                const isOwnerValid = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));
                if (!isOwnerValid) {
                    await sock.sendMessage(chat, { text: "⚠️ *Akses Ditolak!*\nFitur ini khusus untuk Owner Bot." }, { quoted: msg });
                    return;
                }
            }

            if (global.waitMode === "react") await sock.sendMessage(chat, { react: { text: global.waitEmoji || '⏳', key: m.key } });
            try {
                // ⏱️ Timeout guard: plugin tidak boleh hang lebih dari 30 detik
                const pluginTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Plugin [${name}] timeout setelah 30 detik`)), 30000)
                );
                await Promise.race([
                    plugin.handler(sock, msg, { args, text, command, body, prefix }),
                    pluginTimeout
                ]);
                if (global.waitMode === "react") await sock.sendMessage(chat, { react: { text: "✅", key: m.key } });
                
                return; // Berhenti mencari jika perintah sudah dijalankan satu kali!
            } catch (err) {
                logger.error(`Error pada plugin [${name}]: ${err.message}`);
                
                // === ERROR TRACKER ===
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const errorFile = path.join(__dirname, '../database/errors.json');
                    let errorDB = [];
                    if (fs.existsSync(errorFile)) {
                        try { errorDB = JSON.parse(fs.readFileSync(errorFile, 'utf8')); } catch (e) {}
                    }
                    
                    const now = Date.now();
                    const window48h = 48 * 60 * 60 * 1000;
                    
                    // Hapus error yang umurnya sudah lebih dari 48 jam
                    errorDB = errorDB.filter(e => now - e.timestamp < window48h);
                    
                    const errorStr = err.message || String(err);
                    const existingIndex = errorDB.findIndex(e => e.plugin === name && e.error === errorStr);
                    
                    if (existingIndex !== -1) {
                        errorDB[existingIndex].count += 1;
                        errorDB[existingIndex].last_seen = now;
                    } else {
                        errorDB.push({
                            plugin: name,
                            command: command,
                            error: errorStr,
                            count: 1,
                            timestamp: now,
                            last_seen: now
                        });
                    }
                    
                    fs.writeFile(errorFile, JSON.stringify(errorDB, null, 2), (err) => {
                        if (err) logger.error(`Gagal menulis log error tracker: ${err.message}`);
                    });
                } catch (dbErr) {
                    logger.error(`Gagal menyimpan log error tracker: ${dbErr.message}`);
                }
                // =====================

                if (global.waitMode === "react") await sock.sendMessage(chat, { react: { text: "❌", key: m.key } });
            }
        }
    }
};