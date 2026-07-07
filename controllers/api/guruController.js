const pool = require('../../config/database');

exports.list = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM guru ORDER BY id DESC');
  res.json(rows);
};

exports.get = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM guru WHERE id = ?', [req.params.id]);
  res.json(rows[0] || null);
};

exports.create = async (req, res) => {
  const { nama, jabatan, unit } = req.body;
  const [result] = await pool.query('INSERT INTO guru (nama, jabatan, unit) VALUES (?, ?, ?)', [nama, jabatan, unit]);
  res.json({ id: result.insertId });
};

exports.update = async (req, res) => {
  const { nama, jabatan, unit } = req.body;
  await pool.query('UPDATE guru SET nama = ?, jabatan = ?, unit = ? WHERE id = ?', [nama, jabatan, unit, req.params.id]);
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM guru WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
};
