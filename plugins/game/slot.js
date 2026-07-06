const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const db = require('../../lib/database');

/**
 * MIE AI - Casino Slot Machine (Balance Version)
 * Aura: Accurate & Gacor ✨
 */
module.exports = {
    command: ['slot'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;
        const user = db.getUser(m.sender); 
        const userName = user.name || "Warga Mie AI"; 

        // 1. --- 🎀 SISTEM COOLDOWN ---
        const cooldownTime = 15000; 
        const now = Date.now();
        if (user.lastSlot && (now - user.lastSlot < cooldownTime)) {
            const sisa = cooldownTime - (now - user.lastSlot);
            const detik = Math.ceil(sisa / 1000);
            return sock.sendMessage(from, { 
                text: `🌸 *Sabaaar, ${userName}!* (｡•́︿•̀｡)\n\nTunggu *${detik} detik* lagi ya biar hoki kamu kumpul! ✨🍭` 
            }, { quoted: m });
        }

        // 2. --- 💰 TARUHAN ---
        const bet = 100; 
        if (user.balance < bet) {
            return sock.sendMessage(from, { 
                text: `🌸 *Balance kamu gak cukup, ${userName}...* (｡•́︿•̀｡)\n\n💰 *Saldo:* ${user.balance.toLocaleString()} Balance\n🎟️ *Butuh:* ${bet} Balance` 
                // Mei sudah ganti Rp jadi Balance ya! ✨
            }, { quoted: m });
        }

        // 3. --- 🎰 PROSES ---
        user.lastSlot = now;
        user.balance -= bet;

        const symbols = ['💎', '🍎', '🍒', '🔔', '🍇', '🍋', '🍭'];
        const random = () => symbols[Math.floor(Math.random() * symbols.length)];

        // --- STEP 1: PESAN AWAL ---
        let { key } = await sock.sendMessage(from, { 
            text: `˗ˏˋ 🎰 𝐌𝐄𝐈 𝐒𝐋𝐎𝐓 ˎˊ˗\n\n┃  🔄  ┃  🔄  ┃  🔄  ┃\n\n*Lagi muter... Semoga hoki ya, ${userName}!* ✨🎲` 
        }, { quoted: m });

        await delay(3000); 

        // --- STEP 2: HASIL AKHIR ---
        const a = random();
        const b = random();
        const c = random();
        
        let resultMsg = '';
        let win = false;

        if (a === b && b === c) {
            const hadiah = bet * 15;
            user.balance += hadiah;
            win = true;
            resultMsg = `🎉 *𝐉𝐀𝐂𝐊𝐏𝐎𝐓!* 🎉\n╰┈➤ *Selamat ${userName}, kamu menang ${hadiah.toLocaleString()} Balance!* 💖`;
        } else if (a === b || b === c || a === c) {
            const hadiah = bet * 3;
            user.balance += hadiah;
            win = true;
            resultMsg = `✨ *𝐖𝐈𝐍!* ✨\n╰┈➤ *Lumayan, Mei kasih ${hadiah.toLocaleString()} Balance!* 🍭`;
        } else {
            resultMsg = `☁️ *𝐙𝐎𝐍𝐊...* ☁️\n╰┈➤ *Sabar ya ${userName}, coba tarik lagi!* 🤭💔`;
        }

        const finalFrame = `
˗ˏˋ 🎰 𝐌𝐄𝐈 𝐒𝐋𝐎𝐓 ˎˊ˗

      ┃  ${a}  ┃  ${b}  ┃  ${c}  ┃

${resultMsg}

🌸 *𝐒𝐚𝐥𝐝𝐨 𝐓𝐞𝐫𝐚𝐤𝐡𝐢𝐫:* 💰 ${user.balance.toLocaleString()} Balance
╰┈➤ *Ketik ${prefix + command} buat main lagi!*`.trim();

        await sock.sendMessage(from, { text: finalFrame, edit: key });

        if (win) await sock.sendMessage(from, { react: { text: '🎊', key: m.key } });
    }
};