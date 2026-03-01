// routes/extraTasks.js
const express = require("express");
const {
  getExtraTasks,
  addExtraTask,
} = require("../controllers/extraTaskController");

const router = express.Router();

router.get("/", getExtraTasks);
router.post("/:routineId", addExtraTask);

module.exports = router;