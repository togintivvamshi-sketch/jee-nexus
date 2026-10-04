const express = require('express');
const router = express.Router();
const { isGroqConfigured } = require('../services/groq.service');
const { readImageQuestion } = require('../services/imageReader.service');

router.post('/read', async (req, res) => {
  try {
    const { imageData, mimeType, message, sessionId = 'default' } = req.body;

    if (!isGroqConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please set GROQ_API_KEY in .env file.',
        setupRequired: true
      });
    }

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image format. Use JPG, PNG, or WEBP.' });
    }

    // Read the question from the image
    const extractedQuestion = await readImageQuestion(imageData, mimeType);

    // Format response for the chat
    const response = `I've read the question from the image:

${extractedQuestion}

I haven't solved it yet.`;

    res.json({ 
      response, 
      sessionId,
      extractedQuestion,
      hasImage: true
    });
  } catch (error) {
    console.error('Image read error:', error);
    res.status(500).json({ error: error.message || 'Failed to read image' });
  }
});

module.exports = router;