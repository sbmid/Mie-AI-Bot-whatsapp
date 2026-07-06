const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['tebakwarna', 'ishihara'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebakwarna = sock.tebakwarna || {};
        if (!(m.chat in sock.tebakwarna)) return false;

        let json = sock.tebakwarna[m.chat][1]; 
        if (body.trim() === json.correct) {
            user.xp += 100;
            user.balance += 500; 
            await sock.sendMessage(m.chat, { 
                text: `✨ *MATA KAMU TAJAM!* ✨\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🧩 *Angka:* ${json.correct}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakwarna[m.chat][2]);
            delete sock.tebakwarna[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakwarna = sock.tebakwarna || {};
        if (m.chat in sock.tebakwarna) return sock.sendMessage(m.chat, { text: "Selesaikan dulu tes yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebakwarna');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil data." }, { quoted: m });

            const json = res.data; 

            const imageBuffer = await axios.get(json.image, { responseType: 'arraybuffer' }).then(res => res.data);

            console.log(`${chalk.bgGreen.black(' GAME ')} ${chalk.green('Tebak Warna Answer:')} ${chalk.white.bold(json.correct)}`);

            let caption = `
🎮 *TES BUTA WARNA (ISHIHARA)*

🧩 *Soal:* Angka berapakah yang ada di dalam gambar tersebut?

⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik angka langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { 
                image: imageBuffer, 
                caption: caption 
            }, { quoted: m });

            sock.tebakwarna[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakwarna[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nAngka pada gambar tersebut adalah: *${json.correct}*` 
                        }, { quoted: sock.tebakwarna[m.chat][0] });
                        delete sock.tebakwarna[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Warna:", e.message);
            sock.sendMessage(m.chat, { 
                text: "❌ Terjadi masalah koneksi saat mendownload gambar. Coba lagi ya!" 
            }, { quoted: m });
        }
    }
};