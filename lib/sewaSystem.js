const fs = require('fs');
const path = './pending_sewa.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

module.exports = {
    createSession: (orderId, amount, groupLink) => {
        const data = JSON.parse(fs.readFileSync(path));
        data[orderId] = { amount: parseInt(amount), groupLink, createdAt: Date.now() };
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    },

    validate: async (socket, payload) => {
        const sock = socket || global.sock;
        if (!sock || !sock.groupAcceptInvite) return false;

        const data = JSON.parse(fs.readFileSync(path));
        const session = data[payload.order_id];
        if (!session) return false;

        try {
            const inviteCode = session.groupLink.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i);
            if (inviteCode) {
                const groupJid = await sock.groupAcceptInvite(inviteCode[1]);
                
                // 🌸 SAMBUTAN MANIS
                const welcome = `Halo Semuanya! 🌸\n\n*Mie AI* sudah resmi bergabung di grup ini via sistem sewa otomatis.\n\nProject ini didukung oleh *Bos Azrial*. Silakan ketik *.menu* untuk memulai ya! ✨`;
                if (groupJid) await sock.sendMessage(groupJid, { text: welcome });

                delete data[payload.order_id];
                fs.writeFileSync(path, JSON.stringify(data, null, 2));
                return true;
            }
        } catch (e) { return false; }
    }
};