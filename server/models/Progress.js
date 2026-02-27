const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  date: { type: Date, required: true },
  activity: { type: String, required: true },
  mood: { type: String, required: true },
  notes: { type: String }
});

module.exports = mongoose.model('Progress', ProgressSchema);