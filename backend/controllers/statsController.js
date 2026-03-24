const Session = require('../models/Session');

// ─── Overall Stats ─────────────────────────────────────────────────────────────
exports.getOverallStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalSessions = await Session.countDocuments({ user: userId, status: 'completed' });
    const totalDurationResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$duration' } } },
    ]);
    const totalDuration = totalDurationResult[0]?.total || 0;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$duration' }, count: { $sum: 1 } } },
    ]);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$duration' }, count: { $sum: 1 } } },
    ]);

    const byCategory = await Session.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: '$category', total: { $sum: '$duration' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const avgDuration = totalSessions > 0 ? Math.floor(totalDuration / totalSessions) : 0;

    res.json({
      success: true,
      data: {
        totalSessions,
        totalDuration,
        avgDuration,
        today: { duration: todayResult[0]?.total || 0, sessions: todayResult[0]?.count || 0 },
        thisWeek: { duration: weekResult[0]?.total || 0, sessions: weekResult[0]?.count || 0 },
        byCategory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Daily Stats ──────────────────────────────────────────────────────────────
exports.getDailyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const dailyData = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
          totalDuration: { $sum: '$duration' },
          sessionCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
      const found = dailyData.find(
        (x) => x._id.year === key.year && x._id.month === key.month && x._id.day === key.day
      );
      result.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        totalDuration: found?.totalDuration || 0,
        sessionCount: found?.sessionCount || 0,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
