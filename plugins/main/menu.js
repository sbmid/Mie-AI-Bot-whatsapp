const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// --- DATA MENU PER KATEGORI ---
const menuData = {
    all: {
        title: "All Menu - Mie AI",
        categories: [
            { name: "AI & Desain", cmds: ["ai", "meta", "chatgpt", "gpt", "autoai", "edit", "recolor", "toanime", "iqc", "ainsfw", "nsfwai", "aiimage18"] },
            { name: "Media & Search", cmds: ["ig", "igdl", "tt", "tiktok", "x", "twitter", "ytdl", "ytmp3", "ytmp4", "ytv", "yta", "github", "pin", "pinterest", "pinsearch", "pinterestsearch", "play", "bokepdl", "xvdl", "xnxxdl"] },
            { name: "Hiburan & Game", cmds: ["asahotak", "caklontong", "cerdascermat", "family100", "lengkapikalimat", "maths", "siapakahaku", "slot", "judi", "tebakff", "tebakgambar", "tebakgame", "tebakkartun", "tebakkata", "tebaklagu", "tebaklirik", "tebakwarna"] },
            { name: "RPG & Spaceman", cmds: ["rpgstart", "rpgstats", "rpgexplore", "rpginv", "rpgshop", "rpghelp", "attack", "skill", "ulti", "flee", "buy", "sell", "use", "equip", "unequip", "craft", "quest", "daily", "pvp", "dungeon", "spaceman", "changeclass", "upgrade", "leaderboardrpg", "adopsipet", "dungeon", "bank", "setor", "tarik", "topbank", "topkaya", "market", "ceksaham", "portofolio", "crypto"] },
            { name: "Group Manager", cmds: ["acc", "add", "afk", "antilinkall", "ceksewa", "sewacek", "close", "delres", "demote", "gcoff", "gcmute", "gcon", "group", "gstatus", "gs", "groupstatus", "hidetag", "kick", "leave", "linkgc", "listres", "open", "promote", "revoke", "addres", "setres", "setdesk", "setnamegc", "timergc", "totag", "welcome"] },
            { name: "Info & Islami", cmds: ["bmkg", "cuaca", "jadwaltv", "doaharian", "kisahnabi", "listsurah", "quranaudio", "artinama", "arti", "kecocokannama", "cocoknama", "nomorhoki", "potensipenyakit", "penyakit", "ramalanjodoh", "jodoh", "ramalanjodohbali", "jodohbali", "rejekiweton", "weton", "sifatusaha", "usahabisnis", "tafsirmimpi", "mimpi", "zodiak", "confess", "menfess", "chnews", "news"] },
            { name: "Maker & Sticker", cmds: ["attp", "brat", "sbrat", "bratvid", "bratgif", "smeme", "s", "stiker", "sticker", "wm", "watermark", "colong", "ephoto360", "photooxy", "textpro"] },
            { name: "Canvas & Image", cmds: ["igstory", "iqcdark", "ttqc"] },
            { name: "Tools Tambahan", cmds: ["cekidgc", "cekspek", "cekmeta", "mediainfo", "spek", "getidch", "hd", "delhd", "remini", "upscale", "noiseremover", "clearaudio", "purestatus", "puresw", "pureimg", "purevid", "hapus", "delete", "delpure", "hapuspure", "removebg", "removbg", "rbg", "nobg", "resend", "kirimulang", "teruskan", "rvo", "readviewonce", "toaudio", "tomp3", "toimage", "toimg", "tourl", "up", "upch", "postch", "tovn", "vn", "call", "endcall", "leaderboard", "lb", "top", "topglobal", "me", "profile", "profil", "rank", "level", "lapor", "request", "cekfeedback", "donelapor", "donerequest", "volume", "volvideo", "volumevideo"] },
            { name: "Khusus Owner", cmds: ["addowner", "delowner", "addsewa", "listsewa", "delsewa", "botstatus", "copypanel", "addpanel", "clonemenu", "clonepanel", "crm", "setcrm", "delcrm", "listcrm", "runcrm", "stopcrm", "statuscrm", "dumpmsg", "dumpwaf", "eval", "fakeai", "editfakeai", "panel", "sendpanel", "createpanel", "getdb", "getplugin", "join", "out", "pc", "setbot", "setsewa", "spy", "spylist", "spyget", "spylog", "spynumber", "spytype", "spyrare", "spyclear", "spyexport", "spysearch", "testbtn", "testbtn2", "tb2", "testmsg", "testwaf", "upsw", "upstatus", "upstory", "richtest", "rt", "carouseltest", "ct", "addakses", "deleteakses", "addnsfw", "delnsfw", "editgold", "editrpg", "resetgoldall", "resetgolduser", "resetbankall", "resetkeluargaall"] },
            { name: "Main Menu", cmds: ["aku", "menu", "help", "p", "list", "owner", "ping", "runtime", "sewa"] }
        ]
    },
    ai: {
        title: "AI & Desain",
        cmds: ["ai", "meta", "chatgpt", "gpt", "autoai", "edit", "recolor", "toanime", "iqc", "ainsfw", "nsfwai", "aiimage18"]
    },
    media: {
        title: "Media & Search",
        cmds: ["ig", "igdl", "tt", "tiktok", "x", "twitter", "ytdl", "ytmp3", "ytmp4", "ytv", "yta", "github", "pin", "pinterest", "pinsearch", "pinterestsearch", "play", "bokepdl", "xvdl", "xnxxdl"]
    },
    game: {
        title: "Hiburan & Game",
        cmds: ["asahotak", "caklontong", "cerdascermat", "family100", "lengkapikalimat", "maths", "siapakahaku", "slot", "judi", "tebakff", "tebakgambar", "tebakgame", "tebakkartun", "tebakkata", "tebaklagu", "tebaklirik", "tebakwarna"]
    },
    rpg: {
        title: "RPG & Spaceman",
        cmds: ["rpgstart", "rpgstats", "rpgexplore", "rpginv", "rpgshop", "rpghelp", "attack", "skill", "ulti", "flee", "buy", "sell", "use", "equip", "unequip", "craft", "quest", "daily", "pvp", "dungeon", "spaceman", "changeclass", "upgrade", "leaderboardrpg", "adopsipet", "bank", "setor", "tarik", "topbank", "topkaya", "market", "ceksaham", "portofolio", "crypto", "mancing", "tambang", "ngoji", "ngojek", "kerja", "jobkerja", "berkebun", "openbo", "begal", "maling", "lamar", "terima", "tolak", "cerai", "infopasangan", "buatclan", "listclan", "infoclan", "clanhelp"]
    },
    group: {
        title: "Group Manager",
        cmds: ["acc", "add", "afk", "antilinkall", "ceksewa", "sewacek", "close", "delres", "demote", "gcoff", "gcmute", "gcon", "group", "gstatus", "gs", "groupstatus", "hidetag", "kick", "leave", "linkgc", "listres", "open", "promote", "revoke", "addres", "setres", "setdesk", "setnamegc", "timergc", "totag", "welcome"]
    },
    info: {
        title: "Info & Islami",
        cmds: ["bmkg", "cuaca", "jadwaltv", "doaharian", "kisahnabi", "listsurah", "quranaudio", "artinama", "arti", "kecocokannama", "cocoknama", "nomorhoki", "potensipenyakit", "penyakit", "ramalanjodoh", "jodoh", "ramalanjodohbali", "jodohbali", "rejekiweton", "weton", "sifatusaha", "usahabisnis", "tafsirmimpi", "mimpi", "zodiak", "confess", "menfess", "chnews", "news"]
    },
    maker: {
        title: "Maker & Sticker",
        cmds: ["attp", "brat", "sbrat", "bratvid", "bratgif", "smeme", "s", "stiker", "sticker", "wm", "watermark", "colong", "ephoto360", "photooxy", "textpro"]
    },
    canvas: {
        title: "Canvas & Image",
        cmds: ["igstory", "iqcdark", "ttqc"]
    },
    tools: {
        title: "Tools Tambahan",
        cmds: ["cekidgc", "cekspek", "cekmeta", "mediainfo", "spek", "getidch", "hd", "delhd", "remini", "upscale", "noiseremover", "clearaudio", "purestatus", "puresw", "pureimg", "purevid", "hapus", "delete", "delpure", "hapuspure", "removebg", "removbg", "rbg", "nobg", "resend", "kirimulang", "teruskan", "rvo", "readviewonce", "toaudio", "tomp3", "toimage", "toimg", "tourl", "up", "upch", "postch", "tovn", "vn", "call", "endcall", "leaderboard", "lb", "top", "topglobal", "me", "profile", "profil", "rank", "level", "lapor", "request", "cekfeedback", "donelapor", "donerequest", "volume", "volvideo", "volumevideo"]
    },
    owner: {
        title: "Khusus Owner",
        cmds: ["addowner", "delowner", "addsewa", "listsewa", "delsewa", "botstatus", "copypanel", "addpanel", "clonemenu", "clonepanel", "crm", "setcrm", "delcrm", "listcrm", "runcrm", "stopcrm", "statuscrm", "dumpmsg", "dumpwaf", "eval", "fakeai", "editfakeai", "panel", "sendpanel", "createpanel", "getdb", "getplugin", "join", "out", "pc", "setbot", "setsewa", "spy", "spylist", "spyget", "spylog", "spynumber", "spytype", "spyrare", "spyclear", "spyexport", "spysearch", "testbtn", "testbtn2", "tb2", "testmsg", "testwaf", "upsw", "upstatus", "upstory", "richtest", "rt", "carouseltest", "ct", "addakses", "deleteakses", "addnsfw", "delnsfw", "editgold", "editrpg", "resetgoldall", "resetgolduser", "resetbankall", "resetkeluargaall"]
    },
    main: {
        title: "Main Menu",
        cmds: ["aku", "menu", "help", "p", "list", "owner", "ping", "runtime", "sewa"]
    }
};


const buildCategoryText = (data, prefix) => {
    const lines = data.cmds.map(c => `│ ⫹⫺ ${prefix}${c}`).join('\n');
    return `┏─『 ${data.title.toUpperCase()} 』\n${lines}\n┗───────⧉`;
};

const buildAllMenuText = (data, prefix) => {
    return data.categories.map(cat => {
        const lines = cat.cmds.map(c => `│ ⫹⫺ ${prefix}${c}`).join('\n');
        return `┏─『 ${cat.name.toUpperCase()} 』\n${lines}\n┗───────⧉`;
    }).join('\n\n');
};

// Midnight epoch today
const getMidnightTimestamp = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 0); // set ke 23:59:59 hari ini (end of day)
    return d.getTime();
};

module.exports = {
    command: ['menu', 'help', 'p', 'list', 'allmenu', 'menu_ai', 'menu_media', 'menu_game', 'menu_rpg', 'menu_group', 'menu_info', 'menu_maker', 'menu_canvas', 'menu_tools', 'menu_owner', 'menu_main'],
    handler: async (sock, m, { prefix, command }) => {
        const from = m.chat;

        // --- HANDLER KATEGORI (saat user memilih dari list) ---
        if (!['menu', 'help', 'p', 'list'].includes(command)) {
            let data, text;

            if (command === 'allmenu') {
                text = `*LIST SEMUA MENU MIE AI*\n\n${buildAllMenuText(menuData.all, prefix)}`;
            } else {
                const key = command.replace('menu_', '');
                data = menuData[key];
                if (!data) return;
                text = `*LIST MENU - ${data.title.toUpperCase()}*\n\n${buildCategoryText(data, prefix)}\n\n_Ketik salah satu perintah untuk menggunakannya!_`;
            }

            return await sock.sendMessage(from, { text }, { quoted: m });
        }

        // --- HANDLER UTAMA: KIRIM MENU INTERAKTIF ---
        try {
            const moment = require('moment-timezone');

            // Data real bot
            const sender = m.sender || m.key.remoteJid;
            const senderNumber = sender.split('@')[0];
            const pushName = m.pushName || 'User';
            const botName = global.botName || 'Mie AI';
            const ownerNum = (global.owner?.[0] || '6283809720392') + '@s.whatsapp.net';
            const ownerContact = global.owner?.[0] || '6283809720392';

            let uptime = 'Online';
            try { uptime = require('../../lib/helper').runtime(process.uptime()); } catch { uptime = 'Ready'; }

            let totalUsers = 0;
            try {
                const db = require('../../lib/database').read();
                if (db?.users) totalUsers = Object.keys(db.users).length;
            } catch { totalUsers = 0; }

            let totalFitur = 0;
            if (global.plugins) {
                totalFitur = Object.values(global.plugins).reduce((a, p) => a + (p.command?.length || 0), 0);
            } else { totalFitur = 150; }

            const tanggal = moment().tz('Asia/Jakarta').format('DD MMMM YYYY');
            const waktu = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            const botMode = global.botMode || 'Public';

            // Baca video dari local directory jika ada
            const videoPath = path.join(process.cwd(), 'menu_video.mp4');
            let media = null;
            let mediaType = 'image';

            if (fs.existsSync(videoPath)) {
                const videoBuffer = fs.readFileSync(videoPath);
                mediaType = 'video';
                media = await prepareWAMessageMedia(
                    { video: videoBuffer, gifPlayback: true },
                    { upload: sock.waUploadToServer }
                );
            } else {
                // Fallback ke foto profil bot atau default image
                try {
                    const ppUrl = await sock.profilePictureUrl(sock.user.id, 'image').catch(() => 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Image/bg.jpg');
                    media = await prepareWAMessageMedia(
                        { image: { url: ppUrl } },
                        { upload: sock.waUploadToServer }
                    );
                } catch (e) {
                    // Jika gagal fetch PP, gunakan gambar kosong/teks aja
                    media = null;
                }
            }

            // Fake Reply: Seolah-olah bot membalas siaran/broadcast Meta AI
            const fakeReplyContext = {
                stanzaId: 'METAAI_BC_' + Date.now(),
                participant: '13135550002@s.whatsapp.net',
                remoteJid: 'status@broadcast',
                quotedMessage: {
                    conversation: tanggal
                }
            };

            const listSections = [
                {
                    title: "Kategori Menu",
                    highlight_label: "Pilih Kategori",
                    rows: [
                        { title: "All Menu", description: "Tampilkan seluruh daftar menu", id: `${prefix}allmenu` },
                        { title: "AI & Desain", description: "Fitur kecerdasan buatan & edit foto", id: `${prefix}menu_ai` },
                        { title: "Media & Search", description: "Downloader & pencarian sosmed", id: `${prefix}menu_media` },
                        { title: "Hiburan & Game", description: "Permainan interaktif", id: `${prefix}menu_game` },
                        { title: "RPG & Spaceman", description: "RPG lengkap, Spaceman & ekonomi", id: `${prefix}menu_rpg` },
                        { title: "Group Manager", description: "Fitur pengelolaan grup", id: `${prefix}menu_group` },
                        { title: "Info & Islami", description: "Informasi, cuaca, & agama", id: `${prefix}menu_info` },
                        { title: "Maker & Sticker", description: "Buat stiker & teks efek", id: `${prefix}menu_maker` },
                        { title: "Canvas & Image", description: "Generator gambar otomatis", id: `${prefix}menu_canvas` },
                        { title: "Tools Tambahan", description: "Berbagai alat fungsional", id: `${prefix}menu_tools` },
                        { title: "Main Menu", description: "Menu dasar & status bot", id: `${prefix}menu_main` }
                    ]
                }
            ];

            if (m.device === 'ios') {
                const iosText = `*LIST SEMUA MENU MIE AI*\n\n${buildAllMenuText(menuData.all, prefix)}`;
                await sock.sendMessage(from, { text: iosText }, { quoted: m });
                
                try {
                    const vnBuffer = fs.readFileSync(path.join(process.cwd(), 'menu-vn.ogg'));
                    await sock.sendMessage(from, {
                        audio: vnBuffer,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    });
                } catch (err) {
                    console.log("File menu-vn.ogg tidak ditemukan.");
                }
                return;
            }

            const megaComboMsg = generateWAMessageFromContent(from, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            contextInfo: proto.ContextInfo.create({
                                ...fakeReplyContext,
                                mentionedJid: [sender], // tag nomor pengirim cmd
                                isForwarded: true, // Label "Diteruskan"
                                forwardingScore: 99999, // Panah ganda (Diteruskan berkali-kali)
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363417042584770@newsletter',
                                    newsletterName: `➜ Seputar Info Bot`,
                                    serverMessageId: -1
                                }
                            }),
                            body: proto.Message.InteractiveMessage.Body.create({
                                text: " "
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `╭───「 *${botName.toUpperCase()}* 」\n│\n├ *User:* ${pushName}\n├ *No:* +${senderNumber}\n├ *Runtime:* ${uptime}\n├ *Users:* ${totalUsers}\n├ *Fitur:* ${totalFitur}\n├ *Mode:* ${botMode}\n├ *Tgl:* ${tanggal}\n├ *Jam:* ${waktu}\n├ *Owner:* +${ownerContact}\n╰───────────\n`
                            }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title: `@${senderNumber}`, // tag nomor pengirim
                                subtitle: "Mie AI Bot",
                                hasMediaAttachment: !!media,
                                ...(mediaType === 'video' && media ? { videoMessage: media.videoMessage } : {}),
                                ...(mediaType === 'image' && media ? { imageMessage: media.imageMessage } : {})
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                messageParamsJson: JSON.stringify({
                                    limited_time_offer: {
                                        text: "Mie AI V4",
                                        url: "https://youtube.com",
                                        copy_code: "MIE-AI-VIP",
                                        expiration_time: getMidnightTimestamp() // Habis tengah malam
                                    },
                                    bottom_sheet: {
                                        in_thread_buttons_limit: 1,
                                        divider_indices: [1],
                                        list_title: "Daftar Perintah Mie AI",
                                        button_title: "Buka Daftar Kategori"
                                    }
                                }),
                                buttons: [
                                    // 1. Tipe List (Single Select) HANYA KATEGORI
                                    {
                                        name: "single_select",
                                        buttonParamsJson: JSON.stringify({
                                            title: "Pilih Kategori",
                                            sections: listSections,
                                            has_multiple_buttons: true
                                        })
                                    },
                                    // 2. Tipe URL Web tanpa emoji
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Website Resmi", url: "https://www.google.com" }) },
                                    // 3. Tipe URL Deep Link OS tanpa emoji
                                    { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Pengaturan WA", url: "whatsapp://settings" }) },
                                    // 4. Tipe Copy Text tanpa emoji
                                    { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "Salin Format", id: "cp", copy_code: "FORMAT-REPORT" }) },
                                    // 5. Tipe Call Phone tanpa emoji
                                    { name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: "Hubungi Owner", id: "cl", phone_number: "+6283809720392" }) }
                                ]
                            })
                        })
                    }
                }
            }, { userJid: sock.user.id });

            await sock.relayMessage(from, megaComboMsg.message, { messageId: megaComboMsg.key.id });

            // Kirim VN setelah menu muncul
            try {
                const vnBuffer = fs.readFileSync(path.join(process.cwd(), 'menu-vn.ogg'));
                await sock.sendMessage(from, {
                    audio: vnBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                });
            } catch (err) {
                console.log("File menu-vn.ogg tidak ditemukan, melewati pengiriman VN.");
            }

        } catch (e) {
            console.error(e);
            await sock.sendMessage(from, { text: "Terjadi kesalahan: " + e.message }, { quoted: m });
        }
    }
};