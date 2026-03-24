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

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const todayResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$duration' }, count: { $sum: 1 } } },
    ]);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0,0,0,0);
    const weekResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$duration' }, count: { $sum: 1 } } },
    ]);

    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const monthResult = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$duration' }, count: { $sum: 1 } } },
    ]);

    const byCategory = await Session.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: '$category', total: { $sum: '$duration' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const avgDuration = totalSessions > 0 ? Math.floor(totalDuration / totalSessions) : 0;

    // ── Streak calculation ──────────────────────────────────────────────────
    const allDays = await Session.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
      }},
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    ]);

    let currentStreak = 0, longestStreak = 0, tempStreak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let cursor = new Date(today);

    for (let i = 0; i < allDays.length; i++) {
      const d = allDays[i]._id;
      const dayDate = new Date(d.year, d.month - 1, d.day);
      const diff = Math.round((cursor - dayDate) / 86400000);
      if (diff === 0) { tempStreak++; cursor.setDate(cursor.getDate() - 1); }
      else if (diff === 1) { tempStreak++; cursor = new Date(dayDate); cursor.setDate(cursor.getDate() - 1); }
      else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; cursor = new Date(dayDate); cursor.setDate(cursor.getDate() - 1); }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // current streak: check if today or yesterday has a session
    const todaySessions = allDays.find(d => {
      const t = new Date(); return d._id.year === t.getFullYear() && d._id.month === t.getMonth()+1 && d._id.day === t.getDate();
    });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yestSessions = allDays.find(d => d._id.year === yesterday.getFullYear() && d._id.month === yesterday.getMonth()+1 && d._id.day === yesterday.getDate());

    if (todaySessions || yestSessions) {
      let streak = 0;
      let check = todaySessions ? new Date(today) : new Date(yesterday);
      for (const day of allDays) {
        const dayDate = new Date(day._id.year, day._id.month-1, day._id.day);
        const diff = Math.round((check - dayDate) / 86400000);
        if (diff === 0) { streak++; check.setDate(check.getDate()-1); }
        else break;
      }
      currentStreak = streak;
    }

    res.json({
      success: true,
      data: {
        totalSessions, totalDuration, avgDuration,
        today:    { duration: todayResult[0]?.total  || 0, sessions: todayResult[0]?.count  || 0 },
        thisWeek: { duration: weekResult[0]?.total   || 0, sessions: weekResult[0]?.count   || 0 },
        thisMonth:{ duration: monthResult[0]?.total  || 0, sessions: monthResult[0]?.count  || 0 },
        byCategory,
        currentStreak,
        longestStreak,
      },
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Daily Stats ──────────────────────────────────────────────────────────────
exports.getDailyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    const since = new Date(); since.setDate(since.getDate() - days + 1); since.setHours(0,0,0,0);

    const dailyData = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: since } } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
          totalDuration: { $sum: '$duration' }, sessionCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const result = [];
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = { year: d.getFullYear(), month: d.getMonth()+1, day: d.getDate() };
      const found = dailyData.find(x => x._id.year===key.year && x._id.month===key.month && x._id.day===key.day);
      result.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        totalDuration: found?.totalDuration || 0,
        sessionCount:  found?.sessionCount  || 0,
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Monthly Stats ────────────────────────────────────────────────────────────
exports.getMonthlyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const months = parseInt(req.query.months) || 12;
    const since = new Date(); since.setMonth(since.getMonth() - months + 1); since.setDate(1); since.setHours(0,0,0,0);

    const monthlyData = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: since } } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          totalDuration: { $sum: '$duration' }, sessionCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const result = [];
    for (let i = months-1; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1);
      const key = { year: d.getFullYear(), month: d.getMonth()+1 };
      const found = monthlyData.find(x => x._id.year===key.year && x._id.month===key.month);
      result.push({
        date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalDuration: found?.totalDuration || 0,
        sessionCount:  found?.sessionCount  || 0,
      });
    }
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Yearly Stats ─────────────────────────────────────────────────────────────
exports.getYearlyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const yearlyData = await Session.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: {
          _id: { year: { $year: '$createdAt' } },
          totalDuration: { $sum: '$duration' }, sessionCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1 } },
    ]);
    const result = yearlyData.map(x => ({
      year: x._id.year, label: String(x._id.year),
      totalDuration: x.totalDuration, sessionCount: x.sessionCount,
    }));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Heatmap (last 365 days) ──────────────────────────────────────────────────
exports.getHeatmap = async (req, res) => {
  try {
    const userId = req.user._id;
    const since = new Date(); since.setDate(since.getDate() - 364); since.setHours(0,0,0,0);

    const data = await Session.aggregate([
      { $match: { user: userId, status: 'completed', createdAt: { $gte: since } } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
          totalDuration: { $sum: '$duration' }, sessionCount: { $sum: 1 },
      }},
    ]);

    const map = {};
    data.forEach(x => {
      const key = `${x._id.year}-${String(x._id.month).padStart(2,'0')}-${String(x._id.day).padStart(2,'0')}`;
      map[key] = { totalDuration: x.totalDuration, sessionCount: x.sessionCount };
    });
    res.json({ success: true, data: map });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
