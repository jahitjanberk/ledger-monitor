// Builds data/remittances/* and remittances/assets/data.js for The Cost of Sending Money Home dashboard
// from the raw downloads in scripts/.raw/remittances (World Bank Remittance Prices Worldwide complete dataset,
// an .xlsx file, unzipped; UN SDG Global Database API JSON for indicator 10.c.1; World Bank WDI API JSON).
//   node scripts/build/remittances.mjs        (raw downloads in scripts/.raw/remittances/, or set RAW to their parent folder)
// See scripts/build/README.md for the files this builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "remittances");
const OUT = path.join(REPO, "data/remittances");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "remittances/assets"), { recursive: true });

const r2 = (v, d = 2) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const YEAR = 2025, PERIOD = "2025_3Q", BASE_PERIOD = "2016_3Q";

const SOURCES = {
  rpw: {
    publisher: "World Bank",
    title: "Remittance Prices Worldwide, complete dataset, Q1 2011 to Q3 2025 (rpw_dataset_2011_2025_q3.xlsx)",
    url: "https://datacatalog.worldbank.org/search/dataset/0037898/remittance-prices-worldwide",
    published: "2026-09-23",
    method: "derived",
    notes: "Every service surveyed, with its fee, exchange-rate margin and total cost of sending the equivalent of $200, by sending country, receiving country, provider type and payment method. Averages by provider type, payment method and access point, the fee and exchange-rate split, and the cheapest service in each corridor are calculated here as simple averages over services, as RPW does; a service listed under two provider types (for example 'Bank / Money Transfer Operator') counts in both. Q2 2025 was not collected, and the dataset has no services sent from Russia after Q4 2021 (RPW reports those corridors separately). The underlying price data are collected by FXC Intelligence. The World Bank Data Catalog lists the dataset under CC BY 4.0; the file's own Terms of Use sheet also points to World Bank 'Restricted Data' terms whose links no longer resolve.",
  },
  "rpw-report": {
    publisher: "World Bank",
    title: "Remittance Prices Worldwide, Issue 54, September 2025 (quarterly report and annex, Q3 2025)",
    url: "https://datacatalogfiles.worldbank.org/ddh-published/0037898/DR0095413/RPW_main_report_and_annex_Q325.pdf",
    published: "2025-09",
    method: "reference",
    notes: "Headline findings quoted as published: global average, digital and non-digital averages, SmaRT average, weighted average, MTO indices, cost by provider type, share of corridors by cost band, G8 and G20 figures. The PDF was re-posted on the Data Catalog on 17 April 2026.",
  },
  "sdg-10c1": {
    publisher: "UN Statistics Division, from World Bank Remittance Prices Worldwide",
    title: "SDG Global Database, indicator 10.c.1: remittance costs as a proportion of the amount remitted (series SI_RMT_COST, SI_RMT_COST_SND, SI_RMT_COST_BC, SI_RMT_COST_SC; release 2026.Q3.G.01)",
    url: "https://unstats.un.org/sdgs/dataportal/database",
    published: "2026",
    method: "reference",
    notes: "Average total cost of sending $200, % of the amount sent, in the third quarter of each year: to each receiving country and to SDG regions and the world (2011, 2015, 2017 to 2025), from each sending country (2011 to 2025), and in each corridor, as a simple average and as the SmaRT average of the three cheapest qualifying services (2016 to 2025). Downloaded from the UN SDG API on 6 November 2026. The corridor series includes nine corridors from Russia for 2024 and 2025, which RPW reports separately from its main analysis; they are not used here.",
  },
  "sdg-target": {
    publisher: "United Nations",
    title: "Sustainable Development Goal target 10.c",
    url: "https://unstats.un.org/sdgs/metadata/?Text=&Goal=10&Target=10.c",
    published: "2015",
    method: "reference",
    notes: "Text of the target as given by the UN SDG API: 'By 2030, reduce to less than 3 per cent the transaction costs of migrant remittances and eliminate remittance corridors with costs higher than 5 per cent'.",
  },
  "wdi-flows": {
    publisher: "World Bank, from IMF balance of payments data and World Bank staff estimates",
    title: "World Development Indicators: personal remittances received (BX.TRF.PWKR.CD.DT, BX.TRF.PWKR.DT.GD.ZS) and paid (BM.TRF.PWKR.CD.DT)",
    url: "https://data.worldbank.org/indicator/BX.TRF.PWKR.CD.DT",
    published: "2026-10-08",
    method: "reference",
    notes: "Personal transfers plus compensation of employees, current US dollars and % of GDP, 2000 to 2025, by country and for the world and low- and middle-income countries. Recorded flows only: money sent through informal channels is not counted. The latest year is partly estimated. CC BY 4.0.",
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

// ---------- Country lookups ----------
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));
const BYN3 = Object.fromEntries(AIR.map((r) => [String(+r.iso_n3), r]));
const WBC = JSON.parse(fs.readFileSync(path.join(RAW, "wb_countries.json"), "utf8"))[1].filter((c) => c.region.value !== "Aggregates");
const WB3 = Object.fromEntries(WBC.map((c) => [c.id, c]));
const ISO2 = Object.fromEntries(WBC.map((c) => [c.iso2Code, c.id]));
ISO2.XK = "XKX";
const nameOf = (k) => BY3[k]?.country ?? WB3[k]?.name ?? k;

// ---------- WDI ----------
const wdi = (id) => JSON.parse(fs.readFileSync(path.join(RAW, `wb_${id}.json`), "utf8"))[1];
const series = (id) => {
  const m = {};
  for (const r of wdi(id)) if (r.value != null) (m[r.countryiso3code] ??= {})[+r.date] = r.value;
  return m;
};
const RX = series("BX.TRF.PWKR.CD.DT"), RXG = series("BX.TRF.PWKR.DT.GD.ZS"), PX = series("BM.TRF.PWKR.CD.DT");
const latest = (m, k, from = YEAR - 4) => { const s = m[k]; if (!s) return null; for (let y = YEAR; y >= from; y--) if (s[y] != null) return { y, v: s[y] }; return null; };

// ---------- SDG 10.c.1 ----------
const sdg = (s) => JSON.parse(fs.readFileSync(path.join(RAW, `sdg_${s}.json`), "utf8")).data.filter((r) => r.value !== "NaN" && r.value != null && isFinite(+r.value));
const RCV = {}, SND = {}, BC = {}, SC = {};
for (const r of sdg("SI_RMT_COST")) (RCV[r.geoAreaCode] ??= {})[r.timePeriodStart] = +r.value;
for (const r of sdg("SI_RMT_COST_SND")) (SND[r.geoAreaCode] ??= {})[r.timePeriodStart] = +r.value;
const n3to3 = (n) => BYN3[String(+n)]?.iso3 ?? null;
for (const [s, M] of [["SI_RMT_COST_BC", BC], ["SI_RMT_COST_SC", SC]]) {
  for (const r of sdg(s)) {
    const a = n3to3(r.geoAreaCode), b = ISO2[r.dimensions.Counterpart];
    if (!a || !b) continue;
    (M[a + b] ??= {})[r.timePeriodStart] = +r.value;
  }
}

// ---------- RPW dataset (streamed: the sheet is about 300 MB) ----------
const un = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const RPWDIR = path.join(RAW, "rpw_dataset");
const SS = [...fs.readFileSync(path.join(RPWDIR, "xl/sharedStrings.xml"), "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => un([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));
const numv = (v) => (typeof v === "number" ? v : typeof v === "string" && /^-?\d*\.?\d+(e-?\d+)?$/i.test(v.trim()) ? +v : null);
const parseRow = (r) => {
  const row = [];
  for (const c of r.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const col = c[1].split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    const t = /t="([^"]+)"/.exec(c[2])?.[1], v = /<v>([\s\S]*?)<\/v>/.exec(c[3] ?? "")?.[1];
    row[col] = v == null ? null : t === "s" ? SS[+v] : t === "str" ? un(v) : +v;
  }
  return row;
};
async function stream(file, onRow) {
  let buf = "", hdr = null;
  for await (const d of fs.createReadStream(path.join(RPWDIR, "xl/worksheets", file), { encoding: "utf8", highWaterMark: 1 << 22 })) {
    buf += d;
    let i;
    while ((i = buf.indexOf("</row>")) >= 0) {
      const row = parseRow(buf.slice(buf.lastIndexOf("<row ", i), i));
      buf = buf.slice(i + 6);
      if (!hdr) { hdr = {}; row.forEach((h, k) => { if (h != null) hdr[h] = k; }); continue; }
      onRow(row, hdr);
    }
  }
}
const TYPES = { bank: "Banks", "money transfer operator": "Money transfer operators", "post office": "Post offices", "mobile operator": "Mobile operators" };
const acc = () => ({ n: 0, cost: 0, nf: 0, fx: 0 });
const put = (a, cost, fx) => { a.n++; a.cost += cost; if (fx != null) { a.nf++; a.fx += fx; } };
const Q = {}, BRK = {}, COR = {};
await stream("sheet6.xml", (r, H) => {
  const p = r[H.period], cost = numv(r[H["cc1 total cost %"]]);
  if (cost == null) return;
  const fx = numv(r[H["cc1 fx margin"]]);
  const q = (Q[p] ??= { all: acc(), uk: acc(), t: {} });
  put(q.all, cost, fx);
  if (r[H.source_code] === "GBR") put(q.uk, cost, fx);
  const types = [...new Set(String(r[H.firm_type] ?? "").split("/").map((x) => x.trim().toLowerCase()))].filter((x) => TYPES[x]);
  for (const t of types) put((q.t[t] ??= acc()), cost, fx);
  if (p === PERIOD || p === BASE_PERIOD) {
    const k = r[H.corridor] ?? r[H.source_code] + r[H.destination_code];
    const c = (COR[k] ??= { src: r[H.source_code], dst: r[H.destination_code], dregion: r[H.destination_region], p: {} });
    const cp = (c.p[p] ??= { all: acc(), min: Infinity, t: {} });
    put(cp.all, cost, fx);
    cp.min = Math.min(cp.min, cost);
    for (const t of types) put((cp.t[t] ??= acc()), cost, fx);
  }
  if (p === PERIOD) {
    const b = (k, v) => put(((BRK[k] ??= {})[v] ??= acc()), cost, fx);
    for (const t of types) b("Provider type", TYPES[t]);
    for (const v of String(r[H["payment instrument"]] ?? "").split(",").map((x) => x.trim()).filter(Boolean)) b("Paying for the transfer", v);
    for (const v of String(r[H["access point"]] ?? "").split(",").map((x) => x.trim()).filter(Boolean)) b("Where the sender pays", v);
  }
});
const avg = (a) => (a && a.n ? r2(a.cost / a.n) : null);
const fxAvg = (a) => (a && a.nf ? r2(a.fx / a.nf) : null);

// ---------- Quarterly averages ----------
const quarterly = Object.keys(Q).sort().map((p) => {
  const [y, qq] = p.split("_"), q = Q[p];
  return {
    period: `${y} Q${qq[0]}`, year: +y, quarter: +qq[0], services: q.all.n,
    global: avg(q.all), fee: r2(avg(q.all) - fxAvg(q.all)), fx_margin: fxAvg(q.all),
    banks: avg(q.t.bank), mtos: avg(q.t["money transfer operator"]), post_offices: avg(q.t["post office"]), mobile: avg(q.t["mobile operator"]),
    mobile_services: q.t["mobile operator"]?.n ?? 0, post_services: q.t["post office"]?.n ?? 0,
    uk_send: avg(q.uk), uk_services: q.uk.n, source: "rpw",
  };
});

// ---------- Breakdown, Q3 2025 ----------
const ACC_LABEL = { "Call Center": "Call centre" };
const breakdown = [];
for (const [dim, m] of Object.entries(BRK)) {
  for (const [cat, a] of Object.entries(m)) {
    if (a.n < 20) continue;
    breakdown.push({ dimension: dim, category: ACC_LABEL[cat] ?? cat, period: "2025 Q3", services: a.n, cost: avg(a), fee: r2(avg(a) - fxAvg(a)), fx_margin: fxAvg(a), source: "rpw" });
  }
}
// Cards are reported together by RPW
const cards = ["Credit card", "Debit card"].map((c) => BRK["Paying for the transfer"][c]).filter(Boolean);
if (cards.length === 2) {
  const a = cards.reduce((s, x) => ({ n: s.n + x.n, cost: s.cost + x.cost, nf: s.nf + x.nf, fx: s.fx + x.fx }), acc());
  breakdown.push({ dimension: "Paying for the transfer", category: "Credit or debit card", period: "2025 Q3", services: a.n, cost: avg(a), fee: r2(avg(a) - fxAvg(a)), fx_margin: fxAvg(a), source: "rpw" });
}
breakdown.sort((a, b) => a.dimension.localeCompare(b.dimension) || b.cost - a.cost);

// ---------- Corridors, Q3 2025 ----------
const corridors = [];
for (const [k, c] of Object.entries(COR)) {
  const now = c.p[PERIOD];
  if (!now) continue;
  const base = c.p[BASE_PERIOD];
  const key = c.src + c.dst;
  corridors.push({
    corridor: key, from: nameOf(c.src), from_iso3: c.src, to: nameOf(c.dst), to_iso3: c.dst, to_region: c.dregion,
    cost: BC[key]?.[YEAR] ?? avg(now.all), cost_2016: BC[key]?.[2016] ?? (base ? avg(base.all) : null),
    smart: SC[key]?.[YEAR] ?? null,
    fee: r2(avg(now.all) - fxAvg(now.all)), fx_margin: fxAvg(now.all), services: now.all.n, cheapest: r2(now.min),
    bank_cost: avg(now.t.bank), mto_cost: avg(now.t["money transfer operator"]),
    cost_source: BC[key]?.[YEAR] != null ? "sdg-10c1" : "rpw", source: "rpw",
  });
}
corridors.sort((a, b) => a.from.localeCompare(b.from) || a.cost - b.cost);

// ---------- Bands ----------
const BANDS = [
  { map: "gdp", band: "Under 1%", min: null, max: 1, unit: "personal remittances received, % of GDP", source: "wdi-flows" },
  { map: "gdp", band: "1 to 3%", min: 1, max: 3, unit: "personal remittances received, % of GDP", source: "wdi-flows" },
  { map: "gdp", band: "3 to 10%", min: 3, max: 10, unit: "personal remittances received, % of GDP", source: "wdi-flows" },
  { map: "gdp", band: "10 to 20%", min: 10, max: 20, unit: "personal remittances received, % of GDP", source: "wdi-flows" },
  { map: "gdp", band: "20% or more", min: 20, max: null, unit: "personal remittances received, % of GDP", source: "wdi-flows" },
  { map: "cost", band: "Under 3%", min: null, max: 3, unit: "average cost of receiving $200, % of the amount sent", source: "sdg-10c1" },
  { map: "cost", band: "3 to 5%", min: 3, max: 5, unit: "average cost of receiving $200, % of the amount sent", source: "sdg-10c1" },
  { map: "cost", band: "5 to 7%", min: 5, max: 7, unit: "average cost of receiving $200, % of the amount sent", source: "sdg-10c1" },
  { map: "cost", band: "7 to 10%", min: 7, max: 10, unit: "average cost of receiving $200, % of the amount sent", source: "sdg-10c1" },
  { map: "cost", band: "10% or more", min: 10, max: null, unit: "average cost of receiving $200, % of the amount sent", source: "sdg-10c1" },
  { map: "usd", band: "Under $100m", min: null, max: 100, unit: "personal remittances received, US$ million", source: "wdi-flows" },
  { map: "usd", band: "$100m to $1bn", min: 100, max: 1000, unit: "personal remittances received, US$ million", source: "wdi-flows" },
  { map: "usd", band: "$1bn to $10bn", min: 1000, max: 10000, unit: "personal remittances received, US$ million", source: "wdi-flows" },
  { map: "usd", band: "$10bn to $50bn", min: 10000, max: 50000, unit: "personal remittances received, US$ million", source: "wdi-flows" },
  { map: "usd", band: "$50bn or more", min: 50000, max: null, unit: "personal remittances received, US$ million", source: "wdi-flows" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

// ---------- Countries ----------
const countries = [], unmatched = [];
for (const c of WBC) {
  const k = c.id, a = BY3[k];
  const rx = latest(RX, k), rxg = latest(RXG, k), px = latest(PX, k);
  const n3 = a ? String(+a.iso_n3) : null;
  const rc = n3 && RCV[n3] ? RCV[n3] : null, sd = n3 && SND[n3] ? SND[n3] : null;
  const costR = rc?.[YEAR] ?? null, costS = sd?.[YEAR] ?? null;
  if (!rx && !rxg && !px && costR == null && costS == null) continue;
  if (!a) { unmatched.push(k); continue; }
  const inC = corridors.filter((x) => x.to_iso3 === k), outC = corridors.filter((x) => x.from_iso3 === k);
  countries.push({
    country: a.country, iso3: k, iso_n3: a.iso_n3, region: c.region.value, income: c.incomeLevel.value,
    received_usd_m: rx ? r2(rx.v / 1e6, 1) : null, received_year: rx?.y ?? null,
    received_gdp_pct: rxg ? r2(rxg.v, 2) : null, received_gdp_year: rxg?.y ?? null,
    paid_usd_m: px ? r2(px.v / 1e6, 1) : null, paid_year: px?.y ?? null, flows_source: rx || rxg || px ? "wdi-flows" : null,
    cost_receive: costR, cost_receive_2017: rc?.[2017] ?? null, cost_send: costS, cost_send_2017: sd?.[2017] ?? null,
    corridors_in: inC.length, corridors_out: outC.length,
    cheapest_in: inC.length ? Math.min(...inC.map((x) => x.cost)) : null,
    cost_source: costR != null || costS != null ? "sdg-10c1" : null,
    gdp_band: bandOf("gdp", rxg?.v ?? null), cost_band: bandOf("cost", costR), usd_band: bandOf("usd", rx ? rx.v / 1e6 : null),
  });
}
countries.sort((a, b) => (b.received_usd_m ?? -1) - (a.received_usd_m ?? -1));

// ---------- World over time ----------
const world = [];
for (let y = 2000; y <= YEAR; y++) {
  world.push({
    year: y,
    received_world_bn: r2(RX.WLD?.[y] / 1e9, 1), received_lmic_bn: r2(RX.LMY?.[y] / 1e9, 1), paid_world_bn: r2(PX.WLD?.[y] / 1e9, 1),
    received_world_gdp_pct: r2(RXG.WLD?.[y], 2), received_lmic_gdp_pct: r2(RXG.LMY?.[y], 2), flows_source: "wdi-flows",
    cost_global: RCV["1"]?.[y] ?? null, cost_source: RCV["1"]?.[y] != null ? "sdg-10c1" : null,
  });
}

// ---------- SDG regions over time ----------
const REG = [["202", "Sub-Saharan Africa"], ["419", "Latin America and the Caribbean"], ["62", "Central and Southern Asia"], ["753", "Eastern and South-Eastern Asia"], ["747", "Northern Africa and Western Asia"], ["543", "Oceania (excluding Australia and New Zealand)"], ["513", "Europe and Northern America"], ["1", "World"]];
const regions = [];
for (const [code, name] of REG) for (const [y, v] of Object.entries(RCV[code] ?? {})) regions.push({ code, region: name, year: +y, cost: v, source: "sdg-10c1" });

// ---------- UK ----------
const uk_flows = [];
for (let y = 2000; y <= YEAR; y++) uk_flows.push({ year: y, paid_usd_m: r2(PX.GBR?.[y] / 1e6, 1), received_usd_m: r2(RX.GBR?.[y] / 1e6, 1), source: "wdi-flows" });
const uk_cost = Object.entries(SND["826"] ?? {}).map(([y, v]) => ({ year: +y, uk_send: v, global: RCV["1"]?.[y] ?? null, source: "sdg-10c1" })).sort((a, b) => a.year - b.year);

// ---------- Headline findings ----------
const facts = [
  { id: "target", label: "SDG target 10.c: by 2030, reduce remittance costs to less than 3% of the amount sent and eliminate corridors costing more than 5%", value: 3, unit: "%", note: "5% for every corridor", source: "sdg-target" },
  { id: "global", label: "Global average cost of sending $200, Q3 2025", value: 6.36, unit: "%", note: "Down from 6.49% in Q1 2025 and 9.67% in Q1 2009", source: "rpw-report" },
  { id: "global2009", label: "Global average cost of sending $200, Q1 2009", value: 9.67, unit: "%", note: "", source: "rpw-report" },
  { id: "digital", label: "Global average cost of digital remittances, Q3 2025", value: 4.59, unit: "%", note: "Non-digital remittances: 7.30%. Digital services were 35% of those surveyed", source: "rpw-report" },
  { id: "nondigital", label: "Global average cost of non-digital remittances, Q3 2025", value: 7.30, unit: "%", note: "", source: "rpw-report" },
  { id: "digitalshare", label: "Share of surveyed services that are digital, Q3 2025", value: 35, unit: "%", note: "", source: "rpw-report" },
  { id: "smart", label: "Global SmaRT average (three cheapest qualifying services in each corridor), Q3 2025", value: 3.29, unit: "%", note: "Unchanged from Q1 2025", source: "rpw-report" },
  { id: "weighted", label: "Global weighted average cost, weighted by estimated flows in each corridor, Q3 2025", value: 5.04, unit: "%", note: "", source: "rpw-report" },
  { id: "mtoindex", label: "International MTO Index (MTOs in more than 85% of corridors), Q3 2025", value: 5.52, unit: "%", note: "Digital-only MTO Index: 3.54%", source: "rpw-report" },
  { id: "digitalmto", label: "Digital-only MTO Index, Q3 2025", value: 3.54, unit: "%", note: "", source: "rpw-report" },
  { id: "banks", label: "Average cost of sending $200 through a bank, Q3 2025", value: 14.99, unit: "%", note: "Banks remain the costliest type of provider", source: "rpw-report" },
  { id: "mtos", label: "Average cost of sending $200 through a money transfer operator, Q3 2025", value: 4.72, unit: "%", note: "", source: "rpw-report" },
  { id: "under10", label: "Share of corridors with an average cost below 10%, Q3 2025", value: 83, unit: "%", note: "53% in Q1 2009", source: "rpw-report" },
  { id: "smart5", label: "Share of corridors whose SmaRT average is below 5%, Q3 2025", value: 78, unit: "%", note: "Excluding nine corridors from Russia", source: "rpw-report" },
  { id: "over20", label: "Corridors with an average cost above 20%, Q3 2025", value: 13, unit: "corridors", note: "Nine of them start in Sub-Saharan Africa", source: "rpw-report" },
  { id: "nosmart", label: "Corridors with no SmaRT-qualifying service, Q3 2025", value: 20, unit: "corridors", note: "Nine of them to Sub-Saharan Africa", source: "rpw-report" },
  { id: "corridors", label: "Corridors covered by RPW, Q3 2025", value: 358, unit: "corridors", note: "48 sending and 102 receiving countries; on average 19 services per corridor", source: "rpw-report" },
  { id: "g8", label: "Average cost of sending from G8 countries, Q3 2025", value: 5.40, unit: "%", note: "5.99% in Q1 2025", source: "rpw-report" },
  { id: "g20", label: "Average cost of sending from G20 countries, Q3 2025", value: 6.39, unit: "%", note: "", source: "rpw-report" },
  { id: "southafrica", label: "Average cost of sending from South Africa, the costliest G20 sending country, Q3 2025", value: 15.65, unit: "%", note: "", source: "rpw-report" },
  { id: "ukg20", label: "Average cost of sending from the UK, Q3 2025: second cheapest G20 sending country after Germany (4.49%)", value: 4.61, unit: "%", note: "5.20% in Q1 2025", source: "rpw-report" },
  { id: "cards", label: "Average cost when paying by credit or debit card, the cheapest way to fund a transfer, Q3 2025", value: 4.39, unit: "%", note: "Bank account 8.69%, cash 7.01%, mobile money 5.29%", source: "rpw-report" },
  { id: "wallet", label: "Average cost when the money is received into a mobile wallet, Q3 2025", value: 3.92, unit: "%", note: "Cash pick-up 5.56%; bank account 7.86%", source: "rpw-report" },
];

// ---------- Write ----------
const TABLES = [
  ["countries", "Remittances received and paid, and the cost of sending money, by country", `Personal remittances received (US$ million and % of GDP) and paid, latest year to ${YEAR}; average cost of sending $200 to and from each country covered by RPW, Q3 ${YEAR} and Q3 2017.`, countries],
  ["world", `World remittance flows and the global average cost, 2000 to ${YEAR}`, "Personal remittances received by all countries and by low- and middle-income countries, remittances paid, and the global average cost of sending $200 (Q3 of each year).", world],
  ["quarterly", "Average cost of sending $200 by quarter, Q2 2016 to Q3 2025", "Global average, fee and exchange-rate margin, averages by provider type, and the average from the UK, calculated from the RPW dataset.", quarterly],
  ["regions", "Average cost of sending $200 to each SDG region, 2011 to 2025", "SDG indicator 10.c.1 by receiving region, third quarter of each year.", regions],
  ["corridors", `Cost of sending $200 in each corridor, Q3 ${YEAR}`, "Average total cost (and in Q3 2016), SmaRT average, fee and exchange-rate margin, services surveyed, cheapest service, and averages for banks and money transfer operators.", corridors],
  ["breakdown", `Cost of sending $200 by provider type, payment method and access point, Q3 ${YEAR}`, "Simple averages over services, calculated from the RPW dataset; categories with fewer than 20 services left out.", breakdown],
  ["uk_flows", `Personal remittances paid and received by the UK, 2000 to ${YEAR}`, "US$ million, from the World Bank's World Development Indicators.", uk_flows],
  ["uk_cost", `Average cost of sending $200 from the UK and worldwide, 2011 to ${YEAR}`, "SDG indicator 10.c.1, third quarter of each year.", uk_cost],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from the World Bank's Remittance Prices Worldwide report for Q3 2025 and the text of SDG target 10.c.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "remittances", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>remittances data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>remittances data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (World Bank datasets, including Remittance Prices Worldwide and the World Development Indicators: CC BY 4.0 under the World Bank's terms of use for datasets, credit "The World Bank: Remittance Prices Worldwide"; RPW's price data are collected by FXC Intelligence; UN SDG Global Database: UN terms of use).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.year = YEAR;
fs.writeFileSync(path.join(REPO, "remittances/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const q = quarterly.at(-1), C = countries;
console.log(`countries ${C.length}; unmatched ${unmatched.join(" ") || "none"}; with % GDP ${C.filter((r) => r.received_gdp_pct != null).length}; cost to receive ${C.filter((r) => r.cost_receive != null).length}; cost to send ${C.filter((r) => r.cost_send != null).length}`);
console.log("latest quarter", JSON.stringify(q), "\n(report: global 6.36, banks 14.99, MTOs 4.72, post offices 5.58)");
console.log("world 2025", JSON.stringify(world.at(-1)));
console.log(`corridors ${corridors.length}; from SDG ${corridors.filter((r) => r.cost_source === "sdg-10c1").length}; without SmaRT ${corridors.filter((r) => r.smart == null).length}; mismatched computed vs SDG > 0.05: ${corridors.filter((r) => r.cost_source === "sdg-10c1" && Math.abs(r.cost - (r.fee + r.fx_margin)) > 0.05).map((r) => r.corridor).join(" ") || "none"}`);
console.log("corridors <=3%", corridors.filter((r) => r.cost < 3).length, "<=5%", corridors.filter((r) => r.cost <= 5).length, ">20%", corridors.filter((r) => r.cost > 20).length);
console.log("top % GDP", [...C].filter((r) => r.received_gdp_pct != null).sort((a, b) => b.received_gdp_pct - a.received_gdp_pct).slice(0, 8).map((r) => `${r.iso3} ${r.received_gdp_pct} (${r.received_gdp_year})`).join(", "));
console.log("top US$", C.slice(0, 6).map((r) => `${r.iso3} ${r.received_usd_m} (${r.received_year})`).join(", "));
console.log("breakdown", JSON.stringify(breakdown.map((b) => [b.dimension[0], b.category, b.services, b.cost])));
console.log("uk", JSON.stringify(uk_cost.at(-1)), JSON.stringify(uk_flows.at(-1)), "uk corridors", corridors.filter((r) => r.from_iso3 === "GBR").length);
