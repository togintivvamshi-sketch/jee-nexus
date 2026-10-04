const express = require('express');
const router = express.Router();
const { chatCompletion, isGroqConfigured } = require('../services/groq.service');
const { buildTutorMessages } = require('../services/tutor.service');

// In-memory conversation storage (per session)
// In production, this would use proper session management
const conversations = new Map();

function getConversation(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId);
}

function clearConversation(sessionId) {
  conversations.delete(sessionId);
}

router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default', imageData, mimeType } = req.body;

    // If image data is provided, use the image reader endpoint
    if (imageData) {
      if (!isGroqConfigured()) {
        return res.status(503).json({ 
          error: 'AI service not configured. Please set GROQ_API_KEY in .env file.',
          setupRequired: true
        });
      }

      if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        return res.status(400).json({ error: 'Unsupported image format. Use JPG, PNG, or WEBP.' });
      }

      const { readImageQuestion } = require('../services/imageReader.service');
      
      // Extract base64 from data URL
      const base64Image = imageData.split(',')[1] || imageData;
      
      // Read the question from the image
      const extractedQuestion = await require('../services/imageReader.service').readImageQuestion(base64Image, mimeType);

      // Format response
      const response = `I've read the question from the image:

${extractedQuestion}

I haven't solved it yet.`;

      // Update conversation history
      const conversation = getConversation(sessionId);
      conversation.push({ role: 'user', content: message ? message.trim() + ' [Image attached]' : '[Image attached]' });
      conversation.push({ role: 'assistant', content: response });

      if (conversation.length > 20) {
        conversation.splice(0, conversation.length - 20);
      }

      return res.json({ response, sessionId });
    }

    // Regular text message
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (!isGroqConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please set GROQ_API_KEY in .env file.',
        setupRequired: true
      });
    }

    const conversation = getConversation(sessionId);
    const messages = buildTutorMessages(conversation, message.trim());
    
    const response = await chatCompletion(messages);

    // Update conversation history
    conversation.push({ role: 'user', content: message.trim() });
    conversation.push({ role: 'assistant', content: response });

    // Keep conversation manageable (last 20 messages)
    if (conversation.length > 20) {
      conversation.splice(0, conversation.length - 20);
    }

    res.json({ response, sessionId });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to get AI response' });
  }
});

router.post('/clear', (req, res) => {
  const { sessionId = 'default' } = req.body;
  clearConversation(sessionId);
  res.json({ success: true });
});

router.get('/history/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || 'default';
  const conversation = getConversation(sessionId);
  res.json({ history: conversation });
});

module.exports = router;