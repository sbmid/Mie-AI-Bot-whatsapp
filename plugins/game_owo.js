const fs   = require('fs');
const path = require('path');
const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────────────────────
const DB_FILE = path.join(__dirname, '..', 'owo_db.json');

const loadDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        const fresh = { users: {} };
        fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
        return fresh;
    }
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
    catch { return { users: {} }; }
};
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Normalisasi key → nomor saja (628xxx)
const toKey = (jid) => {
    if (!jid) return 'unknown';
    return jid.split('@')[0].replace(/[^0-9]/g, '') || jid.split('@')[0];
};

const initUser = (db, key) => {
    if (!db.users[key]) {
        db.users[key] = {
            cowoncy:   0,
            inventory: { common: {}, uncommon: {}, rare: {}, epic: {}, mythical: {} },
            stats:     { total_hunts: 0, wins_cf: 0, loses_cf: 0 },
            cooldowns: { hunt: 0, daily: 0 }
        };
    }
    const u = db.users[key];
    if (!u.inventory) u.inventory  = { common: {}, uncommon: {}, rare: {}, epic: {}, mythical: {} };
    if (!u.stats) u.stats = {};
    if (typeof u.stats.total_hunts !== 'number') u.stats.total_hunts = 0;
    if (typeof u.stats.wins_cf !== 'number') u.stats.wins_cf = 0;
    if (typeof u.stats.loses_cf !== 'number') u.stats.loses_cf = 0;
    if (!u.cooldowns) u.cooldowns  = { hunt: 0, daily: 0 };
    if (typeof u.cowoncy !== 'number') u.cowoncy = 0;
    for (const r of ['common','uncommon','rare','epic','mythical']) {
        if (!u.inventory[r]) u.inventory[r] = {};
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS (PROGRESS BAR & FORMAT WAKTU)
// ─────────────────────────────────────────────────────────────────────────────
const makeBar = (percent, length = 10) => {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
};

const fmtSisa = (ms) => {
    if (ms <= 0) return '0 detik';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}j ${m}m`;
    if (m > 0) return `${m}m ${s}d`;
    return `${s} detik`;
};

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON SENDER (NATIVE FLOW INTERACTIVE MESSAGE)
// ─────────────────────────────────────────────────────────────────────────────
const sendButtons = async (sock, chat, title, body, buttons, footer = 'Mie AI - OwO Game', imageUrl = null) => {
    let headerProps = { title: title, hasMediaAttachment: false };
    
    if (imageUrl) {
        try {
            const media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: sock.waUploadToServer });
            headerProps.hasMediaAttachment = true;
            headerProps.imageMessage = media.imageMessage;
        } catch (e) {
            console.error('[OWO] Failed to load image:', e.message);
        }
    }

    const interactiveMessage = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({ text: body }),
        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
        header: proto.Message.InteractiveMessage.Header.create(headerProps),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            buttons: buttons.map(btn => ({
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({ display_text: btn.label, id: btn.id })
            }))
        })
    });

    const msg = generateWAMessageFromContent(chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage
            }
        }
    }, { userJid: sock.user.id });

    try {
        await sock.relayMessage(chat, msg.message, { messageId: msg.key.id });
    } catch (e) {
        console.error('[OWO] sendButtons error:', e);
        // Tampilan Fallback jika NativeFlow gagal (misal dari WA Web owner)
        let fallbackText = `${body}\n\n`;
        buttons.forEach(b => fallbackText += `[ ${b.label} ] -> ketik: ${b.id}\n`);
        await sock.sendMessage(chat, { text: fallbackText.trim() });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// TABEL HEWAN
// ─────────────────────────────────────────────────────────────────────────────
const ANIMALS = {
    common:   { rate: 60, label: '⚪ Common',   list: ['🐶 Anjing','🐱 Kucing','🐭 Tikus','🐹 Hamster','🐰 Kelinci','🐦 Burung','🐸 Katak','🐢 Kura-kura'] },
    uncommon: { rate: 20, label: '🟢 Uncommon', list: ['🦊 Rubah','🐻 Beruang','🐼 Panda','🐨 Koala','🦝 Rakun','🦦 Berang-berang'] },
    rare:     { rate: 12, label: '🔵 Rare',     list: ['🦁 Singa','🐯 Harimau','🦅 Elang','🐺 Serigala','🦓 Zebra','🦒 Jerapah'] },
    epic:     { rate:  6, label: '🟣 Epic',     list: ['🐉 Naga','🦖 T-Rex','🦈 Hiu Putih','🦏 Badak'] },
    mythical: { rate:  2, label: '🟡 Mythical', list: ['🦄 Unicorn','🐲 Naga Emas','🦅 Phoenix','👾 Slime Emas'] }
};
const BONUS_COW = { common: 5, uncommon: 15, rare: 40, epic: 100, mythical: 500 };

const rollHunt = () => {
    const rand = Math.random() * 100;
    let cumul = 0;
    for (const [rarity, data] of Object.entries(ANIMALS)) {
        cumul += data.rate;
        if (rand < cumul) {
            const animal = data.list[Math.floor(Math.random() * data.list.length)];
            return { rarity, animal, label: data.label };
        }
    }
    return { rarity: 'common', animal: '🐶 Anjing', label: '⚪ Common' };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULE
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
    command: ['owo'],

    handler: async (sock, m, { command, args, prefix }) => {
        const p   = prefix || '.';
        const key = toKey(m.sender);
        const db  = loadDB();
        initUser(db, key);
        const user = db.users[key];
        const now  = Date.now();

        const action = args[0] ? args[0].toLowerCase() : 'profile';
        const arg1   = args[1];

        // ─────────────────────────────────────────────────────────────────
        // .owo daily / d
        // ─────────────────────────────────────────────────────────────────
        if (action === 'daily' || action === 'd') {
            const CD   = 24 * 60 * 60 * 1000;
            const sisa = CD - (now - user.cooldowns.daily);

            if (sisa > 0) {
                const perc = Math.max(0, Math.min(100, Math.round(((CD - sisa) / CD) * 100)));
                const bar = makeBar(perc, 10);
                const body = `╭━━━〔 🎁 Daily Reward 〕━━━\n` +
                             `┃ ⏳ Status: Belum Siap\n` +
                             `┃ 🔄 Bar: [${bar}] ${perc}%\n` +
                             `┃ ⏰ Tunggu: *${fmtSisa(sisa)}*\n` +
                             `╰━━━━━━━━━━━━━━━━━━━━━━`;

                return await sendButtons(sock, m.chat, '⏳ Daily Cooldown', body, [
                    { label: '🎮 Profile', id: `${p}owo` },
                    { label: '🏹 Hunt', id: `${p}owo hunt` }
                ]);
            }

            const reward = Math.floor(Math.random() * 501) + 500;
            user.cowoncy        += reward;
            user.cooldowns.daily = now;
            saveDB(db);

            const body = `╭━━━〔 🎁 Daily Reward 〕━━━\n` +
                         `┃ 🎉 Selamat! Kamu Klaim Daily\n` +
                         `┃ 💵 Didapat: +${reward.toLocaleString('id-ID')} Cowoncy\n` +
                         `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                         `┃ 💰 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━`;

            return await sendButtons(sock, m.chat, '🎁 Daily Reward!', body, [
                { label: '🎮 Profile', id: `${p}owo` },
                { label: '🏹 Hunt', id: `${p}owo h` },
                { label: '🎲 Coinflip 100', id: `${p}owo cf 100` }
            ]);
        }

        // ─────────────────────────────────────────────────────────────────
        // .owo hunt / h
        // ─────────────────────────────────────────────────────────────────
        if (action === 'hunt' || action === 'h') {
            const CD   = 30 * 1000;
            const sisa = CD - (now - user.cooldowns.hunt);

            if (sisa > 0) {
                const perc = Math.max(0, Math.min(100, Math.round(((CD - sisa) / CD) * 100)));
                const bar = makeBar(perc, 10);
                const body = `╭━━━〔 🏹 Hunt Cooldown 〕━━━\n` +
                             `┃ ⏳ Status: Kelelahan\n` +
                             `┃ 🔄 Bar: [${bar}] ${perc}%\n` +
                             `┃ ⏰ Tunggu: *${fmtSisa(sisa)}*\n` +
                             `╰━━━━━━━━━━━━━━━━━━━━━━`;

                return await sendButtons(sock, m.chat, '⏳ Hunt Cooldown', body, [
                    { label: '🦁 Zoo', id: `${p}owo zoo` },
                    { label: '🎮 Profile', id: `${p}owo` }
                ]);
            }

            const result = rollHunt();
            user.inventory[result.rarity][result.animal] = (user.inventory[result.rarity][result.animal] || 0) + 1;
            user.stats.total_hunts++;
            user.cooldowns.hunt = now;

            const bonus  = BONUS_COW[result.rarity] || 5;
            user.cowoncy += bonus;
            saveDB(db);

            const jumlah = user.inventory[result.rarity][result.animal];
            const body = `╭━━━〔 🐾 Hunt Selesai 〕━━━\n` +
                         `┃ 🎯 Tangkapan: ${result.animal}\n` +
                         `┃ ⭐ Rarity: ${result.label}\n` +
                         `┃ 💵 Bonus: +${bonus} Cowoncy\n` +
                         `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                         `┃ 📦 Dimiliki: ${jumlah} ekor\n` +
                         `┃ 💰 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━`;

            return await sendButtons(sock, m.chat, '🐾 Hewan Tertangkap!', body, [
                { label: '🏹 Hunt Lagi', id: `${p}owo h` },
                { label: '🦁 Cek Zoo', id: `${p}owo z` },
                { label: '🎮 Profile', id: `${p}owo` }
            ]);
        }

        // ─────────────────────────────────────────────────────────────────
        // .owo zoo / z
        // ─────────────────────────────────────────────────────────────────
        if (action === 'zoo' || action === 'z') {
            let total = 0;
            let text = `╭━━━〔 🦁 Zoo Kamu 〕━━━\n`;

            for (const [rarity, data] of Object.entries(ANIMALS)) {
                const owned = Object.entries(user.inventory[rarity] || {}).filter(([, v]) => v > 0);
                if (owned.length > 0) {
                    text += `┃ *${data.label}*\n`;
                    for (let i = 0; i < owned.length; i++) {
                        const [animal, count] = owned[i];
                        const isLast = (i === owned.length - 1);
                        text += `┃ ${isLast ? '┗' : '┣'} ${animal} × ${count}\n`;
                        total += count;
                    }
                    text += `┃\n`;
                }
            }

            if (total === 0) {
                text += `┃ ❌ Belum ada hewan.\n`;
                text += `╰━━━━━━━━━━━━━━━━━━━━━━`;
                return await sendButtons(sock, m.chat, '🦁 Zoo Kamu Kosong', text, [
                    { label: '🏹 Hunt', id: `${p}owo h` },
                    { label: '🎁 Daily', id: `${p}owo d` }
                ]);
            }

            text += `┣━━━━━━━━━━━━━━━━━━━━━━\n┃ 📊 Total: ${total} Ekor\n╰━━━━━━━━━━━━━━━━━━━━━━`;
            return await sendButtons(sock, m.chat, '🦁 Zoo Kamu', text, [
                { label: '🏹 Hunt', id: `${p}owo h` },
                { label: '🎮 Profile', id: `${p}owo` },
                { label: '🎲 Coinflip 100', id: `${p}owo cf 100` }
            ]);
        }

        // ─────────────────────────────────────────────────────────────────
        // .owo cf / coinflip
        // ─────────────────────────────────────────────────────────────────
        if (action === 'cf' || action === 'coinflip') {
            const taruhan = parseInt(arg1);

            if (!taruhan || isNaN(taruhan) || taruhan < 1) {
                const body = `╭━━━〔 🎲 Coinflip 〕━━━\n` +
                             `┃ ❌ Taruhan belum diisi!\n` +
                             `┃ 💡 Contoh: *${p}owo cf 500*\n` +
                             `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                             `┃ 💰 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                             `╰━━━━━━━━━━━━━━━━━━━━━━`;
                return await sendButtons(sock, m.chat, '🎲 Coinflip', body, [
                    { label: '🎲 Bet 100', id: `${p}owo cf 100` },
                    { label: '🎲 Bet 500', id: `${p}owo cf 500` },
                    { label: '🎲 Bet 1000', id: `${p}owo cf 1000` }
                ]);
            }

            if (taruhan > user.cowoncy) {
                const body = `╭━━━〔 🎲 Coinflip 〕━━━\n` +
                             `┃ ❌ Saldo Tidak Cukup!\n` +
                             `┃ 💵 Taruhan: ${taruhan.toLocaleString('id-ID')}\n` +
                             `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                             `┃ 💰 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                             `╰━━━━━━━━━━━━━━━━━━━━━━`;
                return await sendButtons(sock, m.chat, '❌ Cowoncy Kurang!', body, [
                    { label: '🎁 Daily', id: `${p}owo d` },
                    { label: '🏹 Hunt', id: `${p}owo h` }
                ]);
            }

            const menang = Math.random() < 0.5;
            if (menang) { user.cowoncy += taruhan; user.stats.wins_cf++; }
            else        { user.cowoncy -= taruhan; user.stats.loses_cf++; }
            saveDB(db);

            const title = menang ? `🎉 MENANG!` : `💸 KALAH!`;
            const body = `╭━━━〔 🎲 Coinflip 〕━━━\n` +
                         `┃ 🪙 Pilihan: ${menang ? '🟡 HEADS' : '⚫ TAILS'}\n` +
                         `┃ 💵 Taruhan: ${taruhan.toLocaleString('id-ID')}\n` +
                         `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                         `┃ ${menang ? '📈 Hasil: MENANG! 🎉' : '📉 Hasil: KALAH! 💸'}\n` +
                         `┃ ${menang ? '💵 Bonus: +' : '💸 Lenyap: -'}${taruhan.toLocaleString('id-ID')} Cowoncy\n` +
                         `┃ 💰 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                         `╰━━━━━━━━━━━━━━━━━━━━━━`;

            return await sendButtons(sock, m.chat, title, body, [
                { label: `🎲 CF ${taruhan} Lagi`, id: `${p}owo cf ${taruhan}` },
                { label: '🎮 Profile', id: `${p}owo` }
            ]);
        }

        // ─────────────────────────────────────────────────────────────────
        // .owo (Profile Default)
        // ─────────────────────────────────────────────────────────────────
        let totalHewan = 0;
        for (const r in user.inventory)
            for (const a in user.inventory[r])
                totalHewan += (user.inventory[r][a] || 0);

        const totalCF = user.stats.wins_cf + user.stats.loses_cf;
        const wrPerc  = totalCF > 0 ? (user.stats.wins_cf / totalCF) * 100 : 0;
        const wr      = wrPerc.toFixed(1);
        const name    = m.pushName || key;

        const body = `╭━━━〔 🎮 OwO Profile 〕━━━\n` +
                     `┃ 👤 Player: ${name}\n` +
                     `┃ 💵 Saldo: ${user.cowoncy.toLocaleString('id-ID')} Cowoncy\n` +
                     `┣━━━━━━━━━━━━━━━━━━━━━━\n` +
                     `┃ 🐾 Koleksi: ${totalHewan} Ekor\n` +
                     `┃ 🏹 Total Hunt: ${user.stats.total_hunts}×\n` +
                     `┃ 🎲 CF WR: [${makeBar(wrPerc, 10)}] ${wr}%\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━`;

        return await sendButtons(sock, m.chat, '🎮 OwO Profile', body, [
            { label: '🏹 Hunt', id: `${p}owo h` },
            { label: '🦁 Zoo', id: `${p}owo z` },
            { label: '🎁 Daily', id: `${p}owo d` },
            { label: '🎲 Coinflip', id: `${p}owo cf` }
        ], 'Mie AI - OwO Game', 'https://owobot.com/img/owo-peek.7723d01a.png');
    }
};
