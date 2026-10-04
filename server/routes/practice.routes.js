const express = require('express');
const router = express.Router();
const { chatCompletion, isGroqConfigured } = require('../services/groq.service');
const { buildPracticeMessages, parsePracticeRequest } = require('../services/practice.service');

// In-memory practice session storage
const practiceSessions = new Map();

function getPracticeSession(sessionId) {
  if (!practiceSessions.has(sessionId)) {
    practiceSessions.set(sessionId, {
      questions: [],
      currentIndex: 0,
      answers: [],
      score: { correct: 0, incorrect: 0, total: 0 }
    });
  }
  return practiceSessions.get(sessionId);
}

function clearPracticeSession(sessionId) {
  practiceSessions.delete(sessionId);
}

router.post('/generate', async (req, res) => {
  try {
    const { subject, difficulty, count, topic, chapter, sessionId = 'default' } = req.body;

    if (!isGroqConfigured()) {
      return res.status(503).json({ 
        error: 'AI service not configured. Please set GROQ_API_KEY in .env file.',
        setupRequired: true
      });
    }

    const request = parsePracticeRequest({ subject, difficulty, count, topic, chapter });
    const messages = buildPracticeMessages(request);
    
    const response = await chatCompletion(messages);

    // Try to parse JSON response
    let questionData;
    try {
      // Extract JSON from response (AI might include markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Practice response parse error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse practice question. Please try again.',
        rawResponse: response 
      });
    }

    // Add metadata
    questionData.id = Date.now();
    questionData.source = 'AI-Generated Practice Question';

    const session = getPracticeSession(sessionId);
    session.questions.push(questionData);

    res.json({ question: questionData, sessionId });
  } catch (error) {
    console.error('Practice generate error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate practice question' });
  }
});

router.post('/answer', (req, res) => {
  try {
    const { sessionId = 'default', questionId, userAnswer } = req.body;
    const session = getPracticeSession(sessionId);
    
    const question = session.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = checkAnswer(question, userAnswer);
    
    session.answers.push({
      questionId,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timestamp: new Date().toISOString()
    });

    if (isCorrect) {
      session.score.correct++;
    } else {
      session.score.incorrect++;
    }
    session.score.total++;

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      score: session.score
    });
  } catch (error) {
    console.error('Practice answer error:', error);
    res.status(500).json({ error: error.message || 'Failed to process answer' });
  }
});

function checkAnswer(question, userAnswer) {
  const correct = question.correctAnswer;
  const user = String(userAnswer).trim().toUpperCase();
  const correctStr = String(correct).trim().toUpperCase();

  if (Array.isArray(correct)) {
    // MSQ - multiple correct answers
    const userAnswers = user.split(',').map(a => a.trim()).sort();
    const correctAnswers = correct.map(c => String(c).trim().toUpperCase()).sort();
    return JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
  }

  return user === correctStr;
}

router.get('/session/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || 'default';
  const session = getPracticeSession(sessionId);
  res.json({ 
    questions: session.questions,
    answers: session.answers,
    score: session.score,
    currentIndex: session.currentIndex
  });
});

router.post('/clear', (req, res) => {
  const { sessionId = 'default' } = req.body;
  clearPracticeSession(sessionId);
  res.json({ success: true });
});

module.exports = router;