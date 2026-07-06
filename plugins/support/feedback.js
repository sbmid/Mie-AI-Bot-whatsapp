const db = require('../../lib/database');

const thumb = "https://i.pinimg.com/736x/b1/b0/b2/b1b0b24fbb6c4ce76e1253bc85d74325.jpg";

module.exports = {
    command: ['lapor', 'request', 'cekfeedback', 'donelapor', 'donerequest'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat;
        const sender = m.sender;
        const data = db.read();
        
        const myId = sender.split('@')[0];
        const ownerNumbers = global.ownerNumber.map(v => v.replace(/[^0-9]/g, ''));
        const isOwner = ownerNumbers.includes(myId);

        if (!data.reports) data.reports = [];
        if (!data.requests) data.requests = [];

        // 1. MEMBER MENGIRIM PESAN
        if (command === 'lapor' || command === 'request') {
            if (!text) return sock.sendMessage(from, { text: `[!] *Contoh Penggunaan:*\n${prefix + command} fitur X tidak berfungsi` }, { quoted: m });

            const payload = {
                sender: sender,
                name: m.pushName || "User",
                msg: text,
                from: from,
                time: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
            };

            if (command === 'lapor') data.reports.push(payload);
            else data.requests.push(payload);
            
            if (db.saveAll) db.saveAll();

            const label = command === 'lapor' ? "Laporan Error" : "Request Fitur";
            return sock.sendMessage(from, { text: `[i] *${label} Berhasil Diproses!*\nPesan kamu sudah masuk ke antrean untuk dibaca oleh Owner/Developer.` }, { quoted: m });
        }

        // 2. OWNER CEK LIST (SEMUA LAPORAN & REQUEST)
        if (command === 'cekfeedback') {
            if (!isOwner) return; 

            if (data.reports.length === 0 && data.requests.length === 0) {
                return sock.sendMessage(from, { text: "[!] Antrean kosong melompong, Bos! Tidak ada laporan masuk." }, { quoted: m });
            }

            let txt = `[!] *MANAGEMENT FEEDBACK SBM*\n\n`;

            if (data.reports.length > 0) {
                txt += `[!] *LAPORAN ERROR (BUG)*\n`;
                data.reports.forEach((v, i) => {
                    txt += `${i + 1}. *NAMA:* ${v.name}\n[!] *PESAN:* ${v.msg}\n\n`;
                });
            } else {
                txt += `[!] *LAPORAN ERROR*\n(Kosong)\n\n`;
            }

            txt += `--------------------------\n\n`;

            if (data.requests.length > 0) {
                txt += `[!] *REQUEST FITUR*\n`;
                data.requests.forEach((v, i) => {
                    txt += `${i + 1}. *NAMA:* ${v.name}\n[!] *PESAN:* ${v.msg}\n\n`;
                });
            } else {
                txt += `[!] *REQUEST FITUR*\n(Kosong)\n\n`;
            }

            txt += `*CARA KONFIRMASI SELESAI:*\nKetik: ${prefix}donelapor [nomor]\nKetik: ${prefix}donerequest [nomor]`;

            return sock.sendMessage(from, {
                image: { url: thumb },
                caption: txt
            });
        }

        // 3. OWNER MENYELESAIKAN ANTREAN
        if (command === 'donelapor' || command === 'donerequest') {
            if (!isOwner) return;
            if (!text || isNaN(text)) return sock.sendMessage(from, { text: `[!] *Contoh:* ${prefix + command} 1` }, { quoted: m });

            const idx = parseInt(text) - 1;
            const isRep = command === 'donelapor';
            const list = isRep ? data.reports : data.requests;

            if (!list[idx]) return sock.sendMessage(from, { text: "[!] Nomor urut itu nggak ada di daftar antrean." }, { quoted: m });

            const item = list[idx];
            const typeLabel = isRep ? "Laporan Error" : "Request Fitur";

            // Notif ke member
            await sock.sendMessage(item.from, { 
                text: `[i] *${typeLabel} Telah Diselesaikan!*\n\nHalo ${item.name} (@${item.sender.split('@')[0]}), pesan kamu tentang: _"${item.msg}"_ telah dibaca dan ditindaklanjuti oleh Developer. Terima kasih feedback-nya!`,
                mentions: [item.sender]
            });

            if (isRep) data.reports.splice(idx, 1);
            else data.requests.splice(idx, 1);
            
            if (db.saveAll) db.saveAll();
            return sock.sendMessage(from, { text: `[i] Berhasil mencoret ${isRep ? 'Laporan' : 'Request'} nomor ${text} dari daftar.` }, { quoted: m });
        }
    }
};