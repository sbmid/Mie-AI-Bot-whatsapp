const fs = require('fs');
const path = require('path');
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const CRM_FILE = path.join(process.cwd(), 'crm.json');

// ─── HELPERS ────────────────────────────────────────────────────────────────
const readCRM = () => {
    if (!fs.existsSync(CRM_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(CRM_FILE, 'utf8')); }
    catch { return {}; }
};
const writeCRM = (data) => fs.writeFileSync(CRM_FILE, JSON.stringify(data, null, 2));

const safeClone = (obj) => {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, val) => {
        if (typeof val === 'bigint') return val.toString();
        if (typeof val === 'object' && val !== null) {
            if (seen.has(val)) return '[Circular]';
            seen.add(val);
            if (Buffer.isBuffer(val) || val instanceof Uint8Array || val?.type === 'Buffer')
                return `[Buffer length=${val.data?.length ?? val.length ?? '?'}]`;
        }
        return val;
    }));
};

const getNextId = (data) => {
    const keys = Object.keys(data).map(Number).filter(n => !isNaN(n));
    return keys.length > 0 ? Math.max(...keys) + 1 : 1;
};

const detectMsgType = (msg) => {
    if (!msg?.message) return 'unknown';
    const types = Object.keys(msg.message);
    return types.find(t => !['messageContextInfo', 'senderKeyDistributionMessage'].includes(t)) || types[0] || 'unknown';
};

const extractSummary = (msg) => {
    const type = detectMsgType(msg);
    const inner = msg?.message?.[type];
    let text = '';
    if (type === 'conversation') text = msg.message.conversation;
    else if (type === 'extendedTextMessage') text = inner?.text || '';
    else if (type === 'imageMessage') text = inner?.caption || '[Gambar]';
    else if (type === 'videoMessage') text = inner?.caption || '[Video]';
    else if (type === 'audioMessage') text = inner?.ptt ? '[Voice Note]' : '[Audio]';
    else if (type === 'documentMessage') text = inner?.fileName || '[Dokumen]';
    else if (type === 'stickerMessage') text = '[Stiker]';
    else if (type === 'interactiveMessage') text = inner?.body?.text || '[Interaktif]';
    else if (type === 'viewOnceMessage') text = '[View Once]';
    else if (type === 'botForwardedMessage') text = '[Bot Forwarded / Meta AI]';
    else if (type === 'pollCreationMessage') text = `[Poll: ${inner?.name || '?'}]`;
    else if (type === 'reactionMessage') text = `[Reaksi: ${inner?.text || '?'}]`;
    else text = `[${type}]`;
    return { type, text: text.slice(0, 120) };
};

const moment = (() => { try { return require('moment-timezone'); } catch { return null; } })();
const formatTime = (ts) => {
    const d = ts ? new Date(ts * 1000) : new Date();
    if (moment) return moment(d).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

// ─── RICH RESPONSE SENDER ───────────────────────────────────────────────────
// Kirim response dalam format botForwardedMessage → richResponseMessage
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
            // Strip code fence to get clean JSON
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
        response_id: `crm_${Date.now()}`,
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
        // Fallback ke teks biasa jika gagal
        await sock.sendMessage(chat, { text: textFallback || lines.join('\n') });
    }
};

// ─── MODULE ──────────────────────────────────────────────────────────────────
module.exports = {
    command: ['crm', 'crmlist', 'crmget', 'crmdel', 'crmclear', 'crmexport', 'crmtype', 'crmsearch', 'sendpay'],
    category: ['owner'],
    description: 'Sistem CRM Pesan Ultra — simpan, cari, filter, export metadata pesan WhatsApp',

    handler: async (sock, m, { command, text, prefix }) => {
        const sender = m.sender || m.key.remoteJid;
        const from = m.chat;
        const isOwner = global.ownerNumber?.some(o => sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(from, { text: 'Akses Ditolak. Khusus Owner.' }, { quoted: m });

        // ── .crm → Simpan pesan ──────────────────────────────────────────────
        if (command === 'crm') {
            let target = m;
            const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
            if (quotedId && global.messageSpyDB?.[quotedId]) target = global.messageSpyDB[quotedId];

            const crmData = readCRM();
            const id = getNextId(crmData);
            const { type, text: summary } = extractSummary(target);
            const senderNum = (target.sender || target.key?.remoteJid || '?').split('@')[0];
            const chatId = target.key?.remoteJid || '?';
            const timestamp = target.messageTimestamp || Math.floor(Date.now() / 1000);
            const pushName = target.pushName || '-';
            const isGroup = chatId.endsWith('@g.us');
            const msgKey = detectMsgType(target);
            const ctxInfo = target.message?.[msgKey]?.contextInfo || target.message?.extendedTextMessage?.contextInfo || null;
            const hasReply = !!ctxInfo?.quotedMessage;
            const mentionedJids = ctxInfo?.mentionedJid || [];

            crmData[id.toString()] = {
                id, savedAt: new Date().toISOString(), waktu: formatTime(timestamp),
                sender: senderNum, pushName, chatId, isGroup,
                messageType: type, summary, hasReply, mentionedJids,
                rawMessage: safeClone(target)
            };
            writeCRM(crmData);

            const jsonStr = JSON.stringify(safeClone(target), null, 2);
            return sendRich(sock, from, {
                title: 'CRM Tersimpan',
                lines: [
                    `ID CRM   : #${id}\nWaktu    : ${formatTime(timestamp)}\nDari     : ${pushName} (+${senderNum})\nChat     : ${isGroup ? 'Grup' : 'Pribadi'}\nTipe     : ${type}\nPreview  : ${summary}\nAda Reply: ${hasReply ? 'Ya' : 'Tidak'}`,
                    `\`\`\`json\n${jsonStr}\n\`\`\``
                ],
                pills: [`${prefix}crmlist`, `${prefix}crmget ${id}`, `${prefix}crmexport`],
                textFallback: `TERSIMPAN #${id}\n${type} | ${summary}\n\n${jsonStr}`
            });

        }

        // ── .crmlist → Ringkasan semua ───────────────────────────────────────
        if (command === 'crmlist') {
            const crmData = readCRM();
            const entries = Object.values(crmData);
            if (entries.length === 0) return sendRich(sock, from, {
                title: 'CRM Database',
                lines: ['Database CRM masih kosong.\nGunakan .crm (reply pesan) untuk menyimpan.'],
                pills: [`${prefix}crm`]
            });

            const perPage = 15;
            const page = parseInt(text) || 1;
            const start = (page - 1) * perPage;
            const slice = entries.slice(start, start + perPage);
            const totalPages = Math.ceil(entries.length / perPage);

            const rows = slice.map(e =>
                `#${e.id} | ${e.waktu?.split(' ')[1] || '?'} | ${(e.pushName || e.sender).slice(0, 15)} | ${e.messageType} | ${(e.summary || '').slice(0, 30)}`
            ).join('\n');

            const navPills = [`${prefix}crmlist ${Math.max(1, page - 1)}`, `${prefix}crmlist ${Math.min(totalPages, page + 1)}`, `${prefix}crmexport`, `${prefix}crmsearch`];

            return sendRich(sock, from, {
                title: `CRM List (Hal ${page}/${totalPages}) — Total: ${entries.length}`,
                lines: [rows, `\nGunakan: ${prefix}crmget <id> untuk detail`],
                pills: navPills,
                textFallback: rows
            });
        }

        // ── .crmget <id> → Detail 1 entri ───────────────────────────────────
        if (command === 'crmget') {
            const id = text?.trim();
            if (!id) return sendRich(sock, from, {
                title: 'CRM Get',
                lines: [`Gunakan: ${prefix}crmget <id>\nContoh: ${prefix}crmget 1`],
                pills: [`${prefix}crmlist`]
            });

            const crmData = readCRM();
            const entry = crmData[id];
            if (!entry) return sendRich(sock, from, {
                title: 'CRM Not Found',
                lines: [`ID #${id} tidak ditemukan di database.`],
                pills: [`${prefix}crmlist`]
            });

            // Kirim rich card dengan JSON di dalamnya
            const jsonStr = JSON.stringify(entry.rawMessage || entry, null, 2);
            return sendRich(sock, from, {
                title: `CRM Detail #${entry.id}`,
                lines: [
                    `Waktu     : ${entry.waktu}\nDari      : ${entry.pushName} (+${entry.sender})\nChat      : ${entry.chatId}\nTipe      : ${entry.messageType}\nSummary   : ${entry.summary}\nAda Reply : ${entry.hasReply ? 'Ya' : 'Tidak'}\nMentions  : ${entry.mentionedJids?.length || 0} orang\nSaved At  : ${entry.savedAt?.split('T')[0] || '?'}`,
                    `\`\`\`json\n${jsonStr}\n\`\`\``
                ],
                pills: [`${prefix}crmdel ${id}`, `${prefix}crmlist`, `${prefix}crmexport`],
                textFallback: `CRM #${id} | ${entry.messageType} | ${entry.summary}\n\n${jsonStr}`
            });
        }

        // ── .crmdel <id> → Hapus 1 entri ────────────────────────────────────
        if (command === 'crmdel') {
            const id = text?.trim();
            if (!id) return sendRich(sock, from, { title: 'CRM Delete', lines: [`Gunakan: ${prefix}crmdel <id>`], pills: [`${prefix}crmlist`] });
            const crmData = readCRM();
            if (!crmData[id]) return sendRich(sock, from, { title: 'CRM Not Found', lines: [`ID #${id} tidak ditemukan.`], pills: [`${prefix}crmlist`] });
            delete crmData[id];
            writeCRM(crmData);
            return sendRich(sock, from, {
                title: 'CRM Deleted',
                lines: [`Entri #${id} berhasil dihapus dari database.`],
                pills: [`${prefix}crmlist`, `${prefix}crmexport`]
            });
        }

        // ── .crmclear → Hapus semua ──────────────────────────────────────────
        if (command === 'crmclear') {
            if (text !== 'CONFIRM') return sendRich(sock, from, {
                title: 'CRM Clear — Konfirmasi',
                lines: [`PERINGATAN! Ini akan menghapus SEMUA data CRM.\n\nKetik: ${prefix}crmclear CONFIRM untuk melanjutkan.`],
                pills: [`${prefix}crmlist`]
            });
            writeCRM({});
            return sendRich(sock, from, { title: 'CRM Cleared', lines: ['Semua data CRM telah dihapus.'], pills: [`${prefix}crm`] });
        }

        // ── .crmexport → Export JSON ─────────────────────────────────────────
        if (command === 'crmexport') {
            const crmData = readCRM();
            const total = Object.keys(crmData).length;
            if (total === 0) return sendRich(sock, from, { title: 'CRM Export', lines: ['Tidak ada data untuk diexport.'], pills: [`${prefix}crm`] });
            const buf = Buffer.from(JSON.stringify(crmData, null, 2), 'utf-8');
            await sendRich(sock, from, {
                title: `CRM Export — ${total} entri`,
                lines: [`Mengexport ${total} entri dari database CRM...`],
                pills: [`${prefix}crmlist`, `${prefix}crmclear CONFIRM`]
            });
            return sock.sendMessage(from, {
                document: buf,
                mimetype: 'application/json',
                fileName: `CRM_EXPORT_${Date.now()}.json`,
                caption: `Export CRM — ${total} entri`
            }, { quoted: m });
        }

        // ── .crmtype <tipe> → Filter by tipe ────────────────────────────────
        if (command === 'crmtype') {
            const filterType = text?.trim().toLowerCase();
            if (!filterType) return sendRich(sock, from, {
                title: 'CRM Filter Tipe',
                lines: [`Gunakan: ${prefix}crmtype <tipe>\n\nTipe yang tersedia:\nconversation, imageMessage, videoMessage, audioMessage,\nstickerMessage, interactiveMessage, documentMessage,\nbotForwardedMessage, pollCreationMessage, dll`],
                pills: [`${prefix}crmtype botForwardedMessage`, `${prefix}crmtype stickerMessage`, `${prefix}crmlist`]
            });
            const crmData = readCRM();
            const filtered = Object.values(crmData).filter(e => e.messageType?.toLowerCase().includes(filterType));
            if (filtered.length === 0) return sendRich(sock, from, {
                title: 'CRM Filter — Tidak Ditemukan',
                lines: [`Tidak ada entri dengan tipe "${filterType}".`],
                pills: [`${prefix}crmlist`]
            });
            const rows = filtered.slice(0, 20).map(e => `#${e.id} | ${e.waktu?.split(' ')[1] || '?'} | ${(e.pushName || e.sender).slice(0, 15)} | ${(e.summary || '').slice(0, 40)}`).join('\n');
            return sendRich(sock, from, {
                title: `CRM Tipe "${filterType}" — ${filtered.length} entri`,
                lines: [rows],
                pills: [`${prefix}crmlist`, `${prefix}crmexport`],
                textFallback: rows
            });
        }

        // ── .crmsearch <kata> → Cari ─────────────────────────────────────────
        if (command === 'crmsearch') {
            const keyword = text?.trim().toLowerCase();
            if (!keyword) return sendRich(sock, from, {
                title: 'CRM Search',
                lines: [`Gunakan: ${prefix}crmsearch <kata kunci>\nContoh: ${prefix}crmsearch botForwarded`],
                pills: [`${prefix}crmlist`]
            });
            const crmData = readCRM();
            const results = Object.values(crmData).filter(e =>
                e.summary?.toLowerCase().includes(keyword) ||
                e.sender?.includes(keyword) ||
                e.pushName?.toLowerCase().includes(keyword) ||
                e.messageType?.toLowerCase().includes(keyword) ||
                e.chatId?.includes(keyword)
            );
            if (results.length === 0) return sendRich(sock, from, {
                title: 'CRM Search — Tidak Ditemukan',
                lines: [`Tidak ada hasil untuk kata kunci "${keyword}".`],
                pills: [`${prefix}crmlist`]
            });
            const rows = results.slice(0, 20).map(e => `#${e.id} | ${e.pushName || e.sender} | ${e.messageType} | ${(e.summary || '').slice(0, 40)}`).join('\n');
            return sendRich(sock, from, {
                title: `CRM Search "${keyword}" — ${results.length} hasil`,
                lines: [rows, `\nGunakan: ${prefix}crmget <id> untuk detail`],
                pills: [`${prefix}crmlist`, `${prefix}crmexport`],
                textFallback: rows
            });
        }

        // ── .sendpay → Kirim Invoice / Tagihan Pembayaran ──────────────────────────────
        if (command === 'sendpay') {
            // Default: kirim ke PC (private chat) pengirim, agar bisa di-test dan disadap via .spy / .crm
            let targetJid = sender.includes('@') ? sender : sender + '@s.whatsapp.net';
            let amount = 25000;
            let itemName = 'TopUp Saldo SBM-Pay';
            let mode = 'interactive'; // mode: interactive | request

            if (text) {
                const args = text.split('|').map(a => a.trim());
                // Mode: .sendpay request → pakai requestPaymentMessage (WA Pay)
                if (args[0] === 'request') {
                    mode = 'request';
                    if (args[1]) amount = parseInt(args[1]) || 25000;
                    if (args[2]) itemName = args[2];
                } else {
                    // Format: .sendpay [nomor|]jumlah|nama_item
                    let maybeNum = args[0].replace(/[^0-9]/g, '');
                    if (maybeNum.length >= 8) {
                        targetJid = maybeNum + '@s.whatsapp.net';
                        if (args[1]) amount = parseInt(args[1]) || 25000;
                        if (args[2]) itemName = args[2];
                    } else {
                        // Tidak ada nomor, arg pertama adalah jumlah
                        amount = parseInt(args[0]) || 25000;
                        if (args[1]) itemName = args[1];
                    }
                }
            }

            const amountValue = amount * 100;
            const refId = 'INV-' + Date.now();

            try {
                if (mode === 'request') {
                    // ── Mode 1: requestPaymentMessage (WA Pay native, terbukti work di testbtn.js) ──
                    const payMsg = generateWAMessageFromContent(targetJid, {
                        requestPaymentMessage: {
                            currencyCodeIso4217: 'IDR',
                            amount1000: amountValue * 10, // amount1000 = nilai × 1000
                            requestFrom: targetJid,
                            noteMessage: {
                                extendedTextMessage: { text: `${itemName} | Ref: ${refId}` }
                            },
                            expiryTimestamp: Math.floor(Date.now() / 1000) + 86400
                        }
                    }, { userJid: sock.user.id });
                    await sock.relayMessage(targetJid, payMsg.message, { messageId: payMsg.key.id });

                } else {
                    // ── Mode 2: interactiveMessage dengan review_and_pay (pakai proto.Message, sesuai pola testbtn.js) ──
                    const interactiveMsg = generateWAMessageFromContent(targetJid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        title: 'Tagihan Pembayaran',
                                        hasMediaAttachment: false
                                    }),
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: `*${itemName}*\n\nSilakan selesaikan pembayaran Anda.\n\n*Total:* Rp ${amount.toLocaleString('id-ID')}\n*Ref:* ${refId}`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({ text: 'SBM Store • Powered by Mie AI' }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: 'review_and_pay',
                                                buttonParamsJson: JSON.stringify({
                                                    currency: 'IDR',
                                                    total_amount: { value: amountValue, offset: 100 },
                                                    reference_id: refId,
                                                    type: 'physical-goods',
                                                    payment_configuration: 'custom_payment_gateway',
                                                    order: {
                                                        items: [{
                                                            name: itemName,
                                                            amount: { value: amountValue, offset: 100 },
                                                            quantity: 1
                                                        }]
                                                    }
                                                })
                                            },
                                            {
                                                name: 'cta_url',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: '[!] Bayar via Link',
                                                    url: 'https://sbmtopup.com'
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, { userJid: sock.user.id });
                    await sock.relayMessage(targetJid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
                }

                // Konfirmasi ke pengirim jika target berbeda dari chat asal
                if (targetJid.split('@')[0] !== from.split('@')[0]) {
                    await sock.sendMessage(from, {
                        text: `[i] Invoice *${itemName}* (Rp ${amount.toLocaleString('id-ID')}) berhasil dikirim ke +${targetJid.split('@')[0]}\nMode: ${mode}\nRef: ${refId}`
                    }, { quoted: m });
                }

            } catch (e) {
                await sock.sendMessage(from, { text: `[!] Error sendpay:\n${e.message}\n\n${e.stack?.slice(0, 200) || ''}` }, { quoted: m });
            }
        }
    }
};
