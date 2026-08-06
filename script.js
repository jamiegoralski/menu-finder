fetch('data.json')
.then(response => response.json())
.then(data => {

    const menuData = data;
window.menuData = menuData;

    const searchInput = document.getElementById("search");
    const results = document.getElementById("results");
    const smartSearchSummary = document.getElementById("smartSearchSummary");

    const dietaryDropdownButton = document.getElementById("dietaryDropdownButton");
    const mealDropdownButton = document.getElementById("mealDropdownButton");

    const dietaryDropdown = document.getElementById("dietaryDropdown");
    const mealDropdown = document.getElementById("mealDropdown");

    const sortDropdownButton = document.getElementById("sortDropdownButton");
const sortDropdown = document.getElementById("sortDropdown");

let currentSort = "az";
const RESULTS_PAGE_SIZE = 40;
let visibleResultLimit = RESULTS_PAGE_SIZE;
let searchTimer;

const SMART_SYNONYMS = {
    bread: ["bread", "roll", "rolls", "baguette", "brioche", "tortilla"],
    rolls: ["roll", "rolls", "bread"],
    pastry: ["pastry", "pastries", "danish", "croissant", "muffin"],
    pastries: ["pastry", "pastries", "danish", "croissant", "muffin"],
    dressing: ["dressing", "vinaigrette", "ranch", "sauce"],
    sauce: ["sauce", "dressing", "vinaigrette", "reduction"],
    entree: ["entree", "main", "protein"],
    dessert: ["dessert", "cake", "cookie", "cookies", "brownie", "tart"],
    veggies: ["vegetable", "vegetables", "broccoli", "carrot", "asparagus", "greens"],
    vegetables: ["vegetable", "vegetables", "broccoli", "carrot", "asparagus", "greens"]
};

const SMART_FILTERS = [
    { key: "Vegan", label: "Vegan", patterns: [/\bvegan\b/i, /\bplant[ -]?based\b/i] },
    { key: "Vegetarian", label: "Vegetarian", patterns: [/\bvegetarian\b/i] },
    { key: "GlutenFriendly", label: "Gluten-Friendly", patterns: [/\bgluten[ -]?(?:friendly|free)\b/i, /\bgf\b/i] },
    { key: "DairyFriendly", label: "Dairy-Friendly", patterns: [/\bdairy[ -]?(?:friendly|free)\b/i, /\bno dairy\b/i, /\bwithout dairy\b/i] },
    { key: "BreakfastItem", label: "Breakfast", patterns: [/\bbreakfast\b/i] },
    { key: "Lunch_x002f_DinnerItem", label: "Lunch / Dinner", patterns: [/\blunch\b/i, /\bdinner\b/i] },
    { key: "Horsdoeuvre", label: "Hors d'oeuvre", patterns: [/\bhors d['’]?oeuvres?\b/i, /\bappetizers?\b/i] },
    { key: "DessertItem", label: "Dessert", patterns: [/\bdesserts?\b/i] },
    { key: "DressingItem", label: "Dressing / Sauce", patterns: [/\bsalad dressings?\b/i] }
];

function normalizeSmartText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function editDistance(left, right) {
    if (left === right) return 0;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row++) {
        let diagonal = previous[0];
        previous[0] = row;
        for (let column = 1; column <= right.length; column++) {
            const above = previous[column];
            previous[column] = Math.min(
                previous[column] + 1,
                previous[column - 1] + 1,
                diagonal + (left[row - 1] === right[column - 1] ? 0 : 1)
            );
            diagonal = above;
        }
    }
    return previous[right.length];
}

function parseSmartQuery(rawQuery) {
    let remaining = String(rawQuery || "");
    const filters = [];
    SMART_FILTERS.forEach(filter => {
        let found = false;
        filter.patterns.forEach(pattern => {
            if (pattern.test(remaining)) {
                found = true;
                remaining = remaining.replace(pattern, " ");
            }
        });
        if (found) filters.push(filter);
    });

    const normalizedQuery = normalizeSmartText(remaining);
    const terms = normalizedQuery.split(" ").filter(Boolean);
    const concepts = terms.map(term => SMART_SYNONYMS[term] || [term]);
    return { raw: String(rawQuery || "").trim(), normalizedQuery, terms, concepts, filters };
}

function fuzzyTokenMatch(term, words) {
    if (term.length < 4) return false;
    const tolerance = term.length >= 8 ? 2 : 1;
    return words.some(word => Math.abs(word.length - term.length) <= tolerance && editDistance(term, word) <= tolerance);
}

function scoreSmartMatch(item, query) {
    if (!query.filters.every(filter => item[filter.key] === true)) return null;
    if (!query.concepts.length) return 0;

    const title = normalizeSmartText(item.Title);
    const description = normalizeSmartText(item.MenuDescription);
    const lifestyle = normalizeSmartText(item.Lifestyle);
    const allergens = normalizeSmartText(item.The9Allergens);
    const searchable = `${title} ${description} ${lifestyle} ${allergens}`.trim();
    const words = searchable.split(" ").filter(Boolean);
    let score = title.includes(query.normalizedQuery) ? 500 : 0;

    for (const alternatives of query.concepts) {
        let conceptScore = 0;
        alternatives.forEach(alternative => {
            if (title === alternative) conceptScore = Math.max(conceptScore, 180);
            else if (title.includes(alternative)) conceptScore = Math.max(conceptScore, 120);
            else if (description.includes(alternative)) conceptScore = Math.max(conceptScore, 60);
            else if (lifestyle.includes(alternative)) conceptScore = Math.max(conceptScore, 35);
            else if (allergens.includes(alternative)) conceptScore = Math.max(conceptScore, 20);
            else if (fuzzyTokenMatch(alternative, words)) conceptScore = Math.max(conceptScore, 30);
        });
        if (!conceptScore) return null;
        score += conceptScore;
    }
    return score;
}

function showSmartInterpretation(query) {
    smartSearchSummary.innerHTML = "";
    if (!query.raw || (!query.filters.length && !query.terms.some(term => SMART_SYNONYMS[term]))) return;

    const label = document.createElement("span");
    label.className = "smart-search-label";
    label.textContent = "Smart search understood:";
    smartSearchSummary.appendChild(label);

    query.filters.forEach(filter => {
        const chip = document.createElement("span");
        chip.className = "smart-search-chip";
        chip.textContent = filter.label;
        smartSearchSummary.appendChild(chip);
    });

    query.terms.filter(term => SMART_SYNONYMS[term]).forEach(term => {
        const chip = document.createElement("span");
        chip.className = "smart-search-chip synonym-chip";
        chip.textContent = `${term} + related items`;
        smartSearchSummary.appendChild(chip);
    });
}

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

    const visibleItems = items.slice(0, visibleResultLimit);

    resultCount.textContent =
    `Showing ${visibleItems.length} of ${items.length} Matching Menu Items`;

    results.innerHTML = visibleItems.map(item => {

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

    }).join("") + (visibleItems.length < items.length ? `
        <div class="load-more-row">
            <button id="loadMoreResults" class="load-more-btn" type="button">
                Load More
            </button>
            <span>${items.length - visibleItems.length} more menu items</span>
        </div>
    ` : "");

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

const loadMoreButton = document.getElementById("loadMoreResults");
if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
        visibleResultLimit += RESULTS_PAGE_SIZE;
        display(items);
    });
}

}

function applyFilters(resetVisibleResults = true) {

    if (resetVisibleResults) {
        visibleResultLimit = RESULTS_PAGE_SIZE;
    }

    const smartQuery = parseSmartQuery(searchInput.value);
    showSmartInterpretation(smartQuery);

    const filtered = menuData.map(item => {

        const smartScore = scoreSmartMatch(item, smartQuery);

        const matchesDietary =

            selectedDietary.every(filter => item[filter] === true);

        const matchesMeal =
    selectedMeals.every(filter => item[filter] === true);

const matchesFavorites =
    !favoritesOnly || favorites.includes(item.Title);

if (
    smartScore !== null &&
    matchesDietary &&
    matchesMeal &&
    matchesFavorites
) return { item, smartScore };

return null;

    }).filter(Boolean);

    // Sort Results
if (smartQuery.raw) {

    filtered.sort((a, b) =>
        b.smartScore - a.smartScore || (a.item.Title || "").localeCompare(b.item.Title || "")
    );

} else if (currentSort === "az") {

    filtered.sort((a, b) =>
        (a.item.Title || "").localeCompare(b.item.Title || "")
    );

}

if (currentSort === "za") {

    filtered.sort((a, b) =>
        (b.item.Title || "").localeCompare(a.item.Title || "")
    );

}

display(filtered.map(result => result.item));

}

applyFilters();
updateActiveFilters();

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        applyFilters();
        updateActiveFilters();
    }, 140);
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
