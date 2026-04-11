const express = require("express");
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getAssignedRoutines,
  updateProgress,
  getProgressSummary,
  assignTemplateRoutine,
  aiGenerateRoutine
} = require("../controllers/routineController");

const { protect, parentOnly, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

/* parent routes */
router.get("/", protect, parentOnly, getRoutines);
router.post("/", protect, parentOnly, createRoutine);
router.put("/:id", protect, parentOnly, updateRoutine);
router.delete("/:id", protect, parentOnly, deleteRoutine);
router.get("/progress/summary", protect, parentOnly, getProgressSummary);
router.post("/assign-template", protect, parentOnly, assignTemplateRoutine);
router.post("/ai-generate", protect, parentOnly, aiGenerateRoutine);

/* student routes */
router.get("/student", protect, studentOnly, getAssignedRoutines);
router.patch("/progress", protect, studentOnly, updateProgress);

module.exports = router;