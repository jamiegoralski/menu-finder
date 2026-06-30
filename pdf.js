const { jsPDF } = window.jspdf;

function downloadFavoritesPDF(menuData, favorites) {

    const favoriteItems = menuData.filter(item =>
        favorites.includes(item.Title)
    );

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 60;

    // =========================
    // HEADER
    // =========================

    drawHeader();

    y = 165;

    // =========================
    // MENU ITEMS
    // =========================

    favoriteItems.forEach(item => {

        y = drawMenuCard(item, y);

    });

    doc.save("MenuFinderFavorites.pdf");



    // =====================================
    // FUNCTIONS
    // =====================================

    function drawHeader() {

        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("MENU FINDER", 40, 55);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(17);
        doc.text("Favorite Menu Collection", 40, 82);

        const today = new Date().toLocaleDateString();

        doc.setFontSize(11);
        doc.setTextColor(120);

        doc.text(`Generated ${today}`, 40, 108);

        doc.text(
            `${favoriteItems.length} Saved Menu Items`,
            40,
            126
        );

        doc.setDrawColor(225);
        doc.line(40, 145, pageWidth - 40, 145);

        doc.setTextColor(0);

} // End drawHeader()

    function drawMenuCard(item, y) {

    const cardX = 40;
const cardWidth = pageWidth - 80;

const contentX = cardX + 22;

const titleSize = 18;
const bodySize = 11;
const badgeSize = 9;

const lineHeight = 13;
const badgeGap = 8;

    // Description
    const description = item.MenuDescription || "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(bodySize);

    const lines = doc.splitTextToSize(
        description,
        cardWidth - 30
    );

    const descriptionHeight =
    description.trim() !== ""
        ? lines.length * lineHeight
        : 0;

    // Lifestyle
    const lifestyle = [];

    if (item.Vegan) lifestyle.push("Vegan");
    if (item.Vegetarian) lifestyle.push("Vegetarian");
    if (item.GlutenFriendly) lifestyle.push("Gluten-Friendly");
    if (item.DairyFriendly) lifestyle.push("Dairy-Friendly");

    // Allergens

    let allergens = [];

    if (item.The9Allergens) {

        let allergenText = item.The9Allergens;

        if (allergenText.includes("|")) {
            allergenText = allergenText.split("|")[1];
        }

        allergenText = allergenText
            .replace(/^Contains\s+/i, "")
            .replace(/&/g, ",");

        allergens = allergenText
            .split(",")
            .map(a => a.trim())
            .filter(a => a);

    }

    // Calculate badge rows

let badgeRows = 1;
let badgeWidth = 0;

lifestyle.forEach(label => {

    const width = doc.getTextWidth(label) + 16;

    if (badgeWidth + width > cardWidth - 40) {
        badgeRows++;
        badgeWidth = 0;
    }

    badgeWidth += width + badgeGap;

});

// Calculate allergen rows

let allergenRows = 1;
let allergenWidth = 0;

allergens.forEach(label => {

    const width = doc.getTextWidth(label) + 16;

    if (allergenWidth + width > cardWidth - 40) {
        allergenRows++;
        allergenWidth = 0;
    }

    allergenWidth += width + badgeGap;

});

    // Dynamic card height

    // Draw card

    const cardHeight =
    52 +
    (description.trim() !== "" ? descriptionHeight + 18 : 0) +
    (lifestyle.length ? 18 + badgeRows * 24 : 0) +
    (allergens.length ? 18 + allergenRows * 24 : 0) +
    (allergens.length > 0 ? 8 : 0);

    if (y + cardHeight > 720) {
    doc.addPage();
    y = 60;
}

doc.setFillColor(252,252,252);
doc.setDrawColor(225);

doc.roundedRect(
    cardX,
    y,
    cardWidth,
    cardHeight,
    10,
    10,
    "FD"
);

    // Title

    doc.setFont("helvetica","bold");
    doc.setFontSize(titleSize);

    doc.text(item.Title || "", contentX, y + 28);

let currentY = y + 40;

currentY += 12;

if (description.trim() !== "") {

    doc.setFont("helvetica", "normal");
    doc.setFontSize(bodySize);

    doc.text(lines, contentX, currentY);

    currentY += descriptionHeight + 18;

}

    // Lifestyle

if (lifestyle.length > 0) {

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("Lifestyle", contentX, currentY);

    currentY += 12;

    let badgeX = contentX;

    lifestyle.forEach(label=>{

        let color=[230,230,230];

        if(label==="Vegan") color=[220,252,231];
        if(label==="Vegetarian") color=[254,249,195];
        if(label==="Gluten-Friendly") color=[219,234,254];
        if(label==="Dairy-Friendly") color=[243,232,255];

        const width=
            doc.getTextWidth(label)+16;

        if (badgeX + width > cardX + cardWidth - 20) {
    badgeX = contentX;
    currentY += 24;
}

doc.setFillColor(...color);

doc.roundedRect(
    badgeX,
    currentY,
    width,
    16,
    5,
    5,
    "F"
);

doc.setFontSize(badgeSize);
doc.setTextColor(40);

doc.text(
    label,
    badgeX + 8,
    currentY + 11
);

badgeX += width + badgeGap;

});

}   // End Lifestyle section

if (allergens.length > 0 && lifestyle.length > 0) {
    currentY += 30;
}

    // Allergens

    doc.setTextColor(0);

    doc.setFont("helvetica","bold");
    doc.setFontSize(10);

    if (allergens.length > 0) {

    doc.setTextColor(0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    doc.text("Allergens", contentX, currentY);

    currentY += 16;

    let pillX = contentX;

allergens.forEach(label => {

    const width = doc.getTextWidth(label) + 16;

    if (pillX + width > cardX + cardWidth - 20) {
        pillX = contentX;
        currentY += 24;
    }

    doc.setFillColor(254,226,226);

    doc.roundedRect(
        pillX,
        currentY,
        width,
        16,
        5,
        5,
        "F"
    );

    doc.setTextColor(127,29,29);
    doc.setFontSize(badgeSize);

    doc.text(
        label,
        pillX + 8,
        currentY + 11
    );

    pillX += width + badgeGap;

});

    doc.setTextColor(0);

    } // closes if(allergens.length > 0)

     return y + cardHeight + 22;

}   // End drawMenuCard()

} // End downloadFavoritesPDF()