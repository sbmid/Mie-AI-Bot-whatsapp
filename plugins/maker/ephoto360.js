module.exports = {
    command: ['ephoto360', 'ephoto'],
    category: ['maker'],
    handler: async (sock, m, { text, prefix, command }) => {
        if (!text) return sock.sendMessage(m.chat, { text: `*[?]* Format salah!\n\n[!] *Contoh:* ${prefix + command} https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html|Siputzx|Test\n\n*Catatan:* text2 bersifat opsional tergantung template.` }, { quoted: m });

        let [url, text1, text2] = text.split('|').map(v => v ? v.trim() : '');
        if (!url || !text1) return sock.sendMessage(m.chat, { text: `*[?]* Masukkan URL dan teks!\n\n[!] *Contoh:* ${prefix + command} https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html|Siputzx|Test` }, { quoted: m });

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

            let apiUrl = `https://api.siputzx.my.id/api/m/ephoto360?url=${encodeURIComponent(url)}&text1=${encodeURIComponent(text1)}`;
            if (text2) apiUrl += `&text2=${encodeURIComponent(text2)}`;

            await sock.sendMessage(m.chat, { 
                image: { url: apiUrl },
                caption: `[i] Sukses membuat Ephoto360!`
            }, { quoted: m });

            try { await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch(e){}
        } catch (e) {
            console.error("Ephoto360 Error:", e);
            await sock.sendMessage(m.chat, { text: "[!] Terjadi kesalahan saat memproses gambar. Pastikan URL valid dan API sedang online." }, { quoted: m });
        }
    }
};
