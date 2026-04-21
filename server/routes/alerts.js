const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// 1. GET all unresolved alerts for a specific child
router.get('/:childId', async (req, res) => {
  try {
    // We only want alerts that haven't been resolved yet, sorted newest to oldest
    const alerts = await Alert.find({ 
      childId: req.params.childId, 
      isResolved: false 
    }).sort({ timestamp: -1 });
    
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: 'Server error fetching alerts' });
  }
});

// 2. PATCH (update) an alert to mark it as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { isResolved: true });
    res.json({ success: true, message: 'Alert resolved' });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ message: 'Server error updating alert' });
  }
});

module.exports = router;