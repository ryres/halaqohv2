const pool = require('../../config/database');

// Skala indikator: 1=Belum dikuasai, 2=Perlu bimbingan, 3=Dalam proses perkembangan, 4=Sudah dikuasai
const STATUS_LABELS = {
  1: 'Belum dikuasai',
  2: 'Perlu bimbingan',
  3: 'Dalam proses perkembangan',
  4: 'Sudah dikuasai',
};
const INDICATORS = [
  { key: 'makharijul', label: 'Makharijul huruf' },
  { key: 'tajwid', label: 'Penerapan tajwid' },
  { key: 'kelancaran', label: 'Kelancaran membaca' },
];
const emptyCounts = () => ({ 1: 0, 2: 0, 3: 0, 4: 0 });
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dstr = (d) => {
  if (d instanceof Date) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  return String(d).slice(0, 10);
};

// Simpan/update 1 penilaian (1 santri per tanggal) — dipakai save() dan autosave saveRow()
async function upsertAssessment(o) {
  const [[ex]] = await pool.query(
    'SELECT id FROM tahsin_penilaian WHERE santri_id = ? AND tanggal = ? AND is_deleted = 0 LIMIT 1',
    [o.santriId, o.tanggal]);
  if (ex) {
    await pool.query(
      'UPDATE tahsin_penilaian SET halaqoh_id=?, guru_id=?, makharijul=?, tajwid=?, kelancaran=?, catatan=? WHERE id=?',
      [o.halaqohId, o.guruId, o.m, o.tj, o.kl, o.note, ex.id]);
    return ex.id;
  }
  const [r] = await pool.query(
    'INSERT INTO tahsin_penilaian (santri_id, halaqoh_id, guru_id, tanggal, makharijul, tajwid, kelancaran, catatan) VALUES (?,?,?,?,?,?,?,?)',
    [o.santriId, o.halaqohId, o.guruId, o.tanggal, o.m, o.tj, o.kl, o.note]);
  return r.insertId;
}

// ---------- Dashboard ----------
exports.dashboard = async (req, res) => {
  const base = {
    STATUS_LABELS, INDICATORS,
    halaqohs: [], halaqohFilter: null,
    cardCounts: emptyCounts(), perIndicator: {}, totalSantri: 0,
    perHalaqoh: [], trend: { labels: [], makharijul: [], tajwid: [], kelancaran: [] },
    recent: [], success: null, error: null,
  };
  try {
    const [halaqohs] = await pool.query('SELECT id, nama_halaqoh FROM halaqoh WHERE is_deleted = 0 ORDER BY nama_halaqoh');
    const halaqohFilter = req.query.halaqoh_id ? Number(req.query.halaqoh_id) : null;
    const filterSql = halaqohFilter ? ' AND t.halaqoh_id = ?' : '';
    const filterParams = halaqohFilter ? [halaqohFilter] : [];

    // penilaian terakhir per santri
    const [latest] = await pool.query(`
      SELECT t.*, s.nama AS santri_nama, s.kelas, h.nama_halaqoh
      FROM tahsin_penilaian t
      JOIN (SELECT santri_id, MAX(id) AS maxid FROM tahsin_penilaian WHERE is_deleted = 0 GROUP BY santri_id) m
        ON t.id = m.maxid
      JOIN santri s ON s.id = t.santri_id
      LEFT JOIN halaqoh h ON h.id = t.halaqoh_id
      WHERE t.is_deleted = 0 ${filterSql}
    `, filterParams);

    const cardCounts = emptyCounts();
    const perIndicator = {};
    INDICATORS.forEach(i => { perIndicator[i.key] = emptyCounts(); });
    const groupMap = {};
    latest.forEach(r => {
      INDICATORS.forEach(i => { const v = Number(r[i.key]); if (perIndicator[i.key][v] !== undefined) perIndicator[i.key][v]++; });
      const overall = Math.min(Number(r.makharijul), Number(r.tajwid), Number(r.kelancaran));
      if (cardCounts[overall] !== undefined) cardCounts[overall]++;
      const gName = r.halaqoh_id ? (r.nama_halaqoh || 'Halaqoh #' + r.halaqoh_id) : (r.kelas || 'Tanpa Kelompok');
      const gKey = (r.halaqoh_id ? 'h' : 'k') + gName;
      if (!groupMap[gKey]) groupMap[gKey] = { nama: gName, n: 0, makharijul: 0, tajwid: 0, kelancaran: 0 };
      const o = groupMap[gKey];
      o.n++; o.makharijul += Number(r.makharijul); o.tajwid += Number(r.tajwid); o.kelancaran += Number(r.kelancaran);
    });
    const perHalaqoh = Object.values(groupMap).map(o => ({
      nama: o.nama, jumlah: o.n,
      makharijul: +(o.makharijul / o.n).toFixed(2),
      tajwid: +(o.tajwid / o.n).toFixed(2),
      kelancaran: +(o.kelancaran / o.n).toFixed(2),
    }));

    // tren rata-rata per tanggal
    const [trendRows] = await pool.query(`
      SELECT t.tanggal, AVG(t.makharijul) AS m, AVG(t.tajwid) AS tj, AVG(t.kelancaran) AS kl
      FROM tahsin_penilaian t WHERE t.is_deleted = 0 ${filterSql}
      GROUP BY t.tanggal ORDER BY t.tanggal ASC
    `, filterParams);
    const trend = {
      labels: trendRows.map(r => dstr(r.tanggal)),
      makharijul: trendRows.map(r => +Number(r.m).toFixed(2)),
      tajwid: trendRows.map(r => +Number(r.tj).toFixed(2)),
      kelancaran: trendRows.map(r => +Number(r.kl).toFixed(2)),
    };

    const [recent] = await pool.query(`
      SELECT t.*, s.nama AS santri_nama, h.nama_halaqoh
      FROM tahsin_penilaian t
      JOIN santri s ON s.id = t.santri_id
      LEFT JOIN halaqoh h ON h.id = t.halaqoh_id
      WHERE t.is_deleted = 0 ORDER BY t.tanggal DESC, t.id DESC LIMIT 12
    `);
    recent.forEach(r => { r.tanggal_str = dstr(r.tanggal); });

    res.render('tahsin/dashboard', {
      ...base, halaqohs, halaqohFilter,
      cardCounts, perIndicator, totalSantri: latest.length,
      perHalaqoh, trend, recent,
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) {
    console.error('tahsin.dashboard:', err);
    res.render('tahsin/dashboard', { ...base, error: err.message });
  }
};

// ---------- Form Input ----------
exports.inputForm = async (req, res) => {
  try {
    const [halaqohs] = await pool.query('SELECT id, nama_halaqoh FROM halaqoh WHERE is_deleted = 0 ORDER BY nama_halaqoh');
    const [kelasRows] = await pool.query("SELECT DISTINCT kelas FROM santri WHERE is_deleted = 0 AND kelas IS NOT NULL AND kelas <> '' ORDER BY kelas");
    const halaqohId = req.query.halaqoh_id ? Number(req.query.halaqoh_id) : null;
    const kelas = req.query.kelas ? String(req.query.kelas) : '';
    const q = req.query.q ? String(req.query.q).trim() : '';

    const belum = req.query.belum === '1';
    const where = ['s.is_deleted = 0'];
    const params = [];
    if (halaqohId) { where.push('s.halaqoh_id = ?'); params.push(halaqohId); }
    if (kelas) { where.push('s.kelas = ?'); params.push(kelas); }
    if (q) { where.push('s.nama LIKE ?'); params.push('%' + q + '%'); }
    if (belum) { where.push('NOT EXISTS (SELECT 1 FROM tahsin_penilaian tp WHERE tp.santri_id = s.id AND tp.is_deleted = 0 AND tp.tanggal = ?)'); params.push(today()); }

    const [rows] = await pool.query(
      `SELECT s.id, s.nama, s.kelas FROM santri s WHERE ${where.join(' AND ')} ORDER BY s.kelas, s.nama LIMIT 300`, params);

    const ids = rows.map(r => r.id);
    const lastMap = {};
    if (ids.length) {
      const [lastRows] = await pool.query(
        `SELECT t.* FROM tahsin_penilaian t
         JOIN (SELECT santri_id, MAX(id) AS maxid FROM tahsin_penilaian WHERE is_deleted = 0 GROUP BY santri_id) m ON t.id = m.maxid
         WHERE t.is_deleted = 0 AND t.santri_id IN (${ids.map(() => '?').join(',')})`, ids);
      lastRows.forEach(r => { lastMap[r.santri_id] = r; });
    }
    const santris = rows.map(s => ({ ...s, last: lastMap[s.id] || null }));

    res.render('tahsin/input', {
      STATUS_LABELS, INDICATORS, halaqohs,
      kelasList: kelasRows.map(r => r.kelas),
      halaqohId, kelas, q, belum, santris, today: today(),
      success: req.query.success || null, error: req.query.error || null,
    });
  } catch (err) {
    console.error('tahsin.inputForm:', err);
    res.redirect('/tahsin?error=' + encodeURIComponent(err.message));
  }
};

// ---------- Simpan Input ----------
exports.save = async (req, res) => {
  try {
    const halaqohId = req.body.halaqoh_id ? Number(req.body.halaqoh_id) : null;
    const tanggal = req.body.tanggal || today();
    const makh = req.body.makharijul || {};
    const taj = req.body.tajwid || {};
    const kel = req.body.kelancaran || {};
    const catatan = req.body.catatan || {};

    let guruId = null;
    if (halaqohId) {
      const [[h]] = await pool.query('SELECT guru_id FROM halaqoh WHERE id = ?', [halaqohId]);
      guruId = h ? h.guru_id : null;
    }

    const ids = Object.keys(makh);
    let saved = 0;
    for (const sid of ids) {
      const m = Number(makh[sid]), tj = Number(taj[sid]), kl = Number(kel[sid]);
      if (![1, 2, 3, 4].includes(m) || ![1, 2, 3, 4].includes(tj) || ![1, 2, 3, 4].includes(kl)) continue;
      const note = catatan[sid] && String(catatan[sid]).trim() ? String(catatan[sid]).trim() : null;
      const [[s]] = await pool.query('SELECT halaqoh_id FROM santri WHERE id = ?', [Number(sid)]);
      await upsertAssessment({ santriId: Number(sid), halaqohId: halaqohId || (s ? s.halaqoh_id : null), guruId, tanggal, m, tj, kl, note });
      saved++;
    }
    req.session.flash = { type: 'success', message: `${saved} penilaian tahsin tersimpan.` };
    const back = req.body.back_query ? '?' + req.body.back_query : '';
    res.redirect('/tahsin/input' + back);
  } catch (err) {
    console.error('tahsin.save:', err);
    req.session.flash = { type: 'error', message: 'Gagal menyimpan: ' + err.message };
    res.redirect('/tahsin/input');
  }
};

// ---------- Detail per Santri ----------
exports.santriDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [[santri]] = await pool.query(
      `SELECT s.*, h.nama_halaqoh, g.nama AS guru_nama
       FROM santri s LEFT JOIN halaqoh h ON s.halaqoh_id = h.id LEFT JOIN guru g ON s.guru_id = g.id
       WHERE s.id = ? AND s.is_deleted = 0`, [id]);
    if (!santri) return res.redirect('/tahsin?error=' + encodeURIComponent('Santri tidak ditemukan'));
    const [rows] = await pool.query('SELECT * FROM tahsin_penilaian WHERE santri_id = ? AND is_deleted = 0 ORDER BY tanggal ASC, id ASC', [id]);
    rows.forEach(r => { r.tanggal_str = dstr(r.tanggal); });
    const trend = {
      labels: rows.map(r => dstr(r.tanggal)),
      makharijul: rows.map(r => Number(r.makharijul)),
      tajwid: rows.map(r => Number(r.tajwid)),
      kelancaran: rows.map(r => Number(r.kelancaran)),
    };
    res.render('tahsin/santri', { STATUS_LABELS, INDICATORS, santri, rows, trend });
  } catch (err) {
    console.error('tahsin.santriDetail:', err);
    res.redirect('/tahsin?error=' + encodeURIComponent(err.message));
  }
};

// ---------- Autosave 1 baris (AJAX) ----------
exports.saveRow = async (req, res) => {
  try {
    const b = req.body || {};
    const santriId = Number(b.santri_id);
    const tanggal = b.tanggal || today();
    const m = Number(b.makharijul), tj = Number(b.tajwid), kl = Number(b.kelancaran);
    if (!santriId || ![1, 2, 3, 4].includes(m) || ![1, 2, 3, 4].includes(tj) || ![1, 2, 3, 4].includes(kl)) {
      return res.status(400).json({ ok: false, error: 'Data belum lengkap' });
    }
    const [[s]] = await pool.query('SELECT halaqoh_id FROM santri WHERE id = ?', [santriId]);
    const halaqohId = s ? s.halaqoh_id : null;
    let guruId = null;
    if (halaqohId) { const [[h]] = await pool.query('SELECT guru_id FROM halaqoh WHERE id = ?', [halaqohId]); guruId = h ? h.guru_id : null; }
    const note = b.catatan && String(b.catatan).trim() ? String(b.catatan).trim() : null;
    const id = await upsertAssessment({ santriId, halaqohId, guruId, tanggal, m, tj, kl, note });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('tahsin.saveRow:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
