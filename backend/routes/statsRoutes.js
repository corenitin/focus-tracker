const express = require('express');
const router = express.Router();
const { getOverallStats, getDailyStats } = require('../controllers/statsController');

router.get('/overall', getOverallStats);
router.get('/daily', getDailyStats);

module.exports = router;
