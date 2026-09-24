# Delhi Brasserie website

Static site: plain HTML pages generated from small templates, SCSS, and a few vanilla JS files. The UI language follows the Pandhal site (Gallery Modern titles, Kabel body text, Brittany Signature script, square sweep-fill buttons, gold circular controls, gold-circle preloader, flip-link menu hover) with the Delhi Brasserie red as the brand colour.

Page text is copied word for word from the live site (delhibrasserie.com). The two exceptions are the merged menus (below) and the pre/post-theatre booking page, which is new.

## Run it

```
npm install          # once, installs Sass
npm run build        # Sass -> assets/css/main.min.css, then templates -> HTML pages
npm run build:css    # Sass only
npm run build:html   # templates only (node build.mjs, no dependencies)
npm run watch        # Sass, rebuild on save
npm run watch:html   # templates, rebuild on save
npm run serve        # http://localhost:8000
```

**Flat files and links.** Every page is one flat file in the repo root (`about-us.html`, `history.html`, `menus.html`, ...), with no folders. All links and asset paths are relative, so the site works when you double-click a page, on GitHub Pages under `/DelhiBrasserie/`, and on a normal domain. The source pages keep the old live paths (`/about-us/history/`); the build turns each into a file name (last part of the path + `.html`) and rewrites every link. Two pages can't share a file name, and the build stops if they do. The old live URLs (`/about-us/history/`) therefore change; add redirects on the host if search rankings matter.

The generated HTML (`index.html`, `about-us.html`, ...), `sitemap.xml` and `assets/css/main.min.css` are committed so the site works on any static host without a build step. **Edit `src/`, never the generated pages.**

## Structure

```
src/
  layouts/base.html      page shell: head, header, footer, cookie bar, scripts
  partials/              shared pieces, included with {{> name}}
                         top (header, drawer, rail), footer, location, cookie, cta-book,
                         review-tabs, reservation-widget, schema-home
  pages/                 one file per page: front matter, then the page body
build.mjs                the page builder (front matter keys are listed at the top of the file)
*.html                   generated pages, one flat file each (do not edit)
sitemap.xml              generated
assets/
  scss/                  main.scss lists every partial
    abstracts/ base/ components/ layout/
    pages/home/          home sections
    pages/inner/         banner, content (split, prose, CTA band), menu, reviews, gallery, blog, forms, booking, error
  css/                   compiled output (main.min.css + map)
  js/main.js             header, drawer, carousel, hero, preloader, cookie consent, open status
  js/modules/            loaded only on pages that list them in front matter (`scripts: gallery`):
                         gallery (lightbox), blog (show more), menu (chip highlight),
                         forms (contact, feedback, reservation), booking (pre/post-theatre wizards),
                         toc (contents list on legal pages and articles)
  fonts/  images/  video/  files/
    images/live/         photographs from the live site (page images, gallery, blog/ featured images, posts/ in-article images)
    images/restaurant/   graded photographs used for banners
    files/               Delhi-Brasserie-Restaurant-Menu-Spring-2025.pdf
    video/               influencer video (compressed to 720p) and poster
```

### Pages

| Page | Path | Notes |
| --- | --- | --- |
| Home | `index.html` | fits one screen per section on desktop |
| About, History, Local attractions | `about-us.html`, `history.html`, `local-attractions.html` | live text |
| Gallery | `gallery.html` | 20 photos, lightbox |
| Menu landing | `menus.html` | two tiles + takeaway text + PDF |
| Food menu | `main-menu.html` | main menu + desserts and liqueurs, combined |
| Drinks menu | `drinks-menu.html` | drinks + wine, combined |
| Pre- and post-theatre dining | `pre-post-theatre-dining.html` | two 5-step booking wizards |
| Blog + 35 articles | `new-blog.html`, `<slug>.html` | article file names are the live slugs |
| Reviews (critics) + Influencer videos | `reviews.html`, `influencer-videos.html` | tab links at the top of both |

To add an influencer video: in `src/pages/influencer-videos/index.html` copy the `<article class="vcard">`, change the file and title, and point the Instagram / Facebook / TikTok links at that video's posts. Put the compressed mp4 in `assets/video/` (keep files well under GitHub's 100 MB limit).
| Customer feedback | `customer-feedback.html` | linked from the side rail |
| FAQ, Contact, Reservations, Special offers | `frequently-asked-questions.html`, `contact-us.html`, `reservations.html`, `special-offers.html` | live text |
| Privacy, Cookie policy, Terms | `privacy-policy.html`, `cookie-policy.html`, `terms-conditions.html` | live text |
| 404 | `404.html` | |
| Old menu URLs | `desserts-liqueurs-menu.html`, `wine-menu.html` | small redirect pages to the merged menus |

### Adding or changing a page

1. Create `src/pages/<path>/index.html` with front matter and the body. Front matter keys: `title`, `description`, `path` (the logical path, e.g. `/about-us/history/`; the file becomes `history.html`), `h1`, `banner`, `crumb`, `parents`, `scripts`, ...
2. `npm run build:html`. The page, its breadcrumb, the active state in the menus and the sitemap entry are generated.

## Working notes

- **Colours and shape**: `assets/scss/base/_tokens.scss` (`--brand` is the logo red, `--gold` and cream are Pandhal's).
- **Type**: every size is a `clamp()` on the fluid unit `--u` in `base/_fluid.scss`. The fit-to-screen scale is for the home page only (`html.is-home`); inner pages use the readable width-based scale. Gallery Modern is for titles only; body, FAQ rows and descriptions use ITC Kabel.
- **Breakpoints**: `abstracts/_variables.scss` and `_mixins.scss` (`bp-stack`, `bp-fit`, ...).
- **Menu hover**: `<a class="fliplink"><span class="Link" data-after="Label"><span>Label</span></span></a>`; `data-after` must repeat the label text.
- **Menus**: the price lists are HTML (`.menu-item` with name, aside, price, description). The section chips under the banner are generated from the section headings. The PDF is the live site's "Download Our Food Menu" file.
- **Special offer** (home): edit the text in `src/pages/index.html`. Hide the section with `hidden`, or empty the heading marked `data-required`.
- **Cookie consent**: bottom bar with Cookie settings, Read more and Accept, plus a settings dialog; the choice is stored in the `db_consent` cookie for 12 months and the footer "Cookie settings" button reopens it. Hold back a script until consent by writing it as `<script type="text/plain" data-cookie="analytics" src="..."></script>` (categories `analytics`, `functional`). Put the Google Analytics and Brevo tags in this form (see the comments in `src/layouts/base.html`). The bar text says cookies are assumed OK unless opted out; UK law (PECR/UK GDPR) generally needs opt-in consent for analytics, so consider a stricter default with the site owner.

## Connect before launch

- **Reservations (ReDi)**: the live site runs the ReDi WordPress plugin, which a static site cannot host. `reservations.html` has a placeholder form (`src/partials/reservation-widget.html`) with the same fields. Paste the ReDi embed snippet there, or set `data-endpoint` on the form. Without an endpoint the form opens the visitor's e-mail app with the booking filled in.
- **Pre/post-theatre wizards**: `src/pages/pre-post-theatre-dining/index.html`. Each wizard has `data-availability` (GET `?type=&date=&guests=` returning `{"slots":["17:30", ...]}`) and `data-endpoint` (POST JSON). Until both are set, table times are generated from the opening hours in `assets/js/modules/booking.js` (`CFG`) and the confirmation screen says "Preview only" and sends nothing. Assumptions to confirm with the restaurant: last table time is 30 minutes before closing; recommended arrival is 2 h to 1 h 30 before curtain up; the "2-3 minute walk" line shows for Prince Edward Theatre only.
- **Contact and feedback forms**: set `data-endpoint` (Brevo, Formspree or your own handler). Without it they open the visitor's e-mail app.
- **Google Analytics and Brevo**: paste the tags where marked in `src/layouts/base.html`, in the consent-gated form.
- **`robots.txt`** still says `Disallow: /`. Change it when the site goes live.
- **Fonts**: check the Pandhal fonts (Gallery Modern, ITC Kabel, Brittany Signature) are licensed for this client.
- **Live-site details to check**: opening times differ between the live footer and pages; two live blog posts have no featured image (our own photographs are used); one live blog image (`/wp-content/uploads/2024/11/3.jpg`) is broken on the live site and was left out; `/sloane-square/` was not carried over.
- `docs/` holds client files (including credentials) and is git-ignored.
