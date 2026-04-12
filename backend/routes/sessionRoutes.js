const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createSession, getSessions, getSession,
  pauseSession, resumeSession, completeSession,
  updateSession, deleteSession,
} = require('../controllers/sessionController');

router.use(protect);

router.route('/').get(getSessions).post(createSession);
router.route('/:id').get(getSession).put(updateSession).delete(deleteSession);
router.patch('/:id/pause',    pauseSession);
router.patch('/:id/resume',   resumeSession);
router.patch('/:id/complete', completeSession);

module.exports = router;
