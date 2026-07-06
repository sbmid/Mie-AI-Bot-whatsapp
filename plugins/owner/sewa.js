const db = require('../../lib/database');

module.exports = {
    command: ['addsewa', 'delsewa', 'listsewa', 'setsewa', 'ceksewa'],
    handler: async (sock, msg, { command, text, args, prefix }) => {
        const { chat, sender, pushName } = msg;

        // Cek owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => sender === o || sender.startsWith(o.split('@')[0]));

        // COMMAND: ceksewa (Public)
        if (command === 'ceksewa') {
            if (!chat.endsWith('@g.us')) return sock.sendMessage(chat, { text: "[!] Perintah ini hanya bisa digunakan di dalam grup." }, { quoted: msg });
            
            const sewaData = db.getSewa(chat);
            if (!sewaData || sewaData.expired === 0) {
                return sock.sendMessage(chat, { text: "[!] Grup ini tidak sedang dalam masa sewa (Gratis/Trial)." }, { quoted: msg });
            }

            const sisaMs = sewaData.expired - Date.now();
            if (sisaMs <= 0) {
                return sock.sendMessage(chat, { text: "[!] Masa sewa grup ini sudah habis! Silakan hubungi owner untuk memperpanjang." }, { quoted: msg });
            }

            const hari = Math.floor(sisaMs / (1000 * 60 * 60 * 24));
            const jam = Math.floor((sisaMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const menit = Math.floor((sisaMs % (1000 * 60 * 60)) / (1000 * 60));

            return sock.sendMessage(chat, { text: `[~] *Sisa Waktu Sewa:* \n${hari} Hari, ${jam} Jam, ${menit} Menit` }, { quoted: msg });
        }

        // GUARD: Selain ceksewa, wajib Owner
        if (!isOwner) return sock.sendMessage(chat, { text: "[!] Perintah ini hanya untuk Owner Bot!" }, { quoted: msg });

        if (command === 'setsewa') {
            if (!text) return sock.sendMessage(chat, { text: `[!] Format salah!\nContoh: ${prefix}setsewa Berikut adalah daftar harga sewa bot: ...` }, { quoted: msg });
            db.setBotSettings('sewa_price_list', text);
            return sock.sendMessage(chat, { text: "[i] Daftar harga sewa berhasil diperbarui." }, { quoted: msg });
        }

        if (command === 'addsewa') {
            if (!text) return sock.sendMessage(chat, { text: `[!] Format salah!\nContoh: ${prefix}addsewa 30d\nAtau dengan link: ${prefix}addsewa https://chat.whatsapp.com/... 30d` }, { quoted: msg });
            
            let days = 0;
            const dayMatch = text.match(/([0-9]+)d/i) || text.match(/([0-9]+)/);
            if (dayMatch) days = parseInt(dayMatch[1]);
            
            if (days <= 0) return sock.sendMessage(chat, { text: "[!] Jumlah hari tidak valid!" }, { quoted: msg });

            let targetJid = chat;
            let groupLinkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
            let linkMatch = text.match(groupLinkRegex);

            if (linkMatch) {
                try {
                    const code = linkMatch[1];
                    targetJid = await sock.groupAcceptInvite(code);
                    await new Promise(r => setTimeout(r, 2000)); // Jedah sebentar
                    sock.sendMessage(chat, { text: `[i] Berhasil bergabung ke grup via link.` }, { quoted: msg });
                } catch (err) {
                    return sock.sendMessage(chat, { text: `[!] Gagal bergabung ke grup: ${err.message}` }, { quoted: msg });
                }
            } else if (!chat.endsWith('@g.us')) {
                return sock.sendMessage(chat, { text: "[!] Masukkan link grup atau gunakan perintah ini di dalam grup!" }, { quoted: msg });
            }

            db.addSewa(targetJid, days);
            
            try {
                const groupMetadata = await sock.groupMetadata(targetJid);
                const gName = groupMetadata.subject;
                await sock.sendMessage(chat, { text: `[i] Berhasil menambahkan sewa untuk grup *${gName}* selama *${days} Hari*.` }, { quoted: msg });
            } catch {
                await sock.sendMessage(chat, { text: `[i] Berhasil menambahkan sewa untuk grup ID ${targetJid} selama *${days} Hari*.` }, { quoted: msg });
            }
            return;
        }

        if (command === 'delsewa') {
            let targetJid = chat;
            let groupLinkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
            let linkMatch = text.match(groupLinkRegex);

            if (linkMatch) {
                try {
                    const res = await sock.groupGetInviteInfo(linkMatch[1]);
                    targetJid = res.id;
                } catch {
                    return sock.sendMessage(chat, { text: "[!] Link grup tidak valid atau bot belum pernah bergabung kesana." }, { quoted: msg });
                }
            } else if (text && text.includes('@g.us')) {
                targetJid = text.match(/\d+@g\.us/)[0];
            } else if (!chat.endsWith('@g.us')) {
                return sock.sendMessage(chat, { text: "[!] Gunakan di dalam grup atau sertakan link/ID grup!" }, { quoted: msg });
            }

            if (db.delSewa(targetJid)) {
                return sock.sendMessage(chat, { text: "[i] Sewa grup berhasil dihapus." }, { quoted: msg });
            } else {
                return sock.sendMessage(chat, { text: "[!] Grup tersebut tidak ada dalam daftar sewa." }, { quoted: msg });
            }
        }

        if (command === 'listsewa') {
            const list = db.getSewaList();
            if (list.length === 0) return sock.sendMessage(chat, { text: "[!] Tidak ada grup yang menyewa bot saat ini." }, { quoted: msg });

            let teks = "[!] *Daftar Grup Sewa*\n\n";
            let gNames = {};
            
            // Coba ambil nama grup
            for (let s of list) {
                try {
                    const meta = await sock.groupMetadata(s.jid);
                    gNames[s.jid] = meta.subject;
                } catch {
                    gNames[s.jid] = s.jid;
                }
            }

            for (let i = 0; i < list.length; i++) {
                const s = list[i];
                const now = Date.now();
                const status = s.expired > now ? "[!] *Aktif*" : "[!] *Expired*";
                
                let sisaStr = "";
                if (s.expired > now) {
                    const sisaMs = s.expired - now;
                    const hari = Math.floor(sisaMs / (1000 * 60 * 60 * 24));
                    sisaStr = `(${hari} Hari tersisa)`;
                }
                
                teks += `${i + 1}. *${gNames[s.jid]}*\n   Status: ${status} ${sisaStr}\n\n`;
            }

            return sock.sendMessage(chat, { text: teks }, { quoted: msg });
        }
    }
};
