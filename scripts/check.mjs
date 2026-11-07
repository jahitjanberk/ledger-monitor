// Loads every page at phone and desktop size, in light and dark, and reports problems:
// script errors, sideways scrolling, fonts that failed to load, text below WCAG AA
// contrast, and controls with no accessible name. Exits with code 1 if anything fails.
//   node scripts/check.mjs            all pages
//   node scripts/check.mjs air hub    only these pages (also: country, country/gbr, compare, embed)
//   SHOTS=1 node scripts/check.mjs    also save screenshots to scripts/.shots/
import fs from "node:fs";
import path from "node:path";
import { serve, launch, DASHBOARDS, ROOT } from "./lib/browser.mjs";

const only = process.argv.slice(2);
// Page name -> path. The generated pages are checked through a few samples.
const PATHS = { hub: "", about: "about/", ...Object.fromEntries(DASHBOARDS.map((d) => [d, d + "/"])),
  country: "country/", "country/gbr": "country/gbr/", "country/ken": "country/ken/", compare: "compare/?c=GBR,KEN,IND,BRA", embed: "embed/?d=food" };
const pages = Object.keys(PATHS).filter((p) => !only.length || only.includes(p));
const sizes = [
  { name: "desktop", width: 1440, height: 1000, mobile: false },
  { name: "phone", width: 390, height: 844, mobile: true },
];
const schemes = ["light", "dark"];
const shots = process.env.SHOTS ? path.join(ROOT, "scripts/.shots") : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

// Runs in the page. Contrast uses the nearest opaque background behind each text element;
// text over maps, images or gradients is skipped because its background is unknown.
const AUDIT = `(async () => {
  await document.fonts.ready;
  // Browsers report rgb()/rgba() in 0-255, but color-mix() results as color(srgb r g b / a) in 0-1.
  const parse = (c) => {
    const m = c.replace(/^color\\(srgb/, "").match(/[\\d.]+(e-?\\d+)?/g)?.map(Number) ?? [0, 0, 0, 0];
    const k = c.startsWith("color(") ? 255 : 1;
    return { r: m[0] * k, g: m[1] * k, b: m[2] * k, a: m[3] ?? 1 };
  };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mix = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== "none" || e.matches("canvas, img, svg, .maplibregl-map")) return null;
      const c = parse(s.backgroundColor);
      if (c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (const c of layers.reverse()) bg = mix(c, bg);
    return bg;
  };
  const bad = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const el = n.parentElement;
    if (!n.textContent.trim() || !el || el.closest("[hidden], [aria-hidden=true], .maplibregl-map, svg, noscript, .em-skel")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || +s.opacity === 0) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const bg = bgOf(el); if (!bg) continue;
    const fg = mix({ ...parse(s.color), a: parse(s.color).a * op }, bg);
    const [L1, L2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (L1 + 0.05) / (L2 + 0.05);
    const px = parseFloat(s.fontSize), large = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need - 0.05) {
      const key = (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : el.tagName.toLowerCase()) + " " + s.color;
      if (!bad.has(key)) bad.set(key, { sel: key, ratio: +ratio.toFixed(2), need, text: n.textContent.trim().slice(0, 40) });
    }
  }
  const unnamed = [...document.querySelectorAll("a[href], button, select, input, [role=button], [tabindex]:not([tabindex='-1'])")]
    .filter((el) => el.offsetParent && !el.closest("[hidden], .maplibregl-ctrl"))
    .filter((el) => !(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.title || el.textContent.trim() || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest("label")))
    .map((el) => el.outerHTML.slice(0, 80));
  return {
    overflow: document.documentElement.scrollWidth - innerWidth,
    fonts: ["Inter Tight", "JetBrains Mono"].filter((f) => ![...document.fonts].some((x) => x.family.replace(/"/g, "") === f && x.status === "loaded")),
    contrast: [...bad.values()],
    unnamed,
    mounted: !!document.querySelector("#em-main .em-head, .hb-grid, .nf main, .st-main, .eb-fig svg"),
  };
})()`;

// Set CHECK_PORT to run more than one check at a time (it also uses CHECK_PORT + 1000).
const port = Number(process.env.CHECK_PORT ?? 8790);
const srv = serve(port);
const browser = await launch(port + 1000);
let failed = 0;
for (const pg of pages) {
  for (const size of sizes) {
    for (const scheme of schemes) {
      const page = await browser.newPage();
      await page.setViewport({ ...size, scheme });
      await page.goto(srv.url + PATHS[pg], 4500);
      const r = await page.eval(AUDIT);
      const problems = [];
      if (!r.mounted) problems.push("page did not finish loading");
      if (page.errors.length) problems.push(...page.errors.map((e) => "error: " + e));
      if (r.overflow > 0) problems.push(`scrolls sideways by ${r.overflow}px`);
      if (r.fonts.length) problems.push("fonts not loaded: " + r.fonts.join(", "));
      for (const c of r.contrast) problems.push(`contrast ${c.ratio}:1 (needs ${c.need}) ${c.sel} "${c.text}"`);
      for (const u of r.unnamed) problems.push("control has no name: " + u);
      const label = `${pg.padEnd(12)} ${size.name.padEnd(8)} ${scheme.padEnd(5)}`;
      if (problems.length) { failed++; console.log(`✗ ${label}\n    ${problems.join("\n    ")}`); }
      else console.log(`✓ ${label}`);
      if (shots) await page.screenshot(path.join(shots, `${pg.replace(/\W+/g, "-")}-${size.name}-${scheme}.png`));
      page.close();
    }
  }
}
await browser.close();
srv.close();
console.log(failed ? `\n${failed} page views have problems.` : "\nAll page views passed.");
process.exit(failed ? 1 : 0);
