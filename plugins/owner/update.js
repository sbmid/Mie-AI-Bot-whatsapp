const { execSync } = require('child_process');
const util = require('util');

/**
 * Auto Update by Azrial Galih Prasetyo
 * Melakukan sinkronisasi file (menambah, mengubah, menghapus) secara cerdas via Git Pull
 */
module.exports = {
    command: ['update', 'gitpull'],
    handler: async (sock, m, { command }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber.includes(sender);

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nBukan Owner, jangan sok asik!` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            // Hapus index.lock jika ada (self-healing git crash)
            try { execSync('rm -f .git/index.lock'); } catch (e) {}

            // Menggunakan git fetch dan git reset, ini secara otomatis membuat bot 
            // 100% identik dengan repo github, menghapus modifikasi lokal, dan menghapus file yang dihapus di repo.
            let stdout = execSync('git fetch origin && git reset --hard origin/main').toString();
            
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await sock.sendMessage(m.chat, { 
                text: `*✅ SINKRONISASI SELESAI*\n\n\`\`\`\n${stdout.trim()}\n\`\`\`\n\n_Catatan: Jika ada file bot yang berubah, Nodemon otomatis merestart bot._` 
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            
            let errMsg = err.stdout ? err.stdout.toString() : err.message;
            await sock.sendMessage(m.chat, { 
                text: `*❌ GAGAL UPDATE*\n\nAda conflict atau error git:\n\`\`\`\n${util.format(errMsg).trim()}\n\`\`\`` 
            }, { quoted: m });
        }
    }
};
