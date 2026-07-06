const cooldowns = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["mine", "nambang", "tambang"],
    handler: async (sock, m, { prefix: usedPrefix }) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);
        
        const cooldownTime = 300000; // 5 menit
        const now = Date.now();
        
        if (cooldowns.has(sender)) {
            const lastTime = cooldowns.get(sender);
            const remaining = (lastTime + cooldownTime) - now;
            
            if (remaining > 0) {
                return sock.sendMessage(sender, { text: `⛏️ Kamu lelah! Istirahat dulu.\nBisa nambang lagi dalam: *${clockString(remaining)}*` }, { quoted: m });
            }
        }

        if (user.health < 50) {
            return sock.sendMessage(sender, { text: `❤️ *Darah kamu sekarat! (${user.health})*\nMinimal 50 HP buat nambang.\nBeli potion dulu ketik *${usedPrefix}shop potion 1*` }, { quoted: m });
        }

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const iron = rand(1, 5);
        const gold = rand(0, 2);          
        const diamond = rand(0, 1) > 0.8 ? 1 : 0; 
        const damage = rand(10, 30);
        const expDapat = rand(50, 200);   
        
        try {
            user.health -= damage;
            user.iron += iron;
            user.gold += gold;
            user.diamond += diamond;
            user.xp += expDapat;

            cooldowns.set(sender, now);

            sock.sendMessage(sender, { text: `
⛏️ *HASIL MENAMBANG*

⛓️ Iron: +${iron}
🪙 Gold: +${gold}
💎 Diamond: +${diamond}
✨ Exp: +${expDapat}

❤️ Darah berkurang: -${damage}
`.trim() }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(sender, { text: 'Gagal menyimpan hasil tambang ke database.' }, { quoted: m });
        }
    }
};
