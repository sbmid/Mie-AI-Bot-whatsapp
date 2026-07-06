const fs = require('fs');
const path = './polling_results.json';

// Inisialisasi data poling kalau belum ada
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({ 
        "Fitur HD": 0, 
        "Slot Gacor": 0, 
        "Respon Kilat": 0, 
        "Fitur AI": 0 
    }, null, 2));
}

module.exports = {
    getVotes: () => JSON.parse(fs.readFileSync(path)),
    addVote: (option) => {
        const data = JSON.parse(fs.readFileSync(path));
        if (data[option] !== undefined) {
            data[option] += 1;
            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            return true;
        }
        return false;
    }
};