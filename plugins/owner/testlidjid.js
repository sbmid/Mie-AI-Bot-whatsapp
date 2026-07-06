// testlidjid.js — Plugin untuk menguji fungsi LID/JID dari fork @innovatorssoft/baileys
// Menguji: parseJid, plotJid, normalizePhoneToJid

module.exports = {
    command: ['testlidjid', 'lidjid', 'jidbtest'],
    isOwner: true,
    handler: async (sock, m, { args }) => {
        const from = m.sender;
        const results = [];

        // ── 1. Test import fungsi dari fork ──────────────────────────────────
        let parseJid, plotJid, normalizePhoneToJid;
        let importOk = false;
        try {
            const baileys = require('@whiskeysockets/baileys');
            parseJid = baileys.parseJid;
            plotJid = baileys.plotJid;
            normalizePhoneToJid = baileys.normalizePhoneToJid;
            importOk = true;
            results.push(`✅ *Import*: Berhasil import dari @whiskeysockets/baileys`);
            results.push(`  • parseJid: ${typeof parseJid}`);
            results.push(`  • plotJid: ${typeof plotJid}`);
            results.push(`  • normalizePhoneToJid: ${typeof normalizePhoneToJid}`);
        } catch (e) {
            results.push(`❌ *Import gagal*: ${e.message}`);
        }

        // ── 2. Test parseJid ──────────────────────────────────────────────────
        results.push('');
        results.push('📌 *Test parseJid:*');

        const testJids = [
            m.sender,                         // JID si pengirim (mungkin LID)
            '6283809720392@s.whatsapp.net',   // format normal JID
            '94300352282641@lid',              // format LID
            m.chat                            // chat JID (group/newsletter)
        ];

        for (const jid of testJids) {
            if (!jid) continue;
            if (typeof parseJid === 'function') {
                try {
                    const info = parseJid(jid);
                    results.push(`  JID: \`${jid}\``);
                    results.push(`    → user: ${info.user}`);
                    results.push(`    → server: ${info.server}`);
                    results.push(`    → isLid: ${info.isLid}`);
                    results.push(`    → isGroup: ${info.isGroup}`);
                } catch(e) {
                    results.push(`  \`${jid}\` → Error: ${e.message}`);
                }
            } else {
                // Fallback manual parse
                const [user, server] = jid.split('@');
                results.push(`  \`${jid}\``);
                results.push(`    → user: ${user}`);
                results.push(`    → server: ${server}`);
                results.push(`    → isLid: ${server === 'lid'}`);
            }
        }

        // ── 3. Test normalizePhoneToJid ───────────────────────────────────────
        results.push('');
        results.push('📌 *Test normalizePhoneToJid:*');
        const testPhone = '6283809720392';
        if (typeof normalizePhoneToJid === 'function') {
            try {
                const normalized = normalizePhoneToJid(testPhone);
                results.push(`  Input: \`${testPhone}\``);
                results.push(`  Output: \`${normalized}\``);
            } catch (e) {
                results.push(`  Error: ${e.message}`);
            }
        } else {
            results.push(`  ⚠️ normalizePhoneToJid tidak tersedia di fork ini`);
            results.push(`  Fallback manual: \`${testPhone}@s.whatsapp.net\``);
        }

        // ── 4. Test plotJid ───────────────────────────────────────────────────
        results.push('');
        results.push('📌 *Test plotJid (LID ↔ JID mapping):*');
        if (typeof plotJid === 'function') {
            try {
                const lidJid = '94300352282641@lid';
                const plotted = plotJid(lidJid);
                results.push(`  Input: \`${lidJid}\``);
                results.push(`  Output: \`${plotted}\``);

                const normalJid = '6283809720392@s.whatsapp.net';
                const plotted2 = plotJid(normalJid);
                results.push(`  Input: \`${normalJid}\``);
                results.push(`  Output: \`${plotted2}\``);
            } catch (e) {
                results.push(`  Error: ${e.message}`);
            }
        } else {
            results.push(`  ⚠️ plotJid tidak tersedia di fork ini`);
        }

        // ── 5. Info pengirim pesan ini ────────────────────────────────────────
        results.push('');
        results.push('📌 *Info Sender Pesan Ini:*');
        results.push(`  m.sender: \`${m.sender}\``);
        results.push(`  m.chat: \`${m.chat}\``);
        const senderParts = m.sender?.split('@');
        results.push(`  server: \`${senderParts?.[1]}\` ${senderParts?.[1] === 'lid' ? '← ini LID!' : ''}`);

        // ── Kirim hasil ───────────────────────────────────────────────────────
        await sock.sendMessage(from, {
            text: `🔬 *Test LID/JID Fork Baileys*\n\n${results.join('\n')}`
        }, { quoted: m });
    }
};
