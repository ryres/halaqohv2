const pool = require('../../config/database');

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT dr.*, s.nama as santri_nama, u.username as requested_by_username 
      FROM delete_requests dr 
      LEFT JOIN santri s ON dr.santri_id = s.id 
      LEFT JOIN users u ON dr.requested_by = u.id 
      ORDER BY dr.created_at DESC
    `);
    res.render('admin/delete-requests', { 
      requests: rows,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('admin/delete-requests', { requests: [], success: null, error: err.message });
  }
};

exports.approve = async (req, res) => {
  const { id } = req.params;
  try {
    const [[reqRow]] = await pool.query('SELECT * FROM delete_requests WHERE id = ?', [id]);
    if (!reqRow) return res.redirect('/delete-requests?error=Request tidak ditemukan');

    await pool.query('UPDATE delete_requests SET status = ?, approved_at = NOW() WHERE id = ?', ['approved', id]);
    await pool.query('DELETE FROM santri WHERE id = ?', [reqRow.santri_id]);
    await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', 
      [reqRow.requested_by, 'Delete Approved', `Santri ${reqRow.santri_id} telah dihapus`, 'success', '/santri']);

    res.redirect('/delete-requests?success=Request disetujui dan data santri dihapus');
  } catch (err) {
    res.redirect('/delete-requests?error=Gagal approve request');
  }
};

exports.reject = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE delete_requests SET status = ? WHERE id = ?', ['rejected', id]);
    res.redirect('/delete-requests?success=Request ditolak');
  } catch (err) {
    res.redirect('/delete-requests?error=Gagal reject request');
  }
};
