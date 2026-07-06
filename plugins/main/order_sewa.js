const db = require('../../lib/database');
const rentOrders = require('../../lib/rent_orders');

// Fungsi Kalkulasi Pembuatan QRIS
function calculateCRC(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
}

function createDynamicQRIS(qrisStatic, amount) {
    if (!qrisStatic) return '';
    let nominal = amount.toString();
    let qris = qrisStatic.slice(0, -8);
    qris = qris.replace("010211", "010212");
    
    let amountTag = "54" + nominal.length.toString().padStart(2, '0') + nominal;
    let tag58Index = qris.indexOf("5802ID");
    if (tag58Index !== -1) {
        qris = qris.substring(0, tag58Index) + amountTag + qris.substring(tag58Index);
    } else {
        qris += amountTag;
    }
    
    qris += "6304";
    let crc = calculateCRC(qris);
    return qris + crc;
}

module.exports = {
    command: ['sewa'],
    handler: async (sock, m, { text, command, prefix }) => {
        if (!text) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *Pemesanan Sewa Bot*\n\nSilakan tentukan durasi dan kirim link grup yang ingin dimasukkan bot.\n\n*Format:* ${prefix + command} <jumlah_hari> <link_grup>\n*Contoh:* ${prefix + command} 30 https://chat.whatsapp.com/xxxxxx` 
            }, { quoted: m });
        }

        // Parse argumen (contoh: "30d https://..." atau "30 https://...")
        const args = text.split(/\s+/);
        let durationRaw = args[0].replace('d', '').replace('hari', '');
        let days = parseInt(durationRaw);

        if (isNaN(days) || days < 1) {
            return sock.sendMessage(m.chat, { text: `[!] Durasi hari tidak valid. Mohon isi dengan angka (contoh: 30 atau 30d)` }, { quoted: m });
        }

        let linkUrl = args.find(a => a.includes('chat.whatsapp.com'));
        if (!linkUrl) {
            return sock.sendMessage(m.chat, { text: `[!] Link Grup WhatsApp tidak ditemukan atau tidak valid!\nPastikan Anda mengirim link lengkap (diawali https://chat.whatsapp.com/)` }, { quoted: m });
        }

        try {
            // Validasi link ke WhatsApp API
            const inviteCode = linkUrl.split('chat.whatsapp.com/')[1].split('?')[0];
            const groupInfo = await sock.groupGetInviteInfo(inviteCode);
            if (!groupInfo) throw new Error("Link Kadaluarsa atau Bot Tidak punya akses.");

            // Ambil harga dasar 30 hari
            const settings = db.getBotSettings();
            const basePrice = settings.sewa_harga_base || 5000;

            // Kalkulasi Harga (Pro-rata harian)
            const pricePerDay = basePrice / 30;
            const subtotal = Math.ceil(pricePerDay * days);

            // Tambahkan Kode Unik agar pembayaran otomatis terverifikasi
            const uniqueCode = rentOrders.getNextUniqueCode(); // 1 - 300
            const totalBill = subtotal + uniqueCode;

            const qrisStatic = "00020101021126610014COM.GO-JEK.WWW01189360091430737439420210G0737439420303UMI51440014ID.CO.QRIS.WWW0215ID10253825085270303UMI5204549953033605802ID5907SBMshop6013LAMPUNG TIMUR61053438162070703A016304ACB2";
            const qrisPayload = createDynamicQRIS(qrisStatic, totalBill);
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrisPayload)}`;

            // Simpan Order Menunggu Pembayaran
            rentOrders.addOrder({
                sender: m.sender,
                inviteCode: inviteCode,
                groupId: groupInfo.id,
                groupName: groupInfo.subject,
                duration_days: days,
                nominal_total: totalBill,
                status: 'pending',
                timestamp: Date.now()
            });

            const templateMsg = `* KONFIRMASI PEMESANAN SEWA BOT*\n\n`
                + `Halo, pesanan sewa Anda siap diproses dengan rincian:\n\n`
                + `[!] *Grup Tujuan:* ${groupInfo.subject}\n`
                + `[~] *Durasi:* ${days} Hari\n`
                + `[!] *Harga Normal:* Rp ${subtotal.toLocaleString('id-ID')}\n`
                + `[!] *Kode Unik:* ${uniqueCode}\n\n`
                + `[!] *TOTAL TRANSFER:* *Rp ${totalBill.toLocaleString('id-ID')}*\n\n`
                + `_Harap transfer TEPAT SESUAI *Total Transfer* (hingga digit terakhir) agar pesanan Anda dapat diproses oleh sistem._\n\n`
                + `*Cara Bayar:*\n1. Scan QRIS di gambar ini menggunakan DANA/OVO/GoPay/LinkAja/ShopeePay/M-Banking.\n`
                + `2. Tunggu 1 hingga 2 Menit.\n`
                + `3. Bot akan otomatis bergabung ke dalam grup Anda ketika bayaran terverifikasi.\n\n`
                + `[!] *Batas Waktu Pembayaran: 30 Menit.*\n\n`
                + `[!] *PENTING:* Setelah mentransfer dana, jika tidak ada tombol verifikasi yang muncul, silakan balas pesan ini secara manual dengan mengetik: *.cekbayar*`;

            // Kalau dieksekusi di grup, arahkan ke PM.
            const isGroup = m.chat.endsWith('@g.us');
            const targetChat = m.sender; // Selalu kirim QRIS ke PM pendaftar

            if (isGroup) {
                await sock.sendMessage(m.chat, { 
                    text: `[i] *Pesanan Dibuat!*\n\nDetail QRIS dan petunjuk pembayaran telah dikirim ke *Chat Pribadi (PM)* Anda.\nSilakan cek pesan dari bot untuk melakukan pembayaran dan verifikasi agar tidak diklik oleh anggota lain di grup.` 
                }, { quoted: m });
            }

            // Kirim Image QRIS ke PM
            const sentImg = await sock.sendMessage(targetChat, { 
                image: { url: qrImageUrl }, 
                caption: templateMsg 
            });

            // Kirim Tombol Verifikasi ke PM
            const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
            const interactiveMsg = generateWAMessageFromContent(targetChat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: "Setelah melakukan transfer, silakan klik tombol di bawah ini atau balas pesan ini secara manual dengan mengetik *.cekbayar* untuk memverifikasi pembayaran Anda."
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: "Sistem Otomatis Sewa Bot"
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: "[!]*[?]* Verifikasi Pembayaran",
                                subtitle: "",
                                hasMediaAttachment: false
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "[i] Cek Pembayaran",
                                            id: ".cekbayar"
                                        })
                                    }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id, quoted: sentImg });

            await sock.relayMessage(targetChat, interactiveMsg.message, { messageId: interactiveMsg.key.id });

        } catch (e) {
            console.error(e);
            sock.sendMessage(m.chat, { text: `[!] Gagal memproses pesanan. Pastikan link grup masih aktif atau coba beberapa saat lagi.` }, { quoted: m });
        }
    }
};
