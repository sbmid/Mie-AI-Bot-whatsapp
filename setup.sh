#!/bin/bash
echo "Menyiapkan Bot Mie AI..."
git clone https://github.com/sbmid/Mie-AI-Bot-whatsapp.git
cd Mie-AI-Bot-whatsapp
echo "Menginstal dependencies..."
npm install
echo "Selesai! Jangan lupa buat file .env dari template dan jalankan 'npm start'."
