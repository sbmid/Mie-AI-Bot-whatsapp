const axios = require('axios');
const chalk = require('chalk'); 
module.exports = {
    command: ['tebakkata', 'tkata'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebakkata = sock.tebakkata || {};
        if (!(m.chat in sock.tebakkata)) return false;

        let json = sock.tebakkata[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            await sock.sendMessage(m.chat, { 
                text: `✨ *TEBAK KATA BERHASIL!* ✨\n\nJawaban kamu benar!\n\n🧩 *Jawaban:* ${json.jawaban}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakkata[m.chat][2]);
            delete sock.tebakkata[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakkata = sock.tebakkata || {};
        if (m.chat in sock.tebakkata) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebakkata');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal." }, { quoted: m });

            const json = res.data;

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Tebak Kata Answer:')} ${chalk.white.bold(json.jawaban)} ${chalk.cyan(`[Group: ${m.chat}]`)}`);

            let caption = `
🎮 *GAME TEBAK KATA*

🧩 *Soal:* ${json.soal}
⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.tebakkata[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakkata[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawaban yang benar adalah: *${json.jawaban}*` 
                        }, { quoted: sock.tebakkata[m.chat][0] });
                        delete sock.tebakkata[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Kata:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis." }, { quoted: m });
        }
    }
};