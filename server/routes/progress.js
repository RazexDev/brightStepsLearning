const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress'); // Note: This grabs the model we updated to use the 'game_stats' collection!

// Route: POST /api/progress
// Purpose: Receives game stats from the frontend and saves them to MongoDB
router.post('/', async (req, res) => {
  try {
    const newRecord = new Progress(req.body);
    const savedRecord = await newRecord.save();
    
    console.log(`✅ Game Data Saved to Database: ${savedRecord.gameName} (Level ${savedRecord.levelPlayed})`);
    res.status(201).json(savedRecord);
    
  } catch (error) {
    console.error('❌ Error saving progress to DB:', error);
    res.status(500).json({ message: 'Server error saving progress' });
  }
});

// Route: GET /api/progress/:childId
// Purpose: Fetches all saved game stats for a specific child to display on the dashboard
router.get('/:childId', async (req, res) => {
  try {
    // Find all records matching the childId, and sort them by date (newest first: -1)
    const stats = await Progress.find({ childId: req.params.childId }).sort({ date: -1 });
    
    console.log(`✅ Fetched ${stats.length} game records for child: ${req.params.childId}`);
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('❌ Error fetching stats from DB:', error);
    res.status(500).json({ message: 'Server error fetching progress' });
  }
});

module.exports = router;