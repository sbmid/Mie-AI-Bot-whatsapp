/**
 * richtest.js — Test semua tipe Rich Message API
 * Command : .richtest [mode]
 * Only    : Owner
 *
 * Mode:
 *   (kosong)  → Menu
 *   text      → Teks & Markdown (Type 2)
 *   table     → Tabel (Type 4)
 *   code      → Code Block (Type 5)
 *   image     → Inline Image (Type 3) — alignment 0=kiri 1=kanan 2=tengah
 *   dynamic   → Dynamic Image (Type 6) — cara alternatif tampil gambar
 *   mixed     → Semua dalam 1 pesan
 */

const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');

async function uploadImage(sock, url) {
    const uploaded = await prepareWAMessageMedia(
        { image: { url } },
        { upload: sock.waUploadToServer }
    );
    return uploaded.imageMessage.directPath;
}

// ── Gambar milik user ──────────────────────────────────────────
const IMG = {
    landscape: 'https://files.catbox.moe/ea93uf.png',  // 800x400
    square:    'https://files.catbox.moe/0jxxwb.png',  // 512x512
    portrait:  'https://files.catbox.moe/8nmzhb.png'   // 400x600
};

// ── Alignment enum dari proto AICommonDeprecated ───────────────
// AI_RICH_RESPONSE_IMAGE_LAYOUT_LEADING_ALIGNED  = 0  → KIRI
// AI_RICH_RESPONSE_IMAGE_LAYOUT_TRAILING_ALIGNED = 1  → KANAN
// AI_RICH_RESPONSE_IMAGE_LAYOUT_CENTER_ALIGNED   = 2  → TENGAH
const ALIGN = { LEFT: 0, RIGHT: 1, CENTER: 2 };

// ── Sample code ────────────────────────────────────────────────
const JS_CODE = `async function getProfile(userId) {
  const user = await db.findById(userId)
  if (!user) throw new Error('Not found')

  const score = user.xp * 1.5 + 100
  return { name: user.name, score }
}`;

const PY_CODE = `def fibonacci(n):
    # Base case
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))`;

// ══════════════════════════════════════════════════════════════
module.exports = {
    command: ['richtest', 'rt'],
    category: ['owner'],
    description: 'Test semua tipe Rich Message API',

    handler: async (sock, m, { args, prefix }) => {
        const isOwner = global.ownerNumber &&
            global.ownerNumber.some(o =>
                m.sender === o || m.sender.startsWith(o.split('@')[0])
            );
        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: 'Perintah ini khusus Owner.' }, { quoted: m });
        }

        const mode = args[0]?.toLowerCase() || 'menu';

        // ════════════════════════════════════════════
        // MENU
        // ════════════════════════════════════════════
        if (mode === 'menu') {
            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Rich Message API' },
                { messageType: 2, messageText: 'Test semua tipe konten yang tersedia:' },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Daftar Command',
                        rows: [
                            { items: ['Command', 'Yang Ditest'], isHeading: true },
                            { items: [`${prefix}richtest text`,    'Teks & Markdown (Type 2)'] },
                            { items: [`${prefix}richtest table`,   'Tabel (Type 4)'] },
                            { items: [`${prefix}richtest code`,    'Code Block (Type 5)'] },
                            { items: [`${prefix}richtest image`,   'Inline Image (Type 3)'] },
                            { items: [`${prefix}richtest dynamic`, 'Dynamic Image (Type 6)'] },
                            { items: [`${prefix}richtest mixed`,   'Semua digabung'] }
                        ]
                    }
                },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Alignment Values (Type 3)',
                        rows: [
                            { items: ['Nilai', 'Posisi'], isHeading: true },
                            { items: ['0', 'Kiri (LEADING)'] },
                            { items: ['1', 'Kanan (TRAILING)'] },
                            { items: ['2', 'Tengah (CENTER)'] }
                        ]
                    }
                }
            ], m);
        }

        // ════════════════════════════════════════════
        // TEXT — Type 2
        // ════════════════════════════════════════════
        if (mode === 'text') {
            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Heading 1' },
                { messageType: 2, messageText: '## Heading 2' },
                { messageType: 2, messageText: '### Heading 3' },
                { messageType: 2, messageText: 'Teks *bold*, _italic_, ~coret~, dan `monospace`.' },
                { messageType: 2, messageText: '> Blockquote\n> bisa multi baris' },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Format Markdown',
                        rows: [
                            { items: ['Format', 'Simbol'], isHeading: true },
                            { items: ['Bold',     '*teks*'] },
                            { items: ['Italic',   '_teks_'] },
                            { items: ['Coret',    '~teks~'] },
                            { items: ['Code',     '`teks`'] },
                            { items: ['Heading',  '# teks'] }
                        ]
                    }
                },
                { messageType: 2, messageText: 'Type 2 tampak seperti pesan biasa, tapi berguna sebagai header antar-blok.' }
            ], m);
        }

        // ════════════════════════════════════════════
        // TABLE — Type 4
        // ════════════════════════════════════════════
        if (mode === 'table') {
            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Tabel' },
                { messageType: 2, messageText: 'Leaderboard:' },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Top 5 Player',
                        rows: [
                            { items: ['Rank', 'Nama', 'Score', 'Level'], isHeading: true },
                            { items: ['1', 'Alice',   '9.800', 'Lv 50'] },
                            { items: ['2', 'Bob',     '7.500', 'Lv 42'] },
                            { items: ['3', 'Charlie', '6.200', 'Lv 38'] },
                            { items: ['4', 'Diana',   '5.100', 'Lv 31'] },
                            { items: ['5', 'Eve',     '4.800', 'Lv 28'] }
                        ]
                    }
                },
                { messageType: 2, messageText: 'Harga Layanan:' },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Daftar Harga',
                        rows: [
                            { items: ['Layanan', 'Stok', 'Harga'], isHeading: true },
                            { items: ['Netflix 1P2U', '5',  'Rp 25.000'] },
                            { items: ['Spotify',      '10', 'Rp 25.000'] },
                            { items: ['Canva Pro',    '99', 'Rp 5.000']  },
                            { items: ['CapCut',       '8',  'Rp 15.000'] }
                        ]
                    }
                }
            ], m);
        }

        // ════════════════════════════════════════════
        // CODE — Type 5
        // ════════════════════════════════════════════
        if (mode === 'code') {
            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Code Block' },
                { messageType: 2, messageText: 'JavaScript:' },
                {
                    messageType: 5,
                    codeMetadata: {
                        codeLanguage: 'javascript',
                        codeBlocks: tokenizeCode(JS_CODE, 'javascript')
                    }
                },
                { messageType: 2, messageText: 'Python:' },
                {
                    messageType: 5,
                    codeMetadata: {
                        codeLanguage: 'python',
                        codeBlocks: tokenizeCode(PY_CODE, 'python')
                    }
                },
                { messageType: 2, messageText: 'Bahasa didukung: `javascript`, `typescript`, `python`' }
            ], m);
        }

        // ════════════════════════════════════════════
        // IMAGE — Type 3 (INLINE_IMAGE)
        // Fix: alignment 0=kiri, 1=kanan, 2=tengah
        // Fix: tambah sourceUrl
        // ════════════════════════════════════════════
        if (mode === 'image') {
            const landscapePath = await uploadImage(sock, IMG.landscape);
            const squarePath = await uploadImage(sock, IMG.square);
            const portraitPath = await uploadImage(sock, IMG.portrait);

            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Inline Image (Type 3)' },
                { messageType: 2, messageText: 'Landscape 800x400 — CENTER (alignment: 2):' },
                {
                    messageType: 3,
                    imageMetadata: {
                        imageUrl: {
                            imagePreviewUrl: landscapePath,
                            imageHighResUrl: landscapePath,
                            sourceUrl:       IMG.landscape   // field baru dari proto!
                        },
                        imageText: 'Landscape 800x400',
                        alignment: ALIGN.CENTER  // 2
                    }
                },
                { messageType: 2, messageText: 'Square 512x512 — LEADING/Kiri (alignment: 0):' },
                {
                    messageType: 3,
                    imageMetadata: {
                        imageUrl: {
                            imagePreviewUrl: squarePath,
                            imageHighResUrl: squarePath,
                            sourceUrl:       IMG.square
                        },
                        imageText: 'Square 512x512',
                        alignment: ALIGN.LEFT   // 0 (sebelumnya kita pakai 1 — SALAH!)
                    }
                },
                { messageType: 2, messageText: 'Portrait 400x600 — TRAILING/Kanan (alignment: 1):' },
                {
                    messageType: 3,
                    imageMetadata: {
                        imageUrl: {
                            imagePreviewUrl: portraitPath,
                            imageHighResUrl: portraitPath,
                            sourceUrl:       IMG.portrait
                        },
                        imageText: 'Portrait 400x600',
                        alignment: ALIGN.RIGHT  // 1 (sebelumnya kita pakai 3 — SALAH!)
                    }
                },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Info Alignment (sudah fix)',
                        rows: [
                            { items: ['Value', 'Proto Enum', 'Posisi'], isHeading: true },
                            { items: ['0', 'LEADING',  'Kiri'] },
                            { items: ['1', 'TRAILING', 'Kanan'] },
                            { items: ['2', 'CENTER',   'Tengah'] }
                        ]
                    }
                }
            ], m);
        }

        // ════════════════════════════════════════════
        // DYNAMIC — Type 6
        // Alternatif gambar: punya field 'url' langsung
        // type: 1=IMAGE, 2=GIF
        // ════════════════════════════════════════════
        if (mode === 'dynamic') {
            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Dynamic Image (Type 6)' },
                { messageType: 2, messageText: 'Ini cara alternatif tampil gambar via `dynamicMetadata.url` langsung.' },
                { messageType: 2, messageText: 'Type 6, subtype IMAGE (type: 1):' },
                {
                    messageType: 6,
                    dynamicMetadata: {
                        type:    1,             // 1=IMAGE, 2=GIF
                        url:     IMG.landscape,
                        version: 1
                    }
                },
                { messageType: 2, messageText: 'Type 6, subtype GIF (type: 2) — pakai gambar landscape:' },
                {
                    messageType: 6,
                    dynamicMetadata: {
                        type:      2,           // GIF
                        url:       IMG.landscape,
                        version:   1,
                        loopCount: 0            // 0 = loop selamanya
                    }
                },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Dynamic Type Enum',
                        rows: [
                            { items: ['type', 'Nama'], isHeading: true },
                            { items: ['0', 'UNKNOWN'] },
                            { items: ['1', 'IMAGE'] },
                            { items: ['2', 'GIF (loopable)'] }
                        ]
                    }
                },
                { messageType: 2, messageText: 'Bandingkan hasilnya dengan `.richtest image` ya!' }
            ], m);
        }

        // ════════════════════════════════════════════
        // MIXED — Semua type dalam 1 pesan
        // ════════════════════════════════════════════
        if (mode === 'mixed') {
            const landscapePath = await uploadImage(sock, IMG.landscape);

            return sock.sendRichMessage(m.chat, [
                { messageType: 2, messageText: '# Bot Mie AI' },
                { messageType: 2, messageText: 'Semua tipe konten dalam satu pesan.' },

                { messageType: 2, messageText: '## Statistik' },
                {
                    messageType: 4,
                    tableMetadata: {
                        title: 'Data Live',
                        rows: [
                            { items: ['Metric', 'Value'], isHeading: true },
                            { items: ['Total User',    '1.247'] },
                            { items: ['Pesan Masuk',   '8.934'] },
                            { items: ['Command Jalan', '3.561'] }
                        ]
                    }
                },

                { messageType: 2, messageText: '## Plugin Code' },
                {
                    messageType: 5,
                    codeMetadata: {
                        codeLanguage: 'javascript',
                        codeBlocks: tokenizeCode(
                            `module.exports = {\n  command: ['hello'],\n  handler: async (sock, m) => {\n    await sock.sendRichMessage(m.chat, [\n      { messageType: 2, messageText: 'Hello!' }\n    ])\n  }\n}`,
                            'javascript'
                        )
                    }
                },

                { messageType: 2, messageText: '## Banner (Type 3 fix alignment)' },
                {
                    messageType: 3,
                    imageMetadata: {
                        imageUrl: {
                            imagePreviewUrl: landscapePath,
                            imageHighResUrl: landscapePath,
                            sourceUrl:       IMG.landscape
                        },
                        imageText: 'Bot Mie AI',
                        alignment: ALIGN.CENTER  // 2
                    }
                },

                { messageType: 2, messageText: '_Type 2 + Type 4 + Type 5 + Type 3 berhasil digabung._' }
            ], m);
        }
    }
};
