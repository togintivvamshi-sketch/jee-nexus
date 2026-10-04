class JeeNexusApp {
  constructor() {
    this.currentMode = 'tutor';
    this.init();
  }

  init() {
    this.bindSidebarNavigation();
    this.bindMobileToggle();
    this.bindSolveQuestion();
    this.checkApiStatusPeriodic();
  }

  bindSidebarNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-mode]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = item.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  bindMobileToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }

  switchMode(mode) {
    if (mode === this.currentMode) return;
    
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const panel = document.getElementById(`${mode}Panel`);
    const navItem = document.querySelector(`[data-mode="${mode}"]`);
    
    if (panel) panel.classList.add('active');
    if (navItem) navItem.classList.add('active');
    
    this.currentMode = mode;
    
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && sidebar) {
      sidebar.classList.remove('open');
    }
  }

  bindSolveQuestion() {
    const solveBtn = document.getElementById('solveBtn');
    const solveInput = document.getElementById('solveInput');
    const solveVoiceBtn = document.getElementById('solveVoiceBtn');
    const solveVoiceStatus = document.getElementById('solveVoiceStatus');
    const solutionContent = document.getElementById('solutionContent');
    const outputPlaceholder = document.querySelector('.output-placeholder');
    
    if (!solveBtn || !solveInput) return;

    // Initialize voice input for solve
    if (solveVoiceBtn && window.VoiceInput) {
      solveVoiceBtn.addEventListener('click', () => {
        if (window.VoiceInput.getIsListening()) {
          window.VoiceInput.stopListening();
        } else {
          window.VoiceInput.startListening(solveInput, solveVoiceBtn, solveVoiceStatus);
        }
      });
      
      if (!window.VoiceInput.isSupported()) {
        solveVoiceBtn.style.display = 'none';
        if (solveVoiceStatus) {
          solveVoiceStatus.textContent = 'Voice input not supported in this browser. Try Chrome or Edge.';
          solveVoiceStatus.className = 'voice-status warning';
        }
      }
    }

    solveBtn.addEventListener('click', async () => {
      const question = solveInput.value.trim();
      if (!question) {
        ui.showToast('Please enter a question', 'warning');
        solveInput.focus();
        return;
      }

      solveBtn.disabled = true;
      solveBtn.innerHTML = `
        <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1" stroke-linecap="round"></path>
        </svg>
        <span>Solving...</span>
      `;

      outputPlaceholder.style.display = 'none';
      solutionContent.style.display = 'block';
      solutionContent.innerHTML = '<div class="solution-step"><div class="step-content">Solving...</div></div>';

      try {
        const response = await api.solve(question, 'solve_' + Date.now());
        this.renderSolution(response.response, solutionContent);
      } catch (error) {
        solutionContent.innerHTML = `
          <div class="solution-step" style="border-color: var(--color-danger);">
            <div class="step-header">
              <div class="step-number" style="background: var(--color-danger);">!</div>
              <div class="step-title">Error</div>
            </div>
            <div class="step-content">${ui.escapeHtml(error.message)}</div>
          </div>
        `;
        ui.showToast(error.message, 'error');
      } finally {
        solveBtn.disabled = false;
        solveBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>Solve Step by Step</span>
        `;
      }
    });

    solveInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        solveBtn.click();
      }
    });
  }

  renderSolution(response, container) {
    console.log('[DEBUG] renderSolution called, raw response:', response);
    const steps = this.parseSolution(response);
    
    if (steps.length === 0) {
      container.innerHTML = `
        <div class="solution-step">
          <div class="step-content">${ui.formatMessage(response)}</div>
        </div>
      `;
      this.renderMath(container);
      return;
    }

    container.innerHTML = steps.map((step, index) => {
      const isFinal = step.title.toLowerCase().includes('final') || 
                     step.title.toLowerCase().includes('answer') ||
                     index === steps.length - 1;
      
      return `
        <div class="solution-step ${isFinal ? 'final-answer' : ''}">
          <div class="step-header">
            <div class="step-number">${index + 1}</div>
            <div class="step-title">${ui.escapeHtml(step.title)}</div>
          </div>
          <div class="step-content">${ui.formatMessage(step.content)}</div>
        </div>
      `;
    }).join('');

    this.renderMath(container);
  }

  renderMath(element) {
    // First, normalize any remaining escaped delimiters in the element
    this.normalizeMathInElement(element);
    
    // Wait for KaTeX to be ready, then render
    const tryRender = () => {
      console.log('[DEBUG] app.js tryRender called, katex:', typeof window.katex, 'autoRender:', typeof window.renderMathInElement);
      if (window.renderMathInElement) {
        try {
          console.log('[DEBUG] app.js Using renderMathInElement');
          renderMathInElement(element, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '\\[', right: '\\]', display: true},
              {left: '\\(', right: '\\)', display: false},
              {left: '$', right: '$', display: false}
            ],
            throwOnError: false,
            strict: false,
            trust: true
          });
          console.log('[DEBUG] app.js renderMathInElement completed');
        } catch (e) {
          console.warn('KaTeX render error:', e);
        }
      } else if (window.katex) {
        // Fallback: manually render math if auto-render not available
        console.log('[DEBUG] app.js Using renderMathManual fallback');
        this.renderMathManual(element);
      } else {
        // KaTeX not loaded yet, retry in a bit
        console.log('[DEBUG] app.js KaTeX not ready, retrying...');
        setTimeout(tryRender, 50);
      }
    };
    tryRender();
  }

  normalizeMathInElement(element) {
    // Walk text nodes and fix any remaining escaped LaTeX
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      // Fix double-escaped delimiters that might remain
      const fixed = text
        .replace(/\\\\\[/g, '\\[')
        .replace(/\\\\\]/g, '\\]')
        .replace(/\\\\\(/g, '\\(')
        .replace(/\\\\\)/g, '\\)')
        .replace(/\\\\_/g, '_');
      if (fixed !== text) {
        textNode.textContent = fixed;
      }
    });
  }

  renderMathManual(element) {
    // Find and render display math: $$...$$ and \[...\]
    const displayPatterns = [
      { regex: /\$\$([\s\S]+?)\$\$/g, display: true },
      { regex: /\\\[([\s\S]+?)\\\]/g, display: true }
    ];

    // Find and render inline math: \(...\) and $...$
    const inlinePatterns = [
      { regex: /\\\(([\s\S]+?)\\\)/g, display: false },
      { regex: /\$([^$\n]{1,200})\$/g, display: false }
    ];

    // We need to process text nodes to avoid breaking HTML
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      let text = textNode.textContent;
      let hasMath = false;

      // Check for display math
      for (const pattern of displayPatterns) {
        if (pattern.regex.test(text)) {
          hasMath = true;
          break;
        }
      }
      // Check for inline math
      for (const pattern of inlinePatterns) {
        if (pattern.regex.test(text)) {
          hasMath = true;
          break;
        }
      }

      if (!hasMath) return;

      // Replace math with rendered elements
      let newHTML = text;
      
      // Replace display math first
      displayPatterns.forEach(pattern => {
        newHTML = newHTML.replace(pattern.regex, (match, math) => {
          try {
            return window.katex.renderToString(math, { displayMode: pattern.display, throwOnError: false });
          } catch (e) {
            return match; // Keep original if render fails
          }
        });
      });

      // Replace inline math
      inlinePatterns.forEach(pattern => {
        newHTML = newHTML.replace(pattern.regex, (match, math) => {
          try {
            return window.katex.renderToString(math, { displayMode: pattern.display, throwOnError: false });
          } catch (e) {
            return match; // Keep original if render fails
          }
        });
      });

      if (newHTML !== text) {
        const span = document.createElement('span');
        span.innerHTML = newHTML;
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }

  parseSolution(text) {
    const steps = [];
    
    const stepPatterns = [
      /STEP\s+\d+[:：]\s*(.+?)(?=\n\s*STEP\s+\d+[:：]|\n\s*Step\s+\d+[:：]|$)/gis,
      /Step\s+\d+[:：]\s*(.+?)(?=\n\s*Step\s+\d+[:：]|\n\s*STEP\s+\d+[:：]|$)/gis,
      /\*\*STEP\s+\d+[:：]\*\*\s*(.+?)(?=\n\s*\*\*STEP\s+\d+[:：]\*\*|$)/gis,
      /\d+\.\s+\*\*(.+?)\*\*\s*(.+?)(?=\n\s*\d+\.\s+\*\*|$)/gis
    ];

    for (const pattern of stepPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        matches.forEach((match, index) => {
          const fullMatch = match[0];
          const titleMatch = fullMatch.match(/(?:STEP|Step)\s+\d+[:：]\s*(.+?)(?:\n|$)/i) ||
                            fullMatch.match(/\d+\.\s+\*\*(.+?)\*\*/);
          const title = titleMatch ? titleMatch[1].trim() : `Step ${index + 1}`;
          const content = fullMatch.replace(/^(?:STEP|Step)\s+\d+[:：]\s*.+?\n/i, '')
                                   .replace(/^\d+\.\s+\*\*.+?\*\*\s*/, '')
                                   .trim();
          if (content) {
            steps.push({ title, content });
          }
        });
        break;
      }
    }

    if (steps.length === 0) {
      const sections = text.split(/\n\s*\n/);
      sections.forEach((section, index) => {
        const lines = section.trim().split('\n');
        const firstLine = lines[0].trim();
        const rest = lines.slice(1).join('\n').trim();
        
        if (firstLine.match(/^(STEP|Step|\d+\.|\*\*.+\*\*)/i)) {
          const title = firstLine.replace(/^(STEP|Step)\s+\d+[:：]\s*/i, '')
                                .replace(/^\d+\.\s*/, '')
                                .replace(/\*\*(.+?)\*\*/, '$1')
                                .trim();
          steps.push({ title: title || `Step ${index + 1}`, content: rest || firstLine });
        } else if (rest) {
          steps.push({ title: firstLine, content: rest });
        } else if (section.trim()) {
          steps.push({ title: `Step ${index + 1}`, content: section.trim() });
        }
      });
    }

    return steps.filter(s => s.content && s.content.trim().length > 0);
  }

  async checkApiStatusPeriodic() {
    const checkStatus = async () => {
      try {
        const status = await api.getStatus();
        this.updateApiStatus(status.groqConfigured);
      } catch (error) {
        this.updateApiStatus(false);
      }
    };

    await checkStatus();
    setInterval(checkStatus, 30000);
  }

  updateApiStatus(configured) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    
    if (dot && text) {
      dot.className = 'status-dot ' + (configured ? 'connected' : 'error');
      text.textContent = configured ? 'AI Ready' : 'API Key Required';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new JeeNexusApp();
});