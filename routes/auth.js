const express = require('express');
const router = express.Router();
const authController = require('../controllers/web/authController');

router.get('/login', authController.loginForm);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;
