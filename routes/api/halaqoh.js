const express = require('express');
const router = express.Router();
const HalaqohController = require('../../controllers/api/halaqohController');

router.get('/', HalaqohController.list);
router.get('/:id', HalaqohController.get);
router.post('/', HalaqohController.create);
router.put('/:id', HalaqohController.update);
router.delete('/:id', HalaqohController.remove);

module.exports = router;
