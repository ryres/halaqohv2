const express = require('express');
const router = express.Router();
const ClusteringController = require('../../controllers/api/clusteringController');

router.post('/process', ClusteringController.process);
router.get('/result', ClusteringController.result);

module.exports = router;
