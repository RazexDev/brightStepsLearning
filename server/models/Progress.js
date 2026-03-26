const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  childId: { type: String, required: true }, 
  gameName: { type: String, required: true },
  levelPlayed: { type: Number, required: true },
  score: { type: Number, required: true },
  stars: { type: Number, required: true },
  completionTime: { type: Number, required: true }, // Time in seconds
  totalMoves: { type: Number, required: true },
  date: { type: Date, default: Date.now } // Automatically stamps the current date/time
});

module.exports = mongoose.model('Progress', progressSchema);