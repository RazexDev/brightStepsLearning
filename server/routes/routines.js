const express = require("express");
const {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine
} = require("../controllers/routineController");

const router = express.Router();

router.get("/", getRoutines);
router.post("/", createRoutine);
router.put("/:id", updateRoutine);
router.delete("/:id", deleteRoutine);

module.exports = router;