module.exports = {
  command: ['restart'],
  isOwner: true,
  handler: async (sock, m) => {
    await sock.sendMessage(m.chat, { text: '🔄 Merestart bot...' }, { quoted: m });
    process.exit(0); // Nodemon/PM2 akan otomatis menghidupkan kembali bot
  }
};
