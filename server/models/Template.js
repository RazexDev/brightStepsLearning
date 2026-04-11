/**
 * server/models/Template.js
 * UPDATED: Added skills[] and notes fields to match richer seed data.
 */
const mongoose = require("mongoose");

const templateTaskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    mins:  { type: Number, default: 0 }
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    disabilityType: {
      type: String,
      enum: ["adhd", "autism", "general", "both"],
      required: true
    },

    category: {
      type: String,
      enum: ["morning", "evening", "study", "school", "bedtime", "custom"],
      required: true
    },

    tasks:         [templateTaskSchema],
    estimatedTime: { type: Number, default: 0 },
    goals:         [{ type: String }],
    linkedGoals:   [{ type: String }],
    skills:        [{ type: String }],   // NEW: focus/skill areas
    notes:         { type: String, default: "" } // NEW: parent guidance notes
  },
  { timestamps: true }
);

module.exports = mongoose.models.Template || mongoose.model("Template", templateSchema);
