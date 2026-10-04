function showLoading(text = 'Processing...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (overlay && loadingText) {
    loadingText.textContent = text;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Dismiss">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Protect all LaTeX math blocks in the raw text by replacing them with placeholders.
 * Returns { protectedText, mathBlocks } where mathBlocks array contains the original math.
 * Handles display math: $$...$$, \[...\], \\[...\\] (any backslash count >=1)
 * Handles inline math: \(...\), $...$
 */
function protectMathBlocks(text) {
  const mathBlocks = [];
  let protectedText = text;

  // Match display math with flexible backslash handling:
  // - $$...$$ (dollar display)
  // - \[...\] with 1+ backslashes before [ and ]
  // - \(...\) with 1+ backslashes before ( and )
  // Use a function to capture the full block including delimiters

  // First, protect display math: $$...$$
  protectedText = protectedText.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
    mathBlocks.push({ type: 'display', content: match });
    return `__MATH_DISPLAY_${mathBlocks.length - 1}__`;
  });

  // Protect \[...\] with 1+ backslashes: \\[...\\], \\[...\\], etc.
  // Match: one or more backslashes, then [, then any chars, then one or more backslashes, then ]
  protectedText = protectedText.replace(/\\+\[[\s\S]*?\\+\]/g, (match) => {
    mathBlocks.push({ type: 'display', content: match });
    return `__MATH_DISPLAY_${mathBlocks.length - 1}__`;
  });

  // Protect \(...\) with 1+ backslashes: \(...\), \\(...\\)
  protectedText = protectedText.replace(/\\+\([\s\S]*?\\+\)/g, (match) => {
    mathBlocks.push({ type: 'inline', content: match });
    return `__MATH_INLINE_${mathBlocks.length - 1}__`;
  });

  // Protect $...$ (inline dollar math) - but not single $ in text
  // Match $...$ where content doesn't contain newline and isn't just whitespace
  protectedText = protectedText.replace(/(^|[^\\])(\$[^$\n]{1,200}\$)/g, (match, prefix, math) => {
    mathBlocks.push({ type: 'inline', content: math });
    return prefix + `__MATH_INLINE_${mathBlocks.length - 1}__`;
  });

  return { protectedText, mathBlocks };
}

/**
 * Restore math blocks from placeholders, normalizing display math delimiters to KaTeX standard:
 * - Display: $$...$$ or \[...\] (single backslash)
 * - Inline: \(...\) (single backslash) or $...$
 * LaTeX commands inside (\frac, \sqrt, \Delta, etc.) are preserved as-is.
 */
function restoreMathBlocks(protectedText, mathBlocks) {
  let restored = protectedText;

  mathBlocks.forEach((block, index) => {
    let content = block.content;
    
    if (block.type === 'display') {
      // Normalize display math delimiters to KaTeX standard: \[...\] or $$...$$
      // If it has $$...$$, keep as-is (KaTeX supports it)
      if (content.startsWith('$$') && content.endsWith('$$')) {
        // Already in $$...$$ format, keep it
      } else {
        // Convert any \[...\] or \\[...\\] to \[...\]
        // Remove all backslashes before [ and ], then add single backslash
        content = content
          .replace(/^\\+\[/, '\\[')  // Start: one or more \ then [
          .replace(/\\+\]$/, '\\]'); // End: one or more \ then ]
      }
    } else if (block.type === 'inline') {
      // Normalize inline math delimiters to KaTeX standard: \(...\) or $...$
      if (content.startsWith('$') && content.endsWith('$')) {
        // Already in $...$ format, keep it
      } else {
        // Convert any \(...\) or \\(...\\\) to \(...\)
        content = content
          .replace(/^\\+\(/, '\\(')
          .replace(/\\+\)$/, '\\)');
      }
    }

    const displayPlaceholder = `__MATH_DISPLAY_${index}__`;
    const inlinePlaceholder = `__MATH_INLINE_${index}__`;
    restored = restored.replace(displayPlaceholder, content);
    restored = restored.replace(inlinePlaceholder, content);
  });

  return restored;
}

function formatMessage(text) {
  if (!text) return '';

  // Step 1: Protect all math blocks in the RAW text (before any HTML escaping)
  const { protectedText, mathBlocks } = protectMathBlocks(text);
  console.log('[REQUIRED DEBUG ui.js] After protectMathBlocks:', protectedText.substring(0, 500));
  console.log('[REQUIRED DEBUG ui.js] Math blocks found:', mathBlocks.length, mathBlocks.map(b => ({ type: b.type, preview: b.content.substring(0, 60) })));

  // Step 2: Escape HTML for the NON-MATH text
  let formatted = escapeHtml(protectedText);

  // Step 3: Apply Markdown formatting to the non-math text
  formatted = formatted
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  // Step 4: Restore math blocks with normalized delimiters
  formatted = restoreMathBlocks(formatted, mathBlocks);
  console.log('[REQUIRED DEBUG ui.js] Final formatted output:', formatted.substring(0, 500));

  return formatted;
}

function getCurrentTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

window.ui = {
  showLoading,
  hideLoading,
  showToast,
  formatMessage,
  getCurrentTime,
  autoResizeTextarea,
  debounce,
  throttle,
  escapeHtml
};