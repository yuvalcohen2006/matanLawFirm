# site-details.json - field guide (English)

This is the **single place** in the whole site where the office's real details live. Every part of the site (header, footer, forms, WhatsApp button, accessibility page) reads only from here. Any value that still starts with `PLACEHOLDER` counts as "not filled in yet" and the part that uses it is hidden until you fill it.

| Field | What to put | Example |
|---|---|---|
| `phone` | Phone shown on the site (also click-to-call) | `054-1234567` |
| `email` | Public contact email shown on the site | `matan@abirlev.com` |
| `leadDestinationEmail` | Where leads are emailed. Must match the Web3Forms account email | `Matan@abirlev.com` |
| `officeAddress` | Office address (footer + contact page) | `דרך מנחם בגין 1, תל אביב` |
| `whatsappNumber` | WhatsApp number, international format, **digits only**, no `+` | `972541234567` |
| `whatsappGreeting` | Pre-filled WhatsApp message, in Hebrew (auto-encoded) | already filled |
| `officeHours` | Office hours | `ימים א׳-ה׳, בתיאום מראש` |
| `linkedinUrl` / `facebookUrl` / `instagramUrl` | Social links. Empty `""` hides the icon | `https://linkedin.com/in/...` |
| `domain` | Full site address incl. `https://` - used for SEO & sitemap | `https://www.abirlev.com` |
| `accessibilityCoordinatorName` | Name shown on the accessibility statement | `עו"ד מתן אביר לב` |
| `accessibilityCoordinatorContact` | Email or phone for accessibility questions | `matan@abirlev.com` |
| `logoPath` | Logo file path inside `public/` | `/logo.png` |
| `portraitPath` | Portrait photo path inside `public/` | `/images/matan.webp` |
| `googleAnalyticsId` | GA4 ID (optional - empty = not loaded at all) | `G-XXXXXXX` |
| `metaPixelId` | Meta Pixel ID (optional - empty = not loaded) | `1234567890` |

**Tips**
- To leave a field blank, use empty quotes `""` - don't delete the line.
- After any change, rebuild (`npm run build`) and re-deploy.
