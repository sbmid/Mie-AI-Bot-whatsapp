const axios = require('axios');

module.exports = {
    command: ['cekgopay', 'mutasi'],
    handler: async (sock, m, { text, command, prefix }) => {
        // Cek apakah pengirim adalah owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(m.chat, { text: `[!] Fitur ini khusus Owner!` }, { quoted: m });

        await sock.sendMessage(m.chat, { text: `[~] Sedang mengambil data mutasi GoPay...` }, { quoted: m });

        try {
            const url = "https://anabot.my.id/api/tools/gopay/transactions?otp_token=3c294400-2c29-4456-83e9-4076b49d3286&from=0&size=20&apikey=freeApikey";
            const response = await axios.get(url, {
                headers: { "accept": "application/json" }
            });

            if (response.data && response.data.success && response.data.result && response.data.result.hits) {
                const hits = response.data.result.hits;
                
                if (hits.length === 0) {
                    return sock.sendMessage(m.chat, { text: `[!] Tidak ada transaksi yang ditemukan.` }, { quoted: m });
                }

                let msg = `*[!] DATA MUTASI GOPAY TERCATAT*\n\n`;
                
                // Menampilkan maksimal 10 transaksi terakhir
                hits.slice(0, 10).forEach((trx, i) => {
                    // Ambil nominal asli dari aspi data atau format dari gross amount
                    const realAmount = trx.metadata?.provider_metadata?.aspi?.data?.amount 
                                       || trx.metadata?.transaction?.real_gross_amount 
                                       || (trx.amount ? trx.amount / 100 : 0);
                                       
                    const date = new Date(trx.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
                    const status = trx.status === 'success' ? '[i] SUCCESS' : `[!] ${trx.status.toUpperCase()}`;
                    const type = trx.type === 'payin' ? 'Masuk' : 'Keluar';
                    const qrisIssuer = trx.metadata?.provider_metadata?.aspi?.issuer || trx.metadata?.issuer || 'Unknown';
                    const reference = trx.id;

                    msg += `*${i + 1}. Transaksi ${type}*\n`;
                    msg += `[!] *Nominal:* Rp ${realAmount.toLocaleString('id-ID')}\n`;
                    msg += ` *Metode:* QRIS (${qrisIssuer})\n`;
                    msg += `[!] *Waktu:* ${date}\n`;
                    msg += `[!] *Status:* ${status}\n`;
                    msg += `[!] *Ref ID:* ${reference}\n`;
                    msg += `---------------------------------------\n`;
                });

                msg += `\n_Menampilkan 10 transaksi terakhir. Gunakan api key di source code untuk mengubah limit atau query._\n`;
                await sock.sendMessage(m.chat, { text: msg }, { quoted: m });
            } else {
                return sock.sendMessage(m.chat, { text: `[!] Gagal memproses data mutasi atau tidak ada data yang tersedia dari API.` }, { quoted: m });
            }
        } catch (error) {
            console.error('Error fetching gopay data:', error);
            sock.sendMessage(m.chat, { text: `[!] Terjadi kesalahan saat memproses API: ${error.message}` }, { quoted: m });
        }
    }
};
