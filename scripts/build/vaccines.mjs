// Builds data/vaccines/* and vaccines/assets/data.js for the Vaccination & Health Workers dashboard
// from the raw downloads in scripts/.raw/vaccines (WHO Immunization Data portal Excel exports, unzipped;
// WHO GHO API JSON for the health workforce; the UKHSA COVER annual data tables, an .ods file, unzipped).
//   node scripts/build/vaccines.mjs        (raw downloads in scripts/.raw/vaccines/, or set RAW to their parent folder)
// See scripts/build/README.md for the files this builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "vaccines");
const OUT = path.join(REPO, "data/vaccines");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "vaccines/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const YEAR = 2025, BASE = 2019;

const SOURCES = {
  wuenic: {
    publisher: "World Health Organization and UNICEF",
    title: "WHO/UNICEF Estimates of National Immunization Coverage (WUENIC), 2025 revision (via the WHO Immunization Data portal)",
    url: "https://immunizationdata.who.int/global?topic=Vaccination-coverage",
    published: "2026-07-15",
    method: "reference",
    notes: "Coverage among surviving infants, %, by country, region and year, 1980 to 2025 (coverage-data.xlsx and the WUENIC country-profile input file wuenic-input-to-pdf.xlsx). Each revision re-estimates the whole series, so earlier years can differ from earlier releases. Zero-dose children are surviving infants who did not get a first dose of DTP vaccine: for countries, (100 − DTP1 coverage) × surviving infants from the UN World Population Prospects 2024, as given in the WUENIC file; for regions and the world, the number in the target cohort minus those vaccinated, as published. WHO datasets: CC BY 4.0 with WHO's additional terms.",
  },
  "wuenic-release": {
    publisher: "UNICEF and World Health Organization",
    title: "Global childhood immunization coverage inches forward despite conflict and hesitancy: joint news release",
    url: "https://www.unicef.org/press-releases/global-childhood-immunization-coverage-inches-forward-despite-conflict-and-hesitancy",
    published: "2026-07-15",
    method: "reference",
    notes: "Headline findings of the 2025 WUENIC release, quoted as published.",
  },
  "who-cases": {
    publisher: "World Health Organization",
    title: "Reported cases and incidence of vaccine-preventable diseases (WHO Immunization Data portal)",
    url: "https://immunizationdata.who.int/global?topic=Reported-cases-and-incidence",
    published: "2026-06-11",
    method: "reference",
    notes: "Confirmed measles and diphtheria cases as reported by national authorities through the WHO/UNICEF Joint Reporting Form, and measles incidence per million people, 1980 to 2025 (reported-cases-data.xlsx and incidence-rate-data.xlsx, created 11 June 2026). Countries that did not report a year have no figure for it. Reported cases undercount true cases, by more where surveillance is weak. CC BY 4.0 with WHO's additional terms.",
  },
  "who-nhwa": {
    publisher: "World Health Organization",
    title: "National Health Workforce Accounts, December 2025 update (via the Global Health Observatory, HWF_0001 and HWF_0006)",
    url: "https://www.who.int/data/gho/data/themes/topics/health-workforce",
    published: "2026-01-23",
    method: "reference",
    notes: "Medical doctors, and nursing and midwifery personnel, per 10,000 people, by country (latest year reported, mostly 2023 or 2024) and for WHO regions and the world (2024). Figures are as countries report them to the NHWA portal; some values were updated on 11 March 2026. CC BY 4.0 with WHO's additional terms.",
  },
  "sown-2025": {
    publisher: "World Health Organization",
    title: "State of the World's Nursing 2025: news release, Nursing workforce grows, but inequities threaten global health goals",
    url: "https://www.who.int/news/item/11-05-2025-nursing-workforce-grows--but-inequities-threaten-global-health-goals",
    published: "2025-05-12",
    method: "reference",
    notes: "Based on data reported by 194 countries, for 2023. Figures quoted as published.",
  },
  "ukhsa-cover": {
    publisher: "UK Health Security Agency",
    title: "Vaccination coverage statistics for children aged up to 5 years, England (COVER programme): April 2025 to March 2026, annual data tables",
    url: "https://www.gov.uk/government/statistics/cover-of-vaccination-evaluated-rapidly-cover-programme-april-2025-to-march-2026",
    published: "2026-08-27",
    method: "reference",
    notes: "Tables 3, 11 and 13: coverage at 5 years by UK nation for 2025 to 2026; England coverage at 5 years since 2009 to 2010; MMR at 24 months in England since 1988 to 1989. Financial years run April to March. The file was corrected on 13 October 2026 (24-month figures for County Durham; no change to the series used here). Official statistics, Open Government Licence v3.0.",
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

// ---------- Readers: unzipped .xlsx and .ods ----------
const un = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#10;/g, "\n").replace(/&amp;/g, "&");
function xlsx(dir, sheet = "sheet1.xml") {
  const ssf = path.join(RAW, dir, "xl/sharedStrings.xml");
  const ss = fs.existsSync(ssf) ? [...fs.readFileSync(ssf, "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => un([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""))) : [];
  const x = fs.readFileSync(path.join(RAW, dir, "xl/worksheets", sheet), "utf8");
  const rows = [];
  for (const rm of x.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of rm[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const col = c[1].split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const t = /t="([^"]+)"/.exec(c[2])?.[1], v = /<v>([\s\S]*?)<\/v>/.exec(c[3] ?? "")?.[1];
      row[col] = t === "s" ? ss[+v] : t === "inlineStr" ? un(/<t[^>]*>([\s\S]*?)<\/t>/.exec(c[3] ?? "")?.[1] ?? "") : t === "str" ? un(v ?? "") : v == null ? null : +v;
    }
    rows.push(row);
  }
  return rows;
}
const ODS = fs.readFileSync(path.join(RAW, "cover-annual-2025-26/content.xml"), "utf8");
function ods(name) {
  const i = ODS.indexOf(`<table:table table:name="${name}"`);
  if (i < 0) throw new Error(`COVER table ${name} not found`);
  const body = ODS.slice(i, ODS.indexOf("</table:table>", i)), rows = [];
  for (const rm of body.matchAll(/<table:table-row[^>]*?(?:\/>|>([\s\S]*?)<\/table:table-row>)/g)) {
    const row = [];
    for (const c of (rm[1] ?? "").matchAll(/<table:(?:covered-)?table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:(?:covered-)?table-cell>)/g)) {
      const rep = Math.min(+(/table:number-columns-repeated="(\d+)"/.exec(c[1])?.[1] ?? 1), 50);
      const num = /office:value="([^"]+)"/.exec(c[1])?.[1];
      const txt = c[2] ? [...c[2].matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)].map((m) => un(m[1])).join(" ") : "";
      for (let k = 0; k < rep; k++) row.push(num != null ? +num : txt === "" ? null : txt);
    }
    rows.push(row);
  }
  return rows;
}
const gho = (id) => JSON.parse(fs.readFileSync(path.join(RAW, `gho_${id}.json`), "utf8")).value;

// ---------- Inputs ----------
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));

// WUENIC estimates (coverage-data.xlsx): [group, code, name, year, antigen, desc, category, catdesc, target, doses, coverage]
const COV = xlsx("coverage-data").slice(1).filter((r) => r[6] === "WUENIC");
const cov = {}; // cov[code][antigen][year] = { c, target, doses }
for (const r of COV) ((cov[r[1]] ??= {})[r[4]] ??= {})[r[3]] = { c: r[10] ?? null, target: r[8] ?? null, doses: r[9] ?? null, group: r[0], name: r[2] };
const cv = (code, ag, y) => cov[code]?.[ag]?.[y]?.c ?? null;
const zeroAgg = (code, y) => { const o = cov[code]?.DTPCV1?.[y]; return o?.target != null && o?.doses != null ? o.target - o.doses : null; };

// Surviving infants (UN WPP, as used by WUENIC) from the country-profile input file.
const WIN = xlsx("wuenic-input-to-pdf", "sheet2.xml").slice(1);
const surv = {};
for (const r of WIN) if (r[2] === "DTP1" && r[12] != null) (surv[r[1]] ??= {})[r[3]] = r[12];

// Reported cases and incidence: [group, code, name, year, disease, desc, cases|denominator, rate]
const CASES = xlsx("reported-cases-data").slice(1).filter((r) => r[3] != null && typeof r[3] === "number");
const cases = {}; // cases[disease][code][year]
for (const r of CASES) if (r[6] != null) ((cases[r[4]] ??= {})[r[1]] ??= {})[r[3]] = r[6];
const INC = xlsx("incidence-rate-data").slice(1).filter((r) => typeof r[3] === "number");
const inc = {};
for (const r of INC) if (r[7] != null) ((inc[r[4]] ??= {})[r[1]] ??= {})[r[3]] = r[7];

// Health workforce density (GHO): latest year per country; 2024 for regions and the world.
const latest = (id) => {
  const m = {}, agg = {};
  for (const r of gho(id)) {
    if (r.NumericValue == null) continue;
    if (r.SpatialDimType === "COUNTRY") { if (!m[r.SpatialDim] || m[r.SpatialDim].y < r.TimeDim) m[r.SpatialDim] = { y: r.TimeDim, v: r.NumericValue }; }
    else if (!agg[r.SpatialDim] || agg[r.SpatialDim].y < r.TimeDim) agg[r.SpatialDim] = { y: r.TimeDim, v: r.NumericValue };
  }
  return { m, agg };
};
const DOC = latest("HWF_0001"), NUR = latest("HWF_0006");
const REGION = {};
for (const r of gho("WHS4_100")) if (r.SpatialDimType === "COUNTRY" && r.ParentLocationCode) REGION[r.SpatialDim] = r.ParentLocationCode;

// ---------- Bands ----------
const BANDS = [
  { map: "dtp3", band: "95% or more", min: 95, max: null, unit: "DTP3 coverage, % of infants", source: "wuenic" },
  { map: "dtp3", band: "90 to 95%", min: 90, max: 95, unit: "DTP3 coverage, % of infants", source: "wuenic" },
  { map: "dtp3", band: "80 to 90%", min: 80, max: 90, unit: "DTP3 coverage, % of infants", source: "wuenic" },
  { map: "dtp3", band: "60 to 80%", min: 60, max: 80, unit: "DTP3 coverage, % of infants", source: "wuenic" },
  { map: "dtp3", band: "Under 60%", min: null, max: 60, unit: "DTP3 coverage, % of infants", source: "wuenic" },
  { map: "zero", band: "Under 2%", min: null, max: 2, unit: "% of infants with no DTP dose", source: "wuenic" },
  { map: "zero", band: "2 to 5%", min: 2, max: 5, unit: "% of infants with no DTP dose", source: "wuenic" },
  { map: "zero", band: "5 to 10%", min: 5, max: 10, unit: "% of infants with no DTP dose", source: "wuenic" },
  { map: "zero", band: "10 to 20%", min: 10, max: 20, unit: "% of infants with no DTP dose", source: "wuenic" },
  { map: "zero", band: "20% or more", min: 20, max: null, unit: "% of infants with no DTP dose", source: "wuenic" },
  { map: "measles", band: "Under 1", min: null, max: 1, unit: "reported measles cases per million people", source: "who-cases" },
  { map: "measles", band: "1 to 10", min: 1, max: 10, unit: "reported measles cases per million people", source: "who-cases" },
  { map: "measles", band: "10 to 50", min: 10, max: 50, unit: "reported measles cases per million people", source: "who-cases" },
  { map: "measles", band: "50 to 200", min: 50, max: 200, unit: "reported measles cases per million people", source: "who-cases" },
  { map: "measles", band: "200 or more", min: 200, max: null, unit: "reported measles cases per million people", source: "who-cases" },
  { map: "nurses", band: "100 or more", min: 100, max: null, unit: "nurses and midwives per 10,000 people", source: "who-nhwa" },
  { map: "nurses", band: "50 to 100", min: 50, max: 100, unit: "nurses and midwives per 10,000 people", source: "who-nhwa" },
  { map: "nurses", band: "25 to 50", min: 25, max: 50, unit: "nurses and midwives per 10,000 people", source: "who-nhwa" },
  { map: "nurses", band: "10 to 25", min: 10, max: 25, unit: "nurses and midwives per 10,000 people", source: "who-nhwa" },
  { map: "nurses", band: "Under 10", min: null, max: 10, unit: "nurses and midwives per 10,000 people", source: "who-nhwa" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const countries = [], unmatched = [];
for (const k of Object.keys(cov)) {
  const d1 = cov[k].DTPCV1?.[YEAR];
  if (!d1 || d1.group !== "COUNTRIES" || d1.c == null) continue;
  const c = BY3[k];
  if (!c) { unmatched.push(k); continue; }
  const dtp1 = cv(k, "DTPCV1", YEAR), si = surv[k]?.[YEAR] ?? null;
  const zero = si != null ? Math.round(((100 - dtp1) / 100) * si) : null;
  const zero19 = surv[k]?.[BASE] != null && cv(k, "DTPCV1", BASE) != null ? Math.round(((100 - cv(k, "DTPCV1", BASE)) / 100) * surv[k][BASE]) : null;
  const m25 = cases.MEASLES?.[k]?.[YEAR] ?? null, mi = inc.MEASLES?.[k]?.[YEAR] ?? null;
  const doc = DOC.m[k], nur = NUR.m[k];
  countries.push({
    country: c.country, iso3: k, iso_n3: c.iso_n3, who_region: REGION[k] ?? null, year: YEAR,
    dtp1, dtp3: cv(k, "DTPCV3", YEAR), mcv1: cv(k, "MCV1", YEAR), mcv2: cv(k, "MCV2", YEAR),
    dtp3_2019: cv(k, "DTPCV3", BASE), mcv1_2019: cv(k, "MCV1", BASE),
    zero_dose_pct: 100 - dtp1, zero_dose: zero, zero_dose_2019: zero19, surviving_infants: si, coverage_source: "wuenic",
    measles_cases: m25, measles_cases_2024: cases.MEASLES?.[k]?.[YEAR - 1] ?? null, measles_per_m: mi, measles_source: m25 != null || mi != null ? "who-cases" : null,
    diphtheria_cases: cases.DIPHTHERIA?.[k]?.[YEAR] ?? null,
    doctors_per_10k: doc ? r1(doc.v) : null, doctors_year: doc?.y ?? null,
    nurses_per_10k: nur ? r1(nur.v) : null, nurses_year: nur?.y ?? null, workforce_source: doc || nur ? "who-nhwa" : null,
    dtp3_band: bandOf("dtp3", cv(k, "DTPCV3", YEAR)), zero_band: bandOf("zero", 100 - dtp1), measles_band: bandOf("measles", mi), nurses_band: bandOf("nurses", nur?.v ?? null),
  });
}
countries.sort((a, b) => (b.zero_dose ?? -1) - (a.zero_dose ?? -1));

// ---------- World over time ----------
const world = [];
for (let y = 1980; y <= YEAR; y++) {
  const z = zeroAgg("GLOBAL", y);
  world.push({
    year: y, dtp1: cv("GLOBAL", "DTPCV1", y), dtp3: cv("GLOBAL", "DTPCV3", y), mcv1: cv("GLOBAL", "MCV1", y), mcv2: cv("GLOBAL", "MCV2", y),
    zero_dose_m: z != null ? r1(z / 1e6, 2) : null, surviving_infants_m: cov.GLOBAL?.DTPCV1?.[y]?.target != null ? r1(cov.GLOBAL.DTPCV1[y].target / 1e6, 2) : null, coverage_source: "wuenic",
    measles_cases: cases.MEASLES?.GLOBAL?.[y] ?? null, diphtheria_cases: cases.DIPHTHERIA?.GLOBAL?.[y] ?? null, cases_source: "who-cases",
  });
}

// ---------- WHO regions ----------
const REG = [["AFR", "Africa"], ["AMR", "Americas"], ["EMR", "Eastern Mediterranean"], ["EUR", "Europe"], ["SEAR", "South-East Asia"], ["WPR", "Western Pacific"], ["GLOBAL", "World"]];
const regions = REG.map(([k, name]) => ({
  code: k, region: name, year: YEAR,
  dtp1: cv(k, "DTPCV1", YEAR), dtp3: cv(k, "DTPCV3", YEAR), mcv1: cv(k, "MCV1", YEAR), mcv2: cv(k, "MCV2", YEAR),
  zero_dose_m: r1(zeroAgg(k, YEAR) / 1e6, 2), zero_dose_2019_m: r1(zeroAgg(k, BASE) / 1e6, 2), surviving_infants_m: r1(cov[k].DTPCV1[YEAR].target / 1e6, 2), coverage_source: "wuenic",
  measles_per_m: inc.MEASLES?.[k]?.[YEAR] ?? null, measles_cases: cases.MEASLES?.[k]?.[YEAR] ?? null, cases_source: "who-cases",
  doctors_per_10k: DOC.agg[k]?.v ?? null, nurses_per_10k: NUR.agg[k]?.v ?? null, workforce_year: NUR.agg[k]?.y ?? null, workforce_source: "who-nhwa",
}));

// ---------- UK ----------
const fy = (s) => { const m = /^(\d{4}) to (\d{4})$/.exec(String(s ?? "")); return m ? { fiscal_year: `${m[1]}/${m[2].slice(2)}`, start: +m[1] } : null; };
const num = (v) => (typeof v === "number" ? v : null);
const ukMap = new Map();
const ukRow = (f) => { if (!ukMap.has(f.start)) ukMap.set(f.start, { ...f, mmr_24m: null, mmr1_5y: null, mmr2_5y: null, booster_5y: null, children_5y: null, source: "ukhsa-cover" }); return ukMap.get(f.start); };
const T13 = ods("T13_EngMMR24m");
const h13 = T13.findIndex((r) => r[0] === "Financial year");
for (const r of T13.slice(h13 + 1)) { const f = fy(r[0]); if (f && num(r[2]) != null) ukRow(f).mmr_24m = r1(r[2]); }
const T11 = ods("T11_Eng5y");
const h11 = T11.findIndex((r) => r[0] === "Financial year"), H11 = T11[h11];
const col = (re) => H11.findIndex((h) => re.test(String(h ?? "")));
const cMMR1 = col(/^MMR1/), cMMR2 = col(/^MMR2/), cBoost = col(/^dTaP booster/), cN = col(/^Number of children/);
for (const r of T11.slice(h11 + 1)) {
  const f = fy(r[0]); if (!f) continue;
  const o = ukRow(f);
  o.mmr1_5y = r1(num(r[cMMR1])); o.mmr2_5y = r1(num(r[cMMR2])); o.booster_5y = r1(num(r[cBoost])); o.children_5y = num(r[cN]);
}
const uk_cover = [...ukMap.values()].sort((a, b) => a.start - b.start);
const T3 = ods("T3_UK5y");
const h3 = T3.findIndex((r) => r[0] === "Geographic area"), H3 = T3[h3];
const c3 = (re) => H3.findIndex((h) => re.test(String(h ?? "")));
const uk_nations = T3.slice(h3 + 1).filter((r) => typeof r[0] === "string" && num(r[2]) != null).map((r) => ({
  area: r[0], fiscal_year: "2025/26", children_5y: r[2], six_in_one_5y: num(r[c3(/HepB coverage/)]), booster_5y: num(r[c3(/booster coverage/)]),
  mmr1_5y: num(r[c3(/MMR1/)]), mmr2_5y: num(r[c3(/MMR2/)]), source: "ukhsa-cover",
}));
const uk_measles = Object.entries(cases.MEASLES?.GBR ?? {}).map(([y, v]) => ({ year: +y, measles_cases: v, source: "who-cases" })).sort((a, b) => a.year - b.year);

// ---------- Headline findings ----------
const facts = [
  { id: "zerodose", label: "Children who did not receive a single vaccine in 2025 (zero-dose)", value: 13.5, unit: "million", note: "Nearly 750,000 fewer than the previous year", source: "wuenic-release" },
  { id: "dtp1", label: "Infants who received at least one dose of DTP vaccine, 2025", value: 90, unit: "%", note: "Nearly 116 million infants", source: "wuenic-release" },
  { id: "dtp3", label: "Infants who completed the three-dose DTP series, 2025", value: 85, unit: "%", note: "110 million infants; one point below 2019", source: "wuenic-release" },
  { id: "mcv", label: "Children receiving the first and second measles doses, 2025", value: 84, unit: "%", note: "84% first dose, 77% second dose, against the 95% needed to stop outbreaks", source: "wuenic-release" },
  { id: "outbreaks", label: "Countries reporting large or disruptive measles outbreaks in 2025", value: 57, unit: "countries", note: "", source: "wuenic-release" },
  { id: "fcv", label: "Share of zero-dose children living in fragile, conflict-affected or vulnerable settings", value: 50, unit: "% (more than)", note: "Those settings hold only about a third of the world's children", source: "wuenic-release" },
  { id: "stagnant", label: "Countries whose DTP3 coverage is stagnating or falling behind since 2019", value: 65, unit: "countries", note: "100 countries have kept at least 90% DTP3 coverage since 2019; 30 improved", source: "wuenic-release" },
  { id: "surveys", label: "National immunization coverage surveys submitted for the 2025 round", value: 18, unit: "surveys", note: "Down from 50 in 2024 and an average of 33 a year in 2015 to 2019", source: "wuenic-release" },
  { id: "nurses", label: "Nurses worldwide, 2023", value: 29.8, unit: "million", note: "Up from 27.9 million in 2018", source: "sown-2025" },
  { id: "shortage", label: "Global shortage of nurses, 2023", value: 5.8, unit: "million", note: "Down from 6.2 million in 2020; projected 4.1 million by 2030", source: "sown-2025" },
  { id: "shortage2030", label: "Projected global shortage of nurses, 2030", value: 4.1, unit: "million", note: "", source: "sown-2025" },
  { id: "concentration", label: "Share of the world's nurses in countries with 49% of the world's population", value: 78, unit: "%", note: "", source: "sown-2025" },
  { id: "foreignborn", label: "Nurses worldwide who are foreign-born", value: 1, unit: "in 7", note: "23% in high-income countries; 1% in lower middle-income and 3% in low-income countries", source: "sown-2025" },
  { id: "foreignhic", label: "Share of nurses in high-income countries who are foreign-born", value: 23, unit: "%", note: "", source: "sown-2025" },
  { id: "women", label: "Share of the global nursing workforce who are women", value: 85, unit: "%", note: "", source: "sown-2025" },
];

// ---------- Write ----------
const ukFirst = uk_cover.find((r) => r.mmr_24m != null), ukLast = uk_cover.at(-1);
const TABLES = [
  ["countries", "Vaccination, measles and health workers by country", `WHO/UNICEF coverage estimates for ${YEAR} (DTP1, DTP3, MCV1, MCV2, with ${BASE} for comparison), zero-dose children, reported measles cases and incidence for ${YEAR}, and doctors and nurses per 10,000 people (latest year).`, countries],
  ["world", "World vaccination coverage, zero-dose children and reported cases, 1980 to 2025", "Global WUENIC coverage (%), zero-dose children (millions) and reported measles and diphtheria cases.", world],
  ["regions", `Vaccination and health workers by WHO region, ${YEAR}`, `Coverage, surviving infants and zero-dose children in ${YEAR} (and ${BASE}), measles incidence per million, and doctors and nurses per 10,000 people (2024).`, regions],
  ["uk_cover", "Childhood vaccination coverage in England by financial year", `MMR at 24 months since ${ukFirst.fiscal_year}, and MMR1, MMR2 and the pre-school booster at 5 years since 2009/10, to ${ukLast.fiscal_year} (UKHSA COVER).`, uk_cover],
  ["uk_nations", "Vaccination coverage at 5 years by UK nation, 2025/26", "Six-in-one, pre-school booster, MMR1 and MMR2 coverage at 5 years, April 2025 to March 2026 (UKHSA COVER).", uk_nations],
  ["uk_measles", "Reported measles cases in the UK by year", `Confirmed measles cases reported by the UK to WHO, ${uk_measles[0].year} to ${uk_measles.at(-1).year}.`, uk_measles],
  ["bands", "Map classes", "Bands used to colour the four maps.", BANDS],
  ["facts", "Headline findings", "Published figures from the UNICEF and WHO release of the 2025 coverage estimates and WHO's State of the World's Nursing 2025.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "vaccines", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>vaccines data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>vaccines data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (WHO: CC BY 4.0 with WHO's additional terms for datasets; UNICEF: its terms of use; UKHSA: Open Government Licence v3.0).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
DATA.base = BASE;
fs.writeFileSync(path.join(REPO, "vaccines/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const C = countries, w = (y) => world.find((r) => r.year === y);
console.log(`countries ${C.length}; unmatched ${unmatched.join(" ") || "none"}; with zero-dose ${C.filter((r) => r.zero_dose != null).length}; measles ${C.filter((r) => r.measles_cases != null).length}; incidence ${C.filter((r) => r.measles_per_m != null).length}; nurses ${C.filter((r) => r.nurses_per_10k != null).length}`);
console.log(`world ${YEAR}`, JSON.stringify(w(YEAR)), "\nworld 2024", JSON.stringify(w(YEAR - 1)), "\nworld 2019", JSON.stringify(w(BASE)));
console.log("sum of country zero-dose", C.reduce((s, r) => s + (r.zero_dose ?? 0), 0), "global", zeroAgg("GLOBAL", YEAR), "change vs 2024", zeroAgg("GLOBAL", YEAR) - zeroAgg("GLOBAL", YEAR - 1));
console.log("top zero:", C.slice(0, 10).map((r) => `${r.iso3} ${r.zero_dose}`).join(", "));
console.log("top measles/m:", [...C].filter((r) => r.measles_per_m != null).sort((a, b) => b.measles_per_m - a.measles_per_m).slice(0, 10).map((r) => `${r.iso3} ${r.measles_per_m} (${r.measles_cases})`).join(", "));
console.log("missing measles 2025:", C.filter((r) => r.measles_cases == null).map((r) => r.iso3).join(" "));
console.log("regions", JSON.stringify(regions.map((r) => [r.code, r.dtp3, r.zero_dose_m, r.nurses_per_10k])));
console.log("uk", JSON.stringify(uk_cover.slice(-2)), JSON.stringify(uk_nations[0]));
