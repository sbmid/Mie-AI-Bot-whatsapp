const axios = require('axios');
const rentOrders = require('../../lib/rent_orders');
const db = require('../../lib/database');

module.exports = {
    command: ['cekbayar', 'verifikasi'],
    handler: async (sock, m, { text, command, prefix }) => {
        // Cek pesanan yang ada dari sender ini
        const pendingOrders = rentOrders.getAllOrders();
        const userOrder = pendingOrders.find(o => o.sender === m.sender);

        if (!userOrder) {
            return sock.sendMessage(m.chat, { text: `[!] Anda tidak memiliki tagihan / pesanan sewa bot yang pending.` }, { quoted: m });
        }

        // Cek expire orderan, kalo lewat 30 menit (1800000ms), hapus
        if ((Date.now() - userOrder.timestamp) > 1800000) {
            rentOrders.removeOrder(m.sender);
            return sock.sendMessage(m.chat, { text: `[!] Pesanan Sewa Bot untuk grup *${userOrder.groupName}* telah *DIBATALKAN* secara otomatis karena batas waktu pembayaran (30 Menit) telah habis. Silakan pesan ulang.` }, { quoted: m });
        }

        await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

        try {
            const url = "https://anabot.my.id/api/tools/gopay/transactions?otp_token=3c294400-2c29-4456-83e9-4076b49d3286&from=0&size=20&apikey=freeApikey";
            const response = await axios.get(url, { headers: { "accept": "application/json" } });

            if (response.data && response.data.success && response.data.result && response.data.result.hits) {
                const hits = response.data.result.hits;

                const matchingTrx = hits.find(trx => {
                    if (trx.status !== 'success' || trx.type !== 'payin') return false;
                    
                    const realAmount = trx.metadata?.provider_metadata?.aspi?.data?.amount 
                                    || trx.metadata?.transaction?.real_gross_amount 
                                    || (trx.amount ? trx.amount / 100 : 0);
                    
                    return parseInt(realAmount) === parseInt(userOrder.nominal_total);
                });

                if (matchingTrx) {
                    console.log(`[SEWA PAYMENT SUCCESS] Menerima pembayaran Rp${userOrder.nominal_total} dari ${userOrder.sender} untuk grup ${userOrder.groupId}`);
                    
                    try {
                        // Join Grup
                        await sock.groupAcceptInvite(userOrder.inviteCode);
                        
                        // Konfirmasi Database Sewa
                        db.addSewa(userOrder.groupId, parseInt(userOrder.duration_days));
                        
                        // Info ke Pembeli User di PM
                        await sock.sendMessage(m.chat, { 
                            text: ` *PEMBAYARAN TERVERIFIKASI!*\n\nTerima kasih, pembayaran sebesar *Rp ${userOrder.nominal_total.toLocaleString('id-ID')}* telah masuk.\nBot telah otomatis masuk ke grup *${userOrder.groupName}*.\nMasa aktif: ${userOrder.duration_days} Hari.` 
                        }, { quoted: m });
                        
                        // Info ke Dalam Grup
                        await sock.sendMessage(userOrder.groupId, { 
                            text: `Halo Semua! [!]\nBot VEXELSOFT telah hadir di grup ini selama *${userOrder.duration_days} Hari* dengan status disewa oleh @${userOrder.sender.split('@')[0]} [!]`,
                            mentions: [userOrder.sender]
                        });
                        
                        // Hapus order dari antrian
                        rentOrders.removeOrder(userOrder.sender);
                        await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                    } catch (gErr) {
                        console.error('Gagal Eksekusi Join Grup/Kirim Pesan Polling:', gErr);
                        await sock.sendMessage(m.chat, { text: `[!] Pembayaran Rp ${userOrder.nominal_total.toLocaleString('id-ID')} terdeteksi, tetapi bot *gagal* masuk ke grup (Bisa jadi bot ditendang sebelumnya / link dicabut). Harap hubungi Owner!` }, { quoted: m });
                        rentOrders.removeOrder(userOrder.sender);
                        await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    }
                } else {
                    await sock.sendMessage(m.chat, { text: `[!] *Pembayaran Belum Masuk*\n\nSistem belum mendeteksi transfer sebesar *Rp ${userOrder.nominal_total.toLocaleString('id-ID')}* dari Anda.\nPastikan nominal transfer *persis hingga digit terakhir* dan tunggu 1-2 menit setelah transfer sebelum mengeklik tombol ini lagi.` }, { quoted: m });
                    await sock.sendMessage(m.chat, { react: { text: "[!][i]", key: m.key } });
                }
            } else {
                return sock.sendMessage(m.chat, { text: `[!] Sistem pengecekan mutasi sedang gangguan, silakan coba lagi nanti atau hubungi Owner.` }, { quoted: m });
            }
        } catch(err) {
            return sock.sendMessage(m.chat, { text: `[!] Terjadi kesalahan saat memeriksa GoPay. Silakan coba lagi.` }, { quoted: m });
        }
    }
};
