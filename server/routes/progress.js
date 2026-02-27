const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Progress.find().sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new report
router.post('/', async (req, res) => {
  const { studentName, date, activity, mood, notes } = req.body;
  const newReport = new Progress({ studentName, date, activity, mood, notes });

  try {
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a report (Bonus feature for you!)
router.delete('/:id', async (req, res) => {
  try {
    await Progress.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;