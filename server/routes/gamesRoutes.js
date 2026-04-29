const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// GET /api/games/leaderboard
// Returns the top 10 students based on total accumulated stars across all games
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Progress.aggregate([
      // Only include records that have a valid childId or studentName
      {
        $match: {
          $or: [
            { childId: { $exists: true, $ne: null } },
            { studentName: { $exists: true, $ne: "" } }
          ]
        }
      },
      // Group by childId or studentName
      {
        $group: {
          _id: { $ifNull: ['$childId', '$studentName'] },
          childId: { $first: '$childId' },
          studentName: { $first: '$studentName' },
          totalStars: { $sum: '$stars' },
          totalScore: { $sum: '$score' }
        }
      },
      // Lookup the actual User details for avatars and accurate names
      {
        $lookup: {
          from: 'users',
          localField: 'childId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
      },
      // Calculate level: Level = Math.floor(totalStars / 10) + 1
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$user.name', '$studentName', 'Unknown Student'] },
          avatar: { $ifNull: ['$user.avatar', '👧'] },
          totalStars: 1,
          totalScore: 1,
          level: { 
            $add: [
              { $floor: { $divide: ['$totalStars', 10] } }, 
              1
            ] 
          }
        }
      },
      // Sort by totalStars in descending order
      {
        $sort: { totalStars: -1 }
      },
      // Limit to Top 10
      {
        $limit: 10
      }
    ]);

    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

module.exports = router;
