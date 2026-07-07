const pool = require('../../config/database');

exports.list = async (req, res) => {
  const [rows] = await pool.query('SELECT dr.*, s.nama as santri_nama, u.username as requested_by_username FROM delete_requests dr LEFT JOIN santri s ON dr.santri_id = s.id LEFT JOIN users u ON dr.requested_by = u.id ORDER BY dr.created_at DESC');
  res.json(rows);
};

exports.approve = async (req, res) => {
  const id = req.params.id;
  try {
    const [[reqRow]] = await pool.query('SELECT * FROM delete_requests WHERE id = ?', [id]);
    if (!reqRow) return res.status(404).json({ error: 'Request not found' });

    // mark approved
    await pool.query('UPDATE delete_requests SET status = ?, approved_at = NOW() WHERE id = ?', ['approved', id]);

    // delete santri -> this will cascade-delete the delete_request row due to FK ON DELETE CASCADE
    await pool.query('DELETE FROM santri WHERE id = ?', [reqRow.santri_id]);

    // log notification
    await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [reqRow.requested_by, 'Delete Approved', `Santri ${reqRow.santri_id} deleted by admin`, 'success', '/santri']);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.reject = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('UPDATE delete_requests SET status = ? WHERE id = ?', ['rejected', id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
