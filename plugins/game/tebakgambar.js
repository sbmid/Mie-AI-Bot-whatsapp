const axios = require('axios');
const chalk = require('chalk'); 

module.exports = {
    command: ['tebakgambar', 'tgambar'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebakgambar = sock.tebakgambar || {};
        if (!(m.chat in sock.tebakgambar)) return false;

        let json = sock.tebakgambar[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            await sock.sendMessage(m.chat, { 
                text: `✨ *TEBAK GAMBAR BERHASIL!* ✨\n\nJawaban kamu benar!\n\n🧩 *Jawaban:* ${json.jawaban}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakgambar[m.chat][2]);
            delete sock.tebakgambar[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakgambar = sock.tebakgambar || {};
        if (m.chat in sock.tebakgambar) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebakgambar');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal Tebak Gambar." }, { quoted: m });

            const json = res.data;

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Tebak Gambar Answer:')} ${chalk.white.bold(json.jawaban)} ${chalk.cyan(`[Group: ${m.chat}]`)}`);

            let caption = `
🎮 *GAME TEBAK GAMBAR*

Rangkai kata dari gambar berikut ini!
💡 *Petunjuk:* ${json.deskripsi}
⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* 100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { 
                image: { url: json.img },
                caption: caption 
            }, { quoted: m });

            sock.tebakgambar[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakgambar[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawaban yang benar adalah: *${json.jawaban}*` 
                        }, { quoted: sock.tebakgambar[m.chat][0] });
                        delete sock.tebakgambar[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Gambar:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis saat mengambil soal tebak gambar." }, { quoted: m });
        }
    }
};
