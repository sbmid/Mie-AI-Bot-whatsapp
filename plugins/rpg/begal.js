module.exports = {
    command: ["rob", "begal", "maling"],
    handler: async (sock, m, { prefix: usedPrefix, command }) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);
        
        let who = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                  m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!who) return sock.sendMessage(sender, { text: `Tag atau reply target yang mau dibegal!\nContoh: ${usedPrefix + command} @tag` }, { quoted: m });
        if (who === sender) return sock.sendMessage(sender, { text: 'Gak bisa begal diri sendiri.' }, { quoted: m });

        let target = global.db.getUser(who);
        if (target.balance < 1000) return sock.sendMessage(sender, { text: 'Target miskin, gak ada duit buat dibegal.' }, { quoted: m });

        let sukses = Math.random() < 0.4;

        if (sukses) {
            let dapat = Math.floor(Math.random() * 5000) + 1000;
            if (dapat > target.balance) dapat = target.balance;

            target.balance -= dapat;
            user.balance += dapat;
            
            sock.sendMessage(sender, { text: `🔪 *BEGAL SUKSES!*\n\nAnda berhasil merampok @${who.split('@')[0]}\n💰 Dapat: Rp ${dapat}`, mentions: [who] }, { quoted: m });
        } else {
            let denda = 2000;
            let dmg = 20;
            
            user.balance -= denda;
            user.health -= dmg;

            sock.sendMessage(sender, { text: `🚨 *BEGAL GAGAL!*\n\nAnda ditangkap warga!\n💸 Denda: -Rp ${denda}\n🩸 Dipukuli: -${dmg} HP` }, { quoted: m });
        }
    }
};
