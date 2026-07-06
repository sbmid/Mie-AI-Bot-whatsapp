// Fungsi untuk kalkulasi CRC16-CCITT pada QRIS
function calculateCRC(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
}

// Fungsi mengubah QRIS Static menjadi Dinamis dengan Nominal
function createDynamicQRIS(qrisStatic, amount) {
    if (!qrisStatic) return '';
    let nominal = amount.toString();
    
    // Potong CRC Asli (6304 + 4 digit crc = 8 karakter)
    let qris = qrisStatic.slice(0, -8);
    
    // Ubah 010211 (Static) menjadi 010212 (Dynamic)
    qris = qris.replace("010211", "010212");
    
    // Buat Tag 54 (Amount/Nominal)
    let amountTag = "54" + nominal.length.toString().padStart(2, '0') + nominal;
    
    // Sisipkan Tag 54 sebelum Tag 58 (Country Code)
    let tag58Index = qris.indexOf("5802ID");
    if (tag58Index !== -1) {
        qris = qris.substring(0, tag58Index) + amountTag + qris.substring(tag58Index);
    } else {
        qris += amountTag;
    }
    
    // Tambahkan kembali Tag ID perhitungan CRC
    qris += "6304";
    
    // Hitung ulang CRC
    let crc = calculateCRC(qris);
    
    return qris + crc;
}

module.exports = {
    command: ['buatqris', 'qris'],
    handler: async (sock, m, { text, command, prefix }) => {
        // Cek Owner
        const isOwner = global.ownerNumber && global.ownerNumber.some(o => m.sender === o || m.sender.startsWith(o.split('@')[0]));
        if (!isOwner) return sock.sendMessage(m.chat, { text: `[!] Fitur ini khusus Owner!` }, { quoted: m });

        if (!text || isNaN(text)) {
            return sock.sendMessage(m.chat, { text: `[!] Masukkan nominal yang valid!\n\nContoh:\n*${prefix + command} 15000*` }, { quoted: m });
        }

        const nominal = parseInt(text);
        if (nominal < 100) {
            return sock.sendMessage(m.chat, { text: `[!] Nominal terlalu kecil!` }, { quoted: m });
        }

        await sock.sendMessage(m.chat, { text: `[~] Sedang membuat QRIS Dinamis sebesar Rp ${nominal.toLocaleString('id-ID')}...` }, { quoted: m });

        try {
            // QRIS Static Anda
            const qrisStatic = "00020101021126610014COM.GO-JEK.WWW01189360091430737439420210G0737439420303UMI51440014ID.CO.QRIS.WWW0215ID10253825085270303UMI5204549953033605802ID5907SBMshop6013LAMPUNG TIMUR61053438162070703A016304ACB2";
            
            // Generate Payload Dinamis
            const qrisDinamis = createDynamicQRIS(qrisStatic, nominal);

            // Kita buat sebagai Image URL melalui api.qrserver.com
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrisDinamis)}`;

            // Kirim Image QRIS
            await sock.sendMessage(m.chat, { 
                image: { url: qrImageUrl }, 
                caption: `[i] *QRIS DINAMIS BERHASIL DIBUAT*\n\n[!] *Nominal:* Rp ${nominal.toLocaleString('id-ID')}\n *Merchant:* SBMshop\n\n_Silakan scan QRIS di atas dengan aplikasi DANA/OVO/GoPay/LinkAja/M-Banking Anda._` 
            }, { quoted: m });

        } catch (error) {
            console.error('Error generating QRIS:', error);
            sock.sendMessage(m.chat, { text: `[!] Gagal membuat QRIS Dinamis: ${error.message}` }, { quoted: m });
        }
    }
};
