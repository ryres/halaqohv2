const pool = require('../../config/database');

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = 50;
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(`
      SELECT SQL_CALC_FOUND_ROWS l.*, u.username as user_name 
      FROM logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      ORDER BY l.created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()');
    
    res.render('admin/logs', { 
      logs: rows, 
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('admin/logs', { logs: [], currentPage: 1, totalPages: 1, error: err.message });
  }
};

