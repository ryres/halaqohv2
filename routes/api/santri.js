const express = require('express');
const router = express.Router();
const SantriController = require('../../controllers/api/santriController');

router.get('/', SantriController.list); // supports pagination
router.get('/:id', SantriController.get);
router.post('/', SantriController.create);
router.put('/:id', SantriController.update);
router.delete('/:id', SantriController.requestDelete);

module.exports = router;
