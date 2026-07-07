const pool = require('../../config/database');
const bcrypt = require('bcryptjs');

exports.loginForm = (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/');
  res.render('auth/login', { error: null, layout: 'layouts/login' });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.render('auth/login', { error: 'Invalid credentials', layout: 'layouts/login' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Invalid credentials', layout: 'layouts/login' });

    // set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { error: 'Server error', layout: 'layouts/login' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
};
