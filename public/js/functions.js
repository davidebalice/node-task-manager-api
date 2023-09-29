const deleteEvent = (id) => {
  if (confirm('Delete this event?')) {
    document.getElementById('deleteForm' + id).submit();
  }
};

const deleteCategory = (id) => {
  if (confirm('Delete this category?')) {
    document.getElementById('deleteForm' + id).submit();
  }
};

const deleteSubcategory = (id) => {
  if (confirm('Delete this subcategory?')) {
    document.getElementById('deleteForm' + id).submit();
  }
};

const deleteUser = (id) => {
  if (confirm('Delete this user?')) {
    document.getElementById('deleteForm' + id).submit();
  }
};

const deleteReview = (id) => {
  if (confirm('Delete this review?')) {
    document.getElementById('deleteForm' + id).submit();
  }
};

const removeMessage = (classeDiv, delay) => {
  setTimeout(() => {
    const div = document.querySelector(`.${classeDiv}`);
    if (div) {
      div.remove();
    }
  }, delay);
};

removeMessage('errors', 5000);

function initializeSwitches(model) {
  const switches = document.querySelectorAll('[id^="active_"]');
  switches.forEach((switchItem) => {
    const itemId = switchItem.dataset.itemId;
    switchItem.addEventListener('change', function (event) {
      const state = event.target.checked;
      toggleActive(itemId, state, model);
    });
  });
}

async function toggleActive(itemId, state, model) {
  itemId = itemId.replace('active_', '');
  try {
    const response = await fetch(`/active/${model}/${itemId}`, {
      method: 'POST',
      mode: 'same-origin',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active: state }),
    });
    if (response.ok) {
      const data = await response.json();
      console.log('success');
    } else {
      console.log('Error request');
    }
  } catch (error) {
    console.error(error);
  }
}

function changePage(page, limit, pageName) {
  window.location.href = `/${pageName}?page=${page}&limit=${limit}`;
}
