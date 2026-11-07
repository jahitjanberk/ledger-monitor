// Builds data/disasters/* and disasters/assets/data.js for the Floods, Disasters & Insurance Gaps dashboard
// from the raw downloads in scripts/.raw/disasters (Rentschler et al. 2022 supplementary table, as text;
// IDMC disaster displacement events from HDX; World Bank population; the Environment Agency's NaFRA 2024
// page from the GOV.UK content API). Figures quoted from published reports (CRED, Swiss Re Institute,
// Munich Re, ABI, Flood Re) are typed in below, each with its source id; the PDFs are kept in .raw for checking.
//   node scripts/build/disasters.mjs        (raw downloads in scripts/.raw/disasters/, or set RAW to their parent folder)
// See scripts/build/README.md for the files this builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "disasters");
const OUT = path.join(REPO, "data/disasters");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "disasters/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const YEAR = 2025, AVG_FROM = 2016; // displacement: latest year, and the ten-year window 2016 to 2025

const SOURCES = {
  rentschler: {
    publisher: "Rentschler, Salhab and Jafino (World Bank), Nature Communications",
    title: "Flood exposure and poverty in 188 countries, Supplementary Table 1: exposure headcount estimates at the country level",
    url: "https://www.nature.com/articles/s41467-022-30727-4",
    published: "2022-06-28",
    method: "reference",
    notes: "People living where a 1-in-100-year flood (river, rainfall or coastal) would reach more than 15 cm deep, by country, in thousands and as a share of the population (WorldPop 2020), and those among them living on under $1.90, $3.20 and $5.50 a day (2011 PPP). Flood hazard maps: Fathom (July 2020) and the European Commission's Joint Research Centre. Present-day hazard, no climate projection; flood defences are not modelled. Article and supplementary information licensed CC BY 4.0.",
  },
  idmc: {
    publisher: "Internal Displacement Monitoring Centre (IDMC)",
    title: "Global Internal Displacement Database: internal displacements (new displacements) associated with disasters, 2008 to 2025 (via HDX)",
    url: "https://data.humdata.org/dataset/idmc-internal-displacements-new-displacements-associated-with-disasters",
    published: "2026-05-24",
    method: "reference",
    notes: "Event-level estimates of movements caused by disasters, including pre-emptive evacuations; one person can be displaced more than once in a year. Country and year totals are summed here from the events (unrounded values). The data behind IDMC's 2026 Global Report on Internal Displacement. Licensed CC BY-IGO as stated on HDX.",
  },
  "wb-pop": {
    publisher: "World Bank, World Development Indicators",
    title: "Population, total (SP.POP.TOTL)",
    url: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    published: "2026-10-08",
    method: "reference",
    notes: "Used only to express disaster displacement per 1,000 people (average of 2016 to 2025). CC BY 4.0.",
  },
  "cred-2025": {
    publisher: "Centre for Research on the Epidemiology of Disasters (CRED), UCLouvain",
    title: "2025 Disasters in Numbers: Earth, Wind & Fire",
    url: "https://files.emdat.be/reports/2025_EMDAT_report.pdf",
    published: "2026",
    method: "reference",
    notes: "Summary figures from the EM-DAT Emergency Events Database for 2025 and the 2005 to 2024 annual average, by hazard type (data as of 17 March 2026). Natural hazards only; biological and extra-terrestrial hazards excluded. The report is licensed CC BY 4.0 (Delforge, Below, Wathelet, Tonnelier, Alonso and Speybroeck, 2026). The underlying EM-DAT database has its own, restrictive terms and is not republished here.",
  },
  "swissre-sigma": {
    publisher: "Swiss Re Institute",
    title: "Wildfires, storms, floods contribute to record 92% of global insured losses in 2025 (press release for sigma 1/2026, Natural catastrophes in 2025)",
    url: "https://mailing-ircockpit.eqs.com/crm-mailing/a21e80ec-571e-1015-b4d5-273805d60f5f/7e94e63f-40f9-4173-b70d-c354db2f89be/5d444775-2982-4084-8fbc-01fec20eaa13/Swiss+Re_NatCatSigma_2025FY_PR_EN.pdf",
    published: "2026-03-19",
    method: "reference",
    notes: "Headline figures quoted from the press release (PDF), in 2025 prices. The report is at https://www.swissre.com/institute/research/sigma-research/sigma-2026-01-natcat-2025-wildfire-storm-risk.html. Swiss Re's data are not republished; figures are quoted with a link.",
  },
  "munichre-2025": {
    publisher: "Munich Re NatCatSERVICE",
    title: "Natural disaster figures for 2025 (media release and full-year factsheet)",
    url: "https://www.munichre.com/en/company/media-relations/media-information-and-corporate-news/media-information/2026/natural-disaster-figures-2025.html",
    published: "2026-01-13",
    method: "reference",
    notes: "Overall and insured losses and fatalities for 2025, averages (inflation-adjusted), the largest events and the loss overview by continent, quoted from the factsheet. Droughts and heatwaves are not included. © Munich Re; quoted with a link, not republished as a dataset.",
  },
  "munichre-h1-2026": {
    publisher: "Munich Re NatCatSERVICE (half-year)",
    title: "Natural disasters in the first half of 2026 (media release and factsheet)",
    url: "https://www.munichre.com/en/company/media-relations/media-information-and-corporate-news/media-information/2026/natural-disaster-figures-first-half-2026.html",
    published: "2026-07-30",
    method: "reference",
    notes: "Headline figures for January to June 2026, quoted as published. © Munich Re.",
  },
  "ea-nafra": {
    publisher: "Environment Agency",
    title: "National assessment of flood and coastal erosion risk in England 2024",
    url: "https://www.gov.uk/government/publications/national-assessment-of-flood-and-coastal-erosion-risk-in-england-2024/national-assessment-of-flood-and-coastal-erosion-risk-in-england-2024",
    published: "2024-12-17",
    method: "reference",
    notes: "Properties (homes and businesses) in areas at risk of flooding from rivers and the sea and from surface water, by risk band and by region, present day and with climate change (tables 4, 6, 7, 8, 10, 12, 13, 14 and 16). High risk: a chance of more than 3.3% a year; medium: 1% to 3.3%; low: 0.1% to 1%. Being in an area at risk does not mean water will enter a property. Page last updated 5 August 2026. Open Government Licence v3.0.",
  },
  "abi-2025": {
    publisher: "Association of British Insurers",
    title: "Adverse weather pushes property insurance payouts to £6.1 billion in 2025",
    url: "https://abi.org.uk/media-hub/news-post/adverse-weather-pushes-property-insurance-payouts-to-61-billion-in-2025",
    published: "2026-02-17",
    method: "reference",
    notes: "UK insurers' property claims payouts in 2025, quoted from the press release. © ABI; quoted with a link.",
  },
  "floodre-2026": {
    publisher: "Flood Re",
    title: "Flood Re reports strong financial performance as it enters next phase (Annual Report and Accounts, year ended 31 March 2026)",
    url: "https://www.floodre.co.uk/flood-re-reports-strong-financial-performance-as-it-enters-next-phase-focused-on-resilience-and-targeted-support/",
    published: "2026-07-22",
    method: "reference",
    notes: "Flood Re is the joint government and insurance industry reinsurance scheme that keeps flood cover affordable for eligible UK homes at high risk; it is due to end in 2039. Figures quoted from the release.",
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

// ---------- Inputs ----------
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));
const BYNAME = Object.fromEntries(AIR.map((r) => [r.country.toLowerCase(), r]));
function csv(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// Rentschler et al. Supplementary Table 1, extracted from the PDF with `pdftotext -raw`. Country names that
// wrap onto two lines are joined; page numbers on their own line are skipped.
const ALIAS = { "Brunei Darussalam": "BRN", "Cabo Verde": "CPV", "Congo Republic": "COG", "Czech Republic": "CZE", "DR Congo": "COD", "Faeroe Islands": "FRO", "Kyrgyz Republic": "KGZ", Macedonia: "MKD", Micronesia: "FSM", "St. Lucia": "LCA", "Timor-Leste": "TLS" };
const flood = {}, floodUnmatched = [];
{
  const lines = fs.readFileSync(path.join(RAW, "rentschler/supp_raw.txt"), "utf8").split(/\r?\n/);
  const n = (s) => +s.replace(/,/g, "");
  let buf = "", count = 0;
  for (const l of lines.slice(lines.findIndex((x) => /^1 Afghanistan /.test(x)))) {
    if (/^\d+$/.test(l.trim())) { buf = ""; continue; }
    const line = (buf ? buf + " " : "") + l.trim();
    const m = /^(?:\d+ )?(.+?) ([\d,]+) ([\d,]+) ([\d.]+) ([\d,]+) ([\d.]+) ([\d,]+) ([\d.]+) ([\d,]+) ([\d.]+)$/.exec(line);
    if (!m) { buf = line; continue; }
    buf = ""; count++;
    const name = m[1].replace(/^\d+ /, "");
    const c = ALIAS[name] ? BY3[ALIAS[name]] : BYNAME[name.toLowerCase()];
    if (!c) floodUnmatched.push(name);
    else flood[c.iso3] = { pop_k: n(m[2]), exp_k: n(m[3]), exp_pct: +m[4], p190_k: n(m[5]), p190_pct: +m[6], p320_k: n(m[7]), p320_pct: +m[8], p550_k: n(m[9]), p550_pct: +m[10] };
    if (name === "Zimbabwe") break;
  }
  if (count !== 188) throw new Error(`Rentschler table: expected 188 countries, read ${count}`);
}

// IDMC disaster displacement events.
const [IH, ...IR] = csv(fs.readFileSync(path.join(RAW, "idmc/disaster-displacements.csv"), "utf8"));
const II = Object.fromEntries(IH.map((k, i) => [k, i]));
const HAZ = { Flood: "flood", Storm: "storm", Earthquake: "earthquake", Wildfire: "wildfire", Drought: "drought" };
const dispYear = {}, dispCty = {}, idmcUnmatched = new Set();
for (const r of IR) {
  if (r.length < IH.length - 2 || r[0].startsWith("#")) continue;
  const y = +r[II.year], v = +r[II.new_displacement] || 0, h = HAZ[r[II.hazard_type_name]] ?? "other";
  const w = (dispYear[y] ??= { total: 0, flood: 0, storm: 0, earthquake: 0, wildfire: 0, drought: 0, other: 0 });
  w.total += v; w[h] += v;
  if (!BY3[r[0]]) { idmcUnmatched.add(r[0]); continue; }
  const c = (dispCty[r[0]] ??= {});
  c[y] = (c[y] ?? 0) + v;
}

// World Bank population.
const POP = {};
for (const r of JSON.parse(fs.readFileSync(path.join(RAW, "wb/SP.POP.TOTL.json"), "utf8"))[1]) if (r.value != null) (POP[r.countryiso3code] ??= {})[+r.date] = r.value;

// NaFRA 2024 tables from the GOV.UK content API page.
const NAFRA = JSON.parse(fs.readFileSync(path.join(RAW, "pages/nafra.json"), "utf8")).details.body;
const tables = {};
for (const t of NAFRA.matchAll(/<table[\s\S]*?<\/table>/g)) {
  const before = NAFRA.slice(0, t.index), cap = [...before.matchAll(/Table (\d+):/g)].at(-1)?.[1];
  tables[cap] = [...t[0].matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => c[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()));
}
const nn = (s) => { const v = parseFloat(String(s).replace(/[,%km\s]/g, "")); return isFinite(v) ? v : null; };
const tab = (k) => { if (!tables[k]) throw new Error(`NaFRA table ${k} not found`); return tables[k].slice(1); };

// ---------- Bands ----------
const BANDS = [
  { map: "flood", band: "Under 10%", min: null, max: 10, unit: "% of people exposed to significant flood risk", source: "rentschler" },
  { map: "flood", band: "10 to 15%", min: 10, max: 15, unit: "% of people exposed to significant flood risk", source: "rentschler" },
  { map: "flood", band: "15 to 20%", min: 15, max: 20, unit: "% of people exposed to significant flood risk", source: "rentschler" },
  { map: "flood", band: "20 to 30%", min: 20, max: 30, unit: "% of people exposed to significant flood risk", source: "rentschler" },
  { map: "flood", band: "30% or more", min: 30, max: null, unit: "% of people exposed to significant flood risk", source: "rentschler" },
  { map: "poor", band: "Under 1%", min: null, max: 1, unit: "% of people both flood-exposed and living on under $5.50 a day", source: "rentschler" },
  { map: "poor", band: "1 to 5%", min: 1, max: 5, unit: "% of people both flood-exposed and living on under $5.50 a day", source: "rentschler" },
  { map: "poor", band: "5 to 10%", min: 5, max: 10, unit: "% of people both flood-exposed and living on under $5.50 a day", source: "rentschler" },
  { map: "poor", band: "10 to 20%", min: 10, max: 20, unit: "% of people both flood-exposed and living on under $5.50 a day", source: "rentschler" },
  { map: "poor", band: "20% or more", min: 20, max: null, unit: "% of people both flood-exposed and living on under $5.50 a day", source: "rentschler" },
  { map: "displaced", band: "Under 1", min: null, max: 1, unit: "disaster displacements a year per 1,000 people, 2016 to 2025 average", source: "idmc" },
  { map: "displaced", band: "1 to 5", min: 1, max: 5, unit: "disaster displacements a year per 1,000 people, 2016 to 2025 average", source: "idmc" },
  { map: "displaced", band: "5 to 10", min: 5, max: 10, unit: "disaster displacements a year per 1,000 people, 2016 to 2025 average", source: "idmc" },
  { map: "displaced", band: "10 to 30", min: 10, max: 30, unit: "disaster displacements a year per 1,000 people, 2016 to 2025 average", source: "idmc" },
  { map: "displaced", band: "30 or more", min: 30, max: null, unit: "disaster displacements a year per 1,000 people, 2016 to 2025 average", source: "idmc" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const countries = [];
for (const iso3 of new Set([...Object.keys(flood), ...Object.keys(dispCty)])) {
  const c = BY3[iso3], f = flood[iso3], d = dispCty[iso3];
  const fOk = f && f.pop_k > 0;
  let avg = null, perK = null;
  if (d) {
    const ys = []; for (let y = AVG_FROM; y <= YEAR; y++) ys.push(y);
    avg = ys.reduce((s, y) => s + (d[y] ?? 0), 0) / ys.length;
    const pops = ys.map((y) => POP[iso3]?.[y]).filter((v) => v != null);
    perK = pops.length === ys.length ? (1000 * avg) / (pops.reduce((a, b) => a + b, 0) / pops.length) : null;
  }
  // The table writes 0 where the study had no subnational poverty estimate (GSAP covers "most countries"), so a 0 at
  // all three poverty lines is treated as missing (it includes Afghanistan, Somalia and Cambodia). China's $3.20 and
  // $5.50 figures (0, below its $1.90 figure of 4.3 million) cannot be right and are dropped too.
  const noPov = fOk && f.p190_k === 0 && f.p320_k === 0 && f.p550_k === 0, chn = iso3 === "CHN";
  const pv = (k, drop) => (fOk && !noPov && !drop ? f[k] : null);
  countries.push({
    country: c.country, iso3, iso_n3: c.iso_n3,
    population_k: fOk ? f.pop_k : null,
    flood_exposed_k: fOk ? f.exp_k : null, flood_exposed_pct: fOk ? f.exp_pct : null,
    poor190_k: pv("p190_k"), poor190_pct: pv("p190_pct"),
    poor320_k: pv("p320_k", chn), poor320_pct: pv("p320_pct", chn),
    poor550_k: pv("p550_k", chn), poor550_pct: pv("p550_pct", chn),
    poverty_note: noPov ? "No poverty estimate: the study's table gives 0 at every poverty line" : chn ? "The study's table gives 0 under $3.20 and $5.50, below its $1.90 figure; left out" : null,
    flood_source: fOk ? "rentschler" : null,
    displaced_2025: d ? Math.round(d[YEAR] ?? 0) : null, displaced_2024: d ? Math.round(d[YEAR - 1] ?? 0) : null,
    displaced_avg: d ? Math.round(avg) : null, displaced_per_1000: r1(perK, 2), displaced_source: d ? "idmc" : null,
    flood_band: bandOf("flood", fOk ? f.exp_pct : null), poor_band: bandOf("poor", pv("p550_pct", chn)), displaced_band: bandOf("displaced", perK),
  });
}
countries.sort((a, b) => (b.flood_exposed_k ?? -1) - (a.flood_exposed_k ?? -1));

// ---------- World displacement by year and hazard ----------
const world = Object.entries(dispYear).map(([y, v]) => ({ year: +y, ...Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Math.round(x)])), source: "idmc" })).sort((a, b) => a.year - b.year);

// ---------- Hazards (CRED, 2025 Disasters in Numbers, figures 2, 4, 6 and 8) ----------
// Each column adds up to the report's totals: 358 and 377 events; 16,607 and 57,429 deaths (the average to rounding);
// 110.2 and 169.0 million affected; US$169.7 and 215.0 billion.
const hazards = [
  ["drought", "Drought", 7, 16, 89, 1166, 27.3, 55.6, 8.0, 11.8],
  ["earthquake", "Earthquake", 29, 25, 6353, 25495, 5.9, 6.6, 14.0, 40.0],
  ["temperature", "Extreme temperature", 1, 23, 0, 13586, 0, 6.5, 2.0, 2.6],
  ["flood", "Flood", 119, 169, 5235, 5544, 22.2, 64.6, 28.7, 45.6],
  ["mass_dry", "Mass movement (dry)", 0, 1, 0, 14, 0, 0, 0, 0],
  ["mass_wet", "Mass movement (wet)", 19, 18, 958, 897, 0, 0.4, 0, 0.3],
  ["storm", "Storm", 156, 108, 3862, 10545, 54.0, 34.2, 63.1, 107.7],
  ["volcanic", "Volcanic activity", 4, 5, 0, 77, 0.6, 0.3, 0, 0.2],
  ["wildfire", "Wildfire", 23, 12, 110, 104, 0.2, 0.7, 53.9, 6.8],
].map(([id, hazard, ev, eva, de, dea, af, afa, lo, loa]) => ({
  id, hazard, events_2025: ev, events_avg: eva, deaths_2025: de, deaths_avg: dea, affected_m_2025: af, affected_m_avg: afa, losses_bn_2025: lo, losses_bn_avg: loa,
  displaced_2025: id in { flood: 1, storm: 1, earthquake: 1, wildfire: 1, drought: 1 } ? dispYear[YEAR][id] && Math.round(dispYear[YEAR][id]) : null,
  source: "cred-2025", displaced_source: id in { flood: 1, storm: 1, earthquake: 1, wildfire: 1, drought: 1 } ? "idmc" : null,
}));

// ---------- Losses and insurance ----------
const loss = (publisher, period, overall, insured, fatalities, source, note = "") => ({ publisher, period, overall_bn: overall, insured_bn: insured, uninsured_bn: r1(overall - insured), insured_pct: r1((100 * insured) / overall, 0), fatalities, note, source });
const losses = [
  loss("Swiss Re Institute", "2025", 220, 107, null, "swissre-sigma", "Natural catastrophes, 2025 prices"),
  loss("Swiss Re Institute", "2024", 327, 141, null, "swissre-sigma", "2025 prices"),
  loss("Swiss Re Institute", "Previous 10-year average", 267, 111, null, "swissre-sigma", "2025 prices"),
  loss("Munich Re", "2025", 224, 108, 17200, "munichre-2025", "Droughts and heatwaves not included"),
  loss("Munich Re", "2024", 368, 147, 11000, "munichre-2025", "Inflation-adjusted"),
  loss("Munich Re", "5-year average, 2020 to 2024", 302, 125, 23400, "munichre-2025", "Inflation-adjusted"),
  loss("Munich Re", "10-year average, 2015 to 2024", 266, 107, 17800, "munichre-2025", "Inflation-adjusted"),
  loss("Munich Re", "30-year average, 1995 to 2024", 192, 66, 41900, "munichre-2025", "Inflation-adjusted"),
  loss("Munich Re", "First half of 2026", 112, 44, 8200, "munichre-h1-2026", "January to June"),
];
// Munich Re 2025 loss overview per continent. Where the factsheet gives "<0.5" or "<1", insured_bn is null and insured_max holds the bound.
const gap_regions = [
  ["North America, Central America and Caribbean", 133, 93, null, 660],
  ["of which United States", 118, 88, null, 370],
  ["South America", 4.2, null, 0.5, 300],
  ["Asia-Pacific", 73, 8.9, null, 13600],
  ["Europe", 11, 5.3, null, 90],
  ["Africa", 2.9, null, 1, 2500],
].map(([region, overall_bn, insured_bn, insured_max, fatalities]) => ({ region, overall_bn, insured_bn, insured_max, insured_pct: insured_bn != null ? r1((100 * insured_bn) / overall_bn, 0) : null, fatalities, year: 2025, source: "munichre-2025" }));
const costliest = [
  ["January to February 2025", "United States", "Wildfires (Palisades and Eaton fires)", 30, 53, 40],
  ["28 March 2025", "Myanmar, Thailand, China, Vietnam", "Earthquake", 4500, 12, 1.5],
  ["October 2025", "Jamaica, Cuba, Bahamas and others", "Hurricane Melissa", 95, 9.8, 3.0],
  ["14 to 17 March 2025", "United States", "Severe storm", 29, 9.4, 7.0],
  ["July 2025", "China", "Flood", 70, 5.8, 0.5],
].map(([date, region, event, fatalities, overall_bn, insured_bn]) => ({ date, region, event, fatalities, overall_bn, insured_bn, insured_pct: r1((100 * insured_bn) / overall_bn, 0), source: "munichre-2025" }));
const deadliest = [
  ["Myanmar", "MMR", "Earthquake", 3820], ["Afghanistan", "AFG", "Earthquake", 2200], ["Indonesia", "IDN", "Tropical Cyclone Senyar", 1109],
  ["Nigeria", "NGA", "Mokwa flood (May)", 1100], ["Pakistan", "PAK", "Floods", 1037], ["Sri Lanka", "LKA", "Tropical Cyclone Ditwah", 823],
  ["Sudan", "SDN", "Landslide", 400], ["Philippines", "PHL", "Typhoon Kalmaegi (Tino)", 372], ["Thailand", "THA", "Flood and Cyclone Senyar", 276], ["Nigeria", "NGA", "Floods (June to October)", 238],
].map(([country, iso3, event, deaths]) => ({ country, iso3, event, deaths, year: 2025, source: "cred-2025" }));

// ---------- UK (NaFRA 2024) ----------
const uk_risk = [];
for (const [t, src, cc, period] of [["4", "Rivers and the sea", "8", "2036 to 2069"], ["10", "Surface water", "14", "2040 to 2060"]]) {
  const now = tab(t), fut = Object.fromEntries(tab(cc).map((r) => [r[0], nn(r[1])]));
  for (const r of now) uk_risk.push({ flood_source: src, band: r[0].replace(/ risk$/, ""), properties: nn(r[1]), properties_climate: fut[r[0]] ?? null, climate_period: period, source: "ea-nafra" });
}
const regRows = (t) => Object.fromEntries(tab(t).map((r) => [r[0], { n: nn(r[1]), pct: nn(r[3]), total: nn(r[4]) }]));
const T6 = regRows("6"), T7 = regRows("7"), T12 = regRows("12"), T13 = regRows("13");
const uk_regions = Object.keys(T6).map((k) => ({
  region: k, properties: T6[k].total,
  rs_high: T6[k].n, rs_high_pct: T6[k].pct, rs_high_medium: T7[k].n, rs_high_medium_pct: T7[k].pct,
  sw_high: T12[k].n, sw_high_pct: T12[k].pct, sw_high_medium: T13[k].n, sw_high_medium_pct: T13[k].pct, source: "ea-nafra",
}));
const uk_infra = tab("16").map((r) => ({ asset: r[0], unit: /km/.test(r[1]) ? "km" : "sites", present: nn(r[1]), present_pct: nn(r[2]), climate_2040_2060: nn(r[3]), climate_pct: nn(r[4]), source: "ea-nafra" }));

// ---------- Headline findings ----------
const facts = [
  { id: "exposed", label: "People directly exposed to 1-in-100-year floods (more than 15 cm deep)", value: 1.81, unit: "billion", note: "23% of the world's population", source: "rentschler" },
  { id: "exposed_pct", label: "Share of the world's population directly exposed to 1-in-100-year floods", value: 23, unit: "%", note: "", source: "rentschler" },
  { id: "asia", label: "Flood-exposed people living in South and East Asia", value: 1.24, unit: "billion", note: "China (395 million) and India (390 million) account for over a third of global exposure", source: "rentschler" },
  { id: "lmic", label: "Share of the world's flood-exposed people living in low- and middle-income countries", value: 89, unit: "%", note: "", source: "rentschler" },
  { id: "extreme", label: "People facing high flood risk and living in extreme poverty (under $1.90 a day)", value: 170, unit: "million", note: "44% of them in Sub-Saharan Africa", source: "rentschler" },
  { id: "poor550", label: "People living on under $5.50 a day who face high flood risk", value: 780, unit: "million (over)", note: "", source: "rentschler" },
  { id: "events", label: "Natural hazard-related disasters recorded in EM-DAT, 2025", value: 358, unit: "disasters", note: "377 a year on average in 2005 to 2024", source: "cred-2025" },
  { id: "deaths", label: "Deaths in natural hazard-related disasters, 2025", value: 16607, unit: "deaths", note: "57,429 a year on average in 2005 to 2024; includes people missing and presumed dead", source: "cred-2025" },
  { id: "deaths_avg", label: "Deaths in natural hazard-related disasters, annual average 2005 to 2024", value: 57429, unit: "deaths", note: "", source: "cred-2025" },
  { id: "affected", label: "People affected by natural hazard-related disasters, 2025", value: 110.2, unit: "million", note: "169.0 million a year on average in 2005 to 2024", source: "cred-2025" },
  { id: "affected_avg", label: "People affected by natural hazard-related disasters, annual average 2005 to 2024", value: 169.0, unit: "million", note: "", source: "cred-2025" },
  { id: "damage", label: "Economic losses from natural hazard-related disasters recorded in EM-DAT, 2025", value: 169.7, unit: "US$ billion", note: "215.0 billion a year on average in 2005 to 2024", source: "cred-2025" },
  { id: "asiadeaths", label: "Share of 2025 disaster deaths in Asia", value: 72.8, unit: "%", note: "12,098 deaths, largely from the Myanmar and Afghanistan earthquakes", source: "cred-2025" },
  { id: "syria", label: "People in need of assistance after Syria's record drought, 2025", value: 16.2, unit: "million", note: "80% of the population", source: "cred-2025" },
  { id: "somalia", label: "Estimated excess deaths in Somalia's 30-month drought and famine, 2021 to 2024", value: 71100, unit: "deaths", note: "Around 40% were children under five", source: "cred-2025" },
  { id: "sr_insured", label: "Global insured natural catastrophe losses, 2025", value: 107, unit: "US$ billion", note: "Secondary perils (wildfires, severe storms, floods and others) made up a record 92%", source: "swissre-sigma" },
  { id: "sr_economic", label: "Global economic losses from natural catastrophes, 2025", value: 220, unit: "US$ billion", note: "", source: "swissre-sigma" },
  { id: "sr_share", label: "Share of 2025 natural catastrophe losses that were insured", value: 49, unit: "%", note: "About 49%, the highest share on sigma records", source: "swissre-sigma" },
  { id: "sr_emerging", label: "Share of catastrophe losses typically not covered by insurance in emerging economies", value: 80, unit: "% to 90%", note: "80 to 90%", source: "swissre-sigma" },
  { id: "sr_flood", label: "Global flood-related insured losses, 2025", value: 3.4, unit: "US$ billion", note: "Against a previous five-year average of US$15.4 billion", source: "swissre-sigma" },
  { id: "sr_flood_avg", label: "Global flood-related insured losses, previous five-year average", value: 15.4, unit: "US$ billion", note: "", source: "swissre-sigma" },
  { id: "sr_la", label: "Insured losses from the Los Angeles wildfires, January 2025", value: 40, unit: "US$ billion", note: "The largest insured wildfire loss on sigma records", source: "swissre-sigma" },
  { id: "sr_scs", label: "Insured losses from severe convective storms (hail, tornadoes, damaging winds), 2025", value: 51, unit: "US$ billion", note: "Third-costliest year on record for these storms", source: "swissre-sigma" },
  { id: "sr_trend", label: "Insured losses in 2026 if losses return to the long-term trend", value: 148, unit: "US$ billion", note: "About US$320 billion in Swiss Re's modelled peak-loss scenario", source: "swissre-sigma" },
  { id: "sr_exposure", label: "Share of the long-term rise in weather-related insured losses explained by exposure growth, 1970 to 2025", value: 80, unit: "% (more than)", note: "More valuable property in harm's way and higher rebuilding costs", source: "swissre-sigma" },
  { id: "mr_uninsured", label: "Share of 2025 natural disaster losses that were uninsured (Munich Re)", value: 50, unit: "% (around)", note: "Against a 10-year average of around 60%; lower because so much of the Los Angeles wildfire loss was insured", source: "munichre-2025" },
  { id: "mr_weather", label: "Share of 2025 natural disaster losses caused by weather disasters", value: 92, unit: "%", note: "97% of insured losses", source: "munichre-2025" },
  { id: "mr_h1gap", label: "Insurance gap, first half of 2026", value: 60, unit: "%", note: "US$44 billion insured of nearly US$112 billion", source: "munichre-h1-2026" },
  { id: "mr_venezuela", label: "Expected losses from the double earthquake in Venezuela, 24 June 2026", value: 30, unit: "US$ billion (around)", note: "Insured losses of less than US$1 billion; 5,500 deaths in the factsheet", source: "munichre-h1-2026" },
  { id: "uk_total", label: "Properties in England in areas at risk of flooding from rivers, the sea or surface water", value: 6.3, unit: "million", note: "Around 8 million by mid-century with climate change: 1 in 4 properties", source: "ea-nafra" },
  { id: "uk_2050", label: "Properties in England in areas at flood risk by mid-century, with climate change", value: 8, unit: "million (around)", note: "", source: "ea-nafra" },
  { id: "uk_winter", label: "Properties flooded in England in the winter 2023 to 2024 storms", value: 5000, unit: "properties (around)", note: "Flood defences protected around 250,000 properties", source: "ea-nafra" },
  { id: "uk_protected", label: "Properties protected by flood defences in England in the winter 2023 to 2024 storms", value: 250000, unit: "properties (around)", note: "", source: "ea-nafra" },
  { id: "uk_damage", label: "Economic damages of all floods in England and Wales, January 2016 to November 2019", value: 708, unit: "£ million", note: "Best estimate, 2024 prices; range £504 million to £924 million", source: "ea-nafra" },
  { id: "abi_total", label: "UK property insurance claims paid, 2025", value: 6.1, unit: "£ billion", note: "The highest annual total since the ABI began collecting the data in 2017", source: "abi-2025" },
  { id: "abi_weather", label: "UK weather-related property claims paid, 2025", value: 1.2, unit: "£ billion", note: "Up 14% (£142 million) on 2024; £758 million of it for damage to homes and possessions", source: "abi-2025" },
  { id: "abi_homes", label: "UK weather-related claims for damage to homes and possessions, 2025", value: 758, unit: "£ million", note: "Burst or frozen pipes, escape of water, storms and floods", source: "abi-2025" },
  { id: "abi_flood", label: "Cost of domestic flood claims, UK, 2025", value: 312, unit: "£ million", note: "Up 38%", source: "abi-2025" },
  { id: "abi_floodavg", label: "Average flood payout to a homeowner, 2025", value: 30000, unit: "£", note: "Up 60%", source: "abi-2025" },
  { id: "abi_storm", label: "Storm damage to homes, UK, 2025", value: 244, unit: "£ million", note: "Up 32% (£59 million); average payout £2,450", source: "abi-2025" },
  { id: "abi_subsidence", label: "Domestic subsidence payouts, UK, 2025", value: 307, unit: "£ million", note: "Up 10%, the highest on record, after the UK's hottest summer on record", source: "abi-2025" },
  { id: "floodre_policies", label: "Home insurance policies ceded to Flood Re, year to 31 March 2026", value: 353000, unit: "policies (estimated)", note: "More than 742,000 households helped since the scheme began; 23% of properties ceded in the year were new to it", source: "floodre-2026" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Flood exposure and disaster displacement by country", `People exposed to significant flood risk (1-in-100-year floods over 15 cm deep) and those among them living in poverty, from Rentschler et al. (2022); new displacements caused by disasters in ${YEAR}, ${YEAR - 1} and on average in ${AVG_FROM} to ${YEAR}, and per 1,000 people, from IDMC.`, countries],
  ["world", `Disaster displacements worldwide by hazard, 2008 to ${YEAR}`, "New internal displacements caused by disasters each year, summed from IDMC's event data, by hazard type.", world],
  ["hazards", "Disasters by hazard type, 2025 and the 2005 to 2024 average", "Events, deaths, people affected and economic losses by hazard, quoted from CRED's 2025 Disasters in Numbers (EM-DAT), with IDMC displacement for 2025.", hazards],
  ["losses", "Global natural disaster losses and how much was insured", "Overall (economic) and insured losses in US$ billion, and fatalities where given, quoted from Swiss Re Institute and Munich Re.", losses],
  ["gap_regions", "Insured and overall losses by continent, 2025", "Munich Re NatCatSERVICE loss overview per continent, quoted from its 2025 factsheet.", gap_regions],
  ["costliest", "Costliest natural disasters of 2025", "The five largest natural disasters of 2025 by overall losses, with insured losses and deaths, quoted from Munich Re.", costliest],
  ["deadliest", "Deadliest disasters of 2025", "The ten deadliest natural hazard-related disasters of 2025, quoted from CRED's 2025 Disasters in Numbers.", deadliest],
  ["uk_risk", "Properties in England in areas at risk of flooding, by source and risk band", "Present day and with climate change, from the Environment Agency's NaFRA 2024.", uk_risk],
  ["uk_regions", "Properties at flood risk by region of England", "Properties in areas at high, and at high or medium, risk of flooding from rivers and the sea and from surface water, number and share of each region's properties (NaFRA 2024).", uk_regions],
  ["uk_infra", "Infrastructure and public buildings in England in areas at flood risk", "From rivers, the sea and surface water, present day and with climate change in 2040 to 2060 (NaFRA 2024).", uk_infra],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from Rentschler et al. (2022), CRED, Swiss Re Institute, Munich Re, the Environment Agency, the ABI and Flood Re.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "disasters", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>disasters data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>disasters data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (Rentschler et al. and CRED's report: CC BY 4.0; IDMC: CC BY-IGO; World Bank: CC BY 4.0; Environment Agency: Open Government Licence v3.0). Figures from Swiss Re Institute, Munich Re, the ABI and Flood Re are quoted from their press releases with links; they are not open data. No EM-DAT database records are included.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
DATA.avgFrom = AVG_FROM;
fs.writeFileSync(path.join(REPO, "disasters/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const C = countries;
const sum = (k) => C.reduce((s, r) => s + (r[k] ?? 0), 0);
console.log(`countries ${C.length}; flood ${C.filter((r) => r.flood_exposed_pct != null).length} (unmatched: ${floodUnmatched.join(", ") || "none"}); displacement ${C.filter((r) => r.displaced_avg != null).length}, per 1,000 ${C.filter((r) => r.displaced_per_1000 != null).length}; IDMC codes not on our list: ${[...idmcUnmatched].join(" ") || "none"}`);
console.log(`flood exposed total ${(sum("flood_exposed_k") / 1e6).toFixed(3)} bn; poor190 ${(sum("poor190_k") / 1e3).toFixed(0)} m; poor550 ${(sum("poor550_k") / 1e3).toFixed(0)} m`);
console.log("world", JSON.stringify(world.slice(-3)));
for (const m of ["flood", "poor", "displaced"]) console.log(m, JSON.stringify(Object.fromEntries(BANDS.filter((b) => b.map === m).map((b) => [b.band, C.filter((r) => r[m + "_band"] === b.band).length]))));
console.log("top per 1,000:", [...C].filter((r) => r.displaced_per_1000 != null).sort((a, b) => b.displaced_per_1000 - a.displaced_per_1000).slice(0, 8).map((r) => `${r.iso3} ${r.displaced_per_1000}`).join(", "));
console.log("uk", JSON.stringify(C.find((r) => r.iso3 === "GBR")), JSON.stringify(uk_risk), JSON.stringify(uk_regions.at(-1)));
