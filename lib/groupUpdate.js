const axios = require('axios');
const db = require('./database');

module.exports = async (sock, anu) => {
    try {
        const { id, participants, action } = anu;
        if (!participants || !Array.isArray(participants)) return;

        const group = db.getGroup(id);
        if (!group) return;

        const metadata = await sock.groupMetadata(id).catch(() => null);
        if (!metadata) return;

        const groupName = metadata.subject;
        const memberCount = metadata.participants.length;

        for (let participant of participants) {
            let num = typeof participant === 'string' ? participant : (participant.id || participant.phoneNumber);
            if (!num) continue;

            let userId = num.split('@')[0];
            let ppuser;
            try {
                ppuser = await sock.profilePictureUrl(num, 'image');
            } catch {
                ppuser = 'https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg'; 
            }

            // --- BOT DITAMBAHKAN KE GRUP (SEWA GREETING) ---
            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (num === botJid && action === 'add') {
                const sewaData = db.getSewa(id);
                if (sewaData && sewaData.expired > Date.now()) {
                    const sisaMs = sewaData.expired - Date.now();
                    const hari = Math.floor(sisaMs / (1000 * 60 * 60 * 24));
                    const jam = Math.floor((sisaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    await sock.sendMessage(id, { 
                        text: `👋 Halo semuanya! Saya adalah bot.\n\n✅ Bot ini telah disewa di grup ini.\n⏳ Tenggat Masa Sewa: *${hari} Hari, ${jam} Jam*\n\nGunakan perintah *.menu* untuk melihat fitur bot.`
                    });
                } else {
                    await sock.sendMessage(id, { text: `👋 Halo! Terimakasih sudah mengundang saya.\nGrup ini belum terdaftar di rental premium, silakan hubungi owner untuk menyewa bot.` });
                }
                continue; // Jangan render welcome untuk bot sendiri
            }

            // --- LOGIKA WELCOME ---
            if (action === 'add' && group.welcome) {
                const bgWelcome = "https://i.pinimg.com/736x/19/af/4b/19af4ba659ae60d8ff85557af6573eea.jpg";
                let ppGc = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg"; 
                try { ppGc = await sock.profilePictureUrl(id, 'image'); } catch {}

                let style = group.welcomeStyle || 'v1';
                let welcomeApi = "";
                
                if (style === 'v2') welcomeApi = `https://api.siputzx.my.id/api/canvas/welcomev2?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgWelcome)}`;
                else if (style === 'v4') welcomeApi = `https://api.siputzx.my.id/api/canvas/welcomev4?avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgWelcome)}&description=${encodeURIComponent('Selamat Datang!')}`;
                else if (style === 'v5') welcomeApi = `https://api.siputzx.my.id/api/canvas/welcomev5?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgWelcome)}&quality=90`;
                else welcomeApi = `https://api.siputzx.my.id/api/canvas/welcomev1?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&guildIcon=${encodeURIComponent(ppGc)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgWelcome)}&quality=80`;

                try {
                    await sock.sendMessage(id, { 
                        image: { url: welcomeApi },
                        caption: `Halo @${userId}, selamat datang di *${groupName}*! ✨`,
                        mentions: [num]
                    });
                } catch (e) { console.error(e) }

            // --- LOGIKA LEAVE ---
            } else if (action === 'remove' && group.leave) {
                const bgGoodbye = "https://i.pinimg.com/1200x/4e/3b/aa/4e3baab371f5bcf1e6c34ef6e818d40b.jpg";
                let ppGc = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg"; 
                try { ppGc = await sock.profilePictureUrl(id, 'image'); } catch {}

                let style = group.leaveStyle || 'v1';
                let goodbyeApi = "";

                if (style === 'v2') goodbyeApi = `https://api.siputzx.my.id/api/canvas/goodbyev2?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgGoodbye)}`;
                else if (style === 'v4') goodbyeApi = `https://api.siputzx.my.id/api/canvas/goodbyev4?avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgGoodbye)}&title=goodbye&description=${encodeURIComponent('Selamat jalan!')}&border=%232a2e35&avatarBorder=%232a2e35&overlayOpacity=0.3`;
                else if (style === 'v5') goodbyeApi = `https://api.siputzx.my.id/api/canvas/goodbyev5?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgGoodbye)}&quality=90`;
                else goodbyeApi = `https://api.siputzx.my.id/api/canvas/goodbyev1?username=${encodeURIComponent(userId)}&guildName=${encodeURIComponent(groupName)}&guildIcon=${encodeURIComponent(ppGc)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppuser)}&background=${encodeURIComponent(bgGoodbye)}&quality=80`;

                try {
                    await sock.sendMessage(id, { 
                        image: { url: goodbyeApi },
                        caption: `Yah... si @${userId} pamit dari grup. 👋`,
                        mentions: [num]
                    });
                } catch (e) { console.error(e) }
            }
        }
    } catch (err) {
        console.error("❌ Error di groupUpdate:", err);
    }
};