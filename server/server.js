require('dotenv').config();
const dns = require('dns'); // 👈 NEW: Import Node's built-in DNS module

// 👈 NEW: Force Node to use Google's DNS to fix Atlas SRV resolution issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Global Error Handlers for Stability
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err);
  // Give the server a few ms to log before exiting
  setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:', reason);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const chatRoutes = require('./routes/chat');
const alertRoutes = require('./routes/alerts');
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Request logging for debugging
const fs = require('fs');
app.use((req, res, next) => {
  const logMsg = `Request: ${req.method} ${req.url} | Body: ${JSON.stringify(req.body)} | Role: ${req.user?.role || 'unknown'}\n`;
  console.log(logMsg.trim());
  fs.appendFileSync('request_logs.txt', logMsg);
  
  // Also hook the response to log the status
  const originalSend = res.send;
  res.send = function (data) {
    fs.appendFileSync('request_logs.txt', `Response: ${res.statusCode} ${data}\n`);
    originalSend.call(this, data);
  };
  next();
});

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is reachable!' });
});

// Serve uploaded files (profile pictures etc.) as static assets
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base routes
app.use('/api/chat', chatRoutes);
app.use('/api/alerts', alertRoutes);

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  family: 4
})
  .then(() => console.log('✅ Connected to MongoDB Atlas Cloud!'))
  .catch((err) => console.error('❌ Database connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/routines', require('./routes/routines'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/extra-tasks', require('./routes/extraTasks'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/games', require('./routes/gamesRoutes'));
app.use('/api/flags', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/skills', require('./routes/skillAreaRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (Interface: 0.0.0.0)`);
});