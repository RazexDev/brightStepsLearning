const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { protect } = require('../middleware/authMiddleware');

/**
 * GET /api/analytics/teacher-summary
 * 
 * Aggregates real data from Progress, User, and Resource collections
 * into a shape consumable by the Teacher Analytics tab.
 * 
 * Query params:
 *   ?period=weekly|monthly  (default: weekly)
 *   ?startDate=YYYY-MM-DD   (overrides period auto-range)
 *   ?endDate=YYYY-MM-DD     (overrides period auto-range)
 *   ?studentName=...         (filter to a single student)
 * 
 * Restricted to authenticated teachers/admins only.
 */
router.get('/teacher-summary', protect, async (req, res) => {
  try {
    // ── Auth check ──
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }

    // ── Date range ──
    const period = req.query.period || 'weekly';
    const now = new Date();
    let startDate, endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(now);
      if (period === 'monthly') {
        startDate.setDate(now.getDate() - 29);
      } else {
        startDate.setDate(now.getDate() - 6);
      }
      startDate.setHours(0, 0, 0, 0);
    }

    // ── Students scoped to this teacher ──
    const studentQuery = { role: { $in: ['parent', 'student'] } };
    if (req.user.role === 'teacher') {
      studentQuery.assignedTeacher = req.user._id;
    }
    const students = await User.find(studentQuery, '_id name email createdAt').sort({ createdAt: -1 });
    const studentNames = students.map(s => s.name);

    // ── Progress filter ──
    const progressFilter = {
      date: { $gte: startDate, $lte: endDate },
    };
    // Scope to teacher's assigned students only
    if (studentNames.length > 0) {
      progressFilter.studentName = { $in: studentNames };
    }
    // Optional single-student filter
    if (req.query.studentName) {
      progressFilter.studentName = req.query.studentName;
    }

    const reports = await Progress.find(progressFilter).sort({ date: -1 });

    // ── Resources filter (same date range) ──
    const resourceFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    const resources = await Resource.find(resourceFilter).sort({ createdAt: -1 });

    // ══════════════════════════════════════════
    //  SECTION 1: Report Activity (replaces mock learningProgressData)
    // ══════════════════════════════════════════

    // Group reports by student
    const byStudent = {};
    reports.forEach(r => {
      const key = r.studentName;
      if (!byStudent[key]) {
        byStudent[key] = {
          studentName: key,
          totalReports: 0,
          totalGameTime: 0,
          activeDates: new Set(),
          moods: {},
          activities: new Set(),
          gameReports: 0,
          totalStars: 0,
        };
      }
      const entry = byStudent[key];
      entry.totalReports += 1;
      entry.activeDates.add(r.date.toISOString().split('T')[0]);
      entry.moods[r.mood] = (entry.moods[r.mood] || 0) + 1;
      entry.activities.add(r.activity);
      if (r.gameName) {
        entry.gameReports += 1;
        entry.totalGameTime += r.completionTime || 0;
        entry.totalStars += r.stars || 0;
      }
    });

    const totalDays = period === 'monthly' ? 30 : 7;
    const reportsByStudent = Object.values(byStudent).map(entry => ({
      studentName: entry.studentName,
      totalReports: entry.totalReports,
      activeDays: entry.activeDates.size,
      attendance: `${Math.round((entry.activeDates.size / totalDays) * 100)}%`,
      uniqueActivities: entry.activities.size,
      gameReports: entry.gameReports,
      totalGameTime: entry.totalGameTime,
      totalStars: entry.totalStars,
      topMood: Object.entries(entry.moods).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    }));

    // Group reports by date (for line chart)
    const byDate = {};
    reports.forEach(r => {
      const dateKey = r.date.toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, reports: 0, uniqueStudents: new Set(), gameReports: 0, totalStars: 0 };
      }
      byDate[dateKey].reports += 1;
      byDate[dateKey].uniqueStudents.add(r.studentName);
      if (r.gameName) {
        byDate[dateKey].gameReports += 1;
        byDate[dateKey].totalStars += r.stars || 0;
      }
    });
    const dailyActivity = Object.values(byDate)
      .map(d => ({ date: d.date, reports: d.reports, uniqueStudents: d.uniqueStudents.size, gameReports: d.gameReports, totalStars: d.totalStars }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Mood distribution (for pie chart)
    const moodCounts = {};
    reports.forEach(r => { moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1; });
    const moodDistribution = Object.entries(moodCounts).map(([name, value]) => ({ name, value }));

    // ══════════════════════════════════════════
    //  SECTION 2: Resource/Recommendation Activity
    // ══════════════════════════════════════════
    const resourcesByType = {};
    resources.forEach(r => {
      resourcesByType[r.type] = (resourcesByType[r.type] || 0) + 1;
    });
    const resourceTypeBreakdown = Object.entries(resourcesByType).map(([name, total]) => ({ name, total }));

    const resourcesBySkill = {};
    resources.forEach(r => {
      const skill = r.targetSkill || 'general';
      resourcesBySkill[skill] = (resourcesBySkill[skill] || 0) + 1;
    });
    const resourceSkillBreakdown = Object.entries(resourcesBySkill).map(([name, value]) => ({ name, value }));

    const resourceList = resources.map(r => ({
      id: r._id,
      title: r.title,
      type: r.type,
      targetSkill: r.targetSkill || 'general',
      requiredLevel: r.requiredLevel || 0,
      studentName: r.studentName || null,
      createdAt: r.createdAt,
    }));

    // ══════════════════════════════════════════
    //  SECTION 3: Game Analytics
    // ══════════════════════════════════════════
    const gameReports = reports.filter(r => r.gameName);

    // Level distribution (from stars)
    const levelBuckets = { 'Beginner (0-1★)': 0, 'Intermediate (2★)': 0, 'Advanced (3★)': 0 };
    gameReports.forEach(r => {
      if (r.stars >= 3) levelBuckets['Advanced (3★)'] += 1;
      else if (r.stars >= 2) levelBuckets['Intermediate (2★)'] += 1;
      else levelBuckets['Beginner (0-1★)'] += 1;
    });
    const levelDistribution = Object.entries(levelBuckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Time per game
    const gameTimeBuckets = {};
    gameReports.forEach(r => {
      gameTimeBuckets[r.gameName] = (gameTimeBuckets[r.gameName] || 0) + (r.completionTime || 0);
    });
    const gameTimeData = Object.entries(gameTimeBuckets).map(([name, total]) => ({ name, total }));

    // Attempts (total moves) and performance per game
    const gamePerf = {};
    gameReports.forEach(r => {
      if (!gamePerf[r.gameName]) gamePerf[r.gameName] = { name: r.gameName, plays: 0, totalMoves: 0, totalStars: 0 };
      gamePerf[r.gameName].plays += 1;
      gamePerf[r.gameName].totalMoves += r.totalMoves || 0;
      gamePerf[r.gameName].totalStars += r.stars || 0;
    });
    const gamePerformance = Object.values(gamePerf);

    // Leaderboard: top 5 game plays by stars
    const leaderboard = [...gameReports]
      .sort((a, b) => b.stars !== a.stars ? b.stars - a.stars : (a.completionTime || 999) - (b.completionTime || 999))
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        studentName: r.studentName,
        gameName: r.gameName,
        stars: r.stars,
        completionTime: r.completionTime || 0,
        totalMoves: r.totalMoves || 0,
        date: r.date,
      }));

    // ══════════════════════════════════════════
    //  SUMMARY KPIs
    // ══════════════════════════════════════════
    const activeStudentNames = new Set(reports.map(r => r.studentName));
    const totalGamePlayTime = gameReports.reduce((sum, r) => sum + (r.completionTime || 0), 0);

    const summary = {
      totalStudents: students.length,
      activeStudentsInPeriod: activeStudentNames.size,
      totalReports: reports.length,
      totalActivities: new Set(reports.map(r => r.activity)).size,
      totalResources: resources.length,
      totalGamePlayTime,
    };

    // ── Response ──
    res.json({
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      summary,
      reportsByStudent,
      dailyActivity,
      moodDistribution,
      resourceTypeBreakdown,
      resourceSkillBreakdown,
      resourceList,
      levelDistribution,
      gameTimeData,
      gamePerformance,
      leaderboard,
      students: students.map(s => ({ _id: s._id, name: s.name, email: s.email })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
