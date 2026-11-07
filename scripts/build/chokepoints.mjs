// Builds data/chokepoints/* and chokepoints/assets/data.js for the Shipping Chokepoints dashboard from scripts/.raw/chokepoints
// (IMF PortWatch daily chokepoint transits and chokepoints database, EIA World Oil Transit Chokepoints).
//   node scripts/build/chokepoints.mjs [end-date]      (raw downloads in scripts/.raw/chokepoints/, or set RAW to their parent folder)
// end-date (YYYY-MM-DD) is the last PortWatch day used; it defaults to END below, the day the published files end on.
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "chokepoints");
const OUT = path.join(REPO, "data/chokepoints");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "chokepoints/assets"), { recursive: true });
const txt = (f) => fs.readFileSync(path.join(RAW, f), "utf8");

// The PortWatch export read, and the last day used. To extend the series, download a newer export,
// point PORTWATCH_FILE at it, move END (or pass the end date on the command line) and update the
// "portwatch" source date and notes below.
const PORTWATCH_FILE = process.env.PORTWATCH ?? "portwatch_chokepoints_2026-10-31.csv";
const END = process.argv[2] ?? "2026-10-25";
if (!/^\d{4}-\d{2}-\d{2}$/.test(END)) throw new Error(`End date must be YYYY-MM-DD, not ${END}`);
const START = "2025-01-01";
const CLOSURE = "2026-03-02"; // IRGC announced the Strait of Hormuz closed (fact "closure")

const SOURCES = {
  portwatch: {
    publisher: "IMF PortWatch (University of Oxford and IMF, from satellite AIS ship tracking)",
    title: "Daily Chokepoints Data: transit calls and trade volume estimates",
    url: "https://portwatch.imf.org/pages/cb5856222a5b4105adc6ee7e880a1730",
    published: "2026-10-31",
    method: "reported",
    notes: "Daily vessel transits by type and deadweight tonnage, estimated from AIS signals. Export of 31 October 2026 (data to 25 October 2026), taken from a public copy at github.com/jhelvy/2026-global-oil-flows. PortWatch revises past days. Cite as IMF PortWatch; IMF terms apply.",
  },
  "portwatch-db": {
    publisher: "IMF PortWatch",
    title: "Chokepoints database: names and locations",
    url: "https://portwatch.imf.org/",
    published: "2026",
    method: "reference",
    notes: "The 28 chokepoints PortWatch monitors.",
  },
  "eia-chokepoints": {
    publisher: "US Energy Information Administration",
    title: "World Oil Transit Chokepoints",
    url: "https://www.eia.gov/international/content/analysis/special_topics/world_oil_transit_chokepoints",
    published: "2026-03-03",
    method: "reported",
    notes: "Crude oil and petroleum liquids, million barrels a day. 1H25 = first half of 2025. Suez includes the SUMED pipeline; Panama is by fiscal year. The Cape of Good Hope is a route, not a chokepoint. Danish Straits are shown at the Oresund and Turkish Straits at the Bosporus.",
  },
  "aljazeera-2026-08": {
    publisher: "Al Jazeera, citing UNCTAD, Kpler, Lloyd's List and Gibson Shipbrokers",
    title: "How a 95 percent drop in Hormuz traffic changed global shipping",
    url: "https://www.aljazeera.com/news/2026/8/27/how-a-95-percent-drop-in-hormuz-traffic-changed-global-shipping",
    published: "2026-08-27",
    method: "reference",
  },
  "bimco-2026-01": {
    publisher: "India Seatrade News, reporting BIMCO",
    title: "Suez Canal transits still 60% below pre-crisis levels 100 days after last Houthi attack",
    url: "https://indiaseatradenews.com/suez-canal-transits-still-60-below-pre-crisis-levels-100-days-after-last-houthi-attack/",
    published: "2026-01-07",
    method: "reference",
  },
  "natural-earth": {
    publisher: "Natural Earth (via the world-atlas package)",
    title: "Admin 0 countries, 1:110m",
    url: "https://www.naturalearthdata.com/",
    published: "2026",
    method: "reference",
    notes: "Public domain. Background map.",
  },
};

// Rounds half away from zero on the decimal value, avoiding binary artefacts such as 1.15 * 10 = 11.499999.
// This reproduces every rounded figure in the published files.
const rnd = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.sign(v) * Math.round(+(Math.abs(v) * 10 ** d).toPrecision(12)) / 10 ** d);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// ---------- PortWatch daily transits ----------
// PortWatch's CSV export of the "Daily Chokepoints Data" table, or, if that file is missing, ArcGIS query results
// saved as portwatch_daily_*.json (see scripts/build/README.md for both).
const KEEP = ["chokepoint1", "chokepoint4", "chokepoint6", "chokepoint7"]; // Suez, Bab el-Mandeb, Hormuz, Cape of Good Hope
const readCsv = (f) => {
  const [head, ...lines] = txt(f).replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const H = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [H[i], v])));
};
let raw;
if (fs.existsSync(path.join(RAW, PORTWATCH_FILE))) raw = readCsv(PORTWATCH_FILE);
else {
  const seen = new Map();
  for (const f of fs.readdirSync(RAW).filter((f) => /^portwatch_daily_.*\.json$/.test(f))) {
    const j = JSON.parse(txt(f));
    if (j.error) throw new Error(`${f} holds an ArcGIS error, download it again: ${j.error.message}`);
    for (const { attributes: a } of j.features) seen.set(`${a.portid} ${a.date}`, a);
  }
  if (!seen.size) throw new Error(`Neither ${PORTWATCH_FILE} nor portwatch_daily_*.json found in ${RAW}`);
  raw = [...seen.values()];
}
const daily = raw
  .filter((r) => KEEP.includes(r.portid) && r.date >= START && r.date <= END)
  .map((r) => ({
    date: r.date, chokepoint: r.portname, portid: r.portid, transits: +r.n_total, tanker: +r.n_tanker, container: +r.n_container,
    dry_bulk: +r.n_dry_bulk, general_cargo: +r.n_general_cargo, roro: +r.n_roro, capacity_dwt: +r.capacity, source: "portwatch",
  }))
  .sort((a, b) => (a.chokepoint < b.chokepoint ? -1 : a.chokepoint > b.chokepoint ? 1 : a.date < b.date ? -1 : 1));
const names = [...new Set(daily.map((d) => d.chokepoint))];
const last = daily.reduce((m, d) => (d.date > m ? d.date : m), "");
for (const n of names) {
  const ds = daily.filter((d) => d.chokepoint === n);
  const days = (Date.parse(last) - Date.parse(START)) / 864e5 + 1;
  if (ds.length !== days || ds.at(-1).date !== last) throw new Error(`${n}: ${ds.length} days, expected ${days} to ${last}`);
}
if (last !== END) console.warn(`PortWatch data ends ${last}, before the end date ${END}`);

// ---------- Weekly averages (Monday start, complete weeks only) ----------
const DAY = 864e5;
const monday = (d) => { const t = Date.parse(d); return new Date(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10); };
const weekly = [];
for (const n of names) {
  const by = {};
  for (const d of daily.filter((x) => x.chokepoint === n)) (by[monday(d.date)] ??= []).push(d);
  for (const [week, a] of Object.entries(by)) if (a.length === 7) weekly.push({ week, chokepoint: n, transits: rnd(mean(a.map((d) => d.transits))), tanker: rnd(mean(a.map((d) => d.tanker))), source: "portwatch" });
}

// ---------- Before and since the closure ----------
const last30 = new Date(Date.parse(last) - 29 * DAY).toISOString().slice(0, 10);
const summary = names.map((n) => {
  const ds = daily.filter((d) => d.chokepoint === n);
  const y25 = ds.filter((d) => d.date <= "2025-12-31"), jf = ds.filter((d) => d.date >= "2026-01-01" && d.date < "2026-02-28") /* before the strikes of 28 February */;
  const since = ds.filter((d) => d.date >= CLOSURE), l30 = ds.filter((d) => d.date >= last30);
  const m = (a, k, dp = 1) => rnd(mean(a.map((d) => d[k])), dp);
  return {
    chokepoint: n, avg_2025: m(y25, "transits"), avg_jan_feb_2026: m(jf, "transits"), avg_since_closure: m(since, "transits"), avg_last_30_days: m(l30, "transits"),
    tanker_2025: m(y25, "tanker"), tanker_since_closure: m(since, "tanker"), dwt_2025: m(y25, "capacity_dwt", 0), dwt_since_closure: m(since, "capacity_dwt", 0),
    container_2025: m(y25, "container"), dry_bulk_2025: m(y25, "dry_bulk"), general_cargo_2025: m(y25, "general_cargo"), roro_2025: m(y25, "roro"),
    tanker_since: m(since, "tanker"), container_since: m(since, "container"), dry_bulk_since: m(since, "dry_bulk"), general_cargo_since: m(since, "general_cargo"), roro_since: m(since, "roro"),
    change_pct: rnd((100 * (m(since, "transits") - m(y25, "transits"))) / m(y25, "transits")), // from the rounded averages, as published
    from: START, to: last, closure_date: CLOSURE, source: "portwatch",
  };
});

// ---------- EIA oil flows ----------
// The first table on the EIA page: location, 2020 … 2024, 1H25. PortWatch names for each EIA location:
const EIA_PW = {
  "Strait of Malacca": "Malacca Strait", "Strait of Hormuz": "Strait of Hormuz", "Suez Canal and SUMED Pipeline": "Suez Canal", "Bab el-Mandeb": "Bab el-Mandeb Strait",
  "Danish Straits": "Oresund Strait", "Turkish Straits (Dardanelles)": "Bosporus Strait", "Panama Canal": "Panama Canal", "Cape of Good Hope": "Cape of Good Hope",
};
const eiaHtml = txt("eia_world_oil_transit_chokepoints.html");
const cells = (tr) => (tr.match(/<t[dh][\s>][\s\S]*?<\/t[dh]>/g) ?? []).map((c) => c.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim());
const eiaRows = eiaHtml.match(/<table[\s\S]*?<\/table>/)[0].match(/<tr[\s\S]*?<\/tr>/g).map(cells);
const eiaHead = eiaRows.find((r) => r[0] === "Location");
if (eiaHead.slice(1).join() !== "2020,2021,2022,2023,2024,1H25") throw new Error(`EIA table columns changed: ${eiaHead}`);
const oil = Object.entries(EIA_PW).map(([name, pw]) => {
  const r = eiaRows.find((x) => x[0] === name || x[0] === `${name}a` || x[0] === `${name}b`); // a, b: footnote marks
  if (!r) throw new Error(`EIA row missing: ${name}`);
  const v = r.slice(1).map(Number);
  return { chokepoint: name, portwatch_name: pw, mbd_2020: v[0], mbd_2021: v[1], mbd_2022: v[2], mbd_2023: v[3], mbd_2024: v[4], mbd_1H25: v[5], source: "eia-chokepoints" };
});

// ---------- Chokepoints ----------
const db = readCsv("portwatch_chokepoints_database.csv").map((c) => ({ ...c, lat: +c.lat, lon: +c.lon }));
const num = (id) => +id.replace("chokepoint", "");
const chokepoints = db.sort((a, b) => num(a.portid) - num(b.portid)).map((c) => {
  const o = { chokepoint: c.portname, portid: c.portid, lat: rnd(c.lat, 3), lon: rnd(c.lon, 3), geo_source: "portwatch-db" };
  const e = oil.find((x) => x.portwatch_name === c.portname);
  if (e) Object.assign(o, { eia_name: e.chokepoint, oil_mbd_1h25: e.mbd_1H25, oil_mbd_2023: e.mbd_2023, oil_source: "eia-chokepoints" });
  const s = summary.find((x) => x.chokepoint === c.portname);
  if (s) Object.assign(o, { transits_2025: s.avg_2025, transits_since_closure: s.avg_since_closure, transits_change_pct: s.change_pct, transits_source: "portwatch" });
  return o;
});
if (chokepoints.length !== 28) console.warn(`PortWatch lists ${chokepoints.length} chokepoints, not 28: check the table description`);

// ---------- Facts ----------
const facts = [
  { id: "closure", label: "IRGC announced the Strait of Hormuz closed", value: CLOSURE, unit: "date", note: "After US and Israeli strikes on Iran on 28 February", source: "aljazeera-2026-08" },
  { id: "mou", label: "Interim US-Iran agreement raised Hormuz traffic to about 20 ships a day", value: "2026-06-17", unit: "date", source: "aljazeera-2026-08" },
  { id: "blockade", label: "US resumed its blockade and traffic fell back to about five a day", value: "2026-07-14", unit: "date", source: "aljazeera-2026-08" },
  { id: "crude_share", label: "Share of global seaborne crude flows that passed through Hormuz before the war", value: 38, unit: "%", note: "LPG 29%, LNG 19% (UNCTAD)", source: "aljazeera-2026-08" },
  { id: "gulf_exports", label: "Gulf crude exports, 2025 to August 2026", value: "17 to 9", unit: "million barrels a day", note: "Down 47%", source: "aljazeera-2026-08" },
  { id: "oil_peak", label: "Oil price peak, April 2026", value: 130, unit: "US$ a barrel", note: "Above; about 20% above pre-war levels in late August", source: "aljazeera-2026-08" },
  { id: "hormuz_quarter", label: "Share of the world's seaborne oil trade through Hormuz, first half of 2025", value: 25, unit: "%", source: "eia-chokepoints" },
  { id: "suez_60", label: "Suez Canal transits in the first week of 2026 against the same week of 2023", value: -60, unit: "%", note: "Before ships began diverting around Africa", source: "bimco-2026-01" },
];

// ---------- Write ----------
// The published files keep the decimal point on whole numbers in these columns (24.0, not 24), as first issued.
const FLOATS = {
  chokepoints: ["lat", "lon", "oil_mbd_1h25", "oil_mbd_2023", "transits_2025", "transits_since_closure", "transits_change_pct"],
  summary: Object.keys(summary[0]).filter((k) => !/^dwt_|^(chokepoint|from|to|closure_date|source)$/.test(k)),
  oil: Object.keys(oil[0]).filter((k) => k.startsWith("mbd_")),
};
const fl = (id, k, v) => (typeof v === "number" && Number.isInteger(v) && FLOATS[id]?.includes(k) ? v.toFixed(1) : null);
// JSON with those numbers marked, then unmarked: keys with null values are left out of the JSON, as published.
const json = (id, records, indent) => {
  const s = JSON.stringify(records, (k, v) => (v === null ? undefined : fl(id, k, v) != null ? `\u0000${fl(id, k, v)}\u0000` : v), indent);
  return s.replace(/"\\u0000([^"]*)\\u0000"/g, "$1");
};
const csvCell = (id, k, v) => (v == null ? "" : fl(id, k, v) ?? (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)));
const TABLES = [
  ["chokepoints", "Chokepoints", "The 28 chokepoints IMF PortWatch monitors, with EIA oil flows (first half of 2025) and PortWatch daily transits for the four with data here.", chokepoints],
  ["summary", "Transits before and since the Hormuz closure", `Average daily transits by vessel type in 2025 and from ${CLOSURE} to ${last}, from IMF PortWatch.`, summary],
  ["weekly", "Weekly transits", "Average daily transits by week (Monday start), complete weeks only.", weekly],
  ["daily", "Daily transits", `IMF PortWatch daily transits by vessel type and deadweight tonnage, 1 January 2025 to ${last}.`, daily],
  ["oil", "Oil through chokepoints", "EIA estimates of crude oil and petroleum liquids flows, million barrels a day, 2020 to the first half of 2025.", oil],
  ["facts", "Headline findings", "Dates and published figures on the 2026 Hormuz closure and the Red Sea, each from its source.", facts],
];
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(id, k, r[k])).join(","))].join("\n") + "\n");
  const body = json(id, records, 2).replace(/\n/g, "\n  ");
  fs.writeFileSync(path.join(OUT, `${id}.json`), `{\n  "id": ${JSON.stringify(id)},\n  "title": ${JSON.stringify(title)},\n  "description": ${JSON.stringify(description)},\n  "records": ${body}\n}`);
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "chokepoints", licence: "CC BY 4.0 for our compilation; IMF PortWatch and EIA terms apply to their data", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2));
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>chokepoints data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>chokepoints data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; credit "Ledger Monitor", IMF PortWatch and the EIA, whose own terms apply to their data.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

// The dashboard module leaves out the daily table, which it does not use.
const DATA = TABLES.filter(([id]) => id !== "daily").map(([id, , , rec]) => `${JSON.stringify(id)}:${json(id, rec)}`);
DATA.push(`"last_day":${JSON.stringify(last)}`, `"closure":${JSON.stringify(CLOSURE)}`);
fs.writeFileSync(path.join(REPO, "chokepoints/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA={${DATA.join(",")}};\n`);

for (const s of summary) console.log(s.chokepoint.padEnd(22), "2025", s.avg_2025, "Jan-Feb", s.avg_jan_feb_2026, "since", s.avg_since_closure, "last30", s.avg_last_30_days, "change", s.change_pct);
console.log("daily", daily.length, "weekly", weekly.length, "last day", last, "chokepoints", chokepoints.length, "oil", oil.length);
