const db = require('../../lib/database');

module.exports = {
    command: ['leaderboard', 'lb', 'top', 'topglobal'],
    handler: async (sock, m) => {
        const data = db.read();
        const users = data.users;

        let participants = [];
        if (m.isGroup) {
            try {
                const metadata = await sock.groupMetadata(m.chat);
                participants = metadata.participants.map(p => p.id);
            } catch (e) {
                // Biarkan array kosong jika gagal
            }
        }

        let userList = Object.keys(users).map(jid => ({
            jid: jid,
            level: users[jid].level || 1,
            xp: users[jid].xp || 0,
            name: users[jid].name || "", 
            registered: users[jid].registered || false
        }));

        userList.sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.xp - a.xp;
        });

        // Ambil Top 10
        let topUsers = userList.slice(0, 10);
        let mentions = [];
        
        let leaderboardText = ` *MEI AI - TOP 10 GLOBAL*\n`;
        leaderboardText += `_Peringkat pemain paling aktif saat ini_\n\n`;

        topUsers.forEach((user, index) => {
            let icon = index === 0 ? '' : index === 1 ? '' : index === 2 ? '' : '[!]';
            let num = user.jid.split('@')[0];
            
            // Gunakan nama pendaftaran jika ada, kalau tidak pakai nomor
            let nameAlias = user.registered ? user.name : num;
            
            let isHere = participants.includes(user.jid);
            let finalNameDisplay;

            if (isHere) {
                finalNameDisplay = `@${num} (${nameAlias})`; 
                mentions.push(user.jid);
            } else {
                finalNameDisplay = nameAlias;
            }

            leaderboardText += `${icon} *Rank ${index + 1}* : ${finalNameDisplay}\n`;
            leaderboardText += `└─ [i] *Level:* ${user.level} |  *XP:* ${user.xp}\n\n`;
        });

        // leaderboardText += `*Note:* Ingin namamu muncul di sini? Ketik *.daftar nama*`;

        try {
            await sock.sendMessage(m.chat, {
                image: { url: "https://i.pinimg.com/1200x/4e/3b/aa/4e3baab371f5bcf1e6c34ef6e818d40b.jpg" },
                caption: leaderboardText,
                contextInfo: {
                    mentionedJid: mentions
                }
            }, { quoted: m });
        } catch (err) {
            sock.sendMessage(m.chat, { text: "Mei lagi pusing ngitung ranking, coba lagi nanti!" }, { quoted: m });
        }
    }
};