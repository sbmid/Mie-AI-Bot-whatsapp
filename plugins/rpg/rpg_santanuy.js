/*
 * © NEXENT-AI
 * Since     : 2024 - 2026
 *
 * BY : SANTANAAAAWWW
 * Channel   : https://whatsapp.com/channel/0029VbCTlS3E50Upxzg3k81n
 */

const fs = require('fs')
const path = require('path')
let createCanvas, loadImage
try {
    const canvasMod = require("canvas")
    createCanvas = canvasMod.createCanvas
    loadImage = canvasMod.loadImage
} catch(e) { createCanvas = null; loadImage = null }
const rpgDBPath = './library/database/rpg.json'
const userDBPath = './library/database/user.json'
const limitBonusPath = './library/database/limit_bonus.json'
const marketDBPath = './library/database/market.json'
const pantiDBPath = './library/database/panti_asuhan.json'

// Pastikan folder library/database selalu ada sebelum operasi file apapun
try { require('fs').mkdirSync('./library/database', { recursive: true }) } catch(e) {}
const toRupiah = (n) => {
    const num = Number(n) || 0
    return 'Rp. ' + num.toLocaleString('id-ID')
}
// ═══════════════════════════════════════════════════════
//  CANVAS LEADERBOARD HELPER — tanpa emoji, pakai teks
// ═══════════════════════════════════════════════════════
async function generateLeaderboardCanvas(title, subtitle, rows) {
    // rows: array of { rank, label, value, extra }
    if (!createCanvas) return null

    // Dimensi logis
    const W = 600, HEADER = 120, ROW_H = 60, FOOTER = 44
    const H = HEADER + rows.length * ROW_H + FOOTER

    // HD: render 2x supaya tajam
    const SCALE  = 2
    const canvas = createCanvas(W * SCALE, H * SCALE)
    const ctx    = canvas.getContext('2d')
    ctx.scale(SCALE, SCALE)

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#1a1a2e')
    bg.addColorStop(1, '#16213e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Accent bar atas
    const accentGrad = ctx.createLinearGradient(0, 0, W, 0)
    accentGrad.addColorStop(0, '#c89b3c')
    accentGrad.addColorStop(0.5, '#f0d080')
    accentGrad.addColorStop(1, '#c89b3c')
    ctx.fillStyle = accentGrad
    ctx.fillRect(0, 0, W, 5)

    // Header title
    ctx.fillStyle = '#f0d080'
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(title, W / 2, 50)

    ctx.fillStyle = '#9999bb'
    ctx.font = '15px sans-serif'
    ctx.fillText(subtitle, W / 2, 76)

    // Garis bawah header
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, HEADER - 12)
    ctx.lineTo(W - 20, HEADER - 12)
    ctx.stroke()

    // Helper: truncate teks agar tidak melebihi maxWidth px
    const truncate = (text, font, maxWidth) => {
        ctx.font = font
        if (ctx.measureText(text).width <= maxWidth) return text
        let t = text
        while (t.length > 1 && ctx.measureText(t + '...').width > maxWidth) t = t.slice(0, -1)
        return t + '...'
    }

    // Rows
    const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']
    const VALUE_FONT  = 'bold 15px sans-serif'
    const LABEL_FONT  = '17px sans-serif'
    const EXTRA_FONT  = '13px sans-serif'
    const VALUE_MAX_W = 210   // maks lebar kolom value agar tidak nabrak nama
    const LABEL_MAX_W = 230   // maks lebar kolom nama

    rows.forEach((row, i) => {
        const y         = HEADER + i * ROW_H
        const rankColor = RANK_COLORS[i] || '#7777aa'
        const midY      = y + ROW_H / 2

        // alternating row bg
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.10)'
        ctx.fillRect(10, y + 3, W - 20, ROW_H - 6)

        // Rank
        ctx.font = 'bold 19px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillStyle = rankColor
        ctx.fillText(`#${row.rank}`, 20, midY + 7)

        // Label (nomor/nama) — full, truncate kalau kepanjangan
        ctx.fillStyle = '#eeeeff'
        ctx.fillText(truncate(String(row.label), LABEL_FONT, LABEL_MAX_W), 72, midY + 1)

        // Extra (level/class)
        if (row.extra) {
            ctx.fillStyle = '#7788aa'
            ctx.font = EXTRA_FONT
            ctx.fillText(row.extra, 72, midY + 18)
        }

        // Value kanan — truncate dengan "..." jika terlalu panjang
        ctx.font = VALUE_FONT
        ctx.textAlign = 'right'
        ctx.fillStyle = rankColor
        ctx.fillText(truncate(String(row.value), VALUE_FONT, VALUE_MAX_W), W - 18, midY + 7)
    })

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, H - FOOTER, W, 1)
    ctx.fillStyle = '#555577'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('RPG Bot  Nexent - AI', W / 2, H - 16)

    return canvas.toBuffer('image/png')
}


if (!fs.existsSync(pantiDBPath)) {
    fs.writeFileSync(pantiDBPath, JSON.stringify({ anak: [] }, null, 2))
}
if (!fs.existsSync(rpgDBPath)) {
    const defaultRPG = {
        players: {},
        monsters: {
            // 
            //  ⭐ TIER 1 — PEMULA (Level 1–5)
            // 
            "1":  { "name": "🐀 Tikus Got",         "hp": 18,  "attack": 5,   "defense": 1,  "exp": 10,   "gold": 500,    "level": 1,  "tier": 1, "drops": { "kulit_goblin": 0.4 } },
            "2":  { "name": "🐛 Ulat Beracun",       "hp": 22,  "attack": 6,   "defense": 1,  "exp": 12,   "gold": 700,    "level": 1,  "tier": 1, "drops": { "racun_laba": 0.5, "rumput_liar": 0.6 } },
            "3":  { "name": "🐸 Katak Raksasa",      "hp": 28,  "attack": 8,   "defense": 2,  "exp": 16,   "gold": 1000,   "level": 2,  "tier": 1, "drops": { "kulit_goblin": 0.5, "jamur_ajaib": 0.2 } },
            "4":  { "name": "👺 Goblin",              "hp": 35,  "attack": 9,   "defense": 2,  "exp": 18,   "gold": 1200,   "level": 2,  "tier": 1, "drops": { "kulit_goblin": 0.7, "taring_goblin": 0.3 } },
            "5":  { "name": "🐺 Serigala Kecil",     "hp": 42,  "attack": 10,  "defense": 3,  "exp": 22,   "gold": 1500,   "level": 3,  "tier": 1, "drops": { "kulit_goblin": 0.4, "taring_goblin": 0.2 } },
            "6":  { "name": "🦎 Kadal Pasir",        "hp": 38,  "attack": 10,  "defense": 4,  "exp": 20,   "gold": 1300,   "level": 3,  "tier": 1, "drops": { "kulit_goblin": 0.5, "batu": 0.8 } },
            "7":  { "name": "🐝 Lebah Raksasa",      "hp": 30,  "attack": 11,  "defense": 2,  "exp": 16,   "gold": 1100,   "level": 2,  "tier": 1, "drops": { "racun_laba": 0.4, "bunga_langka": 0.3 } },
            "8":  { "name": "🌿 Tanaman Berjalan",   "hp": 50,  "attack": 8,   "defense": 5,  "exp": 20,   "gold": 1000,   "level": 3,  "tier": 1, "drops": { "rumput_liar": 0.9, "bunga_langka": 0.2 } },

            // 
            //  ⭐⭐ TIER 2 — MENENGAH BAWAH (Level 5–10)
            // 
            "9":  { "name": "🕷️ Laba-laba Raksasa",  "hp": 55,  "attack": 12,  "defense": 4,  "exp": 30,   "gold": 3000,   "level": 4,  "tier": 2, "drops": { "racun_laba": 0.6, "kulit_goblin": 0.2 } },
            "10": { "name": "🐗 Babi Hutan Liar",    "hp": 65,  "attack": 14,  "defense": 5,  "exp": 38,   "gold": 4500,   "level": 5,  "tier": 2, "drops": { "kulit_orc": 0.4, "batu_kekuatan": 0.1 } },
            "11": { "name": "💀 Goblin Pemanah",     "hp": 58,  "attack": 15,  "defense": 4,  "exp": 35,   "gold": 4000,   "level": 5,  "tier": 2, "drops": { "taring_goblin": 0.7, "batu_bara": 0.3 } },
            "12": { "name": "🧟 Zombie Prajurit",    "hp": 72,  "attack": 14,  "defense": 6,  "exp": 42,   "gold": 5000,   "level": 5,  "tier": 2, "drops": { "kulit_orc": 0.3, "batu_kekuatan": 0.1 } },
            "13": { "name": "🐊 Buaya Sungai",       "hp": 78,  "attack": 16,  "defense": 7,  "exp": 45,   "gold": 6000,   "level": 6,  "tier": 2, "drops": { "kulit_orc": 0.5, "racun_laba": 0.2 } },
            "14": { "name": "🧌 Orc Prajurit",       "hp": 85,  "attack": 17,  "defense": 7,  "exp": 50,   "gold": 7000,   "level": 6,  "tier": 2, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.15 } },
            "15": { "name": "🦂 Kalajengking Bara",  "hp": 68,  "attack": 18,  "defense": 5,  "exp": 42,   "gold": 6000,   "level": 6,  "tier": 2, "drops": { "racun_laba": 0.7, "batu_bara": 0.4 } },
            "16": { "name": "🐻 Beruang Hutan",      "hp": 95,  "attack": 16,  "defense": 8,  "exp": 55,   "gold": 8000,   "level": 7,  "tier": 2, "drops": { "kulit_orc": 0.5, "taring_goblin": 0.3 } },

            // 
            //  ⭐⭐⭐ TIER 3 — MENENGAH (Level 8–15)
            // 
            "17": { "name": "👹 Goblin Jendral",     "hp": 100, "attack": 22,  "defense": 8,  "exp": 90,   "gold": 15000,  "level": 7,  "tier": 3, "drops": { "batu_kekuatan": 0.5, "taring_goblin": 0.8 } },
            "18": { "name": "🌊 Troll Rawa",         "hp": 115, "attack": 24,  "defense": 9,  "exp": 75,   "gold": 12000,  "level": 8,  "tier": 3, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.25 } },
            "19": { "name": "🦁 Singa Berbisa",      "hp": 120, "attack": 26,  "defense": 8,  "exp": 80,   "gold": 13000,  "level": 8,  "tier": 3, "drops": { "racun_laba": 0.5, "batu_kekuatan": 0.3 } },
            "20": { "name": "🌲 Troll Hutan",        "hp": 130, "attack": 25,  "defense": 10, "exp": 88,   "gold": 14000,  "level": 9,  "tier": 3, "drops": { "kulit_orc": 0.4, "batu_kekuatan": 0.2 } },
            "21": { "name": "🐍 Ular Raksasa Biru",  "hp": 110, "attack": 28,  "defense": 7,  "exp": 85,   "gold": 14000,  "level": 9,  "tier": 3, "drops": { "racun_laba": 0.8, "kristal_es": 0.15 } },
            "22": { "name": "🧙 Penyihir Gelap",     "hp": 95,  "attack": 30,  "defense": 6,  "exp": 90,   "gold": 16000,  "level": 10, "tier": 3, "drops": { "batu_kekuatan": 0.4, "permata": 0.1 } },
            "23": { "name": "🦅 Elang Api Kecil",    "hp": 105, "attack": 27,  "defense": 7,  "exp": 82,   "gold": 13000,  "level": 9,  "tier": 3, "drops": { "bulu_phoenix": 0.15, "batu_kekuatan": 0.3 } },
            "24": { "name": "⚔️ Ksatria Mati",       "hp": 140, "attack": 28,  "defense": 12, "exp": 100,  "gold": 18000,  "level": 10, "tier": 3, "drops": { "bijih_besi": 0.6, "batu_kekuatan": 0.35 } },

            // 
            //  ⭐⭐⭐⭐ TIER 4 — KUAT (Level 12–18)
            // 
            "25": { "name": "🐲 Naga Kecil",         "hp": 165, "attack": 32,  "defense": 12, "exp": 120,  "gold": 30000,  "level": 11, "tier": 4, "drops": { "sisik_naga": 0.4, "batu_kekuatan": 0.3 } },
            "26": { "name": "🌋 Elemental Api",      "hp": 155, "attack": 36,  "defense": 11, "exp": 130,  "gold": 35000,  "level": 12, "tier": 4, "drops": { "batu_kekuatan": 0.5, "permata": 0.2 } },
            "27": { "name": "❄️ Elemental Es",       "hp": 148, "attack": 34,  "defense": 13, "exp": 125,  "gold": 32000,  "level": 12, "tier": 4, "drops": { "kristal_es": 0.6, "batu_kekuatan": 0.25 } },
            "28": { "name": "🦈 Hiu Daratan",        "hp": 160, "attack": 38,  "defense": 10, "exp": 135,  "gold": 38000,  "level": 13, "tier": 4, "drops": { "kulit_orc": 0.3, "tulang_naga": 0.1 } },
            "29": { "name": "🧿 Beholder",           "hp": 178, "attack": 35,  "defense": 14, "exp": 145,  "gold": 42000,  "level": 13, "tier": 4, "drops": { "permata": 0.3, "batu_kekuatan": 0.4 } },
            "30": { "name": "🦴 Raja Zombie",        "hp": 185, "attack": 37,  "defense": 13, "exp": 155,  "gold": 48000,  "level": 14, "tier": 4, "drops": { "tulang_naga": 0.15, "mithril": 0.05 } },
            "31": { "name": "🌪️ Djinn Badai",        "hp": 165, "attack": 42,  "defense": 11, "exp": 160,  "gold": 55000,  "level": 14, "tier": 4, "drops": { "kristal_es": 0.4, "permata": 0.25 } },
            "32": { "name": "🐯 Harimau Roh",        "hp": 172, "attack": 40,  "defense": 12, "exp": 150,  "gold": 50000,  "level": 13, "tier": 4, "drops": { "batu_kekuatan": 0.45, "kristal_es": 0.2 } },

            // 
            //  ⭐⭐⭐⭐⭐ TIER 5 — SANGAT KUAT (Level 16–22)
            // 
            "33": { "name": "🐉 Naga",               "hp": 210, "attack": 45,  "defense": 16, "exp": 200,  "gold": 80000,  "level": 15, "tier": 5, "drops": { "sisik_naga": 0.5, "tulang_naga": 0.2, "batu_kekuatan": 0.3 } },
            "34": { "name": "🦊 Serigala Roh",       "hp": 195, "attack": 42,  "defense": 14, "exp": 180,  "gold": 70000,  "level": 15, "tier": 5, "drops": { "kristal_es": 0.4, "batu_kekuatan": 0.2 } },
            "35": { "name": "🌑 Wraith Kegelapan",   "hp": 190, "attack": 48,  "defense": 12, "exp": 210,  "gold": 90000,  "level": 16, "tier": 5, "drops": { "permata": 0.4, "mithril": 0.08 } },
            "36": { "name": "🗿 Golem Batu",         "hp": 260, "attack": 40,  "defense": 24, "exp": 230,  "gold": 95000,  "level": 17, "tier": 5, "drops": { "batu_kekuatan": 0.6, "mithril": 0.1, "permata": 0.2 } },
            "37": { "name": "🧊 Ice Drake",          "hp": 240, "attack": 46,  "defense": 20, "exp": 250,  "gold": 105000, "level": 17, "tier": 5, "drops": { "kristal_es": 0.6, "tulang_naga": 0.3 } },
            "38": { "name": "🌊 Leviathan Kecil",    "hp": 255, "attack": 44,  "defense": 18, "exp": 260,  "gold": 110000, "level": 18, "tier": 5, "drops": { "sisik_naga": 0.4, "tulang_naga": 0.25 } },
            "39": { "name": "🔥 Ifrit",              "hp": 225, "attack": 52,  "defense": 16, "exp": 240,  "gold": 100000, "level": 17, "tier": 5, "drops": { "bulu_phoenix": 0.3, "permata": 0.3 } },
            "40": { "name": "⚡ Raksasa Petir",      "hp": 248, "attack": 50,  "defense": 17, "exp": 235,  "gold": 98000,  "level": 18, "tier": 5, "drops": { "kristal_es": 0.5, "mithril": 0.1 } },

            // 
            //  💀 TIER 6 — BOSS KELAS (Level 20–28)
            // 
            "41": { "name": "🦅 Phoenix",            "hp": 290, "attack": 55,  "defense": 20, "exp": 320,  "gold": 180000, "level": 20, "tier": 6, "drops": { "bulu_phoenix": 0.5, "sisik_naga": 0.3 } },
            "42": { "name": "👑 Lich King",          "hp": 400, "attack": 62,  "defense": 25, "exp": 450,  "gold": 300000, "level": 22, "tier": 6, "drops": { "orichalcum": 0.2, "bulu_phoenix": 0.3, "mithril": 0.5 } },
            "43": { "name": "🐲 Naga Tua",           "hp": 380, "attack": 60,  "defense": 24, "exp": 400,  "gold": 250000, "level": 21, "tier": 6, "drops": { "sisik_naga": 0.6, "tulang_naga": 0.4, "mithril": 0.15 } },
            "44": { "name": "🕯️ Overlord Sihir",     "hp": 350, "attack": 68,  "defense": 20, "exp": 450,  "gold": 280000, "level": 22, "tier": 6, "drops": { "permata": 0.5, "mithril": 0.2, "orichalcum": 0.08 } },
            "45": { "name": "🦂 Kalajengking Raksasa","hp": 400, "attack": 58,  "defense": 28, "exp": 380,  "gold": 240000, "level": 21, "tier": 6, "drops": { "racun_laba": 0.8, "mithril": 0.1, "permata": 0.3 } },
            "46": { "name": "🌀 Void Walker",        "hp": 370, "attack": 65,  "defense": 22, "exp": 420,  "gold": 270000, "level": 23, "tier": 6, "drops": { "mithril": 0.25, "orichalcum": 0.1 } },

            // 
            //  💀💀 TIER 7 — ELITE (Level 25–35)
            // 
            "47": { "name": "🌑 Demon Lord",         "hp": 520, "attack": 80,  "defense": 32, "exp": 600,  "gold": 500000, "level": 25, "tier": 7, "drops": { "orichalcum": 0.25, "mithril": 0.4, "tulang_naga": 0.5 } },
            "48": { "name": "🐉 Naga Merah Purba",   "hp": 580, "attack": 75,  "defense": 35, "exp": 680,  "gold": 600000, "level": 27, "tier": 7, "drops": { "sisik_naga": 0.8, "tulang_naga": 0.6, "orichalcum": 0.2 } },
            "49": { "name": "⚔️ Ksatria Iblis",      "hp": 490, "attack": 85,  "defense": 30, "exp": 640,  "gold": 550000, "level": 26, "tier": 7, "drops": { "mithril": 0.5, "orichalcum": 0.15, "permata": 0.4 } },
            "50": { "name": "🌊 Leviathan",          "hp": 620, "attack": 72,  "defense": 38, "exp": 720,  "gold": 650000, "level": 28, "tier": 7, "drops": { "tulang_naga": 0.7, "orichalcum": 0.2, "kristal_es": 0.5 } },
            "51": { "name": "🦴 Necromancer Agung",  "hp": 460, "attack": 90,  "defense": 28, "exp": 700,  "gold": 620000, "level": 27, "tier": 7, "drops": { "orichalcum": 0.3, "mithril": 0.45, "bulu_phoenix": 0.4 } },

            // 
            //  ☠️ TIER 8 — LEGENDA (Level 30–40)
            // 
            "52": { "name": "🌋 Titan Api",          "hp": 750, "attack": 100, "defense": 45, "exp": 950,  "gold": 1200000,"level": 30, "tier": 8, "drops": { "orichalcum": 0.35, "bulu_phoenix": 0.5, "mithril": 0.6 } },
            "53": { "name": "❄️ Titan Es",           "hp": 780, "attack": 95,  "defense": 50, "exp": 1000, "gold": 1300000,"level": 32, "tier": 8, "drops": { "kristal_es": 0.8, "orichalcum": 0.3, "mithril": 0.55 } },
            "54": { "name": "🌑 Abyssal Horror",     "hp": 850, "attack": 110, "defense": 42, "exp": 1200, "gold": 1500000,"level": 33, "tier": 8, "drops": { "orichalcum": 0.4, "mithril": 0.65, "permata": 0.5 } },
            "55": { "name": "🐲 Naga Hitam Kuno",    "hp": 900, "attack": 105, "defense": 55, "exp": 1350, "gold": 1800000,"level": 35, "tier": 8, "drops": { "sisik_naga": 1.0, "tulang_naga": 0.8, "orichalcum": 0.35 } },

            // 
            //  💥 TIER 9 — MITOLOGI (Level 38–50)
            // 
            "56": { "name": "👁️ Dewa Kegelapan",     "hp": 1200,"attack": 135, "defense": 65, "exp": 2000, "gold": 3000000,"level": 38, "tier": 9, "drops": { "orichalcum": 0.5, "mithril": 0.8, "bulu_phoenix": 0.6 } },
            "57": { "name": "🔱 Poseidon Palsu",     "hp": 1300,"attack": 125, "defense": 75, "exp": 2500, "gold": 3500000,"level": 40, "tier": 9, "drops": { "orichalcum": 0.55, "tulang_naga": 1.0, "kristal_es": 0.7 } },
            "58": { "name": "☄️ Meteor Golem",       "hp": 1400,"attack": 120, "defense": 85, "exp": 3000, "gold": 4000000,"level": 42, "tier": 9, "drops": { "orichalcum": 0.6, "permata": 0.8, "mithril": 0.9 } },
            "59": { "name": "🌑 Void Dragon",        "hp": 1500,"attack": 145, "defense": 70, "exp": 3500, "gold": 5000000,"level": 45, "tier": 9, "drops": { "orichalcum": 0.65, "sisik_naga": 1.0, "tulang_naga": 1.0 } },

            // 
            //  🌟 TIER 10 — DEWA (Level 50+)
            // 
            "60": { "name": "⚡ Zeus Terlarang",     "hp": 2000,"attack": 170, "defense": 90, "exp": 5000, "gold": 8000000,"level": 50, "tier": 10, "drops": { "orichalcum": 0.8, "mithril": 1.0, "bulu_phoenix": 0.9 } },
            "61": { "name": "🔥 Surtr Sang Api",     "hp": 2500,"attack": 185, "defense": 85, "exp": 6000, "gold":10000000,"level": 52, "tier": 10, "drops": { "orichalcum": 0.85, "bulu_phoenix": 1.0, "tulang_naga": 1.0 } },
            "62": { "name": "💀 Azrael Si Maut",     "hp": 3000,"attack": 200, "defense": 100,"exp": 8000, "gold":15000000,"level": 55, "tier": 10, "drops": { "orichalcum": 1.0, "mithril": 1.0, "permata": 1.0, "bulu_phoenix": 1.0 } },
            "63": { "name": "🌌 Chaos Dragon",      "hp": 5000,"attack": 250, "defense": 130,"exp":12000, "gold":25000000,"level": 60, "tier": 10, "drops": { "orichalcum": 1.0, "mithril": 1.0, "sisik_naga": 1.0, "tulang_naga": 1.0, "bulu_phoenix": 1.0 } }
        },
        locations: {
            // ══ Tier 1 ══
            "desa":         { "name": "🏡 Desa Pemula",        "monsters": [1,2,3,4,5,6,7,8],         "minLevel": 1,  "maxLevel": 5  },
            // ══ Tier 2 ══
            "hutan":        { "name": "🌲 Hutan Gelap",        "monsters": [4,5,8,9,10,11,12],         "minLevel": 3,  "maxLevel": 9  },
            "rawa":         { "name": "🌿 Rawa Beracun",       "monsters": [9,11,13,15,16],             "minLevel": 5,  "maxLevel": 10 },
            // ══ Tier 3 ══
            "gua":          { "name": "⛏️ Gua Naga",           "monsters": [14,17,18,19,20,21,22,23,24],"minLevel": 8,  "maxLevel": 16 },
            "padang_api":   { "name": "🌋 Padang Api",         "monsters": [15,22,23,26,31],            "minLevel": 10, "maxLevel": 18 },
            // ══ Tier 4 ══
            "pegunungan":   { "name": "🏔️ Pegunungan Es",      "monsters": [27,29,31,32,34,37],         "minLevel": 12, "maxLevel": 20 },
            "reruntuhan":   { "name": "🏚️ Reruntuhan Kuno",    "monsters": [24,28,29,30,36],            "minLevel": 13, "maxLevel": 20 },
            // ══ Tier 5 ══
            "kuil_api":     { "name": "🔥 Kuil Api Abadi",     "monsters": [33,35,39,40,41],            "minLevel": 16, "maxLevel": 24 },
            "laut_dalam":   { "name": "🌊 Laut Dalam",         "monsters": [34,38,40,43,50],            "minLevel": 17, "maxLevel": 25 },
            // ══ Tier 6 ══
            "menara_sihir": { "name": "🗼 Menara Sihir",       "monsters": [42,44,46,47,51],            "minLevel": 20, "maxLevel": 30 },
            "hutan_iblis":  { "name": "😈 Hutan Iblis",        "monsters": [43,45,47,48,49],            "minLevel": 22, "maxLevel": 32 },
            // ══ Tier 7 ══
            "neraka_atas":  { "name": "🌑 Gerbang Neraka",     "monsters": [47,48,49,50,51,52],         "minLevel": 25, "maxLevel": 35 },
            "samudera_void":{ "name": "🌀 Samudera Void",      "monsters": [46,50,53,54,55],            "minLevel": 28, "maxLevel": 38 },
            // ══ Tier 8 ══
            "gunung_titan": { "name": "⚡ Gunung Titan",       "monsters": [52,53,54,55,56],            "minLevel": 30, "maxLevel": 45 },
            // ══ Tier 9 ══
            "alam_dewa":    { "name": "👁️ Alam Para Dewa",     "monsters": [56,57,58,59],               "minLevel": 38, "maxLevel": 52 },
            // ══ Tier 10 ══
            "kekacauan":    { "name": "🌌 Dimensi Kekacauan",  "monsters": [60,61,62,63],               "minLevel": 50, "maxLevel": 999 },
            // ══ Tier 11 — BEYOND GOD ══
            "dimensi_supremasi": { "name": "👁️‍🗨️ Dimensi Supremasi", "monsters": [60,61,62,63],  "minLevel": 65, "maxLevel": 999 },
            "batas_semesta":     { "name": "🌠 Batas Alam Semesta",  "monsters": [61,62,63],      "minLevel": 75, "maxLevel": 99  },
            "alam_mutlak":       { "name": "💫 Alam Mutlak Absolut", "monsters": [61,62,63],      "minLevel": 90, "maxLevel": 999 },
            // ══ Resource Zones ══
            "tambang":      { "name": "⛏️ Tambang Terbengkalai","minLevel": 5,  "maxLevel": 30, "ores": { "batu": 0.8, "batu_bara": 0.5, "bijih_besi": 0.2, "permata": 0.05, "mithril": 0.02, "orichalcum": 0.005 } },
            "padang_rumput":{ "name": "🌾 Padang Rumput Liar", "minLevel": 2,  "maxLevel": 20, "herbs": { "rumput_liar": 0.9, "bunga_langka": 0.3, "jamur_ajaib": 0.1, "kristal_es": 0.05 } }
        },
        items: {
            "potion": { "name": "Potion", "type": "heal", "value": 30, "price": 5000 },
            "potion_besar": { "name": "Potion Besar", "type": "heal", "value": 80, "price": 25000 },
            "potion_super": { "name": "Super Potion", "type": "heal", "value": 150, "price": 75000 },
            "elixir_hidup": { "name": "Elixir Kehidupan", "type": "heal", "value": 999, "price": 500000 },
            "limit_bot_10": { "name": "10 Limit Bot", "type": "bot_feature", "value": 10, "price": 1000000 },
            "limit_bot_50": { "name": "50 Limit Bot", "type": "bot_feature", "value": 50, "price": 4000000 },
            "luck_potion": { "name": "🍀 Luck Potion", "type": "fishing_buff", "duration": 1800000, "boost": 30, "price": 50000, "desc": "Boost luck mancing +30 untuk 1 grup selama 30 menit." },
            "luck_super_potion": { "name": "🍀 Super Luck Potion", "type": "fishing_buff", "duration": 3600000, "boost": 300, "price": 500000, "desc": "Boost luck mancing x10 (boost 300) untuk 1 grup selama 1 jam! Potion luck legendaris." },
            "elixir": { "name": "Elixir", "type": "mana", "value": 25, "price": 8000 },
            "elixir_besar": { "name": "Elixir Besar", "type": "mana", "value": 60, "price": 35000 },
            "elixir_mana_penuh": { "name": "Mana Crystal", "type": "mana", "value": 999, "price": 300000 },
            // Senjata
            "pedang_kayu": { "name": "Pedang Kayu", "type": "weapon", "attack": 2, "price": 15000 },
            "pedang_besi": { "name": "Pedang Besi", "type": "weapon", "attack": 5, "price": 150000 },
            "pedang_baja": { "name": "Pedang Baja", "type": "weapon", "attack": 10, "price": 1500000 },
            "pedang_mithril": { "name": "Pedang Mithril", "type": "weapon", "attack": 18, "price": 15000000 },
            "pedang_naga": { "name": "Pedang Naga", "type": "weapon", "attack": 30, "price": 200000000 },
            "tongkat_sihir": { "name": "Tongkat Sihir", "type": "weapon", "attack": 8, "price": 500000 },
            "tongkat_kuno": { "name": "Tongkat Kuno", "type": "weapon", "attack": 20, "price": 50000000 },
            "busur_kayu": { "name": "Busur Kayu", "type": "weapon", "attack": 4, "price": 25000 },
            "busur_besi": { "name": "Busur Besi", "type": "weapon", "attack": 9, "price": 300000 },
            "busur_elven": { "name": "Busur Elven", "type": "weapon", "attack": 22, "price": 80000000 },
            // Armor
            "baju_kain": { "name": "Baju Kain", "type": "armor", "defense": 1, "price": 5000 },
            "zirah_kulit": { "name": "Zirah Kulit", "type": "armor", "defense": 3, "price": 50000 },
            "zirah_besi": { "name": "Zirah Besi", "type": "armor", "defense": 7, "price": 500000 },
            "zirah_baja": { "name": "Zirah Baja", "type": "armor", "defense": 14, "price": 5000000 },
            "jubah_penyihir": { "name": "Jubah Penyihir", "type": "armor", "defense": 5, "price": 800000 },
            "zirah_mithril": { "name": "Zirah Mithril", "type": "armor", "defense": 25, "price": 100000000 },
            "perisai_kayu": { "name": "Perisai Kayu", "type": "armor", "defense": 2, "price": 10000 },
            "perisai_besi": { "name": "Perisai Besi", "type": "armor", "defense": 6, "price": 250000 },
            // Material
            "kulit_goblin": { "name": "Kulit Goblin", "type": "material", "price": 2000 },
            "taring_goblin": { "name": "Taring Goblin", "type": "material", "price": 5000 },
            "kulit_orc": { "name": "Kulit Orc", "type": "material", "price": 10000 },
            "batu_kekuatan": { "name": "Batu Kekuatan", "type": "material", "price": 50000 },
            "sisik_naga": { "name": "Sisik Naga", "type": "material", "price": 150000 },
            "tulang_naga": { "name": "Tulang Naga", "type": "material", "price": 500000 },
            "racun_laba": { "name": "Racun Laba-laba", "type": "material", "price": 30000 },
            "bulu_phoenix": { "name": "Bulu Phoenix", "type": "material", "price": 1000000 },
            "kristal_es": { "name": "Kristal Es", "type": "material", "price": 200000 },
            "batu": { "name": "Batu", "type": "material", "price": 500 },
            "batu_bara": { "name": "Batu Bara", "type": "material", "price": 8000 },
            "bijih_besi": { "name": "Bijih Besi", "type": "material", "price": 25000 },
            "permata": { "name": "Permata", "type": "material", "price": 500000 },
            "rumput_liar": { "name": "Rumput Liar", "type": "material", "price": 1000 },
            "bunga_langka": { "name": "Bunga Langka", "type": "material", "price": 75000 },
            "jamur_ajaib": { "name": "Jamur Ajaib", "type": "material", "price": 150000 },
            "nikel": { "name": "Nikel", "type": "material", "price": 100000 },
            "emas": { "name": "Emas", "type": "material", "price": 2500000 },
            "berlian": { "name": "Berlian", "type": "material", "price": 10000000 },
            "mithril": { "name": "Mithril", "type": "material", "price": 25000000 },
            "orichalcum": { "name": "Orichalcum", "type": "material", "price": 100000000 },
            // ── SENJATA ULTRA PREMIUM ──
            "pedang_dewa": { "name": "Pedang Dewa", "type": "weapon", "attack": 50, "price": 2000000000 },
            "tombak_halilintar": { "name": "Tombak Halilintar", "type": "weapon", "attack": 45, "price": 1500000000 },
            "katana_jiwa": { "name": "Katana Jiwa", "type": "weapon", "attack": 40, "price": 800000000 },
            "busur_abadi": { "name": "Busur Abadi", "type": "weapon", "attack": 38, "price": 600000000 },
            "tongkat_dewa": { "name": "Tongkat Dewa", "type": "weapon", "attack": 35, "price": 500000000 },
            // ── SENJATA BARU ──
            "pedang_void": { "name": "Pedang Void", "type": "weapon", "attack": 70, "price": 8000000000 },
            // ── SENJATA TIER MUTLAK ──
            "pedang_abadi": { "name": "Pedang Abadi Mutlak", "type": "weapon", "attack": 120, "price": 50000000000 },
            "tombak_semesta": { "name": "Tombak Semesta", "type": "weapon", "attack": 110, "price": 35000000000 },
            "katana_dewa_agung": { "name": "Katana Dewa Agung", "type": "weapon", "attack": 100, "price": 25000000000 },
            "busur_kehancuran": { "name": "Busur Kehancuran", "type": "weapon", "attack": 90, "price": 18000000000 },
            "tombak_titan": { "name": "Tombak Titan", "type": "weapon", "attack": 65, "price": 6000000000 },
            "busur_chaos": { "name": "Busur Chaos", "type": "weapon", "attack": 60, "price": 5000000000 },
            "tongkat_abadi": { "name": "Tongkat Abadi", "type": "weapon", "attack": 55, "price": 3500000000 },
            "keris_setan": { "name": "Keris Setan", "type": "weapon", "attack": 48, "price": 1200000000 },
            "kapak_berdarah": { "name": "Kapak Berdarah", "type": "weapon", "attack": 42, "price": 900000000 },
            "pedang_kristal": { "name": "Pedang Kristal", "type": "weapon", "attack": 25, "price": 80000000 },
            "tongkat_es": { "name": "Tongkat Es", "type": "weapon", "attack": 22, "price": 60000000 },
            "busur_api": { "name": "Busur Api", "type": "weapon", "attack": 20, "price": 40000000 },
            // ── ARMOR ULTRA PREMIUM ──
            "zirah_dewa": { "name": "Zirah Dewa", "type": "armor", "defense": 50, "price": 2000000000 },
            "jubah_lich": { "name": "Jubah Lich King", "type": "armor", "defense": 40, "price": 1200000000 },
            "perisai_naga": { "name": "Perisai Naga", "type": "armor", "defense": 35, "price": 900000000 },
            "zirah_orichalcum": { "name": "Zirah Orichalcum", "type": "armor", "defense": 45, "price": 1500000000 },
            // ── ARMOR BARU ──
            "jubah_void": { "name": "Jubah Void", "type": "armor", "defense": 70, "price": 8000000000 },
            // ── ARMOR TIER MUTLAK ──
            "baju_dewa_agung": { "name": "Baju Dewa Agung", "type": "armor", "defense": 120, "price": 50000000000 },
            "zirah_semesta": { "name": "Zirah Semesta", "type": "armor", "defense": 110, "price": 35000000000 },
            "perisai_mutlak": { "name": "Perisai Mutlak", "type": "armor", "defense": 100, "price": 25000000000 },
            "jubah_keabadian": { "name": "Jubah Keabadian", "type": "armor", "defense": 90, "price": 18000000000 },
            "zirah_titan": { "name": "Zirah Titan", "type": "armor", "defense": 65, "price": 6000000000 },
            "perisai_chaos": { "name": "Perisai Chaos", "type": "armor", "defense": 60, "price": 5000000000 },
            "zirah_kristal": { "name": "Zirah Kristal", "type": "armor", "defense": 28, "price": 120000000 },
            "jubah_naga": { "name": "Jubah Naga", "type": "armor", "defense": 22, "price": 70000000 },
            "perisai_baja_kuno": { "name": "Perisai Baja Kuno", "type": "armor", "defense": 18, "price": 30000000 },
            // ── SENJATA BEYOND GOD TIER [ATK 90–130] ──
            "busur_kehancuran": { "name": "Busur Kehancuran", "type": "weapon", "attack": 90, "price": 18000000000 },
            "katana_dewa_agung": { "name": "Katana Dewa Agung", "type": "weapon", "attack": 100, "price": 25000000000 },
            "tombak_semesta": { "name": "Tombak Semesta", "type": "weapon", "attack": 110, "price": 35000000000 },
            "pedang_abadi": { "name": "Pedang Abadi Mutlak", "type": "weapon", "attack": 120, "price": 50000000000 },
            "kapak_ragnarok": { "name": "🪓 Kapak Ragnarok", "type": "weapon", "attack": 95, "price": 20000000000 },
            "trisula_poseidon": { "name": "🔱 Trisula Poseidon", "type": "weapon", "attack": 105, "price": 28000000000 },
            "pedang_malaikat_maut": { "name": "☠️ Pedang Malaikat Maut", "type": "weapon", "attack": 115, "price": 42000000000 },
            "tongkat_roh_agung": { "name": "🌀 Tongkat Roh Agung", "type": "weapon", "attack": 125, "price": 55000000000 },
            // ── SENJATA ABSOLUTE TIER [ATK 150–200] ──
            "busur_mutlak": { "name": "✨ Busur Mutlak", "type": "weapon", "attack": 150, "price": 200000000000 },
            "katana_supremasi": { "name": "⚡ Katana Supremasi", "type": "weapon", "attack": 160, "price": 250000000000 },
            "pedang_awal_semesta": { "name": "🌌 Pedang Awal Semesta", "type": "weapon", "attack": 170, "price": 300000000000 },
            "tombak_kehancuran_abadi": { "name": "💀 Tombak Kehancuran Abadi", "type": "weapon", "attack": 180, "price": 350000000000 },
            "tongkat_penciptaan": { "name": "🌟 Tongkat Penciptaan", "type": "weapon", "attack": 190, "price": 420000000000 },
            "pedang_mutlak_absolut": { "name": "💫 Pedang Mutlak Absolut", "type": "weapon", "attack": 200, "price": 500000000000 },
            // ── ARMOR BEYOND GOD TIER [DEF 90–130] ──
            "jubah_keabadian": { "name": "Jubah Keabadian", "type": "armor", "defense": 90, "price": 18000000000 },
            "perisai_mutlak": { "name": "Perisai Mutlak", "type": "armor", "defense": 100, "price": 25000000000 },
            "zirah_semesta": { "name": "Zirah Semesta", "type": "armor", "defense": 110, "price": 35000000000 },
            "baju_dewa_agung": { "name": "Baju Dewa Agung", "type": "armor", "defense": 120, "price": 50000000000 },
            "tameng_ragnarok": { "name": "🪬 Tameng Ragnarok", "type": "armor", "defense": 95, "price": 20000000000 },
            "jubah_roh_suci": { "name": "🌿 Jubah Roh Suci", "type": "armor", "defense": 105, "price": 28000000000 },
            "zirah_malaikat": { "name": "👼 Zirah Malaikat", "type": "armor", "defense": 115, "price": 42000000000 },
            "perisai_abyss": { "name": "🌑 Perisai Abyss", "type": "armor", "defense": 125, "price": 55000000000 },
            // ── ARMOR ABSOLUTE TIER [DEF 160–200] ──
            "jubah_mutlak": { "name": "⚡ Jubah Mutlak", "type": "armor", "defense": 160, "price": 250000000000 },
            "zirah_fajar_abadi": { "name": "🌅 Zirah Fajar Abadi", "type": "armor", "defense": 170, "price": 300000000000 },
            "perisai_supremasi": { "name": "🌌 Perisai Supremasi", "type": "armor", "defense": 180, "price": 350000000000 },
            "jubah_kosmos": { "name": "🌠 Jubah Kosmos", "type": "armor", "defense": 190, "price": 420000000000 },
            "zirah_mutlak_absolut": { "name": "💫 Zirah Mutlak Absolut", "type": "armor", "defense": 200, "price": 500000000000 },
            // ── POTION ULTRA ──
            "megapotion": { "name": "Mega Potion", "type": "heal", "value": 300, "price": 2000000 },
            "divinepotion": { "name": "Divine Potion", "type": "heal", "value": 999, "price": 50000000 },
            "megaelixir": { "name": "Mega Elixir", "type": "mana", "value": 300, "price": 2000000 },
            "divineelixir": { "name": "Divine Elixir", "type": "mana", "value": 999, "price": 50000000 },
            // ── BOT FEATURE PREMIUM ──
            "limit_bot_100": { "name": "100 Limit Bot", "type": "bot_feature", "value": 100, "price": 7000000 },
            "limit_bot_500": { "name": "500 Limit Bot", "type": "bot_feature", "value": 500, "price": 25000000 }
        },
        craftingRecipes: {
            // 
            //  🧪 POTION & ELIXIR
            // 
            "potion_kuat":          { "name": "Potion Besar (craft)",    "result": "potion_besar",    "amount": 2, "materials": { "bunga_langka": 2, "jamur_ajaib": 1 } },
            "super_potion_craft":   { "name": "Super Potion (craft)",    "result": "potion_super",    "amount": 1, "materials": { "bunga_langka": 5, "jamur_ajaib": 3, "kristal_es": 1 } },
            "elixir_hidup_craft":   { "name": "Elixir Kehidupan (craft)","result": "elixir_hidup",   "amount": 1, "materials": { "bulu_phoenix": 1, "bunga_langka": 8, "jamur_ajaib": 5 } },
            "elixir_mana_craft":    { "name": "Elixir Besar (craft)",    "result": "elixir_besar",    "amount": 2, "materials": { "jamur_ajaib": 3, "rumput_liar": 5 } },
            "mana_crystal_craft":   { "name": "Mana Crystal (craft)",    "result": "elixir_mana_penuh","amount": 1,"materials": { "kristal_es": 3, "jamur_ajaib": 5, "bunga_langka": 3 } },
            "mega_potion_craft":    { "name": "Mega Potion (craft)",     "result": "megapotion",      "amount": 1, "materials": { "bulu_phoenix": 2, "sisik_naga": 3, "bunga_langka": 10, "jamur_ajaib": 8 } },
            "divine_potion_craft":  { "name": "Divine Potion (craft)",   "result": "divinepotion",    "amount": 1, "materials": { "orichalcum": 1, "bulu_phoenix": 3, "kristal_es": 5, "bunga_langka": 15 } },
            "mega_elixir_craft":    { "name": "Mega Elixir (craft)",     "result": "megaelixir",      "amount": 1, "materials": { "kristal_es": 5, "racun_laba": 3, "jamur_ajaib": 10, "bunga_langka": 8 } },
            "divine_elixir_craft":  { "name": "Divine Elixir (craft)",   "result": "divineelixir",    "amount": 1, "materials": { "orichalcum": 1, "kristal_es": 8, "bulu_phoenix": 2, "jamur_ajaib": 15 } },
            // 
            //  🗡️ SENJATA — GOBLIN MATERIAL
            // 
            "pedang_goblin":        { "name": "Pedang Goblin (craft)",   "result": "pedang_kayu",     "amount": 1, "materials": { "kulit_goblin": 5, "taring_goblin": 2 } },
            "busur_goblin":         { "name": "Busur Goblin (craft)",    "result": "busur_kayu",      "amount": 1, "materials": { "kulit_goblin": 3, "taring_goblin": 3 } },
            // ── ORC / TROLL ──
            "pedang_orc":           { "name": "Pedang Besi (craft)",     "result": "pedang_besi",     "amount": 1, "materials": { "bijih_besi": 5, "kulit_orc": 3, "taring_goblin": 2 } },
            "tongkat_orc":          { "name": "Tongkat Sihir (craft)",   "result": "tongkat_sihir",   "amount": 1, "materials": { "batu_kekuatan": 3, "kulit_orc": 2, "batu_bara": 3 } },
            "busur_orc":            { "name": "Busur Besi (craft)",      "result": "busur_besi",      "amount": 1, "materials": { "bijih_besi": 4, "kulit_orc": 4, "taring_goblin": 1 } },
            // ── BAJA ──
            "pedang_besi_tempa":    { "name": "Pedang Baja (craft)",     "result": "pedang_baja",     "amount": 1, "materials": { "bijih_besi": 10, "batu_bara": 5, "nikel": 2 } },
            "tongkat_kuno_craft":   { "name": "Tongkat Kuno (craft)",    "result": "tongkat_kuno",    "amount": 1, "materials": { "batu_kekuatan": 8, "sisik_naga": 3, "permata": 2 } },
            // ── LABA-LABA / SERIGALA ROH ──
            "pedang_racun":         { "name": "Pedang Racun (craft)",    "result": "pedang_baja",     "amount": 1, "materials": { "racun_laba": 5, "bijih_besi": 8, "kulit_goblin": 4 } },
            "busur_elven_craft":    { "name": "Busur Elven (craft)",     "result": "busur_elven",     "amount": 1, "materials": { "kristal_es": 5, "bulu_phoenix": 1, "batu_kekuatan": 5, "mithril": 2 } },
            // ── MITHRIL / NAGA ──
            "pedang_mithril_craft": { "name": "Pedang Mithril (craft)",  "result": "pedang_mithril",  "amount": 1, "materials": { "mithril": 5, "batu_kekuatan": 3, "sisik_naga": 2 } },
            "tongkat_mithril":      { "name": "Tongkat Mithril (craft)", "result": "pedang_mithril",  "amount": 1, "materials": { "mithril": 4, "kristal_es": 4, "batu_kekuatan": 5 } },
            // ── NAGA / PHOENIX ──
            "pedang_naga_craft":    { "name": "Pedang Naga (craft)",     "result": "pedang_naga",     "amount": 1, "materials": { "tulang_naga": 3, "sisik_naga": 10, "orichalcum": 2, "bulu_phoenix": 1 } },
            "tombak_halilintar_c":  { "name": "Tombak Halilintar (craft)","result": "tombak_halilintar","amount": 1,"materials": { "orichalcum": 3, "tulang_naga": 5, "bulu_phoenix": 3, "kristal_es": 5 } },
            "katana_jiwa_craft":    { "name": "Katana Jiwa (craft)",     "result": "katana_jiwa",     "amount": 1, "materials": { "mithril": 8, "tulang_naga": 4, "sisik_naga": 8, "batu_kekuatan": 10 } },
            "busur_abadi_craft":    { "name": "Busur Abadi (craft)",     "result": "busur_abadi",     "amount": 1, "materials": { "orichalcum": 2, "bulu_phoenix": 4, "mithril": 6, "kristal_es": 8 } },
            "tongkat_dewa_craft":   { "name": "Tongkat Dewa (craft)",    "result": "tongkat_dewa",    "amount": 1, "materials": { "orichalcum": 4, "bulu_phoenix": 5, "sisik_naga": 10, "kristal_es": 10 } },
            "pedang_dewa_craft":    { "name": "Pedang Dewa (craft)",     "result": "pedang_dewa",     "amount": 1, "materials": { "orichalcum": 10, "tulang_naga": 8, "bulu_phoenix": 8, "mithril": 10, "sisik_naga": 15 } },
            // 
            //  🛡️ ARMOR — GOBLIN MATERIAL
            // 
            "baju_kulit_goblin":    { "name": "Zirah Kulit (craft)",     "result": "zirah_kulit",     "amount": 1, "materials": { "kulit_goblin": 8, "taring_goblin": 3 } },
            "perisai_goblin":       { "name": "Perisai Kayu (craft)",    "result": "perisai_kayu",    "amount": 1, "materials": { "kulit_goblin": 4, "taring_goblin": 1 } },
            // ── ORC / TROLL ──
            "zirah_kulit_kuat":     { "name": "Zirah Besi (craft)",      "result": "zirah_besi",      "amount": 1, "materials": { "bijih_besi": 8, "kulit_orc": 3 } },
            "perisai_orc":          { "name": "Perisai Besi (craft)",    "result": "perisai_besi",    "amount": 1, "materials": { "bijih_besi": 5, "kulit_orc": 4, "batu_bara": 3 } },
            "jubah_penyihir_craft": { "name": "Jubah Penyihir (craft)",  "result": "jubah_penyihir",  "amount": 1, "materials": { "racun_laba": 4, "kulit_orc": 5, "bunga_langka": 5 } },
            // ── BAJA ──
            "zirah_baja_craft":     { "name": "Zirah Baja (craft)",      "result": "zirah_baja",      "amount": 1, "materials": { "bijih_besi": 12, "batu_bara": 8, "nikel": 5, "kulit_orc": 4 } },
            // ── MITHRIL / NAGA ──
            "zirah_mithril_craft":  { "name": "Zirah Mithril (craft)",   "result": "zirah_mithril",   "amount": 1, "materials": { "mithril": 8, "sisik_naga": 5, "kristal_es": 2 } },
            "jubah_lich_craft":     { "name": "Jubah Lich (craft)",      "result": "jubah_lich",      "amount": 1, "materials": { "orichalcum": 3, "tulang_naga": 5, "kristal_es": 8, "mithril": 5 } },
            "perisai_naga_craft":   { "name": "Perisai Naga (craft)",    "result": "perisai_naga",    "amount": 1, "materials": { "sisik_naga": 10, "tulang_naga": 5, "batu_kekuatan": 8, "mithril": 4 } },
            "zirah_orichal_craft":  { "name": "Zirah Orichalcum (craft)","result": "zirah_orichalcum","amount": 1, "materials": { "orichalcum": 6, "mithril": 8, "sisik_naga": 12, "tulang_naga": 5 } },
            "zirah_dewa_craft":     { "name": "Zirah Dewa (craft)",      "result": "zirah_dewa",      "amount": 1, "materials": { "orichalcum": 12, "mithril": 15, "bulu_phoenix": 8, "sisik_naga": 15, "tulang_naga": 8 } },
            // 
            //  💎 MATERIAL OLAHAN
            // 
            "permata_craft":        { "name": "Permata (dari batu)",     "result": "permata",         "amount": 1, "materials": { "batu": 20, "batu_bara": 5, "bijih_besi": 3 } },
            "nikel_craft":          { "name": "Nikel (craft)",           "result": "nikel",           "amount": 2, "materials": { "batu": 15, "batu_bara": 8, "bijih_besi": 5 } },
            "kristal_es_craft":     { "name": "Kristal Es (craft)",      "result": "kristal_es",      "amount": 1, "materials": { "batu": 10, "racun_laba": 3, "bunga_langka": 3 } },
            "batu_kekuatan_craft":  { "name": "Batu Kekuatan (craft)",   "result": "batu_kekuatan",   "amount": 1, "materials": { "batu": 12, "batu_bara": 5, "nikel": 2, "permata": 1 } },
            // 
            //  🧬 CRAFTING KOMBINASI DROP LANGKA
            // 
            "racun_perkuat":        { "name": "Racun Kuat (craft)",      "result": "racun_laba",      "amount": 3, "materials": { "jamur_ajaib": 4, "rumput_liar": 8, "bunga_langka": 2 } },
            "bulu_phoenix_craft":   { "name": "Bulu Phoenix (craft)",    "result": "bulu_phoenix",    "amount": 1, "materials": { "sisik_naga": 5, "kristal_es": 3, "batu_kekuatan": 5 } },
            "sisik_naga_craft":     { "name": "Sisik Naga (craft)",      "result": "sisik_naga",      "amount": 2, "materials": { "kulit_orc": 5, "batu_kekuatan": 3, "batu_bara": 5 } },
            "tulang_naga_craft":    { "name": "Tulang Naga (craft)",     "result": "tulang_naga",     "amount": 1, "materials": { "sisik_naga": 8, "batu_kekuatan": 5, "orichalcum": 1 } },
            "mithril_craft":        { "name": "Mithril (craft)",         "result": "mithril",         "amount": 1, "materials": { "permata": 5, "batu_kekuatan": 8, "bijih_besi": 15, "nikel": 5 } },
            "orichalcum_craft":     { "name": "Orichalcum (craft)",      "result": "orichalcum",      "amount": 1, "materials": { "mithril": 5, "bulu_phoenix": 3, "sisik_naga": 10, "permata": 8 } }
        },
        quests: {
            "pemburu_tikus":   { "title": "Pemburu Tikus",      "description": "Kalahkan 5 Tikus Got di Desa Pemula.",   "type": "kill",    "target": "🐀 Tikus Got",      "count": 5,  "reward": { "exp": 80,   "gold": 50,   "item": { "id": "potion",       "amount": 3 } } },
            "pemburu_goblin":  { "title": "Pemburu Goblin",     "description": "Kalahkan 5 Goblin di Desa Pemula.",      "type": "kill",    "target": "👺 Goblin",          "count": 5,  "reward": { "exp": 100,  "gold": 70,   "item": { "id": "potion",       "amount": 3 } } },
            "kolektor_kulit":  { "title": "Kolektor Kulit",     "description": "Kumpulkan 10 Kulit Goblin.",             "type": "collect", "target": "kulit_goblin",       "count": 10, "reward": { "exp": 80,   "gold": 70 } },
            "pemburu_laba":    { "title": "Pemburu Laba-laba",  "description": "Kalahkan 8 Laba-laba Raksasa.",          "type": "kill",    "target": "🕷️ Laba-laba Raksasa","count": 8,  "reward": { "exp": 200,  "gold": 150,  "item": { "id": "potion_besar", "amount": 2 } } },
            "pemburu_orc":     { "title": "Pemburu Orc",        "description": "Kalahkan 6 Orc Prajurit di Hutan.",      "type": "kill",    "target": "🧌 Orc Prajurit",    "count": 6,  "reward": { "exp": 250,  "gold": 200,  "item": { "id": "batu_kekuatan","amount": 2 } } },
            "pemburu_zombie":  { "title": "Pemburu Zombie",     "description": "Kalahkan 8 Zombie Prajurit.",            "type": "kill",    "target": "🧟 Zombie Prajurit", "count": 8,  "reward": { "exp": 300,  "gold": 250,  "item": { "id": "potion_super", "amount": 2 } } },
            "pemburu_naga":    { "title": "Pemburu Naga",       "description": "Kalahkan 3 Naga di Kuil Api.",           "type": "kill",    "target": "🐉 Naga",            "count": 3,  "reward": { "exp": 500,  "gold": 450,  "item": { "id": "sisik_naga",   "amount": 3 } } },
            "pemburu_lich":    { "title": "Pemburu Lich",       "description": "Kalahkan 2 Lich King di Menara Sihir.",  "type": "kill",    "target": "👑 Lich King",       "count": 2,  "reward": { "exp": 800,  "gold": 700,  "item": { "id": "mithril",      "amount": 2 } } },
            "pemburu_titan":   { "title": "Pemburu Titan",      "description": "Kalahkan 2 Titan Api.",                  "type": "kill",    "target": "🌋 Titan Api",       "count": 2,  "reward": { "exp": 1500, "gold": 1200, "item": { "id": "orichalcum",   "amount": 3 } } }
        },
        dungeons: {
            // Tier 1-2: Level 5+
            "goblin_outpost": {
                "name": "⚔️ Markas Goblin",
                "minLevel": 5,
                "stages": [
                    { "monsterId": "4",  "count": 2 },
                    { "monsterId": "4",  "count": 3 },
                    { "monsterId": "11", "count": 2 }
                ],
                "boss": "17",
                "reward": { "exp": 250, "gold": 200, "item": { "id": "batu_kekuatan", "amount": 2 } }
            },
            // Tier 2-3: Level 8+
            "hutan_laba": {
                "name": "🕷️ Sarang Laba-laba",
                "minLevel": 8,
                "stages": [
                    { "monsterId": "9",  "count": 2 },
                    { "monsterId": "9",  "count": 3 },
                    { "monsterId": "13", "count": 1 }
                ],
                "boss": "15",
                "reward": { "exp": 400, "gold": 350, "item": { "id": "racun_laba", "amount": 5 } }
            },
            // Tier 3: Level 10+
            "reruntuhan_kuno": {
                "name": "🏚️ Reruntuhan Raja Zombie",
                "minLevel": 10,
                "stages": [
                    { "monsterId": "12", "count": 3 },
                    { "monsterId": "24", "count": 2 },
                    { "monsterId": "22", "count": 2 }
                ],
                "boss": "30",
                "reward": { "exp": 550, "gold": 480, "item": { "id": "permata", "amount": 2 } }
            },
            // Tier 4: Level 13+
            "gua_es": {
                "name": "❄️ Gua Es Abadi",
                "minLevel": 13,
                "stages": [
                    { "monsterId": "27", "count": 2 },
                    { "monsterId": "32", "count": 2 },
                    { "monsterId": "37", "count": 1 }
                ],
                "boss": "37",
                "reward": { "exp": 700, "gold": 600, "item": { "id": "kristal_es", "amount": 3 } }
            },
            // Tier 5: Level 17+
            "kuil_ifrit": {
                "name": "🔥 Kuil Ifrit",
                "minLevel": 17,
                "stages": [
                    { "monsterId": "26", "count": 2 },
                    { "monsterId": "39", "count": 2 },
                    { "monsterId": "40", "count": 2 }
                ],
                "boss": "39",
                "reward": { "exp": 1000, "gold": 900, "item": { "id": "bulu_phoenix", "amount": 2 } }
            },
            // Tier 6: Level 20+
            "menara_lich": {
                "name": "💀 Menara Lich",
                "minLevel": 20,
                "stages": [
                    { "monsterId": "33", "count": 2 },
                    { "monsterId": "41", "count": 1 },
                    { "monsterId": "44", "count": 1 }
                ],
                "boss": "42",
                "reward": { "exp": 2000, "gold": 1500, "item": { "id": "orichalcum", "amount": 2 } }
            },
            // Tier 7: Level 25+
            "gerbang_neraka": {
                "name": "🌑 Gerbang Neraka",
                "minLevel": 25,
                "stages": [
                    { "monsterId": "46", "count": 2 },
                    { "monsterId": "49", "count": 2 },
                    { "monsterId": "51", "count": 1 }
                ],
                "boss": "47",
                "reward": { "exp": 4000, "gold": 3500, "item": { "id": "orichalcum", "amount": 5 } }
            },
            // Tier 8: Level 30+
            "istana_titan": {
                "name": "⚡ Istana Titan",
                "minLevel": 30,
                "stages": [
                    { "monsterId": "52", "count": 1 },
                    { "monsterId": "53", "count": 1 },
                    { "monsterId": "54", "count": 1 }
                ],
                "boss": "55",
                "reward": { "exp": 7000, "gold": 6500, "item": { "id": "mithril", "amount": 8 } }
            },
            // Tier 9: Level 40+
            "singgasana_dewa": {
                "name": "👁️ Singgasana Para Dewa",
                "minLevel": 40,
                "stages": [
                    { "monsterId": "56", "count": 1 },
                    { "monsterId": "57", "count": 1 },
                    { "monsterId": "58", "count": 1 }
                ],
                "boss": "59",
                "reward": { "exp": 12000, "gold": 11000, "item": { "id": "orichalcum", "amount": 10 } }
            },
            // Tier 10: Level 55+
            "akhir_zaman": {
                "name": "🌌 Pertempuran Akhir Zaman",
                "minLevel": 55,
                "stages": [
                    { "monsterId": "60", "count": 1 },
                    { "monsterId": "61", "count": 1 },
                    { "monsterId": "62", "count": 1 }
                ],
                "boss": "63",
                "reward": { "exp": 25000, "gold": 20000, "item": { "id": "orichalcum", "amount": 20 } }
            }
        },
        petData: {
            "🐱 TIER F — PEMULA": {},
            "kucing_liar":      { "name": "🐱 Kucing Liar",         "attack": 2,  "defense": 1,  "cost": 5000,           "tier": "F", "description": "Kucing kampung yang setia nemenin petualangan." },
            "kelinci":          { "name": "🐇 Kelinci Putih",       "attack": 1,  "defense": 3,  "cost": 8000,           "tier": "F", "description": "Kelinci cepat yang sedikit meningkatkan pertahanan." },
            "musang":           { "name": "🦡 Musang Berbulu",      "attack": 3,  "defense": 2,  "cost": 12000,          "tier": "F", "description": "Musang lincah yang gesit menghindar." },
            "🐺 TIER E — BIASA": {},
            "serigala":         { "name": "🐺 Serigala",            "attack": 5,  "defense": 2,  "cost": 50000,          "tier": "E", "description": "Serigala setia dengan taring tajam." },
            "kura_kura":        { "name": "🐢 Kura-kura Baja",      "attack": 1,  "defense": 6,  "cost": 40000,          "tier": "E", "description": "Tempurung baja yang meningkatkan pertahanan." },
            "ular_piton":       { "name": "🐍 Ular Piton",          "attack": 6,  "defense": 1,  "cost": 60000,          "tier": "E", "description": "Lilitan maut dari piton peliharaan." },
            "🦊 TIER D — LANGKA": {},
            "rubah_salju":      { "name": "🦊 Rubah Salju",         "attack": 7,  "defense": 4,  "cost": 250000,         "tier": "D", "description": "Rubah es cepat dengan keseimbangan attack & defense." },
            "harimau":          { "name": "🐯 Harimau Bengal",      "attack": 9,  "defense": 3,  "cost": 300000,         "tier": "D", "description": "Raja hutan dengan serangan yang mematikan." },
            "beruang_kutub":    { "name": "🐻 Beruang Kutub",       "attack": 6,  "defense": 8,  "cost": 350000,         "tier": "D", "description": "Beruang kutub raksasa dengan pertahanan tebal." },
            "🦅 TIER C — KEREN": {},
            "elang_api":        { "name": "🦅 Elang Api",           "attack": 12, "defense": 3,  "cost": 1500000,        "tier": "C", "description": "Elang berapi dengan serangan angin panas." },
            "panther_gelap":    { "name": "🐆 Panther Gelap",       "attack": 14, "defense": 5,  "cost": 2000000,        "tier": "C", "description": "Panther hitam misterius dari hutan kelam." },
            "singa_emas":       { "name": "🦁 Singa Emas",          "attack": 13, "defense": 6,  "cost": 2500000,        "tier": "C", "description": "Singa bermahkota emas, simbol keberanian." },
            "🦋 TIER B — EPIK": {},
            "naga_mini":        { "name": "🐲 Naga Mini",           "attack": 18, "defense": 7,  "cost": 10000000,       "tier": "B", "description": "Naga kecil dari telur langka, hembus api mini." },
            "fenrir":           { "name": "🌑 Fenrir",              "attack": 20, "defense": 8,  "cost": 15000000,       "tier": "B", "description": "Serigala raksasa dari dimensi kegelapan." },
            "unicorn":          { "name": "🦄 Unicorn",             "attack": 15, "defense": 12, "cost": 20000000,       "tier": "B", "description": "Kuda bertanduk perak yang memancarkan sihir." },
            "⚡ TIER A — LEGENDARIS": {},
            "gryphon":          { "name": "🦁🦅 Gryphon",           "attack": 25, "defense": 12, "cost": 75000000,       "tier": "A", "description": "Campuran singa dan elang, raja udara dan darat." },
            "thunderbird":      { "name": "⚡ Thunderbird",          "attack": 28, "defense": 10, "cost": 100000000,      "tier": "A", "description": "Burung petir legendaris, setiap serangan mengandung listrik." },
            "cerberus":         { "name": "🔱 Cerberus",            "attack": 22, "defense": 18, "cost": 150000000,      "tier": "A", "description": "Anjing berkepala tiga penjaga neraka." },
            "🔥 TIER S — MYTHIC": {},
            "phoenix":          { "name": "🔥 Phoenix",             "attack": 35, "defense": 15, "cost": 500000000,      "tier": "S", "description": "Burung api abadi yang bangkit dari abu, membakar semua musuh." },
            "leviathan_mini":   { "name": "🌊 Leviathan Mini",      "attack": 30, "defense": 25, "cost": 750000000,      "tier": "S", "description": "Naga laut purba dari kedalaman samudra." },
            "manticore":        { "name": "🦂 Manticore",           "attack": 40, "defense": 18, "cost": 1000000000,     "tier": "S", "description": "Singa bertubuh kalajengking, racun mematikan." },
            "🌟 TIER SS — DEWA": {},
            "bahamut":          { "name": "🐉 Bahamut",             "attack": 55, "defense": 30, "cost": 5000000000,     "tier": "SS", "description": "Naga dewa legendaris, penguasa langit dan bumi." },
            "jormungandr":      { "name": "🌀 Jormungandr",         "attack": 50, "defense": 35, "cost": 7500000000,     "tier": "SS", "description": "Ular raksasa melilit dunia, tiada yang lolos." },
            "⭐ TIER SSS — GOD": {},
            "celestial_dragon": { "name": "✨ Celestial Dragon",    "attack": 75, "defense": 50, "cost": 50000000000,    "tier": "SSS", "description": "Naga surgawi dari dimensi ke-7, melampaui semua makhluk." },
            "void_beast":       { "name": "🕳️ Void Beast",          "attack": 80, "defense": 55, "cost": 100000000000,   "tier": "SSS", "description": "Makhluk dari kekosongan abadi, menghancurkan realita." },
            "god_dragon":       { "name": "🌠 God Dragon",          "attack": 99, "defense": 75, "cost": 999000000000,   "tier": "SSS", "description": "ULTIMATE PET — Naga Tuhan, kekuatan tak tertandingi di semesta!" }
        }
    }
    fs.writeFileSync(rpgDBPath, JSON.stringify(defaultRPG, null, 2))
} else {
    // Sync: pastikan items, monsters, dungeons, petData selalu up-to-date di rpg.json
    try {
        const existingRPG = JSON.parse(fs.readFileSync(rpgDBPath))
        let needsSave = false

        const defaultItems = {
            "potion": { "name": "Potion", "type": "heal", "value": 30, "price": 5000 },
            "potion_besar": { "name": "Potion Besar", "type": "heal", "value": 80, "price": 25000 },
            "potion_super": { "name": "Super Potion", "type": "heal", "value": 150, "price": 75000 },
            "elixir_hidup": { "name": "Elixir Kehidupan", "type": "heal", "value": 999, "price": 500000 },
            "limit_bot_10": { "name": "10 Limit Bot", "type": "bot_feature", "value": 10, "price": 1000000 },
            "limit_bot_50": { "name": "50 Limit Bot", "type": "bot_feature", "value": 50, "price": 4000000 },
            "elixir": { "name": "Elixir", "type": "mana", "value": 25, "price": 8000 },
            "elixir_besar": { "name": "Elixir Besar", "type": "mana", "value": 60, "price": 35000 },
            "elixir_mana_penuh": { "name": "Mana Crystal", "type": "mana", "value": 999, "price": 300000 },
            "pedang_kayu": { "name": "Pedang Kayu", "type": "weapon", "attack": 2, "price": 15000 },
            "pedang_besi": { "name": "Pedang Besi", "type": "weapon", "attack": 5, "price": 150000 },
            "pedang_baja": { "name": "Pedang Baja", "type": "weapon", "attack": 10, "price": 1500000 },
            "pedang_mithril": { "name": "Pedang Mithril", "type": "weapon", "attack": 18, "price": 15000000 },
            "pedang_naga": { "name": "Pedang Naga", "type": "weapon", "attack": 30, "price": 200000000 },
            "tongkat_sihir": { "name": "Tongkat Sihir", "type": "weapon", "attack": 8, "price": 500000 },
            "tongkat_kuno": { "name": "Tongkat Kuno", "type": "weapon", "attack": 20, "price": 50000000 },
            "busur_kayu": { "name": "Busur Kayu", "type": "weapon", "attack": 4, "price": 25000 },
            "busur_besi": { "name": "Busur Besi", "type": "weapon", "attack": 9, "price": 300000 },
            "busur_elven": { "name": "Busur Elven", "type": "weapon", "attack": 22, "price": 80000000 },
            "baju_kain": { "name": "Baju Kain", "type": "armor", "defense": 1, "price": 5000 },
            "zirah_kulit": { "name": "Zirah Kulit", "type": "armor", "defense": 3, "price": 50000 },
            "zirah_besi": { "name": "Zirah Besi", "type": "armor", "defense": 7, "price": 500000 },
            "zirah_baja": { "name": "Zirah Baja", "type": "armor", "defense": 14, "price": 5000000 },
            "jubah_penyihir": { "name": "Jubah Penyihir", "type": "armor", "defense": 5, "price": 800000 },
            "zirah_mithril": { "name": "Zirah Mithril", "type": "armor", "defense": 25, "price": 100000000 },
            "perisai_kayu": { "name": "Perisai Kayu", "type": "armor", "defense": 2, "price": 10000 },
            "perisai_besi": { "name": "Perisai Besi", "type": "armor", "defense": 6, "price": 250000 },
            "kulit_goblin": { "name": "Kulit Goblin", "type": "material", "price": 2000 },
            "taring_goblin": { "name": "Taring Goblin", "type": "material", "price": 5000 },
            "kulit_orc": { "name": "Kulit Orc", "type": "material", "price": 10000 },
            "batu_kekuatan": { "name": "Batu Kekuatan", "type": "material", "price": 50000 },
            "sisik_naga": { "name": "Sisik Naga", "type": "material", "price": 150000 },
            "tulang_naga": { "name": "Tulang Naga", "type": "material", "price": 500000 },
            "racun_laba": { "name": "Racun Laba-laba", "type": "material", "price": 30000 },
            "bulu_phoenix": { "name": "Bulu Phoenix", "type": "material", "price": 1000000 },
            "kristal_es": { "name": "Kristal Es", "type": "material", "price": 200000 },
            "batu": { "name": "Batu", "type": "material", "price": 500 },
            "batu_bara": { "name": "Batu Bara", "type": "material", "price": 8000 },
            "bijih_besi": { "name": "Bijih Besi", "type": "material", "price": 25000 },
            "permata": { "name": "Permata", "type": "material", "price": 500000 },
            "rumput_liar": { "name": "Rumput Liar", "type": "material", "price": 1000 },
            "bunga_langka": { "name": "Bunga Langka", "type": "material", "price": 75000 },
            "jamur_ajaib": { "name": "Jamur Ajaib", "type": "material", "price": 150000 },
            "nikel": { "name": "Nikel", "type": "material", "price": 100000 },
            "emas": { "name": "Emas", "type": "material", "price": 2500000 },
            "berlian": { "name": "Berlian", "type": "material", "price": 10000000 },
            "mithril": { "name": "Mithril", "type": "material", "price": 25000000 },
            "orichalcum": { "name": "Orichalcum", "type": "material", "price": 100000000 },
            "pedang_dewa": { "name": "Pedang Dewa", "type": "weapon", "attack": 50, "price": 2000000000 },
            "tombak_halilintar": { "name": "Tombak Halilintar", "type": "weapon", "attack": 45, "price": 1500000000 },
            "katana_jiwa": { "name": "Katana Jiwa", "type": "weapon", "attack": 40, "price": 800000000 },
            "busur_abadi": { "name": "Busur Abadi", "type": "weapon", "attack": 38, "price": 600000000 },
            "tongkat_dewa": { "name": "Tongkat Dewa", "type": "weapon", "attack": 35, "price": 500000000 },
            "zirah_dewa": { "name": "Zirah Dewa", "type": "armor", "defense": 50, "price": 2000000000 },
            "jubah_lich": { "name": "Jubah Lich King", "type": "armor", "defense": 40, "price": 1200000000 },
            "perisai_naga": { "name": "Perisai Naga", "type": "armor", "defense": 35, "price": 900000000 },
            "zirah_orichalcum": { "name": "Zirah Orichalcum", "type": "armor", "defense": 45, "price": 1500000000 },
            // ── SENJATA ULTRA ──
            "pedang_void": { "name": "Pedang Void", "type": "weapon", "attack": 70, "price": 8000000000 },
            "tongkat_abadi": { "name": "Tongkat Abadi", "type": "weapon", "attack": 55, "price": 3500000000 },
            "busur_chaos": { "name": "Busur Chaos", "type": "weapon", "attack": 60, "price": 5000000000 },
            "tombak_titan": { "name": "Tombak Titan", "type": "weapon", "attack": 65, "price": 6000000000 },
            "keris_setan": { "name": "Keris Setan", "type": "weapon", "attack": 48, "price": 1200000000 },
            "kapak_berdarah": { "name": "Kapak Berdarah", "type": "weapon", "attack": 42, "price": 900000000 },
            "pedang_kristal": { "name": "Pedang Kristal", "type": "weapon", "attack": 25, "price": 80000000 },
            "tongkat_es": { "name": "Tongkat Es", "type": "weapon", "attack": 22, "price": 60000000 },
            "busur_api": { "name": "Busur Api", "type": "weapon", "attack": 20, "price": 40000000 },
            // ── ARMOR ULTRA ──
            "jubah_void": { "name": "Jubah Void", "type": "armor", "defense": 72, "price": 2000000000 },
            "perisai_chaos": { "name": "Perisai Chaos", "type": "armor", "defense": 60, "price": 5000000000 },
            "zirah_titan": { "name": "Zirah Titan", "type": "armor", "defense": 65, "price": 6000000000 },
            "zirah_kristal": { "name": "Zirah Kristal", "type": "armor", "defense": 28, "price": 120000000 },
            "jubah_naga": { "name": "Jubah Naga", "type": "armor", "defense": 22, "price": 70000000 },
            "perisai_baja_kuno": { "name": "Perisai Baja Kuno", "type": "armor", "defense": 18, "price": 30000000 },
            // ── SENJATA BEYOND GOD [ATK 90–130] ──
            "busur_kehancuran": { "name": "Busur Kehancuran", "type": "weapon", "attack": 90, "price": 18000000000 },
            "kapak_ragnarok": { "name": "🪓 Kapak Ragnarok", "type": "weapon", "attack": 95, "price": 20000000000 },
            "katana_dewa_agung": { "name": "Katana Dewa Agung", "type": "weapon", "attack": 100, "price": 25000000000 },
            "trisula_poseidon": { "name": "🔱 Trisula Poseidon", "type": "weapon", "attack": 105, "price": 28000000000 },
            "tombak_semesta": { "name": "Tombak Semesta", "type": "weapon", "attack": 110, "price": 35000000000 },
            "pedang_malaikat_maut": { "name": "☠️ Pedang Malaikat Maut", "type": "weapon", "attack": 115, "price": 42000000000 },
            "pedang_abadi": { "name": "Pedang Abadi Mutlak", "type": "weapon", "attack": 120, "price": 50000000000 },
            "tongkat_roh_agung": { "name": "🌀 Tongkat Roh Agung", "type": "weapon", "attack": 125, "price": 55000000000 },
            // ── SENJATA ABSOLUTE [ATK 150–200] ──
            "busur_mutlak": { "name": "✨ Busur Mutlak", "type": "weapon", "attack": 150, "price": 200000000000 },
            "katana_supremasi": { "name": "⚡ Katana Supremasi", "type": "weapon", "attack": 160, "price": 250000000000 },
            "pedang_awal_semesta": { "name": "🌌 Pedang Awal Semesta", "type": "weapon", "attack": 170, "price": 300000000000 },
            "tombak_kehancuran_abadi": { "name": "💀 Tombak Kehancuran Abadi", "type": "weapon", "attack": 180, "price": 350000000000 },
            "tongkat_penciptaan": { "name": "🌟 Tongkat Penciptaan", "type": "weapon", "attack": 190, "price": 420000000000 },
            "pedang_mutlak_absolut": { "name": "💫 Pedang Mutlak Absolut", "type": "weapon", "attack": 200, "price": 500000000000 },
            // ── ARMOR BEYOND GOD [DEF 90–130] ──
            "jubah_keabadian": { "name": "Jubah Keabadian", "type": "armor", "defense": 90, "price": 18000000000 },
            "tameng_ragnarok": { "name": "🪬 Tameng Ragnarok", "type": "armor", "defense": 95, "price": 20000000000 },
            "perisai_mutlak": { "name": "Perisai Mutlak", "type": "armor", "defense": 100, "price": 25000000000 },
            "jubah_roh_suci": { "name": "🌿 Jubah Roh Suci", "type": "armor", "defense": 105, "price": 28000000000 },
            "zirah_semesta": { "name": "Zirah Semesta", "type": "armor", "defense": 110, "price": 35000000000 },
            "zirah_malaikat": { "name": "👼 Zirah Malaikat", "type": "armor", "defense": 115, "price": 42000000000 },
            "baju_dewa_agung": { "name": "Baju Dewa Agung", "type": "armor", "defense": 120, "price": 50000000000 },
            "perisai_abyss": { "name": "🌑 Perisai Abyss", "type": "armor", "defense": 125, "price": 55000000000 },
            // ── ARMOR ABSOLUTE [DEF 160–200] ──
            "jubah_mutlak": { "name": "⚡ Jubah Mutlak", "type": "armor", "defense": 160, "price": 250000000000 },
            "zirah_fajar_abadi": { "name": "🌅 Zirah Fajar Abadi", "type": "armor", "defense": 170, "price": 300000000000 },
            "perisai_supremasi": { "name": "🌌 Perisai Supremasi", "type": "armor", "defense": 180, "price": 350000000000 },
            "jubah_kosmos": { "name": "🌠 Jubah Kosmos", "type": "armor", "defense": 190, "price": 420000000000 },
            "zirah_mutlak_absolut": { "name": "💫 Zirah Mutlak Absolut", "type": "armor", "defense": 200, "price": 500000000000 },
            "megapotion": { "name": "Mega Potion", "type": "heal", "value": 300, "price": 2000000 },
            "divinepotion": { "name": "Divine Potion", "type": "heal", "value": 999, "price": 50000000 },
            "megaelixir": { "name": "Mega Elixir", "type": "mana", "value": 300, "price": 2000000 },
            "divineelixir": { "name": "Divine Elixir", "type": "mana", "value": 999, "price": 50000000 },
            "limit_bot_100": { "name": "100 Limit Bot", "type": "bot_feature", "value": 100, "price": 7000000 },
            "limit_bot_500": { "name": "500 Limit Bot", "type": "bot_feature", "value": 500, "price": 25000000 },
            "luck_potion": { "name": "🍀 Luck Potion", "type": "fishing_buff", "duration": 1800000, "boost": 30, "price": 50000, "desc": "Boost luck mancing +30 untuk 1 grup selama 30 menit." },
            "luck_super_potion": { "name": "🍀 Super Luck Potion", "type": "fishing_buff", "duration": 3600000, "boost": 300, "price": 500000, "desc": "Boost luck mancing x10 (boost 300) untuk 1 grup selama 1 jam! Potion luck legendaris." }
        }
        const defaultMonsters = {
            "1": { "name": "Goblin", "hp": 30, "attack": 5, "defense": 2, "exp": 15, "gold": 10, "level": 1, "drops": { "kulit_goblin": 0.7, "taring_goblin": 0.3 } },
            "2": { "name": "Orc", "hp": 50, "attack": 8, "defense": 4, "exp": 25, "gold": 20, "level": 3, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.1 } },
            "3": { "name": "Naga", "hp": 100, "attack": 15, "defense": 8, "exp": 60, "gold": 50, "level": 10, "drops": { "sisik_naga": 0.5, "tulang_naga": 0.2, "batu_kekuatan": 0.3 } },
            "4": { "name": "Goblin Jendral", "hp": 80, "attack": 12, "defense": 6, "exp": 70, "gold": 60, "level": 7, "drops": { "batu_kekuatan": 0.5, "taring_goblin": 0.8 } },
            "5": { "name": "Laba-laba Raksasa", "hp": 45, "attack": 7, "defense": 3, "exp": 20, "gold": 15, "level": 4, "drops": { "racun_laba": 0.6, "kulit_goblin": 0.2 } },
            "6": { "name": "Troll Hutan", "hp": 70, "attack": 10, "defense": 5, "exp": 35, "gold": 30, "level": 6, "drops": { "kulit_orc": 0.4, "batu_kekuatan": 0.2 } },
            "7": { "name": "Serigala Roh", "hp": 55, "attack": 9, "defense": 3, "exp": 30, "gold": 25, "level": 5, "drops": { "kristal_es": 0.3, "batu_kekuatan": 0.15 } },
            "8": { "name": "Phoenix", "hp": 120, "attack": 18, "defense": 10, "exp": 90, "gold": 80, "level": 12, "drops": { "bulu_phoenix": 0.4, "sisik_naga": 0.2 } },
            "9": { "name": "Ice Drake", "hp": 140, "attack": 20, "defense": 12, "exp": 110, "gold": 100, "level": 15, "drops": { "kristal_es": 0.6, "tulang_naga": 0.3 } },
            "10": { "name": "Lich King", "hp": 200, "attack": 25, "defense": 15, "exp": 200, "gold": 200, "level": 20, "drops": { "orichalcum": 0.3, "bulu_phoenix": 0.2, "mithril": 0.5 } }
        }
        const defaultDungeons = {
            "goblin_outpost": { "name": "Markas Goblin", "minLevel": 5, "stages": [{ "monsterId": "1", "count": 2 }, { "monsterId": "1", "count": 3 }], "boss": "4", "reward": { "exp": 250, "gold": 200, "item": { "id": "batu_kekuatan", "amount": 2 } } },
            "hutan_laba": { "name": "Sarang Laba-laba", "minLevel": 8, "stages": [{ "monsterId": "5", "count": 2 }, { "monsterId": "5", "count": 3 }, { "monsterId": "6", "count": 1 }], "boss": "5", "reward": { "exp": 400, "gold": 350, "item": { "id": "racun_laba", "amount": 5 } } },
            "gua_es": { "name": "Gua Es Abadi", "minLevel": 13, "stages": [{ "monsterId": "7", "count": 2 }, { "monsterId": "9", "count": 1 }], "boss": "9", "reward": { "exp": 700, "gold": 600, "item": { "id": "kristal_es", "amount": 3 } } },
            "menara_lich": { "name": "Menara Lich", "minLevel": 20, "stages": [{ "monsterId": "3", "count": 2 }, { "monsterId": "8", "count": 1 }, { "monsterId": "9", "count": 1 }], "boss": "10", "reward": { "exp": 2000, "gold": 1500, "item": { "id": "orichalcum", "amount": 2 } } }
        }
        const defaultPetData = {
            "kucing_liar":      { "name": "🐱 Kucing Liar",         "attack": 2,  "defense": 1,  "cost": 5000,           "tier": "F",   "description": "Kucing kampung yang setia nemenin petualangan." },
            "kelinci":          { "name": "🐇 Kelinci Putih",       "attack": 1,  "defense": 3,  "cost": 8000,           "tier": "F",   "description": "Kelinci cepat yang sedikit meningkatkan pertahanan." },
            "musang":           { "name": "🦡 Musang Berbulu",      "attack": 3,  "defense": 2,  "cost": 12000,          "tier": "F",   "description": "Musang lincah yang gesit menghindar." },
            "serigala":         { "name": "🐺 Serigala",            "attack": 5,  "defense": 2,  "cost": 50000,          "tier": "E",   "description": "Serigala setia dengan taring tajam." },
            "kura_kura":        { "name": "🐢 Kura-kura Baja",      "attack": 1,  "defense": 6,  "cost": 40000,          "tier": "E",   "description": "Tempurung baja yang meningkatkan pertahanan." },
            "ular_piton":       { "name": "🐍 Ular Piton",          "attack": 6,  "defense": 1,  "cost": 60000,          "tier": "E",   "description": "Lilitan maut dari piton peliharaan." },
            "rubah_salju":      { "name": "🦊 Rubah Salju",         "attack": 7,  "defense": 4,  "cost": 250000,         "tier": "D",   "description": "Rubah es cepat dengan keseimbangan attack & defense." },
            "harimau":          { "name": "🐯 Harimau Bengal",      "attack": 9,  "defense": 3,  "cost": 300000,         "tier": "D",   "description": "Raja hutan dengan serangan yang mematikan." },
            "beruang_kutub":    { "name": "🐻 Beruang Kutub",       "attack": 6,  "defense": 8,  "cost": 350000,         "tier": "D",   "description": "Beruang kutub raksasa dengan pertahanan tebal." },
            "elang_api":        { "name": "🦅 Elang Api",           "attack": 12, "defense": 3,  "cost": 1500000,        "tier": "C",   "description": "Elang berapi dengan serangan angin panas." },
            "panther_gelap":    { "name": "🐆 Panther Gelap",       "attack": 14, "defense": 5,  "cost": 2000000,        "tier": "C",   "description": "Panther hitam misterius dari hutan kelam." },
            "singa_emas":       { "name": "🦁 Singa Emas",          "attack": 13, "defense": 6,  "cost": 2500000,        "tier": "C",   "description": "Singa bermahkota emas, simbol keberanian." },
            "naga_mini":        { "name": "🐲 Naga Mini",           "attack": 18, "defense": 7,  "cost": 10000000,       "tier": "B",   "description": "Naga kecil dari telur langka, hembus api mini." },
            "fenrir":           { "name": "🌑 Fenrir",              "attack": 20, "defense": 8,  "cost": 15000000,       "tier": "B",   "description": "Serigala raksasa dari dimensi kegelapan." },
            "unicorn":          { "name": "🦄 Unicorn",             "attack": 15, "defense": 12, "cost": 20000000,       "tier": "B",   "description": "Kuda bertanduk perak yang memancarkan sihir." },
            "gryphon":          { "name": "🦁🦅 Gryphon",           "attack": 25, "defense": 12, "cost": 75000000,       "tier": "A",   "description": "Campuran singa dan elang, raja udara dan darat." },
            "thunderbird":      { "name": "⚡ Thunderbird",          "attack": 28, "defense": 10, "cost": 100000000,      "tier": "A",   "description": "Burung petir legendaris, setiap serangan mengandung listrik." },
            "cerberus":         { "name": "🔱 Cerberus",            "attack": 22, "defense": 18, "cost": 150000000,      "tier": "A",   "description": "Anjing berkepala tiga penjaga neraka." },
            "phoenix":          { "name": "🔥 Phoenix",             "attack": 35, "defense": 15, "cost": 500000000,      "tier": "S",   "description": "Burung api abadi yang bangkit dari abu, membakar semua musuh." },
            "leviathan_mini":   { "name": "🌊 Leviathan Mini",      "attack": 30, "defense": 25, "cost": 750000000,      "tier": "S",   "description": "Naga laut purba dari kedalaman samudra." },
            "manticore":        { "name": "🦂 Manticore",           "attack": 40, "defense": 18, "cost": 1000000000,     "tier": "S",   "description": "Singa bertubuh kalajengking, racun mematikan." },
            "bahamut":          { "name": "🐉 Bahamut",             "attack": 55, "defense": 30, "cost": 5000000000,     "tier": "SS",  "description": "Naga dewa legendaris, penguasa langit dan bumi." },
            "jormungandr":      { "name": "🌀 Jormungandr",         "attack": 50, "defense": 35, "cost": 7500000000,     "tier": "SS",  "description": "Ular raksasa melilit dunia, tiada yang lolos." },
            "celestial_dragon": { "name": "✨ Celestial Dragon",    "attack": 75, "defense": 50, "cost": 50000000000,    "tier": "SSS", "description": "Naga surgawi dari dimensi ke-7, melampaui semua makhluk." },
            "void_beast":       { "name": "🕳️ Void Beast",          "attack": 80, "defense": 55, "cost": 100000000000,   "tier": "SSS", "description": "Makhluk dari kekosongan abadi, menghancurkan realita." },
            "god_dragon":       { "name": "🌠 God Dragon",          "attack": 99, "defense": 75, "cost": 999000000000,   "tier": "SSS", "description": "ULTIMATE PET — Naga Tuhan, kekuatan tak tertandingi di semesta!" }
        }

        if (!existingRPG.items) { existingRPG.items = {}; needsSave = true }
        for (const [id, item] of Object.entries(defaultItems)) {
            if (!existingRPG.items[id]) { existingRPG.items[id] = item; needsSave = true }
        }
        if (!existingRPG.monsters) { existingRPG.monsters = {}; needsSave = true }
        for (const [id, mon] of Object.entries(defaultMonsters)) {
            if (!existingRPG.monsters[id]) { existingRPG.monsters[id] = mon; needsSave = true }
        }
        if (!existingRPG.dungeons) { existingRPG.dungeons = {}; needsSave = true }
        for (const [id, dun] of Object.entries(defaultDungeons)) {
            if (!existingRPG.dungeons[id]) { existingRPG.dungeons[id] = dun; needsSave = true }
        }
        if (!existingRPG.petData) { existingRPG.petData = {}; needsSave = true }
        for (const [id, pet] of Object.entries(defaultPetData)) {
            if (!existingRPG.petData[id]) { existingRPG.petData[id] = pet; needsSave = true }
        }
        if (!existingRPG.craftingRecipes) { existingRPG.craftingRecipes = {}; needsSave = true }
        const defaultRecipes = {
            "potion_kuat":          { "name": "Potion Besar (craft)",    "result": "potion_besar",    "amount": 2, "materials": { "bunga_langka": 2, "jamur_ajaib": 1 } },
            "super_potion_craft":   { "name": "Super Potion (craft)",    "result": "potion_super",    "amount": 1, "materials": { "bunga_langka": 5, "jamur_ajaib": 3, "kristal_es": 1 } },
            "elixir_hidup_craft":   { "name": "Elixir Kehidupan (craft)","result": "elixir_hidup",   "amount": 1, "materials": { "bulu_phoenix": 1, "bunga_langka": 8, "jamur_ajaib": 5 } },
            "elixir_mana_craft":    { "name": "Elixir Besar (craft)",    "result": "elixir_besar",    "amount": 2, "materials": { "jamur_ajaib": 3, "rumput_liar": 5 } },
            "mana_crystal_craft":   { "name": "Mana Crystal (craft)",    "result": "elixir_mana_penuh","amount": 1,"materials": { "kristal_es": 3, "jamur_ajaib": 5, "bunga_langka": 3 } },
            "mega_potion_craft":    { "name": "Mega Potion (craft)",     "result": "megapotion",      "amount": 1, "materials": { "bulu_phoenix": 2, "sisik_naga": 3, "bunga_langka": 10, "jamur_ajaib": 8 } },
            "divine_potion_craft":  { "name": "Divine Potion (craft)",   "result": "divinepotion",    "amount": 1, "materials": { "orichalcum": 1, "bulu_phoenix": 3, "kristal_es": 5, "bunga_langka": 15 } },
            "mega_elixir_craft":    { "name": "Mega Elixir (craft)",     "result": "megaelixir",      "amount": 1, "materials": { "kristal_es": 5, "racun_laba": 3, "jamur_ajaib": 10, "bunga_langka": 8 } },
            "divine_elixir_craft":  { "name": "Divine Elixir (craft)",   "result": "divineelixir",    "amount": 1, "materials": { "orichalcum": 1, "kristal_es": 8, "bulu_phoenix": 2, "jamur_ajaib": 15 } },
            "pedang_goblin":        { "name": "Pedang Goblin (craft)",   "result": "pedang_kayu",     "amount": 1, "materials": { "kulit_goblin": 5, "taring_goblin": 2 } },
            "busur_goblin":         { "name": "Busur Goblin (craft)",    "result": "busur_kayu",      "amount": 1, "materials": { "kulit_goblin": 3, "taring_goblin": 3 } },
            "pedang_orc":           { "name": "Pedang Besi (craft)",     "result": "pedang_besi",     "amount": 1, "materials": { "bijih_besi": 5, "kulit_orc": 3, "taring_goblin": 2 } },
            "tongkat_orc":          { "name": "Tongkat Sihir (craft)",   "result": "tongkat_sihir",   "amount": 1, "materials": { "batu_kekuatan": 3, "kulit_orc": 2, "batu_bara": 3 } },
            "busur_orc":            { "name": "Busur Besi (craft)",      "result": "busur_besi",      "amount": 1, "materials": { "bijih_besi": 4, "kulit_orc": 4, "taring_goblin": 1 } },
            "pedang_besi_tempa":    { "name": "Pedang Baja (craft)",     "result": "pedang_baja",     "amount": 1, "materials": { "bijih_besi": 10, "batu_bara": 5, "nikel": 2 } },
            "tongkat_kuno_craft":   { "name": "Tongkat Kuno (craft)",    "result": "tongkat_kuno",    "amount": 1, "materials": { "batu_kekuatan": 8, "sisik_naga": 3, "permata": 2 } },
            "pedang_racun":         { "name": "Pedang Racun (craft)",    "result": "pedang_baja",     "amount": 1, "materials": { "racun_laba": 5, "bijih_besi": 8, "kulit_goblin": 4 } },
            "busur_elven_craft":    { "name": "Busur Elven (craft)",     "result": "busur_elven",     "amount": 1, "materials": { "kristal_es": 5, "bulu_phoenix": 1, "batu_kekuatan": 5, "mithril": 2 } },
            "pedang_mithril_craft": { "name": "Pedang Mithril (craft)",  "result": "pedang_mithril",  "amount": 1, "materials": { "mithril": 5, "batu_kekuatan": 3, "sisik_naga": 2 } },
            "tongkat_mithril":      { "name": "Tongkat Mithril (craft)", "result": "pedang_mithril",  "amount": 1, "materials": { "mithril": 4, "kristal_es": 4, "batu_kekuatan": 5 } },
            "pedang_naga_craft":    { "name": "Pedang Naga (craft)",     "result": "pedang_naga",     "amount": 1, "materials": { "tulang_naga": 3, "sisik_naga": 10, "orichalcum": 2, "bulu_phoenix": 1 } },
            "tombak_halilintar_c":  { "name": "Tombak Halilintar (craft)","result": "tombak_halilintar","amount": 1,"materials": { "orichalcum": 3, "tulang_naga": 5, "bulu_phoenix": 3, "kristal_es": 5 } },
            "katana_jiwa_craft":    { "name": "Katana Jiwa (craft)",     "result": "katana_jiwa",     "amount": 1, "materials": { "mithril": 8, "tulang_naga": 4, "sisik_naga": 8, "batu_kekuatan": 10 } },
            "busur_abadi_craft":    { "name": "Busur Abadi (craft)",     "result": "busur_abadi",     "amount": 1, "materials": { "orichalcum": 2, "bulu_phoenix": 4, "mithril": 6, "kristal_es": 8 } },
            "tongkat_dewa_craft":   { "name": "Tongkat Dewa (craft)",    "result": "tongkat_dewa",    "amount": 1, "materials": { "orichalcum": 4, "bulu_phoenix": 5, "sisik_naga": 10, "kristal_es": 10 } },
            "pedang_dewa_craft":    { "name": "Pedang Dewa (craft)",     "result": "pedang_dewa",     "amount": 1, "materials": { "orichalcum": 10, "tulang_naga": 8, "bulu_phoenix": 8, "mithril": 10, "sisik_naga": 15 } },
            "baju_kulit_goblin":    { "name": "Zirah Kulit (craft)",     "result": "zirah_kulit",     "amount": 1, "materials": { "kulit_goblin": 8, "taring_goblin": 3 } },
            "perisai_goblin":       { "name": "Perisai Kayu (craft)",    "result": "perisai_kayu",    "amount": 1, "materials": { "kulit_goblin": 4, "taring_goblin": 1 } },
            "zirah_kulit_kuat":     { "name": "Zirah Besi (craft)",      "result": "zirah_besi",      "amount": 1, "materials": { "bijih_besi": 8, "kulit_orc": 3 } },
            "perisai_orc":          { "name": "Perisai Besi (craft)",    "result": "perisai_besi",    "amount": 1, "materials": { "bijih_besi": 5, "kulit_orc": 4, "batu_bara": 3 } },
            "jubah_penyihir_craft": { "name": "Jubah Penyihir (craft)",  "result": "jubah_penyihir",  "amount": 1, "materials": { "racun_laba": 4, "kulit_orc": 5, "bunga_langka": 5 } },
            "zirah_baja_craft":     { "name": "Zirah Baja (craft)",      "result": "zirah_baja",      "amount": 1, "materials": { "bijih_besi": 12, "batu_bara": 8, "nikel": 5, "kulit_orc": 4 } },
            "zirah_mithril_craft":  { "name": "Zirah Mithril (craft)",   "result": "zirah_mithril",   "amount": 1, "materials": { "mithril": 8, "sisik_naga": 5, "kristal_es": 2 } },
            "jubah_lich_craft":     { "name": "Jubah Lich (craft)",      "result": "jubah_lich",      "amount": 1, "materials": { "orichalcum": 3, "tulang_naga": 5, "kristal_es": 8, "mithril": 5 } },
            "perisai_naga_craft":   { "name": "Perisai Naga (craft)",    "result": "perisai_naga",    "amount": 1, "materials": { "sisik_naga": 10, "tulang_naga": 5, "batu_kekuatan": 8, "mithril": 4 } },
            "zirah_orichal_craft":  { "name": "Zirah Orichalcum (craft)","result": "zirah_orichalcum","amount": 1, "materials": { "orichalcum": 6, "mithril": 8, "sisik_naga": 12, "tulang_naga": 5 } },
            "zirah_dewa_craft":     { "name": "Zirah Dewa (craft)",      "result": "zirah_dewa",      "amount": 1, "materials": { "orichalcum": 12, "mithril": 15, "bulu_phoenix": 8, "sisik_naga": 15, "tulang_naga": 8 } },
            "permata_craft":        { "name": "Permata (dari batu)",     "result": "permata",         "amount": 1, "materials": { "batu": 20, "batu_bara": 5, "bijih_besi": 3 } },
            "nikel_craft":          { "name": "Nikel (craft)",           "result": "nikel",           "amount": 2, "materials": { "batu": 15, "batu_bara": 8, "bijih_besi": 5 } },
            "kristal_es_craft":     { "name": "Kristal Es (craft)",      "result": "kristal_es",      "amount": 1, "materials": { "batu": 10, "racun_laba": 3, "bunga_langka": 3 } },
            "batu_kekuatan_craft":  { "name": "Batu Kekuatan (craft)",   "result": "batu_kekuatan",   "amount": 1, "materials": { "batu": 12, "batu_bara": 5, "nikel": 2, "permata": 1 } },
            "racun_perkuat":        { "name": "Racun Kuat (craft)",      "result": "racun_laba",      "amount": 3, "materials": { "jamur_ajaib": 4, "rumput_liar": 8, "bunga_langka": 2 } },
            "bulu_phoenix_craft":   { "name": "Bulu Phoenix (craft)",    "result": "bulu_phoenix",    "amount": 1, "materials": { "sisik_naga": 5, "kristal_es": 3, "batu_kekuatan": 5 } },
            "sisik_naga_craft":     { "name": "Sisik Naga (craft)",      "result": "sisik_naga",      "amount": 2, "materials": { "kulit_orc": 5, "batu_kekuatan": 3, "batu_bara": 5 } },
            "tulang_naga_craft":    { "name": "Tulang Naga (craft)",     "result": "tulang_naga",     "amount": 1, "materials": { "sisik_naga": 8, "batu_kekuatan": 5, "orichalcum": 1 } },
            "mithril_craft":        { "name": "Mithril (craft)",         "result": "mithril",         "amount": 1, "materials": { "permata": 5, "batu_kekuatan": 8, "bijih_besi": 15, "nikel": 5 } },
            "orichalcum_craft":     { "name": "Orichalcum (craft)",      "result": "orichalcum",      "amount": 1, "materials": { "mithril": 5, "bulu_phoenix": 3, "sisik_naga": 10, "permata": 8 } }
        }
        for (const [id, recipe] of Object.entries(defaultRecipes)) {
            if (!existingRPG.craftingRecipes[id]) { existingRPG.craftingRecipes[id] = recipe; needsSave = true }
        }
        if (!existingRPG.quests) { existingRPG.quests = {}; needsSave = true }
        if (!existingRPG.players) { existingRPG.players = {}; needsSave = true }

        // Selalu sync locations agar data monster di tiap lokasi selalu benar
        const defaultLocations = {
            "desa": { "name": "🏡 Desa Pemula", "monsters": [1,2,3,4,5,6,7,8], "minLevel": 1, "maxLevel": 5 },
            "hutan": { "name": "🌲 Hutan Gelap", "monsters": [4,5,8,9,10,11,12], "minLevel": 3, "maxLevel": 9 },
            "rawa": { "name": "🌿 Rawa Beracun", "monsters": [9,11,13,15,16], "minLevel": 5, "maxLevel": 10 },
            "gua": { "name": "⛏️ Gua Naga", "monsters": [14,17,18,19,20,21,22,23,24], "minLevel": 8, "maxLevel": 16 },
            "padang_api": { "name": "🌋 Padang Api", "monsters": [15,22,23,26,31], "minLevel": 10, "maxLevel": 18 },
            "pegunungan": { "name": "🏔️ Pegunungan Es", "monsters": [27,29,31,32,34,37], "minLevel": 12, "maxLevel": 20 },
            "reruntuhan": { "name": "🏚️ Reruntuhan Kuno", "monsters": [24,28,29,30,36], "minLevel": 13, "maxLevel": 20 },
            "kuil_api": { "name": "🔥 Kuil Api Abadi", "monsters": [33,35,39,40,41], "minLevel": 16, "maxLevel": 24 },
            "laut_dalam": { "name": "🌊 Laut Dalam", "monsters": [34,38,40,43,50], "minLevel": 17, "maxLevel": 25 },
            "menara_sihir": { "name": "🗼 Menara Sihir", "monsters": [42,44,46,47,51], "minLevel": 20, "maxLevel": 30 },
            "hutan_iblis": { "name": "😈 Hutan Iblis", "monsters": [43,45,47,48,49], "minLevel": 22, "maxLevel": 32 },
            "neraka_atas": { "name": "🌑 Gerbang Neraka", "monsters": [47,48,49,50,51,52], "minLevel": 25, "maxLevel": 35 },
            "samudera_void": { "name": "🌀 Samudera Void", "monsters": [46,50,53,54,55], "minLevel": 28, "maxLevel": 38 },
            "gunung_titan": { "name": "⚡ Gunung Titan", "monsters": [52,53,54,55,56], "minLevel": 30, "maxLevel": 45 },
            "alam_dewa": { "name": "👁️ Alam Para Dewa", "monsters": [56,57,58,59], "minLevel": 38, "maxLevel": 52 },
            "puncak_abadi": { "name": "🌌 Puncak Abadi", "monsters": [60,61,62,63], "minLevel": 50, "maxLevel": 99 },
            "dimensi_supremasi": { "name": "👁️‍🗨️ Dimensi Supremasi", "monsters": [60,61,62,63], "minLevel": 65, "maxLevel": 999 },
            "batas_semesta": { "name": "🌠 Batas Alam Semesta", "monsters": [61,62,63], "minLevel": 75, "maxLevel": 999 },
            // ── Lokasi Baru ──
            "kota_hantu": { "name": "👻 Kota Hantu", "monsters": [12,22,30,35,44], "minLevel": 11, "maxLevel": 22 },
            "arena_gladiator": { "name": "🏟️ Arena Gladiator", "monsters": [10,14,18,24,28,32], "minLevel": 7, "maxLevel": 18 },
            "gua_kristal": { "name": "💎 Gua Kristal", "monsters": [27,29,37,53], "minLevel": 14, "maxLevel": 28 },
            "gurun_maut": { "name": "☀️ Gurun Maut", "monsters": [15,31,39,45,58], "minLevel": 18, "maxLevel": 35 },
            "istana_es": { "name": "❄️ Istana Es Abadi", "monsters": [27,37,53,57], "minLevel": 22, "maxLevel": 38 },
            "kuil_dewa": { "name": "🕌 Kuil Dewa Tersembunyi", "monsters": [51,56,57,58,59], "minLevel": 35, "maxLevel": 55 },
            "dimensi_kelam": { "name": "🕳️ Dimensi Kelam", "monsters": [46,47,54,59,63], "minLevel": 42, "maxLevel": 99 },
            // ── Lokasi Resource ──
            "tambang": { "name": "⛏️ Tambang Terbengkalai", "minLevel": 5, "maxLevel": 20, "ores": { "batu": 0.8, "batu_bara": 0.5, "bijih_besi": 0.2, "permata": 0.05, "mithril": 0.02, "orichalcum": 0.005 } },
            "padang_rumput": { "name": "🌿 Padang Rumput Liar", "minLevel": 2, "maxLevel": 20, "herbs": { "rumput_liar": 0.9, "bunga_langka": 0.3, "jamur_ajaib": 0.1, "kristal_es": 0.05 } }
        }
        if (!existingRPG.locations) existingRPG.locations = {}
        for (const [id, loc] of Object.entries(defaultLocations)) {
            existingRPG.locations[id] = loc
        }
        needsSave = true

        if (needsSave) fs.writeFileSync(rpgDBPath, JSON.stringify(existingRPG, null, 2))
    } catch(e) {
        console.error('RPG sync error:', e)
    }
}

if (!fs.existsSync(marketDBPath)) {
    fs.mkdirSync('./library/database', { recursive: true })
    const defaultMarket = {
        saham: {
            "ALIP":     { name: "PT Alip Tbk",           price: 500000,    change: 0, lastUpdate: Date.now(), category: "teknologi",   basePrice: 500000    },
            "NAGA":     { name: "Naga Corp",              price: 1200000,   change: 0, lastUpdate: Date.now(), category: "energi",      basePrice: 1200000   },
            "GOBLIN":   { name: "Goblin Inc",             price: 250000,    change: 0, lastUpdate: Date.now(), category: "retail",      basePrice: 250000    },
            "EMAS":     { name: "Tambang Emas Tbk",       price: 2500000,   change: 0, lastUpdate: Date.now(), category: "tambang",     basePrice: 2500000   },
            "DRAGON":   { name: "Dragon Air",             price: 750000,    change: 0, lastUpdate: Date.now(), category: "transportasi",basePrice: 750000    },
            "MITHRIL":  { name: "Mithril Resources",      price: 1800000,   change: 0, lastUpdate: Date.now(), category: "tambang",     basePrice: 1800000   },
            "DUNGEON":  { name: "Dungeon Explore Tbk",    price: 950000,    change: 0, lastUpdate: Date.now(), category: "hiburan",     basePrice: 950000    },
            "POTION":   { name: "Potion Pharma",          price: 450000,    change: 0, lastUpdate: Date.now(), category: "farmasi",     basePrice: 450000    },
            "RUNE":     { name: "Rune Tech",              price: 1100000,   change: 0, lastUpdate: Date.now(), category: "teknologi",   basePrice: 1100000   },
            "FISH":     { name: "Ocean Fish Corp",        price: 320000,    change: 0, lastUpdate: Date.now(), category: "konsumsi",    basePrice: 320000    },
            "ARMA":     { name: "Armament Kingdom",       price: 3500000,   change: 0, lastUpdate: Date.now(), category: "pertahanan",  basePrice: 3500000   },
            "HERB":     { name: "Herbal Nature Co",       price: 680000,    change: 0, lastUpdate: Date.now(), category: "farmasi",     basePrice: 680000    },
            "CRYSTAL":  { name: "Crystal Mine Corp",      price: 4200000,   change: 0, lastUpdate: Date.now(), category: "tambang",     basePrice: 4200000   },
            "ORICHAL":  { name: "Orichalcum Industries",  price: 8500000,   change: 0, lastUpdate: Date.now(), category: "tambang",     basePrice: 8500000   },
            "PHOENIX":  { name: "Phoenix Energy Tbk",     price: 5000000,   change: 0, lastUpdate: Date.now(), category: "energi",      basePrice: 5000000   },
            "SHADOW":   { name: "Shadow Corp",            price: 2700000,   change: 0, lastUpdate: Date.now(), category: "teknologi",   basePrice: 2700000   },
            "LICH":     { name: "Lich King Holdings",     price: 9900000,   change: 0, lastUpdate: Date.now(), category: "keuangan",    basePrice: 9900000   },
            "KRAKEN":   { name: "Kraken Shipping Lines",  price: 6600000,   change: 0, lastUpdate: Date.now(), category: "transportasi",basePrice: 6600000   },
            "ELVWOOD":  { name: "Elven Wood Industries",  price: 1500000,   change: 0, lastUpdate: Date.now(), category: "properti",    basePrice: 1500000   },
            "GODBLESS": { name: "God Blessing Fund",      price: 25000000,  change: 0, lastUpdate: Date.now(), category: "keuangan",    basePrice: 25000000  },
            // ── SAHAM ULTRA PREMIUM ──
            "VOID":     { name: "Void Dimension Corp",    price: 75000000,  change: 0, lastUpdate: Date.now(), category: "teknologi",   basePrice: 75000000  },
            "DRAGONX":  { name: "DragonX Holdings",       price: 150000000, change: 0, lastUpdate: Date.now(), category: "energi",      basePrice: 150000000 },
            "DIVINECO": { name: "Divine Corp Ltd",         price: 500000000, change: 0, lastUpdate: Date.now(), category: "keuangan",    basePrice: 500000000 },
            "OMEGAX":   { name: "OmegaX Syndicate",        price: 1000000000,change: 0, lastUpdate: Date.now(), category: "pertahanan",  basePrice: 1000000000},
            "GALACTA":  { name: "Galacta Universe Fund",   price: 2500000000,change: 0, lastUpdate: Date.now(), category: "keuangan",    basePrice: 2500000000}
        },
        properti: {
            "warung":          { name: "Warung Makan",         price: 5000000,      description: "Warung sederhana pinggir jalan",              passive: 50000      },
            "rumah_kecil":     { name: "Rumah Kecil",          price: 25000000,     description: "Rumah 1 kamar di pinggiran kota",              passive: 200000     },
            "kos_kosan":       { name: "Kos-kosan",            price: 80000000,     description: "10 kamar kos strategis deket kampus",          passive: 800000     },
            "apartemen":       { name: "Apartemen Studio",     price: 150000000,    description: "Apartemen studio di pusat kota",               passive: 1500000    },
            "gudang":          { name: "Gudang Logistik",      price: 200000000,    description: "Gudang 500m² dekat pelabuhan",                 passive: 1200000    },
            "ruko":            { name: "Ruko Komersial",       price: 350000000,    description: "Ruko 2 lantai lokasi premium",                 passive: 3000000    },
            "rumah_mewah":     { name: "Rumah Mewah",          price: 750000000,    description: "Rumah 4 kamar + kolam renang + taman",         passive: 5000000    },
            "villa":           { name: "Villa Tepi Pantai",    price: 1500000000,   description: "Villa eksklusif view laut langsung",           passive: 10000000   },
            "hotel_bintang":   { name: "Hotel Bintang 3",      price: 3000000000,   description: "Hotel 30 kamar di jantung kota",               passive: 30000000   },
            "mall_mini":       { name: "Mini Mall",            price: 5000000000,   description: "Mini mall 2 lantai 20+ tenant",                passive: 60000000   },
            "menara_kantor":   { name: "Menara Kantor",        price: 8000000000,   description: "Gedung perkantoran 10 lantai",                 passive: 90000000   },
            "pulau_pribadi":   { name: "Pulau Pribadi",        price: 50000000000,  description: "Pulau kecil eksklusif milik sendiri",          passive: 500000000  },
            "pabrik_senjata":  { name: "Pabrik Senjata",       price: 12000000000,  description: "Pabrik produksi senjata & armor",              passive: 150000000  },
            "kebun_raya":      { name: "Kebun Raya Herbal",    price: 2000000000,   description: "Kebun herbal seluas 50 hektar",                passive: 20000000   },
            "kastil":          { name: "Kastil Megah",         price: 100000000000, description: "Kastil legendaris dengan 50 ruangan",          passive: 1000000000 },
            // ── PROPERTI ULTRA PREMIUM ──
            "kota_buatan":     { name: "Kota Buatan Sendiri",  price: 500000000000, description: "Kota mini dengan 100.000 penduduk",            passive: 5000000000 },
            "istana_dewa":     { name: "Istana Dewa",          price: 1000000000000,description: "Istana surgawi di awan, satu-satunya di dunia", passive: 10000000000},
            "benua_pribadi":   { name: "Benua Pribadi",        price: 5000000000000,description: "Benua seluas Eropa, milik sendiri",             passive: 50000000000},
            "planet_buatan":   { name: "Planet Buatan",        price: 99000000000000,description: "Planet artifisial berteknologi terdepan",      passive: 999000000000}
        },
        kendaraan: {
            "motor":              { name: "Motor Biasa",           price: 3000000,       description: "Motor matic 125cc",                           passive: 0            },
            "motor_listrik":      { name: "Motor Listrik",         price: 8000000,       description: "Motor listrik ramah lingkungan",              passive: 0            },
            "mobil_city":         { name: "Mobil City Car",        price: 25000000,      description: "Mobil kecil irit BBM",                        passive: 0            },
            "pickup":             { name: "Pickup Truck",          price: 60000000,      description: "Pickup double cabin serba guna",              passive: 500000       },
            "truk":               { name: "Truk Pengiriman",       price: 150000000,     description: "Truk angkutan barang 10 ton",                 passive: 2000000      },
            "mobil_sport":        { name: "Mobil Sport",           price: 500000000,     description: "Supercar 600hp",                              passive: 0            },
            "bus_mini":           { name: "Bus Mini",              price: 350000000,     description: "Angkutan umum 20 penumpang",                  passive: 5000000      },
            "kapal_cargo":        { name: "Kapal Cargo",           price: 2000000000,    description: "Kapal pengiriman antar pulau",                passive: 20000000     },
            "helikopter":         { name: "Helikopter",            price: 3500000000,    description: "Heli pribadi 4 penumpang",                    passive: 0            },
            "yacht":              { name: "Yacht Mewah",           price: 8000000000,    description: "Kapal pesiar pribadi mewah",                  passive: 0            },
            "jet_pribadi":        { name: "Jet Pribadi",           price: 15000000000,   description: "Jet mewah kapasitas 8 orang",                 passive: 0            },
            "kapal_perang":       { name: "Kapal Perang",          price: 50000000000,   description: "Fregat bersenjata lengkap",                   passive: 50000000     },
            "tank_tempur":        { name: "Tank Tempur",           price: 25000000000,   description: "Main battle tank berlapis baja",              passive: 0            },
            "pesawat_tempur":     { name: "Pesawat Tempur",        price: 80000000000,   description: "Fighter jet generasi terbaru",                passive: 0            },
            "kapal_luar_angkasa": { name: "Kapal Luar Angkasa",    price: 999000000000,  description: "Roket interplanet buatan sendiri",            passive: 0            },
            // ── KENDARAAN ULTRA PREMIUM ──
            "kapal_induk":        { name: "Kapal Induk",           price: 5000000000000, description: "Aircraft carrier lengkap dgn 80 pesawat",     passive: 500000000    },
            "stasiun_luar_angkasa":{ name: "Stasiun Luar Angkasa", price: 20000000000000,description: "Space station orbit bumi, kapasitas 100 org",  passive: 1000000000   },
            "death_star":         { name: "Death Star Mini",       price: 100000000000000,description: "Senjata orbital terkuat di galaksi",          passive: 0            },
            "thor_hammer":        { name: "Kapal Thor Hammer",     price: 999000000000000,description: "THE ULTIMATE VEHICLE — melampaui segalanya",  passive: 10000000000  }
        },
        listings: []
    }
    fs.writeFileSync(marketDBPath, JSON.stringify(defaultMarket, null, 2))
}

function getMarketDB() {
    try { return JSON.parse(fs.readFileSync(marketDBPath)) }
    catch { return { saham: {}, properti: {}, kendaraan: {}, listings: [] } }
}

function saveMarketDB(data) {
    fs.writeFileSync(marketDBPath, JSON.stringify(data, null, 2))
}

// Sync item market baru ke market.json yang sudah ada
;(function syncRPGData() {
    try {
        if (!fs.existsSync(rpgDBPath)) return // defaultRPG sudah handle ini
        const db = JSON.parse(fs.readFileSync(rpgDBPath))
        let changed = false

        // ── Monsters baru ──────────────────────────────────────────────
        const newMonsters = {
            "1":  { "name": "🐀 Tikus Got",         "hp": 18,  "attack": 3,  "defense": 1,  "exp": 8,   "gold": 5,   "level": 1,  "tier": 1, "drops": { "kulit_goblin": 0.4 } },
            "2":  { "name": "🐛 Ulat Beracun",       "hp": 22,  "attack": 4,  "defense": 1,  "exp": 10,  "gold": 7,   "level": 1,  "tier": 1, "drops": { "racun_laba": 0.5, "rumput_liar": 0.6 } },
            "3":  { "name": "🐸 Katak Raksasa",      "hp": 28,  "attack": 5,  "defense": 2,  "exp": 14,  "gold": 10,  "level": 2,  "tier": 1, "drops": { "kulit_goblin": 0.5, "jamur_ajaib": 0.2 } },
            "4":  { "name": "👺 Goblin",              "hp": 30,  "attack": 5,  "defense": 2,  "exp": 15,  "gold": 10,  "level": 2,  "tier": 1, "drops": { "kulit_goblin": 0.7, "taring_goblin": 0.3 } },
            "5":  { "name": "🐺 Serigala Kecil",     "hp": 35,  "attack": 6,  "defense": 2,  "exp": 18,  "gold": 12,  "level": 3,  "tier": 1, "drops": { "kulit_goblin": 0.4, "taring_goblin": 0.2 } },
            "6":  { "name": "🦎 Kadal Pasir",        "hp": 32,  "attack": 6,  "defense": 3,  "exp": 16,  "gold": 11,  "level": 3,  "tier": 1, "drops": { "kulit_goblin": 0.5, "batu": 0.8 } },
            "7":  { "name": "🐝 Lebah Raksasa",      "hp": 25,  "attack": 7,  "defense": 1,  "exp": 13,  "gold": 9,   "level": 2,  "tier": 1, "drops": { "racun_laba": 0.4, "bunga_langka": 0.3 } },
            "8":  { "name": "🌿 Tanaman Berjalan",   "hp": 40,  "attack": 4,  "defense": 4,  "exp": 17,  "gold": 8,   "level": 3,  "tier": 1, "drops": { "rumput_liar": 0.9, "bunga_langka": 0.2 } },
            "9":  { "name": "🕷️ Laba-laba Raksasa",  "hp": 45,  "attack": 7,  "defense": 3,  "exp": 20,  "gold": 15,  "level": 4,  "tier": 2, "drops": { "racun_laba": 0.6, "kulit_goblin": 0.2 } },
            "10": { "name": "🐗 Babi Hutan Liar",    "hp": 55,  "attack": 8,  "defense": 4,  "exp": 25,  "gold": 18,  "level": 5,  "tier": 2, "drops": { "kulit_orc": 0.4, "batu_kekuatan": 0.1 } },
            "11": { "name": "💀 Goblin Pemanah",     "hp": 48,  "attack": 9,  "defense": 3,  "exp": 22,  "gold": 17,  "level": 5,  "tier": 2, "drops": { "taring_goblin": 0.7, "batu_bara": 0.3 } },
            "12": { "name": "🧟 Zombie Prajurit",    "hp": 60,  "attack": 8,  "defense": 5,  "exp": 28,  "gold": 20,  "level": 5,  "tier": 2, "drops": { "kulit_orc": 0.3, "batu_kekuatan": 0.1 } },
            "13": { "name": "🐊 Buaya Sungai",       "hp": 65,  "attack": 10, "defense": 6,  "exp": 30,  "gold": 22,  "level": 6,  "tier": 2, "drops": { "kulit_orc": 0.5, "racun_laba": 0.2 } },
            "14": { "name": "🧌 Orc Prajurit",       "hp": 70,  "attack": 10, "defense": 5,  "exp": 32,  "gold": 25,  "level": 6,  "tier": 2, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.15 } },
            "15": { "name": "🦂 Kalajengking Bara",  "hp": 58,  "attack": 11, "defense": 4,  "exp": 27,  "gold": 20,  "level": 6,  "tier": 2, "drops": { "racun_laba": 0.7, "batu_bara": 0.4 } },
            "16": { "name": "🐻 Beruang Hutan",      "hp": 80,  "attack": 9,  "defense": 6,  "exp": 35,  "gold": 28,  "level": 7,  "tier": 2, "drops": { "kulit_orc": 0.5, "taring_goblin": 0.3 } },
            "17": { "name": "👹 Goblin Jendral",     "hp": 80,  "attack": 12, "defense": 6,  "exp": 70,  "gold": 60,  "level": 7,  "tier": 3, "drops": { "batu_kekuatan": 0.5, "taring_goblin": 0.8 } },
            "18": { "name": "🌊 Troll Rawa",         "hp": 90,  "attack": 13, "defense": 7,  "exp": 55,  "gold": 45,  "level": 8,  "tier": 3, "drops": { "kulit_orc": 0.6, "batu_kekuatan": 0.25 } },
            "19": { "name": "🦁 Singa Berbisa",      "hp": 95,  "attack": 14, "defense": 6,  "exp": 60,  "gold": 50,  "level": 8,  "tier": 3, "drops": { "racun_laba": 0.5, "batu_kekuatan": 0.3 } },
            "20": { "name": "🌲 Troll Hutan",        "hp": 100, "attack": 13, "defense": 8,  "exp": 65,  "gold": 55,  "level": 9,  "tier": 3, "drops": { "kulit_orc": 0.4, "batu_kekuatan": 0.2 } },
            "21": { "name": "🐍 Ular Raksasa Biru",  "hp": 88,  "attack": 15, "defense": 5,  "exp": 62,  "gold": 52,  "level": 9,  "tier": 3, "drops": { "racun_laba": 0.8, "kristal_es": 0.15 } },
            "22": { "name": "🧙 Penyihir Gelap",     "hp": 75,  "attack": 16, "defense": 4,  "exp": 68,  "gold": 58,  "level": 10, "tier": 3, "drops": { "batu_kekuatan": 0.4, "permata": 0.1 } },
            "23": { "name": "🦅 Elang Api Kecil",    "hp": 85,  "attack": 14, "defense": 5,  "exp": 60,  "gold": 50,  "level": 9,  "tier": 3, "drops": { "bulu_phoenix": 0.15, "batu_kekuatan": 0.3 } },
            "24": { "name": "⚔️ Ksatria Mati",       "hp": 110, "attack": 15, "defense": 9,  "exp": 75,  "gold": 65,  "level": 10, "tier": 3, "drops": { "bijih_besi": 0.6, "batu_kekuatan": 0.35 } },
            "25": { "name": "🐲 Naga Kecil",         "hp": 130, "attack": 17, "defense": 9,  "exp": 90,  "gold": 80,  "level": 11, "tier": 4, "drops": { "sisik_naga": 0.4, "batu_kekuatan": 0.3 } },
            "26": { "name": "🌋 Elemental Api",      "hp": 120, "attack": 19, "defense": 8,  "exp": 95,  "gold": 85,  "level": 12, "tier": 4, "drops": { "batu_kekuatan": 0.5, "permata": 0.2 } },
            "27": { "name": "❄️ Elemental Es",       "hp": 115, "attack": 18, "defense": 10, "exp": 90,  "gold": 80,  "level": 12, "tier": 4, "drops": { "kristal_es": 0.6, "batu_kekuatan": 0.25 } },
            "28": { "name": "🦈 Hiu Daratan",        "hp": 125, "attack": 20, "defense": 7,  "exp": 98,  "gold": 88,  "level": 13, "tier": 4, "drops": { "kulit_orc": 0.3, "tulang_naga": 0.1 } },
            "29": { "name": "🧿 Beholder",           "hp": 140, "attack": 18, "defense": 11, "exp": 105, "gold": 95,  "level": 13, "tier": 4, "drops": { "permata": 0.3, "batu_kekuatan": 0.4 } },
            "30": { "name": "🦴 Raja Zombie",        "hp": 145, "attack": 19, "defense": 10, "exp": 110, "gold": 100, "level": 14, "tier": 4, "drops": { "tulang_naga": 0.15, "mithril": 0.05 } },
            "31": { "name": "🌪️ Djinn Badai",        "hp": 130, "attack": 22, "defense": 8,  "exp": 115, "gold": 105, "level": 14, "tier": 4, "drops": { "kristal_es": 0.4, "permata": 0.25 } },
            "32": { "name": "🐯 Harimau Roh",        "hp": 135, "attack": 21, "defense": 9,  "exp": 108, "gold": 98,  "level": 13, "tier": 4, "drops": { "batu_kekuatan": 0.45, "kristal_es": 0.2 } },
            "33": { "name": "🐉 Naga",               "hp": 160, "attack": 23, "defense": 12, "exp": 140, "gold": 130, "level": 15, "tier": 5, "drops": { "sisik_naga": 0.5, "tulang_naga": 0.2, "batu_kekuatan": 0.3 } },
            "34": { "name": "🦊 Serigala Roh",       "hp": 150, "attack": 22, "defense": 10, "exp": 130, "gold": 120, "level": 15, "tier": 5, "drops": { "kristal_es": 0.4, "batu_kekuatan": 0.2 } },
            "35": { "name": "🌑 Wraith Kegelapan",   "hp": 145, "attack": 25, "defense": 9,  "exp": 145, "gold": 135, "level": 16, "tier": 5, "drops": { "permata": 0.4, "mithril": 0.08 } },
            "36": { "name": "🗿 Golem Batu",         "hp": 200, "attack": 20, "defense": 18, "exp": 155, "gold": 145, "level": 17, "tier": 5, "drops": { "batu_kekuatan": 0.6, "mithril": 0.1, "permata": 0.2 } },
            "37": { "name": "🧊 Ice Drake",          "hp": 185, "attack": 24, "defense": 15, "exp": 165, "gold": 155, "level": 17, "tier": 5, "drops": { "kristal_es": 0.6, "tulang_naga": 0.3 } },
            "38": { "name": "🌊 Leviathan Kecil",    "hp": 195, "attack": 23, "defense": 14, "exp": 170, "gold": 160, "level": 18, "tier": 5, "drops": { "sisik_naga": 0.4, "tulang_naga": 0.25 } },
            "39": { "name": "🔥 Ifrit",              "hp": 175, "attack": 27, "defense": 12, "exp": 160, "gold": 150, "level": 17, "tier": 5, "drops": { "bulu_phoenix": 0.3, "permata": 0.3 } },
            "40": { "name": "⚡ Raksasa Petir",      "hp": 190, "attack": 26, "defense": 13, "exp": 158, "gold": 148, "level": 18, "tier": 5, "drops": { "kristal_es": 0.5, "mithril": 0.1 } },
            "41": { "name": "🦅 Phoenix",            "hp": 220, "attack": 28, "defense": 15, "exp": 200, "gold": 190, "level": 20, "tier": 6, "drops": { "bulu_phoenix": 0.5, "sisik_naga": 0.3 } },
            "42": { "name": "👑 Lich King",          "hp": 300, "attack": 32, "defense": 18, "exp": 280, "gold": 260, "level": 22, "tier": 6, "drops": { "orichalcum": 0.2, "bulu_phoenix": 0.3, "mithril": 0.5 } },
            "43": { "name": "🐲 Naga Tua",           "hp": 280, "attack": 30, "defense": 17, "exp": 250, "gold": 230, "level": 21, "tier": 6, "drops": { "sisik_naga": 0.6, "tulang_naga": 0.4, "mithril": 0.15 } },
            "44": { "name": "🕯️ Overlord Sihir",     "hp": 260, "attack": 35, "defense": 14, "exp": 270, "gold": 250, "level": 22, "tier": 6, "drops": { "permata": 0.5, "mithril": 0.2, "orichalcum": 0.08 } },
            "45": { "name": "🦂 Kalajengking Raksasa","hp": 290, "attack": 29, "defense": 20, "exp": 240, "gold": 220, "level": 21, "tier": 6, "drops": { "racun_laba": 0.8, "mithril": 0.1, "permata": 0.3 } },
            "46": { "name": "🌀 Void Walker",        "hp": 270, "attack": 33, "defense": 16, "exp": 260, "gold": 240, "level": 23, "tier": 6, "drops": { "mithril": 0.25, "orichalcum": 0.1 } },
            "47": { "name": "🌑 Demon Lord",         "hp": 380, "attack": 40, "defense": 22, "exp": 400, "gold": 380, "level": 25, "tier": 7, "drops": { "orichalcum": 0.25, "mithril": 0.4, "tulang_naga": 0.5 } },
            "48": { "name": "🐉 Naga Merah Purba",   "hp": 420, "attack": 38, "defense": 24, "exp": 450, "gold": 420, "level": 27, "tier": 7, "drops": { "sisik_naga": 0.8, "tulang_naga": 0.6, "orichalcum": 0.2 } },
            "49": { "name": "⚔️ Ksatria Iblis",      "hp": 360, "attack": 42, "defense": 20, "exp": 420, "gold": 400, "level": 26, "tier": 7, "drops": { "mithril": 0.5, "orichalcum": 0.15, "permata": 0.4 } },
            "50": { "name": "🌊 Leviathan",          "hp": 450, "attack": 36, "defense": 26, "exp": 480, "gold": 450, "level": 28, "tier": 7, "drops": { "tulang_naga": 0.7, "orichalcum": 0.2, "kristal_es": 0.5 } },
            "51": { "name": "🦴 Necromancer Agung",  "hp": 340, "attack": 45, "defense": 18, "exp": 460, "gold": 440, "level": 27, "tier": 7, "drops": { "orichalcum": 0.3, "mithril": 0.45, "bulu_phoenix": 0.4 } },
            "52": { "name": "🌋 Titan Api",          "hp": 550, "attack": 50, "defense": 30, "exp": 650, "gold": 620, "level": 30, "tier": 8, "drops": { "orichalcum": 0.35, "bulu_phoenix": 0.5, "mithril": 0.6 } },
            "53": { "name": "❄️ Titan Es",           "hp": 560, "attack": 48, "defense": 33, "exp": 680, "gold": 650, "level": 32, "tier": 8, "drops": { "kristal_es": 0.8, "orichalcum": 0.3, "mithril": 0.55 } },
            "54": { "name": "🌑 Abyssal Horror",     "hp": 600, "attack": 55, "defense": 28, "exp": 750, "gold": 720, "level": 33, "tier": 8, "drops": { "orichalcum": 0.4, "mithril": 0.65, "permata": 0.5 } },
            "55": { "name": "🐲 Naga Hitam Kuno",    "hp": 620, "attack": 52, "defense": 35, "exp": 780, "gold": 750, "level": 35, "tier": 8, "drops": { "sisik_naga": 1.0, "tulang_naga": 0.8, "orichalcum": 0.35 } },
            "56": { "name": "👁️ Dewa Kegelapan",     "hp": 800, "attack": 65, "defense": 40, "exp": 1100,"gold": 1050,"level": 38, "tier": 9, "drops": { "orichalcum": 0.5, "mithril": 0.8, "bulu_phoenix": 0.6 } },
            "57": { "name": "🔱 Poseidon Palsu",     "hp": 850, "attack": 60, "defense": 45, "exp": 1200,"gold": 1150,"level": 40, "tier": 9, "drops": { "orichalcum": 0.55, "tulang_naga": 1.0, "kristal_es": 0.7 } },
            "58": { "name": "☄️ Meteor Golem",       "hp": 900, "attack": 58, "defense": 50, "exp": 1300,"gold": 1250,"level": 42, "tier": 9, "drops": { "orichalcum": 0.6, "permata": 0.8, "mithril": 0.9 } },
            "59": { "name": "🌑 Void Dragon",        "hp": 950, "attack": 70, "defense": 42, "exp": 1400,"gold": 1350,"level": 45, "tier": 9, "drops": { "orichalcum": 0.65, "sisik_naga": 1.0, "tulang_naga": 1.0 } },
            "60": { "name": "⚡ Zeus Terlarang",     "hp": 1200,"attack": 80, "defense": 55, "exp": 2000,"gold": 1950,"level": 50, "tier": 10,"drops": { "orichalcum": 0.8, "mithril": 1.0, "bulu_phoenix": 0.9 } },
            "61": { "name": "🔥 Surtr Sang Api",     "hp": 1400,"attack": 85, "defense": 50, "exp": 2200,"gold": 2150,"level": 52, "tier": 10,"drops": { "orichalcum": 0.85, "bulu_phoenix": 1.0, "tulang_naga": 1.0 } },
            "62": { "name": "💀 Azrael Si Maut",     "hp": 1600,"attack": 90, "defense": 58, "exp": 2500,"gold": 2450,"level": 55, "tier": 10,"drops": { "orichalcum": 1.0, "mithril": 1.0, "permata": 1.0, "bulu_phoenix": 1.0 } },
            "63": { "name": "🌌 Chaos Dragon",      "hp": 2000,"attack": 100,"defense": 65, "exp": 3000,"gold": 2950,"level": 60, "tier": 10,"drops": { "orichalcum": 1.0, "mithril": 1.0, "sisik_naga": 1.0, "tulang_naga": 1.0, "bulu_phoenix": 1.0 } }
        }
        if (!db.monsters) { db.monsters = {}; changed = true }
        for (const [k, v] of Object.entries(newMonsters)) {
            if (!db.monsters[k]) { db.monsters[k] = v; changed = true }
            else { db.monsters[k] = { ...v, ...db.monsters[k], tier: v.tier } ; changed = true } // update tier tanpa hapus data lama
        }

        // ── Lokasi baru ────────────────────────────────────────────────
        const newLocations = {
            "desa":         { "name": "🏡 Desa Pemula",        "monsters": [1,2,3,4,5,6,7,8],         "minLevel": 1,  "maxLevel": 5  },
            "hutan":        { "name": "🌲 Hutan Gelap",        "monsters": [4,5,8,9,10,11,12],         "minLevel": 3,  "maxLevel": 9  },
            "rawa":         { "name": "🌿 Rawa Beracun",       "monsters": [9,11,13,15,16],             "minLevel": 5,  "maxLevel": 10 },
            "gua":          { "name": "⛏️ Gua Naga",           "monsters": [14,17,18,19,20,21,22,23,24],"minLevel": 8,  "maxLevel": 16 },
            "padang_api":   { "name": "🌋 Padang Api",         "monsters": [15,22,23,26,31],            "minLevel": 10, "maxLevel": 18 },
            "pegunungan":   { "name": "🏔️ Pegunungan Es",      "monsters": [27,29,31,32,34,37],         "minLevel": 12, "maxLevel": 20 },
            "reruntuhan":   { "name": "🏚️ Reruntuhan Kuno",    "monsters": [24,28,29,30,36],            "minLevel": 13, "maxLevel": 20 },
            "kuil_api":     { "name": "🔥 Kuil Api Abadi",     "monsters": [33,35,39,40,41],            "minLevel": 16, "maxLevel": 24 },
            "laut_dalam":   { "name": "🌊 Laut Dalam",         "monsters": [34,38,40,43,50],            "minLevel": 17, "maxLevel": 25 },
            "menara_sihir": { "name": "🗼 Menara Sihir",       "monsters": [42,44,46,47,51],            "minLevel": 20, "maxLevel": 30 },
            "hutan_iblis":  { "name": "😈 Hutan Iblis",        "monsters": [43,45,47,48,49],            "minLevel": 22, "maxLevel": 32 },
            "neraka_atas":  { "name": "🌑 Gerbang Neraka",     "monsters": [47,48,49,50,51,52],         "minLevel": 25, "maxLevel": 35 },
            "samudera_void":{ "name": "🌀 Samudera Void",      "monsters": [46,50,53,54,55],            "minLevel": 28, "maxLevel": 38 },
            "gunung_titan": { "name": "⚡ Gunung Titan",       "monsters": [52,53,54,55,56],            "minLevel": 30, "maxLevel": 45 },
            "alam_dewa":    { "name": "👁️ Alam Para Dewa",     "monsters": [56,57,58,59],               "minLevel": 38, "maxLevel": 52 },
            "kekacauan":    { "name": "🌌 Dimensi Kekacauan",  "monsters": [60,61,62,63],               "minLevel": 50, "maxLevel": 999 },
            "dimensi_supremasi": { "name": "👁️‍🗨️ Dimensi Supremasi", "monsters": [60,61,62,63],  "minLevel": 65, "maxLevel": 999 },
            "batas_semesta":     { "name": "🌠 Batas Alam Semesta",  "monsters": [61,62,63],      "minLevel": 75, "maxLevel": 999 },
            "tambang":      { "name": "⛏️ Tambang Terbengkalai","minLevel": 5, "maxLevel": 30, "ores": { "batu": 0.8, "batu_bara": 0.5, "bijih_besi": 0.2, "permata": 0.05, "mithril": 0.02, "orichalcum": 0.005 } },
            "padang_rumput":{ "name": "🌾 Padang Rumput Liar", "minLevel": 2, "maxLevel": 20, "herbs": { "rumput_liar": 0.9, "bunga_langka": 0.3, "jamur_ajaib": 0.1, "kristal_es": 0.05 } }
        }
        if (!db.locations) { db.locations = {}; changed = true }
        for (const [k, v] of Object.entries(newLocations)) {
            db.locations[k] = v; changed = true // selalu update lokasi agar monster list terbaru
        }

        if (changed) fs.writeFileSync(rpgDBPath, JSON.stringify(db, null, 2))
    } catch(e) { console.error('syncRPGData error:', e) }
})()

;(function syncMarketNew() {
    try {
        const mdb = getMarketDB()
        let changed = false
        const newSaham = {
            "VOID":     { name: "Void Dimension Corp",    price: 75000000,   change: 0, lastUpdate: Date.now(), category: "teknologi",  basePrice: 75000000   },
            "DRAGONX":  { name: "DragonX Holdings",       price: 150000000,  change: 0, lastUpdate: Date.now(), category: "energi",     basePrice: 150000000  },
            "DIVINECO": { name: "Divine Corp Ltd",         price: 500000000,  change: 0, lastUpdate: Date.now(), category: "keuangan",   basePrice: 500000000  },
            "OMEGAX":   { name: "OmegaX Syndicate",        price: 1000000000, change: 0, lastUpdate: Date.now(), category: "pertahanan", basePrice: 1000000000 },
            "GALACTA":  { name: "Galacta Universe Fund",   price: 2500000000, change: 0, lastUpdate: Date.now(), category: "keuangan",   basePrice: 2500000000 }
        }
        const newProperti = {
            "kota_buatan":   { name: "Kota Buatan Sendiri",  price: 500000000000,  description: "Kota mini dengan 100.000 penduduk",            passive: 5000000000  },
            "istana_dewa":   { name: "Istana Dewa",          price: 1000000000000, description: "Istana surgawi di awan, satu-satunya di dunia", passive: 10000000000 },
            "benua_pribadi": { name: "Benua Pribadi",        price: 5000000000000, description: "Benua seluas Eropa, milik sendiri",             passive: 50000000000 },
            "planet_buatan": { name: "Planet Buatan",        price: 99000000000000,description: "Planet artifisial berteknologi terdepan",       passive: 999000000000}
        }
        const newKendaraan = {
            "kapal_induk":         { name: "Kapal Induk",            price: 5000000000000,  description: "Aircraft carrier lengkap dgn 80 pesawat",    passive: 500000000   },
            "stasiun_luar_angkasa":{ name: "Stasiun Luar Angkasa",   price: 20000000000000, description: "Space station orbit bumi, kapasitas 100 org", passive: 1000000000  },
            "death_star":          { name: "Death Star Mini",        price: 100000000000000,description: "Senjata orbital terkuat di galaksi",          passive: 0           },
            "thor_hammer":         { name: "Kapal Thor Hammer",      price: 999000000000000,description: "THE ULTIMATE VEHICLE — melampaui segalanya",  passive: 10000000000 }
        }
        if (!mdb.saham) { mdb.saham = {}; changed = true }
        for (const [k,v] of Object.entries(newSaham)) { if (!mdb.saham[k]) { mdb.saham[k] = v; changed = true } }
        if (!mdb.properti) { mdb.properti = {}; changed = true }
        for (const [k,v] of Object.entries(newProperti)) { if (!mdb.properti[k]) { mdb.properti[k] = v; changed = true } }
        if (!mdb.kendaraan) { mdb.kendaraan = {}; changed = true }
        for (const [k,v] of Object.entries(newKendaraan)) { if (!mdb.kendaraan[k]) { mdb.kendaraan[k] = v; changed = true } }
        if (!mdb.listings) { mdb.listings = []; changed = true }
        if (changed) saveMarketDB(mdb)
    } catch(e) { console.error('syncMarketNew error:', e) }
})()

function fluctuateSaham(marketDB) {
    const now = Date.now()
    for (const [ticker, saham] of Object.entries(marketDB.saham)) {
        if (now - saham.lastUpdate > 5 * 60 * 1000) {
            const pct = (Math.random() * 20 - 10) / 100
            const oldPrice = saham.price
            saham.price = Math.max(100, Math.floor(saham.price * (1 + pct)))
            saham.change = Math.round((saham.price - oldPrice) / oldPrice * 100 * 10) / 10
            saham.lastUpdate = now
        }
    }
    return marketDB
}

function calcTotalAssets(player, marketDB) {
    let total = (player.gold || 0) + (player.bank?.balance || 0)
    const walletAssets = player.assets || {}
    const bankAssets = player.bankAssets || {}
    for (const cat of ['saham', 'properti', 'kendaraan']) {
        const w = walletAssets[cat] || {}
        const b = bankAssets[cat] || {}
        const allKeys = new Set([...Object.keys(w), ...Object.keys(b)])
        for (const key of allKeys) {
            const qty = (w[key] || 0) + (b[key] || 0)
            if (qty <= 0) continue
            if (cat === 'saham' && marketDB.saham[key]) total += marketDB.saham[key].price * qty
            else if (marketDB[cat]?.[key]) total += marketDB[cat][key].price * qty
        }
    }
    return total
}

function initPlayerRPG(jid, className = "warrior") {
    const classes = {
        // === CLASS DASAR ===
        "warrior":    { hp: 100, mp: 30,   attack: 15, defense: 10, agility: 5  },
        "mage":       { hp: 60,  mp: 100,  attack: 20, defense: 5,  agility: 8  },
        "archer":     { hp: 80,  mp: 50,   attack: 12, defense: 7,  agility: 15 },
        // === CLASS LANJUTAN ===
        "peri":       { hp: 65,  mp: 110,  attack: 14, defense: 6,  agility: 20 }, // support/heal hybrid
        "iblis":      { hp: 90,  mp: 70,   attack: 22, defense: 8,  agility: 10 }, // damage dealer gelap
        "golem":      { hp: 180, mp: 20,   attack: 18, defense: 25, agility: 2  }, // tank ultimate
        "darkmage":   { hp: 55,  mp: 130,  attack: 28, defense: 3,  agility: 9  }, // burst magic
        "mercenary":  { hp: 95,  mp: 40,   attack: 18, defense: 12, agility: 12 }, // all-rounder
        "assassin":   { hp: 70,  mp: 60,   attack: 16, defense: 5,  agility: 28 }, // crit/burst
        "paladin":    { hp: 120, mp: 80,   attack: 13, defense: 18, agility: 6  }, // holy tank
        "necromancer":{ hp: 60,  mp: 140,  attack: 25, defense: 4,  agility: 7  }, // summon/debuff
        "berserker":  { hp: 110, mp: 20,   attack: 24, defense: 8,  agility: 13 }, // raw power
        "ranger":     { hp: 75,  mp: 55,   attack: 13, defense: 8,  agility: 22 }, // precision + trap
        "shaman":     { hp: 70,  mp: 120,  attack: 16, defense: 7,  agility: 11 }, // nature magic
        // === CLASS OWNER ===
        "the_creator":{ hp: 9999,mp: 9999, attack: 999,defense: 999,agility: 999 }
    }
    const selectedClass = classes[className] || classes["warrior"]
    return {
        jid: jid,
        class: className,
        level: 1,
        exp: 0,
        expToNextLevel: 100,
        maxHp: selectedClass.hp,
        hp: selectedClass.hp,
        maxMp: selectedClass.mp,
        mp: selectedClass.mp,
        attack: selectedClass.attack,
        defense: selectedClass.defense,
        agility: selectedClass.agility,
        gold: 50,
        inventory: { "potion": 3, "pedang_kayu": 1, "baju_kain": 1 },
        equipment: { weapon: null, armor: null },
        location: "desa",
        battles: 0,
        monstersDefeated: 0,
        lastBattle: 0,
        activeQuest: null,
        questProgress: 0,
        lastDaily: 0,
        lastPvp: 0,
        pvpWins: 0,
        pvpLosses: 0,
        fishing: null,
        pet: null,
        dungeonState: null,
        miningState: null,
        lastForage: 0,
        bank: { balance: 0, totalDeposited: 0, totalWithdrawn: 0 },
        lastWeekly: 0,
        lastMonthly: 0,
        lastYearly: 0,
        lastSlot: 0,
        lastPassive: 0,
        assets: { saham: {}, properti: {}, kendaraan: {} },
        bankAssets: { saham: {}, properti: {}, kendaraan: {} },
        fishing: { lastCatch: 0, totalCatch: 0, equippedRod: 'starter_rod', equippedBait: null }
    }
}

function getRandomMonster(location, playerLevel) {
    const rpgDB = JSON.parse(fs.readFileSync(rpgDBPath))
    const locationData = rpgDB.locations[location]
    if (!locationData || !locationData.monsters || locationData.monsters.length === 0) return null

    const plvl = playerLevel || 1

    // Filter monster yang sesuai level player (±4 level dari player, tidak lebih rendah 3)
    const suitable = locationData.monsters.filter(id => {
        const m = rpgDB.monsters[String(id)]
        if (!m) return false
        const diff = m.level - plvl
        return diff >= -3 && diff <= 4
    })

    // Jika tidak ada yang cocok, ambil yang paling dekat levelnya
    const pool = suitable.length > 0 ? suitable : locationData.monsters

    // Weighted random: monster yang levelnya lebih dekat ke player lebih sering muncul
    const weights = pool.map(id => {
        const m = rpgDB.monsters[String(id)]
        if (!m) return 1
        const diff = Math.abs(m.level - plvl)
        return Math.max(1, 10 - diff)
    })
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let rand = Math.random() * totalWeight
    let chosen = pool[0]
    for (let i = 0; i < pool.length; i++) {
        rand -= weights[i]
        if (rand <= 0) { chosen = pool[i]; break }
    }

    const monsterId = String(chosen)
    const monster = rpgDB.monsters[monsterId]
    if (!monster) return null

    // Scale HP/ATK/DEF ringan berdasarkan selisih level player vs monster
    const levelDiff = Math.max(0, plvl - monster.level)
    const scale = 1 + (levelDiff * 0.05) // +5% per level di atas monster
    return {
        ...monster,
        id: monsterId,
        hp:      Math.floor(monster.hp      * scale),
        attack:  Math.floor(monster.attack  * scale),
        defense: Math.floor(monster.defense * scale),
        exp:     Math.floor(monster.exp     * Math.max(1, scale * 0.8)),
        gold:    Math.floor(monster.gold    * Math.max(1, scale * 0.8))
    }
}

function getPlayerTotalStats(player) {
    const rpgDB = JSON.parse(fs.readFileSync(rpgDBPath))
    let totalStats = { attack: player.attack || 0, defense: player.defense || 0 }
    if (player.equipment?.weapon) {
        const weapon = rpgDB.items[player.equipment.weapon]
        if (weapon) totalStats.attack += weapon.attack || 0
    }
    if (player.equipment?.armor) {
        const armor = rpgDB.items[player.equipment.armor]
        if (armor) totalStats.defense += armor.defense || 0
    }
    // Tambahkan properti totalAttack & totalDefense untuk kompatibilitas
    totalStats.totalAttack = totalStats.attack
    totalStats.totalDefense = totalStats.defense
    return totalStats
}

function calculateDamage(attacker, defender) {
    const isPlayerAttacker = !!(attacker && attacker.class)
    const attackerStats = isPlayerAttacker ? getPlayerTotalStats(attacker) : { attack: attacker?.attack || 0, defense: attacker?.defense || 0 }
    const defenderStats = !isPlayerAttacker ? getPlayerTotalStats(defender) : { attack: defender?.attack || 0, defense: defender?.defense || 0 }

    let baseAtk = attackerStats.attack || 0
    let baseDef = defenderStats.defense || 0

    // ── Bonus dari level (1.5% per level) ──
    const attackerLevel = attacker.level || 1
    const defenderLevel = defender.level || 1
    const levelBonus = 1 + (attackerLevel * 0.015)
    baseAtk = Math.floor(baseAtk * levelBonus)

    // ── Selisih level berpengaruh besar: tiap 5 level lebih tinggi = +10% dmg, tiap 5 level lebih rendah = -12% dmg ──
    const levelDiff = attackerLevel - defenderLevel
    let levelMultiplier = 1
    if (levelDiff > 0) {
        levelMultiplier = 1 + Math.floor(levelDiff / 5) * 0.10
    } else if (levelDiff < 0) {
        levelMultiplier = Math.max(0.15, 1 + Math.floor(levelDiff / 5) * 0.12)
    }

    // ── Class multiplier: the_creator selalu godlike ──
    let classMultiplier = 1
    if (attacker.class === 'the_creator') classMultiplier = 10
    if (defender.class === 'the_creator') baseDef = Math.max(baseDef, 9999)

    // Variance ±20%
    const variance = 0.8 + Math.random() * 0.4
    const rawDmg = Math.floor(((baseAtk * variance * levelMultiplier * classMultiplier) - (baseDef * 0.75)))
    const damage = Math.max(1, rawDmg)

    // Crit chance dari agility
    const critChance = Math.min(0.5, (attacker.agility || 5) / 100)
    const isCritical = Math.random() < critChance
    return { damage: isCritical ? Math.floor(damage * 2.0) : damage, isCritical }
}

function gainExp(player, exp) {
    if (!player) return false
    player.exp = (player.exp || 0) + exp
    player.expToNextLevel = player.expToNextLevel || 100

    let leveledUp = false
    while (player.exp >= player.expToNextLevel) {
        player.level = (player.level || 1) + 1
        player.exp -= player.expToNextLevel
        player.expToNextLevel = Math.floor(player.expToNextLevel * 1.5)

        // Stat gain per level — class the_creator tetap godlike
        if (player.class === 'the_creator') {
            player.maxHp    = 9999
            player.maxMp    = 9999
            player.attack   = 999
            player.defense  = 999
            player.agility  = 999
        } else {
            // Bonus stat naik seiring level agar gap level terasa
            const lvl = player.level
            const hpGain  = 15 + Math.floor(lvl / 5) * 5          // +15 base, tiap 5 level tambah 5
            const mpGain  = 8  + Math.floor(lvl / 10) * 3
            const atkGain = 3  + Math.floor(lvl / 8)              // +3 base, tiap 8 level tambah 1
            const defGain = 2  + Math.floor(lvl / 10)
            const agiGain = 1  + Math.floor(lvl / 15)

            player.maxHp   = (player.maxHp  || 100) + hpGain
            player.maxMp   = (player.maxMp  || 30)  + mpGain
            player.attack  = (player.attack  || 10)  + atkGain
            player.defense = (player.defense || 5)   + defGain
            player.agility = (player.agility || 5)   + agiGain
        }
        player.hp = Math.min((player.hp || 1) + Math.floor(player.maxHp * 0.3), player.maxHp)
        player.mp = Math.min((player.mp || 0) + Math.floor(player.maxMp * 0.3), player.maxMp)
        leveledUp = true
    }
    return leveledUp
}

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function msToTime(ms) {
    if (ms < 0) return '0 detik'
    let seconds = Math.floor(ms / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)
    seconds = seconds % 60
    minutes = minutes % 60
    hours = hours % 24
    let result = []
    if (days > 0) result.push(`${days} hari`)
    if (hours > 0) result.push(`${hours} jam`)
    if (minutes > 0) result.push(`${minutes} menit`)
    if (seconds > 0 && result.length === 0) result.push(`${seconds} detik`)
    return result.join(' ') || 'sebentar lagi'
}

// 
//  LIFE SIMULATOR HELPERS
// 

function getHarmoniBar(nilai) {
    const filled = Math.floor(nilai / 10)
    const empty = 10 - filled
    let color = '❤️'
    if (nilai <= 30) color = '🖤'
    else if (nilai <= 60) color = '🧡'
    else if (nilai <= 80) color = '💛'
    else color = '❤️'
    return color + ' [' + '█'.repeat(filled) + '░'.repeat(empty) + '] ' + nilai + '/100'
}

function hitungAnniversary(tanggalNikah) {
    if (!tanggalNikah) return null
    const parts = tanggalNikah.split('/')
    if (parts.length < 3) return null
    const nikah = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
    const now = new Date()
    const tahun = now.getFullYear() - nikah.getFullYear()
    const samaBulan = now.getMonth() === nikah.getMonth()
    const samaHari = now.getDate() === nikah.getDate()
    return { tahun, isAnniversary: samaBulan && samaHari && tahun > 0 }
}

function getBakatLabel(bakat) {
    const map = {
        'pejuang':  '⚔️ Pejuang (ATK+5 saat bantu battle)',
        'penyihir': '🔮 Penyihir (MP+ bonus saat rawat)',
        'pedagang': '💰 Pedagang (diskon belanja 5%)',
        'seniman':  '🎨 Seniman (bisa jual karya)',
        'petani':   '🌾 Petani (drop foraging +10%)',
        'tabib':    '💊 Tabib (potion effect +20%)'
    }
    return map[bakat] || bakat
}

function randomBakat() {
    const list = ['pejuang', 'penyihir', 'pedagang', 'seniman', 'petani', 'tabib']
    return list[Math.floor(Math.random() * list.length)]
}

function getJenjangLabel(jenjang) {
    const map = {
        'sd':     '🏫 SD (Sekolah Dasar)',
        'smp':    '🏫 SMP (Sekolah Menengah Pertama)',
        'sma':    '🏫 SMA (Sekolah Menengah Atas)',
        'kuliah': '🎓 Kuliah (Universitas)',
        'lulus':  '✅ Sudah Lulus Semua'
    }
    return map[jenjang] || jenjang
}

function getRumahLabel(tier) {
    const map = {
        'kontrakan':   '🏚️ Kontrakan',
        'rumah_biasa': '🏠 Rumah Biasa',
        'rumah_mewah': '🏡 Rumah Mewah',
        'villa':       '🏰 Villa',
        'istana':      '🏯 Istana'
    }
    return map[tier] || tier
}

function getRumahBonus(tier) {
    const map = {
        'kontrakan':   'Tidak ada bonus.',
        'rumah_biasa': 'Regenerasi HP +5/jam.',
        'rumah_mewah': 'Keharmonisan +2/hari otomatis.',
        'villa':       'Cooldown rawat anak -1 jam.',
        'istana':      'Semua bonus + passive income Rp 1jt/hari.'
    }
    return map[tier] || '-'
}

function tickKeluarga(player, rpgDB) {
    const now = Date.now()
    const HARI_MS = 24 * 60 * 60 * 1000

    // ── Keharmonisan auto naik kalau rumah mewah/villa/istana ──
    if (player.pasangan && player.rumahKeluarga) {
        if (['rumah_mewah', 'villa', 'istana'].includes(player.rumahKeluarga.tier)) {
            const lastTick = player.lastHarmoniTick || 0
            if (now - lastTick >= HARI_MS) {
                player.harmoni = Math.min(100, (player.harmoni || 50) + 2)
                player.lastHarmoniTick = now
            }
        }
    }

    // ── Passive income anak yang sudah lulus & bekerja ──
    const anakList = player.anak || []
    anakList.forEach(a => {
        if (a.pendidikan === 'lulus' && a.bekerja) {
            const lastTransfer = a.lastTransfer || 0
            const jamBerlalu = Math.floor((now - lastTransfer) / (60 * 60 * 1000))
            if (jamBerlalu > 0) {
                const income = jamBerlalu * 5000
                player.gold = (player.gold || 0) + income
                a.lastTransfer = now
                a.totalKiriman = (a.totalKiriman || 0) + income
            }
        }
    })

    // ── Passive income istana ──
    if (player.rumahKeluarga && player.rumahKeluarga.tier === 'istana') {
        const lastIstana = player.lastIstanaTick || 0
        const jamBerlalu = Math.floor((now - lastIstana) / (60 * 60 * 1000))
        if (jamBerlalu > 0) {
            player.gold = (player.gold || 0) + (jamBerlalu * Math.floor(1000000 / 24))
            player.lastIstanaTick = now
        }
    }
}

function getWIBTime() {
    const now = new Date()
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
}

function safeReadJSON(path, fallback) {
    try {
        return JSON.parse(fs.readFileSync(path))
    } catch {
        fs.writeFileSync(path, JSON.stringify(fallback, null, 2))
        return fallback
    }
}

function addLimitToBonus(jid, amount) {
    try {
        const bonusDB = safeReadJSON(limitBonusPath, {})
        const today = getWIBTime().toISOString().split('T')[0]
        if (!bonusDB[jid] || bonusDB[jid].date !== today) {
            bonusDB[jid] = { bonus: 0, date: today }
        }
        bonusDB[jid].bonus += amount
        fs.writeFileSync(limitBonusPath, JSON.stringify(bonusDB, null, 2))
    } catch (e) {
        console.error('Error adding limit bonus:', e)
    }
}

// ============================================================
//  FISH TRADE NEGOTIATION — disimpan di rpgDB.fishDeals
//  Key = sellerJid (konsisten, tidak terpengaruh format JID)
//  { sellerJid, buyerJid, fishKey, fishDisp, qty, price, lastOfferBy, expiresAt }
// ============================================================
const FISH_DEAL_TTL = 5 * 60 * 1000 // 5 menit

function getDeals(rpgDB) {
    if (!rpgDB.fishDeals) rpgDB.fishDeals = {}
    return rpgDB.fishDeals
}

function cleanExpiredDeals(rpgDB) {
    const deals = getDeals(rpgDB)
    const now = Date.now()
    for (const key of Object.keys(deals)) {
        if (now > deals[key].expiresAt) delete deals[key]
    }
}

// Cari deal sebagai PEMBELI — scan semua deal, cocokkan buyerJid dengan resolusi format
function findDealAsBuyer(rpgDB, jid) {
    const deals = getDeals(rpgDB)
    const alt = jid.includes('@lid')
        ? jid.replace('@lid', '@s.whatsapp.net')
        : jid.replace('@s.whatsapp.net', '@lid')
    for (const [key, deal] of Object.entries(deals)) {
        if (deal.buyerJid === jid || deal.buyerJid === alt) return { key, deal }
    }
    return null
}

// Cari deal sebagai PENJUAL — key IS sellerJid, tapi tetap cek format alternatif
function findDealAsSeller(rpgDB, jid) {
    const deals = getDeals(rpgDB)
    const alt = jid.includes('@lid')
        ? jid.replace('@lid', '@s.whatsapp.net')
        : jid.replace('@s.whatsapp.net', '@lid')
    if (deals[jid]) return { key: jid, deal: deals[jid] }
    if (deals[alt]) return { key: alt, deal: deals[alt] }
    return null
}

// ============================================================
//  FISHING SYSTEM — DATA TABLES (module scope, accessible everywhere)
// ============================================================
const FISH_DATA = {
    // 
    //  🟤 COMMON (basePrice: 75–300)
    // 
    clownfish:              { name: 'Clownfish',              rarity: 'COMMON',     emoji: '🐠', basePrice: 120,      baseExp: 10  },
    azure_damsel:           { name: 'Azure Damsel',           rarity: 'COMMON',     emoji: '🐟', basePrice: 105,      baseExp: 9   },
    pygmy_goby:             { name: 'Pygmy Goby',             rarity: 'COMMON',     emoji: '🐟', basePrice: 83,      baseExp: 7   },
    white_tang:             { name: 'White Tang',             rarity: 'COMMON',     emoji: '🐡', basePrice: 135,      baseExp: 11  },
    herring:                { name: 'Herring',                rarity: 'COMMON',     emoji: '🐟', basePrice: 75,      baseExp: 7   },
    strawberry_dotty:       { name: 'Strawberry Dotty',       rarity: 'COMMON',     emoji: '🐠', basePrice: 150,     baseExp: 12  },
    copperband_butterfly:   { name: 'Copperband Butterfly',   rarity: 'COMMON',     emoji: '🐠', basePrice: 180,     baseExp: 13  },
    watanabei_angelfish:    { name: 'Watanabei Angelfish',    rarity: 'COMMON',     emoji: '🐠', basePrice: 165,     baseExp: 12  },
    blue_chromis:           { name: 'Blue Chromis',           rarity: 'COMMON',     emoji: '🐟', basePrice: 98,      baseExp: 8   },
    green_chromis:          { name: 'Green Chromis',          rarity: 'COMMON',     emoji: '🐟', basePrice: 98,      baseExp: 8   },
    yellowtail_damselfish:  { name: 'Yellowtail Damselfish',  rarity: 'COMMON',     emoji: '🐟', basePrice: 113,      baseExp: 9   },
    coral_fish:             { name: 'Coral Fish',             rarity: 'COMMON',     emoji: '🐠', basePrice: 128,      baseExp: 10  },
    reef_minnow:            { name: 'Reef Minnow',            rarity: 'COMMON',     emoji: '🐟', basePrice: 75,      baseExp: 7   },
    sand_goby:              { name: 'Sand Goby',              rarity: 'COMMON',     emoji: '🐟', basePrice: 83,      baseExp: 7   },
    small_anchovy:          { name: 'Small Anchovy',          rarity: 'COMMON',     emoji: '🐟', basePrice: 75,      baseExp: 6   },
    baby_tuna:              { name: 'Baby Tuna',              rarity: 'COMMON',     emoji: '🐟', basePrice: 135,      baseExp: 11  },
    mini_carp:              { name: 'Mini Carp',              rarity: 'COMMON',     emoji: '🐟', basePrice: 90,      baseExp: 8   },
    glass_fish:             { name: 'Glass Fish',             rarity: 'COMMON',     emoji: '🐟', basePrice: 105,      baseExp: 9   },
    ocean_guppy:            { name: 'Ocean Guppy',            rarity: 'COMMON',     emoji: '🐠', basePrice: 90,      baseExp: 8   },
    tiny_shrimp:            { name: 'Tiny Shrimp',            rarity: 'COMMON',     emoji: '🦐', basePrice: 75,      baseExp: 6   },
    // ── NEW COMMON ──
    reef_minnow2:           { name: 'Reef Minnow',            rarity: 'COMMON',     emoji: '🐟', basePrice: 78,      baseExp: 7   },
    coral_goby:             { name: 'Coral Goby',             rarity: 'COMMON',     emoji: '🐠', basePrice: 87,      baseExp: 7   },
    sea_guppy:              { name: 'Sea Guppy',              rarity: 'COMMON',     emoji: '🐠', basePrice: 83,      baseExp: 7   },
    little_damsel:          { name: 'Little Damsel',          rarity: 'COMMON',     emoji: '🐟', basePrice: 93,      baseExp: 8   },
    pebble_fish:            { name: 'Pebble Fish',            rarity: 'COMMON',     emoji: '🐟', basePrice: 86,      baseExp: 7   },

    // 
    //  🟢 UNCOMMON (basePrice: 450–1500)
    // 
    sunfish:                { name: 'Sunfish',                rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 600,     baseExp: 35  },
    gar_fish:               { name: 'Gar Fish',               rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 570,     baseExp: 32  },
    yellow_damselfish:      { name: 'Yellow Damselfish',      rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 525,     baseExp: 30  },
    bandit_angelfish:       { name: 'Bandit Angelfish',       rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 750,     baseExp: 40  },
    flame_angelfish:        { name: 'Flame Angelfish',        rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 780,     baseExp: 42  },
    sand_mackerel:          { name: 'Sand Mackerel',          rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 525,     baseExp: 30  },
    blue_triggerfish:       { name: 'Blue Triggerfish',       rarity: 'UNCOMMON',   emoji: '🐡', basePrice: 675,     baseExp: 38  },
    striped_surgeonfish:    { name: 'Striped Surgeonfish',    rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 645,     baseExp: 36  },
    needlefish:             { name: 'Needlefish',             rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 570,     baseExp: 32  },
    catfish:                { name: 'Catfish',                rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 630,     baseExp: 36  },
    river_carp:             { name: 'River Carp',             rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 540,     baseExp: 30  },
    silver_bass:            { name: 'Silver Bass',            rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 600,     baseExp: 34  },
    ocean_perch:            { name: 'Ocean Perch',            rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 660,     baseExp: 37  },
    yellow_snapper:         { name: 'Yellow Snapper',         rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 690,     baseExp: 38  },
    rockfish:               { name: 'Rockfish',               rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 555,     baseExp: 31  },
    sea_bream:              { name: 'Sea Bream',              rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 585,     baseExp: 33  },
    ribbon_fish:            { name: 'Ribbon Fish',            rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 720,     baseExp: 40  },
    flatfish:               { name: 'Flatfish',               rarity: 'UNCOMMON',   emoji: '🐡', basePrice: 525,     baseExp: 30  },
    pike:                   { name: 'Pike',                   rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 750,     baseExp: 42  },
    barramundi:             { name: 'Barramundi',             rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 780,     baseExp: 43  },
    // ── NEW UNCOMMON ──
    coral_grouper:          { name: 'Coral Grouper',          rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 720,     baseExp: 40  },
    silver_tang:            { name: 'Silver Tang',            rarity: 'UNCOMMON',   emoji: '🐡', basePrice: 690,     baseExp: 38  },
    azure_wrasse:           { name: 'Azure Wrasse',           rarity: 'UNCOMMON',   emoji: '🐠', basePrice: 645,     baseExp: 36  },
    spotted_goby:           { name: 'Spotted Goby',           rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 555,     baseExp: 31  },
    mangrove_snapper:       { name: 'Mangrove Snapper',       rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 735,     baseExp: 41  },

    // 
    //  🔵 RARE (basePrice: 3000–10000)
    // 
    barracuda:              { name: 'Barracuda',              rarity: 'RARE',       emoji: '🦈', basePrice: 3750,    baseExp: 100 },
    ballina_angelfish:      { name: 'Ballina Angelfish',      rarity: 'RARE',       emoji: '🐠', basePrice: 3300,    baseExp: 90  },
    korean_angelfish:       { name: 'Korean Angelfish',       rarity: 'RARE',       emoji: '🐠', basePrice: 3450,    baseExp: 92  },
    darwin_clownfish:       { name: 'Darwin Clownfish',       rarity: 'RARE',       emoji: '🐠', basePrice: 3150,    baseExp: 88  },
    frog_fish:              { name: 'Frog Fish',              rarity: 'RARE',       emoji: '🐸', basePrice: 3600,    baseExp: 95  },
    red_koi:                { name: 'Red Koi',                rarity: 'RARE',       emoji: '🐟', basePrice: 4500,    baseExp: 110 },
    marble_tuna:            { name: 'Marble Tuna',            rarity: 'RARE',       emoji: '🐟', basePrice: 5250,    baseExp: 120 },
    bluefin_tuna:           { name: 'Bluefin Tuna',           rarity: 'RARE',       emoji: '🐟', basePrice: 6000,    baseExp: 130 },
    giant_carp:             { name: 'Giant Carp',             rarity: 'RARE',       emoji: '🐟', basePrice: 4200,    baseExp: 108 },
    electric_catfish:       { name: 'Electric Catfish',       rarity: 'RARE',       emoji: '⚡', basePrice: 4800,    baseExp: 115 },
    spotted_ray:            { name: 'Spotted Ray',            rarity: 'RARE',       emoji: '🐟', basePrice: 5700,    baseExp: 125 },
    reef_shark:             { name: 'Reef Shark',             rarity: 'RARE',       emoji: '🦈', basePrice: 2250,    baseExp: 145 },
    moray_eel:              { name: 'Moray Eel',              rarity: 'RARE',       emoji: '🐍', basePrice: 5400,    baseExp: 120 },
    swordfish:              { name: 'Swordfish',              rarity: 'RARE',       emoji: '🗡️', basePrice: 6750,    baseExp: 135 },
    king_salmon:            { name: 'King Salmon',            rarity: 'RARE',       emoji: '🐟', basePrice: 6300,    baseExp: 132 },
    arctic_char:            { name: 'Arctic Char',            rarity: 'RARE',       emoji: '❄️', basePrice: 5550,    baseExp: 122 },
    golden_carp:            { name: 'Golden Carp',            rarity: 'RARE',       emoji: '🟡', basePrice: 2700,    baseExp: 155 },
    tiger_fish:             { name: 'Tiger Fish',             rarity: 'RARE',       emoji: '🐅', basePrice: 8250,    baseExp: 148 },
    peacock_bass:           { name: 'Peacock Bass',           rarity: 'RARE',       emoji: '🐟', basePrice: 7200,    baseExp: 140 },
    stingray:               { name: 'Stingray',               rarity: 'RARE',       emoji: '🐟', basePrice: 7800,    baseExp: 145 },
    // ── NEW RARE ──
    neon_tetra_giant:       { name: 'Neon Tetra Giant',       rarity: 'RARE',       emoji: '🐠', basePrice: 3900,    baseExp: 102 },
    vampire_squid:          { name: 'Vampire Squid',          rarity: 'RARE',       emoji: '🦑', basePrice: 5850,    baseExp: 126 },
    biolume_jellyfish:      { name: 'Biolume Jellyfish',      rarity: 'RARE',       emoji: '🪼', basePrice: 5100,    baseExp: 116 },
    deep_eel:               { name: 'Deep Eel',               rarity: 'RARE',       emoji: '🐍', basePrice: 6150,    baseExp: 131 },
    ancient_carp:           { name: 'Ancient Carp',           rarity: 'RARE',       emoji: '🐟', basePrice: 7050,    baseExp: 138 },

    // 
    //  🟣 EPIC (basePrice: 9000–13000)
    // 
    unicorn_tang:           { name: 'Unicorn Tang',           rarity: 'EPIC',       emoji: '🦄', basePrice: 9000,    baseExp: 300 },
    dorhey_tang:            { name: 'Dorhey Tang',            rarity: 'EPIC',       emoji: '🐠', basePrice: 9200,    baseExp: 310 },
    golden_dorado:          { name: 'Golden Dorado',          rarity: 'EPIC',       emoji: '✨', basePrice: 11000,    baseExp: 340 },
    crystal_squid:          { name: 'Crystal Squid',          rarity: 'EPIC',       emoji: '💎', basePrice: 10800,    baseExp: 320 },
    electric_jellyfish:     { name: 'Electric Jellyfish',     rarity: 'EPIC',       emoji: '⚡', basePrice: 9500,    baseExp: 315 },
    lava_pike:              { name: 'Lava Pike',              rarity: 'EPIC',       emoji: '🔥', basePrice: 12000,    baseExp: 350 },
    flame_eel:              { name: 'Flame Eel',              rarity: 'EPIC',       emoji: '🔥', basePrice: 10500,    baseExp: 330 },
    ice_barracuda:          { name: 'Ice Barracuda',          rarity: 'EPIC',       emoji: '❄️', basePrice: 11500,    baseExp: 345 },
    thunder_tuna:           { name: 'Thunder Tuna',           rarity: 'EPIC',       emoji: '⚡', basePrice: 13000,    baseExp: 360 },
    shadow_carp:            { name: 'Shadow Carp',            rarity: 'EPIC',       emoji: '🌑', basePrice: 10800,    baseExp: 320 },
    neon_shark:             { name: 'Neon Shark',             rarity: 'EPIC',       emoji: '🦈', basePrice: 5400,    baseExp: 380 },
    phantom_eel:            { name: 'Phantom Eel',            rarity: 'EPIC',       emoji: '👻', basePrice: 5040,    baseExp: 370 },
    magma_fish:             { name: 'Magma Fish',             rarity: 'EPIC',       emoji: '🌋', basePrice: 13200,    baseExp: 355 },
    frost_pike:             { name: 'Frost Pike',             rarity: 'EPIC',       emoji: '❄️', basePrice: 11100,    baseExp: 338 },
    toxic_catfish:          { name: 'Toxic Catfish',          rarity: 'EPIC',       emoji: '☠️', basePrice: 12500,    baseExp: 352 },
    spirit_fish:            { name: 'Spirit Fish',            rarity: 'EPIC',       emoji: '👻', basePrice: 6300,    baseExp: 395 },
    ember_koi:              { name: 'Ember Koi',              rarity: 'EPIC',       emoji: '🔥', basePrice: 14500,    baseExp: 365 },
    storm_ray:              { name: 'Storm Ray',              rarity: 'EPIC',       emoji: '⛈️', basePrice: 5760,   baseExp: 385 },
    plasma_fish:            { name: 'Plasma Fish',            rarity: 'EPIC',       emoji: '🌀', basePrice: 7200,    baseExp: 405 },
    venom_eel:              { name: 'Venom Eel',              rarity: 'EPIC',       emoji: '🐍', basePrice: 20700,   baseExp: 395 },
    // ── NEW EPIC ──
    void_pike:              { name: 'Void Pike',              rarity: 'EPIC',       emoji: '🕳️', basePrice: 15840,    baseExp: 410 },
    crystal_eel:            { name: 'Crystal Eel',            rarity: 'EPIC',       emoji: '💎', basePrice: 17100,    baseExp: 425 },
    celestial_ray:          { name: 'Celestial Ray',          rarity: 'EPIC',       emoji: '🌠', basePrice: 18360,   baseExp: 440 },
    abyssal_catfish:        { name: 'Abyssal Catfish',        rarity: 'EPIC',       emoji: '🌊', basePrice: 13680,    baseExp: 400 },
    aurora_koi:             { name: 'Aurora Koi',             rarity: 'EPIC',       emoji: '🌌', basePrice: 21600,   baseExp: 460 },

    // 
    //  🟡 LEGENDARY (basePrice: 40000–60000)
    // 
    yellowfin_tuna:         { name: 'Yellowfin Tuna',         rarity: 'LEGENDARY',  emoji: '🐟', basePrice: 25000,    baseExp: 800  },
    lined_cardinal:         { name: 'Lined Cardinal',         rarity: 'LEGENDARY',  emoji: '🐠', basePrice: 26000,    baseExp: 820  },
    blue_lobster:           { name: 'Blue Lobster',           rarity: 'LEGENDARY',  emoji: '🦞', basePrice: 27000,    baseExp: 840  },
    abyssal_king:           { name: 'Abyssal King',           rarity: 'LEGENDARY',  emoji: '👑', basePrice: 33000,    baseExp: 920  },
    pink_dolphin:           { name: 'Pink Dolphin',           rarity: 'LEGENDARY',  emoji: '🐬', basePrice: 30000,    baseExp: 880  },
    lake_sturgeon:          { name: 'Lake Sturgeon',          rarity: 'LEGENDARY',  emoji: '🐟', basePrice: 28000,    baseExp: 855  },
    ruby_tuna:              { name: 'Ruby Tuna',              rarity: 'LEGENDARY',  emoji: '🔴', basePrice: 35000,   baseExp: 950  },
    chrome_tuna:            { name: 'Chrome Tuna',            rarity: 'LEGENDARY',  emoji: '⚙️', basePrice: 33000,    baseExp: 935  },
    golden_shark:           { name: 'Golden Shark',           rarity: 'LEGENDARY',  emoji: '🌟', basePrice: 40000,   baseExp: 1000 },
    ice_whale:              { name: 'Ice Whale',              rarity: 'LEGENDARY',  emoji: '❄️', basePrice: 37000,   baseExp: 970  },
    fire_dolphin:           { name: 'Fire Dolphin',           rarity: 'LEGENDARY',  emoji: '🔥', basePrice: 32000,    baseExp: 910  },
    thunder_whale:          { name: 'Thunder Whale',          rarity: 'LEGENDARY',  emoji: '⚡', basePrice: 39000,   baseExp: 990  },
    crystal_lobster:        { name: 'Crystal Lobster',        rarity: 'LEGENDARY',  emoji: '💎', basePrice: 43000,   baseExp: 1020 },
    shadow_dolphin:         { name: 'Shadow Dolphin',         rarity: 'LEGENDARY',  emoji: '🌑', basePrice: 31000,    baseExp: 900  },
    frost_sturgeon:         { name: 'Frost Sturgeon',         rarity: 'LEGENDARY',  emoji: '❄️', basePrice: 29000,    baseExp: 870  },
    ember_tuna:             { name: 'Ember Tuna',             rarity: 'LEGENDARY',  emoji: '🔥', basePrice: 32500,    baseExp: 928  },
    toxic_whale:            { name: 'Toxic Whale',            rarity: 'LEGENDARY',  emoji: '☠️', basePrice: 36000,   baseExp: 960  },
    spirit_dolphin:         { name: 'Spirit Dolphin',         rarity: 'LEGENDARY',  emoji: '👻', basePrice: 41000,   baseExp: 1010 },
    plasma_shark:           { name: 'Plasma Shark',           rarity: 'LEGENDARY',  emoji: '🌀', basePrice: 45000,   baseExp: 1050 },
    venom_whale:            { name: 'Venom Whale',            rarity: 'LEGENDARY',  emoji: '🐍', basePrice: 38000,   baseExp: 975  },
    // ── NEW LEGENDARY ──
    jade_dragon_fish:       { name: 'Jade Dragon Fish',       rarity: 'LEGENDARY',  emoji: '🐲', basePrice: 32000,   baseExp: 1060 },
    lunar_shark:            { name: 'Lunar Shark',            rarity: 'LEGENDARY',  emoji: '🌕', basePrice: 27000,   baseExp: 1015 },
    solar_tuna:             { name: 'Solar Tuna',             rarity: 'LEGENDARY',  emoji: '☀️', basePrice: 29000,   baseExp: 1035 },
    storm_whale:            { name: 'Storm Whale',            rarity: 'LEGENDARY',  emoji: '⛈️', basePrice: 25600,   baseExp: 1005 },
    cosmic_lobster:         { name: 'Cosmic Lobster',         rarity: 'LEGENDARY',  emoji: '🦞', basePrice: 35000,   baseExp: 1080 },

    // 
    //  🔴 MYTHIC (basePrice: 176000–400000)
    // 
    dotted_stingray:        { name: 'Dotted Stingray',        rarity: 'MYTHIC',     emoji: '🐟', basePrice: 55000,   baseExp: 3000 },
    manta_ray:              { name: 'Manta Ray',              rarity: 'MYTHIC',     emoji: '🐟', basePrice: 62000,   baseExp: 3200 },
    hammerhead_shark:       { name: 'Hammerhead Shark',       rarity: 'MYTHIC',     emoji: '🦈', basePrice: 70000,   baseExp: 3500 },
    great_white_shark:      { name: 'Great White Shark',      rarity: 'MYTHIC',     emoji: '🦈', basePrice: 85000,   baseExp: 3800 },
    oarfish:                { name: 'Oarfish',                rarity: 'MYTHIC',     emoji: '🐟', basePrice: 66000,   baseExp: 4200 },
    colossal_squid:         { name: 'Colossal Squid',         rarity: 'MYTHIC',     emoji: '🦑', basePrice: 61600,   baseExp: 4000 },
    voltfish:               { name: 'Voltfish',               rarity: 'MYTHIC',     emoji: '⚡', basePrice: 77000,   baseExp: 3600 },
    blueflame_ray:          { name: 'Blueflame Ray',          rarity: 'MYTHIC',     emoji: '🔵', basePrice: 90000,   baseExp: 3900 },
    abyss_shark:            { name: 'Abyss Shark',            rarity: 'MYTHIC',     emoji: '🦈', basePrice: 70400,   baseExp: 4400 },
    phantom_whale:          { name: 'Phantom Whale',          rarity: 'MYTHIC',     emoji: '👻', basePrice: 79200,   baseExp: 4800 },
    shadow_leviathan:       { name: 'Shadow Leviathan',       rarity: 'MYTHIC',     emoji: '🌑', basePrice: 88000,   baseExp: 5000 },
    inferno_shark:          { name: 'Inferno Shark',          rarity: 'MYTHIC',     emoji: '🔥', basePrice: 74800,   baseExp: 4600 },
    frost_leviathan:        { name: 'Frost Leviathan',        rarity: 'MYTHIC',     emoji: '❄️', basePrice: 96800,   baseExp: 5200 },
    thunder_leviathan:      { name: 'Thunder Leviathan',      rarity: 'MYTHIC',     emoji: '⚡', basePrice: 105600,   baseExp: 5500 },
    toxic_kraken:           { name: 'Toxic Kraken',           rarity: 'MYTHIC',     emoji: '☠️', basePrice: 114400,   baseExp: 5800 },
    spirit_leviathan:       { name: 'Spirit Leviathan',       rarity: 'MYTHIC',     emoji: '👻', basePrice: 132000,   baseExp: 6200 },
    plasma_leviathan:       { name: 'Plasma Leviathan',       rarity: 'MYTHIC',     emoji: '🌀', basePrice: 140800,   baseExp: 6500 },
    venom_kraken:           { name: 'Venom Kraken',           rarity: 'MYTHIC',     emoji: '🐍', basePrice: 123200,   baseExp: 6000 },
    crystal_leviathan:      { name: 'Crystal Leviathan',      rarity: 'MYTHIC',     emoji: '💎', basePrice: 154000,   baseExp: 6800 },
    void_shark:             { name: 'Void Shark',             rarity: 'MYTHIC',     emoji: '🕳️', basePrice: 176000,   baseExp: 7200 },
    // ── NEW MYTHIC ──
    nebula_leviathan:       { name: 'Nebula Leviathan',       rarity: 'MYTHIC',     emoji: '🌌', basePrice: 193600,   baseExp: 7600 },
    chaos_kraken:           { name: 'Chaos Kraken',           rarity: 'MYTHIC',     emoji: '🌀', basePrice: 158400,   baseExp: 6900 },
    divine_ray:             { name: 'Divine Ray',             rarity: 'MYTHIC',     emoji: '✨', basePrice: 209000,   baseExp: 8000 },
    omega_shark:            { name: 'Omega Shark',            rarity: 'MYTHIC',     emoji: '🔱', basePrice: 220000,  baseExp: 8400 },
    aurora_leviathan:       { name: 'Aurora Leviathan',       rarity: 'MYTHIC',     emoji: '🌠', basePrice: 242000,  baseExp: 9000 },

    // 
    //  ⚫ SECRET / ENDGAME (basePrice: 1400000–5000000)
    // 
    orca:                   { name: 'Orca',                   rarity: 'SECRET',     emoji: '🐳', basePrice: 350000,    baseExp: 12000 },
    crystal_crab:           { name: 'Crystal Crab',           rarity: 'SECRET',     emoji: '💎', basePrice: 400000,    baseExp: 13000 },
    lochness_monster:       { name: 'Lochness Monster',       rarity: 'SECRET',     emoji: '🦕', basePrice: 315000,    baseExp: 16000 },
    armor_shark:            { name: 'Armor Shark',            rarity: 'SECRET',     emoji: '🦈', basePrice: 450000,    baseExp: 14000 },
    eerie_shark:            { name: 'Eerie Shark',            rarity: 'SECRET',     emoji: '👁️', basePrice: 500000,    baseExp: 15000 },
    monster_shark:          { name: 'Monster Shark',          rarity: 'SECRET',     emoji: '🦈', basePrice: 341250,    baseExp: 17000 },
    great_whale:            { name: 'Great Whale',            rarity: 'SECRET',     emoji: '🐋', basePrice: 393750,   baseExp: 18500 },
    frostborn_shark:        { name: 'Frostborn Shark',        rarity: 'SECRET',     emoji: '❄️', basePrice: 367500,   baseExp: 17800 },
    worm_fish:              { name: 'Worm Fish',              rarity: 'SECRET',     emoji: '🪱', basePrice: 370000,    baseExp: 12500 },
    ghost_shark:            { name: 'Ghost Shark',            rarity: 'SECRET',     emoji: '👻', basePrice: 420000,   baseExp: 19000 },
    megalogon:              { name: 'Megalogon',              rarity: 'SECRET',     emoji: '🦈', basePrice: 656250,   baseExp: 25000 },
    skeleton_narwhal:       { name: 'Skeleton Narwhal',       rarity: 'SECRET',     emoji: '🦴', basePrice: 525000,   baseExp: 22000 },
    queen_crab:             { name: 'Queen Crab',             rarity: 'SECRET',     emoji: '🦀', basePrice: 472500,   baseExp: 20500 },
    leviathan_king:         { name: 'Leviathan King',         rarity: 'SECRET',     emoji: '👑', basePrice: 918750,   baseExp: 32000 },
    abyss_god:              { name: 'Abyss God',              rarity: 'SECRET',     emoji: '👁️', basePrice: 1312500,   baseExp: 42000 },
    phantom_kraken:         { name: 'Phantom Kraken',         rarity: 'SECRET',     emoji: '👻', basePrice: 1050000,   baseExp: 36000 },
    void_leviathan:         { name: 'Void Leviathan',         rarity: 'SECRET',     emoji: '🕳️', basePrice: 1575000,   baseExp: 50000 },
    chaos_shark:            { name: 'Chaos Shark',            rarity: 'SECRET',     emoji: '🌀', basePrice: 1181250,   baseExp: 38000 },
    eternal_whale:          { name: 'Eternal Whale',          rarity: 'SECRET',     emoji: '♾️', basePrice: 1968750,   baseExp: 60000 },
    celestial_fish:         { name: 'Celestial Fish',         rarity: 'SECRET',     emoji: '🌠', basePrice: 2625000,  baseExp: 80000 },
    // ── NEW SECRET (MAX 2.000.000) ──
    abyss_emperor:          { name: 'Abyss Emperor',          rarity: 'SECRET',     emoji: '👑', basePrice: 3150000,  baseExp: 90000 },
    void_dragon:            { name: 'Void Dragon',            rarity: 'SECRET',     emoji: '🐉', basePrice: 4200000, baseExp: 110000 },
    cosmos_whale:           { name: 'Cosmos Whale',           rarity: 'SECRET',     emoji: '🌌', basePrice: 5250000, baseExp: 130000 },
    omega_leviathan:        { name: 'Omega Leviathan',        rarity: 'SECRET',     emoji: '🔱', basePrice: 6300000, baseExp: 160000 },
    god_fish:               { name: 'God Fish',               rarity: 'SECRET',     emoji: '✨', basePrice: 7000000, baseExp: 200000 },

    // 
    //  🗑️ COMMON — TRASH / JUNK (basePrice: 0–50)
    // 
    boot:                   { name: 'Boot',                   rarity: 'COMMON',     emoji: '👟', basePrice: 5,        baseExp: 1   },
    seaweed:                { name: 'Seaweed',                rarity: 'COMMON',     emoji: '🌿', basePrice: 10,       baseExp: 1   },
    rusty_fish:             { name: 'Rusty Fish',             rarity: 'COMMON',     emoji: '🐟', basePrice: 20,       baseExp: 2   },

    // 
    //  🟤 COMMON — BASIC (basePrice: 60–150)
    // 
    minnow:                 { name: 'Minnow',                 rarity: 'COMMON',     emoji: '🐟', basePrice: 65,       baseExp: 5   },
    tiny_catfish:           { name: 'Tiny Catfish',           rarity: 'COMMON',     emoji: '🐟', basePrice: 70,       baseExp: 6   },
    small_carp:             { name: 'Small Carp',             rarity: 'COMMON',     emoji: '🐟', basePrice: 80,       baseExp: 7   },

    // 
    //  🟢 UNCOMMON — BASIC (basePrice: 450–900)
    // 
    carp:                   { name: 'Carp',                   rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 480,      baseExp: 28  },
    bass:                   { name: 'Bass',                   rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 510,      baseExp: 29  },
    tilapia:                { name: 'Tilapia',                rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 495,      baseExp: 28  },
    mackerel:               { name: 'Mackerel',               rarity: 'UNCOMMON',   emoji: '🐟', basePrice: 540,      baseExp: 31  },

    // 
    //  🔵 RARE — BASIC (basePrice: 3000–8000)
    // 
    salmon:                 { name: 'Salmon',                 rarity: 'RARE',       emoji: '🐟', basePrice: 3900,     baseExp: 102 },
    tuna:                   { name: 'Tuna',                   rarity: 'RARE',       emoji: '🐟', basePrice: 4500,     baseExp: 112 },
    red_snapper:            { name: 'Red Snapper',            rarity: 'RARE',       emoji: '🐟', basePrice: 5100,     baseExp: 118 },
    pufferfish:             { name: 'Pufferfish',             rarity: 'RARE',       emoji: '🐡', basePrice: 6000,     baseExp: 128 },

    // 
    //  🟣 EPIC — BASIC (basePrice: 9000–20000)
    // 
    giant_catfish:          { name: 'Giant Catfish',          rarity: 'EPIC',       emoji: '🐟', basePrice: 9900,     baseExp: 308 },
    electric_eel:           { name: 'Electric Eel',           rarity: 'EPIC',       emoji: '⚡', basePrice: 12600,    baseExp: 335 },

    // 
    //  🟡 LEGENDARY — BASIC (basePrice: 15000–40000)
    // 
    shark:                  { name: 'Shark',                  rarity: 'LEGENDARY',  emoji: '🦈', basePrice: 31000,    baseExp: 895 },
    golden_tuna:            { name: 'Golden Tuna',            rarity: 'LEGENDARY',  emoji: '🌟', basePrice: 38000,    baseExp: 980 },
    mythic_carp:            { name: 'Mythic Carp',            rarity: 'LEGENDARY',  emoji: '🐟', basePrice: 43000,    baseExp: 1025 },

    // 
    //  ⚫ SECRET — ENDGAME
    // 
    dragon_fish:            { name: 'Dragon Fish',            rarity: 'SECRET',     emoji: '🐉', basePrice: 787500,   baseExp: 28000 },
    phantom_shark:          { name: 'Phantom Shark',          rarity: 'SECRET',     emoji: '👻', basePrice: 446250,   baseExp: 19500 },
    leviathan:              { name: 'Leviathan',              rarity: 'SECRET',     emoji: '🌊', basePrice: 840000,   baseExp: 30000 },
    void_fish:              { name: 'Void Fish',              rarity: 'SECRET',     emoji: '🕳️', basePrice: 525000,   baseExp: 21000 },
    kraken:                 { name: 'Kraken',                 rarity: 'SECRET',     emoji: '🦑', basePrice: 1102500,  baseExp: 40000 },
}

const MUTATION_DATA = {
    // 
    //  🟤 COMMON MUTATIONS (BASIC tier)
    // 
    stone:          { name: 'Stone',          tier: 'BASIC',     emoji: '🪨', multiplier: 1.20,  desc: '+20% harga' },
    albino:         { name: 'Albino',         tier: 'BASIC',     emoji: '🤍', multiplier: 1.40,  desc: '+40% harga' },
    big:            { name: 'Big',            tier: 'BASIC',     emoji: '🔷', multiplier: 1.20,  desc: '1.2x ukuran' },
    huge:           { name: 'Huge',           tier: 'BASIC',     emoji: '⬛', multiplier: 1.50,  desc: '1.5x ukuran' },
    frozen:         { name: 'Frozen',         tier: 'BASIC',     emoji: '🧊', multiplier: 1.60,  desc: 'Membeku sempurna' },
    festive:        { name: 'Festive',        tier: 'BASIC',     emoji: '🎄', multiplier: 1.45,  desc: 'Edisi perayaan' },

    // 
    //  🟢 UNCOMMON – RARE MUTATIONS (ADVANCED tier)
    // 
    ghost:          { name: 'Ghost',          tier: 'ADVANCED',  emoji: '👻', multiplier: 2.50,  desc: '+150% harga' },
    shiny_low:      { name: 'Shiny',          tier: 'ADVANCED',  emoji: '✨', multiplier: 1.80,  desc: '1.8x harga' },
    shiny_high:     { name: 'Shiny+',         tier: 'ADVANCED',  emoji: '💫', multiplier: 4.00,  desc: '4x harga' },
    gold:           { name: 'Gold',           tier: 'ADVANCED',  emoji: '🌟', multiplier: 10.00, desc: '10x harga' },
    electric:       { name: 'Electric',       tier: 'ADVANCED',  emoji: '⚡', multiplier: 6.00,  desc: '6x harga' },
    dark:           { name: 'Dark',           tier: 'ADVANCED',  emoji: '🌑', multiplier: 3.50,  desc: 'Aura kegelapan' },

    // 
    //  🔵 HIGH MUTATIONS (RARE tier)
    // 
    radioactive:    { name: 'Radioactive',    tier: 'RARE',      emoji: '☢️', multiplier: 3.00,  desc: '+200% harga' },
    lightning:      { name: 'Lightning',      tier: 'RARE',      emoji: '🌩️', multiplier: 3.20,  desc: '+220% harga' },
    fairy:          { name: 'Fairy',          tier: 'RARE',      emoji: '🧚', multiplier: 2.80,  desc: '+180% harga' },
    holographic:    { name: 'Holographic',    tier: 'RARE',      emoji: '🌈', multiplier: 4.50,  desc: 'Visual hologram' },
    color_burn:     { name: 'Color Burn',     tier: 'RARE',      emoji: '🔥', multiplier: 5.00,  desc: 'Warna terbakar' },

    // 
    //  🟣 ENDGAME MUTATIONS (LEGENDARY tier)
    // 
    midnight:       { name: 'Midnight',       tier: 'LEGENDARY', emoji: '🌙', multiplier: 3.80,  desc: '+280% harga' },
    gemstone:       { name: 'Gemstone',       tier: 'LEGENDARY', emoji: '💎', multiplier: 3.80,  desc: '+280% harga' },
    galaxy:         { name: 'Galaxy',         tier: 'LEGENDARY', emoji: '🌌', multiplier: 5.50,  desc: '+450% harga' },
    rainbow:        { name: 'Rainbow',        tier: 'LEGENDARY', emoji: '🌈', multiplier: 75.00, desc: '50x–100x harga' },
    translucent:    { name: 'Translucent',    tier: 'LEGENDARY', emoji: '🫧', multiplier: 6.00,  desc: 'Transparan langka' },

    // 
    //  🔴 EVENT / SPECIAL MUTATIONS (GODLY tier)
    // 
    leviathan_rage: { name: 'Leviathan Rage', tier: 'GODLY',     emoji: '🌊', multiplier: 20.00, desc: 'Amukan Leviathan' },
    pumpkin:        { name: 'Pumpkin',        tier: 'GODLY',     emoji: '🎃', multiplier: 12.00, desc: 'Event Halloween' },
    christmas:      { name: 'Christmas',      tier: 'GODLY',     emoji: '🎅', multiplier: 15.00, desc: 'Event Christmas' },
    crystalized:    { name: 'Crystalized',    tier: 'GODLY',     emoji: '🔮', multiplier: 25.00, desc: 'Mengkristal total' }
}


const ROD_DATA = {
    starter_rod:      { name: 'Starter Rod',      tier: 'C',   emoji: '🎣', price: 500,        boost: 0,   desc: 'Joran pemula, buat yang baru mulai.' },
    lava_rod:         { name: 'Lava Rod',          tier: 'C',   emoji: '🔴', price: 2500,       boost: 5,   desc: 'Joran lava, sedikit lebih kuat.' },
    lucky_rod:        { name: 'Lucky Rod',         tier: 'B',   emoji: '🍀', price: 10000,      boost: 12,  desc: 'Hoki-nya lumayan, ikan rare lebih mudah.' },
    midnight_rod:     { name: 'Midnight Rod',      tier: 'B',   emoji: '🌙', price: 25000,      boost: 18,  desc: 'Cocok buat mancing tengah malam.' },
    steampunk_rod:    { name: 'Steampunk Rod',     tier: 'A',   emoji: '⚙️', price: 80000,      boost: 28,  desc: 'Teknologi canggih, ikan epic sering muncul.' },
    hazmat_rod:       { name: 'Hazmat Rod',        tier: 'A',   emoji: '☣️', price: 150000,     boost: 35,  desc: 'Bisa menarik ikan beracun dan langka.' },
    hamzat_rod:       { name: 'Hazmat Rod',        tier: 'A',   emoji: '☣️', price: 150000,     boost: 35,  desc: 'Bisa menarik ikan beracun dan langka.' }, // alias typo lama
    ares_rod:         { name: 'Ares Rod',          tier: 'S',   emoji: '⚔️', price: 500000,     boost: 50,  desc: 'Joran perang, legendary lebih sering.' },
    ghostfinn_rod:    { name: 'Ghostfinn Rod',     tier: 'S',   emoji: '👻', price: 800000,     boost: 60,  desc: 'Bisa menarik ikan hantu dan phantom.' },
    element_rod:      { name: 'Element Rod',       tier: 'S+',  emoji: '🌪️', price: 3000000,    boost: 75,  desc: 'Elemental power, mythic lebih mudah.' },
    diamond_rod:      { name: 'Diamond Rod',       tier: 'S+',  emoji: '💎', price: 5000000,    boost: 90,  desc: 'TERKUAT! Ikan mythic dan secret bisa muncul.' },
    celestial_rod:    { name: 'Celestial Rod',     tier: 'SS',  emoji: '🌠', price: 25000000,   boost: 105, desc: 'Joran surgawi, mutasi Godly lebih sering.' },
    abyssal_rod:      { name: 'Abyssal Rod',       tier: 'SS',  emoji: '🌊', price: 50000000,   boost: 115, desc: 'Dari kedalaman samudra, Leviathan terjangkau.' },
    god_rod:          { name: 'God Rod',           tier: 'SSS', emoji: '⚡', price: 150000000,  boost: 130, desc: 'Joran dewa, Kraken & Dragon Fish pasti muncul.' },
    eternal_rod:      { name: 'Eternal Rod',       tier: 'SSS',      emoji: '🔱', price: 500000000,    boost: 150, desc: 'ULTIMATE ROD! Semua ikan bisa tertangkap.' },
    absolute_rod:     { name: 'Absolute Rod',     tier: 'ABSOLUTE', emoji: '💫', price: 5000000000,   boost: 200, desc: 'ABSOLUTE ROD! Mutlak terkuat, semua ikan SECRET dijamin muncul.' }
}

// Pastikan semua BAIT_DATA punya properti mutBoost
const BAIT_DATA = {
    basic_bait:       { name: 'Basic Bait',       tier: 'B',   emoji: '🪱', price: 200,        mutBoost: 0,   desc: 'Umpan biasa buat sehari-hari.' },
    lava_bait:        { name: 'Lava Bait',        tier: 'B',   emoji: '🔥', price: 800,        mutBoost: 5,   desc: 'Meningkatkan sedikit peluang mutasi.' },
    midnight_bait:    { name: 'Midnight Bait',    tier: 'A',   emoji: '🌙', price: 3000,       mutBoost: 12,  desc: 'Umpan malam, mutasi basic lebih mudah.' },
    chroma_bait:      { name: 'Chroma Bait',      tier: 'S',   emoji: '🌈', price: 20000,      mutBoost: 25,  desc: 'Warna-warni, mutasi advanced teratribusi.' },
    corrupt_bait:     { name: 'Corrupt Bait',     tier: 'S',   emoji: '💀', price: 50000,      mutBoost: 35,  desc: 'Corrupted energy, rare mutation naik.' },
    aether_bait:      { name: 'Aether Bait',      tier: 'S+',  emoji: '🌠', price: 200000,     mutBoost: 50,  desc: 'Energi alam semesta, legendary mutation.' },
    singularity_bait: { name: 'Singularity Bait', tier: 'S+',  emoji: '🕳️', price: 500000,     mutBoost: 70,  desc: 'BEST BAIT! Godly mutation bisa muncul.' },
    nebula_bait:      { name: 'Nebula Bait',      tier: 'SS',  emoji: '🌌', price: 2000000,    mutBoost: 85,  desc: 'Energi nebula, Celestial mutation lebih sering.' },
    void_bait:        { name: 'Void Bait',        tier: 'SS',  emoji: '🕳️', price: 5000000,    mutBoost: 95,  desc: 'Dari kegelapan void, mutasi tertinggi.' },
    divine_bait:      { name: 'Divine Bait',      tier: 'SSS', emoji: '✨', price: 20000000,   mutBoost: 110, desc: 'Umpan ilahi! Semua mutasi Godly bisa muncul.' },
    omega_bait:       { name: 'Omega Bait',       tier: 'SSS',      emoji: '🔱', price: 100000000,   mutBoost: 130, desc: 'ULTIMATE BAIT! Max mutasi, max ikan langka.' },
    absolute_bait:    { name: 'Absolute Bait',    tier: 'ABSOLUTE', emoji: '💫', price: 1000000000,  mutBoost: 200, desc: 'ABSOLUTE BAIT! Semua mutasi GODLY guaranteed, ikan SECRET pasti muncul.' }
}

function pickFishRarity(rodBoost) {
    const b = Math.min(rodBoost, 150)
    const r = Math.random() * 10000

    // 
    //  SISTEM RARITY — Hard-lock berdasarkan tier pancingan
    //
    //  Rod C  (boost 0–5)  : COMMON & UNCOMMON saja
    //  Rod B  (boost 12–18): + RARE (sangat jarang ~3%)
    //  Rod A  (boost 28–35): + EPIC (jarang ~5%)
    //  Rod S  (boost 50–60): + LEGENDARY (~4%)
    //  Rod S+ (boost 75–90): + MYTHIC (~3%)
    //  Rod SS (boost 105)  : + SECRET rendah (~2%)
    //  Rod SSS(boost 130+) : + SECRET tinggi (~4%)
    // 

    // Hard cap: jika boost terlalu rendah, kembalikan paksa ke bawah
    // Rod C: max UNCOMMON
    if (b < 10) {
        return r < 5500 ? 'COMMON' : 'UNCOMMON'
    }
    // Rod B: bisa RARE tapi sangat jarang (3%)
    if (b < 25) {
        if (r < 4000) return 'COMMON'
        if (r < 6800) return 'UNCOMMON'
        return 'RARE'
    }
    // Rod A: bisa EPIC tapi jarang (~5%), LEGENDARY tidak bisa
    if (b < 45) {
        if (r < 3500) return 'COMMON'
        if (r < 5800) return 'UNCOMMON'
        if (r < 7500) return 'RARE'
        if (r < 9500) return 'EPIC'
        return 'EPIC' // max Rod A
    }
    // Rod S: bisa LEGENDARY tapi jarang (~4%), MYTHIC tidak bisa
    if (b < 70) {
        if (r < 3000) return 'COMMON'
        if (r < 5200) return 'UNCOMMON'
        if (r < 7000) return 'RARE'
        if (r < 8800) return 'EPIC'
        if (r < 9600) return 'LEGENDARY'
        return 'LEGENDARY' // max Rod S
    }
    // Rod S+: bisa MYTHIC tapi jarang (~3%), SECRET tidak bisa
    if (b < 100) {
        if (r < 2500) return 'COMMON'
        if (r < 4500) return 'UNCOMMON'
        if (r < 6500) return 'RARE'
        if (r < 8200) return 'EPIC'
        if (r < 9200) return 'LEGENDARY'
        if (r < 9700) return 'MYTHIC'
        return 'MYTHIC' // max Rod S+
    }
    // Rod SS: bisa SECRET tapi sangat langka (~2%)
    if (b < 125) {
        if (r < 2200) return 'COMMON'
        if (r < 4200) return 'UNCOMMON'
        if (r < 6200) return 'RARE'
        if (r < 7900) return 'EPIC'
        if (r < 8900) return 'LEGENDARY'
        if (r < 9500) return 'MYTHIC'
        if (r < 9800) return 'SECRET'
        return 'SECRET'
    }
    // Rod SSS (boost 125–150): semua bisa, SECRET lebih sering (~6%)
    if (r < 1800) return 'COMMON'
    if (r < 3800) return 'UNCOMMON'
    if (r < 5800) return 'RARE'
    if (r < 7500) return 'EPIC'
    if (r < 8600) return 'LEGENDARY'
    if (r < 9300) return 'MYTHIC'
    return 'SECRET'
}

function pickRandomFishByRarity(rarity) {
    const pool = Object.entries(FISH_DATA).filter(([,f]) => f.rarity === rarity)
    if (!pool.length) return null
    const [id, data] = pool[Math.floor(Math.random() * pool.length)]
    return { id, ...data }
}

function rollMutation(mutBoost) {
    const b = Math.min(mutBoost, 130)
    const mutChance = 150 + b * 5
    if (Math.random() * 1000 > mutChance) return null
    const tier_r = Math.random() * 1000
    let tierKey
    if (tier_r < 400)                tierKey = 'BASIC'
    else if (tier_r < 680)           tierKey = 'ADVANCED'
    else if (tier_r < 860)           tierKey = 'RARE'
    else if (tier_r < 960 + b * 0.3) tierKey = 'LEGENDARY'
    else                             tierKey = 'GODLY'
    const pool = Object.entries(MUTATION_DATA).filter(([,m]) => m.tier === tierKey)
    if (!pool.length) return null
    const [mid, mdata] = pool[Math.floor(Math.random() * pool.length)]
    return { id: mid, ...mdata }
}

function calcFishPrice(fish, mutation) {
    return mutation ? Math.floor(fish.basePrice * mutation.multiplier) : fish.basePrice
}

function getFishInventoryKey(fishId, mutationId) {
    return mutationId ? `fish_${fishId}_${mutationId}` : `fish_${fishId}`
}

function getFishDisplayName(fish, mutation) {
    return mutation ? `${mutation.emoji} ${mutation.name} ${fish.emoji} ${fish.name}` : `${fish.emoji} ${fish.name}`
}

function getRarityEmoji(rarity) {
    const map = {
        COMMON:    '🟤',
        UNCOMMON:  '🟢',
        RARE:      '🔵',
        EPIC:      '🟣',
        LEGENDARY: '🟡',
        MYTHIC:    '🔴',
        SECRET:    '⚫'
    }
    return map[rarity] || '⬜'
}

function parseFishKey(key) {
    // Hapus prefix 'fish_' jika ada
    const stripped = key.startsWith('fish_') ? key.substring(5) : key
    const parts = stripped.split('_')
    
    // Coba cari fishId dengan mencoba dari panjang terpanjang
    for (let i = parts.length; i >= 1; i--) {
        const tryFish = parts.slice(0, i).join('_')
        const tryMut = parts.slice(i).join('_')
        if (FISH_DATA[tryFish]) {
            return { fishId: tryFish, mutationId: tryMut || null }
        }
    }
    
    // Jika tidak ditemukan, coba langsung sebagai fishId
    if (FISH_DATA[stripped]) {
        return { fishId: stripped, mutationId: null }
    }
    
    return { fishId: null, mutationId: null }
}

const _rpgHandlerFn = async (sock, msg, { args, text, command, prefix }) => {
    // === Compatibility shims for Santanuy-style code ===
    const m = msg;
    const alip = sock;
    const Reply = (t) => sock.sendMessage(msg.chat, { text: t }, { quoted: msg });
    const isCreator = global.ownerNumber && global.ownerNumber.some(o => msg.sender === o || msg.sender.startsWith(o.split('@')[0]));
    const isPremium = false;
    // Add extra shims expected by Santanuy-style code
    if (!m.text) m.text = m.body || '';
    if (!m.mentionedJid) {
        m.mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    }
    if (!m.quoted) {
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        if (ctx?.quotedMessage) {
            m.quoted = { sender: ctx.participant, message: ctx.quotedMessage };
        }
    }
    // ===================================================
    try {
        // ═══════════════════════════════════════════════════════════════
        // FIX: text dari framework = args.join('') TANPA spasi (bug)
        // Solusi: re-parse dari m.body yang berisi raw message
        // Contoh: ".shoprod beli eternal_rod" → text yg benar = "beli eternal_rod"
        const _rawBody = m.body || m.text || ''
        const _bodyParts = _rawBody.trim().split(/\s+/)
        // Buang prefix+command (bagian pertama), sisanya adalah argumen
        const _cmdWithPrefix = _bodyParts[0] || ''
        const fixedText = _bodyParts.slice(1).join(' ')
        // Override text agar semua command di bawah bisa pakai text yang benar
        text = fixedText
        // Re-derive args dari fixedText agar selalu sinkron dengan text
        // BUGFIX: framework kadang kirim args undefined/kosong, padahal text ada isinya
        args = fixedText ? fixedText.trim().split(/\s+/).filter(Boolean) : (Array.isArray(args) ? args : [])
        if (!Array.isArray(args)) args = []
        // ═══════════════════════════════════════════════════════════════

        const isRegistered = (jid) => {
            try {
                if (!fs.existsSync(userDBPath)) return false
                const userDB = JSON.parse(fs.readFileSync(userDBPath))
                return userDB.some(user => {
                    const userJid = user.jid?.replace('@lid', '@s.whatsapp.net')
                    const targetJid = jid.replace('@lid', '@s.whatsapp.net')
                    return userJid === targetJid
                })
            } catch {
                return false
            }
        }

        if (!global.mess) global.mess = { prem: '❌ Fitur ini khusus premium!' }

        const checkLimit = () => {
            if (isCreator || isPremium) return false
            const user = global.db?.users?.[m.sender]
            if (!user) return false
            const today = new Date().toDateString()
            if (user.lastLimit !== today) {
                user.limitUsed = 0
                user.lastLimit = today
            }
            return user.limitUsed >= 15
        }

        let rpgDB = {}
        try {
            rpgDB = JSON.parse(fs.readFileSync(rpgDBPath))
        } catch (e) {
            rpgDB = { players: {} }
        }
        if (!rpgDB.players) rpgDB.players = {}

        // ── Normalisasi JID (@lid ↔ @s.whatsapp.net) ─────────────────
        function resolvePlayerJid(rawJid) {
            if (!rawJid) return rawJid
            // Cek langsung
            if (rpgDB.players[rawJid]) return rawJid
            // Cek format alternatif
            let alt
            if (rawJid.endsWith('@lid')) {
                alt = rawJid.replace('@lid', '@s.whatsapp.net')
            } else if (rawJid.endsWith('@s.whatsapp.net')) {
                alt = rawJid.replace('@s.whatsapp.net', '@lid')
            }
            if (alt && rpgDB.players[alt]) return alt
            // Fallback: selalu gunakan @s.whatsapp.net sebagai format standar
            if (rawJid.endsWith('@lid')) {
                return rawJid.replace('@lid', '@s.whatsapp.net')
            }
            return rawJid
        }
        // Normalize semua proposal keys ke @s.whatsapp.net saat load
        if (rpgDB.proposals) {
            const normalizedProposals = {}
            for (const [key, val] of Object.entries(rpgDB.proposals)) {
                const normKey = key.endsWith('@lid') ? key.replace('@lid', '@s.whatsapp.net') : key
                const normFrom = val.from && val.from.endsWith('@lid') ? val.from.replace('@lid', '@s.whatsapp.net') : val.from
                normalizedProposals[normKey] = { ...val, from: normFrom }
            }
            rpgDB.proposals = normalizedProposals
        }
        // Normalize semua player keys ke @s.whatsapp.net (merge jika ada duplikat @lid)
        const normalizedPlayers = {}
        let needSave = false
        for (const [key, val] of Object.entries(rpgDB.players)) {
            const normKey = key.endsWith('@lid') ? key.replace('@lid', '@s.whatsapp.net') : key
            if (normKey !== key) needSave = true // ada @lid yang perlu diubah
            if (val.jid && val.jid.endsWith('@lid')) { val.jid = val.jid.replace('@lid', '@s.whatsapp.net'); needSave = true }
            if (val.pasangan && val.pasangan.endsWith('@lid')) { val.pasangan = val.pasangan.replace('@lid', '@s.whatsapp.net'); needSave = true }
            if (!normalizedPlayers[normKey]) {
                normalizedPlayers[normKey] = val
            } else {
                // Merge: prioritaskan yang punya data lebih lengkap (level lebih tinggi)
                if ((val.level || 0) > (normalizedPlayers[normKey].level || 0)) {
                    normalizedPlayers[normKey] = val
                }
            }
        }
        rpgDB.players = normalizedPlayers
        // Simpan hasil normalisasi ke file agar tidak perlu ulang terus
        if (needSave) {
            try { fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2)) } catch(e) {}
        }

        // ── Resolve mention/tag JID dari grup (handle @lid) ──────────
        function resolveMentionJid(rawJid) {
            if (!rawJid) return rawJid
            // Jika @lid, coba cari nomor asli dari participants grup
            if (rawJid.endsWith('@lid') && m.isGroup && m.metadata && m.metadata.participants) {
                const p = m.metadata.participants.find(x => x.lid === rawJid || x.id === rawJid)
                if (p) {
                    const real = p.jid || p.id
                    if (real && !real.endsWith('@lid')) return real
                }
            }
            // Fallback ke resolvePlayerJid (cek DB + normalize)
            return resolvePlayerJid(rawJid)
        }

        const senderJid = resolvePlayerJid(m.sender)

        if (command === 'adduang') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid')) {
                        if (m.metadata && m.metadata.participants) {
                            let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                            if (p && p.jid) targetJid = p.jid
                        }
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else {
                if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            }

            if (!targetJid) {
                return Reply(`Tag atau reply user yang ingin ditambahkan uang!\nContoh: .adduang 1000 @user`)
            }

            const textParts = text ? text.trim().split(' ') : []
            const amount = parseInt(textParts[0])

            if (isNaN(amount) || amount <= 0) {
                return Reply(`Masukkan jumlah uang yang valid!\nContoh: .adduang 1000 @user`)
            }

            if (!rpgDB.players[targetJid]) {
                rpgDB.players[targetJid] = {
                    gold: 0,
                    level: 1,
                    exp: 0,
                    hp: 100,
                    maxHp: 100,
                    energy: 100,
                    maxEnergy: 100,
                    location: 'desa',
                    class: 'warrior'
                }
            }

            rpgDB.players[targetJid].gold += amount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`
✦ ── 💵  UANG DITAMBAH  💵 ──
  👤 Penerima  : @${targetJid.split('@')[0]}
  💵 Jumlah    : ${toRupiah(amount)}

  💰 Total     : ${toRupiah(rpgDB.players[targetJid].gold)}
jajan yang bener ya, jangan lupa bagi-bagi~ 🤑`)
        }

        if (command === 'cekuang') {
            
                

            let targetJid = m.sender

            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid')) {
                        if (m.metadata && m.metadata.participants) {
                            let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                            if (p && p.jid) targetJid = p.jid
                        }
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                } else if (text) {
                    const phoneNumber = text.replace(/[^0-9]/g, '')
                    if (phoneNumber.length > 3) {
                        targetJid = phoneNumber + '@s.whatsapp.net'
                    }
                }
            } else {
                if (m.quoted) {
                    targetJid = m.quoted.sender
                } else if (text) {
                    const phoneNumber = text.replace(/[^0-9]/g, '')
                    if (phoneNumber.length > 3) {
                        targetJid = phoneNumber + '@s.whatsapp.net'
                    }
                }
            }

            if (!rpgDB.players[targetJid]) {
                return Reply(`❌ User ${targetJid === m.sender ? 'kamu' : 'tersebut'} belum memulai petualangan RPG! Gunakan .rpgstart untuk memulai.`)
            }

            const player = rpgDB.players[targetJid]
            const mention = targetJid !== m.sender ? `@${targetJid.split('@')[0]}\n\n` : ''
            
            let message = `
✦ ── 💵  CEK UANG  💵 ──
  👤 Pemilik  : ${mention ? '' : 'kamu'}${mention}
  💰 Total    : *${toRupiah(player.gold)}*
`
            
            if (targetJid === m.sender) {
                message += `
⚔️ *STATUS KARAKTER*
  🏅 Level    : ${player.level || 1}
  ❤️  HP       : ${player.hp || 100}/${player.maxHp || 100}
  ⚡ Energy   : ${player.energy || 100}/${player.maxEnergy || 100}`
            }

            return alip.sendMessage(m.chat, { 
                text: message, 
                mentions: targetJid !== m.sender ? [targetJid] : [] 
            }, { quoted: m })
        }

        if (command === 'topgold') {
            const players = Object.entries(rpgDB.players)
            if (players.length < 1) return Reply("❌ Belum ada petualang yang terdaftar.")
            const sortedByGold = players
                .filter(([_, p]) => p && p.gold > 0)
                .sort(([,a], [,b]) => (b.gold || 0) - (a.gold || 0))
                .slice(0, 10)
            if (sortedByGold.length === 0) return Reply("❌ Belum ada data gold. Jadilah sultan pertama!")
            const rows = sortedByGold.map(([jid, p], i) => {
                const nomor = jid.split('@')[0]
                return { rank: i+1, label: nomor, value: toRupiah(p.gold || 0), extra: `Lv.${p.level||1} ${(p.class||'?').toUpperCase()}` }
            })
            const imgBuf = await generateLeaderboardCanvas('TOP 10 GOLD TERKAYA', 'Leaderboard Dompet Terbesar', rows)
            if (imgBuf) {
                return alip.sendMessage(m.chat, { image: imgBuf, caption: 'sultan-sultan sini wajib traktir~' }, { quoted: m })
            }
            // fallback text
            let t = `TOP 10 TERKAYA\n\n`
            rows.forEach(r => { t += `  ${r.rank}. ${r.label} - ${r.value}\n` })
            return Reply(t)
        }
        
        if (command === 'rpgstart') {
            
                

            if (rpgDB.players[senderJid]) {
                return Reply(`✅ Kamu sudah jadi petualang! Ketik *.rpgstats* untuk cek stat.`)
            }
            if (!text) {
                const creatorLine = isCreator ? '\n  👑  *The_Creator* — Class dewa mutlak, khusus owner\n                        Ulti: DIVINE WRATH — instant kill semua\n' : ''
                return Reply(`
✦ ── 🎮  PILIH KARAKTER  🎮 ──

⚔️ *CLASS DASAR*
  *.rpgstart warrior*     — Tank, HP tebal, Ulti: BERSERKER
  *.rpgstart mage*        — Sihir dahsyat, Ulti: METEOR STORM
  *.rpgstart archer*      — Kritis tinggi, Ulti: THOUSAND ARROWS

🌟 *CLASS LANJUTAN*
  *.rpgstart peri*        — Fairy, heal + kecepatan, Ulti: PIXIE STORM
  *.rpgstart iblis*       — Dark damage, life steal, Ulti: SOUL DRAIN
  *.rpgstart golem*       — Mega tank batu, Ulti: EARTH SHATTER
  *.rpgstart darkmage*    — Burst sihir gelap, Ulti: VOID EXPLOSION
  *.rpgstart mercenary*   — All-rounder bayaran, Ulti: OVERKILL
  *.rpgstart assassin*    — Kritis mematikan, Ulti: SHADOW KILL
  *.rpgstart paladin*     — Holy knight, Ulti: HOLY JUDGEMENT
  *.rpgstart necromancer* — Summon & debuff, Ulti: DEATH CURSE
  *.rpgstart berserker*   — Raw power, Ulti: RAMPAGE
  *.rpgstart ranger*      — Presisi alam, Ulti: NATURE WRATH
  *.rpgstart shaman*      — Sihir alam, Ulti: SPIRIT STORM
${creatorLine}
Contoh: *.rpgstart warrior*`)
            }
            const classChoice = text.toLowerCase()
            const validClasses = ['warrior','mage','archer','peri','iblis','golem','darkmage','mercenary','assassin','paladin','necromancer','berserker','ranger','shaman']
            if (classChoice === 'the_creator' && !isCreator) {
                return Reply(`❌ *THE CREATOR* adalah class khusus owner bot!\nPilih class lain: warrior, mage, archer, peri, iblis, golem, darkmage, mercenary, assassin, paladin, necromancer, berserker, ranger, shaman`)
            }
            if (!validClasses.includes(classChoice) && classChoice !== 'the_creator') {
                return Reply(`❌ Class "*${text}*" tidak ada!\n\nClass tersedia:\n${validClasses.join(', ')}${isCreator ? ', the_creator' : ''}`)
            }
            const saveJid = senderJid.endsWith('@lid') ? senderJid.replace('@lid', '@s.whatsapp.net') : senderJid
            rpgDB.players[saveJid] = initPlayerRPG(saveJid, classChoice)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            const _cwMsg = {
                warrior: '⚔️ Tank sejati! Jangan mati di depan.',
                mage: '🔥 Sihirmu akan membakar musuh!',
                archer: '🏹 Bidikanmu tak pernah meleset!',
                peri: '🧚 Sayap peri-mu berkilau, lawan gemetar!',
                iblis: '😈 Kegelapan memberkatimu, jiwa musuh jadi milikmu!',
                golem: '🗿 Batu raksasa bangkit, takkan ada yang bisa menghentikanmu!',
                darkmage: '🌑 Void memanggil, ledakkan semua dengan sihir terlarang!',
                mercenary: '⚔️💰 Bayaran terbaik, skill terlengkap — siap untuk apa saja!',
                assassin: '🥷 Dari bayang-bayang, satu tusukan cukup untuk mengakhiri segalanya!',
                paladin: '✨ Cahaya suci melindungimu, keadilan ada di tanganmu!',
                necromancer: '💀 Kematian hanyalah awal... bangkitkan mereka semua!',
                berserker: '💢 AMARAH ADALAH KEKUATANMU — hancurkan segalanya!',
                ranger: '🌿 Alam adalah sekutumu, tak ada yang tersembunyi darimu!',
                shaman: '🌀 Roh-roh berbisik, kekuatan alam ada di tanganmu!',
                the_creator: '👑 THE CREATOR bangkit... alam semesta gemetar!'
            }
            const classBadgeMap = {
                warrior: '⚔️', mage: '🔥', archer: '🏹', peri: '🧚', iblis: '😈',
                golem: '🗿', darkmage: '🌑', mercenary: '💼', assassin: '🥷',
                paladin: '✨', necromancer: '💀', berserker: '💢', ranger: '🌿',
                shaman: '🌀', the_creator: '👑'
            }
            return Reply(`
✦ ── 🎉  SELAMAT DATANG!  🎉 ──
  🏅 Class     : *${classBadgeMap[classChoice] || '👤'} ${classChoice === 'the_creator' ? 'THE CREATOR' : classChoice.toUpperCase()}*
  ✅ Status    : Aktif
  📍 Lokasi    : Desa Pemula 🏡
  💵 Modal     : Rp. 50
  ${_cwMsg[classChoice] || ''}
Ketik *.rpghelp* untuk lihat semua command.
Selamat berpetualang — jangan mati ya~ ⚔️`)
        }

        if (command === 'rpgstats') {
            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            const player = rpgDB.players[senderJid]
            const totalStats = getPlayerTotalStats(player)
            const weaponItem = player.equipment?.weapon ? rpgDB.items[player.equipment.weapon] : null
            const armorItem  = player.equipment?.armor  ? rpgDB.items[player.equipment.armor]  : null
            const weaponName = weaponItem ? `${weaponItem.name} (+${weaponItem.attack} atk)` : '— tidak ada'
            const armorName  = armorItem  ? `${armorItem.name} (+${armorItem.defense} def)` : '— tidak ada'

            // ── Fishing stats — safe fallback karena ROD_DATA/BAIT_DATA belum tentu terdefinisi di sini
            const _ROD_STATIC = {
                starter_rod:   { name: 'Starter Rod',   tier: 'C',  emoji: '🎣' },
                lava_rod:      { name: 'Lava Rod',       tier: 'C',  emoji: '🔴' },
                lucky_rod:     { name: 'Lucky Rod',      tier: 'B',  emoji: '🍀' },
                midnight_rod:  { name: 'Midnight Rod',   tier: 'B',  emoji: '🌙' },
                steampunk_rod: { name: 'Steampunk Rod',  tier: 'A',  emoji: '⚙️' },
                hazmat_rod:    { name: 'Hazmat Rod',     tier: 'A',  emoji: '☣️' },
                hamzat_rod:    { name: 'Hazmat Rod',     tier: 'A',  emoji: '☣️' }, // alias typo lama
                ares_rod:      { name: 'Ares Rod',       tier: 'S',  emoji: '⚔️' },
                ghostfinn_rod: { name: 'Ghostfinn Rod',  tier: 'S',  emoji: '👻' },
                element_rod:   { name: 'Element Rod',    tier: 'S+', emoji: '🌪️' },
                diamond_rod:   { name: 'Diamond Rod',    tier: 'S+', emoji: '💎' }
            }
            const _BAIT_STATIC = {
                basic_bait:       { name: 'Basic Bait',       tier: 'B',  emoji: '🪱' },
                lava_bait:        { name: 'Lava Bait',        tier: 'B',  emoji: '🔥' },
                midnight_bait:    { name: 'Midnight Bait',    tier: 'A',  emoji: '🌙' },
                chroma_bait:      { name: 'Chroma Bait',      tier: 'S',  emoji: '🌈' },
                corrupt_bait:     { name: 'Corrupt Bait',     tier: 'S',  emoji: '💀' },
                aether_bait:      { name: 'Aether Bait',      tier: 'S+', emoji: '🌠' },
                singularity_bait: { name: 'Singularity Bait', tier: 'S+', emoji: '🕳️' }
            }

            const fishRodId   = player.fishing?.equippedRod || 'starter_rod'
            const fishBaitId  = player.fishing?.equippedBait || null
            const fishRodData = _ROD_STATIC[fishRodId]  || { name: fishRodId,  tier: '?', emoji: '🎣' }
            const fishBaitData= fishBaitId ? (_BAIT_STATIC[fishBaitId] || { name: fishBaitId, tier: '?', emoji: '🪱' }) : null
            const totalFishCatch = player.fishing?.totalCatch || 0
            const totalFishTypes = Object.keys(player.inventory || {}).filter(k => k.startsWith('fish_') && player.inventory[k] > 0).length

            // ── Fallback untuk player lama yang belum punya field ini
            player.maxHp   = player.maxHp   || 100
            player.hp      = player.hp      || player.maxHp
            player.maxMp   = player.maxMp   || 30
            player.mp      = player.mp      || 0
            player.attack  = player.attack  || 10
            player.defense = player.defense || 5
            player.agility = player.agility || 5
            player.expToNextLevel = player.expToNextLevel || 100

            // ── Progress bar helper
            const progressBar = (cur, max, len = 12) => {
                if (!max || max <= 0) return '░'.repeat(len)
                const pct  = Math.min(Math.floor((cur / max) * len), len)
                return '█'.repeat(pct) + '░'.repeat(len - pct)
            }

            const hpBar  = progressBar(player.hp,  player.maxHp)
            const mpBar  = progressBar(player.mp,  player.maxMp)
            const expBar = progressBar(player.exp, player.expToNextLevel)

            const atkBonus = totalStats.attack  - player.attack
            const defBonus = totalStats.defense - player.defense
            // Bonus pet
            const petAtkBonus = player.pet?.attack  || 0
            const petDefBonus = player.pet?.defense || 0
            const totalAtk = totalStats.attack + petAtkBonus
            const totalDef = totalStats.defense + petDefBonus

            // ── Class badge
            const _classBadgeMap2 = {
                warrior: '⚔️ WARRIOR', mage: '🔥 MAGE', archer: '🏹 ARCHER',
                peri: '🧚 PERI', iblis: '😈 IBLIS', golem: '🗿 GOLEM',
                darkmage: '🌑 DARK MAGE', mercenary: '💼 MERCENARY', assassin: '🥷 ASSASSIN',
                paladin: '✨ PALADIN', necromancer: '💀 NECROMANCER', berserker: '💢 BERSERKER',
                ranger: '🌿 RANGER', shaman: '🌀 SHAMAN', the_creator: '👑 THE CREATOR'
            }
            const classBadge = _classBadgeMap2[player.class] || (player.class || '?').toUpperCase()

            // ── Pet info
            const petInfo = player.pet ? `${player.pet.name} (atk +${player.pet.attack || 0} / def +${player.pet.defense || 0})` : '— tidak ada'

            // ── Market data & asset calculation
            let passivePerHari = 0
            let nilaiSaham = 0
            let nilaiProperti = 0
            let nilaiKendaraan = 0
            let sahamLines = []
            let propertiLines = []
            let kendaraanLines = []
            let _mktDB = null
            try {
                _mktDB = getMarketDB()

                // Saham (wallet + bank)
                const allSahamKeys = new Set([
                    ...Object.keys(player.assets?.saham || {}),
                    ...Object.keys(player.bankAssets?.saham || {})
                ])
                for (const ticker of allSahamKeys) {
                    const qtyW = player.assets?.saham?.[ticker] || 0
                    const qtyB = player.bankAssets?.saham?.[ticker] || 0
                    const qtyTotal = qtyW + qtyB
                    if (qtyTotal <= 0) continue
                    const harga = _mktDB.saham[ticker]?.price || 0
                    const nilai = harga * qtyTotal
                    const change = _mktDB.saham[ticker]?.change || 0
                    const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️'
                    nilaiSaham += nilai
                    sahamLines.push(`  ${arrow} ${ticker} ×${qtyTotal} lot = *${toRupiah(nilai)}*`)
                }

                // Properti
                const allPropKeys = new Set([
                    ...Object.keys(player.assets?.properti || {}),
                    ...Object.keys(player.bankAssets?.properti || {})
                ])
                for (const id of allPropKeys) {
                    const qtyW = player.assets?.properti?.[id] || 0
                    const qtyB = player.bankAssets?.properti?.[id] || 0
                    const qtyTotal = qtyW + qtyB
                    if (qtyTotal <= 0) continue
                    const item = _mktDB.properti[id]
                    if (!item) continue
                    const nilai = item.price * qtyTotal
                    nilaiProperti += nilai
                    if (item.passive) passivePerHari += item.passive * qtyTotal
                    propertiLines.push(`  🏠 ${item.name}${qtyTotal > 1 ? ` ×${qtyTotal}` : ''} = *${toRupiah(nilai)}*`)
                }

                // Kendaraan
                const allKenKeys = new Set([
                    ...Object.keys(player.assets?.kendaraan || {}),
                    ...Object.keys(player.bankAssets?.kendaraan || {})
                ])
                for (const id of allKenKeys) {
                    const qtyW = player.assets?.kendaraan?.[id] || 0
                    const qtyB = player.bankAssets?.kendaraan?.[id] || 0
                    const qtyTotal = qtyW + qtyB
                    if (qtyTotal <= 0) continue
                    const item = _mktDB.kendaraan[id]
                    if (!item) continue
                    const nilai = item.price * qtyTotal
                    nilaiKendaraan += nilai
                    if (item.passive) passivePerHari += item.passive * qtyTotal
                    kendaraanLines.push(`  🚗 ${item.name}${qtyTotal > 1 ? ` ×${qtyTotal}` : ''} = *${toRupiah(nilai)}*`)
                }
            } catch(_) {}

            const nilaiDompet = player.gold || 0
            const nilaiBank   = player.bank?.balance || 0
            const netWorth    = nilaiDompet + nilaiBank + nilaiSaham + nilaiProperti + nilaiKendaraan

            // ── Build kekayaan section
            let kekayaanSection = `\n💰 *KEKAYAAN*\n`
            kekayaanSection += `  💵  Dompet     : *${toRupiah(nilaiDompet)}*\n`
            kekayaanSection += `  🏦  Bank       : *${toRupiah(nilaiBank)}*\n`

            if (sahamLines.length > 0) {
                kekayaanSection += `\n  📊 *Saham* (${toRupiah(nilaiSaham)})\n`
                kekayaanSection += sahamLines.join('\n') + '\n'
            }
            if (propertiLines.length > 0) {
                kekayaanSection += `\n  🏠 *Properti* (${toRupiah(nilaiProperti)})\n`
                kekayaanSection += propertiLines.join('\n') + '\n'
            }
            if (kendaraanLines.length > 0) {
                kekayaanSection += `\n  🚗 *Kendaraan* (${toRupiah(nilaiKendaraan)})\n`
                kekayaanSection += kendaraanLines.join('\n') + '\n'
            }
            if (passivePerHari > 0) {
                kekayaanSection += `\n  💹  Passive    : *+${toRupiah(passivePerHari)}/hari*\n`
            }
            kekayaanSection += `\n  💎  NET WORTH  : *${toRupiah(netWorth)}*\n`

            const statsText = `✦ ── ⚔️  RPG  STATS  ⚔️ ──

👤 *${classBadge}*  •  Lv.*${player.level}*
📍 ${rpgDB.locations[player.location]?.name || 'Desa Pemula'}
⚔️ Battle: ${player.monstersDefeated || 0} monster tumbang


❤️  HP   [${hpBar}] ${player.hp}/${player.maxHp}
🔵  MP   [${mpBar}] ${player.mp}/${player.maxMp}
⭐  EXP  [${expBar}] ${player.exp}/${player.expToNextLevel}


⚡ *STATS TEMPUR*
  ⚔️  Attack   : *${player.attack || 10}* ${atkBonus > 0 ? `(+${atkBonus} equip)` : ''}${petAtkBonus > 0 ? ` (+${petAtkBonus} pet)` : ''}
  🛡️  Defense  : *${player.defense || 5}* ${defBonus > 0 ? `(+${defBonus} equip)` : ''}${petDefBonus > 0 ? ` (+${petDefBonus} pet)` : ''}
  🌀  Agility  : *${player.agility || 5}*
  💥  Total ATK (PVP): *${totalAtk}*
  🔰  Total DEF (PVP): *${totalDef}*
  🏆  PVP      : ${player.pvpWins || 0}W / ${player.pvpLosses || 0}L
  ⚖️  Mode PVP : *BALANCE* (level/stats tidak berpengaruh)
${kekayaanSection}

🗡️ *EQUIPMENT*
  ⚔️  Senjata  : ${weaponName}
  🛡️  Zirah    : ${armorName}
  🐾  Pet      : ${petInfo}

🎣 *FISHING*
  🎣  Joran    : ${fishRodData.emoji} ${fishRodData.name} [Tier ${fishRodData.tier}]
  🪱  Umpan    : ${fishBaitData ? `${fishBaitData.emoji} ${fishBaitData.name}` : '❌ tidak ada'}
  🐟  Tangkap  : ${totalFishCatch} ekor | ${totalFishTypes} jenis`

            return Reply(statsText)
        }

        if (command === 'rpgexplore') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (Date.now() - (player.lastBattle || 0) < 30000) {
                const cooldown = Math.ceil((30000 - (Date.now() - (player.lastBattle || 0))) / 1000)
                return Reply(`⏳ Tunggu ${cooldown} detik lagi untuk eksplorasi berikutnya.`)
            }
            const monster = getRandomMonster(player.location, player.level)
            if (!monster) return Reply(`🌫️ Tidak ada monster di sini. Coba pindah lokasi dulu!`)
            player.battleState = {
                monster: monster,
                monsterHp: monster.hp,
                inBattle: true
            }
            player.lastBattle = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            const tierStars = '⭐'.repeat(Math.min(monster.tier || 1, 10))
            const tierLabel = ['','🟢 MUDAH','🟡 NORMAL','🟠 SEDANG','🔴 KUAT','🔴 SANGAT KUAT','💀 BOSS','💀 ELITE','☠️ LEGENDA','💥 MITOLOGI','🌟 DEWA'][Math.min(monster.tier || 1, 10)]
            const lvlDiff = monster.level - player.level
            const diffHint = lvlDiff >= 5 ? '⚠️ MONSTER JAUH LEBIH KUAT!' : lvlDiff >= 2 ? '⚠️ Hati-hati, lebih kuat dari lu!' : lvlDiff <= -3 ? '😏 Monster lebih lemah dari lu' : '⚔️ Pertarungan seimbang'
            const hpBar = '█'.repeat(10) + '░'.repeat(0)

            const battleText = `✦ ── ⚔️  MONSTER DITEMUKAN!  ⚔️ ──
  👾 *${monster.name}*
  🎚️ Level   : ${monster.level}  ${tierStars}
  🏷️ Tier    : ${tierLabel}
  ❤️  HP      : [${hpBar}] ${monster.hp}
  ⚔️  Attack  : ${monster.attack}
  🛡️ Defense : ${monster.defense}

  ${diffHint}

⚡ *Aksi tersedia:*
  *.attack* — serangan biasa
  *.skill*  — skill spesial class (butuh MP)
  *.ulti*   — ultimate skill (butuh MP lebih banyak)
  *.flee*   — kabur dari pertarungan
  *.item*   — pakai item dari inventory`
            return Reply(battleText)
        }

        if (command === 'attack') {
            if (!rpgDB.players[senderJid]?.battleState?.inBattle) return Reply(`❌ Kamu tidak sedang bertarung! Ketik *.rpgexplore* untuk cari musuh.`)
            const player = rpgDB.players[senderJid]
            const battleState = player.battleState
            // HP Bar dengan persen detail
            const mkHpBar = (cur, max) => {
                const pct = Math.max(0, Math.min(100, Math.floor((Math.max(0,cur)/Math.max(1,max))*100)))
                const filled = Math.floor(pct / 10)
                const bar = '█'.repeat(filled) + '░'.repeat(10 - filled)
                return `[${bar}] ${pct}%`
            }
            const playerDamage = calculateDamage(player, battleState.monster)
            battleState.monsterHp -= playerDamage.damage
            let battleLog = [`✦ ⚔️  SERANGAN!  ⚔️\n`]
            battleLog.push(`  🗡️ Lu nyerang *${battleState.monster.name}*`)
            battleLog.push(`  💥 Damage diberikan : *${playerDamage.damage}*${playerDamage.isCritical ? ' 💥 *CRITICAL!*' : ''}`)
            if (player.pet?.attack > 0) {
                const petDamage = player.pet.attack
                battleState.monsterHp -= petDamage
                battleLog.push(`  🐾 *${player.pet.name}* ikut nyerang! +${petDamage} dmg`)
            }
            if (battleState.monsterHp <= 0) {
                battleLog.push(``)
                battleLog.push(`🎉 *MENANG! ${battleState.monster.name} tumbang!*`)
                battleLog.push(``)
                player.gold += battleState.monster.gold
                const leveledUp = gainExp(player, battleState.monster.exp)
                player.monstersDefeated = (player.monstersDefeated || 0) + 1
                battleLog.push(`  💵 +${toRupiah(battleState.monster.gold)}`)
                battleLog.push(`  ⭐ +${battleState.monster.exp} EXP`)
                if (battleState.monster.drops) {
                    if (!player.inventory) player.inventory = {}
                    for (const [itemId, chance] of Object.entries(battleState.monster.drops)) {
                        if (Math.random() < chance) {
                            player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
                            battleLog.push(`  🎁 drop: *${rpgDB.items[itemId]?.name || itemId}*`)
                        }
                    }
                }
                if (leveledUp) battleLog.push(`  🎊 *LEVEL UP! ➜ Lv.${player.level}!*`)
                if (player.activeQuest) {
                    const quest = rpgDB.quests?.[player.activeQuest]
                    if (quest && quest.type === 'kill' && quest.target === battleState.monster.name) {
                        player.questProgress = (player.questProgress || 0) + 1
                        battleLog.push(`  📜 quest: *${player.questProgress}/${quest.count}*`)
                        if (player.questProgress >= quest.count) {
                            player.gold += quest.reward.gold
                            gainExp(player, quest.reward.exp)
                            if (quest.reward.item) {
                                if (!player.inventory) player.inventory = {}
                                player.inventory[quest.reward.item.id] = (player.inventory[quest.reward.item.id] || 0) + quest.reward.item.amount
                            }
                            battleLog.push(`  🏆 *QUEST SELESAI!* +${toRupiah(quest.reward.gold)} +${quest.reward.exp}exp`)
                            player.activeQuest = null
                            player.questProgress = 0
                        }
                    }
                }
                battleLog.push(``)
                delete player.battleState
            } else {
                const monsterDamage = calculateDamage(battleState.monster, player)
                player.hp = Math.max(0, player.hp - monsterDamage.damage)
                battleLog.push(`  🛡️ Damage diterima  : *-${monsterDamage.damage}* HP`)
                battleLog.push(``)
                battleLog.push(`📊 *STATUS PERTEMPURAN*`)
                battleLog.push(``)
                battleLog.push(`  🫵 Kamu   ${mkHpBar(player.hp, player.maxHp)}`)
                battleLog.push(`     HP: ${player.hp}/${player.maxHp}`)
                battleLog.push(`  👾 ${battleState.monster.name}`)
                battleLog.push(`     ${mkHpBar(Math.max(0,battleState.monsterHp), battleState.monster.hp)}`)
                battleLog.push(`     HP: ${Math.max(0,battleState.monsterHp)}/${battleState.monster.hp}`)
                battleLog.push(``)
                battleLog.push(`⚔️ .attack | ✨ .skill | 💫 .ulti | 🏃 .flee`)
                if (player.hp <= 0) {
                    const goldLoss = Math.max(10, Math.floor(player.gold * 0.05))
                    battleLog.push(``)
                    battleLog.push(`💀 *KALAH...*`)
                    battleLog.push(``)
                    player.hp = 1
                    player.gold = Math.max(0, player.gold - goldLoss)
                    battleLog.push(`  💸 -${toRupiah(goldLoss)} (5% gold hilang)`)
                    battleLog.push(`  💵 Sisa: ${toRupiah(player.gold)}`)
                    battleLog.push(``)
                    delete player.battleState
                }
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            // Edit pesan untuk animasi battle
            try {
                const sent = await alip.sendMessage(m.chat, { text: battleLog.join('\n') }, { quoted: m })
                return
            } catch(e) {
                return Reply(battleLog.join('\n'))
            }
        }

        if (command === 'skill') {
            if (!rpgDB.players[senderJid]?.battleState?.inBattle) return Reply(`❌ Kamu tidak sedang bertarung! Ketik *.rpgexplore* untuk cari musuh.`)
            const player = rpgDB.players[senderJid]
            const battleState = player.battleState
            const mkHpBarS = (cur, max) => {
                const pct = Math.max(0, Math.min(100, Math.floor((Math.max(0,cur)/Math.max(1,max))*100)))
                const filled = Math.floor(pct / 10)
                return `[${'█'.repeat(filled)}${'░'.repeat(10-filled)}] ${pct}%`
            }
            let battleLog = [`✦ ✨  SKILL DILEPAS!  ✨\n`]
            let skillUsed = false
            const _pStats = getPlayerTotalStats(player)
            switch (player.class) {
                case 'warrior': {
                    if (player.mp < 15) return Reply(`🔵 MP kurang! Warrior butuh 15 MP untuk Rage Slash.`)
                    player.mp -= 15
                    player.hp = Math.max(1, player.hp - 5)
                    const wDmg = Math.floor(_pStats.attack * 2.5)
                    battleState.monsterHp -= wDmg
                    skillUsed = true
                    battleLog.push(`  ⚔️ *RAGE SLASH!*`)
                    battleLog.push(`  💥 Damage diberikan : *${wDmg}* ke ${battleState.monster.name}!`)
                    battleLog.push(`  💔 Efek samping: -5 HP (darah berapi-api)`)
                    break
                }
                case 'mage': {
                    if (player.mp < 20) return Reply(`🔵 MP kurang! Mage butuh 20 MP untuk Fireball.`)
                    player.mp -= 20
                    const mDmg = Math.floor(_pStats.attack * 2.2)
                    battleState.monsterHp -= mDmg
                    skillUsed = true
                    battleLog.push(`  🔥 *FIREBALL!* Bola api meledak dahsyat!`)
                    battleLog.push(`  💥 Damage diberikan : *${mDmg}* ke ${battleState.monster.name}!`)
                    break
                }
                case 'archer': {
                    if (player.mp < 15) return Reply(`🔵 MP kurang! Archer butuh 15 MP untuk Precision Shot.`)
                    player.mp -= 15
                    const isCrit = Math.random() < 0.75
                    let aDmg = Math.max(1, Math.floor(_pStats.attack - battleState.monster.defense))
                    if (isCrit) aDmg *= 2
                    battleState.monsterHp -= aDmg
                    skillUsed = true
                    battleLog.push(`  🏹 *PRECISION SHOT!* Bidikan mematikan melesat!`)
                    if (isCrit) battleLog.push(`  ⚡ *CRITICAL HIT!* 2x lipat damage!`)
                    battleLog.push(`  💥 Damage diberikan : *${aDmg}* ke ${battleState.monster.name}!`)
                    break
                }
                case 'the_creator': {
                    if (player.mp < 10) return Reply(`🔵 MP kurang! Butuh 10 MP.`)
                    player.mp -= 10
                    const cDmg = Math.floor(_pStats.attack * 5)
                    battleState.monsterHp -= cDmg
                    skillUsed = true
                    battleLog.push(`  👑 *REALITY BREAK!* Realita dihancurkan!`)
                    battleLog.push(`  💥 Damage diberikan : *${cDmg}* (GODLIKE)`)
                    break
                }
                case 'peri': {
                    if (player.mp < 18) return Reply(`🔵 MP kurang! Peri butuh 18 MP untuk Fairy Dust.`)
                    player.mp -= 18
                    const periDmg = Math.floor(_pStats.attack * 1.8)
                    battleState.monsterHp -= periDmg
                    // Heal diri sendiri
                    const periHeal = Math.floor(player.maxHp * 0.12)
                    player.hp = Math.min(player.maxHp, player.hp + periHeal)
                    skillUsed = true
                    battleLog.push(`  🧚 *FAIRY DUST!* Debu sihir menyilaukan musuh!`)
                    battleLog.push(`  💥 Damage diberikan : *${periDmg}*`)
                    battleLog.push(`  💚 Heal diri sendiri: *+${periHeal} HP*`)
                    break
                }
                case 'iblis': {
                    if (player.mp < 22) return Reply(`🔵 MP kurang! Iblis butuh 22 MP untuk Dark Claw.`)
                    player.mp -= 22
                    const iblisDmg = Math.floor(_pStats.attack * 2.8)
                    battleState.monsterHp -= iblisDmg
                    // Life steal 15%
                    const lifeSteal = Math.floor(iblisDmg * 0.15)
                    player.hp = Math.min(player.maxHp, player.hp + lifeSteal)
                    skillUsed = true
                    battleLog.push(`  😈 *DARK CLAW!* Cakar kegelapan merobek jiwa!`)
                    battleLog.push(`  💥 Damage diberikan : *${iblisDmg}*`)
                    battleLog.push(`  🩸 Life Steal       : *+${lifeSteal} HP*`)
                    break
                }
                case 'golem': {
                    if (player.mp < 10) return Reply(`🔵 MP kurang! Golem butuh 10 MP untuk Stone Slam.`)
                    player.mp -= 10
                    const golemDmg = Math.floor(_pStats.attack * 2.0 + _pStats.defense * 0.5)
                    battleState.monsterHp -= golemDmg
                    skillUsed = true
                    battleLog.push(`  🗿 *STONE SLAM!* Tanah berguncang!`)
                    battleLog.push(`  💥 Damage (ATK+DEF) : *${golemDmg}*`)
                    break
                }
                case 'darkmage': {
                    if (player.mp < 30) return Reply(`🔵 MP kurang! Dark Mage butuh 30 MP untuk Shadow Bolt.`)
                    player.mp -= 30
                    const dmDmg = Math.floor(_pStats.attack * 3.2)
                    battleState.monsterHp -= dmDmg
                    skillUsed = true
                    battleLog.push(`  🌑 *SHADOW BOLT!* Kegelapan menghantam!`)
                    battleLog.push(`  💥 Damage diberikan : *${dmDmg}*`)
                    break
                }
                case 'mercenary': {
                    if (player.mp < 20) return Reply(`🔵 MP kurang! Mercenary butuh 20 MP untuk Combo Strike.`)
                    player.mp -= 20
                    const h1 = Math.floor(_pStats.attack * 1.0)
                    const h2 = Math.floor(_pStats.attack * 1.2)
                    const merDmg = h1 + h2
                    battleState.monsterHp -= merDmg
                    skillUsed = true
                    battleLog.push(`  💼 *COMBO STRIKE!* Dua serangan beruntun!`)
                    battleLog.push(`  💥 Hit 1: *${h1}* | Hit 2: *${h2}* | Total: *${merDmg}*`)
                    break
                }
                case 'assassin': {
                    if (player.mp < 18) return Reply(`🔵 MP kurang! Assassin butuh 18 MP untuk Shadow Stab.`)
                    player.mp -= 18
                    const isCritAss = Math.random() < 0.85
                    let assDmg = Math.max(1, Math.floor(_pStats.attack * 2.0 - battleState.monster.defense * 0.2))
                    if (isCritAss) assDmg = Math.floor(assDmg * 2.5)
                    battleState.monsterHp -= assDmg
                    skillUsed = true
                    battleLog.push(`  🥷 *SHADOW STAB!* Dari kegelapan, tusukan mematikan!`)
                    if (isCritAss) battleLog.push(`  ⚡ *CRITICAL BACKSTAB!* x2.5 damage!`)
                    battleLog.push(`  💥 Damage diberikan : *${assDmg}*`)
                    break
                }
                case 'paladin': {
                    if (player.mp < 25) return Reply(`🔵 MP kurang! Paladin butuh 25 MP untuk Holy Smite.`)
                    player.mp -= 25
                    const holyDmg = Math.floor(_pStats.attack * 2.2)
                    battleState.monsterHp -= holyDmg
                    const holyHeal = Math.floor(player.maxHp * 0.1)
                    player.hp = Math.min(player.maxHp, player.hp + holyHeal)
                    skillUsed = true
                    battleLog.push(`  ✨ *HOLY SMITE!* Cahaya suci membakar musuh!`)
                    battleLog.push(`  💥 Damage diberikan : *${holyDmg}*`)
                    battleLog.push(`  💚 Divine Heal      : *+${holyHeal} HP*`)
                    break
                }
                case 'necromancer': {
                    if (player.mp < 28) return Reply(`🔵 MP kurang! Necromancer butuh 28 MP untuk Death Touch.`)
                    player.mp -= 28
                    const necDmg = Math.floor(_pStats.attack * 3.0)
                    battleState.monsterHp -= necDmg
                    skillUsed = true
                    battleLog.push(`  💀 *DEATH TOUCH!* Sentuhan kematian!`)
                    battleLog.push(`  💥 Damage diberikan : *${necDmg}*`)
                    battleLog.push(`  🩸 Nyawa musuh terkuras...`)
                    break
                }
                case 'berserker': {
                    if (player.mp < 12) return Reply(`🔵 MP kurang! Berserker butuh 12 MP untuk Rage Burst.`)
                    player.mp -= 12
                    const hpSac = Math.floor(player.maxHp * 0.08)
                    player.hp = Math.max(1, player.hp - hpSac)
                    const bersDmg = Math.floor(_pStats.attack * 3.5)
                    battleState.monsterHp -= bersDmg
                    skillUsed = true
                    battleLog.push(`  💢 *RAGE BURST!* Amarah meledak, darah memercik!`)
                    battleLog.push(`  💥 Damage diberikan : *${bersDmg}*`)
                    battleLog.push(`  💔 HP dikorbankan  : *-${hpSac} HP*`)
                    break
                }
                case 'ranger': {
                    if (player.mp < 16) return Reply(`🔵 MP kurang! Ranger butuh 16 MP untuk Tracking Shot.`)
                    player.mp -= 16
                    const ranDmg = Math.max(1, Math.floor(_pStats.attack * 2.3 - battleState.monster.defense * 0.4))
                    battleState.monsterHp -= ranDmg
                    skillUsed = true
                    battleLog.push(`  🌿 *TRACKING SHOT!* Bidikan presisi alam!`)
                    battleLog.push(`  💥 Damage diberikan : *${ranDmg}* (nembus armor)`)
                    break
                }
                case 'shaman': {
                    if (player.mp < 24) return Reply(`🔵 MP kurang! Shaman butuh 24 MP untuk Spirit Strike.`)
                    player.mp -= 24
                    const shamDmg = Math.floor(_pStats.attack * 2.5)
                    battleState.monsterHp -= shamDmg
                    // Heal kecil dari alam
                    const shamHeal = Math.floor(player.maxHp * 0.08)
                    player.hp = Math.min(player.maxHp, player.hp + shamHeal)
                    skillUsed = true
                    battleLog.push(`  🌀 *SPIRIT STRIKE!* Roh alam menyerang!`)
                    battleLog.push(`  💥 Damage diberikan : *${shamDmg}*`)
                    battleLog.push(`  💚 Nature Regen     : *+${shamHeal} HP*`)
                    break
                }
                default: return Reply(`❌ Class tidak dikenal, tidak ada skill.\nClass kamu: *${player.class}*`)
            }
            if (skillUsed) {
                if (player.pet?.attack > 0 && battleState.monsterHp > 0) {
                    const petDmg = player.pet.attack
                    battleState.monsterHp -= petDmg
                    battleLog.push(`  🐾 *${player.pet.name}* ikutan nyerang! +${petDmg} dmg!`)
                }
                battleLog.push(``)
                if (battleState.monsterHp <= 0) {
                    battleLog.push(`🎉 *VICTORY! Skill pamungkas menghancurkan musuh!*`)
                    battleLog.push(``)
                    player.gold += battleState.monster.gold
                    const lvUp = gainExp(player, battleState.monster.exp)
                    player.monstersDefeated = (player.monstersDefeated || 0) + 1
                    battleLog.push(`  💵 +${toRupiah(battleState.monster.gold)}`)
                    battleLog.push(`  ⭐ +${battleState.monster.exp} EXP`)
                    if (battleState.monster.drops) {
                        if (!player.inventory) player.inventory = {}
                        for (const [itemId, chance] of Object.entries(battleState.monster.drops)) {
                            if (Math.random() < chance) {
                                player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
                                battleLog.push(`  🎁 drop: *${rpgDB.items[itemId]?.name || itemId}*`)
                            }
                        }
                    }
                    if (lvUp) battleLog.push(`  🎊 *LEVEL UP! ➜ Lv.${player.level}!*`)
                    delete player.battleState
                } else {
                    const mDmgBack = calculateDamage(battleState.monster, player)
                    player.hp = Math.max(0, player.hp - mDmgBack.damage)
                    battleLog.push(`  🛡️ Damage diterima  : *-${mDmgBack.damage}* HP`)
                    battleLog.push(``)
                    battleLog.push(`📊 *STATUS PERTEMPURAN*`)
                    battleLog.push(``)
                    battleLog.push(`  🫵 Kamu   ${mkHpBarS(player.hp, player.maxHp)}`)
                    battleLog.push(`     HP: ${player.hp}/${player.maxHp}`)
                    battleLog.push(`  👾 ${battleState.monster.name}`)
                    battleLog.push(`     ${mkHpBarS(Math.max(0,battleState.monsterHp), battleState.monster.hp)}`)
                    battleLog.push(`     HP: ${Math.max(0,battleState.monsterHp)}/${battleState.monster.hp}`)
                    battleLog.push(``)
                    battleLog.push(`⚔️ .attack | ✨ .skill | 💫 .ulti | 🏃 .flee`)
                    if (player.hp <= 0) {
                        const gLoss = Math.max(10, Math.floor(player.gold * 0.05))
                        player.hp = 1
                        player.gold = Math.max(0, player.gold - gLoss)
                        battleLog.push(`💀 *DEFEAT!* -${toRupiah(gLoss)} gold`)
                        delete player.battleState
                    }
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(battleLog.join('\n'))
            }
        }

        if (command === 'ulti') {
            if (!rpgDB.players[senderJid]?.battleState?.inBattle) return Reply(`❌ Kamu tidak sedang bertarung! Ketik *.rpgexplore* untuk cari musuh.`)
            const player = rpgDB.players[senderJid]
            const battleState = player.battleState
            const mkHpBarU = (cur, max) => {
                const pct = Math.max(0, Math.min(100, Math.floor((Math.max(0,cur)/Math.max(1,max))*100)))
                const filled = Math.floor(pct / 10)
                return `[${'█'.repeat(filled)}${'░'.repeat(10-filled)}] ${pct}%`
            }
            // Cek cooldown ulti (1x per battle)
            if (battleState.ultiUsed) return Reply(`💫 *ULTI* sudah dipakai di battle ini!\nSatu kali per pertempuran.`)
            const _pS = getPlayerTotalStats(player)
            let battleLog = [`✦ 💫  ULTIMATE SKILL!  💫\n`]
            let ultiDmg = 0
            switch (player.class) {
                case 'warrior': {
                    if (player.mp < 50) return Reply(`🔵 MP kurang! BERSERKER MODE butuh 50 MP.`)
                    player.mp -= 50
                    // Korban HP 10% tapi damage 3x attack
                    const hpSacrifice = Math.floor(player.maxHp * 0.1)
                    player.hp = Math.max(1, player.hp - hpSacrifice)
                    ultiDmg = Math.floor(_pS.attack * 3)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🔴 *⚔️ BERSERKER MODE! ⚔️*`)
                    battleLog.push(`  💢 Darah memercik, amarah memuncak!`)
                    battleLog.push(`  💥 Damage diberikan : *${ultiDmg}* (3x ATK!)`)
                    battleLog.push(`  💔 HP dikorbankan  : -${hpSacrifice} HP`)
                    break
                }
                case 'mage': {
                    if (player.mp < 60) return Reply(`🔵 MP kurang! METEOR STORM butuh 60 MP.`)
                    player.mp -= 60
                    // Multi hit: 3 pukulan masing-masing 1.5x
                    const hits = [1.5, 1.2, 1.8]
                    let totalDmg = 0
                    const hitList = []
                    for (const mult of hits) {
                        const h = Math.floor(_pS.attack * mult)
                        totalDmg += h
                        hitList.push(h)
                    }
                    ultiDmg = totalDmg
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🌋 *☄️ METEOR STORM! ☄️*`)
                    battleLog.push(`  🌠 Langit runtuh! 3 meteor menghantam!`)
                    battleLog.push(`  💥 Hit 1: *${hitList[0]}* | Hit 2: *${hitList[1]}* | Hit 3: *${hitList[2]}*`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    break
                }
                case 'archer': {
                    if (player.mp < 45) return Reply(`🔵 MP kurang! THOUSAND ARROWS butuh 45 MP.`)
                    player.mp -= 45
                    // 5 anak panah masing-masing bisa crit
                    const arrowCount = 5
                    let totalArrow = 0
                    const arrowHits = []
                    for (let i = 0; i < arrowCount; i++) {
                        const isCrit = Math.random() < 0.4
                        let dmg = Math.max(1, Math.floor(_pS.attack * 0.8 - battleState.monster.defense * 0.3))
                        if (isCrit) dmg = Math.floor(dmg * 1.8)
                        totalArrow += dmg
                        arrowHits.push(`${dmg}${isCrit ? '⚡' : ''}`)
                    }
                    ultiDmg = totalArrow
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🌊 *🏹 THOUSAND ARROWS! 🏹*`)
                    battleLog.push(`  💨 Ribuan anak panah melesat bak badai!`)
                    battleLog.push(`  💥 Hits: ${arrowHits.join(' | ')}`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    break
                }
                case 'peri': {
                    if (player.mp < 55) return Reply(`🔵 MP kurang! PIXIE STORM butuh 55 MP.`)
                    player.mp -= 55
                    // Multi hit + heal besar
                    const pixieHits = [0.9, 1.1, 1.3, 0.8]
                    let pixieTot = 0
                    const pixieList = []
                    for (const m of pixieHits) {
                        const h = Math.floor(_pS.attack * m)
                        pixieTot += h
                        pixieList.push(h)
                    }
                    ultiDmg = pixieTot
                    battleState.monsterHp -= ultiDmg
                    const pixieHeal = Math.floor(player.maxHp * 0.25)
                    player.hp = Math.min(player.maxHp, player.hp + pixieHeal)
                    battleLog.push(`  🧚 *✨ PIXIE STORM! ✨*`)
                    battleLog.push(`  🌟 Badai debu peri menghajar dari segala arah!`)
                    battleLog.push(`  💥 Hits: ${pixieList.join(' | ')}`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    battleLog.push(`  💚 Fairy Heal   : *+${pixieHeal} HP*`)
                    break
                }
                case 'iblis': {
                    if (player.mp < 65) return Reply(`🔵 MP kurang! SOUL DRAIN butuh 65 MP.`)
                    player.mp -= 65
                    ultiDmg = Math.floor(_pS.attack * 4.5)
                    battleState.monsterHp -= ultiDmg
                    const drainHeal = Math.floor(ultiDmg * 0.3)
                    player.hp = Math.min(player.maxHp, player.hp + drainHeal)
                    battleLog.push(`  😈 *🩸 SOUL DRAIN! 🩸*`)
                    battleLog.push(`  💀 Jiwa musuh disedot ke dalam kegelapan!`)
                    battleLog.push(`  💥 Damage diberikan : *${ultiDmg}*`)
                    battleLog.push(`  🩸 Soul Harvest : *+${drainHeal} HP* (30% dmg)`)
                    break
                }
                case 'golem': {
                    if (player.mp < 30) return Reply(`🔵 MP kurang! EARTH SHATTER butuh 30 MP.`)
                    player.mp -= 30
                    ultiDmg = Math.floor(_pS.attack * 2.5 + _pS.defense * 1.5)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🗿 *⛰️ EARTH SHATTER! ⛰️*`)
                    battleLog.push(`  💥 Bumi terbelah, musuh terkubur!`)
                    battleLog.push(`  💥 Damage (ATK+DEF) : *${ultiDmg}*`)
                    break
                }
                case 'darkmage': {
                    if (player.mp < 80) return Reply(`🔵 MP kurang! VOID EXPLOSION butuh 80 MP.`)
                    player.mp -= 80
                    ultiDmg = Math.floor(_pS.attack * 6.0)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🌑 *💥 VOID EXPLOSION! 💥*`)
                    battleLog.push(`  🕳️ Dimensi void meledak menghancurkan realita!`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}* (VOID BURST)`)
                    break
                }
                case 'mercenary': {
                    if (player.mp < 50) return Reply(`🔵 MP kurang! OVERKILL butuh 50 MP.`)
                    player.mp -= 50
                    const okHits = [1.0, 1.2, 1.5, 1.8, 2.0]
                    let okTot = 0
                    const okList = []
                    for (const m of okHits) {
                        const h = Math.floor(_pS.attack * m)
                        okTot += h
                        okList.push(h)
                    }
                    ultiDmg = okTot
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  💼 *⚔️ OVERKILL! ⚔️*`)
                    battleLog.push(`  💢 5 serangan beruntun tiada henti!`)
                    battleLog.push(`  💥 Hits: ${okList.join(' → ')}`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    break
                }
                case 'assassin': {
                    if (player.mp < 55) return Reply(`🔵 MP kurang! SHADOW KILL butuh 55 MP.`)
                    player.mp -= 55
                    const isCritSK = Math.random() < 0.9
                    ultiDmg = Math.floor(_pS.attack * 5.0)
                    if (isCritSK) ultiDmg = Math.floor(ultiDmg * 2.0)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🥷 *💀 SHADOW KILL! 💀*`)
                    battleLog.push(`  🌑 Menghilang ke bayang, muncul di titik vital!`)
                    if (isCritSK) battleLog.push(`  ⚡ *FATAL BACKSTAB!* x2.0 crit!`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    break
                }
                case 'paladin': {
                    if (player.mp < 70) return Reply(`🔵 MP kurang! HOLY JUDGEMENT butuh 70 MP.`)
                    player.mp -= 70
                    ultiDmg = Math.floor(_pS.attack * 4.0)
                    battleState.monsterHp -= ultiDmg
                    const holyUHeal = Math.floor(player.maxHp * 0.30)
                    player.hp = Math.min(player.maxHp, player.hp + holyUHeal)
                    battleLog.push(`  ✨ *⚖️ HOLY JUDGEMENT! ⚖️*`)
                    battleLog.push(`  🌟 Cahaya surgawi menghakimi semua dosa!`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    battleLog.push(`  💚 Sacred Heal  : *+${holyUHeal} HP*`)
                    break
                }
                case 'necromancer': {
                    if (player.mp < 75) return Reply(`🔵 MP kurang! DEATH CURSE butuh 75 MP.`)
                    player.mp -= 75
                    ultiDmg = Math.floor(_pS.attack * 5.5)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  💀 *☠️ DEATH CURSE! ☠️*`)
                    battleLog.push(`  👻 Kutukan kematian membusukkan musuh dari dalam!`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}* (CURSE)`)
                    break
                }
                case 'berserker': {
                    if (player.mp < 30) return Reply(`🔵 MP kurang! RAMPAGE butuh 30 MP.`)
                    player.mp -= 30
                    const ramHpSac = Math.floor(player.maxHp * 0.20)
                    player.hp = Math.max(1, player.hp - ramHpSac)
                    ultiDmg = Math.floor(_pS.attack * 6.0)
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  💢 *🔥 RAMPAGE! 🔥*`)
                    battleLog.push(`  😡 Kegilaan total! Semua rasa sakit jadi kekuatan!`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}* (6x ATK!)`)
                    battleLog.push(`  💔 HP dikorbankan: *-${ramHpSac} HP*`)
                    break
                }
                case 'ranger': {
                    if (player.mp < 50) return Reply(`🔵 MP kurang! NATURE WRATH butuh 50 MP.`)
                    player.mp -= 50
                    const natArrows = 6
                    let natTot = 0
                    const natList = []
                    for (let i = 0; i < natArrows; i++) {
                        const isCritN = Math.random() < 0.5
                        let nd = Math.max(1, Math.floor(_pS.attack * 0.9 - battleState.monster.defense * 0.2))
                        if (isCritN) nd = Math.floor(nd * 2.0)
                        natTot += nd
                        natList.push(`${nd}${isCritN ? '⚡' : ''}`)
                    }
                    ultiDmg = natTot
                    battleState.monsterHp -= ultiDmg
                    battleLog.push(`  🌿 *🏹 NATURE WRATH! 🏹*`)
                    battleLog.push(`  🌪️ 6 panah alam melesat bak angin puting beliung!`)
                    battleLog.push(`  💥 Hits: ${natList.join(' | ')}`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    break
                }
                case 'shaman': {
                    if (player.mp < 65) return Reply(`🔵 MP kurang! SPIRIT STORM butuh 65 MP.`)
                    player.mp -= 65
                    const spirHits = [1.2, 1.5, 2.0]
                    let spirTot = 0
                    const spirList = []
                    for (const m of spirHits) {
                        const h = Math.floor(_pS.attack * m)
                        spirTot += h
                        spirList.push(h)
                    }
                    ultiDmg = spirTot
                    battleState.monsterHp -= ultiDmg
                    const spirHeal = Math.floor(player.maxHp * 0.20)
                    player.hp = Math.min(player.maxHp, player.hp + spirHeal)
                    battleLog.push(`  🌀 *⛈️ SPIRIT STORM! ⛈️*`)
                    battleLog.push(`  🌊 Roh-roh leluhur bangkit menyerang bersama!`)
                    battleLog.push(`  💥 Hits: ${spirList.join(' | ')}`)
                    battleLog.push(`  💥 Total damage : *${ultiDmg}*`)
                    battleLog.push(`  💚 Spirit Heal  : *+${spirHeal} HP*`)
                    break
                }
                case 'the_creator': {
                    if (player.mp < 1) return Reply(`🔵 MP habis!`)
                    player.mp = Math.max(0, player.mp - 1)
                    // INSTANT KILL
                    ultiDmg = battleState.monsterHp + 99999
                    battleState.monsterHp = -99999
                    battleLog.push(`  ☀️ *👑 DIVINE WRATH! 👑*`)
                    battleLog.push(`  ⚡ Tuhan berkata: "Cukup."`)
                    battleLog.push(`  💀 *INSTANT KILL!* Musuh dihapus dari eksistensi!`)
                    break
                }
                default: return Reply(`❌ Class ini tidak punya ulti.\nClass kamu: *${player.class}*`)
            }
            battleState.ultiUsed = true
            if (player.pet?.attack > 0 && battleState.monsterHp > 0) {
                const petDmg = player.pet.attack
                battleState.monsterHp -= petDmg
                battleLog.push(`  🐾 *${player.pet.name}* ikutan! +${petDmg} dmg!`)
            }
            battleLog.push(``)
            if (battleState.monsterHp <= 0) {
                battleLog.push(`🎉 *VICTORY! ULTIMATE menghancurkan segalanya!*`)
                battleLog.push(``)
                player.gold += battleState.monster.gold
                const lvUpU = gainExp(player, battleState.monster.exp)
                player.monstersDefeated = (player.monstersDefeated || 0) + 1
                battleLog.push(`  💵 +${toRupiah(battleState.monster.gold)}`)
                battleLog.push(`  ⭐ +${battleState.monster.exp} EXP`)
                if (battleState.monster.drops) {
                    if (!player.inventory) player.inventory = {}
                    for (const [itemId, chance] of Object.entries(battleState.monster.drops)) {
                        if (Math.random() < chance) {
                            player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
                            battleLog.push(`  🎁 drop: *${rpgDB.items[itemId]?.name || itemId}*`)
                        }
                    }
                }
                if (lvUpU) battleLog.push(`  🎊 *LEVEL UP! ➜ Lv.${player.level}!*`)
                delete player.battleState
            } else {
                const mBackDmg = calculateDamage(battleState.monster, player)
                player.hp = Math.max(0, player.hp - mBackDmg.damage)
                battleLog.push(`  🛡️ Damage diterima  : *-${mBackDmg.damage}* HP`)
                battleLog.push(``)
                battleLog.push(`📊 *STATUS PERTEMPURAN*`)
                battleLog.push(``)
                battleLog.push(`  🫵 Kamu   ${mkHpBarU(player.hp, player.maxHp)}`)
                battleLog.push(`     HP: ${player.hp}/${player.maxHp}`)
                battleLog.push(`  👾 ${battleState.monster.name}`)
                battleLog.push(`     ${mkHpBarU(Math.max(0,battleState.monsterHp), battleState.monster.hp)}`)
                battleLog.push(`     HP: ${Math.max(0,battleState.monsterHp)}/${battleState.monster.hp}`)
                battleLog.push(``)
                battleLog.push(`⚔️ .attack | ✨ .skill | 🏃 .flee`)
                if (player.hp <= 0) {
                    const gLossU = Math.max(10, Math.floor(player.gold * 0.05))
                    player.hp = 1
                    player.gold = Math.max(0, player.gold - gLossU)
                    battleLog.push(`💀 *DEFEAT!* -${toRupiah(gLossU)} gold`)
                    delete player.battleState
                }
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(battleLog.join('\n'))
        }

                if (command === 'flee') {
            
                

            if (!rpgDB.players[senderJid] || !rpgDB.players[senderJid].battleState || !rpgDB.players[senderJid].battleState.inBattle) {
                return Reply(`❌ Kamu tidak sedang bertarung! Ketik *.rpgexplore* untuk cari musuh.`)
            }
            const player = rpgDB.players[senderJid]
            const monster = player.battleState.monster
            const fleeChance = (player.agility / (player.agility + monster.level * 5))
            if (Math.random() < fleeChance) {
                delete player.battleState
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                
                return Reply(`
✦ ── 🏃‍♂️  KABUR BERHASIL!  🏃‍♂️ ──
  👾 ${monster.name} cuma bisa melongo lihat lu kabur
  🏃‍♂️ Skill kabur lu level dewa!
Tapi inget, kabur terus gak akan bikin lu kuat~ 💪`)
            } else {
                const monsterDamage = calculateDamage(monster, player)
                player.hp -= monsterDamage.damage
                let battleLog = [`
✦ ── ❌  GAGAL KABUR!  ❌ ──
  👾 ${monster.name} nyerang dari belakang!
  💥 Damage : ${monsterDamage.damage}`]
                if (player.hp <= 0) {
                    battleLog.push(``)
                    battleLog.push(`💀 *TE WAS...*`)
                    battleLog.push(`💀 Sial, mati pas kabur!`)
                    battleLog.push(``)
                    player.hp = 1
                    player.gold = Math.max(0, player.gold - 20)
                    battleLog.push(`  💵 -Rp.20 | Sisa: ${toRupiah(player.gold)}`)
                    battleLog.push(``)
                    delete player.battleState
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                
                return Reply(battleLog.join('\n'))
            }
        }

        if (command === 'rpgmove') {
            
                

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            if (!text) {
                const player = rpgDB.players[senderJid]
                const plvl = player.level || 1
                // Pisahkan lokasi combat dan resource
                const combatLocs = Object.entries(rpgDB.locations).filter(([,loc]) => loc.monsters).sort((a,b) => (a[1].minLevel||0) - (b[1].minLevel||0))
                const resourceLocs = Object.entries(rpgDB.locations).filter(([,loc]) => !loc.monsters).sort((a,b) => (a[1].minLevel||0) - (b[1].minLevel||0))

                let locMsg = `✦ 🗺️  PETA DUNIA  🗺️\n\n  👤 Level kamu: *${plvl}*\n\n  ⚔️ *ZONA PERTEMPURAN*\n`
                for (const [id, loc] of combatLocs) {
                    const canAccess = plvl >= loc.minLevel
                    const isCurrent = player.location === id
                    const lvlDiff = plvl - loc.minLevel
                    const zoneHint = !canAccess ? '🔒' : lvlDiff >= 10 ? '😏 terlalu mudah' : lvlDiff >= 5 ? '✅ cocok' : lvlDiff >= 0 ? '⚠️ menantang' : '🔒'
                    locMsg += `  ${isCurrent ? '📍' : canAccess ? '✅' : '❌'} *${loc.name}* ${isCurrent ? '(di sini)' : ''}\n`
                    locMsg += `   Level ${loc.minLevel}–${loc.maxLevel} ${zoneHint}\n`
                    if (canAccess) locMsg += `   *.rpgmove ${id}*\n`
                    locMsg += `\n`
                }
                locMsg += `  🏗️ *ZONA RESOURCE*\n`
                for (const [id, loc] of resourceLocs) {
                    const canAccess = plvl >= loc.minLevel
                    const isCurrent = player.location === id
                    locMsg += `  ${isCurrent ? '📍' : canAccess ? '✅' : '❌'} *${loc.name}* ${isCurrent ? '(di sini)' : ''}\n`
                    locMsg += `   Level min ${loc.minLevel} | *.rpgmove ${id}*\n\n`
                }
                                return Reply(locMsg)
            }
            const player = rpgDB.players[senderJid]
            const locationId = text.toLowerCase()
            if (!rpgDB.locations[locationId]) {
                return Reply(`❌ lokasi "${text}" gak ada di peta! cek *.rpgmove* buat liat daftarnya.`)
            }
            const targetLocation = rpgDB.locations[locationId]
            if (player.level < targetLocation.minLevel) {
                return Reply(`❌ level lu kurang! butuh level ${targetLocation.minLevel} buat masuk ${targetLocation.name}.`)
            }
            player.location = locationId
            player.totalMoves = (player.totalMoves || 0) + 1
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            return Reply(`
✦ ── 🚶‍♂️  PINDAH LOKASI  🚶‍♂️ ──
  📍 Lokasi   : *${targetLocation.name}*
  🎯 Level    : ${targetLocation.minLevel}–${targetLocation.maxLevel}
Hati-hati, monster di sini gak segan-segan~ ⚠️`)
        }

        if (command === 'rpginv' || command === 'rpg inventory') {
            
                

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            const player = rpgDB.players[senderJid]

            // Helper inline (safe to call here — FISH_DATA etc defined above in same scope run)
            const _invFish = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('fish_') && v > 0)
            const _invRods = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('rod_') && v > 0)
            const _invBaits = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('bait_') && v > 0)
            const _invOther = Object.entries(player.inventory || {}).filter(([k,v]) => !k.startsWith('fish_') && !k.startsWith('rod_') && !k.startsWith('bait_') && v > 0)

            let inventoryText = `✦ 🎒  INVENTORY  🎒\n\n`

            // ── Item biasa
            if (_invOther.length > 0) {
                inventoryText += `  📦 *ITEM*\n`
                for (const [itemId, quantity] of _invOther) {
                    if (rpgDB.items[itemId]) {
                        inventoryText += `  ${rpgDB.items[itemId].name} x${quantity}\n`
                    }
                }
            }

            // ── Joran
            if (_invRods.length > 0) {
                inventoryText += `\n  🎣 *JORAN*\n`
                for (const [k, qty] of _invRods) {
                    const rid = k.replace('rod_', '')
                    const rd  = ROD_DATA[rid]
                    if (rd) inventoryText += `  ${rd.emoji} ${rd.name} [${rd.tier}] x${qty}\n`
                }
            }

            // ── Umpan
            if (_invBaits.length > 0) {
                inventoryText += `\n  🪱 *UMPAN*\n`
                for (const [k, qty] of _invBaits) {
                    const bid = k.replace('bait_', '')
                    const bt  = BAIT_DATA[bid]
                    if (bt) inventoryText += `  ${bt.emoji} ${bt.name} [${bt.tier}] x${qty}\n`
                }
            }

            // ── Ikan
            if (_invFish.length > 0) {
                inventoryText += `\n  🐟 *IKAN* (${_invFish.length} jenis)\n`
                let fishVal = 0
                for (const [k, qty] of _invFish.slice(0, 8)) {
                    const { fishId, mutationId } = parseFishKey(k)
                    if (!fishId) {
                        inventoryText += `  ⬜ ❓ ${k.replace('fish_','')} x${qty}\n`
                        continue
                    }
                    const fdata = FISH_DATA[fishId] || { name: fishId, emoji: '🐟', rarity: 'COMMON', basePrice: 0 }
                    const mdata = mutationId ? MUTATION_DATA[mutationId] : null
                    const price = calcFishPrice(fdata, mdata)
                    fishVal += price * qty
                    inventoryText += `  ${getRarityEmoji(fdata.rarity)} ${getFishDisplayName(fdata, mdata)} x${qty}\n`
                }
                if (_invFish.length > 8) inventoryText += `  ... dan ${_invFish.length - 8} jenis lagi\n`
                inventoryText += `  💼 Est. nilai ikan: ${toRupiah(fishVal)}\n`
                inventoryText += `  ↳ *.tasikan* untuk detail | *.jualikanbot* jual\n`
            }

            if (_invOther.length === 0 && _invRods.length === 0 && _invBaits.length === 0 && _invFish.length === 0) {
                inventoryText += `  kosong melompong...\n`
            }

            inventoryText += `\n\n`
            inventoryText += `💵 *KEUANGAN & EQUIPMENT*
`
            inventoryText += `  💰 saldo: *${toRupiah(player.gold || 0)}*\n`
            if (player.equipment?.weapon) inventoryText += `  ⚔️ senjata: ${rpgDB.items[player.equipment.weapon]?.name || 'unknown'}\n`
            if (player.equipment?.armor)  inventoryText += `  🛡️ armor: ${rpgDB.items[player.equipment.armor]?.name || 'unknown'}\n`

            // Fishing equip status
            if (player.fishing) {
                const eRod  = ROD_DATA[player.fishing.equippedRod || 'starter_rod']
                const eBait = player.fishing.equippedBait ? BAIT_DATA[player.fishing.equippedBait] : null
                inventoryText += `\n  🎣 Joran aktif : ${eRod?.emoji || '🎣'} ${eRod?.name || 'Starter Rod'}\n`
                inventoryText += `  🪱 Umpan aktif : ${eBait ? `${eBait.emoji} ${eBait.name}` : 'Tidak ada'}\n`
                inventoryText += `  🎯 Total tangkap: ${player.fishing.totalCatch || 0} ekor\n`
            }

                        
            return Reply(inventoryText)
        }

        if (command === 'rpgshop') {
            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            const player = rpgDB.players[senderJid]
            const _shopArgs = text ? text.trim().split(' ') : []
            const shopSub = _shopArgs[0]?.toLowerCase()

            const consumables = Object.entries(rpgDB.items).filter(([,i]) => i.type === 'heal' || i.type === 'mana')
            const botFeats    = Object.entries(rpgDB.items).filter(([,i]) => i.type === 'bot_feature')

            if (!shopSub || shopSub === 'menu') {
                return Reply(`
✦ ── 🛒  TOKO PETUALANG  🛒 ──
  *.rpgshop senjata*   — ⚔️  Senjata (8 tier s/d ABSOLUTE)
  *.rpgshop armor*     — 🛡️  Armor & Perisai (8 tier s/d ABSOLUTE)
  *.rpgshop potion*    — 🧪  Potion & Elixir (inc. Divine)
  *.rpgshop material*  — 🪨  Daftar harga material
  *.rpgshop fitur*     — 🤖  Fitur bot (s/d 500 limit)
💵 Saldo: ${toRupiah(player.gold)}
🛒 Beli: *.buy [id_item] [qty]*  ·  💸 Jual: *.sell [id_item] [qty]*
💡 Contoh: *.buy elixir_hidup 1*  |  *.buy potion 5*`)
            }

            if (shopSub === 'senjata') {
                const weaponTiers = [
                    { tier: "🪵 Pemula       [ATK 2–4]",    ids: ["pedang_kayu","busur_kayu"] },
                    { tier: "🗡️ Menengah     [ATK 5–9]",    ids: ["pedang_besi","busur_besi","tongkat_sihir"] },
                    { tier: "⚙️ Mahir        [ATK 10–22]",   ids: ["pedang_baja","busur_api","tongkat_kuno","busur_elven"] },
                    { tier: "💠 Langka       [ATK 18–25]",   ids: ["pedang_mithril","tongkat_es","pedang_kristal"] },
                    { tier: "🔥 Legendaris   [ATK 30–50]",   ids: ["pedang_naga","tongkat_dewa","busur_abadi","katana_jiwa","kapak_berdarah","tombak_halilintar","keris_setan","pedang_dewa"] },
                    { tier: "🌟 Ultra        [ATK 55–70]",   ids: ["tongkat_abadi","busur_chaos","tombak_titan","pedang_void"] },
                    { tier: "💀 BEYOND GOD   [ATK 90–130]",  ids: ["busur_kehancuran","kapak_ragnarok","katana_dewa_agung","trisula_poseidon","tombak_semesta","pedang_malaikat_maut","pedang_abadi","tongkat_roh_agung"] },
                    { tier: "💫 ABSOLUTE     [ATK 150–200]", ids: ["busur_mutlak","katana_supremasi","pedang_awal_semesta","tombak_kehancuran_abadi","tongkat_penciptaan","pedang_mutlak_absolut"] }
                ]
                let t = `✦ ⚔️  DAFTAR SENJATA  ⚔️\n\n`
                for (const { tier, ids } of weaponTiers) {
                    t += `  ${tier}\n`
                    for (const id of ids) {
                        const item = rpgDB.items[id]
                        if (!item) continue
                        const upgLvl = item.upgradeLevel || 0
                        const upgStr = upgLvl > 0 ? ` ✨+${upgLvl}` : ''
                        t += `  • *${item.name}*${upgStr}\n`
                        t += `   ↳ ⚔️ atk +${item.attack} | 💰 ${toRupiah(item.price)} | *.buy ${id}*\n`
                    }
                    t += `\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                t += `\n💡 *.upgrade weapon* — tingkatkan ATK senjata!`
                return Reply(t)
            }

            if (shopSub === 'armor') {
                const armorTiers = [
                    { tier: "🧥 Pemula       [DEF 1–3]",    ids: ["baju_kain","perisai_kayu","zirah_kulit"] },
                    { tier: "🛡️ Menengah     [DEF 5–7]",    ids: ["jubah_penyihir","perisai_besi","zirah_besi"] },
                    { tier: "⚙️ Mahir        [DEF 14–22]",   ids: ["zirah_baja","perisai_baja_kuno","jubah_naga"] },
                    { tier: "💠 Langka       [DEF 25–28]",   ids: ["zirah_mithril","zirah_kristal"] },
                    { tier: "🔥 Legendaris   [DEF 35–50]",   ids: ["perisai_naga","jubah_lich","zirah_orichalcum","zirah_dewa"] },
                    { tier: "🌟 Ultra        [DEF 60–72]",   ids: ["perisai_chaos","zirah_titan","jubah_void"] },
                    { tier: "💀 BEYOND GOD   [DEF 90–130]",  ids: ["jubah_keabadian","tameng_ragnarok","perisai_mutlak","jubah_roh_suci","zirah_semesta","zirah_malaikat","baju_dewa_agung","perisai_abyss"] },
                    { tier: "💫 ABSOLUTE     [DEF 160–200]", ids: ["jubah_mutlak","zirah_fajar_abadi","perisai_supremasi","jubah_kosmos","zirah_mutlak_absolut"] }
                ]
                let t = `✦ 🛡️  ARMOR & PERISAI  🛡️\n\n`
                for (const { tier, ids } of armorTiers) {
                    t += `  ${tier}\n`
                    for (const id of ids) {
                        const item = rpgDB.items[id]
                        if (!item) continue
                        const upgLvl = item.upgradeLevel || 0
                        const upgStr = upgLvl > 0 ? ` ✨+${upgLvl}` : ''
                        t += `  • *${item.name}*${upgStr}\n`
                        t += `   ↳ 🛡️ def +${item.defense} | 💰 ${toRupiah(item.price)} | *.buy ${id}*\n`
                    }
                    t += `\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                t += `\n💡 *.upgrade armor* — tingkatkan DEF zirah!`
                return Reply(t)
            }

            if (shopSub === 'potion') {
                let t = `✦ 🧪  POTION & ELIXIR  🧪\n\n`
                for (const [id, item] of consumables) {
                    t += `  *${item.name}* — ${toRupiah(item.price)}\n`
                    t += `  ↳ +${item.value >= 999 ? 'FULL' : item.value} ${item.type === 'heal' ? 'hp ❤️' : 'mp 🔵'} | Harga: ${toRupiah(item.price)} | *.buy ${id} [qty]*\n\n`
                }
                // Tampilkan luck_potion terpisah
                const luckPot = rpgDB.items['luck_potion']
                if (luckPot) {
                    t += `  *${luckPot.name}* — ${toRupiah(luckPot.price)}\n`
                    t += `  ↳ ${luckPot.desc} | *.buy luck_potion [qty]*\n\n`
                }
                const luckSuper = rpgDB.items['luck_super_potion']
                if (luckSuper) {
                    t += `  *${luckSuper.name}* — ${toRupiah(luckSuper.price)}\n`
                    t += `  ↳ ${luckSuper.desc} | *.buy luck_super_potion [qty]*\n\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(t)
            }

            if (shopSub === 'material') {
                const materials = Object.entries(rpgDB.items).filter(([,i]) => i.type === 'material')
                let t = `✦ 🪨  HARGA MATERIAL  🪨\n\n  (jual dengan *.sell [id] [qty]*)\n\n`
                for (const [id, item] of materials) {
                    const sellPrice = Math.floor(item.price * 0.5)
                    t += `  *${item.name}* → jual ${toRupiah(sellPrice)}/pcs | id: ${id}\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(t)
            }

            if (shopSub === 'fitur') {
                let t = `✦ 🤖  FITUR BOT  🤖\n\n`
                for (const [id, item] of botFeats) {
                    t += `  *${item.name}* — ${toRupiah(item.price)}\n`
                    t += `  ↳ +${item.value} limit hari ini | ${toRupiah(item.price)} | *.buy ${id} [qty]*\n\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(t)
            }

            return Reply(`❌ kategori gak ada! ketik *.rpgshop* untuk lihat menu.`)
        }

        if (command === 'buy') {
            
                

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            if (!text) {
                return Reply(`Gunakan: .buy [nama_item]\nContoh: .buy potion`)
            }
            const player = rpgDB.players[senderJid]
            // FIX: parse argumen dengan benar — "elixir_hidup 2" → itemId="elixir_hidup", qty=2
            const buyParts = text.trim().split(/\s+/)
            const itemId   = buyParts[0].toLowerCase()
            const buyQty   = Math.max(1, parseInt(buyParts[1]) || 1)

            // FIX: cari item secara fleksibel — coba exact match dulu, lalu fuzzy (spasi → underscore)
            const itemIdNorm = itemId.replace(/-/g, '_')
            if (!rpgDB.items[itemIdNorm]) {
                // Coba cari berdasarkan nama (jika user ketik nama bukan id)
                const matchByName = Object.entries(rpgDB.items).find(([,it]) =>
                    it.name.toLowerCase() === text.trim().toLowerCase() ||
                    it.name.toLowerCase().replace(/\s+/g, '_') === itemIdNorm
                )
                if (!matchByName) {
                    // Saran item terdekat
                    const allIds = Object.keys(rpgDB.items)
                    const similar = allIds.filter(id => id.includes(itemIdNorm) || itemIdNorm.includes(id.split('_')[0]))
                    const saranText = similar.length ? `\n💡 Maksud kamu: *${similar.slice(0,3).join(', ')}*?` : ''
                    return Reply(`❌ Item *${itemId}* tidak ada di toko! Cek *.rpgshop*${saranText}`)
                }
                // Gunakan match yang ditemukan
                const [foundId, foundItem] = matchByName
                if (player.gold < foundItem.price * buyQty) {
                    return Reply(`❌ Uang kurang! Butuh ${toRupiah(foundItem.price * buyQty)}, punya ${toRupiah(player.gold)}\n💸 Kurang: ${toRupiah(foundItem.price * buyQty - player.gold)}`)
                }
                player.gold -= foundItem.price * buyQty
                if (!player.inventory) player.inventory = {}
                player.inventory[foundId] = (player.inventory[foundId] || 0) + buyQty
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ ✅  PEMBELIAN BERHASIL!  ✅\n\n  🛍️ Item   : ${foundItem.name} x${buyQty}\n  💵 Harga  : ${toRupiah(foundItem.price * buyQty)}\n  💰 Sisa   : ${toRupiah(player.gold)}\n`)
            }
            const item     = rpgDB.items[itemIdNorm]
            const totalHarga = item.price * buyQty
            if (player.gold < totalHarga) {
                return Reply(`❌ Uang kurang! Butuh ${toRupiah(totalHarga)}, punya ${toRupiah(player.gold)}\n💸 Kurang: ${toRupiah(totalHarga - player.gold)}`)
            }
            player.gold -= totalHarga
            if (item.type === 'bot_feature') {
                // bot_feature tidak support beli banyak sekaligus
                addLimitToBonus(m.sender, item.value * buyQty)
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ ✅  PEMBELIAN BERHASIL!  ✅\n\n  🛍️ Item   : ${item.name} x${buyQty}\n  💵 Harga  : ${toRupiah(totalHarga)}\n  🎁 Bonus  : +${item.value * buyQty} limit bot hari ini\n`)
            } else {
                if (!player.inventory) player.inventory = {}
                player.inventory[itemIdNorm] = (player.inventory[itemIdNorm] || 0) + buyQty
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ ✅  PEMBELIAN BERHASIL!  ✅\n\n  🛍️ Item   : ${item.name} x${buyQty}\n  💵 Harga  : ${toRupiah(totalHarga)}\n  💰 Sisa   : ${toRupiah(player.gold)}\n`)
            }
        }

        if (command === 'sell') {
            
                

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            if (!text) {
                return Reply(`Gunakan: .sell [nama_item] [jumlah]\nContoh: .sell potion 1\nCek inventory di *.rpginv*`)
            }
            const player = rpgDB.players[senderJid]
            const sellParts = text.trim().split(/\s+/)
            // FIX: jika arg terakhir angka → qty, sisanya adalah item_id
            let sellItemId, sellAmount
            const lastArg = sellParts[sellParts.length - 1]
            if (sellParts.length > 1 && /^\d+$/.test(lastArg)) {
                sellAmount = parseInt(lastArg)
                sellItemId = sellParts.slice(0, -1).join('_').toLowerCase()
            } else {
                sellAmount = 1
                sellItemId = sellParts.join('_').toLowerCase()
            }
            const itemId = sellItemId
            const amount = Math.max(1, sellAmount)
            if (!rpgDB.items[itemId]) {
                // Coba cari tanpa normalisasi
                const byName = Object.entries(rpgDB.items).find(([,it]) => it.name.toLowerCase() === text.replace(/\s*\d+$/, '').trim().toLowerCase())
                if (!byName) return Reply(`❌ Item *${itemId}* tidak ada!\n💡 Cek inventory: *.rpginv* | Cek ID item: *.rpgshop*`)
                const [foundSellId, foundSellItem] = byName
                if (!player.inventory?.[foundSellId] || player.inventory[foundSellId] < amount) {
                    return Reply(`❌ Item kurang! Punya: ${player.inventory?.[foundSellId] || 0}, mau jual: ${amount}`)
                }
                const foundSellPrice = Math.floor(foundSellItem.price * 0.5) * amount
                player.gold += foundSellPrice
                player.inventory[foundSellId] -= amount
                if (player.inventory[foundSellId] <= 0) delete player.inventory[foundSellId]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ 💰  ITEM TERJUAL!  💰\n\n  🛍️ Item   : ${foundSellItem.name} x${amount}\n  💵 Dapet  : ${toRupiah(foundSellPrice)}\n  💰 Saldo  : ${toRupiah(player.gold)}\n`)
            }
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < amount) {
                return Reply(`❌ lu gak punya ${itemId} x${amount} di inventory! punya: ${player.inventory?.[itemId] || 0}`)
            }
            const item = rpgDB.items[itemId]
            const sellPrice = Math.floor(item.price * 0.5) * amount
            player.gold += sellPrice
            player.inventory[itemId] -= amount
            if (player.inventory[itemId] <= 0) {
                delete player.inventory[itemId]
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            return Reply(`
✦ ── 💰  ITEM TERJUAL!  💰 ──
  🛍️ Item   : ${item.name} x${amount}
  💵 Dapet  : ${toRupiah(sellPrice)}
  💰 Saldo  : ${toRupiah(player.gold)}`)
        }

        // ─── JUALBOT — Jual semua jenis barang ke sistem bot ────────────────
        if (command === 'jualbot') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            // ── Tampilkan menu jika tidak ada argumen ──
            if (!text) {
                // Hitung ringkasan inventori untuk preview
                const invItems  = Object.entries(player.inventory || {}).filter(([k,v]) => !k.startsWith('fish_') && !k.startsWith('rod_') && !k.startsWith('bait_') && v > 0 && rpgDB.items[k])
                const invFish   = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('fish_') && v > 0)
                const invRods   = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('rod_') && v > 0)
                const invBaits  = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('bait_') && v > 0)
                const hasPet    = !!player.pet
                const equippedRod  = player.fishing?.equippedRod
                const equippedBait = player.fishing?.equippedBait
                // Hitung estimasi total nilai
                let estTotal = 0
                for (const [k,v] of invItems) {
                    const price = rpgDB.items[k]?.price || 0
                    estTotal += Math.floor(price * 0.5) * v
                }
                for (const [k,v] of invFish) {
                    const { fishId: baseId, mutationId: mutId } = parseFishKey(k)
                    const fishDat = baseId ? FISH_DATA[baseId] : null
                    const mutDat  = mutId ? MUTATION_DATA[mutId] : null
                    const price  = fishDat ? (mutDat ? Math.floor(fishDat.basePrice * mutDat.multiplier) : fishDat.basePrice) : 0
                    estTotal += price * v
                }
                for (const [k,v] of invRods) {
                    const rodId = k.replace('rod_', '')
                    if (rodId === equippedRod) continue // skip yang sedang diequip
                    const rodPrice = ROD_DATA[rodId]?.price || 0
                    estTotal += Math.floor(rodPrice * 0.4) * v
                }
                for (const [k,v] of invBaits) {
                    const baitId = k.replace('bait_', '')
                    if (baitId === equippedBait) continue
                    const baitPrice = BAIT_DATA[baitId]?.price || 0
                    estTotal += Math.floor(baitPrice * 0.4) * v
                }
                if (hasPet) {
                    const petSellPrice = rpgDB.petData[player.pet?.id]?.cost || 0
                    estTotal += Math.floor(petSellPrice * 0.3)
                }
                let menuText = `✦ ── 🏪  JUAL KE BOT  🏪 ──
  Pilih kategori yang mau dijual:

  📦 *.jualbot item [id] [qty]*
   Jual weapon/armor/potion/material
   Harga: 50% dari harga beli

  🎣 *.jualbot pancing [id] [qty]*
   Jual joran dari inventory
   (Joran aktif tidak bisa dijual)
   Harga: 40% dari harga beli

  🪱 *.jualbot umpan [id] [qty]*
   Jual umpan dari inventory
   (Umpan aktif tidak bisa dijual)
   Harga: 40% dari harga beli

  🐾 *.jualbot pet*
   Jual hewan peliharaan
   Harga: 30% dari harga adopsi

  🐟 *.jualbot ikan*
   Jual semua ikan (sama dengan .jualikanbot)
   Harga: nilai pasar ikan

  💰 *.jualbot semua*
   Jual SEMUA barang sekaligus!
   (kecuali item yg sedang diequip)

📊 *Estimasi total jika jual semua: ${toRupiah(estTotal)}*
📦 Item: ${invItems.length} jenis | 🎣 Joran: ${invRods.length} | 🪱 Umpan: ${invBaits.length}
🐟 Ikan: ${invFish.length} jenis | 🐾 Pet: ${hasPet ? player.pet.name : 'tidak ada'}`
                return Reply(menuText)
            }

            const jualArgs = text.trim().split(' ')
            const jualKategori = jualArgs[0].toLowerCase()

            // ── JUAL ITEM (weapon/armor/potion/material) ──────────────────
            if (jualKategori === 'item') {
                if (!jualArgs[1]) {
                    // Tampilkan semua item yang bisa dijual
                    const sellableItems = Object.entries(player.inventory || {}).filter(([k,v]) => {
                        return v > 0 && rpgDB.items[k] && 
                               k !== player.equipment?.weapon &&
                               k !== player.equipment?.armor
                    })
                    if (sellableItems.length === 0) return Reply(`❌ Tidak ada item di inventory yang bisa dijual!\n(Item yang sedang diequip tidak bisa dijual)`)
                    let listTxt = `✦ 📦  DAFTAR ITEM BISA DIJUAL  📦\n\n`
                    let totalEst = 0
                    for (const [k, v] of sellableItems) {
                        const it = rpgDB.items[k]
                        const unitPrice = Math.floor((it.price || 0) * 0.5)
                        const total = unitPrice * v
                        totalEst += total
                        listTxt += `  ${it.name} x${v} → ${toRupiah(total)}\n`
                    }
                    listTxt += `\n💰 Total estimasi: *${toRupiah(totalEst)}*\n`
                    listTxt += `▶ *.jualbot item [id] [qty]* — jual spesifik\n▶ *.jualbot item semua* — jual semua item`
                    return Reply(listTxt)
                }
                if (jualArgs[1] === 'semua') {
                    // Jual semua item kecuali yang diequip
                    const sellItems = Object.entries(player.inventory || {}).filter(([k,v]) => {
                        return v > 0 && rpgDB.items[k] &&
                               k !== player.equipment?.weapon &&
                               k !== player.equipment?.armor
                    })
                    if (sellItems.length === 0) return Reply(`❌ Tidak ada item yang bisa dijual!`)
                    let totalGold = 0
                    let soldList = []
                    for (const [k, v] of sellItems) {
                        const it = rpgDB.items[k]
                        const earned = Math.floor((it.price || 0) * 0.5) * v
                        totalGold += earned
                        soldList.push(`${it.name} x${v} → ${toRupiah(earned)}`)
                        delete player.inventory[k]
                    }
                    player.gold += totalGold
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    let resTxt = `✦ 💰  SEMUA ITEM TERJUAL!  💰\n\n`
                    soldList.slice(0, 10).forEach(s => resTxt += `  ✅ ${s}\n`)
                    if (soldList.length > 10) resTxt += `  ... dan ${soldList.length - 10} item lainnya\n`
                    resTxt += `\n  💵 Total Dapet : *${toRupiah(totalGold)}*\n  💰 Saldo      : *${toRupiah(player.gold)}*\n`
                    return Reply(resTxt)
                }
                // Jual item spesifik
                const jualItemId = jualArgs[1].toLowerCase()
                const jualQty    = parseInt(jualArgs[2]) || 1
                if (!rpgDB.items[jualItemId]) return Reply(`❌ Item *${jualItemId}* tidak ditemukan!\n💡 Cek inventory: *.rpginv*`)
                if (jualItemId === player.equipment?.weapon) return Reply(`❌ *${rpgDB.items[jualItemId].name}* sedang diequip sebagai senjata!\nLepas dulu: *.unequip weapon*`)
                if (jualItemId === player.equipment?.armor)  return Reply(`❌ *${rpgDB.items[jualItemId].name}* sedang diequip sebagai armor!\nLepas dulu: *.unequip armor*`)
                if (!player.inventory?.[jualItemId] || player.inventory[jualItemId] < jualQty) {
                    return Reply(`❌ Item tidak cukup! Punya: ${player.inventory?.[jualItemId] || 0}, mau jual: ${jualQty}`)
                }
                const jualIt   = rpgDB.items[jualItemId]
                const jualEarned = Math.floor((jualIt.price || 0) * 0.5) * jualQty
                player.inventory[jualItemId] -= jualQty
                if (player.inventory[jualItemId] <= 0) delete player.inventory[jualItemId]
                player.gold += jualEarned
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ 💰  ITEM TERJUAL!  💰\n\n  📦 Item   : *${jualIt.name}* x${jualQty}\n  💵 Dapet  : *${toRupiah(jualEarned)}*\n  💰 Saldo  : *${toRupiah(player.gold)}*\n`)
            }

            // ── JUAL PANCING / JORAN ──────────────────────────────────────
            if (jualKategori === 'pancing' || jualKategori === 'joran') {
                const equippedRodId = player.fishing?.equippedRod || 'starter_rod'
                if (!jualArgs[1]) {
                    const ownedRods = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('rod_') && v > 0)
                    if (ownedRods.length === 0) return Reply(`❌ Tidak ada joran di inventory!`)
                    let listTxt = `✦ 🎣  DAFTAR JORAN BISA DIJUAL  🎣\n\n  🎣 Aktif: *${ROD_DATA[equippedRodId]?.name || 'Starter Rod'}* (tidak bisa dijual)\n\n`
                    let estTotal = 0
                    for (const [k, v] of ownedRods) {
                        const rodId = k.replace('rod_', '')
                        if (rodId === equippedRodId) { listTxt += `  ⛔ ${ROD_DATA[rodId]?.emoji || '🎣'} ${ROD_DATA[rodId]?.name || rodId} x${v} (sedang dipakai)\n`; continue }
                        const rod = ROD_DATA[rodId]
                        const unitPrice = Math.floor((rod?.price || 0) * 0.4)
                        const total = unitPrice * v
                        estTotal += total
                        listTxt += `  ${rod?.emoji || '🎣'} *${rod?.name || rodId}* x${v} → ${toRupiah(total)}\n`
                        listTxt += `    ↳ *.jualbot pancing ${rodId} ${v}*\n`
                    }
                    listTxt += `\n💰 Est. total: *${toRupiah(estTotal)}*\n▶ *.jualbot pancing semua* — jual semua (kecuali aktif)`
                    return Reply(listTxt)
                }
                if (jualArgs[1] === 'semua') {
                    const rodEntries = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('rod_') && v > 0 && k.replace('rod_','') !== equippedRodId)
                    if (rodEntries.length === 0) return Reply(`❌ Tidak ada joran yang bisa dijual (joran aktif tidak bisa dijual)!`)
                    let totalGold = 0; let soldList = []
                    for (const [k, v] of rodEntries) {
                        const rodId = k.replace('rod_', '')
                        const rod = ROD_DATA[rodId]
                        const earned = Math.floor((rod?.price || 0) * 0.4) * v
                        totalGold += earned
                        soldList.push(`${rod?.emoji || '🎣'} ${rod?.name || rodId} x${v} → ${toRupiah(earned)}`)
                        delete player.inventory[k]
                    }
                    player.gold += totalGold
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    let resTxt = `✦ 🎣  JORAN TERJUAL!  🎣\n\n`
                    soldList.forEach(s => resTxt += `  ✅ ${s}\n`)
                    resTxt += `\n  💵 Total Dapet : *${toRupiah(totalGold)}*\n  💰 Saldo      : *${toRupiah(player.gold)}*\n`
                    return Reply(resTxt)
                }
                const jualRodId  = jualArgs[1].toLowerCase()
                const jualRodQty = parseInt(jualArgs[2]) || 1
                if (jualRodId === equippedRodId) return Reply(`❌ *${ROD_DATA[jualRodId]?.name || jualRodId}* sedang dipakai! Ganti joran aktif dulu di *.shoprod pasang [id]*`)
                if (!ROD_DATA[jualRodId]) return Reply(`❌ Joran *${jualRodId}* tidak dikenal!`)
                const rodInvKey = `rod_${jualRodId}`
                if (!player.inventory?.[rodInvKey] || player.inventory[rodInvKey] < jualRodQty) {
                    return Reply(`❌ Joran tidak cukup! Punya: ${player.inventory?.[rodInvKey] || 0}, mau jual: ${jualRodQty}`)
                }
                const rodData   = ROD_DATA[jualRodId]
                const rodEarned = Math.floor((rodData.price || 0) * 0.4) * jualRodQty
                player.inventory[rodInvKey] -= jualRodQty
                if (player.inventory[rodInvKey] <= 0) delete player.inventory[rodInvKey]
                player.gold += rodEarned
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ 🎣  JORAN TERJUAL!  🎣\n\n  🎣 Joran  : *${rodData.emoji} ${rodData.name}* x${jualRodQty}\n  💵 Dapet  : *${toRupiah(rodEarned)}*\n  💰 Saldo  : *${toRupiah(player.gold)}*\n`)
            }

            // ── JUAL UMPAN / BAIT ─────────────────────────────────────────
            if (jualKategori === 'umpan' || jualKategori === 'bait') {
                const equippedBaitId = player.fishing?.equippedBait || null
                if (!jualArgs[1]) {
                    const ownedBaits = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('bait_') && v > 0)
                    if (ownedBaits.length === 0) return Reply(`❌ Tidak ada umpan di inventory!`)
                    let listTxt = `✦ 🪱  DAFTAR UMPAN BISA DIJUAL  🪱\n\n`
                    if (equippedBaitId) listTxt += `  🪱 Aktif: *${BAIT_DATA[equippedBaitId]?.name || equippedBaitId}* (tidak bisa dijual)\n\n`
                    let estTotal = 0
                    for (const [k, v] of ownedBaits) {
                        const baitId = k.replace('bait_', '')
                        if (baitId === equippedBaitId) { listTxt += `  ⛔ ${BAIT_DATA[baitId]?.emoji || '🪱'} ${BAIT_DATA[baitId]?.name || baitId} x${v} (aktif)\n`; continue }
                        const bait = BAIT_DATA[baitId]
                        const unitPrice = Math.floor((bait?.price || 0) * 0.4)
                        const total = unitPrice * v
                        estTotal += total
                        listTxt += `  ${bait?.emoji || '🪱'} *${bait?.name || baitId}* x${v} → ${toRupiah(total)}\n`
                        listTxt += `    ↳ *.jualbot umpan ${baitId} ${v}*\n`
                    }
                    listTxt += `\n💰 Est. total: *${toRupiah(estTotal)}*\n▶ *.jualbot umpan semua* — jual semua (kecuali aktif)`
                    return Reply(listTxt)
                }
                if (jualArgs[1] === 'semua') {
                    const baitEntries = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('bait_') && v > 0 && k.replace('bait_','') !== equippedBaitId)
                    if (baitEntries.length === 0) return Reply(`❌ Tidak ada umpan yang bisa dijual (umpan aktif tidak bisa dijual)!`)
                    let totalGold = 0; let soldList = []
                    for (const [k, v] of baitEntries) {
                        const baitId = k.replace('bait_', '')
                        const bait = BAIT_DATA[baitId]
                        const earned = Math.floor((bait?.price || 0) * 0.4) * v
                        totalGold += earned
                        soldList.push(`${bait?.emoji || '🪱'} ${bait?.name || baitId} x${v} → ${toRupiah(earned)}`)
                        delete player.inventory[k]
                    }
                    player.gold += totalGold
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    let resTxt = `✦ 🪱  UMPAN TERJUAL!  🪱\n\n`
                    soldList.forEach(s => resTxt += `  ✅ ${s}\n`)
                    resTxt += `\n  💵 Total Dapet : *${toRupiah(totalGold)}*\n  💰 Saldo      : *${toRupiah(player.gold)}*\n`
                    return Reply(resTxt)
                }
                const jualBaitId  = jualArgs[1].toLowerCase()
                const jualBaitQty = parseInt(jualArgs[2]) || 1
                if (jualBaitId === equippedBaitId) return Reply(`❌ *${BAIT_DATA[jualBaitId]?.name || jualBaitId}* sedang dipakai! Lepas umpan aktif dulu di *.shopbomber lepas*`)
                if (!BAIT_DATA[jualBaitId]) return Reply(`❌ Umpan *${jualBaitId}* tidak dikenal!`)
                const baitInvKey = `bait_${jualBaitId}`
                if (!player.inventory?.[baitInvKey] || player.inventory[baitInvKey] < jualBaitQty) {
                    return Reply(`❌ Umpan tidak cukup! Punya: ${player.inventory?.[baitInvKey] || 0}, mau jual: ${jualBaitQty}`)
                }
                const baitData   = BAIT_DATA[jualBaitId]
                const baitEarned = Math.floor((baitData.price || 0) * 0.4) * jualBaitQty
                player.inventory[baitInvKey] -= jualBaitQty
                if (player.inventory[baitInvKey] <= 0) delete player.inventory[baitInvKey]
                player.gold += baitEarned
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ 🪱  UMPAN TERJUAL!  🪱\n\n  🪱 Umpan  : *${baitData.emoji} ${baitData.name}* x${jualBaitQty}\n  💵 Dapet  : *${toRupiah(baitEarned)}*\n  💰 Saldo  : *${toRupiah(player.gold)}*\n`)
            }

            // ── JUAL PET / HEWAN PELIHARAAN ───────────────────────────────
            if (jualKategori === 'pet' || jualKategori === 'peliharaan') {
                if (!player.pet) return Reply(`❌ Kamu tidak punya hewan peliharaan!\n💡 Adopsi pet: *.adopsipet*`)
                const petRef     = rpgDB.petData[player.pet.id]
                const petCost    = petRef?.cost || 0
                const petSellPrice = Math.floor(petCost * 0.3)
                const petName    = player.pet.name
                const petTier    = petRef?.tier || '?'
                // Konfirmasi jual (jika ada argumen 'ya' / 'yes')
                if (!jualArgs[1] || (jualArgs[1] !== 'ya' && jualArgs[1] !== 'yes' && jualArgs[1] !== 'confirm')) {
                    return Reply(`✦ ── 🐾  JUAL PET?  🐾 ──
  🐾 Pet     : *${petName}*
  🏷️  Tier    : ${petTier}
  ⚔️  ATK     : +${player.pet.attack || 0}
  🛡️  DEF     : +${player.pet.defense || 0}
  📈 Level   : ${player.pet.level || 1}

  💰 Harga beli : ${toRupiah(petCost)}
  💵 Harga jual : *${toRupiah(petSellPrice)}* (30%)
⚠️ Pet yang dijual TIDAK BISA dikembalikan!
Ketik *.jualbot pet ya* untuk konfirmasi.`)
                }
                player.gold += petSellPrice
                delete player.pet
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ ── 🐾  PET TERJUAL!  🐾 ──
  🐾 Pet    : *${petName}*
  💵 Dapet  : *${toRupiah(petSellPrice)}*
  💰 Saldo  : *${toRupiah(player.gold)}*
😢 Selamat tinggal, ${petName}...`)
            }

            // ── JUAL IKAN ─────────────────────────────────────────────────
            if (jualKategori === 'ikan' || jualKategori === 'fish') {
                const fishEntries = Object.entries(player.inventory || {}).filter(([k,v]) => k.startsWith('fish_') && v > 0)
                if (fishEntries.length === 0) return Reply(`❌ Tidak ada ikan di inventory!\n🎣 Mulai mancing: *.mancing*`)
                let totalGold = 0; let soldCount = 0; let soldList = []
                for (const [k, v] of fishEntries) {
                    const { fishId: baseId, mutationId: mutId } = parseFishKey(k)
                    const fishDat = baseId ? FISH_DATA[baseId] : null
                    const mutDat  = mutId ? MUTATION_DATA[mutId] : null
                    const price   = fishDat ? (mutDat ? Math.floor(fishDat.basePrice * mutDat.multiplier) : fishDat.basePrice) : 0
                    const earned  = price * v
                    totalGold += earned; soldCount += v
                    soldList.push(`${fishDat?.emoji || '🐟'} ${fishDat?.name || baseId}${mutDat ? ' ['+mutDat.name+']' : ''} x${v} → ${toRupiah(earned)}`)
                    delete player.inventory[k]
                }
                player.gold += totalGold
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                let resTxt = `✦ 🐟  IKAN TERJUAL!  🐟\n\n`
                soldList.slice(0, 10).forEach(s => resTxt += `  ✅ ${s}\n`)
                if (soldList.length > 10) resTxt += `  ... dan ${soldList.length - 10} jenis lainnya\n`
                resTxt += `\n  🐟 Total ikan  : ${soldCount} ekor\n  💵 Total Dapet  : *${toRupiah(totalGold)}*\n  💰 Saldo        : *${toRupiah(player.gold)}*\n`
                return Reply(resTxt)
            }

            // ── JUAL SEMUA SEKALIGUS ──────────────────────────────────────
            if (jualKategori === 'semua') {
                const equippedRodId  = player.fishing?.equippedRod || 'starter_rod'
                const equippedBaitId = player.fishing?.equippedBait || null
                let grandTotal = 0; let soldSummary = {}

                // Jual semua item biasa (kecuali yang diequip)
                for (const [k, v] of Object.entries(player.inventory || {})) {
                    if (v <= 0) continue
                    if (k === player.equipment?.weapon || k === player.equipment?.armor) continue
                    if (k.startsWith('fish_')) {
                        const { fishId: baseId, mutationId: mutId } = parseFishKey(k)
                        const fishDat = baseId ? FISH_DATA[baseId] : null
                        const mutDat  = mutId ? MUTATION_DATA[mutId] : null
                        const price   = fishDat ? (mutDat ? Math.floor(fishDat.basePrice * mutDat.multiplier) : fishDat.basePrice) : 0
                        grandTotal += price * v
                        soldSummary['ikan'] = (soldSummary['ikan'] || 0) + v
                        delete player.inventory[k]
                    } else if (k.startsWith('rod_')) {
                        const rodId = k.replace('rod_', '')
                        if (rodId === equippedRodId) continue
                        const earned = Math.floor((ROD_DATA[rodId]?.price || 0) * 0.4) * v
                        grandTotal += earned
                        soldSummary['joran'] = (soldSummary['joran'] || 0) + v
                        delete player.inventory[k]
                    } else if (k.startsWith('bait_')) {
                        const baitId = k.replace('bait_', '')
                        if (baitId === equippedBaitId) continue
                        const earned = Math.floor((BAIT_DATA[baitId]?.price || 0) * 0.4) * v
                        grandTotal += earned
                        soldSummary['umpan'] = (soldSummary['umpan'] || 0) + v
                        delete player.inventory[k]
                    } else if (rpgDB.items[k]) {
                        const earned = Math.floor((rpgDB.items[k].price || 0) * 0.5) * v
                        grandTotal += earned
                        soldSummary['item'] = (soldSummary['item'] || 0) + v
                        delete player.inventory[k]
                    }
                }
                player.gold += grandTotal
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                let resTxt = `✦ 💰  JUAL SEMUA SELESAI!  💰\n\n`
                if (soldSummary.item)  resTxt += `  📦 Item       : ${soldSummary.item} pcs terjual\n`
                if (soldSummary.joran) resTxt += `  🎣 Joran      : ${soldSummary.joran} pcs terjual\n`
                if (soldSummary.umpan) resTxt += `  🪱 Umpan      : ${soldSummary.umpan} pcs terjual\n`
                if (soldSummary.ikan)  resTxt += `  🐟 Ikan       : ${soldSummary.ikan} ekor terjual\n`
                if (!Object.keys(soldSummary).length) { resTxt += `  ❌ Tidak ada yang bisa dijual!\n  (Item yang diequip tidak ikut terjual)\n` }
                resTxt += `\n  💵 Total Dapet : *${toRupiah(grandTotal)}*\n  💰 Saldo      : *${toRupiah(player.gold)}*\n`
                if (soldSummary.item || soldSummary.joran || soldSummary.umpan || soldSummary.ikan) {
                    resTxt += `\n⚠️ Equipment yang diequip tidak ikut terjual.`
                }
                return Reply(resTxt)
            }

            // Argumen tidak dikenal
            return Reply(`❌ Kategori tidak dikenal: *${jualKategori}*\n\nPilihan: *item*, *pancing*, *umpan*, *pet*, *ikan*, *semua*\nKetik *.jualbot* untuk lihat menu lengkap.`)
        }

        if (command === 'use') {
            
                

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            if (!text) {
                return Reply(`Gunakan: .use [nama_item]\nContoh: .use potion`)
            }
            const player = rpgDB.players[senderJid]
            let itemId = text.toLowerCase().trim()
            // Auto-fix: strip/replace spaces & underscores for common variants
            // e.g. "divine potion" -> "divinepotion", "divine_potion" -> "divinepotion"
            if (!rpgDB.items[itemId] || !player.inventory?.[itemId]) {
                const stripped = itemId.replace(/[_\s]/g, '')
                if (rpgDB.items[stripped]) itemId = stripped
            }
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) {
                // coba cari item mirip
                const allItems = Object.keys(player.inventory || {}).filter(k => rpgDB.items[k])
                const similar = allItems.find(k => k.includes(itemId) || itemId.includes(k))
                const hint = similar ? `\n💡 Maksud kamu: *.use ${similar}*?` : ''
                return Reply(`❌ lu gak punya "${itemId}" di inventory!${hint}`)
            }
            if (!rpgDB.items[itemId]) {
                return Reply(`❌ item "${itemId}" gak valid!`)
            }
            const item = rpgDB.items[itemId]
            // Validasi tipe item sebelum dipakai (FIX: item tidak berkurang jika tidak valid)
            if (item.type === 'weapon' || item.type === 'armor') {
                return Reply(`⚔️ *${item.name}* adalah equipment!\n💡 Gunakan *.equip ${itemId}* untuk memakainya.`)
            }
            if (item.type === 'material') {
                return Reply(`🪨 *${item.name}* adalah material crafting!\n💡 Gunakan *.craft* untuk membuat item dari bahan ini.`)
            }
            if (item.type === 'bot_feature') {
                return Reply(`🤖 *${item.name}* adalah item fitur bot!\n💡 Item ini hanya bisa diaktifkan melalui sistem bot secara otomatis.`)
            }
            // Handle fishing buff (luck_potion) — aktif per grup
            if (item.type === 'fishing_buff') {
                if (!rpgDB.fishingBuffs) rpgDB.fishingBuffs = {}
                const existing = rpgDB.fishingBuffs[m.chat]
                const isSuper = itemId === 'luck_super_potion'

                if (existing && existing.expiry > Date.now()) {
                    const existingIsSuper = existing.boost >= 300 // super potion boost = 300
                    const sisaMs = existing.expiry - Date.now()
                    const sisaMenit = Math.ceil(sisaMs / 60000)

                    // Super potion bisa override luck potion biasa
                    if (isSuper && !existingIsSuper) {
                        // Override — lanjut pasang super potion
                    } else if (isSuper && existingIsSuper) {
                        return Reply(`🍀✨ *SUPER Luck Potion* sudah aktif di grup ini!\n⏳ Sisa: *${sisaMenit} menit* lagi.\nTunggu habis dulu sebelum pakai lagi.`)
                    } else {
                        // luck biasa, ada yang aktif
                        return Reply(`🍀 Luck Potion sudah aktif di grup ini!\n⏳ Sisa: *${sisaMenit} menit* lagi.\nTunggu habis dulu atau pakai *.use luck_super_potion* untuk override dengan yang lebih kuat!`)
                    }
                }

                rpgDB.fishingBuffs[m.chat] = {
                    expiry: Date.now() + item.duration,
                    boost: item.boost,
                    usedBy: senderJid
                }
                player.inventory[itemId] -= 1
                if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                const durasiMenit = Math.floor(item.duration / 60000)
                return Reply(`${isSuper ? '🍀✨ *SUPER LUCK POTION aktif!*' : '🍀 *Luck Potion aktif!*'}\n\n  ⚡ Boost : +${item.boost} luck mancing${isSuper ? ' (x10 boost! override buff lama)' : ''}\n  ⏳ Durasi : ${durasiMenit} menit\n  👥 Berlaku untuk seluruh anggota grup!\n\nSelamat mancing! 🎣`)
            }
            if (item.type !== 'heal' && item.type !== 'mana') {
                return Reply(`❌ Item *${item.name}* (tipe: ${item.type}) tidak bisa dipakai langsung!`)
            }
            let useText = `✦ ✨  PAKAI ITEM  ✨\n\n  🧪 Item   : *${item.name}*\n`
            switch (item.type) {
                case 'heal': {
                    const hpBefore = player.hp
                    player.hp = Math.min(player.maxHp, player.hp + item.value)
                    const hpGained = player.hp - hpBefore
                    useText += `  ❤️ HP pulih +${hpGained} point!\n  🫵 HP sekarang: ${player.hp}/${player.maxHp}\n`
                    break
                }
                case 'mana': {
                    const mpBefore = player.mp
                    player.mp = Math.min(player.maxMp, player.mp + item.value)
                    const mpGained = player.mp - mpBefore
                    useText += `  🔵 MP pulih +${mpGained} point!\n  🫵 MP sekarang: ${player.mp}/${player.maxMp}\n`
                    break
                }
            }
                        player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) {
                delete player.inventory[itemId]
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            return Reply(useText)
        }

        // ─── BUANG / DROP ITEM ───────────────────────────────────────────
        if (command === 'drop' || command === 'buang') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            if (!text) return Reply(`Gunakan: .drop [item_id] [jumlah]\nContoh: .drop potion 2\nAtau: .drop kulit_goblin 5\n\nCek inventory: *.rpginv*`)
            const player = rpgDB.players[senderJid]
            const dropArgs = text.trim().split(' ')
            const dropItemId = dropArgs[0].toLowerCase()
            const dropAmount = parseInt(dropArgs[1]) || 1

            if (dropAmount <= 0 || isNaN(dropAmount)) return Reply(`❌ Jumlah harus lebih dari 0!`)

            if (!player.inventory || !player.inventory[dropItemId] || player.inventory[dropItemId] < 1) {
                return Reply(`❌ Kamu tidak punya item *${dropItemId}* di inventory!\n💡 Cek inventory dengan *.rpginv*`)
            }
            if (player.inventory[dropItemId] < dropAmount) {
                return Reply(`❌ Kamu hanya punya *${dropItemId}* x${player.inventory[dropItemId]}, tidak cukup untuk dibuang ${dropAmount}x!`)
            }
            // Cegah buang item yang sedang diequip
            if (player.equipment) {
                if (player.equipment.weapon === dropItemId) return Reply(`❌ Item *${dropItemId}* sedang dipakai sebagai senjata!\n💡 Lepas dulu dengan *.unequip weapon*`)
                if (player.equipment.armor === dropItemId) return Reply(`❌ Item *${dropItemId}* sedang dipakai sebagai armor!\n💡 Lepas dulu dengan *.unequip armor*`)
            }

            const dropItemData = rpgDB.items[dropItemId]
            const dropItemName = dropItemData ? dropItemData.name : dropItemId

            player.inventory[dropItemId] -= dropAmount
            if (player.inventory[dropItemId] <= 0) delete player.inventory[dropItemId]

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✦ ── 🗑️  ITEM DIBUANG  🗑️ ──
  📦 Item   : *${dropItemName}*
  🔢 Jumlah : ${dropAmount}x
  🗑️ Status : Item berhasil dibuang!
⚠️ Item yang dibuang tidak bisa dikembalikan!`)
        }

        // ─── GIVE / BERIKAN ITEM KE PLAYER LAIN ─────────────────────────
        if (command === 'give' || command === 'berikan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            // Cari target dari mention atau reply
            let giveTargetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    for (let id of m.mentionedJid) {
                        if (id.endsWith('@lid')) {
                            if (m.metadata && m.metadata.participants) {
                                let p = m.metadata.participants.find(x => x.lid === id || x.id === id)
                                if (p && p.jid) { giveTargetJid = p.jid; break }
                            }
                        } else { giveTargetJid = id; break }
                    }
                } else if (m.quoted) {
                    giveTargetJid = m.quoted.sender
                }
            } else {
                if (m.quoted) giveTargetJid = m.quoted.sender
            }

            if (!giveTargetJid) return Reply(`❌ Tag atau reply user yang mau dikasih item!\nContoh: .give potion 2 @user\nAtau reply pesan user lalu: .give potion 2`)
            if (giveTargetJid === senderJid) return Reply(`❌ Tidak bisa memberikan item ke diri sendiri!`)
            if (!rpgDB.players[giveTargetJid]) return Reply(`❌ User tersebut belum mulai RPG! Suruh ketik *.rpgstart* dulu.`)

            if (!text) return Reply(`Gunakan: .give [item_id] [jumlah] @user\nContoh: .give potion 3 @user\n\nCek inventory: *.rpginv*`)

            const senderPlayer = rpgDB.players[senderJid]
            const targetPlayer = rpgDB.players[giveTargetJid]

            // Parse args (hapus mention @xxx dari text)
            const giveText = text.replace(/@\d+/g, '').trim()
            const giveArgs = giveText.trim().split(' ').filter(x => x)
            const giveItemId = giveArgs[0] ? giveArgs[0].toLowerCase() : null
            const giveAmount = parseInt(giveArgs[1]) || 1

            if (!giveItemId) return Reply(`❌ Sebutkan nama item yang mau diberikan!\nContoh: .give potion 3 @user`)
            if (giveAmount <= 0 || isNaN(giveAmount)) return Reply(`❌ Jumlah harus lebih dari 0!`)

            if (!senderPlayer.inventory || !senderPlayer.inventory[giveItemId] || senderPlayer.inventory[giveItemId] < 1) {
                return Reply(`❌ Kamu tidak punya item *${giveItemId}* di inventory!\n💡 Cek inventory dengan *.rpginv*`)
            }
            if (senderPlayer.inventory[giveItemId] < giveAmount) {
                return Reply(`❌ Kamu hanya punya *${giveItemId}* x${senderPlayer.inventory[giveItemId]}, tidak cukup untuk diberikan ${giveAmount}x!`)
            }
            // Cegah give item yang sedang diequip
            if (senderPlayer.equipment) {
                if (senderPlayer.equipment.weapon === giveItemId) return Reply(`❌ Item *${giveItemId}* sedang dipakai sebagai senjata!\n💡 Lepas dulu dengan *.unequip weapon*`)
                if (senderPlayer.equipment.armor === giveItemId) return Reply(`❌ Item *${giveItemId}* sedang dipakai sebagai armor!\n💡 Lepas dulu dengan *.unequip armor*`)
            }

            const giveItemData = rpgDB.items[giveItemId]
            const giveItemName = giveItemData ? giveItemData.name : giveItemId

            // Transfer item
            senderPlayer.inventory[giveItemId] -= giveAmount
            if (senderPlayer.inventory[giveItemId] <= 0) delete senderPlayer.inventory[giveItemId]

            if (!targetPlayer.inventory) targetPlayer.inventory = {}
            targetPlayer.inventory[giveItemId] = (targetPlayer.inventory[giveItemId] || 0) + giveAmount

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const targetName = targetPlayer.name || giveTargetJid.split('@')[0]
            const senderName = senderPlayer.name || senderJid.split('@')[0]

            return Reply(`✦ ── 🎁  ITEM DIBERIKAN!  🎁 ──
  📦 Item    : *${giveItemName}*
  🔢 Jumlah  : ${giveAmount}x
  👤 Dari    : ${senderName}
  🎯 Ke      : ${targetName}
✅ Item berhasil ditransfer!`)
        }

        // ─── TRADEITEM — Trade item dengan harga antar player ────────────
        if (command === 'tradeitem') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            if (!rpgDB.tradeOffers) rpgDB.tradeOffers = {}

            const sub = args[0]?.toLowerCase()

            // .tradeitem offer @user [item_id] [qty] [harga]
            if (sub === 'offer') {
                let tradeTarget = null
                if (m.mentionedJid?.length > 0) {
                    tradeTarget = m.mentionedJid[0]
                    if (tradeTarget.endsWith('@lid') && m.isGroup) {
                        const p = m.metadata?.participants?.find(x => x.lid === tradeTarget || x.id === tradeTarget)
                        if (p) tradeTarget = p.jid || p.id || tradeTarget
                    }
                } else if (m.quoted) tradeTarget = m.quoted.sender
                if (tradeTarget) tradeTarget = resolvePlayerJid(tradeTarget)

                if (!tradeTarget) return Reply(`❌ Tag @user dulu!\nFormat: *.tradeitem offer @user [item_id] [qty] [harga]*`)
                if (tradeTarget === senderJid) return Reply(`❌ Tidak bisa trade dengan diri sendiri!`)
                if (!rpgDB.players[tradeTarget]) return Reply(`❌ User target belum daftar RPG!`)

                const tradeArgs = text.replace(/@\d+/g,'').trim().split(/\s+/).filter(Boolean).slice(1)
                const itemId  = tradeArgs[0]?.toLowerCase()
                const qty     = parseInt(tradeArgs[1]) || 1
                const harga   = parseInt(tradeArgs[2]) || 0

                if (!itemId) return Reply(`❌ Format: *.tradeitem offer @user [item_id] [qty] [harga]*\nContoh: *.tradeitem offer @user pedang_besi 1 50000*`)
                if (harga <= 0) return Reply(`❌ Harga harus lebih dari 0!`)

                const seller = rpgDB.players[senderJid]
                if (!seller.inventory?.[itemId] || seller.inventory[itemId] < qty) {
                    return Reply(`❌ Item *${itemId}* tidak cukup! Punya: ${seller.inventory?.[itemId] || 0}`)
                }
                if (seller.equipment?.weapon === itemId || seller.equipment?.armor === itemId) {
                    return Reply(`❌ Item *${itemName}* sedang di-equip!\n💡 Lepas dulu dengan *.unequip ${item?.type === 'weapon' ? 'weapon' : 'armor'}* lalu trade lagi.`)
                }

                const itemData = rpgDB.items[itemId]
                const itemName = itemData?.name || itemId

                // Simpan offer
                rpgDB.tradeOffers[senderJid] = {
                    sellerJid: senderJid,
                    buyerJid:  tradeTarget,
                    itemId, itemName, qty,
                    price: harga,
                    expiresAt: Date.now() + 5 * 60 * 1000
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return alip.sendMessage(m.chat, {
                    text: `✦ ── 🤝  PENAWARAN TRADE  🤝 ──\n\n  📤 Penjual : @${senderJid.split('@')[0]}\n  📥 Pembeli : @${tradeTarget.split('@')[0]}\n\n  📦 Item    : *${itemName}* x${qty}\n  💰 Harga   : *${toRupiah(harga)}*\n\n@${tradeTarget.split('@')[0]} Terima atau tolak penawaran ini:\n✅ *.tradeitem accept* — terima\n❌ *.tradeitem reject* — tolak\n⏳ Berlaku 5 menit`,
                    mentions: [senderJid, tradeTarget]
                }, { quoted: m })
            }

            // .tradeitem accept
            if (sub === 'accept') {
                const now = Date.now()
                // Cari offer yang ditujukan ke sender
                const offerEntry = Object.entries(rpgDB.tradeOffers || {}).find(([,o]) => o.buyerJid === senderJid && o.expiresAt > now)
                if (!offerEntry) return Reply(`❌ Tidak ada penawaran trade untukmu saat ini!`)
                const [offerKey, offer] = offerEntry

                const buyer  = rpgDB.players[senderJid]
                const seller = rpgDB.players[offer.sellerJid]
                if (!seller) { delete rpgDB.tradeOffers[offerKey]; fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2)); return Reply(`❌ Penjual tidak ditemukan!`) }

                if ((buyer.gold || 0) < offer.price) return Reply(`❌ Gold tidak cukup! Butuh ${toRupiah(offer.price)}, punya ${toRupiah(buyer.gold || 0)}`)
                if (!seller.inventory?.[offer.itemId] || seller.inventory[offer.itemId] < offer.qty) {
                    delete rpgDB.tradeOffers[offerKey]
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    return Reply(`❌ Stok item penjual sudah tidak cukup! Trade dibatalkan.`)
                }

                // Lakukan transaksi
                seller.inventory[offer.itemId] -= offer.qty
                if (seller.inventory[offer.itemId] <= 0) delete seller.inventory[offer.itemId]
                if (!buyer.inventory) buyer.inventory = {}
                buyer.inventory[offer.itemId] = (buyer.inventory[offer.itemId] || 0) + offer.qty
                buyer.gold  -= offer.price
                seller.gold = (seller.gold || 0) + offer.price
                delete rpgDB.tradeOffers[offerKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return alip.sendMessage(m.chat, {
                    text: `✦ ── ✅  TRADE BERHASIL!  ✅ ──\n\n  📦 Item    : *${offer.itemName}* x${offer.qty}\n  💰 Harga   : *${toRupiah(offer.price)}*\n  📤 Penjual : @${offer.sellerJid.split('@')[0]}\n  📥 Pembeli : @${senderJid.split('@')[0]}\n\n🤝 Transaksi selesai!`,
                    mentions: [offer.sellerJid, senderJid]
                }, { quoted: m })
            }

            // .tradeitem reject
            if (sub === 'reject' || sub === 'cancel') {
                const offerEntry = Object.entries(rpgDB.tradeOffers || {}).find(([,o]) => o.buyerJid === senderJid || o.sellerJid === senderJid)
                if (!offerEntry) return Reply(`❌ Tidak ada penawaran trade aktif!`)
                const [offerKey, offer] = offerEntry
                delete rpgDB.tradeOffers[offerKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`❌ Penawaran trade dibatalkan.`)
            }

            return Reply(`✦ 🤝  TRADE ITEM  🤝\n\n*.tradeitem offer @user [item_id] [qty] [harga]*\n  → Tawarkan item ke player lain\n\n*.tradeitem accept*\n  → Terima penawaran\n\n*.tradeitem reject*\n  → Tolak/batalkan penawaran\n\nContoh:\n*.tradeitem offer @santana pedang_besi 1 500000*`)
        }


        // ─── TITLE / GELAR SYSTEM ───────────────────────────────────────
        const TITLE_DATA = {
            // ── TIER 1: BIASA (mudah) ──
            "petualang_baru":      { name: "🌱 Petualang Baru",      tier: 1, desc: "Baru memulai perjalanan",          reward: { gold: 1000,   exp: 50   }, condition: p => (p.level||1) >= 1 },
            "pembunuh_tikus":      { name: "🐀 Pembunuh Tikus",      tier: 1, desc: "Kalahkan 10 monster",              reward: { gold: 5000,   exp: 100  }, condition: p => (p.monstersDefeated||0) >= 10 },
            "penjelajah":          { name: "🗺️ Penjelajah",           tier: 1, desc: "Pindah lokasi 5 kali",            reward: { gold: 3000,   exp: 80   }, condition: p => (p.totalMoves||0) >= 5 },
            "kolektor":            { name: "🎒 Kolektor",             tier: 1, desc: "Kumpulkan 20 item",               reward: { gold: 8000,   exp: 150  }, condition: p => Object.values(p.inventory||{}).reduce((a,b)=>a+b,0) >= 20 },
            "pedagang_awal":       { name: "💰 Pedagang Awal",        tier: 1, desc: "Miliki 100.000 gold",             reward: { gold: 10000,  exp: 200  }, condition: p => (p.gold||0) >= 100000 },
            // ── TIER 2: LUMAYAN ──
            "ksatria":             { name: "⚔️ Ksatria",              tier: 2, desc: "Capai level 10",                  reward: { gold: 25000,  exp: 500  }, condition: p => (p.level||1) >= 10 },
            "pemancing_handal":    { name: "🎣 Pemancing Handal",     tier: 2, desc: "Tangkap 50 ikan",                 reward: { gold: 30000,  exp: 600  }, condition: p => (p.fishing?.totalCatch||0) >= 50 },
            "monster_slayer":      { name: "💀 Monster Slayer",       tier: 2, desc: "Kalahkan 100 monster",            reward: { gold: 50000,  exp: 1000 }, condition: p => (p.monstersDefeated||0) >= 100 },
            "sultan_kecil":        { name: "👑 Sultan Kecil",         tier: 2, desc: "Miliki 5 juta gold",              reward: { gold: 100000, exp: 1500 }, condition: p => (p.gold||0) >= 5000000 },
            "pemenang_pvp":        { name: "🏆 Pemenang PVP",         tier: 2, desc: "Menang 10 duel PVP",              reward: { gold: 75000,  exp: 1200 }, condition: p => (p.pvpWins||0) >= 10 },
            // ── TIER 3: KEREN ──
            "pahlawan":            { name: "🦸 Pahlawan",             tier: 3, desc: "Capai level 25",                  reward: { gold: 200000, exp: 3000, item: {id:'potion_super', amount:5} }, condition: p => (p.level||1) >= 25 },
            "master_pancing":      { name: "🐉 Master Pancing",       tier: 3, desc: "Tangkap 200 ikan",                reward: { gold: 300000, exp: 4000 }, condition: p => (p.fishing?.totalCatch||0) >= 200 },
            "sultan_sejati":       { name: "💎 Sultan Sejati",         tier: 3, desc: "Miliki 50 juta gold",            reward: { gold: 500000, exp: 5000 }, condition: p => (p.gold||0) >= 50000000 },
            "penghancur":          { name: "💥 Penghancur",           tier: 3, desc: "Kalahkan 500 monster",            reward: { gold: 400000, exp: 5000 }, condition: p => (p.monstersDefeated||0) >= 500 },
            "penguasa_pvp":        { name: "⚡ Penguasa PVP",          tier: 3, desc: "Menang 50 duel PVP",              reward: { gold: 350000, exp: 4500 }, condition: p => (p.pvpWins||0) >= 50 },
            // ── TIER 4: EPIK ──
            "legenda_hidup":       { name: "🌟 Legenda Hidup",         tier: 4, desc: "Capai level 40",                  reward: { gold: 2000000, exp: 10000, item: {id:'elixir_hidup', amount:3} }, condition: p => (p.level||1) >= 40 },
            "raja_pancing":        { name: "🎣👑 Raja Pancing",        tier: 4, desc: "Tangkap 1000 ikan",               reward: { gold: 3000000, exp: 12000 }, condition: p => (p.fishing?.totalCatch||0) >= 1000 },
            "milyarder":           { name: "💰💎 Milyarder",           tier: 4, desc: "Miliki 1 milyar gold",            reward: { gold: 5000000, exp: 15000 }, condition: p => (p.gold||0) >= 1000000000 },
            "pembantai_dewa":      { name: "☠️ Pembantai Dewa",        tier: 4, desc: "Kalahkan 2000 monster",           reward: { gold: 4000000, exp: 13000 }, condition: p => (p.monstersDefeated||0) >= 2000 },
            "arena_dewa":          { name: "🏟️ Dewa Arena",            tier: 4, desc: "Menang 200 duel PVP",             reward: { gold: 3500000, exp: 12000 }, condition: p => (p.pvpWins||0) >= 200 },
            // ── TIER 5: ABSOLUTE MUTAKHIR (sangat susah) ──
            "absolute_mutakhir":   { name: "🌌 ★ ABSOLUTE MUTAKHIR ★", tier: 5, desc: "Level 60, 10rb monster, 5rb ikan, 500 PVP menang, 10T gold", reward: { gold: 100000000, exp: 100000, item: {id:'divinepotion', amount:10} }, condition: p => (p.level||1) >= 60 && (p.monstersDefeated||0) >= 10000 && (p.fishing?.totalCatch||0) >= 5000 && (p.pvpWins||0) >= 500 && (p.gold||0) >= 10000000000000 },
            "void_walker":         { name: "🕳️ Void Walker",           tier: 5, desc: "Habiskan 1T gold total",          reward: { gold: 50000000, exp: 80000 }, condition: p => (p.totalSpent||0) >= 1000000000000 },
            "dewa_semesta":        { name: "⭐ Dewa Semesta",           tier: 5, desc: "Level 75, semua tier title sebelumnya", reward: { gold: 200000000, exp: 200000 }, condition: p => (p.level||1) >= 75 && (p.titles||[]).length >= 15 },
            // ── SECRET (misterius, random) ──
            "phantom_unknown":     { name: "👻 ???",                   tier: 'SECRET', desc: "Misterius... tidak ada yang tahu bagaimana mendapatkannya", reward: { gold: 9999999, exp: 50000 }, condition: p => Math.random() < 0.001 },
            "shadow_blessing":     { name: "🌑 Shadow Blessing",       tier: 'SECRET', desc: "Dipilih oleh kegelapan secara random",  reward: { gold: 20000000, exp: 80000 }, condition: p => Math.random() < 0.0005 },
            "divine_touched":      { name: "✨ Divine Touched",         tier: 'SECRET', desc: "Berkah para dewa yang datang tanpa diduga", reward: { gold: 50000000, exp: 150000, item: {id:'luck_super_potion', amount:1} }, condition: p => Math.random() < 0.0001 }
        }

        const TITLE_TIER_LABELS = { 1: '🌱 Biasa', 2: '⚔️ Lumayan', 3: '🌟 Keren', 4: '🌌 Epik', 5: '💥 ABSOLUTE MUTAKHIR', 'SECRET': '👁️ SECRET' }

        function checkAndGrantTitles(player) {
            if (!player.titles) player.titles = []
            if (!player.totalMoves) player.totalMoves = 0
            if (!player.totalSpent) player.totalSpent = 0
            const newTitles = []
            // Secret titles: roll every check (very rare)
            for (const [id, title] of Object.entries(TITLE_DATA)) {
                if (player.titles.includes(id)) continue
                try {
                    if (title.condition(player)) {
                        player.titles.push(id)
                        newTitles.push({ id, ...title })
                    }
                } catch(e) {}
            }
            return newTitles
        }


        // ─── LISTIKAN — List semua ikan dari paling lemah ke paling kuat ─
        if (command === 'listikan' || command === 'daftarikan') {
            const rarityOrder = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'SECRET']
            const rarityLabel = { COMMON:'🟤 COMMON', UNCOMMON:'🟢 UNCOMMON', RARE:'🔵 RARE', EPIC:'🟣 EPIC', LEGENDARY:'🟡 LEGENDARY', MYTHIC:'🔴 MYTHIC', SECRET:'⚫ SECRET' }
            let txt = '✦ 🐟  DAFTAR SEMUA IKAN  🐟\n(Terurut: Paling Lemah → Paling OP)\n\n'
            for (const rarity of rarityOrder) {
                const fishInRarity = Object.entries(FISH_DATA)
                    .filter(([,f]) => f.rarity === rarity)
                    .sort((a, b) => a[1].basePrice - b[1].basePrice)
                txt += `  ${rarityLabel[rarity]}\n`
                for (const [id, f] of fishInRarity) {
                    txt += `  ${f.emoji} *${f.name}* — ${toRupiah(f.basePrice)}\n`
                }
                txt += '\n'
            }
            txt += '💡 Harga bisa berlipat ganda dengan mutasi!'
            return Reply(txt)
        }

        // ─── LISTMUTASI — List semua mutasi dari paling lemah ke paling kuat ─
        if (command === 'listmutasi') {
            const tierOrder = ['BASIC', 'ADVANCED', 'RARE', 'LEGENDARY', 'GODLY']
            const tierLabel = { BASIC:'🟤 BASIC', ADVANCED:'🟢 ADVANCED', RARE:'🔵 RARE', LEGENDARY:'🟣 LEGENDARY', GODLY:'🔴 GODLY' }
            let txt = '✦ 🧬  DAFTAR MUTASI IKAN  🧬\n(Terurut: Paling Lemah → Paling OP)\n\n'
            for (const tier of tierOrder) {
                const mutInTier = Object.entries(MUTATION_DATA)
                    .filter(([,m]) => m.tier === tier)
                    .sort((a, b) => a[1].multiplier - b[1].multiplier)
                txt += `  ${tierLabel[tier]}\n`
                for (const [id, m] of mutInTier) {
                    txt += `  ${m.emoji} *${m.name}* — x${m.multiplier} (${m.desc})\n`
                }
                txt += '\n'
            }
            txt += '💡 Mutasi GODLY bisa bikin ikan jadi puluhan kali lebih mahal!\n'
            txt += '🔑 Butuh umpan terbaik (divine_bait/omega_bait) untuk mutasi GODLY'
            return Reply(txt)
        }

        if (command === 'listtitle' || command === 'listgelar' || command === 'gelarku') {
            if (!rpgDB.players[senderJid]) return Reply('❌ Belum jadi petualang! Ketik *.rpgstart* dulu.')
            const player = rpgDB.players[senderJid]
            if (!player.titles) player.titles = []

            // Check new titles
            const newGrants = checkAndGrantTitles(player)
            if (newGrants.length > 0) {
                for (const t of newGrants) {
                    if (t.reward?.gold) player.gold = (player.gold||0) + t.reward.gold
                    if (t.reward?.exp) { gainExp(player, t.reward.exp) }
                    if (t.reward?.item) {
                        if (!player.inventory) player.inventory = {}
                        player.inventory[t.reward.item.id] = (player.inventory[t.reward.item.id]||0) + t.reward.item.amount
                    }
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            }

            const all = Object.entries(TITLE_DATA)
            const myTitles = player.titles
            const tierGroups = [1,2,3,4,5,'SECRET']
            let txt = '✦ ── 🏅  DAFTAR TITLE  🏅 ──\n\n'
            txt += `  🎖️ Gelarmu: *${myTitles.length}/${all.length}*\n\n`

            for (const tier of tierGroups) {
                const inTier = all.filter(([,t]) => t.tier === tier)
                txt += `  ${TITLE_TIER_LABELS[tier] || tier}\n`
                for (const [id, t] of inTier) {
                    const owned = myTitles.includes(id)
                    if (tier === 'SECRET' && !owned) {
                        txt += `  ${owned ? '✅' : '❓'} *???* — Misterius\n`
                    } else {
                        txt += `  ${owned ? '✅' : '🔒'} *${t.name}* — ${t.desc}\n`
                    }
                }
                txt += '\n'
            }

            if (newGrants.length > 0) {
                txt += `\n🎉 *TITLE BARU DIDAPAT!*\n`
                for (const t of newGrants) {
                    txt += `  ✨ *${t.name}*\n`
                    txt += `  💰 +${toRupiah(t.reward?.gold||0)} | ⭐ +${t.reward?.exp||0} EXP\n`
                }
            }

            txt += `\n💡 Title secret muncul secara random saat kamu aktif!`
            return Reply(txt)
        }

        if (command === 'cektitle' || command === 'cekgelar') {
            if (!rpgDB.players[senderJid]) return Reply('❌ Belum jadi petualang! Ketik *.rpgstart* dulu.')
            const player = rpgDB.players[senderJid]
            if (!player.titles) player.titles = []

            const newGrants = checkAndGrantTitles(player)
            if (newGrants.length > 0) {
                for (const t of newGrants) {
                    if (t.reward?.gold) player.gold = (player.gold||0) + t.reward.gold
                    if (t.reward?.exp) { gainExp(player, t.reward.exp) }
                    if (t.reward?.item) {
                        if (!player.inventory) player.inventory = {}
                        player.inventory[t.reward.item.id] = (player.inventory[t.reward.item.id]||0) + t.reward.item.amount
                    }
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                let txt = '🎉 *SELAMAT! TITLE BARU DIDAPAT!*\n\n'
                for (const t of newGrants) {
                    txt += `  🏅 *${t.name}*\n`
                    txt += `  📝 ${t.desc}\n`
                    txt += `  💰 Reward: +${toRupiah(t.reward?.gold||0)}\n`
                    txt += `  ⭐ EXP: +${t.reward?.exp||0}\n`
                    if (t.reward?.item) txt += `  📦 Item: ${t.reward.item.id} x${t.reward.item.amount}\n`
                    txt += '\n'
                }
                txt += `  🎖️ Total gelar: *${player.titles.length}*`
                return Reply(txt)
            }

            const myTitles = player.titles.map(id => TITLE_DATA[id]?.name || id).join(', ')
            return Reply(`🏅 *TITLE KAMU*\n\n  ${myTitles || 'Belum punya title!'}\n\n  Total: *${player.titles.length}/${Object.keys(TITLE_DATA).length}*\n\n💡 Ketik *.listtitle* untuk lihat semua title & progress!`)
        }

        if (command === 'equip') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            if (!text) return Reply(`Gunakan: .equip [nama item]\nLihat item di *.rpginv*`)
            const player = rpgDB.players[senderJid]
            const itemId = text.toLowerCase().replace(/ /g, '_')
            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) return Reply(`❌ lu gak punya item "${text}"!`)
            const item = rpgDB.items[itemId]
            if (!item || (item.type !== 'weapon' && item.type !== 'armor')) return Reply(`"${text}" bukan item yang bisa di equip.`)
            const itemType = item.type
            if (!player.equipment) player.equipment = { weapon: null, armor: null }
            if (player.equipment[itemType]) {
                const oldItemId = player.equipment[itemType]
                player.inventory[oldItemId] = (player.inventory[oldItemId] || 0) + 1
            }
            player.equipment[itemType] = itemId
            player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            return Reply(`
✦ ── ✅  EQUIP BERHASIL!  ✅ ──
  🏷️  Item   : *${item.name}*
  ${item.type == 'weapon' ? '⚔️  ATK    : +' + item.attack : '🛡️  DEF    : +' + item.defense}`)
        }

        if (command === 'unequip') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            if (!text || !['weapon', 'armor'].includes(text.toLowerCase())) return Reply(`Gunakan: .unequip [weapon/armor]`)
            const player = rpgDB.players[senderJid]
            const slot = text.toLowerCase()
            if (!player.equipment || !player.equipment[slot]) return Reply(`Tidak ada ${slot} yang sedang dipakai.`)
            const itemId = player.equipment[slot]
            const item = rpgDB.items[itemId]
            if (!player.inventory) player.inventory = {}
            player.inventory[itemId] = (player.inventory[itemId] || 0) + 1
            player.equipment[slot] = null
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            return Reply(`
✦ ── 🔄  UNEQUIP BERHASIL  🔄 ──
  🏷️  Item   : *${item.name}*
  📦 Status  : Kembali ke inventory`)
        }

        if (command === 'item') {

            if (!rpgDB.players[senderJid]) {
                return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            }
            const player = rpgDB.players[senderJid]
            const inBattle = !!(player.battleState && player.battleState.inBattle)

            // ── Tampilkan daftar item jika tidak ada argumen ──────────────
            if (!text) {
                // Kumpulkan semua item yang bisa dipakai (heal & mana)
                const usableItems = Object.keys(player.inventory || {}).filter(id => {
                    const d = rpgDB.items[id]
                    return d && (d.type === 'heal' || d.type === 'mana')
                })

                if (usableItems.length === 0) {
                    return Reply(
                        `` +
                        `  🎒  ITEM PAKAI  🎒\n` +
                        `\n` +
                        `` +
                        `  ❌ Tidak ada item yang bisa dipakai!\n` +
                        `  Beli item di *.rpgshop potion*\n` +
                        ``
                    )
                }

                // Pisah per tipe untuk tampilan lebih rapi
                const healItems = usableItems.filter(id => rpgDB.items[id].type === 'heal')
                const manaItems = usableItems.filter(id => rpgDB.items[id].type === 'mana')

                let listTxt =
                    `` +
                    `  🎒  DAFTAR ITEM PAKAI  🎒\n` +
                    `\n` +
                    `` +
                    `  ${inBattle ? '⚔️ Mode: *SAAT BERTARUNG* (musuh balas menyerang)' : '🏕️ Mode: *LUAR PERTARUNGAN* (aman)'}\n` +
                    `\n`

                if (healItems.length > 0) {
                    listTxt += `  ❤️ *POTION (HP)*\n`
                    healItems.forEach(id => {
                        const it = rpgDB.items[id]
                        const jumlah = player.inventory[id]
                        const efek = it.value >= 999 ? 'FULL HP' : `+${it.value} HP`
                        listTxt +=
                            `  • *${it.name}* x${jumlah}\n` +
                            `    🔑 Key: \`${id}\` | Efek: ${efek}\n` +
                            `    ↳ *.item ${id}*\n`
                    })
                    listTxt += `\n`
                }

                if (manaItems.length > 0) {
                    listTxt += `  🔵 *ELIXIR (MP)*\n`
                    manaItems.forEach(id => {
                        const it = rpgDB.items[id]
                        const jumlah = player.inventory[id]
                        const efek = it.value >= 999 ? 'FULL MP' : `+${it.value} MP`
                        listTxt +=
                            `  • *${it.name}* x${jumlah}\n` +
                            `    🔑 Key: \`${id}\` | Efek: ${efek}\n` +
                            `    ↳ *.item ${id}*\n`
                    })
                    listTxt += `\n`
                }

                listTxt +=
                    `  ❤️ HP: ${player.hp}/${player.maxHp} | 🔵 MP: ${player.mp}/${player.maxMp}\n` +
                    `\n` +
                    `💡 Cara pakai: *.item [key_item]*\n` +
                    `Contoh: *.item potion* atau *.item elixir_hidup*`

                return Reply(listTxt)
            }

            // ── Pakai item spesifik ───────────────────────────────────────
            const itemId = text.trim().split(/\s+/)[0].toLowerCase()

            if (!player.inventory || !player.inventory[itemId] || player.inventory[itemId] < 1) {
                // Coba cari item yg mirip dari inventory user
                const allUsable = Object.keys(player.inventory || {}).filter(id => {
                    const d = rpgDB.items[id]
                    return d && (d.type === 'heal' || d.type === 'mana')
                })
                const hint = allUsable.length
                    ? `\n💡 Item kamu: ${allUsable.map(id => `*${id}*`).join(', ')}\nKetik *.item* untuk lihat daftar lengkap.`
                    : `\n💡 Beli item di *.rpgshop potion*`
                return Reply(`❌ Item *${itemId}* tidak ada di inventory!${hint}`)
            }

            const item = rpgDB.items[itemId]
            if (!item) return Reply(`❌ Item *${itemId}* tidak dikenal!`)
            if (item.type !== 'heal' && item.type !== 'mana') {
                if (item.type === 'weapon' || item.type === 'armor') {
                    return Reply(`⚔️ *${item.name}* adalah equipment, gunakan *.equip ${itemId}*`)
                }
                if (item.type === 'material') {
                    return Reply(`🪨 *${item.name}* adalah material crafting, gunakan *.craft*`)
                }
                return Reply(`❌ *${item.name}* tidak bisa dipakai langsung!`)
            }

            // ── Hitung efek item ──────────────────────────────────────────
            let resultLines = [
                ``,
                `  ✨  PAKAI ITEM  ✨`,
                ``,
                ``,
                `  🧪 Item  : *${item.name}*`,
                `  🔑 Key   : \`${itemId}\``,
            ]

            if (item.type === 'heal') {
                const hpBefore = player.hp
                player.hp = Math.min(player.maxHp, player.hp + item.value)
                const hpGained = player.hp - hpBefore
                resultLines.push(`  ❤️ HP    : +${hpGained} → *${player.hp}/${player.maxHp}*`)
                if (hpGained < item.value) resultLines.push(`  ℹ️ HP sudah hampir penuh`)
            } else {
                const mpBefore = player.mp
                player.mp = Math.min(player.maxMp, player.mp + item.value)
                const mpGained = player.mp - mpBefore
                resultLines.push(`  🔵 MP    : +${mpGained} → *${player.mp}/${player.maxMp}*`)
                if (mpGained < item.value) resultLines.push(`  ℹ️ MP sudah hampir penuh`)
            }

            player.inventory[itemId] -= 1
            if (player.inventory[itemId] <= 0) delete player.inventory[itemId]

            // ── Jika DALAM pertarungan — musuh balas menyerang ───────────
            if (inBattle) {
                const battleState = player.battleState
                resultLines.push(``)
                resultLines.push(``)
                resultLines.push(`⚔️ *GILIRAN MUSUH*`)
                resultLines.push(`🗡️ ${battleState.monster.name} balas menyerang!`)

                const monsterDamage = calculateDamage(battleState.monster, player)
                player.hp -= monsterDamage.damage

                resultLines.push(``)
                resultLines.push(`  💥 damage: ${monsterDamage.damage}`)
                resultLines.push(`  ❤️ HP kamu: ${Math.max(0, player.hp)}/${player.maxHp}`)
                resultLines.push(``)

                if (player.hp <= 0) {
                    resultLines.push(``)
                    resultLines.push(`💀 *TE WAS...*`)
                    resultLines.push(`💀 Item gak cukup menolong...`)
                    resultLines.push(``)
                    player.hp = 1
                    player.gold = Math.max(0, player.gold - 20)
                    resultLines.push(`  💵 -Rp.20 | Sisa: ${toRupiah(player.gold)}`)
                    resultLines.push(``)
                    delete player.battleState
                }
            } else {
                // ── Di luar pertarungan — langsung selesai ────────────────
                const sisaItem = player.inventory[itemId] || 0
                resultLines.push(`  📦 Sisa  : ${sisaItem > 0 ? `${sisaItem}x` : 'Habis!'}`)
                resultLines.push(``)
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(resultLines.join('\n'))
        }

        if (command === 'rpghelp') {
            const helpText = `✦ ── 🎮  MENU RPG  🎮 ──

⚔️ *DASAR*
  .rpgstart       mulai petualangan
  .rpgstats       lihat stat karakter
  .rpginv         inventory & equipment
  .rpgshop        buka toko
  .rpgmove        pindah lokasi
  .rpgexplore     cari musuh

🎒 *PERLENGKAPAN*
  .equip [item]              pasang senjata/armor
  .unequip [weapon/armor]    lepas equipment
  .upgrade [weapon/armor]    ⬆️ upgrade stat equipment
  .buy [item]                beli item
  .sell [item] [qty]         jual item ke bot
  .use [item]                pakai potion/elixir
  .drop [item] [qty]         buang item
  .give [item] [qty] @user   berikan ke player lain
  .tradeitem offer @user [item] [qty] [harga] — trade berbayar

🏪 *JUAL KE BOT*
  .jualbot                   menu jual
  .jualbot item [id] [qty]   jual weapon/armor/material
  .jualbot item semua        jual semua item
  .jualbot pancing [id]      jual joran
  .jualbot umpan [id]        jual umpan
  .jualbot pet               jual pet
  .jualbot ikan              jual semua ikan
  .jualbot semua             jual SEMUA sekaligus!

⚡ *PERTEMPURAN*
  .attack         serang biasa
  .skill          skill class (butuh MP)
  .ulti           ultimate skill (butuh MP lebih)
  .flee           kabur dari pertempuran
  .item           pakai item saat battle
  .pvp @user      duel PVP animasi real-time
  .dungeon        masuk dungeon

🎭 *CLASS & SKILL*
  .changeclass    ganti class karakter
  .editrpg level @user [nilai]   ✏️ edit level (owner)
  .editrpg stats @user [stat] [nilai]  ✏️ edit stat (owner)

  ⚔️  WARRIOR      Rage Slash       Berserker Mode (3x dmg)
  🔥  MAGE         Fireball         Meteor Storm (multi-hit)
  🏹  ARCHER       Prec. Shot       Thousand Arrows (5 hit)
  🧚  PERI         Fairy Dust       Pixie Storm (heal+dmg)
  😈  IBLIS        Dark Claw        Soul Drain (life steal)
  🗿  GOLEM        Stone Slam       Earth Shatter (ATK+DEF)
  🌑  DARKMAGE     Shadow Bolt      Void Explosion (burst)
  💼  MERCENARY    Combo Strike     Overkill (5 hit combo)
  🥷  ASSASSIN     Shadow Stab      Shadow Kill (crit burst)
  ✨  PALADIN      Holy Smite       Holy Judgement (heal)
  💀  NECROMANCER  Death Touch      Death Curse
  💢  BERSERKER    Rage Burst       Rampage (6x dmg)
  🌿  RANGER       Tracking Shot    Nature Wrath (6 hit)
  🌀  SHAMAN       Spirit Strike    Spirit Storm (heal+dmg)
  👑  CREATOR      Reality Break    Divine Wrath (instant kill)

📈 *CRYPTO SPOT*
  .crypto harga [koin]         cek harga pasar
  .crypto beli [koin] [gold]   beli spot
  .crypto jual [koin]          jual posisi spot
  .crypto sl/tp [koin] [hrg]   stop loss / take profit spot
  .crypto porto                portofolio spot

⚡ *CRYPTO FUTURES*
  .crypto long [koin] [gold] [lev]   buka LONG (profit kalau naik)
  .crypto short [koin] [gold] [lev]  buka SHORT (profit kalau turun)
  .crypto tutup [koin]               tutup posisi futures
  .crypto fsl/ftp [koin] [hrg]       SL / TP futures
  .crypto posisi                     lihat semua posisi futures

📊 *CRYPTO LAINNYA*
  .crypto candle [koin] [1m/5m/1h]  candlestick chart
  .crypto market                     info market dan funding rate
  .crypto event                      trigger event random

📊 *SAHAM & ASET*
  .market saham               daftar saham
  .belimarket saham ALIP 5    beli saham
  .jualsaham ALIP 3           jual saham
  .ceksaham ALIP              detail saham
  .market kendaraan/properti  lihat aset
  .portofolio                 ringkasan investasi

💵 *EKONOMI*
  .kerja / .jobkerja    kerja & part time
  .berkebun             berkebun & panen
  .ngojek               ojek online
  .maling / .begal      kriminal (ada risiko!)
  .judionline           judi (hati-hati!)
  .tfuang [jml] @user   transfer uang

⛏️ *TAMBANG & MERAMU*
  .tambang → .besi → .nikel → .emas → .berlian
  .meramu / .foraging   cari bahan herbal

🎣 *MANCING*
  .mancing              lempar kail
  .mancingstart         cek setup joran & umpan
  .tasikan              inventori ikan
  .jualikanbot          jual ikan ke bot
  .batang toko          toko joran (Tier C→SSS)
  .shopbomber           toko umpan
  .topmancing           leaderboard pemancing

🐠 *AKUARIUM*
  .peliharaikan [key]              pelihara ikan
  .akuarium                        lihat ikan peliharaan
  .makankanikan [slot] [id] [qty]  beri makan
  .lepaskan [slot]                 lepaskan ikan
  .aduikan @user [key]             adu ikan
  .shopfood                        toko makanan ikan

  🥚(1) 🐟(2) 🐠(3) 🐡(4) 🦐(5) 🦑(6) 🐙(7) 🦈(8) 🐊(9) 🦁(10)
  🌊(11) ⚡(12) 🔥(13) ❄️(14) 🌑(15) 💎(16) 🌟(17) 👑(18) 🐉(19) ✨(20 MAX)

🏦 *BANK*
  .bank / .setor / .tarik   kelola rekening
  .topbank                  leaderboard nasabah

📈 *MARKET*
  .market                           buka market
  .jualaset [cat] [id] [qty] [hrg]  jual ke player
  .jualasetbot [cat] [id] [qty]     jual ke bot
  .batallisting [no]                batalkan listing
  .simpanaset / .tarikaset          simpan/tarik aset
  .pasifincome                      klaim passive income
  .topkaya                          top 10 terkaya

🎯 *LAINNYA*
  .quest / .craft    quest & crafting
  .daily             hadiah harian
  .leaderboardrpg    top player RPG
  .adopsipet         adopsi pet
  .infopet           info pet`
            return Reply(helpText)
        }

        if (command === 'tfuang') {
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    for (let id of m.mentionedJid) {
                        if (id.endsWith('@lid')) {
                            if (m.metadata && m.metadata.participants) {
                                let p = m.metadata.participants.find(x => x.lid === id || x.id === id)
                                if (p && p.jid) {
                                    targetJid = p.jid
                                    break
                                }
                            }
                        } else {
                            targetJid = id
                            break
                        }
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else {
                if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            }

            if (!targetJid) {
                return Reply(`Tag atau reply user yang mau transfer uang!\nContoh: .tfuang 100 @user`)
            }

            if (targetJid === m.sender) {
                return Reply("❌ gak bisa transfer ke diri sendiri!")
            }

            if (!rpgDB.players[targetJid]) {
                return Reply("❌ user itu belum mulai RPG!")
            }

            const tfArgs = (text ? text.trim() : (args && args.length ? args.join(' ') : '')).split(' ')
            const amount = parseInt(tfArgs[0])

            if (isNaN(amount) || amount <= 0) {
                return Reply(`Masukkan jumlah uang yang valid!\nContoh: .tfuang 100 @user`)
            }

            const senderPlayer = rpgDB.players[senderJid]
            const targetPlayer = rpgDB.players[targetJid]

            if (senderPlayer.gold < amount) {
                return Reply(`💵 saldo kurang! punya: ${toRupiah(senderPlayer.gold)}
`)
            }

            senderPlayer.gold -= amount
            targetPlayer.gold += amount

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            

return Reply(`
✦ ── 💸  TRANSFER UANG  💸 ──
  👤 Penerima  : @${targetJid.split('@')[0]}
  💵 Jumlah    : ${toRupiah(amount)}

  💰 Sisa      : ${toRupiah(senderPlayer.gold)}
Makasih udah dermawan, jangan lupa minta traktir~ 😄`, [targetJid])
        }

        // ─────────────────────────────────────────────
        // COMMAND: .bank — cek saldo rekening
        // ─────────────────────────────────────────────
        if (command === 'bank') {
            if (!isRegistered(m.sender) && !isCreator)
                return Reply(global.mess.verifikasi)
            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (!player.bank) player.bank = { balance: 0, totalDeposited: 0, totalWithdrawn: 0 }
            const dompet = player.gold || 0
            const tabungan = player.bank.balance || 0
            const totalAsset = dompet + tabungan
            return Reply(`
✦ ── 🏦  INFO REKENING  🏦 ──
  💵 Dompet    : *${toRupiah(dompet)}*
  🏦 Tabungan  : *${toRupiah(tabungan)}*

  💎 Total     : *${toRupiah(totalAsset)}*
📌 *.setor [jml]* simpan ke bank  |  *.tarik [jml]* ambil dari bank
Saldo bank *aman* dari PVP, begal & maling~ 🔐`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .setor [jumlah]
        // ─────────────────────────────────────────────
        if (command === 'setor') {
            if (!isRegistered(m.sender) && !isCreator)
                return Reply(global.mess.verifikasi)
            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (!player.bank) player.bank = { balance: 0, totalDeposited: 0, totalWithdrawn: 0 }
            if (!text) {
                return Reply(`
✦ ── 🏦  SETOR KE BANK  🏦 ──
  💵 Dompet    : *${toRupiah(player.gold)}*
  🏦 Tabungan  : *${toRupiah(player.bank.balance)}*
Gunakan: *.setor [jumlah]*  contoh: *.setor 500*`)
            }
            const jumlah = parseInt(text.trim())
            if (isNaN(jumlah) || jumlah <= 0)
                return Reply(`❌ Jumlah tidak valid! Masukkan angka lebih dari 0.
Contoh: *.setor 500*`)
            if (jumlah > player.gold) {
                return Reply(`
❌ *SALDO DOMPET KURANG!*
  💵 Dompet    : *${toRupiah(player.gold)}*
  📤 Mau Setor : *${toRupiah(jumlah)}*
  ❗ Kurang     : *${toRupiah(jumlah - player.gold)}*`)
            }
            player.gold -= jumlah
            player.bank.balance += jumlah
            player.bank.totalDeposited = (player.bank.totalDeposited || 0) + jumlah
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🏦  SETOR BERHASIL!  🏦 ──
  📤 Disetor   : *+${toRupiah(jumlah)}*
  💵 Dompet    : *${toRupiah(player.gold)}*
  🏦 Tabungan  : *${toRupiah(player.bank.balance)}*
Saldo lu aman di bank, gak bakal kecolongan~ 🔐`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .tarik [jumlah]
        // ─────────────────────────────────────────────
        if (command === 'tarik') {
            if (!isRegistered(m.sender) && !isCreator)
                return Reply(global.mess.verifikasi)
            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (!player.bank) player.bank = { balance: 0, totalDeposited: 0, totalWithdrawn: 0 }
            if (!text) {
                return Reply(`
✦ ── 🏦  TARIK DARI BANK  🏦 ──
  🏦 Tabungan  : *${toRupiah(player.bank.balance)}*
  💵 Dompet    : *${toRupiah(player.gold)}*
Gunakan: *.tarik [jumlah]*  contoh: *.tarik 200*`)
            }
            const jumlah = parseInt(text.trim())
            if (isNaN(jumlah) || jumlah <= 0)
                return Reply(`❌ Jumlah tidak valid! Masukkan angka lebih dari 0.
Contoh: *.tarik 200*`)
            if (jumlah > player.bank.balance) {
                return Reply(`
❌ *SALDO BANK KURANG!*
  🏦 Tabungan  : *${toRupiah(player.bank.balance)}*
  📥 Mau Tarik : *${toRupiah(jumlah)}*
  ❗ Kurang     : *${toRupiah(jumlah - player.bank.balance)}*`)
            }
            player.bank.balance -= jumlah
            player.gold += jumlah
            player.bank.totalWithdrawn = (player.bank.totalWithdrawn || 0) + jumlah
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🏦  TARIK BERHASIL!  🏦 ──
  📥 Ditarik   : *+${toRupiah(jumlah)}*
  💵 Dompet    : *${toRupiah(player.gold)}*
  🏦 Tabungan  : *${toRupiah(player.bank.balance)}*
Hati-hati bawa cash di luar, bisa dibegal~ ⚠️`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .topbank — leaderboard tabungan
        // ─────────────────────────────────────────────
        if (command === 'topbank') {
            if (!isRegistered(m.sender) && !isCreator)
                return Reply(global.mess.verifikasi)
            const players = Object.entries(rpgDB.players)
            if (players.length < 1) return Reply(`❌ Belum ada petualang yang terdaftar.`)
            const sortedByBank = players
                .filter(([_, p]) => p && p.bank && p.bank.balance > 0)
                .sort(([, a], [, b]) => (b.bank?.balance || 0) - (a.bank?.balance || 0))
                .slice(0, 10)
            if (sortedByBank.length === 0) return Reply(`❌ Belum ada nasabah. Jadilah yang pertama nabung!`)
            const rows = sortedByBank.map(([jid, p], i) => ({
                rank: i+1,
                label: jid.split('@')[0],
                value: toRupiah(p.bank.balance),
                extra: `Lv.${p.level||1} ${(p.class||'?').toUpperCase()}`
            }))
            const imgBuf = await generateLeaderboardCanvas('TOP 10 NASABAH BANK', 'Leaderboard Tabungan Terbesar', rows)
            if (imgBuf) {
                return alip.sendMessage(m.chat, { image: imgBuf, caption: 'Nabung itu keren, gak bakal kecolongan~' }, { quoted: m })
            }
            let tbText = `TOP 10 NASABAH BANK\n\n`
            const mentions = []
            sortedByBank.forEach(([jid, p], i) => {
                tbText += `  ${i+1}. @${jid.split('@')[0]} - ${toRupiah(p.bank.balance)}\n`
                mentions.push(jid)
            })
            return alip.sendMessage(m.chat, { text: tbText, mentions }, { quoted: m })
        }

        if (command === 'tambang' || command === 'mining') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.location !== 'tambang') return Reply('⛏️ lu harus ke *.rpgmove tambang* dulu buat nambang!')
            if (!player.miningState) {
                player.miningState = { stage: 'permukaan', lastMine: 0 }
            }
            const cooldown = 3 * 60 * 1000
            if (Date.now() - player.miningState.lastMine < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.miningState.lastMine))
                return Reply(`💪 istirahat dulu, capek! coba lagi ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(5, 15)
            const batuGained = generateRandomNumber(1, 5)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["batu"] = (player.inventory["batu"] || 0) + batuGained
            player.miningState.stage = 'besi'
            player.miningState.lastMine = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── ⛏️  HASIL TAMBANG  ⛏️ ──
  🗺️  Lapisan  : Permukaan
  🪨 Batu      : x${batuGained}
  ⭐ EXP       : +${expGained}
Nemu jalur ke lapisan bijih besi! Ketik *.besi* ⛓️`)
            return
        }

        if (command === 'besi') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.miningState || player.miningState.stage !== 'besi') {
                return Reply("⛏️ belum nemu lapisan bijih besi. mulai dari *.tambang* dulu.")
            }
            const cooldown = 3 * 60 * 1000
            if (Date.now() - player.miningState.lastMine < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.miningState.lastMine))
                return Reply(`💪 istirahat dulu, capek! coba lagi ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(15, 30)
            const itemGained = generateRandomNumber(1, 3)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["bijih_besi"] = (player.inventory["bijih_besi"] || 0) + itemGained
            player.miningState.stage = 'nikel'
            player.miningState.lastMine = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── ⛏️  HASIL TAMBANG  ⛏️ ──
  🗺️  Lapisan  : Bijih Besi
  ⛓️  Bijih Besi: x${itemGained}
  ⭐ EXP       : +${expGained}
Nemu lapisan nikel! Ketik *.nikel* 🔩`)
            return
        }

        if (command === 'nikel') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.miningState || player.miningState.stage !== 'nikel') {
                return Reply("⛏️ belum nemu lapisan nikel. selesaikan *.besi* dulu.")
            }
            const cooldown = 4 * 60 * 1000
            if (Date.now() - player.miningState.lastMine < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.miningState.lastMine))
                return Reply(`💪 istirahat dulu, capek! coba lagi ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(25, 45)
            const itemGained = generateRandomNumber(1, 2)
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["nikel"] = (player.inventory["nikel"] || 0) + itemGained
            player.miningState.stage = 'emas'
            player.miningState.lastMine = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── ⛏️  HASIL TAMBANG  ⛏️ ──
  🗺️  Lapisan  : Nikel
  🔩 Nikel     : x${itemGained}
  ⭐ EXP       : +${expGained}
Kilauan emas di depan mata! Ketik *.emas* ✨`)
            return
        }

        if (command === 'emas') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.miningState || player.miningState.stage !== 'emas') {
                return Reply("⛏️ belum nemu lapisan emas. selesaikan *.nikel* dulu.")
            }
            const cooldown = 5 * 60 * 1000
            if (Date.now() - player.miningState.lastMine < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.miningState.lastMine))
                return Reply(`💪 istirahat dulu, capek! coba lagi ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(40, 70)
            const itemGained = 1
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["emas"] = (player.inventory["emas"] || 0) + itemGained
            player.miningState.stage = 'berlian'
            player.miningState.lastMine = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── ⛏️  HASIL TAMBANG  ⛏️ ──
  🗺️  Lapisan  : Emas
  🥇 Emas      : x${itemGained}
  ⭐ EXP       : +${expGained}
Dasar tambang! Kilauan berlian di depan, ketik *.berlian* 💎`)
            return
        }

        if (command === 'berlian') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.miningState || player.miningState.stage !== 'berlian') {
                return Reply("⛏️ belum sampai dasar tambang. selesaikan *.emas* dulu.")
            }
            const cooldown = 7 * 60 * 1000
            if (Date.now() - player.miningState.lastMine < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.miningState.lastMine))
                return Reply(`💪 istirahat dulu, capek! coba lagi ${timeLeft} lagi.`)
            }
            const expGained = generateRandomNumber(80, 150)
            const itemGained = 1
            gainExp(player, expGained)
            if (!player.inventory) player.inventory = {}
            player.inventory["berlian"] = (player.inventory["berlian"] || 0) + itemGained
            player.miningState.stage = 'besi'
            player.miningState.lastMine = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 💎  DASAR TAMBANG!  💎 ──
  🗺️  Lapisan  : Berlian (PALING DALAM!)
  💎 Berlian   : x${itemGained}
  ⭐ EXP       : +${expGained}
LANGKA BANGET! Tambang reset, mulai lagi dari *.besi* ⛏️`)
            return
        }

        if (command === 'meramu' || command === 'foraging') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.location !== 'padang_rumput') return Reply('🌿 lu harus ke *.rpgmove padang_rumput* dulu buat meramu!')
            const cooldown = 5 * 60 * 1000
            if (Date.now() - (player.lastForage || 0) < cooldown) {
                const timeLeft = msToTime(cooldown - (Date.now() - player.lastForage))
                return Reply(`🌱 tanaman belum tumbuh! coba lagi ${timeLeft} lagi.`)
            }
            const locationData = rpgDB.locations.padang_rumput
            if (!locationData.herbs) return Reply(`🌿 gada bahan yang bisa diramu di sini!`)
            let gainedHerbs = []
            if (!player.inventory) player.inventory = {}
            for (const [herb, chance] of Object.entries(locationData.herbs)) {
                if (Math.random() < chance) {
                    const amount = generateRandomNumber(1, 4)
                    player.inventory[herb] = (player.inventory[herb] || 0) + amount
                    gainedHerbs.push(`${rpgDB.items[herb]?.name || herb} xRp.${toRupiah(amount)}
`)
                }
            }
            if (gainedHerbs.length === 0) {
                gainedHerbs.push("Rumput Liar x2")
                player.inventory["rumput_liar"] = (player.inventory["rumput_liar"] || 0) + 2
            }
            const expGained = generateRandomNumber(8, 20)
            gainExp(player, expGained)
            player.lastForage = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 🌿  HASIL MERAMU  🌿 ──
  ${gainedHerbs.join('\n  ')}

  ⭐ EXP  : +${expGained}`)
            return
        }

        if (command === 'dungeon') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            const [action, dungeonId] = (text || '').trim().split(' ')

            // ── DUNGEON ATTACK — harus dicek SEBELUM return status ──
            if (action === 'attack') {
                if (!player.dungeonState?.inDungeon) return Reply(`❌ Kamu tidak sedang di dungeon.\nKetik *.dungeon* untuk lihat daftar dungeon.`)
                const dungeon = rpgDB.dungeons[player.dungeonState.id]
                const currentStage = player.dungeonState.stage
                let monster, isBoss = false
                if (currentStage < dungeon.stages.length) {
                    const stageInfo = dungeon.stages[currentStage]
                    const baseMonster = rpgDB.monsters[stageInfo.monsterId]
                    const baseHp = baseMonster.hp * (stageInfo.count || 1)
                    if (player.dungeonState.monsterHp == null) player.dungeonState.monsterHp = baseHp
                    monster = { ...baseMonster, hp: player.dungeonState.monsterHp, maxHp: baseHp }
                } else {
                    const baseMonster = rpgDB.monsters[dungeon.boss]
                    if (player.dungeonState.monsterHp == null) player.dungeonState.monsterHp = baseMonster.hp
                    monster = { ...baseMonster, hp: player.dungeonState.monsterHp, maxHp: baseMonster.hp }
                    isBoss = true
                }

                const dungeonPlayerHp = player.dungeonState.hp
                const playerDamage = calculateDamage(player, monster)
                let totalPlayerDmg = playerDamage.damage
                if (player.pet?.attack > 0) totalPlayerDmg += player.pet.attack
                monster.hp -= totalPlayerDmg
                player.dungeonState.monsterHp = monster.hp

                let battleLog = [`⚔️ *SERANGAN DUNGEON*`]
                battleLog.push(`${isBoss ? '👑 BOSS: ' : '👾 '}*${monster.name}* menghadangmu!`)
                battleLog.push(``)
                battleLog.push(`  💥 Damage diberikan : *${playerDamage.damage}*${playerDamage.isCritical ? ' ⚡ *CRITICAL!*' : ''}`)
                if (player.pet?.attack > 0) battleLog.push(`  🐾 ${player.pet.name}: +${player.pet.attack} dmg`)
                battleLog.push(`  ❤️ HP musuh sisa    : ${Math.max(0, monster.hp)}/${monster.maxHp}`)
                battleLog.push(``)

                if (monster.hp <= 0) {
                    if (isBoss) {
                        player.hp = Math.max(1, player.dungeonState.hp)
                        battleLog.push(`🏆 *DUNGEON CLEAR!*`)
                        battleLog.push(`🏆 *${dungeon.name}* berhasil ditaklukkan!`)
                        battleLog.push(``)
                        const reward = dungeon.reward
                        player.gold += reward.gold
                        const leveled = gainExp(player, reward.exp)
                        player.monstersDefeated = (player.monstersDefeated || 0) + 1
                        if (!player.inventory) player.inventory = {}
                        battleLog.push(`  ⭐ EXP  : +${reward.exp}`)
                        battleLog.push(`  💵 Gold : +${toRupiah(reward.gold)}`)
                        if (reward.item) {
                            player.inventory[reward.item.id] = (player.inventory[reward.item.id] || 0) + reward.item.amount
                            battleLog.push(`  🎁 Item : ${rpgDB.items[reward.item.id]?.name || reward.item.id} x${reward.item.amount}`)
                        }
                        if (leveled) battleLog.push(`  🎊 *LEVEL UP! ➜ Lv.${player.level}*`)
                        delete player.dungeonState
                    } else {
                        player.dungeonState.stage += 1
                        player.dungeonState.monsterHp = null
                        player.monstersDefeated = (player.monstersDefeated || 0) + 1
                        const healStage = Math.floor(player.maxHp * 0.1)
                        player.dungeonState.hp = Math.min(player.maxHp, player.dungeonState.hp + healStage)
                        const nextStage = player.dungeonState.stage
                        const isNextBoss = nextStage >= dungeon.stages.length
                        battleLog.push(`✅ *STAGE ${currentStage + 1} CLEAR!*`)
                        battleLog.push(`➡️ Lanjut stage ${nextStage + 1}/${dungeon.stages.length + 1}${isNextBoss ? ' 👑 (BOSS!)' : ''}`)
                        battleLog.push(`  ❤️ HP: ${player.dungeonState.hp}/${player.maxHp} (+${healStage} regen)`)
                        battleLog.push(``)
                        battleLog.push(`Ketik *.dungeon attack* untuk lanjut!`)
                    }
                } else {
                    // Monster balas serang
                    const monsterDamage = calculateDamage({ ...monster, level: monster.level || 1 }, player)
                    const newDungeonHp = dungeonPlayerHp - monsterDamage.damage
                    player.dungeonState.hp = newDungeonHp

                    battleLog.push(`🛡️ *SERANGAN BALIK ${monster.name}*`)
                    battleLog.push(`  💥 Damage diterima : *${monsterDamage.damage}*${monsterDamage.isCritical ? ' ⚡ CRITICAL!' : ''}`)
                    battleLog.push(`  ❤️ HP kamu sisa   : ${Math.max(0, newDungeonHp)}/${player.maxHp}`)
                    battleLog.push(``)

                    if (newDungeonHp <= 0) {
                        battleLog.push(`💀 *DUNGEON FAILED!*`)
                        battleLog.push(`Kamu gugur di dalam dungeon...`)
                        const penalty = Math.floor(player.gold * 0.05)
                        player.gold = Math.max(0, player.gold - penalty)
                        player.hp = Math.floor(player.maxHp * 0.3)
                        if (penalty > 0) battleLog.push(`  💸 Penalti: -${toRupiah(penalty)} gold`)
                        battleLog.push(`  ❤️ HP dipulihkan ke 30%`)
                        delete player.dungeonState
                    } else {
                        battleLog.push(`Ketik *.dungeon attack* untuk serang lagi!`)
                    }
                }

                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(battleLog.join('\n'))
            }

            // ── DUNGEON FLEE ──
            if (action === 'flee' || action === 'kabur') {
                if (!player.dungeonState?.inDungeon) return Reply(`❌ Kamu tidak sedang di dungeon.`)
                const penalty = Math.floor(player.gold * 0.02)
                player.gold = Math.max(0, player.gold - penalty)
                player.hp = Math.max(1, Math.floor(player.maxHp * 0.5))
                delete player.dungeonState
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`🏃 Kamu berhasil kabur dari dungeon!\n💸 Penalti: -${toRupiah(penalty)} gold\n❤️ HP dipulihkan ke 50%`)
            }

            // ── Jika sedang di dungeon & tidak ada action khusus → tampilkan status ──
            if (player.dungeonState?.inDungeon) {
                const dungeon = rpgDB.dungeons[player.dungeonState.id]
                let monster
                if (player.dungeonState.stage < dungeon.stages.length) {
                    const stageInfo = dungeon.stages[player.dungeonState.stage]
                    monster = rpgDB.monsters[stageInfo.monsterId]
                    const monsterMaxHp = monster.hp * (stageInfo.count || 1)
                    const monsterCurrentHp = player.dungeonState.monsterHp ?? monsterMaxHp
                    return Reply(`✦ ── 🔥  DUNGEON BATTLE  🔥 ──\n  🏰 Dungeon  : ${dungeon.name}\n  📍 Stage    : ${player.dungeonState.stage + 1}/${dungeon.stages.length + 1}\n\n  👾 Musuh    : ${monster.name}\n  ❤️  HP Musuh : ${Math.max(0, monsterCurrentHp)}/${monsterMaxHp}\n  💙 HP Kamu  : ${player.dungeonState.hp}/${player.maxHp}\n\nKetik *.dungeon attack* untuk menyerang!\nKetik *.dungeon flee* untuk kabur.`)
                } else {
                    monster = rpgDB.monsters[dungeon.boss]
                    const bossCurrentHp = player.dungeonState.monsterHp ?? monster.hp
                    return Reply(`✦ ── 👑  BOSS FIGHT!  👑 ──\n  🏰 Dungeon  : ${dungeon.name}\n  👹 BOSS     : *${monster.name}*\n\n  ❤️  HP Boss  : ${Math.max(0, bossCurrentHp)}/${monster.hp}\n  💙 HP Kamu  : ${player.dungeonState.hp}/${player.maxHp}\n\nLawan boss dengan *.dungeon attack*!\nKabur: *.dungeon flee*`)
                }
            }

            // ── DUNGEON START ──
            if (action === 'start' && dungeonId) {
                const dungeon = rpgDB.dungeons[dungeonId]
                if (!dungeon) return Reply(`❌ Dungeon tidak ditemukan!\nKetik *.dungeon* untuk lihat daftar.`)
                if (player.level < dungeon.minLevel) return Reply(`❌ Level kurang! Butuh minimal level ${dungeon.minLevel}.`)
                player.dungeonState = { inDungeon: true, id: dungeonId, stage: 0, hp: player.hp, monsterHp: null }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                const firstMonster = rpgDB.monsters[dungeon.stages[0]?.monsterId]
                return Reply(`✦ ── 🚪  MASUK DUNGEON!  🚪 ──\n  🏰 Dungeon  : *${dungeon.name}*\n  📍 Stage    : ${dungeon.stages.length + 1} stage (termasuk boss)\n  👾 Musuh 1  : ${firstMonster?.name || '???'}\n\nKetik *.dungeon attack* untuk mulai! ⚔️\nKetik *.dungeon flee* untuk kabur kapan saja.`)
            }

            // ── DAFTAR DUNGEON ──
            let dungeonList = `✦ ⚔️  DAFTAR DUNGEON  ⚔️\n\n`
            for (const [id, d] of Object.entries(rpgDB.dungeons)) {
                const canEnter = player.level >= d.minLevel
                dungeonList += `  ${canEnter ? '✅' : '🔒'} *${d.name}*  (min level ${d.minLevel})\n`
                if (canEnter) dungeonList += `  ↳ *.dungeon start ${id}*\n\n`
                else dungeonList += `  ↳ Butuh level ${d.minLevel}\n\n`
            }
            dungeonList += `\n📖 Jika sedang di dungeon:\n  *.dungeon attack* — serang musuh\n  *.dungeon flee*   — kabur`
            return Reply(dungeonList)
        }

        if (command === 'adopsipet' || command === 'adoptpet') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.pet) return Reply(`❌ Kamu sudah punya pet *${player.pet.name}*, tidak bisa adopsi lagi.`)
            if (!text) {
                const tierInfo = {
                    'F':   '⬜ TIER F — Pemula',
                    'E':   '🟩 TIER E — Biasa',
                    'D':   '🔵 TIER D — Langka',
                    'C':   '🟣 TIER C — Keren',
                    'B':   '🟠 TIER B — Epik',
                    'A':   '🔴 TIER A — Legendaris',
                    'S':   '🌟 TIER S — Mythic',
                    'SS':  '💫 TIER SS — Dewa',
                    'SSS': '🔱 TIER SSS — GOD'
                }
                const grouped = {}
                for (const [id, pet] of Object.entries(rpgDB.petData)) {
                    if (!pet.cost) continue // skip header keys
                    const t = pet.tier || 'F'
                    if (!grouped[t]) grouped[t] = []
                    grouped[t].push([id, pet])
                }
                const tierOrder = ['F','E','D','C','B','A','S','SS','SSS']
                let petList = `✦ 🐾  PET SHOP  🐾\n\n`
                for (const t of tierOrder) {
                    if (!grouped[t] || grouped[t].length === 0) continue
                    petList += `\n  ${tierInfo[t]}\n`
                    for (const [id, pet] of grouped[t]) {
                        const atkStr = pet.attack ? `⚔️+${pet.attack}` : ''
                        const defStr = pet.defense ? `🛡️+${pet.defense}` : ''
                        const stats = [atkStr, defStr].filter(Boolean).join(' ')
                        petList += `  • *${pet.name}*  [${stats}]\n`
                        petList += `   ${pet.description}\n`
                        petList += `   💰 ${toRupiah(pet.cost)} | *.adopsipet ${id}*\n`
                    }
                }
                petList += `\n\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(petList)
            }
            const petId = text.toLowerCase().trim()
            const petInfo = rpgDB.petData[petId]
            if (!petInfo || !petInfo.cost) return Reply("❌ pet gak ada! Ketik *.adopsipet* untuk lihat daftar.")
            if (player.gold < petInfo.cost) return Reply(`💵 uang lu kurang!
  💰 harga  : ${toRupiah(petInfo.cost)}\n  💵 saldo  : ${toRupiah(player.gold)}\n  🔴 kurang : ${toRupiah(petInfo.cost - player.gold)}\n`)
            player.gold -= petInfo.cost
            player.pet = {
                id: petId,
                name: petInfo.name,
                level: 1,
                exp: 0,
                attack: petInfo.attack || 0,
                defense: petInfo.defense || 0
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 🎉  PET DIADOPSI!  🎉 ──
  🐾 Nama     : *${petInfo.name}*
  🏷️  Tier     : ${petInfo.tier || 'F'}
  ⚔️  ATK      : +${petInfo.attack || 0}
  🛡️  DEF      : +${petInfo.defense || 0}

  💰 Harga    : ${toRupiah(petInfo.cost)}
  💵 Sisa     : ${toRupiah(player.gold)}
🐾 *"${petInfo.description}"*`)
            return
        }

        if (command === 'infopet' || command === 'petinfo') {
            
                

            if (!rpgDB.players[senderJid]?.pet) return Reply(`❌ Belum punya pet! Adopsi dulu di *.adopsipet*`)
            const pet = rpgDB.players[senderJid].pet
            let petStats = `
✦ ── 🐾  INFO PET  🐾 ──
  🐾 Nama    : *${pet.name}*
  ⭐ Level   : ${pet.level}
  📈 EXP     : ${pet.exp}/100
`
            if (pet.attack > 0) petStats += `  ⚔️  ATK     : +${pet.attack}\n`
            if (pet.defense > 0) petStats += `  🛡️  DEF     : +${pet.defense}\n`
                        
            Reply(petStats)
            return
        }

        if (command === 'quest') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.activeQuest) {
                const quest = rpgDB.quests[player.activeQuest]
                let progressText = `(${player.questProgress || 0}/${quest.count})`

                // Cari hint lokasi & monster
                let locationHint = ''
                if (quest.type === 'kill') {
                    const matchLocs = []
                    for (const [locId, locData] of Object.entries(rpgDB.locations)) {
                        if (!locData.monsters) continue
                        for (const mId of locData.monsters) {
                            const m = rpgDB.monsters[String(mId)]
                            if (m && m.name === quest.target) {
                                matchLocs.push(`*.rpgmove ${locId}* → ${locData.name}`)
                                break
                            }
                        }
                    }
                    if (matchLocs.length > 0) locationHint = `\n  🗺️ Lokasi    : ${matchLocs.join(', ')}`
                } else if (quest.type === 'collect') {
                    const dropHints = []
                    for (const [mId, m] of Object.entries(rpgDB.monsters)) {
                        if (m.drops && m.drops[quest.target]) {
                            for (const [locId, locData] of Object.entries(rpgDB.locations)) {
                                if (locData.monsters?.includes(Number(mId))) {
                                    dropHints.push(`${m.name} di *.rpgmove ${locId}*`)
                                    break
                                }
                            }
                        }
                    }
                    if (dropHints.length > 0) locationHint = `\n  🗺️ Drop dari : ${dropHints.slice(0, 3).join(', ')}`
                }

                return Reply(`
✦ ── 📜  QUEST AKTIF  📜 ──
  📋 Misi      : *${quest.title}*
  📝 Deskripsi : ${quest.description}
  📊 Progress  : ${progressText}${locationHint}

💡 Pindah lokasi dengan *.rpgmove [lokasi]* lalu *.rpgexplore*!`)
            }
            if (player.location !== 'desa') {
                return Reply('🏠 quest cuma bisa diambil di *Desa Pemula*.')
            }
            let questListText = `✦ 📜  QUEST TERSEDIA  📜\n\n`
            for (const [id, quest] of Object.entries(rpgDB.quests)) {
                questListText += `  📋 *${quest.title}*\n`
                questListText += `  ↳ 🎁 Reward: ${quest.reward.exp} EXP + ${toRupiah(quest.reward.gold)}\n`
                questListText += `  ↳ *.quest ${id}*\n\n`
            }
                        if (!text) return Reply(questListText)
            const questId = text.toLowerCase().trim()
            if (!rpgDB.quests[questId]) return Reply("❌ quest gak ada.")
            player.activeQuest = questId
            player.questProgress = 0
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── ✅  QUEST DITERIMA!  ✅ ──
  📋 Misi  : *${rpgDB.quests[questId].title}*
  🎯 Status : Aktif
Selamat berjuang, jangan sampai gagal! ⚔️`)
            return
        }

        if (command === 'craft') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            const craftCategories = {
                '🧪 Potion & Elixir': ['potion_kuat','super_potion_craft','elixir_hidup_craft','elixir_mana_craft','mana_crystal_craft','mega_potion_craft','divine_potion_craft','mega_elixir_craft','divine_elixir_craft'],
                '⚔️ Senjata Tier Rendah': ['pedang_goblin','busur_goblin','pedang_orc','tongkat_orc','busur_orc'],
                '🗡️ Senjata Tier Menengah': ['pedang_besi_tempa','tongkat_kuno_craft','pedang_racun','busur_elven_craft'],
                '💠 Senjata Tier Tinggi': ['pedang_mithril_craft','tongkat_mithril'],
                '🔥 Senjata Legendaris': ['pedang_naga_craft','tombak_halilintar_c','katana_jiwa_craft','busur_abadi_craft','tongkat_dewa_craft','pedang_dewa_craft'],
                '🛡️ Armor Tier Rendah': ['perisai_goblin','baju_kulit_goblin','zirah_kulit_kuat','perisai_orc','jubah_penyihir_craft'],
                '🔰 Armor Tier Menengah': ['zirah_baja_craft'],
                '💎 Armor Tier Tinggi': ['zirah_mithril_craft'],
                '🔱 Armor Legendaris': ['jubah_lich_craft','perisai_naga_craft','zirah_orichal_craft','zirah_dewa_craft'],
                '🪨 Material Olahan': ['permata_craft','nikel_craft','kristal_es_craft','batu_kekuatan_craft','racun_perkuat','sisik_naga_craft','bulu_phoenix_craft','tulang_naga_craft','mithril_craft','orichalcum_craft']
            }

            if (!text) {
                let recipeListText = `✦ 🛠️  DAFTAR RESEP CRAFT  🛠️\n\n  Ketik *.craft [id]* untuk craft\n\n`
                for (const [cat, ids] of Object.entries(craftCategories)) {
                    const available = ids.filter(id => rpgDB.craftingRecipes[id])
                    if (!available.length) continue
                    recipeListText += `\n  ${cat}\n`
                    for (const id of available) {
                        const recipe = rpgDB.craftingRecipes[id]
                        const mats = Object.entries(recipe.materials).map(([mat, count]) => `${rpgDB.items[mat]?.name || mat} x${count}`).join(', ')
                        recipeListText += `  • *${recipe.name}* (x${recipe.amount})\n`
                        recipeListText += `   📦 ${mats}\n`
                        recipeListText += `   ↳ *.craft ${id}*\n`
                    }
                }
                recipeListText += `\n\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(recipeListText)
            }
            const recipeId = text.toLowerCase().trim()
            if (!rpgDB.craftingRecipes[recipeId]) return Reply("❌ resep gak ada.")
            const recipe = rpgDB.craftingRecipes[recipeId]
            for (const [material, required] of Object.entries(recipe.materials)) {
                if (!player.inventory || !player.inventory[material] || player.inventory[material] < required) {
                    return Reply(`❌ bahan kurang! butuh ${rpgDB.items[material]?.name || material} x${required} lagi.`)
                }
            }
            if (!player.inventory) player.inventory = {}
            for (const [material, required] of Object.entries(recipe.materials)) {
                player.inventory[material] -= required
                if (player.inventory[material] <= 0) delete player.inventory[material]
            }
            player.inventory[recipe.result] = (player.inventory[recipe.result] || 0) + recipe.amount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 🔨  CRAFT BERHASIL!  🔨 ──
  📦 Item    : ${recipe.name}
  ✅ Qty     : x${recipe.amount}
  🎒 Status  : Masuk inventory`)
            return
        }

        if (command === 'daily') {
            
                

            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const cooldown = 24 * 60 * 60 * 1000
            if (Date.now() - (player.lastDaily || 0) < cooldown) {
                const timeLeft = new Date((player.lastDaily || 0) + cooldown)
                return Reply(`⏳ Daily sudah diambil! Kembali jam ${timeLeft.toLocaleTimeString('id-ID')} nanti.`)
            }
            const goldReward = 1000 + (player.level * 100)
            const expReward = 200 + (player.level * 20)
            player.gold += goldReward
            player.exp += expReward
            player.lastDaily = Date.now()
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 🎁  DAILY REWARD  🎁 ──
  💵 Gold  : +${toRupiah(goldReward)}
  ⭐ EXP   : +${expReward}
Kembali lagi besok untuk reward berikutnya! 🔔`)
            return
        }

        if (command === 'pvp') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            let targetJid = null
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    for (let id of m.mentionedJid) {
                        if (id.endsWith('@lid')) {
                            if (m.metadata && m.metadata.participants) {
                                let p = m.metadata.participants.find(x => x.lid === id || x.id === id)
                                if (p && p.jid) { targetJid = p.jid; break }
                            }
                        } else { targetJid = id; break }
                    }
                } else if (m.quoted) targetJid = m.quoted.sender
            } else {
                if (m.quoted) targetJid = m.quoted.sender
            }
            if (!targetJid) return Reply(`Tag atau reply user yang mau diajak duel!\nContoh: .pvp @user`)
            if (targetJid === m.sender) return Reply(`❌ Gak bisa duel diri sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ Lawan belum mulai RPG!`)

            const player   = rpgDB.players[senderJid]
            const opponent = rpgDB.players[targetJid]

            const PVP_COOLDOWN = 5 * 60 * 1000
            if (Date.now() - (player.lastPvp || 0) < PVP_COOLDOWN) {
                const sisaDetik = Math.ceil(((player.lastPvp || 0) + PVP_COOLDOWN - Date.now()) / 1000)
                const sisaMenit = Math.floor(sisaDetik / 60)
                const sisaSisa  = sisaDetik % 60
                return Reply(`⏳ Cooldown PVP! Tunggu *${sisaMenit > 0 ? sisaMenit + ' menit ' : ''}${sisaSisa} detik* lagi.`)
            }
            player.lastPvp = Date.now()

            // ════════════════════════════════════════════════
            //  ⚔️  SISTEM PVP — MURNI HOKI, STATS IDENTIK
            //  Siapapun yang HP-nya duluan 0 = KALAH
            //  Level / equipment / class tidak berpengaruh
            // ════════════════════════════════════════════════

            const classBadge = {
                warrior:     '⚔️ [WARRIOR]',
                mage:        '🔮 [MAGE]',
                archer:      '🏹 [ARCHER]',
                peri:        '🧚 [PERI]',
                iblis:       '😈 [IBLIS]',
                golem:       '🗿 [GOLEM]',
                darkmage:    '🌑 [DARKMAGE]',
                mercenary:   '💼 [MERCENARY]',
                assassin:    '🗡️ [ASSASSIN]',
                paladin:     '🛡️ [PALADIN]',
                necromancer: '💀 [NECROMANCER]',
                berserker:   '🪓 [BERSERKER]',
                ranger:      '🌿 [RANGER]',
                shaman:      '🔱 [SHAMAN]',
                the_creator: '👑 [THE CREATOR]'
            }

            // ── Stats PVP: IDENTIK untuk semua ──
            const PVP_HP  = 500
            const PVP_ATK = 60
            const PVP_DEF = 15

            // ── HP bar ──
            const hpBar = (cur, max) => {
                const pct    = Math.max(0, Math.min(100, Math.floor((Math.max(0, cur) / max) * 100)))
                const filled = Math.floor(pct / 10)
                const bar    = '█'.repeat(filled) + '░'.repeat(10 - filled)
                const icon   = pct > 60 ? '💚' : pct > 30 ? '💛' : '❤️'
                return `${icon}[${bar}] ${pct}% (${Math.max(0, cur)}/${max})`
            }

            // ── Kalkulasi damage: cek dodge dulu, baru crit & lucky ──
            const calcDmg = () => {
                // Dodge 12% — kalau kena, serangan meleset total
                if (Math.random() < 0.12) return { dmg: 0, isDodge: true, isCrit: false, isLucky: false }

                // Raw damage: ATK dan DEF sama → hasil murni dari RNG factor
                const atkF = 0.5 + Math.random() * 1.0
                const defF = 0.5 + Math.random() * 1.0
                let dmg = Math.max(5, Math.floor(PVP_ATK * atkF - PVP_DEF * defF * 0.5))

                // Crit 20% → damage ×1.8
                const isCrit = Math.random() < 0.20
                if (isCrit) dmg = Math.floor(dmg * 1.8)

                // Lucky hit 10% → bonus +15–45
                const isLucky = Math.random() < 0.10
                if (isLucky) dmg += Math.floor(15 + Math.random() * 30)

                return { dmg, isDodge: false, isCrit, isLucky }
            }

            // ── Nama display ──
            const pName = `${classBadge[player.class]   || '👤'} @${senderJid.split('@')[0]}`
            const oName = `${classBadge[opponent.class] || '👤'} @${targetJid.split('@')[0]}`

            // ── Simulasi pertarungan — siapa duluan 0 HP = kalah ──
            let pHp = PVP_HP
            let oHp = PVP_HP
            let turn = Math.random() < 0.5 ? 'p' : 'o'
            const rounds = []

            while (pHp > 0 && oHp > 0 && rounds.length < 999) {
                const res = calcDmg()
                if (turn === 'p') {
                    oHp = Math.max(0, oHp - res.dmg)
                    rounds.push({ attacker: pName, defender: oName, ...res, pHp, oHp })
                    turn = 'o'
                } else {
                    pHp = Math.max(0, pHp - res.dmg)
                    rounds.push({ attacker: oName, defender: pName, ...res, pHp, oHp })
                    turn = 'p'
                }
            }

            // ── Tentukan pemenang — yang HP-nya masih > 0 ──
            // Kalau sama-sama 0 (unlikely) atau 999 rounds → coin flip
            let playerWon
            if (pHp > 0 && oHp <= 0)       playerWon = true
            else if (oHp > 0 && pHp <= 0)   playerWon = false
            else                             playerWon = Math.random() < 0.5

            // ── Random event flavor (muncul 40% chance) ──
            const pvpEvents = [
                '💨 Angin kencang berhembus, serangan jadi lebih liar!',
                '⚡ Kilat menyambar di atas arena!',
                '🌑 Bayangan gelap menyelimuti medan duel!',
                '🍀 Keberuntungan berputar di udara!',
                '🔥 Api membara membakar semangat bertarung!',
                '❄️ Tanah membeku, langkah jadi berat!',
                '🔄 Momentum berubah drastis di detik terakhir!',
                '✨ Aura misterius melingkupi arena!',
            ]
            const randomEvent = rounds.length > 3 && Math.random() < 0.4
                ? pvpEvents[Math.floor(Math.random() * pvpEvents.length)]
                : null

            // ── Builder teks per round ──
            const sep = '─────────────────'
            const buildText = (i) => {
                const r = rounds[i]
                let t = `⚔️ *DUEL PVP*\n${sep}\n`
                t += `${pName}\n${hpBar(r.pHp, PVP_HP)}\n\n`
                t += `${oName}\n${hpBar(r.oHp, PVP_HP)}\n`
                t += `${sep}\n`
                t += `🔁 *Ronde ${i + 1}*\n`
                if (r.isDodge) {
                    t += `💨 *DODGE!* ${r.defender} menghindar!\n`
                    t += `Serangan ${r.attacker} meleset!`
                } else {
                    const tag = r.isCrit && r.isLucky ? '💥✨ CRITICAL + LUCKY!'
                              : r.isCrit              ? '💥 CRITICAL HIT!'
                              : r.isLucky             ? '✨ LUCKY HIT!'
                              : ''
                    t += `⚔️ ${r.attacker} menyerang!\n`
                    t += `Damage: *${r.dmg}*${tag ? `  ${tag}` : ''}`
                }
                return t
            }

            // ── Kirim round pertama ──
            if (rounds.length === 0) return Reply(`❌ Duel gagal dimulai, coba lagi!`)
            const initSend = await alip.sendMessage(m.chat, { text: buildText(0), mentions: [senderJid, targetJid] })
            const editKey  = initSend?.key || null

            // ── Edit tiap round dengan delay ──
            for (let i = 1; i < rounds.length; i++) {
                await new Promise(r => setTimeout(r, 650))
                if (editKey) {
                    try {
                        await alip.sendMessage(m.chat, { text: buildText(i), edit: editKey, mentions: [senderJid, targetJid] })
                    } catch(e) {}
                }
            }

            await new Promise(r => setTimeout(r, 900))

            // ── Hitung hasil ──
            const winnerName = playerWon ? pName : oName
            const loserName  = playerWon ? oName : pName
            const winner     = playerWon ? player : opponent
            const loser      = playerWon ? opponent : player
            const winnerJid  = playerWon ? senderJid : targetJid
            const loserJid   = playerWon ? targetJid : senderJid

            winner.pvpWins   = (winner.pvpWins  || 0) + 1
            loser.pvpLosses  = (loser.pvpLosses || 0) + 1

            const goldStolen = Math.floor((loser.gold || 0) * 0.20)
            winner.gold = (winner.gold || 0) + goldStolen
            loser.gold  = Math.max(0, (loser.gold || 0) - goldStolen)

            const winExp  = 50
            const loseExp = 20
            gainExp(winner, winExp)
            gainExp(loser,  loseExp)

            // ── Final display ──
            let finalText = `⚔️ *DUEL PVP — SELESAI*\n${sep}\n`
            finalText += `${pName}\n${hpBar(pHp, PVP_HP)}\n\n`
            finalText += `${oName}\n${hpBar(oHp, PVP_HP)}\n`
            finalText += `${sep}\n`
            if (randomEvent) finalText += `${randomEvent}\n${sep}\n`
            finalText += `🏆 *MENANG » ${winnerName}*\n`
            finalText += `💀 KALAH  » ${loserName}\n`
            finalText += `${sep}\n`
            finalText += `💰 Rampas   : +${toRupiah(goldStolen)}\n`
            finalText += `⚡ EXP      : Menang +${winExp} | Kalah +${loseExp}\n`
            finalText += `📊 Record   : ${winner.pvpWins}W/${winner.pvpLosses || 0}L vs ${loser.pvpWins || 0}W/${loser.pvpLosses}L\n`
            finalText += `⏳ Cooldown : 5 menit\n`
            finalText += `${sep}\n`
            finalText += `ℹ️ Murni hoki — stats semua identik!`

            if (editKey) {
                try {
                    await alip.sendMessage(m.chat, { text: finalText, edit: editKey, mentions: [senderJid, targetJid] })
                } catch(e) {
                    await alip.sendMessage(m.chat, { text: finalText, mentions: [senderJid, targetJid] }, { quoted: m })
                }
            } else {
                await alip.sendMessage(m.chat, { text: finalText, mentions: [senderJid, targetJid] }, { quoted: m })
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return
        }

        // ── CHANGECLASS ───────────────────────────────────────────────
        if (command === 'changeclass' || command === 'ganticlass' || command === 'gantikelas') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const currentClass = player.class || 'warrior'

            const classData = {
                warrior:     { emoji:'⚔️',  hp:100,  mp:30,  attack:15, defense:10, agility:5,  desc:'Tank solid, defense tinggi' },
                mage:        { emoji:'🔥',  hp:60,   mp:100, attack:20, defense:5,  agility:8,  desc:'Magic burst, HP rendah' },
                archer:      { emoji:'🏹',  hp:80,   mp:50,  attack:12, defense:7,  agility:15, desc:'Agility tinggi, susah dikena' },
                peri:        { emoji:'🧚',  hp:65,   mp:110, attack:14, defense:6,  agility:20, desc:'Support/heal hybrid' },
                iblis:       { emoji:'😈',  hp:90,   mp:70,  attack:22, defense:8,  agility:10, desc:'Dark damage dealer' },
                golem:       { emoji:'🗿',  hp:180,  mp:20,  attack:18, defense:25, agility:2,  desc:'Tank ultimate, HP raksasa' },
                darkmage:    { emoji:'🌑',  hp:55,   mp:130, attack:28, defense:3,  agility:9,  desc:'Magic burst tertinggi' },
                mercenary:   { emoji:'💼',  hp:95,   mp:40,  attack:18, defense:12, agility:12, desc:'All-rounder seimbang' },
                assassin:    { emoji:'🥷',  hp:70,   mp:60,  attack:16, defense:5,  agility:28, desc:'Crit & burst extreme' },
                paladin:     { emoji:'✨',  hp:120,  mp:80,  attack:13, defense:18, agility:6,  desc:'Holy tank + heal' },
                necromancer: { emoji:'💀',  hp:60,   mp:140, attack:25, defense:4,  agility:7,  desc:'Summon & debuff' },
                berserker:   { emoji:'💢',  hp:110,  mp:20,  attack:24, defense:8,  agility:13, desc:'Raw power brutal' },
                ranger:      { emoji:'🌿',  hp:75,   mp:55,  attack:13, defense:8,  agility:22, desc:'Precision + trap' },
                shaman:      { emoji:'🌀',  hp:70,   mp:120, attack:16, defense:7,  agility:11, desc:'Nature magic + heal' }
            }

            const targetClass = args[0]?.toLowerCase()

            if (!targetClass) {
                let menu = `🎭 GANTI CLASS RPG\n\n`
                menu += `Class aktif: ${classData[currentClass]?.emoji || ''} ${currentClass.toUpperCase()}\n\n`
                for (const [cls, d] of Object.entries(classData)) {
                    const active = cls === currentClass ? ' ✅' : ''
                    menu += `${d.emoji} ${cls.toUpperCase()}${active}\n`
                    menu += `  ❤️${d.hp} 💙${d.mp} ⚔️${d.attack} 🛡️${d.defense} 💨${d.agility}\n`
                    menu += `  📝 ${d.desc}\n\n`
                }
                menu += `Ketik: .changeclass [nama class]\nContoh: .changeclass mage\n⚠️ HP/MP/stats reset ke base class (level tetap)`
                return Reply(menu)
            }

            if (!classData[targetClass]) {
                const list = Object.keys(classData).join(', ')
                return Reply(`❌ Class tidak valid!\n\nClass tersedia:\n${list}\n\nContoh: *.changeclass mage*`)
            }
            if (targetClass === currentClass) return Reply(`⚠️ Kamu sudah pakai class *${currentClass.toUpperCase()}*!`)

            const d = classData[targetClass]
            const lvl = player.level || 1
            const lvBonus = lvl - 1
            const oldClass = currentClass

            player.class    = targetClass
            // Scaling sesuai gainExp: +15+(lvl/5)*5 HP/level, +3+(lvl/8) ATK/level
            const hpGainTotal  = lvBonus * (15 + Math.floor(lvl / 5) * 5)
            const mpGainTotal  = lvBonus * (8  + Math.floor(lvl / 10) * 3)
            const atkGainTotal = lvBonus * (3  + Math.floor(lvl / 8))
            const defGainTotal = lvBonus * (2  + Math.floor(lvl / 10))
            const agiGainTotal = lvBonus * (1  + Math.floor(lvl / 15))

            player.maxHp    = d.hp      + hpGainTotal
            player.hp       = player.maxHp
            player.maxMp    = d.mp      + mpGainTotal
            player.mp       = player.maxMp
            player.attack   = d.attack  + atkGainTotal
            player.defense  = d.defense + defGainTotal
            player.agility  = d.agility + agiGainTotal

            const result = `✅ CLASS BERHASIL DIGANTI!\n\n`
                + `🔄 ${classData[oldClass]?.emoji || ''} ${oldClass.toUpperCase()} → ${d.emoji} ${targetClass.toUpperCase()}\n\n`
                + `📊 Stats Baru (Lv.${player.level})\n`
                + `  ❤️ HP  : ${player.maxHp}\n`
                + `  💙 MP  : ${player.maxMp}\n`
                + `  ⚔️ ATK : ${player.attack}\n`
                + `  🛡️ DEF : ${player.defense}\n`
                + `  💨 AGI : ${player.agility}\n\n`
                + `📝 ${d.desc}`
            Reply(result)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return
        }

        // ─── UPGRADE WEAPON / ARMOR ─────────────────────────────────────
        // Usage: .upgrade weapon   — upgrade senjata yg dipakai
        //        .upgrade armor    — upgrade zirah yg dipakai
        //        .upgrade info     — lihat info upgrade equipment sekarang
        // Biaya upgrade: emas + mithril + gold, makin tinggi level upgrade makin mahal
        if (command === 'upgrade') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const sub = args[0]?.toLowerCase()

            const UPGRADE_MATS = [
                // level 0→1
                { gold: 50000,    emas: 1,  mithril: 0, orichalcum: 0 },
                // level 1→2
                { gold: 150000,   emas: 2,  mithril: 0, orichalcum: 0 },
                // level 2→3
                { gold: 350000,   emas: 3,  mithril: 1, orichalcum: 0 },
                // level 3→4
                { gold: 700000,   emas: 5,  mithril: 2, orichalcum: 0 },
                // level 4→5
                { gold: 1500000,  emas: 8,  mithril: 3, orichalcum: 1 },
                // level 5→6
                { gold: 3000000,  emas: 12, mithril: 5, orichalcum: 2 },
                // level 6→7
                { gold: 6000000,  emas: 18, mithril: 8, orichalcum: 3 },
                // level 7→8
                { gold: 12000000, emas: 25, mithril:12, orichalcum: 5 },
                // level 8→9
                { gold: 25000000, emas: 35, mithril:18, orichalcum: 8 },
                // level 9→10 (MAX)
                { gold: 50000000, emas: 50, mithril:25, orichalcum:12 }
            ]
            const MAX_UPGRADE = 10

            // bonus stat per upgrade level: weapon +atk, armor +def
            const UPGRADE_BONUS = {
                weapon: [0, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75],  // index = upgrade level
                armor:  [0, 2, 5, 9,  14, 20, 27, 35, 44, 54, 65]
            }

            const showInfo = (slot) => {
                const eqId = player.equipment?.[slot]
                if (!eqId) return `❌ Tidak ada ${slot} yang dipakai! Equip dulu dengan *.equip [item]*`
                const item = rpgDB.items[eqId]
                if (!item) return `❌ Data item tidak ditemukan!`
                const upgLvl = item.upgradeLevel || 0
                const bonus  = UPGRADE_BONUS[slot]?.[upgLvl] || 0
                const baseStatKey = slot === 'weapon' ? 'attack' : 'defense'
                const baseStat    = (slot === 'weapon' ? item.attack : item.defense) || 0
                let info = `✦ ── 🔨  INFO UPGRADE ${slot.toUpperCase()}  🔨 ──\n\n`
                info += `  📦 Item     : *${item.name}*\n`
                info += `  📊 Base ${baseStatKey === 'attack' ? 'ATK' : 'DEF'} : ${baseStat}\n`
                info += `  ✨ Bonus    : +${bonus} (dari upgrade)\n`
                info += `  ⬆️ Level    : *+${upgLvl}* / ${MAX_UPGRADE}\n\n`
                if (upgLvl >= MAX_UPGRADE) {
                    info += `🌟 *SUDAH MAKSIMAL!* Tidak bisa diupgrade lagi.\n`
                } else {
                    const cost = UPGRADE_MATS[upgLvl]
                    const nextBonus = UPGRADE_BONUS[slot]?.[upgLvl + 1] || 0
                    info += `🔨 *Upgrade ke +${upgLvl + 1}*:\n`
                    info += `  💰 Gold       : ${toRupiah(cost.gold)}\n`
                    if (cost.emas > 0)  info += `  🥇 Emas       : ${cost.emas}x\n`
                    if (cost.mithril > 0) info += `  🔮 Mithril    : ${cost.mithril}x\n`
                    if (cost.orichalcum > 0) info += `  💎 Orichalcum : ${cost.orichalcum}x\n`
                    info += `\n  📈 Bonus jadi : +${nextBonus} ${baseStatKey === 'attack' ? 'ATK' : 'DEF'}\n`
                    info += `\n*.upgrade ${slot}* — eksekusi upgrade`
                }
                return info
            }

            if (!sub || sub === 'info') {
                const wInfo = player.equipment?.weapon ? showInfo('weapon') : '❌ Tidak ada senjata dipakai'
                const aInfo = player.equipment?.armor  ? showInfo('armor')  : '❌ Tidak ada zirah dipakai'
                return Reply(`${wInfo}\n\n${'─'.repeat(28)}\n\n${aInfo}`)
            }

            if (sub === 'weapon' || sub === 'senjata' || sub === 'armor' || sub === 'zirah') {
                const slot = (sub === 'senjata' || sub === 'weapon') ? 'weapon' : 'armor'
                const eqId = player.equipment?.[slot]
                if (!eqId) return Reply(`❌ Tidak ada ${slot} yang dipakai! Equip dulu.`)
                const item = rpgDB.items[eqId]
                if (!item) return Reply(`❌ Data item tidak ditemukan!`)

                const upgLvl = item.upgradeLevel || 0
                if (upgLvl >= MAX_UPGRADE) return Reply(`🌟 *${item.name}* sudah upgrade level MAX (+${MAX_UPGRADE})!`)

                const cost = UPGRADE_MATS[upgLvl]
                const inv  = player.inventory || {}
                const gold = player.gold || 0

                // Cek semua bahan
                const missing = []
                if (gold < cost.gold) missing.push(`💰 Gold: butuh ${toRupiah(cost.gold)}, punya ${toRupiah(gold)}`)
                if (cost.emas > 0 && (inv.emas || 0) < cost.emas)           missing.push(`🥇 Emas: butuh ${cost.emas}x, punya ${inv.emas || 0}x`)
                if (cost.mithril > 0 && (inv.mithril || 0) < cost.mithril)  missing.push(`🔮 Mithril: butuh ${cost.mithril}x, punya ${inv.mithril || 0}x`)
                if (cost.orichalcum > 0 && (inv.orichalcum || 0) < cost.orichalcum) missing.push(`💎 Orichalcum: butuh ${cost.orichalcum}x, punya ${inv.orichalcum || 0}x`)

                if (missing.length > 0) return Reply(`❌ *Bahan tidak cukup!*\n\n${missing.join('\n')}`)

                // Bayar biaya
                player.gold -= cost.gold
                if (cost.emas > 0)        { inv.emas        = (inv.emas        || 0) - cost.emas;        if (inv.emas <= 0)        delete inv.emas }
                if (cost.mithril > 0)     { inv.mithril     = (inv.mithril     || 0) - cost.mithril;     if (inv.mithril <= 0)     delete inv.mithril }
                if (cost.orichalcum > 0)  { inv.orichalcum  = (inv.orichalcum  || 0) - cost.orichalcum;  if (inv.orichalcum <= 0)  delete inv.orichalcum }
                player.inventory = inv

                // Apply upgrade
                const prevBonus = UPGRADE_BONUS[slot]?.[upgLvl]     || 0
                const newBonus  = UPGRADE_BONUS[slot]?.[upgLvl + 1] || 0
                const addedStat = newBonus - prevBonus
                item.upgradeLevel = upgLvl + 1

                if (slot === 'weapon') {
                    item.attack   = (item.attack   || 0) + addedStat
                } else {
                    item.defense  = (item.defense  || 0) + addedStat
                }

                // Juga update stats player
                if (slot === 'weapon') player.attack  = (player.attack  || 0) + addedStat
                else                   player.defense = (player.defense || 0) + addedStat

                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                const statKey = slot === 'weapon' ? 'ATK' : 'DEF'
                return Reply(`✦ ── 🔨  UPGRADE BERHASIL!  🔨 ──\n\n  📦 Item    : *${item.name}*\n  ⬆️ Level   : +${upgLvl} → *+${item.upgradeLevel}*\n  📊 ${statKey} bonus  : +${prevBonus} → *+${newBonus}*\n  ➕ Tambahan: +${addedStat} ${statKey}\n\n💰 Biaya: ${toRupiah(cost.gold)}${cost.emas > 0 ? ` + ${cost.emas} Emas` : ''}${cost.mithril > 0 ? ` + ${cost.mithril} Mithril` : ''}${cost.orichalcum > 0 ? ` + ${cost.orichalcum} Orichalcum` : ''}\n\n✅ Item berhasil diupgrade!`)
            }

            return Reply(`⚒️ *SISTEM UPGRADE*\n\n*.upgrade info*       — lihat info upgrade\n*.upgrade weapon*     — upgrade senjata\n*.upgrade armor*      — upgrade zirah\n\n📌 Bahan upgrade: Gold + Emas + Mithril + Orichalcum\n📌 Max upgrade: *+10*`)
        }

                if (command === 'leaderboardrpg' || command === 'lb_rpg') {
            const players = Object.entries(rpgDB.players)
            if (players.length < 1) return Reply("❌ Belum ada petualang yang terdaftar.")
            const sortedByLevel = players.sort(([,a], [,b]) => b.level - a.level || b.exp - a.exp).slice(0, 10)
            const rows = sortedByLevel.map(([jid, p], i) => ({
                rank: i+1,
                label: jid.split('@')[0],
                value: `Lv.${p.level}`,
                extra: `${(p.class||'?').toUpperCase()} | EXP: ${p.exp}`
            }))
            const imgBuf = await generateLeaderboardCanvas('TOP PETUALANG RPG', 'Leaderboard Level Tertinggi', rows)
            if (imgBuf) {
                return alip.sendMessage(m.chat, { image: imgBuf, caption: 'Siapa petualang terkuat?' }, { quoted: m })
            }
            let levelLbText = `TOP PETUALANG RPG\n\n`
            sortedByLevel.forEach(([jid, p], i) => {
                levelLbText += `  ${i+1}. @${jid.split('@')[0]} - Level ${p.level} (${(p.class||'?').toUpperCase()})\n`
            })
            await alip.sendMessage(m.chat, { text: levelLbText }, { quoted: m })
            return
        }

        // ── Fishing data & helpers sudah didefinisikan di module scope atas ──

        // ── MANCINGSTART ──────────────────────────────────────────────
        if (command === 'mancingstart') {
            if (!rpgDB.players[senderJid]) rpgDB.players[senderJid] = initPlayerRPG(senderJid)
            const player = rpgDB.players[senderJid]
            if (!player.fishing) player.fishing = { lastCatch: 0, totalCatch: 0, equippedRod: 'starter_rod', equippedBait: null }
            const rod = ROD_DATA[player.fishing.equippedRod || 'starter_rod']
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🎣  SETUP MANCING  🎣 ──
  🎣 Joran   : ${rod.emoji} ${rod.name} [Tier ${rod.tier}]
  🪱 Umpan   : ${player.fishing.equippedBait ? BAIT_DATA[player.fishing.equippedBait]?.name : 'Tidak ada'}
  🎯 Boost   : +${rod.boost} ikan langka
Ketik *.mancing* untuk mulai narik! 🎣
*.shoprod* beli joran  ·  *.shopbomber* beli umpan`)
        }

        // ── MANCING ───────────────────────────────────────────────────
        if (command === 'mancing') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let player = rpgDB.players[senderJid]
            if (!player.fishing) player.fishing = { lastCatch: 0, totalCatch: 0, equippedRod: 'starter_rod', equippedBait: null }
            if (!player.inventory) player.inventory = {}

            const rodId = player.fishing.equippedRod || 'starter_rod'
            const rod = ROD_DATA[rodId] || ROD_DATA.starter_rod
            const baitId = player.fishing.equippedBait
            const bait = baitId ? BAIT_DATA[baitId] : null

            if (baitId && (!player.inventory[`bait_${baitId}`] || player.inventory[`bait_${baitId}`] <= 0)) {
                player.fishing.equippedBait = null
                Reply(`⚠️ Umpan *${bait?.name || baitId}* habis! Auto-unset. Lanjut tanpa umpan.`)
            }

            const cooldownMs = 10000
            const timeSinceLast = Date.now() - (player.fishing.lastCatch || 0)
            if (timeSinceLast < cooldownMs) {
                const sisa = Math.ceil((cooldownMs - timeSinceLast) / 1000)
                return Reply(`🎣 Sabar... kailnya belum kena! Tunggu *${sisa} detik* lagi.`)
            }

            const rodBoost = rod.boost || 0
            const mutBoost = bait ? (bait.mutBoost || 0) : 0

            // Group fishing buff (luck_potion)
            if (!rpgDB.fishingBuffs) rpgDB.fishingBuffs = {}
            const groupBuff = rpgDB.fishingBuffs[m.chat]
            const buffBoost = (groupBuff && groupBuff.expiry > Date.now()) ? (groupBuff.boost || 0) : 0
            // Hapus buff yang sudah expired
            if (groupBuff && groupBuff.expiry <= Date.now()) delete rpgDB.fishingBuffs[m.chat]

            const totalRodBoost = rodBoost + buffBoost
            const rarity  = pickFishRarity(totalRodBoost)
            const fish     = pickRandomFishByRarity(rarity)
            const mutation = rollMutation(mutBoost)

            if (!fish) return Reply('❌ Terjadi error saat mancing, coba lagi.')

            if (baitId && player.inventory[`bait_${baitId}`] > 0) {
                player.inventory[`bait_${baitId}`] -= 1
            }

            const invKey = getFishInventoryKey(fish.id, mutation?.id)
            player.inventory[invKey] = (player.inventory[invKey] || 0) + 1
            player.fishing.lastCatch  = Date.now()
            player.fishing.totalCatch = (player.fishing.totalCatch || 0) + 1

            const finalPrice = calcFishPrice(fish, mutation)
            const expGain    = mutation ? Math.floor(fish.baseExp * (mutation.multiplier * 0.5)) : fish.baseExp
            const leveledUp  = gainExp(player, expGain)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const displayName  = getFishDisplayName(fish, mutation)
            const rarityEmoji  = getRarityEmoji(rarity)

            let msg = `🎣 *HASIL MANCING*

  ${rarityEmoji} *[${rarity}]* ${displayName}
  🎣 Joran  : ${rod.emoji} ${rod.name} [${rod.tier}]
${bait ? `  🪱 Umpan  : ${bait.emoji} ${bait.name}\n` : ''}${mutation
    ? `  🧬 Mutasi : ${mutation.emoji} *${mutation.name}* (${mutation.tier}) x${mutation.multiplier}\n`
    : `  🧬 Mutasi : ❌ Tidak ada\n`}  💰 Harga jual : ${toRupiah(finalPrice)}
  ⭐ EXP    : +${expGain}
  🎯 Total tangkap : ${player.fishing.totalCatch}
💡 *.tasikan* lihat inventori | *.jualikanbot* jual ke bot`
            if (leveledUp) msg += `\n\n🎊 *LEVEL UP!* sekarang level ${player.level}!`
            return Reply(msg)
        }

        // ── TASIKAN ───────────────────────────────────────────────────
        if (command === 'tasikan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const inv = player.inventory || {}
            const fishEntries = Object.entries(inv).filter(([k, v]) => k.startsWith('fish_') && v > 0)

            if (!fishEntries.length) return Reply(`🎣 Inventori ikan kosong!\nMancing dulu dengan *.mancing*`)

            let txt = `✦ 🐟  INVENTORI IKAN  🐟\n\n`
            let totalVal = 0
            for (const [key, qty] of fishEntries) {
                const { fishId, mutationId } = parseFishKey(key)
                if (!fishId) {
                    // Fallback: tampilkan ikan yang tidak dikenal agar tidak hilang
                    const rawId = key.replace('fish_', '')
                    txt += `  ⬜ ❓ ${rawId} (data tidak ditemukan)\n`
                    txt += `  ↳ x${qty} | 💰 Tidak bisa dinilai\n`
                    txt += `  ↳ key: ${rawId}\n`
                    continue
                }
                const fish     = FISH_DATA[fishId] || { name: fishId, emoji: '🐟', rarity: 'COMMON', basePrice: 0 }
                const mutation = mutationId ? MUTATION_DATA[mutationId] : null
                const price    = calcFishPrice(fish, mutation)
                totalVal += price * qty
                txt += `  ${getRarityEmoji(fish.rarity)} ${getFishDisplayName(fish, mutation)}\n`
                txt += `  ↳ x${qty} | 💰 ${toRupiah(price)}/ekor\n`
                txt += `  ↳ key: ${key.replace('fish_','')}\n`
            }
            txt += `\n  💼 *Total nilai* : ${toRupiah(totalVal)}\n\n`
            txt += `*.jualikanbot* — jual semua ke bot\n*.jualikanbot [key] [qty]* — jual spesifik\n*.jualikan @user [key] [qty] [harga]* — jual ke player`
            return Reply(txt)
        }

        // ── JUALIKANBOT ───────────────────────────────────────────────
        if (command === 'jualikanbot') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const inv = player.inventory || {}
            const fishEntries = Object.entries(inv).filter(([k, v]) => k.startsWith('fish_') && v > 0)
            if (!fishEntries.length) return Reply(`🎣 Gak ada ikan untuk dijual!\nMancing dulu dengan *.mancing*`)

            let totalGold = 0
            let soldList  = []
            const args2 = text ? text.trim().split(/\s+/) : []

            if (args2.length >= 1 && args2[0]) {
                const targetKey = `fish_${args2[0]}`
                const sellQty   = Math.min(parseInt(args2[1]) || (inv[targetKey] || 0), inv[targetKey] || 0)
                if (!inv[targetKey] || inv[targetKey] <= 0) return Reply(`❌ Ikan *${args2[0]}* gak ada di inventori!`)
                const { fishId, mutationId } = parseFishKey(targetKey)
                if (!fishId) return Reply(`❌ Key ikan tidak valid!`)
                const fish     = FISH_DATA[fishId]
                const mutation = mutationId ? MUTATION_DATA[mutationId] : null
                const earn     = calcFishPrice(fish, mutation) * sellQty
                inv[targetKey] -= sellQty
                player.gold    += earn
                totalGold       = earn
                soldList.push(`${getFishDisplayName(fish, mutation)} x${sellQty} = ${toRupiah(earn)}`)
            } else {
                for (const [key, qty] of fishEntries) {
                    const { fishId, mutationId } = parseFishKey(key)
                    if (!fishId) continue
                    const fish     = FISH_DATA[fishId]
                    const mutation = mutationId ? MUTATION_DATA[mutationId] : null
                    const earn     = calcFishPrice(fish, mutation) * qty
                    totalGold     += earn
                    soldList.push(`${getFishDisplayName(fish, mutation)} x${qty} = ${toRupiah(earn)}`)
                    inv[key] = 0
                }
                player.gold += totalGold
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            let txt = `✦ 🏪  JUAL IKAN KE BOT  🏪\n\n`
            soldList.slice(0, 10).forEach(s => txt += `  🐟 ${s}\n`)
            if (soldList.length > 10) txt += `  ... dan ${soldList.length - 10} ikan lagi\n`
            txt += `\n  💰 *Total* : ${toRupiah(totalGold)}\n  💵 Saldo  : ${toRupiah(player.gold)}\n`
            return Reply(txt)
        }

        // ── JUALIKAN (antar player) ───────────────────────────────────
        if (command === 'jualikan') {
            cleanExpiredDeals(rpgDB)
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const inv = player.inventory || {}

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
                    const participants = m.metadata?.participants || []
                    const found = participants.find(p => p.lid === targetJid || p.id === targetJid)
                    if (found) targetJid = found.jid || found.id || targetJid
                }
            } else if (m.quoted) targetJid = m.quoted.sender
            if (targetJid) targetJid = resolvePlayerJid(targetJid)

            if (!targetJid) return Reply(`❌ Tag atau reply user penerima!\nFormat: *.jualikan @user [fishkey] [qty] [harga]*`)
            if (targetJid === senderJid) return Reply(`❌ Gak bisa jual ke diri sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ User tersebut belum daftar RPG!`)

            const argParts = text ? text.replace(/@\d+/g, '').trim().split(/\s+/) : []
            if (argParts.length < 3) return Reply(`❌ Format: *.jualikan @user [fishkey] [qty] [harga]*\nContoh: *.jualikan @user minnow 1 500*`)

            const fishKey = `fish_${argParts[0]}`
            const qty     = parseInt(argParts[1]) || 1
            const harga   = parseInt(argParts[2]) || 0

            if (!inv[fishKey] || inv[fishKey] < qty) return Reply(`❌ Ikan *${argParts[0]}* tidak cukup di inventori!\nKamu punya: ${inv[fishKey] || 0}`)
            if (harga <= 0) return Reply(`❌ Harga harus lebih dari 0!`)

            // Cek apakah penjual sudah punya deal aktif
            if (findDealAsSeller(rpgDB, senderJid)) return Reply(`⚠️ Kamu masih punya penawaran aktif!\nKetik *.batalkanikan* untuk membatalkan dulu.`)

            const { fishId: fid, mutationId: mid } = parseFishKey(fishKey)
            const fishDisp = fid ? getFishDisplayName(FISH_DATA[fid], mid ? MUTATION_DATA[mid] : null) : argParts[0]

            // Simpan ke rpgDB — key = senderJid (penjual), selalu konsisten
            getDeals(rpgDB)[senderJid] = {
                sellerJid: senderJid,
                buyerJid: targetJid,
                fishKey, fishDisp, qty,
                price: harga,
                lastOfferBy: 'seller',
                expiresAt: Date.now() + FISH_DEAL_TTL
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 🐟  PENAWARAN IKAN  🐟\n\n  📤 Penjual : @${senderJid.split('@')[0]}\n  📥 Pembeli : @${targetJid.split('@')[0]}\n\n  🐟 Ikan    : *${fishDisp}* x${qty}\n  💰 Harga   : *${toRupiah(harga)}*\n\n\n@${targetJid.split('@')[0]} Kamu mendapat penawaran ikan!\n\n✅ *.setujuikan* — terima\n❌ *.tolakikan* — tolak\n💬 *.tawarikan [harga]* — negosiasi harga\n\n⏳ Penawaran berlaku *5 menit*`,
                mentions: [senderJid, targetJid]
            }, { quoted: m })
        }

        // ── SETUJUIKAN ────────────────────────────────────────────────
        if (command === 'setujuikan') {
            cleanExpiredDeals(rpgDB)
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)

            const buyerFound = findDealAsBuyer(rpgDB, senderJid)
            if (!buyerFound) return Reply(`❌ Tidak ada penawaran ikan untukmu saat ini.`)
            const { key: dealKey, deal } = buyerFound
            if (Date.now() > deal.expiresAt) {
                delete getDeals(rpgDB)[dealKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`⌛ Penawaran sudah kadaluarsa!`)
            }

            const seller = rpgDB.players[deal.sellerJid]
            const buyer  = rpgDB.players[senderJid]
            if (!seller) return Reply(`❌ Penjual tidak ditemukan!`)

            const sellerInv = seller.inventory || {}
            if (!sellerInv[deal.fishKey] || sellerInv[deal.fishKey] < deal.qty) {
                delete getDeals(rpgDB)[dealKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`❌ Transaksi batal — stok ikan penjual sudah tidak cukup!`)
            }
            if ((buyer.gold || 0) < deal.price) {
                delete getDeals(rpgDB)[dealKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`❌ Uangmu tidak cukup!\nButuh ${toRupiah(deal.price)}, kamu punya ${toRupiah(buyer.gold || 0)}.`)
            }

            sellerInv[deal.fishKey] -= deal.qty
            if (!buyer.inventory) buyer.inventory = {}
            buyer.inventory[deal.fishKey] = (buyer.inventory[deal.fishKey] || 0) + deal.qty
            buyer.gold  -= deal.price
            seller.gold += deal.price
            delete getDeals(rpgDB)[dealKey]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 🤝  TRANSAKSI BERHASIL  🤝\n\n  🐟 Ikan    : *${deal.fishDisp}* x${deal.qty}\n  💰 Harga   : *${toRupiah(deal.price)}*\n  📤 Penjual : @${deal.sellerJid.split('@')[0]}\n  📥 Pembeli : @${senderJid.split('@')[0]}\n\n\n✅ Kesepakatan tercapai!`,
                mentions: [deal.sellerJid, senderJid]
            }, { quoted: m })
        }

        // ── TOLAKIKAN ─────────────────────────────────────────────────
        if (command === 'tolakikan') {
            cleanExpiredDeals(rpgDB)
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            const buyerFound = findDealAsBuyer(rpgDB, senderJid)
            if (buyerFound) {
                delete getDeals(rpgDB)[buyerFound.key]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `❌ @${senderJid.split('@')[0]} menolak penawaran ikan dari @${buyerFound.deal.sellerJid.split('@')[0]}.\n\nDeal dibatalkan.`,
                    mentions: [senderJid, buyerFound.deal.sellerJid]
                }, { quoted: m })
            }

            const sellerFound = findDealAsSeller(rpgDB, senderJid)
            if (sellerFound) {
                delete getDeals(rpgDB)[sellerFound.key]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `❌ @${senderJid.split('@')[0]} membatalkan penawaran ikan ke @${sellerFound.deal.buyerJid.split('@')[0]}.`,
                    mentions: [senderJid, sellerFound.deal.buyerJid]
                }, { quoted: m })
            }

            return Reply(`❌ Tidak ada penawaran ikan yang aktif untukmu.`)
        }

        // ── BATALKANIKAN ──────────────────────────────────────────────
        if (command === 'batalkanikan') {
            cleanExpiredDeals(rpgDB)
            const sellerFound = findDealAsSeller(rpgDB, senderJid)
            if (sellerFound) {
                delete getDeals(rpgDB)[sellerFound.key]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `🚫 Penawaran ikan ke @${sellerFound.deal.buyerJid.split('@')[0]} dibatalkan oleh penjual.`,
                    mentions: [senderJid, sellerFound.deal.buyerJid]
                }, { quoted: m })
            }
            return Reply(`❌ Tidak ada penawaran aktif yang bisa dibatalkan.`)
        }

        // ── TAWARIKAN (negosiasi harga) ───────────────────────────────
        if (command === 'tawarikan') {
            cleanExpiredDeals(rpgDB)
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            const newHarga = parseInt(text?.trim()) || 0
            if (newHarga <= 0) return Reply(`❌ Format: *.tawarikan [harga]*\nContoh: *.tawarikan 3000*`)

            const buyerFound = findDealAsBuyer(rpgDB, senderJid)
            if (buyerFound) {
                const { key: dealKey, deal } = buyerFound
                if (Date.now() > deal.expiresAt) {
                    delete getDeals(rpgDB)[dealKey]
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    return Reply(`⌛ Penawaran sudah kadaluarsa!`)
                }
                if (deal.lastOfferBy === 'buyer') return Reply(`⏳ Tunggu penjual merespons tawaranmu dulu!`)
                deal.lastOfferBy = 'buyer'
                deal.price       = newHarga
                deal.expiresAt   = Date.now() + FISH_DEAL_TTL
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `✦ 💬  NEGOSIASI HARGA  💬\n\n  🐟 Ikan    : *${deal.fishDisp}* x${deal.qty}\n  💬 Tawaran baru: *${toRupiah(newHarga)}*\n  📥 Dari    : @${senderJid.split('@')[0]}\n\n\n@${deal.sellerJid.split('@')[0]} Pembeli menawar *${toRupiah(newHarga)}*\n\n✅ *.setujuikan* — terima\n❌ *.tolakikan* — tolak\n💬 *.tawarikan [harga]* — balas tawaran`,
                    mentions: [senderJid, deal.sellerJid]
                }, { quoted: m })
            }

            const sellerFound = findDealAsSeller(rpgDB, senderJid)
            if (sellerFound) {
                const { key: dealKey, deal } = sellerFound
                if (Date.now() > deal.expiresAt) {
                    delete getDeals(rpgDB)[dealKey]
                    fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                    return Reply(`⌛ Penawaran sudah kadaluarsa!`)
                }
                if (deal.lastOfferBy === 'seller') return Reply(`⏳ Tunggu pembeli merespons tawaranmu dulu!`)
                deal.lastOfferBy = 'seller'
                deal.price       = newHarga
                deal.expiresAt   = Date.now() + FISH_DEAL_TTL
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `✦ 💬  NEGOSIASI HARGA  💬\n\n  🐟 Ikan    : *${deal.fishDisp}* x${deal.qty}\n  💬 Tawaran baru: *${toRupiah(newHarga)}*\n  📤 Dari    : @${senderJid.split('@')[0]}\n\n\n@${deal.buyerJid.split('@')[0]} Penjual menawarkan *${toRupiah(newHarga)}*\n\n✅ *.setujuikan* — terima\n❌ *.tolakikan* — tolak\n💬 *.tawarikan [harga]* — balas tawaran`,
                    mentions: [senderJid, deal.buyerJid]
                }, { quoted: m })
            }

            return Reply(`❌ Tidak ada penawaran ikan aktif yang bisa dinegosiasi.`)
        }

// ── SHOPROD ───────────────────────────────────────────────────
if (command === 'shoprod') {
    if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
    const player = rpgDB.players[senderJid]
    if (!player.fishing) player.fishing = { lastCatch: 0, totalCatch: 0, equippedRod: 'starter_rod', equippedBait: null }

    // FIX: text sudah benar karena di-override di atas dari m.body
    const fullText = (text || '').toLowerCase()
    const parts = fullText.trim() ? fullText.trim().split(/\s+/) : []
    const action = parts[0] || ''
    const param = parts.slice(1).join(' ')

    // 🔥 BELI JORAN
    if (action === 'beli') {
        const rodId = param
        if (!rodId) {
            return Reply(`❌ Masukkan nama joran yang ingin dibeli!\nContoh: *.shoprod beli starter_rod*`)
        }
        
        const rod = ROD_DATA[rodId]
        if (!rod) {
            // Coba cari dengan fuzzy matching
            const availableRods = Object.keys(ROD_DATA)
            const suggestion = availableRods.find(r => r.includes(rodId) || rodId.includes(r))
            const suggestText = suggestion ? `\n\n💡 Maksud kamu: *.shoprod beli ${suggestion}*` : ''
            return Reply(`❌ Joran *${rodId}* tidak ada!${suggestText}\nKetik *.shoprod* untuk lihat daftar.`)
        }
        
        if (player.gold < rod.price) {
            return Reply(`❌ Uang kurang! Butuh ${toRupiah(rod.price)}, kamu punya ${toRupiah(player.gold)}.\n💸 Kurang: ${toRupiah(rod.price - player.gold)}`)
        }
        
        player.gold -= rod.price
        if (!player.inventory) player.inventory = {}
        const invKey = `rod_${rodId}`
        player.inventory[invKey] = (player.inventory[invKey] || 0) + 1
        
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        
        return Reply(`✦ ✅  JORAN DIBELI!  ✅\n\n  🎣 Joran  : ${rod.emoji} *${rod.name}* [Tier ${rod.tier}]\n  💰 Harga  : -${toRupiah(rod.price)}\n  💵 Sisa   : ${toRupiah(player.gold)}\n\n📌 Equip dengan: *.shoprod pasang ${rodId}* 🎣`)
    }

    // 🔥 PASANG JORAN
    if (action === 'pasang') {
        const rodId = param
        if (!rodId) {
            return Reply(`❌ Masukkan nama joran yang ingin dipasang!\nContoh: *.shoprod pasang lucky_rod*`)
        }
        
        const rod = ROD_DATA[rodId]
        if (!rod) {
            return Reply(`❌ Joran *${rodId}* tidak ditemukan!`)
        }
        
        const invKey = `rod_${rodId}`
        if (!player.inventory?.[invKey] || player.inventory[invKey] <= 0) {
            return Reply(`❌ Kamu tidak punya joran *${rod.name}*! Beli dulu dengan *.shoprod beli ${rodId}*`)
        }
        
        player.fishing.equippedRod = rodId
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        
        return Reply(`✦ ✅  JORAN DIPASANG!  ✅\n\n  🎣 Joran  : ${rod.emoji} *${rod.name}* [Tier ${rod.tier}]\n  🎯 Boost  : +${rod.boost} (peluang ikan langka)\n  📝 ${rod.desc}\n\nSekarang kamu bisa mancing dengan joran baru! 🎣`)
    }

    // 🔥 TAMPILAN MENU TOKO (default)
    const tierOrder = ['C', 'B', 'A', 'S', 'S+', 'SS', 'SSS', 'ABSOLUTE']
    const equippedRodId = player.fishing?.equippedRod || 'starter_rod'
    const equippedRod = ROD_DATA[equippedRodId] || ROD_DATA.starter_rod
    
    let txt = `✦ 🎣  TOKO JORAN  🎣\n\n`
    txt += `  🎣 Joran aktif : ${equippedRod.emoji} *${equippedRod.name}* [Tier ${equippedRod.tier}]\n`
    txt += `  🎯 Boost aktif : +${equippedRod.boost}\n\n`
    
    for (const tier of tierOrder) {
        const rods = Object.entries(ROD_DATA).filter(([,r]) => r.tier === tier)
        if (!rods.length) continue
        txt += `  ▸ *TIER ${tier}*\n`
        for (const [id, r] of rods) {
            const owned = player.inventory?.[`rod_${id}`] > 0 ? ' ✅ (dimiliki)' : ''
            txt += `  ${r.emoji} *${r.name}*${owned}\n`
            txt += `    💰 ${toRupiah(r.price)} | 🎯 Boost +${r.boost}\n`
            txt += `    📝 ${r.desc}\n`
            txt += `    ↳ *.shoprod beli ${id}*\n\n`
        }
    }
    
    txt += `\n💵 Saldo kamu : ${toRupiah(player.gold)}\n`
    txt += `📌 *.shoprod pasang [id]* — equip joran yang sudah dimiliki`
    
    return Reply(txt)
}

// ── SHOPBOMBER ────────────────────────────────────────────────
if (command === 'shopbomber') {
    if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
    const player = rpgDB.players[senderJid]
    if (!player.fishing) player.fishing = { lastCatch: 0, totalCatch: 0, equippedRod: 'starter_rod', equippedBait: null }

    // FIX: text sudah benar dari m.body override di atas
    const fullText = (text || '').toLowerCase()
    const parts = fullText.trim() ? fullText.trim().split(/\s+/) : []
    const action = parts[0] || ''
    const param = parts.slice(1).join(' ')

    // BELI UMPAN
    if (action === 'beli') {
        const paramParts = param.split(/\s+/)
        const baitId = paramParts[0]
        const buyQty = parseInt(paramParts[1]) || 1
        
        if (!baitId) {
            return Reply(`❌ Masukkan nama umpan yang ingin dibeli!\nContoh: *.shopbomber beli basic_bait 5*`)
        }
        
        const bait = BAIT_DATA[baitId]
        if (!bait) {
            return Reply(`❌ Umpan *${baitId}* tidak ada!\nKetik *.shopbomber* untuk lihat daftar.`)
        }
        
        const totalCost = bait.price * buyQty
        if (player.gold < totalCost) {
            return Reply(`❌ Uang kurang! Butuh ${toRupiah(totalCost)}, kamu punya ${toRupiah(player.gold)}.`)
        }
        
        player.gold -= totalCost
        if (!player.inventory) player.inventory = {}
        const invKey = `bait_${baitId}`
        player.inventory[invKey] = (player.inventory[invKey] || 0) + buyQty
        
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        
        return Reply(`✦ ✅  UMPAN DIBELI!  ✅\n\n  🪱 Umpan  : ${bait.emoji} *${bait.name}* x${buyQty} [Tier ${bait.tier}]\n  💰 Harga  : -${toRupiah(totalCost)}\n  💵 Sisa   : ${toRupiah(player.gold)}\n\n📌 Pasang dengan: *.shopbomber pasang ${baitId}* 🪱`)
    }

    // PASANG UMPAN
    if (action === 'pasang') {
        const baitId = param
        if (!baitId) {
            return Reply(`❌ Masukkan nama umpan yang ingin dipasang!\nContoh: *.shopbomber pasang chroma_bait*`)
        }
        
        const bait = BAIT_DATA[baitId]
        if (!bait) {
            return Reply(`❌ Umpan *${baitId}* tidak ditemukan!`)
        }
        
        const invKey = `bait_${baitId}`
        if (!player.inventory?.[invKey] || player.inventory[invKey] <= 0) {
            return Reply(`❌ Kamu tidak punya umpan *${bait.name}*! Beli dulu dengan *.shopbomber beli ${baitId}*`)
        }
        
        player.fishing.equippedBait = baitId
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        
        return Reply(`✦ ✅  UMPAN DIPASANG!  ✅\n\n  🪱 Umpan  : ${bait.emoji} *${bait.name}* [Tier ${bait.tier}]\n  🧬 Mut.Boost : +${bait.mutBoost}\n  📝 ${bait.desc}\n\nSekarang mancing dengan umpan ini! 🎣`)
    }

    // LEPAS UMPAN
    if (action === 'lepas') {
        player.fishing.equippedBait = null
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        return Reply(`✅ Umpan dilepas. Mancing tanpa umpan.`)
    }

    // TAMPILAN MENU TOKO
    const tierOrder2 = ['B', 'A', 'S', 'S+', 'SS', 'SSS', 'ABSOLUTE']
    const activeBaitId = player.fishing?.equippedBait
    const activeBait = activeBaitId ? BAIT_DATA[activeBaitId] : null
    
    let txt = `✦ 🪱  TOKO UMPAN / BOMBER  🪱\n\n`
    txt += `  🪱 Umpan aktif : ${activeBait ? `${activeBait.emoji} *${activeBait.name}*` : '❌ Tidak ada'}\n`
    if (activeBait) txt += `  🧬 Mut.Boost   : +${activeBait.mutBoost}\n`
    txt += `\n`
    
    for (const tier of tierOrder2) {
        const baits = Object.entries(BAIT_DATA).filter(([,b]) => b.tier === tier)
        if (!baits.length) continue
        txt += `  ▸ *TIER ${tier}*\n`
        for (const [id, b] of baits) {
            const stock = player.inventory?.[`bait_${id}`] || 0
            txt += `  ${b.emoji} *${b.name}* (stok: ${stock})\n`
            txt += `    💰 ${toRupiah(b.price)}/pcs | 🧬 Mut.Boost +${b.mutBoost}\n`
            txt += `    📝 ${b.desc}\n`
            txt += `    ↳ *.shopbomber beli ${id} [qty]*\n\n`
        }
    }
    
    txt += `\n💵 Saldo : ${toRupiah(player.gold)}\n`
    txt += `📌 *.shopbomber pasang [id]* — equip umpan\n`
    txt += `📌 *.shopbomber lepas* — lepas umpan`
    
    return Reply(txt)
}

        // ── TOPMANCING ────────────────────────────────────────────────
        if (command === 'topmancing') {
            const fishers = Object.entries(rpgDB.players)
                .filter(([,p]) => p.fishing && (p.fishing.totalCatch || 0) > 0)
                .sort(([,a], [,b]) => (b.fishing.totalCatch || 0) - (a.fishing.totalCatch || 0))
                .slice(0, 10)
            if (!fishers.length) return Reply(`Belum ada pemancing! Mancing dulu dengan .mancing`)
            const rows = fishers.map(([jid, p], i) => ({
                rank: i+1,
                label: jid.split('@')[0],
                value: `${p.fishing.totalCatch || 0} ekor`,
                extra: ROD_DATA[p.fishing.equippedRod || 'starter_rod']?.name || 'Starter Rod'
            }))
            const imgBuf = await generateLeaderboardCanvas('TOP PEMANCING', 'Total Tangkapan Ikan', rows)
            if (imgBuf) {
                return alip.sendMessage(m.chat, { image: imgBuf, caption: 'Mau masuk list? Mancing sekarang dengan .mancing!' }, { quoted: m })
            }
            let txt = `TOP PEMANCING\n\n`
            const mentions = []
            fishers.forEach(([jid, p], i) => {
                txt += `  ${i+1}. @${jid.split('@')[0]} - ${p.fishing.totalCatch||0} ekor\n`
                mentions.push(jid)
            })
            return alip.sendMessage(m.chat, { text: txt, mentions }, { quoted: m })
        }

        if (command === 'judionline') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.gold < 100) return Reply("❌ duit lu kurang buat deposit, minimal Rp. 100!")
            player.gold -= 100
            const hasil = [
                { nama: "MAXWIN! Lu dapet jackpot besar!", exp: 300, gold: 15000, hp: 0 },
                { nama: "Rungkad... Saldo ludes dimakan bandot.", exp: 40, gold: 0, hp: -5 },
                { nama: "Menang tipis, balik modal aja.", exp: 20, gold: 500, hp: 0 },
                { nama: "Kalah beruntun sampe harus jual ginjal.", exp: 20, gold: -50, hp: -10 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
✦ ── 🎰  JUDI ONLINE  🎰 ──
  💬 Hasil   : ${reward.nama}
  💵 Gold    : ${reward.gold >= 0 ? "+" : ""}${toRupiah(Math.abs(reward.gold))}
  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
  💵 sisa: ${toRupiah(player.gold)}

${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}
judi gak baik, tapi ini cuma game~`)
            return
        }

        if (command === 'begal') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 25) return Reply("❌ badan lu pegel, gak kuat ngeberhentiin motor orang!")
            const hasil = [
                { nama: "berhasil rampok HP kentang", exp: 100, gold: 2000, hp: -10 },
                { nama: "targetnya ngelawan, lu bonyok", exp: 40, gold: 100, hp: -25 },
                { nama: "target ternyata anggota TNI, lari terbirit", exp: 20, gold: 0, hp: -15 },
                { nama: "sukses besar, dapet laptop hasil COD", exp: 200, gold: 5000, hp: -15 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
🔪 BEGAL JALANAN
  💵 +${toRupiah(reward.gold)}

  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}`)
            return
        }

        if (command === 'maling') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 15) return Reply("❌ lu terlalu lemes buat gerak cepet!")
            const hasil = [
                { nama: "berhasil nyolong dompet emak-emak", exp: 80, gold: 1500, hp: -5 },
                { nama: "ketahuan warga & digebukin", exp: 20, gold: 0, hp: -20 },
                { nama: "cuma dapet kotak kosong", exp: 10, gold: 50, hp: -3 },
                { nama: "salah sasaran, nyolong dompet polisi", exp: 40, gold: 0, hp: -30 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
🥷 *MALING MALAM*
  💵 +${toRupiah(reward.gold)}

  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}`)
            return
        }

        if (command === 'ngojek') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 8) return Reply("❌ lu capek banget, gak kuat narik ojek!")
            const hasil = [
                { nama: "dapet orderan jauh", exp: 50, gold: 700, hp: -8 },
                { nama: "dapet orderan deket", exp: 30, gold: 400, hp: -5 },
                { nama: "kecelakaan kecil", exp: 20, gold: 100, hp: -15 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
🛵 *NGOJEK*
  💵 +${toRupiah(reward.gold)}

  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}`)
            return
        }

        if (command === 'ngaji') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 3) return Reply("❌ ngantuk berat, gak fokus ngaji!")
            const hasil = [
                { nama: "hati lu tenang", exp: 20, gold: 0, hp: 10 },
                { nama: "dapet ilmu baru", exp: 15, gold: 0, hp: 5 },
                { nama: "ketiduran pas ngaji", exp: 5, gold: 0, hp: -3 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp > player.maxHp) player.hp = player.maxHp
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
📖 NGAJI
  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp > 0 ? "+" : ""}${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}
ngaji bikin tenang, jangan lupa istiqomah~`)
            return
        }

        if (command === 'kerja') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 8) return Reply("❌ capek, gak bisa kerja!")
            const hasil = [
                { nama: "lembur dapet bonus", exp: 80, gold: 1500, hp: -10 },
                { nama: "kerja santai tapi gaji kecil", exp: 40, gold: 800, hp: -5 },
                { nama: "dimarahin bos", exp: 20, gold: 400, hp: -8 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
💼 KERJA
  💵 +${toRupiah(reward.gold)}

  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}`)
            return
        }

        if (command === 'jobkerja') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 8) return Reply("❌ capek, gak bisa kerja part time!")
            const hasil = [
                { nama: "jadi kuli bangunan", exp: 60, gold: 1200, hp: -12 },
                { nama: "jadi admin warnet", exp: 50, gold: 700, hp: -7 },
                { nama: "kerja part-time di kafe", exp: 70, gold: 900, hp: -10 }
            ]
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            Reply(`
🧑‍🔧 KERJA PART TIME
  💵 +${toRupiah(reward.gold)}

  ⭐ exp: +${reward.exp}
  ❤️ hp: ${reward.hp}
${leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""}`)
            return
        }

        if (command === 'berkebun') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 6) return Reply("🌱 LU MAU BERKEBUN PAKE TANGAN GEMETER? ISTIRAHAT DULU!")
            
            const hasil = [
                { nama: "panen padi banjir", exp: 100, gold: 1200, hp: -10 },
                { nama: "dapet sayur mayur", exp: 60, gold: 700, hp: -5 },
                { nama: "tanaman dimakan hama", exp: 30, gold: 300, hp: -7 }
            ]
            
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            
            let levelUpMsg = leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""
            
            Reply(`
✦ ── 🌽  BERKEBUN  🌽 ──
  🌱 Hasil   : ${reward.nama}
  💵 Gold    : +${toRupiah(reward.gold)}
  ⭐ EXP     : +${reward.exp}
  ❤️  HP      : ${reward.hp}
${levelUpMsg}`)
            return
        }

        if (command === 'ngocok') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 5) return Reply("🥵 LU MAU NGOCOK PAKE TANGAN LEMEK? ISTIRAHAT DULU BANGSAT!")
            
            const hasil = [
                { nama: "keluar deras tapi lemes", exp: 5, gold: 10, hp: -3 },
                { nama: "tidur di wc sambil mimpi basah", exp: 2, gold: 5, hp: -5 },
                { nama: "dapet ide ngentot", exp: 8, gold: 15, hp: -2 }
            ]
            
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            
            let levelUpMsg = leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""
            
            Reply(`
✦ ── 🍆  NGOCOK  🍆 ──
  💬 Hasil   : ${reward.nama}
  💵 Gold    : +${toRupiah(reward.gold)}
  ⭐ EXP     : +${reward.exp}
  🥵 Tenaga  : ${reward.hp}
${levelUpMsg}`)
            return
        }

        if (command === 'ngelonte') {
            
                

            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 10) return Reply("💀 LU UDAH REBO, MAU NGELONTE PAKE TONGKAT?")
            
            const hasil = [
                { nama: "dapet om-om kaya raya", exp: 20, gold: 100, hp: -10 },
                { nama: "dapet banci kere hina", exp: 10, gold: 20, hp: -5 },
                { nama: "dikejar satpol pp sambil digebuk", exp: 15, gold: 0, hp: -15 }
            ]
            
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            
            let levelUpMsg = leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""
            
            Reply(`
✦ ── 👊  NGELONTE  👊 ──
  💬 Hasil   : ${reward.nama}
  💵 Gold    : +${toRupiah(reward.gold)}
  ⭐ EXP     : +${reward.exp}
  🩸 Darah   : ${reward.hp}
${levelUpMsg}`)
            return
        }

        if (command === 'openbo') {
            
                
            let jid = m.sender
            if (!rpgDB.players[jid]) rpgDB.players[jid] = initPlayerRPG(jid)
            let player = rpgDB.players[jid]
            if (player.hp < 10) return Reply("💢 LU MAU OPENBO PAKE KEMEK LELAH? MINUM DULU!")
            
            const hasil = [
                { nama: "dapet om-om sultan minta diempuk", exp: 30, gold: 200, hp: -15 },
                { nama: "dapet bocil kenthu abalabal", exp: 10, gold: 5, hp: -5 },
                { nama: "ditipu customer busuk", exp: 5, gold: 0, hp: -20 }
            ]
            
            let reward = hasil[Math.floor(Math.random() * hasil.length)]
            player.hp += reward.hp
            if (player.hp < 0) player.hp = 0
            player.gold += reward.gold
            let leveled = gainExp(player, reward.exp)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            
            
            let levelUpMsg = leveled ? `\n🎊 *LEVEL UP!* level ${player.level}` : ""
            
            Reply(`
✦ ── 💦  OPEN BO  💦 ──
  💬 Hasil   : ${reward.nama}
  💵 Gold    : +${toRupiah(reward.gold)}
  ⭐ EXP     : +${reward.exp}
  🍌 Kemek   : ${reward.hp}
${levelUpMsg}`)
            return
        }

        if (command === 'market') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            saveMarketDB(marketDB)
            const player = rpgDB.players[senderJid]
            const _mktArgs = text ? text.trim().split(' ') : []
            const sub = _mktArgs[0]?.toLowerCase()

            if (!sub || sub === 'menu') {
                return Reply(`
✦ ── 📈  MARKET GLOBAL  📈 ──
  *.market saham*      — 📊 Bursa saham
  *.market properti*   — 🏠 Properti & gedung
  *.market kendaraan*  — 🚗 Kendaraan
  *.market asetku*     — 💼 Aset milikmu
  *.market listings*   — 📋 Listing player

📋 *CARA BELI:*
  Saham    : *.belimarket saham ALIP 5*
             (beli 5 lot saham ALIP)
  Properti : *.belimarket properti warung*
  Kendaraan: *.belimarket kendaraan motor*
  Listing  : *.belimarket listing 1*

📋 *CARA JUAL:*
  Saham    : *.jualsaham ALIP 3* (jual 3 lot)
  Aset lain: *.jualaset properti warung*
           : *.jualaset kendaraan motor*
  Ke bot   : *.jualasetbot saham ALIP 1*

📋 *CEK HARGA SAHAM:*
  *.ceksaham* / *.ceksaham ALIP*

💼 *CEK ASET:* *.market asetku*
💵 Saldo: ${toRupiah(player.gold)}`)
            }

            if (sub === 'saham') {
                let t = `✦ 📊  BURSA SAHAM  📊\n\n  🕐 Harga update otomatis tiap 5 menit\n\n`
                for (const [ticker, s] of Object.entries(marketDB.saham)) {
                    const arrow = s.change > 0 ? '📈' : s.change < 0 ? '📉' : '➡️'
                    t += `  *${ticker}* — ${toRupiah(s.price)}/lot ${arrow}${s.change > 0 ? '+' : ''}${s.change}%\n`
                    t += `  ↳ ${s.name} (${s.category})\n`
                    t += `  ↳ 🛒 Beli: *.belimarket saham ${ticker} [lot]*\n\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                t += `\n\n📌 *Contoh:* *.belimarket saham ALIP 5*`
                t += `\n📌 Cek detail: *.ceksaham ${Object.keys(marketDB.saham)[0] || 'ALIP'}*`
                return Reply(t)
            }

            if (sub === 'properti') {
                let t = `✦ 🏠  DAFTAR PROPERTI  🏠\n\n`
                for (const [id, p] of Object.entries(marketDB.properti)) {
                    t += `  *${p.name}* — ${toRupiah(p.price)}\n`
                    t += `  ↳ ${p.description}\n`
                    if (p.passive > 0) t += `  ↳ 💰 passive: +${toRupiah(p.passive)}/hari\n`
                    t += `  ↳ 🛒 Cara beli: *.belimarket properti ${id}*\n\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                return Reply(t)
            }

            if (sub === 'kendaraan') {
                let t = `✦ 🚗  DAFTAR KENDARAAN  🚗\n\n`
                for (const [id, k] of Object.entries(marketDB.kendaraan)) {
                    t += `  *${k.name}* — ${toRupiah(k.price)}\n`
                    t += `  ↳ ${k.description}\n`
                    if (k.passive > 0) t += `  ↳ 💰 passive: +${toRupiah(k.passive)}/hari\n`
                    t += `  ↳ 🛒 Cara beli: *.belimarket kendaraan ${id}*\n\n`
                }
                t += `\n💵 saldo: ${toRupiah(player.gold)}`
                t += `\n\n📌 *CARA PAKAI KENDARAAN:*`
                t += `\n  Setelah beli → otomatis masuk aset kamu`
                t += `\n  Cek aset: *.market asetku*`
                t += `\n  Passive income aktif otomatis tiap hari`
                t += `\n  Jual balik: *.jualasetbot kendaraan [id] 1*`
                return Reply(t)
            }

            if (sub === 'asetku') {
                const assets = player.assets || { saham: {}, properti: {}, kendaraan: {} }
                const bankAssets = player.bankAssets || { saham: {}, properti: {}, kendaraan: {} }
                let t = `✦ 💼  ASET MILIKMU  💼\n\n`
                t += `  💵 dompet: ${toRupiah(player.gold)}\n`
                t += `  🏦 bank: ${toRupiah(player.bank?.balance || 0)}\n\n`
                let hasAsset = false

                const sahamW = Object.entries(assets.saham || {}).filter(([,q]) => q > 0)
                if (sahamW.length > 0) {
                    hasAsset = true
                    t += `  📊 *SAHAM (dompet)*\n`
                    for (const [ticker, qty] of sahamW) {
                        const harga = marketDB.saham[ticker]?.price || 0
                        t += `  ${ticker} x${qty} = ${toRupiah(harga * qty)}\n`
                    }
                    t += `\n`
                }
                const sahamB = Object.entries(bankAssets.saham || {}).filter(([,q]) => q > 0)
                if (sahamB.length > 0) {
                    hasAsset = true
                    t += `  📊 *SAHAM (bank)*\n`
                    for (const [ticker, qty] of sahamB) {
                        const harga = marketDB.saham[ticker]?.price || 0
                        t += `  ${ticker} x${qty} = ${toRupiah(harga * qty)}\n`
                    }
                    t += `\n`
                }
                const propW = Object.entries(assets.properti || {}).filter(([,q]) => q > 0)
                if (propW.length > 0) {
                    hasAsset = true
                    t += `  🏠 *PROPERTI (dompet)*\n`
                    for (const [id, qty] of propW) {
                        const harga = marketDB.properti[id]?.price || 0
                        t += `  ${marketDB.properti[id]?.name || id} x${qty} = ${toRupiah(harga * qty)}\n`
                    }
                    t += `\n`
                }
                const kendarW = Object.entries(assets.kendaraan || {}).filter(([,q]) => q > 0)
                if (kendarW.length > 0) {
                    hasAsset = true
                    t += `  🚗 *KENDARAAN (dompet)*\n`
                    for (const [id, qty] of kendarW) {
                        const harga = marketDB.kendaraan[id]?.price || 0
                        t += `  ${marketDB.kendaraan[id]?.name || id} x${qty} = ${toRupiah(harga * qty)}\n`
                    }
                }
                if (!hasAsset) t += `  belum punya aset...\n`
                const totalNet = calcTotalAssets(player, marketDB)
                t += `\n\n💎 *NET WORTH: ${toRupiah(totalNet)}*`
                return Reply(t)
            }

            if (sub === 'listings') {
                const listings = marketDB.listings || []
                if (listings.length === 0) return Reply(`📋 *LISTING KOSONG* — Belum ada yang jual aset saat ini.`)
                let t = `✦ 📋  LISTING PLAYER  📋\n\n`
                listings.forEach((l, i) => {
                    t += `  *#${i + 1}* ${l.assetName} (${l.category})\n`
                    t += `  ↳ qty: ${l.qty} | harga: ${toRupiah(l.price)}\n`
                    t += `  ↳ penjual: @${l.seller.split('@')[0]}\n`
                    t += `  ↳ *.beli listing ${i + 1}*\n\n`
                })
                                return await alip.sendMessage(m.chat, { text: t, mentions: listings.map(l => l.seller) }, { quoted: m })
            }

            if (sub === 'jual') {
                return Reply(`
✦ ── 🏪  JUAL ASET KE PLAYER  🏪 ──
  *.jualaset saham [TICKER] [qty] [harga]*
  *.jualaset properti [id] [qty] [harga]*
  *.jualaset kendaraan [id] [qty] [harga]*
Contoh: *.jualaset saham ALIP 5 6000*
Aset akan muncul di *.market listings* 📋`)
            }
        }

      // ── GANTI handler 'beli' yang ada di bagian MARKET dengan ini ──
if (command === 'belimarket' || (command === 'beli' && text && (text.includes('saham') || text.includes('properti') || text.includes('kendaraan') || text.includes('listing')))) {
    // Handler untuk MARKET (saham, properti, kendaraan, listing)
    if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
    let marketDB = getMarketDB()
    marketDB = fluctuateSaham(marketDB)
    const player = rpgDB.players[senderJid]
    if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }

    const _beliArgs = text ? text.trim().split(' ') : []
    const cat = _beliArgs[0]?.toLowerCase()
    const idRaw = _beliArgs[1]
    const qty = parseInt(_beliArgs[2]) || 1

    if (!cat || !idRaw) {
        return Reply(`Gunakan:\n*.beli saham [TICKER] [lot]*\n*.beli properti [id]*\n*.beli kendaraan [id]*\n*.beli listing [no]*`)
    }

    if (cat === 'saham') {
        const id = idRaw.toUpperCase()
        if (!marketDB.saham[id]) return Reply(`❌ saham *${id}* gak ada! cek *.market saham*`)
        const saham = marketDB.saham[id]
        const totalHarga = saham.price * qty
        if (player.gold < totalHarga) return Reply(`❌ uang kurang! butuh ${toRupiah(totalHarga)}, punya ${toRupiah(player.gold)}`)
        player.gold -= totalHarga
        if (!player.assets.saham) player.assets.saham = {}
        player.assets.saham[id] = (player.assets.saham[id] || 0) + qty
        saveMarketDB(marketDB)
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        return Reply(`✅ *BELI SAHAM BERHASIL*
  📊 ${saham.name} (${id})
  💹 qty: ${qty} lot
  💵 total: ${toRupiah(totalHarga)}
  💰 sisa: ${toRupiah(player.gold)}
cek aset di *.market asetku*`)
    }

    if (cat === 'properti') {
        const id = idRaw.toLowerCase()
        if (!marketDB.properti[id]) return Reply(`❌ properti *${id}* gak ada! cek *.market properti*`)
        const prop = marketDB.properti[id]
        const totalHarga = prop.price * qty
        if (player.gold < totalHarga) return Reply(`❌ uang kurang! butuh ${toRupiah(totalHarga)}, punya ${toRupiah(player.gold)}`)
        player.gold -= totalHarga
        if (!player.assets.properti) player.assets.properti = {}
        player.assets.properti[id] = (player.assets.properti[id] || 0) + qty
        saveMarketDB(marketDB)
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        return Reply(`✅ *BELI PROPERTI BERHASIL*
  🏠 ${prop.name}
  💵 total: ${toRupiah(totalHarga)}
  💰 sisa: ${toRupiah(player.gold)}
${prop.passive > 0 ? `  💰 passive income: +${toRupiah(prop.passive)}/hari\n` : ''}`)
    }

    if (cat === 'kendaraan') {
        const id = idRaw.toLowerCase()
        if (!marketDB.kendaraan[id]) return Reply(`❌ kendaraan *${id}* gak ada! cek *.market kendaraan*`)
        const kendaraan = marketDB.kendaraan[id]
        const totalHarga = kendaraan.price * qty
        if (player.gold < totalHarga) return Reply(`❌ uang kurang! butuh ${toRupiah(totalHarga)}, punya ${toRupiah(player.gold)}`)
        player.gold -= totalHarga
        if (!player.assets.kendaraan) player.assets.kendaraan = {}
        player.assets.kendaraan[id] = (player.assets.kendaraan[id] || 0) + qty
        saveMarketDB(marketDB)
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        return Reply(`✅ *BELI KENDARAAN BERHASIL*
  🚗 ${kendaraan.name}
  💵 total: ${toRupiah(totalHarga)}
  💰 sisa: ${toRupiah(player.gold)}`)
    }

    if (cat === 'listing') {
        const no = parseInt(idRaw) - 1
        const listings = marketDB.listings || []
        if (no < 0 || no >= listings.length) return Reply(`❌ nomor listing gak valid! cek *.market listings*`)
        const listing = listings[no]
        if (listing.seller === m.sender) return Reply(`❌ lu gak bisa beli listing sendiri!`)
        if (player.gold < listing.price) return Reply(`❌ uang kurang! butuh ${toRupiah(listing.price)}, punya ${toRupiah(player.gold)}`)
        player.gold -= listing.price
        const sellerPlayer = rpgDB.players[listing.seller]
        if (sellerPlayer) sellerPlayer.gold += listing.price
        if (!player.assets[listing.category]) player.assets[listing.category] = {}
        player.assets[listing.category][listing.assetId] = (player.assets[listing.category][listing.assetId] || 0) + listing.qty
        marketDB.listings.splice(no, 1)
        saveMarketDB(marketDB)
        fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
        return Reply(`✅ *BELI LISTING BERHASIL*
  📦 ${listing.assetName} x${listing.qty}
  💵 dibayar: ${toRupiah(listing.price)}
  💰 sisa: ${toRupiah(player.gold)}`)
    }

    return Reply(`❌ kategori gak valid! gunakan: saham / properti / kendaraan / listing`)
}

        if (command === 'jualsaham') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            if (!player.bankAssets) player.bankAssets = { saham: {}, properti: {}, kendaraan: {} }

            const _jsArgs = text ? text.trim().split(' ') : []
            const ticker = _jsArgs[0]?.toUpperCase()
            const qty = parseInt(_jsArgs[1]) || 1
            if (!ticker) return Reply(`Gunakan: *.jualsaham [TICKER] [lot]*\nContoh: .jualsaham ALIP 5`)
            if (!marketDB.saham[ticker]) return Reply(`❌ saham *${ticker}* gak ada!`)

            const ownedWallet = player.assets.saham[ticker] || 0
            const ownedBank = player.bankAssets.saham?.[ticker] || 0
            const totalOwned = ownedWallet + ownedBank
            if (totalOwned < qty) return Reply(`❌ lu cuma punya ${totalOwned} lot saham ${ticker}!`)

            let fromWallet = Math.min(qty, ownedWallet)
            let fromBank = qty - fromWallet
            player.assets.saham[ticker] = ownedWallet - fromWallet
            if (fromBank > 0) player.bankAssets.saham[ticker] = ownedBank - fromBank

            const harga = marketDB.saham[ticker].price
            const total = Math.floor(harga * qty * 0.95)
            player.gold += total
            saveMarketDB(marketDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`💵 *JUAL SAHAM BERHASIL*
  📊 ${marketDB.saham[ticker].name} (${ticker})
  💹 qty: ${qty} lot
  💵 diterima: ${toRupiah(total)} (fee 5%)
  💰 saldo: ${toRupiah(player.gold)}`)
        }

        if (command === 'jualaset') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }

            const _jaArgs = text ? text.trim().split(' ') : []
            const cat = _jaArgs[0]?.toLowerCase()
            const id = cat === 'saham' ? _jaArgs[1]?.toUpperCase() : _jaArgs[1]?.toLowerCase()
            const qty = parseInt(_jaArgs[2]) || 1
            const hargaJual = parseInt(_jaArgs[3])

            if (!cat || !id || !hargaJual) {
                return Reply(`Gunakan:\n*.jualaset saham [TICKER] [qty] [harga]*\n*.jualaset properti [id] [qty] [harga]*\n*.jualaset kendaraan [id] [qty] [harga]*`)
            }

            if (!['saham', 'properti', 'kendaraan'].includes(cat)) return Reply(`❌ kategori salah!`)
            const owned = player.assets[cat]?.[id] || 0
            if (owned < qty) return Reply(`❌ aset tidak cukup! punya ${owned}, mau jual ${qty}`)
            if (!marketDB.listings) marketDB.listings = []
            if (marketDB.listings.filter(l => l.seller === m.sender).length >= 5) {
                return Reply(`❌ maksimal 5 listing aktif sekaligus!`)
            }

            let assetName = id
            if (cat === 'saham' && marketDB.saham[id]) assetName = `${marketDB.saham[id].name} (${id})`
            else if (marketDB[cat]?.[id]) assetName = marketDB[cat][id].name

            player.assets[cat][id] -= qty
            marketDB.listings.push({
                seller: m.sender,
                category: cat,
                assetId: id,
                assetName,
                qty,
                price: hargaJual,
                listedAt: Date.now()
            })
            saveMarketDB(marketDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✅ *LISTING BERHASIL*
  📦 ${assetName} x${qty}
  💵 harga: ${toRupiah(hargaJual)}
  👁️ tampil di *.market listings*
listing aktif max 5`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .jualasetbot — jual aset ke sistem bot
        // ─────────────────────────────────────────────
        if (command === 'jualasetbot') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            if (!player.bankAssets) player.bankAssets = { saham: {}, properti: {}, kendaraan: {} }

            const _jabArgs = text ? text.trim().split(' ') : []
            const cat = _jabArgs[0]?.toLowerCase()
            const id = cat === 'saham' ? _jabArgs[1]?.toUpperCase() : _jabArgs[1]?.toLowerCase()
            const qty = parseInt(_jabArgs[2]) || 1

            if (!cat || !id) {
                return Reply(`🏦 *JUAL ASET KE BOT SISTEM*
  *.jualasetbot saham [TICKER] [lot]*
  *.jualasetbot properti [id] [qty]*
  *.jualasetbot kendaraan [id] [qty]*
fee: saham 5% | properti 10% | kendaraan 15%
harga mengikuti market saat ini`)
            }

            if (!['saham', 'properti', 'kendaraan'].includes(cat)) return Reply(`❌ kategori salah! saham / properti / kendaraan`)

            const ownedWallet = player.assets[cat]?.[id] || 0
            const ownedBank   = player.bankAssets[cat]?.[id] || 0
            const totalOwned  = ownedWallet + ownedBank
            if (totalOwned < qty) return Reply(`❌ aset tidak cukup! total punya ${totalOwned}, mau jual ${qty}`)

            let hargaSatuan = 0
            let assetName = id
            let fee = 0
            if (cat === 'saham') {
                if (!marketDB.saham[id]) return Reply(`❌ saham *${id}* tidak ada di bursa!`)
                hargaSatuan = marketDB.saham[id].price
                assetName = `${marketDB.saham[id].name} (${id})`
                fee = 0.05
            } else if (cat === 'properti') {
                if (!marketDB.properti[id]) return Reply(`❌ properti *${id}* tidak ada!`)
                hargaSatuan = marketDB.properti[id].price
                assetName = marketDB.properti[id].name
                fee = 0.10
            } else if (cat === 'kendaraan') {
                if (!marketDB.kendaraan[id]) return Reply(`❌ kendaraan *${id}* tidak ada!`)
                hargaSatuan = marketDB.kendaraan[id].price
                assetName = marketDB.kendaraan[id].name
                fee = 0.15
            }

            const grossTotal = hargaSatuan * qty
            const feeAmount  = Math.floor(grossTotal * fee)
            const netTotal   = grossTotal - feeAmount

            // Kurangi dari wallet dulu, sisanya dari bank
            let fromWallet = Math.min(qty, ownedWallet)
            let fromBank   = qty - fromWallet
            player.assets[cat][id] = ownedWallet - fromWallet
            if (fromBank > 0) {
                if (!player.bankAssets[cat]) player.bankAssets[cat] = {}
                player.bankAssets[cat][id] = (player.bankAssets[cat][id] || 0) - fromBank
            }

            player.gold += netTotal
            saveMarketDB(marketDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`💰 *JUAL KE BOT BERHASIL*
  📦 ${assetName} x${qty}
  💵 harga satuan: ${toRupiah(hargaSatuan)}
  💸 fee (${Math.floor(fee * 100)}%): -${toRupiah(feeAmount)}
  ✅ diterima: ${toRupiah(netTotal)}
  💰 saldo: ${toRupiah(player.gold)}
jual ke player via *.jualaset* untuk harga lebih baik!`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .batallisting [no] — batalkan listing
        // ─────────────────────────────────────────────
        if (command === 'batallisting') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }

            const no = parseInt(text) - 1
            const listings = marketDB.listings || []
            if (isNaN(no) || no < 0 || no >= listings.length) {
                // Tampilkan listing milik sender
                const myListings = listings
                    .map((l, i) => ({ ...l, no: i + 1 }))
                    .filter(l => l.seller === m.sender)
                if (myListings.length === 0) return Reply(`📋 lu gak punya listing aktif!\njual aset dengan *.jualaset*`)
                let t = `📋 *LISTING AKTIFMU*
`
                myListings.forEach(l => {
                    t += `  #${l.no} ${l.assetName} x${l.qty} — ${toRupiah(l.price)}\n`
                })
                t += `\nbatalin: *.batallisting [nomor]*`
                return Reply(t)
            }

            const listing = listings[no]
            if (listing.seller !== m.sender) return Reply(`❌ itu bukan listing lu!`)

            // Kembalikan aset
            if (!player.assets[listing.category]) player.assets[listing.category] = {}
            player.assets[listing.category][listing.assetId] = (player.assets[listing.category][listing.assetId] || 0) + listing.qty
            marketDB.listings.splice(no, 1)
            saveMarketDB(marketDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✅ *LISTING DIBATALKAN*
  📦 ${listing.assetName} x${listing.qty} kembali ke dompet`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .ceksaham [TICKER] — cek detail saham
        // ─────────────────────────────────────────────
        if (command === 'ceksaham') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            saveMarketDB(marketDB)

            if (!text) {
                // Tampilkan semua saham ringkas
                let t = `✦ 📊  RINGKASAN SAHAM  📊\n\n  🕐 Harga update otomatis tiap 5 menit\n\n`
                for (const [ticker, s] of Object.entries(marketDB.saham)) {
                    const arrow = s.change > 0 ? '📈' : s.change < 0 ? '📉' : '➡️'
                    t += `  *${ticker}* ${toRupiah(s.price)} ${arrow}${s.change > 0 ? '+' : ''}${s.change}%\n`
                }
                t += `\n*.ceksaham [TICKER]* untuk detail`
                return Reply(t)
            }

            const ticker = text.trim().toUpperCase()
            const s = marketDB.saham[ticker]
            if (!s) return Reply(`❌ saham *${ticker}* tidak ada! cek *.market saham*`)

            const player = rpgDB.players[senderJid]
            const ownedWallet = player.assets?.saham?.[ticker] || 0
            const ownedBank   = player.bankAssets?.saham?.[ticker] || 0
            const totalOwned  = ownedWallet + ownedBank
            const nilaiTotal  = s.price * totalOwned
            const arrow = s.change > 0 ? '📈 NAIK' : s.change < 0 ? '📉 TURUN' : '➡️ STABIL'
            const basePrice = s.basePrice || s.price
            const totalChange = Math.round((s.price - basePrice) / basePrice * 100 * 10) / 10

            return Reply(`📊 *DETAIL SAHAM ${ticker}*
  🏢 ${s.name}
  🏷️ kategori: ${s.category}
  💵 harga: ${toRupiah(s.price)}/lot
  📈 perubahan: ${s.change > 0 ? '+' : ''}${s.change}% ${arrow}
  📊 total dari awal: ${totalChange > 0 ? '+' : ''}${totalChange}%

  👛 milikmu (dompet): ${ownedWallet} lot
  🏦 milikmu (bank): ${ownedBank} lot
  💎 nilai aset: ${toRupiah(nilaiTotal)}
beli: *.beli saham ${ticker} [lot]*
jual ke market: *.jualaset saham ${ticker} [lot] [harga]*
jual ke bot: *.jualasetbot saham ${ticker} [lot]*`)
        }

        // ─────────────────────────────────────────────
        // COMMAND: .portofolio — ringkasan investasi
        // ─────────────────────────────────────────────
        if (command === 'portofolio') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            const player = rpgDB.players[senderJid]

            let t = `💼 *PORTOFOLIO INVESTASI*
`
            let totalInvest = 0

            // Saham
            const allSaham = {}
            for (const [k, v] of Object.entries(player.assets?.saham || {})) { allSaham[k] = (allSaham[k] || 0) + v }
            for (const [k, v] of Object.entries(player.bankAssets?.saham || {})) { allSaham[k] = (allSaham[k] || 0) + v }
            const sahamEntries = Object.entries(allSaham).filter(([,q]) => q > 0)
            if (sahamEntries.length > 0) {
                t += `  📊 *SAHAM*\n`
                for (const [ticker, qty] of sahamEntries) {
                    const s = marketDB.saham[ticker]
                    if (!s) continue
                    const nilai = s.price * qty
                    totalInvest += nilai
                    const change = s.change !== 0 ? ` (${s.change > 0 ? '+' : ''}${s.change}%)` : ''
                    t += `  ${ticker} x${qty} = ${toRupiah(nilai)}${change}\n`
                }
                t += `\n`
            }

            // Properti
            const propEntries = Object.entries({
                ...(player.assets?.properti || {}),
                ...Object.fromEntries(Object.entries(player.bankAssets?.properti || {}).map(([k, v]) => [k, (player.assets?.properti?.[k] || 0) + v]))
            }).filter(([,q]) => q > 0)
            if (propEntries.length > 0) {
                t += `  🏠 *PROPERTI*\n`
                for (const [id, qty] of propEntries) {
                    const p = marketDB.properti[id]
                    if (!p) continue
                    const nilai = p.price * qty
                    totalInvest += nilai
                    t += `  ${p.name} x${qty} = ${toRupiah(nilai)}\n`
                }
                t += `\n`
            }

            // Kendaraan
            const kendarEntries = Object.entries(player.assets?.kendaraan || {}).filter(([,q]) => q > 0)
            if (kendarEntries.length > 0) {
                t += `  🚗 *KENDARAAN*\n`
                for (const [id, qty] of kendarEntries) {
                    const k = marketDB.kendaraan[id]
                    if (!k) continue
                    const nilai = k.price * qty
                    totalInvest += nilai
                    t += `  ${k.name} x${qty} = ${toRupiah(nilai)}\n`
                }
            }

            if (totalInvest === 0) {
                t += `  belum ada investasi...\n`
            }

            t += `\n`
            t += `💎 *TOTAL INVESTASI: ${toRupiah(totalInvest)}*\n`
            t += `💵 dompet: ${toRupiah(player.gold)} | 🏦 bank: ${toRupiah(player.bank?.balance || 0)}`
            return Reply(t)
        }

        if (command === 'topkaya') {
            let marketDB = getMarketDB()
            marketDB = fluctuateSaham(marketDB)
            const players = Object.entries(rpgDB.players)
            if (players.length < 1) return Reply(`❌ Belum ada sultan terdaftar!`)
            const ranked = players
                .map(([jid, p]) => ({ jid, p, net: calcTotalAssets(p, marketDB) }))
                .filter(x => x.net > 0)
                .sort((a, b) => b.net - a.net)
                .slice(0, 10)
            if (ranked.length === 0) return Reply(`❌ Belum ada aset. Mulai investasi sekarang!`)
            const rows = ranked.map(({ jid, p, net }, i) => ({
                rank: i+1,
                label: jid.split('@')[0],
                value: toRupiah(net),
                extra: `Gold: ${toRupiah(p.gold||0)}`
            }))
            const imgBuf = await generateLeaderboardCanvas('TOP 10 SULTAN TERKAYA', 'Total Aset + Gold + Bank', rows)
            if (imgBuf) {
                return alip.sendMessage(m.chat, { image: imgBuf, caption: 'Siapa sultan terkaya di grup ini?' }, { quoted: m })
            }
            let t = `TOP 10 TERKAYA\n\n`
            ranked.forEach(({ jid, net }, i) => { t += `  ${i+1}. @${jid.split('@')[0]} - ${toRupiah(net)}\n` })
            return await alip.sendMessage(m.chat, { text: t, mentions: ranked.map(x => x.jid) }, { quoted: m })
        }

        if (command === 'simpanaset') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            if (!player.bankAssets) player.bankAssets = { saham: {}, properti: {}, kendaraan: {} }

            const _saArgs = text ? text.trim().split(' ') : []
            const cat = _saArgs[0]?.toLowerCase()
            const id = cat === 'saham' ? _saArgs[1]?.toUpperCase() : _saArgs[1]?.toLowerCase()
            const qty = parseInt(_saArgs[2]) || 1

            if (!cat || !id) return Reply(`Gunakan: *.simpanaset [saham/properti/kendaraan] [id] [qty]*\nContoh: .simpanaset saham ALIP 10`)
            if (!['saham', 'properti', 'kendaraan'].includes(cat)) return Reply(`❌ kategori salah!`)

            const owned = player.assets[cat]?.[id] || 0
            if (owned < qty) return Reply(`❌ aset di dompet tidak cukup! punya ${owned}, mau simpan ${qty}`)

            player.assets[cat][id] -= qty
            if (!player.bankAssets[cat]) player.bankAssets[cat] = {}
            player.bankAssets[cat][id] = (player.bankAssets[cat][id] || 0) + qty
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🏦  ASET DISIMPAN KE BANK  🏦 ──
  📦 Kategori  : ${cat}
  🏷️  ID        : ${id}
  🔢 Qty       : x${qty}
  🔒 Status    : Aman di bank
Tarik dengan *.tarikaset ${cat} ${id} ${qty}* 📤`)
        }

        if (command === 'tarikaset') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!player.bankAssets) player.bankAssets = { saham: {}, properti: {}, kendaraan: {} }

            const _taArgs = text ? text.trim().split(' ') : []
            const cat = _taArgs[0]?.toLowerCase()
            const id = cat === 'saham' ? _taArgs[1]?.toUpperCase() : _taArgs[1]?.toLowerCase()
            const qty = parseInt(_taArgs[2]) || 1

            if (!cat || !id) return Reply(`Gunakan: *.tarikaset [saham/properti/kendaraan] [id] [qty]*\nContoh: .tarikaset saham ALIP 5`)
            if (!['saham', 'properti', 'kendaraan'].includes(cat)) return Reply(`❌ kategori salah!`)

            const banked = player.bankAssets[cat]?.[id] || 0
            if (banked < qty) return Reply(`❌ aset di bank tidak cukup! ada ${banked}, mau tarik ${qty}`)

            player.bankAssets[cat][id] -= qty
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            if (!player.assets[cat]) player.assets[cat] = {}
            player.assets[cat][id] = (player.assets[cat][id] || 0) + qty
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🏦  ASET DITARIK DARI BANK  🏦 ──
  📦 Kategori  : ${cat}
  🏷️  ID        : ${id}
  🔢 Qty       : x${qty}
  ✅ Status    : Kembali ke dompet`)
        }

        if (command === 'pasifincome') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            const marketDB = getMarketDB()

            const cooldown = 24 * 60 * 60 * 1000
            const now = Date.now()
            if (now - (player.lastPassive || 0) < cooldown) {
                const timeLeft = msToTime((player.lastPassive || 0) + cooldown - now)
                return Reply(`⏳ passive income bisa diklaim lagi dalam *${timeLeft}*`)
            }

            let totalPassive = 0
            let breakdown = []

            for (const [id, qty] of Object.entries(player.assets.properti || {})) {
                if (qty <= 0) continue
                const prop = marketDB.properti[id]
                if (prop?.passive > 0) {
                    const earn = prop.passive * qty
                    totalPassive += earn
                    breakdown.push(`  🏠 ${prop.name} x${qty} = +${toRupiah(earn)}`)
                }
            }
            for (const [id, qty] of Object.entries(player.assets.kendaraan || {})) {
                if (qty <= 0) continue
                const kendaraan = marketDB.kendaraan[id]
                if (kendaraan?.passive > 0) {
                    const earn = kendaraan.passive * qty
                    totalPassive += earn
                    breakdown.push(`  🚚 ${kendaraan.name} x${qty} = +${toRupiah(earn)}`)
                }
            }

            if (totalPassive === 0) return Reply(`❌ lu gak punya aset yang ngasih passive income!\nBeli properti atau truk di *.market properti*`)

            player.gold += totalPassive
            player.lastPassive = now
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 💰  PASSIVE INCOME DIKLAIM!  💰 ──
${breakdown.join('\n')}

  💵 Total   : +${toRupiah(totalPassive)}
  💰 Saldo   : ${toRupiah(player.gold)}
Klaim lagi besok! 🔔`)
        }

        // =====================================================
        // RESETGOLDALL — reset gold semua member (creator only)
        // Usage: .resetgoldall [jumlah]
        // =====================================================
        if (command === 'resetgoldall') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)
            const resetAmount = parseInt(text) || 0
            if (isNaN(resetAmount) || resetAmount < 0) return Reply(`❌ Jumlah tidak valid!\nContoh: .resetgoldall 1000`)

            const totalPlayers = Object.keys(rpgDB.players).length
            if (totalPlayers === 0) return Reply(`❌ Belum ada player terdaftar.`)

            for (const jid of Object.keys(rpgDB.players)) {
                rpgDB.players[jid].gold = resetAmount
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 💰  RESET GOLD ALL  💰 ──
  👥 Total Player  : *${totalPlayers}* orang
  💵 Gold Di-set   : *${toRupiah(resetAmount)}*
  ✅ Status        : Berhasil
Semua member sekarang punya ${toRupiah(resetAmount)}!`)
        }

        // =====================================================
        // RESETGOLDUSER — reset gold 1 user tertentu (creator only)
        // Usage: .resetgolduser [jumlah] @mention / reply
        // =====================================================
        if (command === 'resetgolduser') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                    let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                    if (p && p.jid) targetJid = p.jid
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }

            if (!targetJid) return Reply(`Tag atau reply user dulu!\nContoh: .resetgolduser 5000 @user`)

            const textParts = text ? text.trim().split(' ') : []
            const resetAmount = parseInt(textParts[0]) || 0

            if (!rpgDB.players[targetJid]) return Reply(`❌ User tersebut belum daftar RPG.`)

            const oldGold = rpgDB.players[targetJid].gold
            rpgDB.players[targetJid].gold = resetAmount
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return alip.sendMessage(m.chat, {
                text: `
✦ ── 💵  RESET GOLD USER  💵 ──
  👤 User       : @${targetJid.split('@')[0]}
  💰 Gold Lama  : ${toRupiah(oldGold)}
  💵 Gold Baru  : ${toRupiah(resetAmount)}
  ✅ Status     : Berhasil`,
                mentions: [targetJid]
            }, { quoted: m })
        }

        // =====================================================
        // EDITGOLD — tambah / kurang gold user (creator only)
        // Usage: .editgold [+/-jumlah] @mention / reply
        // =====================================================
        if (command === 'editgold') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                    let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                    if (p && p.jid) targetJid = p.jid
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }

            if (!targetJid) return Reply(`Tag atau reply user dulu!\nContoh:\n.editgold +5000 @user\n.editgold -2000 @user`)

            const rawText = text ? text.trim().split(' ')[0] : ''
            if (!rawText) return Reply(`Masukkan jumlah edit!\nContoh: .editgold +5000 @user`)

            const isNeg = rawText.startsWith('-')
            const editAmount = parseInt(rawText.replace(/[^0-9]/g, ''))
            if (isNaN(editAmount) || editAmount <= 0) return Reply(`❌ Jumlah tidak valid!`)

            if (!rpgDB.players[targetJid]) return Reply(`❌ User tersebut belum daftar RPG.`)

            const oldGold = rpgDB.players[targetJid].gold
            if (isNeg) {
                rpgDB.players[targetJid].gold = Math.max(0, oldGold - editAmount)
            } else {
                rpgDB.players[targetJid].gold += editAmount
            }
            const newGold = rpgDB.players[targetJid].gold
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return alip.sendMessage(m.chat, {
                text: `
✦ ── ✏️  EDIT GOLD USER  ✏️ ──
  👤 User       : @${targetJid.split('@')[0]}
  💰 Gold Lama  : ${toRupiah(oldGold)}
  ${isNeg ? '➖' : '➕'} Perubahan  : ${isNeg ? '-' : '+'}${toRupiah(editAmount)}
  💵 Gold Baru  : ${toRupiah(newGold)}
  ✅ Status     : Berhasil`,
                mentions: [targetJid]
            }, { quoted: m })
        }

        // =====================================================
        // EDITRPG — edit level/stats player (khusus owner)
        // Usage: .editrpg level @user [nilai]
        //        .editrpg stats @user [stat] [nilai]
        // =====================================================
        if (command === 'editrpg') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)

            let targetJid = null
            if (m.mentionedJid?.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                    let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                    if (p && p.jid) targetJid = p.jid
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }
            if (targetJid) targetJid = resolvePlayerJid(targetJid)

            if (!targetJid) return Reply(`Tag atau reply user!\nFormat:\n.editrpg level @user [nilai]\n.editrpg stats @user [attack|defense|agility|hp|mp] [nilai]\n\nContoh:\n.editrpg level @user 30\n.editrpg stats @user attack 200`)

            const cleanText = text.replace(/@\d+/g, '').trim().split(/\s+/).filter(Boolean)
            const editSub = cleanText[0]?.toLowerCase()
            const editVal = parseInt(cleanText[1])

            if (!rpgDB.players[targetJid]) return Reply(`❌ User belum daftar RPG!`)
            const tp = rpgDB.players[targetJid]

            if (editSub === 'level') {
                if (isNaN(editVal) || editVal < 1 || editVal > 999) return Reply(`❌ Level harus antara 1–999!`)
                const oldLevel = tp.level
                tp.level = editVal
                // Recalculate stats based on class + new level
                const baseClasses = {
                    warrior:{hp:100,mp:30,attack:15,defense:10,agility:5},
                    mage:{hp:60,mp:100,attack:20,defense:5,agility:8},
                    archer:{hp:80,mp:50,attack:12,defense:7,agility:15},
                    peri:{hp:65,mp:110,attack:14,defense:6,agility:20},
                    iblis:{hp:90,mp:70,attack:22,defense:8,agility:10},
                    golem:{hp:180,mp:20,attack:18,defense:25,agility:2},
                    darkmage:{hp:55,mp:130,attack:28,defense:3,agility:9},
                    mercenary:{hp:95,mp:40,attack:18,defense:12,agility:12},
                    assassin:{hp:70,mp:60,attack:16,defense:5,agility:28},
                    paladin:{hp:120,mp:80,attack:13,defense:18,agility:6},
                    necromancer:{hp:60,mp:140,attack:25,defense:4,agility:7},
                    berserker:{hp:110,mp:20,attack:24,defense:8,agility:13},
                    ranger:{hp:75,mp:55,attack:13,defense:8,agility:22},
                    shaman:{hp:70,mp:120,attack:16,defense:7,agility:11},
                    the_creator:{hp:9999,mp:9999,attack:999,defense:999,agility:999}
                }
                if (tp.class === 'the_creator') {
                    tp.maxHp=9999; tp.hp=9999; tp.maxMp=9999; tp.mp=9999; tp.attack=999; tp.defense=999; tp.agility=999
                } else {
                    const base = baseClasses[tp.class] || baseClasses.warrior
                    const lvBonus = editVal - 1
                    const hpGain  = lvBonus * (15 + Math.floor(editVal / 5) * 2)
                    tp.maxHp   = base.hp      + hpGain
                    tp.hp      = tp.maxHp
                    tp.maxMp   = base.mp      + lvBonus * 8
                    tp.mp      = tp.maxMp
                    tp.attack  = base.attack  + lvBonus * 3
                    tp.defense = base.defense + lvBonus * 2
                    tp.agility = base.agility + lvBonus
                }
                tp.exp = 0
                tp.expToNextLevel = Math.floor(100 * Math.pow(1.5, editVal - 1))
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `✦ ── ✏️  EDIT LEVEL RPG  ✏️ ──\n  👤 @${targetJid.split('@')[0]}\n  🎚️ Level : ${oldLevel} → *${editVal}*\n  ❤️ HP    : ${tp.maxHp}\n  ⚔️ ATK   : ${tp.attack}\n  🛡️ DEF   : ${tp.defense}\n✅ Stats disesuaikan otomatis!`,
                    mentions: [targetJid]
                }, { quoted: m })
            }

            if (editSub === 'stats') {
                const statName = cleanText[1]?.toLowerCase()
                const statVal  = parseInt(cleanText[2])
                if (!['attack','defense','agility','hp','mp','maxhp','maxmp'].includes(statName)) {
                    return Reply(`❌ Stat tidak valid!\nPilihan: attack, defense, agility, hp, mp, maxhp, maxmp`)
                }
                if (isNaN(statVal) || statVal < 0) return Reply(`❌ Nilai tidak valid!`)
                const statMap = { attack:'attack', defense:'defense', agility:'agility', hp:'hp', mp:'mp', maxhp:'maxHp', maxmp:'maxMp' }
                const key = statMap[statName]
                const oldVal = tp[key]
                tp[key] = statVal
                if (statName === 'maxhp' && tp.hp > statVal) tp.hp = statVal
                if (statName === 'maxmp' && tp.mp > statVal) tp.mp = statVal
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return alip.sendMessage(m.chat, {
                    text: `✦ ── ✏️  EDIT STAT RPG  ✏️ ──\n  👤 @${targetJid.split('@')[0]}\n  📊 Stat  : ${key}\n  ${oldVal} → *${statVal}*\n✅ Berhasil!`,
                    mentions: [targetJid]
                }, { quoted: m })
            }

            return Reply(`Format:\n.editrpg level @user [nilai]\n.editrpg stats @user [stat] [nilai]\n\nContoh:\n.editrpg level @user 55\n.editrpg stats @user attack 999`)
        }

        // =====================================================
        // RESETBANKALL — reset saldo bank semua player ke jumlah tertentu
        // Usage: .resetbankall [jumlah]
        // Khusus: OWNER UTAMA saja (global.owner)
        // =====================================================
        if (command === 'resetbankall') {
            const isMainOwner = m.sender === (global.owner + '@s.whatsapp.net') ||
                                m.sender === (global.owner + '@lid') ||
                                m.sender.split('@')[0] === String(global.owner).replace(/[^0-9]/g, '')
            if (!isMainOwner) return Reply(`❌ *Command ini khusus owner utama bot!*\nBukan untuk co-owner atau admin.`)

            const resetAmount = parseInt(text) || 0
            if (isNaN(resetAmount) || resetAmount < 0) return Reply(`❌ Jumlah tidak valid!\nContoh: *.resetbankall 0*`)

            const allJids = Object.keys(rpgDB.players)
            if (allJids.length === 0) return Reply(`❌ Belum ada player terdaftar.`)

            let totalReset = 0
            for (const jid of allJids) {
                if (!rpgDB.players[jid].bank) {
                    rpgDB.players[jid].bank = { balance: 0, totalDeposited: 0, totalWithdrawn: 0 }
                }
                rpgDB.players[jid].bank.balance = resetAmount
                totalReset++
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`
✦ ── 🏦  RESET BANK ALL  🏦 ──
  👥 Total Player  : *${totalReset}* orang
  💰 Saldo Di-set  : *${toRupiah(resetAmount)}*
  🔐 Dilakukan     : Owner Utama
  ✅ Status        : Berhasil
Saldo bank semua member sekarang *${toRupiah(resetAmount)}*!`)
        }

        // =====================================================
        // EDITBANK — tambah / kurang / set saldo bank 1 user tertentu
        // Usage: .editbank [+/-/=jumlah] @mention / reply
        // Contoh:
        //   .editbank +50000 @user  → tambah 50rb ke bank
        //   .editbank -20000 @user  → kurangi 20rb dari bank
        //   .editbank =100000 @user → set langsung jadi 100rb
        // Khusus: OWNER UTAMA saja (global.owner)
        // =====================================================
        if (command === 'editbank') {
            const isMainOwner = m.sender === (global.owner + '@s.whatsapp.net') ||
                                m.sender === (global.owner + '@lid') ||
                                m.sender.split('@')[0] === String(global.owner).replace(/[^0-9]/g, '')
            if (!isMainOwner) return Reply(`❌ *Command ini khusus owner utama bot!*\nBukan untuk co-owner atau admin.`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                    const p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                    if (p && p.jid) targetJid = p.jid
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }

            if (!targetJid) return Reply(`❌ Tag atau reply user dulu!\n\nCara pakai:\n*.editbank +50000 @user* — tambah\n*.editbank -20000 @user* — kurangi\n*.editbank =100000 @user* — set langsung`)

            const rawArg = text ? text.trim().split(/\s+/)[0] : ''
            if (!rawArg) return Reply(`❌ Masukkan jumlah edit!\n\nCara pakai:\n*.editbank +50000 @user* — tambah\n*.editbank -20000 @user* — kurangi\n*.editbank =100000 @user* — set langsung`)

            const isAdd  = rawArg.startsWith('+')
            const isSub  = rawArg.startsWith('-')
            const isSet  = rawArg.startsWith('=')

            if (!isAdd && !isSub && !isSet) return Reply(`❌ Awali dengan *+* (tambah), *-* (kurangi), atau *=* (set).\nContoh: *.editbank +50000 @user*`)

            const amount = parseInt(rawArg.replace(/[^0-9]/g, ''))
            if (isNaN(amount) || amount < 0) return Reply(`❌ Jumlah tidak valid!`)

            if (!rpgDB.players[targetJid]) return Reply(`❌ User tersebut belum daftar RPG!`)

            if (!rpgDB.players[targetJid].bank) {
                rpgDB.players[targetJid].bank = { balance: 0, totalDeposited: 0, totalWithdrawn: 0 }
            }

            const oldBank = rpgDB.players[targetJid].bank.balance || 0
            let newBank = oldBank
            let opEmoji = ''
            let opLabel = ''

            if (isAdd) {
                newBank = oldBank + amount
                opEmoji = '➕'
                opLabel = `+${toRupiah(amount)}`
            } else if (isSub) {
                newBank = Math.max(0, oldBank - amount)
                opEmoji = '➖'
                opLabel = `-${toRupiah(amount)}`
            } else if (isSet) {
                newBank = amount
                opEmoji = '🔄'
                opLabel = `= ${toRupiah(amount)}`
            }

            rpgDB.players[targetJid].bank.balance = newBank
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `
✦ ── ✏️  EDIT BANK USER  ✏️ ──
  👤 User       : @${targetJid.split('@')[0]}
  🏦 Bank Lama  : ${toRupiah(oldBank)}
  ${opEmoji} Perubahan  : ${opLabel}
  💰 Bank Baru  : *${toRupiah(newBank)}*
  ✅ Status     : Berhasil`,
                mentions: [targetJid]
            }, { quoted: m })
        }

        // =====================================================
        // RESETASETALL — reset semua aset (saham, properti, kendaraan)
        //                semua player sekaligus
        // Usage: .resetasetall
        //        .resetasetall saham      → hanya reset saham
        //        .resetasetall properti   → hanya reset properti
        //        .resetasetall kendaraan  → hanya reset kendaraan
        // Khusus: OWNER UTAMA saja (global.owner)
        // =====================================================
        if (command === 'resetasetall') {
            const isMainOwner = m.sender === (global.owner + '@s.whatsapp.net') ||
                                m.sender === (global.owner + '@lid') ||
                                m.sender.split('@')[0] === String(global.owner).replace(/[^0-9]/g, '')
            if (!isMainOwner) return Reply(`❌ *Command ini khusus owner utama bot!*\nBukan untuk co-owner atau admin.`)

            const allJids = Object.keys(rpgDB.players)
            if (allJids.length === 0) return Reply(`❌ Belum ada player terdaftar.`)

            // Tentukan kategori aset yang di-reset
            const subArg = (text ? text.trim() : (args && args.length ? args.join(' ') : '')).toLowerCase()
            const validCats = ['saham', 'properti', 'kendaraan']
            let targetCats = []

            if (!subArg || subArg === 'semua' || subArg === 'all') {
                targetCats = ['saham', 'properti', 'kendaraan']
            } else if (validCats.includes(subArg)) {
                targetCats = [subArg]
            } else {
                return Reply(`❌ Kategori tidak valid!\n\nCara pakai:\n*.resetasetall* — reset semua aset\n*.resetasetall saham* — hanya saham\n*.resetasetall properti* — hanya properti\n*.resetasetall kendaraan* — hanya kendaraan`)
            }

            let totalPlayer = 0
            let stats = {}
            for (const cat of targetCats) stats[cat] = 0

            for (const jid of allJids) {
                const p = rpgDB.players[jid]
                if (!p) continue

                // Hitung total item yang akan dihapus (untuk laporan)
                for (const cat of targetCats) {
                    // Wallet aset
                    if (p.assets && p.assets[cat]) {
                        for (const qty of Object.values(p.assets[cat])) {
                            if (qty > 0) stats[cat] += qty
                        }
                        p.assets[cat] = {}
                    }
                    // Bank aset
                    if (p.bankAssets && p.bankAssets[cat]) {
                        for (const qty of Object.values(p.bankAssets[cat])) {
                            if (qty > 0) stats[cat] += qty
                        }
                        p.bankAssets[cat] = {}
                    }
                }

                // Pastikan struktur aset tetap valid
                if (!p.assets) p.assets = { saham: {}, properti: {}, kendaraan: {} }
                if (!p.bankAssets) p.bankAssets = { saham: {}, properti: {}, kendaraan: {} }
                totalPlayer++
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const catLabel = targetCats.length === 3 ? 'semua kategori' : targetCats.join(', ')
            let statLines = ''
            for (const cat of targetCats) {
                const emojiMap = { saham: '📈', properti: '🏠', kendaraan: '🚗' }
                statLines += `  ${emojiMap[cat]} ${cat}        : *${stats[cat]}* item dihapus\n`
            }

            return Reply(`
✦ ── 🗑️  RESET ASET ALL  🗑️ ──
  👥 Total Player  : *${totalPlayer}* orang
  📦 Kategori      : *${catLabel}*

${statLines}  🔐 Dilakukan     : Owner Utama
  ✅ Status        : Berhasil
Seluruh aset *${catLabel}* sudah direset tuntas!
Dompet, wallet, dan bank aset semua bersih. 🧹`)
        }

        // =====================================================
        // RESETKELUARGAALL — reset data keluarga semua player (creator only)
        // Usage: .resetkeluargaall
        // =====================================================
        if (command === 'resetkeluargaall') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)

            const FAMILY_FIELDS = [
                'pasangan', 'pasanganNama', 'tanggalNikah',
                'anak', 'harmoni',
                'rumahKeluarga',
                'lastKencan', 'totalKencan',
                'lastMakanBersama', 'lastLiburan', 'totalLiburan',
                'lastFoto', 'totalFoto',
                'lastAnnivKado', 'chemistryBuff',
                'lastHarmoniTick', 'lastCekEvent',
                'totalNafkah', 'lastCekSelingkuh',
                'lastSelingkuh', 'selingkuhTarget', 'kenaSelingkuh',
                'lastIstanaTick'
            ]

            const totalPlayers = Object.keys(rpgDB.players).length
            if (totalPlayers === 0) return Reply(`❌ Belum ada player terdaftar.`)

            let totalReset = 0
            for (const jid of Object.keys(rpgDB.players)) {
                let adaData = false
                for (const field of FAMILY_FIELDS) {
                    if (rpgDB.players[jid][field] !== undefined) {
                        delete rpgDB.players[jid][field]
                        adaData = true
                    }
                }
                if (adaData) totalReset++
            }

            // Reset proposals juga
            rpgDB.proposals = {}

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            // Reset panti asuhan sekalian
            const pantiKosong = { anak: [], lastReset: {
                tanggal: new Date().toLocaleDateString('id-ID'),
                waktu: new Date().toLocaleTimeString('id-ID'),
                oleh: '@' + senderJid.split('@')[0],
                alasan: 'Reset keluarga massal oleh owner',
                jumlahDireset: 0
            }}
            fs.writeFileSync(pantiDBPath, JSON.stringify(pantiKosong, null, 2))

            return Reply(`✦ ── 👨‍👩‍👧  RESET KELUARGA ALL  👨‍👩‍👧 ──
  👥 Total player     : *${totalPlayers}* orang
  🗑️  Player direset   : *${totalReset}* orang
  🏛️  Panti asuhan    : ✅ Dikosongkan
  💍 Lamaran pending  : ✅ Dihapus

  🔄 *Data yang direset:*
  ├ Status pernikahan & pasangan
  ├ Data anak-anak
  ├ Keharmonisan & aktivitas
  ├ Rumah keluarga & renovasi
  ├ Riwayat kencan, liburan, foto
  └ Data selingkuh & investigasi

  ✅ Status : *Berhasil*
  📅 Waktu  : ${new Date().toLocaleString('id-ID')}
_Seluruh data keluarga telah direset bersih! 🧹_`)
        }

        // =====================================================
        // RESETKELUARGAUSER — reset data keluarga 1 user (creator only)
        // Usage: .resetkeluargauser @mention / reply
        // =====================================================
        if (command === 'resetkeluargauser') {
            if (!isCreator) return Reply(`❌ *Khusus owner bot!*`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                    let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                    if (p && p.jid) targetJid = p.jid
                }
            } else if (m.quoted) {
                targetJid = m.quoted.sender
            }

            if (!targetJid) return Reply(`❌ Tag atau reply user dulu!\nContoh: *.resetkeluargauser @user*`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ User tersebut belum daftar RPG.`)

            const player = rpgDB.players[targetJid]

            const FAMILY_FIELDS = [
                'pasangan', 'pasanganNama', 'tanggalNikah',
                'anak', 'harmoni',
                'rumahKeluarga',
                'lastKencan', 'totalKencan',
                'lastMakanBersama', 'lastLiburan', 'totalLiburan',
                'lastFoto', 'totalFoto',
                'lastAnnivKado', 'chemistryBuff',
                'lastHarmoniTick', 'lastCekEvent',
                'totalNafkah', 'lastCekSelingkuh',
                'lastSelingkuh', 'selingkuhTarget', 'kenaSelingkuh',
                'lastIstanaTick'
            ]

            // Kumpulkan info sebelum reset
            const infoBefore = {
                pasangan: player.pasanganNama || player.pasangan || '-',
                jumlahAnak: (player.anak || []).length,
                harmoni: player.harmoni || 0,
                punyaRumah: player.rumahKeluarga ? `${player.rumahKeluarga.tier}` : '-'
            }

            // Jika punya pasangan, bersihkan data pasangan juga
            if (player.pasangan) {
                const pasanganJid = player.pasangan.endsWith('@lid')
                    ? player.pasangan.replace('@lid', '@s.whatsapp.net')
                    : player.pasangan
                const pasangan = rpgDB.players[pasanganJid]
                if (pasangan) {
                    for (const field of FAMILY_FIELDS) {
                        delete pasangan[field]
                    }
                }
            }

            // Reset player target
            for (const field of FAMILY_FIELDS) {
                delete player[field]
            }

            // Hapus proposal yang melibatkan user ini
            if (rpgDB.proposals) {
                for (const key of Object.keys(rpgDB.proposals)) {
                    const prop = rpgDB.proposals[key]
                    if (key === targetJid || prop.from === targetJid) {
                        delete rpgDB.proposals[key]
                    }
                }
            }

            // Hapus anak player dari panti jika ada
            try {
                let pantiDB = JSON.parse(fs.readFileSync(pantiDBPath))
                pantiDB.anak = (pantiDB.anak || []).filter(a => a.orangTuaJid !== targetJid && a.pasanganJid !== targetJid)
                fs.writeFileSync(pantiDBPath, JSON.stringify(pantiDB, null, 2))
            } catch(e) {}

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 👨‍👩‍👧  RESET KELUARGA USER  👨‍👩‍👧\n\n  👤 User       : @${targetJid.split('@')[0]}\n\n  📋 *Data sebelum reset:*\n  ├ Pasangan   : ${infoBefore.pasangan}\n  ├ Jumlah anak: ${infoBefore.jumlahAnak} anak\n  ├ Keharmonisan: ${infoBefore.harmoni}/100\n  └ Rumah      : ${infoBefore.punyaRumah}\n\n  🔄 *Semua data keluarga dihapus:*\n  ├ Status pernikahan & pasangan\n  ├ Data anak-anak\n  ├ Keharmonisan & aktivitas\n  ├ Rumah keluarga & renovasi\n  └ Riwayat kencan, liburan, foto\n\n  ✅ Status : *Berhasil*\n  📅 Waktu  : ${new Date().toLocaleString('id-ID')}\n`,
                mentions: [targetJid]
            }, { quoted: m })
        }

        // =====================================================
        // INFO — menampilkan total gold, aset, saham, bank dll
        // Usage: .info [@mention/reply/kosong=diri sendiri]
        // =====================================================
        if (command === 'info') {
            let targetJid = m.sender
            if (m.isGroup) {
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    targetJid = m.mentionedJid[0]
                    if (targetJid.endsWith('@lid') && m.metadata?.participants) {
                        let p = m.metadata.participants.find(x => x.lid === targetJid || x.id === targetJid)
                        if (p && p.jid) targetJid = p.jid
                    }
                } else if (m.quoted) {
                    targetJid = m.quoted.sender
                }
            } else {
                if (m.quoted) targetJid = m.quoted.sender
            }

            if (!rpgDB.players[targetJid]) return Reply(`❌ User ${targetJid === m.sender ? 'kamu' : 'tersebut'} belum daftar RPG!\nKetik *.rpgstart* untuk mulai.`)

            const player = rpgDB.players[targetJid]
            const marketDB = getMarketDB()
            if (!player.assets) player.assets = { saham: {}, properti: {}, kendaraan: {} }
            if (!player.bankAssets) player.bankAssets = { saham: {}, properti: {}, kendaraan: {} }

            // Hitung nilai saham dompet
            let sahamWalletTotal = 0
            let sahamWalletList = []
            for (const [id, qty] of Object.entries(player.assets.saham || {})) {
                if (qty <= 0) continue
                const harga = marketDB.saham[id]?.price || 0
                const nilai = harga * qty
                sahamWalletTotal += nilai
                sahamWalletList.push(`  📈 ${id} x${qty} = ${toRupiah(nilai)}`)
            }

            // Hitung nilai saham bank
            let sahamBankTotal = 0
            let sahamBankList = []
            for (const [id, qty] of Object.entries(player.bankAssets.saham || {})) {
                if (qty <= 0) continue
                const harga = marketDB.saham[id]?.price || 0
                const nilai = harga * qty
                sahamBankTotal += nilai
                sahamBankList.push(`  🏦📈 ${id} x${qty} = ${toRupiah(nilai)}`)
            }

            // Hitung nilai properti
            let propertiTotal = 0
            let propertiList = []
            for (const cat of ['properti', 'kendaraan']) {
                const emojiMap = { properti: '🏠', kendaraan: '🚗' }
                const allKeys = new Set([
                    ...Object.keys(player.assets[cat] || {}),
                    ...Object.keys(player.bankAssets[cat] || {})
                ])
                for (const id of allKeys) {
                    const wQty = player.assets[cat]?.[id] || 0
                    const bQty = player.bankAssets[cat]?.[id] || 0
                    const totalQty = wQty + bQty
                    if (totalQty <= 0) continue
                    const harga = marketDB[cat]?.[id]?.price || 0
                    const nilai = harga * totalQty
                    propertiTotal += nilai
                    propertiList.push(`  ${emojiMap[cat]} ${marketDB[cat]?.[id]?.name || id} x${totalQty} = ${toRupiah(nilai)}`)
                }
            }

            // Hitung nilai inventori
            let inventoriTotal = 0
            for (const [id, qty] of Object.entries(player.inventory || {})) {
                if (qty <= 0) continue
                const itemPrice = rpgDB.items?.[id]?.price || 0
                inventoriTotal += itemPrice * qty
            }

            const goldDompet = player.gold || 0
            const goldBank = player.bank?.balance || 0
            const totalSaham = sahamWalletTotal + sahamBankTotal
            const totalAset = goldDompet + goldBank + totalSaham + propertiTotal + inventoriTotal

            // Hitung passive income
            let totalPassivePerHari = 0
            for (const [id, qty] of Object.entries(player.assets.properti || {})) {
                if (qty > 0 && marketDB.properti[id]?.passive) totalPassivePerHari += marketDB.properti[id].passive * qty
            }
            for (const [id, qty] of Object.entries(player.assets.kendaraan || {})) {
                if (qty > 0 && marketDB.kendaraan[id]?.passive) totalPassivePerHari += marketDB.kendaraan[id].passive * qty
            }

            const isSelf = targetJid === m.sender
            let infoText = `
✦ ── 📊  INFO KEKAYAAN  📊 ──
  👤 *${player.class?.toUpperCase() || 'PLAYER'}* — Level ${player.level || 1}
  
  💵 Gold Dompet   : ${toRupiah(goldDompet)}
  🏦 Gold Bank     : ${toRupiah(goldBank)}
  
  📈 *Saham (Dompet)* : ${toRupiah(sahamWalletTotal)}
${sahamWalletList.length > 0 ? sahamWalletList.join('\n') + '\n' : '  (kosong)\n'}  🏦📈 *Saham (Bank)* : ${toRupiah(sahamBankTotal)}
${sahamBankList.length > 0 ? sahamBankList.join('\n') + '\n' : '  (kosong)\n'}  🏠 *Properti & Kendaraan* : ${toRupiah(propertiTotal)}
${propertiList.length > 0 ? propertiList.join('\n') + '\n' : '  (kosong)\n'}  🎒 *Nilai Inventori* : ${toRupiah(inventoriTotal)}
  
  💹 Passive/hari  : ${toRupiah(totalPassivePerHari)}
  

  🏆 TOTAL NET WORTH : *${toRupiah(totalAset)}*`

            return alip.sendMessage(m.chat, {
                text: infoText,
                mentions: isSelf ? [] : [targetJid]
            }, { quoted: m })
        }

        // 
        // 🐠 AQUARIUM SYSTEM — PELIHARA & KEMBANGKAN IKAN TANGKAPAN
        // 

        const FISH_FOOD_DATA = {
            pelet_biasa:    { name: 'Pelet Biasa',    emoji: '🥫', price: 500,    hpHeal: 10,  expGain: 5,   desc: 'Pakan harian, HP +10 & EXP sedikit' },
            pelet_premium:  { name: 'Pelet Premium',  emoji: '🥩', price: 2000,   hpHeal: 30,  expGain: 20,  desc: 'Nutrisi bagus, HP +30 & EXP lumayan' },
            cacing_hidup:   { name: 'Cacing Hidup',   emoji: '🪱', price: 1500,   hpHeal: 20,  expGain: 30,  desc: 'Favorit ikan, EXP tinggi!' },
            jangkrik:       { name: 'Jangkrik',       emoji: '🦗', price: 3000,   hpHeal: 25,  expGain: 45,  desc: 'Protein tinggi, EXP besar' },
            udang_segar:    { name: 'Udang Segar',    emoji: '🦐', price: 5000,   hpHeal: 50,  expGain: 60,  desc: 'Makanan mewah, HP & EXP tinggi' },
            vitamin_ikan:   { name: 'Vitamin Ikan',   emoji: '💊', price: 10000,  hpHeal: 200, expGain: 10,  desc: 'Pulihkan HP penuh! (hampir)' },
            suplemen_kuat:  { name: 'Suplemen Kuat',  emoji: '💉', price: 25000,  hpHeal: 50,  expGain: 150, desc: 'Boost EXP besar untuk level up cepat' },
            pakan_dewa:     { name: 'Pakan Dewa',     emoji: '✨', price: 100000, hpHeal: 500, expGain: 500, desc: 'ULTIMATE FOOD! HP & EXP max boost' }
        }

        const FISH_LEVEL_EXP  = [
            0,       // lv1 start
            100,     // lv2
            300,     // lv3
            700,     // lv4
            1500,    // lv5
            3000,    // lv6
            5500,    // lv7
            9000,    // lv8
            14000,   // lv9
            21000,   // lv10
            30000,   // lv11
            42000,   // lv12
            58000,   // lv13
            78000,   // lv14
            103000,  // lv15
            133000,  // lv16
            170000,  // lv17
            215000,  // lv18
            270000,  // lv19
            340000   // lv20 MAX
        ]
        const FISH_LEVEL_NAMES = [
            '',
            '🥚 Baby',           // lv1
            '🐟 Tiny',           // lv2
            '🐠 Small',          // lv3
            '🐡 Normal',         // lv4
            '🦐 Sprout',         // lv5
            '🦑 Feeder',         // lv6
            '🐙 Fighter',        // lv7
            '🦈 Hunter',         // lv8
            '🐊 Predator',       // lv9
            '🦁 Alpha',          // lv10
            '🌊 Tidal',          // lv11
            '⚡ Storm',          // lv12
            '🔥 Blaze',          // lv13
            '❄️ Frost',           // lv14
            '🌑 Shadow',         // lv15
            '💎 Crystal',        // lv16
            '🌟 Astral',         // lv17
            '👑 Royal',          // lv18
            '🐉 Mythic',         // lv19
            '✨ Legendary God'   // lv20 MAX
        ]
        const FISH_MAX_HP_BY_LEVEL   = [0, 50, 100, 180, 280, 400, 550, 730, 940, 1190, 1500, 1870, 2310, 2830, 3450, 4180, 5030, 6020, 7170, 8500, 10000]
        const FISH_BATTLE_ATK_BY_LEVEL = [0, 10, 22, 38, 58, 82, 112, 148, 192, 244, 305, 378, 464, 565, 684, 823, 985, 1173, 1390, 1640, 1920]

        function getFishLevel(fishInAquarium) {
            let level = 1
            const totalExp = fishInAquarium.exp || 0
            for (let l = 1; l <= 19; l++) {
                if (totalExp >= FISH_LEVEL_EXP[l]) level = l + 1
                else break
            }
            return Math.min(level, 20)
        }

        function getFishAquariumDisplay(f) {
            const lvl = getFishLevel(f)
            const fishBase = FISH_DATA[f.fishId] || { name: f.fishId, emoji: '🐟', rarity: 'UNCOMMON' }
            const mut = f.mutationId ? MUTATION_DATA[f.mutationId] : null
            const name = mut ? `${mut.emoji}${mut.name} ${fishBase.emoji}${fishBase.name}` : `${fishBase.emoji}${fishBase.name}`
            const maxHp = FISH_MAX_HP_BY_LEVEL[lvl]
            const hp = Math.min(f.hp || maxHp, maxHp)
            return { lvl, name, hp, maxHp, fishBase, mut }
        }

        // ── SHOPFOOD ──────────────────────────────────────────────────
        if (command === 'shopfood') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            const sub = text ? text.trim().toLowerCase() : ''

            if (sub.startsWith('beli ')) {
                const parts = sub.replace('beli ', '').trim().split(/\s+/)
                const foodId = parts[0]
                const qty = parseInt(parts[1]) || 1
                const food = FISH_FOOD_DATA[foodId]
                if (!food) return Reply(`❌ Makanan *${foodId}* tidak ada!\nKetik *.shopfood* untuk lihat daftar.`)
                const totalCost = food.price * qty
                if (player.gold < totalCost) return Reply(`❌ Uang kurang! Butuh ${toRupiah(totalCost)}, kamu punya ${toRupiah(player.gold)}.`)
                player.gold -= totalCost
            player.totalSpent = (player.totalSpent || 0) + totalCost
                if (!player.inventory) player.inventory = {}
                const invKey = `food_${foodId}`
                player.inventory[invKey] = (player.inventory[invKey] || 0) + qty
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✦ ── ✅  MAKANAN DIBELI!  ✅ ──
  ${food.emoji} *${food.name}* x${qty}
  💰 Bayar  : -${toRupiah(totalCost)}
  💵 Sisa   : ${toRupiah(player.gold)}
Beri makan ikan dengan *.makankanikan [slot] ${foodId}*`)
            }

            let txt = `✦ 🏪  TOKO MAKANAN IKAN  🏪\n\n`
            for (const [id, f] of Object.entries(FISH_FOOD_DATA)) {
                const stock = player.inventory?.[`food_${id}`] || 0
                txt += `  ${f.emoji} *${f.name}* (stok: ${stock})\n`
                txt += `  💰 ${toRupiah(f.price)}/pcs\n`
                txt += `  ❤️  HP +${f.hpHeal} | ⭐ EXP +${f.expGain}\n`
                txt += `  📝 ${f.desc}\n`
                txt += `  ↳ *.shopfood beli ${id} [qty]*\n\n`
            }
            txt += `\n💵 Saldo: ${toRupiah(player.gold)}`
            return Reply(txt)
        }

        // ── PELIHARAIKAN ──────────────────────────────────────────────
        if (command === 'peliharaikan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            // Fix: selalu inisiasi aquarium sebagai array
            if (!Array.isArray(player.aquarium)) player.aquarium = []

            if (player.aquarium.length >= 5) return Reply(`❌ Akuarium penuh! Maksimal 5 ikan. Lepaskan dulu dengan *.lepaskan [slot]*`)

            const fishKey = text ? `fish_${text.trim()}` : null
            if (!fishKey) return Reply(`❌ Masukkan key ikan!\n\n📋 *Cara peliharaikan:*\n*.peliharaikan [fishkey]*\n\nContoh biasa:\n  *.peliharaikan minnow*\n\nContoh ikan mutasi:\n  *.peliharaikan abyss_emperor_festive*\n\n💡 Lihat key ikan di *.tasikan* (kolom paling kiri, tanpa awalan fish_)`)

            const inv = player.inventory || {}
            if (!inv[fishKey] || inv[fishKey] <= 0) return Reply(`❌ Ikan *${text.trim()}* tidak ada di inventori!\nCek ikan di *.tasikan*\n\n💡 Pastikan key ikan sudah benar (lihat *.tasikan*)`)

            const { fishId, mutationId } = parseFishKey(fishKey)
            if (!fishId || !FISH_DATA[fishId]) return Reply(`❌ Key ikan tidak valid!\n💡 Cek ikan di *.tasikan* dan salin key-nya dengan benar.`)

            inv[fishKey] -= 1
            const newFish = {
                fishId,
                mutationId: mutationId || null,
                exp: 0,
                hp: FISH_MAX_HP_BY_LEVEL[1],
                adoptedAt: Date.now()
            }
            player.aquarium.push(newFish)
            const slot = player.aquarium.length

            const fishBase = FISH_DATA[fishId]
            const mut = mutationId ? MUTATION_DATA[mutationId] : null
            const displayName = mut ? `${mut.emoji}${mut.name} ${fishBase.emoji}${fishBase.name}` : `${fishBase.emoji}${fishBase.name}`

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✦ ── 🐠  IKAN DIPELIHARA!  🐠 ──
  🐟 Ikan    : ${displayName}
  🎚️ Level   : ${FISH_LEVEL_NAMES[1]}
  ❤️  HP      : ${FISH_MAX_HP_BY_LEVEL[1]}/${FISH_MAX_HP_BY_LEVEL[1]}
  🔢 Slot    : #${slot}

📋 *Langkah selanjutnya:*
1️⃣ Lihat akuarium → *.akuarium*
2️⃣ Beli makanan → *.shopfood*
3️⃣ Beri makan → *.makankanikan ${slot} pelet_biasa [qty]*
   Contoh: *.makankanikan ${slot} pelet_biasa 5*
4️⃣ Adu ikan → *.aduikan @user ${text.trim()}*`)
        }

        if (command === 'akuarium') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            // Fix: pastikan aquarium selalu array, bukan undefined/null
            if (!player.aquarium) player.aquarium = []
            if (player.aquarium.length === 0) {
                return Reply(`🐠 *AKUARIUM KOSONG!*\n\nBelum ada ikan yang dipelihara.\n\n📋 *Cara punya ikan di akuarium:*\n1️⃣ Mancing dulu → *.mancing*\n2️⃣ Cek ikan hasil mancing → *.tasikan*\n3️⃣ Pelihara ikan → *.peliharaikan [fishkey]*\n   Contoh: *.peliharaikan minnow*\n   Contoh mutasi: *.peliharaikan abyss_emperor_festive*\n4️⃣ Beri makan → *.makankanikan 1 pelet_biasa*\n\n💡 Key ikan bisa dilihat di *.tasikan* (kolom pertama setelah fish_)`)
            }

            let txt = `✦ 🐠  AKUARIUM  🐠\n\n`
            player.aquarium.forEach((f, i) => {
                const { lvl, name, hp, maxHp } = getFishAquariumDisplay(f)
                const expForNext = lvl < 20 ? FISH_LEVEL_EXP[lvl] : 'MAX'
                const hpBar = (() => { const p = Math.min(Math.floor((hp/maxHp)*10), 10); return '█'.repeat(p)+'░'.repeat(10-p) })()
                txt += `  *[SLOT ${i+1}]* ${name}\n`
                txt += `  🎚️ Level  : *${FISH_LEVEL_NAMES[lvl]}* (Lv.${lvl}/20)\n`
                txt += `  ❤️  HP     : [${hpBar}] ${hp}/${maxHp}\n`
                txt += `  ⭐ EXP    : ${f.exp || 0}/${lvl < 20 ? expForNext : 'MAX'}\n`
                txt += `  ⚔️  ATK    : ${FISH_BATTLE_ATK_BY_LEVEL[lvl]}\n`
                txt += `  🔑 FishKey : ${getFishInventoryKey(f.fishId, f.mutationId).replace('fish_','')}\n`
                txt += `\n`
            })
            txt += `\n`
            txt += `📋 *Panduan Akuarium:*\n`
            txt += `*.makankanikan [slot] [foodId] [qty]*  — beri makan\n`
            txt += `  Contoh: *.makankanikan 1 pelet_biasa 3*\n`
            txt += `  Cek makanan: *.shopfood*\n`
            txt += `*.aduikan @user [fishkey]*             — adu ikan\n`
            txt += `*.lepaskan [slot]*                     — keluarkan ikan\n`
            txt += `*.shopfood*                            — beli makanan ikan`
            return Reply(txt)
        }

        // ── MAKANKANIKAN ──────────────────────────────────────────────
        if (command === 'makankanikan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!Array.isArray(player.aquarium) || player.aquarium.length === 0) return Reply(`❌ Akuarium kosong! Pelihara ikan dulu dengan *.peliharaikan [fishkey]*\n💡 Mancing dulu → *.mancing*, cek ikan → *.tasikan*`)

            const parts = text ? text.trim().split(/\s+/) : []

            if (parts.length < 2) return Reply(`❌ Format salah!\n\n📋 *Cara beri makan ikan:*\n*.makankanikan [slot] [foodId] [qty]*\n\nContoh:\n  *.makankanikan 1 pelet_biasa 5*\n  *.makankanikan 2 pelet_super 1*\n\n💡 Slot ikan bisa dilihat di *.akuarium*\n💡 Daftar makanan di *.shopfood*\n💡 Beli makanan: *.shopfood beli pelet_biasa 10*`)

            const slot = parseInt(parts[0]) - 1
            const foodId = parts[1]
            const qty = parseInt(parts[2]) || 1

            if (isNaN(slot) || slot < 0 || slot >= player.aquarium.length) return Reply(`❌ Slot tidak valid!\n\nKamu punya *${player.aquarium.length}* ikan di slot 1–${player.aquarium.length}\nLihat detail di *.akuarium*`)
            if (!foodId) return Reply(`❌ Masukkan jenis makanan!\n\n📋 *Format:* *.makankanikan [slot] [foodId] [qty]*\nContoh: *.makankanikan 1 pelet_biasa 3*\n\nDaftar makanan: *.shopfood*`)

            const food = FISH_FOOD_DATA[foodId]
            if (!food) return Reply(`❌ Makanan *${foodId}* tidak ada!\n\nDaftar makanan yang tersedia:\n*.shopfood*\n\nBeli makanan:\n*.shopfood beli pelet_biasa [qty]*`)

            const invKey = `food_${foodId}`
            const inv = player.inventory || {}
            const stock = inv[invKey] || 0
            if (stock < qty) return Reply(`❌ Stok *${food.name}* kurang!\nPunya: ${stock} | Butuh: ${qty}\n\nBeli dulu: *.shopfood beli ${foodId} ${qty - stock}*`)

            const fish = player.aquarium[slot]
            const lvlBefore = getFishLevel(fish)

            inv[invKey] -= qty
            fish.exp = (fish.exp || 0) + (food.expGain * qty)
            const lvlMid = getFishLevel(fish)
            const maxHpNow = FISH_MAX_HP_BY_LEVEL[lvlMid]
            fish.hp = Math.min((fish.hp || maxHpNow) + (food.hpHeal * qty), maxHpNow)

            const lvlAfter = getFishLevel(fish)
            const leveledUp = lvlAfter > lvlBefore
            if (leveledUp) fish.hp = FISH_MAX_HP_BY_LEVEL[lvlAfter]

            const { name } = getFishAquariumDisplay(fish)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            let msg = `✦ ── 🍽️  IKAN DIBERI MAKAN!  🍽️ ──
  🐟 Ikan    : ${name}
  🍽️ Makan   : ${food.emoji} ${food.name} x${qty}
  ❤️  HP      : +${food.hpHeal * qty} → ${fish.hp}/${FISH_MAX_HP_BY_LEVEL[lvlAfter]}
  ⭐ EXP     : +${food.expGain * qty} → ${fish.exp}
  🎚️ Level   : ${FISH_LEVEL_NAMES[lvlAfter]} (Lv.${lvlAfter}/20)
  📦 Sisa stok: ${(inv[invKey])} ${food.name}`
            if (leveledUp) msg += `\n\n🎉 *IKAN NAIK LEVEL!*\n${FISH_LEVEL_NAMES[lvlBefore]} → *${FISH_LEVEL_NAMES[lvlAfter]}*\n⚔️ ATK sekarang: ${FISH_BATTLE_ATK_BY_LEVEL[lvlAfter]}`
            if (lvlAfter === 20) msg += `\n\n🏆 *IKAN SUDAH MAX LEVEL 20 — ✨ LEGENDARY GOD!* 🐉`
            msg += `\n\n💡 Beri makan lagi: *.makankanikan ${slot+1} ${foodId} [qty]*`
            return Reply(msg)
        }

        // ── LEPASKAN ──────────────────────────────────────────────────
        if (command === 'lepaskan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!player.aquarium || player.aquarium.length === 0) return Reply(`❌ Akuarium kosong!`)

            const slot = parseInt(text) - 1
            if (isNaN(slot) || slot < 0 || slot >= player.aquarium.length) return Reply(`❌ Slot tidak valid! Pilih 1–${player.aquarium.length}`)

            const fish = player.aquarium[slot]
            const { lvl, name } = getFishAquariumDisplay(fish)

            const invKey = getFishInventoryKey(fish.fishId, fish.mutationId)
            if (!player.inventory) player.inventory = {}
            player.inventory[invKey] = (player.inventory[invKey] || 0) + 1
            player.aquarium.splice(slot, 1)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✦ ── 📤  IKAN DILEPASKAN  📤 ──
  🐟 Ikan    : ${name}
  🎚️ Level   : ${FISH_LEVEL_NAMES[lvl]}
  📦 Status  : Kembali ke inventori
Ikan kembali ke inventori & bisa dijual/dipelihara lagi.`)
        }

        // ── INFOADUIKAN — Panduan ────────────────────────────────────
        if (command === 'infoaduikan') {
            return Reply(`✦ ── 🐠  CARA MAIN ADU IKAN  🐠 ──
  📖 *APA ITU ADU IKAN?*
  Tantang ikan peliharaan pemain lain!
  Kamu pilih ikanmu, ikan lawan random.

  🎯 *FORMAT COMMAND*
  .aduikan @user [namaikan]
  .aduikan @user minnow
  .aduikan @user golden_carp
  (bisa reply pesan lawan, ganti @user)

  💡 *NAMA IKAN*
  Gunakan fishId ikan kamu.
  Cek nama ikan di *.akuarium*
  (contoh: minnow, carp, salmon, dll)

  ⚔️ *MEKANISME*
  • Kamu pilih ikan spesifik
  • Ikan lawan → random dari akuarium
  • Power = (ATK_Level + Acak 0–20) × Mutasi
  • Power tertinggi MENANG!
  • Power sama → 50/50 keberuntungan

  🏆 *HADIAH PEMENANG*
  • Gold (makin tinggi level, makin banyak)
  • EXP ikan naik → bisa level up!

  😔 *IKAN KALAH*
  • HP berkurang (maks 30% power lawan)
  • Dapat sedikit EXP hiburan
  • HP 0 = KO, beri makan dulu!

  ⏳ *COOLDOWN* : 3 menit antar adu

  📊 *LEVEL & ATK*
  🥚 Baby   Lv1 → ATK 10
  🐟 Small  Lv2 → ATK 25
  🐠 Medium Lv3 → ATK 50
  🐡 Large  Lv4 → ATK 90
  🦈 Giant  Lv5 → ATK 150
  🐉 Legend Lv6 → ATK 250 (MAX)
💡 Cek ikan kamu di *.akuarium*
💡 Beri makan ikan di *.makankanikan [slot] [food]*`)
        }

        // ── ADUIKAN ───────────────────────────────────────────────────
        if (command === 'aduikan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]

            // ── Cooldown 3 menit ──────────────────────────────────────
            const ADUIKAN_COOLDOWN = 3 * 60 * 1000
            const nowAdu = Date.now()
            if ((nowAdu - (player.lastAduikan || 0)) < ADUIKAN_COOLDOWN) {
                const sisa = Math.ceil((ADUIKAN_COOLDOWN - (nowAdu - (player.lastAduikan || 0))) / 1000)
                const m2 = Math.floor(sisa / 60), s2 = sisa % 60
                return Reply(`⏳ *Cooldown Adu Ikan!*\nTunggu *${m2 > 0 ? m2 + ' menit ' : ''}${s2} detik* lagi.\n💡 Manfaatkan untuk beri makan ikanmu! *.makankanikan*`)
            }

            // ── Cek target lawan ──────────────────────────────────────
            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0]
                if (targetJid && targetJid.endsWith('@lid') && m.isGroup) {
                    const participants = m.metadata?.participants || []
                    const found = participants.find(p => p.lid === targetJid || p.id === targetJid)
                    if (found) targetJid = found.jid || found.id || targetJid
                }
            } else if (m.quoted) targetJid = m.quoted.sender
            if (targetJid) targetJid = resolvePlayerJid(targetJid)

            if (!targetJid) return Reply(`❌ Tag atau reply lawan!\n\n📋 *Format:*\n*.aduikan @user [namaikan]*\n*.aduikan @user minnow*\n*.aduikan @user golden_carp*\n\n💡 Ketik *.infoaduikan* untuk panduan lengkap`)
            if (targetJid === senderJid) return Reply(`❌ Gak bisa adu ikan sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ Lawan belum daftar RPG! Suruh ketik *.rpgstart* dulu.`)

            const opponent = rpgDB.players[targetJid]

            // ── Cek aquarium ──────────────────────────────────────────
            if (!player.aquarium || player.aquarium.length === 0) {
                return Reply(`❌ Kamu belum punya ikan di akuarium!\n\n📋 *Cara punya ikan:*\n1. Mancing → *.mancing*\n2. Pelihara → *.peliharaikan [fishkey]*\n3. Beri makan → *.makankanikan [slot] [food]*`)
            }
            const opponentAliveAquarium = (opponent.aquarium || []).filter(f => (f.hp || 0) > 0)
            if (!opponent.aquarium || opponent.aquarium.length === 0) {
                return Reply(`❌ Lawan tidak punya ikan di akuarium!\nTidak bisa adu ikan.`)
            }
            if (opponentAliveAquarium.length === 0) {
                return Reply(`❌ Semua ikan lawan sedang KO (HP 0)!\nTidak ada ikan lawan yang bisa bertanding saat ini.`)
            }

            // ── Cari ikan kamu by nama/fishId ─────────────────────────
            // Parse: ambil teks setelah hapus @mention
            const fishArg = text ? text.replace(/@\d+/g, '').trim().toLowerCase() : ''

            let myFishIdx = -1

            if (!fishArg) {
                // Tidak ada argumen → tampilkan list ikan kamu
                let listMsg = `✦ 🐠  PILIH IKAN KAMU  🐠\n\n`
                player.aquarium.forEach((f, i) => {
                    const info = getFishAquariumDisplay(f)
                    const hpBar = (() => { const p = Math.min(Math.floor((info.hp / info.maxHp) * 8), 8); return '█'.repeat(p) + '░'.repeat(8 - p) })()
                    const status = (f.hp || 0) <= 0 ? '❌ KO' : `❤️ [${hpBar}] ${info.hp}/${info.maxHp}`
                    listMsg += `  *[Slot ${i+1}]* ${info.name}\n`
                    listMsg += `  🎚️ Lv.${info.lvl} | ${status}\n`
                    listMsg += `  🔑 Key: ${f.fishId}${f.mutationId ? '_'+f.mutationId : ''}\n\n`
                })
                listMsg += `\n`
                listMsg += `📋 *Format:* *.aduikan @user [key]*\nContoh: *.aduikan @user ${player.aquarium[0].fishId}*`
                return Reply(listMsg)
            }

            // Cari berdasarkan fishId atau fishId_mutationId
            for (let i = 0; i < player.aquarium.length; i++) {
                const f = player.aquarium[i]
                const fullKey = f.mutationId ? `${f.fishId}_${f.mutationId}` : f.fishId
                if (f.fishId.toLowerCase() === fishArg || fullKey.toLowerCase() === fishArg) {
                    myFishIdx = i
                    break
                }
            }

            // Juga coba cocokkan dengan nama display
            if (myFishIdx === -1) {
                for (let i = 0; i < player.aquarium.length; i++) {
                    const info = getFishAquariumDisplay(player.aquarium[i])
                    if (info.name.toLowerCase().includes(fishArg)) {
                        myFishIdx = i
                        break
                    }
                }
            }

            if (myFishIdx === -1) {
                let listMsg = `❌ Ikan *"${fishArg}"* tidak ditemukan di akuariummu!\n\nIkan yang kamu punya:\n`
                player.aquarium.forEach((f, i) => {
                    const info = getFishAquariumDisplay(f)
                    const key = f.mutationId ? `${f.fishId}_${f.mutationId}` : f.fishId
                    listMsg += `  Slot ${i+1}: ${info.name} (key: ${key})\n`
                })
                listMsg += `\nContoh: *.aduikan @user ${player.aquarium[0].fishId}*`
                return Reply(listMsg)
            }

            const myFish = player.aquarium[myFishIdx]
            if ((myFish.hp || 0) <= 0) {
                return Reply(`❌ Ikan *${getFishAquariumDisplay(myFish).name}* sedang KO (HP 0)!\nBeri makan dulu: *.makankanikan ${myFishIdx+1} pelet_biasa*`)
            }

            // ── Pilih ikan lawan secara RANDOM dari aquarium aktif ────
            const theirFishIdx = Math.floor(Math.random() * opponentAliveAquarium.length)
            const theirFish = opponentAliveAquarium[theirFishIdx]

            const myInfo    = getFishAquariumDisplay(myFish)
            const theirInfo = getFishAquariumDisplay(theirFish)

            // ── Hitung Power ──────────────────────────────────────────
            const myMutMult    = myFish.mutationId    ? (MUTATION_DATA[myFish.mutationId]?.multiplier    || 1) : 1
            const theirMutMult = theirFish.mutationId ? (MUTATION_DATA[theirFish.mutationId]?.multiplier || 1) : 1

            const myPower    = Math.floor((FISH_BATTLE_ATK_BY_LEVEL[myInfo.lvl]    + Math.floor(Math.random() * 20)) * myMutMult)
            const theirPower = Math.floor((FISH_BATTLE_ATK_BY_LEVEL[theirInfo.lvl] + Math.floor(Math.random() * 20)) * theirMutMult)

            // ── Tentukan pemenang (tie = 50/50) ───────────────────────
            const isDraw = myPower === theirPower
            const myWins = isDraw ? (Math.random() < 0.5) : (myPower > theirPower)

            const winner     = myWins ? player   : opponent
            const winnerFish = myWins ? myFish   : theirFish
            const loserFish  = myWins ? theirFish : myFish
            const winnerInfo = myWins ? myInfo   : theirInfo
            const loserInfo  = myWins ? theirInfo : myInfo

            // ── HP Loss ───────────────────────────────────────────────
            const winnerPower = myWins ? myPower : theirPower
            const hpLoss = Math.max(10, Math.floor(winnerPower * 0.3))
            loserFish.hp = Math.max(0, (loserFish.hp || 10) - hpLoss)

            // ── EXP ───────────────────────────────────────────────────
            const powerDiff   = Math.abs(myPower - theirPower)
            const winExpGain  = 50 + powerDiff * 2
            const loseExpGain = Math.max(10, Math.floor(winExpGain * 0.2))
            winnerFish.exp = (winnerFish.exp || 0) + winExpGain
            loserFish.exp  = (loserFish.exp  || 0) + loseExpGain

            const winnerLvlBefore = myWins ? myInfo.lvl : theirInfo.lvl
            const loserLvlBefore  = myWins ? theirInfo.lvl : myInfo.lvl
            const winnerLvlAfter  = getFishLevel(winnerFish)
            const loserLvlAfter   = getFishLevel(loserFish)
            if (winnerLvlAfter > winnerLvlBefore) winnerFish.hp = FISH_MAX_HP_BY_LEVEL[winnerLvlAfter]
            if (loserLvlAfter  > loserLvlBefore)  loserFish.hp  = FISH_MAX_HP_BY_LEVEL[loserLvlAfter]

            // ── Gold reward ───────────────────────────────────────────
            const goldReward = 150 * winnerInfo.lvl + Math.floor(Math.random() * 300)
            winner.gold += goldReward

            // ── Simpan cooldown ───────────────────────────────────────
            player.lastAduikan = nowAdu
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            // ── Bangun pesan hasil ────────────────────────────────────
            const myTag     = `@${senderJid.split('@')[0]}`
            const theirTag  = `@${targetJid.split('@')[0]}`
            const winnerTag = myWins ? myTag : theirTag
            const loserTag  = myWins ? theirTag : myTag

            const hpBarWin  = (() => { const p = Math.min(Math.floor((winnerFish.hp / FISH_MAX_HP_BY_LEVEL[winnerLvlAfter]) * 10), 10); return '█'.repeat(p) + '░'.repeat(10 - p) })()
            const hpBarLose = (() => { const p = Math.min(Math.floor((loserFish.hp  / FISH_MAX_HP_BY_LEVEL[loserLvlAfter])  * 10), 10); return '█'.repeat(p) + '░'.repeat(10 - p) })()

            let battleMsg = `✦ ── 🐠  ADU IKAN  🐠 ──
  ⚔️  ${myTag} vs ${theirTag}

  🔵 [${myTag}] — PILIHAN SENDIRI
   ${myInfo.name}
   🎚️ Lv.${myInfo.lvl} | ⚔️ Power: *${myPower}*${myFish.mutationId ? ' ✨Mutasi' : ''}

  🔴 [${theirTag}] — RANDOM DARI AKUARIUM
   ${theirInfo.name}
   🎚️ Lv.${theirInfo.lvl} | ⚔️ Power: *${theirPower}*${theirFish.mutationId ? ' ✨Mutasi' : ''}

   HASIL PERTARUNGAN 
${isDraw ? '  🎲 POWER SAMA! Ditentukan keberuntungan...\n' : ''}  🏆 PEMENANG : *${winnerTag}*
   🐟 ${winnerInfo.name} (Lv.${winnerLvlAfter})
   ❤️  HP   : [${hpBarWin}] ${winnerFish.hp}
   💰 Gold  : +${toRupiah(goldReward)}
   ⭐ EXP   : +${winExpGain}

  😔 KALAH : *${loserTag}*
   🐟 ${loserInfo.name} (Lv.${loserLvlAfter})
   ❤️  HP   : [${hpBarLose}] ${loserFish.hp}${loserFish.hp === 0 ? ' ⚠️ KO!' : ''}
   ⭐ EXP   : +${loseExpGain} (hiburan)`

            if (winnerLvlAfter > winnerLvlBefore) battleMsg += `\n\n🎉 *IKAN PEMENANG NAIK LEVEL!*\n${FISH_LEVEL_NAMES[winnerLvlBefore]} → *${FISH_LEVEL_NAMES[winnerLvlAfter]}* 🎊`
            if (loserLvlAfter  > loserLvlBefore)  battleMsg += `\n\n📈 *Ikan yang kalah pun naik level!*\n${FISH_LEVEL_NAMES[loserLvlBefore]} → *${FISH_LEVEL_NAMES[loserLvlAfter]}* 💪`
            if (loserFish.hp === 0) battleMsg += `\n\n⚠️ *${loserInfo.name} milik ${loserTag} KO!*\nBeri makan: *.makankanikan [slot] pelet_biasa*`
            battleMsg += `\n\n⏳ Cooldown 3 menit | 💡 *.infoaduikan* untuk panduan`

            return alip.sendMessage(m.chat, { text: battleMsg, mentions: [senderJid, targetJid] }, { quoted: m })
        }

        // 
        //  🏰  SISTEM CLAN
        // 
        const clanDBPath = './library/database/clan.json'

        function loadClanDB() {
            try {
                if (!fs.existsSync(clanDBPath)) {
                    fs.writeFileSync(clanDBPath, JSON.stringify({ clans: {} }, null, 2))
                }
                const raw = JSON.parse(fs.readFileSync(clanDBPath))
                // Pastikan clans selalu object, bukan null/undefined
                if (!raw || typeof raw !== 'object') return { clans: {} }
                if (!raw.clans || typeof raw.clans !== 'object') raw.clans = {}
                return raw
            } catch { return { clans: {} } }
        }

        function saveClanDB(db) {
            if (!db || typeof db !== 'object') db = { clans: {} }
            if (!db.clans || typeof db.clans !== 'object') db.clans = {}
            fs.writeFileSync(clanDBPath, JSON.stringify(db, null, 2))
        }

        function findPlayerClan(clanDB, jid) {
            if (!clanDB || !clanDB.clans || typeof clanDB.clans !== 'object') return null
            for (const [clanId, clan] of Object.entries(clanDB.clans)) {
                if (!clan || typeof clan !== 'object') continue
                if (!Array.isArray(clan.members)) clan.members = []
                if (clan.members.includes(jid)) return { clanId, clan }
            }
            return null
        }

        function getClanPower(clan, rpgDB) {
    let total = 0
    const members = Array.isArray(clan.members) ? clan.members : []
    for (const jid of members) {
        const p = (rpgDB.players || {})[jid]
        if (p) {
            const stats = getPlayerTotalStats(p)
            total += (stats.totalAttack || stats.attack || 0) + (stats.totalDefense || stats.defense || 0) + (p.level || 1) * 5
        }
    }
    return total
}

function formatTime(seconds) {
    if (seconds <= 0) return '0 detik'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    let result = []
    if (hours > 0) result.push(`${hours} jam`)
    if (minutes > 0) result.push(`${minutes} menit`)
    if (secs > 0 && result.length === 0) result.push(`${secs} detik`)
    return result.join(' ') || '0 detik'
}

        // ── .buatclan ─────────────────────────────────────────
        if (command === 'buatclan') {
            if (!isPremium && !isCreator) return Reply(`👑 *KHUSUS PREMIUM!*\n\nHanya member premium yang bisa membuat clan!\nHub admin untuk upgrade akun kamu.`)

            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const existingClan = findPlayerClan(clanDB, senderJid)
            if (existingClan) return Reply(`❌ Kamu sudah bergabung dengan clan *${existingClan.clan.emblem} ${existingClan.clan.name}*!\nKeluar dulu dengan *.keluarclan*`)

            const parts = text ? text.trim().split(' ') : []
            if (parts.length < 2) return Reply(`❌ Format salah!\n\nContoh: *.buatclan 🔥 NamaClan*\n\n📌 Lambang harus berupa emoji\n📌 Nama tidak boleh kosong`)

            const emblem = parts[0]
            const name = parts.slice(1).join(' ')

            // Validasi emblem (emoji check sederhana)
            const emojiRegex = /\p{Emoji}/u
            if (!emojiRegex.test(emblem)) return Reply(`❌ Lambang harus berupa *emoji*!\nContoh: 🔥 ⚔️ 🐉 🌟 💀`)

            if (name.length < 3 || name.length > 20) return Reply(`❌ Nama clan harus 3-20 karakter!`)

            // Cek nama duplikat
            const dupName = Object.values(clanDB.clans).find(c => c && c.name && c.name.toLowerCase() === name.toLowerCase())
            if (dupName) return Reply(`❌ Nama clan *${name}* sudah dipakai! Pilih nama lain.`)

            // Generate short 6-char alphanumeric clan code (uppercase), unik
            const genShortId = () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                let id = ''
                for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
                return id
            }
            let clanCode = genShortId()
            const existingCodes = new Set(Object.values(clanDB.clans).map(c => c && c.clanCode).filter(Boolean))
            while (existingCodes.has(clanCode)) clanCode = genShortId()

            const clanId = `clan_${Date.now()}`
            clanDB.clans[clanId] = {
                id: clanId,
                clanCode: clanCode,
                name: name,
                emblem: emblem,
                leader: senderJid,
                members: [senderJid],
                maxMembers: 4,
                renameCount: 0,
                maxRename: 2,
                gold: 0,
                createdAt: Date.now(),
                lastRaid: 0,
                wins: 0,
                losses: 0,
                description: 'Clan baru yang keren!'
            }
            saveClanDB(clanDB)

            return Reply(`✦ ── 🏰  CLAN DIBUAT!  🏰 ──
  ${emblem} Nama    : *${name}*
  🆔 ID Clan : *#${clanCode}*
  👑 Leader  : @${senderJid.split('@')[0]}
  👥 Member  : 1/4
  🔄 Rename  : 2x tersisa
  💰 Kas     : Rp. 0
  🏆 W/L     : 0/0

✅ Clan berhasil dibuat!
📢 Bagikan ID clan: *#${clanCode}*
💡 Teman bisa gabung: *.gabukclan ${clanCode}* atau *.gabukclan ${name}*`)
        }

        // ── .listclan ─────────────────────────────────────────
        if (command === 'listclan') {
            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const clans = Object.values(clanDB.clans).filter(c => c && c.name)
            if (clans.length === 0) return Reply(`📭 Belum ada clan yang dibuat!\n\n💡 Buat clan pertama dengan: *.buatclan [emoji] [nama]*\n(Khusus member premium)`)

            let msg = `✦ 🏰  DAFTAR CLAN  🏰\n\n`
            clans.forEach((clan, i) => {
                const memberCount = Array.isArray(clan.members) ? clan.members.length : 0
                const maxSlot = clan.maxMembers || 4
                const cid = clan.clanCode ? `#${clan.clanCode}` : `-`
                msg += `  ${i + 1}. ${clan.emblem || '🏰'} *${clan.name}*\n`
                msg += `   🆔 ID   : *${cid}*\n`
                msg += `   👥 ${memberCount}/${maxSlot} member | 🏆 ${clan.wins || 0}W/${clan.losses || 0}L\n`
                msg += `   👑 Leader: @${(clan.leader || '').split('@')[0]}\n`
                if (i < clans.length - 1) msg += `\n`
            })
            msg += `\n\n💡 Gabung: *.gabukclan [nama]* atau *.gabukclan [ID]*\n🆕 Buat clan: *.buatclan [emoji] [nama]* _(premium)_`
            return alip.sendMessage(m.chat, { text: msg, mentions: clans.map(c => c.leader).filter(Boolean) }, { quoted: m })
        }

        // ── .gabukclan ────────────────────────────────────────
        if (command === 'gabukclan') {
            if (!text) return Reply(`❌ Sebutkan nama clan!\nContoh: *.gabukclan Phoenix*`)

            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const existingClan = findPlayerClan(clanDB, senderJid)
            if (existingClan) return Reply(`❌ Kamu sudah di clan *${existingClan.clan.emblem} ${existingClan.clan.name}*!\nKeluar dulu dengan *.keluarclan*`)

            if (!rpgDB.players || !rpgDB.players[senderJid]) return Reply(`❌ Kamu belum terdaftar RPG! Gunakan *.rpgstart* dulu.`)

            const input = text.trim()
            const inputCode = input.toUpperCase().replace(/^#/, "")
            const targetClan = Object.entries(clanDB.clans).find(([, c]) => {
                if (!c || !c.name) return false
                return c.name.toLowerCase() === input.toLowerCase() ||
                       (c.clanCode && c.clanCode.toUpperCase() === inputCode)
            })
            if (!targetClan) return Reply(`❌ Clan *${input}* tidak ditemukan!\nLihat daftar: *.listclan*`)

            const [clanId, clan] = targetClan
            if (!Array.isArray(clan.members)) clan.members = []
            const maxSlot = clan.maxMembers || 4
            if (clan.members.length >= maxSlot) return Reply(`❌ Clan *${clan.emblem} ${clan.name}* sudah penuh! (${clan.members.length}/${maxSlot} member)\nCari clan lain: *.listclan*`)

            clan.members.push(senderJid)
            saveClanDB(clanDB)

            return alip.sendMessage(m.chat, {
                text: `✦ 🏰  BERGABUNG CLAN  🏰\n\n  ${clan.emblem} Clan   : *${clan.name}*\n  👤 Member  : @${senderJid.split('@')[0]}\n  👥 Anggota : ${clan.members.length}/${maxSlot}\n\n\n✅ Berhasil bergabung!`,
                mentions: [senderJid]
            }, { quoted: m })
        }

        // ── .keluarclan ───────────────────────────────────────
        if (command === 'keluarclan') {
            const clanDB = loadClanDB()
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)

            const { clanId, clan } = found
            if (clan.leader === senderJid && clan.members.length > 1) return Reply(`❌ Kamu adalah leader! Transfer kepemimpinan dulu dengan *.transferclan @user* sebelum keluar.`)

            clan.members = clan.members.filter(j => j !== senderJid)
            if (clan.members.length === 0) {
                delete clanDB.clans[clanId]
                saveClanDB(clanDB)
                return Reply(`🏚️ Kamu keluar dan clan *${clan.emblem} ${clan.name}* dibubarkan karena tidak ada anggota!`)
            }
            if (clan.leader === senderJid) clan.leader = clan.members[0]
            saveClanDB(clanDB)
            return Reply(`✅ Berhasil keluar dari clan *${clan.emblem} ${clan.name}*!`)
        }

        // ── .infoclan ─────────────────────────────────────────
        if (command === 'infoclan') {
            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            let targetClan = null

            if (text) {
                const inp = text.trim()
                const inpCode = inp.toUpperCase().replace(/^#/, "")
                const entry = Object.entries(clanDB.clans).find(([, c]) => {
                    if (!c || !c.name) return false
                    return c.name.toLowerCase() === inp.toLowerCase() ||
                           (c.clanCode && c.clanCode.toUpperCase() === inpCode)
                })
                if (entry) targetClan = entry[1]
                else return Reply(`❌ Clan *${inp}* tidak ditemukan!`)
            } else {
                const found = findPlayerClan(clanDB, senderJid)
                if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!\nCek clan tertentu: *.infoclan [nama]*`)
                targetClan = found.clan
            }

            if (!Array.isArray(targetClan.members)) targetClan.members = []
            const memberTags = targetClan.members.map(j => `   ${j === targetClan.leader ? '👑' : '⚔️'} @${j.split('@')[0]}`).join('\n')
            const now = Date.now()
            const raidCool = targetClan.lastRaid ? Math.max(0, 3 * 60 * 60 * 1000 - (now - targetClan.lastRaid)) : 0
            const maxSlot = targetClan.maxMembers || 4

            const codeDisplay = targetClan.clanCode ? `#${targetClan.clanCode}` : `-`
            let msg = `✦ 🏰  INFO CLAN  🏰\n\n  ${targetClan.emblem || '🏰'} Nama    : *${targetClan.name}*\n  🆔 ID Clan : *${codeDisplay}*\n  👑 Leader  : @${(targetClan.leader || '').split('@')[0]}\n  👥 Member  : ${targetClan.members.length}/${maxSlot}\n  💰 Kas     : ${toRupiah(targetClan.gold || 0)}\n  🏆 Menang  : ${targetClan.wins || 0}\n  💀 Kalah   : ${targetClan.losses || 0}\n  🔄 Rename  : ${(targetClan.maxRename || 2) - (targetClan.renameCount || 0)}x tersisa\n\n  👥 ANGGOTA:\n${memberTags}\n\n  ⚔️ Raid CD : ${raidCool > 0 ? formatTime(raidCool / 1000) : 'Siap!'}\n`
            return alip.sendMessage(m.chat, { text: msg, mentions: targetClan.members }, { quoted: m })
        }

        // ── .renameclan ───────────────────────────────────────
        if (command === 'renameclan') {
            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)
            const { clanId, clan } = found
            if (clan.leader !== senderJid) return Reply(`❌ Hanya leader yang bisa rename clan!`)

            const maxRename = clan.maxRename || 2
            if ((clan.renameCount || 0) >= maxRename) return Reply(`❌ Batas rename sudah habis!\n\nClan hanya bisa di-rename *2x* selama pembuatan.`)

            const parts = text ? text.trim().split(' ') : []
            if (parts.length < 2) return Reply(`❌ Format: *.renameclan [emoji_baru] [nama_baru]*\nContoh: *.renameclan 🌟 ClanBaru*`)

            const newEmblem = parts[0]
            const newName = parts.slice(1).join(' ')
            const emojiRegex = /\p{Emoji}/u
            if (!emojiRegex.test(newEmblem)) return Reply(`❌ Lambang harus emoji!`)
            if (newName.length < 3 || newName.length > 20) return Reply(`❌ Nama clan 3-20 karakter!`)

            const dupName = Object.entries(clanDB.clans).find(([id, c]) => c && c.name && c.name.toLowerCase() === newName.toLowerCase() && id !== clanId)
            if (dupName) return Reply(`❌ Nama *${newName}* sudah dipakai!`)

            const oldName = clan.name
            const oldEmblem = clan.emblem
            clan.name = newName
            clan.emblem = newEmblem
            clan.renameCount = (clan.renameCount || 0) + 1
            saveClanDB(clanDB)

            return Reply(`✅ Clan berhasil diubah!\n\n${oldEmblem} *${oldName}* → ${newEmblem} *${newName}*\n\n🔄 Sisa rename: *${maxRename - clan.renameCount}x*`)
        }

        // ── .kickclan ─────────────────────────────────────────
        if (command === 'kickclan') {
            const clanDB = loadClanDB()
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)
            const { clan } = found
            if (clan.leader !== senderJid) return Reply(`❌ Hanya leader yang bisa kick member!`)

            let targetJid = null
            if (m.mentionedJid?.length > 0) targetJid = m.mentionedJid[0]
            else if (m.quoted) targetJid = m.quoted.sender
            if (!targetJid) return Reply(`❌ Tag atau reply member yang ingin di-kick!`)
            if (targetJid === senderJid) return Reply(`❌ Kamu tidak bisa kick dirimu sendiri!`)
            if (!clan.members.includes(targetJid)) return Reply(`❌ User tersebut bukan member clan ini!`)

            clan.members = clan.members.filter(j => j !== targetJid)
            saveClanDB(clanDB)
            return alip.sendMessage(m.chat, { text: `✅ @${targetJid.split('@')[0]} berhasil di-kick dari clan *${clan.emblem} ${clan.name}*!`, mentions: [targetJid] }, { quoted: m })
        }

        // ── .transferclan ─────────────────────────────────────
        if (command === 'transferclan') {
            const clanDB = loadClanDB()
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)
            const { clan } = found
            if (clan.leader !== senderJid) return Reply(`❌ Hanya leader yang bisa transfer kepemimpinan!`)

            let targetJid = null
            if (m.mentionedJid?.length > 0) targetJid = m.mentionedJid[0]
            else if (m.quoted) targetJid = m.quoted.sender
            if (!targetJid) return Reply(`❌ Tag atau reply member yang akan dijadikan leader!`)
            if (!clan.members.includes(targetJid)) return Reply(`❌ User tersebut bukan member clan ini!`)

            clan.leader = targetJid
            saveClanDB(clanDB)
            return alip.sendMessage(m.chat, { text: `👑 Kepemimpinan clan *${clan.emblem} ${clan.name}* berhasil ditransfer ke @${targetJid.split('@')[0]}!`, mentions: [targetJid] }, { quoted: m })
        }

        // ── .depositclan ──────────────────────────────────────
        if (command === 'depositclan') {
            const clanDB = loadClanDB()
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)

            const amount = parseInt(text)
            if (isNaN(amount) || amount <= 0) return Reply(`❌ Masukkan jumlah gold!\nContoh: *.depositclan 5000*`)

            const player = rpgDB.players[senderJid]
            if (!player) return Reply(`❌ Kamu belum terdaftar RPG!`)
            if ((player.gold || 0) < amount) return Reply(`❌ Gold kamu tidak cukup! Gold kamu: ${toRupiah(player.gold)}`)

            player.gold -= amount
            found.clan.gold = (found.clan.gold || 0) + amount
            saveClanDB(clanDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✅ Berhasil deposit *${toRupiah(amount)}* ke kas clan!\n💰 Kas clan sekarang: ${toRupiah(found.clan.gold)}`)
        }

        // ── .serangclan ───────────────────────────────────────
        if (command === 'serangclan') {
            if (!isPremium && !isCreator) return Reply(`👑 *KHUSUS PREMIUM!*\n\nHanya member premium yang bisa memulai serangan clan!`)

            const clanDB = loadClanDB()
            const atkFound = findPlayerClan(clanDB, senderJid)
            if (!atkFound) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)

            const { clan: atkClan } = atkFound
            if (atkClan.leader !== senderJid && !isCreator) return Reply(`❌ Hanya leader yang bisa memimpin serangan clan!`)

            const now = Date.now()
            const raidCooldown = 3 * 60 * 60 * 1000 // 3 jam
            if (atkClan.lastRaid && now - atkClan.lastRaid < raidCooldown) {
                const sisa = raidCooldown - (now - atkClan.lastRaid)
                return Reply(`⏳ Clan kamu masih cooldown!\nBisa menyerang lagi dalam: *${formatTime(sisa / 1000)}*`)
            }

            if (!text) return Reply(`❌ Sebutkan nama clan yang ingin diserang!\nContoh: *.serangclan NamaClan*`)

            const defEntry = Object.entries(clanDB.clans).find(([, c]) => c.name.toLowerCase() === text.trim().toLowerCase())
            if (!defEntry) return Reply(`❌ Clan *${text.trim()}* tidak ditemukan!\nLihat daftar: *.listclan*`)

            const [defClanId, defClan] = defEntry
            if (defClanId === atkFound.clanId) return Reply(`❌ Kamu tidak bisa menyerang clan sendiri!`)

            // Hitung power masing-masing clan (+ buff bonus)
            const now2 = Date.now()
            const atkBuffs = atkClan.buffs || {}
            const defBuffs2 = defClan.buffs || {}

            const atkAtkBonus = (atkBuffs['atk_buff'] || 0) > now2 ? 10 * (atkClan.members || []).length : 0
            const defDefBonus = (defBuffs2['def_buff'] || 0) > now2 ? 10 * (defClan.members || []).length : 0

            const atkPower = getClanPower(atkClan, rpgDB) + atkAtkBonus
            const defPower = getClanPower(defClan, rpgDB) + defDefBonus

            // Formula: 60% base power + 40% random luck
            const atkScore = atkPower * 0.6 + Math.random() * atkPower * 0.4 + ((Array.isArray(atkClan.members) ? atkClan.members.length : 0) * 50)
            const defScore = defPower * 0.6 + Math.random() * defPower * 0.4 + ((Array.isArray(defClan.members) ? defClan.members.length : 0) * 50)

            const atkWins = atkScore >= defScore

            // Hitung rampasan (20-35% dari kas clan yang kalah)
            const loserClan = atkWins ? defClan : atkClan
            const winnerClan = atkWins ? atkClan : defClan
            const stealPct = 0.20 + Math.random() * 0.15
            const stolenGold = Math.floor((loserClan.gold || 0) * stealPct)

            loserClan.gold = Math.max(0, (loserClan.gold || 0) - stolenGold)
            winnerClan.gold = (winnerClan.gold || 0) + stolenGold

            if (atkWins) {
                atkClan.wins = (atkClan.wins || 0) + 1
                defClan.losses = (defClan.losses || 0) + 1
            } else {
                defClan.wins = (defClan.wins || 0) + 1
                atkClan.losses = (atkClan.losses || 0) + 1
            }

            atkClan.lastRaid = now
            saveClanDB(clanDB)

            const winEmoji = atkWins ? '🏆' : '💀'
            const resultText = atkWins ? '🎉 CLAN KAMU MENANG!' : '😔 CLAN KAMU KALAH!'
            const goldText = atkWins
                ? `💰 Berhasil merampok *${toRupiah(stolenGold)}* dari kas ${defClan.emblem} ${defClan.name}!`
                : `💸 ${defClan.emblem} ${defClan.name} berhasil mempertahankan diri!\nKas kamu berkurang *${toRupiah(stolenGold)}*`

            const atkBar = Math.min(10, Math.round(atkScore / (atkScore + defScore) * 10))
            const defBar = 10 - atkBar
            const powerBar = `${'⚔️'.repeat(atkBar)}${'🛡️'.repeat(defBar)}`

            return Reply(`✦ ── ⚔️  PERANG CLAN  ⚔️ ──
  ${atkClan.emblem} ${atkClan.name} VS ${defClan.emblem} ${defClan.name}

  ⚔️  Power Serang : ${atkPower}
  🛡️  Power Tahan  : ${defPower}

  ${powerBar}

  ${winEmoji} *${resultText}*
  ${goldText}

  💰 Kas ${atkClan.emblem} ${atkClan.name}: ${toRupiah(atkClan.gold)}
  💰 Kas ${defClan.emblem} ${defClan.name}: ${toRupiah(defClan.gold)}

  ⏳ Cooldown serangan: 3 jam`)
        }

        // ── .rampokclan ───────────────────────────────────────
        if (command === 'rampokclan') {
            if (!isPremium && !isCreator) return Reply(`👑 *KHUSUS PREMIUM!*\n\nHanya member premium yang bisa memimpin perampokan clan!`)

            const clanDB = loadClanDB()
            const atkFound = findPlayerClan(clanDB, senderJid)
            if (!atkFound) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)

            const { clan: atkClan } = atkFound
            if (!text) return Reply(`❌ Sebutkan nama clan target!\nContoh: *.rampokclan NamaClan*\n\n💡 Berbeda dengan *.serangclan*, rampokan fokus mencuri lebih banyak gold tapi risikonya lebih tinggi!`)

            const defEntry = Object.entries(clanDB.clans).find(([, c]) => c.name.toLowerCase() === text.trim().toLowerCase())
            if (!defEntry) return Reply(`❌ Clan *${text.trim()}* tidak ditemukan!`)

            const [defClanId, defClan] = defEntry
            if (defClanId === atkFound.clanId) return Reply(`❌ Tidak bisa merampok clan sendiri!`)

            const now = Date.now()
            const robbCooldown = 2 * 60 * 60 * 1000
            const robbKey = `lastRobb_${defClanId}`
            if (atkClan[robbKey] && now - atkClan[robbKey] < robbCooldown) {
                return Reply(`⏳ Masih cooldown merampok clan ini!\nBisa lagi dalam: *${formatTime((robbCooldown - (now - atkClan[robbKey])) / 1000)}*`)
            }

            const player = rpgDB.players[senderJid]
            if (!player) return Reply(`❌ Kamu belum terdaftar RPG!`)

            // Cek kas_shield buff pada clan defender
            const defBuffs = defClan.buffs || {}
            const shieldExpiry = defBuffs['kas_shield'] || 0
            if (shieldExpiry > now) {
                const sisaJam = Math.ceil((shieldExpiry - now) / 3600000)
                return Reply(`✦ 🔒  KAS TERLINDUNGI!  🔒\n\n  🏰 Clan ${defClan.emblem} *${defClan.name}*\n   sedang aktif *Kas Shield*!\n\n  ⏳ Shield habis dalam: *${sisaJam} jam*\n  ❌ Kas mereka tidak bisa dirampok!\n`)
            }

            // Rampokan: player solo vs seluruh clan
            const playerPower = getPlayerTotalStats(player).totalAttack + (player.level || 1) * 3
            const defPower = getClanPower(defClan, rpgDB)

            const successChance = Math.min(0.75, Math.max(0.15, playerPower / (playerPower + defPower * 0.5)))
            const success = Math.random() < successChance

            let msg = ''
            if (success) {
                const stealPct = 0.30 + Math.random() * 0.20
                const stolen = Math.floor((defClan.gold || 0) * stealPct)
                defClan.gold = Math.max(0, (defClan.gold || 0) - stolen)
                player.gold = (player.gold || 0) + stolen
                atkClan[robbKey] = now
                saveClanDB(clanDB)
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                msg = `✦ 💰  RAMPOKAN BERHASIL!  💰\n\n  🥷 Perampok : @${senderJid.split('@')[0]}\n  🏰 Target   : ${defClan.emblem} ${defClan.name}\n\n  💰 Berhasil mencuri: *${toRupiah(stolen)}*\n  💸 Kas ${defClan.emblem} tersisa: ${toRupiah(defClan.gold)}\n\n  ⏳ Cooldown: 2 jam\n`
            } else {
                const penalty = Math.floor((player.gold || 0) * 0.10)
                player.gold = Math.max(0, (player.gold || 0) - penalty)
                atkClan[robbKey] = now
                saveClanDB(clanDB)
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                msg = `✦ 💀  RAMPOKAN GAGAL!  💀\n\n  🥷 Perampok : @${senderJid.split('@')[0]}\n  🏰 Target   : ${defClan.emblem} ${defClan.name}\n\n  ❌ Kamu tertangkap!\n  💸 Denda: *${toRupiah(penalty)}*\n  💰 Sisa gold kamu: ${toRupiah(player.gold)}\n\n  ⏳ Cooldown: 2 jam\n`
            }
            return alip.sendMessage(m.chat, { text: msg, mentions: [senderJid] }, { quoted: m })
        }

        // ── .clanhelp ─────────────────────────────────────────
        if (command === 'clanhelp') {
            return Reply(`✦ ── 🏰  PANDUAN CLAN  🏰 ──
  🔧 *PEMBUATAN & MANAGEMENT*
  *.buatclan [🔥] [nama]*
  └ Buat clan baru _(Premium only)_
  *.listclan*
  └ Lihat semua clan
  *.infoclan [nama?]*
  └ Info detail clan
  *.renameclan [🔥] [nama baru]*
  └ Ganti nama & lambang _(maks 2x)_

  👥 *KEANGGOTAAN*
  *.gabukclan [nama]*
  └ Bergabung ke clan
  *.keluarclan*
  └ Keluar dari clan
  *.kickclan @user*
  └ Keluarkan member _(leader only)_
  *.transferclan @user*
  └ Transfer kepemimpinan
  *.depositclan [amount]*
  └ Setor gold ke kas clan

  🏪 *TOKO CLAN*
  *.tokoclan*
  └ Lihat item buff yang bisa dibeli
  *.beliclan [item]*
  └ Beli buff pakai kas clan _(leader)_

  ⚔️ *PERANG & RAMPOKAN*
  *.serangclan [nama]*
  └ Serang clan lain _(Premium, CD: 3j)_
  *.rampokclan [nama]*
  └ Rampok kas clan _(Premium, CD: 2j)_

  ℹ️ *INFO*
  👥 Maks anggota: 4 orang
  🔄 Rename: 2x seumur hidup
  👑 Pembuat clan: khusus premium
  💰 Kas clan: bisa diisi semua member`)
        }

// 
//  CLAN: TOKO CLAN
// 

        if (command === 'tokoclan') {
            if (!rpgDB.players || !rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!\nGabung dulu dengan *.gabukclan [nama]*`)

            const { clan } = found
            if (!clan.buffs || typeof clan.buffs !== 'object') clan.buffs = {}
            const now = Date.now()
            const buffs = clan.buffs

            const TOKO_CLAN = {
                'exp_boost':   { name: '⭐ EXP Boost',    harga: 5000000,  durasi: 24, desc: 'EXP +50% untuk semua member, 24 jam' },
                'gold_boost':  { name: '💰 Gold Boost',   harga: 8000000,  durasi: 24, desc: 'Gold drop +50% untuk semua member, 24 jam' },
                'atk_buff':    { name: '⚔️ ATK Buff',     harga: 6000000,  durasi: 12, desc: 'ATK +10 untuk semua member, 12 jam' },
                'def_buff':    { name: '🛡️ DEF Buff',     harga: 6000000,  durasi: 12, desc: 'DEF +10 untuk semua member, 12 jam' },
                'drop_boost':  { name: '🎁 Drop Boost',   harga: 10000000, durasi: 24, desc: 'Chance drop item langka x2, 24 jam' },
                'kas_shield':  { name: '🔒 Kas Shield',   harga: 7000000,  durasi: 12, desc: 'Kas aman dari rampokclan, 12 jam' },
                'slot_expand': { name: '👥 Slot Expand',  harga: 20000000, durasi: 0,  desc: '+2 slot anggota permanen (maks 10)' },
            }

            const daftar = Object.entries(TOKO_CLAN).map(([key, item]) => {
                let status = ''
                if (item.durasi === 0) {
                    const maxSlot = clan.maxMembers || 4
                    status = maxSlot >= 10 ? ' ⛔ _(maks tercapai)_' : ` — Slot saat ini: ${maxSlot}`
                } else {
                    const expiry = buffs[key] || 0
                    if (expiry > now) {
                        const sisaJam = Math.ceil((expiry - now) / 3600000)
                        status = ` ✅ _(aktif ${sisaJam}j lagi)_`
                    }
                }
                return `  🔹 *${key}*${status}\n   ${item.name} — ${toRupiah(item.harga)}\n   📝 ${item.desc}`
            }).join('\n\n')

            const isLeader = clan.leader === senderJid
            const leaderNote = isLeader ? `📌 Kamu leader! Beli dengan *.beliclan [item]*` : `📌 Hanya leader yang bisa beli`

            return Reply(`✦ 🏪  TOKO CLAN  🏪\n\n  🏰 Clan : ${clan.emblem} *${clan.name}*\n  💰 Kas  : *${toRupiah(clan.gold || 0)}*\n\n${daftar}\n\n  ${leaderNote}\n  Contoh: *.beliclan exp_boost*\n`)
        }

        if (command === 'beliclan') {
            if (!rpgDB.players || !rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            const clanDB = loadClanDB()
            if (!clanDB.clans) clanDB.clans = {}
            const found = findPlayerClan(clanDB, senderJid)
            if (!found) return Reply(`❌ Kamu tidak bergabung di clan manapun!`)

            const { clan } = found
            if (!clan.buffs || typeof clan.buffs !== 'object') clan.buffs = {}
            if (clan.leader !== senderJid) return Reply(`❌ Hanya *leader* clan yang bisa belanja di toko!\n👑 Leader: @${(clan.leader || '').split('@')[0]}`)

            const TOKO_CLAN = {
                'exp_boost':   { name: '⭐ EXP Boost',    harga: 5000000,  durasi: 24, desc: 'EXP +50% untuk semua member, 24 jam' },
                'gold_boost':  { name: '💰 Gold Boost',   harga: 8000000,  durasi: 24, desc: 'Gold drop +50% untuk semua member, 24 jam' },
                'atk_buff':    { name: '⚔️ ATK Buff',     harga: 6000000,  durasi: 12, desc: 'ATK +10 untuk semua member, 12 jam' },
                'def_buff':    { name: '🛡️ DEF Buff',     harga: 6000000,  durasi: 12, desc: 'DEF +10 untuk semua member, 12 jam' },
                'drop_boost':  { name: '🎁 Drop Boost',   harga: 10000000, durasi: 24, desc: 'Chance drop item langka x2, 24 jam' },
                'kas_shield':  { name: '🔒 Kas Shield',   harga: 7000000,  durasi: 12, desc: 'Kas aman dari rampokclan, 12 jam' },
                'slot_expand': { name: '👥 Slot Expand',  harga: 20000000, durasi: 0,  desc: '+2 slot anggota permanen (maks 10)' },
            }

            // Ambil dari args[0] agar tidak bentrok dengan nama clan di text
            const itemKey = (args[0] || '').trim().toLowerCase()
            if (!itemKey || !TOKO_CLAN[itemKey]) {
                const list = Object.keys(TOKO_CLAN).map(k => `*${k}*`).join(', ')
                return Reply(`❌ Item tidak ditemukan!\n\n📋 Item tersedia:\n${list}\n\nContoh: *.beliclan exp_boost*\nLihat daftar lengkap: *.tokoclan*`)
            }

            const item = TOKO_CLAN[itemKey]
            const kasSekarang = clan.gold || 0

            if (kasSekarang < item.harga) {
                return Reply(`✦ ❌  KAS TIDAK CUKUP  ❌\n\n  🏪 Item   : ${item.name}\n  💸 Harga  : ${toRupiah(item.harga)}\n  💰 Kas    : ${toRupiah(kasSekarang)}\n  📉 Kurang : ${toRupiah(item.harga - kasSekarang)}\n\n  📌 Isi kas dengan *.depositclan [jumlah]*\n`)
            }

            const now = Date.now()
            clan.buffs = clan.buffs || {}

            // Slot expand — permanen, tidak berdurasi
            if (itemKey === 'slot_expand') {
                if ((clan.maxMembers || 4) >= 10) return Reply(`❌ Slot anggota sudah maksimum (10 orang)!`)
                clan.maxMembers = Math.min(10, (clan.maxMembers || 4) + 2)
                clan.gold = kasSekarang - item.harga
                saveClanDB(clanDB)
                return Reply(`✦ 🏪  BELI BERHASIL!  🏪\n\n  ${item.name}\n  👥 Slot anggota kini: *${clan.maxMembers} orang*\n  💸 Biaya    : ${toRupiah(item.harga)}\n  💰 Kas sisa : ${toRupiah(clan.gold)}\n\n_Slot clan berhasil diperluas! 🎉_`)
            }

            // Buff berdurasi — stack jika sudah aktif
            const existingExpiry = clan.buffs[itemKey] || 0
            const baseTime = Math.max(now, existingExpiry)
            clan.buffs[itemKey] = baseTime + item.durasi * 3600000
            clan.gold = kasSekarang - item.harga
            saveClanDB(clanDB)

            const expiredAt = new Date(clan.buffs[itemKey]).toLocaleString('id-ID')
            const memberMentions = Array.isArray(clan.members) ? clan.members : []

            return alip.sendMessage(m.chat, {
                text: `✦ 🏪  TOKO CLAN — BELI BERHASIL!  🏪\n\n  🏰 Clan   : ${clan.emblem} *${clan.name}*\n  🎁 Item   : ${item.name}\n  📝 Efek   : ${item.desc}\n  ⏳ Aktif hingga: *${expiredAt}*\n\n  💸 Biaya    : ${toRupiah(item.harga)}\n  💰 Kas sisa : ${toRupiah(clan.gold)}\n\n  📢 Buff aktif untuk semua member!\n  ${memberMentions.map(j => '@' + j.split('@')[0]).join(' ')}\n`,
                mentions: memberMentions
            }, { quoted: m })
        }

        // 
        //  💒  SIMULATOR KEHIDUPAN
        // 

        // ── .lamar — Melamar pemain lain ─────────────────────────
        if (command === 'lamar') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.pasangan) return Reply(`❌ Kamu sudah menikah dengan *${player.pasanganNama || 'seseorang'}*! Cerai dulu dengan *.cerai*`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) targetJid = resolveMentionJid(m.mentionedJid[0])
            else if (m.quoted) targetJid = resolveMentionJid(m.quoted.sender)
            if (!targetJid) return Reply(`❌ Tag atau reply siapa yang mau kamu lamar!\nContoh: *.lamar @user*`)
            // Normalize ke @s.whatsapp.net sebagai kunci standar
            if (targetJid.endsWith('@lid')) targetJid = targetJid.replace('@lid', '@s.whatsapp.net')
            if (targetJid === senderJid) return Reply(`❌ Kamu tidak bisa melamar diri sendiri!`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ User itu belum terdaftar sebagai petualang! Suruh mereka ketik *.rpgstart* dulu.`)
            const target = rpgDB.players[targetJid]
            if (target.pasangan) return Reply(`❌ User itu sudah menikah!`)

            // Syarat: harus punya gold minimal Rp 500.000 (mas kawin)
            const BIAYA_NIKAH = 7000000
            if ((player.gold || 0) < BIAYA_NIKAH) return Reply(`❌ Kamu butuh minimal *${toRupiah(BIAYA_NIKAH)}* sebagai mas kawin untuk melamar!`)

            // Simpan proposal
            if (!rpgDB.proposals) rpgDB.proposals = {}
            rpgDB.proposals[targetJid] = {
                from: senderJid,
                time: Date.now()
            }
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 💍  LAMARAN CINTA  💍\n\n  💌 @${senderJid.split('@')[0]} melamar @${targetJid.split('@')[0]}!\n\n  💍 Mas kawin siap: *${toRupiah(BIAYA_NIKAH)}*\n\n  ❓ @${targetJid.split('@')[0]}, ketik:\n  *.terima* — Terima lamaran 💖\n  *.tolak*  — Tolak lamaran 💔\n`,
                mentions: [senderJid, targetJid]
            }, { quoted: m })
        }

        // ── .terima — Terima lamaran ──────────────────────────────
        if (command === 'terima') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (player.pasangan) return Reply(`❌ Kamu sudah menikah!`)
            // Cari proposal dengan normalisasi JID
            const normSenderJid = senderJid.endsWith('@lid') ? senderJid.replace('@lid', '@s.whatsapp.net') : senderJid
            if (!rpgDB.proposals || (!rpgDB.proposals[senderJid] && !rpgDB.proposals[normSenderJid])) return Reply(`❌ Kamu tidak punya lamaran masuk saat ini!`)
            const prop = rpgDB.proposals[normSenderJid] || rpgDB.proposals[senderJid]
            const proposalKey = rpgDB.proposals[normSenderJid] ? normSenderJid : senderJid
            // Cek proposal tidak expired (24 jam)
            if (Date.now() - prop.time > 24 * 60 * 60 * 1000) {
                delete rpgDB.proposals[proposalKey]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`❌ Lamaran sudah expired (lebih dari 24 jam)!`)
            }

            const pelamarJid = resolvePlayerJid(prop.from)
            const pelamar = rpgDB.players[pelamarJid]
            if (!pelamar) return Reply(`❌ Pelamar sudah tidak terdaftar!`)
            if (pelamar.pasangan) return Reply(`❌ Pelamar sudah menikah dengan orang lain!`)

            const BIAYA_NIKAH = 7000000
            if ((pelamar.gold || 0) < BIAYA_NIKAH) return Reply(`❌ Pelamar tidak punya cukup gold untuk mas kawin!`)

            // Proses nikah
            pelamar.gold -= BIAYA_NIKAH
            const tanggalNikah = new Date().toLocaleDateString('id-ID')
            pelamar.pasangan = senderJid
            pelamar.pasanganNama = `@${senderJid.split('@')[0]}`
            pelamar.tanggalNikah = tanggalNikah
            pelamar.anak = pelamar.anak || []
            player.pasangan = pelamarJid
            player.pasanganNama = `@${pelamarJid.split('@')[0]}`
            player.tanggalNikah = tanggalNikah
            player.anak = player.anak || []
            delete rpgDB.proposals[proposalKey]

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return alip.sendMessage(m.chat, {
                text: `✦ 💒  SELAMAT MENIKAH!  💒\n\n  👰 Pasutri baru!\n  💑 @${pelamarJid.split('@')[0]} & @${senderJid.split('@')[0]}\n\n  📅 Tanggal: *${tanggalNikah}*\n  💍 Mas kawin: *${toRupiah(BIAYA_NIKAH)}*\n\n  🍼 Punya anak? Gunakan *.buatanak*\n  🍱 Beri makan anak: *.belimakanan*\n  💵 Kasih nafkah: *.nafkah [jumlah]*\n\nSelamat menempuh hidup baru! 🥳`,
                mentions: [pelamarJid, senderJid]
            }, { quoted: m })
        }

        // ── .tolak — Tolak lamaran ────────────────────────────────
        if (command === 'tolak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const normSenderJid = senderJid.endsWith('@lid') ? senderJid.replace('@lid', '@s.whatsapp.net') : senderJid
            if (!rpgDB.proposals || (!rpgDB.proposals[senderJid] && !rpgDB.proposals[normSenderJid])) return Reply(`❌ Kamu tidak punya lamaran masuk!`)
            const prop = rpgDB.proposals[normSenderJid] || rpgDB.proposals[senderJid]
            const proposalKey = rpgDB.proposals[normSenderJid] ? normSenderJid : senderJid
            const pelamarJid = resolvePlayerJid(prop.from)
            delete rpgDB.proposals[proposalKey]
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return alip.sendMessage(m.chat, {
                text: `✦ 💔  LAMARAN DITOLAK  💔\n\n  @${senderJid.split('@')[0]} menolak lamaran dari @${pelamarJid.split('@')[0]}.\n  Semangat ya bro 😔`,
                mentions: [senderJid, pelamarJid]
            }, { quoted: m })
        }

        // ── .cerai — Cerai ────────────────────────────────────────
        if (command === 'cerai') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const BIAYA_CERAI = 5000000
            if ((player.gold || 0) < BIAYA_CERAI) return Reply(`❌ Biaya cerai: *${toRupiah(BIAYA_CERAI)}*. Gold kamu tidak cukup!`)

            const pasanganJid = resolvePlayerJid(player.pasangan)
            const pasangan = rpgDB.players[pasanganJid]

            player.gold -= BIAYA_CERAI

            // Hapus status nikah kedua pihak
            delete player.pasangan
            delete player.pasanganNama
            delete player.tanggalNikah
            if (pasangan) {
                delete pasangan.pasangan
                delete pasangan.pasanganNama
                delete pasangan.tanggalNikah
            }

            // Anak tetap ada di data masing-masing, tapi status keluarga terputus
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return alip.sendMessage(m.chat, {
                text: `✦ 💔  PERCERAIAN RESMI  💔\n\n  📄 @${senderJid.split('@')[0]} dan @${pasanganJid.split('@')[0]}\n   resmi bercerai.\n\n  💸 Biaya cerai: *${toRupiah(BIAYA_CERAI)}*\n  👶 Anak tetap tercatat di data masing-masing\n\nSemoga ke depannya lebih baik... 😔`,
                mentions: [senderJid, pasanganJid]
            }, { quoted: m })
        }

        // ── .infopasangan — Info status pernikahan ─────────────────
        if (command === 'infopasangan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            if (!player.pasangan) {
                return Reply(`✦ 💑  STATUS CINTA  💑\n\n  💔 Status: *Lajang*\n  💍 Cari pasangan dengan *.lamar @user*\n`)
            }

            const anakList = (player.anak || [])
            const anakInfo = anakList.length === 0
                ? '— belum punya anak'
                : anakList.map((a, i) => `  ${i+1}. ${a.nama} (👶 Usia: ${a.usia} thn, ❤️ ${a.kesehatan}/100)`).join('\n')

            return alip.sendMessage(m.chat, {
                text: `✦ 💑  STATUS KELUARGA  💑\n\n  💒 Status   : *Menikah*\n  💑 Pasangan : ${player.pasanganNama || player.pasangan}\n  📅 Tgl Nikah: ${player.tanggalNikah || '-'}\n\n  👶 ANAK (${anakList.length}):\n${anakInfo}\n`,
                mentions: [player.pasangan]
            }, { quoted: m })
        }

        // ── .buatanak — Punya anak ────────────────────────────────
        if (command === 'buatanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            if (!player.pasangan) return Reply(`❌ Kamu belum menikah! Lamar dulu dengan *.lamar @user*`)

            const pasanganJid = resolvePlayerJid(player.pasangan)
            const pasangan = rpgDB.players[pasanganJid]
            if (!pasangan) return Reply(`❌ Data pasanganmu tidak ditemukan! (JID: ${player.pasangan})`)

            const anakSaya = player.anak || []

            // Syarat anak berikutnya: anak pertama harus berusia ≥ 6 tahun
            if (anakSaya.length > 0) {
                const anakPertama = anakSaya[0]
                if ((anakPertama.usia || 0) < 6) {
                    return Reply(`✦ 🚫  BELUM BISA!  🚫\n\n  👶 Anak pertama *${anakPertama.nama}* masih\n   berusia *${anakPertama.usia} tahun*.\n\n  ⚠️ Syarat: Anak pertama harus\n   berusia minimal *6 tahun*.\n\n  💊 Rawat anak dengan *.rawatanak*\n   untuk meningkatkan usianya!\n`)
                }
            }

            const BIAYA_ANAK = 2000000
            if ((player.gold || 0) < BIAYA_ANAK) return Reply(`❌ Butuh *${toRupiah(BIAYA_ANAK)}* untuk biaya kehamilan & persalinan!`)

            // Generate nama anak random
            const namaLaki = ['Arjuna','Bima','Satria','Rizky','Fadhil','Ghaza','Hafizh','Ilham','Jabir','Khalid']
            const namaCewek = ['Aulia','Bunga','Cantika','Dewi','Elisa','Fatimah','Ghina','Hana','Isna','Jasmine']
            const gender = Math.random() < 0.5 ? 'laki-laki' : 'perempuan'
            const namaPool = gender === 'laki-laki' ? namaLaki : namaCewek
            const namaAnak = namaPool[Math.floor(Math.random() * namaPool.length)]
            const emoji = gender === 'laki-laki' ? '👦' : '👧'

            const anakBaru = {
                nama: namaAnak,
                gender: gender,
                emoji: emoji,
                usia: 0,
                kesehatan: 100,
                lahir: new Date().toLocaleDateString('id-ID'),
                terakhirDirawat: Date.now(),
                makanan: 100,
                bakat: randomBakat()
            }

            player.gold -= BIAYA_ANAK
            player.anak = [...anakSaya, anakBaru]

            // Simpan juga ke pasangan
            pasangan.anak = pasangan.anak || []
            pasangan.anak.push(anakBaru)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 🍼  SELAMAT! PUNYA ANAK!  🍼\n\n  ${emoji} Nama   : *${namaAnak}*\n  🚻 Gender : *${gender}*\n  📅 Lahir  : *${anakBaru.lahir}*\n  ❤️  Kesehatan: 100/100\n  🍱 Makanan : 100/100\n\n  💸 Biaya lahiran: *${toRupiah(BIAYA_ANAK)}*\n\n  📌 Rawat anakmu agar tumbuh besar!\n  *.rawatanak* — Rawat & tambah usia\n  *.belimakanan* — Beli makanan\n  *.nafkah [jml]* — Kasih uang saku\n`,
                mentions: [senderJid, pasanganJid]
            }, { quoted: m })
        }

        // ── .rawatanak — Merawat anak (naikkan usia) ──────────────
        if (command === 'rawatanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak! Gunakan *.buatanak* terlebih dahulu.`)

            const now = Date.now()
            const COOLDOWN_RAWAT = 4 * 60 * 60 * 1000 // 4 jam cooldown

            // Ambil index anak (opsional, default anak pertama)
            let idxAnak = 0
            if (args[0]) {
                const parsed = parseInt(args[0]) - 1
                if (!isNaN(parsed) && parsed >= 0 && parsed < anakList.length) idxAnak = parsed
            }

            const anak = anakList[idxAnak]
            const lastRawat = anak.terakhirDirawat || 0

            if (now - lastRawat < COOLDOWN_RAWAT) {
                const sisaWaktu = msToTime(COOLDOWN_RAWAT - (now - lastRawat))
                return Reply(`⏳ *${anak.nama}* baru saja dirawat!\nTunggu lagi *${sisaWaktu}* sebelum merawat lagi.`)
            }

            // Biaya rawat
            const BIAYA_RAWAT = 150000
            if ((player.gold || 0) < BIAYA_RAWAT) return Reply(`❌ Butuh *${toRupiah(BIAYA_RAWAT)}* untuk biaya perawatan anak!`)

            // Kondisi: makanan anak harus > 30 untuk bisa tumbuh
            if ((anak.makanan || 0) < 30) {
                return Reply(`✦ 😢  ANAK LAPAR!  😢\n\n  *${anak.nama}* terlalu lapar (🍱 ${anak.makanan}/100)\n  Makanan < 30 → tidak bisa tumbuh!\n\n  🛒 Beli makanan dulu: *.belimakanan*\n`)
            }

            player.gold -= BIAYA_RAWAT

            // Naikkan usia dan kesehatan
            const TAMBAH_USIA = 1
            anak.usia = (anak.usia || 0) + TAMBAH_USIA
            anak.kesehatan = Math.min(100, (anak.kesehatan || 0) + 15)
            anak.makanan = Math.max(0, (anak.makanan || 100) - 20) // makanan berkurang
            anak.terakhirDirawat = now

            // Sinkron ke pasangan juga
            const pasanganJid = resolvePlayerJid(player.pasangan)
            if (pasanganJid && rpgDB.players[pasanganJid]) {
                const pasangan = rpgDB.players[pasanganJid]
                if (pasangan.anak && pasangan.anak[idxAnak]) {
                    pasangan.anak[idxAnak].usia = anak.usia
                    pasangan.anak[idxAnak].kesehatan = anak.kesehatan
                    pasangan.anak[idxAnak].makanan = anak.makanan
                    pasangan.anak[idxAnak].terakhirDirawat = now
                }
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ ${anak.emoji}  RAWAT ANAK  ${anak.emoji}\n\n  👶 Nama      : *${anak.nama}*\n  🎂 Usia      : *${anak.usia} tahun*\n  ❤️  Kesehatan : *${anak.kesehatan}/100*\n  🍱 Makanan   : *${anak.makanan}/100*\n\n  💸 Biaya rawat: *${toRupiah(BIAYA_RAWAT)}*\n  ⏳ Rawat lagi: *4 jam*\n\n${anak.usia >= 6 ? '🎉 Sudah bisa punya adik!' : `📌 Butuh ${6 - anak.usia} rawatan lagi untuk bisa punya adik!`}`)
        }

        // ── .belimakanan — Beli makanan untuk anak ───────────────
        if (command === 'belimakanan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak!`)

            const HARGA_MAKANAN = 250000
            const jml = parseInt(args[0]) || 1
            const totalBiaya = HARGA_MAKANAN * jml

            if ((player.gold || 0) < totalBiaya) return Reply(`❌ Butuh *${toRupiah(totalBiaya)}* untuk beli ${jml}x makanan!`)

            player.gold -= totalBiaya

            // Isi makanan semua anak merata
            for (let i = 0; i < anakList.length; i++) {
                anakList[i].makanan = Math.min(100, (anakList[i].makanan || 0) + (30 * jml))
            }

            // Sinkron ke pasangan
            const pasanganJid = resolvePlayerJid(player.pasangan)
            if (pasanganJid && rpgDB.players[pasanganJid]) {
                const pasangan = rpgDB.players[pasanganJid]
                if (pasangan.anak) {
                    for (let i = 0; i < pasangan.anak.length; i++) {
                        pasangan.anak[i].makanan = anakList[i]?.makanan ?? pasangan.anak[i].makanan
                    }
                }
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const anakInfo = anakList.map((a, i) => `  ${i+1}. ${a.emoji} ${a.nama} → 🍱 ${a.makanan}/100`).join('\n')
            return Reply(`✦ 🛒  BELI MAKANAN  🛒\n\n  🍱 Makanan x${jml} dibeli!\n  💸 Total: *${toRupiah(totalBiaya)}*\n\n  📊 Status makanan anak:\n${anakInfo}\n`)
        }

        // ── .nafkah — Kasih nafkah/uang saku ke anak ─────────────
        if (command === 'nafkah') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak!`)

            const jumlah = parseInt(args[0])
            if (isNaN(jumlah) || jumlah <= 0) return Reply(`❌ Masukkan jumlah nafkah yang valid!\nContoh: *.nafkah 100000*`)

            if ((player.gold || 0) < jumlah) return Reply(`❌ Gold kamu tidak cukup! Kamu punya *${toRupiah(player.gold)}*`)

            const NAFKAH_MIN = 200000
            if (jumlah < NAFKAH_MIN) return Reply(`❌ Nafkah minimal *${toRupiah(NAFKAH_MIN)}* per pemberian!`)

            player.gold -= jumlah

            // Nafkah total yang pernah diberikan
            player.totalNafkah = (player.totalNafkah || 0) + jumlah

            // Naikkan kesehatan anak karena tercukupi
            for (let i = 0; i < anakList.length; i++) {
                anakList[i].kesehatan = Math.min(100, (anakList[i].kesehatan || 0) + 10)
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 💵  NAFKAH KELUARGA  💵\n\n  💰 Nafkah: *${toRupiah(jumlah)}*\n  💖 Kesehatan anak meningkat +10!\n\n  💳 Total nafkah: *${toRupiah(player.totalNafkah)}*\n  💰 Sisa gold   : *${toRupiah(player.gold)}*\n\nResponsible parent banget! 👨‍👩‍👧`)
        }

        // ── .infoanak — Lihat detail semua anak ──────────────────
        if (command === 'infoanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []

            if (anakList.length === 0) return Reply(`✦ 👶  INFO ANAK  👶\n\n  Kamu belum punya anak.\n  Gunakan *.buatanak* setelah menikah!\n`)

            const anakDetail = anakList.map((a, i) => {
                const hpBar = '█'.repeat(Math.floor(a.kesehatan / 10)) + '░'.repeat(10 - Math.floor(a.kesehatan / 10))
                const mkBar = '█'.repeat(Math.floor((a.makanan||0) / 10)) + '░'.repeat(10 - Math.floor((a.makanan||0) / 10))
                const siapAdik = a.usia >= 6 ? '✅ Siap punya adik' : `⏳ Perlu ${6-a.usia} rawat lagi`
                return ` Anak ke-${i+1} ───\n  ${a.emoji} Nama: *${a.nama}* (${a.gender})\n  🎂 Usia: *${a.usia} tahun* | ${siapAdik}\n  ❤️ HP : [${hpBar}] ${a.kesehatan}/100\n  🍱 Mkn: [${mkBar}] ${a.makanan||0}/100\n  📅 Lahir: ${a.lahir||'-'}`
            }).join('\n')

            return Reply(`✦ 👨‍👩‍👧  DATA ANAK  👨‍👩‍👧\n\n${anakDetail}\n\n  *.rawatanak [no]* — Rawat anak (CD: 4j)\n  *.belimakanan [jml]* — Beli makanan\n  *.nafkah [jml]* — Kasih nafkah\n`)
        }

        // ── .simulatorhelp — Panduan fitur simulator ─────────────
        if (command === 'simulatorhelp') {
            return Reply(`✦ ── 💒  SIMULATOR KEHIDUPAN  💒 ──
  💍 *PERNIKAHAN*
  *.lamar @user*
  └ Lamar seseorang (mas kawin Rp 7jt)
  *.terima / .tolak*
  └ Jawab lamaran yang masuk
  *.cerai*
  └ Cerai (biaya Rp 5jt)
  *.infopasangan*
  └ Info status & keluarga

  👶 *ANAK*
  *.buatanak*
  └ Punya anak baru (biaya Rp 2jt)
  └ Syarat: Anak ke-2+ butuh anak
    pertama usia ≥ 6 tahun!
  *.rawatanak [no]*
  └ Rawat anak → naikkan usia +1
  └ CD: 4 jam, biaya Rp 150rb
  └ Makanan anak harus > 30!
  *.infoanak*
  └ Lihat detail semua anak
  *.kadoanak [no] [jml]*
  └ Beri kado anak (min Rp 50rb)

  🏫 *PENDIDIKAN ANAK*
  *.sekolahkan [no]*
  └ SD: Rp 2jt | SMP: Rp 5jt
  └ SMA: Rp 10jt | Kuliah: Rp 25jt
  *.kerjaanak [no]*
  └ Anak mulai bekerja (syarat: lulus kuliah)
  *.rapotanak*
  └ Lihat progress pendidikan anak

  🍱 *NAFKAH & MAKANAN*
  *.belimakanan [jml]*
  └ Beli makanan (Rp 250rb/paket +30)
  *.nafkah [jumlah]*
  └ Beri nafkah keluarga (min Rp 200rb)

  💞 *KEHARMONISAN*
  *.kencan* — Kencan (Rp 1,5jt, CD:12j)
  *.makanbersama* — Makan bersama (CD:8j)
  *.kadoanniversary* — Kado (Rp 3jt, 1x/thn)
  *.cekselingkuh* — Investigasi (Rp 1,5jt)

  📌 *CATATAN*
  • Anak ke-2+ butuh anak 1 usia ≥ 6 thn
  • Rawat anak tiap 4 jam (+1 usia)
  • Makanan habis = tidak bisa tumbuh
  • Kesehatan anak naik dgn nafkah
  • Ketik *.hargasimulator* untuk
  info lengkap semua harga!`)
        }

        // ── .hargasimulator — Daftar harga fitur simulator ─────────────
        if (command === 'hargasimulator') {
            return Reply(`✦ ── 💰  HARGA SIMULATOR  💰 ──
  💍 *PERNIKAHAN & KELUARGA*
  ┌ Mas kawin (lamar)  : Rp 7.000.000
  ├ Biaya cerai        : Rp 5.000.000
  ├ Biaya punya anak   : Rp 2.000.000
  ├ Rawat anak (CD:4j) : Rp 150.000
  ├ Beli makanan/paket : Rp 250.000
  └ Nafkah minimum     : Rp 200.000

  💞 *KEHARMONISAN*
  ┌ Kencan (CD:12j)    : Rp 1.500.000
  ├ Makan bersama(CD:8j): Rp 300rb/org
  ├ Foto bersama (CD:4j): Rp 500.000
  ├ Kado anniversary   : Rp 3.000.000
  └ Investigasi selingkuh: Rp 1.500.000

  ✈️ *LIBURAN KELUARGA* (CD:7 hari)
  ┌ 🏔️ Gunung          : Rp 2.000.000
  ├ 🏖️ Pantai          : Rp 3.000.000
  ├ 🏙️ Kota Besar      : Rp 5.000.000
  ├ ✈️ Luar Negeri     : Rp 15.000.000
  └ ✨ Alam Para Dewa   : Rp 100.000.000

  🏫 *PENDIDIKAN ANAK*
  ┌ SD (min usia 6)    : Rp 2.000.000
  ├ SMP (min 12 thn)   : Rp 5.000.000
  ├ SMA (min 15 thn)   : Rp 10.000.000
  └ Kuliah (min 18 thn): Rp 25.000.000

  🎁 *KADO ANAK* (bonus kesehatan)
  ┌ Min Rp 50.000      : +10 HP anak
  ├ Rp 200.000+        : +30 HP anak
  ├ Rp 500.000+        : +40 HP anak
  └ Rp 1.000.000+      : +50 HP anak

  🏠 *RUMAH KELUARGA*
  ┌ Rumah Biasa        : Rp 15.000.000
  ├ Rumah Mewah        : Rp 150.000.000
  ├ Villa              : Rp 500.000.000
  └ Istana             : Rp 5.000.000.000

  🔨 *RENOVASI RUMAH*
  ┌ 🍳 Dapur           : Rp 3.000.000
  ├ 🌸 Taman           : Rp 5.000.000
  └ 🏊 Kolam Renang    : Rp 25.000.000

  🏛️ *PANTI ASUHAN*
  └ Adopsi anak        : Rp 200.000`)
        }

// 
//  LIFE SIMULATOR: KENCAN
// 

        if (command === 'kencan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah! Cari pasangan dulu 💔`)

            const BIAYA_KENCAN = 1500000
            const CD_KENCAN = 12 * 60 * 60 * 1000
            const now = Date.now()

            if ((player.gold || 0) < BIAYA_KENCAN) return Reply(`❌ Butuh *${toRupiah(BIAYA_KENCAN)}* untuk kencan!\n💰 Gold kamu: ${toRupiah(player.gold || 0)}`)

            const lastKencan = player.lastKencan || 0
            if (now - lastKencan < CD_KENCAN) {
                const sisa = CD_KENCAN - (now - lastKencan)
                return Reply(`⏳ Pasangan kamu masih lelah!\nBisa kencan lagi dalam: *${msToTime(sisa)}*`)
            }

            tickKeluarga(player, rpgDB)

            player.gold -= BIAYA_KENCAN
            player.lastKencan = now
            player.totalKencan = (player.totalKencan || 0) + 1

            const harmoni = player.harmoni || 50
            let hasilKencan, bonusHarmoni, buff = ''

            const roll = Math.random()
            if (harmoni >= 80 && roll > 0.3) {
                hasilKencan = '💖 *ROMANTIS BANGET!*\nKencan berjalan sempurna, kalian makin dekat!'
                bonusHarmoni = 20
                buff = '\n  ✨ Buff *Chemistry* aktif 6 jam!\n  (ATK +3 saat battle)'
                player.chemistryBuff = now + 6 * 60 * 60 * 1000
            } else if (roll > 0.4) {
                hasilKencan = '🙂 *MENYENANGKAN*\nKencan berjalan baik, pasangan senang!'
                bonusHarmoni = 12
            } else {
                hasilKencan = '😐 *BIASA SAJA*\nKencan kurang berkesan, tapi lumayan lah...'
                bonusHarmoni = 5
            }

            player.harmoni = Math.min(100, harmoni + bonusHarmoni)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 💑  KENCAN BERSAMA  💑\n\n  💌 @${senderJid.split('@')[0]} & ${player.pasanganNama}\n\n  🎬 ${hasilKencan}\n\n  💞 Keharmonisan: +${bonusHarmoni}\n  ${getHarmoniBar(player.harmoni)}${buff}\n\n  💸 Biaya: ${toRupiah(BIAYA_KENCAN)}\n  ⏳ CD: 12 jam\n`,
                mentions: [senderJid, player.pasangan]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: CEK KEHARMONISAN
// 

        if (command === 'harmoni' || command === 'cekharmoni') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            tickKeluarga(player, rpgDB)

            const harmoni = player.harmoni || 50
            let statusHarmoni = ''
            if (harmoni >= 90) statusHarmoni = '💖 Pasangan Sejati — hubungan luar biasa!'
            else if (harmoni >= 70) statusHarmoni = '💛 Bahagia — hubungan sehat & hangat'
            else if (harmoni >= 50) statusHarmoni = '🧡 Biasa — masih perlu perhatian'
            else if (harmoni >= 30) statusHarmoni = '⚠️ Mulai Retak — segera diperbaiki!'
            else statusHarmoni = '💔 KRISIS — hubungan sangat berbahaya!'

            const anniv = hitungAnniversary(player.tanggalNikah)
            const annivText = anniv && anniv.isAnniversary
                ? `\n  🎉 *HARI INI ANNIVERSARY KE-${anniv.tahun}!*`
                : anniv ? `\n  💍 Pernikahan ke-${anniv.tahun} tahun` : ''

            let tips = ''
            if (harmoni < 50) tips = '\n  💡 Tips: Kencan, nafkah, & rawat anak\n  untuk naikkan keharmonisan!'
            else if (harmoni >= 80) tips = '\n  ✨ Tip: Coba *.liburankeluarga* untuk\n  bonus keharmonisan besar!'

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 💞  KEHARMONISAN  💞\n\n  💑 @${senderJid.split('@')[0]} & ${player.pasanganNama}${annivText}\n\n  ${getHarmoniBar(harmoni)}\n  ${statusHarmoni}${tips}\n\n Cara naikkan keharmonisan: ──\n  *.kencan* (+12-20) | CD: 12j\n  *.nafkah* (+5) | tiap kasih nafkah\n  *.makanbersama* (+10) | CD: 8j\n  *.liburankeluarga* (+30) | CD: 7h\n  *.kadoanniversary* (+25) | 1x/tahun\n`,
                mentions: [senderJid, player.pasangan]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: KADO ANNIVERSARY
// 

        if (command === 'kadoanniversary') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const anniv = hitungAnniversary(player.tanggalNikah)
            if (!anniv || !anniv.isAnniversary) return Reply(`✦ 📅  ANNIVERSARY  📅\n\n  ❌ Hari ini bukan anniversary-mu!\n\n  📅 Nikah: ${player.tanggalNikah || '-'}\n  🎂 Anniversary berikutnya:\n   Tanggal yang sama tahun depan!\n`)

            if (player.lastAnnivKado && new Date(player.lastAnnivKado).getFullYear() === new Date().getFullYear()) {
                return Reply(`❌ Sudah kasih kado anniversary tahun ini!`)
            }

            const BIAYA_KADO = 3000000
            if ((player.gold || 0) < BIAYA_KADO) return Reply(`❌ Butuh *${toRupiah(BIAYA_KADO)}* untuk kado anniversary!`)

            player.gold -= BIAYA_KADO
            player.harmoni = Math.min(100, (player.harmoni || 50) + 25)
            player.lastAnnivKado = Date.now()

            const pasangan = rpgDB.players[resolvePlayerJid(player.pasangan)]
            if (pasangan) {
                pasangan.harmoni = Math.min(100, (pasangan.harmoni || 50) + 25)
                pasangan.lastAnnivKado = Date.now()
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 🎉  ANNIVERSARY KE-${anniv.tahun}!  🎉\n\n  🎁 @${senderJid.split('@')[0]} memberikan kado\n   kepada ${player.pasanganNama}!\n\n  💞 Keharmonisan: +25\n  ${getHarmoniBar(player.harmoni)}\n\n  💸 Biaya kado: ${toRupiah(BIAYA_KADO)}\n\nSelamat anniversary! Semoga langgeng! 🥂`,
                mentions: [senderJid, player.pasangan]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: SELINGKUH
// 

        if (command === 'selingkuh') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah! Mau selingkuh dari siapa? 😂`)

            let targetJid = null
            if (m.mentionedJid && m.mentionedJid.length > 0) targetJid = resolveMentionJid(m.mentionedJid[0])
            else if (m.quoted) targetJid = resolveMentionJid(m.quoted.sender)
            if (!targetJid) return Reply(`❌ Tag siapa yang mau kamu selingkuhi!\nContoh: *.selingkuh @user*`)
            if (targetJid.endsWith('@lid')) targetJid = targetJid.replace('@lid', '@s.whatsapp.net')

            if (targetJid === senderJid) return Reply(`❌ Gak bisa selingkuh sama diri sendiri 😭`)
            if (targetJid === player.pasangan) return Reply(`❌ Itu pasangan kamu sendiri! 🤦`)
            if (!rpgDB.players[targetJid]) return Reply(`❌ User itu belum terdaftar!`)

            const CD_SELINGKUH = 6 * 60 * 60 * 1000
            const now = Date.now()
            if (player.lastSelingkuh && now - player.lastSelingkuh < CD_SELINGKUH) {
                return Reply(`⏳ Kamu baru saja selingkuh! Istirahat dulu...\nCD: *${msToTime(CD_SELINGKUH - (now - player.lastSelingkuh))}*`)
            }

            player.lastSelingkuh = now

            const ketahuan = Math.random() < 0.30
            const pasanganJid = resolvePlayerJid(player.pasangan)
            const pasangan = rpgDB.players[pasanganJid]

            if (ketahuan) {
                const DENDA = 10000000
                player.gold = Math.max(0, (player.gold || 0) - DENDA)
                player.harmoni = Math.max(0, (player.harmoni || 50) - 50)
                player.kenaSelingkuh = (player.kenaSelingkuh || 0) + 1

                if (pasangan) {
                    pasangan.harmoni = Math.max(0, (pasangan.harmoni || 50) - 30)
                    pasangan.pasanganSelingkuh = true
                }

                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return alip.sendMessage(m.chat, {
                    text: `✦ 🚨  KETAHUAN SELINGKUH!  🚨\n\n  😱 @${senderJid.split('@')[0]} ketahuan selingkuh\n   dengan @${targetJid.split('@')[0]}!\n\n  💔 Keharmonisan: -50\n  ${getHarmoniBar(player.harmoni)}\n\n  💸 Denda: *${toRupiah(DENDA)}*\n  😤 Pasangan marah!\n\n  🕵️ Sudah ketahuan: ${player.kenaSelingkuh}x\n\nMalu-maluin! 😤`,
                    mentions: [senderJid, targetJid, pasanganJid]
                }, { quoted: m })

            } else {
                player.moodBuff = now + 4 * 60 * 60 * 1000
                if (!player.riwayatSelingkuh) player.riwayatSelingkuh = []
                player.riwayatSelingkuh.push({ dengan: targetJid, waktu: now })

                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return Reply(`✦ 🤫  SELINGKUH BERHASIL  🤫\n\n  😏 Kamu berhasil selingkuh...\n   Semoga tidak ketahuan! 👀\n\n  ✨ Buff *Mood Boost* aktif 4 jam!\n  (EXP +5% dari battle)\n\n  ⚠️ Pasangan bisa *.cekselingkuh*\n  untuk investigasi kamu!\n`)
            }
        }

// 
//  LIFE SIMULATOR: CEK SELINGKUH
// 

        if (command === 'cekselingkuh') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const BIAYA_INVESTIGASI = 1500000
            const CD_CEK = 8 * 60 * 60 * 1000
            const now = Date.now()

            if ((player.gold || 0) < BIAYA_INVESTIGASI) return Reply(`❌ Butuh *${toRupiah(BIAYA_INVESTIGASI)}* untuk biaya investigasi!`)
            if (player.lastCekSelingkuh && now - player.lastCekSelingkuh < CD_CEK) {
                return Reply(`⏳ Baru investigasi!\nBisa cek lagi dalam: *${msToTime(CD_CEK - (now - player.lastCekSelingkuh))}*`)
            }

            player.gold -= BIAYA_INVESTIGASI
            player.lastCekSelingkuh = now

            const pasangan = rpgDB.players[resolvePlayerJid(player.pasangan)]
            if (!pasangan) {
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`❌ Data pasanganmu tidak ditemukan!`)
            }

            const riwayat = pasangan.riwayatSelingkuh || []
            const recent = riwayat.filter(r => now - r.waktu < 48 * 60 * 60 * 1000)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            if (recent.length === 0) {
                return Reply(`✦ 🕵️  HASIL INVESTIGASI  🕵️\n\n  ✅ ${player.pasanganNama} *bersih*!\n  Tidak ada tanda-tanda selingkuh\n  dalam 48 jam terakhir.\n\n  💸 Biaya investigasi: ${toRupiah(BIAYA_INVESTIGASI)}\n\nPasangan kamu setia! 💖`)
            } else {
                if (pasangan.harmoni > 0) pasangan.harmoni = Math.max(0, (pasangan.harmoni || 50) - 20)
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return alip.sendMessage(m.chat, {
                    text: `✦ 🚨  INVESTIGASI: TERBUKTI!  🚨\n\n  😱 ${player.pasanganNama} *TERBUKTI SELINGKUH!*\n\n  📋 Terdeteksi ${recent.length}x dalam 48 jam\n\n  ⚠️ Kamu bisa *.cerai* atau\n  *.kencan* untuk perbaiki hubungan\n\n  💔 Keharmonisan pasangan: -20\n\n  💸 Biaya investigasi: ${toRupiah(BIAYA_INVESTIGASI)}\n`,
                    mentions: [senderJid, player.pasangan]
                }, { quoted: m })
            }
        }

// 
//  LIFE SIMULATOR: PENDIDIKAN ANAK
// 

        if (command === 'sekolahkan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []

            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak!`)

            const noAnak = parseInt(text)
            if (!noAnak || noAnak < 1 || noAnak > anakList.length) {
                const daftarAnak = anakList.map((a, i) => {
                    const jenjang = a.pendidikan || 'belum'
                    return `  ${i+1}. ${a.emoji} ${a.nama} (${a.usia} thn) — ${getJenjangLabel(jenjang)}`
                }).join('\n')
                return Reply(`✦ 🏫  SEKOLAHKAN ANAK  🏫\n\n${daftarAnak}\n\n  Contoh: *.sekolahkan 1*\n\n  Biaya per jenjang:\n  🏫 SD     : Rp 500.000 (min usia 6)\n  🏫 SMP    : Rp 1.500.000 (min 12 thn)\n  🏫 SMA    : Rp 3.000.000 (min 15 thn)\n  🎓 Kuliah : Rp 10.000.000 (min 18 thn)\n`)
            }

            const anak = anakList[noAnak - 1]
            const pendidikanSaat = anak.pendidikan || 'belum'

            const urutanJenjang = ['belum', 'sd', 'smp', 'sma', 'kuliah', 'lulus']
            const idxSaat = urutanJenjang.indexOf(pendidikanSaat)
            const jenjangBerikut = urutanJenjang[idxSaat + 1]

            if (!jenjangBerikut || jenjangBerikut === 'lulus') {
                return Reply(`✦ 🎓  PENDIDIKAN ANAK  🎓\n\n  ${anak.emoji} ${anak.nama} sudah *lulus semua*!\n  Gunakan *.kerjaanak ${noAnak}* agar\n  mereka bisa bekerja & kirim uang 💰\n`)
            }

            const biayaJenjang = { 'sd': 2000000, 'smp': 5000000, 'sma': 10000000, 'kuliah': 25000000 }
            const usiaMini = { 'sd': 6, 'smp': 12, 'sma': 15, 'kuliah': 18 }
            const biaya = biayaJenjang[jenjangBerikut]
            const minUsia = usiaMini[jenjangBerikut]

            if (anak.usia < minUsia) return Reply(`❌ ${anak.emoji} *${anak.nama}* belum cukup umur!\nMinimal *${minUsia} tahun* untuk ${getJenjangLabel(jenjangBerikut)}\nUsia sekarang: ${anak.usia} tahun`)
            if ((player.gold || 0) < biaya) return Reply(`❌ Gold tidak cukup!\nBiaya ${getJenjangLabel(jenjangBerikut)}: *${toRupiah(biaya)}*\nGold kamu: ${toRupiah(player.gold || 0)}`)

            player.gold -= biaya
            anak.pendidikan = jenjangBerikut

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 🏫  ANAK DISEKOLAHKAN  🏫\n\n  ${anak.emoji} *${anak.nama}* kini bersekolah di:\n  📚 ${getJenjangLabel(jenjangBerikut)}\n\n  💸 Biaya: ${toRupiah(biaya)}\n  💰 Sisa gold: ${toRupiah(player.gold)}\n\n  💡 Lanjutkan ke jenjang berikutnya\n   dengan *.sekolahkan ${noAnak}* lagi!\n\nMaju terus pendidikannya! 📖`)
        }

        if (command === 'kerjaanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []

            const noAnak = parseInt(text)
            if (!noAnak || noAnak < 1 || noAnak > anakList.length) return Reply(`❌ Nomor anak tidak valid!\nGunakan: *.kerjaanak [nomor]*`)

            const anak = anakList[noAnak - 1]
            if (anak.pendidikan !== 'lulus' && anak.pendidikan !== 'kuliah') return Reply(`❌ ${anak.emoji} *${anak.nama}* belum lulus kuliah!\nSelesaikan pendidikan dulu dengan *.sekolahkan ${noAnak}*`)
            if (anak.bekerja) return Reply(`✅ ${anak.emoji} *${anak.nama}* sudah bekerja!\n💰 Penghasilan: ${toRupiah(5000)}/jam`)

            if (anak.pendidikan === 'kuliah') anak.pendidikan = 'lulus'
            anak.bekerja = true
            anak.lastTransfer = Date.now()
            anak.totalKiriman = 0

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 💼  ANAK MULAI BEKERJA  💼\n\n  ${anak.emoji} *${anak.nama}* kini bekerja!\n\n  💰 Passive income: *${toRupiah(5000)}/jam*\n  📦 Diterima otomatis setiap command\n\n  🎓 Bakat: ${getBakatLabel(anak.bakat || 'pejuang')}\n\nBangga punya anak sukses! 🥹`)
        }

        if (command === 'rapotanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak!`)

            const detail = anakList.map((a, i) => {
                const jenjang = a.pendidikan || 'belum'
                const statusKerja = a.bekerja ? `✅ Bekerja (${toRupiah(a.totalKiriman || 0)} total)` : '❌ Belum kerja'
                const bakatText = a.bakat ? getBakatLabel(a.bakat) : '❓ Belum diketahui'
                return ` Anak ke-${i+1}: ${a.emoji} ${a.nama} ───\n  🎂 Usia   : ${a.usia} tahun\n  📚 Sekolah: ${getJenjangLabel(jenjang)}\n  💼 Kerja  : ${statusKerja}\n  🌟 Bakat  : ${bakatText}`
            }).join('\n')

            return Reply(`✦ 📋  RAPOT ANAK  📋\n\n${detail}\n\n  *.sekolahkan [no]* — Sekolahkan anak\n  *.kerjaanak [no]* — Anak mulai kerja\n`)
        }

// 
//  LIFE SIMULATOR: RUMAH KELUARGA
// 

        if (command === 'belirumahtinggal') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Harus menikah dulu untuk beli rumah keluarga!`)

            const hargaRumah = {
                'kontrakan':   500000,
                'rumah_biasa': 15000000,
                'rumah_mewah': 150000000,
                'villa':       500000000,
                'istana':      5000000000
            }

            const tier = text ? text.trim().toLowerCase().replace(' ', '_') : null

            if (!tier || !hargaRumah[tier]) {
                const daftar = Object.entries(hargaRumah).map(([t, h]) => `  *${t}* — ${toRupiah(h)}\n  └ ${getRumahBonus(t)}`).join('\n')
                const rumahSaat = player.rumahKeluarga ? `  🏠 Rumah sekarang: *${getRumahLabel(player.rumahKeluarga.tier)}*\n\n` : ''
                return Reply(`✦ 🏠  BELI RUMAH KELUARGA  🏠\n\n${rumahSaat}${daftar}\n\n  Contoh: *.belirumahtinggal rumah_biasa*\n`)
            }

            const hargaBeli = hargaRumah[tier]
            if ((player.gold || 0) < hargaBeli) return Reply(`❌ Gold tidak cukup!\nHarga: *${toRupiah(hargaBeli)}*\nGold kamu: ${toRupiah(player.gold || 0)}`)

            const urutanTier = ['kontrakan', 'rumah_biasa', 'rumah_mewah', 'villa', 'istana']
            const idxBaru = urutanTier.indexOf(tier)
            const idxSaat = player.rumahKeluarga ? urutanTier.indexOf(player.rumahKeluarga.tier) : -1
            if (idxBaru <= idxSaat) return Reply(`❌ Kamu sudah punya rumah yang lebih baik!\nRumah sekarang: *${getRumahLabel(player.rumahKeluarga.tier)}*`)

            player.gold -= hargaBeli
            player.rumahKeluarga = {
                tier,
                beli: new Date().toLocaleDateString('id-ID'),
                renovasi: player.rumahKeluarga?.renovasi || []
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 🏠  RUMAH BARU!  🏠\n\n  🎉 Selamat! Kamu punya rumah baru!\n  🏠 Tipe  : *${getRumahLabel(tier)}*\n  💰 Harga : ${toRupiah(hargaBeli)}\n  💰 Sisa  : ${toRupiah(player.gold)}\n\n  ✨ Bonus aktif:\n  ${getRumahBonus(tier)}\n\n  🔨 Tambah renovasi:\n  *.renovasirumah [tipe]*\n`)
        }

        if (command === 'renovasirumah') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.rumahKeluarga) return Reply(`❌ Kamu belum punya rumah keluarga!\nBeli dulu dengan *.belirumahtinggal*`)

            const opsiRenovasi = {
                'dapur':        { biaya: 3000000,  desc: '🍳 Dapur — Unlock fitur *.masak*' },
                'taman':        { biaya: 5000000,  desc: '🌸 Taman — Keharmonisan +5/hari' },
                'kamar_anak':   { biaya: 7000000,  desc: '🛏️ Kamar Anak — Recovery kesehatan anak lebih cepat' },
                'gym':          { biaya: 12000000, desc: '💪 Gym — ATK +2 permanen (1x saja)' },
                'kolam_renang': { biaya: 25000000, desc: '🏊 Kolam Renang — HP regen +10/jam' }
            }

            const tipe = text ? text.trim().toLowerCase().replace(' ', '_') : null
            const renovasiSudah = player.rumahKeluarga.renovasi || []

            if (!tipe || !opsiRenovasi[tipe]) {
                const daftar = Object.entries(opsiRenovasi).map(([t, r]) => {
                    const sudah = renovasiSudah.includes(t) ? ' ✅' : ''
                    return `  *${t}*${sudah} — ${toRupiah(r.biaya)}\n  └ ${r.desc}`
                }).join('\n')
                return Reply(`✦ 🔨  RENOVASI RUMAH  🔨\n\n  🏠 Rumah: *${getRumahLabel(player.rumahKeluarga.tier)}*\n\n${daftar}\n\n  Contoh: *.renovasirumah dapur*\n`)
            }

            if (renovasiSudah.includes(tipe)) return Reply(`❌ Renovasi *${tipe}* sudah ada!`)

            const { biaya, desc } = opsiRenovasi[tipe]
            if ((player.gold || 0) < biaya) return Reply(`❌ Gold tidak cukup!\nBiaya: *${toRupiah(biaya)}*\nGold kamu: ${toRupiah(player.gold || 0)}`)

            player.gold -= biaya
            player.rumahKeluarga.renovasi = [...renovasiSudah, tipe]

            if (tipe === 'gym') player.attack = (player.attack || 10) + 2

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 🔨  RENOVASI BERHASIL  🔨\n\n  ✅ ${desc} selesai!\n\n  💸 Biaya: ${toRupiah(biaya)}\n  💰 Sisa gold: ${toRupiah(player.gold)}\n`)
        }

        if (command === 'inforumah') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.rumahKeluarga) return Reply(`✦ 🏚️  INFO RUMAH  🏚️\n\n  ❌ Kamu belum punya rumah keluarga.\n  Beli dengan *.belirumahtinggal*\n`)

            const rumah = player.rumahKeluarga
            const renovasiList = (rumah.renovasi || []).map(r => `  ✅ ${r}`).join('\n') || '  — Belum ada renovasi'

            return Reply(`✦ 🏠  INFO RUMAH KELUARGA  🏠\n\n  🏠 Tipe   : *${getRumahLabel(rumah.tier)}*\n  📅 Dibeli : ${rumah.beli || '-'}\n\n  ✨ Bonus Aktif:\n  ${getRumahBonus(rumah.tier)}\n\n  🔨 Renovasi:\n${renovasiList}\n\n  *.renovasirumah* — tambah renovasi\n  *.belirumahtinggal* — upgrade rumah\n`)
        }

// 
//  LIFE SIMULATOR: MAKAN BERSAMA
// 

        if (command === 'makanbersama') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const anakList = player.anak || []
            const totalAnggota = 2 + anakList.length
            const BIAYA_PER_ORANG = 300000
            const BIAYA_TOTAL = BIAYA_PER_ORANG * totalAnggota
            const CD_MAKAN = 8 * 60 * 60 * 1000
            const now = Date.now()

            if ((player.gold || 0) < BIAYA_TOTAL) return Reply(`❌ Gold tidak cukup!\nBiaya makan ${totalAnggota} orang: *${toRupiah(BIAYA_TOTAL)}*\nGold kamu: ${toRupiah(player.gold || 0)}`)

            if (player.lastMakanBersama && now - player.lastMakanBersama < CD_MAKAN) {
                return Reply(`⏳ Baru saja makan bersama!\nBisa lagi dalam: *${msToTime(CD_MAKAN - (now - player.lastMakanBersama))}*`)
            }

            const punyaDapur = player.rumahKeluarga?.renovasi?.includes('dapur')
            const bonusHarmoni = punyaDapur ? 15 : 10
            const bonusKesehatanAnak = punyaDapur ? 20 : 15

            player.gold -= BIAYA_TOTAL
            player.lastMakanBersama = now
            player.harmoni = Math.min(100, (player.harmoni || 50) + bonusHarmoni)

            anakList.forEach(a => {
                a.kesehatan = Math.min(100, (a.kesehatan || 50) + bonusKesehatanAnak)
                a.makanan = Math.min(100, (a.makanan || 0) + 20)
            })

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const dapurBonus = punyaDapur ? '\n  🍳 Bonus Dapur: +5 extra semua!' : ''

            return Reply(`✦ 🍽️  MAKAN BERSAMA  🍽️\n\n  👨‍👩‍👧 Keluarga makan bersama!\n  ${totalAnggota} orang duduk di meja makan~\n${dapurBonus}\n\n  💞 Keharmonisan : +${bonusHarmoni}\n  ${getHarmoniBar(player.harmoni)}\n  ❤️ Kesehatan anak: +${bonusKesehatanAnak}\n  🍱 Makanan anak  : +20\n\n  💸 Biaya: ${toRupiah(BIAYA_TOTAL)}\n  ⏳ CD: 8 jam\n\nHangat banget! 🥰`)
        }

// 
//  LIFE SIMULATOR: LIBURAN KELUARGA
// 

        if (command === 'liburankeluarga') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const destinasi = {
                'pantai':      { biaya: 3000000,  harmoni: 25, desc: '🏖️ Pantai — ombak & pasir putih', anakBonus: 20 },
                'gunung':      { biaya: 2000000,  harmoni: 20, desc: '🏔️ Gunung — udara sejuk & pemandangan', anakBonus: 15 },
                'kota':        { biaya: 5000000,  harmoni: 22, desc: '🏙️ Kota Besar — belanja & wisata kuliner', anakBonus: 18 },
                'luar_negeri': { biaya: 15000000, harmoni: 35, desc: '✈️ Luar Negeri — pengalaman internasional!', anakBonus: 30 },
                'alam_dewa':   { biaya: 100000000, harmoni: 50, desc: '✨ Alam Para Dewa — liburan mewah epic!', anakBonus: 50 }
            }

            const tujuan = text ? text.trim().toLowerCase().replace(' ', '_') : null
            const CD_LIBURAN = 7 * 24 * 60 * 60 * 1000
            const now = Date.now()

            if (!tujuan || !destinasi[tujuan]) {
                const daftar = Object.entries(destinasi).map(([t, d]) => `  *${t}* — ${toRupiah(d.biaya)}\n  └ ${d.desc}`).join('\n')
                return Reply(`✦ ✈️  LIBURAN KELUARGA  ✈️\n\n${daftar}\n\n  Contoh: *.liburankeluarga pantai*\n  ⏳ Cooldown: 7 hari\n`)
            }

            if (player.lastLiburan && now - player.lastLiburan < CD_LIBURAN) {
                return Reply(`⏳ Keluarga masih butuh istirahat!\nLiburan berikutnya: *${msToTime(CD_LIBURAN - (now - player.lastLiburan))}*`)
            }

            const { biaya, harmoni, desc, anakBonus } = destinasi[tujuan]
            if ((player.gold || 0) < biaya) return Reply(`❌ Gold tidak cukup!\nBiaya liburan: *${toRupiah(biaya)}*\nGold kamu: ${toRupiah(player.gold || 0)}`)

            player.gold -= biaya
            player.lastLiburan = now
            player.harmoni = Math.min(100, (player.harmoni || 50) + harmoni)
            player.totalLiburan = (player.totalLiburan || 0) + 1

            const anakList = player.anak || []
            anakList.forEach(a => {
                a.kesehatan = Math.min(100, (a.kesehatan || 50) + anakBonus)
                a.makanan = Math.min(100, (a.makanan || 0) + 25)
            })

            const pasangan = rpgDB.players[resolvePlayerJid(player.pasangan)]
            if (pasangan) {
                pasangan.harmoni = Math.min(100, (pasangan.harmoni || 50) + harmoni)
                pasangan.lastLiburan = now
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const anakText = anakList.length > 0 ? `\n  👶 Anak bahagia    : +${anakBonus} kesehatan` : ''

            return alip.sendMessage(m.chat, {
                text: `✦ ✈️  LIBURAN KELUARGA!  ✈️\n\n  👨‍👩‍👧 @${senderJid.split('@')[0]} & keluarga\n   liburan ke ${desc}!\n\n  💞 Keharmonisan: +${harmoni}\n  ${getHarmoniBar(player.harmoni)}${anakText}\n\n  💸 Biaya  : ${toRupiah(biaya)}\n  💰 Sisa   : ${toRupiah(player.gold)}\n  ⏳ CD     : 7 hari\n\nMomen terbaik bersama keluarga! 📸`,
                mentions: [senderJid, player.pasangan]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: FOTO BERSAMA
// 

        if (command === 'fotobersama') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const CD_FOTO = 4 * 60 * 60 * 1000
            const now = Date.now()
            if (player.lastFoto && now - player.lastFoto < CD_FOTO) {
                return Reply(`⏳ Baru foto! Tunggu dulu...\nBisa foto lagi dalam: *${msToTime(CD_FOTO - (now - player.lastFoto))}*`)
            }

            const BIAYA_FOTO = 500000
            if ((player.gold || 0) < BIAYA_FOTO) return Reply(`❌ Butuh ${toRupiah(BIAYA_FOTO)} untuk sewa fotografer!`)

            player.gold -= BIAYA_FOTO
            player.lastFoto = now
            player.harmoni = Math.min(100, (player.harmoni || 50) + 5)
            player.totalFoto = (player.totalFoto || 0) + 1

            const anakList = player.anak || []
            const anakStr = anakList.length > 0
                ? anakList.map(a => `${a.emoji} ${a.nama}`).join(', ')
                : '(belum punya anak)'

            const lokasiFoto = ['🏡 Di rumah', '🌸 Di taman', '🏖️ Di pantai', '🌄 Di pegunungan', '🌙 Saat sunset'][Math.floor(Math.random() * 5)]

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return alip.sendMessage(m.chat, {
                text: `✦ 📸  FOTO KELUARGA  📸\n\n  ${lokasiFoto}\n\n  📷 *ALBUM KELUARGA #${player.totalFoto}*\n\n  👨 Ayah/Ibu : @${senderJid.split('@')[0]}\n  💑 Pasangan : ${player.pasanganNama}\n  👶 Anak     : ${anakStr}\n\n  📅 ${new Date().toLocaleDateString('id-ID')}\n\n  💞 Keharmonisan: +5\n  ${getHarmoniBar(player.harmoni)}\n\nKenangan indah keluarga! 🥰`,
                mentions: [senderJid, player.pasangan]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: KADO ANAK
// 

        if (command === 'kadoanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const argKado = text ? text.trim().split(' ') : []
            const noAnak = parseInt(argKado[0])
            const jumlahKado = parseInt(argKado[1])

            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu belum punya anak!`)

            if (!noAnak || noAnak < 1 || noAnak > anakList.length || !jumlahKado || jumlahKado < 50000) {
                return Reply(`✦ 🎁  KADO ANAK  🎁\n\n  Berikan kado untuk anak!\n\n  Format: *.kadoanak [no] [jumlah]*\n  Contoh: *.kadoanak 1 100000*\n\n  Min kado: Rp 50.000\n  Efek: kesehatan anak +10 s/d +50\n       keharmonisan +3\n`)
            }

            if ((player.gold || 0) < jumlahKado) return Reply(`❌ Gold tidak cukup!\nGold kamu: ${toRupiah(player.gold || 0)}`)

            const anak = anakList[noAnak - 1]
            player.gold -= jumlahKado

            let bonusKesehatan = 10
            if (jumlahKado >= 1000000) bonusKesehatan = 50
            else if (jumlahKado >= 500000) bonusKesehatan = 40
            else if (jumlahKado >= 200000) bonusKesehatan = 30
            else if (jumlahKado >= 100000) bonusKesehatan = 20

            anak.kesehatan = Math.min(100, (anak.kesehatan || 50) + bonusKesehatan)
            player.harmoni = Math.min(100, (player.harmoni || 50) + 3)

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ 🎁  KADO UNTUK ANAK  🎁\n\n  🎀 Kado untuk ${anak.emoji} *${anak.nama}*!\n\n  💝 Jumlah kado : ${toRupiah(jumlahKado)}\n  ❤️ Kesehatan   : +${bonusKesehatan}\n  💞 Keharmonisan: +3\n\n  ${anak.emoji} "${anak.nama} senang banget!"\n\nOrang tua terbaik! 🥹`)
        }

// 
//  LIFE SIMULATOR: EVENT RANDOM KRISIS KELUARGA
// 

        if (command === 'cekevent') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            if (!player.pasangan) return Reply(`❌ Kamu belum menikah!`)

            const now = Date.now()
            const CD_EVENT = 6 * 60 * 60 * 1000
            if (player.lastCekEvent && now - player.lastCekEvent < CD_EVENT) {
                return Reply(`⏳ Tidak ada event baru.\nCek lagi dalam: *${msToTime(CD_EVENT - (now - player.lastCekEvent))}*`)
            }

            player.lastCekEvent = now
            const harmoni = player.harmoni || 50
            const anakList = player.anak || []

            let eventMsg = '✅ Tidak ada event. Keluarga aman!'

            const anakSakit = anakList.find(a => (a.makanan || 0) < 20)
            if (anakSakit && Math.random() < 0.4) {
                const BIAYA_OBAT = 2000000
                if ((player.gold || 0) >= BIAYA_OBAT) {
                    player.gold -= BIAYA_OBAT
                    anakSakit.kesehatan = Math.max(10, (anakSakit.kesehatan || 50) - 20)
                    eventMsg = `🤒 *ANAK SAKIT!*\n  ${anakSakit.emoji} *${anakSakit.nama}* sakit keras!\n  Makanan habis, daya tahan turun...\n\n  💊 Biaya obat: ${toRupiah(BIAYA_OBAT)}\n  ❤️ Kesehatan: -20\n\n  Segera beli makanan: *.belimakanan*`
                } else {
                    anakSakit.kesehatan = Math.max(5, (anakSakit.kesehatan || 50) - 30)
                    eventMsg = `🤒 *ANAK SAKIT PARAH!*\n  ${anakSakit.emoji} *${anakSakit.nama}* sangat sakit!\n  Kamu tidak punya gold untuk obat!\n  ❤️ Kesehatan anak: -30`
                }
            } else if (harmoni < 35 && Math.random() < 0.5) {
                eventMsg = `💔 *PASANGAN MENGELUH!*\n  ${player.pasanganNama} merasa tidak diperhatikan!\n  Keharmonisan sangat rendah (${harmoni}/100)\n\n  ⚠️ Kalau tidak ditangani:\n  Keharmonisan -5 tiap hari!\n\n  💡 Solusi: *.kencan* atau *.makanbersama*`
                player.harmoni = Math.max(0, harmoni - 5)
            } else if (player.rumahKeluarga &&
                     ['rumah_mewah', 'villa', 'istana'].includes(player.rumahKeluarga.tier) &&
                     Math.random() < 0.25) {
                const tagihanMap = { 'rumah_mewah': 2000000, 'villa': 7500000, 'istana': 25000000 }
                const tagihan = tagihanMap[player.rumahKeluarga.tier]
                if ((player.gold || 0) >= tagihan) {
                    player.gold -= tagihan
                    eventMsg = `🏠 *TAGIHAN BULANAN RUMAH*\n  Tagihan maintenance ${getRumahLabel(player.rumahKeluarga.tier)}!\n  💸 Dibayar: ${toRupiah(tagihan)}\n  💰 Sisa: ${toRupiah(player.gold)}`
                } else {
                    player.harmoni = Math.max(0, harmoni - 10)
                    eventMsg = `🏠 *TAGIHAN TIDAK TERBAYAR!*\n  Tagihan ${getRumahLabel(player.rumahKeluarga.tier)} tidak terbayar!\n  💔 Keharmonisan -10\n  Segera cari gold!`
                }
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            return Reply(`✦ ⚡  EVENT KELUARGA  ⚡\n\n  ${eventMsg}\n\n  ⏳ Cek event berikutnya: 6 jam\n`)
        }

// 
//  LIFE SIMULATOR: STATISTIK KELUARGA
// 

        if (command === 'statkeluarga') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]

            tickKeluarga(player, rpgDB)
            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

            const statusNikah = player.pasangan
                ? `💒 Menikah dengan ${player.pasanganNama} sejak ${player.tanggalNikah}`
                : '💔 Lajang'

            const anniv = player.pasangan ? hitungAnniversary(player.tanggalNikah) : null
            const annivText = anniv ? `\n  🎂 Pernikahan : ${anniv.tahun} tahun${anniv.isAnniversary ? ' 🎉 HARI INI!' : ''}` : ''

            const harmoniText = player.pasangan
                ? `\n  ${getHarmoniBar(player.harmoni || 50)}`
                : ''

            const anakList = player.anak || []
            const anakSummary = anakList.length === 0
                ? '  👶 Belum punya anak'
                : anakList.map((a, i) => {
                    const jenjang = a.pendidikan ? getJenjangLabel(a.pendidikan) : 'Belum sekolah'
                    const kerja = a.bekerja ? ` 💼 ${toRupiah(a.totalKiriman || 0)} total` : ''
                    return `  ${i+1}. ${a.emoji} ${a.nama} | ${a.usia} thn | ${jenjang}${kerja}`
                }).join('\n')

            const rumahText = player.rumahKeluarga
                ? `  🏠 ${getRumahLabel(player.rumahKeluarga.tier)}\n  Renovasi: ${(player.rumahKeluarga.renovasi || []).join(', ') || '-'}`
                : '  🏚️ Belum punya rumah keluarga'

            return alip.sendMessage(m.chat, {
                text: `✦ 👨‍👩‍👧  STATISTIK KELUARGA  👨‍👩‍👧\n\n  💑 Status: ${statusNikah}${annivText}${harmoniText}\n\n  👶 ANAK (${anakList.length}):\n${anakSummary}\n\n  🏠 RUMAH:\n${rumahText}\n\n  📊 STATISTIK:\n  💵 Total nafkah   : ${toRupiah(player.totalNafkah || 0)}\n  ✈️ Total liburan  : ${player.totalLiburan || 0}x\n  📸 Total foto     : ${player.totalFoto || 0}x\n  💑 Kencan         : ${player.totalKencan || 0}x\n  🚨 Kena selingkuh : ${player.kenaSelingkuh || 0}x\n`,
                mentions: player.pasangan ? [senderJid, player.pasangan] : [senderJid]
            }, { quoted: m })
        }

// 
//  LIFE SIMULATOR: HELP LENGKAP
// 

        if (command === 'lifehelp') {
            return Reply(`✦ ── 💒  LIFE SIMULATOR LENGKAP  💒 ──
  💍 *PERNIKAHAN*
  *.lamar @user*      — Lamar (Rp 500rb)
  *.terima / .tolak*  — Jawab lamaran
  *.cerai*            — Cerai (Rp 1jt)
  *.infopasangan*     — Status keluarga

  💞 *KEHARMONISAN*
  *.harmoni*          — Cek keharmonisan
  *.kencan*           — Kencan (Rp 200rb, CD:12j)
  *.kadoanniversary*  — Kado anniversary (Rp 500rb)
  *.selingkuh @user*  — ⚠️ Selingkuh (30% ketahuan)
  *.cekselingkuh*     — Investigasi pasangan (Rp 100rb)

  👶 *ANAK*
  *.buatanak*         — Punya anak baru
  *.rawatanak [no]*   — Rawat anak (CD:4j)
  *.infoanak*         — Detail semua anak
  *.kadoanak [no] [jml]* — Kado untuk anak

  🏫 *PENDIDIKAN ANAK*
  *.sekolahkan [no]*  — Sekolahkan anak
  *.kerjaanak [no]*   — Anak mulai bekerja
  *.rapotanak*        — Lihat progress pendidikan

  🏠 *RUMAH KELUARGA*
  *.belirumahtinggal [tier]* — Beli rumah
  *.renovasirumah [tipe]*    — Renovasi rumah
  *.inforumah*               — Info rumah & bonus

  🍽️ *AKTIVITAS KELUARGA*
  *.makanbersama*      — Makan keluarga (CD:8j)
  *.liburankeluarga [tujuan]* — Liburan (CD:7h)
  *.fotobersama*       — Foto keluarga (CD:4j)

  🍱 *NAFKAH & MAKANAN*
  *.belimakanan [jml]* — Beli makanan anak
  *.nafkah [jml]*      — Kasih nafkah keluarga

  ⚡ *LAINNYA*
  *.cekevent*         — Cek event random keluarga
  *.statkeluarga*     — Statistik lengkap keluarga
  *.topkeluarga*      — 🏆 Ranking keluarga terbaik
  *.simulatorhelp*    — Panduan simulator
  *.hargasimulator*   — Daftar semua harga 💰

  🏛️ *PANTI ASUHAN*
  *.buanganak [no]*   — Buang anak ke panti
  *.hapusanak [no]*   — Hapus anak permanen
  *.pantiasuhan*      — Lihat anak di panti
  *.pantiasuhan [no]* — Adopsi anak (Rp 3jt)
  *.resetpanti [alasan]* — 🔧 Reset panti (admin)`)
        }

// 
//  LIFE SIMULATOR: BUANG ANAK (kirim ke panti asuhan)
// 

        if (command === 'buanganak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu tidak punya anak!`)

            const idx = args[0] ? parseInt(args[0]) - 1 : -1
            if (isNaN(idx + 1) || idx < 0 || idx >= anakList.length) {
                const daftar = anakList.map((a, i) => `  ${i+1}. ${a.emoji} *${a.nama}* — usia ${a.usia} thn`).join('\n')
                return Reply(`✦ 👶  PILIH ANAK  👶\n\n${daftar}\n\n\nGunakan: *.buanganak [nomor]*\nContoh: *.buanganak 1*`)
            }

            const anak = anakList[idx]

            let pantiDB = { anak: [] }
            try { pantiDB = JSON.parse(fs.readFileSync(pantiDBPath)) } catch(e) {}
            if (!pantiDB.anak) pantiDB.anak = []

            const BIAYA_BUANG = 1000000
            if ((player.gold || 0) < BIAYA_BUANG) return Reply(`❌ Butuh *${toRupiah(BIAYA_BUANG)}* untuk biaya administrasi panti asuhan!`)

            const anakPanti = {
                ...anak,
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                orangTuaJid: senderJid,
                orangTuaNama: '@' + senderJid.split('@')[0],
                pasanganJid: player.pasangan || null,
                tanggalBuang: new Date().toLocaleDateString('id-ID'),
                sudahDiadopsi: false
            }
            pantiDB.anak.push(anakPanti)
            fs.writeFileSync(pantiDBPath, JSON.stringify(pantiDB, null, 2))

            player.gold -= BIAYA_BUANG
            player.anak = anakList.filter((_, i) => i !== idx)
            player.harmoni = Math.max(0, (player.harmoni || 50) - 20)

            if (player.pasangan) {
                const pasanganJid = resolvePlayerJid(player.pasangan)
                const pasangan = rpgDB.players[pasanganJid]
                if (pasangan && pasangan.anak) {
                    pasangan.anak = pasangan.anak.filter(a => a.nama !== anak.nama || a.lahir !== anak.lahir)
                }
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✦ 😢  ANAK DIKIRIM KE PANTI  😢\n\n  ${anak.emoji} *${anak.nama}* (usia ${anak.usia} thn)\n   telah dikirim ke panti asuhan.\n\n  💸 Biaya administrasi: *${toRupiah(BIAYA_BUANG)}*\n  💔 Keharmonisan: -20\n  👶 Sisa anak kamu: ${player.anak.length}\n\n  📌 Anak bisa diadopsi player lain\n   dengan command *.pantiasuhan*\n\n_Semoga ${anak.nama} mendapat orang tua yang baik... 🙏_`)
        }

// 
//  LIFE SIMULATOR: HAPUS ANAK (permanen, tidak ke panti)
// 

        if (command === 'hapusanak') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)
            const player = rpgDB.players[senderJid]
            const anakList = player.anak || []
            if (anakList.length === 0) return Reply(`❌ Kamu tidak punya anak!`)

            const idx = args[0] ? parseInt(args[0]) - 1 : -1
            if (isNaN(idx + 1) || idx < 0 || idx >= anakList.length) {
                const daftar = anakList.map((a, i) => `  ${i+1}. ${a.emoji} *${a.nama}* — usia ${a.usia} thn`).join('\n')
                return Reply(`✦ 👶  PILIH ANAK YANG DIHAPUS  👶\n\n${daftar}\n\n\n⚠️ Hapus anak bersifat *PERMANEN* dan tidak masuk panti!\nGunakan: *.hapusanak [nomor]*\nContoh: *.hapusanak 1*`)
            }

            const anak = anakList[idx]
            const anakKey = anak.nama + '_' + (anak.lahir || '')

            if (!args[1] || args[1].toLowerCase() !== 'ya') {
                return Reply(`✦ ⚠️  KONFIRMASI HAPUS  ⚠️\n\n  Kamu yakin ingin menghapus:\n  ${anak.emoji} *${anak.nama}* (usia ${anak.usia} thn)?\n\n  ⚠️ Data anak akan *DIHAPUS PERMANEN*\n   dan tidak bisa dikembalikan!\n\n  Ketik: *.hapusanak ${idx + 1} ya*\n   untuk konfirmasi.\n`)
            }

            // Hapus dari data player sendiri
            player.anak = anakList.filter((_, i) => i !== idx)

            // Hapus dari data pasangan (gunakan key nama+lahir agar akurat)
            if (player.pasangan) {
                const pasanganJid = resolvePlayerJid(player.pasangan)
                const pasangan = rpgDB.players[pasanganJid]
                if (pasangan && Array.isArray(pasangan.anak)) {
                    pasangan.anak = pasangan.anak.filter(a => {
                        const key = a.nama + '_' + (a.lahir || '')
                        return key !== anakKey
                    })
                }
            }

            fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
            return Reply(`✦ 🗑️  ANAK DIHAPUS  🗑️\n\n  ${anak.emoji} *${anak.nama}* telah dihapus\n   dari data keluarga.\n\n  👶 Sisa anak: ${player.anak.length}\n  📌 Kamu dan pasangan sekarang\n   bisa membuat anak baru!\n`)
        }

// 
//  ADMIN: RESET PANTI ASUHAN
// 

        if (command === 'resetpanti') {
            // Cek apakah pengirim adalah owner/admin bot
            const isOwner = m.fromMe || (global.owner && global.owner.includes(senderJid.split('@')[0]))
            if (!isOwner) return Reply(`❌ Command ini hanya bisa digunakan oleh *owner/admin bot*!`)

            let pantiDB = { anak: [] }
            try { pantiDB = JSON.parse(fs.readFileSync(pantiDBPath)) } catch(e) {}
            if (!pantiDB.anak) pantiDB.anak = []

            const alasan = args.join(' ') || 'Pemeliharaan sistem panti asuhan'
            const jumlahSebelum = pantiDB.anak.length
            const jumlahTersedia = pantiDB.anak.filter(a => !a.sudahDiadopsi).length
            const jumlahSudahAdopsi = pantiDB.anak.filter(a => a.sudahDiadopsi).length

            if (jumlahSebelum === 0) {
                return Reply(`✦ 🏛️  RESET PANTI  🏛️\n\n  ℹ️ Panti asuhan sudah kosong!\n  Tidak ada anak yang perlu direset.\n`)
            }

            // Reset data panti — kosongkan semua anak
            pantiDB.anak = []
            pantiDB.lastReset = {
                tanggal: new Date().toLocaleDateString('id-ID'),
                waktu: new Date().toLocaleTimeString('id-ID'),
                oleh: '@' + senderJid.split('@')[0],
                alasan: alasan,
                jumlahDireset: jumlahSebelum
            }

            fs.writeFileSync(pantiDBPath, JSON.stringify(pantiDB, null, 2))

            return Reply(`✦ 🏛️  RESET PANTI BERHASIL  🏛️\n\n  ✅ Data panti asuhan telah direset!\n\n  📊 *Ringkasan Reset:*\n  ├ Total anak sebelumnya : *${jumlahSebelum}*\n  ├ Belum diadopsi        : *${jumlahTersedia}* anak\n  └ Sudah diadopsi        : *${jumlahSudahAdopsi}* anak\n\n  📋 *Alasan Reset:*\n  _${alasan}_\n\n  📅 ${new Date().toLocaleDateString('id-ID')} — ${new Date().toLocaleTimeString('id-ID')}\n  👤 Oleh: @${senderJid.split('@')[0]}\n\n  ℹ️ Semua anak telah dipindahkan.\n   Panti siap menerima anak baru!\n`)
        }

// 
//  LIFE SIMULATOR: PANTI ASUHAN — lihat & adopsi anak
// 

        if (command === 'pantiasuhan') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* untuk memulai.`)

            let pantiDB = { anak: [] }
            try { pantiDB = JSON.parse(fs.readFileSync(pantiDBPath)) } catch(e) {}
            if (!pantiDB.anak) pantiDB.anak = []

            const tersedia = pantiDB.anak.filter(a => !a.sudahDiadopsi)
            const BIAYA_ADOPSI = 3000000  // ← definisi di sini agar bisa dipakai di seluruh block pantiasuhan

            // Jika ada argumen nomor → proses adopsi
            if (args[0] && !isNaN(parseInt(args[0]))) {
                const noAdopsi = parseInt(args[0]) - 1
                if (noAdopsi < 0 || noAdopsi >= tersedia.length) {
                    return Reply(`❌ Nomor anak tidak valid! Ketik *.pantiasuhan* untuk lihat daftar.`)
                }

                const anakAdopsi = tersedia[noAdopsi]
                const player = rpgDB.players[senderJid]

                if (anakAdopsi.orangTuaJid === senderJid || anakAdopsi.pasanganJid === senderJid) {
                    return Reply(`❌ Kamu tidak bisa mengadopsi anakmu sendiri!`)
                }

                if ((player.gold || 0) < BIAYA_ADOPSI) {
                    return Reply(`❌ Biaya adopsi: *${toRupiah(BIAYA_ADOPSI)}*. Gold kamu tidak cukup!`)
                }

                const anakBaru = {
                    nama: anakAdopsi.nama,
                    gender: anakAdopsi.gender,
                    emoji: anakAdopsi.emoji,
                    usia: anakAdopsi.usia,
                    kesehatan: anakAdopsi.kesehatan || 80,
                    lahir: anakAdopsi.lahir,
                    terakhirDirawat: Date.now(),
                    makanan: anakAdopsi.makanan || 60,
                    bakat: anakAdopsi.bakat || randomBakat(),
                    diadopsi: true,
                    orangTuaAsliNama: anakAdopsi.orangTuaNama,
                    pendidikan: anakAdopsi.pendidikan || null,
                    bekerja: anakAdopsi.bekerja || false
                }

                player.gold -= BIAYA_ADOPSI
                player.anak = player.anak || []
                player.anak.push(anakBaru)

                if (player.pasangan) {
                    const pasanganJid = resolvePlayerJid(player.pasangan)
                    const pasangan = rpgDB.players[pasanganJid]
                    if (pasangan) {
                        pasangan.anak = pasangan.anak || []
                        pasangan.anak.push(anakBaru)
                    }
                }

                const idxPanti = pantiDB.anak.findIndex(a => a.id === anakAdopsi.id)
                if (idxPanti !== -1) {
                    pantiDB.anak[idxPanti].sudahDiadopsi = true
                    pantiDB.anak[idxPanti].adopsiOleh = senderJid
                    pantiDB.anak[idxPanti].tanggalAdopsi = new Date().toLocaleDateString('id-ID')
                }

                fs.writeFileSync(pantiDBPath, JSON.stringify(pantiDB, null, 2))
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))

                return Reply(`✦ 🏠  ADOPSI BERHASIL!  🏠\n\n  ${anakBaru.emoji} *${anakBaru.nama}* kini menjadi\n   anakmu secara resmi! 🎉\n\n  🎂 Usia saat adopsi: *${anakBaru.usia} tahun*\n  ❤️  Kesehatan: *${anakBaru.kesehatan}/100*\n  🍱 Makanan  : *${anakBaru.makanan}/100*\n  ✨ Bakat    : *${getBakatLabel(anakBaru.bakat)}*\n  👤 Ortu asli: *${anakBaru.orangTuaAsliNama}*\n\n  💸 Biaya adopsi: *${toRupiah(BIAYA_ADOPSI)}*\n\n  📌 Rawat anakmu agar tumbuh besar!\n  *.rawatanak* — Rawat & tambah usia\n\n_Selamat datang di keluarga baru, ${anakBaru.nama}! 🥰_`)
            }

            // Tampilkan daftar anak di panti
            if (tersedia.length === 0) {
                return Reply(`✦ 🏛️  PANTI ASUHAN  🏛️\n\n  😊 Saat ini tidak ada anak\n   yang membutuhkan orang tua.\n\n  📌 Anak akan muncul saat ada\n   player yang pakai *.buanganak*\n`)
            }

            const daftarAnak = tersedia.map((a, i) => {
                return `  *${i+1}.* ${a.emoji} *${a.nama}*\n   🎂 Usia: ${a.usia} thn  |  ❤️ Sehat: ${a.kesehatan || 80}/100\n   ✨ Bakat: ${getBakatLabel(a.bakat || 'pejuang')}\n   👤 Ortu: ${a.orangTuaNama}\n   📅 Masuk: ${a.tanggalBuang}`
            }).join('\n\n')

            return Reply(`✦ 🏛️  PANTI ASUHAN  🏛️\n\n  👶 Anak tersedia untuk diadopsi: *${tersedia.length}*\n\n${daftarAnak}\n\n  💰 Biaya adopsi : *${toRupiah(BIAYA_ADOPSI)}*\n  ✅ Bisa adopsi tanpa harus menikah!\n  ⚠️ Kamu tidak bisa adopsi anak sendiri\n\n  📌 Cara adopsi:\n   Ketik *.pantiasuhan [nomor]*\n   Contoh: *.pantiasuhan 1*\n`)
        }

// 
//  LIFE SIMULATOR: TOP KELUARGA
// 

        if (command === 'topkeluarga') {
            const semua = Object.entries(rpgDB.players)
            const subCmd = args[0] ? args[0].toLowerCase() : 'harmoni'

            const KATEGORI = {
                'harmoni':  { label: 'Keharmonisan Tertinggi', key: p => p.pasangan ? (p.harmoni || 0) : -1, format: v => v + '/100' },
                'anak':     { label: 'Anak Terbanyak',         key: p => (p.anak || []).length, format: v => v + ' anak' },
                'nafkah':   { label: 'Nafkah Terbesar',        key: p => p.totalNafkah || 0, format: v => toRupiah(v) },
                'kencan':   { label: 'Kencan Terbanyak',       key: p => p.totalKencan || 0, format: v => v + 'x kencan' },
                'kaya':     { label: 'Keluarga Terkaya',       key: p => (p.gold || 0) + (p.bank?.balance || 0), format: v => toRupiah(v) },
            }

            if (!KATEGORI[subCmd]) {
                return Reply(`TOP KELUARGA\n\nPilih kategori:\n.topkeluarga harmoni\n.topkeluarga anak\n.topkeluarga nafkah\n.topkeluarga kencan\n.topkeluarga kaya`)
            }

            const kat = KATEGORI[subCmd]
            const ranked = semua
                .map(([jid, p]) => ({ jid, p, score: kat.key(p) }))
                .filter(x => x.score >= 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)

            if (ranked.length === 0) return Reply(`TOP KELUARGA\n\nBelum ada data untuk kategori ini!`)

            const rows = ranked.map(({ jid, p, score }, i) => ({
                rank: i+1,
                label: p.name || jid.split('@')[0],
                value: kat.format(score),
                extra: p.pasanganNama ? `Pasangan: ${p.pasanganNama}` : `${(p.anak||[]).length} anak`
            }))

            const myRank = ranked.findIndex(x => x.jid === senderJid)
            const caption = myRank >= 0 ? `Posisimu: #${myRank+1}` : `Kamu belum masuk top 10`
            const imgBuf = await generateLeaderboardCanvas(`TOP KELUARGA - ${kat.label.toUpperCase()}`, 'Leaderboard Keluarga', rows)
            if (imgBuf) return alip.sendMessage(m.chat, { image: imgBuf, caption }, { quoted: m })

            let t = `TOP KELUARGA - ${kat.label}\n\n`
            ranked.forEach(({ jid, p, score }, i) => { t += `  ${i+1}. ${p.name||jid.split('@')[0]} - ${kat.format(score)}\n` })
            return Reply(t)
        }


        // ══════════════════════════════════════════
        // 💰 CRYPTO TRADING
        // ══════════════════════════════════════════
        if (command === 'crypto') {
            if (!rpgDB.players[senderJid]) return Reply(`❌ Belum jadi petualang! Ketik *.rpgstart* dulu.`)
            const player = rpgDB.players[senderJid]
            if (!player.crypto) player.crypto = {}
            if (!player.futures) player.futures = {}
            if (!rpgDB.cryptoMarket) rpgDB.cryptoMarket = { trend: 'SIDEWAYS', npc: 0 }
            if (!rpgDB.cryptoPrice) rpgDB.cryptoPrice = {}
            if (!rpgDB.cryptoCandle) rpgDB.cryptoCandle = {}

            const sub = args[0]?.toLowerCase() || ''
            const cryptoCoins = {
                btc:  { name: '🟠 Bitcoin (BTC)',    vol: 2.5 },
                eth:  { name: '🔷 Ethereum (ETH)',    vol: 2.0 },
                bnb:  { name: '🟡 BNB',               vol: 1.8 },
                sol:  { name: '💜 Solana (SOL)',       vol: 2.2 },
                xrp:  { name: '🔵 XRP',               vol: 1.6 },
                doge: { name: '🐕 Dogecoin (DOGE)',   vol: 3.0 },
                apt:  { name: '🅰️ Aptos (APT)',        vol: 2.4 },
                arb:  { name: '🌀 Arbitrum (ARB)',     vol: 2.3 },
                avax: { name: '🔺 Avalanche (AVAX)',   vol: 2.1 },
                link: { name: '🔗 Chainlink (LINK)',   vol: 1.9 },
                op:   { name: '🔴 Optimism (OP)',      vol: 2.6 },
                sui:  { name: '💧 Sui (SUI)',          vol: 2.8 }
            }
            const MAX_LEV = { btc: 125, eth: 100, bnb: 75, sol: 75, xrp: 50, doge: 50, apt: 50, arb: 50, avax: 50, link: 50, op: 50, sui: 50 }
            const FUNDING_RATE = 0.01 // 0.01% per tick (dibayar tiap interaksi)

            // ── Help ──────────────────────────────────────────────────────
            if (!sub || sub === 'help') {
                return Reply(`💰 CRYPTO TRADING

📊 SPOT TRADING
  .crypto harga [koin]        cek harga pasar
  .crypto beli [koin] [gold]  beli spot
  .crypto jual [koin]         jual posisi spot
  .crypto sl [koin] [harga]   set stop loss spot
  .crypto tp [koin] [harga]   set take profit spot
  .crypto porto               portofolio spot

📈 FUTURES TRADING
  .crypto long [koin] [gold] [lev]   buka posisi LONG
  .crypto short [koin] [gold] [lev]  buka posisi SHORT
  .crypto tutup [koin]               tutup posisi futures
  .crypto fsl [koin] [harga]         set SL futures
  .crypto ftp [koin] [harga]         set TP futures
  .crypto posisi                     lihat posisi futures

🕯️ CHART & MARKET
  .crypto candle [koin] [1m/5m/1h]   candlestick chart
  .crypto event                       trigger event random
  .crypto market                      info market + funding rate

💡 Koin: ${Object.keys(cryptoCoins).join(', ').toUpperCase()}
⚠️ Futures: leverage maks per koin berbeda. LONG = profit saat naik, SHORT = profit saat turun. Kena likuidasi jika margin habis!`)
            }

            // ── Market trend & tick ───────────────────────────────────────
            const cTrend = rpgDB.cryptoMarket.trend
            const cFlow = { BULL:['BULL','BULL','SIDEWAYS'], BEAR:['BEAR','SIDEWAYS','CRASH'], SIDEWAYS:['SIDEWAYS','BULL','BEAR'], CRASH:['CRASH','BEAR'] }
            if (Math.random() < 0.25) {
                const f = cFlow[cTrend]
                rpgDB.cryptoMarket.trend = f[Math.floor(Math.random() * f.length)]
            }
            const cBaseMove = { BULL:[0.4,1.5], BEAR:[-1.5,-0.4], SIDEWAYS:[-0.3,0.5], CRASH:[-5,-2] }

            function cryptoTick(coin) {
                const now = Date.now()
                if (!rpgDB.cryptoPrice[coin]) rpgDB.cryptoPrice[coin] = { price: 100 + Math.random() * 50, last: now - 60000 }
                const p = rpgDB.cryptoPrice[coin]
                let [mn, mx] = cBaseMove[rpgDB.cryptoMarket.trend]
                mn *= cryptoCoins[coin].vol; mx *= cryptoCoins[coin].vol
                const elapsed = Math.max(1, Math.floor((now - p.last) / 60000))
                let move = (Math.random() * (mx - mn) + mn) * elapsed
                move += rpgDB.cryptoMarket.npc * 0.1
                p.price = Math.max(1, p.price + move)
                p.last = now
                rpgDB.cryptoMarket.npc *= 0.9
                return p.price
            }

            // ── Hitung PnL futures ────────────────────────────────────────
            function calcFuturesPnl(pos, curPrice) {
                const priceDiff = curPrice - pos.entryPrice
                const pnl = pos.direction === 'long'
                    ? (priceDiff / pos.entryPrice) * pos.margin * pos.leverage
                    : (-priceDiff / pos.entryPrice) * pos.margin * pos.leverage
                return Math.floor(pnl)
            }

            // ── Hitung liquidation price ──────────────────────────────────
            function calcLiqPrice(pos) {
                const liqPct = 1 / pos.leverage  // misal lev 10x → liq di -10%
                if (pos.direction === 'long') {
                    return pos.entryPrice * (1 - liqPct + 0.005) // +0.5% buffer maintenance margin
                } else {
                    return pos.entryPrice * (1 + liqPct - 0.005)
                }
            }

            // ── Check SL/TP spot + liquidasi + SL/TP futures otomatis ─────
            for (const [coin, pos] of Object.entries(player.crypto)) {
                if (!cryptoCoins[coin] || !pos) continue
                const curPrice = rpgDB.cryptoPrice[coin]?.price
                if (!curPrice) continue
                if (pos.tp && curPrice >= pos.tp) {
                    const hasil = Math.floor(pos.unit * curPrice)
                    player.gold = (player.gold || 0) + hasil
                    delete player.crypto[coin]
                } else if (pos.sl && curPrice <= pos.sl) {
                    const hasil = Math.floor(pos.unit * curPrice)
                    player.gold = (player.gold || 0) + hasil
                    delete player.crypto[coin]
                }
            }
            for (const [coin, pos] of Object.entries(player.futures)) {
                if (!cryptoCoins[coin] || !pos) continue
                const curPrice = cryptoTick(coin)
                // Funding rate — potong margin tiap interaksi
                const funding = Math.floor(pos.margin * FUNDING_RATE)
                pos.margin = Math.max(0, pos.margin - funding)
                const pnl = calcFuturesPnl(pos, curPrice)
                const liqPrice = calcLiqPrice(pos)
                const isLiquidated = pos.direction === 'long' ? curPrice <= liqPrice : curPrice >= liqPrice
                // TP
                if (pos.tp && ((pos.direction === 'long' && curPrice >= pos.tp) || (pos.direction === 'short' && curPrice <= pos.tp))) {
                    const hasil = pos.margin + Math.max(0, pnl)
                    player.gold = (player.gold || 0) + hasil
                    delete player.futures[coin]
                    continue
                }
                // SL
                if (pos.sl && ((pos.direction === 'long' && curPrice <= pos.sl) || (pos.direction === 'short' && curPrice >= pos.sl))) {
                    const sisa = Math.max(0, pos.margin + pnl)
                    player.gold = (player.gold || 0) + sisa
                    delete player.futures[coin]
                    continue
                }
                // Liquidasi
                if (isLiquidated || pos.margin <= 0) {
                    delete player.futures[coin]
                    // margin hangus semua
                }
            }

            // ── event ─────────────────────────────────────────────────────
            if (sub === 'event') {
                const evs = [
                    { t: '🐋 Whale Dump',       m: -8  }, { t: '🏦 FED Rate Cut',    m: 6   },
                    { t: '💣 Exchange Hack',     m: -12 }, { t: '🚀 ETF Approved',    m: 10  },
                    { t: '⚡ Lightning Fork',    m: 5   }, { t: '🌍 Crypto Ban',      m: -15 },
                    { t: '🏛️ SEC Settlement',    m: 8   }, { t: '💸 Whale Accumulate',m: 7   },
                    { t: '📉 Stablecoin Depeg',  m: -10 }, { t: '🔥 Token Burn Besar',m: 9   },
                    { t: '🤝 Partnership Besar', m: 6   }, { t: '💀 Rug Pull Proyek', m: -20 }
                ]
                const ev = evs[Math.floor(Math.random() * evs.length)]
                rpgDB.cryptoMarket.npc += ev.m
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`⚠️ MARKET EVENT!\n${ev.t}\nDampak: ${ev.m > 0 ? '+' : ''}${ev.m}%\nTrend sekarang: ${rpgDB.cryptoMarket.trend}`)
            }

            // ── market ────────────────────────────────────────────────────
            if (sub === 'market') {
                const trendArrow = { BULL:'📈', BEAR:'📉', SIDEWAYS:'➡️', CRASH:'💥' }
                let out = `📊 CRYPTO MARKET\nTrend: ${trendArrow[rpgDB.cryptoMarket.trend] || ''} ${rpgDB.cryptoMarket.trend}\nFunding Rate: ${FUNDING_RATE}% per tick\n\n`
                for (const k of Object.keys(cryptoCoins)) {
                    const pr = cryptoTick(k)
                    out += `${cryptoCoins[k].name}  ${pr.toFixed(2)} ${trendArrow[rpgDB.cryptoMarket.trend] || ''}\n`
                    out += `  Max Lev: ${MAX_LEV[k]}x\n`
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(out)
            }

            // ── harga ─────────────────────────────────────────────────────
            if (sub === 'harga') {
                const specificCoin = args[1]?.toLowerCase()
                const trendArrow = { BULL:'📈', BEAR:'📉', SIDEWAYS:'➡️', CRASH:'💥' }
                let out = `📊 CRYPTO MARKET — ${rpgDB.cryptoMarket.trend} ${trendArrow[rpgDB.cryptoMarket.trend] || ''}\n\n`
                const coinsToShow = specificCoin && cryptoCoins[specificCoin] ? [specificCoin] : Object.keys(cryptoCoins)
                for (const k of coinsToShow) {
                    const pr = cryptoTick(k)
                    out += `${cryptoCoins[k].name}\n`
                    out += `💹 ${pr.toFixed(2)}\n`
                    if (player.crypto[k]) out += `📦 Spot: ${player.crypto[k].unit.toFixed(4)} unit | Modal: ${toRupiah(player.crypto[k].modal)}\n`
                    if (player.futures[k]) {
                        const fp = player.futures[k]
                        const pnl = calcFuturesPnl(fp, pr)
                        out += `⚡ Futures ${fp.direction.toUpperCase()} ${fp.leverage}x | PnL: ${pnl >= 0 ? '+' : ''}${toRupiah(pnl)}\n`
                    }
                    out += `\n`
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(out)
            }

            // ── candle ────────────────────────────────────────────────────
            if (sub === 'candle') {
                const coinArg = args[1]?.toLowerCase()
                const tf = args[2] || '1m'
                if (!cryptoCoins[coinArg]) return Reply(`❌ Koin tidak ada! Tersedia: ${Object.keys(cryptoCoins).join(', ')}`)
                const tfMs = { '1m': 60000, '5m': 300000, '1h': 3600000 }[tf]
                if (!tfMs) return Reply(`❌ Timeframe salah! Gunakan: 1m, 5m, 1h`)
                if (!rpgDB.cryptoCandle[coinArg]) rpgDB.cryptoCandle[coinArg] = {}
                if (!rpgDB.cryptoCandle[coinArg][tf]) rpgDB.cryptoCandle[coinArg][tf] = []
                const now = Date.now()
                const price = cryptoTick(coinArg)
                const arr = rpgDB.cryptoCandle[coinArg][tf]
                const last = arr[arr.length - 1]
                if (!last || now - last.t > tfMs) {
                    arr.push({ o: price, h: price, l: price, c: price, t: now })
                    if (arr.length > 12) arr.shift()
                } else { last.h = Math.max(last.h, price); last.l = Math.min(last.l, price); last.c = price }
                const blocks = ['▁','▂','▃','▄','▅','▆','▇','█']
                const prices = arr.map(v => v.c)
                const mn = Math.min(...prices), mx = Math.max(...prices)
                const scl = p => blocks[Math.floor((p - mn) / (mx - mn + 0.0001) * 7)]
                const graph = prices.map(p => scl(p)).join('')
                // Candle OHLC text
                const latestCandle = arr[arr.length - 1]
                const pctChange = ((latestCandle.c - latestCandle.o) / latestCandle.o * 100).toFixed(2)
                const candleDir = latestCandle.c >= latestCandle.o ? '🟢' : '🔴'
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`🕯️ CANDLE ${cryptoCoins[coinArg].name} (${tf})\n\n${graph}\n\nO: ${latestCandle.o.toFixed(2)}  H: ${latestCandle.h.toFixed(2)}\nL: ${latestCandle.l.toFixed(2)}  C: ${latestCandle.c.toFixed(2)}\n${candleDir} ${pctChange}%\n\nLow total : ${mn.toFixed(2)}\nHigh total: ${mx.toFixed(2)}\nTrend: ${rpgDB.cryptoMarket.trend}`)
            }

            // ══════════════════════════════════════════════════
            //  SPOT TRADING
            // ══════════════════════════════════════════════════

            if (sub === 'beli') {
                const coinArg = args[1]?.toLowerCase()
                const amount = parseInt(args[2])
                if (!cryptoCoins[coinArg]) return Reply(`❌ Koin tidak ada! Tersedia: ${Object.keys(cryptoCoins).join(', ')}`)
                if (!amount || amount < 10000) return Reply(`❌ Minimum beli Rp 10.000\nContoh: .crypto beli btc 1000000`)
                if ((player.gold || 0) < amount) return Reply(`❌ Gold kurang! Punya: ${toRupiah(player.gold)}`)
                if (player.crypto[coinArg]) return Reply(`⚠️ Sudah punya posisi spot ${coinArg.toUpperCase()}!\nJual dulu: .crypto jual ${coinArg}`)
                const pr = cryptoTick(coinArg)
                const fee = Math.floor(amount * 0.001) // 0.1% fee
                const modalAfterFee = amount - fee
                player.gold -= amount
                player.crypto[coinArg] = { modal: amount, unit: modalAfterFee / pr, sl: null, tp: null, entryPrice: pr, buyTime: Date.now() }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`📥 BELI SPOT BERHASIL\n${cryptoCoins[coinArg].name}\n💹 Harga masuk: ${pr.toFixed(2)}\n📦 Unit: ${(modalAfterFee/pr).toFixed(6)}\n💸 Modal: ${toRupiah(amount)}\n💳 Fee (0.1%): ${toRupiah(fee)}\n🌍 Trend: ${rpgDB.cryptoMarket.trend}\n\nSet SL/TP: .crypto sl ${coinArg} [harga]`)
            }

            if (sub === 'jual') {
                const coinArg = args[1]?.toLowerCase()
                if (!cryptoCoins[coinArg]) return Reply(`❌ Koin tidak ada!`)
                if (!player.crypto[coinArg]) return Reply(`❌ Tidak punya posisi spot ${coinArg.toUpperCase()}!`)
                const pr = cryptoTick(coinArg)
                const pos = player.crypto[coinArg]
                const gross = Math.floor(pos.unit * pr)
                const fee = Math.floor(gross * 0.001)
                const hasil = gross - fee
                const profit = hasil - pos.modal
                const pct = Math.round((profit / pos.modal) * 100 * 10) / 10
                player.gold = (player.gold || 0) + hasil
                delete player.crypto[coinArg]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`💰 JUAL SPOT\n${cryptoCoins[coinArg].name}\n💹 Harga jual: ${pr.toFixed(2)}\n📥 Harga beli: ${(pos.entryPrice || 0).toFixed(2)}\n💸 Modal: ${toRupiah(pos.modal)}\n💰 Hasil: ${toRupiah(hasil)}\n💳 Fee (0.1%): ${toRupiah(fee)}\n${profit >= 0 ? '📈 Profit' : '📉 Loss'}: ${profit >= 0 ? '+' : ''}${toRupiah(profit)} (${pct >= 0 ? '+' : ''}${pct}%)`)
            }

            if (sub === 'sl') {
                const coinArg = args[1]?.toLowerCase()
                const val = parseFloat(args[2])
                if (!player.crypto[coinArg]) return Reply(`❌ Tidak punya posisi spot ${coinArg?.toUpperCase() || ''}!`)
                if (isNaN(val) || val <= 0) return Reply(`❌ Harga tidak valid!`)
                player.crypto[coinArg].sl = val
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✅ Stop Loss SPOT diset\n${cryptoCoins[coinArg]?.name || coinArg}\n🛑 SL: ${val}\nPosisi otomatis jual jika harga turun ke ${val}`)
            }

            if (sub === 'tp') {
                const coinArg = args[1]?.toLowerCase()
                const val = parseFloat(args[2])
                if (!player.crypto[coinArg]) return Reply(`❌ Tidak punya posisi spot ${coinArg?.toUpperCase() || ''}!`)
                if (isNaN(val) || val <= 0) return Reply(`❌ Harga tidak valid!`)
                player.crypto[coinArg].tp = val
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✅ Take Profit SPOT diset\n${cryptoCoins[coinArg]?.name || coinArg}\n🎯 TP: ${val}\nPosisi otomatis jual jika harga naik ke ${val}`)
            }

            if (sub === 'porto') {
                const keys = Object.keys(player.crypto)
                if (keys.length === 0) return Reply(`📭 PORTOFOLIO SPOT KOSONG\n\nMulai: .crypto beli btc 1000000`)
                let t = `💼 PORTOFOLIO SPOT\nTrend: ${rpgDB.cryptoMarket.trend}\n\n`
                let totalModal = 0, totalNilai = 0
                for (const coin of keys) {
                    if (!cryptoCoins[coin]) continue
                    const pr = cryptoTick(coin)
                    const pos = player.crypto[coin]
                    const nilai = Math.floor(pos.unit * pr)
                    const profit = nilai - pos.modal
                    const pct = Math.round((profit / pos.modal) * 100 * 10) / 10
                    totalModal += pos.modal; totalNilai += nilai
                    t += `${cryptoCoins[coin].name}\n`
                    t += `  💹 ${pr.toFixed(2)}  📦 ${pos.unit.toFixed(4)} unit\n`
                    t += `  💸 Modal: ${toRupiah(pos.modal)}  →  ${toRupiah(nilai)}\n`
                    t += `  ${profit >= 0 ? '📈' : '📉'} P&L: ${profit >= 0 ? '+' : ''}${toRupiah(profit)} (${pct >= 0 ? '+' : ''}${pct}%)\n`
                    t += `  🛑 SL: ${pos.sl || '-'}  🎯 TP: ${pos.tp || '-'}\n\n`
                }
                const totalPnl = totalNilai - totalModal
                t += `Total Modal: ${toRupiah(totalModal)}\nTotal Nilai: ${toRupiah(totalNilai)}\nTotal P&L: ${totalPnl >= 0 ? '+' : ''}${toRupiah(totalPnl)}`
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(t)
            }

            // ══════════════════════════════════════════════════
            //  FUTURES TRADING
            // ══════════════════════════════════════════════════

            if (sub === 'long' || sub === 'short') {
                const direction = sub // 'long' atau 'short'
                const coinArg = args[1]?.toLowerCase()
                const margin = parseInt(args[2])
                const leverage = parseInt(args[3]) || 10
                if (!cryptoCoins[coinArg]) return Reply(`❌ Koin tidak ada! Tersedia: ${Object.keys(cryptoCoins).join(', ')}`)
                if (!margin || margin < 10000) return Reply(`❌ Minimum margin Rp 10.000\nContoh: .crypto ${direction} btc 500000 10`)
                if ((player.gold || 0) < margin) return Reply(`❌ Gold kurang! Punya: ${toRupiah(player.gold)}`)
                const maxLev = MAX_LEV[coinArg] || 50
                if (leverage < 1 || leverage > maxLev) return Reply(`❌ Leverage ${coinArg.toUpperCase()} maks ${maxLev}x\nContoh: .crypto ${direction} ${coinArg} ${margin} ${maxLev}`)
                if (player.futures[coinArg]) return Reply(`⚠️ Sudah ada posisi futures ${coinArg.toUpperCase()}!\nTutup dulu: .crypto tutup ${coinArg}`)
                const pr = cryptoTick(coinArg)
                const liqPrice = direction === 'long'
                    ? pr * (1 - (1 / leverage) + 0.005)
                    : pr * (1 + (1 / leverage) - 0.005)
                const notional = margin * leverage
                const fee = Math.floor(notional * 0.0004) // 0.04% taker fee
                player.gold -= margin
                player.futures[coinArg] = {
                    direction, leverage, margin, entryPrice: pr,
                    liqPrice: parseFloat(liqPrice.toFixed(4)),
                    sl: null, tp: null, openTime: Date.now(),
                    notional, fee
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                const dirEmoji = direction === 'long' ? '🟢 LONG' : '🔴 SHORT'
                return Reply(`⚡ FUTURES ${dirEmoji} DIBUKA\n${cryptoCoins[coinArg].name}\n💹 Entry: ${pr.toFixed(2)}\n💸 Margin: ${toRupiah(margin)}\n⚡ Leverage: ${leverage}x\n📊 Notional: ${toRupiah(notional)}\n💳 Fee: ${toRupiah(fee)}\n💀 Liq. Price: ${liqPrice.toFixed(2)}\n\nSet SL/TP: .crypto fsl ${coinArg} [harga] / .crypto ftp ${coinArg} [harga]\nTutup: .crypto tutup ${coinArg}`)
            }

            if (sub === 'tutup') {
                const coinArg = args[1]?.toLowerCase()
                if (!cryptoCoins[coinArg]) return Reply(`❌ Koin tidak ada!`)
                if (!player.futures[coinArg]) return Reply(`❌ Tidak ada posisi futures ${coinArg?.toUpperCase() || ''}!`)
                const pos = player.futures[coinArg]
                const pr = cryptoTick(coinArg)
                const pnl = calcFuturesPnl(pos, pr)
                const closeFee = Math.floor(pos.notional * 0.0004)
                const hasil = Math.max(0, pos.margin + pnl - closeFee)
                const roi = Math.round((pnl / pos.margin) * 100 * 10) / 10
                player.gold = (player.gold || 0) + hasil
                delete player.futures[coinArg]
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                const dirEmoji = pos.direction === 'long' ? '🟢 LONG' : '🔴 SHORT'
                return Reply(`⚡ FUTURES ${dirEmoji} DITUTUP\n${cryptoCoins[coinArg].name}\n💹 Entry: ${pos.entryPrice.toFixed(2)}\n💹 Close: ${pr.toFixed(2)}\n⚡ Leverage: ${pos.leverage}x\n💸 Margin: ${toRupiah(pos.margin)}\n${pnl >= 0 ? '📈 Profit' : '📉 Loss'}: ${pnl >= 0 ? '+' : ''}${toRupiah(pnl)}\n📊 ROI: ${roi >= 0 ? '+' : ''}${roi}%\n💳 Fee close: ${toRupiah(closeFee)}\n💰 Kembali: ${toRupiah(hasil)}`)
            }

            if (sub === 'fsl') {
                const coinArg = args[1]?.toLowerCase()
                const val = parseFloat(args[2])
                if (!player.futures[coinArg]) return Reply(`❌ Tidak ada posisi futures ${coinArg?.toUpperCase() || ''}!`)
                if (isNaN(val) || val <= 0) return Reply(`❌ Harga tidak valid!`)
                const pos = player.futures[coinArg]
                if (pos.direction === 'long' && val >= pos.entryPrice) return Reply(`❌ SL LONG harus di bawah entry (${pos.entryPrice.toFixed(2)})`)
                if (pos.direction === 'short' && val <= pos.entryPrice) return Reply(`❌ SL SHORT harus di atas entry (${pos.entryPrice.toFixed(2)})`)
                player.futures[coinArg].sl = val
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✅ Stop Loss FUTURES diset\n${cryptoCoins[coinArg]?.name || coinArg}\n🛑 SL: ${val}\nArah: ${pos.direction.toUpperCase()} ${pos.leverage}x`)
            }

            if (sub === 'ftp') {
                const coinArg = args[1]?.toLowerCase()
                const val = parseFloat(args[2])
                if (!player.futures[coinArg]) return Reply(`❌ Tidak ada posisi futures ${coinArg?.toUpperCase() || ''}!`)
                if (isNaN(val) || val <= 0) return Reply(`❌ Harga tidak valid!`)
                const pos = player.futures[coinArg]
                if (pos.direction === 'long' && val <= pos.entryPrice) return Reply(`❌ TP LONG harus di atas entry (${pos.entryPrice.toFixed(2)})`)
                if (pos.direction === 'short' && val >= pos.entryPrice) return Reply(`❌ TP SHORT harus di bawah entry (${pos.entryPrice.toFixed(2)})`)
                player.futures[coinArg].tp = val
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(`✅ Take Profit FUTURES diset\n${cryptoCoins[coinArg]?.name || coinArg}\n🎯 TP: ${val}\nArah: ${pos.direction.toUpperCase()} ${pos.leverage}x`)
            }

            if (sub === 'posisi') {
                const keys = Object.keys(player.futures)
                if (keys.length === 0) return Reply(`📭 TIDAK ADA POSISI FUTURES\n\nBuka posisi: .crypto long btc 500000 10`)
                let t = `⚡ POSISI FUTURES\nTrend: ${rpgDB.cryptoMarket.trend}\n\n`
                for (const coin of keys) {
                    if (!cryptoCoins[coin]) continue
                    const pos = player.futures[coin]
                    const pr = cryptoTick(coin)
                    const pnl = calcFuturesPnl(pos, pr)
                    const roi = Math.round((pnl / pos.margin) * 100 * 10) / 10
                    const liqPrice = calcLiqPrice(pos)
                    const dirEmoji = pos.direction === 'long' ? '🟢 LONG' : '🔴 SHORT'
                    t += `${cryptoCoins[coin].name}\n`
                    t += `  ${dirEmoji} ${pos.leverage}x\n`
                    t += `  💹 Harga: ${pr.toFixed(2)}  |  Entry: ${pos.entryPrice.toFixed(2)}\n`
                    t += `  💸 Margin: ${toRupiah(pos.margin)}\n`
                    t += `  ${pnl >= 0 ? '📈' : '📉'} PnL: ${pnl >= 0 ? '+' : ''}${toRupiah(pnl)} (${roi >= 0 ? '+' : ''}${roi}%)\n`
                    t += `  💀 Liq: ${liqPrice.toFixed(2)}\n`
                    t += `  🛑 SL: ${pos.sl || '-'}  🎯 TP: ${pos.tp || '-'}\n\n`
                }
                fs.writeFileSync(rpgDBPath, JSON.stringify(rpgDB, null, 2))
                return Reply(t)
            }

            return Reply(`❌ Sub-command tidak dikenal.\nKetik .crypto help untuk panduan.`)
        }

    } catch (error) {
        console.error('RPG Plugin Error:', error)
        Reply(`❌ *RPG ERROR* ❌\n\n${error.message}`)
    }
}

module.exports = {
    handler: _rpgHandlerFn,

    command: [
        'adduang', 'cekuang', 'topgold',
        'rpgstart', 'rpgstats', 'rpgexplore', 'attack', 'skill', 'ulti', 'flee', 'rpgmove', 'rpginv', 'rpgshop', 'buy', 'sell', 'use',
        'equip', 'unequip', 'item', 'rpghelp', 'tambang', 'mining', 'besi', 'nikel', 'emas', 'berlian', 'meramu', 'foraging',
        'jualbot', 'drop', 'buang', 'give', 'berikan', 'tradeitem',
        'dungeon', 'adopsipet', 'adoptpet', 'infopet', 'petinfo', 'judionline', 'begal', 'maling', 'crypto',
        'quest', 'craft', 'daily', 'pvp', 'leaderboardrpg', 'lb_rpg',
        'changeclass', 'ganticlass', 'gantikelas', 'upgrade',
        'mancingstart', 'mancing', 'tasikan', 'jualikanbot', 'jualikan', 'setujuikan', 'tolakikan', 'tawarikan', 'batalkanikan', 'shoprod', 'shopbomber', 'topmancing',
        'ngocok', 'ngelonte',
        'openbo', 'ngojek', 'ngaji', 'kerja', 'jobkerja', 'berkebun', 'tfuang', 'bank', 'setor', 'tarik', 'topbank',
        'market', 'belimarket', 'jualsaham', 'jualaset', 'jualasetbot', 'batallisting', 'ceksaham', 'portofolio',
        'topkaya', 'simpanaset', 'tarikaset', 'pasifincome',
        'resetgoldall', 'resetgolduser', 'editgold', 'editrpg', 'resetbankall', 'editbank', 'resetasetall', 'resetkeluargaall', 'resetkeluargauser', 'info',
        'shopfood', 'peliharaikan', 'akuarium', 'makankanikan', 'lepaskan', 'aduikan', 'infoaduikan',
        'buatclan', 'listclan', 'gabukclan', 'keluarclan', 'infoclan', 'renameclan', 'kickclan', 'transferclan', 'depositclan', 'serangclan', 'rampokclan', 'clanhelp', 'tokoclan', 'beliclan',
        'lamar', 'terima', 'tolak', 'cerai', 'infopasangan',
        'buatanak', 'rawatanak', 'belimakanan', 'nafkah', 'infoanak', 'simulatorhelp', 'hargasimulator',
        'kencan', 'harmoni', 'cekharmoni', 'kadoanniversary',
        'selingkuh', 'cekselingkuh',
        'sekolahkan', 'kerjaanak', 'rapotanak',
        'belirumahtinggal', 'renovasirumah', 'inforumah',
        'makanbersama', 'liburankeluarga', 'fotobersama',
        'kadoanak', 'cekevent', 'statkeluarga', 'lifehelp', 'topkeluarga',
        'buanganak', 'hapusanak', 'pantiasuhan', 'resetpanti',
        'listtitle', 'listgelar', 'gelarku', 'cektitle', 'cekgelar',
        'listikan', 'daftarikan', 'listmutasi'
    ],
    tags: ['rpg']
}