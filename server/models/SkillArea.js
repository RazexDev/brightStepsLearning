const mongoose = require('mongoose');

const SkillAreaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    activities: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SkillArea', SkillAreaSchema);
