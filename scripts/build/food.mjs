// Builds data/food/* and food/assets/data.js for the Food Prices & Hunger dashboard
// from the raw downloads in scripts/.raw/food (FAOSTAT bulk files, FAO FFPI, World Bank Pink Sheet,
// ONS MM23 series, USDA ERS international food expenditure workbook).
//   node scripts/build/food.mjs        (raw downloads in scripts/.raw/food/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv, parseCsv } from "../lib/csv.mjs";
import { readSheet } from "../lib/xlsx.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "food");
const OUT = path.join(REPO, "data/food");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "food/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const num = (s) => (s === "" || s == null || !/^-?[\d.]+(e-?\d+)?$/.test(String(s).trim()) ? null : Number(s));
const M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ---------- Sources ----------
const SOURCES = {
  "faostat-fs": {
    publisher: "Food and Agriculture Organization of the United Nations (FAO), FAOSTAT",
    title: "Suite of Food Security Indicators (July 2026 release, with The State of Food Security and Nutrition in the World 2026)",
    url: "https://www.fao.org/faostat/en/#data/FS",
    published: "2026-07-21",
    method: "reference",
    notes: "Prevalence and number of undernourished people (modelled from food supply, consumption and dietary energy needs; country values are three-year averages, 2023–2025), and food insecurity measured with the Food Insecurity Experience Scale survey. CC BY 4.0.",
  },
  "faostat-cahd": {
    publisher: "FAO and World Bank, via FAOSTAT",
    title: "Cost and Affordability of a Healthy Diet (July 2026 release)",
    url: "https://www.fao.org/faostat/en/#data/CAHD",
    published: "2026-07-21",
    method: "reference",
    notes: "The cheapest locally available foods that meet healthy-diet guidelines, priced per person per day in 2021 international (PPP) dollars, and the share of people whose income, after other basic needs, can't cover it. 2025. CC BY 4.0.",
  },
  "faostat-cp": {
    publisher: "FAO, FAOSTAT, from national statistics offices, the IMF and the ILO",
    title: "Consumer Price Indices: food price inflation",
    url: "https://www.fao.org/faostat/en/#data/CP",
    published: "2026-10-20",
    method: "reference",
    notes: "Year-on-year change in each country's food consumer price index, by month. Latest month available for each country, mostly June 2026. CC BY 4.0.",
  },
  "fao-ffpi": {
    publisher: "FAO",
    title: "FAO Food Price Index (November 2026 release)",
    url: "https://www.fao.org/worldfoodsituation/foodpricesindex/en/",
    published: "2026-11-06",
    method: "reference",
    notes: "Monthly index of international prices for a basket of cereals, vegetable oils, dairy, meat and sugar, weighted by export shares. 2014–2016 = 100. Nominal, January 1990 to October 2026.",
  },
  "fao-ffpi-real": {
    publisher: "FAO",
    title: "FAO Food Price Index, nominal and real, annual since 1961",
    url: "https://www.fao.org/worldfoodsituation/foodpricesindex/en/",
    published: "2026-11-06",
    method: "reference",
    notes: "Annual averages. The real index is deflated by the World Bank's manufactures unit value index. 2026 is the average of January to October.",
  },
  "wb-pinksheet": {
    publisher: "World Bank",
    title: "Commodity Price Data (The Pink Sheet), monthly prices",
    url: "https://www.worldbank.org/en/research/commodity-markets",
    published: "2026-11-03",
    method: "reference",
    notes: "Nominal US dollars. Urea (Middle East), DAP, potassium chloride, wheat (US HRW), maize (US), rice (Thai 5%), palm oil, soybean oil and Brent crude. CC BY 4.0.",
  },
  "wb-fert-blog": {
    publisher: "World Bank Data Blog (John Baffes and Kaltrina Temaj)",
    title: "Fertilizer prices surge as Strait of Hormuz disruptions tighten supplies",
    url: "https://blogs.worldbank.org/en/opendata/fertilizer-prices-surge-as-strait-of-hormuz-disruptions-tighten-",
    published: "2026-05-14",
    method: "reference",
    notes: "From the April 2026 Commodity Markets Outlook.",
  },
  "fao-hormuz": {
    publisher: "FAO",
    title: "Strait of Hormuz crisis: FAO Director-General outlines risks, actions and policy responses",
    url: "https://www.fao.org/newsroom/detail/strait-of-hormuz-crisis--fao-director-general-outlines-risks--actions-and-policy-responses/en",
    published: "2026-04-28",
    method: "reference",
    notes: "",
  },
  sofi2026: {
    publisher: "FAO, IFAD, UNICEF, WFP and WHO",
    title: "The State of Food Security and Nutrition in the World 2026: launch press release",
    url: "https://www.fao.org/newsroom/detail/un-report--global-hunger-levels-ease-for-third-consecutive-year-as-regional-disparities-persist/en",
    published: "2026-07-21",
    method: "reference",
    notes: "",
  },
  grfc2026: {
    publisher: "Global Network Against Food Crises and FSIN (reported by the European Commission Joint Research Centre)",
    title: "Global Report on Food Crises 2026",
    url: "https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/food-crises-no-respite-14-m-people-suffer-most-severe-level-food-insecurity-2025-2026-04-24_en",
    published: "2026-04-24",
    method: "reference",
    notes: "Acute food insecurity in 2025 in countries with food crises, classified with the IPC and Cadre Harmonisé scales. Phase 3 or above is Crisis, Emergency or Catastrophe.",
  },
  "ons-mm23": {
    publisher: "Office for National Statistics",
    title: "Consumer price inflation (MM23): series D7G8, D7G7 and D7BU",
    url: "https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/d7g8/mm23",
    published: "2026-10-21",
    method: "reference",
    notes: "12-month rate for food and non-alcoholic beverages (D7G8) and all items (D7G7), and the food price index (D7BU, 2015 = 100). Open Government Licence v3.0.",
  },
  "dwp-frs": {
    publisher: "Department for Work and Pensions",
    title: "Family Resources Survey: financial year 2024 to 2025",
    url: "https://www.gov.uk/government/statistics/family-resources-survey-financial-year-2024-to-2025/family-resources-survey-financial-year-2024-to-2025",
    published: "2026-03-26",
    method: "survey",
    notes: "Official statistics. Household food security measured with the US Department of Agriculture's ten-question module. Open Government Licence v3.0.",
  },
  "ff-tracker": {
    publisher: "The Food Foundation",
    title: "Food Insecurity Tracker, Round 19",
    url: "https://foodfoundation.org.uk/news/food-prices-tracker-july-2026",
    published: "2026-07-22",
    method: "survey",
    notes: "Online YouGov survey of UK adults, June 2026. Measures food insecurity in the past month, so it runs higher than the yearly official figure.",
  },
  "usda-ers": {
    publisher: "US Department of Agriculture, Economic Research Service",
    title: "International Food and Alcoholic Beverage Expenditure Data: percent of consumer expenditures spent on food, alcoholic beverages, and tobacco that were consumed at home, by selected countries, 2021–2025",
    url: "https://www.ers.usda.gov/data-products/international-food-and-alcoholic-beverage-expenditure-data",
    published: "2026-08-11",
    method: "reference",
    notes: "Food and non-alcoholic drinks bought to eat at home, as a share of all household consumer spending (shares calculated in local currency). Each country's latest year: 2025 for every country except Montenegro (2022). ERS calculated 2024 and 2025 from Oxford Economics data and earlier years from Euromonitor International. Excludes restaurants, alcohol and tobacco. US government work, public domain.",
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

// ---------- Country lookup (shared with the Air dashboard, so names match across the site) ----------
const air = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY_N3 = Object.fromEntries(air.map((r) => [r.iso_n3, { country: r.country, iso3: r.iso3, iso_n3: r.iso_n3 }]));
const n3 = (m49) => String(m49).replace(/^'/, "");

// ---------- FAOSTAT Food Security ----------
const FS = readCsv(path.join(RAW, "fs/Food_Security_Data_E_All_Data_(Normalized).csv")).filter((r) => r.Element === "Value");
const fsVal = (area, item, year) => FS.find((r) => r.Area === area && r["Item Code"] === item && r.Year === year)?.Value ?? "";
const fsByN3 = (item, year) => {
  const m = {};
  for (const r of FS) if (r["Item Code"] === item && r.Year === year) m[n3(r["Area Code (M49)"])] = r.Value;
  return m;
};
const PERIOD = "2023-2025", START = "2004-2006";
const pou = fsByN3("210041", PERIOD), pou0 = fsByN3("210041", START), nu = fsByN3("210011", PERIOD);
const fims = fsByN3("210091", PERIOD), fis = fsByN3("210401", PERIOD);
const stuntYear = "2024", stunt = fsByN3("21025", stuntYear);

// ---------- FAOSTAT healthy diet ----------
const CA = readCsv(path.join(RAW, "cahd/Cost_Affordability_Healthy_Diet_(CoAHD)_E_All_Data_(Normalized).csv"));
const caByN3 = (item, year) => {
  const m = {};
  for (const r of CA) if (r["Item Code"] === item && r.Year === year) m[n3(r["Area Code (M49)"])] = r.Value;
  return m;
};
const DIET_YEAR = "2025";
const cohd = caByN3("70040", DIET_YEAR), pua = caByN3("7005", DIET_YEAR), nua = caByN3("7006", DIET_YEAR);
const caVal = (area, item, year) => CA.find((r) => r.Area === area && r["Item Code"] === item && r.Year === year)?.Value ?? "";

// ---------- FAOSTAT food inflation: each country's latest month ----------
const CP = readCsv(path.join(RAW, "cpi/ConsumerPriceIndices_E_All_Data_(Normalized).csv")).filter((r) => r["Item Code"] === "23014" && r.Value !== "");
const infl = {};
for (const r of CP) {
  const mi = M.indexOf(r.Months);
  if (mi < 0) continue;
  const ym = `${r.Year}-${String(mi + 1).padStart(2, "0")}`;
  const k = n3(r["Area Code (M49)"]);
  if (!infl[k] || infl[k].month < ym) infl[k] = { month: ym, value: Number(r.Value) };
}

const INFL_CUTOFF = "2025-07";

// ---------- USDA ERS: one sheet per year (the year ends the title in row 1); each country's latest year ----------
// Country names match data/air/countries.json except these two.
const ERS_DIR = path.join(RAW, "ers_intl");
const ERS_ALIAS = { "Czech Republic": "CZE", "Côte d'Ivoire": "CIV" };
const ISO_BY_NAME = Object.fromEntries(air.map((r) => [r.country, r.iso3]));
const share = {};
for (const file of fs.readdirSync(path.join(ERS_DIR, "xl/worksheets")).filter((f) => /^sheet\d+\.xml$/.test(f))) {
  const rows = readSheet(ERS_DIR, file);
  const year = Number(String(rows[0]?.[0] ?? "").match(/countries, (\d{4})\d?\s*$/)?.[1]);
  if (!year || !/^Share of consumer expenditures on food/.test(rows[1]?.[1] ?? "") || rows[2]?.[1] !== "Percent") throw new Error(`Unexpected ERS sheet layout in ${file}`);
  for (const r of rows.slice(3)) {
    if (!r || typeof r[0] !== "string" || typeof r[1] !== "number") continue;
    const iso3 = ERS_ALIAS[r[0].trim()] ?? ISO_BY_NAME[r[0].trim()];
    if (!iso3) throw new Error(`ERS country not matched: ${r[0]}`);
    if (!share[iso3] || share[iso3].year < year) share[iso3] = { year, value: r[1] };
  }
}

// ---------- Bands ----------
const BANDS = [
  { map: "hunger", band: "Under 2.5%", min: 0, max: 2.5, unit: "% undernourished", source: "faostat-fs" },
  { map: "hunger", band: "2.5 to 10%", min: 2.5, max: 10, unit: "% undernourished", source: "faostat-fs" },
  { map: "hunger", band: "10 to 20%", min: 10, max: 20, unit: "% undernourished", source: "faostat-fs" },
  { map: "hunger", band: "20 to 35%", min: 20, max: 35, unit: "% undernourished", source: "faostat-fs" },
  { map: "hunger", band: "35% or more", min: 35, max: null, unit: "% undernourished", source: "faostat-fs" },
  { map: "diet", band: "Under 5%", min: 0, max: 5, unit: "% who can't afford a healthy diet", source: "faostat-cahd" },
  { map: "diet", band: "5 to 25%", min: 5, max: 25, unit: "% who can't afford a healthy diet", source: "faostat-cahd" },
  { map: "diet", band: "25 to 50%", min: 25, max: 50, unit: "% who can't afford a healthy diet", source: "faostat-cahd" },
  { map: "diet", band: "50 to 75%", min: 50, max: 75, unit: "% who can't afford a healthy diet", source: "faostat-cahd" },
  { map: "diet", band: "75% or more", min: 75, max: null, unit: "% who can't afford a healthy diet", source: "faostat-cahd" },
  { map: "inflation", band: "Falling (below 0%)", min: null, max: 0, unit: "% a year", source: "faostat-cp" },
  { map: "inflation", band: "0 to 3%", min: 0, max: 3, unit: "% a year", source: "faostat-cp" },
  { map: "inflation", band: "3 to 6%", min: 3, max: 6, unit: "% a year", source: "faostat-cp" },
  { map: "inflation", band: "6 to 15%", min: 6, max: 15, unit: "% a year", source: "faostat-cp" },
  { map: "inflation", band: "15% or more", min: 15, max: null, unit: "% a year", source: "faostat-cp" },
];
const bandOf = (map, v) => {
  if (v == null) return null;
  const b = BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max));
  return b?.band ?? null;
};

// ---------- Countries ----------
const lt = (s) => String(s).startsWith("<");
const countries = [];
for (const [k, c] of Object.entries(BY_N3)) {
  // Only readings from the last 12 months; a few countries' series stopped years ago.
  const pv = pou[k] ?? "", ca = num(cohd[k]), pu = num(pua[k]), inf = infl[k]?.month >= INFL_CUTOFF ? infl[k] : null, sh = share[c.iso3];
  if (!pv && ca == null && pu == null && !inf) continue;
  const pouV = lt(pv) ? null : num(pv);
  const row = {
    country: c.country, iso3: c.iso3, iso_n3: c.iso_n3,
    pou: pouV, pou_under: lt(pv) ? 2.5 : null, pou_period: pv ? PERIOD : null,
    pou_2005: lt(pou0[k] ?? "") ? null : num(pou0[k]), pou_2005_under: lt(pou0[k] ?? "") ? 2.5 : null,
    undernourished_m: num(nu[k]),
    hunger_band: pv ? (lt(pv) ? "Under 2.5%" : bandOf("hunger", pouV)) : null,
    food_insecure_pct: lt(fims[k] ?? "") ? null : num(fims[k]), severe_pct: lt(fis[k] ?? "") ? null : num(fis[k]),
    stunting_pct: num(stunt[k]), stunting_year: num(stunt[k]) != null ? +stuntYear : null,
    hunger_source: "faostat-fs",
    diet_cost: ca, cant_afford_pct: pu, cant_afford_m: num(nua[k]), diet_year: ca != null || pu != null ? +DIET_YEAR : null,
    diet_band: bandOf("diet", pu), diet_source: ca != null || pu != null ? "faostat-cahd" : null,
    food_inflation: inf ? r1(inf.value) : null, inflation_month: inf?.month ?? null,
    inflation_band: inf ? bandOf("inflation", inf.value) : null, inflation_source: inf ? "faostat-cp" : null,
    food_share: sh ? r1(sh.value) : null, food_share_year: sh?.year ?? null, food_share_source: sh ? "usda-ers" : null,
  };
  countries.push(row);
}
countries.sort((a, b) => (b.pou ?? 0) - (a.pou ?? 0) || a.country.localeCompare(b.country));

// ---------- World series ----------
const world = [];
for (let y = 2000; y <= 2025; y++) {
  const Y = String(y), f = (it) => num(fsVal("World", it, Y)), c = (it) => num(caVal("World", it, Y));
  world.push({
    year: y, undernourished_pct: f("210040"), undernourished_m: f("210010"),
    food_insecure_pct: f("210090"), food_insecure_m: f("210080"), severe_pct: f("210400"), severe_m: f("210070"),
    hunger_source: "faostat-fs",
    cant_afford_pct: c("7005"), cant_afford_m: c("7006"), diet_cost: c("70043"), diet_source: c("7005") != null ? "faostat-cahd" : null,
  });
}

// ---------- Regions and income groups ----------
const REG = [
  ["region", "Africa"], ["region", "Asia"], ["region", "Latin America and the Caribbean"], ["region", "Oceania"], ["region", "Northern America and Europe"],
  ["income", "Low-income economies"], ["income", "Lower-middle-income economies"], ["income", "Upper-middle-income economies"], ["income", "High-income economies"],
];
const regions = REG.map(([group, area]) => {
  const p = fsVal(area, "210040", "2025"), n = fsVal(area, "210010", "2025");
  return {
    group, region: area.replace(" economies", " countries"), year: 2025,
    undernourished_pct: lt(p) ? null : num(p), undernourished_under: lt(p) ? 2.5 : null, undernourished_m: lt(n) ? null : num(n),
    hunger_source: "faostat-fs",
    cant_afford_pct: num(caVal(area, "7005", "2025")), cant_afford_m: num(caVal(area, "7006", "2025")), diet_cost: num(caVal(area, "70043", "2025")),
    diet_source: "faostat-cahd",
  };
});

// ---------- FAO Food Price Index, monthly ----------
const ff = parseCsv(fs.readFileSync(path.join(RAW, "ffpi.csv"), "utf8"));
const prices = ff.filter((r) => /^\d{4}-\d{2}$/.test(r[0])).map((r) => ({
  month: r[0], food: num(r[1]), meat: num(r[2]), dairy: num(r[3]), cereals: num(r[4]), oils: r1(num(r[5])), sugar: num(r[6]), source: "fao-ffpi",
}));

// ---------- FAO Food Price Index, real, annual ----------
const fr = readSheet(path.join(RAW, "ffr"), "sheet1.xml");
const pricesReal = fr.filter((r) => r && typeof r[0] === "number" && r[0] > 1900).map((r) => ({ year: r[0], nominal: r1(r[1]), real: r1(r[2]), partial: r[0] === 2026 ? "January to October" : null, source: "fao-ffpi-real" }));

// ---------- World Bank Pink Sheet, monthly, 2019 on ----------
const ps = readSheet(path.join(RAW_ROOT, "cmo"), "sheet2.xml");
const hdr = ps[4].map((h) => (h ?? "").trim());
const col = (name) => { const i = hdr.findIndex((h) => h === name); if (i < 0) throw new Error("No Pink Sheet column " + name); return i; };
const PS = { urea: col("Urea"), dap: col("DAP"), potash: col("Potassium chloride **"), wheat: col("Wheat, US HRW"), maize: col("Maize"), rice: col("Rice, Thai 5%"), palm_oil: col("Palm oil"), soybean_oil: col("Soybean oil"), brent: col("Crude oil, Brent") };
const inputs = ps.filter((r) => r && /^\d{4}M\d{2}$/.test(r[0]) && r[0] >= "2019M01").map((r) => {
  const o = { month: r[0].replace("M", "-") };
  for (const [k, i] of Object.entries(PS)) o[k] = typeof r[i] === "number" ? r1(r[i]) : null;
  o.source = "wb-pinksheet";
  return o;
});

// ---------- ONS ----------
const ons = (id) => {
  const m = {};
  for (const r of parseCsv(fs.readFileSync(path.join(RAW, `ons_${id}.csv`), "utf8"))) {
    const mm = String(r[0]).match(/^(\d{4}) ([A-Z]{3})$/);
    if (mm) m[`${mm[1]}-${String(["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].indexOf(mm[2]) + 1).padStart(2, "0")}`] = Number(r[1]);
  }
  return m;
};
const food = ons("d7g8"), cpi = ons("d7g7"), idx = ons("d7bu");
const uk = Object.keys(food).filter((k) => k >= "2015-01").sort().map((k) => ({ month: k, food_rate: food[k], cpi_rate: cpi[k] ?? null, food_index: idx[k] ?? null, source: "ons-mm23" }));

// ---------- Headline findings quoted from reports ----------
const facts = [
  { id: "proj2030", label: "People projected to still face hunger in 2030", value: 520, unit: "million", note: "510 to 520 million; the goal was zero", source: "sofi2026" },
  { id: "stunted", label: "Children under five who are stunted (too short for their age)", value: 150, unit: "million", note: "", source: "sofi2026" },
  { id: "grfc", label: "People in high levels of acute food insecurity (IPC/CH Phase 3 or above), 2025", value: 266, unit: "million", note: "In 47 countries and territories; 22.9% of the people analysed", source: "grfc2026" },
  { id: "phase5", label: "People in Catastrophe (IPC/CH Phase 5), 2025", value: 1.4, unit: "million", note: "Haiti, Mali, the Gaza Strip, South Sudan, Sudan and Yemen", source: "grfc2026" },
  { id: "famine", label: "Places where famine was confirmed in 2025", value: 2, unit: "places", note: "Parts of the Gaza Strip and Sudan", source: "grfc2026" },
  { id: "wasted", label: "Children aged 6 to 59 months acutely malnourished in food-crisis countries, 2025", value: 35.5, unit: "million", note: "", source: "grfc2026" },
  { id: "top3", label: "Share of people in acute food insecurity living in DR Congo, Nigeria and Sudan, 2025", value: 33, unit: "%", note: "Nearly one-third", source: "grfc2026" },
  { id: "ureashare", label: "Share of global urea exports that pass through the Strait of Hormuz", value: 25, unit: "%", note: "Nearly one-quarter", source: "wb-fert-blog" },
  { id: "urea80", label: "Rise in the urea price from February to April 2026", value: 80, unit: "%", note: "Above $850 a tonne, the highest since April 2022", source: "wb-fert-blog" },
  { id: "delayed", label: "Fertiliser trade delayed each month by the Hormuz crisis", value: 3, unit: "million tonnes", note: "1.5 to 3 million tonnes a month", source: "fao-hormuz" },
  { id: "gulf", label: "Share of staple food that Gulf countries import", value: 90, unit: "%", note: "70 to 90%", source: "fao-hormuz" },
  { id: "ukfrs", label: "UK households with low or very low food security, 2024 to 2025", value: 9, unit: "%", note: "4% low and 5% very low; 1.4% used a food bank in the past 30 days", source: "dwp-frs" },
  { id: "ukff", label: "UK households experiencing food insecurity in the past month, June 2026", value: 12.2, unit: "%", note: "6.5 million adults and 2.2 million children", source: "ff-tracker" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Hunger, healthy diets and food inflation by country", `Undernourishment and food insecurity (FAO, ${PERIOD} averages), the cost and affordability of a healthy diet (FAO and World Bank, ${DIET_YEAR}), the latest year-on-year food price inflation (FAOSTAT) and food's share of household spending (USDA ERS).`, countries],
  ["world", "World hunger over time", "Undernourishment 2000 to 2025, food insecurity 2014 to 2025, and the cost and affordability of a healthy diet 2017 to 2025 (FAO, July 2026 release).", world],
  ["regions", "Hunger and healthy diets by region and income group", "Undernourishment and the affordability of a healthy diet in 2025, by continent group and World Bank income group (FAO).", regions],
  ["prices", "FAO Food Price Index, monthly", "The FAO Food Price Index and its five sub-indices, January 1990 to October 2026, 2014–2016 = 100.", prices],
  ["prices_real", "FAO Food Price Index in real terms, annual", "Annual nominal and real FAO Food Price Index, 1961 to 2026 (2026 is January to October).", pricesReal],
  ["inputs", "Fertiliser, grain and fuel prices, monthly", "World Bank Pink Sheet prices in nominal US dollars, January 2019 to October 2026.", inputs],
  ["uk", "UK food inflation, monthly", "UK 12-month inflation for food and non-alcoholic beverages and for all items, and the food price index, January 2015 to September 2026 (ONS).", uk],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from FAO's SOFI 2026, the Global Report on Food Crises 2026, the World Bank, FAO, DWP and the Food Foundation.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "food", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>food data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>food data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (FAOSTAT and the World Bank: CC BY 4.0; ONS and DWP: Open Government Licence v3.0; USDA ERS: US public domain).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.period = PERIOD;
DATA.diet_year = +DIET_YEAR;
fs.writeFileSync(path.join(REPO, "food/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const c = (f) => countries.filter(f).length;
console.log(`countries ${countries.length}: pou ${c((r) => r.pou != null || r.pou_under)}, diet ${c((r) => r.cant_afford_pct != null)}, inflation ${c((r) => r.food_inflation != null)}, share ${c((r) => r.food_share != null)}`);
const mo = {}; countries.forEach((r) => r.inflation_month && (mo[r.inflation_month] = (mo[r.inflation_month] ?? 0) + 1)); console.log("inflation months", mo);
const missing = Object.keys(pou).filter((k) => !BY_N3[k] && /^\d{3}$/.test(k) && +k < 900 && pou[k]);
console.log("FAOSTAT areas with PoU not matched to a country (aggregates expected):", missing.length);
console.log("world 2025", JSON.stringify(world.at(-1)));
console.log("prices last", JSON.stringify(prices.at(-1)), "real last", JSON.stringify(pricesReal.slice(-2)));
console.log("inputs last", JSON.stringify(inputs.at(-1)));
console.log("uk last", JSON.stringify(uk.at(-1)));
console.log("regions", JSON.stringify(regions.map((r) => [r.region, r.undernourished_pct, r.undernourished_m, r.cant_afford_pct])));
