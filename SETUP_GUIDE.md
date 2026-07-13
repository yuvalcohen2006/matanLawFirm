# Setup guide — click by click

Everything below is a literal sequence of clicks. Do the steps in order. Each one ends with a
**Check it worked** box; if that check fails, don't move on.

There are **four** things to set up. Only two of them are strictly required for the site to work.

| # | Step | Required? | Status right now |
|---|------|-----------|------------------|
| 1 | Web3Forms — emails every lead to the office | **Required** | ✅ Already done (key is in `.env`) |
| 2 | **Cloudinary — stores the uploaded tax assessment** | **Required for the calculator's file upload** | ❌ **NOT DONE — see Step 2** |
| 3 | Google Sheet — a running log of every lead | Optional | ❌ Not done |
| 4 | Deploy to Vercel + point the domain | **Required to go live** | ❌ Not done |

---

## ⚠️ Read this first: the one thing that is currently broken

The calculator asks *"האם יש ברשותך עותק של שומת מס הרכישה?"*. If the user answers **כן**, an upload
field opens immediately and they can pick a PDF/JPG/JPEG/PNG. **That part works.**

But the file has nowhere to be stored, because Cloudinary is not configured. So right now:

- the file is **not** saved,
- the lead email says `האם הועלתה שומה: לא` and `קישור ישיר לקובץ השומה: לא הועלה`,
- instead, the email carries a warning line so nothing is lost silently:
  > `הערת מערכת: לפונה יש קובץ שומה (shuma.pdf) אך הוא לא נשמר - העלאת הקבצים אינה מוגדרת או נכשלה. יש לבקש את הקובץ מהפונה.`

**Step 2 fixes this and takes about three minutes.** Until you do it, Matan has to phone the client
and ask them to email the assessment.

---

## Step 1 — Web3Forms (already done, but here's how to verify / redo it)

This is what emails every lead. **The access key is tied to one email address** — whichever address
you sign up with is where all the leads land. There is no way to change the destination without
making a new key.

1. Open <https://web3forms.com>.
2. In the **"Create Access Key"** box, type **`matan@abirlev.com`**.
   ⚠️ It must be this address. Leads go wherever this key was registered.
3. Click **Create Access Key**.
4. Open the inbox of `matan@abirlev.com` and click the confirmation link Web3Forms sends.
5. Copy the access key (it looks like `a1b2c3d4-e5f6-...`).
6. Open the file **`.env`** in the project root and put it on the `WEB3FORMS_ACCESS_KEY` line:

   ```
   WEB3FORMS_ACCESS_KEY=paste-the-key-here
   ```

**Check it worked:** run `npm run dev`, open <http://localhost:4321/contact>, send yourself a test
message through the form. An email should arrive at `matan@abirlev.com` within a minute. If you get
the message *"טופס הפנייה יופעל עם השלמת הגדרת האתר"* instead of a form, the key is missing or
misspelled.

---

## Step 2 — Cloudinary (⚠️ THIS IS THE MISSING ONE)

This is where the uploaded tax-assessment files get stored. It is free and needs no credit card.

1. Open <https://cloudinary.com/users/register_free> and sign up.
2. Once you're in, look at the **Dashboard**. Near the top you'll see **Cloud name** — a short
   string like `dxy12abcd`. **Copy it.**
3. Click the **gear icon** (Settings) in the left sidebar.
4. Click **Upload** in the settings menu.
5. Scroll down to **Upload presets** and click **Add upload preset**.
6. Set these two things, and *only* these two:
   - **Upload preset name** → type `abirlev_shuma` (or anything; just remember it)
   - **Signing Mode** → change from `Signed` to **`Unsigned`**
     ⚠️ This is the important one. If it stays `Signed`, uploads from the browser will be
     rejected and the file will silently fail to save.
7. Click **Save**.
8. Open **`.env`** and fill in the two lines:

   ```
   CLOUDINARY_CLOUD_NAME=dxy12abcd
   CLOUDINARY_UPLOAD_PRESET=abirlev_shuma
   ```

**Check it worked:**
1. `npm run dev`
2. Go to <http://localhost:4321/calculator>, answer **כן** to the consent question, click through.
3. On step 3 ("פרטי מס הרכישה"), type any amount and choose **כן** for
   *"האם יש ברשותך עותק של שומת מס הרכישה?"*.
4. The upload field appears. Pick any PDF.
5. Finish the wizard.
6. In the lead email that arrives, `האם הועלתה שומה` must now say **כן**, and
   `קישור ישיר לקובץ השומה` must be a clickable `https://res.cloudinary.com/...` link that opens
   the file. **If it still says `לא הועלה`, the preset is not Unsigned — go back to step 6.**

---

## Step 3 — Google Sheet log (optional)

Every lead already arrives by email. This step *additionally* drops each one as a row in a
spreadsheet, which is easier to scan and to sort than an inbox.

1. Go to <https://sheets.new> to make a new spreadsheet. Name it e.g. `לידים - אביר לב`.
2. In the menu: **Extensions → Apps Script**.
3. Delete whatever code is in the editor and paste this in:

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
     const data = e.parameter;

     // first run: write the header row from the field names
     if (sheet.getLastRow() === 0) {
       sheet.appendRow(Object.keys(data));
     }
     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     sheet.appendRow(headers.map((h) => data[h] || ''));

     return ContentService.createTextOutput('ok');
   }
   ```

4. Click **Deploy → New deployment**.
5. Click the **gear icon** next to "Select type" and choose **Web app**.
6. Set:
   - **Execute as** → `Me`
   - **Who has access** → **`Anyone`** ⚠️ (it must be `Anyone`, not `Anyone with Google account`,
     or the site cannot post to it)
7. Click **Deploy**, then **Authorize access** and approve the permission screens.
8. Copy the **Web app URL** (`https://script.google.com/macros/s/..../exec`).
9. Put it in **`.env`**:

   ```
   SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/..../exec
   ```

**Check it worked:** complete the calculator once. A new row should appear in the sheet within a few
seconds. (The site posts to Apps Script "fire and forget" — if the sheet is down, the lead email
still goes out regardless. The email is the source of truth; the sheet is a convenience.)

---

## Step 4 — Go live on Vercel

1. In a terminal, in the project folder:

   ```bash
   npx vercel login
   npx vercel
   ```
   Accept every default it offers. This gives you a preview URL you can already share.

2. Now give Vercel the same secrets that are in your `.env` — the deployed site cannot read your
   local file. Run each of these and paste the value when prompted:

   ```bash
   npx vercel env add WEB3FORMS_ACCESS_KEY production
   npx vercel env add CLOUDINARY_CLOUD_NAME production
   npx vercel env add CLOUDINARY_UPLOAD_PRESET production
   npx vercel env add SHEETS_WEBHOOK_URL production      # only if you did Step 3
   ```

3. Deploy for real:

   ```bash
   npx vercel --prod
   ```

4. **Attach the domain.** In the Vercel dashboard: your project → **Settings → Domains → Add**,
   type the domain, and follow the DNS instructions it prints.

5. **Last thing, and it's easy to forget:** open `src/data/site-details.json` and change

   ```json
   "domain": "PLACEHOLDER_DOMAIN"
   ```
   to the real address, e.g.

   ```json
   "domain": "https://www.abirlev.com"
   ```
   Then run `npx vercel --prod` once more.

   Until you do this, the `<link rel="canonical">` tags and the sitemap point at the Vercel preview
   URL instead of the real domain, which is bad for Google.

**Check it worked:** open the live domain, submit the contact form, and confirm the email arrives.
Then open `https://<your-domain>/sitemap-index.xml` and confirm the URLs inside start with your real
domain and not `vercel.app`.

---

## The `.env` file, finished

When all four steps are done, `.env` looks like this:

```
WEB3FORMS_ACCESS_KEY=a1b2c3d4-e5f6-7890-abcd-ef1234567890
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfy..../exec
CLOUDINARY_CLOUD_NAME=dxy12abcd
CLOUDINARY_UPLOAD_PRESET=abirlev_shuma
```

Never commit `.env` to git — it is already in `.gitignore`.

---

## Where to change things later

| I want to change… | Edit this |
|---|---|
| Phone, email, address, office hours, social links, domain | `src/data/site-details.json` |
| The logo | replace `public/logo.png` |
| Matan's photo | replace `public/images/matan.webp` |
| The practice areas (name, order, dropdown text, card image) | `src/data/practice-areas.ts` |
| Text in the header / footer / accessibility widget, in both languages | `src/i18n/ui.ts` |
| Tender and plot data used by the calculator | `src/data/plots.json` |
| The field names in the lead email | `buildLeadFields()` in `src/components/calculator/leads.ts` |
| Colours, fonts, spacing | `src/styles/tokens.css` |

⚠️ **About the practice-area cards:** the home-page grid is 3 columns, and a `wide` card spans 2 of
them while a `small` card spans 1. The order in `practice-areas.ts` is therefore load-bearing —
right now it goes wide, small, small, wide, wide, small, small, wide, which tiles into 4 clean rows.
If you add or remove an area, re-check that each row still adds up to 3, or you'll get a hole in the
grid.

---

## Still outstanding (not setup — decisions for Matan)

- **Ramat Yishai plot 112** — the tender booklet contradicts itself on this plot. It is flagged
  `needsManualFill` in `plots.json`, so anyone selecting it is routed to a manual review instead of
  getting a wrong number. It stays that way until RMI confirms the correct figure.
- **The legal pages** (`/privacy`, `/terms`, `/accessibility`) still carry `REVIEW BY LAWYER`
  comments in the source. They need Matan's sign-off before launch.
- **The WhatsApp number** is the mobile (`972504009594`) while the displayed office line is
  `03-5607010`. That is deliberate — a landline cannot receive WhatsApp — but confirm it's the number
  he wants people messaging.
