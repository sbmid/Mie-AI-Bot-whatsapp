const axios = require('axios');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const { writeFile, mkdir } = require('fs/promises');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

const BG_URL     = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/storyig.png';
const FONT_URL   = 'https://github.com/rsms/inter/raw/refs/heads/master/docs/font-files/Inter-Medium.woff2';

const ICON_URLS = {
  like:    'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/like.svg',
  comment: 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/comment.svg',
  repost:  'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/repost.svg',
  share:   'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/share.svg',
  save:    'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/save.svg',
  verify:  'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/igstory/verifyig.svg',
};

const ICON_COLOR   = '#f9fdfe';
const VERIFY_COLOR = '#0095F6';

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'igstory');
const FONTS_DIR   = path.join(ASSETS_DIR, 'fonts');
const ICONS_DIR   = path.join(ASSETS_DIR, 'icons');
const BG_LOCAL    = path.join(ASSETS_DIR, 'bg.png');
const FONT_LOCAL  = path.join(FONTS_DIR, 'Inter-Medium.woff2');
const OUT_DIR     = path.join(process.cwd(), 'temp');

const CANVAS_W = 1080;
const CANVAS_H = 1564;
const CANVAS_BG_COLOR = '#0c0f14';
const OUTPUT_HEIGHT = 1400;

const ICON_SIZE = 80;
const BOTTOM_BAR_Y_OFFSET = 17;
const ICON_Y    = 1264 + BOTTOM_BAR_Y_OFFSET;
const GAP_ICON_TO_TEXT  = 24;
const GAP_TEXT_TO_ICON  = 43;
const DEFAULT_X = { like: 22, comment: 256, repost: 459, share: 688, save: 978 };

const COUNT_FONT   = '500 43px InterIG';
const COUNT_ZONE_Y = 1285 + BOTTOM_BAR_Y_OFFSET;
const COUNT_ZONE_H = 48;

const USERNAME_FONT   = '500 38px InterIG';
const USERNAME_X      = 159;
const USERNAME_ZONE_Y = 58;
const USERNAME_ZONE_H = 59;
const VERIFY_SIZE      = 40;
const VERIFY_Y          = 71;
const GAP_USERNAME_VERIFY = 14;

const AVATAR_CX = 83.5, AVATAR_CY = 85.5, AVATAR_R = 48.5;
const AVATAR_DRAW = { x: 35, y: 37, w: 97, h: 97 };

const MAIN_PHOTO_ZONE = { x: -3, y: 157, w: 1089, h: 1089 };
const MAIN_PHOTO_BLUR = 28;

async function download(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0' }, maxRedirects: 5 });
  return Buffer.from(res.data);
}

function isUrl(src) {
  return /^https?:\/\//i.test(src);
}

async function resolveFreshImage(src) {
  const buf = isUrl(src) ? await download(src) : (Buffer.isBuffer(src) ? src : await fs.promises.readFile(src));
  return loadImage(buf);
}

function rasterizeSvg(svgText, size) {
  const resvg = new Resvg(svgText, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

async function tintImage(img, color) {
  const c = createCanvas(img.width, img.height);
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0);
  cx.globalCompositeOperation = 'source-in';
  cx.fillStyle = color;
  cx.fillRect(0, 0, img.width, img.height);
  return c.encode('png');
}

async function setup() {
  await mkdir(FONTS_DIR, { recursive: true });
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  if (!fs.existsSync(BG_LOCAL)) await writeFile(BG_LOCAL, await download(BG_URL));
  if (!fs.existsSync(FONT_LOCAL)) await writeFile(FONT_LOCAL, await download(FONT_URL));
  
  GlobalFonts.registerFromPath(FONT_LOCAL, 'InterIG');

  const icons = {};
  for (const [name, url] of Object.entries(ICON_URLS)) {
    const targetSize = name === 'verify' ? VERIFY_SIZE : ICON_SIZE;
    const cachePath = path.join(ICONS_DIR, `${name}.png`);
    if (!fs.existsSync(cachePath)) {
      const svgText = (await download(url)).toString('utf-8');
      const color = name === 'verify' ? VERIFY_COLOR : ICON_COLOR;
      const rawPng = rasterizeSvg(svgText, targetSize * 3);
      const tintedPng = await tintImage(await loadImage(rawPng), color);
      await writeFile(cachePath, tintedPng);
    }
    icons[name] = await loadImage(cachePath);
  }
  return icons;
}

function computeBottomBarLayout(ctx, { like, comment, repost }) {
  ctx.font = COUNT_FONT;
  const likeX = DEFAULT_X.like;
  const likeTextX = likeX + ICON_SIZE + GAP_ICON_TO_TEXT;
  const likeTextW = ctx.measureText(String(like)).width;

  const minCommentX = likeTextX + likeTextW + GAP_TEXT_TO_ICON;
  const commentX = Math.max(DEFAULT_X.comment, minCommentX);
  const commentTextX = commentX + ICON_SIZE + GAP_ICON_TO_TEXT;
  const commentTextW = ctx.measureText(String(comment)).width;

  const minRepostX = commentTextX + commentTextW + GAP_TEXT_TO_ICON;
  const repostX = Math.max(DEFAULT_X.repost, minRepostX);
  const repostTextX = repostX + ICON_SIZE + GAP_ICON_TO_TEXT;
  const repostTextW = ctx.measureText(String(repost)).width;

  const minShareX = repostTextX + repostTextW + GAP_TEXT_TO_ICON;
  const shareX = Math.max(DEFAULT_X.share, minShareX);

  return {
    like:    { iconX: likeX,    textX: likeTextX },
    comment: { iconX: commentX, textX: commentTextX },
    repost:  { iconX: repostX,  textX: repostTextX },
    share:   { iconX: shareX },
    save:    { iconX: DEFAULT_X.save },
  };
}

function computeUsernameLayout(ctx, username) {
  ctx.font = USERNAME_FONT;
  const textW = ctx.measureText(username).width;
  const verifyX = USERNAME_X + textW + GAP_USERNAME_VERIFY;
  return { textX: USERNAME_X, verifyX };
}

function drawIcon(ctx, img, x, y, size) {
  ctx.drawImage(img, x, y, size, size);
}

function drawCountText(ctx, text, x) {
  ctx.save();
  ctx.font = COUNT_FONT;
  ctx.fillStyle = '#f9fdfe';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), x, COUNT_ZONE_Y + COUNT_ZONE_H / 2);
  ctx.restore();
}

function drawUsernameText(ctx, text, x) {
  ctx.save();
  ctx.font = USERNAME_FONT;
  ctx.fillStyle = '#f9fdfe';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, USERNAME_ZONE_Y + USERNAME_ZONE_H / 2);
  ctx.restore();
}

function drawAvatar(ctx, img) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(AVATAR_CX, AVATAR_CY, AVATAR_R, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const sw = img.width, sh = img.height;
  const crop = Math.min(sw, sh);
  const sx = (sw - crop) / 2;
  const sy = (sh - crop) / 2;
  ctx.drawImage(img, sx, sy, crop, crop, AVATAR_DRAW.x, AVATAR_DRAW.y, AVATAR_DRAW.w, AVATAR_DRAW.h);
  ctx.restore();
}

function drawMainPhoto(ctx, img, zone, blurPx = MAIN_PHOTO_BLUR) {
  const { x, y, w, h } = zone;
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  let cw, ch;
  if (imgRatio > boxRatio) {
    ch = h;
    cw = ch * imgRatio;
  } else {
    cw = w;
    ch = cw / imgRatio;
  }
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(img, x - (cw - w) / 2, y - (ch - h) / 2, cw, ch);
  ctx.filter = 'none';

  let fw, fh;
  if (imgRatio > boxRatio) {
    fw = w;
    fh = fw / imgRatio;
  } else {
    fh = h;
    fw = fh * imgRatio;
  }
  ctx.drawImage(img, x + (w - fw) / 2, y + (h - fh) / 2, fw, fh);
  ctx.restore();
}

async function generateIgStory({ username = 'Nothing', like = 100, comment = 31, repost = 489, profilePhoto, mainPhoto, outFile }) {
  const icons = await setup();
  const [bgImg, avatarImg, photoImg] = await Promise.all([
    loadImage(BG_LOCAL),
    resolveFreshImage(profilePhoto),
    resolveFreshImage(mainPhoto),
  ]);

  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = CANVAS_BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);

  drawMainPhoto(ctx, photoImg, MAIN_PHOTO_ZONE);
  drawAvatar(ctx, avatarImg);

  const uLayout = computeUsernameLayout(ctx, username);
  drawUsernameText(ctx, username, uLayout.textX);
  drawIcon(ctx, icons.verify, uLayout.verifyX, VERIFY_Y, VERIFY_SIZE);

  const bar = computeBottomBarLayout(ctx, { like, comment, repost });
  drawIcon(ctx, icons.like, bar.like.iconX, ICON_Y, ICON_SIZE);
  drawCountText(ctx, like, bar.like.textX);
  drawIcon(ctx, icons.comment, bar.comment.iconX, ICON_Y, ICON_SIZE);
  drawCountText(ctx, comment, bar.comment.textX);
  drawIcon(ctx, icons.repost, bar.repost.iconX, ICON_Y, ICON_SIZE);
  drawCountText(ctx, repost, bar.repost.textX);
  drawIcon(ctx, icons.share, bar.share.iconX, ICON_Y, ICON_SIZE);
  drawIcon(ctx, icons.save, bar.save.iconX, ICON_Y, ICON_SIZE);

  const finalOut = outFile ?? path.join(OUT_DIR, `igstory-${Date.now()}.png`);
  const cropH = Math.min(OUTPUT_HEIGHT, CANVAS_H);
  const finalCanvas = createCanvas(CANVAS_W, cropH);
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(canvas, 0, 0, CANVAS_W, cropH, 0, 0, CANVAS_W, cropH);

  await writeFile(finalOut, await finalCanvas.encode('png'));
  return finalOut;
}

module.exports = {
    command: ['igstory'],
    handler: async (sock, m, { prefix, command, text }) => {
        const from = m.key.remoteJid;
        const msgObj = m.message?.extendedTextMessage || m.message;
        let quoted = msgObj?.contextInfo?.quotedMessage;
        
        let baseMsg = m.message;
        if (quoted && !m.message?.imageMessage && !m.message?.viewOnceMessageV2) {
            baseMsg = quoted;
        }

        let mediaData = null;
        if (baseMsg?.imageMessage) mediaData = baseMsg.imageMessage;
        else if (baseMsg?.viewOnceMessageV2?.message?.imageMessage) mediaData = baseMsg.viewOnceMessageV2.message.imageMessage;
        
        if (!mediaData) {
            return sock.sendMessage(from, { text: `[!] Kirim/balas foto dengan caption *${prefix}${command}* <username>` }, { quoted: m });
        }

        // Format: .igstory username|like|comment|repost
        const args = text ? text.split('|').map(s => s.trim()) : [];
        const username = args[0] || m.pushName || "Anonymous";
        const customLike = args[1] ? parseInt(args[1]) : Math.floor(Math.random() * 900) + 100;
        const customComment = args[2] ? parseInt(args[2]) : Math.floor(Math.random() * 100) + 10;
        const customRepost = args[3] ? parseInt(args[3]) : Math.floor(Math.random() * 50) + 1;

        if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const stream = await downloadContentFromMessage(mediaData, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Dapatkan PP User yang nge-chat
            const targetJid = m.sender;
            let profileUrl = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/artworks-gWLRE6HyPH3DgVMG-ZFFxtg-t500x500.jpg';
            try {
                profileUrl = await sock.profilePictureUrl(targetJid, 'image');
            } catch (e) {}

            const outPath = await generateIgStory({
                username: username,
                like: customLike,
                comment: customComment,
                repost: customRepost,
                profilePhoto: profileUrl,
                mainPhoto: buffer
            });

            await sock.sendMessage(from, { image: { url: outPath }, caption: "Done!" }, { quoted: m });
            fs.unlinkSync(outPath); // cleanup

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (e) {
            console.error('IGStory Error:', e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            sock.sendMessage(from, { text: `[!] Terjadi kesalahan: ${e.message}` }, { quoted: m });
        }
    }
};
