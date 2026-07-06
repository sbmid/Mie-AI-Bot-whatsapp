const cooldowns = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["fish", "mancing", "pancing"],
    handler: async (sock, m) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);

        const cooldownTime = 180000;
        const now = Date.now();
        
        if (cooldowns.has(sender)) {
            const lastTime = cooldowns.get(sender);
            const remaining = (lastTime + cooldownTime) - now;
            
            if (remaining > 0) {
                return sock.sendMessage(sender, { text: `🐟 Ikan sudah habis! Tunggu sebentar.\nBisa mancing lagi dalam: *${clockString(remaining)}*` }, { quoted: m });
            }
        }

        if (user.health < 40) {
            return sock.sendMessage(sender, { text: `❤️ *Kamu terlalu lelah! (${user.health} HP)*\nMinimal 40 HP untuk memancing.\nIstirahat atau beli potion dulu.` }, { quoted: m });
        }

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const ikanDapat = rand(1, 6);        
        const hargaIkan = 500;               
        const totalUang = ikanDapat * hargaIkan;

        const dapatCrate = Math.random() < 0.1 ? 1 : 0;
        const damage = rand(5, 15);
        try {
            user.health -= damage;
            user.balance += totalUang;
            if (dapatCrate > 0) {
                user.common_crate += 1;
            }
            cooldowns.set(sender, now);
            let msg = `🎣 *HASIL MEMANCING*

🐟 Tangkapan: ${ikanDapat} Ekor
💰 Terjual: +${totalUang} (Balance)
${dapatCrate > 0 ? '🎁 *LUCKY!* Dapat +1 Common Crate' : ''}

❤️ Tenaga berkurang: -${damage} HP
`.trim();

            sock.sendMessage(sender, { text: msg }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(sender, { text: 'Error saat menyimpan data fishing.' }, { quoted: m });
        }
    }
};
