const Routine = require("../models/Routine");

/* =====================================================
   GET ROUTINES
   - Teacher: can see ALL or filter by ?userId=
   - Parent/default: only own custom routines (isDefault
     routines are baked in on the frontend)
===================================================== */
const getRoutines = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      // Teachers can optionally filter by a specific student
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      // else no filter — return all custom routines
    } else {
      // Parents / students only see their own custom routines
      query.userId = req.user._id;
    }

    const routines = await Routine.find(query).sort({ createdAt: -1 });
    res.status(200).json(routines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   CREATE NEW ROUTINE
===================================================== */
const createRoutine = async (req, res) => {
  try {
    // Teachers may specify a target userId; parents always own it themselves
    const targetUserId = (req.user.role === 'teacher' && req.body.userId)
      ? req.body.userId
      : req.user._id;

    const newRoutine = new Routine({
      userId: targetUserId,
      studentName: req.body.studentName,
      title: req.body.title,
      goal: req.body.goal,
      skillFocus: req.body.skillFocus,
      desc: req.body.desc,
      type: req.body.type,
      cls: req.body.cls,
      iconEmoji: req.body.iconEmoji,
      emoji: req.body.emoji,
      badge: req.body.badge,
      tags: req.body.tags,
      defaultTasks: req.body.defaultTasks,
      isDefault: false, // created routines are never "default"
      iconBg: req.body.iconBg,
    });

    const savedRoutine = await newRoutine.save();
    res.status(201).json(savedRoutine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   UPDATE ROUTINE
===================================================== */
const updateRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    const isOwner = routine.userId && routine.userId.equals(req.user._id);
    const isTeacher = req.user.role === 'teacher';

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ message: "Not authorized to edit this routine" });
    }

    const updatedRoutine = await Routine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedRoutine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   DELETE ROUTINE
===================================================== */
const deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });

    const isOwner = routine.userId && routine.userId.equals(req.user._id);
    const isTeacher = req.user.role === 'teacher';

    if (!isOwner && !isTeacher) {
      return res.status(403).json({ message: "Not authorized to delete this routine" });
    }

    await Routine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Routine deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRoutines, createRoutine, updateRoutine, deleteRoutine };