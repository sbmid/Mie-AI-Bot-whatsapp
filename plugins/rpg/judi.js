module.exports = {
    command: ["casino", "judi", "slot"],
    handler: async (sock, m, { args, prefix: usedPrefix, command }) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);
        
        let count = args[0];

        if (!count) return sock.sendMessage(sender, { text: `Penggunaan: ${usedPrefix+command} <jumlah>\nContoh: ${usedPrefix+command} 1000` }, { quoted: m });
        
        if (count === 'all') count = user.balance;
        count = parseInt(count);

        if (isNaN(count)) return sock.sendMessage(sender, { text: 'Jumlah harus berupa angka!' }, { quoted: m });
        if (user.balance < count) return sock.sendMessage(sender, { text: `Tidak cukup uang!\n- Saldo: ${user.balance}` }, { quoted: m });
        if (count < 100) return sock.sendMessage(sender, { text: 'Minimal taruhan 100 perak.' }, { quoted: m });

        let menang = Math.random() < 0.45; // 45% win rate

        if (menang) {
            let hadiah = count; 
            user.balance += hadiah;
            sock.sendMessage(sender, { text: `*JACKPOT 🎉* 
            
- 💬 Kamu menang Rp ${hadiah}
- 💰 Saldo sekarang: ${user.balance}` }, { quoted: m });
        } else {
            user.balance -= count;
            sock.sendMessage(sender, { text: `*RUNGKAD 📉* 
- 💬 Kamu kalah Rp ${count}
- 💰 Saldo sekarang: ${user.balance}` }, { quoted: m });
        }
    }
};
