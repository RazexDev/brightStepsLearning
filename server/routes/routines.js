const express = require("express");
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine
} = require("../controllers/routineController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // All routine endpoints require a valid JWT

router.get("/", getRoutines);
router.post("/", createRoutine);
router.put("/:id", updateRoutine);
router.delete("/:id", deleteRoutine);

module.exports = router;