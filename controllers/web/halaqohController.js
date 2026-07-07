const pool = require('../../config/database');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT h.*, g.nama as guru_nama, COUNT(s.id) as jumlah_santri FROM halaqoh h LEFT JOIN guru g ON h.guru_id = g.id LEFT JOIN santri s ON s.halaqoh_id = h.id GROUP BY h.id ORDER BY h.id DESC`);
    const [gurus] = await pool.query('SELECT * FROM guru');
    res.render('master/halaqoh', { halaqohs: rows, gurus, success: req.query.success || null, error: req.query.error || null });
  } catch (err) {
    console.error(err);
    res.render('master/halaqoh', { halaqohs: [], gurus: [], success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const { nama_halaqoh, guru_id, ruangan, jadwal } = req.body;
  try {
    await pool.query('INSERT INTO halaqoh (nama_halaqoh, guru_id, ruangan, jadwal) VALUES (?, ?, ?, ?)', [nama_halaqoh, guru_id || null, ruangan, jadwal]);
    res.redirect('/halaqoh');
  } catch (err) {
    res.redirect('/halaqoh?error=Gagal menambah halaqoh');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[halaqoh]] = await pool.query('SELECT * FROM halaqoh WHERE id = ?', [id]);
    const [gurus] = await pool.query('SELECT * FROM guru');
    res.render('master/halaqoh-form', { halaqoh, gurus: gurus || [], isEdit: true });
  } catch (err) {
    res.redirect('/halaqoh?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_halaqoh, guru_id, ruangan, jadwal } = req.body;
  try {
    await pool.query('UPDATE halaqoh SET nama_halaqoh = ?, guru_id = ?, ruangan = ?, jadwal = ? WHERE id = ?', [nama_halaqoh, guru_id || null, ruangan, jadwal, id]);
    res.redirect('/halaqoh');
  } catch (err) {
    res.redirect('/halaqoh?error=Gagal update');
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM halaqoh WHERE id = ?', [id]);
    res.redirect('/halaqoh');
  } catch (err) {
    res.redirect('/halaqoh?error=Gagal hapus');
  }
};
