// Builds data/orbit/* and orbit/assets/data.js for the Who Owns Orbit dashboard from scripts/.raw/orbit
// (Our World in Data's processing of the UNOOSA Online Index and of the US Space Force's Space-Track catalogue).
//   node scripts/build/orbit.mjs        (raw downloads in scripts/.raw/orbit/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv } from "../lib/csv.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "orbit");
const OUT = path.join(REPO, "data/orbit");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "orbit/assets"), { recursive: true });
const csv = (slug) => readCsv(path.join(RAW, `owid_${slug}.csv`));
const meta = (slug) => JSON.parse(fs.readFileSync(path.join(RAW, `owid_${slug}.metadata.json`), "utf8"));

const SOURCES = {
  unoosa: {
    publisher: "UN Office for Outer Space Affairs (processed by Our World in Data)",
    title: "Online Index of Objects Launched into Outer Space",
    url: "https://www.unoosa.org/unoosa/en/osoindex/search/search-objects.html",
    published: "2026-02-25",
    method: "reported",
    notes: "Satellites, probes, landers, crewed spacecraft and space station parts registered by the launching state or organisation, by year of launch. Debris and rocket bodies are not counted. Late registrations mean recent years can rise.",
  },
  ussf: {
    publisher: "US Space Force, 18th Space Defense Squadron (processed by Our World in Data)",
    title: "Number of objects in space (Space-Track catalogue)",
    url: "https://www.space-track.org/",
    published: "2026-01-08",
    method: "reported",
    notes: "Tracked objects still in orbit at the end of each year; objects that re-enter are removed. Small debris is not tracked.",
  },
  "esa-2025": {
    publisher: "European Space Agency",
    title: "ESA Space Environment Report 2025",
    url: "https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2025",
    published: "2025-04-01",
    method: "reference",
    notes: "Data to the end of 2024.",
  },
  "mcdowell-2026": {
    publisher: "Washington Times, reporting tracking data compiled by Jonathan McDowell",
    title: "SpaceX crosses 10,000-satellite threshold, owning two-thirds of active satellites",
    url: "https://m.washingtontimes.com/news/2026/mar/17/spacex-crosses-10000-satellite-threshold-owning-two-thirds-active/",
    published: "2026-03-17",
    method: "reference",
  },
  "natural-earth": {
    publisher: "Natural Earth (via the world-atlas package)",
    title: "Admin 0 countries, 1:110m",
    url: "https://www.naturalearthdata.com/",
    published: "2026",
    method: "reference",
    notes: "Public domain. Used to match countries to map shapes.",
  },
};

// The OWID files carry the date of their last update; stop if it no longer matches SOURCES, so the date is updated by hand.
for (const [slug, id] of [["yearly-number-of-objects-launched-into-outer-space", "unoosa"], ["cumulative-number-of-objects-launched-into-outer-space", "unoosa"], ["space-objects-by-orbit", "ussf"], ["low-earth-orbits-objects", "ussf"]]) {
  const updated = Object.values(meta(slug).columns)[0].lastUpdated;
  if (updated !== SOURCES[id].published) console.warn(`! ${slug} was updated ${updated}; SOURCES.${id}.published says ${SOURCES[id].published}`);
}

// ---------- Objects launched, by launching state or organisation (UNOOSA via OWID) ----------
const annual = csv("yearly-number-of-objects-launched-into-outer-space");
const cumulative = csv("cumulative-number-of-objects-launched-into-outer-space");
const LAST = Math.max(...annual.map((r) => +r.year));
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const N3 = new Map(AIR.map((r) => [r.iso3, r.iso_n3]));
const ann = new Map(), cum = new Map(), codes = new Map();
for (const r of annual) { (ann.get(r.entity) ?? ann.set(r.entity, new Map()).get(r.entity)).set(+r.year, +r.annual_launches); codes.set(r.entity, r.code); }
for (const r of cumulative) (cum.get(r.entity) ?? cum.set(r.entity, new Map()).get(r.entity)).set(+r.year, +r.cumulative_launches);
const total = (e) => Math.max(0, ...cum.get(e).values());
const launchers = [...ann.keys()].filter((e) => e !== "World").map((e) => {
  const a = ann.get(e), code = codes.get(e) ?? "";
  return {
    launcher: e, iso3: code, iso_n3: code ? N3.get(code) ?? "" : "", kind: code ? "country" : "organisation",
    objects_total: total(e), objects_2025: a.get(2025) ?? 0, objects_2015: a.get(2015) ?? 0,
    first_year: Math.min(...[...a].filter(([, v]) => v > 0).map(([y]) => y)), source: "unoosa",
  };
}).sort((a, b) => b.objects_total - a.objects_total || (a.launcher < b.launcher ? -1 : 1));

const W = ann.get("World"), US = ann.get("United States"), CN = ann.get("China"), RU = ann.get("Russia");
const yearly = [...W.keys()].sort((a, b) => a - b).map((y) => {
  const r = { year: y, world: W.get(y), united_states: US.get(y) ?? 0, china: CN.get(y) ?? 0, russia: RU.get(y) ?? 0 };
  r.rest = r.world - r.united_states - r.china - r.russia;
  r.source = "unoosa";
  return r;
});

// ---------- Tracked objects by orbit and type (Space-Track via OWID) ----------
const wide = (slug, cols) => {
  const by = new Map();
  for (const r of csv(slug)) {
    const k = cols[r.entity];
    if (!k) throw new Error(`${slug}: unexpected entity ${r.entity}`);
    (by.get(+r.year) ?? by.set(+r.year, {}).get(+r.year))[k] = +r.n_objects;
  }
  return [...by.keys()].sort((a, b) => a - b).map((year) => ({ year, ...Object.fromEntries(Object.values(cols).map((k) => [k, by.get(year)[k] ?? 0])), source: "ussf" }));
};
const orbits = wide("space-objects-by-orbit", { "Geostationary orbit": "geostationary_orbit", "High Earth orbit": "high_earth_orbit", "Low Earth orbit": "low_earth_orbit", "Medium Earth orbit": "medium_earth_orbit" });
const leo = wide("low-earth-orbits-objects", { Debris: "debris", Payloads: "payloads", "Rocket bodies": "rocket_bodies" });

// ---------- Facts ----------
const facts = [
  { id: "tracked", label: "Objects tracked in orbit by space surveillance networks", value: 40000, unit: "objects", note: "About; end of 2024", source: "esa-2025" },
  { id: "active", label: "Of which active payloads", value: 11000, unit: "satellites", note: "About; end of 2024", source: "esa-2025" },
  { id: "debris10", label: "Estimated debris objects larger than 10 cm", value: 50000, unit: "objects", note: "Over", source: "esa-2025" },
  { id: "debris1", label: "Estimated debris objects larger than 1 cm", value: 1200000, unit: "objects", note: "Over", source: "esa-2025" },
  { id: "reentry", label: "Intact satellites or rocket bodies re-entering the atmosphere", value: 3, unit: "a day", note: "More than, on average", source: "esa-2025" },
  { id: "starlink", label: "Active Starlink satellites, 17 March 2026", value: 10020, unit: "satellites", note: "Roughly two-thirds of all active satellites", source: "mcdowell-2026" },
];

const TABLES = [
  ["launchers", "Objects launched by country or organisation", `Objects registered with the UN by launching state or organisation, all years to ${LAST} and in 2025.`, launchers],
  ["yearly", "Objects launched each year", "World total by year of launch, with the United States, China and Russia.", yearly],
  ["orbits", "Payloads and rocket bodies by orbit", "Tracked payloads and rocket bodies in each orbit at the end of each year (debris not included).", orbits],
  ["leo", "Tracked objects in low Earth orbit", "Payloads, rocket bodies and tracked debris in low Earth orbit at the end of each year.", leo],
  ["facts", "Headline findings", "Published figures on tracked objects, debris and Starlink.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "orbit", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>orbit data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>orbit data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor", Our World in Data and the original publishers.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.last_year = LAST;
DATA.world_total = cum.get("World").get(LAST);
fs.writeFileSync(path.join(REPO, "orbit/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

console.log("launchers", launchers.length, "last year", LAST, "world total", DATA.world_total, "world", LAST, W.get(LAST));
console.log("top", launchers.slice(0, 5).map((r) => `${r.launcher} ${r.objects_total} (${r.objects_2025})`).join(", "));
console.log("orbits", orbits.at(-1), "leo", leo.at(-1));
console.log("no map code", launchers.filter((r) => r.iso3 && !r.iso_n3).map((r) => r.launcher).join(", ") || "none");
