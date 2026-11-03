/**
 * Music List App
 * Pure JavaScript with LocalStorage persistence and 1-5 Star Ratings
 */

// Storage key for LocalStorage
const STORAGE_KEY = 'music_list_collection';

// DOM Elements
const musicForm = document.getElementById('music-form');
const formHeading = document.getElementById('form-heading');
const titleInput = document.getElementById('music-title');
const authorInput = document.getElementById('music-author');
const statusSelect = document.getElementById('music-status');
const ratingInput = document.getElementById('music-rating');
const ratingDisplayText = document.getElementById('rating-display-text');
const starButtons = document.querySelectorAll('.star-btn');
const editIdInput = document.getElementById('edit-id');
const submitBtnText = document.getElementById('submit-btn-text');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const formCard = document.querySelector('.form-card');

const musicList = document.getElementById('music-list');
const totalCountElement = document.getElementById('total-count');
const searchInput = document.getElementById('search-input');
const emptyState = document.getElementById('empty-state');
const noSearchResults = document.getElementById('no-search-results');

/**
 * Retrieve the list of music from LocalStorage.
 * Automatically guarantees all items (already added or newly added) have a rating between 1 and 5.
 * @returns {Array} List of music objects
 */
function getMusicList() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const list = JSON.parse(data);
    let updated = false;

    // Migrate/validate any existing items to ensure they possess a 1-5 star rating
    const validatedList = list.map((item) => {
      const parsedRating = parseInt(item.rating, 10);
      const validRating = parsedRating >= 1 && parsedRating <= 5 ? parsedRating : 5;
      if (item.rating !== validRating) {
        updated = true;
        return { ...item, rating: validRating };
      }
      return item;
    });

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedList));
    }

    return validatedList;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Save music list to LocalStorage
 * @param {Array} list - Array of music objects
 */
function saveMusicList(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    alert('Unable to save music data. Your browser storage might be full or disabled.');
  }
}

/**
 * Update the total music counter at the top of the app
 */
function updateTotalCount() {
  const list = getMusicList();
  totalCountElement.textContent = list.length;
}

/**
 * Escape HTML to prevent XSS attacks when rendering user text
 * @param {string} str - Raw input string
 * @returns {string} Sanitized string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Set the rating value in the add/edit form and update visual star states
 * @param {number} rating - Rating between 1 and 5
 */
function setFormRating(rating) {
  const safeRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  ratingInput.value = safeRating;
  ratingDisplayText.textContent = `${safeRating} of 5 star${safeRating > 1 ? 's' : ''}`;

  starButtons.forEach((btn) => {
    const btnRating = parseInt(btn.dataset.rating, 10);
    if (btnRating <= safeRating) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Setup interactive hover and click listeners for the star picker
 */
function setupStarPicker() {
  starButtons.forEach((btn) => {
    const btnRating = parseInt(btn.dataset.rating, 10);

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      starButtons.forEach((b) => {
        const bRating = parseInt(b.dataset.rating, 10);
        if (bRating <= btnRating) {
          b.classList.add('hovered');
        } else {
          b.classList.remove('hovered');
        }
      });
      ratingDisplayText.textContent = `${btnRating} of 5 star${btnRating > 1 ? 's' : ''}`;
    });

    btn.addEventListener('mouseleave', () => {
      starButtons.forEach((b) => b.classList.remove('hovered'));
      const currentRating = parseInt(ratingInput.value, 10) || 5;
      ratingDisplayText.textContent = `${currentRating} of 5 star${currentRating > 1 ? 's' : ''}`;
    });

    // Click to select
    btn.addEventListener('click', () => {
      setFormRating(btnRating);
    });
  });
}

/**
 * Helper to render 1-5 star badges for a track card
 * @param {number} rating - Star rating (1-5)
 * @param {string} itemId - ID of the track
 * @returns {string} HTML string for the star rating
 */
function renderStars(rating, itemId) {
  const safeRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const isFilled = i <= safeRating;
    starsHtml += `<span 
      class="star ${isFilled ? 'filled' : 'empty'}" 
      data-action="quick-rate" 
      data-id="${itemId}" 
      data-rating="${i}" 
      title="Set rating to ${i} star${i > 1 ? 's' : ''}"
      role="button"
      aria-label="${i} star"
    >★</span>`;
  }

  return `
    <div class="item-rating" aria-label="Rating: ${safeRating} of 5 stars">
      <div class="stars-group">${starsHtml}</div>
      <span class="rating-score">${safeRating}/5</span>
    </div>
  `;
}

/**
 * Render the music list to the DOM based on optional search filter
 */
function renderList() {
  const allMusic = getMusicList();
  const query = searchInput.value.trim().toLowerCase();

  // Filter music if search query exists
  const filteredMusic = allMusic.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(query);
    const authorMatch = item.author.toLowerCase().includes(query);
    return titleMatch || authorMatch;
  });

  // Clear current list DOM
  musicList.innerHTML = '';

  // Handle empty states
  if (allMusic.length === 0) {
    emptyState.classList.remove('hidden');
    noSearchResults.classList.add('hidden');
    musicList.classList.add('hidden');
  } else if (filteredMusic.length === 0) {
    emptyState.classList.add('hidden');
    noSearchResults.classList.remove('hidden');
    musicList.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    noSearchResults.classList.add('hidden');
    musicList.classList.remove('hidden');

    // Render each music item
    filteredMusic.forEach((item) => {
      const isPlay = item.status === 'Play';
      const statusClass = isPlay ? 'status-play' : 'status-not-play';
      const statusIcon = isPlay ? '▶' : '⏸';
      const rating = item.rating || 5;

      const li = document.createElement('li');
      li.className = 'music-item';
      li.dataset.id = item.id;

      li.innerHTML = `
        <div class="item-main">
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-author">By ${escapeHtml(item.author)}</div>
          <div class="item-meta">
            <span class="status-pill ${statusClass}">
              <span>${statusIcon}</span>
              <span>${escapeHtml(item.status)}</span>
            </span>
            ${renderStars(rating, item.id)}
          </div>
        </div>
        <div class="item-actions">
          <button 
            type="button" 
            class="btn btn-sm btn-edit" 
            data-action="edit" 
            data-id="${item.id}"
            aria-label="Edit ${escapeHtml(item.title)}"
          >
            ✏️ Edit
          </button>
          <button 
            type="button" 
            class="btn btn-sm btn-delete" 
            data-action="delete" 
            data-id="${item.id}"
            aria-label="Delete ${escapeHtml(item.title)}"
          >
            🗑️ Delete
          </button>
        </div>
      `;

      musicList.appendChild(li);
    });
  }

  updateTotalCount();
}

/**
 * Reset form back to default "Add Music" state
 */
function resetForm() {
  musicForm.reset();
  editIdInput.value = '';
  setFormRating(5);
  formHeading.textContent = 'Add New Music';
  submitBtnText.textContent = 'Add Music';
  cancelEditBtn.classList.add('hidden');
  formCard.classList.remove('editing');
}

/**
 * Handle Add or Edit Form Submission
 * @param {Event} e - Form submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const status = statusSelect.value;
  const rating = parseInt(ratingInput.value, 10) || 5;
  const editId = editIdInput.value;

  if (!title || !author) {
    alert('Please fill in both the Title and Author / Artist fields.');
    return;
  }

  let list = getMusicList();

  if (editId) {
    // Edit existing music item
    const itemIndex = list.findIndex((item) => item.id === editId);
    if (itemIndex > -1) {
      list[itemIndex] = {
        ...list[itemIndex],
        title,
        author,
        status,
        rating,
        updatedAt: Date.now()
      };
    }
  } else {
    // Add new music item
    const newItem = {
      id: 'music_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title,
      author,
      status,
      rating,
      createdAt: Date.now()
    };
    list.unshift(newItem); // Add new items to the top of list
  }

  saveMusicList(list);
  resetForm();
  renderList();
}

/**
 * Populate form for editing a music item
 * @param {string} id - ID of the music item to edit
 */
function editMusic(id) {
  const list = getMusicList();
  const itemToEdit = list.find((item) => item.id === id);

  if (!itemToEdit) return;

  // Fill form fields
  editIdInput.value = itemToEdit.id;
  titleInput.value = itemToEdit.title;
  authorInput.value = itemToEdit.author;
  statusSelect.value = itemToEdit.status;
  setFormRating(itemToEdit.rating || 5);

  // Update UI for editing mode
  formHeading.textContent = 'Edit Music';
  submitBtnText.textContent = 'Save Changes';
  cancelEditBtn.classList.remove('hidden');
  formCard.classList.add('editing');

  // Scroll to form and focus input
  formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  titleInput.focus();
}

/**
 * Delete a music item after user confirmation
 * @param {string} id - ID of the music item to delete
 */
function deleteMusic(id) {
  const list = getMusicList();
  const itemToDelete = list.find((item) => item.id === id);

  if (!itemToDelete) return;

  // Ask for confirmation before deleting
  const confirmed = window.confirm(
    `Are you sure you want to delete "${itemToDelete.title}" by ${itemToDelete.author}?`
  );

  if (!confirmed) {
    return;
  }

  // If the deleted item is currently in edit mode, reset the form
  if (editIdInput.value === id) {
    resetForm();
  }

  const updatedList = list.filter((item) => item.id !== id);
  saveMusicList(updatedList);
  renderList();
}

/**
 * Delegate click events for edit, delete, and quick-rating in the music list
 * @param {Event} e - Click event
 */
function handleListClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === 'edit') {
    editMusic(id);
  } else if (action === 'delete') {
    deleteMusic(id);
  } else if (action === 'quick-rate') {
    const newRating = parseInt(target.dataset.rating, 10);
    if (newRating >= 1 && newRating <= 5 && id) {
      const list = getMusicList();
      const item = list.find((m) => m.id === id);
      if (item) {
        item.rating = newRating;
        item.updatedAt = Date.now();
        saveMusicList(list);
        renderList();

        // If this item is currently open in the edit form, sync form rating
        if (editIdInput.value === id) {
          setFormRating(newRating);
        }
      }
    }
  }
}

/**
 * Event Listeners
 */
musicForm.addEventListener('submit', handleFormSubmit);

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

musicList.addEventListener('click', handleListClick);

searchInput.addEventListener('input', () => {
  renderList();
});

// Setup star rating widget
setupStarPicker();
setFormRating(5);

// Initialize on page load safely whether DOM is loading or already parsed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderList);
} else {
  renderList();
}
