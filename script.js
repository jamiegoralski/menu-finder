fetch('data.json')
.then(response => response.json())
.then(data => {

    const menuData = data;
window.menuData = menuData;

    const searchInput = document.getElementById("search");
    const results = document.getElementById("results");

    const dietaryDropdownButton = document.getElementById("dietaryDropdownButton");
    const mealDropdownButton = document.getElementById("mealDropdownButton");

    const dietaryDropdown = document.getElementById("dietaryDropdown");
    const mealDropdown = document.getElementById("mealDropdown");

    const sortDropdownButton = document.getElementById("sortDropdownButton");
const sortDropdown = document.getElementById("sortDropdown");

let currentSort = "az";

    const activeFilters = document.getElementById("activeFilters");
    const resultCount = document.getElementById("resultCount");
    const clearFilters = document.getElementById("clearFilters");
    const favoritesToggle = document.getElementById("favoritesToggle");
    const favoritesBanner = document.getElementById("favoritesBanner");

    let selectedDietary = [];
    let selectedMeals = [];
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    let favoritesOnly = false;

    const filterLabels = {

    Vegan: "Vegan",

    Vegetarian: "Vegetarian",

    GlutenFriendly: "Gluten-Friendly",

    DairyFriendly: "Dairy-Friendly",

    BreakfastItem: "Breakfast",

    Lunch_x002f_DinnerItem: "Lunch / Dinner",

    Horsdoeuvre: "Hors d'oeuvre",

    DessertItem: "Dessert",

    DressingItem: "Dressing / Sauce"

};

    function toggleDropdown(button, menu){

    button.addEventListener("click",(e)=>{

        e.stopPropagation();

        dietaryDropdown.classList.remove("show");
        mealDropdown.classList.remove("show");

        if(menu.classList.contains("show")){

            menu.classList.remove("show");

        }else{

            menu.classList.add("show");

        }

});

}

toggleDropdown(dietaryDropdownButton, dietaryDropdown);
toggleDropdown(mealDropdownButton, mealDropdown);
toggleDropdown(sortDropdownButton, sortDropdown);

dietaryDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
});

mealDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
});

document.addEventListener("click", () => {

    dietaryDropdown.classList.remove("show");
    mealDropdown.classList.remove("show");
    sortDropdown.classList.remove("show");

});

function display(items) {

   if (!items || items.length === 0) {

    resultCount.textContent =
        `Showing 0 of ${menuData.length} Menu Items`;

    results.innerHTML = `

        <div class="empty-state">
            <h2>No menu items found</h2>

            <p>
                We couldn't find any menu items matching your search or selected filters.
            </p>

            <button id="emptyClearFilters">
                Clear All Filters
            </button>

        </div>

    `;

    document
        .getElementById("emptyClearFilters")
        .addEventListener("click", () => {

            clearFilters.click();

        });

    return;

}

    resultCount.textContent =
    `Showing ${items.length} of ${menuData.length} Menu Items`;

    results.innerHTML = items.map(item => {

        let allergenHTML = "";

if (item.The9Allergens) {

    let facilityWarning = "";
    let allergenText = item.The9Allergens;

    // Only split if a facility warning exists
    if (item.The9Allergens.includes("|")) {

        const parts = item.The9Allergens.split("|");

        facilityWarning = parts[0].trim();
        allergenText = parts[1].trim();

    }

    const allergens = allergenText
        .replace(/^Contains\s+/i, "")
        .replace(/&/g, ",")
        .split(",")
        .map(a => a.trim())
        .filter(a => a);

    allergenHTML = `
        <div class="allergen-card">

            <div class="allergen-title">
                ⚠ Allergens
            </div>

            <div class="allergen-list">

    ${
        facilityWarning
            ? `
                <span class="allergen-pill facility-pill">
                    ${facilityWarning}
                </span>
            `
            : ""
    }

    ${allergens.map(a => `
        <span class="allergen-pill">
            ${a}
        </span>
    `).join("")}

</div>

        </div>
    `;

}

        return `

            <div class="menu-item">

                <h3>${item.Title || ""}</h3>

                <p>${item.MenuDescription || ""}</p>

                <div class="lifestyle-row">

    ${item.Vegan ? `
        <span class="diet-tag vegan">
            <span class="dot"></span>
            Vegan
        </span>
    ` : ""}

    ${item.Vegetarian ? `
        <span class="diet-tag vegetarian">
            <span class="dot"></span>
            Vegetarian
        </span>
    ` : ""}

    ${item.GlutenFriendly ? `
        <span class="diet-tag gluten">
            <span class="dot"></span>
            Gluten-Friendly
        </span>
    ` : ""}

    ${item.DairyFriendly ? `
        <span class="diet-tag dairy">
            <span class="dot"></span>
            Dairy-Friendly
        </span>
    ` : ""}

</div>

                ${allergenHTML}

<div class="card-actions">

    <button
    class="favorite-btn ${favorites.includes(item.Title) ? "active" : ""}"
    data-title="${item.Title || ''}">

    <i class="${favorites.includes(item.Title)
        ? "fa-solid"
        : "fa-regular"} fa-heart"></i>

</button>

    <button
        class="copy-card-btn"
        data-title="${item.Title || ''}"
        data-description="${item.MenuDescription || ''}"
        data-lifestyle="${item.Lifestyle || ''}"
        data-allergens="${item.The9Allergens || ''}">

        <i class="fa-solid fa-copy"></i>
        <span>Copy Card</span>

    </button>

</div>

        `;

    }).join("");

// Copy Card Buttons
document.querySelectorAll(".copy-card-btn").forEach(button => {

    button.addEventListener("click", async () => {

        const title = button.dataset.title;
        const description = button.dataset.description;
        const lifestyle = button.dataset.lifestyle;
        const allergens = button.dataset.allergens;

        let text = `${title}`;

        if (description) {
            text += `\n\n${description}`;
        }

        if (lifestyle) {

    const lifestyleList = lifestyle
        .split("|")
        .map(item => item.trim())
        .filter(item => item);

    text += "\n\nLifestyle";

    lifestyleList.forEach(item => {
        text += `\n• ${item}`;
    });

}

if (allergens) {

    text += "\n\nAllergens";

    let facility = "";
    let allergenText = allergens;

    if (allergens.includes("|")) {

        const parts = allergens.split("|");

        facility = parts[0].trim();

        allergenText = parts[1].trim();

    }

    if (facility) {

        text += `\n• ${facility}`;

    }

    allergenText
        .replace(/^Contains\s+/i, "")
        .replace(/&/g, ",")
        .split(",")
        .map(item => item.trim())
        .filter(item => item)
        .forEach(item => {

            text += `\n• ${item}`;

        });

}

        await navigator.clipboard.writeText(text);

        button.innerHTML = `
    <i class="fa-solid fa-check"></i>
    <span>Copied!</span>
`;

setTimeout(() => {

    button.innerHTML = `
        <i class="fa-solid fa-copy"></i>
        <span>Copy Card</span>
    `;

}, 1500);

    });

});

// ==========================
// Favorite Buttons
// ==========================

document.querySelectorAll(".favorite-btn").forEach(button => {

    button.addEventListener("click", () => {

        const title = button.dataset.title;

        if (favorites.includes(title)) {

            favorites = favorites.filter(item => item !== title);

        } else {

            favorites.push(title);

        }

        localStorage.setItem(
    "favorites",
    JSON.stringify(favorites)
);

updateActiveFilters();
applyFilters();

    });

});

}

function applyFilters() {

    const search = searchInput.value.toLowerCase().trim();

    const filtered = menuData.filter(item => {

        const matchesSearch =

            (item.Title || "").toLowerCase().includes(search) ||

            (item.MenuDescription || "").toLowerCase().includes(search) ||

            (item.Lifestyle || "").toLowerCase().includes(search) ||

            (item.The9Allergens || "").toLowerCase().includes(search);

        const matchesDietary =

            selectedDietary.every(filter => item[filter] === true);

        const matchesMeal =
    selectedMeals.every(filter => item[filter] === true);

const matchesFavorites =
    !favoritesOnly || favorites.includes(item.Title);

return (
    matchesSearch &&
    matchesDietary &&
    matchesMeal &&
    matchesFavorites
);

    });

    // Sort Results
if (currentSort === "az") {

    filtered.sort((a, b) =>
        (a.Title || "").localeCompare(b.Title || "")
    );

}

if (currentSort === "za") {

    filtered.sort((a, b) =>
        (b.Title || "").localeCompare(a.Title || "")
    );

}

display(filtered);

}

applyFilters();
updateActiveFilters();

searchInput.addEventListener("input", () => {
    applyFilters();
    updateActiveFilters();
});

function updateSelections(checkboxes, selectedArray){

    checkboxes.forEach(box => {

        box.addEventListener("change", () => {

            selectedArray.length = 0;

            checkboxes.forEach(c => {

                if (c.checked) {
                    selectedArray.push(c.value);
                }

            });

            applyFilters();
            updateActiveFilters();

        });   // closes addEventListener

    });       // closes forEach

}            // closes updateSelections

const dietaryCheckboxes =
document.querySelectorAll("#dietaryDropdown input");

const mealCheckboxes =
document.querySelectorAll("#mealDropdown input");

updateSelections(dietaryCheckboxes, selectedDietary);

updateSelections(mealCheckboxes, selectedMeals);
document.querySelectorAll('input[name="sort"]').forEach(radio => {

    radio.addEventListener("change", () => {

        currentSort = radio.value;

        sortDropdownButton.textContent =
            radio.value === "az"
                ? "Sort: A → Z ▼"
                : "Sort: Z → A ▼";

        applyFilters();

    });

});

favoritesToggle.addEventListener("click", () => {

    favoritesOnly = !favoritesOnly;

    updateActiveFilters();

    applyFilters();

});

clearFilters.addEventListener("click", () => {

    // Clear search
    searchInput.value = "";

    // Uncheck all dietary filters
    dietaryCheckboxes.forEach(box => {
        box.checked = false;
    });

    // Uncheck all meal filters
    mealCheckboxes.forEach(box => {
        box.checked = false;
    });

    // Empty selected arrays
    selectedDietary.length = 0;
    selectedMeals.length = 0;

    favoritesOnly = false;
    
    // Reset sort
currentSort = "az";

document.querySelector('input[value="az"]').checked = true;

sortDropdownButton.textContent = "Sort By ▼";

    // Refresh page
    applyFilters();
    updateActiveFilters();

});

function updateActiveFilters() {

    activeFilters.innerHTML = "";

    [...selectedDietary, ...selectedMeals].forEach(filter => {

        const chip = document.createElement("div");

chip.className = "filter-chip";

chip.dataset.filter = filter;

chip.innerHTML = `
    ${filterLabels[filter]}
    <span class="remove-chip">✕</span>
`;

activeFilters.appendChild(chip);

chip.querySelector(".remove-chip").addEventListener("click", (e) => {

    e.stopPropagation();

    if (selectedDietary.includes(filter)) {

        const dietaryIndex = selectedDietary.indexOf(filter);

if (dietaryIndex > -1) {
    selectedDietary.splice(dietaryIndex, 1);
}

        dietaryCheckboxes.forEach(box => {

            if (box.value === filter) {
                box.checked = false;
            }

        });

    }

    if (selectedMeals.includes(filter)) {

        const mealIndex = selectedMeals.indexOf(filter);

if (mealIndex > -1) {
    selectedMeals.splice(mealIndex, 1);
}

        mealCheckboxes.forEach(box => {

            if (box.value === filter) {
                box.checked = false;
            }

        });

    }

    applyFilters();
    updateActiveFilters();

});

    });

    dietaryDropdownButton.textContent =
        selectedDietary.length
            ? `Dietary (${selectedDietary.length}) ▼`
            : "Dietary ▼";

    mealDropdownButton.textContent =
        selectedMeals.length
            ? `Meal Type (${selectedMeals.length}) ▼`
            : "Meal Type ▼";

            favoritesToggle.innerHTML = `
    <i class="fa-${favoritesOnly ? "solid" : "regular"} fa-heart"></i>
    <span>Favorites (${favorites.length})</span>
`;

favoritesToggle.classList.toggle("active", favoritesOnly);
if (favoritesOnly) {

    favoritesBanner.classList.add("show");

    favoritesBanner.innerHTML = `

<div class="favorites-mode-left">

    <div class="favorites-mode-header">

        <i class="fa-solid fa-heart"></i>

        <span>Favorites Mode</span>

    </div>

    <div class="favorites-mode-count">

        Showing ${favorites.length} saved menu item${favorites.length !== 1 ? "s" : ""}

    </div>

    <div class="favorites-mode-text">

        Searching only within your favorites.

    </div>

</div>

<div class="favorites-actions">

    <button id="downloadPdfButton">

        <i class="fa-solid fa-file-pdf"></i>

        Download PDF

    </button>

    <button id="generateCardsButton">

        <i class="fa-solid fa-table-cells-large"></i>

        Generate Menu Cards

    </button>

    <button id="copyCollectionButton">

        <i class="fa-solid fa-copy"></i>

        Copy Collection

    </button>

    <button id="showAllButton">

        Show Entire Menu

    </button>

</div>

`;

    document
        .getElementById("showAllButton")
        .addEventListener("click", () => {

            favoritesOnly = false;

            updateActiveFilters();

            applyFilters();

        });

        document
    .getElementById("downloadPdfButton")
    .addEventListener("click", () => {

        downloadFavoritesPDF(menuData, favorites);

    });

    document
    .getElementById("generateCardsButton")
    .addEventListener("click", () => {

        // Get the actual favorite menu items
        const favoriteItems = menuData.filter(item =>
            favorites.includes(item.Title)
        );

        // Create a completely separate editable copy
        const editableCards =
            JSON.parse(JSON.stringify(favoriteItems));

        // Save only for the editor
localStorage.setItem(
    "editorCards",
    JSON.stringify(editableCards)
);

// Tell the editor where we came from
sessionStorage.setItem("editorSource", "favorites");

// Remove any old buffet data
sessionStorage.removeItem("currentBuffet");

// Open the editor
window.location.href = "menu-editor.html";

    });

        document
    .getElementById("copyCollectionButton")
    .addEventListener("click", async () => {

        const favoriteItems = menuData.filter(item =>
            favorites.includes(item.Title)
        );

        let text = "Aventura Catering Menu Collection\n\n";

        favoriteItems.forEach(item => {

            text += `${item.Title}\n`;

            if (item.MenuDescription) {

                text += `${item.MenuDescription}\n`;

            }

            if (item.Lifestyle) {

                text += `Lifestyle:\n`;

                item.Lifestyle
                    .split("|")
                    .forEach(l =>
                        text += `• ${l.trim()}\n`
                    );

            }

            if (item.The9Allergens) {

                text += `Allergens:\n`;

                let allergenText = item.The9Allergens
                    .replace("|","|")
                    .split("|");

                allergenText.forEach(part=>{

                    if(part.includes("Contains")){

                        part
                            .replace("Contains","")
                            .replace(/&/g,",")
                            .split(",")

                            .forEach(a=>{

                                if(a.trim()){

                                    text += `• ${a.trim()}\n`;

                                }

                            });

                    }else{

                        text += `• ${part.trim()}\n`;

                    }

                });

            }

            text += "\n";

        });

        await navigator.clipboard.writeText(text);

        const btn =
            document.getElementById("copyCollectionButton");

        btn.innerHTML =
            `<i class="fa-solid fa-check"></i>Copied!`;

        setTimeout(()=>{

            btn.innerHTML =
            `<i class="fa-solid fa-copy"></i>Copy Collection`;

        },1500);

    });

} else {

    favoritesBanner.classList.remove("show");

    favoritesBanner.innerHTML = "";

}

}   // ← closes updateActiveFilters()

})  // ← closes .then(data => { ... })

.catch(error => {

    results.innerHTML =
        `<p>Error loading menu data: ${error.message}</p>`;

    console.error("Menu Data Error:", error);

});

// ===========================
// Desert Discovery
// ===========================

document.addEventListener("DOMContentLoaded", () => {

    const cactusButton = document.getElementById("cactusButton");
    const popup = document.getElementById("desertPopup");
    const closePopup = document.getElementById("closePopup");
    const factText = document.getElementById("factText");

    if (!cactusButton || !popup || !closePopup || !factText) return;

    const facts = [
        "Phoenix enjoys more than 300 days of sunshine each year.",
        "The Sonoran Desert is the only place where giant saguaro cacti grow naturally.",
        "Phoenix is the fifth-largest city in the United States.",
        "Saguaro cacti can live for over 150 years.",
        "The Phoenix Convention Center spans more than 900,000 square feet.",
        "Arizona has more than a dozen official scenic byways.",
        "Camelback Mountain is one of Phoenix's most recognizable landmarks.",
        "Phoenix Sky Harbor is one of the busiest airports in America."
    ];

    cactusButton.addEventListener("click", () => {

        factText.textContent =
            facts[Math.floor(Math.random() * facts.length)];

        popup.classList.remove("hidden");

    });

    closePopup.addEventListener("click", () => {
        popup.classList.add("hidden");
    });

});
