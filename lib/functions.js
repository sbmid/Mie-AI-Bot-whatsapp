const fs = require('fs-extra');

const getGroupAdmins = (participants) => {
    let admins = [];
    for (let i of participants) {
        i.admin === "admin" || i.admin === "superadmin" ? admins.push(i.id) : "";
    }
    return admins;
};

module.exports = { getGroupAdmins };