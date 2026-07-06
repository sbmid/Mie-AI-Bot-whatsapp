const fs = require('fs');
const path = './menfess.json';

// Inisialisasi data jika file belum ada
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}, null, 2));
}

const menfessDB = {
    read: () => {
        try {
            const data = fs.readFileSync(path, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return {};
        }
    },
    write: (data) => {
        try {
            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            return true;
        } catch (e) {
            console.error("Gagal menulis database Menfess:", e);
            return false;
        }
    }
};

module.exports = menfessDB;