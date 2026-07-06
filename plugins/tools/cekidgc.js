module.exports = {
    command: ['cekidgc'],
    handler: async (sock, m, { prefix, command }) => {
        if (!m.isGroup) return sock.sendMessage(m.chat, { text: `[!] Fitur ini hanya bisa digunakan di dalam grup!` }, { quoted: m });
        return sock.sendMessage(m.chat, { text: `Tuh kan aku copas buat kamu:\n\n*ID GRUP (JID):*\n${m.chat}` }, { quoted: m });
    }
};
