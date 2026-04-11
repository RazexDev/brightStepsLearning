const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    mins: { type: Number, default: 0 }
  },
  { _id: false }
);

const extraTaskSchema = new mongoose.Schema(
  {
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      required: true
    },
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
    tasks: [taskSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.models.ExtraTask || mongoose.model("ExtraTask", extraTaskSchema);