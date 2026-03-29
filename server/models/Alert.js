const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  // Using String here as well to match the Chat model
  childId: { 
    type: String, 
    required: true 
  },
  triggerMessage: { 
    type: String, 
    required: true 
  },
  aiReasoning: { 
    type: String 
  },
  isResolved: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Alert', AlertSchema);