const axios = require('axios');

/**
 * ==========================================
 * VOICE CALL MODULE - Mie AI
 * ==========================================
 * Menggunakan sock.offerCall() bawaan dari wileys (fork Baileys)
 * untuk melakukan panggilan suara ke Owner.
 * 
 * Catatan Penting:
 * - offerCall() di wileys mengirimkan sinyal panggilan ke WhatsApp server,
 *   sehingga HP target akan BERDERING.
 * - Namun, karena wileys tidak memiliki media transport (WebRTC audio stream),
 *   panggilan yang diterima akan SILENT (tidak ada suara).
 * - Fitur streaming musik memerlukan WebRTC media transport yang belum
 *   tersedia di ekosistem Baileys/wileys.
 */

module.exports = {
    command: ['call', 'endcall'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat || m.key.remoteJid;
        const sender = m.sender || m.key.participant || m.key.remoteJid;

        // Validasi Owner: Hanya owner yang diizinkan menggunakan command ini
        const ownerNumbers = global.ownerNumber || [];
        const isOwner = ownerNumbers.some(o => {
            const ownerBase = o.split('@')[0];
            const senderBase = sender.split('@')[0];
            return ownerBase === senderBase || senderBase === ownerBase;
        });

        if (!isOwner) {
            return sock.sendMessage(from, { text: '[!] Perintah ini khusus untuk Owner.' }, { quoted: m });
        }

        // Inisialisasi state global
        global.activeCalls = global.activeCalls || {};

        switch (command) {

            // ==========================================
            // COMMAND: .call <nomor>
            // Melakukan panggilan suara ke nomor target
            // ==========================================
            case 'call': {
                // === DEBUG: Kirim info ke chat ===
                const debugInfo = [
                    `[!] *DEBUG VOICECALL*`,
                    ``,
                    `[!] Sender: ${sender}`,
                    `[!] Owner List: ${JSON.stringify(ownerNumbers)}`,
                    `[i] isOwner: ${isOwner}`,
                    `[!] sock.offerCall exists: ${typeof sock.offerCall}`,
                    `[!] Text arg: "${text || '(kosong)'}"`,
                ];
                await sock.sendMessage(from, { text: debugInfo.join('\n') }, { quoted: m });

                // Target bisa dari argumen atau default ke owner pertama
                let targetJid;
                if (text && text.trim()) {
                    // Bersihkan input nomor
                    let num = text.trim().replace(/[^0-9]/g, '');
                    if (num.startsWith('0')) num = '62' + num.slice(1); // Konversi 08xx ke 628xx
                    targetJid = num + '@s.whatsapp.net';
                } else {
                    // Default: panggil nomor owner pertama (JID format)
                    const firstOwner = ownerNumbers.find(o => o.endsWith('@s.whatsapp.net'));
                    if (!firstOwner) {
                        return sock.sendMessage(from, {
                            text: '[!] Tidak ada nomor target. Gunakan: `.call 628xxxxxxxxxx`'
                        }, { quoted: m });
                    }
                    targetJid = firstOwner;
                }

                await sock.sendMessage(from, {
                    text: `[!] Target JID: ${targetJid}\n[!] Memanggil sock.offerCall()...`
                }, { quoted: m });

                // Cek apakah sudah ada panggilan aktif ke nomor ini
                if (global.activeCalls[targetJid]) {
                    return sock.sendMessage(from, {
                        text: `[!] Sudah ada panggilan aktif ke @${targetJid.split('@')[0]}. Ketik \`.endcall\` dulu untuk mengakhiri.`,
                        mentions: [targetJid]
                    }, { quoted: m });
                }

                // Cek apakah fungsi offerCall tersedia
                if (typeof sock.offerCall !== 'function') {
                    return sock.sendMessage(from, {
                        text: `[!] *FATAL:* sock.offerCall bukan function!\nTipe: ${typeof sock.offerCall}\n\nKemungkinan versi wileys tidak mendukung offerCall.`
                    }, { quoted: m });
                }

                try {
                    console.log('[VoiceCall] Calling sock.offerCall for:', targetJid);
                    const callResult = await sock.offerCall(targetJid, false);
                    console.log('[VoiceCall] offerCall result:', JSON.stringify(callResult));

                    // Simpan state panggilan
                    global.activeCalls[targetJid] = {
                        callId: callResult.callId,
                        toJid: callResult.toJid,
                        isVideo: callResult.isVideo,
                        startedAt: Date.now()
                    };

                    await sock.sendMessage(from, {
                        text: [
                            `[i] *Panggilan Terkirim!*`,
                            ``,
                            `[!] Target: @${targetJid.split('@')[0]}`,
                            ` Call ID: \`${callResult.callId}\``,
                            `[!] Tipe: ${callResult.isVideo ? 'Video Call' : 'Voice Call'}`,
                            ``,
                            `_HP target seharusnya sekarang berdering._`,
                            `_Ketik \`.endcall\` untuk mengakhiri panggilan._`
                        ].join('\n'),
                        mentions: [targetJid]
                    }, { quoted: m });

                } catch (err) {
                    console.error('[VoiceCall] Error:', err);
                    await sock.sendMessage(from, {
                        text: `[!] *Gagal melakukan panggilan:*\n\n${err.message}\n\n\`\`\`${err.stack?.slice(0, 500)}\`\`\``
                    }, { quoted: m });
                }
                break;
            }

            // ==========================================
            // COMMAND: .endcall
            // Mengakhiri/membersihkan state panggilan aktif
            // ==========================================
            case 'endcall': {
                const activeKeys = Object.keys(global.activeCalls);
                if (activeKeys.length === 0) {
                    return sock.sendMessage(from, {
                        text: '[!] Tidak ada panggilan aktif saat ini.'
                    }, { quoted: m });
                }

                // Bersihkan semua panggilan aktif
                let summary = '[!] *Panggilan Diakhiri:*\n';
                for (const jid of activeKeys) {
                    const call = global.activeCalls[jid];
                    const duration = Math.round((Date.now() - call.startedAt) / 1000);
                    summary += `\n• @${jid.split('@')[0]} (${duration} detik)`;

                    // Reject/akhiri panggilan via Baileys jika tersedia
                    try {
                        if (sock.rejectCall && call.callId) {
                            await sock.rejectCall(call.callId, jid);
                        }
                    } catch (e) {
                        console.log('[VoiceCall] rejectCall error (mungkin sudah terputus):', e.message);
                    }

                    delete global.activeCalls[jid];
                }

                await sock.sendMessage(from, {
                    text: summary,
                    mentions: activeKeys
                }, { quoted: m });
                break;
            }
        }
    }
};
