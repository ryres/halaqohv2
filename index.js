const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this',
  resave: false,
  saveUninitialized: true,
}));

// expose session and pathname to views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.pathname = req.path;
  next();
});

// Routes
const webRouter = require('./routes/web');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');

const audit = require('./middleware/audit');

app.use('/', authRouter);
app.use('/', audit, webRouter);
app.use('/api', audit, apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
