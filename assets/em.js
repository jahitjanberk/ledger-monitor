// Economy Monitor: shared UX polish for every dashboard.
// Works from the markup the dashboards render, so it needs no changes to them:
//   1. a sticky section index with the current section highlighted; links like
//      air/#deaths open at that section, and each section heading can copy its link
//   2. a hover tooltip naming the source of a cited number
//   3. wide tables get a sticky first column, an edge fade and a "scroll for more" hint
//   4. a data line under the intro (newest source date, download link) and, at the end
//      of each section, the CSV files behind it
//   5. accessibility repairs: names for unlabelled chart segments, and charts that hold
//      buttons exposed as groups so screen readers can reach the buttons
//   6. links to the other dashboards after the method section
//   7. on phones, the Internet latency matrix folds away behind the region picker
//   8. in the method section, how citations work and what the dashboard leaves out; an About link in the footer
//   9. an annotated chart beside the headline, drawn from the published data

const SITE = new URL("../", import.meta.url);
const DASH = location.pathname.slice(SITE.pathname.length).split("/")[0];

// Which published datasets (data/<dashboard>/<id>.csv) each section draws on.
const SECTION_DATA = {
  air: { glance: ["facts", "world_pm25"], map: ["countries", "bands"], deaths: ["world_deaths"], where: ["regions", "countries"], monitors: ["facts"], uk: ["countries"], table: ["countries"] },
  chokepoints: { glance: ["facts", "summary"], map: ["chokepoints"], weekly: ["weekly", "daily"], types: ["summary", "daily"], oil: ["oil"], ripple: ["weekly", "summary"], table: ["chokepoints"] },
  debt: { glance: ["countries", "groups", "facts"], map: ["countries", "bands"], services: ["countries", "facts"], trend: ["groups"], squeeze: ["facts"], uk: ["uk_interest", "uk_debt", "countries"], table: ["countries"] },
  electricity: { glance: ["facts"], map: ["countries", "bands"], mix: ["world"], regions: ["regions"], rank: ["countries"], uk: ["uk"], y2025: ["facts"], table: ["countries"] },
  food: { glance: ["world", "prices"], map: ["countries", "bands"], prices: ["prices", "prices_real"], hormuz: ["inputs", "facts"], hunger: ["world", "regions", "countries"], crises: ["facts"], spending: ["countries"], uk: ["uk", "facts"], table: ["countries"] },
  heat: { glance: ["facts"], map: ["countries", "bands"], warming: ["global", "daily", "era5_years", "facts"], hotdays: ["countries"], health: ["facts"], uk: ["uk_summers", "facts"], table: ["countries"] },
  housing: { glance: ["nations", "ratings"], map: ["markets"], calc: ["markets", "nations"], dist: ["markets", "ratings"], uk: ["uk_ons"], risk: ["bubble"], table: ["markets"] },
  internet: { map: ["cables", "landings", "cloud_regions", "supercomputers"], profile: ["landings", "cables"], latency: ["azure_latency"], owners: ["cables"], cloud: ["cloud_regions", "landings"], compute: ["ai_compute", "top500_countries", "supercomputers", "ai_clusters"], power: ["energy"], water: ["water"], cables: ["cables", "cables_now"] },
  minerals: { glance: ["minerals", "refining", "facts", "tariff_codes"], map: ["production", "bands"], refining: ["minerals", "refining", "top_refiner", "facts"], prices: ["metals", "prices", "facts"], controls: ["controls", "facts"], people: ["facts"], uk: ["facts"], table: ["minerals", "prices"] },
  orbit: { glance: ["facts"], map: ["launchers"], years: ["yearly"], orbits: ["orbits", "leo"], junk: ["leo", "facts"], orgs: ["launchers"], table: ["launchers"] },
  scams: { glance: ["global", "estimates"], map: ["reported", "surveys"], trend: ["trend"], how: ["reported", "global"], gap: ["response", "estimates"], us: ["us_detail"], table: ["reported", "fx"] },
  water: { glance: ["facts"], map: ["stress", "bands"], regions: ["regions", "trend"], drinking: ["drinking", "ladder", "income"], hidden: ["resources", "facts"], compute: ["facts"], table: ["stress", "sectors"] },
};

const DASHBOARDS = {
  internet: { title: "Where the Internet Lives", blurb: "Submarine cables, cloud regions and the computers behind AI." },
  housing: { title: "Housing Affordability", blurb: "What homes cost against what people earn, in 96 markets." },
  scams: { title: "The Scam Economy", blurb: "Money lost to scams, as reported to authorities and estimated by surveys." },
  water: { title: "Water Stress", blurb: "How much of their renewable freshwater countries withdraw." },
  electricity: { title: "Electricity Mix & Grid Carbon", blurb: "How clean each country's electricity is, and how fast it is changing." },
  chokepoints: { title: "Chokepoints", blurb: "Ships and oil through the world's narrow sea routes." },
  orbit: { title: "Who Owns Orbit", blurb: "Who launches objects into space, and what is up there now." },
  air: { title: "The Air We Breathe", blurb: "Fine-particle pollution and the deaths it causes, country by country." },
  food: { title: "Food Prices & Hunger", blurb: "Who goes hungry, who can afford a healthy diet, and what food costs." },
  heat: { title: "Extreme Heat", blurb: "How hot the world is getting, and what heat costs in lives and work." },
  minerals: { title: "Critical Minerals", blurb: "Where battery and electronics minerals are mined and refined, and who controls them." },
  debt: { title: "Debt vs Public Services", blurb: "What governments pay in interest, against what they spend on health and education." },
};
// Three other dashboards per page, picked for overlapping subjects where there is one.
const MORE = {
  air: ["electricity", "water", "chokepoints"],
  electricity: ["air", "internet", "chokepoints"],
  internet: ["electricity", "water", "orbit"],
  water: ["internet", "air", "electricity"],
  chokepoints: ["food", "electricity", "internet"],
  orbit: ["internet", "chokepoints", "air"],
  housing: ["food", "scams", "water"],
  food: ["chokepoints", "water", "housing"],
  debt: ["food", "housing", "scams"],
  heat: ["food", "air", "electricity"],
  minerals: ["chokepoints", "electricity", "internet"],
  scams: ["housing", "internet", "chokepoints"],
};

const AUTHOR = { name: "jahitjanberk", url: "https://github.com/jahitjanberk" };
// The date these pages were last changed. Bump it with each release.
const UPDATED = "2026-11-06";

// What each dashboard leaves out, drawn from its method notes. Shown in the method section.
const LIMITS = {
  air: [
    "Exposure is a yearly average, so short spikes such as smoke episodes don't show.",
    "Desert dust and wildfire smoke count alongside human pollution, which is why some desert countries rank high.",
    "Deaths are modelled from exposure and the risk of disease at each level. They are not counted from death certificates.",
    "City monitors measure the air where they sit, so their readings can't be compared directly with national averages.",
  ],
  food: [
    "Undernourishment is modelled from food supply and consumption surveys, not counted person by person. Country figures are three-year averages, so a sudden crisis shows only gradually.",
    "A healthy diet is priced at the cheapest foods that meet dietary guidelines. People rarely buy exactly that, so real food bills run higher.",
    "Food inflation is each country's latest month, mostly June 2026. A few readings are extreme, such as Iran's +130% and Palestine's −67%; they are as published by FAOSTAT.",
    "Acute food insecurity covers only the countries the Global Report on Food Crises analyses, so it can't be added to the undernourishment figures.",
  ],
  debt: [
    "Interest is net of interest received, and for 2025 many values are IMF estimates rather than final accounts.",
    "Health and education spending are each country's latest year, mostly 2023, set against 2025 interest. Health counts government money only, not aid or private spending.",
    "General government covers central, state and local government; debts of state-owned companies are left out.",
    "UK interest is central government only, against receipts for the whole public sector.",
  ],
  heat: [
    "Country warming is measured against each country's own 1991–2020 average, not pre-industrial times, so it understates the total warming since the 1800s.",
    "Days above 35°C are averaged over each country's whole area, so large countries with cool regions score lower than their hottest cities.",
    "Air temperature alone misses humidity, which makes heat far more dangerous to the body.",
    "Heat deaths are statistical estimates; heat is seldom recorded as a cause of death.",
  ],
  minerals: [
    "Mining shares are calculated from USGS's rounded world totals, so they can differ by a point or two from shares USGS quotes in its text.",
    "Refining shares cover seven minerals for 2025; the twenty-mineral comparison uses the latest year available for each, which varies.",
    "Export controls change quickly. Their status here is as of 6 November 2026, and two Chinese suspensions end later that month.",
    "The child labour estimate dates from 2014 and covers all mines in southern DR Congo, not cobalt alone.",
  ],
  chokepoints: [
    "Ships that switch off their transponders are missed, and PortWatch revises past days as more signals arrive.",
    "Daily counts cover four chokepoints only: Hormuz, Bab el-Mandeb, Suez and the Cape of Good Hope.",
    "Ship counts don't say what a ship carried. Oil flows are the EIA's estimates, last updated in March 2026.",
  ],
  electricity: [
    "Carbon is counted where electricity is generated, not where it is used, so imports and exports are left out.",
    "Only 90 countries have 2025 figures so far; the rest show 2024.",
    "Electricity is only part of energy use. A clean grid says nothing about heating, transport or industrial fuel.",
  ],
  housing: [
    "It measures the price of buying a home against income. Rents and mortgage rates don't appear.",
    "Each market is a whole metropolitan area, so city centres can be far less affordable than the figure.",
    "The ONS ratio uses one worker's earnings rather than household income, so it can't be compared directly with Demographia's.",
  ],
  internet: [
    "Cable routes come from a January 2021 snapshot, so newer cables are missing, and routes are stylised rather than exact seabed paths.",
    "Cloud regions are areas, not buildings. Each is plotted at a representative city.",
    "Latency figures come from Azure's own network; other networks will differ.",
  ],
  orbit: [
    "Launch counts include satellites, probes and station parts, not rocket bodies or debris.",
    "Objects count for the state that registered them, usually the owner's home country, not where they were built or launched.",
    "Some objects are registered late, so recent years can still rise. Debris smaller than about 10 cm is mostly not tracked.",
  ],
  scams: [
    "Reported losses only include what victims told an agency, so they undercount real harm.",
    "Survey estimates scale up what a sample of adults say they lost. They run much higher and can't be compared one to one with reported figures.",
    "Each agency counts differently, so national totals aren't strictly comparable.",
  ],
  water: [
    "Country figures hide differences between river basins: a country can be unstressed overall and short of water in one region.",
    "Several countries report the same value for several years, so change over time can look flatter than it is.",
    "Data centre water figures cover the United States only.",
  ],
};

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const prettyDate = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
};

// The chart beside each headline: one annotated figure per dashboard, drawn as SVG at
// the width it gets, so labels stay 12px on any screen. `draw` receives the records of
// each file in `files` (data/<dashboard>/<file>.json), the width and the height.
const fx = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
const T = (x, y, s, cls = "", anchor = "start") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ""}>${esc(s)}</text>`;
const Ln = (x1, y1, x2, y2, cls) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}"/>`;
const num = (v, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const MUTE = "color-mix(in srgb, var(--em-fg) 18%, transparent)";
const columns = (vals, w, y, base, colour) => {
  const bw = w / vals.length;
  return vals.map((v, i) => `<rect x="${(i * bw).toFixed(1)}" y="${y(v).toFixed(1)}" width="${Math.max(0.8, bw - (bw > 4 ? 1 : 0.3)).toFixed(1)}" height="${Math.max(1, base - y(v)).toFixed(1)}" fill="${colour(v, i)}"/>`).join("");
};
const FIGS = {
  air: {
    files: ["world_pm25"], title: "World average exposure to fine particles, µg/m³",
    source: "Washington University in St. Louis (SatPM), via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const x = fx(a.year, z.year, 0, w), y = fx(0, 35, base, 26), g = y(5);
      const pts = rows.map((r) => [x(r.year), y(r.pm25)]);
      return {
        label: `World average PM2.5 went from ${a.pm25} µg/m³ in ${a.year} to ${z.pm25} in ${z.year}. The WHO guideline is 5.`,
        svg: `<path d="${pathOf(pts)}L${w},${g}L0,${g}Z" fill="var(--em-accent)" opacity=".14"/>`
          + Ln(0, g, w, g, "rule") + T(0, g + 15, "WHO guideline: 5")
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, pts[0][1] + 18, `${a.pm25} in ${a.year}`)
          + Ln(w, 17, w, pts.at(-1)[1] - 4, "lead") + T(w, 12, `${z.pm25} in ${z.year}, ${Math.round(z.pm25 / 5)} times the guideline`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  food: {
    files: ["world"], title: "People undernourished worldwide, millions",
    source: "FAO, The State of Food Security and Nutrition in the World 2026, via FAOSTAT",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const low = rows.reduce((p, r) => (r.undernourished_m < p.undernourished_m ? r : p));
      const peak = rows.filter((r) => r.year > low.year).reduce((p, r) => (r.undernourished_m > p.undernourished_m ? r : p));
      const x = fx(a.year, z.year, 0, w), y = fx(0, 1000, base, 4);
      const pts = rows.map((r) => [x(r.year), y(r.undernourished_m)]);
      const xl = x(low.year), xp = x(peak.year);
      return {
        label: `Undernourished people: ${num(a.undernourished_m)} million in ${a.year}, a low of ${num(low.undernourished_m)} million in ${low.year}, ${num(peak.undernourished_m)} million in ${peak.year} and ${num(z.undernourished_m)} million in ${z.year}.`,
        svg: `<path d="${pathOf(pts)}L${w},${base}L0,${base}Z" fill="var(--em-accent)" opacity=".14"/>`
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, pts[0][1] - 8, `${num(a.undernourished_m)}m in ${a.year}`)
          + Ln(xl, y(low.undernourished_m) + 4, xl, base - 22, "lead") + T(xl, base - 10, `Low: ${num(low.undernourished_m)}m in ${low.year}`, "", "middle")
          + T(xp, y(peak.undernourished_m) - 22, `${num(peak.undernourished_m)}m in ${peak.year}`, "", "end")
          + T(w, y(z.undernourished_m) - 8, `${num(z.undernourished_m)}m in ${z.year}`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  heat: {
    files: ["global"], title: "Global temperature against 1850–1900, °C",
    source: "Met Office Hadley Centre and UEA, HadCRUT5",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20, top = rows.reduce((p, r) => (r.anomaly_preindustrial > p.anomaly_preindustrial ? r : p));
      const x = fx(a.year, z.year, 0, w), y = fx(-0.4, 1.8, base, 4), g = y(1.5);
      const pts = rows.map((r) => [x(r.year), y(r.anomaly_preindustrial)]);
      const sg = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}°C`;
      return {
        label: `Global temperature against 1850–1900: ${sg(a.anomaly_preindustrial)} in ${a.year}, ${sg(top.anomaly_preindustrial)} in ${top.year}, the warmest year, and ${sg(z.anomaly_preindustrial)} in ${z.year}.`,
        svg: Ln(0, g, w, g, "rule") + T(0, g - 6, "1.5°C")
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, y(0) + 24, `${a.year}: ${sg(a.anomaly_preindustrial)}`)
          + T(x(top.year) - 6, y(top.anomaly_preindustrial) + 4, `${top.year}: ${sg(top.anomaly_preindustrial)}`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  minerals: {
    files: ["minerals"], title: "Share of world mine production held by the top country, 2025",
    source: "USGS Mineral Commodity Summaries 2026", height: 244,
    draw([rows], w) {
      const r = rows.filter((c) => c.top_share != null).sort((a, b) => b.top_share - a.top_share).slice(0, 8);
      const x = fx(0, 100, 0, w), row = 30;
      const nm = (c) => (c === "Democratic Republic of Congo" ? "DR Congo" : c);
      return {
        label: `The top country's share of world mine production in 2025: ${r.map((c) => `${c.label} ${nm(c.top_country)} ${num(c.top_share, 0)}%`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, `${c.label}: ${nm(c.top_country)}`, i ? "" : "k") + T(w, top + 12, `${num(c.top_share, 0)}%`, "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.top_share).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
  housing: {
    files: ["markets"], title: "Years of income for a median-priced home, by market",
    source: "Demographia International Housing Affordability 2026, Chapman University",
    draw([rows], w, h) {
      const r = [...rows].sort((a, b) => a.median_multiple - b.median_multiple);
      const lo = r[0], hi = r.at(-1), base = h - 20;
      const y = fx(0, Math.ceil(hi.median_multiple), base, 4), a = y(3);
      const ok = r.filter((m) => m.median_multiple <= 3).length;
      return {
        label: `${r.length} markets, from ${lo.median_multiple} years of income in ${lo.market} to ${hi.median_multiple} in ${hi.market}. ${ok || "None"} ${ok === 1 ? "is" : "are"} under the affordable line of 3.0.`,
        svg: columns(r.map((m) => m.median_multiple), w, y, base, (_, i) => (i === r.length - 1 ? "var(--em-accent)" : MUTE))
          + Ln(0, a, w, a, "rule")
          + T(0, 14, "Dashed line: affordable, 3.0 or less")
          + T(0, 30, ok ? `${ok} of ${r.length} markets qualify` : `None of the ${r.length} markets qualifies`, "k")
          + Ln(0, base, w, base, "ax")
          + T(0, h - 4, `${lo.market.split(",")[0]}: ${lo.median_multiple}`) + T(w, h - 4, `${hi.market}: ${hi.median_multiple}`, "k", "end"),
      };
    },
  },
  water: {
    files: ["stress"], title: "Freshwater withdrawn as a share of what is available, by country",
    source: "FAO, SDG indicator 6.4.2, via Our World in Data",
    draw([rows], w, h) {
      const r = rows.filter((d) => d.stress_pct != null).sort((a, b) => a.stress_pct - b.stress_pct);
      const hi = r.at(-1), over = r.filter((d) => d.stress_pct > 100).length, base = h - 20, cap = 200;
      const y = fx(0, cap, base, 4), a = y(100);
      return {
        label: `${r.length} countries by water stress. ${over} withdraw more than 100% of their renewable freshwater; ${hi.country} withdraws ${num(hi.stress_pct)}%.`,
        svg: columns(r.map((d) => Math.min(d.stress_pct, cap)), w, y, base, (v) => (v > 100 ? "var(--em-accent)" : MUTE))
          + Ln(0, a, w, a, "rule")
          + T(0, 14, "Dashed line: 100%, all of it")
          + T(0, 30, `${over} countries use more than they have`, "k")
          + Ln(0, base, w, base, "ax")
          + T(0, h - 4, "Least stressed") + T(w, h - 4, `${hi.country}: ${num(hi.stress_pct)}% (bar cut off)`, "k", "end"),
      };
    },
  },
  electricity: {
    files: ["world"], title: "Share of world electricity, renewables against coal",
    source: "Ember, Yearly Electricity Data, via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const x = fx(a.year, z.year, 0, w), y = fx(0, 45, base, 4);
      const line = (k, colour) => `<path d="${pathOf(rows.map((r) => [x(r.year), y(r[k])]))}" fill="none" stroke="${colour}" stroke-width="2" stroke-linejoin="round"/>`;
      const zy = y(z.renewables_pct);
      return {
        label: `Renewables went from ${num(a.renewables_pct, 1)}% of world electricity in ${a.year} to ${num(z.renewables_pct, 1)}% in ${z.year}; coal from ${num(a.coal_pct, 1)}% to ${num(z.coal_pct, 1)}%.`,
        svg: line("coal_pct", "color-mix(in srgb, var(--em-fg) 45%, transparent)") + line("renewables_pct", "var(--em-accent)")
          + T(0, y(a.coal_pct) - 8, `Coal ${num(a.coal_pct, 1)}%`) + T(0, y(a.renewables_pct) + 18, `Renewables ${num(a.renewables_pct, 1)}%`)
          + Ln(w, 18, w, zy - 6, "lead") + `<circle cx="${w}" cy="${zy.toFixed(1)}" r="3.5" fill="var(--em-accent)"/>`
          + T(w, 13, `${z.year}: renewables ${num(z.renewables_pct, 1)}%, coal ${num(z.coal_pct, 1)}%`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  chokepoints: {
    files: ["weekly", "daily"], title: "Ships a day through the Strait of Hormuz, weekly average",
    source: "IMF PortWatch, from satellite ship tracking",
    draw([weekly, daily], w, h) {
      const H = (r) => r.chokepoint === "Strait of Hormuz";
      const wk = weekly.filter(H).sort((a, b) => a.week.localeCompare(b.week));
      const dy = daily.filter(H);
      const CLOSED = "2026-03-02";
      const mean = (rs) => rs.reduce((s, r) => s + r.transits, 0) / rs.length;
      const before = mean(dy.filter((r) => r.date < "2026-01-01")), after = mean(dy.filter((r) => r.date >= CLOSED));
      const t = (d) => Date.parse(d), base = h - 20;
      const x = fx(t(wk[0].week), t(wk.at(-1).week), 0, w);
      const y = fx(0, Math.ceil((Math.max(...wk.map((r) => r.transits)) * 1.3) / 10) * 10, base, 4);
      const pts = wk.map((r) => [x(t(r.week)), y(r.transits)]), xc = x(t(CLOSED));
      const mon = (d) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
      return {
        label: `Ships through the Strait of Hormuz averaged ${num(before, 1)} a day in 2025 and ${num(after, 1)} a day after it closed on 2 March 2026.`,
        svg: `<path d="${pathOf(pts)}L${pts.at(-1)[0]},${base}L0,${base}Z" fill="var(--em-accent)" opacity=".14"/>`
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + Ln(xc, 4, xc, base, "rule") + T(xc + 6, 14, "Closed 2 Mar 2026", "k")
          + T(0, 14, `${num(before, 1)} a day in 2025`)
          + T(xc + 6, 30, `${num(after, 1)} a day since`)
          + Ln(0, base, w, base, "ax") + T(0, h - 4, mon(wk[0].week), "n") + T(w, h - 4, mon(wk.at(-1).week), "n", "end"),
      };
    },
  },
  orbit: {
    files: ["yearly"], title: "Objects launched into space each year, the United States in colour",
    source: "UN Office for Outer Space Affairs, via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20, max = Math.max(...rows.map((r) => r.world));
      const y = fx(0, max, base, 4), bw = w / rows.length;
      const s = rows.find((r) => r.year === 2019), xs = rows.indexOf(s) * bw + bw / 2;
      return {
        label: `Objects launched per year, ${a.year} to ${z.year}. ${num(z.world)} were launched in ${z.year}, ${Math.round((100 * z.united_states) / z.world)}% of them by the United States.`,
        svg: columns(rows.map((r) => r.world), w, y, base, () => MUTE) + columns(rows.map((r) => r.united_states), w, y, base, () => "var(--em-accent)")
          + Ln(xs, y(s.world) - 4, xs, y(max * 0.42) + 4, "lead") + T(xs + 4, y(max * 0.42) - 2, "2019: first Starlink batch", "", "end")
          + T(w - bw - 4, 14, `${num(z.world)} in ${z.year}`, "k", "end")
          + T(w - bw - 4, 30, `${Math.round((100 * z.united_states) / z.world)}% from the US`, "", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  scams: {
    files: ["trend"], title: "Losses reported to the FBI's Internet Crime Complaint Center",
    source: "FBI IC3 annual reports",
    draw([rows], w, h) {
      const r = rows.filter((d) => d.country === "United States").sort((a, b) => a.year - b.year);
      const base = h - 20, max = Math.max(...r.map((d) => d.losses_local));
      const y = fx(0, max, base, 22), bw = w / r.length, gap = Math.min(18, bw * 0.25);
      const bn = (v) => `$${(v / 1e9).toFixed(1)}bn`;
      return {
        label: `US losses reported to the FBI, ${r.map((d) => `${d.year} ${bn(d.losses_local)}`).join(", ")}.`,
        svg: r.map((d, i) => {
          const x0 = i * bw + gap / 2, top = y(d.losses_local), last = i === r.length - 1;
          return `<rect x="${x0.toFixed(1)}" y="${top.toFixed(1)}" width="${(bw - gap).toFixed(1)}" height="${(base - top).toFixed(1)}" fill="${last ? "var(--em-accent)" : MUTE}"/>`
            + T(x0 + (bw - gap) / 2, top - 6, bn(d.losses_local), last ? "k" : "", "middle")
            + T(x0 + (bw - gap) / 2, h - 4, d.year, "n", "middle");
        }).join("") + Ln(0, base, w, base, "ax"),
      };
    },
  },
  debt: {
    files: ["countries"], title: "Share of government revenue spent on net interest, 2025",
    source: "IMF Fiscal Monitor, October 2026", height: 244,
    draw([rows], w) {
      const r = rows.filter((c) => c.interest_pct_revenue != null).sort((a, b) => b.interest_pct_revenue - a.interest_pct_revenue).slice(0, 8);
      const x = fx(0, r[0].interest_pct_revenue, 0, w), row = 30;
      return {
        label: `The largest shares of revenue spent on net interest in 2025: ${r.map((c) => `${c.country} ${num(c.interest_pct_revenue, 1)}%`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, c.country, i ? "" : "k") + T(w, top + 12, `${num(c.interest_pct_revenue, 0)}%`, "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.interest_pct_revenue).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
  internet: {
    files: ["cables"], title: "The longest submarine cable systems, km",
    source: "TeleGeography Submarine Cable Map, January 2021 snapshot", height: 244,
    draw([rows], w) {
      const r = [...rows].sort((a, b) => b.length_km - a.length_km).slice(0, 8);
      const x = fx(0, r[0].length_km, 0, w), row = 30;
      return {
        label: `The longest cable systems in the 2021 snapshot: ${r.map((c) => `${c.name} ${num(c.length_km)} km`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, c.name.replace(/\s*\(.*\)\s*$/, ""), i ? "" : "k") + T(w, top + 12, num(c.length_km), "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.length_km).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
};

// Print in the light theme whatever the screen uses, so dark-mode readers don't print
// light text on white paper. The page's own theme comes back afterwards.
{
  const root = document.documentElement;
  let saved = null, swapped = false;
  addEventListener("beforeprint", () => { saved = root.dataset.theme ?? null; swapped = true; root.dataset.theme = "light"; });
  addEventListener("afterprint", () => {
    if (!swapped) return;
    swapped = false;
    if (saved) root.dataset.theme = saved; else delete root.dataset.theme;
  });
}

function whenMounted(cb) {
  const ready = () => document.querySelector("#em-main .em-head");
  if (ready()) return cb();
  const mo = new MutationObserver(() => { if (ready()) { mo.disconnect(); cb(); } });
  mo.observe(document.getElementById("app"), { childList: true, subtree: true });
}

whenMounted(() => {
  const main = document.getElementById("em-main");
  const dashView = () => main.querySelector('.em-view[data-view="dashboard"]') ?? main;
  const inDashboard = () => !dashView().hidden;

  /* ---------- 1. Section index ---------- */
  const sections = [...dashView().querySelectorAll(":scope > .em-sec, :scope > .em-method")].filter((s) => s.querySelector(".em-eyebrow"));
  let toc = null;
  if (sections.length >= 3) {
    toc = document.createElement("nav");
    toc.className = "em-toc";
    toc.setAttribute("aria-label", "Sections");
    const ol = document.createElement("ol");
    sections.forEach((sec, i) => {
      if (!sec.id) sec.id = `sec-${i + 1}`;
      const eb = sec.querySelector(".em-eyebrow");
      const num = eb.querySelector(".num")?.textContent.trim() ?? String(i + 1).padStart(2, "0");
      const label = [...eb.childNodes].filter((n) => !(n.nodeType === 1 && n.classList.contains("num"))).map((n) => n.textContent).join("").trim();
      const li = document.createElement("li");
      li.style.display = "contents";
      const a = document.createElement("a");
      a.href = `#${sec.id}`;
      a.dataset.target = sec.id;
      a.innerHTML = `<span class="n"></span><span class="l"></span>`;
      a.querySelector(".n").textContent = num;
      a.querySelector(".l").textContent = label;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        // Keep the section in the address bar so the URL can be shared.
        history.replaceState(null, "", `${location.pathname}${location.search}#${sec.id}`);
      });
      li.append(a);
      ol.append(li);
    });
    toc.append(ol);
    main.querySelector(".em-head").after(toc);

    const links = [...ol.querySelectorAll("a")];
    let current = null, raf = 0;
    const spy = () => {
      raf = 0;
      toc.hidden = !inDashboard();
      if (toc.hidden) return;
      // A section counts as current once its heading passes the top third of the screen.
      const line = Math.max(toc.getBoundingClientRect().bottom + 24, innerHeight * 0.33);
      let idx = -1;
      sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) idx = i; });
      const next = idx >= 0 ? links[idx] : null;
      if (next === current) return;
      current?.removeAttribute("aria-current");
      current = next;
      if (!current) return;
      current.setAttribute("aria-current", "true");
      // Keep the active item visible inside the horizontally scrolling index.
      const l = current.offsetLeft, r = l + current.offsetWidth;
      if (l < ol.scrollLeft || r > ol.scrollLeft + ol.clientWidth) ol.scrollTo({ left: l - 16, behavior: "smooth" });
    };
    const fade = () => toc.classList.toggle("more-right", ol.scrollLeft + ol.clientWidth < ol.scrollWidth - 4);
    ol.addEventListener("scroll", fade, { passive: true });
    addEventListener("resize", fade);
    fade();
    const schedule = () => { if (!raf) raf = requestAnimationFrame(spy); };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    // View switches (Dashboard / Story) toggle `hidden` on the views.
    new MutationObserver(schedule).observe(main, { attributes: true, attributeFilter: ["hidden"], subtree: true });
    spy();

    // Each section heading gets a button that copies a link straight to it.
    sections.forEach((sec) => {
      const eb = sec.querySelector(".em-eyebrow");
      const label = eb.textContent.replace(/^\d+/, "").trim();
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "em-seclink";
      btn.textContent = "Copy link";
      btn.setAttribute("aria-label", `Copy link to section: ${label}`);
      btn.addEventListener("click", async () => {
        const url = new URL(location.href);
        url.hash = sec.id;
        history.replaceState(null, "", url);
        let ok = false;
        try { await navigator.clipboard.writeText(url.href); ok = true; } catch { /* clipboard blocked: the address bar now holds the link */ }
        btn.textContent = ok ? "Copied" : "Link in address bar";
        setTimeout(() => { btn.textContent = "Copy link"; }, 1800);
      });
      eb.append(btn);
    });
  }

  // Open at the section named in the URL (e.g. air/#deaths). Dashboards lay out after
  // data and fonts load, so scroll once now and again once the layout has settled.
  const target = location.hash.length > 1 && dashView().querySelector(`:scope > [id="${CSS.escape(location.hash.slice(1))}"]`);
  if (target && inDashboard()) {
    const go = () => target.scrollIntoView({ block: "start" });
    requestAnimationFrame(go);
    document.fonts?.ready.then(() => setTimeout(go, 300));
  }

  /* ---------- 2. Source tooltip ---------- */
  // How citations work is explained once, in the method section (see 8), rather than
  // in a box under every headline.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const tip = document.createElement("div");
    tip.className = "em-tip";
    tip.hidden = true;
    tip.setAttribute("role", "tooltip");
    document.body.append(tip);
    const describe = (ids) => {
      const id = ids[0];
      const chip = [...document.querySelectorAll(".em-cite[data-src]")].find((c) => c.dataset.src === id);
      const more = ids.length > 1 ? ` <span>+${ids.length - 1} more</span>` : "";
      if (!chip) return `Select to see the source${more}`;
      const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
      return `Source: ${esc(chip.textContent.trim())}${more}<br><span>${esc(chip.title || "")}</span>`;
    };
    document.addEventListener("pointerover", (e) => {
      const el = e.target.closest?.("[data-src]");
      if (!el || el.matches(".em-cite") || el.closest(".em-drawer, .em-cites")) return;
      tip.innerHTML = describe(el.dataset.src.split(" "));
      tip.hidden = false;
      const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - 8);
      const top = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    });
    document.addEventListener("pointerout", (e) => { if (e.target.closest?.("[data-src]")) tip.hidden = true; });
    addEventListener("scroll", () => { tip.hidden = true; }, { passive: true });
  }

  /* ---------- 3. Wide tables ---------- */
  const scrollerFor = (table) => {
    for (let el = table.parentElement; el && el !== main; el = el.parentElement) {
      const ox = getComputedStyle(el).overflowX;
      if (ox === "auto" || ox === "scroll") return el;
    }
    if (table.scrollWidth <= table.parentElement.clientWidth + 1) return null;
    const wrap = document.createElement("div");
    wrap.className = "em-xs";
    table.before(wrap);
    wrap.append(table);
    return wrap;
  };
  const tracked = new Set();
  const update = (sc) => {
    const wide = sc.scrollWidth > sc.clientWidth + 1;
    sc.classList.toggle("em-xscroll", wide);
    sc.classList.toggle("more-right", wide && sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4);
    sc.previousElementSibling?.classList.contains("em-xs-hint") && sc.previousElementSibling.classList.toggle("on", wide && sc.scrollLeft < 4);
  };
  const scan = () => {
    main.querySelectorAll("table").forEach((table) => {
      if (!table.offsetParent) return; // hidden view
      const sc = scrollerFor(table);
      if (!sc || tracked.has(sc)) { if (sc) update(sc); return; }
      tracked.add(sc);
      const hint = document.createElement("p");
      hint.className = "em-xs-hint";
      hint.setAttribute("aria-hidden", "true");
      hint.textContent = "Scroll sideways for more →";
      sc.before(hint);
      sc.addEventListener("scroll", () => update(sc), { passive: true });
      update(sc);
    });
  };
  let t = 0;
  const later = () => { clearTimeout(t); t = setTimeout(scan, 150); };
  addEventListener("resize", later);
  new MutationObserver(later).observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  scan();

  /* ---------- 4. Data line and per-section downloads ---------- */
  const dataDir = new URL(`data/${DASH}/`, SITE);
  if (SECTION_DATA[DASH]) {
    const head = main.querySelector(".em-head");
    const line = document.createElement("p");
    line.className = "em-dataline";
    line.innerHTML = `<a href="${dataDir}index.html">Download the data</a>`;
    (head.querySelector(".em-lede") ?? head.lastElementChild).after(line);
    const by = document.createElement("p");
    by.className = "em-byline";
    by.innerHTML = `By <a href="${AUTHOR.url}" rel="author">${esc(AUTHOR.name)}</a> · page updated ${esc(prettyDate(UPDATED))} · <a href="${new URL("about/", SITE)}">About this project</a>`;
    line.after(by);
    Promise.all([fetch(new URL("index.json", dataDir)).then((r) => r.json()), fetch(new URL("sources.json", dataDir)).then((r) => r.json())])
      .then(([index, { sources }]) => {
        const newest = Object.values(sources).map((s) => String(s.published ?? "")).filter(Boolean).sort().at(-1);
        const n = index.datasets.length;
        line.innerHTML = `Newest source published <b>${esc(prettyDate(newest))}</b> · ${n} datasets, ${esc(index.licence ?? "")} · <a href="${dataDir}index.html">Download the data</a>`;
        const titles = Object.fromEntries(index.datasets.map((d) => [d.id, d.title]));
        for (const [secId, ids] of Object.entries(SECTION_DATA[DASH])) {
          const sec = dashView().querySelector(`:scope > [id="${secId}"]`);
          const files = ids.filter((id) => titles[id]);
          if (!sec || !files.length) continue;
          const p = document.createElement("p");
          p.className = "em-secdata";
          p.innerHTML = `<span>Data for this section</span> ` + files.map((id) => `<a href="${dataDir}${id}.csv" download title="${esc(titles[id])}">${esc(id)}.csv</a>`).join("");
          sec.append(p);
        }
      })
      .catch(() => { /* offline or data missing: the plain download link stays */ });
  }

  /* ---------- 5. Accessibility repairs ---------- */
  const repair = () => {
    // A role="img" hides its children from screen readers, which strands the source
    // buttons inside some stacked bars. Expose those charts as labelled groups instead.
    main.querySelectorAll('[role="img"]').forEach((fig) => {
      const btns = [...fig.querySelectorAll('[role="button"], button')];
      if (!btns.length) return;
      fig.setAttribute("role", "group");
      // The chart label lists the segments in order ("Coal 0.1%, Gas 31.1%, ..."):
      // when the counts match, name each segment after its part of the label.
      const parts = (fig.getAttribute("aria-label") ?? "").split(/,\s+(?=\D)/);
      btns.forEach((b, i) => {
        if (b.getAttribute("aria-label")) return;
        const name = parts.length === btns.length ? parts[i] : b.title || b.textContent.trim();
        b.setAttribute("aria-label", `${name || "Segment " + (i + 1)}: show source`);
      });
    });
    main.querySelectorAll('[data-src][role="button"]').forEach((b) => {
      if (!b.getAttribute("aria-label") && !b.textContent.trim()) b.setAttribute("aria-label", b.title || "Show source");
    });
  };
  repair();
  let rt = 0;
  new MutationObserver(() => { clearTimeout(rt); rt = setTimeout(repair, 200); }).observe(main, { childList: true, subtree: true });

  /* ---------- 6. More dashboards ---------- */
  const picks = (MORE[DASH] ?? []).filter((id) => DASHBOARDS[id]);
  if (picks.length) {
    const nav = document.createElement("nav");
    nav.className = "em-more";
    nav.setAttribute("aria-label", "More dashboards");
    nav.innerHTML = `<p class="em-eyebrow">More from Economy Monitor</p><ul>${picks.map((id) => `<li><a href="${new URL(`${id}/`, SITE)}"><b>${esc(DASHBOARDS[id].title)}</b><span>${esc(DASHBOARDS[id].blurb)}</span></a></li>`).join("")}</ul><p class="em-more-all"><a href="${SITE}">All dashboards →</a></p>`;
    (dashView().querySelector(":scope > .em-method") ?? dashView().lastElementChild).after(nav);
  }

  /* ---------- 7. Latency matrix on phones ---------- */
  const matrix = main.querySelector(".in-matrix");
  if (matrix) {
    const box = matrix.closest(".em-xs, .em-xscroll") ?? matrix.parentElement;
    const cells = matrix.querySelectorAll("td:not(.self)").length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "em-fold";
    btn.setAttribute("aria-expanded", "false");
    const sync = () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.textContent = open ? "Hide the full matrix" : `Show all ${cells} measurements`;
      box.classList.toggle("em-folded", !open);
      box.previousElementSibling?.classList.contains("em-xs-hint") && box.previousElementSibling.classList.toggle("em-folded", !open);
      if (open) later();
    };
    btn.addEventListener("click", () => { btn.setAttribute("aria-expanded", String(btn.getAttribute("aria-expanded") !== "true")); sync(); });
    (box.previousElementSibling?.classList.contains("em-xs-hint") ? box.previousElementSibling : box).before(btn);
    sync();
  }

  /* ---------- 8. Method: how to read the citations, and what the dashboard leaves out ---------- */
  const method = dashView().querySelector(":scope > .em-method");
  if (method) {
    const srcHead = [...method.querySelectorAll(".em-eyebrow")].find((e) => /^All sources/.test(e.textContent.trim()));
    const add = document.createDocumentFragment();
    if (main.querySelector("[data-src]")) {
      const p = document.createElement("p");
      p.className = "em-howto";
      p.innerHTML = "Numbers with a <b>dotted underline</b> are cited. Select one to see the report it came from, with a link to the original.";
      add.append(p);
    }
    if (LIMITS[DASH]) {
      const h = document.createElement("p");
      h.className = "em-eyebrow";
      h.textContent = "What this doesn't show";
      const ul = document.createElement("ul");
      ul.className = "em-limits";
      ul.innerHTML = LIMITS[DASH].map((t) => `<li>${esc(t)}</li>`).join("");
      add.append(h, ul);
    }
    srcHead ? srcHead.before(add) : method.append(add);
  }
  const foot = main.closest(".em-wrap, #app")?.querySelector(".em-foot") ?? document.querySelector(".em-foot");
  foot?.lastElementChild?.insertAdjacentHTML("beforeend", ` · <a href="${new URL("about/", SITE)}">About</a>`);

  /* ---------- 9. The chart beside the headline ---------- */
  const figCfg = FIGS[DASH];
  const headEl = main.querySelector(".em-head");
  if (figCfg && headEl) {
    const fig = document.createElement("figure");
    fig.className = "em-fig";
    fig.innerHTML = `<figcaption class="em-fig-t">${esc(figCfg.title)}</figcaption><div class="em-fig-plot"></div><p class="em-fig-s">Source: ${esc(figCfg.source)}</p>`;
    const plot = fig.querySelector(".em-fig-plot");
    const h = figCfg.height ?? 200;
    plot.style.minHeight = `${h}px`;
    const text = document.createElement("div");
    text.className = "em-head-text";
    text.append(...headEl.childNodes);
    headEl.append(text, fig);
    headEl.classList.add("em-has-fig");
    Promise.all(figCfg.files.map((f) => fetch(new URL(`${f}.json`, dataDir)).then((r) => r.json()).then((j) => j.records)))
      .then((data) => {
        let drawnAt = 0;
        const draw = () => {
          const w = Math.round(plot.clientWidth);
          if (!w || w === drawnAt) return;
          drawnAt = w;
          const { svg, label } = figCfg.draw(data, w, h);
          plot.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${svg}</svg>`;
        };
        draw();
        new ResizeObserver(draw).observe(plot);
      })
      .catch(() => fig.remove());
  }
});
