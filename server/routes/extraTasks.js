// routes/extraTasks.js
const express = require("express");
const {
  getExtraTasks,
  addExtraTask,
} = require("../controllers/extraTaskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // All extra-task endpoints require a valid JWT

router.get("/", getExtraTasks);
router.post("/:routineId", addExtraTask);

module.exports = router;