const pool = require('../../config/database');

// Pagination and lazy loading for santri
exports.list = async (req, res) => {
  const page = parseInt(req.query.page || '1');
  const limit = Math.min(parseInt(req.query.limit || '50'), 200); // cap limit
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT SQL_CALC_FOUND_ROWS s.*, 
      ((COALESCE(tajwid,0) + COALESCE(kelancaran,0) + COALESCE(makhraj,0)) / 3) AS avg_score
      FROM santri s ORDER BY id DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ 'FOUND_ROWS()': totalRows }]] = await pool.query('SELECT FOUND_ROWS()');

  res.json({ data: rows, meta: { page, limit, total: totalRows } });
};

exports.get = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM santri WHERE id = ?', [req.params.id]);
  res.json(rows[0] || null);
};

exports.create = async (req, res) => {
  const { nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id } = req.body;
  const [result] = await pool.query('INSERT INTO santri (nama, kelas, juz, surat, ayat, setoran_tgl, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)', [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz || 30, user_id || null]);
  res.json({ id: result.insertId });
};

exports.update = async (req, res) => {
  const { nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  await pool.query('UPDATE santri SET nama=?, kelas=?, juz=?, surat=?, ayat=?, setoran_tgl=NOW(), tajwid=?, kelancaran=?, makhraj=?, halaqoh_id=?, guru_id=?, target_juz=? WHERE id=?', [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz || 30, req.params.id]);
  res.json({ ok: true });
};

// Delete request workflow: create delete_requests row instead of deleting
exports.requestDelete = async (req, res) => {
  const santriId = req.params.id;
  const requestedBy = req.body.requested_by || null;
  const reason = req.body.reason || null;
  const [result] = await pool.query('INSERT INTO delete_requests (santri_id, requested_by, reason) VALUES (?, ?, ?)', [santriId, requestedBy, reason]);
  res.json({ request_id: result.insertId });
};
