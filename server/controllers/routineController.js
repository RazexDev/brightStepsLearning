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
   PARENT: CREATE ROUTINE / MOBILE: ADD ROUTINE
===================================================== */
const createRoutine = async (req, res) => {
  try {
    const {
      title, category, tasks = [], studentId, studentName,
      goalId = null, type = "general", desc = "", tags = [],
      iconEmoji = "📋", emoji = "✨", badge = "", iconBg = "",
      sourceTemplateId = null, goal = "",
      taskName, isCompleted, timestamp // Mobile fields
    } = req.body;

    const isMobile = taskName !== undefined || isCompleted !== undefined;

    // Mobile strict check: Teachers cannot create routines
    const userRole = (req.user.role || "").toLowerCase();
    if (userRole === "teacher" && isMobile) {
      return res.status(403).json({ success: false, message: "Teachers are not allowed to create routines." });
    }

    const actualTitle = title || taskName;
    if (!actualTitle?.trim()) {
      return res.status(400).json(isMobile ? { success: false, message: "taskName is required" } : { message: "Title is required" });
    }
    if (!category) {
      return res.status(400).json(isMobile ? { success: false, message: "Category is required" } : { message: "Category is required" });
    }
    if (!studentId) {
      return res.status(400).json(isMobile ? { success: false, message: "studentId is required" } : { message: "studentId is required" });
    }

    let safeCategory = category || "custom";
    const validCategories = ["morning", "evening", "study", "school", "bedtime", "custom", "Health", "Academic", "Behavior", "Self-care", "Other"];
    if (!validCategories.includes(safeCategory)) {
      const lower = safeCategory.toLowerCase();
      if (validCategories.includes(lower)) safeCategory = lower;
      else safeCategory = "Other";
    }

    const normalizedTasks = tasks
      .map(t => ({
        label: t.label?.trim(),
        mins: Number(t.mins) || 0,
        completed: false,
        completedAt: null
      }))
      .filter(t => t.label);

    const routine = await Routine.create({
      title: actualTitle.trim(),
      taskName: taskName?.trim() || actualTitle.trim(),
      category: safeCategory,
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
      completed: isCompleted || false,
      isCompleted: isCompleted || false,
      timestamp: timestamp || Date.now()
    });

    if (isMobile) {
      return res.status(201).json({ success: true, message: "Routine created successfully", data: routine });
    }
    res.status(201).json(routine);
  } catch (err) {
    const isMobile = req.body.taskName !== undefined || req.body.isCompleted !== undefined;
    res.status(400).json(isMobile ? { success: false, message: err.message || "Failed to create routine" } : { message: err.message || "Failed to create routine" });
  }
};

// Alias for mobile requirements
const addRoutine = createRoutine;

/* =====================================================
   PARENT: UPDATE ROUTINE
===================================================== */
const updateRoutine = async (req, res) => {
  try {
    const isMobile = req.body.taskName !== undefined || req.body.isCompleted !== undefined || req.query.mobile === 'true';
    const userRole = (req.user.role || "").toLowerCase();
    
    if (userRole === "teacher") {
      return res.status(403).json(isMobile ? { success: false, message: "Teachers are not allowed to update routines." } : { message: "Not authorized" });
    }

    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json(isMobile ? { success: false, message: "Routine not found" } : { message: "Routine not found" });
    
    const isAssignedStudent = routine.studentId && routine.studentId.equals(req.user._id);
    if (!routine.parentId.equals(req.user._id) && !isAssignedStudent) {
      return res.status(403).json(isMobile ? { success: false, message: "Not authorized" } : { message: "Not authorized" });
    }

    const updateData = { ...req.body };

    // Map mobile fields
    if (updateData.taskName !== undefined) updateData.title = updateData.taskName;
    if (updateData.isCompleted !== undefined) updateData.completed = updateData.isCompleted;

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

    if (isMobile) {
      return res.status(200).json({ success: true, message: "Routine updated successfully", data: updated });
    }
    res.status(200).json(updated);
  } catch (err) {
    const isMobile = req.body.taskName !== undefined || req.body.isCompleted !== undefined || req.query.mobile === 'true';
    res.status(400).json(isMobile ? { success: false, message: err.message || "Failed to update routine" } : { message: err.message || "Failed to update routine" });
  }
};

/* =====================================================
   PARENT: DELETE ROUTINE
===================================================== */
const deleteRoutine = async (req, res) => {
  try {
    const isMobile = req.query.mobile === 'true' || req.headers['user-agent']?.includes('Dart') || req.headers['user-agent']?.includes('Expo') || req.headers['x-mobile'] === 'true' || req.headers.accept?.includes('application/json');
    // We assume JSON response means we can safely return success: true without breaking much, 
    // but we'll stick to a strict check or just add success: true which is safe.

    const userRole = (req.user.role || "").toLowerCase();
    if (userRole === "teacher") {
      return res.status(403).json({ success: false, message: "Teachers are not allowed to delete routines." });
    }

    const routine = await Routine.findById(req.params.id);
    if (!routine) return res.status(404).json({ success: false, message: "Routine not found" });
    
    const isAssignedStudent = routine.studentId && routine.studentId.equals(req.user._id);
    if (!routine.parentId.equals(req.user._id) && !isAssignedStudent) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Routine.findByIdAndDelete(req.params.id);
    
    // Returning success: true is generally backward compatible
    res.status(200).json({ success: true, message: "Routine deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete routine" });
  }
};

/* =====================================================
   MOBILE: GET STUDENT ROUTINES (Parent & Teacher)
===================================================== */
const getStudentRoutines = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userRole = (req.user.role || "").toLowerCase();

    // Ensure only Parent or Teacher can access
    if (userRole !== "parent" && userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Parent or Teacher only" });
    }

    const routines = await Routine.find({ studentId })
      .sort({ createdAt: -1 })
      .populate("studentId", "name email diagnosis")
      .lean();

    res.status(200).json({ success: true, data: routines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to load student routines" });
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
  addRoutine,
  updateRoutine,
  deleteRoutine,
  getAssignedRoutines,
  getStudentRoutines,
  updateProgress,
  getProgressSummary,
  assignTemplateRoutine,
  aiGenerateRoutine
};