const VoiceInput = (function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  let recognition = null;
  let isListening = false;
  let finalTranscript = '';
  let interimTranscript = '';
  let currentInput = null;
  let currentVoiceBtn = null;
  let currentStatusEl = null;
  let recognitionLang = 'en-IN';
  
  function init() {
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
      return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = recognitionLang;
    
    recognition.onstart = onRecognitionStart;
    recognition.onend = onRecognitionEnd;
    recognition.onresult = onRecognitionResult;
    recognition.onerror = onRecognitionError;
    recognition.onnomatch = onNoMatch;
    
    return true;
  }
  
  function onRecognitionStart() {
    isListening = true;
    finalTranscript = '';
    interimTranscript = '';
    updateUIForListening(true);
    showStatus('Listening...', 'listening');
  }
  
  function onRecognitionEnd() {
    isListening = false;
    updateUIForListening(false);
    
    if (finalTranscript.trim()) {
      appendToInput(finalTranscript.trim());
      showStatus('Voice input added', 'success');
      setTimeout(() => hideStatus(), 2000);
    } else {
      showStatus('No speech detected', 'error');
      setTimeout(() => hideStatus(), 3000);
    }
  }
  
  function onRecognitionResult(event) {
    interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }
    
    showLiveTranscript(finalTranscript + interimTranscript);
  }
  
  function onRecognitionError(event) {
    let message = 'Voice recognition error';
    
    switch (event.error) {
      case 'no-speech':
        message = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        message = 'Microphone not accessible. Check permissions.';
        break;
      case 'not-allowed':
        message = 'Microphone permission denied. Enable in browser settings.';
        break;
      case 'network':
        message = 'Network error. Check your connection.';
        break;
      case 'service-not-allowed':
        message = 'Speech recognition service not available.';
        break;
      default:
        message = `Error: ${event.error}`;
    }
    
    showStatus(message, 'error');
    stopListening();
  }
  
  function onNoMatch() {
    showStatus('Could not understand. Please try again.', 'warning');
  }
  
  function updateUIForListening(listening) {
    if (currentVoiceBtn) {
      if (listening) {
        currentVoiceBtn.classList.add('listening');
        currentVoiceBtn.setAttribute('aria-label', 'Stop voice input');
        currentVoiceBtn.title = 'Click to stop listening';
      } else {
        currentVoiceBtn.classList.remove('listening');
        currentVoiceBtn.setAttribute('aria-label', 'Voice input');
        currentVoiceBtn.title = 'Voice input (click to speak)';
      }
    }
  }
  
  function appendToInput(text) {
    if (!currentInput || !text) return;
    
    const currentValue = currentInput.value;
    const separator = currentValue && !currentValue.endsWith(' ') && !currentValue.endsWith('\n') ? ' ' : '';
    currentInput.value = currentValue + separator + text;
    
    if (typeof ui !== 'undefined' && ui.autoResizeTextarea) {
      ui.autoResizeTextarea(currentInput);
    }
    
    currentInput.focus();
  }
  
  function showLiveTranscript(text) {
    if (currentStatusEl) {
      currentStatusEl.textContent = text || 'Listening...';
      currentStatusEl.className = 'voice-status listening';
    }
  }
  
  function showStatus(message, type) {
    if (currentStatusEl) {
      currentStatusEl.textContent = message;
      currentStatusEl.className = `voice-status ${type}`;
    }
  }
  
  function hideStatus() {
    if (currentStatusEl) {
      currentStatusEl.textContent = '';
      currentStatusEl.className = 'voice-status';
    }
  }
  
  function startListening(inputElement, voiceBtn, statusElement) {
    if (!SpeechRecognition) {
      ui.showToast('Voice input is not supported in this browser. Try Chrome or Edge.', 'warning');
      return false;
    }
    
    if (isListening) {
      stopListening();
      return false;
    }
    
    currentInput = inputElement;
    currentVoiceBtn = voiceBtn;
    currentStatusEl = statusElement;
    
    if (!recognition) {
      if (!init()) {
        ui.showToast('Voice input is not supported in this browser. Try Chrome or Edge.', 'warning');
        return false;
      }
    }
    
    recognition.lang = recognitionLang;
    
    try {
      recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start recognition:', e);
      ui.showToast('Failed to start voice recognition', 'error');
      return false;
    }
  }
  
  function stopListening() {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  }
  
  function setLanguage(lang) {
    recognitionLang = lang;
    if (recognition) {
      recognition.lang = lang;
    }
  }
  
  function isSupported() {
    return !!SpeechRecognition;
  }
  
  function getIsListening() {
    return isListening;
  }
  
  if (typeof window !== 'undefined') {
    window.VoiceInput = {
      init,
      startListening,
      stopListening,
      setLanguage,
      isSupported,
      getIsListening
    };
  }
  
  return {
    init,
    startListening,
    stopListening,
    setLanguage,
    isSupported,
    getIsListening
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  VoiceInput.init();
});