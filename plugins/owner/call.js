const fs = require('fs');
const path = require('path');
const { delay } = require('@whiskeysockets/baileys');
const axios = require('axios');
const yts = require('yt-search');

const AUTH_DIR = './.npm/caller';
const CREDS_FILE = path.join(AUTH_DIR, 'creds.json');
const AUDIO_CACHE = './.npm';

let VoipClient = null;
let voipClient = null;
let isConnecting = false;
let activeCall = null;
let clientStartedAt = null;
let lastError = null;
let lastCallTarget = null;
let lastCallAt = null;
let isEndingCall = false;

if (!global.__rtcRefs) {
    global.__rtcRefs = new Set();
}

if (!fs.existsSync(AUDIO_CACHE)) {
    fs.mkdirSync(AUDIO_CACHE, { recursive: true });
}

class YTDLopus {
    constructor() {
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'sec-ch-ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'origin': 'https://media.ytmp3.gg',
            'referer': 'https://media.ytmp3.gg/',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
        };
        
        this.apiKey = 'AIzaSyCLG2P58_3b_YT4jco3BLbYqrY2RRqAf7U';
        this.firebaseConfig = null;
        this.firebaseInstallation = null;
    }

    async initialize() {
        await this.getFirebaseConfig();
        await this.registerFirebaseInstallation();
    }

    async getFirebaseConfig() {
        const response = await axios.get(
            'https://firebase.googleapis.com/v1alpha/projects/-/apps/1:1098510063944:web:b7cb640b0a67e090e9bb7d/webConfig',
            {
                headers: {
                    ...this.headers,
                    'x-goog-api-key': this.apiKey,
                    'x-client-data': 'CJ+NywE='
                }
            }
        );
        
        this.firebaseConfig = response.data;
        return response.data;
    }

    async registerFirebaseInstallation() {
        const response = await axios.post(
            `https://firebaseinstallations.googleapis.com/v1/projects/${this.firebaseConfig.projectId}/installations`,
            {
                fid: 'diIsB0twvdUXJzbVHEpVyE',
                authVersion: 'FIS_v2',
                appId: this.firebaseConfig.appId,
                sdkVersion: 'w:0.6.19'
            },
            {
                headers: {
                    ...this.headers,
                    'x-goog-api-key': this.apiKey,
                    'x-firebase-client': 'eyJ2ZXJzaW9uIjoyLCJoZWFydGJlYXRzIjpbeyJhZ2VudCI6ImZpcmUtY29yZS8wLjE0LjcgZmlyZS1jb3JlLWVzbTIwMjAvMC4xNC43IGZpcmUtanMvIGZpcmUtaWlkLzAuNi4xOSBmaXJlLWlpZC1lc20yMDIwLzAuNi4xOSBmaXJlLWFuYWx5dGljcy8wLjEwLjE5IGZpcmUtYW5hbHl0aWNzLWVzbTIwMjAvMC4xMC4xOSBmaXJlLWpzLWFsbC1hcHAvMTIuOC4wIiwiZGF0ZXMiOlsiMjAyNi0wNi0yOSJdfV19',
                    'x-client-data': 'CJ+NywE='
                }
            }
        );
        
        this.firebaseInstallation = response.data;
        return response.data;
    }

    async convertVideo(url) {
        const response = await axios.post(
            'https://hub.convert1s.com/api/download',
            {
                url: url,
                os: 'android',
                output: {
                    type: 'audio',
                    format: 'opus'
                },
                audio: {
                    bitrate: '128k'
                }
            },
            {
                headers: this.headers
            }
        );
        
        return response.data;
    }

    async checkStatus(statusUrl) {
        const response = await axios.get(statusUrl, {
            headers: this.headers
        });
        
        return response.data;
    }

    async waitForCompletion(statusUrl, interval = 2000) {
        while (true) {
            const status = await this.checkStatus(statusUrl);
            if (status.status === 'completed') return status;
            if (status.status === 'failed') throw new Error('Conversion failed');
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    async download(url) {
        await this.initialize();
        const convertResult = await this.convertVideo(url);
        const completedStatus = await this.waitForCompletion(convertResult.statusUrl);
        const audioResponse = await axios.get(completedStatus.downloadUrl, {
            headers: this.headers,
            responseType: 'arraybuffer'
        });
        return {
            data: audioResponse.data,
            title: completedStatus.title,
            duration: completedStatus.duration,
            downloadUrl: completedStatus.downloadUrl
        };
    }
}

async function getVoipClient() {
    if (!VoipClient) {
        const module = await import('baileys-caller');
        VoipClient = module.default || module.VoipClient || module;
    }
    return VoipClient;
}

function hasSession() {
    return fs.existsSync(CREDS_FILE);
}

function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function formatUptime(ms) {
    if (!ms) return '-';
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    return hour + 'h ' + (min % 60) + 'm ' + (sec % 60) + 's';
}

function getRTCStatus() {
    return {
        session: hasSession(),
        connecting: isConnecting,
        connected: !!voipClient,
        activeCall: !!activeCall,
        endingCall: isEndingCall,
        uptime: clientStartedAt ? formatUptime(Date.now() - clientStartedAt) : '-',
        lastCallTarget: lastCallTarget || '-',
        lastCallAt: lastCallAt ? new Date(lastCallAt).toLocaleString('id-ID') : '-',
        lastError: lastError || '-'
    };
}

async function waitForEndingCall(timeoutMs) {
    let waited = 0;
    while (isEndingCall && waited < timeoutMs) {
        await sleep(300);
        waited += 300;
    }
    return !isEndingCall;
}

async function clearCall() {
    if (isEndingCall) {
        await waitForEndingCall(20000);
        return;
    }
    if (!activeCall) return;
    isEndingCall = true;
    const call = activeCall;
    activeCall = null;
    global.__rtcRefs.delete(call);
    try {
        console.log('[RTC] Ending call...');
        if (typeof call.end === 'function') call.end();
        if (typeof call.waitForEnd === 'function') {
            await Promise.race([
                call.waitForEnd(),
                sleep(6000)
            ]);
        } else {
            await sleep(2000);
        }
    } catch (err) {
        console.error('[RTC END]', err.message || err);
    }
    console.log('[RTC] Call cleared.');
    isEndingCall = false;
}

async function hardResetRTC() {
    try { if (activeCall) activeCall.end(); } catch {}
    activeCall = null;
    isEndingCall = false;
    try { if (voipClient) voipClient.disconnect(); } catch {}
    voipClient = null;
    await sleep(3000);
}

function safeDelete(file) {
    try {
        if (file && fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    } catch (e) {}
}

async function downloadAudio(query) {
    const search = await yts(query);
    if (!search.videos.length) throw new Error('Lagu tidak ditemukan');
    
    const video = search.videos[0];
    const ytdl = new YTDLopus();
    const result = await ytdl.download(video.url);
    
    const safeTitle = video.title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const fileName = `${safeTitle}_${Date.now()}.opus`;
    const filePath = path.join(AUDIO_CACHE, fileName);
    fs.writeFileSync(filePath, Buffer.from(result.data));
    
    return {
        path: filePath,
        title: video.title,
        duration: result.duration,
        fileName: fileName
    };
}

function attachCallListeners(data) {
    const { call, conn, m, tmpFile, state } = data;

    async function cleanup(message) {
        if (state.cleaned) return;
        state.cleaned = true;
        clearTimeout(state.ringingTimeout);
        if (activeCall === call) activeCall = null;
        global.__rtcRefs.delete(call);
        safeDelete(tmpFile);
        try { await conn.sendMessage(m.chat, { text: message }, { quoted: m }); } catch (e) {}
    }

    call.on('ringing', async function() {
        if (state.cleaned) return;
        state.ringing = true;
        clearTimeout(state.ringingTimeout);
        try { await conn.sendMessage(m.chat, { text: '🔔 berdering...' }, { quoted: m }); } catch (e) {}
    });

    call.on('connected', async function() {
        if (state.cleaned) return;
        state.connected = true;
        try { await conn.sendMessage(m.chat, { text: '✅ panggilan tersambung!' }, { quoted: m }); } catch (e) {}
    });

    call.on('ended', function(reason) {
        cleanup('📵 panggilan berakhir' + (reason ? ': ' + reason : '.'));
    });

    call.on('error', async function(err) {
        if (err.message?.includes('CALL_TIMEOUT') || err.message?.includes('already active')) {
            await conn.sendMessage(m.chat, { text: '🔄 rtc stuck detected, resetting...' }, { quoted: m });
            await hardResetRTC();
            await connectRTC();
            return conn.sendMessage(m.chat, { text: '🟢 rtc recovered, coba lagi' }, { quoted: m });
        }
        lastError = err && err.message ? err.message : String(err);
        cleanup('❌ error rtc:\n' + lastError);
    });

    state.ringingTimeout = setTimeout(async function() {
        if (state.cleaned || state.ringing) return;
        try { if (typeof call.end === 'function') call.end(); } catch (e) {}
        cleanup('⏱️ tidak ada respons dari wa server (15 detik).\ncoba lagi nanti.');
    }, 15000);
}

async function connectRTC() {
    if (voipClient) {
        try {
            if (typeof voipClient.ping === 'function') await voipClient.ping();
            return true;
        } catch (e) {
            voipClient = null;
        }
    }
    
    if (isConnecting) {
        await sleep(3000);
        return !!voipClient;
    }
    
    isConnecting = true;
    lastError = null;
    
    try {
        const VoipClientClass = await getVoipClient();
        const client = new VoipClientClass({ authDir: AUTH_DIR });
        
        await Promise.race([
            client.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (60s)')), 60000))
        ]);
        
        voipClient = client;
        clientStartedAt = Date.now();
        return true;
    } catch (err) {
        console.error('[RTC LOGIN]', err);
        voipClient = null;
        lastError = err.message || String(err);
        return false;
    } finally {
        isConnecting = false;
    }
}

async function logoutRTC() {
    try {
        if (activeCall) { try { activeCall.end(); } catch {} activeCall = null; }
        if (voipClient) { try { voipClient.disconnect(); } catch {} voipClient = null; }
        if (fs.existsSync(AUTH_DIR)) fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        clientStartedAt = null; lastError = null; lastCallTarget = null; lastCallAt = null;
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    command: ['call', 'rtc'],
    isOwner: true,
    handler: async (sock, m, { prefix, command, args }) => {
        const reply = (text) => sock.sendMessage(m.chat, { text }, { quoted: m });
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === "login") {
            if (isConnecting) return reply('🟡 sedang menghubungkan, tunggu...');
            if (voipClient) return reply('✅ voip client sudah aktif.');
            isConnecting = true;
            lastError = null;
            try {
                await reply('🔐 menghubungkan voip client...');
                const VoipClientClass = await getVoipClient();
                const client = new VoipClientClass({ authDir: AUTH_DIR });
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (60s)')), 60000))
                ]);
                voipClient = client;
                clientStartedAt = Date.now();
                return reply('✅ voip client berhasil connect.');
            } catch (err) {
                voipClient = null;
                lastError = err.message || String(err);
                return reply('❌ login/connect gagal:\n' + lastError);
            } finally {
                isConnecting = false;
            }
        }

        if (subCommand === "logout") {
            await reply('🔄 menghapus session...');
            const success = await logoutRTC();
            return reply(success ? '✅ session berhasil dihapus. silahkan .call login ulang.' : '❌ gagal menghapus session.');
        }

        if (subCommand === "status") {
            const s = getRTCStatus();
            return reply(
                '📡 *RTC STATUS*\n\n' +
                '• Session File  : ' + (s.session ? '✅ Ada' : '❌ Tidak ada') + '\n' +
                '• Client        : ' + (s.connected ? '🟢 Connected' : s.connecting ? '🟡 Connecting...' : '🔴 Disconnected') + '\n' +
                '• Active Call   : ' + (s.activeCall ? '📞 Ya' : '📴 Tidak') + '\n' +
                '• Ending Call   : ' + (s.endingCall ? '🟡 Cleanup...' : '⚪ Tidak') + '\n' +
                '• Uptime        : ' + s.uptime + '\n' +
                '• Last Target   : ' + s.lastCallTarget + '\n' +
                '• Last Call     : ' + s.lastCallAt + '\n' +
                '• Last Error    : ' + s.lastError + '\n' +
                '• Native Refs   : ' + global.__rtcRefs.size
            );
        }

        if (subCommand === "reconnect") {
            if (isConnecting) return reply('🟡 sedang connecting, tunggu...');
            isConnecting = true;
            lastError = null;
            await reply('🔄 reconnecting voip client...');
            try {
                if (voipClient) { try { voipClient.disconnect(); } catch (e) {} voipClient = null; }
                await sleep(2000);
                const VoipClientClass = await getVoipClient();
                const client = new VoipClientClass({ authDir: AUTH_DIR });
                await Promise.race([
                    client.connect(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connect timeout (60s)')), 60000))
                ]);
                voipClient = client;
                clientStartedAt = Date.now();
                return reply('✅ reconnect berhasil.');
            } catch (err) {
                voipClient = null;
                lastError = err.message || String(err);
                return reply('❌ reconnect gagal:\n' + lastError);
            } finally {
                isConnecting = false;
            }
        }

        if (subCommand === "end") {
            if (isEndingCall) return reply('🟡 sedang mengakhiri panggilan...');
            if (!activeCall) return reply('📵 tidak ada panggilan aktif.');
            await reply('🟡 mengakhiri panggilan...');
            await clearCall();
            return reply('📵 panggilan ditutup.');
        }

        if (subCommand === "music") {
            const query = args.slice(1).join(' ');
            if (!query) return reply(`🎵 ${prefix}call music judul_lagu`);
            
            await sock.sendMessage(m.chat, { react: { text: "🎵", key: m.key } });
            
            if (!hasSession()) return reply('❌ session belum ada.\nGunakan: ' + prefix + 'call login');
            if (!voipClient) {
                const connected = await connectRTC();
                if (!connected) return reply('❌ voip client belum connect.\nGunakan: ' + prefix + 'call login');
            }

            let target = m.sender.replace(/\D/g, '');
            let queryText = query;

            const numbers = query.match(/\d{10,15}/g);
            if (numbers && numbers.length > 0) {
                target = numbers[0];
                queryText = query.replace(numbers[0], '').trim();
            }

            if (!queryText) return reply(`🎵 ${prefix}call music [nomor] judul_lagu\nContoh: ${prefix}call music 6281351692548 komang`);

            if (isEndingCall) {
                await reply('⏳ menunggu cleanup panggilan sebelumnya...');
                const ok = await waitForEndingCall(20000);
                if (!ok) return reply('❌ timeout menunggu cleanup. coba lagi.');
            }

            if (activeCall) {
                await reply('⏳ menutup panggilan sebelumnya...');
                await clearCall();
            }

            let tmpFile = null;

            try {
                await reply(`🎵 mendownload: ${queryText}...`);
                const audio = await downloadAudio(queryText);
                tmpFile = audio.path;
                
                if (!fs.existsSync(tmpFile)) throw new Error('file audio tidak ditemukan');
                
                const mentionTag = `@${target}`;
                await reply(`📞 menghubungi ${mentionTag} dengan lagu ${audio.title}...`);
                
                if (activeCall) throw new Error('masih ada active call');
                if (isEndingCall) throw new Error('rtc masih cleanup');

                let call;
                try {
                    await delay(500);
                    if (activeCall) throw new Error('call_still_active');
                    call = await Promise.race([
                        voipClient.call(target, { audioSource: tmpFile }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('call_timeout')), 20000))
                    ]);
                } catch (err) {
                    if (err.message && err.message.toLowerCase().includes('already active')) {
                        console.log('[rtc] native stuck, reconnecting background...');
                        (async function() {
                            try {
                                if (voipClient) { try { voipClient.disconnect(); } catch (e) {} voipClient = null; }
                                await sleep(2000);
                                isConnecting = true;
                                const VoipClientClass = await getVoipClient();
                                const client = new VoipClientClass({ authDir: AUTH_DIR });
                                await client.connect();
                                voipClient = client;
                                clientStartedAt = Date.now();
                                console.log('[rtc] background reconnect success');
                            } catch (e) {
                                console.error('[rtc] background reconnect failed:', e);
                                lastError = e.message || String(e);
                                voipClient = null;
                            } finally {
                                isConnecting = false;
                            }
                        })();
                        throw new Error(`native call masih aktif di wasm.\nclient sedang reconnect, tunggu beberapa detik lalu coba lagi.`);
                    }
                    throw err;
                }

                activeCall = call;
                global.__rtcRefs.add(call);
                lastCallTarget = target;
                lastCallAt = Date.now();
                lastError = null;

                attachCallListeners({ call, conn: sock, m, tmpFile, state: { cleaned: false, connected: false, ringing: false, ringingTimeout: null } });
                if (call.waitForEnd) await call.waitForEnd();

            } catch (err) {
                console.error('[rtc call error]', err);
                safeDelete(tmpFile);
                activeCall = null;
                lastError = err.message || String(err);
                return reply('❌ gagal melakukan panggilan:\n' + lastError);
            }
            return;
        }

        if (!subCommand || subCommand === "help") {
            return reply(
                `CALLER COMMANDS\n\n` +
                `┌  ◦  ${prefix}call login\n` +
                `│  ◦  ${prefix}call logout\n` +
                `│  ◦  ${prefix}call status\n` +
                `│  ◦  ${prefix}call reconnect\n` +
                `│  ◦  ${prefix}call end\n` +
                `│  ◦  ${prefix}call music [nomor] judul_lagu\n` +
                `└  ◦  ${prefix}call nomor file.mp3`
            );
        }

        if (!voipClient) {
            const connected = await connectRTC();
            if (!connected) return reply('❌ voip client belum connect.\nGunakan: ' + prefix + 'call login');
        }

        const target = args[0] ? args[0].replace(/\D/g, '') : m.sender.replace(/\D/g, '');
        if (!target) return reply('❌ nomor target tidak valid.');

        const audioFile = args[1];

        if (isEndingCall) {
            await reply('⏳ menunggu cleanup panggilan sebelumnya...');
            const ok = await waitForEndingCall(20000);
            if (!ok) return reply('❌ timeout menunggu cleanup. coba lagi.');
        }

        if (activeCall) {
            await reply('⏳ menutup panggilan sebelumnya...');
            await clearCall();
        }

        let audioSource = 'silence';
        let tmpFile = null;

        if (audioFile) {
            const fullPath = path.resolve(audioFile);
            if (!fs.existsSync(fullPath)) return reply(`❌ file audio tidak ditemukan: ${audioFile}`);
            tmpFile = fullPath;
            audioSource = fullPath;
            await reply(`🎵 menggunakan file audio: ${path.basename(fullPath)}`);
        }

        const mentionTag = `@${target}`;
        await reply(`📞 menghubungi ${mentionTag}...`);

        try {
            if (activeCall) throw new Error('masih ada active call');
            if (isEndingCall) throw new Error('rtc masih cleanup');

            let call;
            try {
                await delay(500);
                if (activeCall) throw new Error('call_still_active');
                call = await Promise.race([
                    voipClient.call(target, { audioSource: audioSource }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('call_timeout')), 20000))
                ]);
            } catch (err) {
                if (err.message && err.message.toLowerCase().includes('already active')) {
                    console.log('[rtc] native stuck, reconnecting background...');
                    (async function() {
                        try {
                            if (voipClient) { try { voipClient.disconnect(); } catch (e) {} voipClient = null; }
                            await sleep(2000);
                            isConnecting = true;
                            const VoipClientClass = await getVoipClient();
                            const client = new VoipClientClass({ authDir: AUTH_DIR });
                            await client.connect();
                            voipClient = client;
                            clientStartedAt = Date.now();
                        } catch (e) {
                            lastError = e.message || String(e);
                            voipClient = null;
                        } finally {
                            isConnecting = false;
                        }
                    })();
                    throw new Error('native call masih aktif di wasm.\nclient sedang reconnect, tunggu beberapa detik lalu coba lagi.');
                }
                throw err;
            }

            activeCall = call;
            global.__rtcRefs.add(call);
            lastCallTarget = target;
            lastCallAt = Date.now();
            lastError = null;

            attachCallListeners({ call, conn: sock, m, tmpFile, state: { cleaned: false, connected: false, ringing: false, ringingTimeout: null } });
            if (call.waitForEnd) await call.waitForEnd();

        } catch (err) {
            console.error('[rtc call error]', err);
            activeCall = null;
            lastError = err.message || String(err);
            return reply('❌ gagal melakukan panggilan:\n' + lastError);
        }
    }
};
