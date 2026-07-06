const { proto, generateWAMessageFromContent, generateWAMessageContent } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['carouseltest', 'ct'],
    category: ['owner'],
    description: 'Test pesan Carousel Raw Protobuf (100% Tembus Mobile)',
    
    handler: async (sock, m, { args, prefix }) => {
        const isOwner = global.ownerNumber &&
            global.ownerNumber.some(o =>
                m.sender === o || m.sender.startsWith(o.split('@')[0])
            );
        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: 'Perintah ini khusus Owner.' }, { quoted: m });
        }

        await sock.sendMessage(m.chat, { text: '*_`Mempersiapkan UI Carousel Raw Protobuf...`_*' }, { quoted: m });

        try {
            const cards = [];
            
            // Array gambar yang akan dibuat carousel
            const images = [
                'https://files.catbox.moe/ea93uf.png',
                'https://files.catbox.moe/0jxxwb.png'
            ];

            let no = 1;
            for (const imgUrl of images) {
                // 1. Upload media ke WA server via CDN (WAJIB untuk Raw Protobuf)
                const imageMessage = (
                    await generateWAMessageContent(
                        { image: { url: imgUrl } },
                        { upload: sock.waUploadToServer }
                    )
                ).imageMessage;

                // 2. Bentuk objek Card
                cards.push({
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `🖼 Slide ke - ${no++}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: 'MIE AI BOT'
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: '✨ Slide',
                        hasMediaAttachment: true,
                        imageMessage
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'Buka di TikTok',
                                    url: `https://tiktok.com`
                                })
                            }
                        ]
                    })
                });
            }

            // 3. Merakit pesan interaktif utama (Container)
            const msg = generateWAMessageFromContent(
                m.chat,
                {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                // Root body bisa dibuat kosong seperti di gambar, atau diisi teks
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: `*✅ HASIL CAROUSEL TEST*\n\nIni dibuat dengan menggunakan Raw Protobuf persis seperti di jagoanproject.`
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: 'Powered by MIE AI'
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards
                                })
                            })
                        }
                    }
                },
                {}
            );

            // 4. Paksa kirim pesan yang sudah dirakit menggunakan relayMessage
            await sock.relayMessage(
                m.chat,
                msg.message,
                { messageId: msg.key.id }
            );

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.chat, { text: `❌ Terjadi kesalahan:\n\n${e.message}` }, { quoted: m });
        }
    }
};
