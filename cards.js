fetch("data.json")
    .then(response => response.json())
    .then(menuData => {

        // Favorite titles saved by Menu Finder
        const favorites =
            JSON.parse(localStorage.getItem("favorites")) || [];

        // Find the matching menu items
        const favoriteItems = menuData.filter(item =>
            favorites.includes(item.Title)
        );

        const container = document.getElementById("cardContainer");

        container.innerHTML = "";

        favoriteItems.forEach(item => {

            container.innerHTML += createCard(item);

        });

        // =======================================
// AUTO FIT CARDS
// =======================================

document.querySelectorAll(".table-card").forEach(autoFitCard);

function autoFitCard(card) {

    const bottom = card.querySelector(".bottom-half");

    const title = card.querySelector(".card-title");
    const description = card.querySelector(".card-description");

    let titleSize = 24;
    let bodySize = 13;

    while (bottom.scrollHeight > bottom.clientHeight && titleSize > 20) {

        titleSize -= 0.5;
        bodySize -= 0.2;

        title.style.fontSize = titleSize + "px";

        if (description) {
            description.style.fontSize = bodySize + "px";
        }

    }

}

    });

function createCard(item) {

    // -------------------------
    // Lifestyle
    // -------------------------

    const lifestyle = [];

    if (item.Vegan) lifestyle.push({ label: "Vegan", class: "vegan" });

    if (item.Vegetarian)
        lifestyle.push({ label: "Vegetarian", class: "vegetarian" });

    if (item.GlutenFriendly)
        lifestyle.push({ label: "Gluten Friendly", class: "gluten" });

    if (item.DairyFriendly)
        lifestyle.push({ label: "Dairy Friendly", class: "dairy" });

    // -------------------------
    // Allergens
    // -------------------------

    let allergens = [];

    if (item.The9Allergens) {

        let text = item.The9Allergens;

        if (text.includes("|")) {
            text = text.split("|")[1];
        }

        text = text
            .replace(/^Contains\s+/i, "")
            .replace(/&/g, ",");

        allergens = text
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);

    }

    // -------------------------
    // Build Card
    // -------------------------
    
const hasDescription = !!item.MenuDescription;
const hasLifestyle = lifestyle.length > 0;
const hasAllergens = allergens.length > 0;

let cardClass = "";

if (!hasDescription && hasLifestyle && !hasAllergens) {
    cardClass = "lifestyle-only";
}

if (!hasDescription && !hasLifestyle && hasAllergens) {
    cardClass = "allergens-only";
}

    return `

<div class="table-card">

    <div class="top-half"></div>

    <div class="fold-line"></div>

    <div class="bottom-half ${cardClass}">

    <div class="content-top">

        <h2 class="card-title">${item.Title}</h2>

        <p class="card-description">
    ${item.MenuDescription || ""}
</p>

    </div>

    <div class="content-bottom">

        ${
            lifestyle.length
                ? `
        <div class="section-title">
            Lifestyle
        </div>

        <div class="lifestyle-list">
    ${lifestyle.map(badge => badge.label).join(" • ")}
</div>
        `
                : ""
        }

        ${
            allergens.length
                ? `
        <div class="section-divider"></div>

        <div class="section-title">
            Allergens
        </div>

        <div class="allergen-list">
    ${allergens.join(" • ")}
</div>
        `
                : ""
                }

    </div> <!-- content-bottom -->

</div> <!-- bottom-half -->

</div> <!-- table-card -->

`;

}