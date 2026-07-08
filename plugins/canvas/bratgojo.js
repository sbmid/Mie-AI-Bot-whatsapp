const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const BRAT_IMAGE_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Gojo.jpeg";
const BRAT_FONT_URL = "https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Poppins.ttf";

const CANVAS = { width: 1254, height: 1254 };
const SAFE_ZONE = { a: 660, b: 1180, c: 270, d: 990 };
const TEXT_STYLE = {
  fontFamily: "Poppins", maxFontSize: 90, minFontSize: 22,
  lineHeight: 1.18, color: "#111111", align: "center"
};

const VIDEO_CONFIG = {
  outputFormat: "mp4", fast_progress: true, fps: 24, width: 512, height: 512,
  lyric: { maxWordPerLayer: 5, frameDuration: 0.7, lastFrameDuration: 1.5 }
};

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal download: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

function normalizeText(text) {
  return String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function tokenize(text) {
  return normalizeText(text).replace(/[,，]/g, " ").split(/\s+/).map(v => v.trim()).filter(Boolean);
}

function splitIntoLayers(tokens, maxWordPerLayer) {
  if (!Number.isFinite(maxWordPerLayer) || maxWordPerLayer <= 0) return [tokens];
  const layers = [];
  for (let i = 0; i < tokens.length; i += maxWordPerLayer) layers.push(tokens.slice(i, i + maxWordPerLayer));
  return layers;
}

function resolveDurations(frames, lyric) {
  return frames.map(frame => frame.isLastInLayer ? Math.max(0.05, lyric.lastFrameDuration) : Math.max(0.05, lyric.frameDuration));
}

function buildRevealFrames(text, config) {
  const tokens = tokenize(text);
  const layers = splitIntoLayers(tokens, config.lyric.maxWordPerLayer);
  const frames = [];
  for (const layer of layers) {
    let current = "";
    for (let i = 0; i < layer.length; i++) {
      current += (current ? " " : "") + layer[i];
      frames.push({ text: current, isLastInLayer: i === layer.length - 1 });
    }
  }
  const durations = resolveDurations(frames, config.lyric);
  return frames.map((frame, index) => ({ ...frame, duration: durations[index] }));
}

function getSafeRect(zone) {
  return { x: zone.c, y: zone.a, w: zone.d - zone.c, h: zone.b - zone.a, centerX: (zone.c + zone.d) / 2, centerY: (zone.a + zone.b) / 2 };
}

function setFont(ctx, size) { ctx.font = `${size}px ${TEXT_STYLE.fontFamily}`; }

function splitLongWord(ctx, word, maxWidth) {
  const chars = [...word]; const parts = []; let current = "";
  for (const char of chars) {
    const test = current + char;
    if (ctx.measureText(test).width <= maxWidth || !current) current = test;
    else { parts.push(current); current = char; }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapParagraph(ctx, paragraph, maxWidth) {
  const words = paragraph.split(" ").filter(Boolean); const lines = []; let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) { current = test; continue; }
    if (current) { lines.push(current); current = ""; }
    if (ctx.measureText(word).width <= maxWidth) { current = word; } 
    else { const parts = splitLongWord(ctx, word, maxWidth); lines.push(...parts.slice(0, -1)); current = parts.at(-1) || ""; }
  }
  if (current) lines.push(current);
  return lines;
}

function wrapText(ctx, text, maxWidth) {
  return text.split("\n").flatMap(paragraph => {
    const clean = paragraph.trim(); return clean ? wrapParagraph(ctx, clean, maxWidth) : [""];
  });
}

function fitText(ctx, text, rect) {
  for (let size = TEXT_STYLE.maxFontSize; size >= TEXT_STYLE.minFontSize; size--) {
    setFont(ctx, size);
    const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight);
    const lines = wrapText(ctx, text, rect.w);
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= rect.h) return { size, lines, lineHeight, totalHeight };
  }
  const size = TEXT_STYLE.minFontSize; setFont(ctx, size);
  const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight);
  const lines = wrapText(ctx, text, rect.w);
  const maxLines = Math.max(1, Math.floor(rect.h / lineHeight));
  const clipped = lines.slice(0, maxLines);
  if (lines.length > maxLines && clipped.length) {
    let last = clipped[clipped.length - 1];
    while (last.length > 0 && ctx.measureText(`${last}...`).width > rect.w) last = last.slice(0, -1);
    clipped[clipped.length - 1] = `${last}...`;
  }
  return { size, lines: clipped, lineHeight, totalHeight: clipped.length * lineHeight };
}

function drawCenteredText(ctx, text, zone) {
  const rect = getSafeRect(zone);
  const fitted = fitText(ctx, text, rect);
  const startY = rect.y + (rect.h - fitted.totalHeight) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  setFont(ctx, fitted.size); ctx.fillStyle = TEXT_STYLE.color; ctx.textAlign = TEXT_STYLE.align; ctx.textBaseline = "top";
  fitted.lines.forEach((line, index) => { ctx.fillText(line, rect.centerX, startY + index * fitted.lineHeight); });
  ctx.restore();
}

async function createFrame(image, text, filePath) {
  const canvas = createCanvas(CANVAS.width, CANVAS.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, CANVAS.width, CANVAS.height);
  drawCenteredText(ctx, text, SAFE_ZONE);
  fs.writeFileSync(filePath, await canvas.encode("png"));
}

async function createBratImage(text, outputFile) {
  const [imageBuffer, fontBuffer] = await Promise.all([downloadBuffer(BRAT_IMAGE_URL), downloadBuffer(BRAT_FONT_URL)]);
  GlobalFonts.register(fontBuffer, TEXT_STYLE.fontFamily);
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(CANVAS.width, CANVAS.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, CANVAS.width, CANVAS.height);
  drawCenteredText(ctx, text, SAFE_ZONE);
  fs.writeFileSync(outputFile, await canvas.encode("png"));
  return outputFile;
}

function buildManifest(frames, framePaths) {
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    lines.push(`file '${framePaths[i].replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${frames[i].duration}`);
  }
  lines.push(`file '${framePaths[framePaths.length - 1].replace(/'/g, "'\\''")}'`);
  return lines.join("\n");
}

async function createBratVideo(text, outputPath, config) {
  const frames = buildRevealFrames(text, config);
  if (!frames.length) throw new Error("Teks kosong");
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "bratvid-"));
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });
  try {
    const [imageBuffer, fontBuffer] = await Promise.all([downloadBuffer(BRAT_IMAGE_URL), downloadBuffer(BRAT_FONT_URL)]);
    GlobalFonts.register(fontBuffer, TEXT_STYLE.fontFamily);
    const image = await loadImage(imageBuffer);
    const framePaths = frames.map((_, index) => path.join(tmpDir, `frame-${String(index + 1).padStart(4, "0")}.png`));

    const batchSize = 5;
    for (let start = 0; start < frames.length; start += batchSize) {
      const batch = frames.slice(start, start + batchSize);
      await Promise.all(batch.map((frame, i) => createFrame(image, frame.text, framePaths[start + i])));
    }

    const concatPath = path.join(tmpDir, "concat.txt");
    fs.writeFileSync(concatPath, buildManifest(frames, framePaths));

    await execFileAsync("ffmpeg", [
      "-y", "-f", "concat", "-safe", "0", "-i", concatPath,
      "-vf", `fps=${config.fps},scale=${config.width}:${config.height}:flags=lanczos`,
      "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      outputPath
    ]);
    return outputPath;
  } finally {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = {
  command: ['bratgojo', 'bratvidgojo'],
  handler: async (sock, m, { text, prefix, command }) => {
    if (!text) return sock.sendMessage(m.chat, { text: `[!] Cara pakai:\n${prefix}${command} teks kamu` }, { quoted: m });
    if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const inputText = normalizeText(text);

      if (command === 'bratvidgojo') {
          const outputPath = path.join(tempDir, `gojo-bratvid-${Date.now()}.mp4`);
          await createBratVideo(inputText, outputPath, VIDEO_CONFIG);
          await sock.sendMessage(m.chat, { video: { url: outputPath }, caption: "Done!" }, { quoted: m });
          fs.unlinkSync(outputPath);
      } else {
          const outputPath = path.join(tempDir, `gojo-brat-${Date.now()}.png`);
          await createBratImage(inputText, outputPath);
          await sock.sendMessage(m.chat, { image: { url: outputPath }, caption: "Done!" }, { quoted: m });
          fs.unlinkSync(outputPath);
      }

      if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
      console.error(e);
      if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await sock.sendMessage(m.chat, { text: `[!] Error: ${e.message}` }, { quoted: m });
    }
  }
};
