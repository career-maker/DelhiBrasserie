# Delhi Brasserie: project rules

## Inner pages switch (`site-mode.json`)

- User says **"hide inner pages"** -> set `"innerPages": "hidden"` in `site-mode.json`, run `npm run build`, commit and push. Every page except `index.html` and `404.html` then builds as the Coming Soon page (header and footer kept). Template: `src/partials/coming-soon.html`, styles: `assets/scss/pages/inner/_coming-soon.scss`.
- User says **"show all inner pages"** -> set `"innerPages": "shown"`, run `npm run build`, commit and push. Real page content returns (it is still in `src/pages/`, nothing is deleted).
- Current state: see `site-mode.json`.
