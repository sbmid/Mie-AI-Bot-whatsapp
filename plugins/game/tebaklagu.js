const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['tebaklagu', 'tlagu'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebaklagu = sock.tebaklagu || {};
        if (!(m.chat in sock.tebaklagu)) return false;

        let json = sock.tebaklagu[m.chat][1]; 
        
        if (body.toLowerCase() === json.judul.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            
            await sock.sendMessage(m.chat, { 
                text: `✨ *TEBAK LAGU BERHASIL!* ✨\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🎵 *Judul:* ${json.judul}\n👤 *Artis:* ${json.artis}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebaklagu[m.chat][2]);
            delete sock.tebaklagu[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebaklagu = sock.tebaklagu || {};

        if (m.chat in sock.tebaklagu) {
            return sock.sendMessage(m.chat, { 
                text: "Masih ada lagu yang belum tertebak! Selesaikan dulu ya." 
            }, { quoted: sock.tebaklagu[m.chat][0] });
        }

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebaklagu');
            const res = response.data;

            if (!res.status) {
                return sock.sendMessage(m.chat, { text: "Gagal mengambil soal lagu." }, { quoted: m });
            }

            const json = res.data; 

            console.log(`${chalk.bgRed.white(' GAME ')} ${chalk.red('Tebak Lagu Answer:')} ${chalk.white.bold(json.judul)} ${chalk.gray(`(${json.artis})`)}`);

            const audioBuffer = await axios.get(json.lagu, { responseType: 'arraybuffer' }).then(res => res.data);

            let caption = `
🎮 *GAME TEBAK LAGU*

🧩 Dengarkan potongan lagu ini dan tebak judulnya!

⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik judul lagu langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { 
                audio: audioBuffer, 
                mimetype: 'audio/mp4', 
                ptt: true,
                caption: caption // Beberapa versi WA mendukung caption di audio
            }, { quoted: m });

            await sock.sendMessage(m.chat, { text: caption }, { quoted: msg });

            sock.tebaklagu[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebaklagu[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJudul lagunya adalah: *${json.judul}*\nArtis: *${json.artis}*` 
                        }, { quoted: sock.tebaklagu[m.chat][0] });
                        delete sock.tebaklagu[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Lagu:", e.message);
            sock.sendMessage(m.chat, { text: "❌ Terjadi masalah saat mendownload lagu. Coba lagi ya!" }, { quoted: m });
        }
    }
};