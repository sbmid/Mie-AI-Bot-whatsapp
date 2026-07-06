const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploader } = require('../../lib/uploader');

module.exports = {
    command: ['autoai'],
    category: ['ai'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.key.remoteJid;
        const sender = m.sender || m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        let targetObj = isGroup ? global.db.getGroup(from) : global.db.getUser(sender);

        if (args[0] === 'on') {
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(from).catch(() => null);
                const participants = groupMetadata ? groupMetadata.participants : [];
                const isAdmin = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender)?.admin;
                const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
                if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "[!] Hanya Admin Grup yang bisa mengatur Asisten AI." }, { quoted: m });
            }
            targetObj.autoai = true;
            return sock.sendMessage(from, { text: "[i] *Assisten AI Aktif*\nSekarang kamu bisa mention/reply bot dan meminta bantuan (download, buat gambar, putar lagu, dll) dengan bahasa layaknya manusia!" }, { quoted: m });
        } else if (args[0] === 'off') {
            if (isGroup) {
                const groupMetadata = await sock.groupMetadata(from).catch(() => null);
                const participants = groupMetadata ? groupMetadata.participants : [];
                const isAdmin = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender)?.admin;
                const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
                if (!isAdmin && !isOwner) return sock.sendMessage(from, { text: "[!] Hanya Admin Grup yang bisa mengatur Asisten AI." }, { quoted: m });
            }
            targetObj.autoai = false;
            return sock.sendMessage(from, { text: "[!] *Assisten AI Dimatikan*" }, { quoted: m });
        } else {
            return sock.sendMessage(from, { text: `Penggunaan:\n${prefix + command} on\n${prefix + command} off\n\nAtau gunakan bahasa manusia seperti:\n"Aktifkan AI" / "Matikan AI"\ntanpa memakai tanda awalan (.).` }, { quoted: m });
        }
    },
    before: async (sock, m, { body, prefix }) => {
        const fs = require('fs');
        const traceLog = (msg) => { try { fs.appendFileSync('autoai_trace.txt', new Date().toISOString() + " - " + msg + "\n"); } catch(e){} };
        
        if (!body) return false;
        
        // Jangan proses jika berupa command normal
        if (body.startsWith(prefix)) return false;

        const from = m.key.remoteJid;
        const sender = m.sender || m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        
        const textLower = body.toLowerCase().trim();

        // 1. Natural Language Toggle Configuration
        const isEnable = /^(aktifkan|nyalakan)\s+(auto\s*)?ai$/i.test(textLower);
        const isDisable = /^(matikan|nonaktifkan)\s+(auto\s*)?ai$/i.test(textLower);

        if (isEnable || isDisable) {
            if (isGroup) {
                // Pastikan yang perintah adalah admin
                const groupMetadata = await sock.groupMetadata(from).catch(() => null);
                const participants = groupMetadata ? groupMetadata.participants : [];
                const isAdmin = participants.find(p => p.id === sender || p.jid === sender || p.lid === sender)?.admin;
                const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
                
                if (!isAdmin && !isOwner) {
                    await sock.sendMessage(from, { text: "[!] Hanya Admin Grup yang bisa mengatur Asisten AI." }, { quoted: m });
                    return true;
                }
            }
            
            let targetObj = isGroup ? global.db.getGroup(from) : global.db.getUser(sender);
            
            if (isEnable) {
                targetObj.autoai = true;
                await sock.sendMessage(from, { text: "[i] *Assisten AI Aktif*\nSekarang kamu bisa mention/reply bot dan meminta bantuan (download, buat gambar, putar lagu, dll) dengan bahasa layaknya manusia!" }, { quoted: m });
            } else {
                targetObj.autoai = false;
                await sock.sendMessage(from, { text: "[!] *Assisten AI Dimatikan*\nBot tidak akan merespon percakapan/mention natural." }, { quoted: m });
            }
            return true;
        }

        // 2. CHECK STATUS ON/OFF
        let targetObj = isGroup ? global.db.getGroup(from) : global.db.getUser(sender);
        if (!targetObj.autoai) {
            traceLog(`Escape: autoai disabled config for ${sender} isGroup:${isGroup}`);
            return false; // Abaikan pesan AI natural jika belum diaktifkan
        }

        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Ekstrak contextInfo dari semua tipe pesan yang memungkinkan (teks/gambar/video)
        let contextInfo = m.message?.extendedTextMessage?.contextInfo 
                          || m.message?.imageMessage?.contextInfo
                          || m.message?.videoMessage?.contextInfo;

        // Cek apakah pesan mention bot atau reply pesan bot
        const isMentionedTag = contextInfo?.mentionedJid?.includes(botNumber);
        const isQuotedBot = contextInfo?.participant === botNumber;
        
        // Soft trigger: jika tidak bawa quote/mention asli bawaan WA, tapi nyebut "ai", "bot", atau "autoai"
        const hasSoftTrigger = /^(ai|bot|autoai|tolong ai|halo ai)\b/i.test(textLower);
        const isMentioned = isMentionedTag || hasSoftTrigger;

        // Di dalam grup, pesan harus mencantumkan mention/reply agar AI jalan
        // Namun di obrolan pribadi (PC), AI langsung membalas karena tidak ada gangguan
        if (isGroup && (!isMentioned && !isQuotedBot)) {
            traceLog(`Escape: isGroup true but not mentioned/quoted for ${sender} (Text: ${body})`);
            return false;
        }

        traceLog(`Proceeding: User ${sender} message allowed. isImage: checking...`);

        // Bersihkan tag/mention bot dari text
        const text = body.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();

        // Resolusi wujud pesan asli dan pesan yang direply
        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
                     || m.message?.imageMessage?.contextInfo?.quotedMessage
                     || m.message?.videoMessage?.contextInfo?.quotedMessage;
        const resolveMsg = (msgObj) => {
            if (!msgObj) return null;
            if (msgObj.viewOnceMessageV2) return msgObj.viewOnceMessageV2.message;
            if (msgObj.viewOnceMessage) return msgObj.viewOnceMessage.message;
            if (msgObj.ephemeralMessage) return msgObj.ephemeralMessage.message;
            return msgObj;
        }

        let resolvedBase = resolveMsg(m.message);
        let resolvedQuoted = resolveMsg(quoted);

        // Terbaca sebagai Gambar jika wujud aslinya nge-upload gambar, ATAU wujud yang di-reply adalah gambar
        const isImage = !!resolvedBase?.imageMessage || !!resolvedQuoted?.imageMessage;

        const apiKey = "sk_prod_f47671e1479aeee6f8927ec98ba58cd5";
        const headers = { "Authorization": `Bearer ${apiKey}` };

        // Helper Reactions
        const react = async (emoji) => {
            try { await sock.sendMessage(from, { react: { text: emoji, key: m.key } }); } catch(e){}
        }
        
        // Fungsi pembersih kata-kata pengisi (dong, ya, tolong dll)
        const cleanFillerWords = (str) => str.replace(/\b(dong|ya|tolong|coba|deh|nih|kuy|yuk|aja|buatkan|bikinin|carikan|puterin)\b/ig, '').replace(/\s+/g, ' ').trim();

        try {
            // ROUTE GEMINI AI CHAT (Agentic Model)
            await react("[!]");
            let finalPrompt = text || "Halo";
            
            // Tambahkan konteks pesan yang di-reply (jika ada)
            let quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || quoted?.imageMessage?.caption || "";
            if (quotedText) {
                finalPrompt = `[Konteks: User me-reply sebuah pesan yang isinya: "${quotedText}"]\n\nPesan User: ${finalPrompt}`;
            }

            if (isImage) {
                finalPrompt = `[Sistem: User melampirkan pesan gambar. SEKARANG KAMU BISA MELIHATNYA! Jika user bertanya tentang isinya, kamu bisa menjelaskannya dengan cerdas. TETAPI JANGAN PERNAH menyuruh user mengetik command. Jika user minta fotonya diedit/jernihkan(HD)/anime/stiker, balas "Siap, foto sedang aku proses!" dan WAJIB sisipkan tag [RUN_CMD: <namatool>] di dalam balasanmu (contoh: [RUN_CMD: .hd] atau [RUN_CMD: .s]) agar mesin bot memprosesnya.] \n\nChat User: ${finalPrompt}`.trim();
            }

            let groupMetadata = null;
            let groupAdmins = [];
            let groupOwner = '';
            if (isGroup) {
                groupMetadata = await sock.groupMetadata(from).catch(() => null);
                if (groupMetadata) {
                    groupOwner = groupMetadata.owner || '';
                    const getJid = p => p.jid || p.id;
                    groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => getJid(p));
                }
            }
            const ownerNumbers = global.ownerNumber ? global.ownerNumber.map(n => n.split('@')[0]) : [];
            let sysMentionsInfo = `Owner bot: @${ownerNumbers[0] || 'tidak diketahui'}.`;
            if (isGroup) {
                sysMentionsInfo += ` Admin grup: ${groupAdmins.map(a => '@' + a.split('@')[0]).join(', ') || 'kosong'}.`;
            }
            
            let targetObjForHist = isGroup ? global.db.getGroup(from) : global.db.getUser(sender);
            let historyText = "";
            if (targetObjForHist.aiHistory && targetObjForHist.aiHistory.length > 0) {
                // Potong maksimal 8 pasang obrolan agar panjang URL parameter tidak kepanjangan (Mencegah Error 414 URL too long)
                const recents = targetObjForHist.aiHistory.slice(-16);
                historyText = "Riwayat:\n" + recents.map(h => {
                    if (h.role === 'user') {
                        // Support format baru (structured object) atau format lama (h.content bawaan yang sudah ada nama)
                        return h.jid ? `${h.name || 'User'} (@${h.jid.split('@')[0]}): ${h.content}` : h.content;
                    } else {
                        return h.replyName ? `Asisten (Membalas ${h.replyName}): ${h.content}` : `Asisten: ${h.content}`;
                    }
                }).join("\n") + "\n";
            }

            let commandListStr = "";
            if (global.plugins) {
                const isOwnerReal = ownerNumbers.some(o => sender.startsWith(o));
                const restrictedCats = ['admin', 'group', 'game', 'rpg', 'sultan'];
                if (!isOwnerReal) restrictedCats.push('owner'); // Sembunyikan fitur owner dari non-owner

                let categoriesDict = {};
                for (const p in global.plugins) {
                    let plugin = global.plugins[p];
                    if (plugin.command && Array.isArray(plugin.command)) {
                        let cat = plugin.category ? plugin.category[0].toLowerCase() : 'lainnya';
                        if (restrictedCats.includes(cat) || plugin.pconly || plugin.private) continue;
                        if (!categoriesDict[cat]) categoriesDict[cat] = [];
                        categoriesDict[cat].push('.' + plugin.command[0]);
                    }
                }
                let dbString = [];
                for (let cat in categoriesDict) {
                    dbString.push(`[${cat.toUpperCase()}] ${categoriesDict[cat].join(', ')}`);
                }
                commandListStr = dbString.length > 0 ? "DAFTAR TOOL/FITUR:\n" + dbString.join('\n') : '';
            }
            
            const tutorialDb = `Fungsi Tool: .tt/.ig/.ytmp4 (Download video tiktok/ig/youtube), .play (Putar lagu spotify), .hd/.remini (Jernihkan foto), .toanime (Foto kartun), .removebg (Hapus latar), .s (Bikin stiker).`;

            const sysInfo = `Kamu AutoAI, asisten ramah (Jawab tanpa **). ${sysMentionsInfo}
PENTING: JANGAN menyuruh user mengetik command! Jika user minta fitur HD, Stiker, Musik, Download, dsb, KAMU SENDIRI HARUS mengeksekusinya secara rahasia dengan menyisipkan [RUN_CMD: <perintah>] di balasanmu. Contoh: "Siap diproses! [RUN_CMD: .hd]".
Jika user meminta daftar kemampuan/menu/fitur milikmu, sediakan list yang sangat rapi dan tertata dengan baik berdasarkan data DAFTAR TOOL berikut.
${tutorialDb}
${commandListStr}`.replace(/  +/g, ' ');

            const userPromptStr = `${historyText}\nUser msg ${m.pushName || 'User'} (@${sender.split('@')[0]}): ${finalPrompt}`.replace(/  +/g, ' ');

            let aiResponse = null;
            const apiKeys = JSON.parse(process.env.GEMINI_API_KEYS || "[]");
            if (apiKeys.length === 0) {
                traceLog("Escape: API Keys array is empty");
                return sock.sendMessage(from, { text: "Error: GEMINI_API_KEYS belum di-set di .env" }, { quoted: m });
            }
            
            traceLog(`Keys loaded: ${apiKeys.length}`);
            const shuffledKeys = apiKeys.sort(() => Math.random() - 0.5);
            const contentParts = [{ text: userPromptStr }];
            
            // Jika ada gambar, sedot langsung ke memori sebagai Base64 supaya AI tidak buta lagi (Native Vision)
            if (isImage) {
                try {
                    const mediaData = resolvedBase?.imageMessage || resolvedQuoted?.imageMessage;
                    const stream = await downloadContentFromMessage(mediaData, 'image');
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    contentParts.push({
                        inline_data: {
                            mime_type: mediaData.mimetype || 'image/jpeg',
                            data: buffer.toString('base64')
                        }
                    });
                } catch (e) {
                    console.log("Sedot buffer gambar untuk vision gagal:", e.message);
                }
            }

            // Loop rotasi kunci untuk bypass limit (Max 429)
            for (const key of shuffledKeys) {
                try {
                    const response = await axios({
                        method: 'post',
                        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                        headers: { 'Content-Type': 'application/json' },
                        data: {
                            system_instruction: { parts: [{ text: sysInfo }] },
                            contents: [{ parts: contentParts }]
                        },
                        timeout: 45000
                    });

                    if (response.data.candidates && response.data.candidates.length > 0) {
                        let rawAnswer = response.data.candidates[0].content.parts[0].text;
                        aiResponse = rawAnswer.replace(/\*\*/g, '').trim();
                        traceLog(`API Success: Extracted response len ${aiResponse.length}`);
                        break; // Sukses, keluar dari loop
                    } else {
                        traceLog(`API Success but candidates missing: ${JSON.stringify(response.data)}`);
                    }
                } catch (err) {
                    const fs = require('fs');
                    const errorDetail = err.response ? JSON.stringify(err.response.data) : err.message;
                    fs.appendFileSync('debug_gemini.txt', new Date().toISOString() + " - " + errorDetail + "\n");
                    
                    if (err.response?.status === 429) continue;
                    continue; 
                }
            }

            if (!aiResponse) {
                return sock.sendMessage(from, { text: "Semua antrean sistem AI penuh (Limit Key), mohon tunggu beberapa saat lagi..." }, { quoted: m });
            }

            if (aiResponse) {
                
                // Parse TOOL CMD dengan regex kebal spasi dan newline
                let extractedCmd = null;
                const cmdRegex = /\[\s*RUN_CMD:\s*(.+?)\s*\]/gi;
                let match;
                while ((match = cmdRegex.exec(aiResponse)) !== null) {
                    if (!extractedCmd) extractedCmd = match[1].trim(); // Ambil command pertama yang dipanggil
                }
                
                // Hapus semua jejak tag tool dari text yang dikirim ke user
                aiResponse = aiResponse.replace(cmdRegex, '').trim();

                const mentionMatches = aiResponse.match(/@\d+/g);
                let mentionsArray = [];
                if (mentionMatches) {
                    mentionsArray = mentionMatches.map(v => v.replace('@', '') + '@s.whatsapp.net');
                }
                
                if (aiResponse.length > 0) {
                    await sock.sendMessage(from, { text: aiResponse, mentions: mentionsArray }, { quoted: m });
                }

                // SIMPAN KE HISTORY MULTI-USER 
                let targetObj = isGroup ? global.db.getGroup(from) : global.db.getUser(sender);
                if (!targetObj.aiHistory) targetObj.aiHistory = [];
                
                // Jika itu gambar, simpan representasi ke history tanpa menjebol konteks AI dengan teks panjang system prompt
                let historyUserContent = isImage ? `[Mengirim Foto/Media] ${text}`.trim() : finalPrompt;
                
                targetObj.aiHistory.push({ 
                    role: 'user', 
                    jid: sender,
                    name: m.pushName || 'User',
                    content: historyUserContent 
                });
                targetObj.aiHistory.push({ 
                    role: 'assistant', 
                    replyTo: sender,
                    replyName: m.pushName || 'User',
                    content: aiResponse 
                });
                
                // Batasi history maksimal 30 pasang (60 item)
                if (targetObj.aiHistory.length > 60) {
                    targetObj.aiHistory.splice(0, targetObj.aiHistory.length - 60);
                }

                // EKSEKUSI TRIGGER CMD
                if (extractedCmd) {
                    const runcmdParts = extractedCmd.split(/ +/);
                    let rawCommand = runcmdParts[0].toLowerCase();
                    const triggerPrefix = global.prefix || '.';
                    if (rawCommand.startsWith(triggerPrefix)) rawCommand = rawCommand.slice(triggerPrefix.length);
                    const textStr = runcmdParts.slice(1).join(' ');
                    
                    if (global.plugins) {
                        for (let p in global.plugins) {
                            let plugin = global.plugins[p];
                            if (plugin.command && plugin.command.includes(rawCommand)) {
                                const isOwnerExec = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));
                                const restrictedCatsExec = ['admin', 'group', 'game', 'rpg', 'sultan'];
                                if (!isOwnerExec) restrictedCatsExec.push('owner');
                                
                                let catExec = plugin.category ? plugin.category[0].toLowerCase() : 'lainnya';
                                if (restrictedCatsExec.includes(catExec) || plugin.pconly || plugin.private) break;
                                
                                try {
                                    // Panggil handler plugin
                                    await plugin.handler(sock, m, { args: runcmdParts.slice(1), text: textStr, command: rawCommand, body: extractedCmd, prefix: triggerPrefix });
                                } catch(e) {
                                    console.error("AutoAI Plugin Exec Error:", e);
                                    await sock.sendMessage(from, { text: `[!] *AutoAI System Error* \nGagal memproses instruksi otomatis [${extractedCmd}]: \n_${e.message}_` }, { quoted: m });
                                }
                                break;
                            }
                        }
                    }
                }

            } else {
                traceLog("Escape: AI Response is completely empty or generic failure");
                await sock.sendMessage(from, { text: "Maaf, AI tidak merespon dengan benar." }, { quoted: m });
            }
            
            traceLog("AutoAI sequence completed successfully.");
            return true;

        } catch (error) {
            traceLog(`FATAL ERROR: ${error.message} \n ${error.stack}`);
            console.error('AutoAI Error:', error.message);
            // Optionally tell the user there was an error
            // sock.sendMessage(from, { text: `Terdapat error pada AutoAI: ${error.message}` }, { quoted: m });
            return false;
        }
    }
};
