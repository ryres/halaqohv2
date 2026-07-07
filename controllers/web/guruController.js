const pool = require('../../config/database');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM guru ORDER BY id DESC');
    res.render('master/guru', { gurus: rows, success: req.query.success || null, error: req.query.error || null });
  } catch (err) {
    console.error(err);
    res.render('master/guru', { gurus: [], success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const { nama, jabatan, unit } = req.body;
  try {
    await pool.query('INSERT INTO guru (nama, jabatan, unit) VALUES (?, ?, ?)', [nama, jabatan, unit]);
    res.redirect('/guru');
  } catch (err) {
    console.error(err);
    res.redirect('/guru?error=Gagal menambah guru');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[guru]] = await pool.query('SELECT * FROM guru WHERE id = ?', [id]);
    res.render('master/guru-form', { guru, isEdit: true });
  } catch (err) {
    res.redirect('/guru?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama, jabatan, unit } = req.body;
  try {
    await pool.query('UPDATE guru SET nama = ?, jabatan = ?, unit = ? WHERE id = ?', [nama, jabatan, unit, id]);
    res.redirect('/guru');
  } catch (err) {
    res.redirect('/guru?error=Gagal update');
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM guru WHERE id = ?', [id]);
    res.redirect('/guru');
  } catch (err) {
    res.redirect('/guru?error=Gagal hapus');
  }
};
