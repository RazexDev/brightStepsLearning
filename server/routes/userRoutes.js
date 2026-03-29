const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * GET /api/users/students
 * Returns all users with role === 'student' OR role === 'parent'
 * (In this app parents/students share the same dashboard)
 * Restricted to authenticated teachers only.
 */
router.get('/students', protect, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }

    const query = { role: { $in: ['parent', 'student'] } };
    
    // Strict Scoping: Teachers ONLY see assigned students
    if (req.user.role === 'teacher') {
      query.assignedTeacher = req.user._id;
    }

    const students = await User.find(
      query,
      '_id name email role createdAt assignedTeacher'  // never send passwords
    ).sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/users/all
 * Returns EVERY user in the database.
 * Restricted to authenticated admins only.
 */
router.get('/all', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const allUsers = await User.find(
      {},
      '_id name email role createdAt assignedTeacher'
    ).sort({ createdAt: -1 });

    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/users/:id
 * Deletes a user from the database.
 * Restricted to authenticated admins only.
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully', userId: deletedUser._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/users/:id/parent-name
 * Updates the parentName for a given user.
 */
router.patch('/:id/parent-name', protect, async (req, res) => {
  try {
    const { parentName } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { parentName },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Parent name updated', parentName: updatedUser.parentName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/users/teachers
 * Returns all teachers. Used by admins for assignment dropdowns.
 */
router.get('/teachers', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const teachers = await User.find({ role: 'teacher' }, '_id name email');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * PATCH /api/users/:studentId/assign
 * Assigns a specific teacher to a student.
 */
router.patch('/:studentId/assign', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    const { teacherId } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.studentId,
      { assignedTeacher: teacherId || null },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Teacher assigned successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
