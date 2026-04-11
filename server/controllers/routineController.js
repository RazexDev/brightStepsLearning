/**
 * server/controllers/routineController.js
 * UPDATED: aiGenerateRoutine now calls geminiService.
 * All other functions are identical to the previous version.
 */

const Routine = require("../models/Routine");
const Template = require("../models/Template");
const RoutineProgress = require("../models/RoutineProgress");
const { generateRoutine } = require("../services/geminiService");

/* ── helpers ─────────────────────────────────────── */
function calculateProgress(tasks = []) {
  const total = tasks.length;
  if (!total) return 0;
  const done = tasks.filter(t => t.completed).length;
  return Math.round((done / total) * 100);
}

function buildRewards(progress, streakCount = 0, totalStarsAllTime = 0, isFirstEver = false) {
  let starsEarned = 0;
  const badgesEarned = [];

  if (progress === 100) starsEarned += 5;
  if (progress >= 50) starsEarned += 2;

  if (streakCount >= 3) badgesEarned.push("3-Day Streak 🔥");
  if (streakCount >= 7) badgesEarned.push("7-Day Streak 🌟");
  if (progress === 100) badgesEarned.push("Routine Champion 🏆");
  if (isFirstEver) badgesEarned.push("First Routine Done! 🎉");

  const projected = totalStarsAllTime + starsEarned;
  if (projected >= 5 && totalStarsAllTime < 5) badgesEarned.push("5 Stars Earned ⭐");
  if (projected >= 10 && totalStarsAllTime < 10) badgesEarned.push("10 Stars Earned 🌠");
  if (projected >= 25 && totalStarsAllTime < 25) badgesEarned.push("25 Stars Earned 🥇");

  return { starsEarned, badgesEarned };
}

/* =====================================================
   PARENT: GET OWN ROUTINES
===================================================== */
const getRoutines = async (req, res) => {
  try {
    const query = { parentId: req.user._id };
    if (req.query.studentId) query.studentId = req.query.studentId;

    const routines = await Routine.find(query)
      .sort({ createdAt: -1 })
      .populate("studentId", "name email diagnosis")
      .lean();

    res.status(200).json(routines);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load routines" });
  }
};

/* =====================================================
   PARENT: CREATE ROUTINE
===================================================== */
const createRoutine = async (req, res) => {
  try {
    const {
      title, category, tasks = [], studentId, studentName,
      goalId = null, type = "general", desc = "", tags = [],
      iconEmoji = "📋", emoji = "✨", badge = "", iconBg = "",
      sourceTemplateId = null, goal = ""
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });
    if (!studentId) return res.status(400).json({ message: "studentId is required" });

    const normalizedTasks = tasks
      .map(t => ({
        label: t.label?.trim(),
        mins: Number(t.mins) || 0,
        completed: false,
        completedAt: null
      }))
      .filter(t => t.label);

    const routine = await Routine.create({
      title: title.trim(),
      category,
      tasks: normalizedTasks,
      goalId,
      parentId: req.user._id,
      studentId,
      studentName,
      type,
      desc,
      tags,
      iconEmoji,
      emoji,
      badge,
      iconBg,
      sourceTemplateId,
      goal,
      progress: 0,
      completed: false
    });

    res.status(201).json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to create routine" });
  }
};

/* =====================================================
   PARENT: UPDATE ROUTINE
===================================================== */
const updateRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    if (!routine.parentId.equals(req.user._id)) return res.status(403).json({ message: "Not authorized" });

    const updateData = { ...req.body };

    if (Array.isArray(updateData.tasks)) {
      updateData.tasks = updateData.tasks
        .map(t => ({
          label: t.label?.trim(),
          mins: Number(t.mins) || 0,
          completed: !!t.completed,
          completedAt: t.completed ? (t.completedAt || new Date()) : null
        }))
        .filter(t => t.label);

      updateData.progress = calculateProgress(updateData.tasks);
      updateData.completed = updateData.progress === 100;
      if (updateData.completed) updateData.completedAt = new Date();
    }

    const updated = await Routine.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update routine" });
  }
};

/* =====================================================
   PARENT: DELETE ROUTINE
===================================================== */
const deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    if (!routine.parentId.equals(req.user._id)) return res.status(403).json({ message: "Not authorized" });

    await Routine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Routine deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete routine" });
  }
};

/* =====================================================
   STUDENT: GET ASSIGNED ROUTINES
===================================================== */
const getAssignedRoutines = async (req, res) => {
  try {
    const routines = await Routine.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(routines);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load assigned routines" });
  }
};

/* =====================================================
   STUDENT: UPDATE TASK / ROUTINE PROGRESS
===================================================== */
const updateProgress = async (req, res) => {
  try {
    const { routineId, taskIndex, completed } = req.body;

    const routine = await Routine.findById(routineId);
    if (!routine) return res.status(404).json({ message: "Routine not found" });
    if (!routine.studentId.equals(req.user._id)) return res.status(403).json({ message: "Not authorized" });
    if (taskIndex < 0 || taskIndex >= routine.tasks.length) {
      return res.status(400).json({ message: "Invalid task index" });
    }

    if (!routine.startedAt) routine.startedAt = new Date();

    routine.tasks[taskIndex].completed = !!completed;
    routine.tasks[taskIndex].completedAt = completed ? new Date() : null;
    routine.progress = calculateProgress(routine.tasks);
    routine.completed = routine.progress === 100;

    let isFirstEver = false;
    if (routine.completed && !routine.completedAt) {
      routine.completedAt = new Date();
      routine.streakCount += 1;
      const prev = await Routine.countDocuments({
        studentId: routine.studentId,
        completed: true,
        _id: { $ne: routine._id }
      });
      isFirstEver = prev === 0;
    }

    const allRoutines = await Routine.find({ studentId: routine.studentId }).lean();
    const totalStarsAllTime = allRoutines.reduce(
      (sum, r) => sum + (r.rewards?.starsEarned || 0),
      0
    );

    routine.rewards = buildRewards(
      routine.progress,
      routine.streakCount,
      totalStarsAllTime,
      isFirstEver
    );

    await routine.save();

    await RoutineProgress.create({
      routineId: routine._id,
      studentId: routine.studentId,
      parentId: routine.parentId,
      completedTasks: routine.tasks.filter(t => t.completed).length,
      totalTasks: routine.tasks.length,
      progress: routine.progress,
      completed: routine.completed,
      date: new Date()
    });

    res.status(200).json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update progress" });
  }
};

/* =====================================================
   PARENT: GET PROGRESS SUMMARY
===================================================== */
const getProgressSummary = async (req, res) => {
  try {
    const query = { parentId: req.user._id };
    if (req.query.studentId) query.studentId = req.query.studentId;

    const routines = await Routine.find(query).lean();

    const totalAssigned = routines.length;
    const completedCount = routines.filter(r => r.completed).length;
    const completionPercentage = totalAssigned
      ? Math.round((completedCount / totalAssigned) * 100)
      : 0;
    const totalStars = routines.reduce((sum, r) => sum + (r.rewards?.starsEarned || 0), 0);
    const badges = [...new Set(routines.flatMap(r => r.rewards?.badgesEarned || []))];

    const categoryBreakdown = ["morning", "study", "evening", "bedtime", "school", "custom"]
      .map(cat => {
        const cat_r = routines.filter(r => r.category === cat);
        const cat_c = cat_r.filter(r => r.completed).length;
        return {
          category: cat,
          total: cat_r.length,
          completed: cat_c,
          pct: cat_r.length ? Math.round((cat_c / cat_r.length) * 100) : 0
        };
      })
      .filter(c => c.total > 0);

    res.json({
      totalAssigned,
      completedCount,
      completionPercentage,
      totalStars,
      badges,
      categoryBreakdown,
      history: routines
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load progress summary" });
  }
};

/* =====================================================
   PARENT: ASSIGN TEMPLATE AS ROUTINE
===================================================== */
const assignTemplateRoutine = async (req, res) => {
  try {
    const { templateId, studentId, studentName } = req.body;
    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ message: "Template not found" });

    const routine = await Routine.create({
      title: template.title,
      category: template.category,
      type: template.disabilityType,
      tasks: template.tasks.map(t => ({
        label: t.label,
        mins: t.mins || 0,
        completed: false,
        completedAt: null
      })),
      parentId: req.user._id,
      studentId,
      studentName,
      sourceTemplateId: template._id,
      tags: template.goals || [],
      goal: (template.goals || [])[0] || "",
      progress: 0,
      completed: false
    });

    res.status(201).json(routine);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to assign template routine" });
  }
};

/* =====================================================
   PARENT: AI GENERATE ROUTINE — Gemini powered
===================================================== */
const aiGenerateRoutine = async (req, res) => {
  try {
    const {
      childName,
      childAge,
      disabilityType,
      wakeUpTime,
      schoolTime,
      afterSchoolTime,
      mealTimes,
      studyTime,
      bedTime,
      goals,
      scheduleText
    } = req.body;

    const generated = await generateRoutine({
      childName,
      childAge,
      disabilityType,
      wakeUpTime,
      schoolTime,
      afterSchoolTime,
      mealTimes,
      studyTime,
      bedTime,
      goals,
      scheduleText
    });

    return res.status(200).json(generated);
  } catch (err) {
    console.error("AI generation failed:", err.message);
    return res.status(500).json({
      message: err.message || "AI generation failed"
    });
  }
};

module.exports = {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getAssignedRoutines,
  updateProgress,
  getProgressSummary,
  assignTemplateRoutine,
  aiGenerateRoutine
};