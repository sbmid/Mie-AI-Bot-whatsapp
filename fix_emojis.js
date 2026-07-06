const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, 'plugins');
const EXCLUDE_DIRS = ['game', 'rpg']; 

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

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Hapus karakter rusak
    content = content.replace(/\uFFFD/g, '');

    // 2. Lindungi react message (simpan sementara)
    const reactMap = {};
    let reactCount = 0;
    content = content.replace(/react:\s*{\s*text:\s*(['"`])(.*?)\1/g, (match, quote, emoji) => {
        const token = `__REACT_TOKEN_${reactCount}__`;
        reactMap[token] = match; // simpan string aslinya "react: { text: '✅'"
        reactCount++;
        return token;
    });

    // 3. Bersihkan SEMUA sisa emoji di seluruh file (Gunakan unicode property escapes)
    content = content.replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/gu, '');

    // 4. Bersihkan tag-tag status ganda atau kotoran format lama
    content = content.replace(/\*\[!\]\*\s*\*\[i\]\*/g, '[!]');
    content = content.replace(/\*\[i\]\*\s*\*\[!\]\*/g, '[i]');

    // 5. Kembalikan react message
    for (const token in reactMap) {
        content = content.replace(token, reactMap[token]);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

const files = walk(PLUGINS_DIR);
let changed = 0;

files.forEach(file => {
    if (fixFile(file)) {
        changed++;
        console.log(`[CLEANED] ${path.basename(file)}`);
    }
});

console.log(`\nSelesai membersihkan ${changed} file.`);
