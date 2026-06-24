fetch('data.json')
  .then(response => response.json())
  .then(data => {

    const menuData = data;

    const searchInput = document.getElementById('search');
    const results = document.getElementById('results');

    function display(items) {

      if (!items || items.length === 0) {
        results.innerHTML = '<p>No menu items found.</p>';
        return;
      }

      results.innerHTML = items.map(item => `
        <div class="menu-item">
          <h3>${item.Title || ''}</h3>
          <p>${item.MenuDescription || ''}</p>
          <p><strong>Lifestyle:</strong> ${item.Lifestyle || 'None Listed'}</p>
          <p><strong>Allergens:</strong> ${item.The9Allergens || 'None Listed'}</p>
        </div>
      `).join('');
    }

    display(menuData);

    searchInput.addEventListener('input', () => {

      const term = searchInput.value.toLowerCase().trim();

      const filtered = menuData.filter(item =>
        (item.Title || '').toLowerCase().includes(term) ||
        (item.MenuDescription || '').toLowerCase().includes(term) ||
        (item.Lifestyle || '').toLowerCase().includes(term) ||
        (item.The9Allergens || '').toLowerCase().includes(term)
      );

      display(filtered);

    });

  })
  .catch(error => {

    document.getElementById('results').innerHTML =
      `<p>Error loading menu data: ${error.message}</p>`;

    console.error('Menu Data Error:', error);

  });

