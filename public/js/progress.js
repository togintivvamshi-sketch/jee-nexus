class ProgressDashboard {
  constructor() {
    this.init();
  }

  init() {
    this.bindNavigation();
  }

  bindNavigation() {
    document.querySelectorAll('[data-mode="progress"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.activate();
      });
    });

    document.querySelectorAll('[data-mode="mistakes"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.activateMistakes();
      });
    });

    document.querySelectorAll('[data-mode="plan"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.activatePlan();
      });
    });
  }

  activate() {
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('progressPanel').classList.add('active');
    document.querySelector('[data-mode="progress"]').classList.add('active');
    
    ui.showToast('Progress Dashboard coming in Phase 6', 'info');
  }

  activateMistakes() {
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('mistakesPanel').classList.add('active');
    document.querySelector('[data-mode="mistakes"]').classList.add('active');
    
    ui.showToast('Mistake Tracker coming in Phase 5', 'info');
  }

  activatePlan() {
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('planPanel').classList.add('active');
    document.querySelector('[data-mode="plan"]').classList.add('active');
    
    ui.showToast('60-Day Plan coming in Phase 7', 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.progressDashboard = new ProgressDashboard();
});