const generateCard = require('fake-ml');
const fs = require('fs');
const path = require('path');

module.exports = {
  command: ['fakeml', 'ml'],
  handler: async (sock, m, { text, prefix, command }) => {
    if (!text) return sock.sendMessage(m.chat, { text: `[!] Cara pakai:\n${prefix}${command} Username | Rank | Border\n\nContoh:\n${prefix}${command} Ditzzx | imo | 11\n\nList border/rank: https://www.npmjs.com/package/fake-ml` }, { quoted: m });
    
    if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
    try {
        let args = text.split('|').map(v => v.trim());
        let username = args[0] || m.pushName || 'Anonymous';
        let rank = args[1] || 'imo';
        let border = args[2] ? parseInt(args[2]) : 11;
        
        let avatar = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg';
        try {
            avatar = await sock.profilePictureUrl(m.sender, 'image');
        } catch (e) {}

        const result = await generateCard({
            avatar: avatar,
            username: username,
            rank: rank,
            border: border
        });
        
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const outPath = path.join(tempDir, `ml-${Date.now()}.png`);
        fs.writeFileSync(outPath, result);
        
        await sock.sendMessage(m.chat, { image: { url: outPath }, caption: "Done!" }, { quoted: m });
        fs.unlinkSync(outPath);
        
        if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error(e);
        if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(m.chat, { text: `[!] Error: ${e.message}` }, { quoted: m });
    }
  }
};
