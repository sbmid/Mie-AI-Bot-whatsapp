const util = require('util');

module.exports = {
    command: ['eval', 'ev', '>'],
    handler: async (sock, m, { text, command }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber.includes(sender);

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.\nID: *${sender}*` 
            }, { quoted: m });
        }

        let code = text.trim();
        if (!code) return;

        try {
            let evaled;
            if (code.includes('await')) {
                evaled = await eval(`(async () => { ${code} })()`);
            } else {
                evaled = await eval(code);
            }

            let output = util.inspect(evaled, { depth: 2 });
            
            await sock.sendMessage(m.chat, { 
                text: output 
            }, { quoted: m });

        } catch (err) {
            await sock.sendMessage(m.chat, { 
                text: util.format(err) 
            }, { quoted: m });
        }
    }
};