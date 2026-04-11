const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies JWT and attaches req.user
 * Expects: Authorization: Bearer <token>
 */
/**
 * Protect middleware — verifies JWT and attaches req.user
 * Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'brightsteps_secret_dev_123');
    req.user = await User.findById(decoded.id).select('-password -parentPin');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — user not found.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
  }
};

/**
 * Parent Only Middleware
 */
const parentOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'parent' || req.user.role === 'admin' || req.user.role === 'teacher')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: parent/teacher only' });
  }
};

/**
 * Student Only Middleware
 */
const studentOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'student' || req.user.role === 'parent')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: student only' });
  }
};

module.exports = { protect, parentOnly, parent: parentOnly, studentOnly };
