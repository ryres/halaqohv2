const pool = require('../../config/database');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT h.*, g.nama as guru_nama, COUNT(s.id) as jumlah_santri FROM halaqoh h LEFT JOIN guru g ON h.guru_id = g.id LEFT JOIN santri s ON s.halaqoh_id = h.id WHERE h.is_deleted = 0 GROUP BY h.id ORDER BY h.id DESC`);
    const [gurus] = await pool.query('SELECT * FROM guru WHERE is_deleted = 0');
    res.render('master/halaqoh', { halaqohs: rows, gurus, success: req.query.success || null, error: req.query.error || null });
  } catch (err) {
    console.error(err);
    res.render('master/halaqoh', { halaqohs: [], gurus: [], success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const nama_halaqoh = typeof req.body.nama_halaqoh === 'string' ? req.body.nama_halaqoh.trim() : '';
  const guru_id = typeof req.body.guru_id === 'string' && req.body.guru_id.trim() !== '' ? Number(req.body.guru_id) : null;
  const ruangan = typeof req.body.ruangan === 'string' ? req.body.ruangan.trim() : null;
  const jadwal = typeof req.body.jadwal === 'string' ? req.body.jadwal.trim() : null;
  if (!nama_halaqoh) {
    req.session.flash = { type: 'error', message: 'Nama halaqoh wajib diisi.' };
    return res.redirect('/halaqoh');
  }
  if (guru_id !== null && (!Number.isInteger(guru_id) || guru_id < 1)) {
    req.session.flash = { type: 'error', message: 'Guru yang dipilih tidak valid.' };
    return res.redirect('/halaqoh');
  }
  try {
    await pool.query('INSERT INTO halaqoh (nama_halaqoh, guru_id, ruangan, jadwal) VALUES (?, ?, ?, ?)', [nama_halaqoh, guru_id, ruangan, jadwal]);
    req.session.flash = { type: 'success', message: 'Halaqoh berhasil ditambahkan.' };
    res.redirect('/halaqoh');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menambah halaqoh.' };
    res.redirect('/halaqoh');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[halaqoh]] = await pool.query('SELECT * FROM halaqoh WHERE id = ? AND is_deleted = 0', [id]);
    const [gurus] = await pool.query('SELECT * FROM guru WHERE is_deleted = 0');
    res.render('master/halaqoh-form', { halaqoh, gurus: gurus || [], isEdit: true });
  } catch (err) {
    res.redirect('/halaqoh?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const nama_halaqoh = typeof req.body.nama_halaqoh === 'string' ? req.body.nama_halaqoh.trim() : '';
  const guru_id = typeof req.body.guru_id === 'string' && req.body.guru_id.trim() !== '' ? Number(req.body.guru_id) : null;
  const ruangan = typeof req.body.ruangan === 'string' ? req.body.ruangan.trim() : null;
  const jadwal = typeof req.body.jadwal === 'string' ? req.body.jadwal.trim() : null;
  if (!nama_halaqoh) {
    req.session.flash = { type: 'error', message: 'Nama halaqoh wajib diisi.' };
    return res.redirect(`/halaqoh/${id}`);
  }
  if (guru_id !== null && (!Number.isInteger(guru_id) || guru_id < 1)) {
    req.session.flash = { type: 'error', message: 'Guru yang dipilih tidak valid.' };
    return res.redirect(`/halaqoh/${id}`);
  }
  try {
    await pool.query('UPDATE halaqoh SET nama_halaqoh = ?, guru_id = ?, ruangan = ?, jadwal = ? WHERE id = ?', [nama_halaqoh, guru_id, ruangan, jadwal, id]);
    req.session.flash = { type: 'success', message: 'Halaqoh berhasil diperbarui.' };
    res.redirect('/halaqoh');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal memperbarui halaqoh.' };
    res.redirect('/halaqoh');
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE halaqoh SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0', [id]);
    req.session.flash = { type: 'success', message: 'Halaqoh berhasil dihapus.' };
    res.redirect('/halaqoh');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menghapus halaqoh.' };
    res.redirect('/halaqoh');
  }
};
