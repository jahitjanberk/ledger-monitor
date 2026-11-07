// Builds data/fertilizer/* and fertilizer/assets/data.js for the Fertiliser Prices & Supply dashboard
// from the raw downloads in scripts/.raw/fertilizer (FAOSTAT Fertilizers by Nutrient, World Bank
// price forecasts, Defra agricultural price indices and the British Survey of Fertiliser Practice)
// and the shared World Bank Pink Sheet in scripts/.raw/cmo.
//   node scripts/build/fertilizer.mjs   (raw downloads in scripts/.raw/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "../lib/csv.mjs";
import { readSheet } from "../lib/xlsx.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "fertilizer");
const OUT = path.join(REPO, "data/fertilizer");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "fertilizer/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const YEAR = 2024, FROM = 2020; // FAOSTAT latest year; oldest year accepted for a country's latest value

// ---------- Sources ----------
const SOURCES = {
  "wb-pinksheet": {
    publisher: "World Bank",
    title: "Commodity Price Data (The Pink Sheet), monthly prices and indices, November 2026",
    url: "https://www.worldbank.org/en/research/commodity-markets",
    published: "2026-11-03",
    method: "reference",
    notes: "Nominal US dollars a tonne, monthly averages, January 1960 to October 2026. Urea: prill, spot, f.o.b. Middle East (Black Sea before March 2022). DAP: spot, f.o.b. US Gulf. TSP: spot, import US Gulf. Potassium chloride (muriate of potash): granular, spot, CFR Brazil. Phosphate rock: f.o.b. North Africa. Natural gas, Europe: $ per million British thermal units. The fertiliser index is the World Bank's (2010 = 100). CC BY 4.0.",
  },
  "wb-cmo-forecast": {
    publisher: "World Bank",
    title: "Commodity Markets Outlook, October 2026: Table 1, commodity prices and forecasts",
    url: "https://thedocs.worldbank.org/en/doc/2ac43f46629cf90c2ea5b8929a343593-0050012026/related/CMO-October-2026-Forecasts.pdf",
    published: "2026-10-28",
    method: "reference",
    notes: "Annual averages for 2024 and 2025 and forecasts for 2026 to 2028, nominal US dollars, with the April 2026 forecasts for comparison. Forecasts assume conflicts affecting supply do not escalate significantly. CC BY 4.0.",
  },
  "wb-fert-blog": {
    publisher: "World Bank Data Blog (John Baffes and Kaltrina Temaj)",
    title: "Fertilizer prices surge as Strait of Hormuz disruptions tighten supplies",
    url: "https://blogs.worldbank.org/en/opendata/fertilizer-prices-surge-as-strait-of-hormuz-disruptions-tighten-",
    published: "2026-05-14",
    method: "reference",
    notes: "Based on the April 2026 Commodity Markets Outlook. Quoted for the Middle East's share of urea exports and for fertiliser affordability.",
  },
  "faostat-rfn": {
    publisher: "FAO (FAOSTAT)",
    title: "Fertilizers by Nutrient (RFN), July 2026 update",
    url: "https://www.fao.org/faostat/en/#data/RFN",
    published: "2026-07-30",
    method: "reference",
    notes: "Production, imports, exports and agricultural use of inorganic fertilisers in tonnes of nutrient: nitrogen (N), phosphate (P2O5) and potash (K2O), 1961 to 2024, and use per hectare of cropland. Values are a mix of official, estimated and imputed figures; trade is partly mirror data from partner countries. CC BY 4.0.",
  },
  "aljazeera-2026-08": {
    publisher: "Al Jazeera",
    title: "How a 95 percent drop in Hormuz traffic changed global shipping",
    url: "https://www.aljazeera.com/news/2026/8/27/how-a-95-percent-drop-in-hormuz-traffic-changed-global-shipping",
    published: "2026-08-27",
    method: "reference",
    notes: "Date the Strait of Hormuz was announced closed. The same source is used by the Chokepoints dashboard.",
  },
  "defra-api": {
    publisher: "Defra",
    title: "Agricultural price indices, United Kingdom: August 2026 (monthly dataset, 2020 = 100)",
    url: "https://www.gov.uk/government/statistics/agricultural-price-indices",
    published: "2026-10-29",
    method: "reference",
    notes: "Indices of the prices UK farmers pay for fertilisers and other inputs and receive for wheat and other outputs, January 2014 to August 2026. Open Government Licence v3.0.",
  },
  "defra-bsfp": {
    publisher: "Defra",
    title: "British Survey of Fertiliser Practice 2025: time series dataset (Table GB1.1)",
    url: "https://www.gov.uk/government/statistical-data-sets/british-survey-of-fertiliser-practice-dataset",
    published: "2026-07-16",
    method: "reference",
    notes: "Overall application rates of mineral fertiliser in Great Britain, kg of nutrient per hectare, averaged over all fields including those that received none, 1992 to 2025, for tillage crops, grassland and both. Open Government Licence v3.0.",
  },
  "natural-earth": {
    publisher: "Natural Earth",
    title: "Admin 0 countries, 1:110m",
    url: "https://www.naturalearthdata.com/",
    published: "2026",
    method: "reference",
    notes: "Public domain. Used to match countries to map shapes.",
  },
};

// ---------- World Bank Pink Sheet, monthly ----------
const CMO = path.join(RAW_ROOT, "cmo");
const ps = readSheet(CMO, "sheet2.xml");
const hdr = ps[4].map((h) => (h ?? "").trim());
const col = (name) => { const i = hdr.findIndex((h) => h === name); if (i < 0) throw new Error("No Pink Sheet column " + name); return i; };
const PS = { urea: col("Urea"), dap: col("DAP"), tsp: col("TSP"), potash: col("Potassium chloride **"), phosphate_rock: col("Phosphate rock"), gas_europe: col("Natural gas, Europe"), gas_us: col("Natural gas, US"), maize: col("Maize"), wheat: col("Wheat, US HRW") };
const px = readSheet(CMO, "sheet3.xml");
const ih = px[6].map((h) => (h ?? "").trim()), ih2 = px[7].map((h) => (h ?? "").trim());
const FI = ih.findIndex((h) => h === "Fertilizers **"), FOOD = ih2.findIndex((h) => h === "Food **");
if (FI < 0 || FOOD < 0) throw new Error("Pink Sheet index columns not found");
const idx = Object.fromEntries(px.filter((r) => r && /^\d{4}M\d{2}$/.test(r[0])).map((r) => [r[0], r]));
const prices = ps.filter((r) => r && /^\d{4}M\d{2}$/.test(r[0])).map((r) => {
  const o = { month: r[0].replace("M", "-") };
  for (const [k, i] of Object.entries(PS)) o[k] = typeof r[i] === "number" ? r1(r[i], 2) : null;
  const ir = idx[r[0]];
  o.fert_index = typeof ir?.[FI] === "number" ? r1(ir[FI]) : null;
  o.food_index = typeof ir?.[FOOD] === "number" ? r1(ir[FOOD]) : null;
  o.source = "wb-pinksheet";
  return o;
});
const psDate = String(ps[3]?.[0] ?? "");

// ---------- World Bank forecasts (pdftotext -raw of the forecast table) ----------
const ftxt = fs.readFileSync(path.join(RAW, "cmo_forecasts.txt"), "utf8").split(/\r?\n/);
const FROWS = [["Fertilizers", "fert_index", "Fertiliser price index", "2010 = 100"], ["DAP", "dap", "DAP", "$/t"], ["Phosphate rock", "phosphate_rock", "Phosphate rock", "$/t"], ["Potassium chloride", "potash", "Potassium chloride (potash)", "$/t"], ["TSP", "tsp", "TSP", "$/t"], ["Urea, E. Europe", "urea", "Urea", "$/t"]];
const forecasts = FROWS.map(([label, id, name, unit]) => {
  const line = ftxt.find((l) => l.startsWith(label + " ") && /\d/.test(l));
  if (!line) throw new Error("Forecast row not found: " + label);
  const v = line.slice(label.length).replace("$/mt", "").trim().split(/\s+/).map(Number);
  if (v.length !== 10 || v.some((x) => !isFinite(x))) throw new Error("Bad forecast row: " + line);
  return { id, commodity: name, unit, y2024: v[0], y2025: v[1], f2026: v[2], f2027: v[3], f2028: v[4], chg2026_pct: v[5], chg2027_pct: v[6], chg2028_pct: v[7], april_f2026: v[8], april_f2027: v[9], source: "wb-cmo-forecast" };
});

// ---------- FAOSTAT Fertilizers by Nutrient ----------
const rfnRows = parseCsv(fs.readFileSync(path.join(RAW, "rfn/Inputs_FertilizersNutrient_E_All_Data_(Normalized).csv"), "utf8"));
const H = rfnRows[0];
const ci = (n) => H.indexOf(n);
const [cA, cM, cN, cI, cE, cY, cV] = ["Area Code", "Area Code (M49)", "Area", "Item Code", "Element Code", "Year", "Value"].map(ci);
const NUT = { 3102: "n", 3103: "p", 3104: "k" };
const EL = { 5510: "prod", 5610: "imp", 5910: "exp", 5157: "use", 5159: "ha" };
const D = {}; // D[areaCode] = { name, m49, n: { prod: { year: v } } }
for (const r of rfnRows.slice(1)) {
  const nu = NUT[r[cI]], el = EL[r[cE]];
  if (!nu || !el || r[cV] === "" || r[cV] == null) continue;
  const a = (D[r[cA]] ??= { name: r[cN], m49: r[cM].replace(/^'/, "") });
  ((a[nu] ??= {})[el] ??= {})[+r[cY]] = +r[cV];
}
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BYN = Object.fromEntries(AIR.map((r) => [r.iso_n3, r]));
const g = (a, nu, el, y) => a?.[nu]?.[el]?.[y] ?? null;
const W = D["5000"];
const kt = (v) => (v == null ? null : r1(v / 1000, 1));
const mt = (v) => (v == null ? null : r1(v / 1e6, 2));

// World, by year
const world = [];
for (let y = 1961; y <= YEAR; y++) {
  const o = { year: y };
  for (const nu of ["n", "p", "k"]) {
    o[`${nu}_prod_mt`] = mt(g(W, nu, "prod", y));
    o[`${nu}_use_mt`] = mt(g(W, nu, "use", y));
    o[`${nu}_exp_mt`] = mt(g(W, nu, "exp", y));
    o[`${nu}_per_ha`] = r1(g(W, nu, "ha", y));
  }
  o.source = "faostat-rfn";
  world.push(o);
}

// Regions, use per hectare of cropland, by year
const REG = [["5000", "World"], ["5100", "Africa"], ["5200", "Americas"], ["5300", "Asia"], ["5400", "Europe"], ["5500", "Oceania"], ["5801", "Least developed countries"]];
const regions = [];
for (const [code, name] of REG) for (let y = 1961; y <= YEAR; y++) {
  const a = D[code];
  const n = g(a, "n", "ha", y), p = g(a, "p", "ha", y), k = g(a, "k", "ha", y);
  if (n == null && p == null && k == null) continue;
  regions.push({ region: name, year: y, n_per_ha: r1(n), p_per_ha: r1(p), k_per_ha: r1(k), npk_per_ha: n != null && p != null && k != null ? r1(n + p + k) : null, n_use_mt: mt(g(a, "n", "use", y)), source: "faostat-rfn" });
}

// Countries
const BANDS = [
  { map: "nitrogen", band: "Under 10 kg", min: 0, max: 10, unit: "kg of nitrogen per hectare of cropland", source: "faostat-rfn" },
  { map: "nitrogen", band: "10 to 50 kg", min: 10, max: 50, unit: "kg of nitrogen per hectare of cropland", source: "faostat-rfn" },
  { map: "nitrogen", band: "50 to 100 kg", min: 50, max: 100, unit: "kg of nitrogen per hectare of cropland", source: "faostat-rfn" },
  { map: "nitrogen", band: "100 to 150 kg", min: 100, max: 150, unit: "kg of nitrogen per hectare of cropland", source: "faostat-rfn" },
  { map: "nitrogen", band: "150 kg or more", min: 150, max: null, unit: "kg of nitrogen per hectare of cropland", source: "faostat-rfn" },
  { map: "imports", band: "Net exporter", min: null, max: 0, unit: "net imports as % of agricultural use, N + P2O5 + K2O", source: "faostat-rfn" },
  { map: "imports", band: "Under 50%", min: 0, max: 50, unit: "net imports as % of agricultural use, N + P2O5 + K2O", source: "faostat-rfn" },
  { map: "imports", band: "50 to 80%", min: 50, max: 80, unit: "net imports as % of agricultural use, N + P2O5 + K2O", source: "faostat-rfn" },
  { map: "imports", band: "80 to 95%", min: 80, max: 95, unit: "net imports as % of agricultural use, N + P2O5 + K2O", source: "faostat-rfn" },
  { map: "imports", band: "95% or more", min: 95, max: null, unit: "net imports as % of agricultural use, N + P2O5 + K2O", source: "faostat-rfn" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);
const latestYear = (a) => { for (let y = YEAR; y >= FROM; y--) if (g(a, "n", "use", y) != null || g(a, "n", "ha", y) != null) return y; return null; };
const countries = [];
for (const [code, a] of Object.entries(D)) {
  if (+code >= 5000) continue;
  const c = BYN[a.m49];
  if (!c) continue;
  const y = latestYear(a);
  if (y == null) continue;
  const o = { country: c.country, iso3: c.iso3, iso_n3: c.iso_n3, year: y };
  let use = 0, imp = 0, exp = 0, ok = true;
  for (const nu of ["n", "p", "k"]) {
    const u = g(a, nu, "use", y), m = g(a, nu, "imp", y) ?? 0, x = g(a, nu, "exp", y) ?? 0;
    o[`${nu}_per_ha`] = r1(g(a, nu, "ha", y));
    o[`${nu}_use_kt`] = kt(u);
    o[`${nu}_prod_kt`] = kt(g(a, nu, "prod", y));
    o[`${nu}_imp_kt`] = kt(g(a, nu, "imp", y));
    o[`${nu}_exp_kt`] = kt(g(a, nu, "exp", y));
    if (u == null) ok = false; else { use += u; imp += m; exp += x; }
  }
  o.npk_per_ha = o.n_per_ha != null && o.p_per_ha != null && o.k_per_ha != null ? r1(o.n_per_ha + o.p_per_ha + o.k_per_ha) : null;
  o.n_per_ha_2000 = r1(g(a, "n", "ha", 2000));
  const un = g(a, "n", "use", y);
  o.n_import_dep_pct = un > 0 ? r1((100 * ((g(a, "n", "imp", y) ?? 0) - (g(a, "n", "exp", y) ?? 0))) / un, 0) : null;
  o.import_dep_pct = ok && use > 0 ? r1((100 * (imp - exp)) / use, 0) : null;
  o.source = "faostat-rfn";
  o.nitrogen_band = bandOf("nitrogen", o.n_per_ha);
  o.imports_band = bandOf("imports", o.import_dep_pct);
  countries.push(o);
}
countries.sort((a, b) => a.country.localeCompare(b.country));

// Top producers and exporters, latest year
const producers = [];
for (const nu of ["n", "p", "k"]) for (const el of ["prod", "exp"]) {
  const tot = g(W, nu, el, YEAR);
  const list = Object.entries(D).filter(([code, a]) => +code < 5000 && BYN[a.m49]).map(([, a]) => ({ a, v: g(a, nu, el, YEAR) ?? 0 })).filter((x) => x.v > 0).sort((p, q) => q.v - p.v).slice(0, 10);
  list.forEach(({ a, v }, i) => producers.push({ nutrient: { n: "Nitrogen (N)", p: "Phosphate (P2O5)", k: "Potash (K2O)" }[nu], nutrient_id: nu, measure: el === "prod" ? "production" : "exports", rank: i + 1, country: BYN[a.m49].country, iso3: BYN[a.m49].iso3, kt: kt(v), share_pct: r1((100 * v) / tot), world_kt: kt(tot), year: YEAR, source: "faostat-rfn" }));
}

// Gulf states' share of exports, latest year
const GULF = ["048", "364", "414", "512", "634", "682", "784"]; // Bahrain, Iran, Kuwait, Oman, Qatar, Saudi Arabia, UAE
const gulf = [];
for (const m49 of GULF) {
  const a = Object.entries(D).find(([code, x]) => +code < 5000 && x.m49 === m49)?.[1];
  if (!a) continue;
  const o = { country: BYN[m49].country, iso3: BYN[m49].iso3, year: YEAR };
  for (const nu of ["n", "p", "k"]) { const v = g(a, nu, "exp", YEAR); o[`${nu}_exp_kt`] = kt(v); o[`${nu}_share_pct`] = v != null ? r1((100 * v) / g(W, nu, "exp", YEAR), 2) : null; }
  o.source = "faostat-rfn";
  gulf.push(o);
}
gulf.sort((a, b) => (b.n_exp_kt ?? 0) - (a.n_exp_kt ?? 0));

// ---------- UK: Defra agricultural price indices ----------
const API = parseCsv(fs.readFileSync(path.join(RAW, "API_20261029.csv"), "utf8"));
const AK = { fertilisers: "fertilisers_and_soil_improvers", nitrogen: "straight_fertilisers_nitrogenous", phosphate: "straight_fertilisers_phosphatic", potash: "straight_fertilisers_potassic", compound: "compound_fertilisers", wheat: "wheat", all_inputs: "all_agricultural_inputs", all_outputs: "all_agricultural_outputs" };
const am = {};
for (const r of API.slice(1)) { const k = Object.entries(AK).find(([, v]) => v === r[1])?.[0]; if (k && r[2]) (am[r[2].slice(0, 7)] ??= {})[k] = r1(+r[3]); }
const uk_prices = Object.keys(am).sort().map((m) => ({ month: m, ...Object.fromEntries(Object.keys(AK).map((k) => [k, am[m][k] ?? null])), source: "defra-api" }));

// ---------- UK: British Survey of Fertiliser Practice ----------
const un = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
function ods(file, name) {
  const X = fs.readFileSync(file, "utf8");
  const i = X.indexOf(`<table:table table:name="${name}"`);
  if (i < 0) throw new Error(`BSFP table ${name} not found`);
  const body = X.slice(i, X.indexOf("</table:table>", i)), rows = [];
  for (const rm of body.matchAll(/<table:table-row[^>]*?(?:\/>|>([\s\S]*?)<\/table:table-row>)/g)) {
    const row = [];
    for (const c of (rm[1] ?? "").matchAll(/<table:(?:covered-)?table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:(?:covered-)?table-cell>)/g)) {
      const rep = Math.min(+(/table:number-columns-repeated="(\d+)"/.exec(c[1])?.[1] ?? 1), 60);
      const num = /office:value="([^"]+)"/.exec(c[1])?.[1];
      const txt = c[2] ? [...c[2].matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((m) => un(m[1])).join(" ") : "";
      for (let k = 0; k < rep; k++) row.push(num != null ? +num : txt === "" ? null : txt);
    }
    rows.push(row);
  }
  return rows;
}
const bs = ods(path.join(RAW, "bsfp_ts/content.xml"), "GB1_1_NPKS_Time_series");
const yh = bs.find((r) => r[0] === "NITROGEN" && r[2] === "Units");
const BY = yh.slice(3).filter((v) => typeof v === "number");
const LAND = { "All crops": "crops", "All grass": "grass", "All crops and grass": "all" };
const NU = { N: "n", P2O5: "p", K2O: "k" };
const ukr = {};
for (const r of bs) {
  if (r[2] !== "kg/ha (overall)" || !LAND[r[0]] || !NU[r[1]]) continue;
  BY.forEach((y, i) => { const v = r[3 + i]; (ukr[y] ??= {})[`${NU[r[1]]}_${LAND[r[0]]}`] = typeof v === "number" ? r1(v) : null; });
}
const uk_rates = BY.map((y) => ({ year: y, ...ukr[y], source: "defra-bsfp" }));

// ---------- Headline findings ----------
const fiF = forecasts.find((f) => f.id === "fert_index");
const facts = [
  { id: "closure", label: "Iran's Revolutionary Guard announced the Strait of Hormuz closed", value: "2026-03-02", unit: "date", note: "Traffic fell to an average of five vessels a day", source: "aljazeera-2026-08" },
  { id: "me_urea", label: "Middle East share of global urea exports", value: 25, unit: "%", note: "\"Nearly one-quarter\"", source: "wb-fert-blog" },
  { id: "afford", label: "Fertiliser affordability for farmers in April 2026", value: "mid-2022", unit: "weakest since", note: "Fertiliser prices against food crop prices", source: "wb-fert-blog" },
  { id: "fi2026", label: "Forecast change in the World Bank fertiliser price index, 2026", value: fiF.chg2026_pct, unit: "%", note: `April 2026 forecast: index ${fiF.april_f2026} for 2026, against ${fiF.y2025} in 2025`, source: "wb-cmo-forecast" },
  { id: "fi2027", label: "Forecast change in the World Bank fertiliser price index, 2027", value: fiF.chg2027_pct, unit: "%", note: "", source: "wb-cmo-forecast" },
  { id: "ukinputs", label: "Change in UK agricultural input prices, 12 months to August 2026", value: 8.6, unit: "%", note: "Fertilisers and soil improvers contributed 1.4 percentage points", source: "defra-api" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Fertiliser use, production and trade by country", `Agricultural use per hectare of cropland, use, production, imports and exports of nitrogen (N), phosphate (P2O5) and potash (K2O), latest year ${FROM} to ${YEAR} (FAOSTAT), and net imports as a share of use.`, countries],
  ["prices", "Fertiliser, gas and grain prices, monthly", `World Bank Pink Sheet, nominal US dollars a tonne (gas: $/mmbtu), January 1960 to ${prices.at(-1).month}, with the World Bank fertiliser and food price indices (2010 = 100).`, prices],
  ["forecasts", "World Bank fertiliser price forecasts", "Annual averages for 2024 and 2025 and forecasts for 2026 to 2028 from the October 2026 Commodity Markets Outlook, with the April 2026 forecasts.", forecasts],
  ["world", "World fertiliser production, use and exports", `Million tonnes of nutrient and kg per hectare of cropland, 1961 to ${YEAR} (FAOSTAT).`, world],
  ["regions", "Fertiliser use per hectare by region", `Kg of nutrient per hectare of cropland, 1961 to ${YEAR}, by continent and for the least developed countries (FAOSTAT).`, regions],
  ["producers", "Top producers and exporters by nutrient", `The ten largest producers and exporters of nitrogen, phosphate and potash fertilisers in ${YEAR}, with shares of the world total (FAOSTAT).`, producers],
  ["gulf", "Gulf states' fertiliser exports", `Exports of Bahrain, Iran, Kuwait, Oman, Qatar, Saudi Arabia and the United Arab Emirates in ${YEAR}, thousand tonnes of nutrient and share of world exports (FAOSTAT).`, gulf],
  ["uk_prices", "UK fertiliser and wheat price indices, monthly", `Defra agricultural price indices, 2020 = 100, January 2014 to ${uk_prices.at(-1).month}.`, uk_prices],
  ["uk_rates", "Fertiliser application rates in Great Britain", `Overall rates, kg of nutrient per hectare, ${BY[0]} to ${BY.at(-1)}, for tillage crops, grassland and both (British Survey of Fertiliser Practice).`, uk_rates],
  ["bands", "Map classes", "Bands used to colour the two maps.", BANDS],
  ["facts", "Headline findings", "Figures quoted from the World Bank, Defra and Al Jazeera.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "fertilizer", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>fertilizer data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>fertilizer data</h1><p>Every dataset behind the Fertiliser Prices &amp; Supply dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (World Bank and FAO: CC BY 4.0; Defra: Open Government Licence v3.0).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

// The dashboard only needs prices from 1990 and the price columns it draws.
const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.prices = prices.filter((r) => r.month >= "1990-01").map(({ gas_us, wheat, source, ...r }) => r);
DATA.regions = regions.map(({ region, year, n_per_ha, npk_per_ha }) => ({ region, year, n_per_ha, npk_per_ha }));
DATA.annual = (() => {
  const by = {};
  for (const r of prices) { const y = +r.month.slice(0, 4); for (const k of ["urea", "dap", "potash", "tsp", "phosphate_rock"]) if (r[k] != null) ((by[y] ??= {})[k] ??= []).push(r[k]); }
  return Object.keys(by).map(Number).sort().map((y) => ({ year: y, months: Math.max(...Object.values(by[y]).map((a) => a.length)), ...Object.fromEntries(Object.entries(by[y]).map(([k, a]) => [k, r1(a.reduce((s, v) => s + v, 0) / a.length, 1)])), source: "wb-pinksheet" }));
})();
DATA.year = YEAR;
fs.writeFileSync(path.join(REPO, "fertilizer/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const last = prices.at(-1), feb = prices.find((r) => r.month === "2026-02"), apr = prices.find((r) => r.month === "2026-04");
const since = (k) => { const v = last[k]; const p = [...prices].reverse().slice(1).find((r) => r[k] != null && r[k] >= v); return p?.month ?? "never"; };
console.log(psDate, "last", JSON.stringify(last));
console.log("urea feb→apr", feb.urea, apr.urea, r1((100 * (apr.urea - feb.urea)) / feb.urea), "now", last.urea, "| higher than now last:", ["urea", "dap", "tsp", "potash", "gas_europe", "fert_index"].map((k) => `${k} ${since(k)}`).join(", "));
console.log("forecasts", forecasts.map((f) => `${f.id} ${f.y2025}->${f.f2026} (${f.chg2026_pct}%) apr ${f.april_f2026}`).join("; "));
console.log("countries", countries.length, "with n/ha", countries.filter((r) => r.n_per_ha != null).length, "with dep", countries.filter((r) => r.import_dep_pct != null).length, "years", JSON.stringify(Object.entries(countries.reduce((m, r) => ((m[r.year] = (m[r.year] ?? 0) + 1), m), {}))));
for (const m of ["nitrogen", "imports"]) console.log(m, JSON.stringify(BANDS.filter((b) => b.map === m).map((b) => [b.band, countries.filter((r) => r[`${m}_band`] === b.band).length])));
console.log("top N/ha", [...countries].filter((r) => r.n_per_ha != null).sort((a, b) => b.n_per_ha - a.n_per_ha).slice(0, 10).map((r) => `${r.iso3} ${r.n_per_ha}`).join(", "));
console.log("world 2024", JSON.stringify(world.at(-1)));
console.log("regions 2024", regions.filter((r) => r.year === YEAR).map((r) => `${r.region} N ${r.n_per_ha} NPK ${r.npk_per_ha}`).join("; "));
console.log("gulf", gulf.map((r) => `${r.iso3} N ${r.n_share_pct}% P ${r.p_share_pct}%`).join(", "), "sum N", r1(gulf.reduce((s, r) => s + (r.n_share_pct ?? 0), 0)), "P", r1(gulf.reduce((s, r) => s + (r.p_share_pct ?? 0), 0)));
for (const nu of ["n", "p", "k"]) console.log(nu, "top3 prod", producers.filter((p) => p.nutrient_id === nu && p.measure === "production").slice(0, 3).map((p) => `${p.iso3} ${p.share_pct}`).join(" "), "| exp", producers.filter((p) => p.nutrient_id === nu && p.measure === "exports").slice(0, 3).map((p) => `${p.iso3} ${p.share_pct}`).join(" "));
const gb = countries.find((r) => r.iso3 === "GBR"); console.log("GBR", JSON.stringify(gb));
console.log("uk_prices last", JSON.stringify(uk_prices.at(-1)), "uk_rates last", JSON.stringify(uk_rates.at(-1)));
console.log("unmatched FAOSTAT areas", Object.entries(D).filter(([c, a]) => +c < 5000 && !BYN[a.m49]).map(([, a]) => a.name).join("; "));
