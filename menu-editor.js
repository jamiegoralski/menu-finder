// Check if Buffet Builder sent menu items
const buffetCards = JSON.parse(sessionStorage.getItem("currentBuffet"));
console.log("Received buffet:", buffetCards);

const cards = buffetCards
    ? buffetCards
    : (JSON.parse(localStorage.getItem("editorCards")) || []);

// Clear it so it only loads once
sessionStorage.removeItem("currentBuffet");

const cardList =
    document.getElementById("cardList");

const titleInput =
    document.getElementById("titleInput");

const descriptionInput =
    document.getElementById("descriptionInput");

let currentCard = null;
let currentIndex = 0;

const lifestyleFields = [

    { field:"Vegan", label:"Vegan" },

    { field:"Vegetarian", label:"Vegetarian" },

    { field:"GlutenFriendly", label:"Gluten Friendly" },

    { field:"DairyFriendly", label:"Dairy Friendly" }

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

function updatePreview() {

    const lifestyle = [];

    if (currentCard.Vegan)
        lifestyle.push("Vegan");

    if (currentCard.Vegetarian)
        lifestyle.push("Vegetarian");

    if (currentCard.GlutenFriendly)
        lifestyle.push("Gluten Friendly");

    if (currentCard.DairyFriendly)
        lifestyle.push("Dairy Friendly");

    let allergens = [];

    if (currentCard.The9Allergens) {

        let text =
            currentCard.The9Allergens;

        if (text.includes("|")) {

            text =
                text.split("|")[1];

        }

        text = text
    .replace(/Contains\s+/gi, "")
    .replace(/&/g, ",");

        allergens = text
            .split(",")
            .map(x => x.trim())
            .filter(Boolean);

    }

    let descriptionClass = "";

if (
    currentCard.MenuDescription &&
    currentCard.MenuDescription.length > 70
) {
    descriptionClass = "small-description";
}

    document.getElementById("previewCard").innerHTML = `

        <div class="preview-top"></div>

        <div class="preview-fold"></div>

        <div class="preview-bottom">

            <h2 class="preview-title">

                ${currentCard.Title}

            </h2>

            ${
                currentCard.MenuDescription
                    ? `
            <p class="preview-description ${descriptionClass}">

    ${currentCard.MenuDescription}

</p>
            `
                    : ""
            }

            ${
                lifestyle.length
                    ? `
            <div class="preview-heading">

                Lifestyle

            </div>

            <div class="preview-badges">

                ${lifestyle.map(item => `
                    <span class="preview-badge">${item}</span>
                `).join("")}

            </div>
            `
                    : ""
            }

            ${
    allergens.length
        ? `
            ${
                lifestyle.length
                    ? `<div class="preview-divider"></div>`
                    : ""
            }

            <div class="preview-heading">
                Allergens
            </div>

            <div class="preview-badges">
                ${allergens.map(item => `
                    <span class="preview-badge">${item}</span>
                `).join("")}
            </div>
        `
        : ""
}

        </div>

    `;

document
    .getElementById("downloadPdf")
    .addEventListener("click", exportPDF);

    async function exportPDF() {

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({

        orientation: "portrait",

        unit: "in",

        format: "letter"

    });

    const preview =
        document.getElementById("previewCard");

    const favorites = cards.filter(card => card.favorite);

    const exportCards =
        favorites.length ? favorites : cards;

    const positions = [

    { x: .10, y: .08 },
    { x: 4.30, y: .08 },

    { x: .10, y: 5.58 },
    { x: 4.30, y: 5.58 }

];

    for(let i=0;i<exportCards.length;i++){

        currentCard = exportCards[i];

        updatePreview();

        await new Promise(r=>setTimeout(r,40));

        const canvas = await html2canvas(preview,{

            scale:2,

            backgroundColor:"#ffffff"

        });

        const img =
            canvas.toDataURL("image/png");

        const pos =
            positions[i%4];

        pdf.addImage(

            img,

            "PNG",

            pos.x,

            pos.y,

            4.05,

            5.40

        );

        if((i+1)%4===0 && i<exportCards.length-1){

            pdf.addPage();

        }

    }

    pdf.save("Menu Cards.pdf");

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