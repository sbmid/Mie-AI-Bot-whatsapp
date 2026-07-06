module.exports = {
    command: ['getdb', 'backupdb', 'backup'],
    handler: async (sock, m, { prefix, command }) => {
        const sender = m.sender || m.key.remoteJid;
        const isOwner = global.ownerNumber.includes(sender);

        if (!isOwner) {
            return sock.sendMessage(m.chat, { 
                text: `[!] *AKSES DITOLAK*\n\nFitur ini hanya untuk Owner.\nID: *${sender}*` 
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
            
            // Simpan sinkronisasi terbaru ke Supabase sebelum backup
            if (global.db && global.db.saveAll) {
                await sock.sendMessage(m.chat, { text: "[!][~] *Syncing memory to Supabase...*" }, { quoted: m });
                await global.db.saveAll();
            }

            // Dapatkan seluruh data database (memori saat ini yang sinkron dengan Supabase)
            const dbData = global.db.read();
            
            // Konversi ke format JSON string yang rapi
            const jsonString = JSON.stringify(dbData, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');

            // Tanggal untuk nama file
            const dateStr = new Date().toISOString().split('T')[0];

            // Kirim sebagai file document
            await sock.sendMessage(m.chat, {
                document: buffer,
                fileName: `database_backup_${dateStr}.json`,
                mimetype: 'application/json',
                caption: `[i] *BACKUP DATABASE BERHASIL*\n\nIni adalah salinan langsung dari Supabase beserta memori Cache terakhir bot.`
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("GetDB Error:", error);
            if (global.waitMode === "react") await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(m.chat, { text: `[!] *Gagal melakukan backup:* ${error.message}` }, { quoted: m });
        }
    }
};
