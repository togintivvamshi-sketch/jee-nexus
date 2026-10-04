const API_BASE = '/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  async chat(message, sessionId = 'default', imageData = null) {
    const body = { message, sessionId };
    if (imageData) {
      body.imageData = imageData.dataUrl;
      body.mimeType = imageData.type;
    }
    return this.request('/chat', {
      method: 'POST',
      body
    });
  }

  async clearChat(sessionId = 'default') {
    return this.request('/chat/clear', {
      method: 'POST',
      body: { sessionId }
    });
  }

  async getChatHistory(sessionId = 'default') {
    return this.request(`/chat/history/${sessionId}`);
  }

  async solve(question, sessionId = 'default') {
    return this.request('/solve', {
      method: 'POST',
      body: { question, sessionId }
    });
  }

  async clearSolve(sessionId = 'default') {
    return this.request('/solve/clear', {
      method: 'POST',
      body: { sessionId }
    });
  }

  async generatePractice(params, sessionId = 'default') {
    return this.request('/practice/generate', {
      method: 'POST',
      body: { ...params, sessionId }
    });
  }

  async submitPracticeAnswer(sessionId, questionId, userAnswer) {
    return this.request('/practice/answer', {
      method: 'POST',
      body: { sessionId, questionId, userAnswer }
    });
  }

  async getPracticeSession(sessionId = 'default') {
    return this.request(`/practice/session/${sessionId}`);
  }

  async clearPractice(sessionId = 'default') {
    return this.request('/practice/clear', {
      method: 'POST',
      body: { sessionId }
    });
  }

  async search(query, subject = '') {
    return this.request('/search', {
      method: 'POST',
      body: { query, subject }
    });
  }

  async getSearchStatus() {
    return this.request('/search/status');
  }

  async checkHealth() {
    return this.request('/health');
  }

  async getStatus() {
    return this.request('/status');
  }
}

window.api = new ApiClient();