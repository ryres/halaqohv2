const express = require('express');
const router = express.Router();
const DeleteRequestsController = require('../../controllers/api/deleteRequestsController');
const { requireAuth, requireRole } = require('../../middleware/auth');

router.get('/', requireAuth, requireRole('admin'), DeleteRequestsController.list);
router.post('/:id/approve', requireAuth, requireRole('admin'), DeleteRequestsController.approve);
router.post('/:id/reject', requireAuth, requireRole('admin'), DeleteRequestsController.reject);

module.exports = router;
