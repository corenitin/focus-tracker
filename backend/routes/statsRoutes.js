const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getOverallStats, getDailyStats } = require('../controllers/statsController');

router.use(protect); // all stats routes require login

router.get('/overall', getOverallStats);
router.get('/daily', getDailyStats);

module.exports = router;
