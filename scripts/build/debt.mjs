// Builds data/debt/* and debt/assets/data.js for the Debt vs Public Services dashboard
// from the raw downloads in scripts/.raw/debt (IMF DataMapper JSON, World Bank WDI API JSON, ONS CSVs).
//   node scripts/build/debt.mjs        (raw downloads in scripts/.raw/debt/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "debt");
const OUT = path.join(REPO, "data/debt");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "debt/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const YEAR = 2025, EDU_FROM = 2019;

const SOURCES = {
  "imf-fm": {
    publisher: "International Monetary Fund",
    title: "Fiscal Monitor, October 2026 (via the IMF DataMapper)",
    url: "https://www.imf.org/external/datamapper/datasets/FM",
    published: "2026-10-14",
    method: "reference",
    notes: "General government gross debt, revenue, overall balance and primary balance, % of GDP. Net interest is the primary balance minus the overall balance: interest paid less interest received. 2025 values are partly estimates; 2026 to 2031 are IMF projections.",
  },
  "imf-weo": {
    publisher: "International Monetary Fund",
    title: "World Economic Outlook, October 2026: general government gross debt (GGXWDG_NGDP)",
    url: "https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/WEOWORLD",
    published: "2026-10-14",
    method: "reference",
    notes: "World aggregate, % of world GDP, 2001 to 2031. 2026 onward are projections.",
  },
  "wb-health": {
    publisher: "World Health Organization Global Health Expenditure Database, via the World Bank",
    title: "Domestic general government health expenditure (% of GDP), SH.XPD.GHED.GD.ZS",
    url: "https://data.worldbank.org/indicator/SH.XPD.GHED.GD.ZS",
    published: "2026-10-08",
    method: "reference",
    notes: "Government spending on health from its own resources, excluding foreign aid. Latest year, mostly 2023. CC BY 4.0.",
  },
  "wb-edu": {
    publisher: "UNESCO Institute for Statistics, via the World Bank",
    title: "Government expenditure on education, total (% of GDP), SE.XPD.TOTL.GD.ZS",
    url: "https://data.worldbank.org/indicator/SE.XPD.TOTL.GD.ZS",
    published: "2026-10-08",
    method: "reference",
    notes: `All levels of government, latest year since ${EDU_FROM}, mostly 2022 to 2024. CC BY 4.0.`,
  },
  "wb-pop": {
    publisher: "World Bank",
    title: "Population, total (SP.POP.TOTL)",
    url: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    published: "2026-10-08",
    method: "reference",
    notes: "Latest year. CC BY 4.0.",
  },
  "unctad-wod": {
    publisher: "UN Trade and Development (UNCTAD)",
    title: "A World of Debt 2026: Rising debt costs and stalling development",
    url: "https://unctad.org/publication/world-of-debt",
    published: "2026-06",
    method: "reference",
    notes: "Developing countries only. Net interest on public debt, 2025; health and education spending, latest year.",
  },
  "wb-idr": {
    publisher: "World Bank",
    title: "International Debt Report 2025: press release",
    url: "https://www.worldbank.org/en/news/press-release/2025/12/03/developing-countries-debt-outflows-hit-50-year-high-during-2022-2024",
    published: "2025-12-03",
    method: "reference",
    notes: "External debt of low- and middle-income countries, end-2024.",
  },
  "ons-psf": {
    publisher: "Office for National Statistics",
    title: "Public sector finances, UK: September 2026 (series NMFX, JW2O and HF6X)",
    url: "https://www.ons.gov.uk/economy/governmentpublicsectorandtaxes/publicsectorfinance/bulletins/publicsectorfinances/september2026",
    published: "2026-10-21",
    method: "reference",
    notes: "Central government net interest payable (NMFX, £m), public sector current receipts (JW2O, £m) and public sector net debt excluding public sector banks (HF6X, % of GDP). Financial years run April to March. Open Government Licence v3.0.",
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
const J = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), "utf8"));
const imf = (id) => J(`imf_${id}.json`).values[id];
const ob = imf("GGXCNL_G01_GDP_PT"), pb = imf("GGXONLB_G01_GDP_PT"), rv = imf("GGR_G01_GDP_PT"), dt = imf("G_XWDG_G01_GDP_PT"), weo = imf("GGXWDG_NGDP");
const net = (k, y) => (pb[k]?.[y] != null && ob[k]?.[y] != null ? pb[k][y] - ob[k][y] : null);
const wb = (id, from = 0) => {
  const m = {};
  for (const r of J(`wb_${id}.json`)[1]) {
    if (r.value == null || +r.date < from) continue;
    const k = r.countryiso3code;
    if (!m[k] || m[k].y < +r.date) m[k] = { y: +r.date, v: r.value };
  }
  return m;
};
const H = wb("SH.XPD.GHED.GD.ZS"), E = wb("SE.XPD.TOTL.GD.ZS", EDU_FROM), POP = wb("SP.POP.TOTL");
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));

// ---------- Bands ----------
const BANDS = [
  { map: "health", band: "Under a quarter", min: 0, max: 0.25, unit: "net interest ÷ government health spending", source: "imf-fm" },
  { map: "health", band: "A quarter to a half", min: 0.25, max: 0.5, unit: "net interest ÷ government health spending", source: "imf-fm" },
  { map: "health", band: "Half to the same", min: 0.5, max: 1, unit: "net interest ÷ government health spending", source: "imf-fm" },
  { map: "health", band: "1 to 2 times", min: 1, max: 2, unit: "net interest ÷ government health spending", source: "imf-fm" },
  { map: "health", band: "2 times or more", min: 2, max: null, unit: "net interest ÷ government health spending", source: "imf-fm" },
  { map: "revenue", band: "Under 5%", min: null, max: 5, unit: "% of government revenue", source: "imf-fm" },
  { map: "revenue", band: "5 to 10%", min: 5, max: 10, unit: "% of government revenue", source: "imf-fm" },
  { map: "revenue", band: "10 to 20%", min: 10, max: 20, unit: "% of government revenue", source: "imf-fm" },
  { map: "revenue", band: "20 to 30%", min: 20, max: 30, unit: "% of government revenue", source: "imf-fm" },
  { map: "revenue", band: "30% or more", min: 30, max: null, unit: "% of government revenue", source: "imf-fm" },
  { map: "debt", band: "Under 30%", min: 0, max: 30, unit: "% of GDP", source: "imf-fm" },
  { map: "debt", band: "30 to 60%", min: 30, max: 60, unit: "% of GDP", source: "imf-fm" },
  { map: "debt", band: "60 to 90%", min: 60, max: 90, unit: "% of GDP", source: "imf-fm" },
  { map: "debt", band: "90 to 120%", min: 90, max: 120, unit: "% of GDP", source: "imf-fm" },
  { map: "debt", band: "120% or more", min: 120, max: null, unit: "% of GDP", source: "imf-fm" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const Y = String(YEAR);
const countries = [];
for (const k of Object.keys(dt)) {
  const c = BY3[k];
  if (!c) continue;
  const debt = dt[k]?.[Y] ?? null, int = net(k, Y), rev = rv[k]?.[Y] ?? null;
  if (debt == null && int == null) continue;
  const h = H[k], e = E[k], p = POP[k];
  const ipr = int != null && rev ? (100 * int) / rev : null;
  const ratioH = int != null && h ? int / h.v : null;
  countries.push({
    country: c.country, iso3: k, iso_n3: c.iso_n3, year: YEAR,
    debt_pct_gdp: r1(debt), debt_2031: r1(dt[k]?.["2031"] ?? null), debt_2015: r1(dt[k]?.["2015"] ?? null),
    interest_pct_gdp: r1(int, 2), interest_2015: r1(net(k, "2015"), 2), interest_2031: r1(net(k, "2031"), 2),
    revenue_pct_gdp: r1(rev), interest_pct_revenue: r1(ipr), fiscal_source: "imf-fm",
    health_pct_gdp: h ? r1(h.v, 2) : null, health_year: h?.y ?? null, health_source: h ? "wb-health" : null,
    education_pct_gdp: e ? r1(e.v, 2) : null, education_year: e?.y ?? null, education_source: e ? "wb-edu" : null,
    interest_to_health: r1(ratioH, 2),
    more_than_health: int != null && h ? int > h.v : null,
    more_than_education: int != null && e ? int > e.v : null,
    population_m: p ? r1(p.v / 1e6, 2) : null, population_year: p?.y ?? null, population_source: p ? "wb-pop" : null,
    health_band: bandOf("health", ratioH), revenue_band: bandOf("revenue", ipr), debt_band: bandOf("debt", debt),
  });
}
countries.sort((a, b) => (b.interest_pct_revenue ?? -1) - (a.interest_pct_revenue ?? -1));

// ---------- Groups over time ----------
const GROUPS = [["ADVEC", "Advanced economies"], ["FM_EMG", "Emerging market and middle-income economies"], ["FM_LIDC", "Low-income developing countries"]];
const groups = [];
for (let y = 2001; y <= 2031; y++) {
  const Ys = String(y);
  const o = { year: y, projection: y > YEAR, world_debt: r1(weo.WEOWORLD?.[Ys] ?? null), world_source: "imf-weo" };
  for (const [k, , ] of GROUPS) {
    const s = { ADVEC: "adv", FM_EMG: "em", FM_LIDC: "lic" }[k];
    const int = net(k, Ys), rev = rv[k]?.[Ys];
    o[`${s}_debt`] = r1(dt[k]?.[Ys] ?? null);
    o[`${s}_interest`] = r1(int, 2);
    o[`${s}_interest_rev`] = int != null && rev ? r1((100 * int) / rev) : null;
  }
  o.source = "imf-fm";
  groups.push(o);
}

// ---------- UK ----------
const MON = "JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC";
const ons = (id) => {
  const m = {};
  for (const l of fs.readFileSync(path.join(RAW, `ons_${id}.csv`), "utf8").split("\n")) {
    const x = l.match(/^"(\d{4}) ([A-Z]{3})","(-?[\d.]+)"/);
    if (x) m[`${x[1]}-${String(MON.indexOf(x[2]) / 3 + 1).padStart(2, "0")}`] = +x[3];
  }
  return m;
};
const nm = ons("nmfx"), rc = ons("jw2o"), nd = ons("hf6x");
const ukYears = [];
for (let y = 1997; y <= 2026; y++) {
  let s = 0, r = 0, n = 0;
  for (let i = 0; i < 12; i++) {
    const mm = ((3 + i) % 12) + 1, yy = 3 + i >= 12 ? y + 1 : y;
    const k = `${yy}-${String(mm).padStart(2, "0")}`;
    if (nm[k] != null) { s += nm[k]; r += rc[k] ?? 0; n++; }
  }
  if (n) ukYears.push({ fiscal_year: `${y}/${String((y + 1) % 100).padStart(2, "0")}`, start: y, months: n, interest_bn: r1(s / 1000), receipts_bn: r1(r / 1000), interest_pct_receipts: r1((100 * s) / r), partial: n < 12 ? `April to ${["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][((3 + n - 1) % 12) + 1]}` : null, source: "ons-psf" });
}
const ukDebt = Object.keys(nd).sort().map((k) => ({ month: k, net_debt_pct_gdp: nd[k], source: "ons-psf" }));

// ---------- Headline findings ----------
const facts = [
  { id: "people", label: "People living in developing countries that spend more on net interest than on health or education", value: 3.7, unit: "billion", note: "1.2 billion more than in 2010", source: "unctad-wod" },
  { id: "countries", label: "Developing countries that spend more on interest payments than on either education or health", value: 51, unit: "countries", note: "", source: "unctad-wod" },
  { id: "dcdebt", label: "Developing countries' public debt, 2025", value: 35, unit: "trillion US dollars", note: "", source: "unctad-wod" },
  { id: "dcinterest", label: "Developing countries' net interest payments on public debt, 2025", value: 995, unit: "billion US dollars", note: "", source: "unctad-wod" },
  { id: "median", label: "Median share of government revenue developing countries spent on net interest, 2025", value: 8.1, unit: "%", note: "Nearly double the 2010 level", source: "unctad-wod" },
  { id: "savings", label: "Yearly interest developing countries could save if they borrowed at developed countries' rates", value: 500, unit: "billion US dollars", note: "Around $500 billion", source: "unctad-wod" },
  { id: "africa", label: "Share of Africa's population living in countries spending more on interest than on health or education", value: 65, unit: "%", note: "24% in 2010, 65% in 2023", source: "unctad-wod" },
  { id: "latam", label: "Share of Latin America and the Caribbean's population living in countries spending more on interest than on health or education", value: 58, unit: "%", note: "34% in 2010, 58% in 2023", source: "unctad-wod" },
  { id: "outflow", label: "How much more developing countries paid in external debt service than they received in new financing, 2022 to 2024", value: 741, unit: "billion US dollars", note: "The largest gap in more than five decades", source: "wb-idr" },
  { id: "idrinterest", label: "Interest paid on external debt by low- and middle-income countries, 2024", value: 415, unit: "billion US dollars", note: "A record", source: "wb-idr" },
  { id: "idrstock", label: "External debt of low- and middle-income countries, end-2024", value: 8.9, unit: "trillion US dollars", note: "An all-time high", source: "wb-idr" },
  { id: "ukseptember", label: "UK central government debt interest payable, September 2026", value: 10.9, unit: "billion pounds", note: "", source: "ons-psf" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Debt, interest, health and education by country", `General government debt, revenue and net interest in ${YEAR} (IMF Fiscal Monitor, October 2026), with government health spending (WHO) and education spending (UNESCO), latest year, all as % of GDP.`, countries],
  ["groups", "Debt and interest by country group, 2001 to 2031", "World debt (IMF World Economic Outlook) and debt, net interest and interest as a share of revenue for advanced, emerging and low-income economies (IMF Fiscal Monitor). 2026 onward are IMF projections.", groups],
  ["uk_interest", "UK debt interest by financial year", "Central government net interest payable and public sector current receipts, £ billion, 1997/98 to 2026/27 (ONS). 2026/27 is April to September.", ukYears],
  ["uk_debt", "UK public sector net debt, monthly", "Public sector net debt excluding public sector banks, % of GDP, March 1993 to September 2026 (ONS).", ukDebt],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from UNCTAD's A World of Debt 2026, the World Bank's International Debt Report 2025 and the ONS.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "debt", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>debt data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>debt data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (IMF: its copyright and usage terms; World Bank: CC BY 4.0; ONS: Open Government Licence v3.0).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
fs.writeFileSync(path.join(REPO, "debt/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const C = countries;
const mh = C.filter((r) => r.more_than_health), me = C.filter((r) => r.more_than_education), either = C.filter((r) => r.more_than_health || r.more_than_education);
const popOf = (a) => a.reduce((s, r) => s + (r.population_m ?? 0), 0);
console.log(`countries ${C.length}; with interest ${C.filter((r) => r.interest_pct_gdp != null).length}; health ${C.filter((r) => r.health_pct_gdp != null).length}; edu ${C.filter((r) => r.education_pct_gdp != null).length}`);
console.log(`more than health ${mh.length} (${(popOf(mh) / 1000).toFixed(2)}bn), education ${me.length} (${(popOf(me) / 1000).toFixed(2)}bn), either ${either.length} (${(popOf(either) / 1000).toFixed(2)}bn)`);
console.log("either:", either.map((r) => r.iso3).join(" "));
console.log("top rev:", C.slice(0, 12).map((r) => `${r.iso3} ${r.interest_pct_revenue}`).join(", "));
console.log("rev>=10:", C.filter((r) => r.interest_pct_revenue >= 10).length, "rev>=20:", C.filter((r) => r.interest_pct_revenue >= 20).length);
console.log("unmatched FM keys:", Object.keys(dt).filter((k) => !BY3[k] && k.length === 3).join(" "));
console.log("groups 2025", JSON.stringify(groups.find((g) => g.year === 2025)));
console.log("uk", JSON.stringify(ukYears.slice(-3)));
