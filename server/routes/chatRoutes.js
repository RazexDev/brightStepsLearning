const express = require('express');
const router  = express.Router();
const Alert = require('../models/Alert');
const { protect } = require('../middleware/authMiddleware');

/**
 * GET /api/flags
 * Returns flagged SparkyBot conversations scoped to the logged-in user.
 */
router.get('/', protect, async (req, res) => {
  try {
    // 1. Strict Scoping: Only return alerts matching the authenticated user's ID
    const alerts = await Alert.find({ childId: req.user._id }).sort({ timestamp: -1 });

    // 2. Format to match the Parent Dashboard UI Expectations
    const flags = alerts.map(f => ({
      _id: f._id,
      studentName: f.studentName || req.user.name || 'Student',
      timestamp: f.timestamp,
      emotion: f.emotion || 'Flagged',
      severity: 'high',
      message: f.triggerMessage,
      context: 'Chat with SparkyBot',
      sparkyNote: f.aiReasoning || 'SparkyBot detected elevated concern.',
      resolved: f.isResolved
    }));

    res.json(flags);
  } catch (error) {
    console.error('Error fetching chat flags:', error);
    res.status(500).json({ message: 'Server error fetching flags' });
  }
});

module.exports = router;
