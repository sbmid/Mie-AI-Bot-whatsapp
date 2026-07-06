const axios = require('axios');
const chalk = require('chalk');

module.exports = {
    command: ['siapakahaku', 'whoami'],
    
    before: async (sock, m, { user, body }) => {
        sock.siapakahaku = sock.siapakahaku || {};
        if (!(m.chat in sock.siapakahaku)) return false;

        let json = sock.siapakahaku[m.chat][1]; 
        
        if (body.toLowerCase() === json.jawaban.toLowerCase()) {
            user.xp += 100;
            user.balance += 500;
            
            await sock.sendMessage(m.chat, { 
                text: `✨ *SIAPA AKU? TERJAWAB!* ✨\n\nSelamat *@${m.sender.split('@')[0]}*, jawaban kamu benar!\n\n🧩 *Jawaban:* ${json.jawaban}\n🎁 *Hadiah:* +100 XP & 💰 500 Balance`,
                mentions: [m.sender]
            }, { quoted: m });

            clearTimeout(sock.siapakahaku[m.chat][2]);
            delete sock.siapakahaku[m.chat];
            return true;
        }
        return false;
    },

    handler: async (sock, m) => {
        sock.siapakahaku = sock.siapakahaku || {};

        if (m.chat in sock.siapakahaku) {
            return sock.sendMessage(m.chat, { 
                text: "Masih ada soal yang belum terjawab! Selesaikan dulu ya." 
            }, { quoted: sock.siapakahaku[m.chat][0] });
        }

        try {
            const response = await axios.get('https://api.siputzx.my.id/api/games/siapakahaku');
            const res = response.data;
            if (!res.status) {
                return sock.sendMessage(m.chat, { text: "Gagal mengambil soal. Coba lagi nanti." }, { quoted: m });
            }

            // PERBAIKAN: Langsung ambil res.data
            const json = res.data; 

            // LOG JAWABAN KE TERMINAL
            console.log(`${chalk.bgCyan.black(' GAME ')} ${chalk.cyan('Siapakah Aku Answer:')} ${chalk.white.bold(json.jawaban)}`);

            let caption = `
🎮 *GAME SIAPAKAH AKU*

🧩 *Soal:* "${json.soal}"

⏱️ *Waktu:* 60 Detik
🎁 *Hadiah:* +100 XP & 💰 500 Balance

_Ketik jawaban langsung tanpa prefix!_
            `.trim();

            let msg = await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

            sock.siapakahaku[m.chat] = [
                msg,
                json,
                setTimeout(() => {
                    if (sock.siapakahaku[m.chat]) {
                        sock.sendMessage(m.chat, { 
                            text: `⏱️ *WAKTU HABIS!*\n\nJawabannya adalah: *${json.jawaban}*` 
                        }, { quoted: sock.siapakahaku[m.chat][0] });
                        delete sock.siapakahaku[m.chat];
                    }
                }, 60000)
            ];

        } catch (e) {
            console.error("Error Siapakah Aku:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan saat menghubungi API." }, { quoted: m });
        }
    }
};