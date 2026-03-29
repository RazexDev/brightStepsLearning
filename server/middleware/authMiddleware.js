const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password -parentPin');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — user not found.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
  }
};

module.exports = { protect };
