// 1. Change 'import' to 'require'
const mongoose = require("mongoose");
// Make sure this points to your actual Routine model file
const Routine = require("../models/Routine");

/* =====================================================
   GET ALL ROUTINES
===================================================== */
const getRoutines = async (req, res) => {
  try {
    const routines = await Routine.find();
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
    console.log("INCOMING CREATE ROUTINE PAYLOAD:", req.body);
    const newRoutine = new Routine({
      // We accept the full schema fields dynamically from the frontend
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
      isDefault: req.body.isDefault,
      iconBg: req.body.iconBg
    });

    const savedRoutine = await newRoutine.save();
    res.status(201).json(savedRoutine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   UPDATE ROUTINE (Toggle Complete)
===================================================== */
const updateRoutine = async (req, res) => {
  try {
    const updatedRoutine = await Routine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRoutine) return res.status(404).json({ message: "Routine not found" });

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
    await Routine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Routine deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Change 'export' to 'module.exports'
module.exports = {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
};