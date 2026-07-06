const axios = require('axios');

module.exports = {
    command: ['rank', 'level', 'profile'],
    handler: async (sock, m) => {
        const from = m.sender;
        const pushName = m.pushName || "User";

        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = global.thumb; 
        }

        const background = encodeURIComponent("https://i.pinimg.com/1200x/16/24/b6/1624b6d67a2d9acc228390129d5b7fbc.jpg");
        const avatar = encodeURIComponent(ppUrl);
        const name = encodeURIComponent(pushName);
        
        const rank = "Epik";
        const level = 10;
        const currentExp = 500;
        const needExp = 1000;

        const apiUrl = `https://api.siputzx.my.id/api/canvas/profile?backgroundURL=${background}&avatarURL=${avatar}&rankName=${rank}&rankId=0&exp=${currentExp}&requireExp=${needExp}&level=${level}&name=${name}`;

        try {
            if (global.waitMode === "react") {
                await sock.sendMessage(from, { react: { text: "🎨", key: m.key } });
            }

            await sock.sendMessage(from, { 
                image: { url: apiUrl },
                caption: `
╭───「 *MEI AI RANK* 」
│ [!] *User:* @${from.split('@')[0]}
│ [!] *Rank:* ${rank}
│ [!] *Level:* ${level}
╰───────────────────

Teruslah aktif mengobrol bersama *Mei AI* untuk meningkatkan levelmu!`.trim(),
                mentions: [from]
            }, { quoted: m });

            if (global.waitMode === "react") {
                await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
            }

        } catch (e) {
            console.error(e);
            await sock.sendMessage(from, { 
                text: "Aduh, maaf ya! Mei gagal menggambar kartu rank kamu. Coba lagi nanti!" 
            }, { quoted: m });
        }
    }
};
const db = require('../../lib/database');

module.exports = {
    command: ['rank', 'level', 'profile'],
    handler: async (sock, m) => {
        const from = m.sender;
        const pushName = m.pushName || "User";
        const user = db.getUser(from);

        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = global.thumb;
        }

        let rankName = "Newbie";
        if (user.level >= 5) rankName = "Active Member";
        if (user.level >= 10) rankName = "Epik";
        if (user.level >= 20) rankName = "Legendary";

        const background = encodeURIComponent("https://i.pinimg.com/1200x/16/24/b6/1624b6d67a2d9acc228390129d5b7fbc.jpg");
        const avatar = encodeURIComponent(ppUrl);
        const name = encodeURIComponent(pushName);
        
        const level = user.level;
        const currentExp = user.xp;
        const needExp = 1000; 

        const apiUrl = `https://api.siputzx.my.id/api/canvas/profile?backgroundURL=${background}&avatarURL=${avatar}&rankName=${encodeURIComponent(rankName)}&rankId=0&exp=${currentExp}&requireExp=${needExp}&level=${level}&name=${name}`;

        try {
            await sock.sendMessage(from, { 
                image: { url: apiUrl },
                caption: `*MEI AI - RANK CARD*\n\nHalo *@${from.split('@')[0]}*, progres levelmu telah tercatat di sistem kami!`,
                mentions: [from]
            }, { quoted: m });
        } catch (e) {
            console.error(e);
            await sock.sendMessage(from, { text: "Gagal memuat kartu rank." });
        }
    }
};