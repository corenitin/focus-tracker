const Session = require('../models/Session');

// ─── Create Session ───────────────────────────────────────────────────────────
exports.createSession = async (req, res) => {
  try {
    const { title, category, notes } = req.body;
    const session = new Session({
      title,
      category,
      notes,
      startTime: new Date(),
      status: 'active',
    });
    await session.save();
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── Get All Sessions ─────────────────────────────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const { status, category, startDate, endDate, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: sessions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Get Single Session ───────────────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Pause Session ────────────────────────────────────────────────────────────
exports.pauseSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Session is not active' });
    }

    // Calculate elapsed time so far and add to duration
    const now = new Date();
    const elapsed = Math.floor((now - session.startTime) / 1000) - session.totalPausedTime;
    session.duration = elapsed;
    session.status = 'paused';
    session.pausedAt = now;
    await session.save();

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Resume Session ───────────────────────────────────────────────────────────
exports.resumeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.status !== 'paused') {
      return res.status(400).json({ success: false, error: 'Session is not paused' });
    }

    const now = new Date();
    const pausedSeconds = Math.floor((now - session.pausedAt) / 1000);
    session.totalPausedTime += pausedSeconds;
    session.status = 'active';
    session.pausedAt = null;
    await session.save();

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Complete Session ─────────────────────────────────────────────────────────
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    if (session.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Session is already completed' });
    }

    const now = new Date();
    let totalPaused = session.totalPausedTime;

    // If currently paused, add that pause time too
    if (session.status === 'paused' && session.pausedAt) {
      totalPaused += Math.floor((now - session.pausedAt) / 1000);
    }

    const totalElapsed = Math.floor((now - session.startTime) / 1000);
    const actualFocusTime = totalElapsed - totalPaused;

    session.endTime = now;
    session.duration = Math.max(0, actualFocusTime);
    session.status = 'completed';
    session.totalPausedTime = totalPaused;
    if (req.body.notes !== undefined) session.notes = req.body.notes;
    await session.save();

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Update Session (edit title/category/notes) ───────────────────────────────
exports.updateSession = async (req, res) => {
  try {
    const allowed = ['title', 'category', 'notes'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const session = await Session.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── Delete Session ───────────────────────────────────────────────────────────
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
