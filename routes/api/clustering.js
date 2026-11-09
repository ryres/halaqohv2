const express = require('express');
const router = express.Router();
const ClusteringController = require('../../controllers/api/clusteringController');
const { denyGuruTahfizhApi } = require('../../middleware/auth');

router.post('/process', denyGuruTahfizhApi, ClusteringController.process);
router.get('/result', denyGuruTahfizhApi, ClusteringController.result);

module.exports = router;
