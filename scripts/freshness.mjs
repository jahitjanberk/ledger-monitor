// Lists the sources behind each dashboard that are due for a new edition, from the
// "published" date in data/<dashboard>/sources.json and how often each source is released.
//   node scripts/freshness.mjs            report; exits 0
//   node scripts/freshness.mjs --strict   exits 1 if anything is overdue (for CI)
//   node scripts/freshness.mjs --all      also list the sources that are up to date
// Only recurring datasets are checked. One-off reports, press releases and reference pages
// cited for a single fact don't go stale, so they are counted but not listed.
import fs from "node:fs";
import path from "node:path";
import { ROOT, DASHBOARDS } from "./lib/browser.mjs";

// Months between editions, by source id. A source is overdue once it is older than this
// plus a month's grace, since publishers rarely release on the same day each cycle.
const CADENCE = {
  // Monthly or more often
  portwatch: 1, "wb-pinksheet": 1, "fao-ffpi": 1, "c3s-pulse": 1, "c3s-oct2026": 1, "metoffice-haduk": 1, "ons-mm23": 1, "ons-psf": 1,
  "faostat-cp": 3,
  // Twice a year
  "imf-fm": 6, "imf-weo": 6, unoosa: 6, ussf: 6, "top500-2026": 6, "aws-regions": 6, "azure-regions": 6, "gcp-regions": 6, "azure-latency": 6,
  // Yearly
  "fao-ffpi-real": 12, "ember-yearly": 12, satpm: 12, "who-sdg1162": 12, "iqair-2025": 12, "faostat-fs": 12, "faostat-cahd": 12, sofi2026: 12,
  grfc2026: 12, "usda-ers": 12, "wb-health": 12, "wb-edu": 12, "wb-pop": 12, "unctad-wod": 12, "owid-anom": 12, hadcrut5: 12, "wb-cckp": 12,
  "fao-sdg642": 12, "aquastat-wdi": 12, "aquastat-pc": 12, "usgs-mcs": 12, "iea-refined": 12, "iea-gcmo2026": 12, "oecd-inventory": 12,
  "demographia-2026": 12, "ons-2025": 12, "fbi-ic3-2025": 12, "ukfinance-2026": 12, "accc-2025": 12, "cafc-2025": 12, "spf-2025": 12,
  "i4c-2025": 12, "gasa-global-2025": 12, "telegeography-2021": 12, "epoch-chips-2026": 12, "cso-2025": 12, "ukhsa-2026": 12,
  // Less often
  "ihme-gbd2023": 24, "jmp-2025": 24, "eia-chokepoints": 24, "lbnl-2024": 36,
};

const args = new Set(process.argv.slice(2));
const today = new Date();
// "2026" and "2026-05" are read as the last day of that year or month, so a vague date never
// makes a source look older than it is.
const parse = (s) => {
  const m = String(s ?? "").match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
  if (!m) return null;
  const [y, mo, d] = [+m[1], m[2] ? +m[2] : 12, m[3] ? +m[3] : null];
  return d ? new Date(Date.UTC(y, mo - 1, d)) : new Date(Date.UTC(y, mo, 0));
};
const months = (a, b) => (b - a) / (1000 * 60 * 60 * 24 * 30.44);

const rows = [];
let oneOff = 0, undated = 0;
for (const dash of DASHBOARDS) {
  const { sources } = JSON.parse(fs.readFileSync(path.join(ROOT, `data/${dash}/sources.json`), "utf8"));
  for (const [id, s] of Object.entries(sources)) {
    const every = CADENCE[id];
    if (!every) { oneOff++; continue; }
    const pub = parse(s.published);
    if (!pub) { undated++; rows.push({ dash, id, published: String(s.published ?? "none"), age: null, every, due: true, url: s.url }); continue; }
    const age = months(pub, today);
    rows.push({ dash, id, published: String(s.published), age, every, due: age > every + 1, url: s.url });
  }
}

const due = rows.filter((r) => r.due).sort((a, b) => (b.age ?? 1e9) / b.every - (a.age ?? 1e9) / a.every);
const show = args.has("--all") ? [...rows].sort((a, b) => a.dash.localeCompare(b.dash) || a.id.localeCompare(b.id)) : due;
const pad = (s, n) => String(s).padEnd(n);
if (show.length) {
  console.log(`${pad("dashboard", 12)} ${pad("source", 22)} ${pad("published", 11)} ${pad("age", 10)} ${pad("released", 14)} status`);
  for (const r of show) {
    const age = r.age == null ? "?" : `${Math.floor(r.age)} months`;
    const every = r.every === 1 ? "monthly" : r.every === 12 ? "yearly" : `every ${r.every} mo`;
    console.log(`${pad(r.dash, 12)} ${pad(r.id, 22)} ${pad(r.published, 11)} ${pad(age, 10)} ${pad(every, 14)} ${r.due ? "DUE  " + (r.url ?? "") : "ok"}`);
  }
  console.log("");
}
console.log(`${rows.length} recurring sources checked: ${due.length} due for a new edition${undated ? ` (${undated} with no usable date)` : ""}. ${oneOff} one-off sources not checked.`);
if (due.length) console.log("When you update one, change its \"published\" date in data/<dashboard>/sources.json (or the builder in scripts/build/), and add an entry to docs/updates.json.");
process.exit(args.has("--strict") && due.length ? 1 : 0);
