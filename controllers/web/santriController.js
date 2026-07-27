const pool = require('../../config/database');
const quran = require('holy-quran');

const surahsData = quran.HolyQuranHafsVersion.map(s => ({
  name: s.name,
  englishName: s.englishName,
  ayahs: s.numberOfVerses
}));

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(`SELECT SQL_CALC_FOUND_ROWS s.*, h.nama_halaqoh AS halaqoh_nama, g.nama AS guru_nama FROM santri s LEFT JOIN halaqoh h ON s.halaqoh_id = h.id LEFT JOIN guru g ON s.guru_id = g.id ORDER BY s.id DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()');
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh');
    const [gurus] = await pool.query('SELECT * FROM guru');
    
    res.render('master/santri', { 
      santris: rows, 
      halaqohs,
      gurus,
      surahsData,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('master/santri', { santris: [], halaqohs: [], gurus: [], surahsData: [], currentPage: 1, totalPages: 1, success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const { nama, kelas } = req.body;
  let { juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  // normalisasi dan validasi
  juz = juz ? parseInt(juz) : null;
  ayat = ayat ? parseInt(ayat) : null;
  tajwid = tajwid ? parseInt(tajwid) : null;
  kelancaran = kelancaran ? parseInt(kelancaran) : null;
  makhraj = makhraj ? parseInt(makhraj) : null;
  target_juz = target_juz ? parseInt(target_juz) : null;
  surat = surat ? surat.trim() : null;

  const errors = [];
  if (juz !== null && (juz < 1 || juz > 30)) errors.push('Nilai Juz harus antara 1 dan 30.');
  if (ayat !== null && ayat < 1) errors.push('Nilai Ayat tidak valid.');
  if (tajwid !== null && (tajwid < 0 || tajwid > 100)) errors.push('Nilai Tajwid harus antara 0 dan 100.');
  if (kelancaran !== null && (kelancaran < 0 || kelancaran > 100)) errors.push('Nilai Kelancaran harus antara 0 dan 100.');
  if (makhraj !== null && (makhraj < 0 || makhraj > 100)) errors.push('Nilai Makhraj harus antara 0 dan 100.');
  if (target_juz !== null && (target_juz < 1 || target_juz > 30)) errors.push('Nilai Target Juz harus antara 1 dan 30.');

  if (errors.length > 0) {
    req.session.flash = { type: 'error', message: errors.join(' ') };
    return res.redirect('/santri');
  }
  try {
    await pool.query('INSERT INTO santri (nama, kelas, juz, surat, ayat, setoran_tgl, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)', 
      [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz ? parseInt(target_juz) : null, req.session.userId]);
    req.session.flash = { type: 'success', message: 'Santri berhasil ditambahkan.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menambah santri.' };
    res.redirect('/santri');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[santri]] = await pool.query('SELECT * FROM santri WHERE id = ?', [id]);
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh');
    const [gurus] = await pool.query('SELECT * FROM guru');
    res.render('master/santri-form', { santri, halaqohs, gurus, surahsData, isEdit: true });
  } catch (err) {
    res.redirect('/santri?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  let { nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  // normalisasi dan validasi
  juz = juz ? parseInt(juz) : null;
  ayat = ayat ? parseInt(ayat) : null;
  tajwid = tajwid ? parseInt(tajwid) : null;
  kelancaran = kelancaran ? parseInt(kelancaran) : null;
  makhraj = makhraj ? parseInt(makhraj) : null;
  target_juz = target_juz ? parseInt(target_juz) : null;
  surat = surat ? surat.trim() : null;

  const errors = [];
  if (juz !== null && (juz < 1 || juz > 30)) errors.push('Nilai Juz harus antara 1 dan 30.');
  if (ayat !== null && ayat < 1) errors.push('Nilai Ayat tidak valid.');
  if (tajwid !== null && (tajwid < 0 || tajwid > 100)) errors.push('Nilai Tajwid harus antara 0 dan 100.');
  if (kelancaran !== null && (kelancaran < 0 || kelancaran > 100)) errors.push('Nilai Kelancaran harus antara 0 dan 100.');
  if (makhraj !== null && (makhraj < 0 || makhraj > 100)) errors.push('Nilai Makhraj harus antara 0 dan 100.');
  if (target_juz !== null && (target_juz < 1 || target_juz > 30)) errors.push('Nilai Target Juz harus antara 1 dan 30.');

  if (errors.length > 0) {
    req.session.flash = { type: 'error', message: errors.join(' ') };
    return res.redirect('/santri');
  }
  try {
    await pool.query('UPDATE santri SET nama=?, kelas=?, juz=?, surat=?, ayat=?, setoran_tgl=NOW(), tajwid=?, kelancaran=?, makhraj=?, halaqoh_id=?, guru_id=?, target_juz=? WHERE id=?', 
      [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz ? parseInt(target_juz) : null, id]);
    req.session.flash = { type: 'success', message: 'Santri berhasil diperbarui.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal memperbarui santri.' };
    res.redirect('/santri');
  }
};

exports.requestDelete = async (req, res) => {
  const { id } = req.params;
  try {
    const reason = req.body && req.body.reason ? req.body.reason : 'Diminta user';
    await pool.query('INSERT INTO delete_requests (santri_id, requested_by, reason) VALUES (?, ?, ?)', [id, req.session.userId, reason]);
    req.session.flash = { type: 'success', message: 'Permintaan penghapusan telah dikirim ke admin.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal membuat permintaan penghapusan.' };
    res.redirect('/santri');
  }
};
