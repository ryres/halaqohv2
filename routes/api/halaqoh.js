const express = require('express');
const router = express.Router();
const HalaqohController = require('../../controllers/api/halaqohController');
const { requireAdminApi } = require('../../middleware/auth');

router.get('/', HalaqohController.list);
router.get('/:id', HalaqohController.get);
router.post('/', requireAdminApi, HalaqohController.create);
router.put('/:id', requireAdminApi, HalaqohController.update);
router.delete('/:id', requireAdminApi, HalaqohController.remove);

module.exports = router;
