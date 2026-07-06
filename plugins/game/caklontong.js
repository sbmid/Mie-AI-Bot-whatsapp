const axios = require('axios');
const chalk = require('chalk'); 
module.exports = {
    command: ['caklontong'],
    category: ['game'],
    
    before: async (sock, m, { user, body }) => {
        sock.caklontong = sock.caklontong || {};
        if (!(m.chat in sock.caklontong)) return false;

        let json = sock.caklontong[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            await sock.sendMessage(m.chat, { 
                text: `✨ *CAK LONTONG BERHASIL!* ✨\n\nJawaban kamu benar!\n\n🧩 *Jawaban:* ${json.jawaban}\n📝 *Deskripsi:* ${json.deskripsi}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.caklontong[m.chat][2]);
            delete sock.caklontong[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.caklontong = sock.caklontong || {};
        if (m.chat in sock.caklontong) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/caklontong');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal." }, { quoted: m });

            const json = res.data;

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Cak Lontong Answer:')} ${chalk.white.bold(json.jawaban)} ${chalk.cyan(`[Group: ${m.chat}]`)}`);

            let caption = `
🎮 *GAME CAK LONTONG*

🧩 *Soal:* ${json.soal}
⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.caklontong[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.caklontong[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawaban yang benar adalah: *${json.jawaban}*\n📝 *Deskripsi:* ${json.deskripsi}` 
                        }, { quoted: sock.caklontong[m.chat][0] });
                        delete sock.caklontong[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Cak Lontong:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis." }, { quoted: m });
        }
    }
};
