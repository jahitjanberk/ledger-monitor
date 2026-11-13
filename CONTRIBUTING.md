# Contributing

Corrections and better sources are the most useful contributions.

## Reporting a wrong or out-of-date number

[Open an issue](https://github.com/jahitjanberk/ledger-monitor/issues/new/choose) and pick **Report a wrong or out-of-date number**. It asks for:

- the dashboard and the number (a link to the section helps: each section heading has a **Copy link** button)
- what you think it should be
- a link to the source, ideally the original publisher rather than a news report

Corrections are listed on the [About page](about/index.html).

## Suggesting new data

Open an issue with the **Suggest new data** form, describing the dataset, who publishes it, how often it updates, and its licence. Data that can't be redistributed can't be added.

## Working on the site

This repository holds the built site: plain HTML, CSS and JavaScript with no build step. You need [Node.js](https://nodejs.org/) 18 or later to run the helper scripts.

```sh
node scripts/serve.mjs          # preview at http://localhost:8765/
node scripts/check.mjs          # test every page (needs Microsoft Edge or Chrome)
```

The dashboards won't load if you open the HTML files directly from disk, because browsers block their scripts and data on `file://` pages. Use the preview server.

`scripts/check.mjs` loads every page at phone and desktop sizes in light and dark mode. It reports script errors, sideways scrolling, fonts that didn't load, text below WCAG AA contrast and controls with no accessible name. Please run it before opening a pull request. If your browser isn't in the default location, set `BROWSER` to its path.

### Where things live

| Path | What it is |
|---|---|
| `index.html`, `hub.js` | The home page |
| `<dashboard>/index.html` | Each dashboard's page |
| `<dashboard>/assets/<dashboard>.js` | The dashboard's layout and charts |
| `<dashboard>/assets/data.js` | The figures the dashboard displays |
| `data/<dashboard>/` | The published CSV and JSON tables, `sources.json` and a data page |
| `assets/charts.js`, `assets/index-*.css` | The shared shell: header, source drawer, charts and maps |
| `assets/em.js`, `assets/em.css` | Shared improvements loaded on every dashboard: section index, headline charts, method notes, accessibility fixes |
| `about/`, `404.html` | The About and page-not-found pages |
| `assets/icons/`, `site.webmanifest` | The home-screen icons (rendered from `icon.svg`, the same mark as the favicon) and the web manifest that names them |
| `scripts/` | Helper scripts, described below |

A dashboard reads its figures from `<dashboard>/assets/data.js`, while the downloads come from `data/<dashboard>/`. **When you change a figure, update both.**

### Helper scripts

| Command | What it does |
|---|---|
| `node scripts/hub-sparks.mjs` | Redraws the small charts on the home page from `data/` |
| `node scripts/og-images.mjs` | Renders the link-preview images in `assets/og/` |
| `node scripts/preload-hints.mjs` | Updates each dashboard's script preload list. Run it after changing imports |
| `node scripts/seo.mjs https://your-site/` | Writes full preview-image URLs, canonical links, Dataset markup, `sitemap.xml` and `robots.txt` |

When you release a change, update `UPDATED` in `assets/em.js` and add a line to the change list on the About page.

## Security

Please report security problems privately, as described in [SECURITY.md](SECURITY.md).
