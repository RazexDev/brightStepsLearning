const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Prevents two people from registering with the same email
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['parent', 'teacher', 'admin'], // These perfectly match your Use Case Diagram!
    default: 'parent',
  },
}, { timestamps: true });

// SECURITY: Encrypt password BEFORE saving to the database
userSchema.pre('save', async function () {
  // If the password wasn't modified, skip encryption
  if (!this.isModified('password')) {
    return; // Just return to exit early!
  }
  
  // Generate a 'salt' and scramble the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper function to compare passwords when they try to log in
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);