const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const axios = require('axios');
const fs = require('fs');
const { writeFile, mkdir } = require('fs/promises');
const path = require('path');

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'ttqc');
const OUT_DIR = path.join(process.cwd(), 'temp');

async function download(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

async function setup() {
    await mkdir(ASSETS_DIR, { recursive: true });
    await mkdir(OUT_DIR, { recursive: true });
    
    const fontUrl = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Medium.woff2';
    const fontLocal = path.join(ASSETS_DIR, 'Inter-Medium.woff2');
    
    if (!fs.existsSync(fontLocal)) {
        await writeFile(fontLocal, await download(fontUrl));
    }
    GlobalFonts.registerFromPath(fontLocal, 'InterTT');
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

module.exports = {
    command: ['ttqc'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        if (!text) return sock.sendMessage(from, { text: `[!] Mana teksnya?\nContoh: *${prefix}${command} Kata-kata hari ini*` }, { quoted: m });

        if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            await setup();
            
            const sender = m.sender;
            const username = m.pushName || "Anonymous";
            let ppUrl = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg';
            
            try {
                ppUrl = await sock.profilePictureUrl(sender, 'image');
            } catch (e) {}

            const avatarImg = await loadImage(ppUrl);

            // Canvas sizes
            const canvasW = 800;
            const padding = 30;
            const avatarSize = 80;
            const textStartX = padding + avatarSize + 20;
            const textMaxWidth = canvasW - textStartX - 100; // Leave space for heart icon

            const tempCanvas = createCanvas(canvasW, 1000);
            const tCtx = tempCanvas.getContext('2d');
            tCtx.font = '30px InterTT';
            const wrappedText = wrapText(tCtx, text, textMaxWidth);
            
            const lineHeight = 38;
            const textHeight = wrappedText.length * lineHeight;
            
            const canvasH = padding * 2 + 60 + textHeight + 40; // 60 for name, 40 for footer

            const canvas = createCanvas(canvasW, canvasH);
            const ctx = canvas.getContext('2d');

            // Draw Background (TikTok Dark Modal)
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, canvasW, canvasH);

            // Draw Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(padding + (avatarSize/2), padding + (avatarSize/2), avatarSize/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, padding, padding, avatarSize, avatarSize);
            ctx.restore();

            // Draw Username
            ctx.font = 'bold 24px InterTT';
            ctx.fillStyle = '#8A8B91';
            ctx.fillText(username, textStartX, padding + 25);

            let currentX = textStartX + ctx.measureText(username).width + 10;

            // Draw "Creator" Badge if user is owner
            if (global.ownerNumber && global.ownerNumber.includes(sender)) {
                ctx.fillStyle = '#FE2C55'; // Tiktok Red
                ctx.beginPath();
                ctx.roundRect(currentX, padding + 5, 75, 26, 4);
                ctx.fill();
                ctx.font = 'bold 14px InterTT';
                ctx.fillStyle = '#ffffff';
                ctx.fillText("Creator", currentX + 12, padding + 23);
                currentX += 85;
            }

            // Draw Text
            ctx.font = '30px InterTT';
            ctx.fillStyle = '#FFFFFF';
            let startY = padding + 65;
            for (let line of wrappedText) {
                ctx.fillText(line, textStartX, startY);
                startY += lineHeight;
            }

            // Footer (Time & Reply)
            ctx.font = '20px InterTT';
            ctx.fillStyle = '#8A8B91';
            ctx.fillText("1h ago", textStartX, startY + 15);
            ctx.font = 'bold 20px InterTT';
            ctx.fillText("Reply", textStartX + 80, startY + 15);

            // Draw Heart Icon (Right side)
            ctx.font = '30px InterTT';
            ctx.fillStyle = '#8A8B91';
            const heartX = canvasW - 70;
            ctx.fillText("♡", heartX, padding + 40);
            ctx.font = '18px InterTT';
            ctx.textAlign = 'center';
            ctx.fillText(Math.floor(Math.random() * 500) + 10, heartX + 15, padding + 70);

            const outPath = path.join(OUT_DIR, `ttqc-${Date.now()}.png`);
            await writeFile(outPath, await canvas.encode('png'));

            await sock.sendMessage(from, { image: { url: outPath }, caption: "Done!" }, { quoted: m });
            fs.unlinkSync(outPath); // cleanup
            
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('TTQC Error:', e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: `[!] Terjadi kesalahan: ${e.message}` }, { quoted: m });
        }
    }
};
