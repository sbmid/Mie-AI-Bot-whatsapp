const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'moderation_db.json');

const loadDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initial = { warns: {}, bans: {} };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { warns: {}, bans: {} };
    }
};

const saveDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
    // Tambah warning
    addWarn: (jid, maxWarn = 5) => {
        const db = loadDB();
        if (!db.warns[jid]) db.warns[jid] = 0;
        db.warns[jid] += 1;
        
        let isBanned = false;
        if (db.warns[jid] >= maxWarn) {
            // Ban 1 Hari jika kena limit warn
            db.bans[jid] = Date.now() + (24 * 60 * 60 * 1000);
            db.warns[jid] = 0; // Reset warn setelah di ban
            isBanned = true;
        }
        
        saveDB(db);
        return { currentWarn: db.warns[jid] || maxWarn, isBanned };
    },

    // Dapatkan warning saat ini
    getWarn: (jid) => {
        const db = loadDB();
        return db.warns[jid] || 0;
    },

    // Tambah/Set ban dengan ms
    addBan: (jid, ms) => {
        const db = loadDB();
        db.bans[jid] = Date.now() + ms;
        saveDB(db);
        return db.bans[jid];
    },

    // Cabut ban / hapus warn
    unban: (jid) => {
        const db = loadDB();
        if (db.bans[jid]) delete db.bans[jid];
        if (db.warns[jid]) delete db.warns[jid];
        saveDB(db);
        return true;
    },

    // Cek apakah user sedang diban (sistem otomatis membersihkan ban expired)
    isBanned: (jid) => {
        const db = loadDB();
        if (db.bans[jid]) {
            if (Date.now() > db.bans[jid]) {
                delete db.bans[jid];
                saveDB(db);
                return false;
            }
            return true;
        }
        return false;
    },
    
    // Dapatkan sisa waktu ban dalam ms
    getBanRemaining: (jid) => {
        const db = loadDB();
        if (db.bans[jid]) {
            const sisa = db.bans[jid] - Date.now();
            return sisa > 0 ? sisa : 0;
        }
        return 0;
    }
};
