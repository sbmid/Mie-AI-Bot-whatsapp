const dailyCooldown = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["daily", "claim", "klaim"],
    handler: async (sock, m) => {
        try {
            const sender = m.key.remoteJid;
            const user = global.db.getUser(sender);

            const cooldown = 86400000; // 24 Jam
            const now = Date.now();
            
            if (dailyCooldown.has(sender)) {
                const last = dailyCooldown.get(sender);
                const timer = cooldown - (now - last);
                
                if (timer > 0) {
                    return sock.sendMessage(sender, { text: `⏳ Kamu sudah klaim hari ini.\nKembali lagi dalam: *${clockString(timer)}*` }, { quoted: m });
                }
            }

            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            const uang = rand(5000, 20000);   
            const exp = rand(2000, 8000);     
            const potion = rand(0, 3);
            const diamond = rand(0, 2);       
            
            const crate = Math.random() < 0.5 ? 1 : 0; 

            user.balance += uang;
            user.xp += exp;
            
            if (potion > 0) user.potion += potion;
            if (diamond > 0) user.diamond += diamond;
            if (crate > 0) user.common_crate += crate;

            dailyCooldown.set(sender, now);

            const text = `🎁 *DAILY REWARD*
_Berhasil diklaim!_

💰 Balance: *+${uang}*
✨ Exp: *+${exp}*
🧪 Potion: *+${potion}*
💎 Diamond: *+${diamond}*
📦 Crate: *+${crate}*

_Jangan lupa klaim lagi besok ya!_ 🏃.
`.trim();

            await sock.sendMessage(sender, { text }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal menyimpan data daily." }, { quoted: m });
        }
    }
};
