module.exports = {
    command: ["transfer", "tf", "kirim"],
    handler: async (sock, m, { args, prefix: usedPrefix, command }) => {
        const sender = m.key.remoteJid;
        const senderData = global.db.getUser(sender);
        
        let who = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                  m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!who) return sock.sendMessage(sender, { text: `Tag orang yang mau dikirim uang!\nContoh: ${usedPrefix + command} @tag 1000` }, { quoted: m });
        if (who === sender) return sock.sendMessage(sender, { text: 'Gak bisa transfer ke diri sendiri.' }, { quoted: m });
        
        let amount = parseInt(args[1]);

        if (!amount || amount < 100) return sock.sendMessage(sender, { text: 'Minimal transfer 100 perak.' }, { quoted: m });
        if (senderData.balance < amount) return sock.sendMessage(sender, { text: `Uang Anda kurang! (Saldo: ${senderData.balance})` }, { quoted: m });

        let targetData = global.db.getUser(who); 

        senderData.balance -= amount;
        targetData.balance += amount;

        sock.sendMessage(sender, { text: `*TRANSFER SUKSES 💸*\n\n💳 Nominal: Rp ${amount}\n👤 Penerima: @${who.split('@')[0]}\n💰 Sisa Saldo: ${senderData.balance}`, mentions: [who] }, { quoted: m });
    }
};
