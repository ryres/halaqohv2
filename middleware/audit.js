const pool = require('../config/database');

module.exports = async (req, res, next) => {
  // only log mutating requests
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const userId = req.session && req.session.userId ? req.session.userId : null;
    const username = req.session && req.session.username ? req.session.username : (req.body && req.body.username) || null;
    const action = `${req.method} ${req.originalUrl}`;
    const details = JSON.stringify({ body: req.body, params: req.params, query: req.query });
    const ip = req.ip || req.connection.remoteAddress || null;
    try {
      await pool.query('INSERT INTO logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)', [userId, username, action, details, ip]);
    } catch (err) {
      console.error('Failed to write audit log', err);
    }
  }
  next();
};
