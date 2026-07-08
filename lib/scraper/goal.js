const axios = require('axios');

const _headerGacor = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
};

function _urlEdisi(edisi) {
  return edisi === 'id'
    ? 'https://www.goal.com/id/livescore'
    : `https://www.goal.com/${edisi}/live-scores`;
}

async function ambilLivescore(edisi = 'id') {
  try {
    const res = await axios.get(_urlEdisi(edisi), {
      headers: _headerGacor,
      timeout: 15000
    });
    
    const html = res.data;
    const cocok = html.match(/__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    
    if (!cocok) throw new Error('Gagal nemu __NEXT_DATA__, mungkin struktur halaman berubah');
    
    const json = JSON.parse(cocok[1]);
    const liveScores = json?.props?.pageProps?.content?.liveScores;
    
    if (!liveScores) throw new Error('Gagal nemu data liveScores di __NEXT_DATA__');
    
    return liveScores;
  } catch (error) {
    throw new Error(error.message);
  }
}

function _statusIndo(status) {
  const map = {
    FIXTURE: 'Belum Mulai',
    LIVE: 'Berlangsung',
    FINISHED: 'Selesai',
    POSTPONED: 'Ditunda',
    CANCELLED: 'Dibatalkan',
    HALF_TIME: 'Turun Minum'
  };
  return map[status] || status;
}

function _rapikanPertandingan(dataMentah) {
  return dataMentah.map(grup => ({
    kompetisi: grup.competition?.name || '-',
    kompetisiId: grup.competition?.id || null,
    area: grup.competition?.area?.name || '-',
    pertandingan: (grup.matches || []).map(m => ({
      id: m.id,
      status: _statusIndo(m.status),
      statusMentah: m.status,
      waktu: m.startDate,
      venue: m.venue?.name || null,
      tuanRumah: m.teamA?.name,
      tandang: m.teamB?.name,
      skorTuanRumah: m.score?.teamA ?? null,
      skorTandang: m.score?.teamB ?? null,
      kartuMerahTuanRumah: m.redCards?.teamA ?? 0,
      kartuMerahTandang: m.redCards?.teamB ?? 0,
      periode: m.period || null
    }))
  }));
}

async function getLivescore({ edisi = 'id', raw = false } = {}) {
  const data = await ambilLivescore(edisi);
  if (raw) return data;
  return _rapikanPertandingan(data);
}

module.exports = { getLivescore, ambilLivescore };
