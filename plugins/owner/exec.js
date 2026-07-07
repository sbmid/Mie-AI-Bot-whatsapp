const { exec } = require('child_process');

module.exports = {
    command: ['exec', 'npm', '$'],
    handler: async (sock, m, { text, command }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber.includes(sender);

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.\nID: *${sender}*` 
            }, { quoted: m });
        }

        let cmd = text.trim();
        if (!cmd) return sock.sendMessage(m.chat, { text: `[!] Masukkan perintah bash. Contoh:\n.exec ls -la\n.$ npm install canvas` }, { quoted: m });

        // Jika command yang dipakai adalah 'npm', gabungkan dengan args
        if (command === 'npm') {
            cmd = `npm ${cmd}`;
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            exec(cmd, (err, stdout, stderr) => {
                let result = '';
                if (stdout) result += `${stdout}\n`;
                if (stderr) result += `${stderr}\n`;
                if (err) result += `Error:\n${err.message}`;

                sock.sendMessage(m.chat, { 
                    text: result ? result.trim() : '✅ Selesai (Tidak ada output)' 
                }, { quoted: m });

                if (global.waitMode === "react") sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            });

        } catch (err) {
            await sock.sendMessage(m.chat, { 
                text: String(err) 
            }, { quoted: m });
        }
    }
};
