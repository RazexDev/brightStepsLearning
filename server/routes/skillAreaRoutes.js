const express = require('express');
const router = express.Router();
const SkillArea = require('../models/SkillArea');
const { protect } = require('../middleware/authMiddleware');

// Get all skill areas
router.get('/', protect, async (req, res) => {
  try {
    const skills = await SkillArea.find().sort({ name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new skill area
router.post('/', protect, async (req, res) => {
  try {
    const { name, activities } = req.body;
    const newSkill = new SkillArea({ name, activities: activities || [] });
    const savedSkill = await newSkill.save();
    res.status(201).json(savedSkill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a skill area (name or activities)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, activities } = req.body;
    const updatedSkill = await SkillArea.findByIdAndUpdate(
      req.params.id,
      { name, activities },
      { new: true, runValidators: true }
    );
    res.json(updatedSkill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a skill area
router.delete('/:id', protect, async (req, res) => {
  try {
    await SkillArea.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill Area deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
