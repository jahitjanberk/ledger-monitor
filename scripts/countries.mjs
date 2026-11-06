// Builds one profile page per country from the published dashboard data, plus the
// country index, the compare page and the search index the hub uses:
//   country/index.html             every country, A to Z, with a filter
//   country/<iso3>/index.html      one country's figures from every dashboard, each cited
//   country/profiles.json          the same figures as data, read by the compare page
//   compare/index.html             two to four countries side by side (assets/compare.js)
//   assets/search.json             dashboards, countries and topics for the hub search
// Re-run after updating data/:  node scripts/countries.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/browser.mjs";
import { page, esc } from "./lib/page.mjs";

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const rec = (d, f) => JSON.parse(read(`data/${d}/${f}.json`)).records;
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };

/* ---------- Dashboards: title and accent, read from the hub cards ---------- */
const hub = read("index.html");
const DASH = {};
for (const m of hub.matchAll(/<article class="hb-card[^"]*" style="--c-light:(#\w+);--c-dark:(#\w+)">[\s\S]*?<h2><a href="(\w+)\/index.html">([^<]+)<\/a><\/h2>[\s\S]*?<p class="hb-sum">([^<]*)<\/p>/g)) {
  DASH[m[3]] = { light: m[1], dark: m[2], title: m[4].replace(/&amp;/g, "&"), sum: m[5].replace(/&amp;/g, "&") };
}
const SOURCES = Object.fromEntries(Object.keys(DASH).map((d) => [d, JSON.parse(read(`data/${d}/sources.json`)).sources]));
const accent = (d) => `--c-light:${DASH[d].light};--c-dark:${DASH[d].dark}`;

/* ---------- Countries: names and codes ---------- */
// Tables keyed by ISO 3166 alpha-3 code. The first table that names a country gives its name.
const KEYED = [
  ["electricity", "countries"], ["air", "countries"], ["food", "countries"], ["debt", "countries"],
  ["heat", "countries"], ["water", "stress"], ["water", "drinking"], ["water", "resources"],
  ["vaccines", "countries"],
  ["energy", "countries"],
  ["medicines", "countries"],
];
const C = new Map(); // iso3 -> { iso3, n3, name }
const byN3 = new Map(), byName = new Map();
for (const [d, f] of KEYED) {
  for (const r of rec(d, f)) {
    if (!/^[A-Z]{3}$/.test(r.iso3 ?? "")) continue;
    if (!C.has(r.iso3)) C.set(r.iso3, { iso3: r.iso3, n3: r.iso_n3, name: r.country });
    if (r.iso_n3) byN3.set(String(r.iso_n3).padStart(3, "0"), r.iso3);
    byName.set(r.country.toLowerCase(), r.iso3);
  }
}
// Names used by the tables that carry no code (cable landings, cloud regions, refining).
const ALIAS = {
  "hong kong": "HKG", "south korea": "KOR", "korea": "KOR", "taiwan": "TWN", "uk": "GBR", "usa": "USA", "us": "USA",
  "russia": "RUS", "vietnam": "VNM", "turkey": "TUR", "türkiye": "TUR", "czech republic": "CZE", "dr congo": "COD",
  "democratic republic of the congo": "COD", "congo, dem. rep.": "COD", "congo, rep.": "COG", "republic of the congo": "COG",
  "ivory coast": "CIV", "côte d'ivoire": "CIV", "cote d'ivoire": "CIV", "brunei": "BRN", "cape verde": "CPV", "macau": "MAC",
  "micronesia": "FSM", "the gambia": "GMB", "gambia": "GMB", "the bahamas": "BHS", "bahamas": "BHS", "uae": "ARE",
  "east timor": "TLS", "timor-leste": "TLS", "eswatini": "SWZ", "swaziland": "SWZ", "syria": "SYR", "laos": "LAO",
  "iran": "IRN", "moldova": "MDA", "tanzania": "TZA", "venezuela": "VEN", "bolivia": "BOL", "palestine": "PSE",
  "saint kitts and nevis": "KNA", "saint lucia": "LCA", "saint vincent and the grenadines": "VCT", "curaçao": "CUW",
  "faroe islands": "FRO", "sint maarten": "SXM", "virgin islands (u.s.)": "VIR", "virgin islands (u.k.)": "VGB",
  "u.s. virgin islands": "VIR", "british virgin islands": "VGB", "netherlands antilles": null, "canary islands": "ESP",
  "azores": "PRT", "madeira": "PRT", "réunion": "REU", "reunion": "REU", "guadeloupe": "GLP", "martinique": "MTQ",
  "french guiana": "GUF", "mayotte": "MYT", "new caledonia": "NCL", "french polynesia": "PYF", "wallis and futuna": "WLF",
  "saint pierre and miquelon": "SPM", "guernsey": "GGY", "jersey": "JEY", "isle of man": "IMN", "gibraltar": "GIB",
  "north macedonia": "MKD", "macedonia": "MKD", "myanmar": "MMR", "burma": "MMR", "the netherlands": "NLD",
};
const isoOfName = (n) => {
  const k = String(n ?? "").trim().toLowerCase();
  if (k in ALIAS) return ALIAS[k];
  return byName.get(k) ?? null;
};
const isoOfN3 = (n) => byN3.get(String(n ?? "").padStart(3, "0")) ?? null;

/* ---------- Formatting ---------- */
const nf = (v, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const big = (v) => (v >= 1e9 ? `${nf(v / 1e9, 1)} billion` : v >= 1e6 ? `${nf(v / 1e6, 1)} million` : nf(v));
const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const signed = (v, d) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${nf(Math.abs(v), d)}`;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-06" reads as Jun 2026; Eurostat half-years ("2026-S1") as H1 2026.
const when = (y) => {
  const s = String(y ?? "");
  if (/^\d{4}-\d{2}$/.test(s)) return `${MON[+s.slice(5) - 1]} ${s.slice(0, 4)}`;
  const h = s.match(/^(\d{4})-S([12])$/);
  return h ? `H${h[2]} ${h[1]}` : s;
};

/* ---------- The figures on each profile ----------
   Each metric reads one value per country from a table. `get` returns the value, `year`
   and `src` (a key into that dashboard's sources.json). Countries are ranked on the value
   among every country in the table that has one. */
const M = (o) => ({ dec: 1, unit: "", ...o });
const METRICS = [
  { dash: "electricity", section: "rank", table: ["electricity", "countries"], key: (r) => r.iso3, items: [
    M({ id: "renewables", label: "Electricity from renewables", unit: "%", get: (r) => r.renewables_pct, year: (r) => r.year, src: (r) => r.source }),
    M({ id: "low_carbon", label: "Electricity from low-carbon sources (renewables and nuclear)", unit: "%", get: (r) => r.low_carbon_pct, year: (r) => r.year, src: (r) => r.source }),
    M({ id: "coal", label: "Electricity from coal", unit: "%", get: (r) => r.coal_pct, year: (r) => r.year, src: (r) => r.source }),
    M({ id: "carbon", label: "Carbon intensity of electricity", unit: "g CO₂/kWh", dec: 0, get: (r) => r.carbon_intensity_g_kwh, year: (r) => r.year, src: (r) => r.source,
      note: (r) => r.carbon_intensity_2015 != null && `${nf(r.carbon_intensity_2015)} in 2015` }),
    M({ id: "kwh", label: "Electricity generated per person", unit: "kWh", dec: 0, get: (r) => r.per_capita_kwh, year: (r) => r.year, src: (r) => r.source }),
  ] },
  { dash: "air", section: "map", table: ["air", "countries"], key: (r) => r.iso3, items: [
    M({ id: "pm25", label: "Fine-particle pollution (PM2.5), population-weighted", unit: "µg/m³", get: (r) => r.pm25, year: (r) => r.year, src: (r) => r.source,
      note: (r) => r.times_guideline != null && `${nf(r.times_guideline, 1)} times the WHO guideline of 5` }),
    M({ id: "air_deaths", label: "Deaths linked to air pollution", dec: 0, fmt: (v) => nf(v), get: (r) => r.deaths_air, year: (r) => r.deaths_year, src: (r) => r.deaths_source }),
    M({ id: "air_share", label: "Share of all deaths linked to air pollution", unit: "%", get: (r) => r.share_deaths_pct, year: (r) => r.deaths_year, src: (r) => r.deaths_source }),
  ] },
  { dash: "water", section: "map", table: ["water", "stress"], key: (r) => r.iso3, items: [
    M({ id: "stress", label: "Water stress: freshwater withdrawn, share of what is available", unit: "%", get: (r) => r.stress_pct, year: (r) => r.year, src: (r) => r.source, note: (r) => r.band }),
  ] },
  { dash: "water", section: "drinking", table: ["water", "drinking"], key: (r) => r.iso3, items: [
    M({ id: "safe_water", label: "People with safely managed drinking water", unit: "%", get: (r) => r.safely_managed_pct, year: (r) => r.year, src: (r) => r.source,
      note: (r) => r.people_without > 0 && `${big(r.people_without)} people without` }),
  ] },
  { dash: "water", section: "hidden", table: ["water", "resources"], key: (r) => r.iso3, items: [
    M({ id: "water_pp", label: "Renewable freshwater per person", unit: "m³ a year", dec: 0, get: (r) => r.renewable_m3_per_person, year: (r) => r.renewable_year, src: (r) => r.renewable_source }),
  ] },
  { dash: "food", section: "map", table: ["food", "countries"], key: (r) => r.iso3, items: [
    M({ id: "hunger", label: "People undernourished", unit: "%", get: (r) => r.pou, under: (r) => r.pou_under, year: (r) => r.pou_period, src: (r) => r.hunger_source,
      note: (r) => r.undernourished_m != null && `${nf(r.undernourished_m, 1)} million people` }),
    M({ id: "diet", label: "People who can't afford a healthy diet", unit: "%", get: (r) => r.cant_afford_pct, year: (r) => r.diet_year, src: (r) => r.diet_source }),
    M({ id: "diet_cost", label: "Cost of a healthy diet, per person per day", dec: 2, money: true, fmt: (v) => `$${nf(v, 2)}`, unit: "2021 PPP dollars", get: (r) => r.diet_cost, year: (r) => r.diet_year, src: (r) => r.diet_source }),
    M({ id: "food_infl", label: "Food price inflation, year on year", signed: true, fmt: (v) => `${signed(v, 1)}%`, get: (r) => r.food_inflation, year: (r) => r.inflation_month, src: (r) => r.inflation_source }),
  ] },
  { dash: "debt", section: "map", table: ["debt", "countries"], key: (r) => r.iso3, items: [
    M({ id: "debt", label: "Government debt", unit: "% of GDP", get: (r) => r.debt_pct_gdp, year: (r) => r.year, src: (r) => r.fiscal_source }),
    M({ id: "interest_rev", label: "Net interest, share of government revenue", unit: "%", get: (r) => r.interest_pct_revenue, year: (r) => r.year, src: (r) => r.fiscal_source }),
    M({ id: "interest", label: "Net interest", unit: "% of GDP", get: (r) => r.interest_pct_gdp, year: (r) => r.year, src: (r) => r.fiscal_source }),
    M({ id: "health", label: "Government health spending", unit: "% of GDP", get: (r) => r.health_pct_gdp, year: (r) => r.health_year, src: (r) => r.health_source }),
    M({ id: "education", label: "Government education spending", unit: "% of GDP", get: (r) => r.education_pct_gdp, year: (r) => r.education_year, src: (r) => r.education_source }),
  ] },
  { dash: "heat", section: "map", table: ["heat", "countries"], key: (r) => r.iso3, items: [
    M({ id: "anomaly", label: "Temperature against the country's 1991–2020 average", dec: 2, signed: true, fmt: (v) => `${signed(v, 2)}°C`, get: (r) => r.anomaly_c, year: (r) => r.year, src: (r) => r.anomaly_source }),
    M({ id: "hot_days", label: "Days above 35°C, averaged over the country", dec: 0, get: (r) => r.hot_days, year: () => 2025, src: (r) => r.hot_days_source,
      note: (r) => r.hot_days_9120 != null && `${nf(r.hot_days_9120)} a year on average in 1991–2020` }),
    M({ id: "hot_days_2050", label: "Days above 35°C a year by 2040–2059, modelled", dec: 0, get: (r) => r.model_days_2040_2059, year: () => "SSP2-4.5", src: (r) => r.model_source,
      note: (r) => r.model_days_1995_2014 != null && `${nf(r.model_days_1995_2014)} in 1995–2014` }),
  ] },
  { dash: "orbit", section: "orgs", table: ["orbit", "launchers"], key: (r) => (r.kind === "country" ? r.iso3 : null), items: [
    M({ id: "orbit_total", label: "Objects launched into space, all years", dec: 0, get: (r) => r.objects_total, year: () => "to 2025", src: (r) => r.source,
      note: (r) => r.first_year && `first in ${r.first_year}` }),
    M({ id: "orbit_2025", label: "Objects launched in 2025", dec: 0, get: (r) => r.objects_2025, year: () => 2025, src: (r) => r.source }),
  ] },
  { dash: "housing", section: "map", table: ["housing", "nations"], key: (r) => isoOfN3(r.iso_n3), items: [
    M({ id: "housing", label: "Median home price, in years of median household income", get: (r) => r.median_multiple, year: () => "2025", src: (r) => r.source,
      note: (r) => r.median_multiple_prev != null && `${nf(r.median_multiple_prev, 1)} a year earlier; 3.0 or less counts as affordable` }),
  ] },
  { dash: "vaccines", section: "map", table: ["vaccines", "countries"], key: (r) => r.iso3, items: [
    M({ id: "zero_dose", label: "Children who got no vaccines (no first DTP dose)", dec: 0, fmt: (v) => nf(v), get: (r) => r.zero_dose, year: (r) => r.year, src: (r) => r.coverage_source,
      note: (r) => r.zero_dose_pct != null && `${nf(r.zero_dose_pct)}% of infants` }),
    M({ id: "dtp3", label: "Infants with three doses of DTP vaccine", unit: "%", dec: 0, get: (r) => r.dtp3, year: (r) => r.year, src: (r) => r.coverage_source,
      note: (r) => r.dtp3_2019 != null && `${nf(r.dtp3_2019)}% in 2019` }),
    M({ id: "mcv1", label: "Children with a first measles dose", unit: "%", dec: 0, get: (r) => r.mcv1, year: (r) => r.year, src: (r) => r.coverage_source }),
    M({ id: "mcv2", label: "Children with a second measles dose", unit: "%", dec: 0, get: (r) => r.mcv2, year: (r) => r.year, src: (r) => r.coverage_source }),
    M({ id: "measles", label: "Reported measles cases per million people", get: (r) => r.measles_per_m, year: (r) => r.year, src: (r) => r.measles_source,
      note: (r) => r.measles_cases != null && `${nf(r.measles_cases)} cases` }),
    M({ id: "nurses", label: "Nurses and midwives per 10,000 people", get: (r) => r.nurses_per_10k, year: (r) => r.nurses_year, src: (r) => r.workforce_source }),
    M({ id: "doctors", label: "Medical doctors per 10,000 people", get: (r) => r.doctors_per_10k, year: (r) => r.doctors_year, src: (r) => r.workforce_source }),
  ] },
  { dash: "energy", section: "map", table: ["energy", "countries"], key: (r) => r.iso3, items: [
    M({ id: "elec_access", label: "People with electricity", unit: "%", get: (r) => r.electricity_pct, year: (r) => r.electricity_year, src: (r) => r.electricity_source,
      note: (r) => r.no_electricity_m >= 0.01 && `${nf(r.no_electricity_m, 2)} million people without` }),
    M({ id: "clean_cooking", label: "People with clean cooking fuels and technologies", unit: "%", dec: 0, get: (r) => r.cooking_pct, year: (r) => r.cooking_year, src: (r) => r.cooking_source,
      note: (r) => r.no_cooking_m >= 0.01 && `${nf(r.no_cooking_m, 2)} million people without` }),
    M({ id: "cold_home", label: "People who can't afford to keep their home warm", unit: "%", get: (r) => r.cold_home_pct, year: (r) => r.cold_home_year, src: (r) => r.cold_home_source,
      note: (r) => r.cold_home_poor_pct != null && `${nf(r.cold_home_poor_pct, 1)}% of people at risk of poverty` }),
    M({ id: "utility_arrears", label: "People behind on utility bills", unit: "%", get: (r) => r.arrears_pct, year: (r) => r.arrears_year, src: (r) => r.arrears_source }),
    M({ id: "elec_price", label: "Household electricity price, all taxes included", unit: "euro cents per kWh", get: (r) => (r.elec_price_eur != null ? r.elec_price_eur * 100 : null), year: (r) => r.price_period, src: (r) => r.elec_price_source }),
    M({ id: "gas_price", label: "Household gas price, all taxes included", unit: "euro cents per kWh", get: (r) => (r.gas_price_eur != null ? r.gas_price_eur * 100 : null), year: (r) => r.price_period, src: (r) => r.gas_price_source }),
  ] },
  { dash: "medicines", section: "map", table: ["medicines", "countries"], key: (r) => r.iso3, items: [
    M({ id: "pharma_exports", label: "Pharmaceutical exports (HS 30)", unit: "US$ billion", dec: 2, get: (r) => r.exports_bn, year: (r) => r.year, src: (r) => r.trade_source,
      note: (r) => r.exports_share_pct != null && `${nf(r.exports_share_pct, 1)}% of exports reported worldwide` }),
    M({ id: "pharma_imports", label: "Pharmaceutical imports (HS 30)", unit: "US$ billion", dec: 2, get: (r) => r.imports_bn, year: (r) => r.year, src: (r) => r.trade_source }),
    M({ id: "abx_exports", label: "Antibiotic ingredient exports (HS 2941)", unit: "US$ million", dec: 1, get: (r) => r.abx_exports_m, year: (r) => r.year, src: (r) => r.trade_source }),
  ] },
];
const SECTION_TITLE = { electricity: "Electricity", air: "Air", water: "Water", food: "Food", debt: "Debt and public services", heat: "Heat", orbit: "Space", housing: "Housing", minerals: "Minerals", internet: "Internet", scams: "Scams", vaccines: "Vaccines", energy: "Household energy", medicines: "Medicines" };

// Values for every country, then ranks.
const VAL = new Map(); // iso3 -> metric id -> { v, under, y, s, dash, row }
const RANK = {}; // metric id -> sorted values (ascending)
for (const g of METRICS) {
  const rows = rec(...g.table);
  for (const it of g.items) {
    const vals = [];
    for (const r of rows) {
      const iso = g.key(r);
      if (!iso || !C.has(iso)) continue;
      const v = it.get(r), under = it.under?.(r);
      if (v == null && !under) continue;
      if (!VAL.has(iso)) VAL.set(iso, {});
      VAL.get(iso)[it.id] = { v, under, y: it.year(r), s: it.src(r), note: it.note?.(r) || "", dash: g.dash };
      vals.push(v ?? -Infinity);
    }
    RANK[it.id] = vals.sort((a, b) => a - b);
  }
}
const rankOf = (id, v) => {
  const s = RANK[id], n = s.length;
  const below = s.filter((x) => x < v).length, above = s.filter((x) => x > v).length;
  return { n, high: above + 1, low: below + 1, pos: n > 1 ? below / (n - 1) : 0.5, median: n ? s[Math.floor(n / 2)] : null };
};

/* ---------- Lists that aren't one number: minerals, cloud, cables, scams, housing markets ---------- */
const MINES = new Map();
for (const r of rec("minerals", "production")) {
  if (!C.has(r.iso3) || r.share_2025 == null || r.share_2025 < 0.5) continue;
  if (!MINES.has(r.iso3)) MINES.set(r.iso3, []);
  MINES.get(r.iso3).push(r);
}
const REFINES = new Map();
for (const r of rec("minerals", "refining")) {
  const iso = isoOfName(r.country);
  if (!iso || r.share_2025 == null) continue;
  if (!REFINES.has(iso)) REFINES.set(iso, []);
  REFINES.get(iso).push(r);
}
const countBy = (rows, name) => {
  const m = new Map(), miss = new Set();
  for (const r of rows) {
    const iso = isoOfName(r[name]);
    if (iso) m.set(iso, (m.get(iso) ?? 0) + 1);
    else if (!(String(r[name]).trim().toLowerCase() in ALIAS)) miss.add(r[name]); // an alias of null is left out on purpose
  }
  return [m, miss];
};
const [CLOUD, cloudMiss] = countBy(rec("internet", "cloud_regions"), "country");
const [LANDINGS, landMiss] = countBy(rec("internet", "landings"), "country");
const CLOUD_BY = new Map();
for (const r of rec("internet", "cloud_regions")) { const iso = isoOfName(r.country); if (!iso) continue; if (!CLOUD_BY.has(iso)) CLOUD_BY.set(iso, new Map()); const p = CLOUD_BY.get(iso); p.set(r.provider, (p.get(r.provider) ?? 0) + 1); }
const SCAMS = new Map();
for (const r of rec("scams", "reported")) { const iso = isoOfN3(r.iso_n3); if (iso) SCAMS.set(iso, r); }
const SCAM_EST = new Map();
for (const r of rec("scams", "estimates")) { const iso = isoOfN3(r.iso_n3); if (iso) SCAM_EST.set(iso, r); }
const n3ToCode = new Map(rec("housing", "nations").map((r) => [r.nation_code, isoOfN3(r.iso_n3)]));
const MARKETS = new Map();
for (const r of rec("housing", "markets")) { const iso = n3ToCode.get(r.nation_code); if (!iso) continue; if (!MARKETS.has(iso)) MARKETS.set(iso, []); MARKETS.get(iso).push(r); }

const unmatched = [...cloudMiss, ...landMiss].filter(Boolean);
if (unmatched.length) console.log(`Country names not matched to a code (left off the profiles): ${[...new Set(unmatched)].sort().join(", ")}`);

/* ---------- Page pieces ---------- */
const slug = (iso) => iso.toLowerCase();
const srcLink = (dash, key, y) => {
  const s = SOURCES[dash][key];
  const yr = y != null && y !== "" ? `${esc(when(y))} · ` : "";
  if (!s) return `${yr}source: ${esc(DASH[dash].title)} dashboard`;
  return `${yr}<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)}">${esc(s.publisher.replace(/\s*\(.*?\)\s*/g, " ").trim())}</a>`;
};
const valueHtml = (it, x) => {
  if (x.v == null && x.under) return `Under ${nf(x.under, 1)}${it.unit === "%" ? "%" : ""}`;
  const main = it.fmt ? it.fmt(x.v) : nf(x.v, it.dec) + (it.unit === "%" ? "%" : "");
  const unit = it.fmt ? (it.unit ? ` <small>${esc(it.unit)}</small>` : "") : it.unit && it.unit !== "%" ? ` <small>${esc(it.unit)}</small>` : "";
  return esc(main) + unit;
};
function metricHtml(it, x) {
  const r = x.v != null ? rankOf(it.id, x.v) : null;
  const rank = r ? (r.high <= r.low ? `${ord(r.high)} highest of ${r.n}` : `${ord(r.low)} lowest of ${r.n}`) : `among the lowest of ${RANK[it.id].length}`;
  const pos = r ? r.pos : 0;
  const med = r && r.median != null ? rankOf(it.id, r.median).pos : null;
  return `<div class="ct-m"><dt>${esc(it.label)}</dt>
<dd class="ct-v">${valueHtml(it, x)}</dd>
<dd class="ct-ctx">${x.note ? `${esc(x.note)} · ` : ""}${esc(rank)}</dd>
<dd class="ct-pc" role="img" aria-label="${esc(`Position among ${RANK[it.id].length} countries, lowest to highest: ${rank}`)}">${med != null ? `<b style="left:${(med * 100).toFixed(1)}%" title="Median"></b>` : ""}<i style="left:${(pos * 100).toFixed(1)}%"></i></dd>
<dd class="ct-ctx">${srcLink(x.dash, x.s, x.y)}</dd></div>`;
}
const sec = (dash, sectionId, body, title = SECTION_TITLE[dash]) => `<section class="ct-sec" id="${dash}" style="${accent(dash)}">
<div class="ct-sec-h"><h2>${esc(title)}</h2><a href="../../${dash}/#${sectionId}">${esc(DASH[dash].title)} dashboard →</a></div>
${body}
</section>`;

function profile(c) {
  const vals = VAL.get(c.iso3) ?? {};
  const blocks = [];
  const seen = new Set();
  // Group the single figures by dashboard, keeping METRICS order.
  for (const dash of [...new Set(METRICS.map((g) => g.dash))]) {
    const items = METRICS.filter((g) => g.dash === dash).flatMap((g) => g.items.map((it) => [it, g.section])).filter(([it]) => vals[it.id]);
    if (!items.length) continue;
    seen.add(dash);
    let extra = "";
    if (dash === "housing" && MARKETS.has(c.iso3)) {
      const ms = MARKETS.get(c.iso3).sort((a, b) => b.median_multiple - a.median_multiple);
      extra = `<p class="ct-ctx">${ms.length} market${ms.length > 1 ? "s" : ""} rated by Demographia, least affordable first:</p><ul class="ct-list">${ms.slice(0, 8).map((m) => `<li><span>${esc(m.market)}</span><span>${nf(m.median_multiple, 1)} years</span></li>`).join("")}</ul>${ms.length > 8 ? `<p class="ct-ctx">and ${ms.length - 8} more on the dashboard.</p>` : ""}`;
    }
    blocks.push(sec(dash, items[0][1], `<dl class="ct-grid">${items.map(([it]) => metricHtml(it, vals[it.id])).join("")}</dl>${extra}`));
  }
  // Minerals: shares of world mining and refining.
  const mines = (MINES.get(c.iso3) ?? []).sort((a, b) => b.share_2025 - a.share_2025);
  const refines = (REFINES.get(c.iso3) ?? []).sort((a, b) => b.share_2025 - a.share_2025);
  if (mines.length || refines.length) {
    seen.add("minerals");
    blocks.push(sec("minerals", mines.length ? "map" : "refining",
      (mines.length ? `<p class="ct-ctx">Share of world mine production, 2025 · ${srcLink("minerals", mines[0].source)}</p><ul class="ct-list">${mines.map((m) => `<li><span>${esc(m.mineral_label)}</span><span>${nf(m.share_2025, 1)}%</span></li>`).join("")}</ul>` : "")
      + (refines.length ? `<p class="ct-ctx" style="margin-top:16px">Share of world refining, 2025 · ${srcLink("minerals", refines[0].source)}</p><ul class="ct-list">${refines.map((m) => `<li><span>${esc(m.mineral_label)}</span><span>${nf(m.share_2025, 1)}%</span></li>`).join("")}</ul>` : "")));
  }
  // Internet: cloud regions and cable landing points.
  if (CLOUD.has(c.iso3) || LANDINGS.has(c.iso3)) {
    seen.add("internet");
    const prov = CLOUD_BY.get(c.iso3);
    blocks.push(sec("internet", CLOUD.has(c.iso3) ? "cloud" : "map", `<ul class="ct-list">`
      + (LANDINGS.has(c.iso3) ? `<li><span>Submarine cable landing points (2021 snapshot) · ${srcLink("internet", "telegeography-2021")}</span><span>${nf(LANDINGS.get(c.iso3))}</span></li>` : "")
      + (prov ? `<li><span>Cloud regions: ${[...prov].map(([p, n]) => `${esc(p)} ${n}`).join(", ")}</span><span>${nf(CLOUD.get(c.iso3))}</span></li>` : "")
      + `</ul>`));
  }
  // Scams: losses reported to a national agency, or a survey estimate.
  const sc = SCAMS.get(c.iso3), se = SCAM_EST.get(c.iso3);
  if (sc || se) {
    seen.add("scams");
    const money = (v, cur) => `${cur} ${big(v)}`;
    blocks.push(sec("scams", "map", `<dl class="ct-grid">`
      + (sc ? `<div class="ct-m"><dt>Losses reported to ${esc(sc.agency)}</dt><dd class="ct-v">${esc(money(sc.losses_local, sc.currency))}</dd><dd class="ct-ctx">${sc.reports ? `${esc(big(sc.reports))} reports · ` : ""}${sc.top_type ? `largest type: ${esc(sc.top_type)}` : ""}</dd><dd class="ct-ctx">${srcLink("scams", sc.source, sc.year)}</dd></div>` : "")
      + (se ? `<div class="ct-m"><dt>Losses estimated from a survey of adults</dt><dd class="ct-v">${esc(money(se.est_local, se.currency))}</dd><dd class="ct-ctx">Surveys run far higher than reported losses</dd><dd class="ct-ctx">${srcLink("scams", se.source, se.year)}</dd></div>` : "")
      + `</dl>`));
  }
  const dashes = [...seen];
  const missing = Object.keys(DASH).filter((d) => !seen.has(d) && d !== "chokepoints");
  const jump = `<ul class="ct-jump" aria-label="Jump to a dashboard">${dashes.map((d) => `<li><a class="ct-tag" style="${accent(d)}" href="#${d}">${esc(SECTION_TITLE[d])}</a></li>`).join("")}</ul>`;
  const body = `<header class="st-head">
<p class="st-eyebrow"><a href="../">Country profiles</a> · ${esc(c.iso3)}</p>
<h1>${esc(c.name)}</h1>
<p class="st-lede">Figures for ${esc(c.name)} from ${dashes.length} of the Ledger Monitor dashboards. Each one links to the report it came from, and shows where ${esc(c.name)} sits among every country with a figure: the bar under each runs from the lowest country on the left to the highest on the right, and the thin tick marks the median.</p>
<div class="st-actions"><a class="hb-btn" href="../../compare/?c=${c.iso3}">Compare with other countries</a><button type="button" class="hb-btn" data-copy="link">Copy link</button></div>
${jump}
</header>
${blocks.join("\n")}
${missing.length ? `<p class="ct-missing">No figures for ${esc(c.name)} in: ${missing.map((d) => `<a href="../../${d}/">${esc(DASH[d].title)}</a>`).join(", ")}. The Chokepoints dashboard covers sea routes rather than countries.</p>` : ""}`;
  return { body, dashes: dashes.length };
}

/* ---------- Write the pages ---------- */
// Only countries with figures in at least two dashboards get a page.
const pages = [];
for (const c of [...C.values()].sort((a, b) => a.name.localeCompare(b.name, "en"))) {
  const p = profile(c);
  if (p.dashes < 2) continue;
  pages.push({ ...c, dashes: p.dashes });
  write(`country/${slug(c.iso3)}/index.html`, page({
    title: `${c.name}: country profile`,
    description: `${c.name} across ${p.dashes} open-data dashboards: electricity, air, water, food, debt, heat and more, each figure cited to its source.`,
    depth: 2, body: p.body,
  }));
}
// Remove pages for countries that have dropped out.
const keep = new Set(pages.map((c) => slug(c.iso3)));
for (const d of fs.readdirSync(path.join(ROOT, "country"), { withFileTypes: true })) {
  if (d.isDirectory() && /^[a-z]{3}$/.test(d.name) && !keep.has(d.name)) fs.rmSync(path.join(ROOT, "country", d.name), { recursive: true });
}

write("country/index.html", page({
  title: "Country profiles",
  description: `${pages.length} country profiles: each country's figures from every Ledger Monitor dashboard, cited to their sources.`,
  depth: 1,
  body: `<header class="st-head">
<p class="st-eyebrow">${pages.length} countries and territories</p>
<h1>Country profiles</h1>
<p class="st-lede">Every country's figures from the dashboards on one page: its electricity, air, water, food, debt, heat and more, each cited, with where it ranks among all countries.</p>
<div class="st-actions"><a class="hb-btn" href="../compare/">Compare countries side by side</a></div>
</header>
<div class="ct-filter"><label class="st-field" for="ct-filter">Find a country<input class="st-input" id="ct-filter" type="search" autocomplete="off" placeholder="Type a name or code, e.g. Kenya or KEN"></label></div>
<p class="ct-count" id="ct-count" aria-live="polite">${pages.length} countries</p>
<ul class="ct-az" id="ct-list">
${pages.map((c) => `<li data-k="${esc(`${c.name} ${c.iso3}`.toLowerCase())}"><a href="${slug(c.iso3)}/">${esc(c.name)}</a><span title="Dashboards with figures">${c.dashes}</span></li>`).join("\n")}
</ul>`,
}));

// Data for the compare page: the single figures only, which line up across countries.
const metricList = METRICS.flatMap((g) => g.items.map((it) => ({ id: it.id, dash: g.dash, section: g.section, label: it.label, unit: it.unit, dec: it.dec, signed: it.signed, money: it.money })));
const srcNames = [];
const srcIdx = (name) => { if (name == null) return null; let i = srcNames.indexOf(name); if (i < 0) i = srcNames.push(name) - 1; return i; };
const profiles = {
  generated: new Date().toISOString().slice(0, 10),
  dashboards: Object.fromEntries(Object.entries(DASH).map(([d, x]) => [d, { title: x.title, light: x.light, dark: x.dark }])),
  metrics: metricList,
  countries: Object.fromEntries(pages.map((c) => {
    const vals = VAL.get(c.iso3) ?? {};
    return [c.iso3, { name: c.name, m: Object.fromEntries(Object.entries(vals).map(([id, x]) => {
      const s = SOURCES[x.dash][x.s];
      const row = [x.v ?? null, x.y ?? null, srcIdx(s ? s.publisher.replace(/\s*\(.*?\)\s*/g, " ").trim() : null)];
      if (x.under) row.push(x.under);
      return [id, row];
    })) }];
  })),
};
profiles.sources = srcNames; // each figure's third entry is an index into this list
write("country/profiles.json", JSON.stringify(profiles));

write("compare/index.html", page({
  title: "Compare countries",
  description: "Put up to four countries side by side across every Ledger Monitor dashboard: electricity, air, water, food, debt, heat and more.",
  depth: 1,
  body: `<header class="st-head">
<p class="st-eyebrow"><a href="../country/">Country profiles</a></p>
<h1>Compare countries</h1>
<p class="st-lede">Pick up to four countries to see their figures side by side. The link updates as you choose, so you can share the comparison.</p>
</header>
<form class="cp-pick" id="cp-pick" aria-label="Countries to compare">
${[1, 2, 3, 4].map((i) => `<label class="st-field" for="cp-${i}">Country ${i}<input class="st-input" id="cp-${i}" list="cp-names" autocomplete="off" placeholder="${["e.g. Kenya", "e.g. India", "optional", "optional"][i - 1]}"></label>`).join("\n")}
<datalist id="cp-names">${pages.map((c) => `<option value="${esc(c.name)}"></option>`).join("")}</datalist>
</form>
<div class="st-actions"><button type="button" class="hb-btn" data-copy="link">Copy link to this comparison</button></div>
<div id="cp-out" aria-live="polite"><p class="cp-empty">Choose a country to start.</p></div>
<p class="st-note">Bars compare the countries shown, scaled to the largest of them on each row. Figures are each country's latest year in the source, so years can differ: they are shown beside each value. Sources and method notes are on each country's profile and dashboard.</p>
<noscript><p class="st-note">The comparison needs JavaScript. Each country's figures are also on its <a href="../country/">profile page</a>.</p></noscript>`,
  modules: ["assets/compare.js"],
}));

/* ---------- Search index for the hub ---------- */
const topics = [];
for (const r of rec("minerals", "minerals")) topics.push({ t: r.label, d: "minerals", u: "minerals/#map", s: `Critical Minerals: where ${r.label.toLowerCase()} is mined and refined` });
for (const r of rec("chokepoints", "chokepoints")) topics.push({ t: r.chokepoint ?? r.name, d: "chokepoints", u: "chokepoints/#map", s: "Chokepoints: ships and oil through this sea route" });
write("assets/search.json", JSON.stringify({
  dashboards: Object.entries(DASH).map(([d, x]) => ({ t: x.title, d, u: `${d}/`, s: x.sum })),
  countries: pages.map((c) => ({ t: c.name, k: c.iso3, u: `country/${slug(c.iso3)}/`, s: `Country profile · ${c.dashes} dashboards` })),
  topics: topics.filter((t) => t.t),
}));

console.log(`Wrote ${pages.length} country profiles, country/index.html, country/profiles.json, compare/index.html and assets/search.json.`);
