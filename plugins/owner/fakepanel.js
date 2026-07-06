const os = require('os');
const crypto = require('crypto');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['fakepanel', 'botstatus2', 'panel'],
    category: ['owner'],
    description: 'Kirim panel info bot real-time dalam format richResponseMessage Meta AI',
    handler: async (sock, m) => {
        const sender = m.sender || m.key.remoteJid;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(m.chat, { text: 'Akses Ditolak. Khusus Owner.' }, { quoted: m });

        // ====== DATA REAL-TIME ======
        const latencyStart = Date.now();
        await new Promise(r => setTimeout(r, 1));
        const latency = (Date.now() - latencyStart).toFixed(2);

        const uptime = process.uptime();
        const jam = Math.floor(uptime / 3600);
        const menit = Math.floor((uptime % 3600) / 60);
        const detik = Math.floor(uptime % 60);

        const mem = process.memoryUsage();
        const toMB = b => (b / 1024 / 1024).toFixed(2);

        const totalRamGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeRamGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedRamGB = (totalRamGB - freeRamGB).toFixed(2);
        const usageRamPct = ((usedRamGB / totalRamGB) * 100).toFixed(1);

        const cpuCores = os.cpus().length;
        const platform = os.platform();
        const mode = global.self ? 'Self' : (global.botMode || 'Public');
        const botName = global.botName || 'Mie AI';
        const ownerNum = global.owner?.[0] || '6283809720392';
        const prefix = global.prefix || '.';

        let totalUsers = 0;
        try {
            const db = require('../../lib/database').read();
            if (db?.users) totalUsers = Object.keys(db.users).length;
        } catch { totalUsers = 0; }

        let totalFitur = 0;
        if (global.plugins) {
            totalFitur = Object.values(global.plugins).reduce((a, p) => a + (p.command?.length || 0), 0);
        } else { totalFitur = 95; }

        const moment = (() => { try { return require('moment-timezone'); } catch { return null; } })();
        const tanggal = moment ? moment().tz('Asia/Jakarta').format('DD MMM YYYY HH:mm:ss') : new Date().toLocaleString('id-ID');

        // ====== SUBMESSAGES: Isi konten panel sebagai teks terformat ======
        // (Ini yang akan di-render sebagai konten utama pesan)
        const botInfoText = [
            `*[ BOT INFO ]*`,
            `Bot    : ${botName}`,
            `Prefix : ${prefix}`,
            `Mode   : ${mode}`,
            `Users  : ${totalUsers}`,
            `Fitur  : ${totalFitur}`,
            `Owner  : +${ownerNum}`,
        ].join('\n');

        const runtimeText = [
            `*[ RUNTIME ]*`,
            `Uptime  : ${jam}h ${menit}m ${detik}s`,
            `Latency : ${latency} ms`,
            `PID     : ${process.pid}`,
            `Platform: ${platform}`,
            `Node    : ${process.version}`,
        ].join('\n');

        const memText = [
            `*[ MEMORY ]*`,
            `RSS        : ${toMB(mem.rss)} MB`,
            `Heap Used  : ${toMB(mem.heapUsed)} MB`,
            `Heap Total : ${toMB(mem.heapTotal)} MB`,
            `External   : ${toMB(mem.external || 0)} MB`,
        ].join('\n');

        const serverText = [
            `*[ SERVER ]*`,
            `RAM Used  : ${usedRamGB} / ${totalRamGB} GB`,
            `RAM Free  : ${freeRamGB} GB`,
            `RAM Usage : ${usageRamPct} %`,
            `CPU Cores : ${cpuCores}`,
            `Date      : ${tanggal}`,
        ].join('\n');

        // ====== UNIFIEDRESPONSE: Pakai struktur MINIMAL yang terbukti render ======
        // (hanya MetadataText + Pills - GenAICodeUXPrimitive butuh validasi server Meta AI)
        const unifiedData = {
            response_id: `panel_${Date.now()}`,
            sections: [
                // Header teks
                {
                    view_model: {
                        primitive: {
                            text: `${botName} | System Panel`,
                            __typename: 'GenAIMetadataTextPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                },
                // BOT INFO
                {
                    view_model: {
                        primitive: {
                            text: botInfoText,
                            __typename: 'GenAIMarkdownTextUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                },
                // RUNTIME
                {
                    view_model: {
                        primitive: {
                            text: runtimeText,
                            __typename: 'GenAIMarkdownTextUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                },
                // MEMORY
                {
                    view_model: {
                        primitive: {
                            text: memText,
                            __typename: 'GenAIMarkdownTextUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                },
                // SERVER
                {
                    view_model: {
                        primitive: {
                            text: serverText,
                            __typename: 'GenAIMarkdownTextUXPrimitive'
                        },
                        __typename: 'GenAISingleLayoutViewModel'
                    }
                },
                // Suggestion pills
                {
                    __typename: 'GenAIUnifiedResponseSection',
                    view_model: {
                        primitives: [
                            { prompt_text: `${prefix}menu`,      prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' },
                            { prompt_text: `${prefix}ping`,      prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' },
                            { prompt_text: `${prefix}runtime`,   prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' },
                            { prompt_text: `${prefix}botstatus`, prompt_type: 'SUGGESTED_PROMPT', __typename: 'GenAIFollowUpSuggestionPillPrimitive' },
                        ],
                        __typename: 'GenAIHScrollLayoutViewModel'
                    }
                }
            ]
        };

        // ====== BANGUN FULL PAYLOAD ======
        const richPayload = {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32).toString('base64')
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 'AI_RICH_RESPONSE_TYPE_STANDARD',
                        submessages: [
                            // Heading markdown
                            {
                                messageType: 'AI_RICH_RESPONSE_TEXT',
                                messageText: `# ${botName.toUpperCase()} SYSTEM PANEL`
                            },
                            // BOT INFO
                            { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: botInfoText },
                            // RUNTIME
                            { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: runtimeText },
                            // MEMORY
                            { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: memText },
                            // SERVER
                            { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: serverText },
                        ],
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify(unifiedData)).toString('base64')
                        },
                        contextInfo: {
                            forwardingScore: 2,
                            isForwarded: true,
                            forwardOrigin: 'META_AI'
                        }
                    }
                }
            }
        };

        // ====== RELAY via generateWAMessageFromContent ======
        // Pakai cara yang sama seperti fakeai.js — ini pattern yang terbukti jalan
        let relayedMsgId = null;
        try {
            const waMsg = generateWAMessageFromContent(m.chat, richPayload, {
                userJid: sock.user.id
            });
            relayedMsgId = waMsg.key.id;
            await sock.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });
        } catch (e) {
            console.error('Gagal relayMessage fakepanel:', e);
            await sock.sendMessage(m.chat, {
                text: [botInfoText, '', runtimeText, '', memText, '', serverText].join('\n')
            }, { quoted: m });
            return;
        }


        // ====== AUTO DEBUG: SPY + CRM otomatis setelah fakepanel dikirim ======
        try {
            const fs = require('fs');
            const path = require('path');
            const CRM_FILE = path.join(process.cwd(), 'crm.json');
            const SPY_LOG_FILE = path.join(process.cwd(), 'spy_log.json');
            const now = new Date();
            const waktu = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

            // --- Safe clone helper ---
            const safeClone = (obj) => {
                const seen = new WeakSet();
                try {
                    return JSON.parse(JSON.stringify(obj, (key, val) => {
                        if (typeof val === 'bigint') return val.toString();
                        if (typeof val === 'object' && val !== null) {
                            if (seen.has(val)) return '[Circular]';
                            seen.add(val);
                            if (Buffer.isBuffer(val) || val instanceof Uint8Array) return `[Buffer len=${val.length}]`;
                        }
                        return val;
                    }));
                } catch { return { error: 'clone_failed' }; }
            };

            const debugEntry = {
                savedAt: now.toISOString(),
                waktu,
                type: 'FAKEPANEL_OUTGOING',
                messageId: relayedMsgId,
                chat: m.chat,
                sender: (m.sender || m.key.remoteJid || '?').split('@')[0],
                unifiedResponseDecoded: unifiedData, // JSON asli sebelum di-base64
                richPayload: safeClone(richPayload)  // Payload lengkap yang dikirim
            };

            // --- Auto CRM: Simpan ke crm.json ---
            let crmData = {};
            if (fs.existsSync(CRM_FILE)) {
                try { crmData = JSON.parse(fs.readFileSync(CRM_FILE, 'utf8')); } catch { crmData = {}; }
            }
            const crmKeys = Object.keys(crmData).map(Number).filter(n => !isNaN(n));
            const nextCrmId = crmKeys.length > 0 ? Math.max(...crmKeys) + 1 : 1;
            crmData[nextCrmId.toString()] = {
                id: nextCrmId,
                ...debugEntry,
                messageType: 'FAKEPANEL_OUTGOING',
                summary: `[FAKEPANEL sent] msgId=${relayedMsgId}`
            };
            fs.writeFileSync(CRM_FILE, JSON.stringify(crmData, null, 2));

            // --- Auto SPY LOG: Simpan ke spy_log.json ---
            let spyLog = {};
            if (fs.existsSync(SPY_LOG_FILE)) {
                try { spyLog = JSON.parse(fs.readFileSync(SPY_LOG_FILE, 'utf8')); } catch { spyLog = {}; }
            }
            spyLog[relayedMsgId || `fp_${Date.now()}`] = {
                ...debugEntry,
                rareFeatures: ['FAKEPANEL', 'OUTGOING', 'botForwardedMessage', 'richResponseMessage'],
                hasRareFeature: true,
                preview: `[FAKEPANEL OUTGOING] ${botName} - ${waktu}`
            };
            fs.writeFileSync(SPY_LOG_FILE, JSON.stringify(spyLog, null, 2));

            // --- Kirim notifikasi debug ke owner ---
            await sock.sendMessage(m.chat, {
                document: Buffer.from(JSON.stringify(debugEntry, null, 2), 'utf-8'),
                mimetype: 'application/json',
                fileName: `FAKEPANEL_DEBUG_${relayedMsgId || Date.now()}.json`,
                caption: `DEBUG FAKEPANEL\n\nPayload yang dikirim sudah disimpan ke:\n- crm.json (ID: #${nextCrmId})\n- spy_log.json\n- File JSON ini (buka untuk lihat struktur lengkap)\n\nBandingkan dengan pesan asli Meta AI di crm.json untuk cari perbedaannya!`
            }, { quoted: m });

        } catch (debugErr) {
            console.error('Auto debug fakepanel error:', debugErr);
        }
    }
};

