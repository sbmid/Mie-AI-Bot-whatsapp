const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['tebakkartun', 'tkartun'],
    
    before: async (sock, m, { user, body }) => {
        sock.tebakkartun = sock.tebakkartun || {};
        
        if (!(m.chat in sock.tebakkartun)) return false;

        let json = sock.tebakkartun[m.chat][1]; 
        
        if (body.toLowerCase() === json.name.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            
            await sock.sendMessage(m.chat, { 
                text: `✨ *TEBAKAN JITU!* ✨\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🧩 *Kartun:* ${json.name}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakkartun[m.chat][2]);
            delete sock.tebakkartun[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakkartun = sock.tebakkartun || {};

        if (m.chat in sock.tebakkartun) {
            return sock.sendMessage(m.chat, { 
                text: "Selesaikan dulu tebakan kartun yang ada!" 
            }, { quoted: sock.tebakkartun[m.chat][0] });
        }

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/tebakkartun');
            const res = response.data;

            if (!res.status) {
                return sock.sendMessage(m.chat, { text: "Gagal mengambil soal kartun." }, { quoted: m });
            }

            const json = res.data; 

            console.log(`${chalk.bgBlue.white(' GAME ')} ${chalk.blue('Tebak Kartun Answer:')} ${chalk.white.bold(json.name)}`);

            const imageBuffer = await axios.get(json.img, { responseType: 'arraybuffer' }).then(res => res.data);

            let caption = `
🎮 *GAME TEBAK KARTUN*

🧩 Siapakah nama karakter kartun pada gambar di atas?

⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { 
                image: imageBuffer, 
                caption: caption 
            }, { quoted: m });

            sock.tebakkartun[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakkartun[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nKarakter tersebut adalah: *${json.name}*` 
                        }, { quoted: sock.tebakkartun[m.chat][0] });
                        delete sock.tebakkartun[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak Kartun:", e.message);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan koneksi saat mengambil gambar." }, { quoted: m });
        }
    }
};