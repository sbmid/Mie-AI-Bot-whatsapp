const axios = require('axios');

/**
 * MIE AI - GitHub Downloader plugin
 */
module.exports = {
    command: ['github', 'gh', 'githubdl', 'gist'],
    handler: async (sock, m, { text, prefix, command }) => {
        const from = m.key.remoteJid;

        if (!text) {
            return sock.sendMessage(from, {
                text: `*Gunakan format:* ${prefix + command} https://gist.github.com/\n\nContoh: \n${prefix + command} https://gist.github.com/siputzx/...`
            }, { quoted: m });
        }

        try {
            await sock.sendMessage(from, { react: { text: '⏳', key: m.key } });

            const apiUrl = `https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { headers: { 'accept': 'application/json' } });
            const dataObj = response.data;

            if (!dataObj.status || !dataObj.data) {
                throw new Error("Gagal mengambil data dari API.");
            }

            const resData = dataObj.data;

            // --- 1. HANDLING JIKA LINK MERUPAKAN GIST ---
            if (resData.type === "gist") {
                let caption = `┏━  *GITHUB GIST DOWNLOADER* ━┓\n`;
                caption += `│\n`;
                caption += `│ *[+] Creator* : ${resData.owner}\n`;
                caption += `│ *[+] Info* : ${resData.description || 'Tidak ada info'}\n`;
                caption += `│ *[+] Total File* : ${resData.files.length} file\n`;
                caption += `│ *[+] Dibuat* : ${new Date(resData.created_at).toLocaleString('id-ID')}\n`;
                caption += `│\n`;
                caption += `┗━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                caption += `_Sedang mengirim file-nya satu per satu..._`;

                await sock.sendMessage(from, { text: caption }, { quoted: m });

                for (let file of resData.files) {
                    if (file.content) {
                        const fileBuffer = Buffer.from(file.content, 'utf-8');
                        await sock.sendMessage(from, {
                            document: fileBuffer,
                            fileName: file.name,
                            mimetype: 'text/plain',
                            caption: `*${file.name}* (${(file.size / 1024).toFixed(2)} KB)`
                        }, { quoted: m });
                    } else if (file.raw_url) {
                        const getRaw = await axios.get(file.raw_url, { responseType: 'arraybuffer' });
                        const fileBuffer = Buffer.from(getRaw.data);
                        await sock.sendMessage(from, {
                            document: fileBuffer,
                            fileName: file.name || 'file',
                            mimetype: 'application/octet-stream',
                            caption: `*${file.name}*`
                        }, { quoted: m });
                    }
                }
            }
            // --- 2. HANDLING JIKA LINK MERUPAKAN REPOSITORY ATAU LAINNYA ---
            else {
                let info = `┏━━━  *GITHUB DOWNLOADER* ━━━┓\n`;
                info += `│\n`;
                info += `│ *[+] Tipe File* : ${resData.type || 'Repo'}\n`;
                info += `│\n`;
                info += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

                if (resData.download_url) {
                    const resZip = await axios.get(resData.download_url, { responseType: 'arraybuffer' });
                    await sock.sendMessage(from, {
                        document: Buffer.from(resZip.data),
                        fileName: `${resData.name || resData.repo || 'source_code'}.zip`,
                        mimetype: 'application/zip',
                        caption: `*Folder ${resData.type || 'Zip'} Github berhasil diunduh!*`
                    }, { quoted: m });
                } else {
                    info += `Wah, struktur balasan API untuk Repository agak berbeda. Silakan Download manual dari Web ya kak!`;
                    await sock.sendMessage(from, { text: info }, { quoted: m });
                }
            }

            await sock.sendMessage(from, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error("Error Github DL:", e);
            await sock.sendMessage(from, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(from, { text: `*Gagal mengambil Github!* \nDetail: ${e.message}` }, { quoted: m });
        }
    }
};