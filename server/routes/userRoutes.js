const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

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
      '_id name email role createdAt assignedTeacher customId'  // never send passwords
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
      '_id name email role createdAt assignedTeacher customId'
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

// =============================================================
//  NEW: Profile Update & Delete Routes (User Management CRUD)
// =============================================================

/**
 * PUT /api/users/profile/:id
 * Updates a user's profile (name, password, profile picture).
 * Accepts multipart/form-data for file uploads via Multer.
 */
router.put('/profile/:id', protect, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, password } = req.body;
    const updateFields = {};

    // Update name if provided
    if (name && name.trim()) {
      updateFields.name = name.trim();
    }

    // Hash and update password if provided
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // Build the profile picture URL if a file was uploaded
    if (req.file) {
      updateFields.profilePicUrl = `/uploads/profiles/${req.file.filename}`;
    }

    // Nothing to update?
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password'); // never return the password

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/users/profile/:id
 * Deletes a user account entirely.
 */
router.delete('/profile/:id', protect, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.', userId: deletedUser._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

