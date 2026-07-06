const fs = require('fs');

// Fungsi jeda biar bot nggak kena spam ban
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    command: ['testmsg', 'allmsg', 'tesfitur'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;

        await sock.sendMessage(from, { text: "[~] *Memulai Uji Coba Pengiriman Berbagai Tipe Pesan...*\nMohon tunggu, bot akan mengirimkan contoh satu per satu." }, { quoted: m });
        await delay(2000);

        // 1. TEKS BIASA
        await sock.sendMessage(from, { text: "1[i]⃣ *Teks Biasa*\nIni adalah teks murni tanpa embel-embel apa pun." });
        await delay(2000);

        // 2. FAKE REPLY CENTANG BIRU (VERIFIED) & DARI NOMOR 0 (WhatsApp)
        const fakeReply = { 
            key: { 
                fromMe: false, 
                participant: `0@s.whatsapp.net`, 
                ...(from ? { remoteJid: "status@broadcast" } : {}) 
            }, 
            message: { 
                contactMessage: { 
                    displayName: "WhatsApp Support", 
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:WA;Support;;;\nFN:WhatsApp Support\nitem1.TEL;waid=0:0\nitem1.X-ABLabel:Ponsel\nEND:VCARD` 
                } 
            } 
        };
        await sock.sendMessage(from, { 
            text: "2[i]⃣ *Fake Reply / Centang Biru*\nPesan ini membalas sistem asli WhatsApp (Cek pesan di atas pesan ini)." 
        }, { quoted: fakeReply });
        await delay(2000);

        // 3. PESAN DITERUSKAN (FORWARDED) BERKALI-KALI
        await sock.sendMessage(from, { 
            text: "3[i]⃣ *Pesan Diteruskan (Forwarded)*\nPesan ini memiliki tag 'Diteruskan berkali-kali' di atasnya.",
            contextInfo: { 
                isForwarded: true, 
                forwardingScore: 999 
            } 
        }, { quoted: m });
        await delay(2000);

        // 4. GAMBAR BIASA
        await sock.sendMessage(from, { 
            image: { url: "https://i.pinimg.com/1200x/43/d1/0e/43d10e9682884e579035380af0c4a12b.jpg" },
            caption: "4[i]⃣ *Gambar Biasa*\nPesan teks dengan gambar biasa."
        }, { quoted: m });
        await delay(2000);

        // 5. LOKASI
        await sock.sendMessage(from, { 
            location: { degreesLatitude: -6.2088, degreesLongitude: 106.8456 },
            caption: "5[i]⃣ *Pesan Lokasi*\nIni adalah koordinat Monas, Jakarta."
        });
        await delay(2000);

        // 6. KONTAK (VCARD)
        const vcard = 'BEGIN:VCARD\n' 
            + 'VERSION:3.0\n' 
            + 'FN:SBM Creator\n' 
            + 'ORG:Mie AI Bot;\n' 
            + 'TEL;type=CELL;type=VOICE;waid=6283809720392:+62 838-0972-0392\n' 
            + 'END:VCARD';
        await sock.sendMessage(from, { 
            contacts: { displayName: 'Creator Mie AI', contacts: [{ vcard }] } 
        });
        await sock.sendMessage(from, { text: "6[i]⃣ *Kontak / VCard*\nBisa langsung di-save oleh member."});
        await delay(2000);

        // 7. POLLING (VOTING)
        await sock.sendMessage(from, {
            poll: {
                name: "7[i]⃣ *Pesan Polling*\nApakah Mie AI ini keren?",
                values: ["Keren Banget!", "Biasa Aja", "Jelek"],
                selectableCount: 1
            }
        });
        await delay(2000);

        // 8. VOICENOTE (AUDIO PTT)
        // Kita menggunakan audio dummy dari url publik
        await sock.sendMessage(from, { text: "8[i]⃣ *Mengirim Voice Note (VN)*..." });
        try {
            await sock.sendMessage(from, { 
                audio: { url: 'https://files.catbox.moe/egb3w5.mp3' }, 
                mimetype: 'audio/mpeg', 
                ptt: true 
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(from, { text: "_(Gagal mengirim VN)_" });
        }
        await delay(2000);

        // 9. REACTION PESAN
        await sock.sendMessage(from, { react: { text: "[!]", key: m.key } });
        await sock.sendMessage(from, { text: "9[i]⃣ *Reaction Message*\nBot baru saja memberikan reaksi [!] pada pesan Anda yang memicu prompt ini."});
        await delay(2000);

        // 10. BUTTON STANDAR (Terkadang tidak muncul di WA versi terbaru tergantung rules WA)
        await sock.sendMessage(from, { text: "[!] *Mengirim pesan Button/Interactive*..." });
        try {
            const buttons = [
                { buttonId: 'id1', buttonText: { displayText: 'Tombol 1' }, type: 1 },
                { buttonId: 'id2', buttonText: { displayText: 'Tombol 2' }, type: 1 }
            ];
            const buttonMessage = {
                text: "Ini adalah tipe Button Message biasa! (Mungkin diblokir oleh WA Official terbaru UI)",
                footer: "Mie AI Bot",
                buttons: buttons,
                headerType: 1
            };
            await sock.sendMessage(from, buttonMessage);
        } catch (e) {
            // Ignored, WA strictness
        }

        await delay(1000);
        await sock.sendMessage(from, { text: "[i] *Sesi Demo Pesan Selesai!*\nSemua tipe pesan utama telah dikirimkan." });
    }
};
