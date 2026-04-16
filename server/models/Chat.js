const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  // Using String instead of ObjectId so it doesn't crash if a "guest_player" logs in
  childId: { 
    type: String, 
    required: true 
  },
  messages: [
    {
      role: { 
        type: String, 
        enum: ['user', 'assistant', 'system'], 
        required: true 
      },
      content: { 
        type: String, 
        required: true 
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      }
    }
  ]
});

module.exports = mongoose.model('Chat', ChatSchema);