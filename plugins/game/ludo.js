const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { proto, generateWAMessageFromContent, generateWAMessage } = require('@whiskeysockets/baileys');
const Jimp = require('jimp');

module.exports = {
    command: ['ludo', 'ludoking'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat || m.key.remoteJid;
        const sender = m.sender || m.key.participant || m.key.remoteJid;

        global.ludoDB = global.ludoDB || {};

        const args = text ? text.trim().split(/\s+/) : [];
        const actionArg = args[0] ? args[0].toLowerCase() : '';

        const checkTurn = (session, state) => {
            const currentPlayerIndex = state.turn;
            const currentPlayerId = session.players[currentPlayerIndex];
            return sender === currentPlayerId;
        };

        // Fungsi Helper untuk mengirim state Ludo (Gambar Board + Tombol)
        const sendLudoState = async (data, session) => {
            const state = data.Result.state;
            const images = data.Result.images;

            const boardUrl = images.uguu || images.litterbox || images.telegraph;
            let caption = `🎲 *LUDO KING* 🎲\n\n`;

            // Proses History Baru (Makan Pion & Lempar Dadu)
            let rewardMsg = "";
            const newHistory = state.history.slice(session.historyLength || 0);
            session.historyLength = state.history.length;

            for (let h of newHistory) {
                // Deteksi lempar dadu dari history
                const diceMatch = h.match(/melempar dadu:\s*(\d)/i);
                if (diceMatch) {
                    const rolledDice = diceMatch[1];
                    const stickerPath = path.join(process.cwd(), 'assets', `${rolledDice}.webp`);
                    if (fs.existsSync(stickerPath)) {
                        await sock.sendMessage(from, { sticker: fs.readFileSync(stickerPath) });
                    }
                }

                // Deteksi kata makan/memakan/menendang/tendang
                if (/(memakan|makan|tendang|menendang)/i.test(h) && !/(dimakan|ditendang)/i.test(h)) {
                    const match = h.match(/Pemain (\d+)/i);
                    if (match) {
                        const pIdx = parseInt(match[1]) - 1;
                        if (session.players[pIdx]) {
                            const pJid = session.players[pIdx];
                            if (global.db.data.users[pJid]) {
                                global.db.data.users[pJid].balance += 100;
                                global.db.data.users[pJid].xp += 100;
                                rewardMsg += `\n🎉 @${pJid.split('@')[0]} dapat +100 Balance & XP karena makan pion lawan! ⚔️`;
                            }
                        }
                    }
                }
            }

            // Tampilkan list player
            const colors = ['🔴 Merah', '🟢 Hijau', '🟡 Kuning', '🔵 Biru'];
            caption += `👥 *Pemain:*\n`;
            session.players.forEach((p, idx) => {
                const pNumber = sock.user.id.includes(p.split('@')[0]) ? "Bot" : `@${p.split('@')[0]}`;
                caption += `${idx + 1}. ${pNumber} (${colors[idx]})\n`;
            });

            // Guard: pastikan turn player valid sebelum akses
            const turnPlayer = session.players[state.turn];
            caption += `\n🔄 *Giliran:* Pemain ${state.turn + 1}${turnPlayer ? ` (@${turnPlayer.split('@')[0]})` : ''}\n`;
            if (state.dice) caption += `🎲 *Dadu:* ${state.dice}\n`;

            if (rewardMsg) caption += rewardMsg + `\n`;

            caption += `\n📝 *Riwayat Terakhir:*\n`;
            const recentHistory = state.history.slice(-3);
            recentHistory.forEach(h => caption += `- ${h}\n`);

            if (state.isGameOver) {
                let winnerJid = null;
                const wMatch = (state.winner || "").match(/Pemain (\d+)/i);
                if (wMatch && session.players[parseInt(wMatch[1]) - 1]) {
                    winnerJid = session.players[parseInt(wMatch[1]) - 1];
                }

                if (winnerJid && global.db.data.users[winnerJid]) {
                    global.db.data.users[winnerJid].balance += 1000;
                    global.db.data.users[winnerJid].xp += 1000;
                    caption += `\n🎉 *PERMAINAN SELESAI!* 🎉\n🏆 Pemenang: @${winnerJid.split('@')[0]}\n🎁 Hadiah Win: +1000 Balance & XP!`;
                } else {
                    caption += `\n🎉 *PERMAINAN SELESAI!* 🎉\n🏆 Pemenang: ${state.winner || 'Tidak diketahui'}`;
                }
                delete global.ludoDB[from];
            }

            let buttons = [];

            if (!state.isGameOver) {
                if (state.status === 'WAITING_ROLL') {
                    buttons.push({
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: "🎲 Roll Dadu",
                            id: `${prefix}${command} roll`
                        })
                    });
                } else if (state.status === 'WAITING_MOVE') {
                    if (state.validMoves && state.validMoves.length > 0) {
                        state.validMoves.forEach(mIdx => {
                            const tokenNum = parseInt(mIdx) + 1;
                            buttons.push({
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: `🟢 Pindah Bidak ${tokenNum}`,
                                    id: `${prefix}${command} move ${tokenNum}`
                                })
                            });
                        });
                    }
                }

                buttons.push({
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🛑 Nyerah / Quit",
                        id: `${prefix}${command} quit`
                    })
                });
            }

            caption += `\n\n_💡 Hanya pemain yang sedang giliran yang bisa memencet tombol. Orang iseng auto ditolak!_`;

            try {
                if (buttons.length > 0) {
                    const interactiveMsg = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    contextInfo: proto.ContextInfo.create({
                                        // filter(Boolean) mencegah crash jika turn out-of-range
                                        mentionedJid: [session.players[state.turn]].filter(Boolean)
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.create({ text: caption }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({ text: "Ludo King • Mie AI" }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        title: "", subtitle: "", hasMediaAttachment: true,
                                        imageMessage: await (async () => {
                                            const mediaRes = await axios.get(boardUrl, { responseType: 'arraybuffer' });
                                            const msg = await generateWAMessage(from, { image: Buffer.from(mediaRes.data) }, { upload: sock.waUploadToServer });
                                            return msg.message.imageMessage;
                                        })()
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttons })
                                })
                            }
                        }
                    }, { userJid: sock.user.id });

                    // Gunakan mentions agar tag berjalan di caption
                    await sock.relayMessage(from, interactiveMsg.message, { messageId: interactiveMsg.key.id, additionalNodes: [] });
                    // Untuk mentions kita perlu memastikan mereka kena tag. Karena relayMessage kurang praktis, fallback tag ke text biasa nggak perlu.
                    // Baileys v6+ support contextInfo di interactiveMessage tapi ribet, biarkan teks raw dulu.
                } else {
                    await sock.sendMessage(from, { image: { url: boardUrl }, caption: caption, mentions: session.players }, { quoted: m });
                }
            } catch (err) {
                console.error("Gagal mengirim Interactive Message Ludo:", err);
                await sock.sendMessage(from, { image: { url: boardUrl }, caption: caption, mentions: session.players }, { quoted: m });
            }
        };

        try {
            // ROUTING AWAL TANPA ARGUMEN (TUTORIAL & MENU LIST)
            if (!actionArg) {
                const tutorialText = [
                    `🎲 *LUDO KING — Mie AI* 🎲`,
                    ``,
                    `Ajak teman main Ludo di grup ini!`,
                    `Maksimal *4 pemain*, 1 grup = 1 room eksklusif.`,
                    ``,
                    `━━━━━`,
                    `📖 *CARA BERMAIN*`,
                    `━━━━━`,
                    ``,
                    `1️⃣  Tekan *Join* untuk masuk lobi.`,
                    `2️⃣  Minimal *2 pemain* untuk mulai.`,
                    `3️⃣  Tekan *Start* jika semua sudah siap.`,
                    `4️⃣  Ikuti giliran & lempar dadu!`,
                    ``,
                    `━━━━━`,
                    `⚠️ *ATURAN*`,
                    `━━━━━`,
                    ``,
                    `• Tombol *hanya merespon* pemain yang gilirannya.`,
                    `• Makan pion lawan → *+100 Balance & XP* ⚔️`,
                    `• Menang → *+1000 Balance & XP* 🏆`,
                    ``,
                    `Pilih menu di bawah untuk mulai! 👇`
                ].join('\n');

                // --- Buat header: coba load & kompres gambar ludo mie.png ---
                let menuHeader;
                try {
                    const ludoImgPath = path.join(process.cwd(), 'assets', 'ludo mie.png');
                    // Baca dan kompres gambar dengan jimp: resize + JPEG quality 60
                    const jimpImg = await Jimp.read(ludoImgPath);
                    jimpImg.resize(800, Jimp.AUTO); // max lebar 800px
                    const compressedBuffer = await jimpImg.quality(60).getBufferAsync(Jimp.MIME_JPEG);
                    // generateWAMessage dari baileys (bukan sock.generateWAMessage)
                    const headerImgMsg = await generateWAMessage(from, { image: compressedBuffer }, { upload: sock.waUploadToServer });
                    menuHeader = proto.Message.InteractiveMessage.Header.create({
                        title: "", subtitle: "", hasMediaAttachment: true,
                        imageMessage: headerImgMsg.message.imageMessage
                    });
                } catch (_imgErr) {
                    console.error('[LUDO] Gagal load ludo mie.png:', _imgErr.message);
                    // Fallback jika gambar gagal dimuat
                    menuHeader = proto.Message.InteractiveMessage.Header.create({
                        title: "🎲 LUDO KING", subtitle: "", hasMediaAttachment: false
                    });
                }

                const interactiveListMsg = generateWAMessageFromContent(from, {
                    viewOnceMessage: {
                        message: {
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({ text: " " }),
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: tutorialText }),
                                header: menuHeader,
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: [
                                        {
                                            name: "single_select",
                                            buttonParamsJson: JSON.stringify({
                                                title: "Buka Menu Ludo King👑",
                                                sections: [
                                                    {
                                                        title: "Lobby Ludo",
                                                        rows: [
                                                            { title: "🎮 Join Game", description: "Ikut masuk ke lobi ludo", id: `${prefix}${command} join` },
                                                            { title: "🚀 Start Game", description: "Mulai permainan sekarang!", id: `${prefix}${command} start` },
                                                            { title: "🛑 Quit Game", description: "Berhenti dan reset room", id: `${prefix}${command} quit` }
                                                        ]
                                                    }
                                                ]
                                            })
                                        }
                                    ]
                                })
                            })
                        }
                    }
                }, { userJid: sock.user.id });

                return sock.relayMessage(from, interactiveListMsg.message, { messageId: interactiveListMsg.key.id });
            }

            // JOIN LOBBY
            if (actionArg === 'join') {
                if (!global.ludoDB[from]) {
                    global.ludoDB[from] = { status: 'lobby', players: [], room_id: null };
                }
                const session = global.ludoDB[from];

                if (session.status === 'playing') {
                    return sock.sendMessage(from, { text: `❌ Game sedang berjalan! Tidak bisa ikut sekarang.` }, { quoted: m });
                }

                if (session.players.includes(sender)) {
                    return sock.sendMessage(from, { text: `⚠️ Kamu sudah terdaftar di lobi, tunggu pemain lain atau klik Start.` }, { quoted: m });
                }

                if (session.players.length >= 4) {
                    return sock.sendMessage(from, { text: `❌ Lobi sudah penuh (Maksimal 4 orang).` }, { quoted: m });
                }

                session.players.push(sender);

                // Tampilkan list semua pemain yang sudah join
                const lobbyColors = ['🔴', '🟢', '🟡', '🔵'];
                let joinMsg = `✅ *@${sender.split('@')[0]}* berhasil bergabung ke Lobi Ludo!\n\n`;
                joinMsg += `👥 *Daftar Pemain (${session.players.length}/4):*\n`;
                session.players.forEach((p, idx) => {
                    joinMsg += `  ${idx + 1}. @${p.split('@')[0]} — ${lobbyColors[idx]}\n`;
                });

                if (session.players.length < 2) {
                    joinMsg += `\n⏳ Butuh minimal *2 pemain* untuk mulai. Ajak teman bergabung!`;
                } else if (session.players.length < 4) {
                    joinMsg += `\n✅ Bisa mulai! Ketik *${prefix}${command} start*, atau tunggu hingga 4 orang.`;
                } else {
                    joinMsg += `\n🎯 Lobi *penuh!* Siap mulai — ketik *${prefix}${command} start*!`;
                }

                return sock.sendMessage(from, { text: joinMsg, mentions: session.players }, { quoted: m });
            }

            // QUIT GAME
            if (actionArg === 'quit' || actionArg === 'stop') {
                if (!global.ludoDB[from]) {
                    return sock.sendMessage(from, { text: `❌ Sedang tidak ada permainan Ludo di obrolan ini.` }, { quoted: m });
                }
                const session = global.ludoDB[from];
                // Boleh quit jika dia admin grup atau dia salah satu pemain
                if (!session.players.includes(sender)) {
                    return sock.sendMessage(from, { text: `❌ Kamu bukan pemain, gak bisa nge-quit game orang lain! 😝` }, { quoted: m });
                }
                delete global.ludoDB[from];
                return sock.sendMessage(from, { text: `✅ Permainan Ludo berhasil dihentikan dan room direset!` }, { quoted: m });
            }

            // START GAME
            if (actionArg === 'start') {
                const session = global.ludoDB[from];
                if (!session || session.status !== 'lobby') {
                    return sock.sendMessage(from, { text: `❌ Tidak ada lobi Ludo yang siap. Ketik *${prefix}${command} join* dulu.` }, { quoted: m });
                }
                if (!session.players.includes(sender)) {
                    return sock.sendMessage(from, { text: `❌ Kamu belum join, masa mau nge-start! 😝` }, { quoted: m });
                }
                if (session.players.length < 2) {
                    return sock.sendMessage(from, { text: `❌ Butuh minimal 2 pemain untuk mulai. Baru ada ${session.players.length} pemain.` }, { quoted: m });
                }

                await sock.sendMessage(from, { text: `🎲 Menyiapkan papan Ludo untuk ${session.players.length} Pemain...` }, { quoted: m });

                const startUrl = `https://v1.sbmku.sbs/api/game/ludo?action=roll&token=1&players=${session.players.length}`;
                const res = await axios.get(startUrl, { validateStatus: () => true });
                const resData = res.data.data || res.data; // Handle API wrapping data

                if (resData && resData.Status === false && resData.message) {
                    return sock.sendMessage(from, { text: `❌ ${resData.message}` }, { quoted: m });
                }

                if (resData && resData.Result && resData.Result.room_id) {
                    session.status = 'playing';
                    session.room_id = resData.Result.room_id;
                    session.current_turn = resData.Result.state.turn; // Inisialisasi giliran pertama
                    await sendLudoState(resData, session);
                } else {
                    throw new Error("Gagal membuat room Ludo dari API.");
                }
                return;
            }

            // ROLL DADU
            if (actionArg === 'roll') {
                const session = global.ludoDB[from];
                if (!session || session.status !== 'playing') {
                    return sock.sendMessage(from, { text: `❌ Tidak ada game Ludo aktif yang sedang dimainkan.` }, { quoted: m });
                }

                // Cek giliran menggunakan cache current_turn
                const expectedPlayer = session.players[session.current_turn];
                if (sender !== expectedPlayer) {
                    return sock.sendMessage(from, { text: `❌ Eits, jangan serobot! Ini giliran Pemain ${session.current_turn + 1}. 😝` }, { quoted: m });
                }

                await sock.sendMessage(from, { react: { text: '🎲', key: m.key } });

                const url = `https://v1.sbmku.sbs/api/game/ludo?action=roll&token=1&players=${session.players.length}&room_id=${session.room_id}`;
                const res = await axios.get(url, { validateStatus: () => true });
                const resData = res.data.data || res.data;

                if (resData && resData.Status === false && resData.message) {
                    return sock.sendMessage(from, { text: `❌ ${resData.message}` }, { quoted: m });
                }

                if (resData && resData.Result) {
                    session.current_turn = resData.Result.state.turn; // Update giliran terbaru
                    await sendLudoState(resData, session);
                } else {
                    throw new Error("Gagal merespon dari API Ludo.");
                }
                return;
            }

            // PENGGERAKAN BIDAK
            if (actionArg === 'move') {
                const session = global.ludoDB[from];
                if (!session || session.status !== 'playing') {
                    return sock.sendMessage(from, { text: `❌ Tidak ada game Ludo aktif yang sedang dimainkan.` }, { quoted: m });
                }

                const expectedPlayer = session.players[session.current_turn];
                if (sender !== expectedPlayer) {
                    return sock.sendMessage(from, { text: `❌ Eits, jangan serobot! Ini giliran Pemain ${session.current_turn + 1}. 😝` }, { quoted: m });
                }

                const moveToken = args[1]; // 1, 2, 3, 4
                if (!moveToken || isNaN(moveToken)) {
                    return sock.sendMessage(from, { text: `❌ Bidak mana yang mau digerakkan?` }, { quoted: m });
                }

                await sock.sendMessage(from, { react: { text: '🟢', key: m.key } });

                const url = `https://v1.sbmku.sbs/api/game/ludo?action=move&token=${moveToken}&players=${session.players.length}&room_id=${session.room_id}`;
                const res = await axios.get(url, { validateStatus: () => true });
                const resData = res.data.data || res.data;

                if (resData && resData.Status === false && resData.message) {
                    return sock.sendMessage(from, { text: `❌ ${resData.message}` }, { quoted: m });
                }

                if (resData && resData.Result) {
                    session.current_turn = resData.Result.state.turn; // Update giliran terbaru
                    await sendLudoState(resData, session);
                } else {
                    throw new Error("Gagal merespon dari API Ludo.");
                }
                return;
            }

        } catch (e) {
            console.error('Ludo Game Error:', e);
            return sock.sendMessage(from, { text: `❌ Terjadi kesalahan pada server game Ludo.` }, { quoted: m });
        }
    }
};
