const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// GET — fetch reports (supports ?studentName= filter for teachers)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentName) filter.studentName = req.query.studentName;
    const reports = await Progress.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET — fetch all game stats explicitly by childId for the GameHub
router.get('/:childId', async (req, res) => {
  try {
    const stats = await Progress.find({ childId: req.params.childId }).sort({ date: -1 });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching game progress' });
  }
});

// POST — progress saver (handles BOTH manual teacher reports and game telemetry)
router.post('/', async (req, res) => {
  try {
    if (req.body.childId) {
      // ── GAME SAVE FLOW ──
      // Games only send telemetry fields, without studentName/mood.
      // The Progress schema is conditionally configured to accept this.
      const { childId, gameName, score, stars, levelPlayed, completionTime, totalMoves, date } = req.body;
      const gameReport = new Progress({
        childId,
        gameName,
        score,
        stars,
        levelPlayed,
        completionTime,
        totalMoves,
        date: date || new Date()
      });
      const savedReport = await gameReport.save();
      return res.status(201).json(savedReport);
    }

    // ── TEACHER MANUAL REPORT FLOW ──
    const {
      studentName, date, activity, mood, notes, avatar,
      skillArea, engagementLevel, progressLevel, attendanceStatus,
      sessionDuration, recommendations,
      // game telemetry that may come from /auto or teacher-linked games
      stars, totalMoves, completionTime, gameName,
    } = req.body;

    // Validate required teacher fields
    if (!studentName || !date || !mood) {
      return res.status(400).json({ message: 'studentName, date and mood are required' });
    }

    const newReport = new Progress({
      studentName,
      date,
      activity: activity || '',
      mood,
      notes:            notes            || '',
      avatar:           avatar           || '👦',
      skillArea:        skillArea        || '',
      engagementLevel:  engagementLevel  || '',
      progressLevel:    progressLevel    || '',
      attendanceStatus: attendanceStatus || '',
      sessionDuration:  sessionDuration ? Number(sessionDuration) : null,
      recommendations:  recommendations  || '',
      // game fields
      gameName:       gameName       || '',
      stars:          Number(stars)          || 0,
      totalMoves:     Number(totalMoves)     || 0,
      completionTime: Number(completionTime) || 0,
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /auto — auto generate report from game completion stats
router.post('/auto', async (req, res) => {
  try {
    const { studentName, gameName, stars = 0, totalMoves = 0, completionTime = 0 } = req.body;

    if (!studentName || !gameName) {
      return res.status(400).json({ message: 'studentName and gameName are required' });
    }

    // Auto-calculate mood from stars
    let mood = 'Neutral';
    if (stars >= 3) mood = 'Excited';
    else if (stars >= 2) mood = 'Happy';
    else mood = 'Neutral';

    // Auto-generate positive notes praising performance
    const timeStr = completionTime ? ` in ${completionTime}s` : '';
    const movesStr = totalMoves ? ` with ${totalMoves} moves` : '';
    const notes = `⭐ Great work playing "${gameName}"! You earned ${stars} star${stars !== 1 ? 's' : ''}${timeStr}${movesStr}. Keep it up — you're doing amazing! 🎉`;

    const newReport = new Progress({
      studentName,
      gameName,
      activity: gameName,
      date: new Date(),
      mood,
      notes,
      stars,
      totalMoves,
      completionTime,
      avatar: '🎮',
    });

    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE — remove a report
router.delete('/:id', async (req, res) => {
  try {
    await Progress.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT — update a report
router.put('/:id', async (req, res) => {
  try {
    const updatedReport = await Progress.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedReport) return res.status(404).json({ message: 'Report not found' });
    res.json(updatedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
