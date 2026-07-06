const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.join(__dirname, 'plugins');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix reacts
    content = content.replace(/react:\s*{\s*text:\s*['"`]\*\[~\]\*['"`]/g, "react: { text: '⏳'");
    content = content.replace(/react:\s*{\s*text:\s*['"`]\*\[!\]\*['"`]/g, "react: { text: '❌'");
    content = content.replace(/react:\s*{\s*text:\s*['"`]\*\[i\]\*['"`]/g, "react: { text: '✅'");
    content = content.replace(/react:\s*{\s*text:\s*['"`]\*\[\?\]\*['"`]/g, "react: { text: '❓'");

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
        console.log(`[FIXED REACT] ${path.basename(file)}`);
    }
});

console.log(`\nSelesai memperbaiki ${changed} file.`);
