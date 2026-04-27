const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    mins: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["morning", "evening", "study", "school", "bedtime", "custom", "Health", "Academic", "Behavior", "Self-care", "Other"],
      required: true
    },
    tasks: [taskSchema],
    goalId: { type: mongoose.Schema.Types.ObjectId, default: null },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentName: { type: String },
    taskName: { type: String, default: "" }, // mobile support
    isCompleted: { type: Boolean, default: false }, // mobile support
    timestamp: { type: Date, default: Date.now }, // mobile support
    type: { type: String, default: "general" },
    desc: { type: String, default: "" },
    tags: [{ type: String }],
    iconEmoji: { type: String, default: "📋" },
    emoji: { type: String, default: "✨" },
    badge: { type: String, default: "" },
    iconBg: { type: String, default: "" },
    sourceTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null
    },
    goal: { type: String, default: "" },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    streakCount: { type: Number, default: 0 },
    rewards: {
      starsEarned: { type: Number, default: 0 },
      badgesEarned: [{ type: String }]
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Routine || mongoose.model("Routine", routineSchema);