// controllers/extraTaskController.js
const ExtraTask = require("../models/ExtraTask");

exports.getExtraTasks = async (_req, res) => {
  try {
    const tasks = await ExtraTask.find().lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load extra tasks" });
  }
};

exports.addExtraTask = async (req, res) => {
  try {
    const { routineId } = req.params;
    const { label, mins = 0 } = req.body || {};

    if (!routineId || typeof routineId !== "string") {
      return res.status(400).json({ message: "Invalid routineId" });
    }
    if (!label || !label.trim()) {
      return res.status(400).json({ message: "Task label is required" });
    }

    const task = { label: label.trim(), mins: Number(mins) || 0 };

    let extraTask = await ExtraTask.findOne({ routineId });
    if (extraTask) {
      extraTask.tasks.push(task);
    } else {
      extraTask = new ExtraTask({ routineId, tasks: [task] });
    }

    const saved = await extraTask.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to save extra task" });
  }
};