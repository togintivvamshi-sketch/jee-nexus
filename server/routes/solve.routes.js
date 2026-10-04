const express = require('express');
const router = express.Router();
const { chatCompletion, isGroqConfigured } = require('../services/groq.service');
const { buildSolverMessages } = require('../services/solver.service');

// In-memory conversation storage for solver
const solveConversations = new Map();

function getSolveConversation(sessionId) {
  if (!solveConversations.has(sessionId)) {
    solveConversations.set(sessionId, []);
  }
  return solveConversations.get(sessionId);
}

function clearSolveConversation(sessionId) {
  solveConversations.delete(sessionId);
}

router.post('/', async (req, res) => {
  try {
    const { question, sessionId = 'default' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }

    if (!isGroqConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please set GROQ_API_KEY in .env file.',
        setupRequired: true
      });
    }

    const conversation = getSolveConversation(sessionId);
    const messages = buildSolverMessages(conversation, question.trim());
    
    const response = await chatCompletion(messages);

    // Update conversation history
    conversation.push({ role: 'user', content: question.trim() });
    conversation.push({ role: 'assistant', content: response });

    // Keep conversation manageable (last 12 messages)
    if (conversation.length > 12) {
      conversation.splice(0, conversation.length - 12);
    }

    res.json({ response, sessionId });
  } catch (error) {
    console.error('Solve error:', error);
    res.status(500).json({ error: error.message || 'Failed to solve question' });
  }
});

router.post('/clear', (req, res) => {
  const { sessionId = 'default' } = req.body;
  clearSolveConversation(sessionId);
  res.json({ success: true });
});

module.exports = router;