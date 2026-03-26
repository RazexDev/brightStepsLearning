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
    unique: true, 
  },
  password: {
    type: String, 
    // 💡 TECH LEAD FIX: Removed "required: true" here so Google Login won't crash later!
  },
  parentPin: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 4
  }, // 👈 NEW: The 4-digit Parent Lock
  role: {
    type: String,
    enum: ['parent', 'teacher', 'admin'], 
    default: 'parent',
  },
}, { timestamps: true });

// SECURITY: Encrypt password BEFORE saving to the database
userSchema.pre('save', async function () {
  // If the password wasn't modified OR doesn't exist (Google Auth prep), skip encryption
  if (!this.isModified('password') || !this.password) {
    return; 
  }
  
  // Generate a 'salt' and scramble the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper function to compare passwords when they try to log in
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Fallback for Google users
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);