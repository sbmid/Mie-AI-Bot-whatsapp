const axios = require('axios');
const chalk = require('chalk'); 
module.exports = {
    command: ['family100'],
    category: ['game'],
    
    before: async (sock, m, { user, body }) => {
        sock.family100 = sock.family100 || {};
        if (!(m.chat in sock.family100)) return false;

        let room = sock.family100[m.chat];
        let json = room[1]; 
        
        let idx = json.jawaban.findIndex(v => v.toLowerCase() === body.toLowerCase());
        
        if (idx !== -1 && !json.terjawab.includes(idx)) {
            json.terjawab.push(idx);
            user.xp += 100;
            user.balance += 500;
            
            let isWin = json.terjawab.length >= json.jawaban.length;
            
            let board = json.jawaban.map((v, i) => {
                return json.terjawab.includes(i) ? `[ ${i + 1} ] ${v}` : `[ ${i + 1} ] ${'-'.repeat(v.length)}`;
            }).join('\n');
            
            let text = `✨ *JAWABAN BENAR!* ✨\n\n${board}\n\n🎁 *Hadiah:* +100 XP & 💰 500 Balance / Kata`;
            if (isWin) {
                text += `\n\n🎉 *SEMUA JAWABAN TELAH DITEMUKAN!*`;
                clearTimeout(room[2]);
                delete sock.family100[m.chat];
            }
            
            await sock.sendMessage(m.chat, { 
                text: text,
                mentions: [m.sender]
            }, { quoted: m });

            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.family100 = sock.family100 || {};
        if (m.chat in sock.family100) return sock.sendMessage(m.chat, { text: "Selesaikan dulu soal yang ada!" }, { quoted: m });

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/family100');
            const res = response.data;
            if (!res.status) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal." }, { quoted: m });

            const json = res.data;
            json.terjawab = []; // Add tracking

            console.log(`${chalk.bgYellow.black(' GAME ')} ${chalk.yellow('Family 100 Answer:')} ${chalk.white.bold(json.jawaban.join(', '))} ${chalk.cyan(`[Group: ${m.chat}]`)}`);
            
            let board = json.jawaban.map((v, i) => `[ ${i + 1} ] ${'-'.repeat(v.length)}`).join('\n');

            let caption = `
🎮 *GAME FAMILY 100*

🧩 *Soal:* ${json.soal}
📋 *Tertutup:* ${json.jawaban.length} kolom
⏱️ *Waktu:* 90 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance / Kata

${board}

_Ketik jawaban langsung tanpa prefix! (Boleh langsung tebak salah satu kata)_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.family100[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.family100[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawaban yang benar adalah:\n${json.jawaban.map((v, i) => `[ ${i + 1} ] ${v}`).join('\n')}` 
                        }, { quoted: sock.family100[m.chat][0] });
                        delete sock.family100[m.chat];
                    }
                }, 90000)
            ];

        } catch (e) {
            console.error("Error Family 100:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis." }, { quoted: m });
        }
    }
};
