// The page shell shared by the generated pages (country profiles, compare): the same
// Content-Security-Policy, theme script, fonts and top bar as the hub and dashboards.
// `depth` is how many folders below the site root the page sits, for relative links.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./browser.mjs";

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Copied from index.html so every page carries the same policy. The two hashes allow the
// inline theme script below and the dashboards' load check; see _headers.
const CSP = fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/)[1];
const THEME = `<script>try{var t=localStorage.getItem("em-theme");t&&(document.documentElement.dataset.theme=t)}catch(e){}</script>`;
const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%233B50B5'/%3E%3Cpath d='M6 10h20M6 16h20M6 22h20' stroke='%23fff' stroke-opacity='.45' stroke-width='2'/%3E%3Cpath d='M7 23l6-7 5 3 8-10' fill='none' stroke='%23fff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

/** A full HTML page. `body` is the HTML inside <main>; `scripts` are paths relative to the site root. */
export function page({ title, description, depth, body, scripts = [], modules = [], nav = "" }) {
  const up = "../".repeat(depth);
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${esc(title)} · Ledger Monitor</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ledger Monitor">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${up}assets/og/hub.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ICON}">
<link rel="preload" href="${up}assets/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${up}assets/fonts/jetbrains-mono-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}assets/fonts.css">
<link rel="stylesheet" href="${up}assets/site.css">
<link rel="alternate" type="application/atom+xml" title="Ledger Monitor updates" href="${up}feed.xml">
${THEME}
</head>
<body>
<div class="st">
  <a class="hb-skip" href="#main">Skip to the content</a>
  <nav class="hb-bar" aria-label="Site">
    <a class="hb-brand" href="${up || "./"}"><i aria-hidden="true"></i>Ledger Monitor</a>
    <span class="hb-bar-r">
      ${nav}<a class="hb-btn" href="${up}country/">Countries</a>
      <a class="hb-btn" href="${up}compare/">Compare</a>
      <button type="button" class="hb-btn" id="hb-theme" aria-label="Switch light or dark theme">◐</button>
    </span>
  </nav>
  <main id="main" class="st-main" tabindex="-1">
${body}
  </main>
  <footer class="hb-foot">
    <span>Ledger Monitor, by <a href="https://github.com/jahitjanberk" rel="author">jahit</a> · <a href="${up}about/">About</a> · code MIT · <a href="https://github.com/jahitjanberk/ledger-monitor/blob/main/DATA_LICENSE.md" target="_blank" rel="noopener noreferrer">data licences</a></span>
    <span><a href="https://github.com/jahitjanberk/ledger-monitor/blob/main/METHODOLOGY.md" target="_blank" rel="noopener noreferrer">Methodology</a> · <a href="${up}feed.xml">Updates feed</a></span>
  </footer>
</div>
<script src="${up}assets/site.js"></script>
${scripts.map((s) => `<script src="${up}${s}"></script>`).join("\n")}${modules.map((s) => `<script type="module" src="${up}${s}"></script>`).join("\n")}
</body>
</html>
`;
}
