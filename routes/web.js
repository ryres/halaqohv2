const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const upload = multer({ 
  dest: path.join(__dirname, '../uploads/'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Hanya mendukung file CSV atau Excel (.xlsx, .xls)'));
    }
  }
});

const dashboardController = require('../controllers/web/dashboardController');
const guruController = require('../controllers/web/guruController');
const halaqohController = require('../controllers/web/halaqohController');
const santriController = require('../controllers/web/santriController');
const usersController = require('../controllers/web/usersController');
const deleteRequestsController = require('../controllers/web/deleteRequestsController');
const logsController = require('../controllers/web/logsController');
const tahsinController = require('../controllers/web/tahsinController');
const notificationsController = require('../controllers/web/notificationsController');

function requireWebLogin(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || req.session.role !== 'admin') {
    return res.status(403).render('error', { title: 'Akses Ditolak', code: 403, message: 'Anda tidak memiliki izin untuk mengakses halaman ini.' });
  }
  next();
}

function denyGuruTahfizh(req, res, next) {
  if (req.session && req.session.role === 'guru_tahfizh') {
    return res.status(403).render('error', { title: 'Akses Ditolak', code: 403, message: 'Anda tidak memiliki izin untuk mengakses halaman ini.' });
  }
  next();
}

// Dashboard & Analytics
router.get('/', requireWebLogin, dashboardController.index);
router.get('/dataset', requireWebLogin, denyGuruTahfizh, dashboardController.dataset);
router.post('/dataset/import', requireWebLogin, requireAdmin, upload.single('file'), dashboardController.importDataset);
router.post('/dataset/delete', requireWebLogin, requireAdmin, dashboardController.deleteDataset);
router.get('/clustering', requireWebLogin, denyGuruTahfizh, dashboardController.clustering);
router.get('/result', requireWebLogin, dashboardController.result);

// Data Management
router.get('/guru', requireWebLogin, guruController.list);
router.post('/guru', requireWebLogin, requireAdmin, guruController.create);
router.get('/guru/:id', requireWebLogin, requireAdmin, guruController.edit);
router.post('/guru/:id', requireWebLogin, requireAdmin, guruController.update);
router.post('/guru/:id/delete', requireWebLogin, requireAdmin, guruController.delete);

router.get('/halaqoh', requireWebLogin, halaqohController.list);
router.post('/halaqoh', requireWebLogin, requireAdmin, halaqohController.create);
router.get('/halaqoh/:id', requireWebLogin, requireAdmin, halaqohController.edit);
router.post('/halaqoh/:id', requireWebLogin, requireAdmin, halaqohController.update);
router.post('/halaqoh/:id/delete', requireWebLogin, requireAdmin, halaqohController.delete);

router.get('/santri', requireWebLogin, santriController.list);
router.post('/santri', requireWebLogin, santriController.create);
router.get('/santri/:id', requireWebLogin, santriController.edit);
router.post('/santri/:id', requireWebLogin, santriController.update);
router.post('/santri/:id/delete', requireWebLogin, santriController.requestDelete);

// Tahsin (penilaian per indikator + catatan)
router.get('/tahsin', requireWebLogin, tahsinController.dashboard);
router.get('/tahsin/input', requireWebLogin, tahsinController.inputForm);
router.post('/tahsin/input', requireWebLogin, tahsinController.save);
router.post('/tahsin/input/row', requireWebLogin, tahsinController.saveRow);
router.get('/tahsin/santri/:id', requireWebLogin, tahsinController.santriDetail);

// Notifikasi (lonceng)
router.get('/notifications/list', requireWebLogin, notificationsController.list);
router.post('/notifications/read-all', requireWebLogin, notificationsController.readAll);
router.post('/notifications/read/:id', requireWebLogin, notificationsController.read);

// Admin Only
router.get('/users', requireAdmin, usersController.list);
router.post('/users', requireAdmin, usersController.create);
router.post('/users/:id/role', requireAdmin, usersController.updateRole);
router.post('/users/:id/delete', requireAdmin, usersController.delete);

router.get('/delete-requests', requireAdmin, deleteRequestsController.list);
router.post('/delete-requests/:id/approve', requireAdmin, deleteRequestsController.approve);
router.post('/delete-requests/:id/reject', requireAdmin, deleteRequestsController.reject);

router.get('/logs', requireAdmin, logsController.list);

module.exports = router;
