module.exports = {
    command: ['shoptest', 'st'],
    category: ['owner'],
    description: 'Test fitur pesan dengan metadata Shop/Commerce',
    
    handler: async (sock, m, { args, prefix }) => {
        const isOwner = global.ownerNumber &&
            global.ownerNumber.some(o =>
                m.sender === o || m.sender.startsWith(o.split('@')[0])
            );
        if (!isOwner) {
            return sock.sendMessage(m.chat, { text: 'Perintah ini khusus Owner.' }, { quoted: m });
        }

        const mode = args[0]?.toLowerCase() || 'menu';

        if (mode === 'menu') {
            const menu = `*Shop & UI Tester*
Test jenis pesan dengan attachment Shop Surface dan Carousel.

Gunakan: ${prefix}shoptest <mode>

*Mode yang tersedia:*
1. text - Pesan teks dengan shop
2. image - Pesan gambar dengan shop
3. video - Pesan video dengan shop
4. document - Pesan dokumen dengan shop
5. location - Pesan lokasi dengan shop
6. product - Pesan product dengan shop
7. cards - Pesan Carousel/Katalog Geser
8. buttons - Pesan Tombol Biasa (Native Flow)`;
            return sock.sendMessage(m.chat, { text: menu }, { quoted: m });
        }

        // Data objek toko yang disisipkan
        const shopData = {
            surface: 1, // 1 = Buka URL eksternal, 2/3/4 = Katalog WA Native
            id: 'https://wa.me/c/62800000000' // URL Toko / ID Katalog
        };

        if (mode === 'text') {
            await sock.sendMessage(m.chat, {      
               text: 'Halo! Ini pesan *Teks* dengan fitur Shop bawaan dari WhatsApp.',
               title: 'Toko Mie AI', 
               subtitle: 'Layanan Bot WhatsApp Terpercaya', 
               footer: 'Powered by Baileys',
               shop: shopData, 
               viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'image') {
            await sock.sendMessage(m.chat, { 
               image: { url: 'https://files.catbox.moe/ea93uf.png' },    
               caption: 'Ini pesan *Gambar* dengan fitur Shop.',
               title: 'Gambar Pemandangan', 
               subtitle: 'Keren kan?', 
               footer: 'Powered by Baileys',
               shop: shopData, 
               hasMediaAttachment: true,
               viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'video') {
            await sock.sendMessage(m.chat, { 
               video: { url: 'https://files.catbox.moe/97a54q.mp4' },    
               caption: 'Ini pesan *Video* dengan fitur Shop.',
               title: 'Video Demo', 
               subtitle: 'Klik tombol di bawah', 
               footer: 'Powered by Baileys',
               shop: shopData, 
               hasMediaAttachment: true,
               viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'document') {
            await sock.sendMessage(m.chat, {
                document: { url: 'https://files.catbox.moe/ea93uf.png' }, 
                mimetype: 'image/jpeg', 
                fileName: 'MieAI_Banner.jpg',
                caption: 'Ini pesan *Dokumen* dengan fitur Shop.',
                title: 'Dokumen Penting',
                subtitle: 'Silakan didownload', 
                footer: 'Powered by Baileys',
                shop: shopData, 
                hasMediaAttachment: true, 
                viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'location') {
            await sock.sendMessage(m.chat, { 
               location: {
                 degreesLatitude: -6.200000, 
                 degreesLongitude: 106.816666,
                 name: 'Jakarta, Indonesia'
               },    
               caption: 'Ini pesan *Lokasi* dengan fitur Shop.',
               title: 'Lokasi Kami', 
               subtitle: 'Mampir yuk', 
               footer: 'Powered by Baileys',
               shop: shopData, 
               hasMediaAttachment: false,
               viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'product') {
            await sock.sendMessage(m.chat, {
                product: {
                    productImage: { url: 'https://files.catbox.moe/0jxxwb.png' },
                    productId: '999999',
                    title: 'Produk Contoh',
                    description: 'Deskripsi panjang produk contoh ini',
                    currencyCode: 'IDR',
                    priceAmount1000: '15000000',
                    retailerId: 'mie_ai_store',
                    url: 'https://wa.me/c/62800000000',
                    productImageCount: 1
                },
                businessOwnerJid: m.sender,
                caption: 'Ini pesan *Product* (katalog) dengan fitur Shop.',
                title: 'Katalog Mie AI', 
                subtitle: 'Lihat koleksi kami', 
                footer: 'Powered by Baileys',
                shop: shopData, 
                hasMediaAttachment: true,
                viewOnce: true
            }, { quoted: m });
        }
        else if (mode === 'cards') {
            await sock.sendMessage(m.chat, {
                // Hapus root text/footer jika tidak perlu, atau biarkan kosong agar persis seperti gambar
                text: '',
                cards: [
                    {
                        image: { url: 'https://files.catbox.moe/ea93uf.png' },
                        title: '✨ Slide',
                        body: '🖼 Slide ke - 1',
                        footer: 'MIE AI BOT',
                        buttons: [
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka di TikTok', url: 'https://tiktok.com' }) }
                        ]
                    },
                    {
                        image: { url: 'https://files.catbox.moe/0jxxwb.png' },
                        title: '✨ Slide',
                        body: '🖼 Slide ke - 2',
                        footer: 'MIE AI BOT',
                        buttons: [
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Buka di TikTok', url: 'https://tiktok.com' }) }
                        ]
                    }
                ],
                viewOnce: true,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363222395675670@newsletter',
                        serverMessageId: -1,
                        newsletterName: 'MIE AI Bot'
                    }
                }
            }, { quoted: m });
        }
        else if (mode === 'buttons') {
            await sock.sendMessage(m.chat, {
                text: '🔘 *NATIVE FLOW BUTTONS*\n\nIni adalah contoh tombol interaktif biasa (tidak geser ke samping). Sering disebut Native Flow.',
                footer: 'Interactive Message',
                interactiveButtons: [
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Menu Utama', id: 'menu' }) },
                    { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Info Bot', id: 'info' }) },
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Website Kami', url: 'https://github.com' }) }
                ],
                viewOnce: true,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true
                }
            }, { quoted: m });
        } else {
            return sock.sendMessage(m.chat, { text: 'Mode tidak dikenali. Ketik .shoptest untuk melihat menu.' }, { quoted: m });
        }
    }
};
