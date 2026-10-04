const express = require('express');
const path = require('path');
const { port } = require('./config/env');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/solve', require('./routes/solve.routes'));
app.use('/api/practice', require('./routes/practice.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/search', require('./routes/search.routes'));
app.use('/api/image', require('./routes/imageReader.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JEE Nexus', timestamp: new Date().toISOString() });
});

// API status
app.get('/api/status', (req, res) => {
  const { isGroqConfigured } = require('./services/groq.service');
  res.json({
    groqConfigured: isGroqConfigured(),
    version: '1.0.0',
    phase: 'Phase 1 - Foundation'
  });
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██═════════════════════════════════════════════════════   ║
║   ██  JEE NEXUS - AI JEE Main Study Companion               ║
║   ██═════════════════════════════════════════════════════   ║
║                                                              ║
║   Server running on http://localhost:${port}                   ║
║                                                              ║
║   Phase 1: Working Foundation                               ║
║   • AI Tutor: /api/chat                                     ║
║   • Question Solver: /api/solve                              ║
║   • Practice Engine: /api/practice                           ║
║   • Progress: /api/progress                                  ║
║   • Search: /api/search                                      ║
║   • Image Reader: /api/image                                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;