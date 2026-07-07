const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id DESC');
  res.json(rows);
};

exports.get = async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.params.id]);
  res.json(rows[0] || null);
};

exports.create = async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user']);
  res.json({ id: result.insertId });
};

exports.update = async (req, res) => {
  const { username, role, password } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?', [username, role, hash, req.params.id]);
  } else {
    await pool.query('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, req.params.id]);
  }
  res.json({ ok: true });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
};
