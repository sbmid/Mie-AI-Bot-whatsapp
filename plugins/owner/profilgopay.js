const axios = require('axios');

module.exports = {
    command: ['profilgopay', 'infogopay'],
    handler: async (sock, m, { text, command, prefix }) => {
        // Cek apakah pengirim adalah owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(m.chat, { text: `[!] Fitur ini khusus Owner!` }, { quoted: m });

        await sock.sendMessage(m.chat, { text: `[~] Sedang mengambil data profil GoPay Merchant...` }, { quoted: m });

        try {
            const url = "https://anabot.my.id/api/tools/gopay/profile?otp_token=3c294400-2c29-4456-83e9-4076b49d3286&apikey=freeApikey";
            const response = await axios.get(url, {
                headers: { "accept": "application/json" }
            });

            if (response.data && response.data.success && response.data.result && response.data.result.hits && response.data.result.hits.length > 0) {
                const profile = response.data.result.hits[0];
                
                let msg = `*[!] PROFIL MERCHANT GOPAY*\n\n`;
                msg += `[i] *Nama Merchant:* ${profile.merchant_name || '-'}\n`;
                msg += ` *Outlet:* ${profile.outlet_name || '-'}\n`;
                msg += `[!] *Kota Outlet:* ${profile.outlet_city || '-'}\n`;
                msg += `[!] *Telepon:* ${profile.phone || '-'}\n`;
                msg += `[!] *Email:* ${profile.email || '-'}\n`;
                msg += ` *Tipe Bisnis:* ${profile.business_type || '-'}\n\n`;
                
                if (profile.bank_account) {
                    msg += `* INFO REKENING PENCAIRAN*\n`;
                    msg += `[i] *Bank:* ${profile.bank_account.bank_name || '-'}\n`;
                    msg += `[!] *A/N:* ${profile.bank_account.account_name || '-'}\n`;
                    msg += `[!] *No. Rekening:* ${profile.bank_account.account_no || '-'}\n`;
                    msg += `[i] *Status Valid:* ${profile.bank_account.validated ? 'Ya / Disetujui' : 'Tidak'}\n`;
                }

                await sock.sendMessage(m.chat, { text: msg }, { quoted: m });
            } else {
                return sock.sendMessage(m.chat, { text: `[!] Gagal mengambil data profil atau akun tidak ditemukan.` }, { quoted: m });
            }
        } catch (error) {
            console.error('Error fetching gopay profile:', error);
            sock.sendMessage(m.chat, { text: `[!] Terjadi kesalahan saat memproses API: ${error.message}` }, { quoted: m });
        }
    }
};
