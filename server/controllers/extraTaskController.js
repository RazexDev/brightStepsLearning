const ExtraTask = require("../models/ExtraTask");
const Routine = require("../models/Routine");

exports.getExtraTasks = async (req, res) => {
  try {
    const query = { parentId: req.user._id };

    if (req.query.studentId) {
      query.studentId = req.query.studentId;
    }

    if (req.query.routineId) {
      query.routineId = req.query.routineId;
    }

    const tasks = await ExtraTask.find(query).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load extra tasks" });
  }
};

exports.addExtraTask = async (req, res) => {
  try {
    const { routineId } = req.params;
    const { label, mins = 0 } = req.body || {};

    if (!label || !label.trim()) {
      return res.status(400).json({ message: "Task label is required" });
    }

    const routine = await Routine.findById(routineId);
    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    if (!routine.parentId.equals(req.user._id)) {
      return res.status(403).json({ message: "Not authorized for this routine" });
    }

    const task = { label: label.trim(), mins: Number(mins) || 0 };

    let extraTask = await ExtraTask.findOne({
      routineId,
      parentId: req.user._id,
      studentId: routine.studentId
    });

    if (extraTask) {
      extraTask.tasks.push(task);
    } else {
      extraTask = new ExtraTask({
        routineId,
        parentId: req.user._id,
        studentId: routine.studentId,
        tasks: [task]
      });
    }

    const saved = await extraTask.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to save extra task" });
  }
};