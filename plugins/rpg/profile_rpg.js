module.exports = {
    command: ["stats", "profilerpg"],
    handler: async (sock, m) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);
        
        const text = `
👤 *PROFILE USER*

📋 *Info Dasar*
› Nama: ${m.pushName || user.name || "User"}
› Level: ${user.level}
› Exp: ${user.xp}
› Limit PC: ${user.pcLimit}

❤️ *Status Fisik*
› Health: ${user.health}
› Stamina: ${user.stamina}

💰 *Aset & Kekayaan*
› Balance: ${user.balance.toLocaleString('id-ID')}
› Bank: ${user.bank > 0 ? user.bank.toLocaleString('id-ID') : 0}
› Diamond: ${user.diamond}
› Gold: ${user.gold}

🎒 *Inventory RPG*
› Potion: ${user.potion}
› Iron: ${user.iron}
› Sword: ${user.sword || 0}
› Common Crate: ${user.common_crate}
`.trim();

        await sock.sendMessage(sender, { text }, { quoted: m });
    }
};
