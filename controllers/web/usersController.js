const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role, created_at FROM users WHERE is_deleted = 0 ORDER BY id DESC');
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
    req.session.flash = { type: 'success', message: 'User berhasil ditambahkan.' };
    res.redirect('/users');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menambah user: ' + err.message };
    res.redirect('/users');
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    req.session.flash = { type: 'success', message: 'Role user berhasil diperbarui.' };
    res.redirect('/users');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal memperbarui role user.' };
    res.redirect('/users');
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.session.userId) {
    req.session.flash = { type: 'error', message: 'Tidak dapat menghapus akun sendiri.' };
    return res.redirect('/users');
  }
  try {
    await pool.query('UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0', [id]);
    req.session.flash = { type: 'success', message: 'User berhasil dihapus.' };
    res.redirect('/users');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menghapus user.' };
    res.redirect('/users');
  }
};

