const db = require('./database');

module.exports = async (sock, m) => {
    const data = db.read();
    if (!data.users) data.users = {};
    const now = +new Date();

    // 1. LOGIKA: BERHENTI AFK (SENDER)
    if (data.users[m.sender] && data.users[m.sender].afkTime > 0) {
        if (m.key.fromMe) return;
        const user = data.users[m.sender];
        const duration = now - user.afkTime;
        // Jeda kecil (0.5 detik) buat jaga-jaga, tapi tak butuh pesan 2 kali lagi
        if (duration < 500) return; 

        const jam = Math.floor(duration / 3600000);
        const menit = Math.floor((duration % 3600000) / 60000);
        const detik = Math.floor((duration % 60000) / 1000);
        let durasiStr = `${jam > 0 ? jam + ' Jam ' : ''}${menit > 0 ? menit + ' Menit ' : ''}${detik} Detik`;

        await sock.sendMessage(m.chat, {
            text: `✨ *WELCOME BACK!* @${m.sender.split('@')[0]}\nStatus AFK kamu telah dicabut.\n\n🕒 *Lama AFK:* ${durasiStr}\n📝 *Alasan:* ${user.afkReason}`,
            mentions: [m.sender]
        }, { quoted: m });

        data.users[m.sender].afkTime = -1;
        data.users[m.sender].afkReason = '';
        if(global.db && global.db.saveAll) global.db.saveAll();
    }

    // 2. LOGIKA: ANTI-TAG (DIPERKUAT)
    let mentions = [...(m.mentionedJid || [])];
    if (m.quoted) mentions.push(m.quoted.sender);
    
    // Trik: Ambil paksa nomor dari teks jika ada yang ngetik @nomor tapi gak masuk mentionedJid
    const textTag = m.body ? m.body.match(/@(\d+)/g) : [];
    if (textTag) {
        textTag.forEach(v => {
            let rawNum = v.replace('@', '');
            mentions.push(`${rawNum}@lid`);
            mentions.push(`${rawNum}@s.whatsapp.net`);
        });
    }

    let uniqueMentions = [...new Set(mentions)];

    for (let jid of uniqueMentions) {
        // Cari user di database dengan berbagai kemungkinan format ID
        let targetId = jid;
        if (!data.users[targetId]) {
            // Kalau gak ketemu, coba cari yang nomornya sama di database
            targetId = Object.keys(data.users).find(key => key.startsWith(jid.split('@')[0]));
        }

        const afkUser = data.users[targetId];

        if (afkUser && afkUser.afkTime > 0) {
            // Biar gak spam (Mei kasih jeda 30 detik per user)
            if (now - (afkUser.lastWarned || 0) < 30000) continue;

            const duration = now - afkUser.afkTime;
            const menit = Math.floor((duration % 3600000) / 60000);
            const detik = Math.floor((duration % 60000) / 1000);
            let lamaAfk = menit > 0 ? `${menit} menit` : `${detik} detik`;

            await sock.sendMessage(m.chat, {
                text: `🤫 *Ssssttt... @${targetId.split('@')[0]} lagi AFK!*\n\n📝 *Alasan:* ${afkUser.afkReason}\n⏳ *Sudah sejak:* ${lamaAfk} yang lalu`,
                mentions: [targetId]
            }, { quoted: m });

            afkUser.lastWarned = now; // Catat waktu peringatan terakhir
            if(global.db && global.db.saveAll) global.db.saveAll();
        }
    }
};