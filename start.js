require('dotenv').config();
require('./config');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const handler = require('./lib/handler');
const groupHandler = require('./lib/groupHandler');
const groupUpdate = require('./lib/groupUpdate');
const db = require('./lib/database'); // Supabase


// --- LOGGER ---
const logger = {
    info: (msg) => console.log(`${chalk.blue(`[${new Date().toLocaleTimeString()}]`)} ${chalk.bgBlue.white(' INFO ')} ${msg}`),
    success: (msg) => console.log(`${chalk.green(`[${new Date().toLocaleTimeString()}]`)} ${chalk.bgGreen.white(' DONE ')} ${msg}`),
    warn: (msg) => console.log(`${chalk.yellow(`[${new Date().toLocaleTimeString()}]`)} ${chalk.bgYellow.black(' WARN ')} ${msg}`),
    error: (msg) => console.log(`${chalk.red(`[${new Date().toLocaleTimeString()}]`)} ${chalk.bgRed.white(' EROR ')} ${msg}`),
    msg: (name, body) => console.log(`${chalk.magenta(`[${new Date().toLocaleTimeString()}]`)} ${chalk.bgMagenta.white(' MSG  ')} ${chalk.bold(name)}: ${chalk.white(body)}`)
};

// --- CONFIG ---
const AUTH_METHOD = process.env.AUTH_METHOD || "QR"; // "QR" atau "PAIRING_CODE"
const BOT_NUMBER = process.env.BOT_NUMBER || ""; // Nomor WA bot kamu jika pilih Pairing Code

// --- 🎀 HYBRID PLUGIN LOADER (CJS & ESM) 🎀 ---
let plugins = {};

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith(".js") || file.endsWith(".mjs")) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function loadPlugins() {
    logger.info("Initializing plugins loader...");
    const pluginFolder = path.join(__dirname, "plugins");
    if (!fs.existsSync(pluginFolder)) fs.mkdirSync(pluginFolder);

    // Get all nested js/mjs files
    const allFiles = getAllFiles(pluginFolder);

    for (const filePath of allFiles) {
        const basename = path.basename(filePath);
        try {
            const module = await import(`file://${filePath}?update=${Date.now()}`);
            plugins[basename.replace(/\.(js|mjs)$/, "")] = module.default || module;
        } catch (e) {
            logger.error(`Gagal muat ${basename}: ${e.message}`);
        }
    }
    global.plugins = plugins;
}

function watchPlugins() {
    const pluginFolder = path.join(__dirname, "plugins");
    fs.watch(pluginFolder, { recursive: true }, async (eventType, filename) => {
        if (filename && (filename.endsWith(".js") || filename.endsWith(".mjs"))) {
            const pluginName = path.basename(filename).replace(/\.(js|mjs)$/, "");
            const filePath = path.join(pluginFolder, filename);
            if (!fs.existsSync(filePath)) {
                delete plugins[pluginName];
                global.plugins = plugins;
                return;
            }
            try {
                const module = await import(`file://${filePath}?update=${Date.now()}`);
                plugins[pluginName] = module.default || module;
                global.plugins = plugins;
            } catch (e) { }
        }
    });
}

// --- BOT START PROTOCOL ---
let _pluginsLoaded = false; // Flag agar loadPlugins hanya sekali

async function startBot() {
    await db.loadDatabase();

    // Inisialisasi Global Variables dari Settings Bot Database Lokal
    const dbData = global.db ? global.db.read() : db.read();
    if (!dbData.settings) dbData.settings = {};
    if (!dbData.settings.bot) dbData.settings.bot = {};
    const bSet = dbData.settings.bot;
    global.autotyping = !!bSet.autotyping;
    global.autoread = !!bSet.autoread;
    global.readsw = !!bSet.readsw;
    global.pconly = !!bSet.pconly;
    global.gconly = !!bSet.gconly;
    global.anticall = !!bSet.anticall;

    // Hanya load plugin sekali — saat reconnect tidak perlu reload ulang
    if (!_pluginsLoaded) {
        await loadPlugins();
        watchPlugins();
        _pluginsLoaded = true;
    }
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const isQR = AUTH_METHOD.toUpperCase() === "QR";

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: isQR, // Tampilkan QR kalau disetting QR
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        // --- 🚀 OPTIMIZATION & LOW RAM TWEAKS ---
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false
    });

    global.sock = sock;

    // Pairing Code Flow
    if (!isQR && !sock.authState.creds.registered) {
        console.log(chalk.black.bgWhite.bold("\n  WA BOT SETUP - PAIRING MODE  \n"));
        if (!BOT_NUMBER) {
            logger.error("BOT_NUMBER di .env masih kosong! Tolong isi dengan nomor bot (contoh: 628...).");
            process.exit(1);
        }

        let p = BOT_NUMBER.toString().replace(/[^0-9]/g, ''); // Hapus selain angka
        logger.info(`Meminta Pairing Code untuk nomor: ${p}`);

        // Jeda bentar agar Baileys socket stabil dulu
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(p);
                console.log(chalk.black.bgCyan.bold("\n  YOUR PAIRING CODE  "));
                console.log(chalk.cyan.bold(`  >  ${code.match(/.{1,4}/g).join('-').toUpperCase()}  \n`));
            } catch (e) {
                logger.error("Gagal Request Pairing Code: " + e.message);
            }
        }, 3000);
    }

    sock.ev.on('group-participants.update', async (anu) => {
        try {
            await groupUpdate(sock, anu);
            if (typeof groupHandler === 'function') await groupHandler(sock, anu);
        } catch (e) { }
    });

    // --- ANTICALL SYSTEM (DINONAKTIFKAN) ---
    // sock.ev.on('call', async (calls) => {
    //     if (!global.anticall) return;
    //     for (const call of calls) {
    //         if (call.status === 'offer') {
    //             const isOwnCall = global.activeCalls && Object.values(global.activeCalls).some(
    //                 ac => ac.callId === call.id || ac.toJid === call.from
    //             );
    //             if (isOwnCall) {
    //                 logger.info(`Panggilan dari bot sendiri ke ${call.from}, skip anticall.`);
    //                 continue;
    //             }
    //             logger.warn(`Panggilan ditolak dari: ${call.from}`);
    //             try {
    //                 await sock.rejectCall(call.id, call.from);
    //                 await sock.sendMessage(call.from, { 
    //                     text: "☎️ *SISTEM ANTI-CALL*\n\nMaaf, bot tidak menerima panggilan Suara atau Video.\nPanggilan kamu otomatis ditolak oleh sistem."
    //                 });
    //             } catch (e) {
    //                 console.error("Gagal reject call:", e);
    //             }
    //         }
    //     }
    // });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            logger.warn(`Koneksi terputus. Kode: ${reason || 'unknown'}`);
            if (reason !== DisconnectReason.loggedOut) {
                logger.warn("Sedang menyambungkan ulang dalam 5 detik...");
                // Hentikan keep-alive lama sebelum reconnect
                if (global._keepAliveInterval) clearInterval(global._keepAliveInterval);
                setTimeout(startBot, 5000);
            } else {
                logger.error("Sesi Logged Out! Hapus folder session dan ulangi.");
                process.exit(1);
            }
        } else if (connection === "open") {
            console.log("\n" + chalk.cyan.bold(`[ BOT TERKONEKSI & ONLINE ]\n`));

            // ✅ Keep-Alive: Ping setiap 30 detik agar koneksi tidak silently drop
            if (global._keepAliveInterval) clearInterval(global._keepAliveInterval);
            global._keepAliveInterval = setInterval(async () => {
                try {
                    await sock.sendPresenceUpdate('available');
                } catch (e) {
                    // Silent — jika gagal ping, koneksi sudah akan trigger connection.update
                }
            }, 30000);
        }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        // --- 🕵️‍♂️ SPY INTERCEPTOR DEWA (Level Paling Bawah) ---
        // Tangkap SEMUA pesan (baik notify, append, sync) sebelum difilter apapun!
        const mRaw = messages[0];
        if (mRaw && mRaw.key && mRaw.key.id) {
            global.messageSpyDB = global.messageSpyDB || {};
            const keys = Object.keys(global.messageSpyDB);
            if (keys.length > 200) delete global.messageSpyDB[keys[0]];
            try { global.messageSpyDB[mRaw.key.id] = JSON.parse(JSON.stringify(mRaw)); } 
            catch (e) { global.messageSpyDB[mRaw.key.id] = mRaw; }
        }

        if (type !== 'notify') return;
        try {
            await handler(sock, mRaw, plugins, logger);
        } catch (e) {
            logger.error(`Error Upsert: ${e.message}`);
        }
    });
}

// Auto Save Supabase Database
setInterval(() => {
    if (global.db && global.db.saveAll) global.db.saveAll();
    else db.saveAll();
}, 30000);

// Polling GoPay Sewa Otomatis (Dinonaktifkan, diganti sistem tombol)
// setInterval(() => {
//     if (global.sock) {
//         require('./lib/gopay_polling').checkGopayApi(global.sock);
//     }
// }, 60000);


// Interval Reminder Sewa (< 24 Jam)
setInterval(async () => {
    if (!global.sock) return;
    const dbSewa = global.db || db;
    if (dbSewa.getSewaList) {
        const sewaList = dbSewa.getSewaList();
        const now = Date.now();
        for (let s of sewaList) {
            if (s.expired > now) {
                const sisaMs = s.expired - now;
                if (sisaMs < 86400000 && !s.notified) {
                    s.notified = true;
                    try {
                        const ownerList = global.ownerNumber || ['628'];
                        const targetOwner = ownerList[0].split('@')[0];
                        await global.sock.sendMessage(s.jid, {
                            text: `⚠️ *Peringatan Sewa Bot*\n\nBatas waktu penyewaan bot di grup ini tersisa kurang dari *24 Jam*.\nHarap segera perpanjang masa sewa agar bot tidak masuk ke mode *Mute*.\n\nHubungi owner: wa.me/${targetOwner}`
                        });
                    } catch (e) { }
                }
            }
        }
    }
}, 60 * 1000 * 5); // Cek setiap 5 Menit

// AUTO RESTART 12 JAM (Nodemon Compatible)
setTimeout(() => {
    logger.info("Memicu auto-restart 12 jam untuk membersihkan memori (Nodemon akan merestart otomatis)...");
    process.exit(1);
}, 12 * 60 * 60 * 1000);

process.on('uncaughtException', (err) => logger.error(`Critical Error: ${err.message}`));
startBot();
