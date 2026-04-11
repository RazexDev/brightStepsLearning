require('dotenv').config();

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
app.use(cors());
app.use(express.json());

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
app.use('/api/flags', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (Interface: 0.0.0.0)`);
});