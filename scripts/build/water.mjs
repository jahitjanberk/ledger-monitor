// Builds data/water/* and water/assets/data.js for the Water dashboard from scripts/.raw/water
// (Our World in Data chart CSVs for SDG 6.4.2, AQUASTAT and the WHO/UNICEF JMP, and the UN SDG API for regional values).
//   node scripts/build/water.mjs        (raw downloads in scripts/.raw/water/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
// The published files were first written by a Python script, so numbers are written the Python way
// (a value read as "100" stays an int, "54.76" is a float and keeps a ".0" when rounded to a whole number,
// rounding is half-to-even on the exact value) to keep them byte-identical.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv } from "../lib/csv.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "water");
const OUT = path.join(REPO, "data/water");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "water/assets"), { recursive: true });
const txt = (f) => fs.readFileSync(path.join(RAW, f), "utf8");

// ---------- Python-style numbers ----------
class Float { constructor(v) { this.v = v; } }
const val = (x) => (x instanceof Float ? x.v : x);
// A number token as Python reads it: int without a decimal point or exponent, float otherwise.
const tok = (s) => (s == null || s === "" ? null : /[.eE]/.test(s) ? new Float(+s) : +s);
// Python round(x, d) on the exact binary value, half to even.
function roundExact(x, d) {
  const neg = x < 0, s = Math.abs(x).toFixed(Math.min(100, d + 60));
  const [ip, fp] = s.split(".");
  let digits = ip + fp.slice(0, d);
  const rest = fp.slice(d), up = rest[0] > "5" || (rest[0] === "5" && /[1-9]/.test(rest.slice(1)));
  const tie = rest[0] === "5" && !/[1-9]/.test(rest.slice(1));
  if (up || (tie && +digits.at(-1) % 2 === 1)) digits = (BigInt(digits) + 1n).toString();
  digits = digits.padStart(d + 1, "0");
  const v = Number(d ? `${digits.slice(0, -d)}.${digits.slice(-d)}` : digits) * (neg ? -1 : 1);
  return v === 0 ? 0 : v;
}
// round(x, d): an int stays an int; a float gives a float (or an int when d is 0).
function r1(x, d = 1) {
  if (x == null) return null;
  if (!(x instanceof Float)) return x;
  if (!isFinite(x.v)) return null;
  return d === 0 ? roundExact(x.v, 0) : new Float(roundExact(x.v, d));
}
const ri = (x) => r1(x, 0);
function pyNum(v) {
  if (v instanceof Float) {
    const x = v.v;
    if (Number.isInteger(x) && Math.abs(x) < 1e16) return `${x}.0`;
    if (x !== 0 && Math.abs(x) < 1e-4) return x.toExponential().replace(/e([+-])(\d)$/, "e$10$2");
    return String(x);
  }
  return String(v);
}
const pyStr = (s, ascii) => JSON.stringify(s).replace(ascii ? /[\u007f-￿]/g : /[\u007f]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
// json.dumps(v, indent=indent, ensure_ascii=ascii); indent null gives separators (",", ":").
function pyJson(v, indent = 2, ascii = false, lvl = 0) {
  if (v == null) return "null";
  if (v instanceof Float || typeof v === "number") return pyNum(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return pyStr(v, ascii);
  const nl = indent == null ? "" : "\n" + " ".repeat(indent * (lvl + 1)), end = indent == null ? "" : "\n" + " ".repeat(indent * lvl);
  const kv = indent == null ? ":" : ": ";
  if (Array.isArray(v)) return v.length ? `[${v.map((x) => nl + pyJson(x, indent, ascii, lvl + 1)).join(",")}${end}]` : "[]";
  const e = Object.entries(v);
  return e.length ? `{${e.map(([k, x]) => nl + pyStr(k, ascii) + kv + pyJson(x, indent, ascii, lvl + 1)).join(",")}${end}}` : "{}";
}
const csvCell = (v) => {
  if (v == null) return "";
  const s = typeof v === "boolean" ? (v ? "True" : "False") : typeof v === "object" ? pyNum(v) : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const SOURCES = {
  "fao-sdg642": {
    publisher: "FAO via the UN SDG Indicators Database (processed by Our World in Data)",
    title: "SDG indicator 6.4.2: level of water stress, by country",
    url: "https://unstats.un.org/sdgs/dataportal",
    published: "2026-08-25",
    method: "reported",
    notes: "Freshwater withdrawn by all sectors as a share of renewable freshwater left after environmental flows. Countries report to FAO through AQUASTAT. Taken from Our World in Data's copy of the UN database (accessed by OWID on 31 July 2026); the world value matches the UN-Water SDG 6 Data Portal.",
  },
  "sdg6-portal": {
    publisher: "UN-Water SDG 6 Data Portal",
    title: "Progress on level of water stress (indicator 6.4.2), regional values",
    url: "https://www.sdg6data.org/en/indicator/6.4.2",
    published: "2026",
    method: "reported",
    notes: "SDG regional aggregates for 2023.",
  },
  "sdg642-meta": {
    publisher: "UN Statistics Division / FAO",
    title: "SDG metadata, indicator 6.4.2: severity classes",
    url: "https://worldbank.github.io/sdg-metadata/phase-2/metadata/en/6-4-2",
    published: "2023",
    method: "reference",
    notes: "No stress under 25%, low 25 to 50%, medium 50 to 75%, high 75 to 100%, critical over 100%.",
  },
  "aquastat-wdi": {
    publisher: "FAO AQUASTAT via the World Bank's World Development Indicators (processed by Our World in Data)",
    title: "Freshwater withdrawals by sector and renewable internal freshwater per person",
    url: "https://ourworldindata.org/grapher/agricultural-water-as-a-share-of-total-water-withdrawals",
    published: "2026-07-27",
    method: "reported",
    notes: "Shares of withdrawals going to agriculture, industry and domestic use; renewable internal freshwater resources per person.",
  },
  "aquastat-pc": {
    publisher: "FAO AQUASTAT (processed by Our World in Data)",
    title: "Total water withdrawal per person",
    url: "https://ourworldindata.org/grapher/water-withdrawals-per-capita",
    published: "2026-08-07",
    method: "reported",
  },
  "jmp-2025": {
    publisher: "WHO/UNICEF Joint Monitoring Programme (processed by Our World in Data)",
    title: "Estimates for drinking water, sanitation and hygiene services by country (2000-2024)",
    url: "https://washdata.org/data",
    published: "2025-08-26",
    method: "survey",
    notes: "Built from household surveys, censuses and administrative data. Next update expected December 2027.",
  },
  "jmp-2025-release": {
    publisher: "UNICEF USA, reporting WHO and UNICEF",
    title: "Fast facts: 1 in 4 people globally still lack access to safe drinking water",
    url: "https://www.unicefusa.org/press/fast-facts-1-4-people-globally-still-lack-access-safe-drinking-water-who-unicef",
    published: "2025-08-26",
    method: "survey",
  },
  "wri-2023": {
    publisher: "World Resources Institute",
    title: "25 Countries, Housing One-Quarter of the Population, Face Extremely High Water Stress",
    url: "https://www.wri.org/insights/highest-water-stressed-countries",
    published: "2023-08-16",
    method: "reference",
    notes: "Findings from Aqueduct 4.0 (CC BY 4.0). Extremely high stress means using at least 80% of available supply; high means 40%.",
  },
  "grace-2025": {
    publisher: "Arizona State University, reporting a study in Science Advances (doi:10.1126/sciadv.adx0298)",
    title: "Unprecedented continental drying, shrinking freshwater availability, and increasing land contributions to sea level rise",
    url: "https://ke.news.prod.rtd.asu.edu/2025/08/06/asu-led-research-uses-20-years-of-satellite-data-to-reveal-unprecedented-continental-drying/",
    published: "2025-08-06",
    method: "reference",
    notes: "Based on NASA/GFZ GRACE and GRACE-FO satellite gravity data from 2002.",
  },
  "unccd-2025": {
    publisher: "UNCCD and the US National Drought Mitigation Center",
    title: "Drought Hotspots Around the World 2023-2025",
    url: "https://www.unccd.int/resources/publications/drought-hotspots-around-world-2023-2025",
    published: "2025-07-02",
    method: "reference",
  },
  "lbnl-2024": {
    publisher: "Lawrence Berkeley National Laboratory",
    title: "2024 United States Data Center Energy Usage Report",
    url: "https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf",
    published: "2024-12-19",
    method: "reported",
    notes: "US data centres only. Direct = water consumed on site for cooling; indirect = water consumed generating their electricity.",
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

const STRESS_YEAR = 2023, STRESS_BASE = 2015, JMP_YEAR = 2024;

// ---------- Readers ----------
// OWID chart CSV (csvType=full, short column names): { code or entity: { year: { column: value } } }.
function owid(f) {
  const out = {};
  for (const r of readCsv(path.join(RAW, f))) {
    const row = {};
    for (const k of Object.keys(r).slice(3)) row[k] = tok(r[k]);
    (out[r.code || r.entity] ??= {})[r.year] = row;
    if (r.code) (out[r.entity] ??= {})[r.year] = row;
  }
  return out;
}
// Latest year with a value in column k (optionally up to `max`): [year, value] or null.
const latest = (series, k, max = Infinity) => {
  const ys = Object.keys(series ?? {}).map(Number).filter((y) => y <= max && series[y][k] != null).sort((a, b) => b - a);
  return ys.length ? [ys[0], series[ys[0]][k]] : null;
};
// SDG 6.4.2 comes from OWID's indicator API, whose entity order sets the order of countries with equal rounded values.
// The values are tokenised from the text so ints and floats keep the type Python gave them.
function owidInd(id) {
  const d = txt(`owid_ind_${id}.data.json`), m = JSON.parse(txt(`owid_ind_${id}.metadata.json`));
  const arr = (k) => d.match(new RegExp(`"${k}"\\s*:\\s*\\[([^\\]]*)\\]`))[1].split(",").map((x) => x.trim());
  const values = arr("values").map(tok), years = arr("years").map(Number), ents = arr("entities").map(Number);
  const ent = Object.fromEntries(m.dimensions.entities.values.map((e) => [e.id, e.code || e.name]));
  const out = new Map();
  values.forEach((v, i) => {
    const k = ent[ents[i]];
    if (!out.has(k)) out.set(k, {});
    out.get(k)[years[i]] = { v };
  });
  return out;
}
const stressSrc = owidInd(1305196);
const agri = owid("owid_agricultural-water-as-a-share-of-total-water-withdrawals.csv");
const ind = owid("owid_industrial-water-as-a-share-of-total-water-withdrawals.csv");
const dom = owid("owid_municipal-water-as-a-share-of-total-water-withdrawals.csv");
const renew = owid("owid_renewable-water-resources-per-capita.csv");
const wpc = owid("owid_water-withdrawals-per-capita.csv");
const ladderSrc = owid("owid_access-drinking-water-stacked.csv");
const without = owid("owid_number-without-safe-drinking-water.csv");
const S642 = "v";

const LIST = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const byIso = (a, b) => (a.iso3 < b.iso3 ? -1 : a.iso3 > b.iso3 ? 1 : 0);

// ---------- Water stress (SDG 6.4.2) ----------
const BANDS = [
  { band: "No stress", min_pct: 0, max_pct: 25, source: "sdg642-meta" },
  { band: "Low", min_pct: 25, max_pct: 50, source: "sdg642-meta" },
  { band: "Medium", min_pct: 50, max_pct: 75, source: "sdg642-meta" },
  { band: "High", min_pct: 75, max_pct: 100, source: "sdg642-meta" },
  { band: "Critical", min_pct: 100, max_pct: null, source: "sdg642-meta" },
];
const bandOf = (x) => BANDS.find((b) => b.max_pct == null || x < b.max_pct).band;
const stress = [];
const LISTED = Object.fromEntries(LIST.map((c) => [c.iso3, c]));
for (const [k, series] of stressSrc) {
  const c = LISTED[k], l = c && latest(series, S642);
  if (!l) continue;
  stress.push({
    country: c.country, iso3: c.iso3, iso_n3: c.iso_n3, stress_pct: r1(l[1]), year: l[0], band: bandOf(val(l[1])),
    stress_2015: r1(series[STRESS_BASE]?.[S642]), source: "fao-sdg642",
  });
}
// Highest first, as rounded; ties keep the indicator file's order (a stable sort).
stress.sort((a, b) => val(b.stress_pct) - val(a.stress_pct));
const W = stressSrc.get("OWID_WRL");
const trend = Object.keys(W).map(Number).sort((a, b) => a - b).filter((y) => W[y][S642] != null).map((year) => ({ year, stress_pct: r1(W[year][S642]), source: "fao-sdg642" }));

// Regional aggregates from the UN SDG API (the values the UN-Water SDG 6 Data Portal shows), largest first, World last.
const REGION_NAMES = { 543: "Oceania (excl. Australia and New Zealand)" };
const un = JSON.parse(txt("un_sdg_ER_H2O_STRESS_regions.json")).data.filter((d) => d.dimensions.Activity === "TOTAL" && +d.timePeriodStart === STRESS_YEAR);
const regions = un.map((d) => ({ region: REGION_NAMES[d.geoAreaCode] ?? d.geoAreaName, stress_pct: tok(String(d.value)), year: STRESS_YEAR, source: "sdg6-portal" }));
regions.sort((a, b) => (a.region === "World") - (b.region === "World") || val(b.stress_pct) - val(a.stress_pct));

// ---------- Withdrawals by sector and water per person (AQUASTAT) ----------
const sectors = [], resources = [];
for (const c of LIST) {
  // Latest year with agriculture; the country is left out unless industry and domestic shares exist for that year too.
  const a = latest(agri[c.iso3], "er_h2o_fwag_zs");
  if (a && ind[c.iso3]?.[a[0]]?.er_h2o_fwin_zs != null && dom[c.iso3]?.[a[0]]?.er_h2o_fwdm_zs != null) sectors.push({
    country: c.country, iso3: c.iso3, iso_n3: c.iso_n3, year: a[0],
    agriculture_pct: r1(a[1]), industry_pct: r1(ind[c.iso3]?.[a[0]]?.er_h2o_fwin_zs), domestic_pct: r1(dom[c.iso3]?.[a[0]]?.er_h2o_fwdm_zs), source: "aquastat-wdi",
  });
  const rn = latest(renew[c.iso3], "er_h2o_intr_pc"), wd = latest(wpc[c.iso3], "total_water_withdrawal_per_capita");
  if (!rn && !wd) continue;
  const rec = { country: c.country, iso3: c.iso3, iso_n3: c.iso_n3 };
  if (rn) Object.assign(rec, { renewable_m3_per_person: ri(rn[1]), renewable_year: rn[0], renewable_source: "aquastat-wdi" });
  if (wd) Object.assign(rec, { withdrawal_m3_per_person: ri(wd[1]), withdrawal_year: wd[0], withdrawal_source: "aquastat-pc" });
  resources.push(rec);
}
sectors.sort(byIso);
resources.sort(byIso);

// ---------- Drinking water (JMP) ----------
const drinking = [];
for (const c of LIST) {
  const l = latest(ladderSrc[c.iso3], "wat_sm__residence_total", JMP_YEAR);
  if (!l) continue;
  drinking.push({
    country: c.country, iso3: c.iso3, iso_n3: c.iso_n3, year: l[0], safely_managed_pct: r1(l[1]),
    people_without: ri(without[c.iso3]?.[l[0]]?.wat_sm_pop_without__residence_total), source: "jmp-2025",
  });
}
drinking.sort(byIso);
const WL = ladderSrc.OWID_WRL[JMP_YEAR];
const ladder = [["safely", "wat_sm__residence_total"], ["basic", "wat_bas__residence_total"], ["limited", "wat_lim__residence_total"], ["unimproved", "wat_unimp__residence_total"], ["surface", "wat_ns__residence_total"]]
  .map(([level, k]) => ({ level, pct: r1(WL[k]), year: JMP_YEAR, source: "jmp-2025" }));
const income = ["Low-income countries", "Lower-middle-income countries", "Upper-middle-income countries", "High-income countries"]
  .map((group) => ({ group, safely_managed_pct: r1(ladderSrc[group][JMP_YEAR].wat_sm__residence_total), year: JMP_YEAR, source: "jmp-2025" }));

// ---------- Facts (headline figures typed from each report; jmp_without is the JMP world figure, checked below) ----------
const facts = [
  { id: "wri_quarter", label: "Countries facing extremely high water stress every year", value: 25, unit: "countries", note: "Home to a quarter of the world's population", source: "wri-2023" },
  { id: "wri_4bn", label: "People living with high water stress at least one month a year", value: 4000000000, unit: "people", note: "At least 50% of the world's population", source: "wri-2023" },
  { id: "wri_2050_people", label: "Extra people expected to face extremely high water stress by 2050", value: 1000000000, unit: "people", source: "wri-2023" },
  { id: "wri_2050_demand", label: "Projected growth in global water demand by 2050", value: "20-25", unit: "%", source: "wri-2023" },
  { id: "grace_pop", label: "Share of the world's population living in countries losing freshwater", value: 75, unit: "%", note: "101 countries", source: "grace-2025" },
  { id: "grace_gw", label: "Share of continental water storage loss that is groundwater", value: 68, unit: "%", source: "grace-2025" },
  { id: "unccd_hunger", label: "People facing acute hunger in Eastern and Southern Africa during the 2023-25 droughts", value: 90000000, unit: "people", source: "unccd-2025" },
  { id: "unccd_zim", label: "Fall in Zimbabwe's 2024 maize crop", value: 70, unit: "%", source: "unccd-2025" },
  { id: "unccd_olive", label: "Fall in Spain's olive crop by September 2023", value: 50, unit: "%", source: "unccd-2025" },
  { id: "unccd_panama", label: "Daily Panama Canal transits, October 2023 to January 2024", value: "38 to 24", unit: "ships a day", source: "unccd-2025" },
  { id: "dc_direct", label: "Water US data centres consumed on site for cooling, 2023", value: 64000000000, unit: "litres", note: "About 17 billion US gallons", source: "lbnl-2024" },
  { id: "dc_indirect", label: "Water consumed generating US data centres' electricity, 2023", value: 800000000000, unit: "litres", note: "About 211 billion US gallons", source: "lbnl-2024" },
  { id: "jmp_without", label: "People without safely managed drinking water, 2024", value: 2143285200, unit: "people", source: "jmp-2025" },
];
const jmpWithout = ri(without.OWID_WRL[JMP_YEAR].wat_sm_pop_without__residence_total);
if (jmpWithout !== facts.at(-1).value) console.log(`note: JMP people without safely managed water is now ${jmpWithout}; update the jmp_without fact`);

const TABLES = [
  ["stress", "Water stress by country", "SDG 6.4.2: freshwater withdrawn as a share of renewable freshwater left after environmental flows, latest year reported (mostly 2023), with the severity class and the 2015 value.", stress],
  ["regions", "Water stress by SDG region", "SDG 6.4.2 regional aggregates for 2023 from the UN-Water SDG 6 Data Portal.", regions],
  ["trend", "World water stress over time", "SDG 6.4.2 world value by year.", trend],
  ["bands", "Severity classes", "The SDG 6.4.2 severity classes used to colour the map.", BANDS],
  ["sectors", "Withdrawals by sector", "Share of freshwater withdrawals going to agriculture, industry and domestic use, latest year (AQUASTAT via the World Bank).", sectors],
  ["resources", "Water per person", "Renewable internal freshwater resources and total water withdrawal per person, latest year (AQUASTAT).", resources],
  ["drinking", "Safely managed drinking water by country", "Share of people using safely managed drinking water, and the number not doing so, 2024 or latest (WHO/UNICEF JMP).", drinking],
  ["ladder", "World drinking water ladder", "Share of the world's population on each rung of the JMP drinking water ladder, 2024.", ladder],
  ["income", "Drinking water by income group", "Share using safely managed drinking water by World Bank income group, 2024.", income],
  ["facts", "Headline findings", "Published headline figures on water risk, groundwater, drought and data centres, each from its report.", facts],
];
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys, ...records.map((r) => keys.map((k) => r[k]))].map((row) => row.map(csvCell).join(",") + "\n").join(""));
  fs.writeFileSync(path.join(OUT, `${id}.json`), pyJson({ id, title, description, records }));
}
fs.writeFileSync(path.join(OUT, "sources.json"), pyJson({ sources: SOURCES }));
fs.writeFileSync(path.join(OUT, "index.json"), pyJson({ variant: "water", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, 2, true));
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>water data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>water data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "water/assets/data.js"), `export const SOURCES=${pyJson(SOURCES, null)};\nexport const DATA=${pyJson(DATA, null)};\n`);

console.log("stress", stress.length, "critical", stress.filter((r) => r.band === "Critical").length, "world", val(trend.at(-1).stress_pct), trend.at(-1).year);
console.log("sectors", sectors.length, "resources", resources.length, "drinking", drinking.length, "not", JMP_YEAR, drinking.filter((r) => r.year !== JMP_YEAR).map((r) => r.iso3 + r.year).join(" "));
console.log("ladder", ladder.map((r) => `${r.level} ${val(r.pct)}`).join(", "), "· without", jmpWithout);
