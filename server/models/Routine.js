const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
    },
    mins: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const rewardSchema = new mongoose.Schema(
  {
    starsEarned: {
      type: Number,
      default: 0,
    },
    badgesEarned: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    taskName: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      default: "custom",
    },

    tasks: {
      type: [taskSchema],
      default: [],
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      default: "",
    },

    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },

    type: {
      type: String,
      default: "general",
    },

    desc: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    iconEmoji: {
      type: String,
      default: "📋",
    },

    emoji: {
      type: String,
      default: "✨",
    },

    badge: {
      type: String,
      default: "",
    },

    iconBg: {
      type: String,
      default: "",
    },

    sourceTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },

    goal: {
      type: String,
      default: "",
    },

    progress: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    streakCount: {
      type: Number,
      default: 0,
    },

    rewards: {
      type: rewardSchema,
      default: () => ({
        starsEarned: 0,
        badgesEarned: [],
      }),
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Routine || mongoose.model("Routine", routineSchema);