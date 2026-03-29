const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  label: { type: String, required: true },
  mins: { type: Number, default: 0 }
});

const extraTaskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    routineId: {
      type: String,
      required: true
    },
    tasks: [taskSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExtraTask", extraTaskSchema);