/* BEO importer: extract -> parse menu section -> match existing catalog items. */
(function (root) {
    "use strict";

    const MENU_START = /\b(?:menu\s+selections?|food\s*\/\s*service\s+items?)\b/i;
    const MENU_END = /^(comments?|set\s*up\s+requirements?|event\s+notes?|staffing)\b/i;
    const PAGE_FOOTER = /^(printed\b|page\s+\d+\s+(of|\/))/i;
    const METADATA = /^(customer|event\s+(information|date|number|group|manager)|location|service\s+type|set\s*up|guest\s+count|sales\s+person|phone|email|company|contract|special\s+instructions?|dietary\s+codes?|number\s+of\s+buffets?)\b/i;
    const NON_CATALOG = /^(vegan|vegetarian|gluten\s*free|no\s+garlic|no\s+onion|no\s+tomato).{0,70}(meal|bread|empanada)/i;
    const ORDER_SHEET_NON_CATALOG = /^fresh\s+fruit\s+cup\b/i;
    const HEADING = /^(~+|\*{2,})|^(salad|entree|dessert|beverages?\s+on\s+consumption|hot\s+beverage|condiments)\b/i;
    const DESCRIPTION = /^(with\b|\*\*|\d+\)|oil\s*&\s*vinegar\b|prepared\b|served\b)/i;
    const BEO_TITLE_ALIASES = {
        "Assorted Breakfast Pastries": ["Breakfast Pastries"],
        "Assorted Danish Pastries": ["Assorted Danish Pastries (dz)"],
        "Assorted Rolls": ["Assorfed Rolls"],
        "Carne Asada Breakfast Burrito": ["Breakfast Burrito - Carne Asada"],
        "Croutons": ["Homemade Croutons", "Homemade Croutions"],
        "Grated Cheddar Cheese": ["Grated Cheese"],
        "Parmesan Cheese": ["Shaved Parmesan"],
        "Butter ": ["Butter"],
        "Warm Flour Tortillas": ["Flour Tortillas"],
        "Vegetarian Breakfast Burrito": ["Breakfast Burrito No Meat"],
        "Schreiner's Southwest Turkey Sausage": ["Turkey Sausage"],
        "Pesto Chicken": ["Pesto Grilled Chicken Breast"]
    };

    function normalize(value) {
        return String(value || "")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/®|™/g, "")
            .replace(/(?:beurre|buerre)s?\s+nosiette/g, "beurre noisette")
            .replace(/tartelettes\b/g, "tartelette")
            .replace(/\b(grapes|tomatoes)\b/g, (_, word) => word.slice(0, -1))
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function tokens(value) {
        return normalize(value).split(" ").filter(word => word.length > 1);
    }

    function dice(a, b) {
        const left = normalize(a).replace(/\s/g, "");
        const right = normalize(b).replace(/\s/g, "");
        if (!left || !right) return 0;
        if (left === right) return 1;
        if (left.length < 2 || right.length < 2) return 0;
        const pairs = new Map();
        for (let i = 0; i < left.length - 1; i++) {
            const pair = left.slice(i, i + 2);
            pairs.set(pair, (pairs.get(pair) || 0) + 1);
        }
        let matches = 0;
        for (let i = 0; i < right.length - 1; i++) {
            const pair = right.slice(i, i + 2);
            const count = pairs.get(pair) || 0;
            if (count) {
                pairs.set(pair, count - 1);
                matches++;
            }
        }
        return (2 * matches) / (left.length + right.length - 2);
    }

    function tokenOverlap(a, b) {
        const left = new Set(tokens(a));
        const right = new Set(tokens(b));
        if (!left.size || !right.size) return 0;
        let shared = 0;
        left.forEach(word => { if (right.has(word)) shared++; });
        return (2 * shared) / (left.size + right.size);
    }

    function aliasesForItem(item) {
        const itemAliases = Array.isArray(item.BEOAliases) ? item.BEOAliases : [];
        const builtInAliases = BEO_TITLE_ALIASES[item.Title] || [];
        let learnedAliases = [];
        try {
            const rules = root.localStorage ? JSON.parse(root.localStorage.getItem("beoMatchingRules") || "{}") : {};
            learnedAliases = Object.entries(rules)
                .filter(([, title]) => title === item.Title)
                .map(([phrase]) => phrase);
        } catch (error) {
            learnedAliases = [];
        }
        return [...itemAliases, ...builtInAliases, ...learnedAliases];
    }

    function scoreCandidate(candidate, item) {
        const title = item.Title || "";
        const a = normalize(candidate.text);
        const b = normalize(title);
        if (!a || !b) return 0;
        if (a === b) return 100;
        // A BEO often adds ingredients or dietary notes after the catalog title.
        // Treat a complete multi-word catalog title at the start of that longer line
        // as strong evidence, without making one-word generic items an auto-match.
        if (tokens(title).length >= 2 && a.startsWith(b)) return 92;
        const candidateWords = tokens(candidate.text);
        const titleWords = tokens(title);
        const contextWords = tokens(candidate.packageContext || "");
        const startsWithCatalogName = titleWords.length >= 2 &&
            candidateWords[0] === titleWords[0] && candidateWords[1] === titleWords[1];
        const contextOverlap = contextWords.filter(word => titleWords.includes(word)).length;
        if (startsWithCatalogName && contextOverlap >= 2) return 89;
        const aliases = aliasesForItem(item);
        if (aliases.some(alias => {
            const normalizedAlias = normalize(alias);
            return normalizedAlias === a ||
                (tokens(alias).length >= 2 && a.startsWith(`${normalizedAlias} `));
        })) return 98;
        const score = (tokenOverlap(candidate.text, title) * 68) + (dice(candidate.text, title) * 32);
        return Math.round(score);
    }

    function splitQuantity(line) {
        const match = line.match(/\s+(\d{1,5})\s*$/);
        return match ? { text: line.slice(0, match.index).trim(), quantity: Number(match[1]) } : { text: line.trim(), quantity: null };
    }

    function isUsefulMenuLine(line) {
        let ignored = false;
        try {
            const ignoreRules = root.localStorage ? JSON.parse(root.localStorage.getItem("beoIgnoreRules") || "[]") : [];
            ignored = ignoreRules.some(phrase => normalize(phrase) === normalize(line));
        } catch (error) {
            ignored = false;
        }
        return line.length >= 3 &&
            !ignored &&
            !PAGE_FOOTER.test(line) &&
            !METADATA.test(line) &&
            !HEADING.test(line) &&
            !DESCRIPTION.test(line) &&
            !NON_CATALOG.test(line) &&
            !ORDER_SHEET_NON_CATALOG.test(line) &&
            !/^\d+$/.test(line);
    }

    function parseBEO(text) {
        let inMenu = false;
        let section = "Menu selections";
        let packageContext = "";
        const rows = String(text || "").replace(/\r/g, "").split("\n");
        const candidates = [];

        rows.forEach((raw, index) => {
            const line = raw.replace(/\s+/g, " ").trim();
            if (!line) return;
            if (MENU_START.test(line)) { inMenu = true; return; }
            if (!inMenu) return;
            if (MENU_END.test(line.replace(/^~+|~+$/g, "").trim())) { inMenu = false; return; }
            if (HEADING.test(line)) {
                const heading = line.replace(/[~*]/g, "").trim();
                const previous = candidates[candidates.length - 1];
                if (/^salad$/i.test(heading) && previous && /^south\s+of\s+the\s+border$/i.test(previous.text)) {
                    previous.text = `${previous.text} Salad`;
                }
                section = line.replace(/[~*]/g, "").trim() || section;
                return;
            }
            const parsed = splitQuantity(line);
            if (/\bbuffet\b/i.test(parsed.text)) {
                packageContext = parsed.text;
                return;
            }
            if (!isUsefulMenuLine(parsed.text)) return;
            candidates.push({
                id: `candidate-${index}-${candidates.length}`,
                text: parsed.text,
                quantity: parsed.quantity,
                section,
                packageContext,
                sourceLine: index + 1
            });
        });
        return candidates;
    }

    function expandCompoundCandidates(candidates, menuItems) {
        const exactCatalogNames = new Set();
        menuItems.forEach(item => {
            exactCatalogNames.add(normalize(item.Title));
            const aliases = aliasesForItem(item);
            aliases.forEach(alias => exactCatalogNames.add(normalize(alias)));
        });

        return candidates.flatMap(candidate => {
            const parts = candidate.text
                .split(/\s*(?:,|&|\band\b)\s*/i)
                .map(part => part.trim())
                .filter(Boolean);
            const isExactCompound = parts.length > 1 &&
                parts.every(part => exactCatalogNames.has(normalize(part)));
            if (!isExactCompound) return [candidate];
            return parts.map((part, index) => ({
                ...candidate,
                id: `${candidate.id}-part-${index}`,
                text: part,
                compoundText: candidate.text
            }));
        });
    }

    function rankMatches(candidates, menuItems) {
        return expandCompoundCandidates(candidates, menuItems).map(candidate => {
            const options = menuItems
                .map(item => ({ item, score: scoreCandidate(candidate, item) }))
                .filter(option => option.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
            const best = options[0] || null;
            const runnerUp = options[1] || null;
            const gap = best ? best.score - (runnerUp ? runnerUp.score : 0) : 0;
            const matched = Boolean(best && best.score >= 84 && (gap >= 10 || best.score >= 98));
            return { ...candidate, options, best, gap, matched };
        });
    }

    async function extractPdfText(file, onProgress) {
        const buffer = await file.arrayBuffer();
        const pdf = await root.pdfjsLib.getDocument({ data: buffer }).promise;
        const nativePages = [];
        for (let number = 1; number <= pdf.numPages; number++) {
            onProgress(`Reading page ${number} of ${pdf.numPages}…`);
            const page = await pdf.getPage(number);
            const content = await page.getTextContent();
            nativePages.push(content.items.map(item => item.str).join(" ").trim());
        }
        const nativeText = nativePages.join("\n");
        if (nativeText.replace(/\s/g, "").length > 80) {
            return { text: nativeText, source: "embedded PDF text", pages: pdf.numPages };
        }
        if (!root.Tesseract) throw new Error("OCR could not start. Check your internet connection and reload the page.");
        const ocrPages = [];
        for (let number = 1; number <= pdf.numPages; number++) {
            onProgress(`OCR scanning page ${number} of ${pdf.numPages}…`);
            const page = await pdf.getPage(number);
            const viewport = page.getViewport({ scale: 2.5 });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: canvas.getContext("2d", { willReadFrequently: true }), viewport }).promise;
            const result = await root.Tesseract.recognize(canvas, "eng", { logger: () => {} });
            ocrPages.push(result.data.text);
        }
        return { text: ocrPages.join("\n"), source: "high-resolution OCR", pages: pdf.numPages };
    }

    root.BEOImporter = { extractPdfText, parseBEO, rankMatches, normalize, scoreCandidate, expandCompoundCandidates };
    if (typeof module !== "undefined") module.exports = root.BEOImporter;
})(typeof window !== "undefined" ? window : globalThis);
