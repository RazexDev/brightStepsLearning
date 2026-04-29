const mongoose = require('mongoose');

const ResourceLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resourceName: { type: String, required: true },
  resourceType: { type: String, required: true },
  viewCount: { type: Number, default: 1 },
  lastViewed: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResourceLog', ResourceLogSchema);
