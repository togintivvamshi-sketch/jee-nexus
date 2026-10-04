class PracticeEngine {
  constructor() {
    this.sessionId = 'practice_' + Date.now();
    this.currentQuestion = null;
    this.init();
  }

  init() {
    this.bindNavigation();
  }

  bindNavigation() {
    document.querySelectorAll('[data-mode="practice"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.activate();
      });
    });
  }

  activate() {
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('practicePanel').classList.add('active');
    document.querySelector('[data-mode="practice"]').classList.add('active');
    
    ui.showToast('Practice Engine coming in Phase 4', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.practiceEngine = new PracticeEngine();
});