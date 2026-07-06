const axios = require('axios');
const rentOrders = require('./rent_orders');
const db = require('./database');

async function checkGopayApi(sock) {
    if (!sock) return;

    const pendingOrders = rentOrders.getAllOrders();
    if (pendingOrders.length === 0) return; // Tidak ada yang dicek

    try {
        const url = "https://anabot.my.id/api/tools/gopay/transactions?otp_token=3c294400-2c29-4456-83e9-4076b49d3286&from=0&size=20&apikey=freeApikey";
        const response = await axios.get(url, { headers: { "accept": "application/json" } });

        if (response.data && response.data.success && response.data.result && response.data.result.hits) {
            const hits = response.data.result.hits;

            for (let order of pendingOrders) {
                // Coba cari mutasi payin, success, dan nominal sesuai dengan order
                const matchingTrx = hits.find(trx => {
                    if (trx.status !== 'success' || trx.type !== 'payin') return false;

                    const realAmount = trx.metadata?.provider_metadata?.aspi?.data?.amount
                        || trx.metadata?.transaction?.real_gross_amount
                        || (trx.amount ? trx.amount / 100 : 0);

                    // Transaksi sukses jika nominal persis sama dengan totalBill yang di pesan user
                    return parseInt(realAmount) === parseInt(order.nominal_total);
                });

                if (matchingTrx) {
                    console.log(`[SEWA PAYMENT SUCCESS] Menerima pembayaran Rp${order.nominal_total} dari ${order.sender} untuk grup ${order.groupId}`);

                    try {
                        // Join Grup
                        await sock.groupAcceptInvite(order.inviteCode);

                        // Konfirmasi Database Sewa
                        db.addSewa(order.groupId, parseInt(order.duration_days));

                        // Info ke Pembeli User
                        await sock.sendMessage(order.sender, {
                            text: `🎉 *PEMBAYARAN TERVERIFIKASI!*\n\nTerima kasih, pembayaran sebesar *Rp ${order.nominal_total.toLocaleString('id-ID')}* telah masuk.\nBot telah otomatis masuk ke grup *${order.groupName}*.\nMasa aktif: ${order.duration_days} Hari.`
                        });

                        // Info ke Dalam Grup
                        await sock.sendMessage(order.groupId, {
                            text: `Halo Semua! 👋\nBot telah hadir di grup ini selama *${order.duration_days} Hari* dengan status disewa oleh @${order.sender.split('@')[0]} 😎`,
                            mentions: [order.sender]
                        });

                        // Hapus order dari antrian
                        rentOrders.removeOrder(order.sender);

                    } catch (gErr) {
                        console.error('Gagal Eksekusi Join Grup/Kirim Pesan Polling:', gErr);
                        await sock.sendMessage(order.sender, { text: `⚠️ Pembayaran Rp ${order.nominal_total} terdeteksi, tetapi bot *gagal* masuk ke grup (Bisa jadi bot ditendang sebelumnya / link dicabut). Harap hubungi Owner!` });
                        // Tetap hapus agar tidak melooping terus
                        rentOrders.removeOrder(order.sender);
                    }
                } else {
                    // Cek expire orderan, misal lewat dari 30 menit / 1800000ms kita hapus
                    if ((Date.now() - order.timestamp) > 1800000) {
                        rentOrders.removeOrder(order.sender);
                        sock.sendMessage(order.sender, { text: `⚠️ Pesanan Sewa Bot untuk *${order.groupName}* telah *DIBATALKAN* secara otomatis karena batas waktu pembayaran (30 Menit) telah habis.` });
                    }
                }
            }
        }
    } catch (err) {
        // Cukup biarkan jika timeout atau API Gagal
    }
}

// Inisialisasi cron polling sederhana
function startPolling(sock) {
    console.log("🟢 [GOPAY] Auto Polling Payment Checker Start...");
    // Jalankan pengecekan setiap 60 detik (1 Menit)
    setInterval(() => {
        checkGopayApi(sock);
    }, 60000);
}

module.exports = { startPolling, checkGopayApi };
