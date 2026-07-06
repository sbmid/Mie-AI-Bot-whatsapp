const axios = require('axios');
const { proto, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { sendMediaSafe } = require('../../lib/helper');

const VARIANTS = {
    image: {
        'orig': { label: '📁 Original', desc: 'Asli tanpa ubahan apapun' },
        'light': { label: '✨ Kompresi Ringan', desc: 'Kualitas bagus, ukuran agak kecil' },
        'hard': { label: '📦 Kompresi Kuat', desc: 'Hemat kuota, resolusi tetep' },
        'r1080': { label: '📐 Resize 1080p', desc: 'Paling pas & optimal buat status WA' },
        'webp': { label: '🌐 Format WebP', desc: 'Ukuran super kecil, kualitas tajam' }
    },
    video: {
        'orig': { label: '📁 Original', desc: 'Asli tanpa ubahan apapun' },
        'light': { label: '✨ Kompresi Ringan', desc: 'CRF 23 - Kualitas tetep cakep' },
        'hard': { label: '📦 Kompresi Kuat', desc: 'CRF 30 - Ukuran sekecil mungkin' },
        'cut30': { label: '✂️ Potong 30 Detik', desc: 'Ambil 30 detik pertama buat 1 story' },
        'cut60': { label: '✂️ Potong 1 Menit', desc: 'Ambil 1 menit pertama buat 2 story' },
        'audio': { label: '🎵 Ekstrak Audio', desc: 'Ubah jadi MP3 / Lagu' },
        'r720': { label: '📐 Resize 720p', desc: 'Resolusi 720p HD standar' }
    }
};

module.exports = {
    command: ['purestatus', 'puresw', 'pureimg', 'purevid', 'hapus', 'delete', 'delpure', 'hapuspure'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.chat || m.key.remoteJid;
        const sender = m.sender || m.key.participant || m.key.remoteJid;

        global.pureStatusDB = global.pureStatusDB || {};
        const isDeleteCommand = ['hapus', 'delete', 'delpure', 'hapuspure'].includes(command);

        // ── Perintah hapus ────────────────────────────────────────────────────
        if (isDeleteCommand) {
            const token = text ? text.trim() : '';
            if (token && /^[0-9a-fA-F]+$/.test(token)) {
                if (global.pureStatusDB[token]) {
                    if (global.pureStatusDB[token].sender !== sender) {
                        return sock.sendMessage(from, { text: `❌ Eh, gak bisa! Cuma orang yang request yang boleh hapus.` }, { quoted: m });
                    }
                    clearTimeout(global.pureStatusDB[token].timeoutId);
                    await sock.sendMessage(from, { delete: global.pureStatusDB[token].key }).catch(() => {});
                    delete global.pureStatusDB[token];
                    return sock.sendMessage(from, { text: `✅ Beres, media dengan token *${token}* udah dihapus.` }, { quoted: m });
                } else {
                    return sock.sendMessage(from, { text: `⚠️ Token gak ketemu atau udah dihapus otomatis.` }, { quoted: m });
                }
            } else {
                return false;
            }
        }

        // Cari token hex (minimal 20 karakter) di dalam pesan user
        // Ini mencegah bug kalau user ngetik ". purestatus" doang atau salah spasi
        const tokenMatch = text ? text.match(/[0-9a-fA-F]{20,60}/) : null;
        
        if (!tokenMatch) {
            return sock.sendMessage(from, {
                text: `🌟 *PURE STATUS*\n\nMau upload status WA resolusi HD tanpa pecah?\n\n1️⃣ Buka: https://api.sbmku.sbs/purestatus\n2️⃣ Upload foto/video ke situ\n3️⃣ Salin *token* yang didapat\n4️⃣ Kirim ke bot:\n   *${prefix + command} <token>*\n\nNanti kamu bisa pilih mau dikompres, dipotong, atau dikirim ori!`
            }, { quoted: m });
        }

        const token = tokenMatch[0];
        
        // Ambil variantId kalau ada (user ngeklik tombol)
        const args = text.trim().split(/\s+/);
        // Variant ID biasanya ditaruh di argumen terakhir sama tombol
        let variantId = null;
        if (args.length > 1 && (VARIANTS.image[args[args.length - 1]] || VARIANTS.video[args[args.length - 1]])) {
            variantId = args[args.length - 1];
        }

        // ── 1. FASE CEK API & TAMPILKAN MENU ──────────────────────────────────
        if (!variantId) {
            if (global.waitMode === 'react') await sock.sendMessage(from, { react: { text: '🔍', key: m.key } });
            
            try {
                const apiUrl = `https://v1.sbmku.sbs/api/purestatus/check?token=${token}`;
                const response = await axios.get(apiUrl).catch(err => err.response);

                if (!response) throw new Error('Server lagi gangguan, coba lagi nanti.');
                if (response.status === 404) return sock.sendMessage(from, { text: `❌ Token salah atau udah kadaluarsa (max 30 menit).` }, { quoted: m });
                if (response.status !== 200) return sock.sendMessage(from, { text: `❌ Gagal ngecek token (Code: ${response.status}).` }, { quoted: m });

                // Server API punya wrapper ganda, jadi kita cari url di objek terdalam
                const payload = response.data?.data?.data || response.data?.data;
                const mediaUrl = payload?.url;
                
                if (!mediaUrl) throw new Error('Gagal mendapatkan URL media dari server.');

                const headRes = await axios.head(mediaUrl).catch(() => null);
                let contentType = headRes ? headRes.headers['content-type'] : '';
                
                // Kalo HEAD gagal, tebak dari ekstensi
                if (!contentType) {
                    if (mediaUrl.match(/\.(mp4|mkv|mov|webm)$/i)) contentType = 'video';
                    else contentType = 'image';
                }

                const isVideo = contentType.includes('video');
                const typeKey = isVideo ? 'video' : 'image';
                const options = VARIANTS[typeKey];

                const rows = Object.keys(options).map(key => ({
                    header: '',
                    title: options[key].label,
                    description: options[key].desc,
                    id: `${prefix}${command} ${token} ${key}`
                }));

                if (m.device === 'ios') {
                    let iosText = `File udah ketemu!\n\nUkuran asli: *${headRes ? (headRes.headers['content-length'] / 1024 / 1024).toFixed(2) : '?'} MB*\n\nSilakan ketik ulang command beserta token dan opsi di bawah ini:\n\n`;
                    for (const key of Object.keys(options)) {
                        iosText += `*${prefix}${command} ${token} ${key}*\n_${options[key].label} - ${options[key].desc}_\n\n`;
                    }
                    await sock.sendMessage(from, { text: iosText }, { quoted: m });
                } else {
                    const msg = generateWAMessageFromContent(from, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.create({ text: `File udah ketemu!\n\nUkuran asli: *${headRes ? (headRes.headers['content-length'] / 1024 / 1024).toFixed(2) : '?'} MB*\n\nSilakan pilih varian hasil yang kamu mau di bawah ini 👇` }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({ text: `Token: ${token}` }),
                                    header: proto.Message.InteractiveMessage.Header.create({ title: `✨ *Pure Status Options*`, hasMediaAttachment: false }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: [{
                                            name: 'single_select',
                                            buttonParamsJson: JSON.stringify({
                                                title: 'Pilih Varian',
                                                sections: [{
                                                    title: 'Opsi Tersedia',
                                                    rows: rows
                                                }]
                                            })
                                        }]
                                    })
                                })
                            }
                        }
                    }, { quoted: m });

                    await sock.relayMessage(from, msg.message, { messageId: msg.key.id });
                }
                
                if (global.waitMode === 'react') await sock.sendMessage(from, { react: { text: '', key: m.key } }); // clear react
            } catch (e) {
                return sock.sendMessage(from, { text: `❌ *Error:* ${e.message}` }, { quoted: m });
            }
            return;
        }

        // ── 2. FASE PROSES VARIAN ─────────────────────────────────────────────
        if (global.waitMode === 'react') {
            await sock.sendMessage(from, { react: { text: global.waitEmoji || '⏳', key: m.key } });
        } else {
            await sock.sendMessage(from, { text: '⏳ Lagi diproses nih, bentar ya...' }, { quoted: m });
        }

        try {
            const processUrl = `https://v1.sbmku.sbs/api/purestatus/process?token=${encodeURIComponent(token)}&variant=${variantId}`;
            // Kasih timeout panjang (5 menit) karena API lagi render video
            const response = await axios.get(processUrl, { timeout: 300000 }).catch(err => err.response);

            if (!response || response.status !== 200 || !response.data?.status) {
                const errMsg = response?.data?.message || 'Server gagal merender videonya nih. Coba lagi.';
                throw new Error(errMsg);
            }

            const payloadProcess = response.data?.data?.data || response.data?.data;
            const { url: resultUrl, size: resultSizeMB, caption } = payloadProcess || {};
            
            // Cek varian yang dipilih buat nampilin namanya
            const selVariant = VARIANTS.image[variantId] || VARIANTS.video[variantId] || { label: 'Varian' };

            // Tentukan tipe media
            const isVideoResult = resultUrl.match(/\.(mp4|mkv|mov|webm)(\?.*)?$/i);
            const mediaType = isVideoResult ? 'video' : 'image';
            
            // Siapkan caption sesuai request user: jika ada caption pakai caption, jika tidak ya kosong
            let finalCaption = caption ? caption : '';

            // Kirim filenya langsung!
            await sendMediaSafe(sock, from, null, resultUrl, mediaType, finalCaption, m);

        } catch (e) {
            console.error('[PureStatus Process Error]', e);
            return sock.sendMessage(from, { text: `❌ Gagal memproses: ${e.message}` }, { quoted: m });
        }
    }
};
