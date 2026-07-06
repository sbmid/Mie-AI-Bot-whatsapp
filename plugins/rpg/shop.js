module.exports = {
    command: ["shop", "beli"],
    handler: async (sock, m, { args, prefix: usedPrefix, command }) => {
        const sender = m.key.remoteJid;
        const user = global.db.getUser(sender);

        const listHarga = {
            potion: 1000,
            diamond: 5000,
            iron: 2000, 
            gold: 3000,
            common_crate: 10000
        };

        const itemInput = args[0] ? args[0].toLowerCase() : '';
        const jumlah = parseInt(args[1]) || 1;

        if (!itemInput || !listHarga[itemInput]) {
            return sock.sendMessage(sender, { text: `🛒 *SHOP LIST*
Uangmu: ${user.balance.toLocaleString('id-ID')}

💎 *Diamond*: 5000
🧪 *Potion*: 1000
⛓️ *Iron*: 2000
🪙 *Gold*: 3000
📦 *Common Crate*: 10000

*Cara Beli:*
${usedPrefix}shop <nama_item> <jumlah>
Contoh: *${usedPrefix}shop potion 5*` }, { quoted: m });
        }

        const hargaPerItem = listHarga[itemInput];
        const totalHarga = hargaPerItem * jumlah;

        if (user.balance < totalHarga) {
            return sock.sendMessage(sender, { text: `💰 *Uang tidak cukup!*
Butuh: ${totalHarga}
Punya: ${user.balance}
Kurang: ${totalHarga - user.balance}` }, { quoted: m });
        }

        try {
            user.balance -= totalHarga;
            user[itemInput] += jumlah;

            sock.sendMessage(sender, { text: `Sukses membeli *${jumlah} ${itemInput}* seharga *${totalHarga}*` }, { quoted: m });
        } catch (e) {
            console.error(e);
            sock.sendMessage(sender, { text: 'Terjadi kesalahan saat transaksi database.' }, { quoted: m });
        }
    }
};
