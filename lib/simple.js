const { getContentType, jidDecode } = require('@whiskeysockets/baileys');

/**
 * Decode JID / LID
 */
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
};

/**
 * Serialize Message (SMSG)
 */
function smsg(sock, m) {
    if (!m || !m.message) return m;

    m.mtype = getContentType(m.message);
    let msg = m.message;

    // Bongkar pesan jika dibungkus
    if (m.mtype === 'viewOnceMessageV2') {
        msg = msg.viewOnceMessageV2.message;
        m.mtype = getContentType(msg);
    } else if (m.mtype === 'viewOnceMessage') {
        msg = msg.viewOnceMessage.message;
        m.mtype = getContentType(msg);
    } else if (m.mtype === 'ephemeralMessage') {
        msg = msg.ephemeralMessage.message;
        m.mtype = getContentType(msg);
    }

    // --- PERBAIKAN: Tambahkan || '' sebelum .trim() agar tidak crash ---
    try {
        m.body = (
            m.mtype === 'conversation' ? msg.conversation :
            m.mtype === 'imageMessage' ? msg.imageMessage.caption :
            m.mtype === 'videoMessage' ? msg.videoMessage.caption :
            m.mtype === 'extendedTextMessage' ? msg.extendedTextMessage.text :
            m.mtype === 'buttonsResponseMessage' ? msg.buttonsResponseMessage.selectedButtonId :
            m.mtype === 'listResponseMessage' ? msg.listResponseMessage.singleSelectReply.selectedRowId :
            m.mtype === 'templateButtonReplyMessage' ? msg.templateButtonReplyMessage.selectedId :
            // --- FIX: Handle klik button/list interaktif (nativeFlowMessage / quick_reply / single_select) ---
            m.mtype === 'interactiveResponseMessage' ? (() => {
                try {
                    const ir = msg.interactiveResponseMessage;
                    const paramsJson = ir?.nativeFlowResponseMessage?.paramsJson;
                    if (paramsJson) {
                        const parsed = JSON.parse(paramsJson);
                        // 'id' diisi dari buttonParamsJson (quick_reply) atau row id (single_select)
                        return parsed.id || parsed.display_text || '';
                    }
                    // Fallback ke teks body interaktif
                    return ir?.body?.text || '';
                } catch { return ''; }
            })() :
            ''
        ) || ''; // <--- Ini pengamannya
        
        if (typeof m.body !== 'string') m.body = '';
        m.body = m.body.trim();
    } catch (e) {
        m.body = '';
    }

    // --- LOGIKA SENDER ---
    let sender = m.key.fromMe ? sock.user.id : (m.key.participant || m.key.remoteJid);
    m.sender = decodeJid(sender);
    
    m.isGroup = m.key.remoteJid.endsWith('@g.us');
    m.pushName = m.pushName || 'User';
    m.chat = m.key.remoteJid;

    return m;
}

module.exports = { smsg, decodeJid };