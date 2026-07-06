function isNumber(x) {
    return !isNaN(x);
}

module.exports = {
    command: ["bank", "deposit", "depo", "withdraw", "tarik"],
    handler: async (sock, m, { args, command, prefix: usedPrefix }) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);

        const total = Math.floor(isNumber(args[0]) ? Math.min(Math.max(parseInt(args[0]), 1), Number.MAX_SAFE_INTEGER) : 1);
        const bank = user.bank || 0;
        const uang = user.balance || 0;

        if (!args[0]) return sock.sendMessage(sender, { text: `Cara penggunaan:\n${usedPrefix}${command} <jumlah>\n\nContoh: ${usedPrefix}${command} 10000` }, { quoted: m });

        if (command === 'deposit' || command === 'depo' || command === 'bank') {
            if (uang < total) return sock.sendMessage(sender, { text: `💳 Uang tunaimu tidak cukup!\nUangmu: ${uang}\nMau Depo: ${total}` }, { quoted: m });

            try {
                user.balance -= total;
                user.bank += total;
                sock.sendMessage(sender, { text: `Berhasil deposit *${total}* ke bank.` }, { quoted: m });
            } catch (e) {
                console.error(e);
                sock.sendMessage(sender, { text: 'Gagal transaksi database.' }, { quoted: m });
            }
        }

        if (command === 'withdraw' || command === 'tarik') {
            if (bank < total) return sock.sendMessage(sender, { text: `💳 Saldo bank kurang!\nDi Bank: ${bank}\nMau Tarik: ${total}` }, { quoted: m });

            try {
                user.bank -= total;
                user.balance += total;
                sock.sendMessage(sender, { text: `Berhasil menarik *${total}* dari bank.` }, { quoted: m });
            } catch (e) {
                console.error(e);
                sock.sendMessage(sender, { text: 'Gagal transaksi database.' }, { quoted: m });
            }
        }
    }
};
