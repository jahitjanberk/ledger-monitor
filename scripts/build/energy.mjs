// Builds data/energy/* and energy/assets/data.js for the Household Energy Prices & Poverty dashboard
// from the raw downloads in scripts/.raw/energy (World Bank WDI API JSON, Eurostat API JSON-stat,
// the Ofgem price cap model and the DESNZ fuel poverty trend tables, both unzipped).
//   node scripts/build/energy.mjs        (raw downloads in scripts/.raw/energy/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSheet } from "../lib/xlsx.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "energy");
const OUT = path.join(REPO, "data/energy");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "energy/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
// Latest year of the access series, and the oldest Eurostat year still shown for a country.
const YEAR = 2024, ES_FROM = 2023, PRICE_PERIOD = "2026-S1";

const SOURCES = {
  "wb-elec": {
    publisher: "World Bank, from the Tracking SDG 7 custodian agencies",
    title: "Access to electricity (% of population), EG.ELC.ACCS.ZS, with urban and rural splits",
    url: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS",
    published: "2026-10-08",
    method: "reference",
    notes: "World Development Indicators, last updated 8 October 2026. Latest year 2024. Mostly from household surveys and censuses, modelled where there are gaps. CC BY 4.0.",
  },
  "wb-cook": {
    publisher: "World Health Organization, via the World Bank",
    title: "Access to clean fuels and technologies for cooking (% of population), EG.CFT.ACCS.ZS",
    url: "https://data.worldbank.org/indicator/EG.CFT.ACCS.ZS",
    published: "2026-10-08",
    method: "reference",
    notes: "WHO Global Household Energy Database estimates, latest year 2024. Clean means electricity, gas, LPG, biogas, solar and alcohol fuels. CC BY 4.0.",
  },
  "wb-pop": {
    publisher: "World Bank",
    title: "Population, total (SP.POP.TOTL)",
    url: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    published: "2026-10-08",
    method: "reference",
    notes: "Used to turn access rates into numbers of people. People without access are our calculation: population × (100% − access rate). CC BY 4.0.",
  },
  "sdg7-2026": {
    publisher: "IEA, IRENA, UN DESA, World Bank and WHO (joint news release)",
    title: "655 million people still living without electricity underscore urgent need to deliver on universal energy access target (Tracking SDG 7: The Energy Progress Report 2026)",
    url: "https://www.who.int/news/item/24-06-2026-655-million-people-still-living-without-electricity-underscore-urgent-need-to-deliver-on-universal-energy-access-target",
    published: "2026-06-24",
    method: "reference",
    notes: "Headline figures quoted from the joint release. The full report is at https://www.iea.org/reports/tracking-sdg7-the-energy-progress-report-2026 under CC BY-NC 3.0 IGO.",
  },
  "es-elec": {
    publisher: "Eurostat",
    title: "Electricity prices for household consumers, bi-annual data (nrg_pc_204)",
    url: "https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_204/default/table",
    published: "2026-10-19",
    method: "reference",
    notes: "Band DC, 2,500 to 4,999 kWh a year, all taxes and levies included, per kWh, in euros and in purchasing power standards (PPS), which adjust for price levels. Latest period: first half of 2026. Some values are provisional or estimated. Reuse allowed with credit (Eurostat copyright notice, CC BY 4.0).",
  },
  "es-gas": {
    publisher: "Eurostat",
    title: "Gas prices for household consumers, bi-annual data (nrg_pc_202)",
    url: "https://ec.europa.eu/eurostat/databrowser/view/nrg_pc_202/default/table",
    published: "2026-10-19",
    method: "reference",
    notes: "Band D2, 20 to 199 GJ a year, all taxes and levies included, per kWh, in euros and PPS. Latest period: first half of 2026. Countries without a household gas network are missing. CC BY 4.0.",
  },
  "es-warm": {
    publisher: "Eurostat, EU Statistics on Income and Living Conditions (EU-SILC)",
    title: "Inability to keep home adequately warm (ilc_mdes01)",
    url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_mdes01/default/table",
    published: "2026-10-20",
    method: "reference",
    notes: "Share of people who say their household can't afford to keep the home adequately warm, all households and those below 60% of median income (at risk of poverty). Survey year, mostly 2025. CC BY 4.0.",
  },
  "es-arrears": {
    publisher: "Eurostat, EU Statistics on Income and Living Conditions (EU-SILC)",
    title: "Arrears on utility bills (ilc_mdes07)",
    url: "https://ec.europa.eu/eurostat/databrowser/view/ilc_mdes07/default/table",
    published: "2026-10-20",
    method: "reference",
    notes: "Share of people in households that were behind on heating, electricity, gas, water or similar bills in the last 12 months, for financial reasons. Survey year, mostly 2025. CC BY 4.0.",
  },
  "ofgem-cap": {
    publisher: "Ofgem",
    title: "Default tariff cap level model v1.31, sheet '1c Consumption adjusted levels' (pre-levelised rates)",
    url: "https://www.ofgem.gov.uk/energy-regulation/domestic-and-non-domestic/energy-pricing-rules/energy-price-cap/energy-price-cap-default-tariff-levels",
    published: "2026-08-26",
    method: "reference",
    notes: "The cap for a typical dual fuel household paying by direct debit ('other payment method'), recalculated by Ofgem for every period since April 2017 at today's typical use (2,500 kWh electricity, 9,500 kWh gas), GB average, including VAT, before levelisation. File: https://www.ofgem.gov.uk/sites/default/files/2026-08/Default-tariff-cap-level-v1.31.xlsx. Open Government Licence v3.0.",
  },
  "ofgem-letter": {
    publisher: "Ofgem",
    title: "Energy price cap (default tariff) update from 1 October 2026",
    url: "https://www.ofgem.gov.uk/sites/default/files/2026-08/Summary-of-changes-to-energy-price-cap-1-October-to-31-December-2026.pdf",
    published: "2026-08-26",
    method: "reference",
    notes: "Summary letter for cap period 17a, 1 October to 31 December 2026. Open Government Licence v3.0.",
  },
  "gov-epg": {
    publisher: "UK Government",
    title: "Energy Price Guarantee from 1 July 2023",
    url: "https://www.gov.uk/government/publications/energy-bills-support/energy-bills-support-factsheet-8-september-2022",
    published: "2024-01-01",
    method: "reference",
    notes: "Explains that the Energy Price Guarantee discounted bills from 1 October 2022 to 30 June 2023, and that from July 2023 the Ofgem cap was below it. Open Government Licence v3.0.",
  },
  "desnz-trends": {
    publisher: "Department for Energy Security and Net Zero",
    title: "Fuel poverty trends 2026: long term trends under the Low Income Low Energy Efficiency (LILEE) indicator, 2010 to 2025",
    url: "https://www.gov.uk/government/statistics/fuel-poverty-trends-2026",
    published: "2026-03-26",
    method: "reference",
    notes: "England only. Tables 1 and 2. 2024 figures are final, 2025 provisional. Accredited official statistics, Open Government Licence v3.0.",
  },
  "desnz-report": {
    publisher: "Department for Energy Security and Net Zero",
    title: "Annual fuel poverty statistics report: 2026 (2024 and 2025 data)",
    url: "https://www.gov.uk/government/statistics/annual-fuel-poverty-statistics-report-2026",
    published: "2026-03-26",
    method: "reference",
    notes: "England only. Republished 7 August 2026 to correct a calculation error on benefit receipt. 2026 figures are projections made with energy prices from early 2026, before the conflict in the Middle East. Open Government Licence v3.0.",
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
const wbAll = (id) => {
  const m = {};
  for (const r of J(`wb_${id}.json`)[1]) if (r.value != null) (m[r.countryiso3code] ??= {})[+r.date] = r.value;
  return m;
};
const latest = (s, max = 9999) => { if (!s) return null; const y = Math.max(...Object.keys(s).map(Number).filter((y) => y <= max)); return isFinite(y) ? { y, v: s[y] } : null; };
const EL = wbAll("EG.ELC.ACCS.ZS"), ELU = wbAll("EG.ELC.ACCS.UR.ZS"), ELR = wbAll("EG.ELC.ACCS.RU.ZS"), CK = wbAll("EG.CFT.ACCS.ZS"), POP = wbAll("SP.POP.TOTL");

// Eurostat JSON-stat 2.0: returns { geo: { time: value } } for the rows matching `filter`.
function eurostat(file, filter) {
  const d = J(file), ids = d.id, size = d.size;
  const keys = ids.map((k) => Object.entries(d.dimension[k].category.index).sort((a, b) => a[1] - b[1]).map((x) => x[0]));
  const out = {};
  for (const [i, v] of Object.entries(d.value)) {
    let n = +i; const c = {};
    for (let j = ids.length - 1; j >= 0; j--) { c[ids[j]] = keys[j][n % size[j]]; n = Math.floor(n / size[j]); }
    if (Object.entries(filter).every(([k, x]) => c[k] === x)) (out[c.geo] ??= {})[c.time] = v;
  }
  return out;
}
const PE = eurostat("es_nrg_pc_204.json", { currency: "EUR" }), PP = eurostat("es_nrg_pc_204.json", { currency: "PPS" });
const GE = eurostat("es_nrg_pc_202.json", { currency: "EUR" }), GP = eurostat("es_nrg_pc_202.json", { currency: "PPS" });
const WARM = eurostat("es_ilc_mdes01.json", { hhcomp: "TOTAL", rskpovth: "TOTAL" }), WARMP = eurostat("es_ilc_mdes01.json", { hhcomp: "TOTAL", rskpovth: "B_60" });
const ARR = eurostat("es_ilc_mdes07.json", { hhcomp: "TOTAL", rskpovth: "TOTAL" }), ARRP = eurostat("es_ilc_mdes07.json", { hhcomp: "TOTAL", rskpovth: "B_60" });
// Eurostat geo codes are ISO 3166 alpha-2 except EL (Greece) and UK.
const ES3 = { BE: "BEL", BG: "BGR", CZ: "CZE", DK: "DNK", DE: "DEU", EE: "EST", IE: "IRL", EL: "GRC", ES: "ESP", FR: "FRA", HR: "HRV", IT: "ITA", CY: "CYP", LV: "LVA", LT: "LTU", LU: "LUX", HU: "HUN", MT: "MLT", NL: "NLD", AT: "AUT", PL: "POL", PT: "PRT", RO: "ROU", SI: "SVN", SK: "SVK", FI: "FIN", SE: "SWE", IS: "ISL", LI: "LIE", NO: "NOR", CH: "CHE", UK: "GBR", BA: "BIH", ME: "MNE", MD: "MDA", MK: "MKD", GE: "GEO", AL: "ALB", RS: "SRB", TR: "TUR", UA: "UKR" };
const byIso = (m) => Object.fromEntries(Object.entries(m).filter(([g]) => ES3[g]).map(([g, v]) => [ES3[g], v]));
const [pe, pp, ge, gp, wa, wp, ar, ap] = [PE, PP, GE, GP, WARM, WARMP, ARR, ARRP].map(byIso);
const esLatest = (s, from = ES_FROM) => { const l = latest(s); return l && l.y >= from ? l : null; };

const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));

// ---------- Bands ----------
const B = (map, band, min, max, unit, source) => ({ map, band, min, max, unit, source });
const BANDS = [
  B("cooking", "Under 5%", null, 5, "% of people without clean cooking", "wb-cook"),
  B("cooking", "5 to 25%", 5, 25, "% of people without clean cooking", "wb-cook"),
  B("cooking", "25 to 50%", 25, 50, "% of people without clean cooking", "wb-cook"),
  B("cooking", "50 to 75%", 50, 75, "% of people without clean cooking", "wb-cook"),
  B("cooking", "75% or more", 75, null, "% of people without clean cooking", "wb-cook"),
  B("electricity", "Under 1%", null, 1, "% of people without electricity", "wb-elec"),
  B("electricity", "1 to 10%", 1, 10, "% of people without electricity", "wb-elec"),
  B("electricity", "10 to 25%", 10, 25, "% of people without electricity", "wb-elec"),
  B("electricity", "25 to 50%", 25, 50, "% of people without electricity", "wb-elec"),
  B("electricity", "50% or more", 50, null, "% of people without electricity", "wb-elec"),
  B("warm", "Under 3%", null, 3, "% of people who can't keep their home warm", "es-warm"),
  B("warm", "3 to 6%", 3, 6, "% of people who can't keep their home warm", "es-warm"),
  B("warm", "6 to 10%", 6, 10, "% of people who can't keep their home warm", "es-warm"),
  B("warm", "10 to 20%", 10, 20, "% of people who can't keep their home warm", "es-warm"),
  B("warm", "20% or more", 20, null, "% of people who can't keep their home warm", "es-warm"),
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const countries = [];
for (const c of AIR) {
  const k = c.iso3;
  const el = latest(EL[k]), ck = latest(CK[k]), p = latest(POP[k]);
  const w = esLatest(wa[k]), a = esLatest(ar[k]);
  const pE = pe[k]?.[PRICE_PERIOD] ?? null, gE = ge[k]?.[PRICE_PERIOD] ?? null;
  if (!el && !ck && !w && pE == null) continue;
  const noEl = el ? 100 - el.v : null, noCk = ck ? 100 - ck.v : null;
  const popAt = (y) => POP[k]?.[y] ?? null;
  const people = (pct, y) => (pct != null && popAt(y) ? r1((popAt(y) * pct) / 100 / 1e6, 2) : null);
  const wP = w ? wp[k]?.[String(w.y)] ?? null : null, aP = a ? ap[k]?.[String(a.y)] ?? null : null;
  countries.push({
    country: c.country, iso3: k, iso_n3: c.iso_n3,
    electricity_pct: el ? r1(el.v) : null, electricity_year: el?.y ?? null,
    no_electricity_pct: r1(noEl), no_electricity_m: el ? people(noEl, el.y) : null,
    electricity_urban_pct: ELU[k]?.[el?.y] != null ? r1(ELU[k][el.y]) : null,
    electricity_rural_pct: ELR[k]?.[el?.y] != null ? r1(ELR[k][el.y]) : null,
    electricity_2015: EL[k]?.[2015] != null ? r1(EL[k][2015]) : null,
    electricity_source: el ? "wb-elec" : null,
    cooking_pct: ck ? r1(ck.v) : null, cooking_year: ck?.y ?? null,
    no_cooking_pct: r1(noCk), no_cooking_m: ck ? people(noCk, ck.y) : null,
    cooking_2015: CK[k]?.[2015] != null ? r1(CK[k][2015]) : null,
    cooking_source: ck ? "wb-cook" : null,
    population_m: p ? r1(p.v / 1e6, 2) : null, population_year: p?.y ?? null, population_source: p ? "wb-pop" : null,
    cold_home_pct: w ? w.v : null, cold_home_poor_pct: wP, cold_home_year: w?.y ?? null, cold_home_source: w ? "es-warm" : null,
    arrears_pct: a ? a.v : null, arrears_poor_pct: aP, arrears_year: a?.y ?? null, arrears_source: a ? "es-arrears" : null,
    elec_price_eur: pE, elec_price_pps: pp[k]?.[PRICE_PERIOD] ?? null, elec_price_source: pE != null ? "es-elec" : null,
    gas_price_eur: gE, gas_price_pps: gp[k]?.[PRICE_PERIOD] ?? null, gas_price_source: gE != null ? "es-gas" : null,
    price_period: pE != null || gE != null ? PRICE_PERIOD : null,
    cooking_band: bandOf("cooking", noCk), electricity_band: bandOf("electricity", noEl), warm_band: bandOf("warm", w?.v ?? null),
  });
}
countries.sort((a, b) => (b.no_cooking_pct ?? -1) - (a.no_cooking_pct ?? -1));

// ---------- World and regions over time ----------
const REG = [["WLD", "World"], ["SSF", "Sub-Saharan Africa"], ["SAS", "South Asia"], ["EAS", "East Asia and Pacific"], ["LCN", "Latin America and Caribbean"], ["MEA", "Middle East and North Africa"], ["ECS", "Europe and Central Asia"], ["NAC", "North America"]];
const regions = [];
for (const [k, name] of REG) for (let y = 2000; y <= YEAR; y++) {
  const e = EL[k]?.[y], c = CK[k]?.[y], p = POP[k]?.[y];
  if (e == null && c == null) continue;
  regions.push({
    region: name, code: k, year: y,
    electricity_pct: r1(e), cooking_pct: r1(c),
    no_electricity_m: e != null && p ? r1((p * (100 - e)) / 100 / 1e6, 0) : null,
    no_cooking_m: c != null && p ? r1((p * (100 - c)) / 100 / 1e6, 0) : null,
    electricity_source: "wb-elec", cooking_source: "wb-cook", population_source: "wb-pop",
  });
}

// ---------- EU averages over time ----------
const EU = "EU27_2020";
const halves = Object.keys({ ...PE[EU], ...GE[EU] }).sort();
const eu_prices = halves.map((h) => ({ period: h, elec_eur: PE[EU]?.[h] ?? null, elec_pps: PP[EU]?.[h] ?? null, gas_eur: GE[EU]?.[h] ?? null, gas_pps: GP[EU]?.[h] ?? null, elec_source: "es-elec", gas_source: "es-gas" }));
const years = Object.keys(WARM[EU] ?? {}).sort();
const eu_poverty = years.map((y) => ({ year: +y, cold_home_pct: WARM[EU][y] ?? null, cold_home_poor_pct: WARMP[EU]?.[y] ?? null, arrears_pct: ARR[EU]?.[y] ?? null, arrears_poor_pct: ARRP[EU]?.[y] ?? null, cold_source: "es-warm", arrears_source: "es-arrears" }));

// ---------- UK: Ofgem price cap ----------
// Sheet 6 of the model ('1c Consumption adjusted levels'): the 'Other Payment Method' (direct debit) block,
// row 'Typical consumption' then 'Total inc VAT'. Columns: electricity single rate from C, gas from BM, dual fuel from CR.
const cap = readSheet(path.join(RAW, "ofgem_dtc"), "sheet6.xml");
const hdrRow = cap.findIndex((r) => r?.[1] === "Typical consumption");
const totRow = cap.findIndex((r, i) => i > hdrRow && r?.[1] === "Total inc VAT");
const hdr = cap[hdrRow], tot = cap[totRow];
const dualCol = hdr.indexOf("Typical consumption", 64) + 1, gasCol = hdr.indexOf("Typical consumption", 33) + 1;
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, June: 6, Jul: 7, Aug: 8, Sep: 9, Sept: 9, Oct: 10, Nov: 11, Dec: 12 };
const uk_cap = [];
for (let j = 2; hdr[j] !== "Typical consumption" && j < 40; j++) {
  if (!hdr[j]) continue;
  const m = hdr[j].match(/^(\w+) (\d{4}) - (\w+) (\d{4})$/);
  const start = `${m[2]}-${String(MONTHS[m[1]]).padStart(2, "0")}`, end = `${m[4]}-${String(MONTHS[m[3]]).padStart(2, "0")}`;
  const off = j - 2;
  uk_cap.push({
    period: hdr[j], start, end,
    dual_fuel: r1(tot[dualCol + off], 0), electricity: r1(tot[2 + off], 0), gas: r1(tot[gasCol + off], 0),
    epg: start >= "2022-10" && start <= "2023-04" ? "Energy Price Guarantee discount applied: households paid less than the cap" : null,
    source: "ofgem-cap",
  });
}

// ---------- UK: fuel poverty in England ----------
const t1 = readSheet(path.join(RAW, "desnz_trends"), "sheet5.xml");
const uk_fuel_poverty = [];
for (const r of t1) {
  if (!r || typeof r[1] !== "number") continue;
  if (r[0] && r[0] !== "Fuel poor") break;
  uk_fuel_poverty.push({ year: r[1], households_k: r1(r[2], 0), pct: r1(r[3], 1), aggregate_gap_m: r1(r[4], 0), average_gap: r1(r[5], 0), status: r[1] === 2025 ? "provisional" : "final", source: "desnz-trends" });
}
const t2 = readSheet(path.join(RAW, "desnz_trends"), "sheet6.xml");
const uk_fpeer = [];
let band = null;
for (const r of t2) {
  if (!r || typeof r[1] !== "number") continue;
  if (r[0]) band = String(r[0]).trim();
  if (r[1] !== 2025 || band === "All households") continue;
  uk_fpeer.push({ fpeer_band: band, year: 2025, households_k: r1(r[6], 0), fuel_poor_k: r1(r[5], 0), fuel_poor_pct_of_band: r1(r[3], 1), share_of_fuel_poor_pct: r1(r[7], 1), average_gap: r1(r[9], 0), source: "desnz-trends" });
}

// ---------- Headline findings ----------
const facts = [
  { id: "noelec", label: "People without electricity", value: 655, unit: "million", note: "Global access rate stalled at 92% in 2024", source: "sdg7-2026" },
  { id: "noelec_ssa", label: "People without electricity in sub-Saharan Africa", value: 560, unit: "million", note: "More than 560 million", source: "sdg7-2026" },
  { id: "rural_ssa", label: "People without electricity in rural sub-Saharan Africa, 2024", value: 447, unit: "million", note: "Up from 376 million in 2010", source: "sdg7-2026" },
  { id: "nocook", label: "People who cook with polluting fuels and technologies", value: 2, unit: "billion", note: "Roughly a quarter of the world's population", source: "sdg7-2026" },
  { id: "nocook_ssa", label: "People without clean cooking in sub-Saharan Africa", value: 970, unit: "million", note: "Expected to reach one billion by 2027", source: "sdg7-2026" },
  { id: "nocook_2030", label: "People who could still rely on polluting cooking fuels by 2030", value: 1.8, unit: "billion", note: "Charcoal, wood, kerosene and coal", source: "sdg7-2026" },
  { id: "cook_urban", label: "Urban population with clean cooking", value: 89, unit: "%", note: "Against 56% in rural areas", source: "sdg7-2026" },
  { id: "hap_deaths", label: "Deaths a year from household air pollution", value: 3, unit: "million", note: "Some 3 million", source: "sdg7-2026" },
  { id: "pace", label: "Yearly gain in electricity access needed to reach everyone by 2030", value: 1.3, unit: "percentage points", note: "About triple the current pace", source: "sdg7-2026" },
  { id: "cap", label: "Typical dual fuel bill under the price cap, direct debit, 1 October to 31 December 2026", value: 1723, unit: "pounds a year", note: "Up 4% from £1,663 in July to September", source: "ofgem-letter" },
  { id: "cap_wholesale", label: "Share of the October to December 2026 direct debit cap made up of wholesale costs", value: 47, unit: "%", note: "44% the quarter before", source: "ofgem-letter" },
  { id: "cap_vat", label: "VAT on electricity bills, 1 October 2026 to 31 March 2027", value: 0, unit: "%", note: "Cut from 5%; gas stays at 5%", source: "ofgem-letter" },
  { id: "fp2025", label: "Households in fuel poverty in England, 2025 (provisional)", value: 2.36, unit: "million", note: "9.4% of households, down from 9.9% in 2024", source: "desnz-report" },
  { id: "fp2026", label: "Households projected to be in fuel poverty in England, 2026", value: 2.13, unit: "million", note: "8.4%, a projection made before the conflict in the Middle East", source: "desnz-report" },
  { id: "ten_pct", label: "Households in England needing to spend more than 10% of income after housing costs on energy, 2025", value: 7.63, unit: "million", note: "30.4% of households, down from 34.4% in 2024", source: "desnz-report" },
  { id: "low_income_share", label: "Median required energy costs as a share of after-housing-costs income, low income households in England, 2025", value: 14.9, unit: "%", note: "6.8% for all households", source: "desnz-report" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Energy access, prices and cold homes by country", `Access to electricity and clean cooking (World Bank WDI, latest year ${YEAR}), people without each, and for European countries household electricity and gas prices (Eurostat, first half of 2026) and the share of people who can't keep their home warm or are behind on utility bills (EU-SILC, mostly 2025).`, countries],
  ["regions", "Access to electricity and clean cooking by region, 2000 to 2024", "World Bank regional aggregates of access rates, with people without access (our calculation from population).", regions],
  ["eu_prices", "EU household electricity and gas prices, half-yearly", "EU 27 average household price per kWh including all taxes, in euros and purchasing power standards, 2015 to the first half of 2026 (Eurostat).", eu_prices],
  ["eu_poverty", "EU energy poverty indicators, yearly", "EU 27 share of people unable to keep their home adequately warm and in arrears on utility bills, all households and those at risk of poverty, 2015 to 2025 (Eurostat EU-SILC).", eu_poverty],
  ["uk_cap", "GB energy price cap, typical direct debit bill", "Ofgem's cap for a typical dual fuel household paying by direct debit, £ a year, recalculated at 2026 typical consumption for every period from April 2017 to December 2026.", uk_cap],
  ["uk_fuel_poverty", "Fuel poverty in England, 2010 to 2025", "Households in fuel poverty under the Low Income Low Energy Efficiency measure, with the fuel poverty gap (DESNZ). 2025 is provisional.", uk_fuel_poverty],
  ["uk_fpeer", "Fuel poverty in England by energy efficiency band, 2025", "Fuel poor households and the average fuel poverty gap by Fuel Poverty Energy Efficiency Rating (DESNZ, provisional).", uk_fpeer],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from the Tracking SDG 7 2026 joint release, Ofgem's October 2026 price cap letter and DESNZ's 2026 fuel poverty report.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "energy", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>energy data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>energy data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (World Bank and Eurostat: CC BY 4.0; Ofgem, DESNZ and GOV.UK: Open Government Licence v3.0; the Tracking SDG 7 report: CC BY-NC 3.0 IGO).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
DATA.price_period = PRICE_PERIOD;
fs.writeFileSync(path.join(REPO, "energy/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const C = countries;
const sum = (k) => C.reduce((s, r) => s + (r[k] ?? 0), 0);
console.log(`countries ${C.length}; electricity ${C.filter((r) => r.electricity_pct != null).length}; cooking ${C.filter((r) => r.cooking_pct != null).length}; cold ${C.filter((r) => r.cold_home_pct != null).length}; prices ${C.filter((r) => r.elec_price_eur != null).length}; gas ${C.filter((r) => r.gas_price_eur != null).length}`);
console.log(`sum without electricity ${sum("no_electricity_m").toFixed(0)}m; without clean cooking ${sum("no_cooking_m").toFixed(0)}m`);
console.log("world", JSON.stringify(regions.filter((r) => r.code === "WLD").at(-1)), "ssa", JSON.stringify(regions.filter((r) => r.code === "SSF").at(-1)));
console.log("top no elec:", [...C].sort((a, b) => (b.no_electricity_m ?? 0) - (a.no_electricity_m ?? 0)).slice(0, 8).map((r) => `${r.iso3} ${r.no_electricity_m}`).join(", "));
console.log("top no cook:", [...C].sort((a, b) => (b.no_cooking_m ?? 0) - (a.no_cooking_m ?? 0)).slice(0, 8).map((r) => `${r.iso3} ${r.no_cooking_m}`).join(", "));
console.log("cap", JSON.stringify(uk_cap.slice(-3)), "rows", uk_cap.length);
console.log("fp", JSON.stringify(uk_fuel_poverty.slice(-2)), "fpeer", JSON.stringify(uk_fpeer));
console.log("eu", JSON.stringify(eu_prices.at(-1)), JSON.stringify(eu_poverty.at(-1)));
console.log("stale eurostat dropped:", Object.keys(wa).filter((k) => !esLatest(wa[k])).join(" "));
