const crypto = require('crypto');

function tokenizer(code) {
    const tokens = [];
    let i = 0;
    const len = code.length;
    const keywords = [
        'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'class', 'const', 'let', 'super', 'extends', 'export', 'import',  'yield', 'static', 'constructor', 'of', 'async', 'await', 'get', 'set', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'enum', 'typeof', 'throws', 'transient'
    ];
    
    while (i < len) {
        if (/\s/.test(code[i])) {
            let start = i;
            while (i < len && /\s/.test(code[i])) i++;
            tokens.push({ content: code.slice(start, i), type: 'DEFAULT' });
            continue;
        }
        
        if (code[i] === '"' || code[i] === "'") {
            let start = i;
            const quote = code[i];
            i++;
            while (i < len && code[i] !== quote) {
                if (code[i] === '\\') i++;
                i++;
            }
            i++;
            tokens.push({ content: code.slice(start, i), type: 'STR' });
            continue;
        }
        
        if (/[0-9]/.test(code[i])) {
            let start = i;
            while (i < len && /[0-9.]/.test(code[i])) i++;
            tokens.push({ content: code.slice(start, i), type: 'NUMBER' });
            continue;
        }
        
        if (/[a-zA-Z_$]/.test(code[i])) {
            let start = i;
            while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) i++;
            const word = code.slice(start, i);
            if (keywords.includes(word)) {
                tokens.push({ content: word, type: 'KEYWORD' });
            } else {
                let j = i;
                while (j < len && /\s/.test(code[j])) j++;
                if (j < len && code[j] === '(') {
                    tokens.push({ content: word, type: 'METHOD' });
                } else {
                    tokens.push({ content: word, type: 'DEFAULT' });
                }
            }
            continue;
        }
        
        tokens.push({ content: code[i], type: 'DEFAULT' });
        i++;
    }
    
    const merged = [];
    for (const t of tokens) {
        if (merged.length && merged[merged.length-1].type === 'DEFAULT' && t.type === 'DEFAULT') {
            merged[merged.length-1].content += t.content;
        } else {
            merged.push(t);
        }
    }
    return merged;
}

function generateUUID() {
    return crypto.randomUUID();
}

module.exports = {
    command: ['aku'],
    handler: async (sock, m) => {
        try {
            const mainText = "aku hann universe";
            const jsCode = `console."Hello World"(log)`;

            const responseId = generateUUID();
            const unifiedData = {
                response_id: responseId,
                sections: [
                    {
                        view_model: {
                            primitive: {
                                text: mainText,
                                __typename: "GenAIMarkdownTextUXPrimitive"
                            },
                            __typename: "GenAISingleLayoutViewModel"
                        }
                    },
                    {
                        view_model: {
                            primitive: {
                                language: "javascript",
                                code_blocks: tokenizer(jsCode),
                                __typename: "GenAICodeUXPrimitive"
                            },
                            __typename: "GenAISingleLayoutViewModel"
                        }
                    }
                ]
            };

            const base64Data = Buffer.from(JSON.stringify(unifiedData)).toString('base64');

            const msgObj = {
                botForwardedMessage: {
                    message: {
                        richResponseMessage: {
                            submessages: [],
                            messageType: 1,
                            unifiedResponse: { data: base64Data },
                            contextInfo: {
                                isForwarded: true,
                                forwardedAiBotMessageInfo: { botJid: "259786046210223@bot" },
                                forwardOrigin: 4,
                                botMessageSharingInfo: {
                                    botEntryPointOrigin: 1,
                                    forwardScore: 2
                                }
                            }
                        }
                    }
                }
            };

            const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
            // Bungkus dalam viewOnceMessage (opsional, tapi sering kali bypass batasan WA Business)
            const waMessage = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: msgObj
                }
            }, { userJid: sock.user.id });

            await sock.relayMessage(m.chat, waMessage.message, { messageId: waMessage.key.id });
        } catch (error) {
            console.error("Error command aku:", error);
            await sock.sendMessage(m.chat, { text: `Oops, gagal membuat pesan AI!` }, { quoted: m });
        }
    }
};
