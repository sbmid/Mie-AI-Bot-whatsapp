const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const SPY_LOG_FILE = path.join(process.cwd(), 'spy_log.json');
const MAX_RAM_BUFFER = 2000; // Naikkan dari 1000 jadi 2000 pesan di RAM
const MAX_LOG_ENTRIES = 5000; // Max entri di file log

// ─── HELPER ─────────────────────────────────────────────────────────────
const safeClone = (obj) => {
    const seen = new WeakSet();
    try {
        return JSON.parse(JSON.stringify(obj, (key, val) => {
            if (typeof val === 'bigint') return val.toString();
            if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
                if (Buffer.isBuffer(val) || val instanceof Uint8Array || val?.type === 'Buffer') {
                    return `[Buffer length=${val.data?.length ?? val.length ?? 'unknown'}]`;
                }
            }
            return val;
        }));
    } catch { return { error: 'clone_failed' }; }
};

const readSpyLog = () => {
    if (!fs.existsSync(SPY_LOG_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(SPY_LOG_FILE, 'utf8')); }
    catch { return {}; }
};

const writeSpyLog = (data) => {
    try { fs.writeFileSync(SPY_LOG_FILE, JSON.stringify(data, null, 2)); }
    catch { /* skip disk errors */ }
};

const detectMsgType = (msg) => {
    if (!msg?.message) return 'unknown';
    const types = Object.keys(msg.message);
    return types.find(t => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(t)) || types[0] || 'unknown';
};

const extractPreview = (msg) => {
    const type = detectMsgType(msg);
    const inner = msg?.message?.[type];
    if (type === 'conversation') return msg.message.conversation?.slice(0, 80) || '';
    if (type === 'extendedTextMessage') return inner?.text?.slice(0, 80) || '';
    if (type === 'imageMessage') return inner?.caption?.slice(0, 80) || '[Gambar]';
    if (type === 'videoMessage') return inner?.caption?.slice(0, 80) || '[Video]';
    if (type === 'audioMessage') return inner?.ptt ? '[Voice Note]' : '[Audio]';
    if (type === 'stickerMessage') return '[Stiker]';
    if (type === 'documentMessage') return `[Dokumen: ${inner?.fileName || '?'}]`;
    if (type === 'interactiveMessage') return inner?.body?.text?.slice(0, 80) || '[Interaktif]';
    if (type === 'interactiveResponseMessage') return `[Response: ${inner?.nativeFlowResponseMessage?.paramsJson || '?'}]`.slice(0, 80);
    if (type === 'viewOnceMessage') return '[View Once]';
    if (type === 'pollCreationMessage') return `[Poll: ${inner?.name || '?'}]`;
    if (type === 'reactionMessage') return `[Reaksi: ${inner?.text || '?'}]`;
    if (type === 'contactMessage') return `[Kontak: ${inner?.displayName || '?'}]`;
    if (type === 'locationMessage') return `[Lokasi: ${inner?.degreesLatitude || '?'},${inner?.degreesLongitude || '?'}]`;
    if (type === 'groupInviteMessage') return `[Undangan Grup: ${inner?.groupName || '?'}]`;
    if (type === 'pollUpdateMessage') return '[Update Poll]';
    if (type === 'pinInMessageMessage') return '[Pin Pesan]';
    if (type === 'keepInChatMessage') return '[Keep Chat]';
    if (type === 'messageHistoryBundle') return '[History Bundle]';
    return `[${type}]`;
};

// Deteksi apakah pesan mengandung fitur langka / unreleased
const detectRareFeatures = (msg) => {
    const features = [];
    const type = detectMsgType(msg);
    if (type === 'interactiveMessage') features.push('INTERACTIVE');
    if (type === 'lottieStickerMessage' || msg.message?.stickerMessage?.isLottie) features.push('LOTTIE_STICKER');
    if (type === 'viewOnceMessage') features.push('VIEW_ONCE');
    if (type === 'requestPaymentMessage') features.push('PAYMENT');
    if (type === 'sendPaymentMessage') features.push('PAYMENT_SEND');
    if (type === 'pollCreationMessage') features.push('POLL');
    if (type === 'pinInMessageMessage') features.push('PIN_MSG');
    if (type === 'newsletterAdminInviteMessage') features.push('NEWSLETTER_INVITE');
    if (type === 'groupMentionedMessage') features.push('GROUP_MENTION');
    if (type === 'messageHistoryBundle') features.push('HISTORY_BUNDLE');
    if (type === 'callLogMessage') features.push('CALL_LOG');
    if (type === 'highlyStructuredMessage') features.push('HIGHLY_STRUCTURED');
    if (type === 'botInvokeMessage') features.push('BOT_INVOKE');
    if (type === 'encCommentMessage') features.push('COMMENT');
    if (type === 'scheduledCallCreationMessage') features.push('SCHEDULED_CALL');
    if (type === 'businessCardMessage') features.push('BUSINESS_CARD');
    if (type === 'productMessage') features.push('PRODUCT');
    if (msg.message?.[type]?.contextInfo?.forwardedNewsletterMessageInfo) features.push('NEWSLETTER_FORWARD');
    if (msg.message?.[type]?.contextInfo?.isForwarded) features.push('FORWARDED');
    if (msg.message?.[type]?.contextInfo?.quotedMessage) features.push('HAS_REPLY');
    return features;
};

const moment = (() => { try { return require('moment-timezone'); } catch { return null; } })();
const formatTime = (ts) => {
    const d = ts ? new Date(Number(ts) * 1000) : new Date();
    if (moment) return moment(d).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

// ─── PARSER ANALISIS FITUR MENDALAM ─────────────────────────────────────────
const analyzeAllFeatures = (entry) => {
    const raw = entry?.raw || entry;
    const type = detectMsgType(raw);
    const inner = raw?.message?.[type];
    const breakdown = [];

    breakdown.push(`[!] *ANALISIS STRUKTUR*`);
    breakdown.push(`• Tipe Utama : ${type}`);
    
    // 1. Tombol / Elemen Interaktif
    const buttons = [];
    if (type === 'buttonsMessage' && inner?.buttons) {
        inner.buttons.forEach((b, i) => {
            buttons.push(`  [${i+1}] Button (ID: ${b.buttonId}) -> Label: "${b.buttonText?.displayText || ''}"`);
        });
    } else if (type === 'templateMessage' && inner?.hydratedTemplate?.hydratedButtons) {
        inner.hydratedTemplate.hydratedButtons.forEach((b, i) => {
            const index = b.index;
            const bType = Object.keys(b).find(k => k !== 'index');
            const detail = b[bType];
            buttons.push(`  [${index}] Template Button (${bType}) -> "${detail?.displayText || ''}" (Content: ${detail?.url || detail?.phoneNumber || detail?.id || ''})`);
        });
    } else if (type === 'listMessage' && inner) {
        breakdown.push(`• List Title : "${inner.title || ''}"`);
        breakdown.push(`• List Desc  : "${inner.description || ''}"`);
        if (inner.sections) {
            inner.sections.forEach((sec, secIdx) => {
                buttons.push(`  Section ${secIdx+1}: "${sec.title || 'Tanpa Judul'}"`);
                if (sec.rows) {
                    sec.rows.forEach((row, rowIdx) => {
                        buttons.push(`    - Row ${rowIdx+1}: "${row.title || ''}" | Desc: "${row.description || ''}" (ID: ${row.rowId || ''})`);
                    });
                }
            });
        }
    } else if (type === 'interactiveMessage' && inner) {
        const flow = inner.nativeFlowMessage;
        const list = inner.listMessage;
        const shop = inner.shopMessage;
        const collection = inner.collectionMessage;

        if (flow?.buttons) {
            breakdown.push(`• Interactive Type: Native Flow`);
            flow.buttons.forEach((b, i) => {
                buttons.push(`  [${i+1}] Flow Button -> Name: "${b.name || ''}"`);
                if (b.buttonParamsJson) {
                    try {
                        const parsed = JSON.parse(b.buttonParamsJson);
                        buttons.push(`      Params: ${JSON.stringify(parsed)}`);
                    } catch {
                        buttons.push(`      Params (Raw): ${b.buttonParamsJson}`);
                    }
                }
            });
        }
        if (list) {
            breakdown.push(`• Interactive Type: List`);
            if (list.sections) {
                list.sections.forEach((sec, sIdx) => {
                    buttons.push(`  Sec ${sec.title || sIdx+1}:`);
                    sec.rows?.forEach(r => {
                        buttons.push(`    - "${r.title || ''}" (ID: ${r.id || ''})`);
                    });
                });
            }
        }
        if (shop) breakdown.push(`• Interactive Type: Shop (ID: ${shop.shopId || ''})`);
        if (collection) breakdown.push(`• Interactive Type: Collection (Parent JID: ${collection.parentAssociatedUserJid || ''})`);
    } else if (type === 'interactiveResponseMessage' && inner) {
        breakdown.push(`• Interactive Response: ${inner.nativeFlowResponseMessage?.name || ''}`);
        if (inner.nativeFlowResponseMessage?.paramsJson) {
            try {
                const parsed = JSON.parse(inner.nativeFlowResponseMessage.paramsJson);
                breakdown.push(`  Params: ${JSON.stringify(parsed, null, 2)}`);
            } catch {
                breakdown.push(`  Params (Raw): ${inner.nativeFlowResponseMessage.paramsJson}`);
            }
        }
    }

    if (buttons.length > 0) {
        breakdown.push(`[!] *TOMBOL & OPSI (${buttons.length})*`);
        breakdown.push(buttons.join('\n'));
    }

    // 2. Detail Media
    if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(type) && inner) {
        breakdown.push(`[!] *DETAIL MEDIA*`);
        breakdown.push(`• Mimetype: ${inner.mimetype || ''}`);
        breakdown.push(`• Size    : ${inner.fileLength || ''} bytes`);
        if (inner.fileName) breakdown.push(`• Filename: ${inner.fileName}`);
        if (inner.seconds) breakdown.push(`• Duration: ${inner.seconds}s`);
        if (inner.height) breakdown.push(`• Resolusi: ${inner.width}x${inner.height}`);
        if (inner.url) breakdown.push(`• URL     : ${inner.url}`);
        if (inner.directPath) breakdown.push(`• Path    : ${inner.directPath}`);
        if (inner.mediaKey) breakdown.push(`• Key     : ${inner.mediaKey}`);
    }

    // 3. Metadata Context
    const ctx = inner?.contextInfo || raw.message?.extendedTextMessage?.contextInfo || null;
    if (ctx) {
        const metadata = [];
        if (ctx.stanzaId) metadata.push(`• Stanza ID : ${ctx.stanzaId}`);
        if (ctx.participant) metadata.push(`• Participant: ${ctx.participant}`);
        if (ctx.expiration) metadata.push(`• Expirasi   : ${ctx.expiration}s`);
        if (ctx.isForwarded) metadata.push(`• Forwarded  : Score ${ctx.forwardingScore || 0} (Origin: ${ctx.forwardOrigin || ''})`);
        if (ctx.mentionedJid && ctx.mentionedJid.length > 0) metadata.push(`• Mentions   : ${ctx.mentionedJid.join(', ')}`);
        
        if (metadata.length > 0) {
            breakdown.push(`[i] *METADATA CONTEXT*`);
            breakdown.push(metadata.join('\n'));
        }
    }

    return breakdown.join('\n\n');
};

// ─── RICH RESPONSE SENDER ───────────────────────────────────────────────────
const sendRich = async (sock, chat, { title, lines = [], pills = [], textFallback = '' }) => {
    const formattedSubmessages = [
        { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: `# ${title}` }
    ];

    const sections = [
        // Header
        {
            view_model: {
                primitive: { text: title, __typename: 'GenAIMetadataTextPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        }
    ];

    for (const line of lines) {
        const trimmed = typeof line === 'string' ? line.trim() : '';
        if (trimmed.startsWith('```json') && trimmed.endsWith('```')) {
            let codeContent = trimmed.slice(7, -3);
            if (codeContent.startsWith('\n')) codeContent = codeContent.slice(1);
            if (codeContent.endsWith('\n')) codeContent = codeContent.slice(0, -1);

            formattedSubmessages.push({
                messageType: 'AI_RICH_RESPONSE_CODE',
                codeMetadata: {
                    codeLanguage: 'json',
                    codeBlocks: [
                        {
                            highlightType: 'AI_RICH_RESPONSE_CODE_HIGHLIGHT_DEFAULT',
                            codeContent: codeContent
                        }
                    ]
                }
            });

            sections.push({
                view_model: {
                    primitive: {
                        language: 'json',
                        code_blocks: [
                            {
                                content: codeContent,
                                type: 'DEFAULT'
                            }
                        ],
                        __typename: 'GenAICodeUXPrimitive'
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            });
        } else {
            formattedSubmessages.push({
                messageType: 'AI_RICH_RESPONSE_TEXT',
                messageText: line
            });

            sections.push({
                view_model: {
                    primitive: {
                        text: line,
                        __typename: 'GenAIMarkdownTextUXPrimitive'
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            });
        }
    }

    if (pills.length > 0) {
        sections.push({
            __typename: 'GenAIUnifiedResponseSection',
            view_model: {
                primitives: pills.map(p => ({
                    prompt_text: p,
                    prompt_type: 'SUGGESTED_PROMPT',
                    __typename: 'GenAIFollowUpSuggestionPillPrimitive'
                })),
                __typename: 'GenAIHScrollLayoutViewModel'
            }
        });
    }

    const unifiedData = {
        response_id: `spy_${Date.now()}`,
        sections: sections
    };

    const richPayload = {
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 'AI_RICH_RESPONSE_TYPE_STANDARD',
                    submessages: formattedSubmessages,
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify(unifiedData)).toString('base64')
                    },
                    contextInfo: { forwardingScore: 2, isForwarded: true, forwardOrigin: 'META_AI' }
                }
            }
        }
    };

    try {
        const waMsg = generateWAMessageFromContent(chat, richPayload, { userJid: sock.user.id });
        await sock.relayMessage(chat, waMsg.message, { messageId: waMsg.key.id });
    } catch {
        await sock.sendMessage(chat, { text: textFallback || lines.join('\n') });
    }
};

// ─── MODULE ─────────────────────────────────────────────────────────────
module.exports = {
    command: ['spy', 'spylist', 'spyget', 'spylog', 'spynumber', 'spytype', 'spyrare', 'spyclear', 'spyexport', 'spysearch'],
    category: ['owner'],
    description: 'Sistem Penyadapan Pesan Ultra - Intersep, filter, analisa, dan export semua jenis pesan WhatsApp',

    // ── PASIF: Sadap semua pesan yang masuk ────────────────────────────────
    before: async (sock, m) => {
        if (!global.messageSpyDB) global.messageSpyDB = {};

        // Bersihkan RAM jika sudah penuh
        const ramKeys = Object.keys(global.messageSpyDB);
        if (ramKeys.length >= MAX_RAM_BUFFER) {
            // Hapus 10% yang paling lama
            const toDelete = ramKeys.slice(0, Math.floor(MAX_RAM_BUFFER * 0.1));
            toDelete.forEach(k => delete global.messageSpyDB[k]);
        }

        const cloned = safeClone(m);
        const type = detectMsgType(m);
        const rareFeatures = detectRareFeatures(m);
        const senderNum = (m.sender || m.key?.remoteJid || '?').split('@')[0];
        const chatId = m.key?.remoteJid || '?';
        const timestamp = m.messageTimestamp || Math.floor(Date.now() / 1000);

        const entry = {
            id: m.key.id,
            savedAt: new Date().toISOString(),
            waktu: formatTime(timestamp),
            sender: senderNum,
            pushName: m.pushName || '-',
            chatId,
            isGroup: chatId.endsWith('@g.us'),
            messageType: type,
            preview: extractPreview(m),
            rareFeatures,
            hasRareFeature: rareFeatures.length > 0,
            raw: cloned
        };

        // Simpan ke RAM
        global.messageSpyDB[m.key.id] = entry;

        // Simpan ke file log jika ada fitur langka atau pesan interaktif
        // (agar tidak nge-spam file disk dengan pesan biasa)
        if (rareFeatures.length > 0) {
            const logData = readSpyLog();
            const logKeys = Object.keys(logData);

            // Batasi ukuran file log
            if (logKeys.length >= MAX_LOG_ENTRIES) {
                const oldest = logKeys.slice(0, Math.floor(MAX_LOG_ENTRIES * 0.1));
                oldest.forEach(k => delete logData[k]);
            }

            logData[m.key.id] = entry;
            writeSpyLog(logData);
        }

        return false;
    },

    // ── AKTIF: Command-based handler ──────────────────────────────────────
    handler: async (sock, m, { command, text, prefix }) => {
        const sender = m.sender || m.key.remoteJid;
        const from = m.chat;
        const isOwner = global.ownerNumber?.some(o => sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(from, { text: 'Akses Ditolak. Khusus Owner.' }, { quoted: m });

        // ── .spy → Spy pesan yang di-reply ────────────────────────────────
        if (command === 'spy') {
            const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
            if (!quotedId) return sock.sendMessage(from, { text: `Cara pakai: Reply pesan apapun dengan ${prefix}spy` }, { quoted: m });

            // Cari di RAM dulu, lalu cek file log
            let entry = global.messageSpyDB?.[quotedId];
            if (!entry) {
                const logData = readSpyLog();
                entry = logData[quotedId];
            }
            if (!entry) return sock.sendMessage(from, { text: `Pesan tidak ditemukan di memory spy.\n\nBot harus menyala saat pesan itu dikirim. Coba pancing pesan baru dari target.` }, { quoted: m });

            const jsonStr = JSON.stringify(entry.raw, null, 2);
            return sendRich(sock, from, {
                title: 'SPY RESULT',
                lines: [
                    `ID      : ${entry.id}\nWaktu   : ${entry.waktu}\nDari    : ${entry.pushName} (+${entry.sender})\nChat    : ${entry.chatId} (${entry.isGroup ? 'Grup' : 'Pribadi'})\nTipe    : ${entry.messageType}\nPreview : ${entry.preview}\nFitur   : ${entry.rareFeatures?.join(', ') || '-'}`,
                    `\`\`\`json\n${jsonStr}\n\`\`\``
                ],
                pills: [`${prefix}spylist`, `${prefix}spylog`, `${prefix}spyexport`],
                textFallback: `SPY RESULT #${entry.id}\n${entry.messageType}\n\n${jsonStr}`
            });
        }


        // ── .spylist [halaman] → Daftar semua pesan yang ter-sadap di RAM ─
        if (command === 'spylist') {
            const db = global.messageSpyDB || {};
            const entries = Object.values(db).reverse(); // Terbaru duluan
            if (entries.length === 0) return sock.sendMessage(from, { text: 'Belum ada pesan yang tersadap di memory.' }, { quoted: m });

            const perPage = 20;
            const page = parseInt(text) || 1;
            const slice = entries.slice((page - 1) * perPage, page * perPage);
            const totalPages = Math.ceil(entries.length / perPage);

            const rows = slice.map(e => `[${e.waktu}] ${e.pushName || e.sender} | ${e.messageType} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `SPY LOG RAM (Hal ${page}/${totalPages}) - ${entries.length} pesan\n\n${rows}\n\nGunakan ${prefix}spyrare untuk lihat fitur langka saja`
            }, { quoted: m });
        }

        // ── .spylog [halaman] → Log dari FILE (fitur langka saja) ──────────
        if (command === 'spylog') {
            const logData = readSpyLog();
            const entries = Object.values(logData).reverse();
            if (entries.length === 0) return sock.sendMessage(from, { text: 'Belum ada pesan langka yang tersimpan ke file.' }, { quoted: m });

            const perPage = 20;
            const page = parseInt(text) || 1;
            const slice = entries.slice((page - 1) * perPage, page * perPage);
            const totalPages = Math.ceil(entries.length / perPage);

            const rows = slice.map(e => `[${e.waktu}] ${e.pushName||e.sender} | ${e.messageType} | ${e.rareFeatures?.join('+')} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `SPY FILE LOG (Hal ${page}/${totalPages}) - ${entries.length} fitur langka\n\n${rows}`
            }, { quoted: m });
        }

        // ── .spyrare → Filter hanya pesan dengan fitur langka dari RAM ────
        if (command === 'spyrare') {
            const db = global.messageSpyDB || {};
            const rare = Object.values(db).filter(e => e.hasRareFeature).reverse();
            if (rare.length === 0) return sock.sendMessage(from, { text: 'Belum ada pesan dengan fitur langka di memory.' }, { quoted: m });

            const page = parseInt(text) || 1;
            const perPage = 20;
            const slice = rare.slice((page-1)*perPage, page*perPage);
            const rows = slice.map(e => `[${e.waktu}] ${e.pushName||e.sender} | ${e.rareFeatures?.join('+')} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `FITUR LANGKA (${rare.length} pesan)\n\n${rows}\n\nGunakan ${prefix}spytype <tipe> atau ${prefix}spy (reply pesan) untuk export JSON`
            }, { quoted: m });
        }

        // ── .spynumber <nomor> → Sadap semua pesan dari nomor tertentu ────
        if (command === 'spynumber') {
            const targetNum = text?.replace(/[^0-9]/g, '').trim();
            if (!targetNum) return sock.sendMessage(from, { text: `Gunakan: ${prefix}spynumber <nomor tanpa +>\nContoh: ${prefix}spynumber 628xxxxxxxxxx` }, { quoted: m });

            const db = global.messageSpyDB || {};
            const results = Object.values(db).filter(e => e.sender === targetNum).reverse();
            if (results.length === 0) return sock.sendMessage(from, { text: `Tidak ada pesan dari nomor +${targetNum} di memory.` }, { quoted: m });

            const rows = results.slice(0, 30).map(e => `[${e.waktu}] ${e.messageType} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `PESAN DARI +${targetNum} (${results.length} ditemukan)\n\n${rows}`
            }, { quoted: m });
        }

        // ── .spytype <tipe> → Filter berdasarkan tipe pesan ───────────────
        if (command === 'spytype') {
            const filterType = text?.trim().toLowerCase();
            if (!filterType) return sock.sendMessage(from, { text: `Gunakan: ${prefix}spytype <tipe>\nContoh: ${prefix}spytype interactiveMessage\nLihat: conversation, imageMessage, videoMessage, stickerMessage, audioMessage, interactiveMessage, viewOnceMessage, pollCreationMessage, dll` }, { quoted: m });

            const db = global.messageSpyDB || {};
            const results = Object.values(db).filter(e => e.messageType?.toLowerCase().includes(filterType)).reverse();
            if (results.length === 0) return sock.sendMessage(from, { text: `Tidak ada pesan bertipe "${filterType}" di memory.` }, { quoted: m });

            const rows = results.slice(0, 30).map(e => `[${e.waktu}] ${e.pushName||e.sender} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `HASIL FILTER "${filterType}" (${results.length} pesan)\n\n${rows}`
            }, { quoted: m });
        }

        // ── .spysearch <kata> → Cari di preview dan sender ────────────────
        if (command === 'spysearch') {
            const keyword = text?.trim().toLowerCase();
            if (!keyword) return sock.sendMessage(from, { text: `Gunakan: ${prefix}spysearch <kata kunci>` }, { quoted: m });

            const db = global.messageSpyDB || {};
            const results = Object.values(db).filter(e =>
                e.preview?.toLowerCase().includes(keyword) ||
                e.sender?.includes(keyword) ||
                e.pushName?.toLowerCase().includes(keyword) ||
                e.chatId?.includes(keyword)
            ).reverse();
            if (results.length === 0) return sock.sendMessage(from, { text: `Tidak ada hasil untuk "${keyword}".` }, { quoted: m });

            const rows = results.slice(0, 30).map(e => `[${e.waktu}] ${e.pushName||e.sender} | ${e.messageType} | ${e.preview}`).join('\n');
            return sock.sendMessage(from, {
                text: `HASIL CARI "${keyword}" (${results.length} ditemukan)\n\n${rows}`
            }, { quoted: m });
        }

        // ── .spyexport → Export seluruh log file sebagai JSON ─────────────
        if (command === 'spyexport') {
            const logData = readSpyLog();
            const total = Object.keys(logData).length;
            if (total === 0) return sock.sendMessage(from, { text: 'Tidak ada data di file spy log.' }, { quoted: m });
            return sock.sendMessage(from, {
                document: Buffer.from(JSON.stringify(logData, null, 2), 'utf-8'),
                mimetype: 'application/json',
                fileName: `SPY_LOG_EXPORT_${Date.now()}.json`,
                caption: `Spy log export - ${total} fitur langka tersimpan`
            }, { quoted: m });
        }

        // ── .spyclear → Hapus RAM buffer spy ──────────────────────────────
        if (command === 'spyclear') {
            if (text !== 'CONFIRM') return sock.sendMessage(from, { text: `Ini akan menghapus semua data spy dari RAM.\nKetik: ${prefix}spyclear CONFIRM\n(File spy_log.json tidak ikut terhapus)` }, { quoted: m });
            global.messageSpyDB = {};
            return sock.sendMessage(from, { text: 'Memory spy telah dibersihkan.' }, { quoted: m });
        }
    }
};
