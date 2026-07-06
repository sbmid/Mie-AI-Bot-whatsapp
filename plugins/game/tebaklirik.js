const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['tebaklirik', 'tlirik'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebaklirik = sock.tebaklirik || {};
        
        if (!(m.chat in sock.tebaklirik)) return false;

        let json = sock.tebaklirik[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            
            await sock.sendMessage(m.chat, { 
                text: `🎤 *KARAOKE MASTER!* ✨\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🧩 *Lirik Lengkap:* ${json.soal.replace('_____', `*${json.jawaban.toUpperCase()}*`)}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebaklirik[m.chat][2]);
            delete sock.tebaklirik[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebaklirik = sock.tebaklirik || {};

        if (m.chat in sock.tebaklirik) {
            return sock.sendMessage(m.chat, { 
                text: "Masih ada lirik yang belum tertebak! Selesaikan dulu yuk." 
            }, { quoted: sock.tebaklirik[m.chat][0] });
        }

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebaklirik');
            const res = response.data;

            if (!res.status) {
                return sock.sendMessage(m.chat, { text: "Gagal mengambil soal lirik." }, { quoted: m });
            }

            const json = res.data; 

            // LOG JAWABAN KE TERMINAL
            console.log(`${chalk.bgMagenta.black(' GAME ')} ${chalk.magenta('Tebak Lirik Answer:')} ${chalk.white.bold(json.jawaban)}`);

            let caption = `
🎮 *GAME TEBAK LIKRIK*

🧩 *Lirik:*
"${json.soal}"

_Lengkapi bagian yang kosong di atas!_

⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.tebaklirik[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebaklirik[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nLirik yang benar adalah: *${json.jawaban}*` 
                        }, { quoted: sock.tebaklirik[m.chat][0] });
                        delete sock.tebaklirik[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Lirik:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan pada server API." }, { quoted: m });
        }
    }
};