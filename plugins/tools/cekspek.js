const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { downloadMedia } = require('../../lib/helper');

module.exports = {
    command: ['cekspek', 'cekmeta', 'mediainfo', 'spek'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat || m.key.remoteJid;

        let quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let baseMsg = quoted ? quoted : m.message;

        // Bongkar pembungkus pesan
        if (baseMsg.viewOnceMessageV2) baseMsg = baseMsg.viewOnceMessageV2.message;
        if (baseMsg.viewOnceMessage) baseMsg = baseMsg.viewOnceMessage.message;
        if (baseMsg.ephemeralMessage) baseMsg = baseMsg.ephemeralMessage.message;

        const type = Object.keys(baseMsg).find(v =>
            (v.endsWith('Message') || v.endsWith('message')) &&
            !['senderKeyDistributionMessage', 'protocolMessage', 'extendedTextMessage'].includes(v)
        );

        const isImage = type === 'imageMessage';
        const isVideo = type === 'videoMessage';
        const isAudio = type === 'audioMessage';

        if (!isImage && !isVideo && !isAudio) {
            return sock.sendMessage(from, {
                text: `[!]*[?]* *CEK SPEK MEDIA*\n\nBalas foto/video/audio lalu ketik *${prefix + command}*\n\n_Bot akan membedah seluruh metadata & spesifikasi teknis media tersebut._`
            }, { quoted: m });
        }

        if (global.waitMode === "react") {
            await sock.sendMessage(from, { react: { text: global.waitEmoji || '[~]', key: m.key } });
        } else if (global.waitMode === "text") {
            await sock.sendMessage(from, { text: global.waitText || '_Sedang diproses..._' }, { quoted: m });
        }

        try {
            const buffer = await downloadMedia({ [type]: baseMsg[type] });

            const tempDir = path.join(process.cwd(), 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            // Tentukan ekstensi berdasarkan tipe
            let ext = 'bin';
            if (isImage) ext = 'jpg';
            else if (isVideo) ext = 'mp4';
            else if (isAudio) ext = 'mp3';

            const filePath = path.join(tempDir, `probe_${Date.now()}.${ext}`);
            fs.writeFileSync(filePath, buffer);

            const fileSizeBytes = buffer.length;
            const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);
            const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

            // Gunakan ffprobe untuk extract metadata lengkap dalam format JSON
            const probeCmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;

            exec(probeCmd, async (err, stdout) => {
                // Bersihkan file temp
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                if (err || !stdout) {
                    return sock.sendMessage(from, {
                        text: `[!] *FFprobe gagal!*\nPastikan FFmpeg sudah terinstall di server.\n\n[!] *Info Dasar:*\n• Tipe: ${type.replace('Message', '')}\n• Ukuran: ${fileSizeMB} MB (${fileSizeKB} KB)\n• Ukuran Raw: ${fileSizeBytes.toLocaleString()} bytes`
                    }, { quoted: m });
                }

                try {
                    const probe = JSON.parse(stdout);
                    const streams = probe.streams || [];
                    const format = probe.format || {};

                    const videoStream = streams.find(s => s.codec_type === 'video');
                    const audioStream = streams.find(s => s.codec_type === 'audio');

                    let result = `[!] *BEDAH SPEK MEDIA*\n`;
                    result += `━━━━━━━━━━━━━━━━━━\n\n`;

                    // === INFO UMUM ===
                    result += `[!] *INFO FILE*\n`;
                    result += `• Format: ${(format.format_long_name || format.format_name || '-')}\n`;
                    result += `• Ukuran: ${fileSizeMB} MB (${fileSizeKB} KB)\n`;
                    result += `• Ukuran Raw: ${fileSizeBytes.toLocaleString()} bytes\n`;
                    if (format.duration) {
                        const dur = parseFloat(format.duration);
                        const min = Math.floor(dur / 60);
                        const sec = Math.floor(dur % 60);
                        result += `• Durasi: ${min}m ${sec}s (${dur.toFixed(2)}s)\n`;
                    }
                    if (format.bit_rate) {
                        const brKbps = (parseInt(format.bit_rate) / 1000).toFixed(0);
                        const brMbps = (parseInt(format.bit_rate) / 1000000).toFixed(2);
                        result += `• Bitrate Total: ${brKbps} Kbps (${brMbps} Mbps)\n`;
                    }
                    result += `\n`;

                    // === VIDEO STREAM ===
                    if (videoStream) {
                        result += ` *VIDEO STREAM*\n`;
                        result += `• Codec: ${videoStream.codec_name || '-'} (${videoStream.codec_long_name || '-'})\n`;
                        result += `• Profil: ${videoStream.profile || '-'}\n`;
                        result += `• Resolusi: ${videoStream.width}x${videoStream.height}\n`;

                        // Hitung rasio aspek
                        if (videoStream.width && videoStream.height) {
                            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                            const g = gcd(videoStream.width, videoStream.height);
                            result += `• Rasio Aspek: ${videoStream.width/g}:${videoStream.height/g}`;
                            if (videoStream.display_aspect_ratio) result += ` (display: ${videoStream.display_aspect_ratio})`;
                            result += `\n`;
                        }

                        // FPS
                        if (videoStream.r_frame_rate) {
                            const parts = videoStream.r_frame_rate.split('/');
                            const fps = parts.length === 2 ? (parseInt(parts[0]) / parseInt(parts[1])).toFixed(2) : videoStream.r_frame_rate;
                            result += `• FPS: ${fps}\n`;
                        }
                        if (videoStream.avg_frame_rate && videoStream.avg_frame_rate !== videoStream.r_frame_rate) {
                            const parts = videoStream.avg_frame_rate.split('/');
                            const avgFps = parts.length === 2 ? (parseInt(parts[0]) / parseInt(parts[1])).toFixed(2) : videoStream.avg_frame_rate;
                            result += `• FPS Rata-rata: ${avgFps}\n`;
                        }

                        // Bitrate video
                        if (videoStream.bit_rate) {
                            const vbr = (parseInt(videoStream.bit_rate) / 1000).toFixed(0);
                            result += `• Bitrate Video: ${vbr} Kbps\n`;
                        }

                        // Pixel format
                        result += `• Pixel Format: ${videoStream.pix_fmt || '-'}\n`;

                        // Color space info
                        if (videoStream.color_space) result += `• Color Space: ${videoStream.color_space}\n`;
                        if (videoStream.color_transfer) result += `• Color Transfer: ${videoStream.color_transfer}\n`;
                        if (videoStream.color_primaries) result += `• Color Primaries: ${videoStream.color_primaries}\n`;

                        // Total frames
                        if (videoStream.nb_frames) result += `• Total Frame: ${parseInt(videoStream.nb_frames).toLocaleString()}\n`;

                        result += `\n`;
                    }

                    // === AUDIO STREAM ===
                    if (audioStream) {
                        result += `[!] *AUDIO STREAM*\n`;
                        result += `• Codec: ${audioStream.codec_name || '-'} (${audioStream.codec_long_name || '-'})\n`;
                        if (audioStream.profile) result += `• Profil: ${audioStream.profile}\n`;
                        if (audioStream.sample_rate) result += `• Sample Rate: ${audioStream.sample_rate} Hz\n`;
                        if (audioStream.channels) result += `• Channel: ${audioStream.channels} (${audioStream.channel_layout || '-'})\n`;
                        if (audioStream.bit_rate) {
                            result += `• Bitrate Audio: ${(parseInt(audioStream.bit_rate) / 1000).toFixed(0)} Kbps\n`;
                        }
                        result += `\n`;
                    }

                    // === ANALISIS WA STATUS ===
                    if (videoStream) {
                        result += `[!] *ANALISIS BYPASS STATUS WA*\n`;
                        result += `━━━━━━━━━━━━━━━━━━\n`;

                        const totalBr = format.bit_rate ? parseInt(format.bit_rate) / 1000 : 0;
                        const vBr = videoStream.bit_rate ? parseInt(videoStream.bit_rate) / 1000 : 0;
                        const w = videoStream.width || 0;
                        const h = videoStream.height || 0;
                        const pxFmt = videoStream.pix_fmt || '';

                        let fpsVal = 0;
                        if (videoStream.r_frame_rate) {
                            const p = videoStream.r_frame_rate.split('/');
                            fpsVal = p.length === 2 ? parseInt(p[0]) / parseInt(p[1]) : parseFloat(videoStream.r_frame_rate);
                        }

                        // Cek resolusi
                        const isVertHD = (w === 720 && h === 1280);
                        const isHD = (w <= 720 && h <= 1280) || (w <= 1280 && h <= 720);
                        result += `• Resolusi ${isVertHD ? '[i] 720x1280 (ideal)' : isHD ? '[!] HD tapi bukan 720x1280' : '[!] Terlalu besar, WA akan kompres'}\n`;

                        // Cek bitrate
                        result += `• Bitrate ${totalBr <= 1200 ? '[i]' : '[!]'} ${totalBr.toFixed(0)} Kbps ${totalBr <= 1200 ? '(aman)' : '(terlalu tinggi, WA akan kompres)'}\n`;

                        // Cek FPS
                        result += `• FPS ${fpsVal <= 30 ? '[i]' : fpsVal <= 60 ? '[!]' : '[!]'} ${fpsVal.toFixed(0)} fps ${fpsVal <= 30 ? '(ideal)' : fpsVal <= 60 ? '(lumayan)' : '(terlalu tinggi)'}\n`;

                        // Cek pixel format
                        result += `• Pixel Format ${pxFmt === 'yuv420p' ? '[i] yuv420p (kompatibel)' : '[!] ' + pxFmt + ' (mungkin tidak kompatibel)'}\n`;

                        // Cek codec
                        const codec = videoStream.codec_name || '';
                        result += `• Codec ${codec === 'h264' ? '[i] H.264 (ideal)' : codec === 'hevc' || codec === 'h265' ? '[!] H.265/HEVC (bisa masalah di HP lama)' : '[!] ' + codec + ' (tidak umum)'}\n`;

                        // Cek audio
                        if (audioStream) {
                            const aCodec = audioStream.codec_name || '';
                            const aBr = audioStream.bit_rate ? parseInt(audioStream.bit_rate) / 1000 : 0;
                            result += `• Audio ${aCodec === 'aac' ? '[i]' : '[!]'} ${aCodec.toUpperCase()} ${aBr.toFixed(0)} Kbps ${aCodec === 'aac' ? '(ideal)' : '(sebaiknya AAC)'}\n`;
                        }

                        // Cek ukuran file
                        const sizeMB = parseFloat(fileSizeMB);
                        result += `• Ukuran ${sizeMB <= 16 ? '[i]' : '[!]'} ${fileSizeMB} MB ${sizeMB <= 16 ? '(aman untuk status)' : '(terlalu besar, maks 16 MB)'}\n`;
                    }

                    await sock.sendMessage(from, { text: result.trim() }, { quoted: m });

                } catch (parseErr) {
                    console.error('Probe Parse Error:', parseErr);
                    await sock.sendMessage(from, { text: `[!] Gagal membaca metadata: ${parseErr.message}` }, { quoted: m });
                }
            });

        } catch (e) {
            console.error('CekSpek Error:', e);
            return sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
        }
    }
};
