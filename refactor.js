const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, 'plugins');
const EXCLUDE_DIRS = ['game', 'rpg']; // Jangan hapus emoji di game/rpg

// Pemetaan emoji ke format elegan
const EMOJI_MAP = [
    // Status / Indicator Emojis -> Symbol Tags
    { regex: /[❌❎🚫]/g, replace: '[!]' },
    { regex: /[✅✔️☑️]/g, replace: '[i]' },
    { regex: /[⚠️❕❗️]/g, replace: '[!]' },
    { regex: /[⏳⌛🔄]/g, replace: '[~]' },
    { regex: /[ℹ️💡]/g, replace: '[i]' },
    { regex: /[❓❔🔍🔎]/g, replace: '*[?]*' },

    // Decorative Emojis (yang sering ada di awal baris list) -> Kutipan elegan
    { regex: /^\s*(?:👤|👨‍💻|🏷️|🔖|📁|📂|📄|🕒|🕐|📅|📆|✨|🎉|🔥|💬|🤖|🐈|⭐|🌟|🏆|👑|💰|💎|💳|💸|📉|📈|📊|💻|📱|⚙️|🔧|🛠️|📦|📥|⬇️)\s*\*/gm, replace: '> » *' },
    
    // Decorative Emojis (di luar list, hapus saja)
    { regex: /(?:👤|👨‍💻|🏷️|🔖|📁|📂|📄|🕒|🕐|📅|📆|✨|🎉|🔥|💬|🤖|🐈|⭐|🌟|🏆|👑|💰|💎|💳|💸|📉|📈|📊|💻|📱|⚙️|🔧|🛠️|📦|📥|⬇️)/g, replace: '' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            const dirName = path.basename(file);
            if (!EXCLUDE_DIRS.includes(dirName)) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Terapkan semua regex
    EMOJI_MAP.forEach(rule => {
        content = content.replace(rule.regex, rule.replace);
    });

    // Cleanup spasi berlebih atau tag double (misal [!] [!] -> [!])
    content = content.replace(/\*\[!\]\*\s*\*\[!\]\*/g, '[!]');
    content = content.replace(/\*\[i\]\*\s*\*\[i\]\*/g, '[i]');
    content = content.replace(/\*\[\?\]\*\s*\*\[\?\]\*/g, '*[?]*');

    // Coba deteksi pola JUDUL FITUR yang diapit bintang atau emoji
    // misal: `*JUDUL*` -> `━ ⟨ *JUDUL* ⟩ ━`
    // Tapi kita harus hati-hati agar tidak merusak formatting lain.
    // Hanya berlaku jika sebaris penuh hanya berisi *JUDUL*
    const titleRegex = /^(?:`|'|")\s*\*([A-Z0-9\s]+)\*\s*(?:\\n|`|'|")/gm;
    content = content.replace(titleRegex, (match, p1) => {
        return match.replace(`*${p1}*`, `━ ⟨ *${p1.trim()}* ⟩ ━`);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

const files = walk(PLUGINS_DIR);
let changed = 0;

files.forEach(file => {
    if (refactorFile(file)) {
        changed++;
        console.log(`[EDITED] ${path.basename(file)}`);
    }
});

console.log(`\nSelesai! Berhasil memodifikasi ${changed} dari ${files.length} file plugin.`);
