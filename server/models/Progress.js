const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
  {
    studentName:    { type: String, required: true, trim: true },
    date:           { type: Date, required: true },
    activity:       { type: String, required: true, trim: true },
    mood: {
      type: String,
      required: true,
      enum: ['Happy', 'Neutral', 'Frustrated', 'Excited', 'Tired'],
    },
    notes:          { type: String, default: '', trim: true },
    avatar:         { type: String, default: '👧' },
    // Game-performance fields (added for auto-generation)
    stars:          { type: Number, default: 0 },
    totalMoves:     { type: Number, default: 0 },
    completionTime: { type: Number, default: 0 }, // seconds
    gameName:       { type: String, default: '' },
  },
  { timestamps: true }
);

// Level calculation logic: Level = Math.min(25, Math.floor(Total Activities / 5))
ProgressSchema.statics.calculateLevel = async function(studentName) {
  try {
    const totalActivities = await this.countDocuments({ studentName });
    const level = Math.floor(totalActivities / 5);
    return Math.min(25, level);
  } catch (error) {
    console.error("Error calculating level:", error);
    return 0;
  }
};

module.exports = mongoose.model('Progress', ProgressSchema);