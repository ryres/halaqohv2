const express = require('express');
const router = express.Router();
const UsersController = require('../../controllers/api/usersController');

router.get('/', UsersController.list);
router.get('/:id', UsersController.get);
router.post('/', UsersController.create);
router.put('/:id', UsersController.update);
router.delete('/:id', UsersController.remove);

module.exports = router;
