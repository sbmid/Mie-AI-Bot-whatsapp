/**
 * Mie AI - PC Guard System (Fixed Version)
 * Berfungsi untuk membatasi akses Private Chat berdasarkan Level & Limit.
 */
module.exports = async (sock, m) => {
    // --- 🛡️ PENGAMAN DATABASE ---
    if (!global.db) return false;

    // Ambil data terbaru pake fungsi .read()
    const data = global.db.read();
    const user = global.db.getUser(m.sender);

    // Inisialisasi laci settings kalau belum ada
    if (!data.settings) data.settings = {};
    if (!data.settings[sock.user.jid]) {
        data.settings[sock.user.jid] = { publicModePC: false };
    }

    const botSettings = data.settings[sock.user.jid];
    const isGroup = m.isGroup;
    const isOwner = global.ownerNumber.includes(m.sender);

    // Jika user belum terdaftar, jangan diproses pcGuard-nya
    if (!user) return false;

    // 1. Abaikan proteksi jika di Grup atau Owner
    if (isGroup || isOwner) return false;

    // 2. Cek Mode PC (Global Switch)
    if (!botSettings.publicModePC) {
        await sock.sendMessage(m.chat, { text: "❌ Mie AI lagi istirahat dari chat pribadi, Bestie. Ngobrol di grup aja yuk!" }, { quoted: m });
        return true; 
    }

    // 3. Cek Minimal Level
    if (user.level < 5) {
        await sock.sendMessage(m.chat, { text: `⚠️ Kamu butuh minimal *Level 5* buat chat privat.\nLevel kamu sekarang: *${user.level}*` }, { quoted: m });
        return true;
    }

    // 4. Sistem Limit & Penalti Level Down
    if (!user.pcLimit) user.pcLimit = 5; 
    user.pcLimit -= 1;

    // Simpan perubahan limit ke database
    if(global.db && global.db.saveAll) global.db.saveAll();

    if (user.pcLimit <= 0) {
        user.level = Math.max(0, user.level - 1); 
        user.pcLimit = 5; 
        
        // Simpan perubahan level
        if(global.db && global.db.saveAll) global.db.saveAll();
        
        await sock.sendMessage(m.chat, { 
            text: `📉 *LEVEL DOWN!* Jatah chat privat kamu habis.\nLevel kamu turun menjadi *${user.level}*.` 
        }, { quoted: m });

        if (user.level <= 0) {
            user.level = 0;
            if(global.db && global.db.saveAll) global.db.saveAll();
            await sock.sendMessage(m.chat, { text: "💀 Level kamu habis! Kamu dilarang chat privat sampai naik level lagi di grup." });
            return true;
        }
    }

    return false; 
};