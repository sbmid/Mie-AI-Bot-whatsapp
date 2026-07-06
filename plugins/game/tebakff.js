const axios = require('axios');
const chalk = require('chalk');
const db = require('../../lib/database'); // Import database langsung di sini agar aman

module.exports = {
    command: ['tebakff', 'karakterff'],
    
    before: async (sock, m, { body }) => {
        sock.tebakff = sock.tebakff || {};
        if (!(m.chat in sock.tebakff)) return false;

        let json = sock.tebakff[m.chat][1]; 
        
        if (body.toLowerCase() === json.name.toLowerCase()) {
            const user = db.getUser(m.sender);
            user.xp += 100;
            user.balance += 500;
            
            const data = db.read();
            data.users[m.sender] = user;
            db.write(data);

            await sock.sendMessage(m.chat, { 
                text: `🔥 *BOOYAH!* 🔥\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🧩 *Karakter:* ${json.name}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.tebakff[m.chat][2]);
            delete sock.tebakff[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.tebakff = sock.tebakff || {};
        if (m.chat in sock.tebakff) return sock.sendMessage(m.chat, { text: "Masih ada soal yang aktif!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/karakter-freefire');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "API Down!" }, { quoted: m });

            const json = res.data; 

            const imageBuffer = await axios.get(json.gambar, { responseType: 'arraybuffer' }).then(res => res.data);

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Tebak FF Answer:')} ${chalk.white.bold(json.name)}`);

            let caption = `🎮 *TEBAK KARAKTER FF*\n\nSiapakah nama karakter di atas?\n\n⏱️ *Waktu:* 60 Detik\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`.trim();

            let msg = await sock.sendMessage(m.chat, { 
                image: imageBuffer, 
                caption: caption 
            }, { quoted: m });

            sock.tebakff[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.tebakff[m.chat]) {
                        sock.sendMessage(m.chat, { text: `⏱️ Waktu habis! Jawabannya: *${json.name}*` }, { quoted: sock.tebakff[m.chat][0] });
                        delete sock.tebakff[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Tebak FF:", e.message);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan sistem." }, { quoted: m });
        }
    }
};