require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chat');
const alertRoutes = require('./routes/alerts');
const cors = require('cors');



// Import Routes
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progressRoutes'); // Enhanced: manual + auto report generation

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/chat', chatRoutes);
app.use('/api/alerts', alertRoutes);

// Connect to MongoDB Atlas
// (Using family: 4 to prevent the Windows IPv6 ECONNREFUSED error for the team)
mongoose.connect(process.env.MONGO_URI, {
  family: 4 
})
.then(() => console.log('✅ Connected to MongoDB Atlas Cloud!'))
.catch((err) => console.error('❌ Database connection error:', err));

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes); // 👈 NEW: The receiver for the Game Hub
app.use('/api/routines', require('./routes/routines'));
app.use('/api/extra-tasks', require('./routes/extraTasks'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/flags', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));



// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});