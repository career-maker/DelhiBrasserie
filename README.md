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
