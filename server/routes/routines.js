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
  aiGenerateRoutine,
} = require("../controllers/routineController");

const {
  protect,
  parentOnly,
  studentOnly,
} = require("../middleware/authMiddleware");

const uploadRoutine = require("../middleware/routineUpload");

const router = express.Router();

/* Debug logger */
router.use((req, res, next) => {
  console.log(`[RoutinesRouter] ${req.method} ${req.url}`);
  next();
});

/* ================================
   Parent & Mobile Routes
================================ */

// Parent gets own routines
router.get("/", protect, parentOnly, getRoutines);

// Parent creates routine with optional file upload
router.post(
  "/",
  (req, res, next) => {
    console.log("Hit POST /api/routines");
    next();
  },
  protect,
  (req, res, next) => {
    console.log("Passed protect on POST /api/routines");
    next();
  },
  uploadRoutine.single("file"),
  createRoutine
);

// Parent updates routine
router.put("/:id", protect, uploadRoutine.single("file"), updateRoutine);

// Parent deletes routine
router.delete("/:id", protect, deleteRoutine);

// Parent progress summary
router.get("/progress/summary", protect, parentOnly, getProgressSummary);

// Parent assigns template
router.post("/assign-template", protect, parentOnly, assignTemplateRoutine);

// Parent AI routine generation
router.post("/ai-generate", protect, parentOnly, aiGenerateRoutine);

/* ================================
   Student / Teacher / Mobile Routes
================================ */

// Parent/Teacher gets routines for selected student
router.get("/student/:studentId", protect, getStudentRoutines);

// Student gets own assigned routines
router.get("/student", protect, studentOnly, getAssignedRoutines);

// Student updates own progress only
router.patch("/progress", protect, studentOnly, updateProgress);

module.exports = router;