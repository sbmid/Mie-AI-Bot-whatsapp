const fs = require("fs")
const os = require("os")
const path = require("path")
const { createCanvas } = require("canvas")

const DB_PATH = "./library/database/ulartangga.json"
const MIN_PLAYER = 2
const MAX_PLAYER = 6

const SNAKES = {
  99: 54, 95: 72, 92: 48, 83: 19, 73: 52,
  69: 33, 64: 36, 59: 17, 55: 7, 43: 22
}

const LADDERS = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
  28: 84, 36: 44, 51: 67, 71: 91, 78: 98
}

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ rooms: {} }, null, 2))
}

function loadDB() {
  ensureDB()
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH))
    if (!parsed || typeof parsed !== "object") return { rooms: {} }
    if (!parsed.rooms || typeof parsed.rooms !== "object") parsed.rooms = {}
    return parsed
  } catch {
    return { rooms: {} }
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function normalizeJid(jid = "") {
  return String(jid || "").replace(/:\d+@/, "@")
}

function getRoom(db, chat) {
  return db.rooms[chat] || null
}

function buildBoard(room) {
  const markerByJid = {}
  room.players.forEach((p, i) => {
    markerByJid[p.jid] = String(i + 1)
  })

  const posMap = {}
  room.players.forEach((p) => {
    const pos = Math.max(0, Math.min(100, Number(p.pos) || 0))
    if (pos <= 0) return
    if (!posMap[pos]) posMap[pos] = []
    posMap[pos].push(markerByJid[p.jid])
  })

  const rows = []
  for (let r = 9; r >= 0; r--) {
    const start = r * 10 + 1
    const nums = Array.from({ length: 10 }, (_, i) => start + i)
    const ordered = r % 2 === 0 ? nums : nums.reverse()
    const line = ordered.map((n) => {
      const tag = posMap[n] ? posMap[n].join("") : "·"
      return `${String(n).padStart(3, "0")}${tag}`
    }).join(" ")
    rows.push(line)
  }
  return rows.join("\n")
}

function playerList(room) {
  return room.players.map((p, i) => {
    const status = p.started ? "✅" : "🎯"
    return `${i + 1}. @${p.jid.split("@")[0]} • Pos ${p.pos || 0} ${status}`
  }).join("\n")
}

function nextTurn(room) {
  room.turnIndex = (room.turnIndex + 1) % room.players.length
}

function applySnakeLadder(pos) {
  if (LADDERS[pos]) return { to: LADDERS[pos], type: "ladder" }
  if (SNAKES[pos]) return { to: SNAKES[pos], type: "snake" }
  return { to: pos, type: null }
}

function roomHeader(room) {
  return `🎲 *ULAR TANGGA ROOM*\nStatus: *${room.status.toUpperCase()}*\nPlayer: *${room.players.length}/${MAX_PLAYER}*`
}

const DICE_FACE = {
  1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅"
}

const CELL_COLORS = ["#fde047", "#93c5fd", "#f9a8d4", "#86efac", "#c4b5fd", "#fdba74", "#67e8f9", "#fca5a5"]

function cellToXY(n, cellSize, boardSize, pad) {
  const index = n - 1
  const row = Math.floor(index / 10)
  const colInRow = index % 10
  const yRow = 9 - row
  const xCol = row % 2 === 0 ? colInRow : 9 - colInRow
  const x = pad + xCol * cellSize + cellSize / 2
  const y = pad + yRow * cellSize + cellSize / 2
  return { x, y }
}

function renderBoardImage(room) {
  const cellSize = 80
  const boardSize = cellSize * 10
  const pad = 24
  const side = 340
  const width = boardSize + pad * 2 + side
  const height = boardSize + pad * 2
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  ctx.fillStyle = "#1e293b"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#0f172a"
  ctx.fillRect(pad - 8, pad - 8, boardSize + 16, boardSize + 16)

  for (let n = 1; n <= 100; n++) {
    const center = cellToXY(n, cellSize, boardSize, pad)
    const x = center.x - cellSize / 2
    const y = center.y - cellSize / 2
    ctx.fillStyle = CELL_COLORS[(n - 1) % CELL_COLORS.length]
    ctx.fillRect(x, y, cellSize, cellSize)
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, cellSize, cellSize)
    ctx.fillStyle = "#0b1020"
    ctx.font = "bold 13px Sans"
    ctx.fillText(String(n), x + 6, y + 16)
  }

  Object.entries(LADDERS).forEach(([from, to]) => {
    const a = cellToXY(Number(from), cellSize, boardSize, pad)
    const b = cellToXY(Number(to), cellSize, boardSize, pad)
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len, uy = dy / len
    const px = -uy, py = ux
    const railGap = 9, rungGap = 20

    ctx.strokeStyle = "#a16207"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.moveTo(a.x + px * railGap, a.y + py * railGap)
    ctx.lineTo(b.x + px * railGap, b.y + py * railGap)
    ctx.moveTo(a.x - px * railGap, a.y - py * railGap)
    ctx.lineTo(b.x - px * railGap, b.y - py * railGap)
    ctx.stroke()

    ctx.strokeStyle = "#fde68a"
    ctx.lineWidth = 3
    for (let t = 12; t < len - 12; t += rungGap) {
      const rx = a.x + ux * t, ry = a.y + uy * t
      ctx.beginPath()
      ctx.moveTo(rx + px * railGap, ry + py * railGap)
      ctx.lineTo(rx - px * railGap, ry - py * railGap)
      ctx.stroke()
    }
  })

  Object.entries(SNAKES).forEach(([from, to]) => {
    const a = cellToXY(Number(from), cellSize, boardSize, pad)
    const b = cellToXY(Number(to), cellSize, boardSize, pad)
    const sign = (Number(from) + Number(to)) % 2 === 0 ? 1 : -1
    const c1x = a.x + (b.x - a.x) * 0.25 + sign * 38
    const c1y = a.y + (b.y - a.y) * 0.2 - sign * 22
    const c2x = a.x + (b.x - a.x) * 0.75 - sign * 34
    const c2y = a.y + (b.y - a.y) * 0.8 + sign * 18

    ctx.strokeStyle = "rgba(15,23,42,0.35)"
    ctx.lineWidth = 13
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(a.x + 2, a.y + 2)
    ctx.bezierCurveTo(c1x + 2, c1y + 2, c2x + 2, c2y + 2, b.x + 2, b.y + 2)
    ctx.stroke()

    ctx.strokeStyle = "#e11d8a"
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, b.x, b.y)
    ctx.stroke()

    ctx.strokeStyle = "#fde047"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(a.x - 2, a.y - 1)
    ctx.bezierCurveTo(c1x - 2, c1y - 1, c2x - 2, c2y - 1, b.x - 2, b.y - 1)
    ctx.stroke()

    ctx.fillStyle = "#be185d"
    ctx.beginPath()
    ctx.arc(a.x, a.y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#fde047"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#111827"
    ctx.beginPath()
    ctx.arc(a.x - 3, a.y - 2, 1.2, 0, Math.PI * 2)
    ctx.arc(a.x + 3, a.y - 2, 1.2, 0, Math.PI * 2)
    ctx.fill()
  })

  const colors = ["#f59e0b", "#06b6d4", "#22c55e", "#a855f7", "#ef4444", "#3b82f6"]
  room.players.forEach((p, idx) => {
    const pos = Math.max(1, Math.min(100, Number(p.pos) || 1))
    const c = cellToXY(pos, cellSize, boardSize, pad)
    const offsetX = ((idx % 3) - 1) * 12
    const offsetY = (Math.floor(idx / 3) - 0.5) * 12
    const x = c.x + offsetX, y = c.y + offsetY
    ctx.fillStyle = colors[idx % colors.length]
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = "#0f172a"
    ctx.stroke()
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 11px Sans"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(String(idx + 1), x, y + 0.5)
  })

  const panelX = pad * 2 + boardSize
  ctx.fillStyle = "#0b1736"
  ctx.fillRect(panelX, 0, side, height)
  ctx.fillStyle = "#f8fafc"
  ctx.font = "bold 30px Sans"
  ctx.textAlign = "left"
  ctx.fillText("ULAR TANGGA", panelX + 18, 48)
  ctx.font = "18px Sans"
  ctx.fillText(`Status: ${room.status.toUpperCase()}`, panelX + 18, 82)
  ctx.fillText(`Player: ${room.players.length}/${MAX_PLAYER}`, panelX + 18, 108)

  const current = room.players[room.turnIndex]
  ctx.fillStyle = "#facc15"
  ctx.font = "bold 19px Sans"
  if (room.status === "playing" && current) {
    ctx.fillText(`Giliran: P${room.turnIndex + 1}`, panelX + 18, 145)
  } else if (room.status === "finished" && room.winner) {
    const wi = room.players.findIndex((p) => p.jid === room.winner)
    ctx.fillText(`Pemenang: P${wi + 1}`, panelX + 18, 145)
  }

  ctx.fillStyle = "#cbd5e1"
  ctx.font = "16px Sans"
  let y = 185
  room.players.forEach((p, i) => {
    const started = p.started ? "✅" : "🎯"
    ctx.fillText(`P${i + 1} ${started}  @${p.jid.split("@")[0]}`, panelX + 18, y)
    y += 24
    ctx.fillText(`Posisi: ${p.pos || 0}`, panelX + 36, y)
    y += 20
  })

  return canvas.toBuffer("image/png")
}

function drawPips(ctx, face, x, y, size) {
  const dot = (px, py) => {
    ctx.beginPath()
    ctx.arc(x + px * size, y + py * size, Math.max(3, size * 0.06), 0, Math.PI * 2)
    ctx.fill()
  }
  const p = {
    c: [0.5, 0.5], tl: [0.28, 0.28], tr: [0.72, 0.28],
    ml: [0.28, 0.5], mr: [0.72, 0.5],
    bl: [0.28, 0.72], br: [0.72, 0.72]
  }
  if (face === 1) dot(...p.c)
  if (face === 2) { dot(...p.tl); dot(...p.br) }
  if (face === 3) { dot(...p.tl); dot(...p.c); dot(...p.br) }
  if (face === 4) { dot(...p.tl); dot(...p.tr); dot(...p.bl); dot(...p.br) }
  if (face === 5) { dot(...p.tl); dot(...p.tr); dot(...p.c); dot(...p.bl); dot(...p.br) }
  if (face === 6) { dot(...p.tl); dot(...p.ml); dot(...p.bl); dot(...p.tr); dot(...p.mr); dot(...p.br) }
}

function renderDice3D(face = 1, phase = 0) {
  const W = 320, H = 320
  const c = createCanvas(W, H)
  const ctx = c.getContext("2d")
  ctx.fillStyle = "rgba(0,0,0,0)"
  ctx.fillRect(0, 0, W, H)
  const s = 120, x = 90 + (phase % 3) * 6, y = 110, skew = 26

  ctx.fillStyle = "rgba(15,23,42,.28)"
  ctx.beginPath()
  ctx.ellipse(x + s * 0.7, y + s + 36, 74, 18, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = "#f8fafc"
  ctx.strokeStyle = "#94a3b8"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + skew, y - skew)
  ctx.lineTo(x + s + skew, y - skew)
  ctx.lineTo(x + s, y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = "#e2e8f0"
  ctx.beginPath()
  ctx.moveTo(x + s, y)
  ctx.lineTo(x + s + skew, y - skew)
  ctx.lineTo(x + s + skew, y + s - skew)
  ctx.lineTo(x + s, y + s)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(x, y, s, s)
  ctx.strokeRect(x, y, s, s)
  ctx.fillStyle = "#0f172a"
  drawPips(ctx, face, x, y, s)
  return c.toBuffer("image/png")
}

async function sendDiceVisual(alip, m, buffer, isFinal = false) {
  try {
    if (typeof alip.sendAsSticker === "function") {
      const fp = path.join(os.tmpdir(), `ut-dice-${Date.now()}.png`)
      fs.writeFileSync(fp, buffer)
      await alip.sendAsSticker(m.chat, fp, m, { packname: "Created by : Santana" })
      fs.unlinkSync(fp)
      return
    }
  } catch (_) {}
  await alip.sendMessage(m.chat, { image: buffer, caption: isFinal ? "🎲 Dadu final" : "🎲 Dadu rolling..." }, { quoted: m })
}

async function sendSingleDiceResult(alip, m, face) {
  const finalDice = renderDice3D(face, 2)
  try {
    if (typeof alip.sendAsSticker === "function") {
      const fp = path.join(os.tmpdir(), `ut-dice-final-${Date.now()}.png`)
      fs.writeFileSync(fp, finalDice)
      await alip.sendAsSticker(m.chat, fp, m, { packname: "Created by : Santana" })
      fs.unlinkSync(fp)
      return
    }
  } catch (_) {}
  await sendDiceVisual(alip, m, finalDice, true)
}

// ========== FUNGSI KIRIM BUTTON ==========
async function sendButtonMessage(alip, m, text, buttons, mentions = []) {
  const buttonMessage = {
    text: text,
    footer: "🎮 Ular Tangga Multiplayer",
    buttons: buttons,
    headerType: 1,
    mentions: mentions
  }
  await alip.sendMessage(m.chat, buttonMessage, { quoted: m })
}

async function sendGameBoardWithButtons(alip, m, room, caption, mentions = []) {
  try {
    const img = renderBoardImage(room)
    
    // ========== BUTTON TETAP MUNCUL UNTUK SEMUA ==========
    const buttons = []
    
    if (room.status === "waiting") {
      // Tombol JOIN - selalu ada selama belum penuh
      if (room.players.length < MAX_PLAYER) {
        buttons.push({ buttonId: ".ut join", buttonText: { displayText: "👥 Join Game" }, type: 1 })
      }
      // Tombol START - selalu ada (biar semua tau ada tombol start)
      if (room.players.length >= MIN_PLAYER) {
        buttons.push({ buttonId: ".ut start", buttonText: { displayText: "🚀 Start Game" }, type: 1 })
      }
      // Tombol EXIT
      buttons.push({ buttonId: ".ut exit", buttonText: { displayText: "🚪 Exit" }, type: 1 })
      
    } else if (room.status === "playing") {
      // Tombol ROLL - selalu ada (biar semua tau ada tombol roll)
      buttons.push({ buttonId: ".ut roll", buttonText: { displayText: "🎲 Roll Dadu" }, type: 1 })
      // Tombol EXIT
      buttons.push({ buttonId: ".ut exit", buttonText: { displayText: "🚪 Exit" }, type: 1 })
      
    } else if (room.status === "finished") {
      buttons.push({ buttonId: ".ut create", buttonText: { displayText: "🎮 New Game" }, type: 1 })
    }
    
    // Kirim gambar board
    await alip.sendMessage(m.chat, {
      image: img,
      caption: caption,
      mentions: mentions
    }, { quoted: m })
    
    // Kirim tombol (selalu ada)
    if (buttons.length > 0) {
      await sendButtonMessage(alip, m, "👇 *Klik tombol di bawah:*", buttons, mentions)
    }
    
  } catch (e) {
    console.error("[SEND BOARD ERROR]", e)
    // Fallback text
    await alip.sendMessage(m.chat, {
      text: `${caption}\n\n${buildBoard(room)}`,
      mentions
    }, { quoted: m })
  }
}

async function utHandler(m, { alip, command, text, isCreator, Reply }) {
  if (!global.isRegistered?.(m.sender) && !isCreator) return Reply(global.mess.verifikasi)
  if (!m.isGroup) return Reply("❌ Game ular tangga hanya bisa di grup.")

  const cmd = String(command || "").toLowerCase()
  if (cmd === "roll") return handleRoll(m, { alip, Reply })

  const sub = String(text || "").trim().toLowerCase().split(/\s+/)[0]
  if (sub === "roll") return handleRoll(m, { alip, Reply })
  
  if (!sub || !["create", "join", "start", "exit", "refresh", "reset"].includes(sub)) {
    const buttons = [
      { buttonId: ".ut create", buttonText: { displayText: "🎮 Create Room" }, type: 1 },
      { buttonId: ".ut join", buttonText: { displayText: "👥 Join Room" }, type: 1 }
    ]
    return sendButtonMessage(alip, m,
`🎮 *ULAR TANGGA MULTIPLAYER*

*Cara Main:*
• Buat room baru (Create Room)
• Ajak teman join (max 6 player)
• Host mulai game (Start Game)
• Klik tombol Roll saat giliran

*Player: ${MIN_PLAYER}-${MAX_PLAYER} player*
*Rules:* Langsung jalan, gak perlu nunggu dadu 1!`, buttons)
  }

  const db = loadDB()
  let room = getRoom(db, m.chat)

  if (sub === "create") {
    if (room && room.status !== "finished") {
      await sendGameBoardWithButtons(alip, m, room, "❌ Room sudah ada. Klik Join untuk gabung!", [])
      return
    }
    room = {
      id: `ut-${Date.now()}`,
      owner: normalizeJid(m.sender),
      chat: m.chat,
      status: "waiting",
      players: [{ jid: normalizeJid(m.sender), name: m.pushName || "Player 1", pos: 0, started: true }], // langsung started true
      turnIndex: 0,
      winner: null,
      createdAt: Date.now(),
      startedAt: 0,
      updatedAt: Date.now()
    }
    db.rooms[m.chat] = room
    saveDB(db)
    
    const caption = `${roomHeader(room)}
✅ Room dibuat oleh @${m.sender.split("@")[0]}
Minimal ${MIN_PLAYER} player, maksimal ${MAX_PLAYER}

Klik tombol Join untuk gabung!`
    
    await sendGameBoardWithButtons(alip, m, room, caption, [m.sender])
    return
  }

  if (!room) {
    const buttons = [
      { buttonId: ".ut create", buttonText: { displayText: "🎮 Create Room" }, type: 1 }
    ]
    return sendButtonMessage(alip, m, "❌ Belum ada room. Klik Create Room untuk mulai!", buttons)
  }

  if (sub === "reset") {
    const sender = normalizeJid(m.sender)
    if (sender !== room.owner && !isCreator) {
      await sendGameBoardWithButtons(alip, m, room, "❌ Hanya pembuat room yang bisa reset.", [room.owner])
      return
    }
    delete db.rooms[m.chat]
    saveDB(db)
    const buttons = [
      { buttonId: ".ut create", buttonText: { displayText: "🎮 Create Room" }, type: 1 }
    ]
    return sendButtonMessage(alip, m, "✅ Room berhasil direset. Klik Create Room untuk mulai!", buttons)
  }

  if (sub === "join") {
    if (room.status !== "waiting") {
      await sendGameBoardWithButtons(alip, m, room, "❌ Game sudah berjalan, tidak bisa join.", [])
      return
    }
    const jid = normalizeJid(m.sender)
    if (room.players.some((p) => p.jid === jid)) {
      await sendGameBoardWithButtons(alip, m, room, "⚠️ Kamu sudah di room.", [])
      return
    }
    if (room.players.length >= MAX_PLAYER) {
      await sendGameBoardWithButtons(alip, m, room, `❌ Room penuh (max ${MAX_PLAYER}).`, [])
      return
    }

    room.players.push({ jid, name: m.pushName || `Player ${room.players.length + 1}`, pos: 0, started: true }) // langsung started true
    room.updatedAt = Date.now()
    saveDB(db)
    
    const caption = `${roomHeader(room)}
✅ @${jid.split("@")[0]} join.

Daftar player:
${playerList(room)}
${room.players.length >= MIN_PLAYER ? "\nHost bisa klik Start untuk memulai!" : `\nButuh ${MIN_PLAYER - room.players.length} player lagi`}`
    
    await sendGameBoardWithButtons(alip, m, room, caption, room.players.map(p => p.jid))
    return
  }

  if (sub === "start") {
    if (room.status !== "waiting") {
      await sendGameBoardWithButtons(alip, m, room, "❌ Game sudah dimulai.", [])
      return
    }
    
    if (normalizeJid(m.sender) !== room.owner && !isCreator) {
      const currentHost = room.players.find(p => p.jid === room.owner)
      const hostName = currentHost ? `@${currentHost.jid.split("@")[0]}` : "Host"
      await sendGameBoardWithButtons(alip, m, room, `❌ Hanya *${hostName}* yang bisa start game.\n\nKamu bukan host!`, [room.owner])
      return
    }
    
    if (room.players.length < MIN_PLAYER) {
      await sendGameBoardWithButtons(alip, m, room, `❌ Minimal ${MIN_PLAYER} player untuk start.\nSekarang: ${room.players.length} player`, [])
      return
    }

    room.status = "playing"
    room.turnIndex = 0
    room.startedAt = Date.now()
    room.updatedAt = Date.now()
    room.winner = null
    // semua player udah started true dari awal, gak perlu reset posisi
    saveDB(db)

    const current = room.players[room.turnIndex]
    const caption = `🚀 *GAME DIMULAI!*
Giliran pertama: @${current.jid.split("@")[0]}
Klik tombol Roll untuk main!`
    
    await sendGameBoardWithButtons(alip, m, room, caption, [current.jid])
    return
  }

  if (sub === "exit") {
    if (room.status === "playing") {
      await sendGameBoardWithButtons(alip, m, room, "❌ Game sedang berlangsung, tidak bisa keluar.", [])
      return
    }
    const jid = normalizeJid(m.sender)
    const idx = room.players.findIndex((p) => p.jid === jid)
    if (idx < 0) {
      await sendGameBoardWithButtons(alip, m, room, "❌ Kamu tidak ada di room.", [])
      return
    }

    room.players.splice(idx, 1)
    room.updatedAt = Date.now()

    if (room.players.length === 0 || jid === room.owner) {
      delete db.rooms[m.chat]
      saveDB(db)
      const buttons = [
        { buttonId: ".ut create", buttonText: { displayText: "🎮 Create Room" }, type: 1 }
      ]
      return sendButtonMessage(alip, m, "🗑️ Room dibubarkan. Klik Create Room untuk mulai!", buttons)
    }

    if (room.turnIndex >= room.players.length) room.turnIndex = 0
    saveDB(db)
    
    const caption = `${roomHeader(room)}
✅ @${jid.split("@")[0]} keluar.

Sisa player:
${playerList(room)}`
    
    await sendGameBoardWithButtons(alip, m, room, caption, room.players.map(p => p.jid))
    return
  }

  if (sub === "refresh") {
    if (room.status !== "finished") {
      await sendGameBoardWithButtons(alip, m, room, "❌ Refresh hanya setelah game selesai.", [])
      return
    }
    delete db.rooms[m.chat]
    saveDB(db)
    const buttons = [
      { buttonId: ".ut create", buttonText: { displayText: "🎮 New Game" }, type: 1 }
    ]
    return sendButtonMessage(alip, m, "✅ Room direset. Klik New Game untuk mulai!", buttons)
  }
}

async function handleRoll(m, { alip, Reply }) {
  const db = loadDB()
  const room = getRoom(db, m.chat)
  if (!room) {
    const buttons = [{ buttonId: ".ut create", buttonText: { displayText: "🎮 Create Room" }, type: 1 }]
    return sendButtonMessage(alip, m, "❌ Tidak ada room. Klik Create Room!", buttons)
  }
  if (room.status !== "playing") {
    await sendGameBoardWithButtons(alip, m, room, "❌ Game belum mulai atau sudah selesai.", [])
    return
  }

  const jid = normalizeJid(m.sender)
  const current = room.players[room.turnIndex]
  
  // Cek apakah ini giliran user
  if (!current || current.jid !== jid) {
    const currentPlayer = current ? `@${current.jid.split("@")[0]}` : "Player lain"
    await sendGameBoardWithButtons(alip, m, room, `⏳ *Bukan giliran kamu!*\n\nSekarang giliran: ${currentPlayer}\n\nTunggu sampai giliranmu ya!`, current?.jid ? [current.jid] : [])
    return
  }

  // Roll dadu
  const dice = Math.floor(Math.random() * 6) + 1
  
  // Kirim animasi dadu
  await sendSingleDiceResult(alip, m, dice)

  let note = ""
  const from = current.pos
  let to = from + dice
  
  if (to > 100) {
    to = from
    note = `🎲 Dapat *${dice}* ${DICE_FACE[dice]} tapi melebihi 100, posisi tetap di *${from}*.`
  } else {
    const special = applySnakeLadder(to)
    if (special.type === "ladder") {
      note = `🪜 Naik tangga! *${to}* → *${special.to}*`
      to = special.to
    } else if (special.type === "snake") {
      note = `🐍 Digigit ular! *${to}* → *${special.to}*`
      to = special.to
    } else {
      note = `➡️ Maju *${dice}* langkah dari *${from}* ke *${to}*.`
    }
  }
  
  current.pos = to

  // Cek menang
  if (current.pos === 100) {
    room.status = "finished"
    room.winner = current.jid
    room.updatedAt = Date.now()
    saveDB(db)
    const caption = `🏆 *GAME SELESAI!*\n\n🎲 @${jid.split("@")[0]} dapat *${dice}* ${DICE_FACE[dice]}\n${note}\n\n✨ *PEMENANG:* @${current.jid.split("@")[0]} ✨\n\nKlik New Game untuk main lagi!`
    await sendGameBoardWithButtons(alip, m, room, caption, [current.jid])
    return
  }

  // Ganti giliran
  nextTurn(room)
  room.updatedAt = Date.now()
  saveDB(db)

  const next = room.players[room.turnIndex]
  const caption = `🎲 *@${jid.split("@")[0]}* roll: *${dice}* ${DICE_FACE[dice]}
${note}

📍 *Posisi:*
${playerList(room)}

➡️ *Giliran berikutnya:* @${next.jid.split("@")[0]}
Klik tombol Roll untuk main!`
  
  await sendGameBoardWithButtons(alip, m, room, caption, [jid, next.jid])
}

utHandler.command = ["ulartangga", "ut", "roll"]

module.exports = utHandler