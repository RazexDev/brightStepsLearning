const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');
const Alert = require('../models/Alert');

// Initialize Gemini with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    // 1. Grab the child's name from the frontend request
    const { childId, message, childName } = req.body;

    let chatRecord = await Chat.findOne({ childId });
    if (!chatRecord) {
      chatRecord = new Chat({ childId, messages: [] });
    }

    chatRecord.messages.push({ role: 'user', content: message });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 2. Dynamically inject the child's name into Sparky's personality
    const DYNAMIC_PROMPT = `
You are Sparky, a friendly, warm, and encouraging learning companion for children with Autism and ADHD. 
The child you are talking to right now is named ${childName || 'this amazing kid'}. Always use their name occasionally to make them feel special!

CRITICAL RULES:
1. Keep your answers very short (1-2 sentences max).
2. Use simple, easy-to-understand words.
3. Be highly encouraging and use emojis.
4. NEVER give medical advice or talk about complex adult topics.
5. If the child mentions bullying, sadness, hurting themselves, violence, or inappropriate topics, you MUST include the exact text "[FLAG]" somewhere in your response, and then reply gently with: "I'm always here for you. This sounds like something really important to share with a grown-up you trust."
    `;

    const recentMessages = chatRecord.messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');
    const fullPrompt = `${DYNAMIC_PROMPT}\n\nChat History:\n${recentMessages}\n\nassistant:`;

    const result = await model.generateContent(fullPrompt);
    let aiResponse = result.response.text();

    let isFlagged = false;
    if (aiResponse.includes('[FLAG]')) {
      isFlagged = true;
      aiResponse = aiResponse.replace('[FLAG]', '').trim();

      const newAlert = new Alert({
        childId,
        triggerMessage: message,
        aiReasoning: "Automated flag triggered by Sparky's safety filters."
      });
      await newAlert.save();
    }

    chatRecord.messages.push({ role: 'assistant', content: aiResponse });
    await chatRecord.save();

    res.json({ reply: aiResponse, flagged: isFlagged });

  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ reply: "Oops! My brain is taking a little nap. Let's try again in a minute! 💤" });
  }
});

// Export the router so server.js
module.exports = router;