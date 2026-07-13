# Setup Checklist (English)

Short version. For the full click-by-click walkthrough, see **`SETUP_GUIDE.md`**.

## Must do before launch

- [ ] ⚠️ **Cloudinary — the assessment upload has nowhere to save to.** The calculator's upload field
      now opens the moment the user answers **כן**, and it accepts PDF/JPG/JPEG/PNG. But without
      Cloudinary the file is discarded: the lead email says `האם הועלתה שומה: לא` and carries a
      warning telling Matan to phone and ask for the file. Fix: free Cloudinary account → add an
      **Unsigned** upload preset → set `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET` in
      `.env` and in Vercel. **Step 2 of `SETUP_GUIDE.md`, ~3 minutes.**
- [ ] **Send a live test lead** — fill in the calculator and the contact form on the deployed site
      and confirm both emails actually land in `matan@abirlev.com`. The wiring is verified end to
      end locally (all 24 fields, correct values, correct subject), but only a real send proves the
      inbox side.
- [ ] **Deploy to Vercel + attach the domain**, then set `domain` in `src/data/site-details.json` to
      the real address so canonicals and the sitemap stop pointing at the preview URL.
- [ ] **Lawyer review** — everything marked `<!-- REVIEW BY LAWYER -->`, the 7 calculator
      disclaimers, all calculator wording, and the dates on the legal pages.
- [ ] **Verify tender data** — check `EXTRACTION_REPORT.md` against the booklets; resolve Ramat
      Yishai plot 112 in `plots.json` once RMI confirms it.

## Optional

- [ ] **Google Sheet mirror** — Apps Script `doPost` → paste the web-app URL into `.env` as
      `SHEETS_WEBHOOK_URL`. Leads still email fine without it.
- [ ] **Confirm the WhatsApp number** — the site dials the office on **03-5607010**, but WhatsApp
      points at the mobile **972504009594** (`whatsappNumber` in `site-details.json`), because a
      landline can't receive WhatsApp. Change it if the office uses a different WhatsApp line.
- [ ] **Social links** — `linkedinUrl` / `facebookUrl` / `instagramUrl` in `site-details.json` are
      empty, so no social rows render in the footer. Fill any of them in and they appear.

## Done

- [x] **Web3Forms lead email** — key is in `.env`; the calculator lead carries every field the
      client asked for, and the feedback box on the result screen sends a second, separately
      labelled email.
- [x] **Real assets** — logo at `public/logo.png`, portrait at `public/images/matan.webp`.
- [x] **Office details** — phone, email, address and hours are filled in `site-details.json`. Only
      `domain` is still a placeholder (see above).
