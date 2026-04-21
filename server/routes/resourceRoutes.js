const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const Progress = require('../models/Progress');

// POST route (Save Resource)
router.post('/', async (req, res) => {
  try {
    const { title, type, fileUrl, instructionalText, targetSkill, studentName, requiredLevel, offlineInstructions } = req.body;
    const newResource = new Resource({ title, type, fileUrl, instructionalText, targetSkill, studentName, requiredLevel, offlineInstructions });
    await newResource.save();
    res.status(201).json(newResource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET route (Fetch ALL Resources - Used by Teacher Dashboard)
router.get('/', async (req, res) => {
  try {
    const { studentName } = req.query;
    let query = {};
    if (studentName) {
      query = { $or: [{ studentName: { $exists: false } }, { studentName: null }, { studentName }] };
    }
    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET route (SMART RECOMMENDATION ENGINE - Used by Learning Hub)
router.get('/recommend/:studentName', async (req, res) => {
  try {
    const { studentName } = req.params;

    // 1. Calculate current level dynamically
    const currentLevel = await Progress.calculateLevel(studentName);
    const totalActivities = await Progress.countDocuments({ studentName });
    const progressPct = ((totalActivities % 5) / 5) * 100;
    
    // 2. Fetch real latest progress data
    const latestProgress = await Progress.findOne({ studentName }).sort({ createdAt: -1 });
    const mood = latestProgress ? latestProgress.mood : 'Happy';

    // 3. The Algorithm: Match the Game Mood to the Resource Skill
    let requiredSkill = 'general';
    if (mood === 'Tired') {
        requiredSkill = 'calming'; 
    } else if (mood === 'Excited' || mood === 'Frustrated') {
        requiredSkill = 'focus'; 
    } else if (mood === 'Neutral') {
        requiredSkill = 'communication';
    }

    // 4. Generate the Dynamic Next Goal
    const nextLevel = Math.min(25, currentLevel + 1);
    const skillCapitalized = requiredSkill.charAt(0).toUpperCase() + requiredSkill.slice(1);
    const nextGoal = currentLevel >= 25 
        ? "Amazing! You reached max Level 25. Keep playing to maintain your streak!"
        : `Next Goal: Complete a ${skillCapitalized} Activity to boost your score and reach Level ${nextLevel}!`;

    // 5. Query Resources with Level Filtering AND Skill Mapping
    const recommendedResources = await Resource.find({ 
        targetSkill: requiredSkill,
        requiredLevel: { $lte: currentLevel } 
    }).sort({ requiredLevel: -1 });

    // 6. structured JSON response Phase 2 requirement
    res.status(200).json({
        currentLevel,
        progressPct,
        nextGoal,
        resources: recommendedResources
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT route (Emoji Reactions for Learning Hub)
router.put('/:id/react', async (req, res) => {
  try {
    const { emojiType } = req.body; 
    const updateQuery = {};
    updateQuery[`reactions.${emojiType}`] = 1;

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: updateQuery },
      { new: true }
    );
    res.status(200).json(updatedResource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE route (Remove Resource)
router.delete('/:id', async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    if (!deletedResource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json({ message: 'Resource deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;