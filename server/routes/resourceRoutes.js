const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

// 1. POST route (Save Resource)
router.post('/', async (req, res) => {
  try {
    // UPDATED: Now includes 'targetSkill' from the Teacher Dashboard dropdown
    const { title, type, fileUrl, instructionalText, targetSkill } = req.body;
    const newResource = new Resource({ title, type, fileUrl, instructionalText, targetSkill });
    await newResource.save();
    res.status(201).json(newResource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. GET route (Fetch ALL Resources - Used by Teacher Dashboard)
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET route (SMART RECOMMENDATION ENGINE - Used by Student Dashboard)
router.get('/recommend/:studentName', async (req, res) => {
  try {
    const { studentName } = req.params;

    // Mock data from the Games/Progress team 
    // (Eventually, this will fetch directly from the Progress collection)
    const latestProgress = {
        studentName: studentName,
        activity: "Color match",
        mood: "Tired" 
    };

    let requiredSkill = 'general';

    // The Algorithm: Match the Game Mood to the Resource Skill
    if (latestProgress.mood === 'Tired') {
        requiredSkill = 'calming'; // Recommend breathing exercises
    } else if (latestProgress.mood === 'Excited') {
        requiredSkill = 'focus'; // Recommend physical brain breaks
    } else if (latestProgress.mood === 'Happy') {
        requiredSkill = 'general'; // Recommend visual schedules
    }

    // Fetch ONLY the resources that match what the child needs right now
    const recommendedResources = await Resource.find({ targetSkill: requiredSkill });

    // Send it back to the frontend
    res.status(200).json({
        childMood: latestProgress.mood,
        skillTargeted: requiredSkill,
        resources: recommendedResources
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT route (Emoji Reactions for Student Dashboard)
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

// 5. DELETE route (Remove Resource)
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

// THIS MUST BE THE VERY LAST LINE:
module.exports = router;