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

function requireWebLogin(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId || req.session.role !== 'admin') {
    return res.status(403).render('error', { message: 'Akses ditolak' });
  }
  next();
}

function requireAdminOrTahfizh(req, res, next) {
  if (!req.session || !req.session.userId || !['admin', 'guru_tahfizh'].includes(req.session.role)) {
    return res.status(403).render('error', { message: 'Akses ditolak' });
  }
  next();
}

// Dashboard & Analytics
router.get('/', requireWebLogin, dashboardController.index);
router.get('/dataset', requireWebLogin, dashboardController.dataset);
router.post('/dataset/import', requireWebLogin, upload.single('file'), dashboardController.importDataset);
router.post('/dataset/delete', requireWebLogin, requireAdminOrTahfizh, dashboardController.deleteDataset);
router.get('/clustering', requireWebLogin, dashboardController.clustering);
router.get('/result', requireWebLogin, dashboardController.result);

// Data Management
router.get('/guru', requireWebLogin, guruController.list);
router.post('/guru', requireWebLogin, guruController.create);
router.get('/guru/:id', requireWebLogin, guruController.edit);
router.post('/guru/:id', requireWebLogin, guruController.update);
router.post('/guru/:id/delete', requireWebLogin, guruController.delete);

router.get('/halaqoh', requireWebLogin, halaqohController.list);
router.post('/halaqoh', requireWebLogin, halaqohController.create);
router.get('/halaqoh/:id', requireWebLogin, halaqohController.edit);
router.post('/halaqoh/:id', requireWebLogin, halaqohController.update);
router.post('/halaqoh/:id/delete', requireWebLogin, halaqohController.delete);

router.get('/santri', requireWebLogin, santriController.list);
router.post('/santri', requireWebLogin, santriController.create);
router.get('/santri/:id', requireWebLogin, santriController.edit);
router.post('/santri/:id', requireWebLogin, santriController.update);
router.post('/santri/:id/delete', requireWebLogin, santriController.requestDelete);

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
