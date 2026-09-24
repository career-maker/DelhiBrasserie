# Delhi Brasserie website

Built from the brand-neutral multi-page static HTML/CSS/JS template below. No build step.

## Delhi Brasserie: home page (`index.html`)

Only the home page is built so far. It follows `docs/Home Page .pdf`; the copy is the live site's existing text (kept for SEO).

| Part | Files |
|---|---|
| Home page (header, sections, footer are inline so search engines see them) | `index.html` |
| Shared header, drawer, sticky rail, location block, footer, buttons | `delhi.css` |
| Sticky header, drawer, slider, notice ticker, reveal, hide-empty | `delhi.js` |
| Colours (logo red primary, deep red bands, gold accents) | `theme.css` |
| Logo (from `images/logo.pdf`), favicons, Tripadvisor-style badges | `images/logo.svg`, `images/favicon*`, `images/badge-winner-*.svg` |
| Restaurant photos, resized from `docs/Drive resources` | `images/restaurant/` |

**Special offer section** (section 2): edit its text in `index.html`. To hide it, add the `hidden` attribute to `<section id="special-offer">`, or empty the heading marked `data-required` and the script hides it.

**Links** use the live site's existing URL paths (`/menus/main-menu/`, `/reviews/`, `/reservations/`, `/new-blog/` and so on) so SEO is kept. Two menus replace the old four: `/menus/main-menu/` is the Food Menu (mains and desserts, anchor `#desserts`) and `/menus/drinks-menu/` is the Drinks Menu (drinks and wine, anchor `#wine`). Set up 301 redirects from `/menus/desserts-liqueurs-menu/` and `/menus/wine-menu/`. New paths still to confirm: `/pre-post-theatre-dining/` and `/influencer-videos/`.

**To finish before launch**
- Replace the generated Tripadvisor badge (`images/badge-winner-*.svg`) with the official Winner 2024/2025 artwork.
- Paste the Google Analytics and Brevo tags where marked in the `<head>` of `index.html`.
- Reservations link to `/reservations/` (existing Redi widget page, unchanged).
- Special offer wording ("during May", code `SPRING1026`) is copied from the live offers page; check it is current.
- Food photos ("DB Food Images") and the "Watch Our Video" clip were not in the supplied files. The location block has a map instead.
- YouTube is in the requirements PDF but no URL was supplied; Facebook, Instagram, X and TikTok (from the client doc) are linked.
- `docs/` holds client files (including credentials) and is git-ignored.

# Website Template

Brand-neutral, multi-page static HTML/CSS/JS template. No build step.

## Run locally

`header.html` and `footer.html` are loaded with `fetch()`, so open the site through a local server, not by double-clicking the files:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home |
| `about.html` | About us |
| `products.html` | Product listing |
| `product-detail.html` | Single product |
| `blog.html` / `blog-detail.html` | Blog listing / article |
| `contact.html` | Contact form, info, map area |
| `privacy-policy.html` / `terms.html` | Legal pages (placeholder text) |
| `header.html` / `footer.html` | Shared header and footer, injected by `components.js` |

## Starting a new project — checklist

1. **Colours** — edit `theme.css` (`--color-primary`, `--color-accent`, ...). Gold/teal SVG icons in `images/icons/` use hard-coded colours; edit the `stroke` value in those files to match.
2. **Fonts** — Google Fonts links in each page `<head>` (Playfair Display, Manrope, Alex Brush). Swap the `<link>` and the `font-family` names.
3. **Logo** — replace `images/logo.svg` and `images/favicon.svg` (or change the paths in `header.html`, `footer.html` and each page's `<link rel="icon">`).
4. **Brand text** — search and replace these placeholders across all `.html` files:

   | Placeholder | Replace with |
   |---|---|
   | `Your Brand` | Short brand name |
   | `Your Company Name` | Legal company name |
   | `+00 000 000 0000` / `tel:+000000000000` | Phone number |
   | `hello@yourdomain.com` | Email |
   | `Your Street Address`, `City, Country` | Address |
   | `Your City`, `Your Country` | Legal jurisdiction (privacy/terms) |

5. **Images** — every image under `images/` is a grey placeholder showing its size. Replace each file with a real image of the **same aspect ratio** and keep the file name (or update the `src`). Client logos in `images/home/client-*.png` sit on the primary colour.
6. **Video** — the home page hero is an image. To use video, follow the comment in `index.html` and drop the file in `videos/`. The two "play" buttons (`data-video="videos/your-video.mp4"`) open that file in a lightbox.
7. **Content** — headlines, paragraphs, product cards, blog cards, counters and testimonials are all placeholder text. Duplicate a card block to add more items.
8. **Map** — `contact.html` shows a dotted world map with a fixed pin (`.map-marker`, positioned in the page's inline CSS). Move the pin to your location or replace `.map-placeholder` with a Google Maps `<iframe>`.
9. **SEO** — update `<title>` and `<meta name="description">` per page. `robots.txt` currently blocks all crawlers (`Disallow: /`); change it before launch.
10. **Legal pages** — `privacy-policy.html` and `terms.html` are generic starting text. Have them reviewed for your business and jurisdiction.

## Structure

```
theme.css          brand colours (CSS variables)
components.css     shared header / footer / drawer styles
components.js      loads header + footer, menu, scroll effects, reveal animation
images/            placeholders, logo, icons
videos/            put your video files here
```

Each page also has its own inline `<style>` block for page-specific layout.

The footer credit line ("Designed & Developed by") lives in `footer.html`; edit or remove it.
