const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
  {
    // ── Teacher Report Fields ──
    studentName: { 
      type: String, 
      required: function() { return !this.childId; }, 
      trim: true 
    },
    date: { type: Date, required: true },
    activity: { 
      type: String, 
      required: function() { return !this.childId; }, 
      trim: true 
    },
    mood: {
      type: String,
      required: function() { return !this.childId; },
      enum: ['Happy', 'Neutral', 'Frustrated', 'Excited', 'Tired'],
    },
    notes:  { type: String, default: '', trim: true },
    avatar: { type: String, default: '👧' },
    skillArea: { type: String, trim: true },
    engagementLevel: { type: String, trim: true },
    progressLevel: { type: String, trim: true },
    attendanceStatus: { type: String, trim: true },
    sessionDuration: { type: Number },
    recommendations: { type: String, trim: true },

    // ── Game Telemetry Fields ──
    childId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gameName:       { type: String, default: '' },
    stars:          { type: Number, default: 0 },
    totalMoves:     { type: Number, default: 0 },
    completionTime: { type: Number, default: 0 }, // seconds
    score:          { type: Number, default: 0 },
    levelPlayed:    { type: Number, default: 1 },
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