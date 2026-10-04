const ImageUpload = (function() {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  let currentImageData = null;

  function init() {
    // Tutor chat image upload
    setupImageUpload('tutor');
    
    // Solve question image upload
    setupImageUpload('solve');
  }

  function setupImageUpload(prefix) {
    const imageBtn = document.getElementById(`${prefix}ImageBtn`);
    const fileInput = document.getElementById(`${prefix}ImageInput`);
    const removeBtn = document.getElementById(`${prefix}RemoveImageBtn`);
    const preview = document.getElementById(`${prefix}ImagePreview`);
    const previewImg = document.getElementById(`${prefix}PreviewImg`);
    const previewName = document.getElementById(`${prefix}PreviewName`);

    if (!imageBtn || !fileInput || !removeBtn || !preview) return;

    // Click image button -> open file picker
    imageBtn.addEventListener('click', () => {
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileSelect(file, prefix);
      }
      // Reset file input so same file can be selected again
      fileInput.value = '';
    });

    // Remove image
    removeBtn.addEventListener('click', () => {
      clearImage(prefix);
    });
  }

  function handleFileSelect(file, prefix) {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError(prefix, `Unsupported file type. Please select JPG, PNG, or WEBP.`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showError(prefix, `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      currentImageData = {
        dataUrl: e.target.result,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      };
      showPreview(prefix);
    };
    reader.onerror = () => {
      showError(prefix, 'Failed to read file.');
    };
    reader.readAsDataURL(file);
  }

  function showPreview(prefix) {
    const preview = document.getElementById(`${prefix}ImagePreview`);
    const previewImg = document.getElementById(`${prefix}PreviewImg`);
    const previewName = document.getElementById(`${prefix}PreviewName`);

    if (!preview || !previewImg || !previewName || !currentImageData) return;

    previewImg.src = currentImageData.dataUrl;
    previewName.textContent = currentImageData.name;
    preview.style.display = 'flex';
  }

  function clearImage(prefix) {
    currentImageData = null;
    const preview = document.getElementById(`${prefix}ImagePreview`);
    const fileInput = document.getElementById(`${prefix}ImageInput`);
    
    if (preview) {
      preview.style.display = 'none';
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function showError(prefix, message) {
    if (typeof ui !== 'undefined' && ui.showToast) {
      ui.showToast(message, 'warning');
    } else {
      console.warn(message);
      alert(message);
    }
  }

  function getCurrentImageData() {
    return currentImageData;
  }

  function hasImage() {
    return currentImageData !== null;
  }

  function clearAll() {
    currentImageData = null;
    ['tutor', 'solve'].forEach(prefix => {
      const preview = document.getElementById(`${prefix}ImagePreview`);
      const fileInput = document.getElementById(`${prefix}ImageInput`);
      if (preview) preview.style.display = 'none';
      if (fileInput) fileInput.value = '';
    });
  }

  // Expose to window
  window.ImageUpload = {
    init,
    getCurrentImageData,
    hasImage,
    clearAll,
    clearImage: (prefix) => clearImage(prefix)
  };

  return {
    init,
    getCurrentImageData,
    hasImage,
    clearAll,
    clearImage: (prefix) => clearImage(prefix)
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  ImageUpload.init();
});