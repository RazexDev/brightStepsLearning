const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// GET — fetch reports (supports ?studentName= filter)
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

// POST — manual report creation
router.post('/', async (req, res) => {
  try {
    const { studentName, date, activity, mood, notes, avatar, stars, totalMoves, completionTime, gameName } = req.body;
    const newReport = new Progress({ studentName, date, activity, mood, notes, avatar, stars, totalMoves, completionTime, gameName });
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
    if (stars >= 3)      mood = 'Excited';
    else if (stars >= 2) mood = 'Happy';
    else                 mood = 'Neutral';

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

module.exports = router;
