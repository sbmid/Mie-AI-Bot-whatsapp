const { exec } = require('child_process');

module.exports = {
    command: ['install', 'npminstall'],
    isOwner: true,
    handler: async (sock, m) => {
        if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        await sock.sendMessage(m.chat, { text: '⏳ Menjalankan `npm install` di server... Tunggu sebentar.' }, { quoted: m });
        
        exec('npm install', (err, stdout, stderr) => {
            let result = stdout || stderr || '';
            
            if (err) {
                result = `❌ Error:\n${err.message}\n\n${result}`;
                if (global.waitMode === "react") sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            } else {
                result = `✅ Selesai (NPM Install):\n\n${result}`;
                if (global.waitMode === "react") sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            }
            
            sock.sendMessage(m.chat, { text: result.trim() }, { quoted: m });
        });
    }
};
