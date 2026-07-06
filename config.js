const chalk = require('chalk');
const fs = require('fs');

// --- SETTINGS BOT ---
// ownerNumber: dipakai untuk cek izin owner di handler (isi semua nomor owner)
global.ownerNumber = [
    "6283809720392@s.whatsapp.net",
    "94300352282641@lid"
];

// ownerProfiles: data lengkap untuk ditampilkan di command .owner
// Tambah/kurangi sesuai kebutuhan (max 5 disarankan)
global.ownerProfiles = [
    {
        name: "Azrial",
        phone: "6283809720392",   // tanpa +, tanpa @
        title: "Owner & Developer",
        organization: "Mie AI",
        email: "",                // isi kalau ada, kosongkan jika tidak
        note: "Owner utama bot"
    },
    // {
    //     name: "Owner 2",
    //     phone: "628XXXXXXXXX",
    //     title: "Co-Owner",
    //     organization: "Mie AI",
    //     email: "",
    //     note: ""
    // },
    // Tambah sampai 5 owner di sini
];

global.ownerName = global.ownerProfiles[0]?.name || "Azrial"; // Nama utama (untuk referensi lain)

// --- AUTO LOAD EXTRA OWNERS ---
try {
    const path = require('path');
    const extraOwnersPath = path.join(__dirname, 'database', 'owners.json');
    if (fs.existsSync(extraOwnersPath)) {
        const extra = JSON.parse(fs.readFileSync(extraOwnersPath, 'utf8'));
        if (extra.numbers) {
            extra.numbers.forEach(num => {
                if (!global.ownerNumber.includes(num)) global.ownerNumber.push(num);
            });
        }
        if (extra.profiles) {
            extra.profiles.forEach(p => {
                if (!global.ownerProfiles.find(op => op.phone === p.phone)) {
                    global.ownerProfiles.push(p);
                }
            });
        }
    }
} catch (e) {
    console.error('Gagal load database/owners.json:', e.message);
}

// --- CMD SETTINGS ---
global.prefix = "."; // Kamu bisa ganti jadi ".", "/", atau kosongkan "" jika ingin tanpa prefix

// --- LOADING SETTINGS ---
global.waitMode = "none"; // Opsi: "text", "react", "none"
global.waitEmoji = "💡";
global.waitText = "_Sedang diproses, mohon tunggu..._";

// INI UNTUK JALUR MENGIRIM LAPORAN STATUS BOT DARI FITUR "BOTSTATUS"
global.newsletterJids = [
    "120363424104414634@newsletter",
    "120363417042584770@newsletter" // Tambahin lagi di sini kalau ada
];



// --- API KEYS ---
// Simpan semua API Key di sini agar mudah dikelola
global.api = {
    gemini: process.env.GEMINI_API_KEY || 'API_KEY_DI_SINI',
    fgsi: process.env.FGSI_API_KEYS ? process.env.FGSI_API_KEYS.split(',') : [
        'fgsiapi-ead2fb3-6d',
        'fgsiapi-1124847d-6d',
        'fgsiapi-170c8fe-6d',
        'fgsiapi-af7cf11-6d',
        'fgsiapi-24a59a4d-6d',
        'fgsiapi-15725fc4-6d'
    ]
};

// --- STICKER SETTINGS ---
global.packname = "My BOT"; // Nama Pack Stiker
global.author = "AL in SBM"; // Nama Pembuat/Author Stiker

// --- AUTO-UPDATE CONFIG ---
// Jika kamu edit file ini, bot akan langsung mendeteksi perubahannya
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update config.js`));
    delete require.cache[file];
    require(file);
});