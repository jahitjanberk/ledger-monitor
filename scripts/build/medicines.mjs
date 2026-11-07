// Builds data/medicines/* and medicines/assets/data.js for the Medicine Shortages & Supply dashboard
// from the raw downloads in scripts/.raw/medicines (openFDA, UN Comtrade, EMA, Community Pharmacy England, NHSBSA).
//   node scripts/build/medicines.mjs        (raw downloads in scripts/.raw/medicines/, or set RAW to their parent folder)
// See scripts/build/README.md for the files this builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSheet } from "../lib/xlsx.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "medicines");
const OUT = path.join(REPO, "data/medicines");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "medicines/assets"), { recursive: true });

const r1 = (v, d = 1) => (v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const TRADE_YEAR = 2024;

const SOURCES = {
  openfda: {
    publisher: "US Food and Drug Administration (openFDA)",
    title: "Drug shortages (drug/shortages endpoint), bulk download",
    url: "https://open.fda.gov/apis/drug/drugshortages/",
    published: "2026-11-06",
    method: "reference",
    notes: "One record per affected product presentation, as listed in the FDA Drug Shortages Database and tracked by CDER. Grouped here by generic name: a shortage is current when any of its presentations has status Current. Start is the earliest initial posting date. openFDA data is public domain (CC0); FDA says results are unvalidated and should not be used for medical decisions.",
  },
  "fda-rtc-2025": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2025 (thirteenth annual report)", url: "https://www.fda.gov/media/193637/download", published: "2026-06", method: "reference", notes: "New, prevented and ongoing shortages tracked by CDER and CBER, from the report's text and Appendix C. Publication month taken from the PDF's metadata. US government work, public domain." },
  "fda-rtc-2024": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2024 (twelfth annual report)", url: "https://www.fda.gov/media/189325/download", published: "2025-08", method: "reference", notes: "Publication month taken from the PDF's metadata. Public domain." },
  "fda-rtc-2023": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2023 (eleventh annual report)", url: "https://www.fda.gov/media/179156/download", published: "2024-05", method: "reference", notes: "Publication month taken from the PDF's metadata. Public domain." },
  "fda-rtc-2022": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2022 (tenth annual report)", url: "https://www.fda.gov/media/169302/download", published: "2023-06", method: "reference", notes: "Also gives ongoing shortages at the end of 2020 and 2021. Public domain." },
  "fda-rtc-2021": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2021 (ninth annual report)", url: "https://www.fda.gov/media/159302/download", published: "2022-06", method: "reference", notes: "Public domain." },
  "fda-rtc-2020": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2020 (eighth annual report)", url: "https://www.fda.gov/media/150409/download", published: "2021-07", method: "reference", notes: "Public domain." },
  "fda-rtc-2019": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2019 (seventh annual report)", url: "https://www.fda.gov/media/139613/download", published: "2020-04", method: "reference", notes: "Public domain." },
  "fda-rtc-2018": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2018 (sixth annual report)", url: "https://www.fda.gov/media/130561/download", published: "2019-09", method: "reference", notes: "Gives new shortages for 2012 to 2016, prevented shortages for 2012 to 2018 and ongoing shortages at the end of 2013 to 2018. Before 2016 the counts cover CDER only; from 2016 they include CBER (vaccines, blood products). Public domain." },
  "fda-rtc-2017": { publisher: "US Food and Drug Administration", title: "Report to Congress: Drug Shortages CY 2017 (fifth annual report)", url: "https://www.fda.gov/media/113991/download", published: "2018-06", method: "reference", notes: "Public domain." },
  "fda-sopq": { publisher: "US Food and Drug Administration, Office of Pharmaceutical Quality", title: "FY2025 Report on the State of Pharmaceutical Quality", url: "https://www.fda.gov/about-fda/center-drug-evaluation-and-research-cder/report-state-pharmaceutical-quality", published: "2026-06-29", method: "reference", notes: "Sites in CDER's Site Catalog making drugs for the US market, and the regional shares of active-ingredient (API) manufacturing locations for products whose applicant is in the US, calendar 2020 and 2025. Public domain." },
  comtrade: {
    publisher: "UN Statistics Division, UN Comtrade",
    title: "International trade statistics: HS 30 (pharmaceutical products) and HS 2941 (antibiotics), exports and imports with the world, 2024 and 2025",
    url: "https://comtradeplus.un.org/",
    published: "2026-11-06",
    method: "reference",
    notes: "Values in current US dollars as reported by each country (exports free on board, imports as reported). Downloaded from the public preview API on the date shown; 2025 figures cover fewer countries because many had not yet reported. UN Comtrade data is not openly licensed: redistribution is restricted under its usage policy, which exempts small numbers of records and free public visualisation. Ask comtrade@un.org before reusing these figures in bulk.",
  },
  "ema-shortages": { publisher: "European Medicines Agency", title: "Medicine shortages catalogue (download of all shortages)", url: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/medicine-shortages-availability-issues/public-information-medicine-shortages", published: "2026-11-06", method: "reference", notes: "Shortages that EMA assesses: mostly centrally authorised medicines or shortages affecting several EU countries. National shortages are listed by each country's regulator instead. File generated 6 November 2026, 18:00. EMA content may be reproduced with acknowledgement of the source." },
  "ema-ulcm": { publisher: "European Medicines Agency, Heads of Medicines Agencies and European Commission", title: "Union list of critical medicines, version 2.1 (revision 2), EMA/229885/2026", url: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/medicine-shortages-availability-issues/availability-medicines-during-crises/union-list-critical-medicines", published: "2026-11-04", method: "reference", notes: "Active substances, by ATC code, whose supply the EU treats as critical. Grouped here by the first letter of the ATC code (the anatomical main group), using the group names given in the file. Reproduction authorised with acknowledgement." },
  "cpe-pc": { publisher: "Community Pharmacy England", title: "Price concessions and price concession archive", url: "https://cpe.org.uk/funding-and-reimbursement/reimbursement/price-concessions/archive/", published: "2026-11-04", method: "reference", notes: "Each line is a generic medicine and pack size for which DHSC granted a price above the Drug Tariff because pharmacies in England could not buy it at the Tariff price. Counted here from the monthly lists in the archive, one per distinct product and pack size; the counts match the monthly totals CPE publishes in its updates. © Community Pharmacy England; the lists record DHSC decisions." },
  "nhsbsa-ssp": { publisher: "NHS Business Services Authority", title: "Serious Shortage Protocols (SSPs)", url: "https://www.nhsbsa.nhs.uk/pharmacies-gp-practices-and-appliance-contractors/serious-shortage-protocols-ssps", published: "2026-11-06", method: "reference", notes: "Protocols issued by DHSC that let pharmacists in the UK supply an alternative to a prescribed medicine in serious shortage. Active list as read on the date shown. Open Government Licence v3.0." },
  "natural-earth": { publisher: "Natural Earth (via the world-atlas package)", title: "Admin 0 countries, 1:110m", url: "https://www.naturalearthdata.com/", published: "2026", method: "reference", notes: "Public domain. Used to match countries to map shapes." },
};

// ---------- Country lookup (shared with the Air dashboard, so names match across the site) ----------
const AIR = JSON.parse(fs.readFileSync(path.join(REPO, "data/air/countries.json"), "utf8")).records;
const BY3 = Object.fromEntries(AIR.map((r) => [r.iso3, r]));

// ---------- US shortages (openFDA) ----------
const FDA = JSON.parse(fs.readFileSync(path.join(RAW, "fda/drug-shortages-0001-of-0001.json"), "utf8"));
const FDA_DATE = FDA.meta.last_updated; // YYYY-MM-DD
const us = (s) => { const [m, d, y] = s.split("/"); return `${y}-${m}-${d}`; };
const yearsSince = (iso) => (Date.parse(FDA_DATE) - Date.parse(iso)) / (365.25 * 864e5);
const byName = {};
for (const x of FDA.results) (byName[x.generic_name] ??= []).push(x);
const shortages = [];
for (const [name, list] of Object.entries(byName)) {
  if (!list.some((x) => x.status === "Current")) continue;
  const cur = list.filter((x) => x.status === "Current");
  const start = cur.map((x) => us(x.initial_posting_date)).sort()[0];
  const updated = cur.map((x) => us(x.update_date)).sort().at(-1);
  const forms = [...new Set(cur.map((x) => x.dosage_form).filter(Boolean))];
  const cats = [...new Set(cur.flatMap((x) => x.therapeutic_category ?? []))].sort();
  const reasons = [...new Set(cur.map((x) => x.shortage_reason).filter(Boolean))].sort();
  shortages.push({
    name, status: "Current", started: start, years: r1(yearsSince(start), 1), last_updated: updated,
    injectable: /inject/i.test(name) || forms.some((f) => /inject/i.test(f)),
    dosage_forms: forms.join("; "), categories: cats.join("; "), reasons: reasons.join("; ") || null,
    presentations: cur.length, unavailable: cur.filter((x) => /^unva?ailable/i.test(x.availability ?? "")).length,
    companies: new Set(cur.map((x) => x.company_name)).size, source: "openfda",
  });
}
shortages.sort((a, b) => a.started.localeCompare(b.started));
const discontinuing = new Set(FDA.results.filter((x) => x.status === "To Be Discontinued").map((x) => x.generic_name)).size;

const tally = (key) => {
  const m = {};
  for (const s of shortages) for (const v of s[key] ? s[key].split("; ") : ["Not stated"]) m[v] = (m[v] ?? 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};
const categories = tally("categories").map(([category, n]) => ({ category, shortages: n, share_pct: r1((100 * n) / shortages.length), source: "openfda" }));
const REASON_LABEL = {
  "Demand increase for the drug": "Demand rose",
  "Discontinuation of the manufacture of the drug": "A maker stopped making it",
  "Delay in shipping of the drug": "Shipping delays",
  "Shortage of an active ingredient": "Active ingredient short",
  "Requirements related to complying with good manufacturing practices": "Manufacturing quality problems",
  "Shortage of an inactive ingredient component": "Other ingredient short",
  "Regulatory delay": "Regulatory delay",
  Other: "Other",
  "Not stated": "No reason given",
};
const reasons = tally("reasons").map(([reason, n]) => ({ reason, label: REASON_LABEL[reason] ?? reason, shortages: n, share_pct: r1((100 * n) / shortages.length), source: "openfda" }));

// ---------- US shortages per year, quoted from FDA's annual reports to Congress ----------
// [year, new, new source, prevented, prevented source, ongoing at 31 December, ongoing source]
const US_YEARS = [
  [2011, 251, "fda-rtc-2025", null, null, null, null],
  [2012, 117, "fda-rtc-2018", 282, "fda-rtc-2018", null, null],
  [2013, 44, "fda-rtc-2018", 170, "fda-rtc-2018", 97, "fda-rtc-2018"],
  [2014, 44, "fda-rtc-2018", 101, "fda-rtc-2018", 74, "fda-rtc-2018"],
  [2015, 26, "fda-rtc-2018", 142, "fda-rtc-2018", 64, "fda-rtc-2018"],
  [2016, 26, "fda-rtc-2018", 126, "fda-rtc-2018", 48, "fda-rtc-2018"],
  [2017, 39, "fda-rtc-2017", 145, "fda-rtc-2018", 41, "fda-rtc-2018"],
  [2018, 54, "fda-rtc-2018", 160, "fda-rtc-2018", 67, "fda-rtc-2018"],
  [2019, 51, "fda-rtc-2019", 154, "fda-rtc-2019", 76, "fda-rtc-2019"],
  [2020, 43, "fda-rtc-2020", 199, "fda-rtc-2020", 86, "fda-rtc-2022"],
  [2021, 41, "fda-rtc-2021", 317, "fda-rtc-2021", 83, "fda-rtc-2021"],
  [2022, 49, "fda-rtc-2022", 222, "fda-rtc-2022", 86, "fda-rtc-2022"],
  [2023, 55, "fda-rtc-2023", 236, "fda-rtc-2023", 98, "fda-rtc-2023"],
  [2024, 15, "fda-rtc-2024", 283, "fda-rtc-2024", 113, "fda-rtc-2024"],
  [2025, 4, "fda-rtc-2025", 330, "fda-rtc-2025", 93, "fda-rtc-2025"],
];
const usYears = US_YEARS.map(([year, n, ns, p, ps, o, os]) => ({ year, new_shortages: n, new_source: ns, prevented: p, prevented_source: ps, ongoing_end_year: o, ongoing_source: os, scope: year < 2016 ? "CDER" : "CDER and CBER" }));

// ---------- Trade (UN Comtrade) ----------
const ct = (cmd, flow, year) => {
  const f = path.join(RAW, `comtrade_hs${cmd}_${flow}_${year}.json`);
  const m = {};
  for (const x of JSON.parse(fs.readFileSync(f, "utf8")).data) if (x.partnerCode === 0 && x.motCode === 0 && x.customsCode === "C00" && x.partner2Code === 0) m[x.reporterISO] = x.primaryValue;
  return m;
};
const X = ct(30, "X", TRADE_YEAR), M = ct(30, "M", TRADE_YEAR), X25 = ct(30, "X", 2025), M25 = ct(30, "M", 2025);
const AX = ct(2941, "X", TRADE_YEAR), AM = ct(2941, "M", TRADE_YEAR), AX25 = ct(2941, "X", 2025);
const sum = (m) => Object.entries(m).filter(([k]) => BY3[k]).reduce((s, [, v]) => s + v, 0);
const totX = sum(X), totM = sum(M), totAX = sum(AX);

const BANDS = [
  { map: "exports", band: "Under $100m", min: 0, max: 0.1, unit: "US$ billion, pharmaceutical exports (HS 30)", source: "comtrade" },
  { map: "exports", band: "$100m to $1bn", min: 0.1, max: 1, unit: "US$ billion, pharmaceutical exports (HS 30)", source: "comtrade" },
  { map: "exports", band: "$1bn to $10bn", min: 1, max: 10, unit: "US$ billion, pharmaceutical exports (HS 30)", source: "comtrade" },
  { map: "exports", band: "$10bn to $50bn", min: 10, max: 50, unit: "US$ billion, pharmaceutical exports (HS 30)", source: "comtrade" },
  { map: "exports", band: "$50bn or more", min: 50, max: null, unit: "US$ billion, pharmaceutical exports (HS 30)", source: "comtrade" },
  { map: "net", band: "Imports exceed exports by $5bn+", min: null, max: -5, unit: "US$ billion, exports minus imports (HS 30)", source: "comtrade" },
  { map: "net", band: "Imports exceed exports by $1–5bn", min: -5, max: -1, unit: "US$ billion, exports minus imports (HS 30)", source: "comtrade" },
  { map: "net", band: "Within $1bn either way", min: -1, max: 1, unit: "US$ billion, exports minus imports (HS 30)", source: "comtrade" },
  { map: "net", band: "Exports exceed imports by $1–10bn", min: 1, max: 10, unit: "US$ billion, exports minus imports (HS 30)", source: "comtrade" },
  { map: "net", band: "Exports exceed imports by $10bn+", min: 10, max: null, unit: "US$ billion, exports minus imports (HS 30)", source: "comtrade" },
  { map: "abx", band: "Under $1m", min: 0, max: 1, unit: "US$ million, antibiotic exports (HS 2941)", source: "comtrade" },
  { map: "abx", band: "$1m to $10m", min: 1, max: 10, unit: "US$ million, antibiotic exports (HS 2941)", source: "comtrade" },
  { map: "abx", band: "$10m to $100m", min: 10, max: 100, unit: "US$ million, antibiotic exports (HS 2941)", source: "comtrade" },
  { map: "abx", band: "$100m to $1bn", min: 100, max: 1000, unit: "US$ million, antibiotic exports (HS 2941)", source: "comtrade" },
  { map: "abx", band: "$1bn or more", min: 1000, max: null, unit: "US$ million, antibiotic exports (HS 2941)", source: "comtrade" },
];
const bandOf = (map, v) => (v == null ? null : BANDS.filter((x) => x.map === map).find((x) => (x.min == null || v >= x.min) && (x.max == null || v < x.max))?.band ?? null);

const countries = [];
for (const k of new Set([...Object.keys(X), ...Object.keys(M), ...Object.keys(X25), ...Object.keys(M25)])) {
  const c = BY3[k];
  if (!c) continue;
  const x = X[k] != null ? X[k] / 1e9 : null, m = M[k] != null ? M[k] / 1e9 : null;
  const net = x != null && m != null ? x - m : null;
  const ax = AX[k] != null ? AX[k] / 1e6 : null;
  countries.push({
    country: c.country, iso3: k, iso_n3: c.iso_n3, year: TRADE_YEAR,
    exports_bn: r1(x, 2), imports_bn: r1(m, 2), net_bn: r1(net, 2),
    exports_share_pct: x != null ? r1((100 * X[k]) / totX, 2) : null, imports_share_pct: m != null ? r1((100 * M[k]) / totM, 2) : null,
    exports_2025_bn: X25[k] != null ? r1(X25[k] / 1e9, 2) : null, imports_2025_bn: M25[k] != null ? r1(M25[k] / 1e9, 2) : null,
    abx_exports_m: r1(ax, 1), abx_imports_m: AM[k] != null ? r1(AM[k] / 1e6, 1) : null,
    abx_share_pct: ax != null ? r1((100 * AX[k]) / totAX, 2) : null, abx_exports_2025_m: AX25[k] != null ? r1(AX25[k] / 1e6, 1) : null,
    trade_source: "comtrade",
    exports_band: bandOf("exports", x), net_band: bandOf("net", net), abx_band: bandOf("abx", ax),
  });
}
countries.sort((a, b) => (b.exports_bn ?? -1) - (a.exports_bn ?? -1));

// ---------- Where active ingredients are made (FDA, quoted) ----------
const apiSites = [
  { region: "Europe", api_share_2020: 34, api_share_2025: 30.8, source: "fda-sopq" },
  { region: "India", api_share_2020: 17.9, api_share_2025: 21.2, source: "fda-sopq" },
  { region: "United States", api_share_2020: 22.9, api_share_2025: 21.1, source: "fda-sopq" },
  { region: "China", api_share_2020: 12.2, api_share_2025: 14.7, source: "fda-sopq" },
];

// ---------- EU ----------
const emaRows = readSheet(path.join(RAW, "ema"), "sheet1.xml").filter(Boolean);
const eh = emaRows.findIndex((r) => r[0] === "Category");
const EH = emaRows[eh];
const col = (n) => EH.indexOf(n);
const dmy = (s) => { if (s == null || s === "") return null; if (typeof s === "number") return new Date(Date.UTC(1899, 11, 30) + s * 864e5).toISOString().slice(0, 10); const m = String(s).match(/^(\d\d)\/(\d\d)\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const euShortages = emaRows.slice(eh + 1).filter((r) => r[0] === "Human").map((r) => ({
  medicine: r[col("Medicine affected")], substance: r[col("International non-proprietary name (INN) or common name")] ?? null,
  status: r[col("Supply shortage status")], therapeutic_area: r[col("Therapeutic area (MeSH)")] ?? null,
  alternatives: r[col("Availability of alternatives")] ?? null, started: dmy(r[col("Start of shortage date")]),
  expected_resolution: r[col("Expected resolution")] ?? null, first_published: dmy(r[col("First published date")]), last_updated: dmy(r[col("Last updated date")]),
  url: r[col("Shortage URL")], source: "ema-shortages",
}));

const ul = readSheet(path.join(RAW, "ulcm"), "sheet1.xml").filter((r) => r && r.some((x) => x != null));
const GROUP = {};
for (const r of ul) { const m = String(r[1] ?? "").match(/^([A-Z]) - (.+)$/); if (r[0] == null && m) GROUP[m[1]] = m[2].trim(); }
const subs = ul.filter((r) => /^[A-Z]\d\d[A-Z]{2}\d\d$/.test(r[0] ?? ""));
const gc = {};
for (const r of subs) gc[r[0][0]] = (gc[r[0][0]] ?? 0) + 1;
const euCritical = Object.entries(gc).sort((a, b) => b[1] - a[1]).map(([atc, n]) => ({ atc_group: atc, group: GROUP[atc] ?? atc, substances: n, share_pct: r1((100 * n) / subs.length), source: "ema-ulcm" }));

// ---------- UK: price concessions (CPE archive) ----------
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const arch = fs.readFileSync(path.join(RAW, "cpe_archive.html"), "utf8");
const marks = [...arch.matchAll(/>\s*((January|February|March|April|May|June|July|August|September|October|November|December) (20[12]\d))\s*</g)]
  .filter((x) => /trigger|<strong>/.test(arch.slice(x.index - 60, x.index + 1)));
const cells = (r) => [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim());
const pcAll = [];
for (let i = 0; i < marks.length; i++) {
  const s = arch.slice(marks[i].index, marks[i + 1]?.index ?? arch.length);
  const rows = [...s.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((r) => cells(r[0]))
    // A product line has a price: "£1.23" anywhere, or (in a few older tables) a bare number in the last column.
    .filter((c) => c.length >= 2 && c[0] && !/^drug$/i.test(c[0]) && (c.some((x) => /£\s*\d/.test(x)) || (c.length >= 3 && /^\d[\d,]*(\.\d+)?p?$/.test(c.at(-1)))));
  const n = new Set(rows.map((c) => `${c[0]}|${c[1]}`.toLowerCase().replace(/\s+/g, " "))).size;
  pcAll.push({ month: `${marks[i][3]}-${String(MONTHS.indexOf(marks[i][2]) + 1).padStart(2, "0")}`, concessions: n, source: "cpe-pc" });
}
pcAll.sort((a, b) => a.month.localeCompare(b.month));
const firstFull = pcAll.findIndex((r, i) => r.concessions > 0 && pcAll.slice(i).every((x) => x.concessions > 0));
const ukConcessions = pcAll.slice(firstFull);

// ---------- UK: serious shortage protocols (NHSBSA) ----------
const ssp = fs.readFileSync(path.join(RAW, "nhsbsa_ssp.html"), "utf8").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/®/g, "").replace(/\s+/g, " ");
const active = ssp.match(/Active SSPs(.*?)Expired SSPs/)?.[1] ?? "";
const dlong = (s) => { const [d, m, y] = s.split(" "); return `${y}-${String(MONTHS.indexOf(m) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`; };
const ukSsp = [...active.matchAll(/SSP(\d{3})\s+(.+?)\s*\(PDF:[^)]*\)\s*(\d{1,2} \w+ \d{4}) to (\d{1,2} \w+ \d{4})/g)]
  .map((m) => ({ ref: `SSP${m[1]}`, medicine: m[2].replace(/\s+/g, " ").trim(), start: dlong(m[3]), end: dlong(m[4]), status: "Active", source: "nhsbsa-ssp" }));
const sspMax = Math.max(...[...ssp.matchAll(/SSP(\d{3})/g)].map((m) => +m[1]));

// ---------- Headline findings ----------
const facts = [
  { id: "prevented", label: "US drug shortages FDA helped prevent, 2025", value: 330, unit: "shortages", note: "279 tracked by CDER, 51 by CBER", source: "fda-rtc-2025" },
  { id: "new2025", label: "New US drug shortages, 2025", value: 4, unit: "shortages", note: "Against a peak of 251 in 2011", source: "fda-rtc-2025" },
  { id: "ongoing2025", label: "Ongoing US drug shortages at the end of 2025", value: 93, unit: "shortages", note: "71 tracked by CDER (medicines), 22 by CBER (vaccines, blood and other biological products)", source: "fda-rtc-2025" },
  { id: "ongoingcder", label: "Ongoing CDER-tracked shortages at the end of 2025", value: 71, unit: "shortages", note: "", source: "fda-rtc-2025" },
  { id: "notices", label: "Warnings of possible shortages manufacturers sent FDA, 2025", value: 1424, unit: "notifications", note: "From 167 manufacturers", source: "fda-rtc-2025" },
  { id: "sites", label: "Manufacturing sites making medicines for the US market, end of FY2025", value: 5953, unit: "sites", note: "57% in the US, including 1,698 US medical gas sites", source: "fda-sopq" },
  { id: "sitesus", label: "Share of those sites in the US", value: 57, unit: "%", note: "", source: "fda-sopq" },
  { id: "inspections", label: "FDA drug quality inspections, FY2025", value: 1248, unit: "inspections", note: "702 in the US, 546 abroad", source: "fda-sopq" },
  { id: "eucritical", label: "Active substances on the EU's list of critical medicines", value: subs.length, unit: "substances", note: "Version 2.1, revision 2", source: "ema-ulcm" },
  { id: "euongoing", label: "Shortages EMA is following that are still ongoing", value: euShortages.filter((r) => r.status === "Shortage ongoing").length, unit: "shortages", note: `Of ${euShortages.length} in its catalogue`, source: "ema-shortages" },
  { id: "sspactive", label: "Serious Shortage Protocols in force in the UK", value: ukSsp.length, unit: "protocols", note: `The latest reference is SSP${String(sspMax).padStart(3, "0")}`, source: "nhsbsa-ssp" },
  { id: "sspmax", label: "Serious Shortage Protocols issued since they began in 2019", value: sspMax, unit: "protocols", note: "Highest reference number listed", source: "nhsbsa-ssp" },
];

// ---------- Write ----------
const last = ukConcessions.at(-1);
const TABLES = [
  ["countries", "Pharmaceutical trade by country", `Exports and imports of pharmaceutical products (HS 30) and of antibiotics as ingredients (HS 2941), US$, ${TRADE_YEAR}, with 2025 where reported (UN Comtrade). Shares are of the total reported by all countries.`, countries],
  ["shortages", "Current US drug shortages", `Every shortage listed as current in the FDA Drug Shortages Database on ${FDA_DATE}, grouped by generic name, with when it was first posted, its forms, therapeutic categories and the reasons manufacturers gave (openFDA).`, shortages],
  ["categories", "US shortages by therapeutic category", "How many current US shortages fall in each FDA therapeutic category. A medicine can be in several (openFDA).", categories],
  ["reasons", "Reasons given for US shortages", "How many current US shortages cite each reason. A shortage can have several, given by different manufacturers (openFDA).", reasons],
  ["us_years", "US drug shortages per year, 2011 to 2025", "New shortages, shortages prevented and shortages still ongoing at the end of each year, as stated in FDA's annual reports to Congress. Counts before 2016 are CDER only.", usYears],
  ["api_sites", "Where active ingredients are made for US medicines", "Regional shares of active-ingredient manufacturing locations for products with a US applicant, 2020 and 2025 (FDA Report on the State of Pharmaceutical Quality, FY2025).", apiSites],
  ["eu_critical", "EU critical medicines by body system", "Active substances on the Union list of critical medicines, grouped by ATC anatomical main group (EMA).", euCritical],
  ["eu_shortages", "Shortages in EMA's catalogue", "Every shortage in the European Medicines Agency's public catalogue, with its status, therapeutic area and dates.", euShortages],
  ["uk_concessions", "Price concessions in England, monthly", `Generic medicines and pack sizes granted a price concession by DHSC each month, ${ukConcessions[0].month} to ${last.month} (Community Pharmacy England).`, ukConcessions],
  ["uk_ssp", "Serious Shortage Protocols in force", "UK Serious Shortage Protocols active on 6 November 2026 (NHSBSA).", ukSsp],
  ["bands", "Map classes", "Bands used to colour the three maps.", BANDS],
  ["facts", "Headline findings", "Published figures from FDA, EMA and NHSBSA.", facts],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, title, description, records }, null, 2) + "\n");
}
fs.writeFileSync(path.join(OUT, "sources.json"), JSON.stringify({ sources: SOURCES }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ variant: "medicines", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) }, null, 2) + "\n");
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>medicines data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>medicines data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Our compilation is licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers, whose own terms also apply (FDA and openFDA: public domain; EMA: reproduction authorised with acknowledgement; NHSBSA: Open Government Licence v3.0; Community Pharmacy England: its copyright; UN Comtrade: not openly licensed, redistribution restricted under its usage policy, so the trade table is shared here as a small, transformed extract for free public use only).</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
DATA.fda_date = FDA_DATE;
DATA.trade_year = TRADE_YEAR;
DATA.discontinuing = discontinuing;
fs.writeFileSync(path.join(REPO, "medicines/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

// ---------- Report ----------
const S = shortages, inj = S.filter((s) => s.injectable).length;
const ys = S.map((s) => s.years).sort((a, b) => a - b);
console.log(`US current shortages ${S.length} (openFDA ${FDA_DATE}); injectable ${inj}; median ${ys[ys.length >> 1]} years; 5y+ ${ys.filter((y) => y >= 5).length}; 10y+ ${ys.filter((y) => y >= 10).length}; oldest ${S[0].name} ${S[0].started}`);
console.log(`to be discontinued: ${discontinuing}`);
console.log("categories:", categories.slice(0, 6).map((c) => `${c.category} ${c.shortages}`).join(", "));
console.log("reasons:", reasons.map((c) => `${c.label} ${c.shortages}`).join(", "));
console.log(`countries ${countries.length}; with ${TRADE_YEAR} exports ${countries.filter((c) => c.exports_bn != null).length}; total exports $${(totX / 1e9).toFixed(0)}bn, imports $${(totM / 1e9).toFixed(0)}bn, antibiotics $${(totAX / 1e9).toFixed(2)}bn`);
console.log("top exporters:", countries.slice(0, 10).map((c) => `${c.iso3} ${c.exports_bn} (${c.exports_share_pct}%)`).join(", "));
console.log("top abx:", [...countries].sort((a, b) => (b.abx_exports_m ?? -1) - (a.abx_exports_m ?? -1)).slice(0, 6).map((c) => `${c.iso3} ${c.abx_exports_m} (${c.abx_share_pct}%)`).join(", "));
console.log("unmatched comtrade:", [...new Set([...Object.keys(X), ...Object.keys(M)])].filter((k) => !BY3[k]).join(" "));
console.log(`EU: ${euShortages.length} shortages, ongoing ${facts.find((f) => f.id === "euongoing").value}; critical ${subs.length}:`, euCritical.slice(0, 4).map((g) => `${g.group} ${g.substances}`).join(", "));
console.log(`UK concessions ${ukConcessions[0].month}..${last.month}; last ${last.concessions}; max ${Math.max(...ukConcessions.map((r) => r.concessions))}`, ukConcessions.slice(-12).map((r) => `${r.month}:${r.concessions}`).join(" "));
console.log(`SSP active ${ukSsp.length}, max ${sspMax}:`, ukSsp.map((s) => `${s.ref} ${s.medicine} ${s.start}..${s.end}`).join("; "));
