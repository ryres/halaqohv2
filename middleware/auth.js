const pool = require('../config/database');

function isAuthenticated(req) {
  return req.session && req.session.userId;
}

function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!isAuthenticated(req)) return res.status(401).json({ error: 'Unauthorized' });
    if (req.session.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole, isAuthenticated };
