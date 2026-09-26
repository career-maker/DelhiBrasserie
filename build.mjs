// Static page builder (no dependencies).
//
//   src/layouts/base.html      page shell (head, header, footer, cookie bar, scripts)
//   src/partials/*.html        shared pieces, included with {{> name}}
//   src/pages/**/*.html        one file per page: a small front matter block, then the page body
//
// Output is flat files next to index.html: /about-us/ becomes about-us.html, /about-us/history/ becomes history.html.
// Run with:  npm run build:html   (npm run build also compiles the Sass)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const SITE = 'https://delhibrasserie.com';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, 'utf8');
};

// ---------- asset version (cache busting) ----------
const hashOf = (files) => {
  const h = crypto.createHash('md5');
  files.forEach((f) => { if (fs.existsSync(f)) h.update(fs.readFileSync(f)); });
  return h.digest('hex').slice(0, 8);
};
const jsFiles = ['main.js', ...fs.readdirSync(path.join(ROOT, 'assets/js/modules')).map((f) => 'modules/' + f)];
const VERSION = hashOf([path.join(ROOT, 'assets/css/main.min.css'), ...jsFiles.map((f) => path.join(ROOT, 'assets/js', f))]);

// ---------- partials ----------
const partialCache = {};
const partial = (name) => {
  if (!partialCache[name]) {
    const p = path.join(SRC, 'partials', `${name}.html`);
    if (!fs.existsSync(p)) throw new Error(`Missing partial: ${name}`);
    partialCache[name] = read(p);
  }
  return partialCache[name];
};
const include = (html) => {
  let out = html;
  for (let i = 0; i < 6 && /\{\{>\s*[\w-]+\s*\}\}/.test(out); i++) {
    out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  }
  return out;
};

// ---------- front matter ----------
const parsePage = (file) => {
  const raw = read(file).replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`No front matter: ${file}`);
  const meta = {};
  m[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return { meta, body: m[2] };
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : (e.name.endsWith('.html') ? [p] : []);
});

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/gi, '&amp;').replace(/"/g, '&quot;');
const abs = (p) => (p ? (/^https?:/.test(p) ? p : SITE + p) : '');

const banner = (meta) => {
  if (!meta.banner || meta.banner === 'none') return '';
  const parents = (meta.parents || '').split(';').filter(Boolean).map((x) => x.split('|'));
  const crumbs = [['Home', '/'], ...parents]
    .map(([label, href]) => `<li><a href="${href}">${label}</a></li>`)
    .join('');
  const here = meta.crumb || meta.h1 || meta.title;
  const pos = meta.banner_pos ? ` style="object-position:${meta.banner_pos}"` : '';
  const cls = meta.banner_class ? ` page-banner--${meta.banner_class}` : '';
  return `<section class="page-banner${cls}" aria-label="Page title">
  <img class="page-banner-img" src="${meta.banner}" width="2000" height="1333" alt=""${pos} fetchpriority="high">
  <div class="wrap page-banner-in">
    ${meta.kicker ? `<p class="script">${meta.kicker}</p>` : ''}
    <h1>${meta.h1 || meta.title}</h1>
    <nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs}<li aria-current="page">${here}</li></ol></nav>
  </div>
</section>`;
};

// mark the current page in the header and drawer menus (only links inside the <nav> blocks)
const markActive = (html, pagePath) => {
  const tag = (attrs, href) => {
    const exact = href === pagePath;
    const section = href !== '/' && pagePath.startsWith(href);
    if (!exact && !section) return `<a ${attrs}>`;
    let a = attrs;
    if (/class="/.test(a)) a = a.replace(/class="([^"]*)"/, 'class="$1 active"');
    else a += ' class="active"';
    if (exact) a += ' aria-current="page"';
    return `<a ${a}>`;
  };
  return html.replace(/<nav [^>]*class="[^"]*(?:nav|drawer-main|drawer-extra)[^"]*"[\s\S]*?<\/nav>/g, (nav) =>
    nav.replace(/<a ([^>]*?)>/g, (all, attrs) => {
      const m = attrs.match(/href="([^"]+)"/);
      return m && m[1].startsWith('/') ? tag(attrs, m[1]) : all;
    }));
};

const articleSchema = (meta) => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.h1 || meta.title,
    image: abs(meta.og_image || ''),
    datePublished: meta.published || undefined,
    dateModified: meta.modified || meta.published || undefined,
    author: { '@type': 'Person', name: meta.author || 'Rishi M' },
    publisher: { '@type': 'Organization', name: 'The Delhi Brasserie', logo: { '@type': 'ImageObject', url: abs('/assets/images/logo.png') } },
    mainEntityOfPage: meta.url,
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
};

// ---------- flat files + portable links ----------
// Every page is one flat file in the site root: /about-us/history/ -> history.html, /menus/ -> menus.html, / -> index.html.
// Page paths in the sources stay logical (/about-us/history/); the build maps them to file names and writes every link and
// asset path relative to the page, so the site works when opened straight from disk (file://), on GitHub Pages under a
// sub-path, and on a normal domain. 404.html keeps root paths because a host serves it from any URL.
const fileFor = (p) => (p === '/' ? 'index.html'
  : p.endsWith('.html') ? p.slice(1)
    : p.replace(/\/$/, '').split('/').pop() + '.html');
const urlFor = (file) => SITE + (file === 'index.html' ? '/' : '/' + file);

const pageMap = {};                                   // logical path -> file name
const pages = walk(path.join(SRC, 'pages')).map((file) => {
  const { meta, body } = parsePage(file);
  const rel = path.relative(path.join(SRC, 'pages'), file).split(path.sep).join('/');
  meta.path = meta.path || '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  meta.file = fileFor(meta.path);
  if (Object.values(pageMap).includes(meta.file)) throw new Error(`Two pages want the file name ${meta.file}: ${meta.path}`);
  pageMap[meta.path] = meta.file;
  return { meta, body };
});

// links to pages: /about-us/history/#x -> /history.html#x
const mapPageLinks = (html) => html.replace(/(\shref)="(\/[^"?#]*)([?#][^"]*)?"/g, (all, k, p, rest) =>
  (p in pageMap ? `${k}="/${pageMap[p]}${rest || ''}"` : all));
const rootRel = (u) => (u.startsWith('/') && !u.startsWith('//') ? u.slice(1) : u);
const relativize = (html) => html
  .replace(/(\s(?:href|src|poster))="([^"]*)"/g, (all, k, v) => `${k}="${rootRel(v)}"`)
  .replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (all, q, u) => `url(${q}${rootRel(u)}${q})`);

// ---------- build ----------
const layout = read(path.join(SRC, 'layouts', 'base.html'));
const sitemap = [];
let count = 0;

pages.forEach(({ meta, body }) => {
  const pagePath = meta.path;
  const is404 = meta.file === '404.html';

  // old live URLs that now live inside a merged page: a small redirect page (static hosting has no server rules)
  if (meta.redirect) {
    const m = meta.redirect.match(/^([^#]*)(#.*)?$/);
    const to = (pageMap[m[1]] || 'index.html') + (m[2] || '');
    const html = `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="UTF-8"><title>${esc(meta.title || 'Redirecting')}</title>
<meta name="robots" content="noindex"><link rel="canonical" href="${urlFor(pageMap[m[1]] || 'index.html')}">
<meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)});</script></head>
<body><p>This page has moved to <a href="${to}">${to.replace(/#.*/, '')}</a>.</p></body></html>
`;
    write(path.join(ROOT, meta.file), html);
    count++;
    return;
  }

  meta.url = urlFor(meta.file);
  const vars = {
    title: esc(meta.title || 'The Delhi Brasserie'),
    description: esc(meta.description || ''),
    canonical: meta.url,
    og_type: meta.og_type || 'website',
    og_description: esc(meta.og_description || meta.description || ''),
    og_image_abs: abs(meta.og_image || '/assets/images/restaurant/storefront.webp'),
    preload: meta.preload_image ? `<link rel="preload" as="image" href="${meta.preload_image}" fetchpriority="high">` : (meta.banner && meta.banner !== 'none' ? `<link rel="preload" as="image" href="${meta.banner}" fetchpriority="high">` : ''),
    robots: meta.robots ? `<meta name="robots" content="${meta.robots}">` : '',
    version: VERSION,
    html_class: meta.layout === 'home' ? 'is-home' : 'is-inner',
    body_class: meta.body_class || 'page-inner',
    banner: banner(meta),
    scripts: (meta.scripts || '').split(',').map((s) => s.trim()).filter(Boolean)
      .map((s) => `<script src="/assets/js/modules/${s}.js?v=${VERSION}" defer></script>`).join('\n'),
    schema: meta.schema === 'home' ? partial('schema-home')
      : meta.schema === 'article' ? articleSchema(meta) : '',
  };

  let html = layout;
  html = html.replace('{{content}}', () => body);
  html = include(html);
  html = html.replace(/\{\{(\w+)\}\}/g, (all, k) => (k in vars ? vars[k] : all));
  html = markActive(html, pagePath);
  html = mapPageLinks(html);
  if (!is404) html = relativize(html);
  html = html.replace(/\n{3,}/g, '\n\n');          // tidy blank runs

  write(path.join(ROOT, meta.file), html);
  count++;
  if (!meta.robots || !meta.robots.includes('noindex')) {
    sitemap.push({ loc: meta.url, lastmod: meta.modified || meta.published || '' });
  }
});

// ---------- sitemap ----------
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  .concat(sitemap.sort((a, b) => a.loc.localeCompare(b.loc)).map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`))
  .concat('</urlset>', '');
write(path.join(ROOT, 'sitemap.xml'), sm.join('\n'));

console.log(`Built ${count} pages (asset version ${VERSION}) and sitemap.xml`);
