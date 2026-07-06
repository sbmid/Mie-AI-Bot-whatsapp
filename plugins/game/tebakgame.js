const axios = require('axios');
const chalk = require('chalk'); 

module.exports = {
    command: ['tebakgame', 'tgame'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebakgame = sock.tebakgame || {};
        if (!(m.chat in sock.tebakgame)) return false;

        let json = sock.tebakgame[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            await sock.sendMessage(m.chat, { 
                text: `✨ *TEBAK GAME BERHASIL!* ✨\n\nJawaban kamu benar!\n\n🧩 *Jawaban:* ${json.jawaban}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakgame[m.chat][2]);
            delete sock.tebakgame[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakgame = sock.tebakgame || {};
        if (m.chat in sock.tebakgame) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebakgame');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal Tebak Game." }, { quoted: m });

            const json = res.data;

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Tebak Game Answer:')} ${chalk.white.bold(json.jawaban)} ${chalk.cyan(`[Group: ${m.chat}]`)}`);

            let caption = `
🎮 *GAME TEBAK GAME*

Tebak gambar dari game apakah ini?
⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* 100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { 
                image: { url: json.img },
                caption: caption 
            }, { quoted: m });

            sock.tebakgame[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakgame[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawaban yang benar adalah: *${json.jawaban}*` 
                        }, { quoted: sock.tebakgame[m.chat][0] });
                        delete sock.tebakgame[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Game:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis saat mengambil soal game." }, { quoted: m });
        }
    }
};
