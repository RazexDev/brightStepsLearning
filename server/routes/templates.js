const express = require("express");
const Template = require("../models/Template");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/templates
router.get("/", protect, async (req, res) => {
  try {
    const query = {};

    if (req.query.disabilityType) {
      query.disabilityType = req.query.disabilityType;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    const templates = await Template.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load templates" });
  }
});

module.exports = router;