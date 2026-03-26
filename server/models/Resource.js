const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['video', 'pdf', 'link'], required: true },
    fileUrl: { type: String, required: true },
    instructionalText: { type: String, required: true },
    
    // NEW: Tags the resource for the recommendation algorithm
    targetSkill: { 
        type: String, 
        enum: ['focus', 'calming', 'communication', 'general'],
        default: 'general'
    },
    
    // NEW: Tracks which children the parent has assigned this to
    assignedTo: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Child' 
    }],
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);