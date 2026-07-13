# Adv. Matan Abir Lev — Law Firm Website

A boutique Hebrew (right-to-left) website for a real-estate & land-taxation law office, featuring a **purchase-tax overpayment pre-check calculator** based on RMI (רשות מקרקעי ישראל) tender data for Arad, Beit She'an, Metula, and Ramat Yishai.

- **Stack:** Astro (static) + a single React island for the calculator · custom CSS with design tokens · no UI library
- **Leads:** Web3Forms (email) + optional Google Sheets mirror + optional Cloudinary file upload
- **Hosting:** Vercel (free) — `npx vercel --prod`. A custom domain can be attached later.

## 👉 To get the site live, follow `SETUP_GUIDE.md`

That one file walks you through every step (accounts, keys, deploy) in plain English.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (run once) |
| `npm run dev` | Local preview at `http://localhost:4321` |
| `npm run build` | Build the site into `dist/` |
| `npm run preview` | Preview the built site |

## Project layout

```
src/
  data/
    site-details.json       ← the office's real details (the ONLY place they live)
    site-details.README.md  ← what each field means (English)
    plots.json              ← plot data extracted from the tender booklets
    plots.schema.md         ← the structure of plots.json (English)
  layouts/Base.astro        ← page shell: SEO, fonts, header/footer/WhatsApp button
  components/
    calculator/             ← logic.ts (math), leads.ts (email), Calculator.tsx (UI)
  pages/                    ← the site pages (home, about, calculator, contact, legal)
  styles/tokens.css         ← 4 colors, 2 fonts, 3 sizes — the whole visual system
assets/                     ← the four RMI tender booklets (PDF) — data source
EXTRACTION_REPORT.md        ← every extracted number, with booklet page references
SETUP_GUIDE.md              ← ⭐ start here to go live
```

> Note: files ending in `.rtl.md` are the Hebrew originals of the docs, kept for reference. The `.md` (English) versions are the ones to read.
