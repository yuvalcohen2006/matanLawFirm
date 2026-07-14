# Checklist

Full instructions in **`SETUP_GUIDE.md`**. This is just the tick-list.

## To do, in order

- [ ] ⚠️ **Cloudinary → Settings → Security → uncheck "PDF and ZIP files delivery".**
      Uploads already work, but PDF *links* return **401**, so every שומה link in the lead email is
      dead. Images are unaffected. Verified on the live account. Do this BEFORE the test lead, or the
      test will look like it passed when it didn't. ~2 min.
- [ ] **Namecheap → Advanced DNS → create the two records.** Vercel's "Invalid Configuration" is a
      missing-DNS problem, not a Vercel problem — the domains are already added. Delete Namecheap's
      default parking `CNAME @ → parkingpage.namecheap.com` and any URL Redirect record first, then:
      `A` `@` → `216.198.79.1`, and `CNAME` `www` → `b193ff1177742e78.vercel-dns-017.com`.
      Wait, then hit **Refresh** in Vercel until both badges go green.
- [ ] **`npx vercel --prod`.**
- [ ] **Send one real lead** through the deployed calculator with a real PDF attached. Confirm in the
      email that `האם הועלתה שומה: כן` and that the Cloudinary link actually opens the PDF. Then send
      the feedback from the result screen and confirm the second email arrives.
- [ ] **Share the Google Sheet with Matan** — Share → `matan@abirlev.com` → **Editor**.
      **Not** "anyone with the link": it holds names, phones, emails and tax figures.
- [ ] **Lawyer review** — everything marked `REVIEW BY LAWYER`, the 7 calculator disclaimers, and the
      dates on the legal pages.
- [ ] **Ramat Yishai plot 112** — booklet contradicts itself; flagged `needsManualFill` until RMI
      confirms.

## Done and verified

- [x] **Web3Forms** — key in `.env` and in Vercel; dashboard recipient is `matan@abirlev.com`. Lead
      payload checked field by field (all 24, correct values, correct subject).
- [x] **Cloudinary upload** — real 7MB PDF pushed through the `abirlev_shuma` unsigned preset, HTTP 200.
- [x] **Google Sheets webhook** — set in `.env` and in Vercel.
- [x] **Env vars in Vercel** — all four.
- [x] **Domains added in Vercel** — `abirlev.com` and `www.abirlev.com`. They only await DNS.
- [x] **Domain in code** — canonicals, hreflang, sitemap and the form redirect all say
      `https://www.abirlev.com`.
- [x] **New logo** — live in the header, mobile drawer and footer.
- [x] **Office details** — phone, email, address, hours all filled.
- [x] **Full sweep** — 13 pages × desktop and mobile: no console errors, no horizontal overflow, no
      long dashes rendered, correct `lang`/`dir` on every page, every internal link resolves, every
      visible button clears the 44px touch target.

## Optional

- [ ] **Social links** — `linkedinUrl` / `facebookUrl` / `instagramUrl` are empty in
      `site-details.json`, so no social rows render in the footer. Fill any in and they appear.
- [ ] **Confirm the WhatsApp number** — WhatsApp points at the mobile `972504009594` while the site
      dials `03-5607010`. Deliberate (a landline can't receive WhatsApp), but worth confirming.
