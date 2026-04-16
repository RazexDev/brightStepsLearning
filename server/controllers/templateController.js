/**
 * controllers/templateController.js
 * UPDATED: "both" disabilityType now returns templates for adhd + autism + general.
 * Non-both queries also include "general" templates as a baseline.
 */
const Template = require("../models/Template");

const getTemplates = async (req, res) => {
  try {
    const query = {};

    if (req.query.disabilityType) {
      const type = String(req.query.disabilityType).toLowerCase();

      if (type === "both") {
        // Child with both conditions — show all templates
        query.disabilityType = { $in: ["adhd", "autism", "general", "both"] };
      } else if (type === "none" || type === "general") {
        // General child — show general templates only
        query.disabilityType = "general";
      } else {
        // ADHD or Autism child — show their specific type + general
        query.disabilityType = { $in: [type, "general"] };
      }
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    const templates = await Template.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load templates" });
  }
};

module.exports = { getTemplates };
