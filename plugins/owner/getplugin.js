const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// ─── RICH RESPONSE SENDER ───────────────────────────────────────────────────
const sendRich = async (sock, chat, { title, lines = [], textFallback = '' }) => {
    const formattedSubmessages = [
        { messageType: 'AI_RICH_RESPONSE_TEXT', messageText: `# ${title}` }
    ];

    const sections = [
        {
            view_model: {
                primitive: { text: title, __typename: 'GenAIMetadataTextPrimitive' },
                __typename: 'GenAISingleLayoutViewModel'
            }
        }
    ];

    for (const line of lines) {
        const trimmed = typeof line === 'string' ? line.trim() : '';
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
            const firstNewline = trimmed.indexOf('\n');
            const lang = firstNewline > -1 ? trimmed.slice(3, firstNewline).trim() : '';
            let codeContent = firstNewline > -1 ? trimmed.slice(firstNewline + 1, -3) : trimmed.slice(3, -3);
            if (codeContent.endsWith('\n')) codeContent = codeContent.slice(0, -1);

            formattedSubmessages.push({
                messageType: 'AI_RICH_RESPONSE_CODE',
                codeMetadata: {
                    codeLanguage: lang || 'js',
                    codeBlocks: [{ highlightType: 'AI_RICH_RESPONSE_CODE_HIGHLIGHT_DEFAULT', codeContent }]
                }
            });
            sections.push({
                view_model: {
                    primitive: {
                        language: lang || 'js',
                        code_blocks: [{ content: codeContent, type: 'DEFAULT' }],
                        __typename: 'GenAICodeUXPrimitive'
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            });
        } else {
            formattedSubmessages.push({ messageType: 'AI_RICH_RESPONSE_TEXT', messageText: line });
            sections.push({
                view_model: {
                    primitive: { text: line, __typename: 'GenAIMarkdownTextUXPrimitive' },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            });
        }
    }

    const unifiedData = {
        response_id: `getplugin_${Date.now()}`,
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
                    contextInfo: {
                        forwardingScore: 2,
                        isForwarded: true,
                        forwardOrigin: 'META_AI'
                    }
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

module.exports = {
    command: ['getplugin', 'gp'],
    category: ['owner'],
    description: 'Mendapatkan source code plugin',

    handler: async (sock, m, { args, prefix }) => {
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        if (!isOwner && m.sender !== sock.user.id) {
            return await sock.sendMessage(m.chat, { text: '⚠️ Perintah ini khusus Owner.' }, { quoted: m });
        }

        if (!args[0]) {
            return await sock.sendMessage(m.chat, { text: `⚠️ Penggunaan: ${prefix}getplugin <nama file>\nContoh: ${prefix}getplugin game_owo` }, { quoted: m });
        }

        let target = args[0];
        if (!target.endsWith('.js')) target += '.js';

        // Cari file secara rekursif dalam folder plugins
        const findFile = (dir, fileName) => {
            let results = [];
            const list = fs.readdirSync(dir);
            for (let file of list) {
                const filePath = path.resolve(dir, file);
                const stat = fs.statSync(filePath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(findFile(filePath, fileName));
                } else if (file === fileName || filePath.endsWith(fileName)) {
                    results.push(filePath);
                }
            }
            return results;
        };

        const pluginDir = path.join(__dirname, '..', '..', 'plugins');
        const files = findFile(pluginDir, target);

        if (files.length === 0) {
            return await sock.sendMessage(m.chat, { text: `❌ Plugin '${target}' tidak ditemukan.` }, { quoted: m });
        }

        const filePath = files[0]; // Ambil file pertama jika ada nama duplikat
        const content = fs.readFileSync(filePath, 'utf8');

        // Jika ukuran konten terlalu besar, potong dan beri tahu
        const MAX_LEN = 10000;
        let displayContent = content;
        let note = '';
        if (content.length > MAX_LEN) {
            displayContent = content.substring(0, MAX_LEN) + '\n\n... [KODE TERPOTONG KARENA TERLALU PANJANG]';
            note = '\n_Catatan: Source code terlalu panjang untuk ditampilkan sepenuhnya._';
        }

        await sendRich(sock, m.chat, {
            title: `📂 Source: ${path.basename(filePath)}`,
            lines: [
                `Path: \`${filePath.replace(process.cwd(), '')}\`${note}`,
                `\`\`\`js\n${displayContent}\n\`\`\``
            ],
            textFallback: `*Source: ${path.basename(filePath)}*\n\n\`\`\`js\n${displayContent}\n\`\`\``
        });
    }
};
