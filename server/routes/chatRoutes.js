const express = require('express');
const router  = express.Router();

/**
 * GET /api/chat/flags
 * Returns mocked flagged SparkyBot conversations for the Parent Dashboard.
 * In a real implementation this would query a Conversation / Alert collection.
 */
router.get('/', (req, res) => {
  const flags = [
    {
      _id:       'flag_001',
      studentName: 'Emma Johnson',
      timestamp:   new Date(Date.now() - 1000 * 60 * 45).toISOString(),  // 45 min ago
      emotion:     'Frustrated',
      severity:    'high',
      message:     'I don\'t want to do this anymore! It\'s too hard!',
      context:     'FocusMatch game, round 4 — student abandoned the session.',
      sparkyNote:  'SparkyBot detected elevated frustration. Recommended a calming break activity.',
      resolved:    false,
    },
    {
      _id:       'flag_002',
      studentName: 'Emma Johnson',
      timestamp:   new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hrs ago
      emotion:     'Anxious',
      severity:    'medium',
      message:     'I\'m scared. What if I get it wrong again?',
      context:     'Shape Sort activity, pre-session.',
      sparkyNote:  'SparkyBot offered reassurance and suggested starting with easier shapes.',
      resolved:    true,
    },
    {
      _id:       'flag_003',
      studentName: 'Emma Johnson',
      timestamp:   new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
      emotion:     'Upset',
      severity:    'high',
      message:     'Nobody likes me at school today.',
      context:     'Post-session free chat with SparkyBot.',
      sparkyNote:  'SparkyBot flagged this for parental awareness. Offered empathy and coping strategies.',
      resolved:    false,
    },
  ];

  res.json(flags);
});

module.exports = router;
