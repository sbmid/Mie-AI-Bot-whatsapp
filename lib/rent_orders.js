const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'rent_orders.json');

// Initialize if not exist
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
}

module.exports = {
    getAllOrders: () => {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.error("Gagal membaca rent_orders.json", e.message);
            return [];
        }
    },
    
    saveOrders: (orders) => {
        try {
            fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
        } catch (e) {
            console.error("Gagal menyimpan rent_orders.json", e.message);
        }
    },

    addOrder: (order) => {
        const orders = module.exports.getAllOrders();
        // Cek order lama punya orang ini, kalau ada hapus aja biar gak dobel bayar dengan kode beda
        const filtered = orders.filter(o => o.sender !== order.sender);
        filtered.push(order);
        module.exports.saveOrders(filtered);
    },

    removeOrder: (idOrSender) => {
        const orders = module.exports.getAllOrders();
        // Bisa hapus by nominal atau by sender
        const filtered = orders.filter(o => o.sender !== idOrSender && o.nominal_total !== idOrSender);
        module.exports.saveOrders(filtered);
    },

    getOrder: (nominal_total) => {
        const orders = module.exports.getAllOrders();
        return orders.find(o => o.nominal_total === nominal_total);
    },

    // Membaca counter untuk kode unik
    getNextUniqueCode: () => {
        let counterPath = path.join(__dirname, '..', 'qris_counter.json');
        let count = 1;
        if (fs.existsSync(counterPath)) {
            try {
                let data = JSON.parse(fs.readFileSync(counterPath));
                count = data.counter || 1;
            } catch(e) {}
        }
        
        let current = count;
        count += 1;
        if (count > 300) count = 1;

        fs.writeFileSync(counterPath, JSON.stringify({ counter: count }));
        return current;
    }
};
