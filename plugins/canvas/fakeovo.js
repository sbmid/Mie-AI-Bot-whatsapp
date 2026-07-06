const axios = require('axios');

module.exports = {
    command: ['fakeovo'],
    handler: async (sock, m, { args, prefix, command }) => {
        const from = m.key.remoteJid;
        const amount = args[0];

        if (!amount || isNaN(amount)) {
            return sock.sendMessage(from, {
                text: `[!] *Format Salah*\nContoh: *${prefix + command} 100000*`
            }, { quoted: m });
        }

        try {
            if (global.waitMode === "react") {
                await sock.sendMessage(from, { react: { text: global.waitEmoji || '[~]', key: m.key } });
            } else if (global.waitMode === "text") {
                await sock.sendMessage(from, { text: global.waitText || '_Sedang diproses, mohon tunggu..._' }, { quoted: m });
            }

            const payload = { amount: amount };
            const apiUrl = 'https://v1.sbmku.sbs/api/canvas/fake-ovo';
            const res = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });

            if (!res.data || !res.data.status || !res.data.data) {
                throw new Error("Gagal mengambil data dari server.");
            }

            const urls = res.data.data.urls;
            if (!urls) throw new Error("URL gambar tidak ditemukan.");

            const urlList = [urls.catbox, urls.uggu, urls.tmpfiles];
            let imageBuffer = null;

            for (const url of urlList) {
                if (!url) continue;
                try {
                    const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
                    imageBuffer = Buffer.from(imgRes.data);
                    if (imageBuffer) {
                        console.log(`Sukses mendownload Fake OVO dari: ${url}`);
                        break;
                    }
                } catch (e) {
                    console.log(`Gagal mengunduh dari ${url}, mencoba url lain...`);
                }
            }

            if (!imageBuffer) {
                throw new Error("Gagal mengunduh gambar dari semua server.");
            }

            const message = res.data.data.message || 'Fake OVO berhasil dibuat';
            const amountText = res.data.data.amountText || amount;

            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: `[i] *${message}*\n[!] *Jumlah:* Rp${amountText}`
            }, { quoted: m });

            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('FakeOVO Error:', e);
            if (global.waitMode === "react") await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            return sock.sendMessage(from, { text: `[!] *Error:* ${e.message}` }, { quoted: m });
        }
    }
};
