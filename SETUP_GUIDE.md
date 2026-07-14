# What's left to do

Everything in code is done, built and verified. `.env` is filled in, the domain is wired through
the site, and Vercel has the environment variables.

**Three things stand between you and a live site**, and they must happen in this order:

| # | Step | Roughly |
|---|------|---------|
| 1 | ⚠️ **Cloudinary: allow PDF delivery** | 2 min |
| 2 | **Namecheap: create the two DNS records** | 5 min + waiting |
| 3 | **Deploy, then send one real test lead** | 10 min |

Then step 4 — **give Matan the Google Sheet** — whenever you like.

---

## 1. ⚠️ Cloudinary: allow PDF delivery

**Do this one first, or the test in step 3 will look like it worked when it didn't.**

New Cloudinary accounts block PDFs from being *delivered*, as a security default. So the file
uploads fine and its link gets written into the lead email — but when Matan clicks that link he gets
a **401 and a blank page**. I confirmed this on your actual account:

```
upload the PDF  → HTTP 200 ✅
open the link   → HTTP 401 ❌  blocked
```

Images (JPG/PNG) are unaffected. But most tax assessments are PDFs, so this is not optional.

1. Go to <https://console.cloudinary.com/settings/security>
2. Find the checkbox **"PDF and ZIP files delivery"**.
3. It is currently **checked** (= blocked). **Uncheck it.**
4. **Save.**

**Confirm it worked** — paste this into your browser. Before the fix it errors; after it, the PDF
opens:

```
https://res.cloudinary.com/shs8xqfv/image/upload/v1783957945/vrb9zxtzwjqujzvnkwxu.pdf
```

---

## 2. Namecheap: the two DNS records

Vercel says **"Invalid Configuration"** next to both domains. **This is not a Vercel problem, and the
domains are already added correctly.** Vercel is just looking for its records at Namecheap and
finding nothing. I checked the live DNS:

```
nameservers        → dns1/dns2.registrar-servers.com   ✅ Namecheap's own DNS, correct
abirlev.com    A   → (no record)                        ❌ doesn't exist yet
www.abirlev.com    → NXDOMAIN                           ❌ doesn't exist yet
```

So there is nothing to fix in Vercel. You need to **create the records at Namecheap.**

Namecheap → **Domain List** → **Manage** (next to `abirlev.com`) → **Advanced DNS** tab.

**First delete what's already there.** Namecheap ships every new domain with parking records that
will fight yours:

- a `CNAME Record` with Host `@` pointing at `parkingpage.namecheap.com` → **delete**
- any `URL Redirect Record` → **delete**

**Then add exactly these two:**

| Type | Host | Value | TTL |
|---|---|---|---|
| `A Record` | `@` | `216.198.79.1` | Automatic |
| `CNAME Record` | `www` | `b193ff1177742e78.vercel-dns-017.com` | Automatic |

Save each row with the green checkmark.

Two things that trip people here:

- **Host is `@` and `www` — nothing more.** Not `abirlev.com`, not `www.abirlev.com`. Namecheap
  appends the domain itself, so typing the full name gives you `www.abirlev.com.abirlev.com`.
- If Namecheap rejects the CNAME value, **drop the trailing dot.**

Wait 10–30 minutes, then hit **Refresh** on both domains in Vercel. Both badges should go green.

> **`www` is the primary.** `site-details.json` says `https://www.abirlev.com`, so that's what every
> canonical tag, the sitemap and the form redirects point at, and Vercel should redirect the bare
> `abirlev.com` → `www.abirlev.com`. If you'd rather it were the other way round, tell me and I'll
> flip it **in code** — don't just change it in Vercel, or Google will index two copies of every page.

---

## 3. Deploy, then send one real lead

```bash
npx vercel --prod
```

Then open `https://www.abirlev.com/calculator` and click all the way through. On step 3, answer
**כן** to *"האם יש ברשותך עותק של שומת מס הרכישה?"* and **upload a real PDF.**

I verified the lead email builds correctly with all 24 fields by intercepting the request — but I
can't see Matan's inbox, so this is the one test only you can run.

**In the email that lands at `matan@abirlev.com`, check these three lines:**

| Field | Must say | If it doesn't |
|---|---|---|
| `האם הועלתה שומה` | **כן** | Cloudinary isn't reaching Vercel — re-check the env vars |
| `קישור ישיר לקובץ השומה` | a `res.cloudinary.com/…` link — **click it, the PDF must open** | it 401s → you skipped **step 1** |
| `סטטוס הליד` | one of `פוטנציאל להחזר` / `לא נמצאה חריגה משמעותית` / `נדרשת בדיקה ידנית` | — |

Then, on the result screen, type something into **"נשמח לשמוע מה דעתכם על המחשבון"** and send it. A
**second, separate** email should arrive, titled *"משוב על המחשבון"*. That's by design: the lead goes
out the moment the calculator finishes, and the feedback is collected after that, so it cannot ride
inside the first email.

Finally, send one message through `/contact` and one through the English investors page, and confirm
both land.

---

## 4. Giving Matan the Google Sheet

Every lead is mirrored into a Google Sheet (the tab is called **CRM**) by the Apps Script webhook
you set up. The Sheet lives in **your** Google Drive, so Matan can't see it until you share it.

1. Open the Sheet.
2. Top right → **Share**.
3. In *"Add people and groups"*, type **`matan@abirlev.com`**.
4. Set the role to **Editor** — so he can sort, filter and mark leads as handled — and press **Send**.
5. He gets an email with a link. That link is his permanent way in; he does not need a password from
   you and you do not need to send him the URL separately.

**Do NOT use "Anyone with the link".** That Sheet holds people's full names, phone numbers, email
addresses and their tax figures. A public link means anyone who ever sees it — forwarded, pasted into
a WhatsApp group, indexed — has the lot. It would also directly contradict the privacy policy on the
site. Share it to his account by name, and only to his account.

Two things worth knowing so nothing surprises you:

- **`matan@abirlev.com` must be attached to a Google account** for Google to accept it as a named
  collaborator. If it's a Workspace address, it already is. If Google says it can't find the account,
  either have him create a free Google account on that address, or share it to a Gmail address he
  already uses — the Sheet doesn't care which.
- **Sharing the Sheet does not touch the webhook.** The Apps Script stays deployed as *Execute as:
  Me / Who has access: Anyone*, which is what lets the website POST to it anonymously. Don't change
  that while you're in there.

---

## Not setup — decisions still waiting on Matan

- **Ramat Yishai plot 112** — the tender booklet contradicts itself. It's flagged `needsManualFill`
  in `plots.json`, so anyone who picks it is routed to manual review rather than shown a wrong
  number. It stays that way until RMI confirms the figure.
- **Legal pages** (`/privacy`, `/terms`, `/accessibility`) still carry `REVIEW BY LAWYER` comments in
  the source, as do the 7 calculator disclaimers. All need his sign-off before launch.
- **WhatsApp number** — WhatsApp points at the mobile `972504009594` while the displayed office line
  is `03-5607010`. That's deliberate (a landline can't receive WhatsApp) — just confirm it's the
  number he wants.
- **Social links** — `linkedinUrl` / `facebookUrl` / `instagramUrl` in `site-details.json` are empty,
  so no social rows render in the footer. Fill any in and they appear on their own.

---

## Where to change things later

| I want to change… | Edit this |
|---|---|
| Phone, email, address, hours, socials, domain | `src/data/site-details.json` |
| The logo | replace `public/logo.png` (if its proportions change a lot, update the `width`/`height` on the `<img>` in `Header.astro` + `Footer.astro`) |
| Matan's photo | replace `public/images/matan.webp` |
| Practice areas — name, dropdown text, card image | `src/data/practice-areas.ts` |
| Header / footer / accessibility-widget text, both languages | `src/i18n/ui.ts` |
| Tender and plot data | `src/data/plots.json` |
| The field names in the lead email | `buildLeadFields()` in `src/components/calculator/leads.ts` |
| Colours, fonts, spacing | `src/styles/tokens.css` |
| How every button looks and behaves | the `============ buttons ============` block in `src/styles/global.css` |

⚠️ **The practice-area tiles.** The home-page grid is six columns: a `wide` tile spans two, a `small`
square spans one, and they alternate `small, wide, small, wide` / `wide, small, wide, small` so each
row totals six. That order lives in **`GRID_ORDER`** at the bottom of `practice-areas.ts` and is
separate from the reading order above it (which drives the header dropdown). Add or remove an area
and each row must still total six, or the grid grows a hole. There's a guard in the file that throws
at build time if `GRID_ORDER` names an id that doesn't exist — but it cannot know if your rows still
add up, so check them yourself.
