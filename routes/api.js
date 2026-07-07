const express = require('express');
const router = express.Router();

const usersRouter = require('./api/users');
const guruRouter = require('./api/guru');
const halaqohRouter = require('./api/halaqoh');
const santriRouter = require('./api/santri');
const clusteringRouter = require('./api/clustering');
const deleteRequestsRouter = require('./api/delete_requests');

router.use('/users', usersRouter);
router.use('/guru', guruRouter);
router.use('/halaqoh', halaqohRouter);
router.use('/santri', santriRouter);
router.use('/clustering', clusteringRouter);
router.use('/delete_requests', deleteRequestsRouter);

module.exports = router;
