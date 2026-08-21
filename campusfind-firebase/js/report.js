// ── Report Page ──────────────────────────────────────────────

let selectedType = 'lost';
let photoDataURL = null;

document.addEventListener('DOMContentLoaded', () => {
  // Pre-select type from URL param
  const params = new URLSearchParams(window.location.search);
  const t = params.get('type');
  setType(t === 'found' ? 'found' : 'lost');

  // Default date to today
  const dateInput = document.getElementById('itemDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
});

function setType(type) {
  selectedType = type;
  const btnLost = document.getElementById('btnLost');
  const btnFound = document.getElementById('btnFound');
  if (!btnLost || !btnFound) return;
  btnLost.className = 'type-btn' + (type === 'lost' ? ' active-lost' : '');
  btnFound.className = 'type-btn' + (type === 'found' ? ' active-found' : '');
}

function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    compressImage(e.target.result, 900, 0.7, (compressedDataURL) => {
      photoDataURL = compressedDataURL;
      const preview = document.getElementById('photoPreview');
      const prompt = document.getElementById('uploadPrompt');
      if (preview) { preview.src = photoDataURL; preview.style.display = 'block'; }
      if (prompt) prompt.textContent = '✅ Photo selected (click to change)';
    });
  };
  reader.readAsDataURL(file);
}

// Downscale + re-encode as JPEG so the base64 string stays well under
// Firestore's 1MB per-document limit (no Firebase Storage in this
// build — see FIREBASE_SETUP.md for why).
function compressImage(dataURL, maxDim, quality, callback) {
  const img = new Image();
  img.onload = () => {
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
      else { width = Math.round(width * (maxDim / height)); height = maxDim; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataURL); // fall back to the original if decoding fails
  img.src = dataURL;
}

async function submitReport() {
  const title = document.getElementById('itemTitle').value.trim();
  const category = document.getElementById('itemCategory').value;
  const location = document.getElementById('itemLocation').value.trim();
  const date = document.getElementById('itemDate').value;
  const description = document.getElementById('itemDesc').value.trim();
  const contact = document.getElementById('itemContact').value.trim();

  if (!title) return showToast('Please enter an item title.', 'error');
  if (!category) return showToast('Please select a category.', 'error');
  if (!location) return showToast('Please enter a location.', 'error');
  if (!description) return showToast('Please add a description.', 'error');

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting…'; }

  let newItem;
  try {
    newItem = await addItem({ title, category, location, date, description, contact, photo: photoDataURL, type: selectedType });
  } catch (e) {
    console.error('Failed to submit report:', e);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Report'; }
    showToast('Could not submit report: ' + (e.message || 'please try again.'), 'error');
    return;
  }

  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Report'; }

  showToast(`Report submitted! ${selectedType === 'lost' ? '🔴' : '🟢'} Item added.`, 'success');

  // Check for matches
  const matches = findMatches(newItem);
  const matchSection = document.getElementById('matchResult');
  const matchGrid = document.getElementById('matchGrid');

  if (matches.length > 0 && matchSection && matchGrid) {
    matchGrid.innerHTML = matches.map(m => buildItemCard(m.item, `openModal('${m.item.id}')`)).join('');
    matchSection.style.display = 'block';
    matchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(`🔗 ${matches.length} potential match(es) found!`, 'success');
  } else if (matchSection) {
    matchSection.style.display = 'none';
  }

  resetForm();
}

function resetForm() {
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemLocation').value = '';
  document.getElementById('itemDesc').value = '';
  document.getElementById('itemContact').value = '';
  document.getElementById('itemDate').value = new Date().toISOString().split('T')[0];
  const preview = document.getElementById('photoPreview');
  const prompt = document.getElementById('uploadPrompt');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (prompt) prompt.textContent = '📷 Click to upload a photo';
  photoDataURL = null;
}
