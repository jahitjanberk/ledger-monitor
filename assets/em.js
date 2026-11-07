// Ledger Monitor: shared UX polish for every dashboard.
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

import { FIGS } from "./figs.js";

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
  vaccines: { glance: ["world", "facts"], map: ["countries", "bands", "regions"], zero: ["world", "countries", "regions", "facts"], measles: ["world", "countries", "facts"], workforce: ["regions", "countries", "facts"], uk: ["uk_cover", "uk_nations", "uk_measles", "countries", "facts"], table: ["countries"] },
  energy: { glance: ["facts", "eu_poverty"], map: ["countries", "bands"], access: ["countries", "regions", "facts"], prices: ["countries", "eu_prices"], warm: ["countries", "eu_poverty"], uk: ["uk_cap", "uk_fuel_poverty", "uk_fpeer", "facts"], table: ["countries"] },
medicines: { glance: ["shortages", "us_years", "uk_concessions"], map: ["countries", "bands"], shortages: ["us_years", "shortages", "categories"], causes: ["reasons", "api_sites", "countries", "facts"], europe: ["eu_critical", "eu_shortages", "facts"], uk: ["uk_concessions", "uk_ssp", "countries"], table: ["countries"] },
  fertilizer: { glance: ["prices", "world"], map: ["countries", "bands"], prices: ["prices", "forecasts", "facts"], energy: ["prices", "gulf", "facts"], supply: ["producers", "countries"], use: ["regions", "world"], uk: ["uk_prices", "uk_rates", "countries", "facts"], table: ["countries"] },
  remittances: { glance: ["world", "quarterly", "corridors", "facts"], map: ["countries", "bands", "corridors"], flows: ["world", "countries"], costs: ["world", "regions", "countries", "facts"], providers: ["quarterly", "breakdown", "facts"], corridors: ["corridors", "countries", "facts"], uk: ["uk_cost", "uk_flows", "corridors", "facts"], table: ["countries"] },
  disasters: { glance: ["facts", "losses", "world", "hazards"], map: ["countries", "bands"], hazards: ["hazards", "deadliest", "world", "countries", "facts"], gap: ["losses", "gap_regions", "costliest", "facts"], floods: ["countries", "facts"], uk: ["uk_risk", "uk_regions", "uk_infra", "facts"], table: ["countries"] },
  wages: { glance: ["world", "countries", "facts"], map: ["countries", "bands"], minimum: ["countries"], real: ["oecd", "countries", "facts"], diet: ["countries", "facts"], poverty: ["world", "countries"], uk: ["uk_awe", "uk_nlw", "uk_lowpay", "countries", "facts"], table: ["countries"] },
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
  vaccines: { title: "Vaccination & Health Workers", blurb: "Which children get vaccinated, where measles is spreading, and where nurses and doctors are scarce." },
  energy: { title: "Household Energy Prices & Poverty", blurb: "Who lacks electricity or clean cooking, what households pay, and who can't keep warm." },
medicines: { title: "Medicine Shortages & Supply", blurb: "Which medicines are running short and for how long, and where medicines are made." },
  fertilizer: { title: "Fertiliser Prices & Supply", blurb: "What fertiliser costs, who makes and exports it, and which countries depend on imports." },
  remittances: { title: "The Cost of Sending Money Home", blurb: "How much migrants send home, and what banks and money transfer firms charge them to do it." },
  disasters: { title: "Floods, Disasters & Insurance Gaps", blurb: "Who disasters kill and drive from home, how much of the damage is insured, and who lives with flood risk." },
  wages: { title: "Wages & the Cost of Living", blurb: "What people earn against what things cost: minimum wages, real pay, working poverty and the price of a healthy diet." },
};
// Three other dashboards per page, picked for overlapping subjects. Ids that don't exist yet are skipped.
const MORE = {
  air: ["energy", "electricity", "heat"],
  electricity: ["energy", "air", "minerals"],
  internet: ["electricity", "water", "orbit"],
  water: ["disasters", "food", "heat"],
  chokepoints: ["fertilizer", "food", "medicines"],
  orbit: ["internet", "chokepoints", "minerals"],
  housing: ["wages", "disasters", "energy"],
  food: ["wages", "fertilizer", "chokepoints"],
  debt: ["vaccines", "remittances", "food"],
  heat: ["disasters", "energy", "food"],
  minerals: ["medicines", "chokepoints", "electricity"],
  scams: ["remittances", "housing", "internet"],
  vaccines: ["medicines", "debt", "water"],
  energy: ["wages", "electricity", "air"],
  medicines: ["minerals", "chokepoints", "vaccines"],
  fertilizer: ["food", "chokepoints", "energy"],
  remittances: ["wages", "debt", "scams"],
  disasters: ["heat", "housing", "water"],
  wages: ["food", "housing", "remittances"],
};

const AUTHOR = { name: "jahit", url: "https://github.com/jahitjanberk" };
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
  vaccines: [
    "Coverage figures are WHO and UNICEF estimates built from countries' own reports and surveys. Each year's release revises the whole series, and fewer surveys were submitted this round, so recent years may change.",
    "Zero-dose means no first dose of DTP vaccine by the first birthday. A child who missed DTP but had another vaccine still counts as zero-dose.",
    "Measles cases are what countries confirmed and reported, not estimates of every case; 12 countries, including the United States, have no 2025 figure.",
    "Health worker figures are each country's latest report, mostly 2023 or 2024, and count people in the workforce, not where they work or how many hours.",
  ],
  energy: [
    "Access figures for 2024 are partly modelled where countries have no recent household survey, and people without access are our calculation from population.",
    "Household prices and cold-home figures cover only European countries; there is no open, comparable price series for the rest of the world.",
    "Cold homes and arrears are what people say in a survey, not measured temperatures or bills. The UK left the EU survey, so its latest Eurostat figures are from 2018 and are not shown.",
    "The British price cap is the most a supplier can charge a typical customer on a default tariff, not what every household pays. Fuel poverty figures cover England only, and 2025 is provisional.",
  ],
medicines: [
  "US shortages are those in the FDA's database of medicines it tracks; vaccines and blood products, and shortages that FDA does not list, are left out. Each shortage is a generic name, which can cover several strengths and makers.",
  "How long a shortage has lasted counts from when it was first posted, so a shortage that eased and came back counts as one long one.",
  "Trade is measured by value as each country reports it. Countries where multinationals book sales or route goods, such as Switzerland, Ireland and Belgium, look bigger than their factories, and Taiwan is missing.",
  "Price concessions in England show medicines pharmacies could not buy at the NHS price. They are a sign of supply problems, not a count of shortages.",
],
  fertilizer: [
    "Prices are international spot prices at ports, not what farmers pay. Farm-gate prices add shipping, margins and taxes, and move later.",
    "FAO's use, production and trade figures mix official reports with estimates and partner countries' trade records. Some big exporters are under-recorded: FAO shows almost no exports from Iran, so the Gulf's share of nitrogen exports is likely to be higher than shown.",
    "The latest FAO year is 2024, before the Strait of Hormuz closed, so the country figures do not show how trade has shifted since.",
    "Use per hectare divides all fertiliser by cropland, which leaves out permanent grassland; in countries that fertilise a lot of grass, such as the UK and Ireland, it overstates what crops get.",
  ],
  remittances: [
    "Costs are for sending the equivalent of $200 through the services the World Bank surveys in 48 sending and about 100 receiving countries. Each service counts equally, however much money goes through it.",
    "Most cost figures are for one quarter of each year (July to September). The World Bank did not collect prices for April to June 2025, and the dataset has no prices for money sent from Russia since 2022.",
    "A few corridors are recorded at more than the amount sent, such as Türkiye to Bulgaria at 118%, which suggests a data problem. They are kept in the data but left out of the charts.",
    "Remittance flows are those recorded in balance of payments data, in current US dollars. Money sent through informal channels is not counted, and the latest year is partly estimated.",
  ],
  disasters: [
    "Deaths, people affected and losses by hazard are CRED's published summary of EM-DAT, which only records disasters above a threshold (10 deaths, 100 people affected, or a call for help). Heat and drought deaths are reported late or not at all, so they are undercounted.",
    "Flood exposure is a 2022 model of present-day hazard on 2020 population maps. It ignores flood defences and climate change, so it shows where floods could reach, not who will be flooded.",
    "Displacements count movements, including evacuations before a storm; one person moved twice counts twice.",
    "Insured and overall losses are the reinsurers' estimates, quoted from Munich Re and Swiss Re; their figures differ, and Munich Re's leave out droughts and heatwaves.",
  ],
  wages: [
    "Minimum wages are legal floors, not what people earn. Where many work informally or for themselves, as in most low-income countries, few workers are covered, and countries that leave pay floors to collective bargaining have no figure.",
    "Monthly minimum wages assume a full-time month (for example 40 hours a week for 4.33 weeks) where the law sets an hourly or daily rate; hours actually worked differ.",
    "The healthy diet comparison is for one person and uses the cheapest foods that meet dietary guidelines. A family on one wage, or the foods people really buy, would cost more.",
    "Working poverty and labour income share are ILO modelled estimates. Labour share includes an imputed part of self-employed income, and country figures are shown only where they rest on national data.",
  ],
};

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const prettyDate = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
};

// The chart beside each headline comes from figs.js, which the embed page shares.
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
    nav.innerHTML = `<p class="em-eyebrow">More from Ledger Monitor</p><ul>${picks.map((id) => `<li><a href="${new URL(`${id}/`, SITE)}"><b>${esc(DASHBOARDS[id].title)}</b><span>${esc(DASHBOARDS[id].blurb)}</span></a></li>`).join("")}</ul><p class="em-more-all"><a href="${SITE}">All dashboards →</a></p>`;
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
    fig.innerHTML = `<figcaption class="em-fig-t">${esc(figCfg.title)}</figcaption><div class="em-fig-plot"></div><p class="em-fig-s">Source: ${esc(figCfg.source)} · <a href="${new URL(`embed/?d=${DASH}`, SITE)}">Embed this chart</a></p>`;
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
