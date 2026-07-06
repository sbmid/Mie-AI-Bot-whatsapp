const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let db = {
    users: {}, groups: {}, settings: {}, sewa: {}, bot_settings: {},
    chats: {
        "120363418477019997@g.us": {
            "listrs": {
                "vidio": "𝘃𝗶𝗱𝗶𝗼 𝗽𝗹𝗮𝘁𝗶𝗻𝘂𝗺\n\n 𝘀𝗵𝗮𝗿𝗶𝗻𝗴 𝟭 𝗯𝘂𝗹𝗮𝗻\n- mobile : 25.000\n- all device: 30.000\n- tv only : 15.000\n\n 𝗽𝗿𝗶𝘃𝗮𝘁𝗲 𝟭 𝗯𝘂𝗹𝗮𝗻\n- mobile : 35.000\n- all device : 45.000\n- tv only : 20.000\n\ncatatan : \n- acc by seler\n- 𝗈𝗋𝖽𝖾𝗋 𝗐𝖺𝗃𝗂𝖻 𝗌𝖺𝖻𝖺𝗋!\n- full garansi, jika mengikuti snk\n- tanyakan stok terlebih dahulu\n- no refund",
                "pay": "── ready ya kak.. \nsistem order nya tf - kita send akun - login - done.\n\n— gopay, spay, dana:\n 083150765088\n— BRI\n 010201101581503\n\n✉️ : jangan lupa untuk segera mengirimkan bukti pembayaran & pastikan tidak diedit atau diubah dengan cara apa pun.",
                "capcut": "╭⋆｡˚ CAPCUT\n~ sharing\n 1bulan — 15k\n~ privat\n 1bulan — 25k\n\n— untuk pembelian 2/3 bulan berlaku kelipatan (disc 3k perbulan)\n\n SHARING / PRIVAT\n• 2b — 27k / 47k\n• 3b — 39k / 69k\n• 10b — 99k / 189k\n╰───────────────✦\n📄 catatan\n— sharing cuma bisa 1 device\n— private bisa 2 device/ login pc\n— login pc wajib ambil privat\n— login dicapcut langsung trus ke email.\n— Untuk paket sebulan lebih akan replace tiap bulan, karena bukan pembelian langsung di aplikasi (sudah kebijakan resmi CapCut)\n— wajib ss login buat garlic",
                "spotify": "╭⋆｡˚ SPOTIFY \n\n 1 bulan — 25k \n\n🗒️ catatan\n• garansi 3x",
                "canva": "╭⋆｡˚ CANVA \n1bulan — 5k\n5bulan — 17k\n1tahun — 26k \n\n╰───────────────✦\n\n📄 catatan\n— send email yg udah login di canva dichat privadi\n— full garansi\n— stok selalu ready",
                "yt": "╭⋆｡˚ YOUTOUBE\n\n famplan 1b — 13k\n indplan 1b — 15k\n\n╰───────────────✦\n📄catatan\n— indplan acc by seller \n— famplan via invite email cust",
                "netflix": "NETFLIX\n\n𐙚 𝟭𝗽𝟮𝘂\n- 1 month : 25.000\n\n𐙚 𝟭𝗽𝟭𝘂\n- 1 month : 39.000\n\n𐙚 𝘀𝗲𝗺𝗶 𝗽𝗿𝗶𝘃𝗮𝘁𝗲\n- 1 month : 44.000\n\n\n 🖇️ 𝗻𝗼𝘁𝗲 : \n- acc by seler\n- 𝗈𝗋𝖽𝖾𝗋 𝗐𝖺𝗃𝗂𝖻 𝗌𝖺𝖻𝖺𝗋!\n- full garansi, jika mengikuti snk\n- tanyakan stok terlebih dahulu\n- no refund\n- membeli = setuju atas resikonya\n- 23-28h terhitung 1 bulan"
            }
        }
    }
};
let isLoaded = false;

module.exports = {
    // Memuat seluruh data dari Supabase ke Memori (Dipanggil saat bot start)
    loadDatabase: async () => {
        try {
            console.log("📥 [SUPABASE] Mengunduh data dari database...");
            
            // Coba muat lokal dulu jika ada untuk mencegah data level/xp mundur gara-gara fetch failed sebelumnya
            try {
                const fs = require('fs');
                if (fs.existsSync('./database_temp.json')) {
                    const localData = JSON.parse(fs.readFileSync('./database_temp.json'));
                    if (localData && localData.users) db = localData;
                    console.log("✅ [LOKAL CACHE] Data lokal dimuat sementara menyinkronkan...");
                }
            } catch(e) {}

            const { data: usersData, error: uErr } = await supabase.from('users').select('*');
            if (uErr) throw uErr;
            const { data: groupsData, error: gErr } = await supabase.from('groups').select('*');
            if (gErr) throw gErr;
            const { data: sewaData, error: sErr } = await supabase.from('sewa').select('*');
            if (sErr && !sErr.message.includes('relation "sewa" does not exist')) console.error("Sewa Sync Error:", sErr.message);
            const { data: bsData, error: bsErr } = await supabase.from('bot_settings').select('*');
            if (bsErr && !bsErr.message.includes('relation "bot_settings" does not exist')) console.error("Bot Settings Sync Error:", bsErr.message);
            
            if (usersData) {
                usersData.forEach(u => {
                    // Hanya overwrite memori lokal jika data Supabase lebih tinggi atau user baru
                    if (!db.users[u.jid]) {
                        db.users[u.jid] = u;
                    } else if (u.level > db.users[u.jid].level || u.xp > db.users[u.jid].xp || u.balance > db.users[u.jid].balance) {
                        Object.assign(db.users[u.jid], u);
                    }

                    // Normalisasi kolom huruf kecil dari Supabase ke struktur memory bot
                    if (u.afktime !== undefined) db.users[u.jid].afkTime = u.afktime;
                    if (u.afkreason !== undefined) db.users[u.jid].afkReason = u.afkreason;
                    if (u.lastslot !== undefined) db.users[u.jid].lastSlot = u.lastslot;
                });
            }
            if (groupsData) {
                groupsData.forEach(g => {
                    if (!db.groups[g.jid]) db.groups[g.jid] = g;
                    // Restore listrs to db.chats
                    if (g.listrs) {
                        if (!db.chats) db.chats = {};
                        if (!db.chats[g.jid]) db.chats[g.jid] = {};
                        db.chats[g.jid].listrs = g.listrs;
                    }
                });
            }
            if (sewaData) {
                sewaData.forEach(s => {
                    if (!db.sewa[s.jid]) db.sewa[s.jid] = s;
                });
            }
            if (bsData) {
                bsData.forEach(b => {
                    if (!db.bot_settings[b.id]) db.bot_settings[b.id] = b;
                });
            }
            
            // INJEKSI PAKSA DATA CHATS KEPADA GRUP KHUSUS REGARDLESS OF CLOUD/LOCAL CACHE
            if (!db.groups) db.groups = {};
            if (!db.groups['120363418477019997@g.us']) db.groups['120363418477019997@g.us'] = { jid: '120363418477019997@g.us', welcome: false };

            if (!db.chats) db.chats = {};
            if (!db.chats['120363418477019997@g.us']) db.chats['120363418477019997@g.us'] = {};
            if (!db.chats['120363418477019997@g.us'].listrs || Object.keys(db.chats['120363418477019997@g.us'].listrs).length === 0) {
                db.chats['120363418477019997@g.us'].listrs = {
                    "vidio": "𝘃𝗶𝗱𝗶𝗼 𝗽𝗹𝗮𝘁𝗶𝗻𝘂𝗺\n\n 𝘀𝗵𝗮𝗿𝗶𝗻𝗴 𝟭 𝗯𝘂𝗹𝗮𝗻\n- mobile : 25.000\n- all device: 30.000\n- tv only : 15.000\n\n 𝗽𝗿𝗶𝘃𝗮𝘁𝗲 𝟭 𝗯𝘂𝗹𝗮𝗻\n- mobile : 35.000\n- all device : 45.000\n- tv only : 20.000\n\ncatatan : \n- acc by seler\n- 𝗈𝗋𝖽𝖾𝗋 𝗐𝖺𝗃𝗂𝖻 𝗌𝖺𝖻𝖺𝗋!\n- full garansi, jika mengikuti snk\n- tanyakan stok terlebih dahulu\n- no refund",
                    "pay": "── ready ya kak.. \nsistem order nya tf - kita send akun - login - done.\n\n— gopay, spay, dana:\n 083150765088\n— BRI\n 010201101581503\n\n✉️ : jangan lupa untuk segera mengirimkan bukti pembayaran & pastikan tidak diedit atau diubah dengan cara apa pun.",
                    "capcut": "╭⋆｡˚ CAPCUT\n~ sharing\n 1bulan — 15k\n~ privat\n 1bulan — 25k\n\n— untuk pembelian 2/3 bulan berlaku kelipatan (disc 3k perbulan)\n\n SHARING / PRIVAT\n• 2b — 27k / 47k\n• 3b — 39k / 69k\n• 10b — 99k / 189k\n╰───────────────✦\n📄 catatan\n— sharing cuma bisa 1 device\n— private bisa 2 device/ login pc\n— login pc wajib ambil privat\n— login dicapcut langsung trus ke email.\n— Untuk paket sebulan lebih akan replace tiap bulan, karena bukan pembelian langsung di aplikasi (sudah kebijakan resmi CapCut)\n— wajib ss login buat garlic",
                    "spotify": "╭⋆｡˚ SPOTIFY \n\n 1 bulan — 25k \n\n🗒️ catatan\n• garansi 3x",
                    "canva": "╭⋆｡˚ CANVA \n1bulan — 5k\n5bulan — 17k\n1tahun — 26k \n\n╰───────────────✦\n\n📄 catatan\n— send email yg udah login di canva dichat privadi\n— full garansi\n— stok selalu ready",
                    "yt": "╭⋆｡˚ YOUTOUBE\n\n famplan 1b — 13k\n indplan 1b — 15k\n\n╰───────────────✦\n📄catatan\n— indplan acc by seller \n— famplan via invite email cust",
                    "netflix": "NETFLIX\n\n𐙚 𝟭𝗽𝟮𝘂\n- 1 month : 25.000\n\n𐙚 𝟭𝗽𝟭𝘂\n- 1 month : 39.000\n\n𐙚 𝘀𝗲𝗺𝗶 𝗽𝗿𝗶𝘃𝗮𝘁𝗲\n- 1 month : 44.000\n\n\n 🖇️ 𝗻𝗼𝘁𝗲 : \n- acc by seler\n- 𝗈𝗋𝖽𝖾𝗋 𝗐𝖺𝗃𝗂𝖻 𝗌𝖺𝖻𝖺𝗋!\n- full garansi, jika mengikuti snk\n- tanyakan stok terlebih dahulu\n- no refund\n- membeli = setuju atas resikonya\n- 23-28h terhitung 1 bulan"
                };
            }

            isLoaded = true;
            console.log("✅ [SUPABASE] Sinkronisasi Memory Cache Selesai (" + (usersData?.length||0) + " users).");
        } catch (e) {
            console.error("❌ [SUPABASE] Gagal memuat database: ", e.message);
        }
    },

    read: () => db,

    // Sinkronisasi data kembali ke Supabase (Save Terjadwal)
    saveAll: async () => {
        if (!isLoaded) return;
        const usersArray = Object.values(db.users).map(u => ({
            jid: u.jid,
            name: u.name,
            xp: u.xp,
            level: u.level,
            balance: u.balance,
            pcLimit: u.pcLimit,
            lastChat: u.lastChat,
            lastDaily: u.lastDaily,
            lastSlot: u.lastSlot || u.lastslot || 0,
            afktime: u.afkTime || u.afktime || 0,
            afkreason: u.afkReason || u.afkreason || '',
            health: u.health || 100,
            stamina: u.stamina || 100,
            potion: u.potion || 0,
            diamond: u.diamond || 0,
            common_crate: u.common_crate || 0,
            iron: u.iron || 0,
            gold: u.gold || 0,
            bank: u.bank || 0,
            sword: u.sword || 0
        }));
        const groupsArray = Object.values(db.groups).map(g => ({
            jid: g.jid,
            welcome: g.welcome || false,
            listrs: db.chats?.[g.jid]?.listrs || {}
        }));
        const sewaArray = Object.values(db.sewa || {}).map(s => ({
            jid: s.jid,
            expired: s.expired || 0,
            notified: s.notified || false
        }));
        const botSettingsArray = Object.values(db.bot_settings || {}).map(b => ({
            id: b.id,
            sewa_price_list: b.sewa_price_list || ""
        }));
        
        // 1. BACKUP LOKAL (Anti Hilang jika Supabase Timeout)
        try {
            require('fs').writeFileSync('./database_temp.json', JSON.stringify(db, null, 2));
        } catch(e) {}

        try {
            // Upsert batch
            if (usersArray.length > 0) {
                const { error: err1 } = await supabase.from('users').upsert(usersArray, { onConflict: 'jid' });
                if (err1) {
                    if (err1.message.includes('fetch failed')) {
                        // Suppress network reset errors that happen often on local environments
                    } else {
                        console.error("❌ [SUPABASE DB] Gagal auto-save users:", err1.message);
                    }
                }
            }
            if (groupsArray.length > 0) {
                const { error: err2 } = await supabase.from('groups').upsert(groupsArray, { onConflict: 'jid' });
                if (err2) {
                    if (err2.message.includes('fetch failed')) {
                        // Suppress
                    } else {
                        console.error("❌ [SUPABASE DB] Gagal auto-save groups:", err2.message);
                    }
                }
            }
            if (sewaArray.length > 0) {
                const { error: err3 } = await supabase.from('sewa').upsert(sewaArray, { onConflict: 'jid' });
                if (err3 && !err3.message.includes('fetch failed') && !err3.message.includes('not exist')) console.error("❌ [SUPABASE DB] Gagal auto-save sewa:", err3.message);
            }
            if (botSettingsArray.length > 0) {
                const { error: err4 } = await supabase.from('bot_settings').upsert(botSettingsArray, { onConflict: 'id' });
                if (err4 && !err4.message.includes('fetch failed') && !err4.message.includes('not exist')) console.error("❌ [SUPABASE DB] Gagal auto-save bot_settings:", err4.message);
            }
        } catch (e) {
            if (!e?.message?.includes('fetch failed')) {
                console.error("Gagal auto-save ke Supabase:", e.message);
            }
        }
    },

    // Manajemen Data User (Memory Driven)
    getUser: (jid) => {
        if (!db.users[jid]) {
            db.users[jid] = { 
                jid: jid,
                name: "", 
                xp: 0, 
                level: 1, 
                balance: 1000, 
                pcLimit: 5, 
                lastChat: 0,
                lastDaily: 0,
                health: 100,
                stamina: 100,
                potion: 0,
                diamond: 0,
                common_crate: 0,
                iron: 0,
                gold: 0,
                bank: 0
            };
            // Registrasi dihapus, bot auto masukin ke DB
        } else {
            let update = false;
            if (db.users[jid].balance === undefined) { db.users[jid].balance = 1000; update = true; }
            if (db.users[jid].pcLimit === undefined) { db.users[jid].pcLimit = 5; update = true; }
            if (db.users[jid].lastDaily === undefined) { db.users[jid].lastDaily = 0; update = true; }
            if (db.users[jid].health === undefined) { db.users[jid].health = 100; update = true; }
            if (db.users[jid].stamina === undefined) { db.users[jid].stamina = 100; update = true; }
            if (db.users[jid].potion === undefined) { db.users[jid].potion = 0; update = true; }
            if (db.users[jid].diamond === undefined) { db.users[jid].diamond = 0; update = true; }
            if (db.users[jid].common_crate === undefined) { db.users[jid].common_crate = 0; update = true; }
            if (db.users[jid].iron === undefined) { db.users[jid].iron = 0; update = true; }
            if (db.users[jid].gold === undefined) { db.users[jid].gold = 0; update = true; }
            if (db.users[jid].bank === undefined) { db.users[jid].bank = 0; update = true; }
        }
        return db.users[jid];
    },

    // Manajemen Data Grup
    getGroup: (jid) => {
        if (!db.groups[jid]) {
            db.groups[jid] = { jid: jid, welcome: false };
        }
        return db.groups[jid];
    },

    // Manajemen Sewa Grup
    getSewa: (jid) => {
        if (!db.sewa) db.sewa = {};
        return db.sewa[jid] || null;
    },
    addSewa: (jid, days) => {
        if (!db.sewa) db.sewa = {};
        const msPerDay = 24 * 60 * 60 * 1000;
        let ts = Date.now();
        if (db.sewa[jid] && db.sewa[jid].expired > ts) {
            ts = db.sewa[jid].expired;
        }
        db.sewa[jid] = {
            jid: jid,
            expired: ts + (days * msPerDay),
            notified: false
        };
        return db.sewa[jid];
    },
    delSewa: (jid) => {
        if (db.sewa && db.sewa[jid]) {
            delete db.sewa[jid];
            return true;
        }
        return false;
    },
    getSewaList: () => {
        if (!db.sewa) db.sewa = {};
        return Object.values(db.sewa);
    },

    // Manajemen Bot Settings
    getBotSettings: () => {
        if (!db.bot_settings) db.bot_settings = {};
        if (!db.bot_settings['global']) {
            db.bot_settings['global'] = { id: 'global', sewa_price_list: "Daftar Harga Sewa Bot Belum Diatur." };
        }
        return db.bot_settings['global'];
    },
    setBotSettings: (key, value) => {
        if (!db.bot_settings) db.bot_settings = {};
        if (!db.bot_settings['global']) {
            db.bot_settings['global'] = { id: 'global', sewa_price_list: "" };
        }
        db.bot_settings['global'][key] = value;
    }
};