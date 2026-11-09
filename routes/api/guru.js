const express = require('express');
const router = express.Router();
const GuruController = require('../../controllers/api/guruController');
const { requireAdminApi } = require('../../middleware/auth');

router.get('/', GuruController.list);
router.get('/:id', GuruController.get);
router.post('/', requireAdminApi, GuruController.create);
router.put('/:id', requireAdminApi, GuruController.update);
router.delete('/:id', requireAdminApi, GuruController.remove);

module.exports = router;
