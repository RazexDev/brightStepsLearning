require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chat');
const alertRoutes = require('./routes/alerts');
const cors = require('cors');



// Import Routes
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress'); // 👈 NEW: Progress routing

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

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});