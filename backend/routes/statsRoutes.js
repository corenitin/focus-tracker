const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getOverallStats, getDailyStats, getMonthlyStats, getYearlyStats, getHeatmap } = require('../controllers/statsController');

router.use(protect);
router.get('/overall',  getOverallStats);
router.get('/daily',    getDailyStats);
router.get('/monthly',  getMonthlyStats);
router.get('/yearly',   getYearlyStats);
router.get('/heatmap',  getHeatmap);

module.exports = router;
