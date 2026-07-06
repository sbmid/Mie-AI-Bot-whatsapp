const axios = require('axios');
const chalk = require('chalk');

const validSubjects = [
    'bindo', 'tik', 'pkn', 'bing', 'penjas', 
    'pai', 'matematika', 'jawa', 'ips', 'ipa'
];

module.exports = {
    command: ['cerdascermat', 'cc'],
    
    before: async (sock, m, { user, body, prefix }) => {
        sock.cerdascermat = sock.cerdascermat || {};
        if (!(m.chat in sock.cerdascermat)) return false;

        let game = sock.cerdascermat[m.chat];
        let currentSoal = game.soal[game.currentIndex];
        
        let answer = body.toLowerCase().trim();
        // Since we use standard buttons mostly, the user could tap a button 
        // which sends 'A', 'B', etc. or the full text. We'll check if the answer is the key.
        // Wait, standard buttons might send buttonId (which is 'a', 'b', etc.).
        let validOptions = currentSoal.semua_jawaban.map(o => Object.keys(o)[0]);
        let correctLetter = currentSoal.jawaban_benar.toLowerCase();
        
        // Let's also allow answering with the text? Usually A, B, C, D is enough.
        if (validOptions.includes(answer)) {
            if (answer === correctLetter) {
                user.xp += 200;
                user.balance += 500;
                
                await sock.sendMessage(m.chat, { 
                    text: `✅ ${m.pushName || 'Player'} menjawab BENAR! (Jawaban: ${correctLetter.toUpperCase()})\n🎁 *Hadiah:* +200 XP & 💰 500 Balance` 
                }, { quoted: m });

                game.currentIndex++;
                
                if (game.currentIndex >= game.soal.length) {
                    await sock.sendMessage(m.chat, { text: `🎉 *Cerdas Cermat Selesai!* Semua soal telah terjawab.` }, { quoted: m });
                    clearTimeout(game.timer);
                    delete sock.cerdascermat[m.chat];
                    return true;
                } else {
                    // There are more questions, let's send the next one
                    await sendNextQuestion(sock, m.chat, game);
                    return true;
                }
            } else {
                // If they answer incorrectly, maybe we don't end the game immediately, they can try again or someone else can.
                // It says "kalok soalnya berhasil terjawab maka akan di kasih soal selanjutnya"
                // No penalty specified, so we just ignore or tell them wrong? 
                // In usual bot games, wrong answer isn't immediately failed, or maybe just tell them it's wrong if we want.
                // Because we use buttons, we can just let it wait until someone gets it right. 
               // Actually we should probably tell them "Salah". 
            }
        }

        return false;
    },

    handler: async (sock, m, { args, prefix, command }) => {
        sock.cerdascermat = sock.cerdascermat || {};
        
        let subject = args[0] ? args[0].toLowerCase() : '';
        
        if (!validSubjects.includes(subject)) {
            let txt = `🎓 *GAME CERDAS CERMAT* 🎓\n\nPilih mata pelajaran:\n${validSubjects.map(v => `> ${prefix + command} ${v}`).join('\n')}`;
            return sock.sendMessage(m.chat, { text: txt }, { quoted: m });
        }

        if (m.chat in sock.cerdascermat) return sock.sendMessage(m.chat, { text: "Selesaikan dulu Cerdas Cermat yang masih berlangsung!" }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { text: `⏳ *Mengambil soal ${subject.toUpperCase()}...*` }, { quoted: m });
            // Ambil 5 soal sekaligus agar permainannya asik
            const response = await axios.get(`https://api.siputzx.my.id/api/games/cc-sd?matapelajaran=${subject}&jumlahsoal=5`);
            const res = response.data;
            
            if (!res.status || !res.data || !res.data.soal) return sock.sendMessage(m.chat, { text: "Gagal mengambil soal Cerdas Cermat." }, { quoted: m });

            sock.cerdascermat[m.chat] = {
                soal: res.data.soal,
                currentIndex: 0,
                subject: subject
            };
            
            await sendNextQuestion(sock, m.chat, sock.cerdascermat[m.chat]);

        } catch (e) {
            console.error("Error Cerdas Cermat Game:", e);
            sock.sendMessage(m.chat, { text: "Terjadi kesalahan teknis saat mengambil soal." }, { quoted: m });
            if (sock.cerdascermat[m.chat]) delete sock.cerdascermat[m.chat];
        }
    }
};

async function sendNextQuestion(sock, chatId, game) {
    let currentSoal = game.soal[game.currentIndex];
    
    // Bocoran di terminal
    console.log(`${chalk.bgMagenta.white(' GAME ')} ${chalk.magenta('Cerdas Cermat Answer:')} ${chalk.white.bold(currentSoal.jawaban_benar)} ${chalk.cyan(`[Group: ${chatId}]`)}`);
    
    // Generate buttons untuk Native Flow Interactive Message (Bisa lebih dari 3 tombol)
    let allOptions = currentSoal.semua_jawaban;
    let interactiveButtons = [];
    let optionsText = [];
    
    allOptions.forEach((opt) => {
        let key = Object.keys(opt)[0];
        let val = opt[key];
        optionsText.push(`${key.toUpperCase()}. ${val}`);
        
        interactiveButtons.push({
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: key.toUpperCase(),
                id: key
            })
        });
    });

    let questionNum = game.currentIndex + 1;
    let totalSoal = game.soal.length;
    let caption = `🎓 *CERDAS CERMAT (${game.subject.toUpperCase()})* 🎓\n_Soal Ke ${questionNum} dari ${totalSoal}_\n\n${currentSoal.pertanyaan}\n\n${optionsText.join('\n')}`;

    const interactivePayload = {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: {
                    body: { text: caption },
                    footer: { text: "🕹️ Game Cerdas Cermat" },
                    nativeFlowMessage: {
                        buttons: interactiveButtons
                    }
                }
            }
        }
    };
    
    try {
        game.lastMsg = await sock.relayMessage(chatId, interactivePayload.viewOnceMessage.message, {});
    } catch (e) {
        // Fallback to plain text if relaying interactive component somehow fails
        game.lastMsg = await sock.sendMessage(chatId, { text: caption });
    }

    // Timer reset every time a question is sent (10 minutes)
    if (game.timer) clearTimeout(game.timer);
    
    game.timer = setTimeout(() => {
        if (sock.cerdascermat[chatId]) {
            sock.sendMessage(chatId, { 
                text: `⏱️ *WAKTU HABIS (10 Menit)!*\n\nGame Cerdas Cermat dihentikan karena tidak ada aktivitas.` 
            });
            delete sock.cerdascermat[chatId];
        }
    }, 10 * 60 * 1000); // 10 minutes
}
