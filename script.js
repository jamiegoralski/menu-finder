fetch('data.json')
  .then(response => response.json())
  .then(data => {

    const menuData = data.body;

    const searchInput = document.getElementById('search');
    const results = document.getElementById('results');

    function display(items) {

      if (!items || items.length === 0) {
        results.innerHTML = '<p>No menu items found.</p>';
        return;
      }

      results.innerHTML = items.map(item => `
        <div class="menu-item">
          <h3>${item.name || ''}</h3>
          <p>${item.description || ''}</p>
          <p><strong>Lifestyle:</strong> ${item.lifestyle || 'None Listed'}</p>
          <p><strong>Allergens:</strong> ${item.allergens || 'None Listed'}</p>
        </div>
      `).join('');
    }

    // Display all menu items on page load
    display(menuData);

    searchInput.addEventListener('input', () => {

      const term = searchInput.value.toLowerCase().trim();

      const filtered = menuData.filter(item =>
        (item.name || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (item.lifestyle || '').toLowerCase().includes(term) ||
        (item.allergens || '').toLowerCase().includes(term)
      );

      display(filtered);

    });

  })
  .catch(error => {

    document.getElementById('results').innerHTML =
      `<p>Error loading menu data: ${error.message}</p>`;

    console.error('Menu Data Error:', error);

  });

