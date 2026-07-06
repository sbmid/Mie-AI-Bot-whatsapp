/**
 * TESTBTN3 — REPLIKA BUTTON SANTANUY V13
 * Menampilkan persis susunan dan payload button yang digunakan di script alipai-cmd.js
 */

const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

const delay = ms => new Promise(r => setTimeout(r, ms));

// Helper: contextInfo dengan Badge Bisnis & Label Saluran
const businessCtx = (mentions = []) => ({
    mentionedJid: mentions,
    isForwarded: true,
    forwardingScore: 9999,
    businessMessageForwardInfo: {
        businessOwnerJid: global.ownerNumber?.[0] || '6283809720392@s.whatsapp.net'
    },
    forwardedNewsletterMessageInfo: {
        newsletterName: 'Bot Mie AI',
        newsletterJid: '120363424104414634@newsletter'
    }
});

module.exports = {
    command: ['testbtn3', 'tb3'],
    isOwner: true,
    handler: async (sock, m, { prefix }) => {
        const from = m.chat;
        const sender = m.sender;
        const botJid = sock.user.id;

        await sock.sendMessage(from, { text: `🧪 *TESTBTN3 — REPLIKA SANTANUY V13*\n\n_Menampilkan susunan button yang dipakai di script alipai-cmd.js tanpa ada yang diubah!_\n\n⏳ Harap tunggu...` }, { quoted: m });
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 1: BUTTON MENU UTAMA
        // (Gabungan List Menu, Quick Reply Menu, dan Owner)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '1️⃣ *Tiruan: Menu Utama*' });
            await delay(800);

            const buttonsMenu = [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Pilih Menu",
                        sections: [{
                            title: "Menu Utama",
                            rows: [
                                { title: "Menu Bot", id: ".menu" },
                                { title: "Info Owner", id: ".owner" }
                            ]
                        }]
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "📋 Menu",
                        id: ".menu"
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "👑 Owner",
                        url: "https://wa.me/6283809720392",
                        merchant_url: "https://wa.me/6283809720392"
                    })
                }
            ];

            const msgMenu = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: 'Halo! Ini adalah contoh tampilan menu ala Santanuy.' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Santanuy Replica' }),
                            header: proto.Message.InteractiveMessage.Header.create({ title: 'MENU BOT', hasMediaAttachment: false }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttonsMenu })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });
            await sock.relayMessage(from, msgMenu.message, { messageId: msgMenu.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 2: BUTTON COPY & URL
        // (Biasanya dipakai untuk info ID Grup, Intro, atau Sosmed)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '2️⃣ *Tiruan: Copy ID & Buka Link*' });
            await delay(800);

            const buttonsCopy = [
                {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({ display_text: "SALIN ID", id: "copy_group_id", copy_code: "1234567890@g.us" })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({ display_text: "Saluran Info", url: "https://whatsapp.com/channel/0029VadMvB7BFLAQZ3c7qT2K", merchant_url: "https://whatsapp.com/channel/0029VadMvB7BFLAQZ3c7qT2K" })
                }
            ];

            const msgCopy = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: 'Grup ID: 1234567890@g.us\nSilakan salin ID grup ini.' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Santanuy Replica' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttonsCopy })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });
            await sock.relayMessage(from, msgCopy.message, { messageId: msgCopy.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 3: BUTTON MODERASI GRUP
        // (Kick Member, List Menu Atur Grup)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '3️⃣ *Tiruan: Moderasi Grup (Atur / Kick)*' });
            await delay(800);

            const buttonsMod = [
                {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Klik Untuk Atur Grup",
                        sections: [{
                            title: "Pengaturan Grup",
                            rows: [
                                { title: "Tutup Grup", id: ".group close" },
                                { title: "Buka Grup", id: ".group open" }
                            ]
                        }]
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "💀 Kick Semua Member",
                        id: ".kudeta kick yes"
                    })
                }
            ];

            const msgMod = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: 'Peringatan: Menu ini hanya untuk admin.' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Santanuy Replica' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttonsMod })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });
            await sock.relayMessage(from, msgMod.message, { messageId: msgMod.key.id });
        } catch (e) { console.error(e); }
        await delay(2000);

        // ════════════════════════════════════════════════════
        // TEST 4: BUTTON STORE / BELI & CHAT
        // (Beli Sekarang & Kirim Pesan wa.me)
        // ════════════════════════════════════════════════════
        try {
            await sock.sendMessage(from, { text: '4️⃣ *Tiruan: Store (Beli & Kirim Pesan)*' });
            await delay(800);

            const buttonsStore = [
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🛒 BELI SEKARANG",
                        url: "https://wa.me/6283809720392",
                        merchant_url: "https://wa.me/6283809720392"
                    })
                },
                {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                        display_text: "Kirim Pesan",
                        url: "https://wa.me/6283809720392",
                        merchant_url: "https://wa.me/6283809720392"
                    })
                }
            ];

            const msgStore = await generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            body: proto.Message.InteractiveMessage.Body.create({ text: 'Produk Premium. Klik di bawah untuk order langsung ke nomor owner.' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Santanuy Replica' }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({ buttons: buttonsStore })
                        })
                    }
                }
            }, { userJid: botJid, quoted: m });
            await sock.relayMessage(from, msgStore.message, { messageId: msgStore.key.id });
        } catch (e) { console.error(e); }

        await delay(1500);
        await sock.sendMessage(from, { text: '✅ Selesai menampilkan tiruan button Santanuy!' }, { quoted: m });
    }
};
