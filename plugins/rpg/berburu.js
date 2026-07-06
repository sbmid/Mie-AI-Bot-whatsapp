const huntCooldown = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["berburu", "buru", "hunt"],
    handler: async (sock, m, { prefix: usedPrefix }) => {
        try {
            const sender = m.key.remoteJid;
            const user = global.db.getUser(sender);

            const cooldownTime = 300000;
            const now = Date.now();

            if (huntCooldown.has(sender)) {
                const lastTime = huntCooldown.get(sender);
                const remaining = (lastTime + cooldownTime) - now;

                if (remaining > 0) {
                    return sock.sendMessage(sender, { text: `⏳ Nafas dulu bang!\nBerburu lagi dalam: *${clockString(remaining)}*` }, { quoted: m });
                }
            }

            if (user.health < 50) {
                return sock.sendMessage(sender, { text: `❤️ *Darah Sekarat! (${user.health} HP)*\nMinimal 50 HP buat lawan monster.\n\nBeli potion dulu ketik:\n*${usedPrefix}shop potion 1*\nLalu pakai:\n*${usedPrefix}use potion 1*` }, { quoted: m });
            }

            const monsters = [
                "🐺 Serigala Hitam", "🐯 Harimau Api", "👺 Goblin Hijau", 
                "👹 Orc Besar", "🐉 Naga Mini", "🧟 Zombie", 
                "🌑 Iblis Bayangan", "🐮 Minotaur"
            ];
            const monster = monsters[Math.floor(Math.random() * monsters.length)];
            
            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            const gagal = Math.random() < 0.15; 

            if (gagal) {
                const damage = rand(20, 50);
                user.health -= damage;
                huntCooldown.set(sender, now);
                return sock.sendMessage(sender, { text: `💀 Sial! Kamu diserang balik oleh *${monster}*!\n🩸 Nyawa berkurang: *-${damage} HP*` }, { quoted: m });
            }

            const exp = rand(500, 4000);
            const money = rand(1000, 10000); 
            const damage = rand(10, 30);
            
            const diamond = rand(0, 1);
            const potion = rand(0, 1);
            const iron = rand(1, 5); 
            
            user.health -= damage;
            user.xp += exp;
            user.balance += money;
            
            if (diamond > 0) user.diamond += diamond;
            if (potion > 0) user.potion += potion;
            if (iron > 0) user.iron += iron;

            huntCooldown.set(sender, now);

            const hasil = `📝 *HASIL BERBURU*
Lawan: *${monster}*

🩸 HP Berkurang: *-${damage}*
✨ Exp: *+${exp}*
💰 Uang: *+${money}*

🎁 *Loot Drop:*
💎 Diamond: *+${diamond}*
🧪 Potion: *+${potion}*
⛓️ Iron: *+${iron}*
`.trim();

            await sock.sendMessage(sender, { text: hasil }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Error fitur hunt (Database issue)." }, { quoted: m });
        }
    }
};
