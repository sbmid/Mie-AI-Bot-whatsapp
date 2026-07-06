const cooldowns = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["inv", "inventory", "bag"],
    handler: async (sock, m) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);
        const text = `🎒 *INVENTORY POCKET*
👤 User: ${m.pushName || user.name || "Pemain"}

❤️ *Status*
› Health: ${user.health}
› Stamina: ${user.stamina}

🧪 *Consumables*
› Potion: ${user.potion || 0}
› Diamond: ${user.diamond || 0}

📦 *Crates*
› Common Crate: ${user.common_crate || 0}

⛏️ *Materials*
› Iron: ${user.iron || 0}
› Gold: ${user.gold || 0}

⚔️ *Equipment*
› Sword: ${user.sword || 0}

_Note: Item sampah/ikan dikonversi otomatis ke Balance/Uang._
`.trim();

        await sock.sendMessage(sender, { text }, { quoted: m });
    }
};
