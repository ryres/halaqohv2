const express = require('express');
const router = express.Router();
const GuruController = require('../../controllers/api/guruController');

router.get('/', GuruController.list);
router.get('/:id', GuruController.get);
router.post('/', GuruController.create);
router.put('/:id', GuruController.update);
router.delete('/:id', GuruController.remove);

module.exports = router;
