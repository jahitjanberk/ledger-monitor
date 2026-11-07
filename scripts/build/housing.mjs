// Builds data/housing/* and housing/assets/data.js for the Housing Affordability dashboard
// (Demographia International Housing Affordability 2026 and 2025, ONS housing affordability 2025, UBS Global Real Estate Bubble Index 2025, GeoNames).
//   node scripts/build/housing.mjs        (optional raw downloads in scripts/.raw/housing/, or set RAW to their parent folder)
// The Demographia tables come only as a PDF, so they are typed in below with their source ids, as are the ONS and UBS
// figures. If the ONS bulletin and UBS release pages are in scripts/.raw/housing/, the builder checks the typed figures
// against them. See scripts/build/README.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "housing");
const OUT = path.join(REPO, "data/housing");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "housing/assets"), { recursive: true });

const SOURCES = {
  "demographia-2026": {
    publisher: "Chapman University Center for Demographics and Policy",
    title: "Demographia International Housing Affordability, 2026 Edition",
    url: "https://blogs.chapman.edu/wp-content/uploads/sites/56/2026/05/Demographia-International-Housing-Affordability-2026-Edition-1.pdf",
    published: "2026-05",
    method: "reported",
    notes: "Data for the third quarter of 2025.",
  },
  "demographia-2025": {
    publisher: "Chapman University Center for Demographics and Policy",
    title: "Demographia International Housing Affordability, 2025 Edition",
    url: "https://blogs.chapman.edu/wp-content/uploads/sites/56/2025/06/Demographic-International-Housing-Affordability-2025.pdf",
    published: "2025-05",
    method: "reported",
    notes: "Data for the third quarter of 2024.",
  },
  "ons-2025": {
    publisher: "Office for National Statistics",
    title: "Housing affordability in England and Wales: 2025",
    url: "https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/2025",
    published: "2026-03-26",
    method: "reported",
    notes: "London ratio corrected to 10.6 by the ONS on 13 May 2026.",
  },
  "ubs-2025": {
    publisher: "UBS",
    title: "UBS Global Real Estate Bubble Index 2025",
    url: "https://www.ubs.com/global/de/media/display-page-ndp/en-20250923-grebi25.html",
    published: "2025-09-23",
    method: "reference",
  },
  geonames: {
    publisher: "GeoNames (via the all-the-cities package)",
    title: "GeoNames cities with population over 1,000",
    url: "https://www.geonames.org/",
    published: "2026",
    method: "reference",
    notes: "Used only to place markets on the map.",
  },
};

const NATIONS = { US: "United States", CA: "Canada", GB: "United Kingdom", SG: "Singapore", IE: "Ireland", NZ: "New Zealand", AU: "Australia", HK: "China: Hong Kong" };

// ---------- Markets ----------
// Rank, market, nation and median multiple (Q3 2025) as listed in Demographia 2026, in its order; the Q3 2024 median
// multiple from Demographia 2025 (null where the 2025 edition did not cover the market); longitude and latitude of the
// market's main city from GeoNames, rounded to 2 decimals; and, where the market is not named after one city, the place
// it is plotted at.
// [rank, market, nation code, median multiple 2026 ed., median multiple 2025 ed., lon, lat, plotted at]
const MARKETS = [
  [1,"Cleveland, OH","US",3.1,3.3,-81.7,41.5,null],
  [2,"Pittsburgh, PA","US",3.2,3.2,-80,40.44,null],
  [3,"Edmonton, AB","CA",3.6,3.7,-113.47,53.55,null],
  [3,"Oklahoma City, OK","US",3.6,3.7,-97.52,35.47,null],
  [3,"Rochester, NY","US",3.6,3.6,-77.62,43.15,null],
  [3,"St. Louis, MO-IL","US",3.6,3.5,-90.2,38.63,null],
  [7,"Sheffield","GB",3.7,3.8,-1.47,53.38,null],
  [7,"Omaha, NE-IA","US",3.7,3.7,-95.94,41.26,null],
  [9,"Middlesbrough & Durham","GB",3.8,3.7,-1.23,54.58,null],
  [9,"Louisville, KY-IN","US",3.8,4,-85.76,38.25,null],
  [11,"Glasgow","GB",3.9,4.6,-4.26,55.87,null],
  [11,"Cincinnati, OH-KY-IN","US",3.9,3.9,-84.51,39.13,null],
  [11,"Dallas-Fort Worth, TX","US",3.9,4.3,-96.81,32.78,null],
  [11,"Detroit, MI","US",3.9,3.9,-83.05,42.33,null],
  [11,"Tulsa, OK","US",3.9,4.1,-95.99,36.15,null],
  [16,"Atlanta, GA","US",4,4.3,-84.39,33.75,null],
  [16,"Buffalo, NY","US",4,4,-78.88,42.89,null],
  [16,"Minneapolis-St. Paul, MN-WI","US",4,4,-93.26,44.98,null],
  [16,"San Antonio, TX","US",4,4.3,-98.49,29.42,null],
  [20,"Columbus, OH","US",4.1,4.3,-83,39.96,null],
  [20,"Houston, TX","US",4.1,4.3,-95.36,29.76,null],
  [20,"Indianapolis, IN","US",4.1,4.1,-86.16,39.77,null],
  [20,"Kansas City, MO-KS","US",4.1,4.2,-94.58,39.1,null],
  [24,"Grand Rapids, MI","US",4.2,4.3,-85.67,42.96,null],
  [25,"Calgary, AB","CA",4.3,4.8,-114.09,51.05,null],
  [25,"Singapore","SG",4.3,4.2,103.85,1.29,null],
  [25,"Memphis, TN-MS-AR","US",4.3,4.4,-90.05,35.15,null],
  [28,"Edinburgh","GB",4.4,6.2,-3.2,55.95,null],
  [28,"Nottingham","GB",4.4,4.6,-1.15,52.95,null],
  [28,"Baltimore, MD","US",4.4,4.4,-76.61,39.29,null],
  [28,"Birmingham, AL","US",4.4,4.5,-86.8,33.52,null],
  [28,"Chicago, IL","US",4.4,4.4,-87.65,41.85,null],
  [28,"Hartford, CT","US",4.4,4.3,-72.69,41.76,null],
  [28,"Philadelphia, PA-NJ-DE-MD","US",4.4,4.4,-75.16,39.95,null],
  [28,"Raleigh, NC","US",4.4,4.8,-78.64,35.77,null],
  [28,"Virginia Beach-Norfolk, VA-NC","US",4.4,4.4,-75.98,36.85,null],
  [37,"Derby & Derbyshire","GB",4.5,4.6,-1.48,52.92,null],
  [37,"Newcastle","GB",4.5,4.7,-1.61,54.97,"Newcastle upon Tyne (main city)"],
  [37,"Stoke on Trent & Staffordshire","GB",4.5,4.6,-2.19,53,"Stoke-on-Trent (main city)"],
  [37,"Greenville, SC","US",4.5,null,-82.39,34.85,null],
  [37,"New Orleans, LA","US",4.5,4.6,-90.08,29.95,null],
  [42,"Austin, TX","US",4.6,4.8,-97.74,30.27,null],
  [43,"West Midlands","GB",4.7,4.9,-1.9,52.48,"Birmingham (main city)"],
  [43,"Jacksonville, FL","US",4.7,5.1,-81.66,30.33,null],
  [43,"Nashville, TN","US",4.7,4.9,-86.78,36.17,null],
  [46,"Dublin","IE",4.9,5.1,-6.25,53.33,null],
  [46,"Blackpool & Lancashire","GB",4.9,4.9,-3.05,53.82,null],
  [46,"Charlotte, NC-SC","US",4.9,5.1,-80.84,35.23,null],
  [49,"Ottawa-Gatineau, ON-QC","CA",5,5,-75.7,45.41,null],
  [49,"Tampa-St. Petersburg, FL","US",5,5.5,-82.46,27.95,null],
  [51,"Hull & Humber","GB",5.1,5.4,-0.34,53.74,"Kingston upon Hull (main city)"],
  [51,"Phoenix, AZ","US",5.1,5.4,-112.07,33.45,null],
  [51,"Richmond, VA","US",5.1,4.9,-77.46,37.55,null],
  [51,"Tucson, AZ","US",5.1,5.5,-110.93,32.22,null],
  [51,"Washington, DC-VA-MD-WV","US",5.1,5.2,-77.04,38.9,null],
  [56,"Liverpool","GB",5.2,5.3,-2.98,53.41,null],
  [57,"Orlando, FL","US",5.3,5.6,-81.38,28.54,null],
  [58,"Sacramento, CA","US",5.4,5.8,-121.49,38.58,null],
  [59,"Leeds","GB",5.5,5.7,-1.55,53.8,null],
  [59,"Leicester & Leicestershire","GB",5.5,5.6,-1.13,52.64,null],
  [59,"Milwaukee, WI","US",5.5,5.3,-87.91,43.04,null],
  [62,"Northampton","GB",5.7,5.9,-0.88,52.25,null],
  [62,"Fresno, CA","US",5.7,5.9,-119.77,36.75,null],
  [64,"Montreal, QC","CA",5.8,5.8,-73.59,45.51,"Montréal (main city)"],
  [64,"Plymouth & Devon","GB",5.8,6,-4.14,50.37,null],
  [64,"Las Vegas, NV","US",5.8,6.3,-115.14,36.17,null],
  [64,"Salt Lake City, UT","US",5.8,6,-111.89,40.76,null],
  [68,"Denver, CO","US",5.9,6.2,-104.98,39.74,null],
  [68,"Portland, OR-WA","US",5.9,6.3,-122.68,45.52,null],
  [70,"Greater Manchester","GB",6.1,6.4,-2.24,53.48,null],
  [71,"Swindon","GB",6.2,6.4,-1.78,51.56,null],
  [72,"Riverside-San Bernardino, CA","US",6.3,6.6,-117.4,33.95,null],
  [73,"Providence, RI-MA","US",6.5,6.2,-71.41,41.82,null],
  [74,"Boston, MA-NH","US",6.6,6.7,-71.06,42.36,null],
  [75,"London Exurbs","GB",6.9,7.3,-0.97,51.46,"Reading (centre of the London exurbs)"],
  [75,"Seattle, WA","US",6.9,7.1,-122.33,47.61,null],
  [77,"Bournemouth & Dorset","GB",7.2,7.3,-1.88,50.72,null],
  [77,"Bristol-Bath","GB",7.2,7.5,-2.6,51.46,null],
  [79,"Warrington & Cheshire","GB",7.3,7.4,-2.58,53.39,null],
  [80,"New York, NY-NJ-PA","US",7.5,7.4,-74.01,40.71,"New York City (main city)"],
  [81,"Toronto, ON","CA",7.6,8.4,-79.42,43.7,null],
  [82,"Auckland","NZ",7.7,7.7,174.76,-36.85,null],
  [82,"Miami, FL","US",7.7,8.1,-80.19,25.77,null],
  [84,"Perth, WA","AU",8,8.3,115.86,-31.95,null],
  [85,"Greater London","GB",8.5,9.1,-0.13,51.51,null],
  [86,"San Diego, CA","US",9,9.5,-117.16,32.72,null],
  [87,"San Francisco, CA","US",9.4,10,-122.42,37.77,null],
  [88,"Melbourne, VIC","AU",9.5,9.7,144.96,-37.81,null],
  [89,"Brisbane, QLD","AU",9.9,9.3,153.03,-27.47,null],
  [90,"Honolulu, HI","US",10.4,10.8,-157.86,21.31,null],
  [91,"Los Angeles, CA","US",10.7,11.2,-118.24,34.05,null],
  [92,"Vancouver, BC","CA",10.8,11.8,-123.12,49.25,null],
  [93,"Adelaide, SA","AU",11.2,10.9,138.6,-34.93,null],
  [94,"San Jose, CA","US",11.3,12.1,-121.89,37.34,null],
  [95,"Sydney, NSW","AU",14,13.8,151.21,-33.87,null],
  [96,"Hong Kong","HK",14.1,14.4,114.17,22.28,null],
];
const markets = MARKETS.map(([rank, market, code, mm, prev, lon, lat, plotted_at]) => ({
  market, nation: NATIONS[code], nation_code: code, rank, median_multiple: mm, median_multiple_prev: prev, lon, lat, plotted_at,
  source: "demographia-2026", prev_source: prev == null ? null : "demographia-2025", geo_source: "geonames",
}));

// ---------- Nations ----------
// National median multiples as published by Demographia (the median across each nation's major markets; not
// recomputed here, since Demographia works from unrounded figures). [name, code, ISO numeric, 2026 ed., 2025 ed.]
const nations = [
  ["Australia", "AU", "036", 9.9, 9.7],
  ["Canada", "CA", "124", 5.4, 5.4],
  ["China: Hong Kong", "HK", "344", 14.1, 14.4],
  ["Ireland", "IE", "372", 4.9, 5.1],
  ["New Zealand", "NZ", "554", 7.7, 7.7],
  ["Singapore", "SG", "702", 4.3, 4.2],
  ["United Kingdom", "GB", "826", 5.2, 5.6],
  ["United States", "US", "840", 4.5, 4.8],
  [`All ${markets.length} markets`, "ALL", null, 5, 5.1],
].map(([nation, nation_code, iso_n3, median_multiple, median_multiple_prev]) => ({ nation, nation_code, iso_n3, median_multiple, median_multiple_prev, source: "demographia-2026", prev_source: "demographia-2025" }));

// ---------- Ratings ----------
const ratings = [
  ["Affordable", 0, 3],
  ["Moderately unaffordable", 3.1, 4],
  ["Seriously unaffordable", 4.1, 5],
  ["Severely unaffordable", 5.1, 8.9],
  ["Impossibly unaffordable", 9, 99],
].map(([rating, min, max]) => ({ rating, min, max, source: "demographia-2026" }));

// ---------- England and Wales (ONS) ----------
const uk_ons = [
  ["England", "Country", 7.6, 300000, 39300],
  ["Wales", "Country", 6, 213000, 35800],
  ["London", "Region", 10.6, null, null],
  ["North East", "Region", 5, null, null],
  ["Kensington and Chelsea", "Local authority", 25.2, null, null],
  ["Hyndburn", "Local authority", 4.1, null, null],
  ["Kingston upon Hull", "Local authority", 4.1, null, null],
].map(([area, level, ratio, median_price, median_earnings]) => ({ area, level, ratio, median_price, median_earnings, source: "ons-2025" }));

// ---------- Bubble risk (UBS) ----------
const BUBBLE = {
  High: ["Miami", "Tokyo", "Zurich"],
  Elevated: ["Los Angeles", "Geneva", "Amsterdam", "Dubai"],
  Moderate: ["Sydney", "Vancouver", "Toronto", "Madrid", "Frankfurt", "Munich"],
  Low: ["London", "Paris", "Milan", "Hong Kong", "San Francisco", "New York", "São Paulo"],
};
const bubble = Object.entries(BUBBLE).flatMap(([risk, cities]) => cities.map((city) => ({ city, risk, source: "ubs-2025" })));

// ---------- Checks against the source pages, when downloaded ----------
const pageText = (f) => (fs.existsSync(path.join(RAW, f)) ? fs.readFileSync(path.join(RAW, f), "utf8").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ") : null);
const warn = [];
const ons = pageText("ons_bulletin_2025.html");
if (ons) {
  const fmt = (v) => v.toLocaleString("en-GB");
  const ok = (re, what) => { if (!re.test(ons)) warn.push(`ONS bulletin: ${what} not found`); };
  const [E, W, L, NE, KC] = uk_ons;
  ok(new RegExp(`England, at £${fmt(E.median_price)}, cost ${E.ratio} times the median annual average earnings of a full-time employee \\(£${fmt(E.median_earnings)}\\)`), "England");
  ok(new RegExp(`Wales, the average home \\(£${fmt(W.median_price)}\\) was ${W.ratio.toFixed(1)} times the median annual average earnings \\(£${fmt(W.median_earnings)}\\)`), "Wales");
  ok(new RegExp(`London had the highest affordability ratio, with average homes selling for ${L.ratio} times`), "London");
  ok(new RegExp(`North East, an average-priced home was affordable with ${NE.ratio.toFixed(1)} times`), "North East");
  ok(new RegExp(`Kensington and Chelsea \\(${KC.ratio}`), "Kensington and Chelsea");
  ok(new RegExp(`Hyndburn and Kingston upon Hull \\(both with an affordability ratio of ${uk_ons[5].ratio}\\)`), "Hyndburn and Hull");
} else warn.push("ons_bulletin_2025.html not downloaded: ONS figures not checked");
const ubs = pageText("ubs_grebi_2025.html");
if (ubs) { for (const { city } of bubble) if (!ubs.includes(city)) warn.push(`UBS release: ${city} not mentioned`); }
else warn.push("ubs_grebi_2025.html not downloaded: UBS cities not checked");

// ---------- Write ----------
const TABLES = [
  ["bubble", "Bubble risk (UBS)", "UBS Global Real Estate Bubble Index 2025 risk categories for major cities.", bubble],
  ["markets", "Median multiple by market", `Median house price divided by median household income for ${markets.length} major housing markets, Q3 2025, with Q3 2024 for comparison.`, markets],
  ["nations", "National median multiples", "Median multiple across each nation's major markets in the Demographia survey, Q3 2025 and Q3 2024.", nations],
  ["ratings", "Affordability ratings", "Demographia's rating bands for the median multiple.", ratings],
  ["uk_ons", "England and Wales (ONS)", "ONS ratio of median house price to median gross annual earnings of full-time workers, 2025.", uk_ons],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2));
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "housing", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2));
const he = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); // apostrophes left as typed, as first published
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>housing data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>housing data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "housing/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

const sorted = [...markets].sort((a, b) => a.median_multiple - b.median_multiple);
console.log("markets", markets.length, "without 2025 figure", markets.filter((m) => m.median_multiple_prev == null).map((m) => m.market).join(", "));
console.log("most affordable", sorted[0].market, sorted[0].median_multiple, "least", sorted.at(-1).market, sorted.at(-1).median_multiple);
console.log("by nation", Object.keys(NATIONS).map((c) => `${c} ${markets.filter((m) => m.nation_code === c).length}`).join(", "));
for (const w of warn) console.warn("check:", w);
