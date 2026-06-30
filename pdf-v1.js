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

    y = 170;

    // =========================
    // MENU ITEMS
    // =========================

    favoriteItems.forEach(item => {

        y = checkPage(y);

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
    }

    function drawMenuCard(item, y) {

    const cardX = 40;
    const cardWidth = pageWidth - 80;

    // Description
    const description = item.MenuDescription || "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(
        description,
        cardWidth - 30
    );

    const descriptionHeight =
        Math.max(lines.length, 1) * 13;

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

    // Dynamic card height

    const cardHeight =
    125 +
    descriptionHeight +
    (lifestyle.length ? 30 : 0) +
    (allergens.length ? 40 : 0);

    // Draw card

    doc.setFillColor(250,250,250);
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
    doc.setFontSize(16);

    doc.text(item.Title || "",55,y+25);

    // Description

    let currentY = y + 45;

    doc.setFont("helvetica","normal");
    doc.setFontSize(11);

    doc.text(lines,55,currentY);

    currentY += descriptionHeight + 12;

    // Lifestyle

    doc.setFont("helvetica","bold");

    doc.text("Lifestyle",55,currentY);

    currentY += 12;

    let badgeX = 55;

    lifestyle.forEach(label=>{

        let color=[230,230,230];

        if(label==="Vegan") color=[220,252,231];
        if(label==="Vegetarian") color=[254,249,195];
        if(label==="Gluten-Friendly") color=[219,234,254];
        if(label==="Dairy-Friendly") color=[243,232,255];

        const width=
            doc.getTextWidth(label)+16;

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

        doc.setFontSize(9);

        doc.setTextColor(40);

        doc.text(
            label,
            badgeX+8,
            currentY+11
        );

        badgeX += width + 6;

    });

    currentY += 28;

    // Allergens

    doc.setTextColor(0);

    doc.setFont("helvetica","bold");
    doc.setFontSize(11);

    doc.text("Allergens",55,currentY);

    currentY += 12;

    let pillX=55;

    allergens.forEach(label=>{

        const width=
            doc.getTextWidth(label)+16;

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

        doc.setFontSize(9);

        doc.text(
            label,
            pillX+8,
            currentY+11
        );

        pillX += width + 6;

    });

    doc.setTextColor(0);

     return y + cardHeight + 15;

}   // End drawMenuCard()


function checkPage(y) {

    if (y > 660) {

        doc.addPage();

        y = 60;

    }

    return y;

}

} // End downloadFavoritesPDF()