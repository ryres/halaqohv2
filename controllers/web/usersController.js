const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id DESC');
    res.render('admin/users', { 
      users: rows,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('admin/users', { users: [], success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role || 'user']);
    res.redirect('/users?success=User berhasil ditambahkan');
  } catch (err) {
    res.redirect('/users?error=Gagal menambah user: ' + err.message);
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.redirect('/users?success=Role user berhasil diperbarui');
  } catch (err) {
    res.redirect('/users?error=Gagal update role');
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.session.userId) {
    return res.redirect('/users?error=Tidak dapat menghapus akun sendiri');
  }
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.redirect('/users?success=User berhasil dihapus');
  } catch (err) {
    res.redirect('/users?error=Gagal hapus user');
  }
};

