const db = require('../../lib/database');

/**
 * MIE AI - Identity Profile 
 * Support: Stalking via Reply & DB Name Display
 * Aura: Aesthetic & Girly Sultan 
 */
module.exports = {
    command: ['me', 'profile', 'profil'],
    handler: async (sock, m) => {
        // [!] DETEKSI TARGET (Cek apakah Bos lagi reply orang atau mau liat profil sendiri)
        const target = m.quoted ? m.quoted.sender : m.sender;
        const user = db.getUser(target);

        // Data Nama
        const dbName = user.name || m.pushName || "Anonymous";
        const pushName = (target === m.sender) ? m.pushName : "User";
        const finalName = user.name || pushName;

        // XP & Progress Logic
        const targetXp = 1000; // Target XP per level
        const progress = Math.min((user.xp / targetXp) * 100, 100).toFixed(1);

        // Rank Logic (Berdasarkan Target)
        let rank = "Newbie";
        if (user.level >= 5) rank = "Regular";
        if (user.level >= 15) rank = "Elite";
        if (user.level >= 30) rank = "Ace";
        if (user.level >= 50) rank = "Legendary";

        // Cek Owner (Pakai ID Target)
        const owners = global.ownerNumber || [];
        if (owners.some(v => v.includes(target.split('@')[0]))) rank = "Creator (SBM)";

        // Economy Logic
        let economy = "Warga Sipil [i]";
        if (user.balance >= 5000) economy = "Cukup Kaya ";
        if (user.balance >= 20000) economy = "Jutawan Muda ";
        if (user.balance >= 50000) economy = "Sultan Grup [!]";
        if (user.balance >= 100000) economy = "Legendary Rich [!]";
        if (user.balance <= 0) economy = "Gembel Elite [!]";

        // Ambil Foto Profil Target
        let ppUrl;
        try {
            ppUrl = await sock.profilePictureUrl(target, 'image');
        } catch {
            ppUrl = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
        }

        const bodyText = `
˗ˏˋ [!] *𝐔𝐒𝐄𝐑 𝐈𝐃𝐄𝐍𝐓𝐈𝐓𝐘* ˎˊ˗

[!] *Target* : @${target.split('@')[0]}
[i] *Rank* : ${rank}
[!] *Status* : ${economy}

「 ɪɴғᴏʀᴍᴀsɪ ᴀsᴇᴛ 」
[!] *Level* : ${user.level}
[!] *Saldo* : ${user.balance.toLocaleString()} Balance
 *XP* : ${user.xp.toLocaleString()} / ${targetXp}

╰┈➤ *Progres Level Up*
[ ${'■'.repeat(Math.floor(progress / 10))}${'□'.repeat(10 - Math.floor(progress / 10))} ] ${progress}%

*Mie AI: Semangat terus ya kak!* (੭˃ᴗ˂)੭ `.trim();

        try {
            await sock.sendMessage(m.chat, {
                image: { url: ppUrl },
                caption: bodyText,
                contextInfo: {
                    mentionedJid: [target]
                }
            }, { quoted: m });
        } catch (e) {
            console.error("Error Profile Plugin:", e);
            sock.sendMessage(m.chat, { text: "Aduuh, Mei pusing... profilnya gagal dimuat! (｡•́︿•̀｡)" }, { quoted: m });
        }
    }
};