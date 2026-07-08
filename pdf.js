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

        const sharedFacility =
    allergenText.includes("Prepared in a Shared Facility with Allergens");

allergenText = allergenText
    .replace("Prepared in a Shared Facility with Allergens |", "")
    .replace("Prepared in a Shared Facility with Allergens", "")
    .replace(/Contains\s*/gi, "")
    .replace(/Contians\s*/gi, "")
    .replace(/&/g, ",")
    .trim();

allergens = allergenText
    .split(",")
    .map(a => a.trim())
    .filter(a => a);

if (sharedFacility) {
    allergens.unshift("Prepared in a Shared Facility with Allergens");
}

allergenText = allergenText
    .replace(/Contains/gi,"")
    .replace(/Prepared in a Shared Facility with Allergens/gi,"Shared Facility")
    .replace(/&/g,",")
    .trim();

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

function downloadCompleteCatalog(menuData) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "letter"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 40;
    let y = 55;

    // ==========================
    // HEADER
    // ==========================

    doc.setFont("helvetica", "bold");
doc.setFontSize(24);
doc.setTextColor(0);

doc.text("Aventura Catering", margin, y);

    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(15);
    doc.text("Complete Menu Catalog", margin, y);

    y += 18;

    doc.setFontSize(10);
    doc.setTextColor(120);

    doc.text(
        `${menuData.length} Menu Items • ${new Date().toLocaleDateString()}`,
        margin,
        y
    );

    doc.setTextColor(0);

    y += 20;

    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);

    y += 42;

    // ==========================
// MENU ITEMS
// ==========================

// Sort menu items alphabetically
const sortedMenu = [...menuData].sort((a, b) =>
    (a.Title || "").localeCompare(
        b.Title || "",
        undefined,
        {
            sensitivity: "base",
            numeric: true
        }
    )
);

// Loop through the sorted items
sortedMenu.forEach(item => {

        // Description

        const description =
            item.MenuDescription || "";

        const contentWidth = pageWidth - (margin * 2);

const descriptionLines = doc.splitTextToSize(
    description,
    contentWidth
);

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

const sharedFacility =
    allergenText.includes("Prepared in a Shared Facility with Allergens");

// Remove the shared facility warning from the string
allergenText = allergenText.replace(
    "Prepared in a Shared Facility with Allergens |",
    ""
);

allergenText = allergenText.replace(
    "Prepared in a Shared Facility with Allergens",
    ""
);

// Clean up the remaining allergens
allergenText = allergenText
    .replace(/Contains\s*/gi, "")
    .replace(/Contians\s*/gi, "")
    .replace(/&/g, ",")
    .replace(/\|/g, "")
    .trim();

allergens = allergenText
    .split(",")
    .map(a => a.trim())
    .filter(Boolean);

// Add the warning badge FIRST
if (sharedFacility) {
    allergens.unshift("Prepared in a Shared Facility with Allergens");
}

        }

        // Calculate height needed

        let neededHeight = 28;

        if(description){
            neededHeight += descriptionLines.length * 12 + 12;
        }

        if(lifestyle.length){
            neededHeight += 26;
        }

        if(allergens.length){
            neededHeight += 26;
        }

        neededHeight += 20;

        // New page if needed

        if(y + neededHeight > pageHeight - 30){

            doc.addPage();

            y = 75;

        }

        // ======================
// TITLE
// ======================

doc.setFont("helvetica","bold");
doc.setFontSize(14);

const titleLines = doc.splitTextToSize(
    item.Title || "",
    pageWidth - 80
);

doc.text(titleLines, margin, y);

y += titleLines.length * 18;

        // ======================
        // DESCRIPTION
        // ======================

        if(description){

            doc.setFont("helvetica","normal");
            doc.setFontSize(11);
            doc.setTextColor(70,70,70);

            doc.text(
    descriptionLines,
    margin,
    y,
    {
        maxWidth: pageWidth - (margin * 2)
    }
);

            y += descriptionLines.length * 12 + 18;

        }

// ======================
// LIFESTYLE
// ======================

if (lifestyle.length) {

    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.setTextColor(110);

    doc.text("Lifestyle:", margin, y);

    doc.setTextColor(0);

    let badgeX = margin + 60;
    let badgeY = y - 8;

    lifestyle.forEach(label => {

        let fill = [230,230,230];
        let text = [40,40,40];

        if(label === "Vegan")
            fill = [220,252,231];

        if(label === "Vegetarian")
            fill = [254,249,195];

        if(label === "Gluten-Friendly")
            fill = [219,234,254];

        if(label === "Dairy-Friendly")
            fill = [243,232,255];

        const width = doc.getTextWidth(label) + 12;

        doc.setFillColor(...fill);

        doc.roundedRect(
            badgeX,
            badgeY,
            width,
            16,
            4,
            4,
            "F"
        );

        doc.setTextColor(...text);
        doc.setFont("helvetica","normal");
        doc.setFontSize(8);

    doc.text(
    label,
    badgeX + (width / 2),
    badgeY + 11,
    {
        align: "center"
    }
);

        badgeX += width + 6;

    });

    doc.setTextColor(0);

    y += 22;

}

// ======================
// ALLERGENS
// ======================

if (allergens.length) {

    doc.setFont("helvetica","bold");
    doc.setFontSize(10);
    doc.setTextColor(110);

    doc.text("Allergens:", margin, y);

    doc.setTextColor(0);

    let pillX = margin + 63;
    let pillY = y - 8;

    allergens.forEach(label => {

        const width =
    label === "Prepared in a Shared Facility with Allergens"
        ? doc.getTextWidth(label)
        : doc.getTextWidth(label) + 16;

        doc.setFillColor(254,226,226);

        doc.roundedRect(
            pillX,
            pillY,
            width,
            16,
            4,
            4,
            "F"
        );

        doc.setTextColor(127,29,29);
        doc.setFont("helvetica","normal");
        doc.setFontSize(8);

        doc.text(
    label,
    pillX + (width / 2),
    pillY + 11,
    {
        align: "center"
    }
);

        pillX += width + 6;

    });

    doc.setTextColor(0);

    y += 22;

}

        // Divider

        doc.setDrawColor(230);

        doc.line(
            margin,
            y,
            pageWidth - margin,
            y
        );

        y += 28;

    });

    // ==========================
// FOOTER ON LAST PAGE
// ==========================

addFooter();

function addFooter() {

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {

        doc.setPage(i);

        // Footer text
        doc.setFont("helvetica","normal");
        doc.setFontSize(9);
        doc.setTextColor(120);

        doc.text(
            "Aventura Catering | Phoenix Convention Center",
            margin,
            pageHeight - 22
        );

        // Page number
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 22,
            {
                align: "right"
            }
        );

    }

    // Reset text color for anything afterward
    doc.setTextColor(0);

}

    doc.save("Aventura-Complete-Menu-Catalog.pdf");

}

// =====================================
// DOWNLOAD COMPLETE MENU CATALOG BUTTON
// =====================================

const downloadCatalogButton = document.getElementById("downloadPDF");

if (downloadCatalogButton) {

    downloadCatalogButton.addEventListener("click", () => {

        downloadCompleteCatalog(window.menuData);

    });

}