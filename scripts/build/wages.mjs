// Builds data/wages/* and wages/assets/data.js for the Wages & the Cost of Living dashboard
// from the raw downloads in scripts/.raw/wages (ILOSTAT SDMX CSVs, OECD SDMX CSVs, FAOSTAT CoHD, ONS CSVs).
//   node scripts/build/wages.mjs        (raw downloads in scripts/.raw/wages/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "wages");
const OUT = path.join(REPO, "data/wages");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "wages/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const MW_FROM = 2021; // oldest minimum wage year shown
const AVG_FROM = 2019; // oldest average earnings year shown
const FLAG_RATIO = 10; // minimum wage below this % of average earnings is treated as not comparable
const DAYS_PER_MONTH = 365 / 12;

const SOURCES = {
  "ilo-mw": {
    publisher: "International Labour Organization (ILOSTAT)",
    title: "Monthly minimum wage by currency (EAR_INEE_CUR_NB)",
    url: "https://ilostat.ilo.org/data/",
    published: "2026-11-01",
    method: "reference",
    notes: "Statutory gross monthly minimum wage at 31 December of each year, in local currency, US dollars and PPP dollars (PPP for private consumption, matching the World Bank's PA.NUS.PRVT.PP factor for the same year). Where the law sets an hourly, daily or weekly rate, ILO converts it (for example hourly × 40 hours × 4.33 weeks). Where there is no single national rate, ILO uses the capital's, an average of regional rates, or the rate for manufacturing or unskilled workers. Downloaded from the ILO SDMX API (sdmx.ilo.org), dataflow DF_EAR_INEE_CUR_NB, last updated 1 November 2026. CC BY 4.0.",
  },
  "ilo-earn": {
    publisher: "International Labour Organization (ILOSTAT)",
    title: "Average monthly earnings of employees by sex and currency (EAR_EMTA_SEX_CUR_NB)",
    url: "https://ilostat.ilo.org/data/",
    published: "2026-10-26",
    method: "reference",
    notes: "Mean gross monthly earnings of employees, all sexes, in PPP dollars. Built from each country's own surveys (labour force, household or establishment surveys), so coverage and definitions differ between countries. Latest year since 2019. Dataflow DF_EAR_EMTA_SEX_CUR_NB, last updated 26 October 2026. CC BY 4.0.",
  },
  "ilo-wp": {
    publisher: "International Labour Organization (ILOSTAT)",
    title: "SDG indicator 1.1.1: Working poverty rate by sex and age, ILO modelled estimates (SDG_0111_SEX_AGE_RT)",
    url: "https://ilostat.ilo.org/data/",
    published: "2025-12-03",
    method: "reference",
    notes: "Share of employed people aged 15 and over living in households below the international poverty line of US$3 a day in PPP terms. ILO modelled estimates, harmonised across countries; mainly low- and middle-income countries. 2000 to 2025. Dataflow DF_SDG_0111_SEX_AGE_RT, last updated 3 December 2025. CC BY 4.0.",
  },
  "ilo-ls": {
    publisher: "International Labour Organization (ILOSTAT)",
    title: "Labour income share as a percent of GDP, ILO modelled estimates, November 2025 (LAP_2GDP_NOC_RT)",
    url: "https://ilostat.ilo.org/data/",
    published: "2026-03-20",
    method: "reference",
    notes: "Total labour income, including an imputed share of the self-employed's income, as % of GDP. ILO warns that imputed values are not based on national data and should not be used to compare or rank countries, so country figures here are each country's latest year based on national data. World and income-group figures are ILO's; 2025 and 2026 are model-based extrapolations. Dataflow DF_LAP_2GDP_NOC_RT, last updated 20 March 2026. CC BY 4.0.",
  },
  "ilo-gwr": {
    publisher: "International Labour Organization",
    title: "Global Wage Report 2024-25: Is wage inequality decreasing globally? (press release)",
    url: "https://www.ilo.org/resource/news/wage-inequality-has-declined-two-thirds-countries-worldwide-start-21st",
    published: "2024-11-28",
    method: "reference",
    notes: "Global and G20 real average wage growth, 2022 to 2024 (2024 a projection), and the distribution of the global wage bill. The next edition had not been published on 7 November 2026. CC BY 4.0.",
  },
  "ilo-est2026": {
    publisher: "International Labour Organization",
    title: "Employment and Social Trends 2026 (press release, 14 January 2026)",
    url: "https://www.ilo.org/resource/news/global-job-quality-stagnates-despite-resilient-growth",
    published: "2026-01-14",
    method: "reference",
    notes: "Workers in extreme poverty and informal employment, worldwide. CC BY 4.0.",
  },
  "oecd-avw": {
    publisher: "OECD",
    title: "Average annual wages (DSD_EARNINGS@AV_AN_WAGE)",
    url: "https://data-explorer.oecd.org/",
    published: "2026",
    method: "reference",
    notes: "Average annual wages per full-time equivalent employee, total economy, in US dollars at constant 2025 prices and 2025 PPPs. Downloaded from the OECD SDMX API on 7 November 2026; the API gives no release date. Free to reuse with credit under the OECD's terms and conditions. This is an adaptation of an original work by the OECD. The opinions expressed and arguments employed in this adaptation should not be reported as representing the official views of the OECD or of its Member countries.",
  },
  "oecd-rmw": {
    publisher: "OECD",
    title: "Real minimum wages at constant prices (DSD_EARNINGS@RMW) and minimum relative to median wages of full-time workers (DSD_EARNINGS@MIN2AVE)",
    url: "https://data-explorer.oecd.org/",
    published: "2026",
    method: "reference",
    notes: "Statutory minimum wages per hour in US dollars at constant 2025 prices and 2025 PPPs, 2001 to 2025, and the minimum wage as % of the median full-time wage. Downloaded from the OECD SDMX API on 7 November 2026; the API gives no release date. Free to reuse with credit under the OECD's terms and conditions (same adaptation notice as above).",
  },
  "fao-cohd": {
    publisher: "FAO and World Bank, via FAOSTAT",
    title: "Cost and Affordability of a Healthy Diet (July 2026 release)",
    url: "https://www.fao.org/faostat/en/#data/CAHD",
    published: "2026-07-21",
    method: "reference",
    notes: "Cost of the cheapest locally available healthy diet, per person per day, in local currency (element 6205), 2017 to 2025. The Food dashboard shows the same figures in PPP dollars. CC BY 4.0.",
  },
  "ons-awe": {
    publisher: "Office for National Statistics",
    title: "Average weekly earnings in Great Britain: October 2026 (series KAB9, A3WX and A3WW)",
    url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/bulletins/averageweeklyearningsingreatbritain/october2026",
    published: "2026-10-20",
    method: "reference",
    notes: "Whole economy, seasonally adjusted total pay including bonuses: KAB9 is £ a week in cash terms; A3WX is £ a week in real terms (adjusted for CPIH inflation, at constant prices); A3WW is real growth, three months on the same three months a year earlier. Great Britain. Open Government Licence v3.0.",
  },
  "ons-lowpay": {
    publisher: "Office for National Statistics",
    title: "Low and high pay in the UK: 2026 (Annual Survey of Hours and Earnings)",
    url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/bulletins/lowandhighpayuk/2026",
    published: "2026-10-22",
    method: "reference",
    notes: "Low pay is below two-thirds of median hourly pay excluding overtime; high pay is above 1.5 times the median. Employee jobs on adult rates with pay unaffected by absence, April each year. 2026 is provisional; data from 2023 may not be directly comparable with 2022; 2020 and 2021 are less certain. Open Government Licence v3.0.",
  },
  "govuk-nmw": {
    publisher: "GOV.UK",
    title: "National Minimum Wage and National Living Wage rates",
    url: "https://www.gov.uk/national-minimum-wage-rates",
    published: "2026-10-28",
    method: "reference",
    notes: "Hourly rates from April 2019 to April 2027. The page's last major update is dated 30 October 2024; the April 2027 rates were added after their announcement on 28 October 2026. Open Government Licence v3.0.",
  },
  "lpc-2027": {
    publisher: "Low Pay Commission, via GOV.UK",
    title: "LPC recommendations take the National Living Wage to £13.21",
    url: "https://www.gov.uk/government/news/lpc-recommendations-take-the-national-living-wage-to-1321",
    published: "2026-10-28",
    method: "reference",
    notes: "Minimum wage rates from April 2027. Open Government Licence v3.0.",
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
function parseCSV(t) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f.replace(/\r$/, "")); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift().map((x) => x.replace(/^﻿/, ""));
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const CSV = (f) => parseCSV(fs.readFileSync(path.join(RAW, f), "utf8"));
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));
const N3 = Object.fromEntries(AIR.map((r) => [String(r.iso_n3).padStart(3, "0"), r.iso3]));
const latest = (rows, pred = () => true) => {
  const m = {};
  for (const r of rows) if (pred(r) && (!m[r.REF_AREA] || +m[r.REF_AREA].TIME_PERIOD < +r.TIME_PERIOD)) m[r.REF_AREA] = r;
  return m;
};
const series = (rows) => { const m = {}; for (const r of rows) (m[r.REF_AREA] ??= {})[r.TIME_PERIOD] = r; return m; };

// ILO minimum wage
const MW = CSV("ilo_EAR_INEE_CUR_NB.csv").filter((r) => r.FREQ === "A" && r.OBS_VALUE !== "");
const mwBy = {};
for (const r of MW) ((mwBy[r.REF_AREA] ??= {})[r.TIME_PERIOD] ??= {})[r.CUR] = r;
const mwType = (r) => (r.NOTE_INDICATOR.match(/Type of minimum wage: ([^|]+)/)?.[1] ?? "").trim() || null;
const mwCur = (r) => r.NOTE_INDICATOR.match(/\| ([A-Z]{3}): [^|]+$/)?.[1] ?? null;
// ILO average monthly earnings, all sexes
const EARN = CSV("ilo_EAR_EMTA_SEX_CUR_NB.csv").filter((r) => r.SEX === "SEX_T" && r.CUR === "CUR_TYPE_PPP" && r.OBS_VALUE !== "" && +r.TIME_PERIOD >= AVG_FROM);
const earnLast = latest(EARN);
// ILO working poverty, 15+
const WP = CSV("ilo_SDG_0111_SEX_AGE_RT.csv").filter((r) => r.SEX === "SEX_T" && r.AGE === "AGE_YTHADULT_YGE15" && r.OBS_VALUE !== "");
const wpBy = series(WP), wpLast = latest(WP);
// ILO labour income share
const LS = CSV("ilo_LAP_2GDP_NOC_RT.csv").filter((r) => r.OBS_VALUE !== "");
const lsBy = series(LS), lsNat = latest(LS, (r) => r.OBS_STATUS === "" && !r.REF_AREA.startsWith("X"));
// FAOSTAT cost of a healthy diet, local currency per person per day
// Item 70041 is local currency, 70040 PPP dollars; the PPP figure is used only to check that FAO and ILO use the same currency.
const COHD = {}, COHD_PPP = {};
for (const r of CSV("cahd/Cost_Affordability_Healthy_Diet_(CoAHD)_E_All_Data_(Normalized).csv")) {
  if (!["70040", "70041"].includes(r["Item Code"]) || !(+r.Value > 0)) continue;
  const iso = N3[r["Area Code (M49)"].replace(/'/g, "")];
  if (iso) ((r["Item Code"] === "70041" ? COHD : COHD_PPP)[iso] ??= {})[r.Year] = +r.Value;
}
// OECD
const OAV = CSV("oecd_AV_AN_WAGE.csv").filter((r) => r.UNIT_MEASURE === "USD_PPP" && r.PRICE_BASE === "Q" && r.BASE_PER === "2025" && r.OBS_VALUE !== "");
const oav = {}; for (const r of OAV) (oav[r.REF_AREA] ??= { name: r["Reference area"] })[r.TIME_PERIOD] = +r.OBS_VALUE;
const ORM = CSV("oecd_RMW.csv").filter((r) => r.UNIT_MEASURE === "USD_PPP" && r.PAY_PERIOD === "H" && r.OBS_VALUE !== "");
const orm = {}; for (const r of ORM) (orm[r.REF_AREA] ??= {})[r.TIME_PERIOD] = +r.OBS_VALUE;
const OMED = CSV("oecd_MIN2AVE.csv").filter((r) => r.AGGREGATION_OPERATION === "MEDIAN" && r.OBS_VALUE !== "");
const omed = {}; for (const r of OMED) (omed[r.REF_AREA] ??= {})[r.TIME_PERIOD] = +r.OBS_VALUE;
// OECD lists Malta's hourly minimum at about a fifth of what ILO's monthly figure implies, so it is left out.
const OECD_SKIP = new Set(["MLT"]);

// ---------- Bands ----------
const B = (map, band, min, max, unit, source) => ({ map, band, min, max, unit, source });
const BANDS = [
  B("minwage", "Under $250", null, 250, "PPP dollars a month", "ilo-mw"),
  B("minwage", "$250 to $500", 250, 500, "PPP dollars a month", "ilo-mw"),
  B("minwage", "$500 to $1,000", 500, 1000, "PPP dollars a month", "ilo-mw"),
  B("minwage", "$1,000 to $2,000", 1000, 2000, "PPP dollars a month", "ilo-mw"),
  B("minwage", "$2,000 or more", 2000, null, "PPP dollars a month", "ilo-mw"),
  B("poverty", "Under 1%", null, 1, "% of workers", "ilo-wp"),
  B("poverty", "1 to 5%", 1, 5, "% of workers", "ilo-wp"),
  B("poverty", "5 to 15%", 5, 15, "% of workers", "ilo-wp"),
  B("poverty", "15 to 35%", 15, 35, "% of workers", "ilo-wp"),
  B("poverty", "35% or more", 35, null, "% of workers", "ilo-wp"),
  B("diet", "Under 10%", null, 10, "% of a month's minimum wage", "fao-cohd"),
  B("diet", "10 to 25%", 10, 25, "% of a month's minimum wage", "fao-cohd"),
  B("diet", "25 to 50%", 25, 50, "% of a month's minimum wage", "fao-cohd"),
  B("diet", "50 to 100%", 50, 100, "% of a month's minimum wage", "fao-cohd"),
  B("diet", "More than the whole wage", 100, null, "% of a month's minimum wage", "fao-cohd"),
  B("labour", "Under 40%", null, 40, "% of GDP", "ilo-ls"),
  B("labour", "40 to 50%", 40, 50, "% of GDP", "ilo-ls"),
  B("labour", "50 to 55%", 50, 55, "% of GDP", "ilo-ls"),
  B("labour", "55 to 60%", 55, 60, "% of GDP", "ilo-ls"),
  B("labour", "60% or more", 60, null, "% of GDP", "ilo-ls"),
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const isos = new Set([...Object.keys(mwBy), ...Object.keys(wpLast), ...Object.keys(lsNat), ...Object.keys(oav)].filter((k) => BY3[k]));
const countries = [], flagged = [], dietDropped = [];
for (const k of isos) {
  const c = BY3[k];
  const yrs = Object.keys(mwBy[k] ?? {}).filter((y) => +y >= MW_FROM && mwBy[k][y].CUR_TYPE_PPP).sort();
  const my = yrs.at(-1), m = my ? mwBy[k][my] : null;
  const mwPPP = m ? +m.CUR_TYPE_PPP.OBS_VALUE : null;
  const e = earnLast[k], avg = e ? +e.OBS_VALUE : null;
  const ratio = mwPPP != null && avg ? (100 * mwPPP) / avg : null;
  const flag = ratio != null && ratio < FLAG_RATIO;
  if (flag) flagged.push(`${k} ${r1(ratio)}%`);
  // Healthy diet against the minimum wage: both in local currency for the same year.
  let diet = null;
  if (m && !flag) {
    const dy = Object.keys(mwBy[k]).filter((y) => +y >= MW_FROM && mwBy[k][y].CUR_TYPE_LCU && COHD[k]?.[y] != null).sort().at(-1);
    // ILO's and FAO's local currency per PPP dollar should agree; if not, one of them is in another currency
    // (a redenomination, the euro, or a wage set in US dollars), so the comparison is dropped.
    const fi = dy && mwBy[k][dy].CUR_TYPE_PPP ? +mwBy[k][dy].CUR_TYPE_LCU.OBS_VALUE / +mwBy[k][dy].CUR_TYPE_PPP.OBS_VALUE : null;
    const ff = dy && COHD_PPP[k]?.[dy] ? COHD[k][dy] / COHD_PPP[k][dy] : null;
    const same = fi && ff && fi / ff > 0.8 && fi / ff < 1.25;
    if (dy && !same) dietDropped.push(`${k} ${dy} (ILO ${fi?.toFixed(3)}, FAO ${ff?.toFixed(3)} per PPP dollar)`);
    if (dy && same) {
      const lcu = +mwBy[k][dy].CUR_TYPE_LCU.OBS_VALUE, cost = COHD[k][dy];
      diet = { y: +dy, cost, share: (100 * cost * DAYS_PER_MONTH) / lcu, lcu, cur: mwCur(mwBy[k][dy].CUR_TYPE_LCU) };
    } else if (!dy && COHD[k]) dietDropped.push(`${k} (no matching year)`);
  }
  const wp = wpLast[k], ls = lsNat[k];
  const wp15 = wpBy[k]?.["2015"];
  const o = oav[k], rm = orm[k], md = omed[k];
  const oy = o ? Math.max(...Object.keys(o).filter((x) => /^\d{4}$/.test(x)).map(Number)) : null;
  const ry = rm && !OECD_SKIP.has(k) ? Math.max(...Object.keys(rm).map(Number)) : null;
  const mdy = md ? Math.max(...Object.keys(md).map(Number)) : null;
  const row = {
    country: c.country, iso3: k, iso_n3: c.iso_n3,
    min_wage_ppp: m && !flag ? r1(mwPPP, 0) : null, min_wage_usd: m && !flag && m.CUR_TYPE_USD ? r1(+m.CUR_TYPE_USD.OBS_VALUE, 0) : null,
    min_wage_lcu: m?.CUR_TYPE_LCU ? r1(+m.CUR_TYPE_LCU.OBS_VALUE, 2) : null, currency: m?.CUR_TYPE_LCU ? mwCur(m.CUR_TYPE_LCU) : null,
    min_wage_year: m ? +my : null, min_wage_type: m ? mwType(m.CUR_TYPE_PPP) : null,
    min_wage_flag: flag ? `The minimum wage in ILO's data is ${r1(ratio, 1)}% of average earnings: either it has not been raised for many years or it is recorded in a different unit, so it is left out of the map and comparisons` : null,
    min_wage_source: m ? "ilo-mw" : null,
    avg_earnings_ppp: avg != null ? r1(avg, 0) : null, avg_earnings_year: e ? +e.TIME_PERIOD : null, avg_earnings_survey: e ? e.SOURCE.replace(/^[A-Z]+ - /, "") : null, avg_earnings_source: e ? "ilo-earn" : null,
    min_to_avg_pct: ratio != null && !flag ? r1(ratio, 0) : null,
    working_poverty: wp ? r1(+wp.OBS_VALUE) : null, working_poverty_year: wp ? +wp.TIME_PERIOD : null,
    working_poverty_2015: wp15 ? r1(+wp15.OBS_VALUE) : null, working_poverty_imputed: wp ? wp.OBS_STATUS === "I" : null, poverty_source: wp ? "ilo-wp" : null,
    labour_share: ls ? r1(+ls.OBS_VALUE) : null, labour_share_year: ls ? +ls.TIME_PERIOD : null, labour_share_source: ls ? "ilo-ls" : null,
    diet_cost_lcu: diet ? diet.cost : null, diet_year: diet?.y ?? null, diet_share: diet ? r1(diet.share) : null, diet_source: diet ? "fao-cohd" : null,
    oecd_avg_wage: oy ? r1(o[oy], 0) : null, oecd_avg_year: oy, oecd_real_change_2019: oy && o[2019] ? r1(100 * (o[oy] / o[2019] - 1)) : null,
    oecd_real_change_2008: oy && o[2008] ? r1(100 * (o[oy] / o[2008] - 1)) : null, oecd_real_change_1y: oy && o[oy - 1] ? r1(100 * (o[oy] / o[oy - 1] - 1)) : null,
    oecd_wage_source: oy ? "oecd-avw" : null,
    oecd_real_min_hourly: ry ? r1(rm[ry], 2) : null, oecd_real_min_2015: ry && rm[2015] ? r1(rm[2015], 2) : null,
    oecd_real_min_change_2015: ry && rm[2015] ? r1(100 * (rm[ry] / rm[2015] - 1)) : null, oecd_min_year: ry,
    oecd_min_to_median: mdy ? r1(md[mdy]) : null, oecd_min_to_median_year: mdy, oecd_min_source: ry || mdy ? "oecd-rmw" : null,
  };
  row.minwage_band = bandOf("minwage", row.min_wage_ppp);
  row.poverty_band = bandOf("poverty", row.working_poverty);
  row.diet_band = bandOf("diet", row.diet_share);
  row.labour_band = bandOf("labour", row.labour_share);
  if (row.min_wage_lcu == null && row.working_poverty == null && row.labour_share == null && row.oecd_avg_wage == null) continue;
  countries.push(row);
}
countries.sort((a, b) => a.country.localeCompare(b.country));

// ---------- World and groups over time ----------
const AREAS = { X01: "world", X02: "low", X03: "lmic", X04: "umic", X05: "high", X13: "ssa" };
const natYears = new Set(LS.filter((r) => !r.REF_AREA.startsWith("X") && r.OBS_STATUS === "").map((r) => +r.TIME_PERIOD));
const world = [];
for (let y = 2000; y <= 2026; y++) {
  const o = { year: y };
  for (const [a, s] of Object.entries(AREAS)) {
    o[`wp_${s}`] = wpBy[a]?.[y] ? r1(+wpBy[a][y].OBS_VALUE) : null;
    o[`ls_${s}`] = lsBy[a]?.[y] ? r1(+lsBy[a][y].OBS_VALUE) : null;
  }
  o.ls_extrapolated = o.ls_world != null ? !natYears.has(y) : null;
  o.wp_source = "ilo-wp"; o.ls_source = "ilo-ls";
  world.push(o);
}

// ---------- OECD over time ----------
const oecd = [];
for (let y = 2000; y <= 2025; y++) {
  const o = { year: y };
  for (const [k, s] of [["OECD", "oecd"], ["GBR", "gbr"], ["USA", "usa"], ["DEU", "deu"], ["FRA", "fra"], ["JPN", "jpn"]]) o[`avg_${s}`] = oav[k]?.[y] != null ? r1(oav[k][y], 0) : null;
  for (const [k, s] of [["GBR", "gbr"], ["USA", "usa"], ["DEU", "deu"], ["FRA", "fra"]]) o[`min_${s}`] = orm[k]?.[y] != null ? r1(orm[k][y], 2) : null;
  o.source = "oecd-avw"; o.min_source = "oecd-rmw";
  oecd.push(o);
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
const kab9 = ons("kab9"), a3wx = ons("a3wx"), a3ww = ons("a3ww");
const base08 = (() => { const v = Object.entries(a3wx).filter(([k]) => k.startsWith("2008-")).map(([, v]) => v); return v.reduce((s, x) => s + x, 0) / v.length; })();
const uk_awe = Object.keys(kab9).sort().map((k) => ({ month: k, total_pay_gbp: kab9[k], real_pay_gbp: a3wx[k] ?? null, real_index_2008: a3wx[k] != null ? r1((100 * a3wx[k]) / base08) : null, real_growth: a3ww[k] ?? null, source: "ons-awe" }));
const uk_nlw = [
  [2019, 8.21, 25], [2020, 8.72, 25], [2021, 8.91, 23], [2022, 9.5, 23], [2023, 10.42, 23], [2024, 11.44, 21], [2025, 12.21, 21], [2026, 12.71, 21], [2027, 13.21, 21],
].map(([year, rate, age]) => ({ year, from: `${year}-04-01`, rate_gbp_hour: rate, age_from: age, change_pct: null, announced: year === 2027, source: "govuk-nmw" }));
uk_nlw.forEach((r, i) => { if (i) r.change_pct = r1(100 * (r.rate_gbp_hour / uk_nlw[i - 1].rate_gbp_hour - 1)); });
const uk_lowpay = [];
for (const l of fs.readFileSync(path.join(RAW, "ons_lowpay_75a77a6c.csv"), "utf8").split("\n")) {
  const x = l.match(/^"(\d{4})","([\d.]+)","([\d.]+)"/);
  if (x) uk_lowpay.push({ year: +x[1], low_pay_pct: +x[2], high_pay_pct: +x[3], provisional: +x[1] === 2026, source: "ons-lowpay" });
}

// ---------- Headline findings ----------
const facts = [
  { id: "gwr2022", label: "Global real average wage growth, 2022", value: -0.9, unit: "%", note: "High inflation outpaced nominal wage growth", source: "ilo-gwr" },
  { id: "gwr2023", label: "Global real average wage growth, 2023", value: 1.8, unit: "%", note: "", source: "ilo-gwr" },
  { id: "gwr2024", label: "Global real average wage growth, 2024 (projection)", value: 2.7, unit: "%", note: "The highest increase in more than 15 years", source: "ilo-gwr" },
  { id: "adv2022", label: "Real wage growth in advanced G20 economies, 2022", value: -2.8, unit: "%", note: "", source: "ilo-gwr" },
  { id: "adv2023", label: "Real wage growth in advanced G20 economies, 2023", value: -0.5, unit: "%", note: "", source: "ilo-gwr" },
  { id: "em2022", label: "Real wage growth in emerging G20 economies, 2022", value: 1.8, unit: "%", note: "", source: "ilo-gwr" },
  { id: "em2023", label: "Real wage growth in emerging G20 economies, 2023", value: 6.0, unit: "%", note: "", source: "ilo-gwr" },
  { id: "bottom10", label: "Share of the global wage bill earned by the lowest-paid 10% of workers", value: 0.5, unit: "%", note: "", source: "ilo-gwr" },
  { id: "top10", label: "Share of the global wage bill earned by the highest-paid 10% of workers", value: 38, unit: "%", note: "Nearly 38%", source: "ilo-gwr" },
  { id: "liclow", label: "Share of wage workers in low-income countries classified as low-paid", value: 22, unit: "%", note: "Close to 22%", source: "ilo-gwr" },
  { id: "poor", label: "Workers living in extreme poverty, earning less than US$3 a day", value: 300, unit: "million", note: "Nearly 300 million", source: "ilo-est2026" },
  { id: "informal", label: "Workers expected to hold informal jobs in 2026", value: 2.1, unit: "billion", note: "", source: "ilo-est2026" },
  { id: "nlw2027", label: "UK National Living Wage from April 2027, workers aged 21 and over", value: 13.21, unit: "£ an hour", note: "Up 3.9%", source: "lpc-2027" },
  { id: "nlw2027pct", label: "Increase in the National Living Wage in April 2027", value: 3.9, unit: "%", note: "", source: "lpc-2027" },
  { id: "below", label: "UK employee jobs paid below the National Minimum Wage or National Living Wage, April 2026", value: 346000, unit: "jobs", note: "1.1% of employee jobs; not a measure of non-compliance", source: "ons-lowpay" },
  { id: "belowpct", label: "Share of UK employee jobs paid below the minimum wage, April 2026", value: 1.1, unit: "%", note: "", source: "ons-lowpay" },
  { id: "median", label: "UK median hourly pay excluding overtime, April 2026", value: 19.0, unit: "£ an hour", note: "", source: "ons-lowpay" },
  { id: "lowline", label: "UK low-pay threshold (two-thirds of median hourly pay), April 2026", value: 12.67, unit: "£ an hour", note: "", source: "ons-lowpay" },
  { id: "young", label: "Share of UK employees aged 16 to 21 in low pay, April 2026", value: 33.6, unit: "%", note: "", source: "ons-lowpay" },
  { id: "hospitality", label: "Share of UK employee jobs in accommodation and food services in low pay, April 2026", value: 16.3, unit: "%", note: "", source: "ons-lowpay" },
  { id: "cpih", label: "UK CPIH inflation, average of June to August 2026", value: 3.1, unit: "%", note: "", source: "ons-awe" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Wages, working poverty and labour share by country", `Statutory monthly minimum wage (ILO, latest year since ${MW_FROM}, PPP dollars), average monthly earnings (ILO, PPP dollars), working poverty rate (ILO modelled estimates), labour income share (ILO, latest year based on national data), the cost of a healthy diet against the minimum wage (FAO, local currency, same year), and OECD average and minimum wages at constant 2025 prices and PPPs.`, countries],
  ["world", "Working poverty and labour income share, world and income groups, 2000 to 2026", "ILO modelled estimates: share of workers living below US$3 a day (2000 to 2025) and labour income as % of GDP (2004 to 2026).", world],
  ["oecd", "Average and minimum wages in selected OECD countries, 2000 to 2025", "Average annual wages (US dollars, constant 2025 prices and PPPs) and real hourly minimum wages (same basis), OECD.", oecd],
  ["uk_awe", "UK average weekly earnings, monthly", `Whole economy total pay, seasonally adjusted, £ a week in cash and real terms, the real level as an index (2008 average = 100) and real annual growth, ${uk_awe[0].month} to ${uk_awe.at(-1).month} (ONS, Great Britain).`, uk_awe],
  ["uk_nlw", "UK National Living Wage, April 2019 to April 2027", "Hourly rate for the oldest age band and the age it starts at (GOV.UK).", uk_nlw],
  ["uk_lowpay", "UK low- and high-paid jobs, April 1997 to April 2026", "Share of employee jobs paid below two-thirds of the median hourly wage, and above 1.5 times it (ONS, ASHE).", uk_lowpay],
  ["bands", "Map classes", "Bands used to colour the four maps.", BANDS],
  ["facts", "Headline findings", "Published figures from the ILO's Global Wage Report 2024-25 and Employment and Social Trends 2026, the Low Pay Commission and the ONS.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "wages", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>wages data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>wages data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (ILO and FAO: CC BY 4.0; OECD: its terms and conditions, which allow reuse with credit; ONS and GOV.UK: Open Government Licence v3.0). OECD figures are an adaptation of an original work by the OECD; the opinions expressed and arguments employed in this adaptation should not be reported as representing the official views of the OECD or of its Member countries.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "wages/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const C = countries, has = (k) => C.filter((r) => r[k] != null);
console.log(`countries ${C.length}; min wage ${has("min_wage_ppp").length} (flagged ${flagged.length}: ${flagged.join(", ")}); avg earnings ${has("avg_earnings_ppp").length}; poverty ${has("working_poverty").length}; labour share ${has("labour_share").length}; diet ${has("diet_share").length}; OECD ${has("oecd_avg_wage").length}`);
console.log("min wage years", JSON.stringify(has("min_wage_year").reduce((m, r) => ((m[r.min_wage_year] = (m[r.min_wage_year] ?? 0) + 1), m), {})));
console.log("diet comparisons dropped:", dietDropped.join("; "));
const mws = has("min_wage_ppp").sort((a, b) => b.min_wage_ppp - a.min_wage_ppp);
console.log("top min wage:", mws.slice(0, 8).map((r) => `${r.iso3} ${r.min_wage_ppp}`).join(", "), "| bottom:", mws.slice(-8).map((r) => `${r.iso3} ${r.min_wage_ppp}`).join(", "));
console.log("median min wage PPP:", mws[mws.length >> 1].min_wage_ppp);
console.log("diet top:", has("diet_share").sort((a, b) => b.diet_share - a.diet_share).slice(0, 10).map((r) => `${r.iso3} ${r.diet_share}% (${r.diet_year})`).join(", "));
console.log("world", JSON.stringify(world.find((w) => w.year === 2025)));
console.log("uk", JSON.stringify(C.find((r) => r.iso3 === "GBR")));
console.log("awe last", JSON.stringify(uk_awe.at(-1)), "real peak pre-2009", JSON.stringify(uk_awe.filter((r) => r.month < "2009-12").reduce((a, b) => ((b.real_pay_gbp ?? 0) > (a.real_pay_gbp ?? 0) ? b : a))));
