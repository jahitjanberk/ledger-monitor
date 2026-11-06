// Builds data/minerals/* and minerals/assets/data.js for the Critical Minerals dashboard from
// scripts/.raw/minerals (USGS MCS 2026 tables parsed from the chapter PDFs, IEA chart data) and scripts/.raw/cmo (World Bank Pink Sheet).
//   node scripts/build/minerals.mjs        (raw downloads in scripts/.raw/minerals/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCsv, parseCsv } from "../lib/csv.mjs";
import { readSheet } from "../lib/xlsx.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "minerals");
const OUT = path.join(REPO, "data/minerals");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "minerals/assets"), { recursive: true });
const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const MOF = "https://www.mofcom.gov.cn";

const SOURCES = {
  "usgs-mcs": {
    publisher: "U.S. Geological Survey, National Minerals Information Center",
    title: "Mineral Commodity Summaries 2026",
    url: "https://doi.org/10.3133/mcs2026",
    published: "2026-02-06",
    method: "reference",
    notes: "World mine production by country for 2024 and estimated 2025, reserves, and annual prices, from each mineral's chapter (revised to version 1.3, 27 May 2026). Public domain. Prices quoted by USGS come from Benchmark Mineral Intelligence, S&P Global Platts and Argus.",
  },
  "iea-refined": {
    publisher: "International Energy Agency",
    title: "Share of refined material production by country, with the top producer's share, 2023 versus 2025 (Global Critical Minerals Outlook 2026)",
    url: "https://www.iea.org/data-and-statistics/charts/share-of-refined-material-production-by-country-with-the-top-producers-share-2023-versus-2025",
    published: "2026-07-16",
    method: "reference",
    notes: "IEA. Licence: CC BY 4.0. This is a work derived by Economy Monitor from IEA material; it is not endorsed by the IEA.",
  },
  "iea-top20": {
    publisher: "International Energy Agency",
    title: "Share of top refining country for 20 energy-related minerals (Global Critical Minerals Outlook 2025)",
    url: "https://www.iea.org/data-and-statistics/charts/share-of-top-refining-country-for-20-energy-related-minerals",
    published: "2025-05-21",
    method: "reference",
    notes: "Most recent year available for each mineral. IEA. Licence: CC BY 4.0. Derived work, not endorsed by the IEA.",
  },
  "iea-gcmo2026": {
    publisher: "International Energy Agency",
    title: "Global Critical Minerals Outlook 2026: executive summary",
    url: "https://www.iea.org/reports/global-critical-minerals-outlook-2026/executive-summary",
    published: "2026-07-16",
    method: "reference",
    notes: "IEA. Licence: CC BY 4.0.",
  },
  "iea-codes": {
    publisher: "International Energy Agency",
    title: "Number of tariff codes under export control from China, 2023–2025",
    url: "https://www.iea.org/data-and-statistics/charts/number-of-tariff-codes-under-export-control-from-china-2023-2025",
    published: "2026-07-16",
    method: "reference",
    notes: "IEA analysis based on Chinese customs data. Eight-digit tariff codes. IEA. Licence: CC BY 4.0.",
  },
  "wb-pinksheet": {
    publisher: "World Bank",
    title: "Commodity Price Data (The Pink Sheet), monthly prices",
    url: "https://www.worldbank.org/en/research/commodity-markets",
    published: "2026-11-03",
    method: "reference",
    notes: "London Metal Exchange prices in nominal US dollars a tonne. CC BY 4.0.",
  },
  "oecd-inventory": {
    publisher: "OECD",
    title: "OECD Inventory of Export Restrictions on Critical Raw Materials 2026",
    url: "https://doi.org/10.1787/d5ca8f62-en",
    published: "2026-04",
    method: "reference",
    notes: "Covers 2009–2024. CC BY 4.0.",
  },
  "mofcom-2023-23": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2023 No. 23: export controls on gallium and germanium items", url: `${MOF}/zcfb/dwmygl/art/2023/art_52b9a321087f402bb3d310d18b07967e.html`, published: "2023-07-03", method: "reference", notes: "In force from 1 August 2023. In Chinese." },
  "mofcom-2023-39": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2023 No. 39: export controls on graphite items", url: `${MOF}/zcfb/blgg/art/2023/art_f6b1bc49e2c8482f8eb749012bc66dec.html`, published: "2023-10-20", method: "reference", notes: "In force from 1 December 2023. In Chinese." },
  "mofcom-2024-33": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2024 No. 33: export controls on antimony and superhard materials", url: `${MOF}/zcfb/blgg/gg/2024/art/2024/art_6a472deaa37b46ccb04d4d8696fd8e75.html`, published: "2024-08-15", method: "reference", notes: "In force from 15 September 2024. In Chinese." },
  "mofcom-2024-46": { publisher: "Ministry of Commerce, China", title: "Announcement 2024 No. 46: dual-use exports to the United States", url: `${MOF}/zcfb/blgg/gg/2024/art/2024/art_1f22e2926a1d49b88d6b329549afcbdc.html`, published: "2024-12-03", method: "reference", notes: "Exports of gallium, germanium, antimony and superhard materials to the US in principle not licensed. In Chinese." },
  "mofcom-2025-18": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2025 No. 18: export controls on seven medium and heavy rare earths", url: `${MOF}/zcfb/blgg/gg/2025/art/2025/art_5e663d0bfec7452dabd950d0f0e42153.html`, published: "2025-04-04", method: "reference", notes: "Samarium, gadolinium, terbium, dysprosium, lutetium, scandium and yttrium. In Chinese." },
  "mofcom-2025-57": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2025 No. 57: export controls on five more rare earths", url: `${MOF}/zcfb/blgg/gg/2025/art/2025/art_9510f263c3c246d8936fbfa684a58ca8.html`, published: "2025-10-09", method: "reference", notes: "Part of a package that also covered battery materials (No. 58) and foreign-made goods containing 0.1% or more Chinese rare earths by value (No. 61). In Chinese." },
  "mofcom-2025-70": { publisher: "Ministry of Commerce and General Administration of Customs, China", title: "Announcement 2025 No. 70: suspension of the October 2025 export controls", url: `${MOF}/zwgk/zcfb/art/2025/art_b1ec77dd3f0d4762952904df7cdaadec.html`, published: "2025-11-07", method: "reference", notes: "Suspended until 10 November 2026. In Chinese." },
  "mofcom-2025-72": { publisher: "Ministry of Commerce, China", title: "Announcement 2025 No. 72: suspension of the ban on exports to the United States", url: `${MOF}/zwgk/zcfb/art/2025/art_5c68985a6b1a46778e2e8dbff1bb1601.html`, published: "2025-11-09", method: "reference", notes: "Suspended until 27 November 2026; the ban on military users stays. In Chinese." },
  "iea-pol-indonesia": { publisher: "International Energy Agency, Policies database", title: "Indonesia: ban on nickel ore exports", url: "https://www.iea.org/policies/16084", published: "2024-03-19", method: "reference", notes: "" },
  "iea-pol-drc": { publisher: "International Energy Agency, Policies database", title: "DR Congo: cobalt export suspension and quotas", url: "https://www.iea.org/policies/28969", published: "2026-05-28", method: "reference", notes: "" },
  "ec-crma": { publisher: "European Commission", title: "Critical Raw Materials Act", url: "https://single-market-economy.ec.europa.eu/sectors/raw-materials/areas-specific-interest/critical-raw-materials/critical-raw-materials-act_en", published: "2024", method: "reference", notes: "" },
  "uk-vision2035": { publisher: "Department for Business and Trade", title: "Vision 2035: Critical Minerals Strategy", url: "https://www.gov.uk/government/publications/uk-critical-minerals-strategy/vision-2035-critical-minerals-strategy", published: "2025-11-22", method: "reference", notes: "Open Government Licence v3.0." },
  "bgs-2024": { publisher: "British Geological Survey, UK Critical Minerals Intelligence Centre", title: "UK 2024 criticality assessment", url: "https://www.bgs.ac.uk/news/uk-2024-criticality-assessment/", published: "2024-11-28", method: "reference", notes: "" },
  "amnesty-2016": { publisher: "Amnesty International and Afrewatch", title: "\"This is what we die for\": human rights abuses in the Democratic Republic of the Congo power the global trade in cobalt", url: "https://www.amnesty.org/en/documents/afr62/3183/2016/en/", published: "2016-01", method: "reference", notes: "Cites a 2014 UNICEF estimate covering all mines in southern DR Congo." },
  "oecd-2019": { publisher: "OECD", title: "Interconnected supply chains: due diligence challenges and opportunities sourcing cobalt and copper from the DRC", url: "https://www.oecd.org/content/dam/oecd/en/publications/reports/2019/11/interconnected-supply-chains_cec91fc0/576804e7-en.pdf", published: "2019-11", method: "reference", notes: "" },
  "itu-ewaste": { publisher: "ITU and UNITAR", title: "Global E-waste Monitor 2024: press release", url: "https://www.itu.int/en/mediacentre/Pages/PR-2024-03-20-e-waste-recycling.aspx", published: "2024-03-20", method: "reference", notes: "" },
  "natural-earth": { publisher: "Natural Earth (via the world-atlas package)", title: "Admin 0 countries, 1:110m", url: "https://www.naturalearthdata.com/", published: "2026", method: "reference", notes: "Public domain. Used to match countries to map shapes." },
};

// ---------- USGS production ----------
const MINERALS = [
  ["lithium", "Lithium", "mine_production", "Batteries for electric cars, phones and grid storage"],
  ["cobalt", "Cobalt", "mine_production", "Battery cathodes and jet-engine alloys"],
  ["nickel", "Nickel", "mine_production", "Stainless steel and battery cathodes"],
  ["graphite", "Graphite", "mine_production", "Battery anodes and steelmaking"],
  ["copper", "Copper", "mine_production", "Power cables, motors and electronics"],
  ["rare-earths", "Rare earths", "mine_production", "Magnets for motors, wind turbines and electronics"],
  ["gallium", "Gallium", "primary_production_low_purity", "Chips, LEDs and radar"],
  ["manganese", "Manganese", "mine_production", "Steel and battery cathodes"],
  ["antimony", "Antimony", "mine_production", "Flame retardants, ammunition and solar glass"],
  ["tungsten", "Tungsten", "mine_production", "Cutting tools, hard alloys and armour"],
  ["platinum", "Platinum", "mine_production_platinum", "Catalytic converters, fuel cells and hydrogen"],
];
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const ALIAS = { "Congo (Kinshasa)": "COD", "Korea, North": "PRK", "Korea, Republic of": "KOR", Burma: "MMR", "Côte d’Ivoire": "CIV" };
const BYNAME = Object.fromEntries(AIR.map((r) => [r.country, r])), BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));
const look = (name) => (ALIAS[name] ? BY3[ALIAS[name]] : BYNAME[name]);
const U = readCsv(path.join(RAW, "usgs_mcs2026_world_production_reserves.csv"));
const num = (v) => (v === "" || v == null ? null : Number(v));

const production = [], minerals = [];
for (const [key, label, measure, use] of MINERALS) {
  const commodity = key === "platinum" ? "platinum-group" : key;
  const rows = U.filter((r) => r.commodity === commodity);
  const prod = (y) => rows.filter((r) => r.measure === measure && r.year === y);
  const world = (y) => num(prod(y).find((r) => r.country.startsWith("World"))?.value);
  const res = key === "platinum" || key === "gallium" ? [] : rows.filter((r) => r.measure === "reserves");
  const resWorld = num(res.find((r) => r.country.startsWith("World"))?.value);
  const unit = prod("2025")[0]?.unit ?? "";
  const w25 = world("2025"), w24 = world("2024");
  const cs = [];
  for (const r of prod("2025")) {
    if (/^(World|Other)/.test(r.country)) continue;
    const c = look(r.country);
    if (!c) throw new Error(`No country for ${r.country}`);
    const v24 = num(prod("2024").find((x) => x.country === r.country)?.value);
    const rv = num(res.find((x) => x.country === r.country)?.value);
    const row = {
      mineral: key, mineral_label: label, country: c.country, iso3: c.iso3, iso_n3: c.iso_n3,
      production_2024: v24, production_2025: num(r.value), withheld: r.value_raw === "W" ? true : null,
      share_2025: num(r.value) != null && w25 ? r1((100 * num(r.value)) / w25) : null,
      reserves: rv, reserves_share: rv != null && resWorld ? r1((100 * rv) / resWorld) : null, unit, source: "usgs-mcs",
    };
    cs.push(row);
    production.push(row);
  }
  const sorted = cs.filter((r) => r.share_2025 != null).sort((a, b) => b.share_2025 - a.share_2025);
  const china = cs.find((r) => r.iso3 === "CHN");
  const topRes = cs.filter((r) => r.reserves_share != null).sort((a, b) => b.reserves_share - a.reserves_share)[0];
  minerals.push({
    mineral: key, label, used_for: use, unit, world_2024: w24, world_2025: w25,
    top_country: sorted[0]?.country, top_iso3: sorted[0]?.iso3, top_share: sorted[0]?.share_2025,
    second_country: sorted[1]?.country, second_share: sorted[1]?.share_2025,
    top3_share: r1(sorted.slice(0, 3).reduce((s, r) => s + r.share_2025, 0)),
    china_mine_share: china?.share_2025 ?? null,
    top_reserves_country: topRes?.country ?? null, top_reserves_share: topRes?.reserves_share ?? null,
    world_excludes: key === "lithium" ? "United States (withheld)" : null, source: "usgs-mcs",
  });
}

// ---------- IEA refining ----------
const ref = parseCsv(fs.readFileSync(path.join(RAW, "iea/iea_gcmo2026_refined_share_by_country_2025.csv"), "utf8"));
const rh = ref[0];
const refining = [];
for (const r of ref.slice(1)) {
  if (!r[0]) continue;
  const key = r[0].toLowerCase().replace(" ", "-");
  for (let i = 1; i < rh.length - 1; i++) if (+r[i] > 0) refining.push({ mineral: key, mineral_label: r[0], country: rh[i], share_2025: +r[i], top_share_2023: +r.at(-1), source: "iea-refined" });
}
for (const m of minerals) {
  const rr = refining.filter((r) => r.mineral === m.mineral && r.country !== "Rest of world").sort((a, b) => b.share_2025 - a.share_2025);
  m.china_refined_share = refining.find((r) => r.mineral === m.mineral && r.country === "China")?.share_2025 ?? null;
  m.top_refiner = rr[0]?.country ?? null;
  m.top_refiner_share = rr[0]?.share_2025 ?? null;
  m.refining_source = rr.length ? "iea-refined" : null;
}
const t20 = parseCsv(fs.readFileSync(path.join(RAW, "iea/iea_gcmo2025_top_refiner_share_20_minerals.csv"), "utf8"));
const top20 = t20.slice(1).filter((r) => r[0]).map((r) => ({ mineral: r[0], country: +r[1] > 0 ? "China" : "Indonesia", share: +r[1] > 0 ? +r[1] : +r[2], source: "iea-top20" }));

// ---------- Prices ----------
const PR = readCsv(path.join(RAW, "usgs_mcs2026_prices_annual.csv"));
const PICK = { lithium: "Battery-grade", cobalt: "U.S. spot", nickel: "LME", copper: "LME grade A", "rare-earths": "NdPr", gallium: "Average unit value", germanium: "Germanium metal", graphite: "Flake", antimony: "Metal", tungsten: "Concentrate", manganese: "Ore", "platinum-group": "Platinum" };
const prices = Object.entries(PICK).map(([c, s]) => {
  const r = PR.find((x) => x.commodity === c && x.series.startsWith(s));
  const v = (y) => Number(r[y]);
  return {
    mineral: c === "platinum-group" ? "platinum" : c, label: c === "rare-earths" ? "Rare earths (NdPr oxide)" : c === "platinum-group" ? "Platinum" : c[0].toUpperCase() + c.slice(1),
    series: r.series.replace(/ \(label printed.*\)$/, ""), unit: r.unit, p2021: v("2021"), p2022: v("2022"), p2023: v("2023"), p2024: v("2024"), p2025: v("2025e"),
    change_2024_2025: r1((100 * (v("2025e") - v("2024"))) / v("2024")), estimate_2025: true, source: "usgs-mcs",
  };
});
const ps = readSheet(path.join(RAW_ROOT, "cmo"), "sheet2.xml");
const hdr = ps[4].map((h) => (h ?? "").trim());
const COL = { copper: hdr.indexOf("Copper"), nickel: hdr.indexOf("Nickel"), aluminium: hdr.indexOf("Aluminum"), tin: hdr.indexOf("Tin") };
const metals = ps.filter((r) => r && /^\d{4}M\d{2}$/.test(r[0]) && r[0] >= "2019M01").map((r) => {
  const o = { month: r[0].replace("M", "-") };
  for (const [k, i] of Object.entries(COL)) o[k] = typeof r[i] === "number" ? Math.round(r[i]) : null;
  o.source = "wb-pinksheet";
  return o;
});

// ---------- Export controls ----------
const controls = [
  { date: "2020-01-01", country: "Indonesia", mineral: "Nickel", measure: "All exports of nickel ore banned", status: "In force", source: "iea-pol-indonesia" },
  { date: "2023-08-01", country: "China", mineral: "Gallium, germanium", measure: "Exports need a licence", status: "In force", source: "mofcom-2023-23" },
  { date: "2023-12-01", country: "China", mineral: "Graphite", measure: "Exports of high-purity and flake graphite need a licence", status: "In force", source: "mofcom-2023-39" },
  { date: "2024-09-15", country: "China", mineral: "Antimony", measure: "Exports of antimony ores, metal and oxides need a licence", status: "In force", source: "mofcom-2024-33" },
  { date: "2024-12-03", country: "China", mineral: "Gallium, germanium, antimony", measure: "Exports to the United States in principle refused", status: "Suspended until 27 Nov 2026, except for military users", source: "mofcom-2024-46" },
  { date: "2025-02-22", country: "DR Congo", mineral: "Cobalt", measure: "Cobalt exports suspended", status: "Replaced by quotas from 16 Oct 2025: 96,600 tonnes a year in 2026 and 2027", source: "iea-pol-drc" },
  { date: "2025-04-04", country: "China", mineral: "Seven rare earths", measure: "Exports of samarium, gadolinium, terbium, dysprosium, lutetium, scandium and yttrium need a licence", status: "In force", source: "mofcom-2025-18" },
  { date: "2025-10-09", country: "China", mineral: "Five more rare earths, battery materials", measure: "Controls on more rare earths and battery materials, and on foreign-made goods with 0.1% or more Chinese rare earths by value", status: "Suspended until 10 Nov 2026", source: "mofcom-2025-57" },
];
const codes = [["2023-09", 20], ["2024-09", 25], ["2025-02", 43], ["2025-04", 68]].map(([month, n]) => ({ month, tariff_codes: n, source: "iea-codes" }));

// ---------- Facts ----------
const facts = [
  { id: "drc", label: "DR Congo's share of world mined cobalt, 2025", value: 73, unit: "%", note: "Indonesia 14%", source: "usgs-mcs" },
  { id: "gallium", label: "China's share of primary low-purity gallium production, 2025", value: 99, unit: "%", note: "", source: "usgs-mcs" },
  { id: "batteries", label: "Share of lithium used in batteries", value: 88, unit: "%", note: "Estimated global end use, 2025", source: "usgs-mcs" },
  { id: "lithiumprice", label: "US lithium carbonate contract price, 2025 average", value: 9000, unit: "US dollars a tonne", note: "Down 31% on 2024; $63,700 in 2022", source: "usgs-mcs" },
  { id: "top72", label: "Average share of the top refining country, excluding rare earths, 2025", value: 72, unit: "%", note: "Up from 70% in 2023", source: "iea-gcmo2026" },
  { id: "risk", label: "Downstream production outside China at risk a year if rare earth export controls were fully implemented", value: 6.5, unit: "trillion US dollars", note: "", source: "iea-gcmo2026" },
  { id: "graphiterisk", label: "Downstream production outside China at risk a year if battery-grade graphite trade were fully disrupted", value: 300, unit: "billion US dollars", note: "Over $300 billion", source: "iea-gcmo2026" },
  { id: "tripled", label: "Growth in the number of mineral tariff codes under Chinese export controls since 2023", value: 3, unit: "times", note: "Tripled", source: "iea-gcmo2026" },
  { id: "costev", label: "Critical minerals' share of the price of an average electric vehicle", value: 3, unit: "%", note: "Around a quarter of battery cell costs", source: "iea-gcmo2026" },
  { id: "cobaltprice", label: "Rise in cobalt prices, January 2025 to April 2026", value: 130, unit: "%", note: "Largely due to DR Congo's export restrictions", source: "iea-gcmo2026" },
  { id: "tungsten6", label: "Rise in tungsten prices, January 2025 to April 2026", value: 6, unit: "times", note: "Sixfold", source: "iea-gcmo2026" },
  { id: "europe5", label: "European prices for gallium, dysprosium and terbium against Chinese domestic prices", value: 5, unit: "times", note: "Germanium almost three times", source: "iea-gcmo2026" },
  { id: "copper90", label: "China's share of growth in global copper smelting since 2005", value: 90, unit: "%", note: "Over 90%; its share of capacity rose from about 15% to 50% by 2025", source: "iea-gcmo2026" },
  { id: "fivefold", label: "Increase in export restrictions on critical raw materials since 2009", value: 5, unit: "times", note: "Fivefold", source: "oecd-inventory" },
  { id: "restricted", label: "Share of global cobalt and manganese exports subject to at least one export restriction, 2022–2024", value: 70, unit: "%", note: "Graphite 47%, rare earths 45%, tin 41%", source: "oecd-inventory" },
  { id: "ukimports", label: "Share of UK critical raw material imports facing at least one export restriction, 2022–2024", value: 22.7, unit: "%", note: "World 16%", source: "oecd-inventory" },
  { id: "children", label: "Children working in all mines across southern DR Congo, 2014 UNICEF estimate", value: 40000, unit: "children", note: "Many in cobalt mining; cited by Amnesty International in 2016", source: "amnesty-2016" },
  { id: "artisanal", label: "Share of DR Congo's cobalt dug by hand by artisanal miners", value: 30, unit: "%", note: "18 to 30%", source: "oecd-2019" },
  { id: "ewaste", label: "Share of e-waste documented as properly collected and recycled, 2022", value: 22.3, unit: "%", note: "62 billion kg of e-waste in 2022", source: "itu-ewaste" },
  { id: "ree1", label: "Share of rare earth demand met by e-waste recycling", value: 1, unit: "%", note: "", source: "itu-ewaste" },
  { id: "eu", label: "EU 2030 benchmarks for strategic raw materials", value: 65, unit: "%", note: "At least 10% of consumption from EU extraction, 40% processing, 25% recycling; no more than 65% from one third country", source: "ec-crma" },
  { id: "uk60", label: "UK 2035 targets for critical minerals", value: 60, unit: "%", note: "At least 10% of demand from domestic production and 20% from recycling; no more than 60% from any one country, in aggregate", source: "uk-vision2035" },
  { id: "bgs", label: "Minerals assessed as critical for the UK, out of 82 candidates", value: 34, unit: "minerals", note: "Niobium, cobalt and rare earths rank highest", source: "bgs-2024" },
];

const BANDS = [
  { band: "Under 1%", min: 0, max: 1, unit: "% of world mine production", source: "usgs-mcs" },
  { band: "1 to 5%", min: 1, max: 5, unit: "% of world mine production", source: "usgs-mcs" },
  { band: "5 to 15%", min: 5, max: 15, unit: "% of world mine production", source: "usgs-mcs" },
  { band: "15 to 40%", min: 15, max: 40, unit: "% of world mine production", source: "usgs-mcs" },
  { band: "40% or more", min: 40, max: null, unit: "% of world mine production", source: "usgs-mcs" },
];

const TABLES = [
  ["minerals", "Concentration by mineral", "For eleven minerals: world mine production in 2024 and 2025 (USGS), the leading producers and their shares, the leading reserve holder, and China's and the top country's share of refining in 2025 (IEA).", minerals],
  ["production", "Mine production by country", "Mine production by country, 2024 and estimated 2025, share of the world total, and reserves (USGS Mineral Commodity Summaries 2026).", production],
  ["refining", "Refining by country, 2025", "Share of refined output by country for seven minerals in 2025, and the top producer's share in 2023 (IEA Global Critical Minerals Outlook 2026).", refining],
  ["top_refiner", "Top refining country for 20 minerals", "Share held by the leading refining country, most recent year (IEA Global Critical Minerals Outlook 2025).", top20],
  ["prices", "Mineral prices, 2021 to 2025", "Annual average prices quoted by USGS, with the change from 2024 to 2025 (2025 estimated).", prices],
  ["metals", "Base metal prices, monthly", "Copper, nickel, aluminium and tin, US dollars a tonne, January 2019 to October 2026 (World Bank Pink Sheet).", metals],
  ["controls", "Export controls", "Export bans, licences and quotas on critical minerals since 2020, with status as of 6 November 2026.", controls],
  ["tariff_codes", "Chinese tariff codes under export control", "Number of eight-digit mineral tariff codes under Chinese export control (IEA).", codes],
  ["bands", "Map classes", "Bands used to colour the map.", BANDS],
  ["facts", "Headline findings", "Published figures from USGS, the IEA, the OECD, Amnesty International, ITU, the European Commission, the UK government and the BGS.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "minerals", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>minerals data · Economy Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>minerals data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Economy Monitor" and the original publishers, whose own terms also apply (USGS: public domain; IEA, World Bank and OECD: CC BY 4.0). The refining tables are a work derived by Economy Monitor from IEA material; they are not endorsed by the IEA.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Economy Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "minerals/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

for (const m of minerals) console.log(m.label.padEnd(12), "world25", m.world_2025, "top", m.top_country, m.top_share, "2nd", m.second_country, m.second_share, "chinaMine", m.china_mine_share, "chinaRef", m.china_refined_share, "topRef", m.top_refiner, m.top_refiner_share, "res", m.top_reserves_country, m.top_reserves_share);
console.log("prices", prices.map((p) => `${p.label} ${p.change_2024_2025}`).join(", "));
console.log("metals last", JSON.stringify(metals.at(-1)), "first", JSON.stringify(metals[0]));
console.log("top20", top20.length, "countries in production", new Set(production.map((r) => r.iso3)).size);
