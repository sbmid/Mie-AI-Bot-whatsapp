const cooldowns = new Map();

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, "0")).join(':');
}

module.exports = {
    command: ["kerja", "carikerja", "work"],
    handler: async (sock, m) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);

        const timeout = 300000; 
        const now = Date.now();

        if (cooldowns.has(sender)) {
            const expirationTime = cooldowns.get(sender) + timeout;
            if (now < expirationTime) {
                const timeLeft = expirationTime - now;
                return sock.sendMessage(sender, { text: `⏳ Kamu lelah bekerja!\nIstirahat dulu selama *${clockString(timeLeft)}*` }, { quoted: m });
            }
        }

        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const uang = rand(1000, 4000);   
        const exp = rand(100, 400);      
        const bonusGold = Math.random() < 0.1 ? 1 : 0;
        
        const jobList = [
            "⛏️ Penambang", "🧹 Tukang Bersih-bersih", "🧱 Kuli Bangunan",
            "📦 Kurir Paket", "🍕 Pengantar Makanan", "🚖 Supir Taksi",
            "💻 Programmer", "🔬 Ilmuwan", "🎨 Seniman", "🐄 Peternak",
            "👨‍🏫 Guru Honorer", "👨‍🍳 Koki", "👨‍🔧 Montir"
        ];
        const job = jobList[Math.floor(Math.random() * jobList.length)];

        try {
            user.balance += uang;
            user.xp += exp;
            
            if (bonusGold > 0) {
                user.gold += bonusGold;
            }

            cooldowns.set(sender, now);

            const text = `💼 *LAPORAN KERJA*
Profesi: *${job}*

💰 Gaji: *+${uang}*
✨ Exp: *+${exp}*
${bonusGold > 0 ? '🪙 Bonus: *+1 Gold*' : ''}

_Kerja bagus! Lanjutkan semangatmu._ 👍
`.trim();

            await sock.sendMessage(sender, { text }, { quoted: m });

        } catch (e) {
            console.error(e);
            sock.sendMessage(sender, { text: "❌ Gagal menyimpan data pekerjaan." }, { quoted: m });
        }
    }
};
