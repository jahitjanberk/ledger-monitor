// Builds data/heat/* and heat/assets/data.js for the Extreme Heat dashboard from scripts/.raw/heat
// (Copernicus Climate Pulse ERA5 daily, HadCRUT5, OWID country anomalies, World Bank CCKP, Met Office HadUK-Grid).
//   node scripts/build/heat.mjs        (raw downloads in scripts/.raw/heat/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "heat");
const OUT = path.join(REPO, "data/heat");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "heat/assets"), { recursive: true });
const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const txt = (f) => fs.readFileSync(path.join(RAW, f), "utf8");
const YEAR = 2025;

const SOURCES = {
  "c3s-pulse": {
    publisher: "Copernicus Climate Change Service (C3S) and ECMWF, Climate Pulse",
    title: "Daily global mean surface air temperature, ERA5",
    url: "https://pulse.climate.copernicus.eu/",
    published: "2026-11-06",
    method: "reference",
    notes: "Daily global average air temperature 2 metres above the surface, 1 January 1940 to 4 November 2026, and its difference from the 1991–2020 average for the same day. The latest days are preliminary. Contains modified Copernicus Climate Change Service information.",
  },
  hadcrut5: {
    publisher: "Met Office Hadley Centre and the Climatic Research Unit, University of East Anglia",
    title: "HadCRUT5 global temperature, version 5.2.0.0, annual",
    url: "https://www.metoffice.gov.uk/hadobs/hadcrut5/",
    published: "2026-09-18",
    method: "reference",
    notes: "Annual global surface temperature anomalies, 1850 to 2025, with 95% uncertainty range. Published against 1961–1990; rebased here to the 1850–1900 average, which stands in for pre-industrial. Open Government Licence v3.0.",
  },
  "c3s-oct2026": {
    publisher: "Copernicus Climate Change Service",
    title: "Surface air temperature for October 2026",
    url: "https://climate.copernicus.eu/surface-air-temperature-october-2026",
    published: "2026-11",
    method: "reference",
    notes: "Monthly climate bulletin.",
  },
  "c3s-aug2026": {
    publisher: "Copernicus Climate Change Service",
    title: "Surface air temperature for August 2026",
    url: "https://climate.copernicus.eu/surface-air-temperature-august-2026",
    published: "2026-09",
    method: "reference",
    notes: "Monthly climate bulletin.",
  },
  "ecmwf-2025": {
    publisher: "ECMWF and the Copernicus Climate Change Service",
    title: "Global Climate Highlights 2025: launch news release",
    url: "https://www.ecmwf.int/node/31031",
    published: "2026-01-14",
    method: "reference",
    notes: "",
  },
  "wmo-2025": {
    publisher: "World Meteorological Organization",
    title: "WMO confirms 2025 was one of warmest years on record",
    url: "https://wmo.int/news/media-centre/wmo-confirms-2025-was-one-of-warmest-years-record",
    published: "2026-01-14",
    method: "reference",
    notes: "Consolidated analysis of eight global temperature datasets.",
  },
  "owid-anom": {
    publisher: "Copernicus Climate Change Service, with major processing by Our World in Data",
    title: "Annual temperature anomalies by country (ERA5)",
    url: "https://ourworldindata.org/grapher/annual-temperature-anomalies",
    published: "2026-10-12",
    method: "reference",
    notes: "Each country's average air temperature over land in 2025, against its own 1991–2020 average. Contains modified Copernicus Climate Change Service information (2026). CC BY 4.0 for Our World in Data's processing.",
  },
  "wb-cckp": {
    publisher: "World Bank Climate Change Knowledge Portal",
    title: "Number of hot days (maximum above 35°C), ERA5 0.25°, 1950–2025",
    url: "https://climateknowledgeportal.worldbank.org/",
    published: "2026",
    method: "reference",
    notes: "Days a year when the daily maximum temperature passes 35°C, averaged over each country's area, so a country with hot and cool regions gets a middling number. CC BY 4.0.",
  },
  "wb-cckp-cmip6": {
    publisher: "World Bank Climate Change Knowledge Portal",
    title: "Projected number of hot days (maximum above 35°C), CMIP6 ensemble median",
    url: "https://climateknowledgeportal.worldbank.org/",
    published: "2026",
    method: "model",
    notes: "Model average for 2040–2059 under a middle-of-the-road emissions scenario (SSP2-4.5), against the same models for 1995–2014. Model figures are not directly comparable with the ERA5 counts. CC BY 4.0.",
  },
  "lancet-2025": {
    publisher: "World Health Organization, on the Lancet Countdown on Health and Climate Change 2025",
    title: "Climate inaction is claiming millions of lives every year, warns new Lancet Countdown report",
    url: "https://www.who.int/news/item/29-10-2025-climate-inaction-is-claiming-millions-of-lives-every-year--warns-new-lancet-countdown-report",
    published: "2025-10-29",
    method: "model",
    notes: "Heat-related deaths are a multi-year average estimated from temperature and mortality data.",
  },
  "ilo-2024": {
    publisher: "International Labour Organization",
    title: "Climate change creates a 'cocktail' of serious health hazards for 70 per cent of the world's workers",
    url: "https://www.ilo.org/resource/news/climate-change-creates-%E2%80%98cocktail%E2%80%99-serious-health-hazards-70-cent-world%E2%80%99s",
    published: "2024-04-22",
    method: "model",
    notes: "Estimates for 2020, the latest available.",
  },
  "who-wmo-work": {
    publisher: "World Health Organization and World Meteorological Organization",
    title: "WHO, WMO issue new report and guidance to protect workers from increasing heat stress",
    url: "https://www.who.int/news/item/22-08-2025-who-wmo-issue-new-report-and-guidance-to-protect-workers-from-increasing-heat-stress",
    published: "2025-08-22",
    method: "reference",
    notes: "",
  },
  "isglobal-2024": {
    publisher: "ISGlobal, on a study in Nature Medicine",
    title: "62,700 deaths associated with heat in summer 2024 in Europe",
    url: "https://www.isglobal.org/en/-/62.700-muertes-asociadas-con-el-calor-del-verano-de-2024",
    published: "2025-09-22",
    method: "model",
    notes: "654 regions in 32 European countries, 1 June to 30 September 2024.",
  },
  "metoffice-haduk": {
    publisher: "Met Office National Climate Information Centre",
    title: "HadUK-Grid UK areal series: mean temperature",
    url: "https://www.metoffice.gov.uk/research/climate/maps-and-data/uk-and-regional-series",
    published: "2026-11-01",
    method: "reference",
    notes: "UK average of daily mean temperature for June to August, 1884 to 2026. 2026 is provisional. Open Government Licence v3.0.",
  },
  "metoffice-summer2026": {
    publisher: "Met Office",
    title: "Summer 2026 provisionally hottest on record for the UK",
    url: "https://www.metoffice.gov.uk/about-us/news-and-media/media-centre/weather-and-climate-news/2026/summer-2026-provisionally-hottest-on-record-for-the-uk",
    published: "2026-09-17",
    method: "reference",
    notes: "Provisional statistics.",
  },
  "metoffice-28c": {
    publisher: "Met Office blog",
    title: "How exceptional were UK summer 2026 daily temperatures?",
    url: "https://www.metoffice.gov.uk/blog/2026/how-exceptional-were-uk-summer-2026-daily-temperatures",
    published: "2026-09-02",
    method: "reference",
    notes: "Counts days when the temperature passed 28°C anywhere in the UK.",
  },
  "ukhsa-2025": {
    publisher: "UK Health Security Agency",
    title: "Heat mortality monitoring report: England, 2025",
    url: "https://www.gov.uk/government/statistics/heat-mortality-monitoring-report-england-2025/heat-mortality-monitoring-report-england-2025",
    published: "2026-04-02",
    method: "model",
    notes: "Deaths above the expected number during heat episodes. Open Government Licence v3.0.",
  },
  "ukhsa-2026": {
    publisher: "UK Health Security Agency",
    title: "UKHSA report shows 2,877 excess deaths caused by May and June heatwaves",
    url: "https://www.gov.uk/government/news/ukhsa-report-shows-2877-excess-deaths-caused-by-may-and-june-heatwaves",
    published: "2026-07-30",
    method: "model",
    notes: "Interim estimate.",
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

// ---------- ERA5 daily ----------
const daily = txt("era5_daily_2t_global.csv").split("\n").filter((l) => /^\d{4}-/.test(l)).map((l) => {
  const [date, t, clim, ano, status] = l.trim().split(",");
  return { date, t: +t, clim: +clim, ano: +ano, status };
});
const byYear = {};
for (const d of daily) (byYear[d.date.slice(0, 4)] ??= []).push(d);
const era5Years = Object.entries(byYear).map(([y, a]) => ({
  year: +y, days: a.length, mean_c: r1(a.reduce((s, d) => s + d.t, 0) / a.length, 2), anomaly_9120: r1(a.reduce((s, d) => s + d.ano, 0) / a.length, 2),
  partial: a.length < 365 ? `1 January to ${+a.at(-1).date.slice(8)} ${["January","February","March","April","May","June","July","August","September","October","November","December"][+a.at(-1).date.slice(5, 7) - 1]}` : null, source: "c3s-pulse",
}));
const recent = daily.filter((d) => d.date >= "2023-01-01").map((d) => ({ date: d.date, temp_c: d.t, normal_c: d.clim, anomaly_9120: d.ano, status: d.status, source: "c3s-pulse" }));
const hottest = daily.reduce((a, b) => (b.t > a.t ? b : a));
const hot26 = byYear["2026"].reduce((a, b) => (b.t > a.t ? b : a));

// ---------- HadCRUT5, rebased to 1850–1900 ----------
const hc = txt("hadcrut5.2.0.0_global_annual.csv").split("\n").slice(1).filter(Boolean).map((l) => l.split(",").map(Number));
const base = hc.filter((r) => r[0] >= 1850 && r[0] <= 1900).reduce((s, r) => s + r[1], 0) / 51;
const global = hc.filter((r) => r[0] <= YEAR).map((r) => ({ year: r[0], anomaly_preindustrial: r1(r[1] - base, 2), low: r1(r[2] - base, 2), high: r1(r[3] - base, 2), anomaly_6190: r1(r[1], 3), source: "hadcrut5" }));

// ---------- Countries ----------
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const anom = {};
for (const l of txt("owid_annual-temperature-anomalies.csv").split("\n").slice(1)) {
  const m = l.match(/^(?:"[^"]*"|[^,]*),([A-Z]{3}),(\d{4}),(-?[\d.]+)/);
  if (m && +m[2] === YEAR) anom[m[1]] = +m[3];
}
const J = (f) => JSON.parse(txt(f)).data;
const hd = J("wb_cckp_era5_hd35_annual_1950-2025_all_countries.json"), tas = J("wb_cckp_era5_tas_annual_1950-2025_all_countries.json");
const pj = J("wb_cckp_cmip6_hd35_2040-2059_ssp245_all_countries.json"), ph = J("wb_cckp_cmip6_hd35_1995-2014_historical_all_countries.json");
const avg = (o, a, b) => { const v = []; for (let y = a; y <= b; y++) if (o?.[`${y}-07`] != null) v.push(o[`${y}-07`]); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };

const BANDS = [
  { map: "anomaly", band: "Cooler than usual", min: null, max: 0, unit: "°C against 1991–2020", source: "owid-anom" },
  { map: "anomaly", band: "0 to 0.5°C", min: 0, max: 0.5, unit: "°C against 1991–2020", source: "owid-anom" },
  { map: "anomaly", band: "0.5 to 1°C", min: 0.5, max: 1, unit: "°C against 1991–2020", source: "owid-anom" },
  { map: "anomaly", band: "1 to 1.5°C", min: 1, max: 1.5, unit: "°C against 1991–2020", source: "owid-anom" },
  { map: "anomaly", band: "1.5°C or more", min: 1.5, max: null, unit: "°C against 1991–2020", source: "owid-anom" },
  { map: "days", band: "Under 1 day", min: 0, max: 1, unit: "days above 35°C", source: "wb-cckp" },
  { map: "days", band: "1 to 10 days", min: 1, max: 10, unit: "days above 35°C", source: "wb-cckp" },
  { map: "days", band: "10 to 30 days", min: 10, max: 30, unit: "days above 35°C", source: "wb-cckp" },
  { map: "days", band: "30 to 100 days", min: 30, max: 100, unit: "days above 35°C", source: "wb-cckp" },
  { map: "days", band: "100 days or more", min: 100, max: null, unit: "days above 35°C", source: "wb-cckp" },
  { map: "change", band: "Fewer than usual", min: null, max: -0.5, unit: "extra days above 35°C against 1991–2020", source: "wb-cckp" },
  { map: "change", band: "About the same", min: -0.5, max: 2, unit: "extra days above 35°C against 1991–2020", source: "wb-cckp" },
  { map: "change", band: "2 to 10 more", min: 2, max: 10, unit: "extra days above 35°C against 1991–2020", source: "wb-cckp" },
  { map: "change", band: "10 to 25 more", min: 10, max: 25, unit: "extra days above 35°C against 1991–2020", source: "wb-cckp" },
  { map: "change", band: "25 or more", min: 25, max: null, unit: "extra days above 35°C against 1991–2020", source: "wb-cckp" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

const countries = [];
for (const c of AIR) {
  const k = c.iso3, a = anom[k] ?? null, d = hd[k]?.[`${YEAR}-07`] ?? null, b = avg(hd[k], 1991, 2020);
  if (a == null && d == null) continue;
  const chg = d != null && b != null ? d - b : null;
  const p0 = ph[k]?.["1995-07"] ?? null, p1 = pj[k]?.["2040-07"] ?? null;
  countries.push({
    country: c.country, iso3: k, iso_n3: c.iso_n3, year: YEAR,
    anomaly_c: r1(a, 2), anomaly_source: a != null ? "owid-anom" : null,
    hot_days: r1(d), hot_days_9120: r1(b), hot_days_change: r1(chg), hot_days_source: d != null ? "wb-cckp" : null,
    mean_temp_c: r1(tas[k]?.[`${YEAR}-07`] ?? null), mean_temp_source: tas[k]?.[`${YEAR}-07`] != null ? "wb-cckp" : null,
    model_days_1995_2014: r1(p0), model_days_2040_2059: r1(p1), model_source: p0 != null && p1 != null ? "wb-cckp-cmip6" : null,
    anomaly_band: bandOf("anomaly", a), days_band: bandOf("days", d), change_band: bandOf("change", chg),
  });
}
countries.sort((a, b) => (b.hot_days ?? -1) - (a.hot_days ?? -1));
const worldAnom = (() => { for (const l of txt("owid_annual-temperature-anomalies.csv").split("\n")) { const m = l.match(/,OWID_WRL,(\d{4}),(-?[\d.]+)/); if (m && +m[1] === YEAR) return +m[2]; } return null; })();

// ---------- UK summers ----------
const uk = [];
for (const l of txt("metoffice_haduk_Tmean_UK.txt").split("\n")) {
  const p = l.trim().split(/\s+/);
  if (!/^\d{4}$/.test(p[0])) continue;
  const sum = parseFloat(p[15]);
  const jja = [p[6], p[7], p[8]].map(parseFloat);
  const val = isFinite(sum) ? sum : jja.every(isFinite) ? (jja[0] + jja[1] + jja[2]) / 3 : null;
  if (val != null) uk.push({ year: +p[0], summer_mean_c: r1(val, 2), annual_mean_c: isFinite(parseFloat(p[17])) ? r1(parseFloat(p[17]), 2) : null, provisional: +p[0] === 2026, source: "metoffice-haduk" });
}

// ---------- Facts ----------
const facts = [
  { id: "y2025", label: "Global temperature in 2025 above the 1850–1900 average (WMO, eight datasets)", value: 1.44, unit: "°C", note: "± 0.13°C; second or third warmest year depending on the dataset", source: "wmo-2025" },
  { id: "three", label: "Average global temperature 2023–2025 above the 1850–1900 average", value: 1.48, unit: "°C", note: "The first three-year period above 1.5°C in ERA5", source: "wmo-2025" },
  { id: "y2024", label: "Global temperature in 2024, the warmest year, above pre-industrial (ERA5)", value: 1.6, unit: "°C", note: "", source: "ecmwf-2025" },
  { id: "era2025", label: "Global temperature in 2025 above pre-industrial (ERA5)", value: 1.47, unit: "°C", note: "The past 11 years were the 11 warmest on record", source: "ecmwf-2025" },
  { id: "stress", label: "Share of global land with more days of at least strong heat stress than average, 2025", value: 50, unit: "%", note: "Half", source: "ecmwf-2025" },
  { id: "oct2026", label: "October 2026 above the 1850–1900 average, the warmest October on record", value: 1.75, unit: "°C", note: "The third month in a row above 1.5°C", source: "c3s-oct2026" },
  { id: "last12", label: "Global temperature, November 2025 to October 2026, above the 1850–1900 average", value: 1.51, unit: "°C", note: "2026 is forecast to be the second-warmest year and to exceed 1.5°C", source: "c3s-oct2026" },
  { id: "aug2026", label: "August 2026 above the 1850–1900 average; tied with July 2023 as the warmest month ever recorded", value: 1.65, unit: "°C", note: "", source: "c3s-aug2026" },
  { id: "deaths", label: "Heat-related deaths a year worldwide (average)", value: 546000, unit: "deaths", note: "The rate of heat-related deaths rose 23% since the 1990s", source: "lancet-2025" },
  { id: "hours", label: "Potential labour hours lost to heat in 2024", value: 640, unit: "billion hours", note: "Productivity losses equivalent to US$1.09 trillion", source: "lancet-2025" },
  { id: "days16", label: "Days of dangerous heat the average person faced in 2024 that would not have been expected without climate change", value: 16, unit: "days", note: "", source: "lancet-2025" },
  { id: "workers", label: "Workers likely to be exposed to excessive heat at some point during their work (2020)", value: 2.4, unit: "billion", note: "Out of 3.4 billion; 70.9% of the global workforce, up from 65.5% in 2000", source: "ilo-2024" },
  { id: "injuries", label: "Work injuries a year attributable to excessive heat", value: 22.87, unit: "million", note: "Causing 18,970 deaths", source: "ilo-2024" },
  { id: "prod", label: "Fall in worker productivity for every degree above 20°C", value: 2.5, unit: "%", note: "2–3%", source: "who-wmo-work" },
  { id: "europe", label: "Heat-related deaths in Europe, 1 June to 30 September 2024", value: 62775, unit: "deaths", note: "More than 181,000 over the summers of 2022, 2023 and 2024", source: "isglobal-2024" },
  { id: "uksummer", label: "UK mean temperature, summer 2026, provisionally the warmest on record", value: 16.5, unit: "°C", note: "Peak 38.2°C at Hartpury College on 13 August; 54 Met Office stations broke their all-time records", source: "metoffice-summer2026" },
  { id: "uk130", label: "How much more likely human-induced climate change made the UK's summer 2026", value: 130, unit: "times", note: "Around 130 times", source: "metoffice-summer2026" },
  { id: "uk28", label: "Days in summer 2026 when the temperature passed 28°C somewhere in the UK", value: 55, unit: "days", note: "The previous record was 41, in 1976 and 1995", source: "metoffice-28c" },
  { id: "ukdeaths2025", label: "Heat-associated deaths in England, summer 2025", value: 1504, unit: "deaths", note: "95% confidence interval 936 to 2,072; 5 heat episodes", source: "ukhsa-2025" },
  { id: "ukdeaths2026", label: "Heat-associated deaths in England during the May and June 2026 heatwaves (interim)", value: 2877, unit: "deaths", note: "753 in the May episode and 2,124 in the June heatwave", source: "ukhsa-2026" },
];

const TABLES = [
  ["countries", "Heat by country", `Each country's ${YEAR} temperature against its 1991–2020 average (ERA5 via Our World in Data), days above 35°C in ${YEAR} and the 1991–2020 average (ERA5 via the World Bank), and modelled days above 35°C for 1995–2014 and 2040–2059 (CMIP6, SSP2-4.5).`, countries],
  ["global", "Global temperature since 1850", "HadCRUT5 annual global temperature, 1850 to 2025, rebased to the 1850–1900 average, with its 95% uncertainty range.", global],
  ["era5_years", "Global temperature by year, ERA5", "Annual average of the daily global temperature and its difference from 1991–2020, 1940 to 2026 (2026 so far).", era5Years],
  ["daily", "Daily global temperature since 2023", "Daily global air temperature, the 1991–2020 average for that day and the difference, 1 January 2023 to 4 November 2026 (ERA5, Copernicus Climate Pulse).", recent],
  ["uk_summers", "UK summer temperature since 1884", "UK average daily mean temperature for June to August, and for the year, 1884 to 2026 (Met Office HadUK-Grid). 2026 is provisional.", uk],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from Copernicus, ECMWF, the WMO, the Lancet Countdown, the ILO, ISGlobal, the Met Office and UKHSA.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "heat", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>heat data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>heat data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (Copernicus: the Copernicus licence, "Contains modified Copernicus Climate Change Service information"; World Bank and Our World in Data: CC BY 4.0; Met Office: Open Government Licence v3.0).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
DATA.world_anomaly = r1(worldAnom, 2);
DATA.hottest = { date: hottest.date, temp_c: hottest.t, source: "c3s-pulse" };
DATA.hottest2026 = { date: hot26.date, temp_c: hot26.t, source: "c3s-pulse" };
fs.writeFileSync(path.join(REPO, "heat/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

console.log("countries", countries.length, "anom", countries.filter((r) => r.anomaly_c != null).length, "days", countries.filter((r) => r.hot_days != null).length, "model", countries.filter((r) => r.model_source).length);
console.log("hadcrut 2023-25", global.slice(-3).map((r) => r.anomaly_preindustrial));
console.log("era5 last", era5Years.slice(-3));
console.log("top days", countries.slice(0, 8).map((r) => `${r.iso3} ${r.hot_days}`).join(", "));
console.log("top change", [...countries].sort((a, b) => (b.hot_days_change ?? -99) - (a.hot_days_change ?? -99)).slice(0, 8).map((r) => `${r.iso3} ${r.hot_days_change}`).join(", "));
console.log("top anom", [...countries].sort((a, b) => (b.anomaly_c ?? -99) - (a.anomaly_c ?? -99)).slice(0, 8).map((r) => `${r.iso3} ${r.anomaly_c}`).join(", "));
console.log("world anom", worldAnom, "hottest", DATA.hottest, DATA.hottest2026, "uk last", uk.slice(-3));
const pjx = countries.filter((r) => r.model_source).map((r) => ({ c: r.iso3, d: r.model_days_2040_2059 - r.model_days_1995_2014 })).sort((a, b) => b.d - a.d).slice(0, 8);
console.log("model change", pjx.map((r) => `${r.c} ${r.d.toFixed(1)}`).join(", "));
console.log("bands anom", BANDS.filter(b=>b.map==="anomaly").map(b=>b.band+":"+countries.filter(r=>r.anomaly_band===b.band).length).join(" "));
console.log("bands change", BANDS.filter(b=>b.map==="change").map(b=>b.band+":"+countries.filter(r=>r.change_band===b.band).length).join(" "));
