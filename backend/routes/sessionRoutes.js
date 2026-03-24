const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSession,
  pauseSession,
  resumeSession,
  completeSession,
  updateSession,
  deleteSession,
} = require('../controllers/sessionController');

// CRUD
router.route('/').get(getSessions).post(createSession);
router.route('/:id').get(getSession).put(updateSession).delete(deleteSession);

// Session state transitions
router.patch('/:id/pause', pauseSession);
router.patch('/:id/resume', resumeSession);
router.patch('/:id/complete', completeSession);

module.exports = router;
