const os = require('os');
const fs = require('fs');
const { performance } = require('perf_hooks');
const db = require('../../lib/database'); 

module.exports = {
    command: ['botstatus'],
    handler: async (sock, m, { prefix, command }) => {
        const channelJid = "120363424104414634@newsletter"; 

        // --- 1. PERFORMANCE & TIME ---
        const oldTime = performance.now();
        const newTime = performance.now();
        const speed = (newTime - oldTime).toFixed(4);
        
        const uptime = (seconds) => {
            let d = Math.floor(seconds / (3600 * 24));
            let h = Math.floor(seconds % (3600 * 24) / 3600);
            let m = Math.floor(seconds % 3600 / 60);
            let s = Math.floor(seconds % 60);
            return `${d}h ${h}m ${m}s ${s}s`;
        };

        // --- 2. DEEP DATABASE ANALYSIS ---
        const data = db.read();
        const users = data.users || {};
        const groups = data.groups || {};
        
        const totalUser = Object.keys(users).length;
        const totalGroup = Object.keys(groups).length;
        const registered = Object.values(users).filter(v => v.registered === true).length;
        const totalBalance = Object.values(users).reduce((a, b) => a + (b.balance || 0), 0);
        
        // Cek Ukuran Database (Memory Temp Cache)
        const dbSize = fs.existsSync('./database_temp.json') 
            ? (fs.statSync('./database_temp.json').size / 1024).toFixed(2) 
            : "0";

        // --- 3. ADVANCED SERVER VITALS ---
        const usedMem = process.memoryUsage();
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        
        const cpu = os.cpus();
        const cpuModel = cpu[0].model.trim();
        const cpuSpeed = cpu[0].speed;
        const load = os.loadavg();

        // --- 4. FORMAT PESAN ELITE ---
        let reportMsg = `[!] *MIE AI - ADVANCED MONITORING* [!]\n` +
                        `_Update: ${new Date().toLocaleString('id-ID')}_\n` +
                        `──────────────────────\n\n` +
                        `[!] *ENGINE PERFORMANCE*\n` +
                        `◦ *Ping:* ${speed} ms\n` +
                        `◦ *Uptime:* ${uptime(process.uptime())}\n` +
                        `◦ *NodeJS:* ${process.version}\n` +
                        `◦ *PID:* ${process.pid}\n\n` +
                        `[!] *USER & ECONOMY*\n` +
                        `◦ *Total User:* ${totalUser} jiwa\n` +
                        `◦ *Total Grup:* ${totalGroup} grup\n` +
                        `◦ *Circulating Balance:* Rp${totalBalance.toLocaleString()}\n` +
                        `◦ *DB Storage:* ${dbSize} KB\n\n` +
                        `[!] *SERVER HARDWARE*\n` +
                        `◦ *CPU:* ${cpuModel}\n` +
                        `◦ *Cores:* ${cpu.length} Cores (@${cpuSpeed}MHz)\n` +
                        `◦ *RAM:* ${(usedMem.heapUsed / 1024 / 1024).toFixed(2)}MB / ${totalRam}GB\n` +
                        `◦ *Free RAM:* ${freeRam} GB\n` +
                        `◦ *Platform:* ${os.platform()} (${os.arch()})\n` +
                        `◦ *Load Avg:* ${load[0]} | ${load[1]} | ${load[2]}\n\n` +
                        `[!] *NETWORK STATUS*\n` +
                        `◦ *Socket:* Connected\n` +
                        `◦ *Target:* Channel Newsletter\n\n` +
                        `──────────────────────\n` +
                        `_Laporan Sistem Otomatis oleh Mie AI_\n` +
                        `_ Azrial Digital Solution 2026_`;

        try {
            // Kirim sebagai Gambar Biasa + Caption
            await sock.sendMessage(m.chat, { 
                image: { url: "https://files.catbox.moe/jh05xu.jpg" },
                caption: reportMsg
            }, { quoted: m });
            
        } catch (e) {
            await sock.sendMessage(m.chat, { text: "[!] *Error:* " + e.message }, { quoted: m });
        }
    }
};