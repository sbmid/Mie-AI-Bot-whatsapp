module.exports = {
    command: ['timergc', 'autotutup', 'autobuka'],
    category: ['group'],
    admin: true,
    handler: async (sock, m, { args, prefix, command }) => {
        if (!m.isGroup) return sock.sendMessage(m.chat, { text: `[!] Fitur ini khusus digunakan di dalam grup!` }, { quoted: m });
        
        // Pengecekan argumen dasar
        if (args.length < 2) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *Auto Buka/Tutup Grup*\n\nBerfungsi mengatur waktu mundur untuk mengubah setelan grup secara otomatis.\n\nContoh Penggunaan:\n- *${prefix + command} tutup 30m* (Grup ditutup 30 menit kemudian)\n- *${prefix + command} buka 1h* (Grup dibuka 1 jam kemudian)\n\nFormat Waktu: *s* (detik), *m* (menit), *h* (jam)` 
            }, { quoted: m });
        }

        const aksi = args[0].toLowerCase();
        if (aksi !== 'buka' && aksi !== 'tutup') {
            return sock.sendMessage(m.chat, { text: `[!] Pilih aksi yang tersedia: *buka* atau *tutup*` }, { quoted: m });
        }

        const waktuRaw = args[1];
        let ms = 0;
        
        if (waktuRaw.endsWith('s')) ms = parseInt(waktuRaw) * 1000;
        else if (waktuRaw.endsWith('m')) ms = parseInt(waktuRaw) * 60000;
        else if (waktuRaw.endsWith('h')) ms = parseInt(waktuRaw) * 3600000;
        else ms = parseInt(waktuRaw) * 60000; // Default diatur ke menit

        if (isNaN(ms) || ms <= 0) {
            return sock.sendMessage(m.chat, { text: `[!] Format waktu salah! Gunakan format angka dan huruf (Contoh: 10m)` }, { quoted: m });
        }

        // Konfirmasi
        await sock.sendMessage(m.chat, { 
            text: `[i] *Timer Aktif!*\n\nSistem akan otomatis me*${aksi === 'tutup' ? 'nutup' : 'mbuka'}* grup ini dalam waktu *${args[1]}*.` 
        }, { quoted: m });

        // Start jalankan timer berjalan di background
        setTimeout(async () => {
            const actionSetting = aksi === 'tutup' ? 'announcement' : 'not_announcement';
            try {
                // Eksekusi buka/tutup grup
                await sock.groupSettingUpdate(m.chat, actionSetting);
                await sock.sendMessage(m.chat, { 
                    text: ` *WAKTUNYA TIBA!*\n\nGrup telah berhasil di${aksi} secara otomatis oleh sistem Bot sesuai jadwal.` 
                });
            } catch (err) {
                console.error("TimerGC Error:", err);
                await sock.sendMessage(m.chat, { 
                    text: `[!] Bot gagal mengubah setelan grup. Pastikan bot memiliki hak akses Admin Grup!` 
                });
            }
        }, ms);
    }
};
