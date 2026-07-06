const fs = require('fs')

const RPG_DB_PATH = './library/database/rpg.json'
const SPACEMAN_DB_PATH = './library/database/spaceman.json'

const HOUSE_EDGE_INSTANT_CRASH = 0.035 // 3.5%
const MIN_BET = 100
const MIN_TARGET = 1.1
const MAX_TARGET = 50
const MAX_CRASH = 100
const HISTORY_LIMIT = 10
const TICK_MS = 900
const MAX_TICKS = 40

function ensureFile(path, fallback) {
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify(fallback, null, 2))
}

function readJSON(path, fallback) {
  try {
    ensureFile(path, fallback)
    return JSON.parse(fs.readFileSync(path))
  } catch {
    return fallback
  }
}

function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

function fmt(n) {
  return Number(n || 0).toLocaleString('id-ID')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeJid(jid = '') {
  return String(jid || '').replace('@lid', '@s.whatsapp.net')
}

function ensurePlayer(rpgDB, jid) {
  if (!rpgDB.players || typeof rpgDB.players !== 'object') rpgDB.players = {}
  if (!rpgDB.players[jid]) return null
  const p = rpgDB.players[jid]
  if (typeof p.gold !== 'number') p.gold = Number(p.gold || 0)
  return p
}

function ensureSpacemanDB(spDB) {
  if (!spDB || typeof spDB !== 'object') spDB = {}
  if (!spDB.global || typeof spDB.global !== 'object') spDB.global = {}
  if (!spDB.global.history || !Array.isArray(spDB.global.history)) spDB.global.history = []
  if (!spDB.chats || typeof spDB.chats !== 'object') spDB.chats = {}
  if (!spDB.users || typeof spDB.users !== 'object') spDB.users = {}
  return spDB
}

function getCrashMultiplier() {
  if (Math.random() < HOUSE_EDGE_INSTANT_CRASH) return 1.0
  const r = Math.random()
  let crash = 0.99 + (1 / (1 - r))
  if (!Number.isFinite(crash)) crash = MAX_CRASH
  crash = Math.min(MAX_CRASH, crash)
  return Math.max(1.01, Number(crash.toFixed(2)))
}

function pushHistory(spDB, chatId, crash) {
  if (!spDB.chats[chatId] || typeof spDB.chats[chatId] !== 'object') {
    spDB.chats[chatId] = { history: [] }
  }
  if (!Array.isArray(spDB.chats[chatId].history)) spDB.chats[chatId].history = []

  spDB.chats[chatId].history.unshift(Number(crash.toFixed(2)))
  spDB.chats[chatId].history = spDB.chats[chatId].history.slice(0, HISTORY_LIMIT)

  spDB.global.history.unshift(Number(crash.toFixed(2)))
  spDB.global.history = spDB.global.history.slice(0, HISTORY_LIMIT)
}

function getChatHistory(spDB, chatId) {
  const hist = spDB?.chats?.[chatId]?.history
  if (Array.isArray(hist) && hist.length) return hist
  return spDB?.global?.history || []
}

function updateUserStats(spDB, jid, payload) {
  const key = normalizeJid(jid)
  if (!spDB.users[key] || typeof spDB.users[key] !== 'object') {
    spDB.users[key] = {
      totalGame: 0,
      totalWin: 0,
      totalLose: 0,
      totalBet: 0,
      totalPayout: 0,
      totalProfit: 0,
      bestWin: 0,
      lastPlayAt: 0
    }
  }

  const s = spDB.users[key]
  s.totalGame += 1
  s.totalBet += Number(payload.bet || 0)
  s.totalPayout += Number(payload.payout || 0)
  s.totalProfit += Number(payload.profit || 0)
  s.lastPlayAt = Date.now()

  if (payload.win) {
    s.totalWin += 1
    if (Number(payload.payout || 0) > Number(s.bestWin || 0)) s.bestWin = Number(payload.payout || 0)
  } else {
    s.totalLose += 1
  }
}

function parseMultiplier(input) {
  const x = Number(String(input || '').replace(',', '.'))
  if (!Number.isFinite(x)) return null
  return Number(x.toFixed(2))
}

function nextMultiplier(current) {
  const base = current < 2 ? 0.10 : current < 5 ? 0.18 : 0.25
  const random = Math.random() * 0.22
  const step = base + random
  return Number((current + step).toFixed(2))
}

function getGameMap() {
  if (!global.__spacemanGames || typeof global.__spacemanGames !== 'object') global.__spacemanGames = {}
  return global.__spacemanGames
}

function getGameKey(chat, sender) {
  return `${normalizeJid(chat)}::${normalizeJid(sender)}`
}

async function safeEditOrSend(alip, chat, key, text, quoted) {
  try {
    if (key && key.id) {
      await alip.sendMessage(chat, { text, edit: key })
      return key
    }
  } catch {}
  const sent = await alip.sendMessage(chat, { text }, { quoted })
  return sent?.key || key
}

async function sendStopButton(alip, chat, quoted) {
  try {
    await alip.sendMessage(chat, {
      text: 'Kontrol Spaceman aktif. Klik tombol di bawah untuk cashout kapan saja.',
      buttons: [
        { buttonId: '.spaceman stop', buttonText: { displayText: '🛑 STOP' }, type: 1 }
      ],
      footer: 'Spaceman Realtime'
    }, { quoted })
  } catch {}
}

module.exports = {
  command: ['spaceman'],
  tags: ['rpg'],
  handler: async (sock, msg, { text, command, prefix }) => {
    const m = msg;
    const alip = sock;
    const isCreator = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
    const Reply = (text) => sock.sendMessage(m.chat, { text }, { quoted: m });

    const cmd = String(command || '').toLowerCase()
  if (cmd !== 'spaceman') return

  const args = String(text || '').trim().split(/\s+/).filter(Boolean)
  const sub = String(args[0] || '').toLowerCase()
  const senderKey = normalizeJid(m.sender)
  const gameMap = getGameMap()
  const gameKey = getGameKey(m.chat, m.sender)

  const rpgDB = readJSON(RPG_DB_PATH, { players: {} })
  let spDB = ensureSpacemanDB(readJSON(SPACEMAN_DB_PATH, { global: { history: [] }, chats: {}, users: {} }))

  if (typeof isRegistered === 'function' && !isRegistered(m.sender) && !isCreator) {
    return Reply(global.mess?.verifikasi || 'Kamu belum terdaftar.')
  }

  if (sub === 'stop') {
    const active = gameMap[gameKey]
    if (!active || active.status !== 'flying') return Reply('❌ Tidak ada penerbangan aktif. Mulai dulu dengan *.spaceman <bet>*')
    active.stopRequested = true
    active.stopBy = senderKey
    return Reply('🛑 Stop diminta... mencoba cashout sekarang!')
  }

  if (sub === 'stats' || sub === 'history' || sub === 'riwayat') {
    const hist = getChatHistory(spDB, m.chat)
    const histText = hist.length
      ? hist.map((v) => `${Number(v).toFixed(2)}x${Number(v) <= 1.01 ? ' (Zonk)' : ''}`).join(' | ')
      : 'Belum ada riwayat.'

    const u = spDB.users[senderKey] || {
      totalGame: 0, totalWin: 0, totalLose: 0, totalBet: 0, totalPayout: 0, totalProfit: 0, bestWin: 0
    }

    return Reply(
`📊 *SPACEMAN STATS*

🎲 Main: *${fmt(u.totalGame)}* ronde
✅ Menang: *${fmt(u.totalWin)}*
❌ Kalah: *${fmt(u.totalLose)}*
💸 Total Bet: *${fmt(u.totalBet)}*
💰 Total Payout: *${fmt(u.totalPayout)}*
📈 Net Profit: *${fmt(u.totalProfit)}*
🏆 Best Win: *${fmt(u.bestWin)}*

🛰️ *Riwayat ${Math.min(HISTORY_LIMIT, hist.length)} ronde terakhir:*
${histText}`
    )
  }

  if (!args.length) {
    return Reply(
`🚀 *SPACEMAN REALTIME*

Main manual (pakai stop):
• .spaceman <bet>
Contoh: .spaceman 5000

Main auto target:
• .spaceman <bet> <target>
Contoh: .spaceman 5000 2.5

Saat game jalan:
• klik tombol 🛑 STOP
• atau ketik .spaceman stop

Stats:
• .spaceman stats`
    )
  }

  if (gameMap[gameKey] && gameMap[gameKey].status === 'flying') {
    return Reply('⏳ Masih ada ronde Spaceman aktif. Stop / tunggu selesai dulu.')
  }

  const bet = parseInt(args[0], 10)
  const target = args[1] ? parseMultiplier(args[1]) : null

  if (!Number.isFinite(bet) || bet < MIN_BET) return Reply(`❌ Minimal taruhan *${fmt(MIN_BET)}* gold.`)
  if (target !== null && (!Number.isFinite(target) || target < MIN_TARGET || target > MAX_TARGET)) {
    return Reply(`❌ Target multiplier harus antara *${MIN_TARGET}x* sampai *${MAX_TARGET}x*.`)
  }

  const player = ensurePlayer(rpgDB, senderKey)
  if (!player) return Reply('❌ Karakter RPG kamu belum ada. Ketik *.rpgstart* dulu.')
  if (Number(player.gold || 0) < bet) return Reply(`❌ Gold tidak cukup. Saldo: *${fmt(player.gold)}*`)

  // Potong saldo di awal
  player.gold -= bet
  writeJSON(RPG_DB_PATH, rpgDB)

  const crash = getCrashMultiplier()
  pushHistory(spDB, m.chat, crash)
  writeJSON(SPACEMAN_DB_PATH, spDB)

  gameMap[gameKey] = {
    status: 'flying',
    sender: senderKey,
    chat: m.chat,
    bet,
    target,
    crash,
    current: 1.0,
    stopRequested: false,
    messageKey: null,
    startedAt: Date.now()
  }

  try {
    const modeText = target ? `🎯 Auto target: *${target.toFixed(2)}x*` : '🎮 Mode: *Manual Stop*'
    const startMsg = await alip.sendMessage(m.chat, {
      text:
`🎯 Taruhan diterima! Spaceman siap meluncur...\n` +
`💸 Bet: *${fmt(bet)}* gold\n${modeText}\n\n` +
`Ketik *.spaceman stop* atau pakai tombol STOP.`
    }, { quoted: m })

    await sendStopButton(alip, m.chat, m)

    let liveKey = startMsg?.key || null
    gameMap[gameKey].messageKey = liveKey

    let crashed = false
    let cashedOut = false
    let cashoutAt = 0

    for (let tick = 0; tick < MAX_TICKS; tick += 1) {
      await sleep(TICK_MS)

      const active = gameMap[gameKey]
      if (!active || active.status !== 'flying') break

      const next = nextMultiplier(active.current)

      // crash terlebih dahulu jika sudah melewati titik crash
      if (next >= active.crash) {
        active.current = active.crash
        crashed = true
        // langsung finalize hasil (tanpa step tambahan) supaya user dapat hasil secepatnya
        break
      }

      active.current = next

      // auto target mode
      if (active.target && active.current >= active.target) {
        cashedOut = true
        cashoutAt = active.target
        break
      }

      // manual stop mode
      if (active.stopRequested) {
        cashedOut = true
        cashoutAt = active.current
        break
      }

      liveKey = await safeEditOrSend(
        alip,
        m.chat,
        liveKey,
        `🚀 Spaceman terbang... *${active.current.toFixed(2)}x*\n` +
        `💸 Bet: *${fmt(active.bet)}* gold\n` +
        `Klik *🛑 STOP* sekarang!`,
        m
      )
    }

    const active = gameMap[gameKey]
    const finalCrash = Number((active?.crash || crash).toFixed(2))

    if (cashedOut && cashoutAt > 1) {
      const payout = Math.floor(bet * cashoutAt)
      const profit = payout - bet

      player.gold += payout
      updateUserStats(spDB, senderKey, { bet, payout, profit, win: true })

      writeJSON(RPG_DB_PATH, rpgDB)
      writeJSON(SPACEMAN_DB_PATH, spDB)

      await safeEditOrSend(
        alip,
        m.chat,
        liveKey,
`✅ *CASHOUT BERHASIL!*\n\n` +
`🛑 Kamu stop di: *${Number(cashoutAt).toFixed(2)}x*\n` +
`💰 Payout: *${fmt(payout)}* gold\n` +
`📈 Net: *+${fmt(profit)}* gold\n` +
`💥 Crash asli ronde ini: *${finalCrash.toFixed(2)}x*\n` +
`🏦 Saldo sekarang: *${fmt(player.gold)}* gold`,
        m
      )
    } else {
      const loss = bet
      updateUserStats(spDB, senderKey, { bet, payout: 0, profit: -loss, win: false })
      writeJSON(SPACEMAN_DB_PATH, spDB)

      const reason = crashed
        ? `Spaceman meledak di *${finalCrash.toFixed(2)}x*.`
        : `Spaceman kabur terlalu jauh dan koneksi putus (simulasi timeout).`

      await safeEditOrSend(
        alip,
        m.chat,
        liveKey,
`💥 *KABOOM!*\n\n${reason}\n` +
`❌ Taruhan hangus: *${fmt(loss)}* gold\n` +
`🏦 Saldo sekarang: *${fmt(player.gold)}* gold`,
        m
      )
    }
  } catch (e) {
    console.error('[SPACEMAN REALTIME ERROR]', e)
    return Reply(`❌ Error Spaceman realtime.\nDetail: ${e?.message || e}`)
  } finally {
    delete gameMap[gameKey]
  }
}

}
