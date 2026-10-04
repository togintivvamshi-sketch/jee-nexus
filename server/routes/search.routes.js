const express = require('express');
const router = express.Router();
const { searchWeb, searchEducationalResources } = require('../services/search.service');

router.post('/', async (req, res) => {
  try {
    const { query, subject } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query cannot be empty' });
    }

    let result;
    if (subject) {
      result = await searchEducationalResources(query.trim(), subject);
    } else {
      result = await searchWeb(query.trim());
    }

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

router.get('/status', (req, res) => {
  res.json({
    configured: false,
    message: 'Web search not yet configured. Will be implemented in Phase 9.',
    todo: [
      'Add search API integration (SerpAPI, Brave Search, etc.)',
      'Implement source credibility filtering',
      'Add JEE-specific result ranking',
      'Add duplicate detection',
      'Add subject/chapter classification'
    ]
  });
});

module.exports = router;