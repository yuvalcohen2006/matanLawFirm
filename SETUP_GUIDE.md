# Deploying this update to abirlev.com

Everything in code is done, built, and verified in a real browser. What's left is the handful of
steps that can only happen on **your** accounts — pushing to GitHub, and confirming Vercel and the
live site look right afterwards. This guide is click-by-click.

Do them in order:

| # | Step | Where | Roughly |
|---|------|-------|---------|
| 1 | **Push the code to GitHub** | your terminal | 3 min |
| 2 | **Watch Vercel build and go live** | vercel.com | 2 min + build |
| 3 | **Confirm the lead-form env var is set** | vercel.com | 2 min |
| 4 | **Verify the changes on the live site** | your browser | 5 min |

> **Why can't Claude just push it?** The repo is **private**, and the terminal Claude ran in has no
> login for your GitHub account. Claude committed everything locally and set the remote — but the
> final push has to come from your machine, where you're signed in. That's the one step below.

---

## 1. Push the code to GitHub

Your local folder already has the commit ready on `main`, with the remote pointed at
`github.com/yuvalcohen2006/matanLawFirm`. One catch: this folder was a **ZIP download**, not a
`git clone`, so its history isn't connected to the repo's. A plain `git push` would be rejected.
The steps below replay the change as **one clean commit on top of your current remote `main`**, which
avoids that entirely and keeps a proper, revertible history.

Open a terminal in the project folder and run these one at a time:

```bash
cd "c:/Yuvalco/private-projects/matanLawFirm/matanLawFirm-main"

# a) Make sure you're signed in to GitHub.
#    The simplest way: the first push (step e) pops up a browser login via Git
#    Credential Manager. If you have the GitHub CLI instead, run:  gh auth login

# b) Fetch the repo's real history (now that you're authenticated, this succeeds):
git fetch origin

# c) Put Claude's change on top of the latest remote main, as a single commit:
git reset --soft origin/main
git commit -C ORIG_HEAD          # reuses the full commit message Claude wrote

# d) Look at exactly what will change before you push — sanity check:
git diff --cached --stat HEAD~1
#    You should see the invest-in-israel page added, foreign-investors deleted,
#    the favicons, the calculator/leads files, vercel.json, and the nav/i18n edits.
#    If you see files you don't recognise being changed, STOP and tell Claude.

# e) Push. This is what triggers Vercel.
git push origin main
```

If step (b) fails with **"Repository not found"**, you're not authenticated — GitHub hides private
repos from anonymous users. Sign in (`gh auth login`, or let the browser prompt appear) and retry.

---

## 2. Watch Vercel build and go live

The moment your push lands, Vercel starts building — you don't click "deploy" anywhere.

1. Go to **<https://vercel.com>** and sign in.
2. On the dashboard, click the project for **abirlev.com** (its name may be `matan-law-firm`,
   `matanlawfirm`, or similar).
3. Open the **Deployments** tab (top of the project page).
4. The **top row** is your new deployment. Watch its status:
   - **Building** (yellow) → give it 1–2 minutes.
   - **Ready** (green) → it's live.
   - **Error** (red) → open it, click the **Build Logs**, and send Claude the red lines.
5. Confirm it's the right one: the row shows the commit message
   *"Invest in Israel page overhaul…"* and is labelled **Production** (not "Preview").

When the top row is a green **Production / Ready**, `www.abirlev.com` is serving the new code.

---

## 3. Confirm the lead-form env var is set

The lead emails only work if **`WEB3FORMS_ACCESS_KEY`** is present in Vercel's environment. The site
is already live with working forms, so it's almost certainly there — but a five-second check now
saves a silent "no leads arriving" later.

1. Still in the Vercel project → **Settings** (top nav) → **Environment Variables** (left sidebar).
2. In the list, confirm a row named **`WEB3FORMS_ACCESS_KEY`** exists, with **Production** among its
   environments. (The value is hidden — that's fine, you don't need to see it.)
3. These three are **optional** — present if the matching feature is in use, absent is OK:
   - `SHEETS_WEBHOOK_URL` — mirrors leads into the Google Sheet.
   - `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` — the tax-assessment file upload.

> **If you just added or changed a variable here, it does NOT apply to the site until you redeploy.**
> Go to **Deployments**, open the top row's **⋯** menu, and click **Redeploy**. Variables are baked in
> at build time — an existing live deployment keeps its old values.

---

## 4. Verify the changes on the live site

Do these in your browser against the **live** site. A couple of them are things Claude literally
cannot see (your inbox), so they're the important ones.

### 4a. The renamed page and its redirect

- Open **<https://www.abirlev.com/en/invest-in-israel>** → you should land on the new page, headline
  **"Bringing You Home"**, with the in-page bar (ABOUT US · WHY CHOOSE US · OUR SERVICES · HOW IT
  WORKS · CONTACT) sticking below the header as you scroll.
- Open the **old** URL **<https://www.abirlev.com/en/foreign-investors>** → it must **redirect** to
  `/en/invest-in-israel`. This preserves any existing Google ranking and bookmarks.
- In the top nav, the English tab now reads **INVEST IN ISRAEL** (not "Foreign Investors").

### 4b. The favicon (your logo emblem)

- Look at the **browser tab** — the little icon should be the firm's **building emblem** (teal on
  navy), not a blank page and not the old gold squares.
- Favicons are cached hard by browsers. If you still see the old one, do a hard refresh
  (**Ctrl+Shift+R**), or check in a private/incognito window.
- Optional deeper check: open **<https://www.abirlev.com/favicon.ico>** directly — it should show the
  emblem.

### 4c. The calculator lead — one email, and it actually arrives

This is the fix you reported, and the one test only you can run (Claude can't see Matan's inbox).

**Test A — the "have a lawyer call me" click (this was the bug):**
1. Open **<https://www.abirlev.com/calculator>**, accept the consent, and fill the wizard so it
   produces the **"שילמת יותר…"** (overpayment) result. A combination that works: settlement
   **בית שאן**, plot **252**, tax paid **50000**, no relief, land component **250000**.
2. On the result screen, click **"אני רוצה שעו״ד מיסוי מקרקעין יחזור אליי…"**.
3. You should see the green **"הפרטים התקבלו בהצלחה"** confirmation.
4. **Check `matan@abirlev.com`:** exactly **one** email should arrive, titled
   **"בקשת יצירת קשר מפונה…"**, containing the name/phone/email you typed. Before this fix, that
   click sent nothing at all.

**Test B — completing the wizard without clicking the button:**
1. Run the wizard again to any result, but this time **don't** click the callback button — just
   leave the page (close the tab or navigate away).
2. **Check the inbox:** exactly **one** email should arrive, titled **"ליד חדש…"**.

> **Why "exactly one" matters:** the automatic lead is now held for a short grace window so that
> clicking the callback button *replaces* it rather than adding a second email. Click → you get the
> "בקשת יצירת קשר" email. Don't click → you get the plain "ליד חדש" email. Never both. If you ever see
> **two** emails for one visitor, tell Claude — that's the exact thing this change prevents.

The **feedback box** ("נשמח לשמוע מה דעתכם") on the result screen is separate and unchanged: typing
there and sending produces its own **"משוב על המחשבון"** email, which is intentional and is *not* a
duplicate lead.

### 4d. The other forms

- Send one message through **<https://www.abirlev.com/contact>** and confirm it lands.
- Send one through the **Contact** section of the invest-in-israel page and confirm it lands.

---

## If something's wrong

- **Site didn't change / still shows the old page** → the deploy hasn't finished or didn't trigger.
  Re-check step 2; make sure the top Deployments row is green **Production**.
- **The redirect (4a) 404s instead of redirecting** → the deploy is from before this change, or
  `vercel.json` didn't ship. Confirm the pushed commit is the one that built.
- **No lead email arrives (4c)** → re-check step 3 (`WEB3FORMS_ACCESS_KEY`), and remember a
  newly-added variable needs a **redeploy** to take effect.
- **Favicon still old (4b)** → almost always browser cache; hard-refresh or use incognito before
  assuming it's broken.

---

## Decisions still waiting on Matan (unchanged by this update)

- **Ramat Yishai plot 112** — the tender booklet contradicts itself, so it's flagged
  `needsManualFill` in `plots.json`: anyone who picks it is routed to manual review rather than shown
  a wrong number. Stays that way until RMI confirms the figure.
- **Legal pages** (`/privacy`, `/terms`, `/accessibility`) and the 7 calculator disclaimers still
  need his lawyer sign-off before you consider the site formally launched.
- **WhatsApp vs. office line** — WhatsApp points at the mobile `972504009594` while the displayed
  office number is `03-5607010` (a landline can't receive WhatsApp). Deliberate; just confirm it's
  the number he wants.
- **Social links** — `linkedinUrl` / `facebookUrl` / `instagramUrl` in `site-details.json` are empty,
  so no social icons render in the footer. Fill any in and they appear.

---

## Where to change things later

| I want to change… | Edit this |
|---|---|
| Phone, email, address, hours, socials, domain | `src/data/site-details.json` |
| The logo | replace `public/logo.png`, then **re-run `node scripts/make-favicons.mjs`** so the favicons regenerate from the new logo |
| Matan's photo | replace `public/images/matan.webp` |
| Practice areas — name, dropdown text, card image | `src/data/practice-areas.ts` |
| The Invest in Israel page copy | `src/pages/en/invest-in-israel.astro` (the arrays near the top: `whyUs`, `services`, `steps`, `areas`) |
| Header / footer / accessibility-widget text, both languages | `src/i18n/ui.ts` |
| Tender and plot data | `src/data/plots.json` |
| The field names in the lead email | `buildLeadFields()` in `src/components/calculator/leads.ts` |
| How long the auto-lead waits before sending (the dedup grace) | `LEAD_GRACE_MS` in `src/components/calculator/Calculator.tsx` |
| The security headers (CSP etc.) | the `headers` block in `vercel.json` — if you add a new third-party service, its origin must be added to the CSP or the browser will block it |
| Colours, fonts, spacing | `src/styles/tokens.css` |

⚠️ **The practice-area tiles.** The home-page grid is six columns: a `wide` tile spans two, a `small`
square spans one, alternating so each row totals six. That order lives in **`GRID_ORDER`** at the
bottom of `practice-areas.ts`, separate from the reading order above it. Add or remove an area and
each row must still total six, or the grid grows a hole. A build-time guard throws if `GRID_ORDER`
names an unknown id, but it can't tell whether your rows still add up — check them yourself.
