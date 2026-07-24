# Aventura Menu Finder

A lightweight browser app for searching the Aventura Catering menu, building buffet selections, and generating menu cards.

## Run locally

Serve this folder with any static web server, then open `index.html`. For example:

```bash
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000` in a browser.

## Import a BEO

Open **Buffet Builder**, choose a BEO PDF, and select **Analyze BEO**. The importer reads the Menu Selections section and adds only recognized items that already exist in `data.json`; it never creates new menu items from OCR text. Image-only PDFs are processed with high-resolution OCR.

## Data

`data.json` is the menu library used by search, buffet building, and BEO import matching.
