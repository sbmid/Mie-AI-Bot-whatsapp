const db = require('./database');

/**
 * Handle Group Participants Update (Welcome/Left)
 */
module.exports = async (sock, anu) => {
    const { id, participants, action } = anu;
    const group = db.getGroup(id);

    // Hanya jalan kalau aksinya 'add' (member masuk) dan fitur welcome aktif di grup tersebut
    if (action === 'add' && group.welcome) {
        for (let num of participants) {
            try {
                const metadata = await sock.groupMetadata(id);
                const memberCount = metadata.participants.length;
                const groupName = metadata.subject;
                
                // Ambil Foto Profil User
                let ppUrl;
                try { 
                    ppUrl = await sock.profilePictureUrl(num, 'image'); 
                } catch { 
                    ppUrl = "https://i.ibb.co/1s8T3sY/48f7ce63c7aa.jpg"; // Gambar default
                }

                const background = "https://i.pinimg.com/1200x/d4/1f/26/d41f26ec81ceed41e16ee6de61734645.jpg";
                const username = num.split('@')[0];
                
                // API Canvas Welcome yang kamu minta
                const welcomeApi = `https://api.siputzx.my.id/api/canvas/welcomev5?username=${encodeURIComponent(username)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(background)}&quality=90`;

                await sock.sendMessage(id, {
                    image: { url: welcomeApi },
                    caption: `Halo @${username} 👋\nSelamat datang di *${groupName}*!\n\nSemoga betah dan jangan lupa baca deskripsi grup ya ✨`,
                    mentions: [num]
                });
            } catch (err) {
                console.error("Gagal mengirim Welcome Message:", err);
            }
        }
    }
};