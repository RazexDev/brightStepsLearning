require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json()); // Allows us to read JSON data from the frontend
app.use(cors()); // Allows our React app (port 3000) to talk to this API

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Cloud!'))
  .catch((err) => console.error('❌ Database connection error:', err));

//API routes
  app.use('/api/auth', require('./routes/auth'));

// Basic Test Route
app.get('/', (req, res) => {
  res.send('BrightSteps API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});