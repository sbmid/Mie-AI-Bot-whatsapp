module.exports = {
    command: ['textpro'],
    category: ['maker'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Format salah!\n\n[!] *Contoh:* ${prefix + command} https://textpro.me/create-artistic-3d-text-effects-from-corn-kernels-1177.html|Test1|Test2\n\n*Catatan:* text2 bersifat opsional tergantung template.` }, { quoted: m });

        let [url, text1, text2] = text.split('|').map(v => v ? v.trim() : '');
        if (!url || !text1) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan URL dan teks!\n\n[!] *Contoh:* ${prefix + command} https://textpro.me/create-artistic-3d-text-effects-from-corn-kernels-1177.html|Test1|Test2` }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            let apiUrl = `https://api.siputzx.my.id/api/m/textpro?url=${encodeURIComponent(url)}&text1=${encodeURIComponent(text1)}`;
            if (text2) apiUrl += `&text2=${encodeURIComponent(text2)}`;

            await sock.sendMessage(m.chat, { 
                image: { url: apiUrl },
                caption: `[i] Sukses membuat TextPro!`
            }, { quoted: m });

            try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
        } catch (e) {
            console.error("TextPro Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses gambar. Pastikan URL valid dan API sedang online." }, { quoted: m });
        }
    }
};
