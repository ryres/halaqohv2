const pool = require('../../config/database');

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
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('master/santri', { santris: [], halaqohs: [], gurus: [], currentPage: 1, totalPages: 1, success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const { nama, kelas } = req.body;
  let { juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  // basic server-side sanitization and validation
  juz = parseInt(juz) || 0;
  ayat = parseInt(ayat) || 0;
  tajwid = parseInt(tajwid) || 0;
  kelancaran = parseInt(kelancaran) || 0;
  makhraj = parseInt(makhraj) || 0;
  if (juz < 0 || juz > 30 || ayat < 0 || tajwid < 0 || tajwid > 100 || kelancaran < 0 || kelancaran > 100 || makhraj < 0 || makhraj > 100) {
    return res.redirect('/santri?error=Nilai input tidak valid');
  }
  try {
    await pool.query('INSERT INTO santri (nama, kelas, juz, surat, ayat, setoran_tgl, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)', 
      [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz || 30, req.session.userId]);
    res.redirect('/santri');
  } catch (err) {
    res.redirect('/santri?error=Gagal menambah santri');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[santri]] = await pool.query('SELECT * FROM santri WHERE id = ?', [id]);
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh');
    const [gurus] = await pool.query('SELECT * FROM guru');
    res.render('master/santri-form', { santri, halaqohs, gurus, isEdit: true });
  } catch (err) {
    res.redirect('/santri?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  let { nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  // normalize and validate
  juz = parseInt(juz) || 0;
  ayat = parseInt(ayat) || 0;
  tajwid = parseInt(tajwid) || 0;
  kelancaran = parseInt(kelancaran) || 0;
  makhraj = parseInt(makhraj) || 0;
  if (juz < 0 || juz > 30) return res.redirect('/santri?error=Nilai%20juz%20tidak%20valid');
  if (ayat < 0) return res.redirect('/santri?error=Nilai%20ayat%20tidak%20valid');
  const inRange100 = v => v >= 0 && v <= 100;
  if (![tajwid, kelancaran, makhraj].every(inRange100)) return res.redirect('/santri?error=Nilai%20persentase%20tidak%20valid');
  try {
    await pool.query('UPDATE santri SET nama=?, kelas=?, juz=?, surat=?, ayat=?, setoran_tgl=NOW(), tajwid=?, kelancaran=?, makhraj=?, halaqoh_id=?, guru_id=?, target_juz=? WHERE id=?', 
      [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz || 30, id]);
    res.redirect('/santri');
  } catch (err) {
    res.redirect('/santri?error=Gagal update');
  }
};

exports.requestDelete = async (req, res) => {
  const { id } = req.params;
  try {
    const reason = req.body && req.body.reason ? req.body.reason : 'Diminta user';
    await pool.query('INSERT INTO delete_requests (santri_id, requested_by, reason) VALUES (?, ?, ?)', [id, req.session.userId, reason]);
    res.redirect('/santri?success=Permintaan penghapusan telah dikirim ke admin');
  } catch (err) {
    res.redirect('/santri?error=Gagal membuat permintaan penghapusan');
  }
};
