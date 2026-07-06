#!/bin/bash
echo "Menyiapkan Bot Mie AI untuk Pterodactyl Panel..."
git clone https://github.com/sbmid/Mie-AI-Bot-whatsapp.git temp_bot
# Pindahkan semua file dari folder temp_bot ke root directory panel
mv temp_bot/* temp_bot/.* . 2>/dev/null
rm -rf temp_bot
echo "Menginstal dependencies..."
npm install
echo "Selesai! Silakan sesuaikan .env dan klik Start di panel."
