module.exports = {
    command: ['setbot', 'setsystem'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.chat;
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));

        if (!isOwner) return sock.sendMessage(from, { text: "[!] Fitur ini khusus Owner!" }, { quoted: m });

        const fiturList = [
            "autotyping", // 1
            "autoread",   // 2
            "readsw",     // 3
            "pconly",     // 4
            "gconly",     // 5
            "anticall"    // 6
        ];

        const action = args[0] ? args[0].toLowerCase() : '';
        
        if (action !== 'on' && action !== 'off') {
            let teks = `[i] *SYSTEM SETTINGS*\n\n`;
            
            fiturList.forEach((key, index) => {
                const status = global[key] ? "ON [i]" : "OFF [!]";
                teks += `[${index + 1}] ${key} : *${status}*\n`;
            });

            teks += `\n*Cara Penggunaan:*`;
            teks += `\n> ${prefix + command} on <nomor>`;
            teks += `\n> ${prefix + command} off <nomor>`;
            teks += `\n\n*Contoh:*`;
            teks += `\n> ${prefix + command} on 1`;
            teks += `\n> ${prefix + command} off 1 2 4`;
            
            return sock.sendMessage(from, { text: teks }, { quoted: m });
        }

        const indexes = args.slice(1); 
        if (indexes.length === 0) {
            return sock.sendMessage(from, { text: `*[?]* Masukkan nomor fitur!\nContoh: *${prefix + command} ${action} 1 2*` }, { quoted: m });
        }

        const isEnable = action === 'on'; 
        
        // Memastikan pointer ke objek ada
        const dbData = global.db.read();
        if (!dbData.settings) dbData.settings = {};
        if (!dbData.settings.bot) dbData.settings.bot = {};

        const success = [];
        const failed = [];

        for (const strIndex of indexes) {
            const i = parseInt(strIndex) - 1; 
            const key = fiturList[i];

            if (!key) {
                failed.push(strIndex); 
                continue;
            }

            // --- SPESIAL GUARD UNTUK PCONLY/GCONLY ---
            if (isEnable && key === 'pconly') {
                global.gconly = false;
                dbData.settings.bot['gconly'] = false;
            } else if (isEnable && key === 'gconly') {
                global.pconly = false;
                dbData.settings.bot['pconly'] = false;
            }

            // Terapkan ke Global agar seketika berlaku
            global[key] = isEnable;
            
            // Simpan ke Cache DB setting
            dbData.settings.bot[key] = isEnable;
            success.push(key);
        }

        // Auto Save ke local db 
        if (global.db && global.db.saveAll) global.db.saveAll();

        let msg = `[i] *SYSTEM UPDATE*\n\n`;
        if (success.length > 0) {
            msg += `Berhasil di *${action.toUpperCase()}*:\n- ${success.join('\n- ')}\n`;
        }
        if (failed.length > 0) {
            msg += `\nGagal/Tidak Valid:\n- ${failed.join(', ')}`;
        }

        return sock.sendMessage(from, { text: msg }, { quoted: m });
    }
};
