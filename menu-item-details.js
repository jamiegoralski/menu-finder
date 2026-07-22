const demoIngredients = {
  "Achiote-Glazed Chicken Breast": [
    "Chicken breast",
    "Achiote glaze",
    "Citrus juice",
    "Garlic",
    "Herbs and spices"
  ]
};

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));

async function renderDetails() {
  const title = new URLSearchParams(window.location.search).get("item") || "";
  const container = document.getElementById("detailsContent");
  const response = await fetch("data.json");
  const items = await response.json();
  const item = items.find(entry => entry.Title === title);
  if (!item) {
    container.innerHTML = '<section class="details-panel"><h1>Menu item not found</h1><p>Return to the Menu Catalog and choose another item.</p></section>';
    return;
  }
  document.title = `${item.Title} | Aventura Menu Studio`;
  const storedIngredients = Array.isArray(item.Ingredients) ? item.Ingredients : String(item.Ingredients || "").split("|").map(value => value.trim()).filter(Boolean);
  const ingredients = storedIngredients.length ? storedIngredients : (demoIngredients[item.Title] || []);
  const isDemo = !storedIngredients.length && ingredients.length > 0;
  const tags = [item.Vegan&&"Vegan-Friendly",item.Vegetarian&&"Vegetarian-Friendly",item.GlutenFriendly&&"Gluten-Friendly",item.DairyFriendly&&"Dairy-Friendly"].filter(Boolean);
  container.className = "";
  container.innerHTML = `
    <section class="details-hero"><p class="details-eyebrow">Menu item details</p><h1>${escapeHtml(item.Title)}</h1><p class="details-description">${escapeHtml(item.MenuDescription || "A detailed menu description has not been added yet.")}</p></section>
    <section class="details-grid">
      <article class="details-panel"><h2>Ingredients</h2>${isDemo?'<p class="demo-note"><strong>Working example:</strong> These sample ingredients demonstrate the layout. Replace them with the approved recipe ingredients in SharePoint before production use.</p>':''}${ingredients.length?`<ul class="ingredient-list">${ingredients.map(value=>`<li>${escapeHtml(value)}</li>`).join("")}</ul>`:'<div class="empty-ingredients">Ingredients have not been added to the Menu Library yet.</div>'}</article>
      <aside class="details-panel"><h2>Dietary information</h2>${tags.length?`<div class="detail-tags">${tags.map(tag=>`<span class="detail-tag">${tag}</span>`).join("")}</div>`:'<p class="empty-ingredients">No lifestyle classifications are listed.</p>'}<h2 style="margin-top:26px">Allergens</h2><div class="allergen-detail">${escapeHtml(item.The9Allergens || "No allergens are currently listed. Prepared in a shared facility.")}</div><div class="detail-actions"><a class="detail-action" href="buffet-groups.html">Add through Buffet Builder</a><a class="detail-action secondary" href="index.html">Browse menu</a></div></aside>
    </section>`;
}

renderDetails().catch(() => { document.getElementById("detailsContent").textContent = "This menu item could not be loaded."; });
