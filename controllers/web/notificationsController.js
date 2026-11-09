const pool = require('../../config/database');

function fmtDT(d) {
  if (!(d instanceof Date)) return d ? String(d) : null;
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

// Notifikasi untuk user ini ATAU global (user_id NULL)
const SCOPE = '(user_id = ? OR user_id IS NULL)';

exports.list = async (req, res) => {
  try {
    const uid = req.session.userId;
    const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM notifications WHERE is_read = 0 AND ' + SCOPE, [uid]);
    const [rows] = await pool.query(
      'SELECT id, title, message, type, link, is_read, created_at FROM notifications WHERE ' + SCOPE +
      ' ORDER BY is_read ASC, id DESC LIMIT 15', [uid]);
    const items = rows.map(r => ({
      id: r.id, title: r.title, message: r.message || '', type: r.type || 'info',
      link: r.link || null, is_read: Number(r.is_read) || 0, created_at: fmtDT(r.created_at),
    }));
    res.json({ ok: true, unread: Number(c.n) || 0, items });
  } catch (err) {
    console.error('notifications.list:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.readAll = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND ' + SCOPE, [req.session.userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('notifications.readAll:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};

exports.read = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    console.error('notifications.read:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
