const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'pdf', 'link', 'offline'], required: true },
    fileUrl: { type: String }, // Optional for offline
    instructionalText: { type: String, required: true },
    offlineInstructions: { type: String }, // Used only for offline activities
    requiredLevel: { type: Number, min: 0, max: 25, default: 0 },
    
    // Tags the resource for the recommendation algorithm
    targetSkill: { 
        type: String, 
        enum: ['focus', 'calming', 'communication', 'general'],
        default: 'general'
    },
    
    // Tracks which children the parent/teacher has assigned this to
    assignedTo: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Child' 
    }],
    
    // Explicit tracking for Parent Dashboard uploads
    studentName: { type: String },

    reactions: {
        like: { type: Number, default: 0 },
        love: { type: Number, default: 0 },
        haha: { type: Number, default: 0 },
        wow: { type: Number, default: 0 }
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);