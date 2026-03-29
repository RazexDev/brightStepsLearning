const ExtraTask = require("../models/ExtraTask");

/* =====================================================
   GET EXTRA TASKS
   - Teacher: can filter by ?userId= (or all)
   - Parent: only own extra tasks
===================================================== */
exports.getExtraTasks = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      // no userId filter = teacher sees all
    } else {
      query.userId = req.user._id;
    }

    const tasks = await ExtraTask.find(query).lean();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load extra tasks" });
  }
};

/* =====================================================
   ADD EXTRA TASK to a (default) routine
===================================================== */
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

    // Teachers may supply a target userId; parents always use their own
    const targetUserId = (req.user.role === 'teacher' && req.body.userId)
      ? req.body.userId
      : req.user._id;

    const task = { label: label.trim(), mins: Number(mins) || 0 };

    let extraTask = await ExtraTask.findOne({ userId: targetUserId, routineId });
    if (extraTask) {
      extraTask.tasks.push(task);
    } else {
      extraTask = new ExtraTask({ userId: targetUserId, routineId, tasks: [task] });
    }

    const saved = await extraTask.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to save extra task" });
  }
};