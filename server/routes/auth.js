const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ----------------------------------------------------
// @route   POST /api/auth/register
// ----------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, parentPin, googleToken, diagnosis } = req.body;

    let finalEmail = email;

    // 🚀 NEW: If it's a Google signup, verify the token for security
    if (googleToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      finalEmail = ticket.getPayload().email;
    }

    const userExists = await User.findOne({ email: finalEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // 🚀 NEW: Generate Custom ID
    const roleCount = await User.countDocuments({ role });
    const paddedNum = String(roleCount + 1).padStart(3, '0');
    const prefix = role === 'teacher' ? 'TR' : 'ST';
    const customId = `${prefix}${paddedNum}`;

    const user = await User.create({
      name,
      email: finalEmail,
      password: googleToken ? '' : password, // No password needed for Google!
      role,
      parentPin,
      customId,
      diagnosis: role === 'teacher' ? null : (diagnosis || 'None')
    });

    if (user) {
      const generatedToken = generateToken(user._id);
      res.status(201).json({
        token: generatedToken,
        user: { _id: user.id, name: user.name, email: user.email, role: user.role, customId: user.customId },
        role: user.role,
        customId: user.customId // include customId heavily at root for UI popups
      });
    }
  } catch (error) {
    console.error("🔥 REGISTRATION CRASH LOG:", error);
    res.status(500).json({ message: 'Server error during registration', details: error.message });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/login
// ----------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const generatedToken = generateToken(user._id);
      res.status(200).json({
        token: generatedToken,
        user: { _id: user.id, name: user.name, email: user.email, role: user.role },
        role: user.role
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/verify-pin
// ----------------------------------------------------
router.post('/verify-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.parentPin !== pin) return res.status(401).json({ message: 'Incorrect PIN. Try again!' });

    res.json({ success: true, message: 'Parent verified' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying PIN' });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/google
// ----------------------------------------------------
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body; 
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });

    // 🚀 NEW: If they don't exist, tell the frontend to trigger "Step 2"
    if (!user) {
      return res.json({
        isNewUser: true,
        email: payload.email,
        name: payload.name,
        googleToken: token
      });
    }

    // If they do exist, log them in normally!
    const generatedToken = generateToken(user._id);
    res.status(200).json({
      token: generatedToken,
      user: { _id: user.id, name: user.name, email: user.email, role: user.role },
      role: user.role
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

module.exports = router;