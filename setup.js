const { execSync } = require('child_process');

console.log("=========================================");
console.log("Memulai Setup Bot Mie AI di Pterodactyl...");
console.log("=========================================\n");

try {
    // Force clone ke folder saat ini (meskipun nggak kosong)
    console.log("[1/2] Mengambil file dari Github...");
    execSync('git init', { stdio: 'inherit' });
    execSync('git remote add origin https://github.com/sbmid/Mie-AI-Bot-whatsapp.git', { stdio: 'inherit' });
    execSync('git fetch', { stdio: 'inherit' });
    execSync('git reset --hard origin/main', { stdio: 'inherit' });

    console.log("\n[2/2] Menginstal dependencies...");
    try { execSync('rm -rf node_modules package-lock.json', { stdio: 'ignore' }); } catch (e) {}
    execSync('npm install --ignore-scripts', { stdio: 'inherit' });

    console.log("\n=========================================");
    console.log("✨ SETUP SELESAI! ✨");
    console.log("Langkah selanjutnya:");
    console.log("1. Hapus file setup.js ini biar rapi.");
    console.log("2. Buat file .env dari template yang ada.");
    console.log("3. Ubah Startup Command di panel jadi 'npm start' atau 'node start.js'");
    console.log("4. Restart panel kamu.");
    console.log("=========================================");
} catch (error) {
    console.error("\n❌ Gagal Setup:", error.message);
}
