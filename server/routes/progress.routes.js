const express = require('express');
const router = express.Router();

// Progress data is stored in localStorage on frontend
// This route provides server-side aggregation if needed in future

router.get('/', (req, res) => {
  // Placeholder for server-side progress (future use)
  res.json({ 
    message: 'Progress is stored locally in browser. Use localStorage API.',
    endpoints: {
      save: 'POST /api/progress/save',
      load: 'GET /api/progress/load'
    }
  });
});

router.post('/save', (req, res) => {
  // Future: Save to database
  // For now, acknowledge receipt
  res.json({ success: true, message: 'Progress saved (localStorage on frontend)' });
});

router.get('/stats', (req, res) => {
  // Future: Compute stats from database
  res.json({ 
    message: 'Statistics computed from localStorage on frontend',
    availableStats: [
      'questionsAttempted',
      'questionsCorrect',
      'questionsIncorrect',
      'overallAccuracy',
      'subjectAccuracy',
      'chapterAccuracy',
      'weakTopics',
      'strongTopics',
      'recentMistakes'
    ]
  });
});

module.exports = router;