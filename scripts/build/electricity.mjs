// Builds data/electricity/* and electricity/assets/data.js for the Electricity dashboard from
// scripts/.raw/electricity (Our World in Data's energy dataset, which carries Ember's Yearly Electricity Data).
//   node scripts/build/electricity.mjs        (raw downloads in scripts/.raw/electricity/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
// The published files were first written by a Python script, so numbers are written the Python way
// (floats keep their ".0", rounding is half-to-even on the exact value) to keep them byte-identical.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv } from "../lib/csv.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "electricity");
const OUT = path.join(REPO, "data/electricity");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "electricity/assets"), { recursive: true });

// ---------- Python-style numbers ----------
// Float: a number that is written with a decimal point even when whole (Python float).
class Float { constructor(v) { this.v = v; } }
// Python round(x, d): half-to-even on the exact binary value. Returns a Float (or an int when d is 0).
function pyRound(x, d = 1) {
  if (x == null || !isFinite(x)) return null;
  const neg = x < 0, s = Math.abs(x).toFixed(Math.min(100, d + 60));
  const [ip, fp] = s.split(".");
  let digits = ip + fp.slice(0, d);
  const rest = fp.slice(d), half = rest[0] > "5" || (rest[0] === "5" && /[1-9]/.test(rest.slice(1)));
  const tie = rest[0] === "5" && !/[1-9]/.test(rest.slice(1));
  if (half || (tie && +digits.at(-1) % 2 === 1)) digits = (BigInt(digits) + 1n).toString();
  digits = digits.padStart(d + 1, "0");
  const v = Number(d ? `${digits.slice(0, -d)}.${digits.slice(-d)}` : digits) * (neg ? -1 : 1);
  return d === 0 ? v : new Float(v === 0 ? 0 : v);
}
const r1 = (v, d = 1) => pyRound(v, d);
const ri = (v) => pyRound(v, 0);
const num = (v) => (v instanceof Float ? v.v : v);
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
  "ember-yearly": {
    publisher: "Ember (processed by Our World in Data)",
    title: "Yearly Electricity Data, 2026 release",
    url: "https://ember-energy.org/data/yearly-electricity-data/",
    published: "2026-04-24",
    method: "reported",
    notes: "Generation by source and carbon intensity (life-cycle, g CO2e per kWh), compiled by Ember from national and international statistics. Licensed CC BY 4.0. Taken from Our World in Data's energy dataset (github.com/owid/energy-data). Countries without 2025 data show 2024.",
  },
  "ember-ger-2026": {
    publisher: "Ember",
    title: "Global Electricity Review 2026",
    url: "https://ember-energy.org/latest-insights/global-electricity-review-2026/",
    published: "2026-04-21",
    method: "reported",
  },
  "iom3-ratcliffe": {
    publisher: "IOM3 (Institute of Materials, Minerals and Mining)",
    title: "Last UK coal-fired power station closes",
    url: "https://iom3.org/resource/last-uk-coal-fired-power-station-closes.html",
    published: "2024-09-30",
    method: "reference",
    notes: "Ratcliffe-on-Soar, end date 1 October 2024.",
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

const YEAR = 2025, FALLBACK = 2024, BASE = 2015, FROM = 2000;

// ---------- OWID energy data ----------
const rows = readCsv(path.join(RAW, "owid-energy-data.csv"));
const v = (r, k) => (r?.[k] === "" || r?.[k] == null ? null : +r[k]);
const byName = {}, byIso = {};
for (const r of rows) {
  (byName[r.country] ??= {})[r.year] = r;
  if (r.iso_code && !r.iso_code.startsWith("OWID")) (byIso[r.iso_code] ??= {})[r.year] = r;
}
// The generation mix columns shared by every table.
const mix = (r, perCapita) => {
  const gen = v(r, "electricity_generation"), pop = v(r, "population");
  return {
    generation_twh: r1(gen),
    carbon_intensity_g_kwh: r1(v(r, "carbon_intensity_elec")),
    per_capita_kwh: perCapita && gen != null && pop ? ri((gen * 1e9) / pop) : null,
    coal_pct: r1(v(r, "coal_share_elec")),
    gas_pct: r1(v(r, "gas_share_elec")),
    oil_pct: r1(v(r, "oil_share_elec")),
    nuclear_pct: r1(v(r, "nuclear_share_elec")),
    hydro_pct: r1(v(r, "hydro_share_elec")),
    wind_pct: r1(v(r, "wind_share_elec")),
    solar_pct: r1(v(r, "solar_share_elec")),
    bioenergy_pct: r1(v(r, "biofuel_share_elec")),
    other_renewables_pct: r1(v(r, "other_renewables_share_elec_exc_biofuel")),
    renewables_pct: r1(v(r, "renewables_share_elec")),
    low_carbon_pct: r1(v(r, "low_carbon_share_elec")),
    fossil_pct: r1(v(r, "fossil_share_elec")),
  };
};

const BANDS = [
  { band: "Under 100", min_g_kwh: 0, max_g_kwh: 100, source: "ember-yearly" },
  { band: "100 to 250", min_g_kwh: 100, max_g_kwh: 250, source: "ember-yearly" },
  { band: "250 to 400", min_g_kwh: 250, max_g_kwh: 400, source: "ember-yearly" },
  { band: "400 to 600", min_g_kwh: 400, max_g_kwh: 600, source: "ember-yearly" },
  { band: "600 or more", min_g_kwh: 600, max_g_kwh: null, source: "ember-yearly" },
];
const bandOf = (x) => (x == null ? null : BANDS.find((b) => x >= b.min_g_kwh && (b.max_g_kwh == null || x < b.max_g_kwh))?.band ?? null);

// ---------- Countries: every country in the shared list with generation in 2025, else 2024 ----------
const LIST = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const countries = [];
for (const c of LIST) {
  const y = byIso[c.iso3];
  const year = v(y?.[YEAR], "electricity_generation") != null ? YEAR : v(y?.[FALLBACK], "electricity_generation") != null ? FALLBACK : null;
  if (year == null || !(v(y[year], "electricity_generation") > 0)) continue; // Lesotho is listed with 0 TWh
  const r = y[year], ci = v(r, "carbon_intensity_elec");
  countries.push({
    country: c.country, iso3: c.iso3, iso_n3: c.iso_n3, year, ...mix(r, true),
    band: bandOf(ci), carbon_intensity_2015: r1(v(y[BASE], "carbon_intensity_elec")), source: "ember-yearly",
  });
}
// Largest first (as rounded), ties by name.
countries.sort((a, b) => num(b.generation_twh) - num(a.generation_twh) || (a.country < b.country ? -1 : a.country > b.country ? 1 : 0));

// ---------- World and UK over time; Ember regions ----------
const series = (name) => Object.values(byName[name]).filter((r) => +r.year >= FROM && +r.year <= YEAR && v(r, "electricity_generation") != null)
  .map((r) => ({ area: name, year: +r.year, ...mix(r, true), source: "ember-yearly" }));
const world = series("World"), uk = series("United Kingdom");
const REGIONS = ["Africa", "Asia", "Europe", "Latin America and Caribbean", "Middle East", "North America", "Oceania"];
const regions = [...REGIONS.map((n) => ({ region: n, year: YEAR, ...mix(byName[`${n} (Ember)`][YEAR], false), source: "ember-yearly" })),
  { region: "World", year: YEAR, ...mix(byName.World[YEAR], true), source: "ember-yearly" }];

// ---------- Facts ----------
const facts = [
  { id: "solar_growth", label: "Rise in global solar generation, 2025", value: 636, unit: "TWh", note: "A record, up 30% to 2,778 TWh", source: "ember-ger-2026" },
  { id: "solar_demand", label: "Share of the rise in electricity demand met by solar, 2025", value: 75, unit: "%", source: "ember-ger-2026" },
  { id: "wind_solar_demand", label: "Share of demand growth met by solar and wind together, 2025", value: 99, unit: "%", source: "ember-ger-2026" },
  { id: "demand_growth", label: "Growth in global electricity demand, 2025", value: 849, unit: "TWh", source: "ember-ger-2026" },
  { id: "fossil_change", label: "Change in fossil generation, 2025", value: -38, unit: "TWh", note: "-0.2%, the first year without a rise since 2020", source: "ember-ger-2026" },
  { id: "uk_coal_end", label: "UK's last coal power station, Ratcliffe-on-Soar, closed", value: "2024-09-30", unit: "date", note: "Ending more than 140 years of coal power", source: "iom3-ratcliffe" },
];

const TABLES = [
  ["countries", "Electricity mix by country", "Generation by source (% of electricity), total generation, generation per person and carbon intensity, 2025 where Ember has it, otherwise 2024, with 2015 carbon intensity.", countries],
  ["world", "World electricity over time", "World generation mix and carbon intensity by year since 2000.", world],
  ["regions", "Electricity by region", "Ember regional totals, latest year.", regions],
  ["uk", "United Kingdom over time", "UK generation mix and carbon intensity by year since 2000.", uk],
  ["bands", "Carbon intensity classes", "The bands used to colour the map, in grams of CO2 equivalent per kWh.", BANDS],
  ["facts", "Headline findings", "Published headline figures from Ember's Global Electricity Review 2026 and the UK coal phase-out.", facts],
];
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys, ...records.map((r) => keys.map((k) => r[k]))].map((row) => row.map(csvCell).join(",") + "\n").join(""));
  fs.writeFileSync(path.join(OUT, `${id}.json`), pyJson({ id, title, description, records }));
}
fs.writeFileSync(path.join(OUT, "sources.json"), pyJson({ sources: SOURCES }));
fs.writeFileSync(path.join(OUT, "index.json"), pyJson({ variant: "electricity", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, 2, true));
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>electricity data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>electricity data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor", Ember and Our World in Data.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "electricity/assets/data.js"), `export const SOURCES=${pyJson(SOURCES, null)};\nexport const DATA=${pyJson(DATA, null)};\n`);

const w25 = world.at(-1), w15 = world.find((r) => r.year === BASE);
console.log("countries", countries.length, "with", YEAR, countries.filter((r) => r.year === YEAR).length);
console.log("world", YEAR, "renewables", num(w25.renewables_pct), "coal", num(w25.coal_pct), "carbon", num(w25.carbon_intensity_g_kwh), "vs", BASE, num(w15.carbon_intensity_g_kwh));
console.log("uk", uk.at(-1).year, "coal", num(uk.at(-1).coal_pct), "carbon", num(uk.at(-1).carbon_intensity_g_kwh));
console.log("bands", BANDS.map((b) => `${b.band}:${countries.filter((r) => r.band === b.band).length}`).join(" "));
