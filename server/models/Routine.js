// models/Routine.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  label: { type: String, required: true },
  mins: { type: Number, default: 0 }
});

const routineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String },
  title: { type: String, required: true },
  goal: String,
  skillFocus: String,
  desc: String,
  type: { type: String, enum: ["adhd","autism"], required: true },
  cls: { type: String, enum: ["morning","school","bedtime","custom"], required: true },
  iconEmoji: String,
  emoji: String,
  badge: String,
  tags: [String],
  defaultTasks: [taskSchema],
  isDefault: { type: Boolean, default: false },
  iconBg: String
}, { timestamps: true });

module.exports = mongoose.model("Routine", routineSchema);