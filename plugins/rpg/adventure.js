const advCooldown = new Map();

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["adventure", "adv", "petualang"],
    handler: async (sock, m, { prefix: usedPrefix }) => {
        try {
            const sender = m.key.remoteJid;
            const user = global.db.getUser(sender);
            const cooldownTime = 3600000;
            const now = Date.now();

            if (advCooldown.has(sender)) {
                const lastTime = advCooldown.get(sender);
                const remaining = (lastTime + cooldownTime) - now;

                if (remaining > 0) {
                    return sock.sendMessage(sender, { text: `⏳ Kamu masih lelah berpetualang.\nIstirahat dulu: *${clockString(remaining)}*` }, { quoted: m });
                }
            }

            if (user.health < 80) {
                return sock.sendMessage(sender, { text: `❤️ *Nyawamu Sekarat! (${user.health} HP)*\nMinimal *80 HP* untuk adventure.\n\nBeli potion:\n*${usedPrefix}shop potion 1*\nPakai potion:\n*${usedPrefix}use potion 1*` }, { quoted: m });
            }

            const lokasi = pickRandom([
                "Jepang 🇯🇵", "Korea 🇰🇷", "Bali 🇮🇩", "Amerika 🇺🇸", "Arab 🇸🇦",
                "Jerman 🇩🇪", "Mars 🪐", "Hutan Amazon 🌴", "Atlantis 🌊",
                "Gunung Everest 🏔️", "Mesir 🇪🇬", "Ujung Dunia 🌌"
            ]);

            const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

            const lostHealth = rand(10, 40);
            const exp = rand(1000, 10000);
            const money = rand(1000, 50000);

            const potion = rand(0, 3);
            const diamond = rand(0, 3);
            const iron = rand(1, 15);
            const gold = rand(0, 5);
            const crate = rand(0, 2);

            user.health -= lostHealth;
            user.xp += exp;
            user.balance += money;

            if (potion > 0) user.potion += potion;
            if (diamond > 0) user.diamond += diamond;
            if (iron > 0) user.iron += iron;
            if (gold > 0) user.gold += gold;
            if (crate > 0) user.common_crate += crate;

            advCooldown.set(sender, now);

            const text = `🌍 *ADVENTURE LOG*
Tujuan: *${lokasi}*

❤️ Nyawa: -${lostHealth}
✨ Exp: +${exp}
💰 Uang: +${money}

🎁 *Barang Ditemukan:*
⛓️ Iron: +${iron}
🧪 Potion: +${potion}
💎 Diamond: +${diamond}
🪙 Gold: +${gold}
📦 Crate: +${crate}
`.trim();

            await sock.sendMessage(sender, { text }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.key.remoteJid, { text: "❌ Error fitur adventure (Database)." }, { quoted: m });
        }
    }
};
