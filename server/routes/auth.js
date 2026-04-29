const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { protect, parent } = require('../middleware/authMiddleware');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'brightsteps_secret_dev_123', { expiresIn: '30d' });
};

// ----------------------------------------------------
// @route   POST /api/auth/register
// ----------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, parentPin, googleToken, diagnosis } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required.' });
    }

    if (!['parent', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Role must be parent or student.' });
    }

    let finalEmail = email;

    // Google signup
    if (googleToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      finalEmail = ticket.getPayload().email;
    }

    if (!finalEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    if (!googleToken && !password) {
      return res.status(400).json({ message: 'Password is required.' });
    }

    const userExists = await User.findOne({ email: finalEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    const roleCount = await User.countDocuments({ role });
    const paddedNum = String(roleCount + 1).padStart(3, '0');
    const prefix = role === 'parent' ? 'PR' : 'ST';
    const customId = `${prefix}${paddedNum}`;

    const userPayload = {
      name,
      email: finalEmail,
      password: googleToken ? '' : password,
      role,
      customId,
      diagnosis: role === 'student' ? (diagnosis || 'None') : null,
    };

    if (parentPin) {
      userPayload.parentPin = parentPin;
    }

    const user = await User.create(userPayload);

    if (!user) {
      return res.status(500).json({ message: 'Failed to create user.' });
    }

    const generatedToken = generateToken(user._id);

    const responseData = {
      token: generatedToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customId: user.customId,
        diagnosis: user.diagnosis || null,
      },
      role: user.role,
      customId: user.customId,
    };

    if (user.role === 'student') {
      responseData.studentId = user._id;
      responseData.user.studentId = user._id;
    }

    return res.status(201).json(responseData);
  } catch (error) {
    console.error('🔥 REGISTRATION CRASH LOG:', error);
    res.status(500).json({
      message: 'Server error during registration',
      details: error.message,
    });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/login
// ----------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const generatedToken = generateToken(user._id);

      const responseData = {
        token: generatedToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          customId: user.customId,
          diagnosis: user.diagnosis || null,
          parentName: user.parentName || '',
        },
        role: user.role,
      };

      if (user.role === 'student') {
        responseData.studentId = user._id;
        responseData.user.studentId = user._id;
      }

      return res.status(200).json(responseData);
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('🔥 LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/verify-pin
// ----------------------------------------------------
router.post('/verify-pin', async (req, res) => {
  try {
    const { userId, pin } = req.body;

    if (!userId || !pin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Unable to verify: User ID and PIN are required.' 
      });
    }

    // Wrap finding the user in a case-specific try-catch if needed, 
    // but the main try-catch handles it for now.
    const user = await User.findById(userId);

    if (!user) {
      console.warn(`⚠️ [verify-pin] User ${userId} not found.`);
      return res.status(404).json({ 
        success: false, 
        message: 'Account not found. Please log in again.' 
      });
    }

    if (!user.parentPin) {
      console.warn(`⚠️ [verify-pin] Student ${user.name} (${userId}) has no Parent PIN set.`);
      return res.status(400).json({ 
        success: false, 
        message: 'No parent PIN has been set for this account yet.' 
      });
    }

    let isMatch = false;
    if (user.parentPin.length === 60) {
      isMatch = await bcrypt.compare(pin, user.parentPin);
    } else {
      isMatch = (user.parentPin === pin);
    }

    if (!isMatch) {
      console.warn(`❌ [verify-pin] Incorrect PIN for student ${user.name}.`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid PIN. Please try again!' 
      });
    }

    console.log(`✅ [verify-pin] Parent verified for student ${user.name}.`);
    return res.status(200).json({ 
      success: true, 
      message: 'Parent identity verified successfully.' 
    });

  } catch (error) {
    console.error('🔥 VERIFY PIN CRASH:', error);
    
    // Check for specific Mongoose CastError (invalid ID format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Authentication error: Invalid user session format.'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Secure verification service is temporarily unavailable. Please try again later.', 
    });
  }
});

// ----------------------------------------------------
// @route   POST /api/auth/google
// ----------------------------------------------------
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      return res.json({
        isNewUser: true,
        email: payload.email,
        name: payload.name,
        googleToken: token,
      });
    }

    const generatedToken = generateToken(user._id);

    const responseData = {
      token: generatedToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customId: user.customId,
        diagnosis: user.diagnosis || null,
        parentName: user.parentName || '',
      },
      role: user.role,
    };

    if (user.role === 'student') {
      responseData.studentId = user._id;
      responseData.user.studentId = user._id;
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

module.exports = router;