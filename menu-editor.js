// ========================================
// Determine where the editor was opened from
// ========================================

const editorSource =
    sessionStorage.getItem("editorSource");

let cards = [];

if (editorSource === "buffet") {

    cards =
        JSON.parse(
            sessionStorage.getItem("currentBuffet")
        ) || [];

    console.log("Loaded Buffet Builder cards");

} else {

    cards =
        JSON.parse(
            localStorage.getItem("editorCards")
        ) || [];

    console.log("Loaded Favorites cards");

}

const cardList =
    document.getElementById("cardList");

const titleInput =
    document.getElementById("titleInput");

const descriptionInput =
    document.getElementById("descriptionInput");

let currentCard = null;
let currentIndex = 0;
let sharedFontScale = 1;

const lifestyleFields = [

    { field:"Vegan", label:"Vegan" },

    { field:"Vegetarian", label:"Vegetarian" },

    { field:"GlutenFriendly", label:"Gluten-Friendly" },

    { field:"DairyFriendly", label:"Dairy-Friendly" }

];

const allergenList = [

    "Milk",

    "Eggs",

    "Fish",

    "Shellfish",

    "Tree Nuts",

    "Peanuts",

    "Soy",

    "Wheat",

    "Sesame"

];

// ==============================
// Build Sidebar
// ==============================

cards.forEach((card, index) => {

    const item = document.createElement("div");

    item.className = "menu-card-item";

    item.innerHTML = `
        <i class="fa-solid fa-utensils"></i>
        <span>${card.Title}</span>
    `;

    item.addEventListener("click", () => {

        loadCard(index);

        document.querySelectorAll(".menu-card-item")
            .forEach(x => x.classList.remove("active"));

        item.classList.add("active");

    });

    cardList.appendChild(item);

});

// Load first card automatically

if (cards.length) {

    loadCard(0);

    cardList.firstChild.classList.add("active");

}

// ==============================
// Load Selected Card
// ==============================

function loadCard(index) {

    currentIndex = index;

    currentCard = cards[index];

    titleInput.value =
        currentCard.Title || "";

    descriptionInput.value =
        currentCard.MenuDescription || "";

    updatePreview();

    buildLifestyle();

    buildAllergens();

}

function buildLifestyle(){

    const container =
        document.getElementById("lifestyleCheckboxes");

    container.innerHTML = "";

    lifestyleFields.forEach(item => {

        container.innerHTML += `

            <label class="checkbox-item">

                <input
    class="lifestyle-checkbox"
    type="checkbox"
    data-field="${item.field}"
    ${currentCard[item.field] ? "checked" : ""}>

                ${item.label}

            </label>

        `;

    });

    container.className = "checkbox-group";

container
    .querySelectorAll(".lifestyle-checkbox")
    .forEach(box => {

        box.addEventListener("change", () => {

            const field =
                box.dataset.field;

            currentCard[field] =
    box.checked;

updatePreview();

buildLifestyle();

        });

    });

}

function buildAllergens(){

    const container =
        document.getElementById("allergenCheckboxes");

    container.innerHTML = "";

    let allergens = [];

    if(currentCard.The9Allergens){

        let text = currentCard.The9Allergens;

        if(text.includes("|")){
            text = text.split("|")[1];
        }

        text = text
    .replace(/Contains\s+/gi, "")
    .replace(/&/g, ",");

        allergens = text
            .split(",")
            .map(x=>x.trim())
            .filter(Boolean);

    }

    allergenList.forEach(name=>{

        container.innerHTML += `

            <label class="checkbox-item">

                <input
                    class="allergen-checkbox"
                    type="checkbox"
                    data-name="${name}"
                    ${allergens.includes(name) ? "checked" : ""}>

                ${name}

            </label>

        `;

    });

    container.className="checkbox-group";

    container
        .querySelectorAll(".allergen-checkbox")
        .forEach(box=>{

            box.addEventListener("change",()=>{

                updateAllergens();

            });

        });

}

function updateAllergens(){

    const checked = [];

    document
        .querySelectorAll(".allergen-checkbox")
        .forEach(box=>{

            if(box.checked){

                checked.push(box.dataset.name);

            }

        });

    currentCard.The9Allergens =
    checked.join(", ");

updatePreview();

buildAllergens();

}

// ==============================
// Live Editing
// ==============================

titleInput.addEventListener("input", () => {

    currentCard.Title =
        titleInput.value;

    updatePreview();

});

descriptionInput.addEventListener("input", () => {

    currentCard.MenuDescription =
        descriptionInput.value;

    updatePreview();

});

// ==============================
// Preview
// ==============================

function getLifestyleLabels(card) {

    return [
        card.Vegan && "Vegan",
        card.Vegetarian && "Vegetarian",
        card.GlutenFriendly && "Gluten-Friendly",
        card.DairyFriendly && "Dairy-Friendly"
    ].filter(Boolean);

}

function getAllergenLabels(card) {

    if (!card.The9Allergens) return [];

    return card.The9Allergens
        .replace(/Prepared in (?:a )?Shared Facility with Allergens\s*\|?/gi, "")
        .replace(/^\s*Contains\s+/i, "")
        .replace(/\s*&\s*/g, ",")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);

}

function escapeCardText(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function buildPreviewMarkup(card) {

    const lifestyle = getLifestyleLabels(card);
    const allergens = getAllergenLabels(card);
    const detailRows = [
        lifestyle.length ? ["Lifestyle", lifestyle] : null,
        allergens.length ? ["Allergens", allergens] : null
    ].filter(Boolean);

    return `
        <div class="preview-top"></div>
        <div class="preview-bottom" style="--card-font-scale:${sharedFontScale}">
            <div class="preview-accent"></div>
            <h2 class="preview-title">${escapeCardText(card.Title)}</h2>
            ${card.MenuDescription ? `
            <p class="preview-description">${escapeCardText(card.MenuDescription)}</p>
            ` : ""}
            ${detailRows.length ? `
            <div class="preview-details">
                ${detailRows.map(([label, values]) => `
                <div class="preview-detail-row">
                    <span class="preview-detail-label">${label}</span>
                    <span class="preview-detail-value">${values.map(escapeCardText).join(" · ")}</span>
                </div>
                `).join("")}
            </div>
            ` : ""}
            <div class="shared-facility-note">Prepared in a Shared Facility with Allergens</div>
        </div>
    `;

}

function previewFits() {

    const face = document.querySelector("#previewCard .preview-bottom");
    if (!face || face.scrollHeight > face.clientHeight + 1) return false;

    return [...face.querySelectorAll(".preview-detail-value")]
        .every(value => value.scrollWidth <= value.clientWidth + 1);

}

function calculateSharedFontScale() {

    const preview = document.getElementById("previewCard");
    if (!preview || !cards.length) return 1;

    // Every card uses the largest single scale that fits the most text-heavy card.
    for (let scale = 1; scale >= 0.7; scale -= 0.025) {
        sharedFontScale = Number(scale.toFixed(3));
        const allCardsFit = cards.every(card => {
            preview.innerHTML = buildPreviewMarkup(card);
            return previewFits();
        });

        if (allCardsFit) return sharedFontScale;
    }

    return 0.7;

}

function updatePreview() {

    calculateSharedFontScale();
    document.getElementById("previewCard").innerHTML = buildPreviewMarkup(currentCard);

}

const downloadPdfButton = document.getElementById("downloadPdf");
downloadPdfButton.addEventListener("click", exportPDF);

function waitForPreviewPaint() {
    return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
}

async function exportPDF() {
    if (!cards.length) return;

    const previousCard = currentCard;
    const previousIndex = currentIndex;
    const originalButtonContent = downloadPdfButton.innerHTML;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: "letter"
    });
    const preview = document.getElementById("previewCard");
    const copies = parseInt(document.getElementById("copyCount").value) || 1;

    const positions = [
        { x: 0.22, y: 0.12 },
        { x: 4.27, y: 0.12 },
        { x: 0.22, y: 5.52 },
        { x: 4.27, y: 5.52 }
    ];

    downloadPdfButton.disabled = true;
    downloadPdfButton.setAttribute("aria-busy", "true");

    try {
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        // Render each unique card once at 5x for sharper print output.
        const renderedCards = [];
        for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
            downloadPdfButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Preparing card ${cardIndex + 1} of ${cards.length}
            `;

            currentCard = cards[cardIndex];
            currentIndex = cardIndex;
            updatePreview();
            await waitForPreviewPaint();

            const canvas = await html2canvas(preview, {
                scale: 5,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false
            });

            renderedCards.push(canvas.toDataURL("image/png"));

            // Release the large canvas after encoding to keep browser memory stable.
            canvas.width = 1;
            canvas.height = 1;
            canvas.remove();
        }

        downloadPdfButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Building PDF…
        `;

        if (cards.length === 1) {
            // Fill each sheet before starting another when only one card is selected.
            for (let copyIndex = 0; copyIndex < copies; copyIndex++) {
                if (copyIndex > 0 && copyIndex % 4 === 0) {
                    pdf.addPage();
                }

                const pos = positions[copyIndex % 4];

                pdf.addImage(
                    renderedCards[0],
                    "PNG",
                    pos.x,
                    pos.y,
                    4.05,
                    5.40,
                    undefined,
                    "FAST"
                );

                pdf.setDrawColor(209, 216, 220);
                pdf.setLineWidth(0.01);
                pdf.rect(pos.x, pos.y, 4.05, 5.40);
            }
        } else {
            const pageCount = Math.ceil(cards.length / 4);

            // Keep identical pages adjacent so printed sheets can be stacked and cut
            // without sorting individual menu cards afterward.
            for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                for (let copyIndex = 0; copyIndex < copies; copyIndex++) {
                    if (pageIndex > 0 || copyIndex > 0) {
                        pdf.addPage();
                    }

                    const firstCardIndex = pageIndex * 4;
                    const lastCardIndex = Math.min(firstCardIndex + 4, cards.length);

                    for (let cardIndex = firstCardIndex; cardIndex < lastCardIndex; cardIndex++) {
                        const pos = positions[cardIndex - firstCardIndex];

                        pdf.addImage(
                            renderedCards[cardIndex],
                            "PNG",
                            pos.x,
                            pos.y,
                            4.05,
                            5.40,
                            undefined,
                            "FAST"
                        );

                        // Draw a crisp, subtle cut line around each touching card.
                        pdf.setDrawColor(209, 216, 220);
                        pdf.setLineWidth(0.01);
                        pdf.rect(pos.x, pos.y, 4.05, 5.40);
                    }
                }
            }
        }

        pdf.save("Menu Cards.pdf");
    } catch (error) {
        console.error("Menu card PDF export failed", error);
        alert("The PDF could not be created. Please try again.");
    } finally {
        currentCard = previousCard;
        currentIndex = previousIndex;
        updatePreview();

        downloadPdfButton.disabled = false;
        downloadPdfButton.removeAttribute("aria-busy");
        downloadPdfButton.innerHTML = originalButtonContent;
    }
}

// ==============================
// Add Blank Card
// ==============================

document
    .getElementById("addBlankCard")
    .addEventListener("click", addBlankCard);

function addBlankCard(){

    const newCard = {

        Title: `New Menu Item ${cards.length + 1}`,

        MenuDescription: "",

        Vegan: false,

        Vegetarian: false,

        GlutenFriendly: false,

        DairyFriendly: false,

        The9Allergens: ""

    };

    cards.unshift(newCard);

    rebuildSidebar();

    loadCard(0);

}

function rebuildSidebar(){

    cardList.innerHTML = "";

    cards.forEach((card,index)=>{

        const item = document.createElement("div");

        item.className = "menu-card-item";

        item.innerHTML = `
            <i class="fa-solid fa-utensils"></i>
            <span>${card.Title}</span>
        `;

        item.addEventListener("click",()=>{

            loadCard(index);

            document
                .querySelectorAll(".menu-card-item")
                .forEach(x=>x.classList.remove("active"));

            item.classList.add("active");

        });

        cardList.appendChild(item);

    });

    cardList.firstChild.classList.add("active");

}

// ==============================
// Print Options
// ==============================

const copyInput =
    document.getElementById("copyCount");

document
    .getElementById("increaseCopies")
    .addEventListener("click", () => {

        copyInput.value =
            Number(copyInput.value) + 1;

    });

document
    .getElementById("decreaseCopies")
    .addEventListener("click", () => {

        if(Number(copyInput.value) > 1){

            copyInput.value =
                Number(copyInput.value) - 1;

        }

    });
