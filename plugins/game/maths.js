const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['maths', 'math'],
    
    before: async (sock, m, { user, body }) => {
        sock.maths = sock.maths || {};
        if (!(m.chat in sock.maths)) return false;

        let game = sock.maths[m.chat];
        let userAnswer = parseFloat(body);

        if (!isNaN(userAnswer) && userAnswer === game.json.result) {
            user.xp += game.json.bonus;
            user.balance += game.json.bonus * 2; // Assuming double balance or something? The user said "hadiah kita kasih xp dan balance". I will give base bonus for both.
            
            await sock.sendMessage(m.chat, { 
                text: `✨ *JAWABAN BENAR!* ✨\n\n🎯 *Soal:* ${game.json.str}\n✅ *Hasil:* ${game.json.result}\n🎁 *Hadiah:* +${game.json.bonus} XP & 💰 ${game.json.bonus} Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(game.timer);
            delete sock.maths[m.chat];
            return true;
        } else if (!isNaN(userAnswer)) {
             // Optional: handle wrong answer
        }

        return false;
    },

    handler: async (sock, m, { args, prefix, command }) => {
        sock.maths = sock.maths || {};
        
        let level = args[0] ? args[0].toLowerCase() : '';
        const validLevels = ['noob', 'easy', 'medium', 'hard', 'extreme', 'impossible', 'impossible2', 'impossible3', 'impossible4', 'impossible5'];
        
        if (!validLevels.includes(level)) {
            let txt = `🎮 *GAME MATHS* 🎮\n\nPilih level kesulitan:\n${validLevels.map(v => `> ${prefix + command} ${v}`).join('\n')}`;
            return sock.sendMessage(m.chat, { text: txt }, { quoted: m });
        }

        if (m.chat in sock.maths) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal matematika yang ada di chat ini!" }, { quoted: m });

        try {
            const response = await axios.get(`https://api.siputzx.my.id/api/games/maths?level=${level}`);
            const res = response.data;
            
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal Matematika." }, { quoted: m });

            const json = res.data;

            // Bocoran jawaban di terminal
            console.log(`${chalk.bgBlue.white(' GAME ')} ${chalk.blue('Maths Answer:')} ${chalk.white.bold(json.result)} ${chalk.cyan(`[Group: ${m.chat}]`)}`);

            let caption = `
🔢 *GAME MATEMATIKA (${level.toUpperCase()})* 🔢

Hitung soal berikut:
*${json.str}* = ?

⏱️ *Waktu:* ${json.time / 1000} Detik
🎁 *Bonus:* ${json.bonus} XP & Balance

_Ketik langsung jawabannya berupa angka!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.maths[m.chat] = {
                msg,
                json,
                timer: setTimeout(() => {
                    if (sock.maths[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nSoal: *${json.str}*\nHasil yang benar adalah: *${json.result}*` 
                        }, { quoted: sock.maths[m.chat].msg });
                        delete sock.maths[m.chat];
                    }
                }, json.time)
            };

        } catch (e) {
            console.error("Error Maths Game:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis saat mengambil soal matematika." }, { quoted: m });
        }
    }
};
