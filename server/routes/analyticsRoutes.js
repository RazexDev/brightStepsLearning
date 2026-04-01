const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { protect } = require('../middleware/authMiddleware');

/**
 * GET /api/analytics/teacher-summary
 *
 * Aggregates real data from Progress, User, and Resource collections.
 *
 * ── Schema context (important) ──
 * Teacher-authored Progress docs (via /api/progress POST with studentName):
 *   { studentName, date, activity, mood, notes, gameName, stars, totalMoves, completionTime }
 *
 * Game-authored Progress docs (via LearningHub games, saved without studentName):
 *   { childId (string|ObjectId), gameName, levelPlayed, score, stars, completionTime, totalMoves, date }
 *   These docs have NO studentName / mood / activity fields.
 *
 * Because the Progress Mongoose schema uses strict:true and does not declare childId,
 * we use the native MongoDB collection (via mongoose.connection.collection) with lean()
 * to fetch game docs and get childId back.
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
      endDate   = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate   = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (period === 'monthly' ? 29 : 6));
      startDate.setHours(0, 0, 0, 0);
    }

    const dateFilter = { date: { $gte: startDate, $lte: endDate } };

    // ── Students scoped to this teacher ──
    const studentQuery = { role: { $in: ['parent', 'student'] } };
    if (req.user.role === 'teacher') {
      studentQuery.assignedTeacher = req.user._id;
    }
    const students    = await User.find(studentQuery, '_id name email createdAt').sort({ createdAt: -1 });
    const studentNames    = students.map(s => s.name);
    const studentIdStrs   = new Set(students.map(s => s._id.toString()));
    // childId → name lookup (ids stored as strings in game docs)
    const childIdToName   = {};
    students.forEach(s => { childIdToName[s._id.toString()] = s.name; });

    // ──────────────────────────────────────────────
    // Fetch TEACHER-AUTHORED reports (have studentName)
    // ──────────────────────────────────────────────
    const teacherReportFilter = { ...dateFilter };
    if (studentNames.length > 0) {
      teacherReportFilter.studentName = { $in: studentNames };
    }
    if (req.query.studentName) {
      teacherReportFilter.studentName = req.query.studentName;
    }
    const teacherReports = await Progress.find(teacherReportFilter).sort({ date: -1 });

    // ──────────────────────────────────────────────
    // Fetch GAME-AUTHORED docs using native collection
    // (Mongoose strict mode strips childId — use raw collection + lean)
    // ──────────────────────────────────────────────
    const rawCollection = Progress.collection;   // native MongoDB collection

    const gameQuery = {
      ...dateFilter,
      gameName: { $exists: true, $ne: '' },
      // Only fetch docs that look like game-authored (have no studentName OR have gameName)
    };

    const rawGameDocs = await rawCollection.find(gameQuery).toArray();

    // Filter in-memory: if teacher has assigned students, scope to their childIds
    // childId in game docs is stored as a plain string (the user's ObjectId stringified)
    let gameDocs = rawGameDocs;
    if (studentIdStrs.size > 0) {
      gameDocs = rawGameDocs.filter(r => {
        if (!r.childId) return false;
        return studentIdStrs.has(r.childId.toString());
      });
    }

    // Handle single-student filter for game docs
    if (req.query.studentName) {
      const targetStudent = students.find(s => s.name === req.query.studentName);
      if (targetStudent) {
        const targetId = targetStudent._id.toString();
        gameDocs = gameDocs.filter(r => r.childId && r.childId.toString() === targetId);
      } else {
        gameDocs = [];
      }
    }

    // Attach resolved studentName to each game doc
    gameDocs = gameDocs.map(r => {
      const cid = r.childId ? r.childId.toString() : null;
      return {
        ...r,
        // Prefer already-set studentName (teacher-authored games via /auto route)
        studentName: r.studentName || (cid ? childIdToName[cid] : null) || 'Unknown',
      };
    });

    // ── Resources ──
    const resources = await Resource.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: -1 });

    // ══════════════════════════════════════════
    //  SECTION 1: Report Activity
    //  Source: teacherReports (studentName + mood + activity)
    // ══════════════════════════════════════════

    const byStudent = {};
    teacherReports.forEach(r => {
      const key = r.studentName || 'Unknown';
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
      if (r.mood) entry.moods[r.mood] = (entry.moods[r.mood] || 0) + 1;
      if (r.activity) entry.activities.add(r.activity);
      if (r.gameName) {
        entry.gameReports += 1;
        entry.totalGameTime += r.completionTime || 0;
        entry.totalStars += r.stars || 0;
      }
    });

    const totalDays = period === 'monthly' ? 30 : 7;
    const reportsByStudent = Object.values(byStudent).map(entry => ({
      studentName:      entry.studentName,
      totalReports:     entry.totalReports,
      activeDays:       entry.activeDates.size,
      attendance:       `${Math.round((entry.activeDates.size / totalDays) * 100)}%`,
      uniqueActivities: entry.activities.size,
      gameReports:      entry.gameReports,
      totalGameTime:    entry.totalGameTime,
      totalStars:       entry.totalStars,
      topMood:          Object.entries(entry.moods).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    }));

    // Daily trend — merge teacher reports + game activity
    const byDate = {};
    const ensureDate = dateKey => {
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, reports: 0, uniqueStudents: new Set(), gameReports: 0, totalStars: 0 };
      }
    };
    teacherReports.forEach(r => {
      const dk = r.date.toISOString().split('T')[0];
      ensureDate(dk);
      byDate[dk].reports += 1;
      byDate[dk].uniqueStudents.add(r.studentName);
      if (r.gameName) { byDate[dk].gameReports += 1; byDate[dk].totalStars += r.stars || 0; }
    });
    gameDocs.forEach(r => {
      const dk = new Date(r.date).toISOString().split('T')[0];
      ensureDate(dk);
      byDate[dk].uniqueStudents.add(r.studentName);
      byDate[dk].gameReports += 1;
      byDate[dk].totalStars += r.stars || 0;
    });
    const dailyActivity = Object.values(byDate)
      .map(d => ({
        date:           d.date,
        reports:        d.reports,
        uniqueStudents: d.uniqueStudents.size,
        gameReports:    d.gameReports,
        totalStars:     d.totalStars,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Mood distribution (teacher reports only — game docs have no mood)
    const moodCounts = {};
    teacherReports.forEach(r => {
      if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
    });
    const moodDistribution = Object.entries(moodCounts).map(([name, value]) => ({ name, value }));

    // ══════════════════════════════════════════
    //  SECTION 2: Resource Activity
    // ══════════════════════════════════════════
    const resourcesByType  = {};
    resources.forEach(r => { resourcesByType[r.type] = (resourcesByType[r.type] || 0) + 1; });
    const resourceTypeBreakdown = Object.entries(resourcesByType).map(([name, total]) => ({ name, total }));

    const resourcesBySkill = {};
    resources.forEach(r => {
      const skill = r.targetSkill || 'general';
      resourcesBySkill[skill] = (resourcesBySkill[skill] || 0) + 1;
    });
    const resourceSkillBreakdown = Object.entries(resourcesBySkill).map(([name, value]) => ({ name, value }));

    const resourceList = resources.map(r => ({
      id:            r._id,
      title:         r.title,
      type:          r.type,
      targetSkill:   r.targetSkill || 'general',
      requiredLevel: r.requiredLevel || 0,
      studentName:   r.studentName || null,
      createdAt:     r.createdAt,
    }));

    // ══════════════════════════════════════════
    //  SECTION 3: Game Analytics
    //  Source: gameDocs (childId-keyed, native collection)
    // ══════════════════════════════════════════

    // Performance distribution (stars buckets)
    const levelBuckets = { 'Beginner (0-1★)': 0, 'Intermediate (2★)': 0, 'Advanced (3★)': 0 };
    gameDocs.forEach(r => {
      const stars = r.stars || 0;
      if      (stars >= 3) levelBuckets['Advanced (3★)']     += 1;
      else if (stars >= 2) levelBuckets['Intermediate (2★)'] += 1;
      else                 levelBuckets['Beginner (0-1★)']   += 1;
    });
    const levelDistribution = Object.entries(levelBuckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    // Time spent per game
    const gameTimeBuckets = {};
    gameDocs.forEach(r => {
      if (!r.gameName) return;
      gameTimeBuckets[r.gameName] = (gameTimeBuckets[r.gameName] || 0) + (r.completionTime || 0);
    });
    const gameTimeData = Object.entries(gameTimeBuckets).map(([name, total]) => ({ name, total }));

    // Plays & moves per game
    const gamePerf = {};
    gameDocs.forEach(r => {
      if (!r.gameName) return;
      if (!gamePerf[r.gameName]) {
        gamePerf[r.gameName] = { name: r.gameName, plays: 0, totalMoves: 0, totalStars: 0 };
      }
      gamePerf[r.gameName].plays      += 1;
      gamePerf[r.gameName].totalMoves += r.totalMoves || 0;
      gamePerf[r.gameName].totalStars += r.stars || 0;
    });
    const gamePerformance = Object.values(gamePerf);

    // Leaderboard: top 5 by stars then fastest time
    const leaderboard = [...gameDocs]
      .sort((a, b) =>
        (b.stars || 0) !== (a.stars || 0)
          ? (b.stars || 0) - (a.stars || 0)
          : (a.completionTime || 999) - (b.completionTime || 999)
      )
      .slice(0, 5)
      .map((r, i) => ({
        rank:           i + 1,
        studentName:    r.studentName,
        gameName:       r.gameName,
        stars:          r.stars || 0,
        completionTime: r.completionTime || 0,
        totalMoves:     r.totalMoves || 0,
        date:           r.date,
      }));

    // ══════════════════════════════════════════
    //  SUMMARY KPIs
    // ══════════════════════════════════════════
    const activeStudentNamesSet = new Set([
      ...teacherReports.map(r => r.studentName).filter(Boolean),
      ...gameDocs.map(r => r.studentName).filter(s => s && s !== 'Unknown'),
    ]);
    const totalGamePlayTime = gameDocs.reduce((sum, r) => sum + (r.completionTime || 0), 0);

    const summary = {
      totalStudents:          students.length,
      activeStudentsInPeriod: activeStudentNamesSet.size,
      totalReports:           teacherReports.length,
      totalActivities:        new Set(teacherReports.map(r => r.activity).filter(Boolean)).size,
      totalResources:         resources.length,
      totalGamePlayTime,
      totalGamePlays:         gameDocs.length,
    };

    res.json({
      period,
      startDate:            startDate.toISOString().split('T')[0],
      endDate:              endDate.toISOString().split('T')[0],
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
