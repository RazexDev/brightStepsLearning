require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const app = express();
  app.use(express.json());
  
  // Apply routes exactly as server.js
  app.use('/api/routines', require('./routes/routines'));
  
  const server = app.listen(5005, async () => {
    console.log('Test server running on 5005');
    
    // Now make a test request
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');
    const student = await User.findOne({ role: 'student' });
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET || 'brightsteps_secret_dev_123', { expiresIn: '1h' });
    
    const response = await fetch('http://localhost:5005/api/routines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        studentId: student._id.toString(),
        taskName: 'Test Server Routine',
        category: 'Morning',
        isCompleted: false
      })
    });
    
    console.log('Status:', response.status);
    console.log('Data:', await response.text());
    
    server.close();
    process.exit(0);
  });
}

run();
