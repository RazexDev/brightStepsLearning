const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ----------------------------------------------------
// @route   POST /api/auth/register
// @desc    Register a new user (Teacher/Parent/Admin)
// ----------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Create the new user in the database
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // 3. Send back the success response with a token
    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    // TECH LEAD FIX: Actually log the error so we can see what crashed!
    console.error("🔥 REGISTRATION CRASH LOG:", error);
    res.status(500).json({ message: 'Server error during registration', details: error.message });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// ----------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by their email
    const user = await User.findOne({ email });

    // 2. Check if user exists AND if the password matches our encrypted one
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;