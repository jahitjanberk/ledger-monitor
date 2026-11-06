// Builds data/air/* and air/assets/data.js for the Air Pollution dashboard from scripts/.raw/air
// (Our World in Data chart CSVs and indicator API files for SatPM, AQLI, WHO SDG 11.6.2 and IHME GBD 2023,
// plus an ISO 3166 table for numeric country codes).
//   node scripts/build/air.mjs        (raw downloads in scripts/.raw/air/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
// data/air/countries.json is also the country list every other builder reads, so it is written from
// the SatPM country list (every OWID entity with an ISO code).
// The published files were first written by a Python script, so numbers are written the Python way
// (a value read as "65" stays an int, "65.0" or a division is a float and keeps its ".0", rounding is
// half-to-even on the exact value) to keep them byte-identical.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv } from "../lib/csv.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "air");
const OUT = path.join(REPO, "data/air");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "air/assets"), { recursive: true });
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
  satpm: {
    publisher: "Atmospheric Composition Analysis Group, Washington University in St. Louis (processed by Our World in Data)",
    title: "SatPM: population-weighted PM2.5 exposure",
    url: "https://sites.wustl.edu/acag/datasets/surface-pm2-5/",
    published: "2026-04-22",
    method: "reference",
    notes: "Annual average fine particulate matter (PM2.5) concentration people are exposed to, estimated from satellite observations, models and ground monitors, weighted by where people live. µg/m³.",
  },
  "who-sdg1162": {
    publisher: "World Health Organization via the UN SDG database (processed by Our World in Data)",
    title: "SDG 11.6.2: annual mean levels of fine particulate matter in urban areas, population-weighted",
    url: "https://unstats.un.org/sdgs/dataportal",
    published: "2026-07-31",
    method: "reference",
    notes: "WHO's official estimate for urban areas (OWID indicator 1298167), 2023. Shown alongside SatPM for comparison; it covers cities and towns, not the whole country.",
  },
  aqli: {
    publisher: "Energy Policy Institute at the University of Chicago (EPIC), Air Quality Life Index (processed by Our World in Data)",
    title: "AQLI: population-weighted PM2.5 from human sources",
    url: "https://aqli.epic.uchicago.edu/",
    published: "2026-03-30",
    method: "reference",
    notes: "Annual population-weighted PM2.5 with natural sources such as desert dust and sea salt removed, µg/m³. The countries table's pm25_human column comes from this dataset, not from SatPM.",
  },
  "ihme-gbd2023": {
    publisher: "IHME, Global Burden of Disease Study 2023 (processed by Our World in Data)",
    title: "Deaths attributed to air pollution",
    url: "https://vizhub.healthdata.org/gbd-results/",
    published: "2026-02-07",
    method: "reference",
    notes: "Modelled estimates of deaths from all causes attributable to ambient particulate matter, household air pollution from solid fuels, and ambient ozone, 2023.",
  },
  "comeap-who-aqg": {
    publisher: "UK Committee on the Medical Effects of Air Pollutants (COMEAP)",
    title: "Advice on health evidence relevant to setting PM2.5 targets: update (on the WHO 2021 guidelines)",
    url: "https://assets.publishing.service.gov.uk/media/623075a3d3bf7f5a89aecec3/COMEAP_WHO_AQG_-_Defra_PM2.5_targets_advice__2_.pdf",
    published: "2022-01",
    method: "reference",
    notes: "The WHO's 2021 guideline for annual average PM2.5 is 5 µg/m³; the previous guideline was 10.",
  },
  "who-factsheet": {
    publisher: "World Health Organization (via the Climate and Clean Air Coalition)",
    title: "Ambient air pollution factsheet",
    url: "https://www.ccacoalition.org/resources/ambient-air-pollution-factsheet",
    published: "2024",
    method: "reference",
  },
  "iqair-2025": {
    publisher: "IQAir",
    title: "2025 World Air Quality Report: only 14% of cities meet WHO air pollution guideline",
    url: "https://www.iqair.com/us/newsroom/waqr-2025-pr",
    published: "2026-03-24",
    method: "reference",
    notes: "Ground monitor data from 9,446 cities in 143 countries, regions and territories.",
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

const YEAR = 2024, DEATHS_YEAR = 2023, AQG = 5;

// ---------- Readers ----------
// OWID chart CSV (csvType=full, short column names): { entity: { code, years: { year: value } } }.
function owidCsv(f) {
  const out = {};
  for (const r of readCsv(path.join(RAW, f))) {
    const k = Object.keys(r)[3];
    (out[r.entity] ??= { code: r.code, years: {} }).years[r.year] = tok(r[k]);
  }
  return out;
}
// OWID indicator API (<id>.data.json + <id>.metadata.json): { code or name: { year: value } }.
// The values are tokenised from the text so ints and floats keep the type Python gave them.
function owidInd(id) {
  const d = txt(`owid_ind_${id}.data.json`), m = JSON.parse(txt(`owid_ind_${id}.metadata.json`));
  const arr = (k) => d.match(new RegExp(`"${k}"\\s*:\\s*\\[([^\\]]*)\\]`))[1].split(",").map((s) => s.trim());
  const values = arr("values").map(tok), years = arr("years").map(Number), ents = arr("entities").map(Number);
  const ent = Object.fromEntries(m.dimensions.entities.values.map((e) => [e.id, e.code || e.name]));
  const out = {};
  values.forEach((v, i) => ((out[ent[ents[i]]] ??= {})[years[i]] = v));
  return out;
}
const sat = owidCsv("owid_outdoor-air-pollution-exposure.csv");
const aqli = owidCsv("owid_human-caused-air-pollution-exposure.csv");
const aqliBy = Object.fromEntries(Object.values(aqli).filter((e) => e.code).map((e) => [e.code, e.years]));
// The published series is the urban-areas breakdown of SDG 11.6.2 (the "exposure-to-outdoor-air-pollution-in-urban-areas" chart).
const who = owidInd(1298167);
const dAir = owidInd(1171305), dPm = owidInd(1171332), dOz = owidInd(1171314), dHh = owidInd(1171721);
const share = owidInd(1172183), rate = owidInd(1173306);
const isoN3 = Object.fromEntries(readCsv(path.join(RAW, "iso3166_all.csv")).map((r) => [r["alpha-3"], r["country-code"]]));

// ---------- Bands (upper bound included) ----------
const BANDS = [
  { band: "Within WHO guideline (5 or less)", min: 0, max: 5, unit: "µg/m³", source: "comeap-who-aqg" },
  { band: "Up to 2× the guideline", min: 5, max: 10, unit: "µg/m³", source: "comeap-who-aqg" },
  { band: "2 to 3×", min: 10, max: 15, unit: "µg/m³", source: "comeap-who-aqg" },
  { band: "3 to 7×", min: 15, max: 35, unit: "µg/m³", source: "comeap-who-aqg" },
  { band: "Over 7× (35 or more)", min: 35, max: null, unit: "µg/m³", source: "comeap-who-aqg" },
];
const bandOf = (x) => (x == null ? null : BANDS.find((b) => b.max == null || x <= b.max).band);

// ---------- Countries ----------
const countries = [];
for (const [name, e] of Object.entries(sat)) {
  const k = e.code;
  if (!k || k.startsWith("OWID") || e.years[YEAR] == null) continue;
  const pm = e.years[YEAR];
  const rec = {
    country: name, iso3: k, iso_n3: isoN3[k], year: YEAR,
    pm25: r1(pm), times_guideline: r1(new Float(val(pm) / AQG)), band: bandOf(val(pm)),
    pm25_2000: r1(e.years[2000]), pm25_2015: r1(e.years[2015]), pm25_human: r1(aqliBy[k]?.[YEAR]), source: "satpm",
  };
  const wy = Object.keys(who[k] ?? {}).map(Number).filter((y) => who[k][y] != null).sort((a, b) => b - a)[0];
  if (wy != null) Object.assign(rec, { who_pm25: r1(who[k][wy]), who_year: wy, who_source: "who-sdg1162" });
  if (dAir[k]?.[DEATHS_YEAR] != null) Object.assign(rec, {
    deaths_air: ri(dAir[k][DEATHS_YEAR]), deaths_pm: ri(dPm[k]?.[DEATHS_YEAR]), deaths_household: ri(dHh[k]?.[DEATHS_YEAR]), deaths_ozone: ri(dOz[k]?.[DEATHS_YEAR]),
    share_deaths_pct: r1(share[k]?.[DEATHS_YEAR]), pm_death_rate: r1(rate[k]?.[DEATHS_YEAR]), deaths_year: DEATHS_YEAR, deaths_source: "ihme-gbd2023",
  });
  countries.push(rec);
}
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
countries.sort((a, b) => val(b.pm25) - val(a.pm25) || byName(a.country, b.country));

// ---------- World and continents ----------
const W = sat.World.years;
const world_pm25 = Object.keys(W).map(Number).sort((a, b) => a - b).filter((y) => W[y] != null).map((year) => ({ year, pm25: r1(W[year]), source: "satpm" }));
const world_deaths = Object.keys(dAir.OWID_WRL).map(Number).sort((a, b) => a - b).map((year) => ({
  year, air: ri(dAir.OWID_WRL[year]), ambient_pm: ri(dPm.OWID_WRL[year]), household: ri(dHh.OWID_WRL[year]), ozone: ri(dOz.OWID_WRL[year]), source: "ihme-gbd2023",
}));
const regions = ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"].map((region) => ({ region, year: YEAR, pm25: r1(sat[region].years[YEAR]), source: "satpm" }))
  .sort((a, b) => val(b.pm25) - val(a.pm25) || byName(a.region, b.region));

// ---------- Facts ----------
const facts = [
  { id: "aqg", label: "WHO guideline for annual average PM2.5, set in 2021", value: 5, unit: "µg/m³", note: "Halved from the previous 10", source: "comeap-who-aqg" },
  { id: "who99", label: "Share of the world's population living where WHO air quality guidelines were not met, 2019", value: 99, unit: "%", source: "who-factsheet" },
  { id: "who67", label: "Premature deaths a year from ambient and household air pollution combined (WHO)", value: 6700000, unit: "deaths", source: "who-factsheet" },
  { id: "iq14", label: "Share of cities meeting the WHO PM2.5 guideline, 2025", value: 14, unit: "%", note: "Down from 17% the year before; 9,446 cities", source: "iqair-2025" },
  { id: "iq13", label: "Countries and territories meeting the guideline in 2025, by ground monitors", value: 13, unit: "places", note: "French Polynesia, Puerto Rico, US Virgin Islands, Barbados, New Caledonia, Iceland, Bermuda, Réunion, Andorra, Australia, Grenada, Panama and Estonia", source: "iqair-2025" },
  { id: "iqcity", label: "Most polluted city in 2025: Loni, India", value: 112.5, unit: "µg/m³", source: "iqair-2025" },
];

const TABLES = [
  ["countries", "PM2.5 exposure and air pollution deaths by country", "Population-weighted PM2.5 (SatPM, latest year), WHO's SDG 11.6.2 estimate, and IHME deaths attributable to air pollution in 2023.", countries],
  ["world_pm25", "World PM2.5 exposure over time", "Population-weighted PM2.5 for the world by year (SatPM).", world_pm25],
  ["world_deaths", "World air pollution deaths over time", "Deaths attributable to air pollution by type, 1990 to 2023 (IHME GBD 2023).", world_deaths],
  ["regions", "PM2.5 by continent", "Population-weighted PM2.5 by continent, latest year (SatPM).", regions],
  ["bands", "Map classes", "Bands used to colour the map, as multiples of the WHO 2021 guideline of 5 µg/m³.", BANDS],
  ["facts", "Headline findings", "Published figures from WHO and IQAir.", facts],
];
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys, ...records.map((r) => keys.map((k) => r[k]))].map((row) => row.map(csvCell).join(",") + "\n").join(""));
  fs.writeFileSync(path.join(OUT, `${id}.json`), pyJson({ id, title, description, records }));
}
fs.writeFileSync(path.join(OUT, "sources.json"), pyJson({ sources: SOURCES }));
fs.writeFileSync(path.join(OUT, "index.json"), pyJson({ variant: "air", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, 2, true));
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>air data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>air data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor", Our World in Data and the original publishers, whose own terms also apply (IHME data are for non-commercial use).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.aqg = AQG;
DATA.world_share_deaths = r1(share.OWID_WRL[DEATHS_YEAR]);
fs.writeFileSync(path.join(REPO, "air/assets/data.js"), `export const SOURCES=${pyJson(SOURCES, null)};\nexport const DATA=${pyJson(DATA, null)};\n`);

console.log("countries", countries.length, "who", countries.filter((r) => r.who_pm25 != null).length, "deaths", countries.filter((r) => r.deaths_air != null).length, "missing iso_n3", countries.filter((r) => !r.iso_n3).map((r) => r.iso3));
console.log("world pm25", world_pm25.at(-1), "deaths", DEATHS_YEAR, val(world_deaths.at(-1).air), "share", val(DATA.world_share_deaths));
console.log("top", countries.slice(0, 5).map((r) => `${r.iso3} ${val(r.pm25)}`).join(", "), "· within guideline", countries.filter((r) => r.band === BANDS[0].band).length);
