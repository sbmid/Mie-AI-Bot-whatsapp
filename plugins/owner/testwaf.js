const fs = require('fs');
const path = require('path');
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['testwaf', 'testlottie', 'testpay', 'testevent', 'testproduct'],
    category: ['owner'],
    description: 'Mengetes raw payload WAF hasil dump ke chat',
    handler: async (sock, m, { command, text, prefix }) => {
        const sender = m.sender;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender.startsWith(o.split('@')[0]));

        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.` }, { quoted: m });
        }

        const filePath = path.join(process.cwd(), 'special_wa_features.json');
        let currentData = [];

        if (fs.existsSync(filePath)) {
            try {
                currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                return sock.sendMessage(m.chat, { text: `[!] Gagal membaca special_wa_features.json` }, { quoted: m });
            }
        } else {
            return sock.sendMessage(m.chat, { text: `[!] File data dump WAF belum tersedia (special_wa_features.json)` }, { quoted: m });
        }

        let targetMessageContent = null;
        
        // Membaca jenis payload berdasarkan input command
        if (command === 'testlottie') {
            targetMessageContent = currentData.find(d => d.messageContent.lottieStickerMessage)?.messageContent;
        } else if (command === 'testpay') {
            // Priority: mencari interactiveMessage yang contains 'payment_key_info' atau 'review_and_pay'
            targetMessageContent = currentData.find(d => d.messageContent.interactiveMessage)?.messageContent;
        } else if (command === 'testevent') {
            targetMessageContent = currentData.find(d => d.messageContent.eventMessage)?.messageContent;
        } else if (command === 'testproduct') {
            targetMessageContent = currentData.find(d => d.messageContent.productMessage)?.messageContent;
        } else if (command === 'testwaf') {
            if (!text || isNaN(text)) {
                return sock.sendMessage(m.chat, { text: `Gunakan urutan indeks dari isi dump.\nContoh: ${prefix}testwaf 1` }, { quoted: m });
            }
            const index = parseInt(text) - 1;
            if (index < 0 || index >= currentData.length) {
                 return sock.sendMessage(m.chat, { text: `[!] Indeks tidak valid. Total data: ${currentData.length}` }, { quoted: m });
            }
            targetMessageContent = currentData[index].messageContent;
        }

        if (!targetMessageContent) {
            return sock.sendMessage(m.chat, { text: `[!] Tidak menemukan payload/tipe pesan tersebut dalam database dump saat ini.` }, { quoted: m });
        }

        try {
            // Sebagian raw message butuh dibungkus ViewOnce jika dikirim via relay (seperti buttons/interactive) khusus WA terbaru
            // Namun mencoba menembakkan langsung struktur murni sesuai apa yang didump
            let finalStruct = targetMessageContent;

            // Jika itu interactiveMessage dan kamu nge-dump nya pure tanpa viewOnce wrapper, kita tambahkan wrapper 
            // karena di WA versi Beta terkadang NativeFlowMessage langsung di-block jika tidak di wrap
            if (targetMessageContent.interactiveMessage) {
                 finalStruct = {
                    viewOnceMessage: {
                        message: targetMessageContent
                    }
                 };
            }

            const customMsg = generateWAMessageFromContent(m.chat, finalStruct, { userJid: sock.user.id });
            await sock.relayMessage(m.chat, customMsg.message, { messageId: customMsg.key.id });
            
        } catch (e) {
            console.error(e);
            return sock.sendMessage(m.chat, { text: `[!] Gagal mengeksekusi payload: ${e.message}` }, { quoted: m });
        }
    }
};
