const pool = require('../../config/database');

exports.list = async (req, res) => {
  const [rows] = await pool.query(`SELECT h.*, COUNT(s.id) as jumlah_santri FROM halaqoh h LEFT JOIN santri s ON s.halaqoh_id = h.id GROUP BY h.id ORDER BY h.id DESC`);
  res.json(rows);
};

exports.get = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM halaqoh WHERE id = ?', [req.params.id]);
  res.json(rows[0] || null);
};

exports.create = async (req, res) => {
  const { nama_halaqoh, guru_id, ruangan, jadwal } = req.body;
  const [result] = await pool.query('INSERT INTO halaqoh (nama_halaqoh, guru_id, ruangan, jadwal) VALUES (?, ?, ?, ?)', [nama_halaqoh, guru_id || null, ruangan, jadwal]);
  res.json({ id: result.insertId });
};

exports.update = async (req, res) => {
  const { nama_halaqoh, guru_id, ruangan, jadwal } = req.body;
  await pool.query('UPDATE halaqoh SET nama_halaqoh = ?, guru_id = ?, ruangan = ?, jadwal = ? WHERE id = ?', [nama_halaqoh, guru_id || null, ruangan, jadwal, req.params.id]);
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM halaqoh WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
};
