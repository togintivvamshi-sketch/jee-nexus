class TutorChat {
  constructor() {
    this.sessionId = 'tutor_' + Date.now();
    this.isLoading = false;
    this.messagesContainer = document.getElementById('tutorMessages');
    this.input = document.getElementById('tutorInput');
    this.sendBtn = document.getElementById('tutorSendBtn');
    this.clearBtn = document.getElementById('clearChatBtn');
    this.voiceBtn = document.getElementById('tutorVoiceBtn');
    this.voiceStatus = document.getElementById('tutorVoiceStatus');
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initVoiceInput();
    this.loadHistory();
    this.checkApiStatus();
    this.input.focus();
  }

  initVoiceInput() {
    if (!this.voiceBtn || !window.VoiceInput) return;
    
    this.voiceBtn.addEventListener('click', () => {
      if (window.VoiceInput.getIsListening()) {
        window.VoiceInput.stopListening();
      } else {
        window.VoiceInput.startListening(this.input, this.voiceBtn, this.voiceStatus);
      }
    });
    
    if (!window.VoiceInput.isSupported()) {
      this.voiceBtn.style.display = 'none';
      if (this.voiceStatus) {
        this.voiceStatus.textContent = 'Voice input not supported in this browser. Try Chrome or Edge.';
        this.voiceStatus.className = 'voice-status warning';
      }
    }
  }

  bindEvents() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.input.addEventListener('input', () => {
      ui.autoResizeTextarea(this.input);
    });

    this.clearBtn.addEventListener('click', () => this.clearChat());

    document.querySelectorAll('[data-mode="tutor"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.activate();
      });
    });
  }

  activate() {
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById('tutorPanel').classList.add('active');
    document.querySelector('[data-mode="tutor"]').classList.add('active');
    
    this.input.focus();
  }

  async checkApiStatus() {
    try {
      const status = await api.getStatus();
      this.updateApiStatus(status.groqConfigured);
    } catch (error) {
      this.updateApiStatus(false);
    }
  }

  updateApiStatus(configured) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    
    if (dot && text) {
      dot.className = 'status-dot ' + (configured ? 'connected' : 'error');
      text.textContent = configured ? 'AI Ready' : 'API Key Required';
    }
  }

  async loadHistory() {
    try {
      const data = await api.getChatHistory(this.sessionId);
      if (data.history && data.history.length > 0) {
        data.history.forEach((msg, index) => {
          if (index % 2 === 0) {
            this.addMessage(msg.content, 'user', false);
          } else {
            this.addMessage(msg.content, 'assistant', false);
          }
        });
        this.scrollToBottom();
      } else {
        this.showWelcome();
      }
    } catch (error) {
      this.showWelcome();
    }
  }

  showWelcome() {
    if (this.messagesContainer.children.length === 0) {
      this.addMessage(
        `Welcome to **JEE Nexus**! 👋\n\nI'm your AI JEE Main study companion. I can help you with:\n\n• **Concept explanations** - From basics to JEE Main level\n• **Step-by-step problem solving** - Physics, Chemistry, Mathematics\n• **Follow-up questions** - "Why?", "How did you get step 3?", "I don't understand"\n• **Different explanation depths** - "Explain simply", "From basics", "JEE Main level", "Show derivation"\n\n**Try asking:**\n- "Explain Newton's second law"\n- "How to solve quadratic equations?"\n- "What is electronegativity?"\n- "Solve: A particle moves with v = 4t³ - 6t² + 2, find acceleration at t=2"`,
        'assistant'
      );
    }
  }

  async sendMessage() {
    const message = this.input.value.trim();
    const imageData = window.ImageUpload ? window.ImageUpload.getCurrentImageData() : null;
    
    if (!message && !imageData) return;
    if (this.isLoading) return;

    // Add user message (with image indicator if present)
    let displayMessage = message;
    if (imageData) {
      displayMessage = message ? `${message} [📎 Image attached]` : '[📎 Image attached]';
    }
    
    this.addMessage(displayMessage, 'user');
    this.input.value = '';
    this.input.style.height = 'auto';
    
    // Clear image after adding to message
    if (imageData) {
      window.ImageUpload.clearImage('tutor');
    }
    
    this.setLoading(true);

    try {
      const response = await api.chat(message, this.sessionId, imageData);
      console.log('[DEBUG] Raw AI response:', response.response);
      this.addMessage(response.response, 'assistant');
    } catch (error) {
      this.addMessage(`**Error:** ${error.message}`, 'assistant');
      ui.showToast(error.message, 'error');
    } finally {
      this.setLoading(false);
      this.input.focus();
    }
  }

  addMessage(content, role, scroll = true) {
    console.log('[DEBUG] addMessage called, role:', role);
    console.log('[DEBUG] Content before formatMessage:', content);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'JN';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    const formatted = ui.formatMessage(content);
    console.log('[DEBUG] Content after formatMessage:', formatted);
    textDiv.innerHTML = formatted;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = ui.getCurrentTime();
    
    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(timeDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    
    this.messagesContainer.appendChild(messageDiv);
    
    // Render LaTeX math in the new message
    console.log('[DEBUG] window.katex:', typeof window.katex);
    console.log('[DEBUG] window.renderMathInElement:', typeof window.renderMathInElement);
    this.renderMath(textDiv);
    
    if (scroll) {
      this.scrollToBottom();
    }
  }

  renderMath(element) {
    // First, normalize any remaining escaped delimiters in the element
    this.normalizeMathInElement(element);
    
    // REQUIRED DEBUGGING: Log element content BEFORE KaTeX
    console.log('[REQUIRED DEBUG] element.innerHTML BEFORE KaTeX:', element.innerHTML);
    
    // Wait for KaTeX to be ready, then render
    const tryRender = () => {
      console.log('[DEBUG] tryRender called, katex:', typeof window.katex, 'autoRender:', typeof window.renderMathInElement);
      if (window.renderMathInElement) {
        try {
          console.log('[DEBUG] Using renderMathInElement');
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
          console.log('[DEBUG] renderMathInElement completed');
          
          // REQUIRED DEBUGGING: Log element content AFTER KaTeX
          console.log('[REQUIRED DEBUG] element.innerHTML AFTER KaTeX:', element.innerHTML);
          
          // REQUIRED DEBUGGING: Check for .katex elements
          const katexElements = element.querySelectorAll('.katex');
          console.log('[REQUIRED DEBUG] element.querySelectorAll(".katex").length:', katexElements.length);
          if (katexElements.length > 0) {
            console.log('[REQUIRED DEBUG] First .katex element:', katexElements[0].outerHTML.substring(0, 200));
          }
        } catch (e) {
          console.warn('KaTeX render error:', e);
        }
      } else if (window.katex) {
        // Fallback: manually render math if auto-render not available
        console.log('[DEBUG] Using renderMathManual fallback');
        this.renderMathManual(element);
      } else {
        // KaTeX not loaded yet, retry in a bit
        console.log('[DEBUG] KaTeX not ready, retrying...');
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
      console.log('[DEBUG normalizeMathInElement] Before:', text.substring(0, 200));
      // Fix escaped delimiters - handle both single and double backslash cases
      const fixed = text
        // Double-escaped from JSON: \\[ -> \[
        .replace(/\\\\\[/g, '\\[')
        .replace(/\\\\\]/g, '\\]')
        .replace(/\\\\\(/g, '\\(')
        .replace(/\\\\\)/g, '\\)')
        // Single-escaped (already correct for KaTeX): \[ -> \[ (no change needed)
        // But also handle $$ delimiters
        .replace(/\\\\\\$/g, '$')
        .replace(/\\\\_/g, '_');
      console.log('[DEBUG normalizeMathInElement] After:', fixed.substring(0, 200));
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

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.sendBtn.disabled = loading;
    this.input.disabled = loading;
    
    if (loading) {
      this.sendBtn.innerHTML = `
        <svg class="loading-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1" stroke-linecap="round"></path>
        </svg>
        <span>Sending...</span>
      `;
    } else {
      this.sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        <span>Send</span>
      `;
    }
  }

  async clearChat() {
    try {
      await api.clearChat(this.sessionId);
      this.messagesContainer.innerHTML = '';
      this.showWelcome();
      ui.showToast('Chat cleared', 'success');
    } catch (error) {
      ui.showToast('Failed to clear chat', 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tutorChat = new TutorChat();
});