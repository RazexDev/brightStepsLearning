const express = require("express");
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getAssignedRoutines,
  getStudentRoutines,
  updateProgress,
  getProgressSummary,
  assignTemplateRoutine,
  aiGenerateRoutine
} = require("../controllers/routineController");

const { protect, parentOnly, studentOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use((req, res, next) => {
  console.log(`[RoutinesRouter] ${req.method} ${req.url}`);
  next();
});

/* parent & mobile routes */
router.get("/", protect, parentOnly, getRoutines);
router.post("/", (req, res, next) => { console.log('Hit POST /'); next(); }, protect, (req, res, next) => { console.log('Passed protect on POST /'); next(); }, createRoutine);
router.put("/:id", protect, updateRoutine);
router.delete("/:id", protect, deleteRoutine);
router.get("/progress/summary", protect, parentOnly, getProgressSummary);
router.post("/assign-template", protect, parentOnly, assignTemplateRoutine);
router.post("/ai-generate", protect, parentOnly, aiGenerateRoutine);

/* student & mobile routes */
router.get("/student/:studentId", protect, getStudentRoutines); // parent & teacher
router.get("/student", protect, studentOnly, getAssignedRoutines);
router.patch("/progress", protect, studentOnly, updateProgress);

module.exports = router;