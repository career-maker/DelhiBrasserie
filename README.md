# Delhi Brasserie website

Home page only (`index.html`). Built with plain HTML, SCSS and a small vanilla JS file. The UI language follows the Pandhal site (Gallery Modern titles, Kabel body text, Brittany Signature script, square sweep-fill buttons, gold circular controls, gold-circle preloader, flip-link menu hover) with the Delhi Brasserie red as the brand colour.

## Run it

```
npm install          # once, installs Sass
npm run build        # compiles assets/scss/main.scss to assets/css/main.min.css
npm run watch        # rebuild on save while working
npm run serve        # http://localhost:8000
```

`assets/css/main.min.css` is committed so the site works without a build step.

## Structure

```
index.html
assets/
  scss/
    main.scss               entry point, lists every partial
    abstracts/              _variables (breakpoints), _mixins (bp-* media queries)
    base/                   _tokens (colours), _fonts, _root, _fluid (clamp type scale), _reset, _typography
    components/             buttons, controls, accordion, flip-link, tripadvisor, glass, marquee,
                            preloader, drawer, rail, reveal, ornaments
    layout/                 _header, _location, _footer
    pages/home/             _hero, _offer, _intro, _soho, _cards, _best, _prepost, _why, _experience, _responsive
  css/                      compiled output (main.min.css + map)
  js/main.js                header, drawer, carousel, hero slides, marquee, preloader, open status
  fonts/                    Gallery Modern, ITC Kabel, Brittany Signature (copied from Pandhal)
  images/
    logo.svg                round logo (footer, drawer, preloader, favicons)
    logo-header.svg         header logo
    peacock.svg             ornament taken from the logo
    tripadvisor/            Travellers' Choice 2024 and 2025 badges (transparent PNG)
    restaurant/             graded photographs and detail crops
```

## Working notes

- **Colours and shape**: `assets/scss/base/_tokens.scss` (`--brand` is the logo red, `--gold` and cream are Pandhal's).
- **Type**: every size is a `clamp()` on the fluid unit `--u` in `base/_fluid.scss`. Change the scale there, not per section. Gallery Modern is for titles only; body, FAQ rows and descriptions use ITC Kabel.
- **Breakpoints**: `abstracts/_variables.scss` and `_mixins.scss` (`bp-stack`, `bp-fit`, ...). On desktop (wider than 1100px and at least 600px tall) each home section is one screen tall; below that they stack.
- **Menu hover**: markup is `<a class="fliplink"><span class="Link" data-after="Label"><span>Label</span></span></a>`; styles in `components/_flip-link.scss`. `data-after` must repeat the label text.
- **Special offer**: edit the text in `index.html`. Hide the section with the `hidden` attribute, or empty the heading marked `data-required`.
- **Booking marquee**: the Friday/Saturday notice is written 3 times in a visible group and 3 in a hidden copy so the loop is seamless; edit all six together.
- **Tripadvisor badges**: `<a class="ta-badges">` with the two PNGs. Add `ta-badges--light` on dark photos (turns the black artwork white).
- **Links** use the live site's existing paths (`/menus/main-menu/`, `/reservations/`, ...) to protect SEO. Two menus replace the old four (`/menus/main-menu/` food and desserts, `/menus/drinks-menu/` drinks and wine), so redirect `/menus/desserts-liqueurs-menu/` and `/menus/wine-menu/`. `/pre-post-theatre-dining/` and `/influencer-videos/` are still to confirm.

## To finish before launch

- Paste the Google Analytics and Brevo tags where marked in the `<head>` of `index.html`.
- Check the special offer wording ("during May", code `SPRING1026`) is current.
- The supplied photos are interiors only; food photos ("DB Food Images") were not in the files.
- Check the Pandhal fonts (Gallery Modern, ITC Kabel, Brittany Signature) are licensed for this client.
- `docs/` holds client files (including credentials) and is git-ignored.
