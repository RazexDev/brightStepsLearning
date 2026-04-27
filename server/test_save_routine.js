require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Find a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('No student found');
      process.exit(1);
    }

    console.log('Testing as student:', student.email, 'Role:', student.role);

    // Generate token
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET || 'brightsteps_secret_dev_123', { expiresIn: '1h' });

    // Make request
    try {
      const response = await fetch('http://localhost:5001/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: student._id.toString(),
          taskName: 'Test Routine from Script',
          category: 'Morning',
          isCompleted: false
        })
      });
      
      const responseData = await response.json().catch(() => null);
      console.log('Response Status:', response.status);
      console.log('Response Data:', responseData);
    } catch (err) {
      console.log('NETWORK ERROR:', err.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
