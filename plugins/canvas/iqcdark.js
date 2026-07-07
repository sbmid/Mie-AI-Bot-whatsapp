const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const axios = require('axios');
const fs = require('fs');
const { writeFile, mkdir } = require('fs/promises');
const path = require('path');

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'iqcdark');
const OUT_DIR = path.join(process.cwd(), 'temp');

async function download(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

async function setup() {
    await mkdir(ASSETS_DIR, { recursive: true });
    await mkdir(OUT_DIR, { recursive: true });
    // Boleh pakai font custom dari Google Fonts (misal Roboto/Inter)
    const fontUrl = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Medium.woff2';
    const fontLocal = path.join(ASSETS_DIR, 'Inter-Medium.woff2');
    
    if (!fs.existsSync(fontLocal)) {
        await writeFile(fontLocal, await download(fontUrl));
    }
    GlobalFonts.registerFromPath(fontLocal, 'InterIQC');
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
    command: ['iqcdark'],
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
            const padding = 50;
            const textMaxWidth = canvasW - (padding * 2) - 120 - 20; // 120 is avatar size, 20 is gap

            const tempCanvas = createCanvas(canvasW, 1000);
            const tCtx = tempCanvas.getContext('2d');
            tCtx.font = '32px InterIQC';
            const wrappedText = wrapText(tCtx, text, textMaxWidth);
            
            const lineHeight = 40;
            const textHeight = wrappedText.length * lineHeight;
            
            const minHeight = 200;
            const canvasH = Math.max(minHeight, textHeight + padding * 2 + 50); // 50 for name space

            const canvas = createCanvas(canvasW, canvasH);
            const ctx = canvas.getContext('2d');

            // Draw Background (Dark)
            ctx.fillStyle = '#121212'; // Dark theme bg
            ctx.fillRect(0, 0, canvasW, canvasH);
            
            // Draw Chat Bubble Area
            ctx.fillStyle = '#1e1e1e';
            ctx.beginPath();
            ctx.roundRect(padding, padding, canvasW - (padding*2), canvasH - (padding*2), 20);
            ctx.fill();

            // Draw Avatar
            ctx.save();
            ctx.beginPath();
            ctx.arc(padding + 60, padding + 60, 40, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatarImg, padding + 20, padding + 20, 80, 80);
            ctx.restore();

            // Draw Username
            ctx.font = 'bold 24px InterIQC';
            ctx.fillStyle = '#a0a0a0';
            ctx.fillText(username, padding + 120, padding + 45);
            
            // Draw Time
            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            ctx.font = '16px InterIQC';
            ctx.fillStyle = '#555555';
            ctx.fillText(timeStr, padding + 120 + ctx.measureText(username).width + 15, padding + 45);

            // Draw Text
            ctx.font = '32px InterIQC';
            ctx.fillStyle = '#ffffff';
            let startY = padding + 90;
            for (let line of wrappedText) {
                ctx.fillText(line, padding + 120, startY);
                startY += lineHeight;
            }

            const outPath = path.join(OUT_DIR, `iqcdark-${Date.now()}.png`);
            await writeFile(outPath, await canvas.encode('png'));

            await sock.sendMessage(from, { image: { url: outPath }, caption: "Done!" }, { quoted: m });
            fs.unlinkSync(outPath); // cleanup
            
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('IQCDark Error:', e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: `[!] Terjadi kesalahan: ${e.message}` }, { quoted: m });
        }
    }
};
