// Builds data/scams/* and scams/assets/data.js for The Scam Economy dashboard.
// The loss figures come from national agencies' annual reports and press releases (FBI IC3, FTC, UK Finance,
// ACCC / National Anti-Scam Centre, Canadian Anti-Fraud Centre, Singapore Police Force, I4C) and GASA surveys,
// mostly PDFs and web pages, so they are typed in below with the id of the source each was read from.
// The exchange rates are read from the IRS yearly average rates page saved in scripts/.raw/scams.
//   node scripts/build/scams.mjs        (raw downloads in scripts/.raw/scams/, or set RAW to their parent folder)
// See scripts/build/README.md for the files each builder needs and where to download them.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_ROOT = path.resolve(process.env.RAW ?? path.join(REPO, "scripts/.raw"));
const RAW = path.join(RAW_ROOT, "scams");
const OUT = path.join(REPO, "data/scams");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(REPO, "scams/assets"), { recursive: true });

// Every figure cites one of these. When a new edition comes out, add a new id (e.g. gasa-global-2026)
// rather than editing an old one, and move the rows that quote it.
const SOURCES = {
  "gasa-global-2025": { publisher: "Global Anti-Scam Alliance & Feedzai", title: "Global State of Scams 2025", url: "https://gasa.org/knowledge-base/reports/global-state-of-scams-2025", published: "2025-10-07", method: "survey" },
  "gasa-global-2025-coverage": { publisher: "Feedzai", title: "5 Key Takeaways from the GASA Global State of Scams 2025 Report", url: "https://www.feedzai.com/blog/gasa-global-state-of-scams-report/", published: "2025-10-09", method: "survey" },
  "gasa-global-2024": { publisher: "Global Anti-Scam Alliance & Feedzai", title: "Global State of Scams 2024", url: "https://www.gasa.org/post/global-state-of-scams-report-2024-1-trillion-stolen-in-12-months-gasa-feedzai", published: "2024-10-07", method: "survey" },
  "gasa-pakistan-2025": { publisher: "Profit (Pakistan Today), reporting GASA Global State of Scams 2025", title: "Pakistan loses over $9 billion to financial scams annually", url: "https://profit.pakistantoday.com.pk/2025/10/21/pakistan-loses-over-9-billion-to-financial-scams-annually-2-5-of-gdp-says-global-anti-scam-report/", published: "2025-10-21", method: "survey" },
  "gasa-germany-2025": { publisher: "Global Anti-Scam Alliance", title: "State of Scams in Germany Report 2025", url: "https://gasa.org/knowledge-base/reports/state-of-scams-in-germany-report-2025", published: "2025-06-23", method: "survey" },
  "gasa-korea-2025": { publisher: "Global Anti-Scam Alliance", title: "State of Scams in South Korea Report 2025", url: "https://gasa.org/knowledge-base/reports/state-of-scams-in-south-korea-report-2025", published: "2025-09-25", method: "survey" },
  "gasa-brazil-2025": { publisher: "Global Anti-Scam Alliance", title: "State of Scams in Brazil Report 2025 (release)", url: "https://www.newswire.com/news/new-report-reveals-brazilians-face-252-scam-encounters-annually-22673453", published: "2025-11-12", method: "survey" },
  "gasa-denmark-2026": { publisher: "Global Anti-Scam Alliance", title: "State of Scams in Denmark 2026 Report", url: "https://gasa.org/knowledge-base/blog/global-scams-on-the-rise-over-half-of-adults-worldwide-report-scam-encounters?hsLang=en", published: "2026", method: "survey" },
  "gasa-philippines-2026": { publisher: "Daily Tribune, reporting GASA State of Scams in the Philippines 2026", title: "Filipinos lose P121.8B to scams", url: "https://tribune.net.ph/2026/10/19/filipinos-lose-p1218b-to-scams", published: "2026-10-19", method: "survey" },
  "gasa-uae-2026": { publisher: "Global Anti-Scam Alliance", title: "Scams Hit UAE Residents Every Three Days on Average", url: "https://gasa.org/knowledge-base/blog/scams-hit-uae-residents-every-three-days-on-average-new-research-finds", published: "2026-01-27", method: "survey" },
  "fbi-ic3-2025": { publisher: "FBI Internet Crime Complaint Center", title: "2025 Internet Crime Report", url: "https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf", published: "2026-04-07", method: "reported" },
  "fbi-ic3-2025-coverage": { publisher: "dmarcian", title: "2025 Internet Crime Report: Nearly $21 Billion Lost", url: "https://dmarcian.com/fbi-internet-crime-report-2025/", published: "2026-04", method: "reported" },
  "fbi-ic3-2024": { publisher: "FBI Internet Crime Complaint Center", title: "2024 Internet Crime Report", url: "https://ic3.gov/AnnualReport/Reports/2024_IC3Report.pdf", published: "2025-04-23", method: "reported" },
  "fbi-ic3-2023": { publisher: "TechRadar, reporting FBI IC3 2023 Internet Crime Report", title: "Online fraud cost Americans $12.5bn last year", url: "https://techradar.com/pro/online-fraud-cost-americans-dollar125bn-last-year-and-its-only-expected-to-get-worse-in-2024", published: "2024-03", method: "reported" },
  "fbi-ic3-2022": { publisher: "TechSpot, reporting FBI IC3 2022 Internet Crime Report", title: "Americans lost $10.3 billion to online scams in 2022", url: "https://www.techspot.com/news/97946-americans-lost-103-billion-online-scams-2022.html", published: "2023-03", method: "reported" },
  "ftc-2026-testimony": { publisher: "US Federal Trade Commission", title: "FTC Testifies Before Joint Economic Committee on Agency's Efforts to Combat Fraud", url: "https://www.ftc.gov/news-events/news/press-releases/2026/03/ftc-testifies-joint-economic-committee-agencys-efforts-combat-fraud", published: "2026-03-25", method: "reported" },
  "ftc-2026-imposters": { publisher: "US Federal Trade Commission", title: "FTC Data Show People Reported Losing $3.5 Billion to Imposter Scams in 2025", url: "https://www.ftc.gov/node/330116", published: "2026-06-15", method: "reported" },
  "ukfinance-2026": { publisher: "FinTech Futures, reporting UK Finance Annual Fraud Report 2026", title: "UK payment fraud losses topped £1.28bn in 2025", url: "https://www.fintechfutures.com/financial-crime-fraud-prevention/uk-payment-fraud-losses-topped-1-28bn-in-2025-new-uk-finance-report-finds", published: "2026-06", method: "reported" },
  "ukfinance-2026-cases": { publisher: "Payment Expert, reporting UK Finance Annual Fraud Report 2026", title: "UK Finance: Fraud losses hit £1.28bn", url: "https://paymentexpert.com/2026/06/15/uk-finance-fraud-report-2026/", published: "2026-06-15", method: "reported" },
  "ukfinance-2025": { publisher: "TechRound, reporting UK Finance Annual Fraud Report 2025", title: "Online fraud rises, UK report", url: "https://techround.co.uk/news/online-fraud-rises-uk-report", published: "2025-05", method: "reported" },
  "ukfinance-2024": { publisher: "UK Finance", title: "Annual Fraud Report 2024", url: "https://www.ukfinance.org.uk/policy-and-guidance/reports-and-publications/annual-fraud-report-2024", published: "2024-05", method: "reported" },
  "ukfinance-2023": { publisher: "Scottish Financial News, reporting UK Finance Annual Fraud Report 2023", title: "Financial fraud losses in the UK decrease by 8% to £1.2bn in 2022", url: "https://scottishfinancialnews.com/articles/financial-fraud-losses-in-the-uk-decrease-by-8-to-ps12bn-in-2022", published: "2023-05", method: "reported" },
  "ukfinance-2022": { publisher: "S&P Global, reporting UK Finance Annual Fraud Report 2022", title: "UK fraud losses rise 8% to more than £1.3B in 2021", url: "https://www.spglobal.com/market-intelligence/en/news-insights/articles/2022/6/uk-fraud-losses-rise-8-to-more-than-163-1-3b-in-2021-amid-pandemic-upheavals-70986865", published: "2022-06", method: "reported" },
  "accc-2025": { publisher: "Australian Competition and Consumer Commission", title: "Continued action critical to combat fraud as annual scam losses exceed $2 billion", url: "https://www.accc.gov.au/media-release/continued-action-critical-to-combat-fraud-as-annual-scam-losses-exceed-2-billion", published: "2026-03-30", method: "reported" },
  "accc-2025-report": { publisher: "National Anti-Scam Centre", title: "Targeting Scams Report 2025", url: "https://www.nasc.gov.au/system/files/targeting-scams-report-2025.pdf", published: "2026-03", method: "reported" },
  "accc-2025-coverage": { publisher: "Bernama, reporting National Anti-Scam Centre", title: "Australian Scam Losses Rise 7.8 Pct In 2025", url: "https://bernama.com/en/news.php?id=2538995", published: "2026-03-30", method: "reported" },
  "accc-2023": { publisher: "HCAMag, reporting Targeting Scams 2023", title: "Australians lose $2.74 billion to scams in 2023", url: "https://hcamag.com/au/specialisation/financial-wellness/australians-lose-274-billion-to-scams-in-2023/487132", published: "2024-04", method: "reported" },
  "cafc-2025": { publisher: "Canadian Anti-Fraud Centre", title: "Top 10 frauds in 2025", url: "https://antifraudcentre-centreantifraude.ca/features-vedette/2026/02/top-fraud-2025-fraudes-plus-courantes-eng.htm", published: "2026-02", method: "reported" },
  "cafc-2025-release": { publisher: "Competition Bureau Canada", title: "Fraud Prevention Month to bring hidden crime into the spotlight", url: "https://www.canada.ca/en/competition-bureau/news/2026/03/fraud-prevention-month-to-bring-hidden-crime-into-the-spotlight.html", published: "2026-03-06", method: "reported" },
  "cafc-2024": { publisher: "Competition Bureau Canada", title: "Fraud Prevention Month to focus on impersonation fraud", url: "https://www.canada.ca/en/competition-bureau/news/2025/02/fraud-prevention-month-to-focus-on-impersonation-fraud-one-of-the-fastest-growing-forms-of-fraud.html", published: "2025-02", method: "reported" },
  "spf-2025": { publisher: "Malay Mail, reporting Singapore Police Force annual scams brief", title: "Singapore scam losses fall to S$913.1m in 2025", url: "https://www.malaymail.com/news/singapore/2026/02/26/singapore-police-scam-cases-drop-248pc-in-2025-losses-fall-to-s913m-but-youths-remain-most-affected/210482", published: "2026-02-26", method: "reported" },
  "spf-2025-cases": { publisher: "The Online Citizen, reporting Singapore Police Force", title: "Scam cases in Singapore fall 27.6 per cent", url: "https://theonlinecitizen.com/2026/02/25/scam-cases-in-singapore-fall-27-6-per-cent-in-first-recorded-decrease", published: "2026-02-25", method: "reported" },
  "spf-2024": { publisher: "Deccan Herald, reporting Singapore Police Force", title: "Singapore lost SGD 1.1 billion to scams in 2024", url: "https://www.deccanherald.com/world/singapore-lost-sgd-11-billion-to-scams-in-2024-police-3420775", published: "2025-02-25", method: "reported" },
  "i4c-2025": { publisher: "BrokersView, reporting I4C / National Cybercrime Reporting Portal data", title: "Indians lost over ₹198 billion to financial fraud in 2025", url: "https://www.fastbull.com/brokersview/news/indians-lost-over-%E2%82%B9198-billion-to-financial-fraud-in-2025-i4c-ncrp-data-show-319040", published: "2026-01-04", method: "reported" },
  "irs-fx-2025": { publisher: "US Internal Revenue Service", title: "Yearly average currency exchange rates", url: "https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates", published: "2026", method: "reference" },
};

// ---------- Reported losses, latest year (national agencies) ----------
// losses_local and top_type_local are in the agency's own currency. change_pct is the agency's published
// change on the year before; where none is published it is null and the dashboard works it out from `trend`.
const reported = [
  { country: "United States", iso_n3: "840", agency: "FBI Internet Crime Complaint Center", year: 2025, losses_local: 20877000000, currency: "USD", reports: 1008597, top_type: "Investment", top_type_local: 8648617756, change_pct: 26, lon: -98, lat: 39, source: "fbi-ic3-2025", reports_source: "fbi-ic3-2025", top_type_source: "fbi-ic3-2025-coverage" },
  { country: "United Kingdom", iso_n3: "826", agency: "UK Finance", year: 2025, losses_local: 1280000000, currency: "GBP", reports: 4060000, top_type: "Investment (authorised push payment)", top_type_local: 221500000, change_pct: 4, lon: -2, lat: 54, source: "ukfinance-2026", reports_source: "ukfinance-2026-cases", top_type_source: "ukfinance-2026" },
  { country: "Australia", iso_n3: "036", agency: "National Anti-Scam Centre (ACCC)", year: 2025, losses_local: 2180000000, currency: "AUD", reports: 481523, top_type: "Investment", top_type_local: 837700000, change_pct: 7.8, lon: 134, lat: -25, source: "accc-2025", reports_source: "accc-2025", top_type_source: "accc-2025-report" },
  { country: "Canada", iso_n3: "124", agency: "Canadian Anti-Fraud Centre", year: 2025, losses_local: 704000000, currency: "CAD", reports: 112000, top_type: "Investment", top_type_local: 351000000, change_pct: null, lon: -100, lat: 57, source: "cafc-2025", reports_source: "cafc-2025", top_type_source: "cafc-2025" },
  { country: "Singapore", iso_n3: "702", agency: "Singapore Police Force", year: 2025, losses_local: 913100000, currency: "SGD", reports: 37308, top_type: "E-commerce (most cases)", top_type_local: null, change_pct: -19, lon: 103.8, lat: 1.35, source: "spf-2025", reports_source: "spf-2025-cases", top_type_source: null },
  { country: "India", iso_n3: "356", agency: "Indian Cyber Crime Coordination Centre (NCRP)", year: 2025, losses_local: 198129600000, currency: "INR", reports: 2177524, top_type: "Not published", top_type_local: null, change_pct: null, lon: 79, lat: 22, source: "i4c-2025", reports_source: "i4c-2025", top_type_source: null },
];

// ---------- GASA national survey estimates ----------
const estimates = [
  { country: "Pakistan", iso_n3: "586", year: 2025, est_local: 9300000000, currency: "USD", lon: 69, lat: 30, source: "gasa-pakistan-2025" },
  { country: "Germany", iso_n3: "276", year: 2025, est_local: 10600000000, currency: "EUR", lon: 10.4, lat: 51, source: "gasa-germany-2025" },
  { country: "Brazil", iso_n3: "076", year: 2025, est_local: 99000000000, currency: "BRL", lon: -52, lat: -10, source: "gasa-brazil-2025" },
  { country: "South Korea", iso_n3: "410", year: 2025, est_local: 1400000000, currency: "USD", lon: 127.8, lat: 36.4, source: "gasa-korea-2025" },
  { country: "Denmark", iso_n3: "208", year: 2026, est_local: 10100000000, currency: "DKK", lon: 9.5, lat: 56, source: "gasa-denmark-2026" },
];

// ---------- GASA Global State of Scams ----------
// Shares are fractions (0.57 = 57%).
const global = [
  { metric: "global_losses", label: "Estimated global losses", value: 442000000000, source: "gasa-global-2025-coverage" },
  { metric: "encountered", label: "Adults who encountered a scam", value: 0.57, source: "gasa-global-2025" },
  { metric: "lost_money", label: "Adults who lost money", value: 0.23, source: "gasa-global-2025" },
  { metric: "confident", label: "Adults confident they can spot a scam", value: 0.73, source: "gasa-global-2025" },
  { metric: "stress", label: "Victims reporting stress", value: 0.69, source: "gasa-global-2025" },
  { metric: "respondents", label: "Survey respondents", value: 46000, source: "gasa-global-2025" },
  { metric: "markets", label: "Markets surveyed", value: 42, source: "gasa-global-2025" },
  { metric: "type_shopping", label: "Shopping", value: 0.54, source: "gasa-global-2025" },
  { metric: "type_investment", label: "Investment", value: 0.48, source: "gasa-global-2025" },
  { metric: "type_unexpected", label: "Unexpected money or prize", value: 0.48, source: "gasa-global-2025" },
];

// ---------- US losses by category ----------
const us_detail = [
  { metric: "ic3_investment", label: "Investment fraud", agency: "FBI IC3", value: 8648617756, source: "fbi-ic3-2025-coverage" },
  { metric: "ic3_bec", label: "Business email compromise", agency: "FBI IC3", value: 3046598558, source: "fbi-ic3-2025-coverage" },
  { metric: "ic3_ai", label: "Complaints referencing AI", agency: "FBI IC3", value: 893346472, source: "fbi-ic3-2025-coverage" },
  { metric: "ftc_total", label: "All fraud reported to the FTC", agency: "FTC", value: 15900000000, source: "ftc-2026-testimony" },
  { metric: "ftc_investment", label: "Investment scams", agency: "FTC", value: 7900000000, source: "ftc-2026-imposters" },
  { metric: "ftc_imposter", label: "Imposter scams", agency: "FTC", value: 3500000000, source: "ftc-2026-imposters" },
];

// ---------- Reporting and recovery ----------
const response = [
  { metric: "uk_reimbursed", label: "UK APP losses reimbursed by banks", value: 0.61, source: "ukfinance-2026", currency: null },
  { metric: "sg_recovered", label: "Singapore losses recovered by police", value: 140500000, currency: "SGD", source: "spf-2025" },
  { metric: "ca_reported_low", label: "Share of Canadian frauds reported (low)", value: 0.05, source: "cafc-2025-release", currency: null },
  { metric: "ca_reported_high", label: "Share of Canadian frauds reported (high)", value: 0.1, source: "cafc-2025-release", currency: null },
  { metric: "gasa_recovered", label: "Victims worldwide who recovered their losses", value: 0.04, source: "gasa-global-2024", currency: null },
];

// ---------- Reported losses by year ----------
const trend = [
  { country: "United States", year: 2021, losses_local: 6900000000, currency: "USD", agency: "FBI IC3", source: "fbi-ic3-2022" },
  { country: "United States", year: 2022, losses_local: 10300000000, currency: "USD", agency: "FBI IC3", source: "fbi-ic3-2022" },
  { country: "United States", year: 2023, losses_local: 12500000000, currency: "USD", agency: "FBI IC3", source: "fbi-ic3-2023" },
  { country: "United States", year: 2024, losses_local: 16600000000, currency: "USD", agency: "FBI IC3", source: "fbi-ic3-2024" },
  { country: "United States", year: 2025, losses_local: 20877000000, currency: "USD", agency: "FBI IC3", source: "fbi-ic3-2025" },
  { country: "United Kingdom", year: 2021, losses_local: 1300000000, currency: "GBP", agency: "UK Finance", source: "ukfinance-2022" },
  { country: "United Kingdom", year: 2022, losses_local: 1200000000, currency: "GBP", agency: "UK Finance", source: "ukfinance-2023" },
  { country: "United Kingdom", year: 2023, losses_local: 1170000000, currency: "GBP", agency: "UK Finance", source: "ukfinance-2024" },
  { country: "United Kingdom", year: 2024, losses_local: 1170000000, currency: "GBP", agency: "UK Finance", source: "ukfinance-2025" },
  { country: "United Kingdom", year: 2025, losses_local: 1280000000, currency: "GBP", agency: "UK Finance", source: "ukfinance-2026" },
  { country: "Australia", year: 2022, losses_local: 3100000000, currency: "AUD", agency: "National Anti-Scam Centre", source: "accc-2025-coverage" },
  { country: "Australia", year: 2023, losses_local: 2740000000, currency: "AUD", agency: "National Anti-Scam Centre", source: "accc-2023" },
  { country: "Australia", year: 2024, losses_local: 2030000000, currency: "AUD", agency: "National Anti-Scam Centre", source: "accc-2025-coverage" },
  { country: "Australia", year: 2025, losses_local: 2180000000, currency: "AUD", agency: "National Anti-Scam Centre", source: "accc-2025" },
  { country: "Singapore", year: 2023, losses_local: 651800000, currency: "SGD", agency: "Singapore Police Force", source: "spf-2024" },
  { country: "Singapore", year: 2024, losses_local: 1100000000, currency: "SGD", agency: "Singapore Police Force", source: "spf-2024" },
  { country: "Singapore", year: 2025, losses_local: 913100000, currency: "SGD", agency: "Singapore Police Force", source: "spf-2025" },
  { country: "Canada", year: 2024, losses_local: 638000000, currency: "CAD", agency: "Canadian Anti-Fraud Centre", source: "cafc-2024" },
  { country: "Canada", year: 2025, losses_local: 704000000, currency: "CAD", agency: "Canadian Anti-Fraud Centre", source: "cafc-2025" },
  { country: "India", year: 2024, losses_local: 228494900000, currency: "INR", agency: "I4C (NCRP)", source: "i4c-2025" },
  { country: "India", year: 2025, losses_local: 198129600000, currency: "INR", agency: "I4C (NCRP)", source: "i4c-2025" },
];

// ---------- GASA survey snapshots ----------
const surveys = [
  { country: "Philippines", encountered: 0.84, est_local: 121800000000, currency: "PHP", source: "gasa-philippines-2026" },
  { country: "United Arab Emirates", encountered: 0.7, est_local: null, currency: "AED", source: "gasa-uae-2026" },
  { country: "Worldwide", encountered: 0.57, est_local: 442000000000, currency: "USD", source: "gasa-global-2025" },
];

// ---------- Exchange rates: IRS yearly averages ----------
// irs_yearly_fx.html is the IRS page saved as HTML. Units of currency per US dollar.
const FX_YEAR = "2025", FX_SOURCE = "irs-fx-2025";
const FX = [["USD", null], ["GBP", "United Kingdom"], ["AUD", "Australia"], ["CAD", "Canada"], ["SGD", "Singapore"], ["EUR", "Euro Zone"], ["BRL", "Brazil"], ["DKK", "Denmark"], ["INR", "India"]];
const irsFile = path.join(RAW, "irs_yearly_fx.html");
if (!fs.existsSync(irsFile)) throw new Error(`Missing ${irsFile}: save https://www.irs.gov/individuals/international-taxpayers/yearly-average-currency-exchange-rates there`);
const cellText = (s) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const table = fs.readFileSync(irsFile, "utf8").match(/<table[\s\S]*?<\/table>/i)?.[0] ?? "";
const years = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => cellText(m[1]));
const col = years.indexOf(FX_YEAR);
if (col < 0) throw new Error(`No ${FX_YEAR} column in the IRS table (headers: ${years.join(", ")})`);
const irsRows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => cellText(c[1]))).filter((r) => r.length);
const fx = FX.map(([currency, country]) => {
  if (!country) return { currency, per_usd: 1, source: FX_SOURCE };
  const r = irsRows.find((x) => x[0] === country);
  const per = Number(r?.[col]);
  if (!r || !isFinite(per) || per <= 0) throw new Error(`No ${FX_YEAR} IRS rate for ${country}`);
  return { currency, per_usd: per, source: FX_SOURCE };
});

// ---------- Checks ----------
for (const [id, recs] of Object.entries({ reported, estimates, global, us_detail, response, trend, surveys, fx }))
  for (const r of recs) for (const k of Object.keys(r)) if (/source$/.test(k) && r[k] != null && !SOURCES[r[k]]) throw new Error(`${id}: unknown source ${r[k]}`);
const rate = Object.fromEntries(fx.map((r) => [r.currency, r.per_usd]));
for (const r of [...reported, ...estimates]) if (!rate[r.currency]) throw new Error(`No exchange rate for ${r.currency} (${r.country})`);

const TABLES = [
  ["estimates", "GASA national estimates", "Survey-based estimates of total scam losses from GASA national reports.", estimates],
  ["fx", `Exchange rates (${FX_YEAR} average)`, `IRS yearly average exchange rates for ${FX_YEAR}, units of currency per US dollar.`, fx],
  ["global", "GASA global survey 2025", "Headline findings of the Global State of Scams 2025 (46,000 adults, 42 markets).", global],
  ["reported", "Reported losses by country", "Scam and fraud losses victims reported to national agencies, latest year, in local currency.", reported],
  ["response", "Reporting and recovery", "Published rates of reporting, reimbursement and recovery.", response],
  ["surveys", "GASA survey snapshots", "Share of adults who encountered a scam, and the loss estimate where published.", surveys],
  ["trend", "Reported losses by year", "Annual reported losses by country, 2021 to 2025, in local currency. Earlier UK and Australian years are rounded headline totals.", trend],
  ["us_detail", "US losses by category", "2025 US loss categories from FBI IC3 and FTC Consumer Sentinel.", us_detail],
];
const csvCell = (v) => (v == null ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
// This dashboard's JSON files have no final newline, as first published; keep it so rebuilds diff cleanly.
const writeJson = (file, o) => fs.writeFileSync(path.join(OUT, file), JSON.stringify(o, null, 2));
for (const [id, title, description, records] of TABLES) {
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];
  fs.writeFileSync(path.join(OUT, `${id}.csv`), [keys.join(","), ...records.map((r) => keys.map((k) => csvCell(r[k])).join(","))].join("\n") + "\n");
  writeJson(`${id}.json`, { id, title, description, records });
}
writeJson("sources.json", { sources: SOURCES });
writeJson("index.json", { variant: "scams", licence: "CC BY 4.0", datasets: TABLES.map(([id, title, description, records]) => ({ id, title, description, rows: records.length })) });
const he = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>scams data · Ledger Monitor</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 16px;color:#0a0a0a;background:#f5f5f1}table{width:100%;border-collapse:collapse}td{padding:10px 8px;border-bottom:1px solid #dadad3;vertical-align:top}small{color:#5c5c57}a{color:#3B50B5}</style>
<h1>scams data</h1><p>Every dataset behind the dashboard. Each row cites a source id listed in <a href="sources.json">sources.json</a>. Licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>: credit "Ledger Monitor" and the original publishers.</p>
<table><tr><th align="left">Dataset</th><th align="left">Rows</th><th align="left">Download</th></tr>${TABLES.map(([id, title, d, rec]) => `<tr><td><b>${he(title)}</b><br><small>${he(d)}</small></td><td>${rec.length}</td><td><a href="${id}.csv">CSV</a> · <a href="${id}.json">JSON</a></td></tr>`).join("")}</table><p><a href="../../index.html">← Back to Ledger Monitor</a></p>`);

const DATA = Object.fromEntries(TABLES.map(([id, , , rec]) => [id, rec]));
fs.writeFileSync(path.join(REPO, "scams/assets/data.js"), `export const SOURCES=${JSON.stringify(SOURCES)};\nexport const DATA=${JSON.stringify(DATA)};\n`);

const usd = (v, c) => Math.round(v / rate[c] / 1e6);
for (const r of reported) console.log(r.country.padEnd(15), r.year, `${r.losses_local} ${r.currency}`, `= US$${usd(r.losses_local, r.currency)}m`, "change", r.change_pct, "src", r.source);
for (const r of estimates) console.log(`GASA ${r.country}`.padEnd(20), r.year, `${r.est_local} ${r.currency}`, `= US$${usd(r.est_local, r.currency)}m`);
console.log("global", global.map((r) => `${r.metric}=${r.value}`).join(" "));
console.log(`fx ${FX_YEAR}`, fx.map((r) => `${r.currency} ${r.per_usd}`).join(", "));
