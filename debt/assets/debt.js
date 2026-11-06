// Debt vs Public Services dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--db-b0", "--db-b1", "--db-b2", "--db-b3", "--db-b4"];
const MAPS = {
  health: { key: "health_band", label: "World map of countries coloured by net interest payments as a multiple of government health spending" },
  revenue: { key: "revenue_band", label: "World map of countries coloured by the share of government revenue spent on net interest" },
  debt: { key: "debt_band", label: "World map of countries coloured by government debt as a share of GDP" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym, long = false) => { const [y, m] = ym.split("-").map(Number); return `${(long ? MONTH : MON)[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const pct = (v, d = 1) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const times = (v) => (v == null ? "n/a" : v >= 10 ? `${Math.round(v)}×` : `${v.toFixed(1)}×`);
const bn = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} billion` : `${Math.round(m)} million`);
const cssColor = (el, v) => {
  const s = document.createElement("span");
  s.style.color = `var(${v})`;
  s.style.display = "none";
  el.append(s);
  const c = getComputedStyle(s).color;
  s.remove();
  return c || "#888";
};

export default {
  id: "debt",
  title: "Debt vs Public Services",
  description:
    "How much governments pay in interest on their debts, and how that compares with what they spend on health and education, country by country, from the IMF, the World Bank and UNCTAD, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year;
    const either = C.filter((r) => r.more_than_health || r.more_than_education);
    const eitherPop = either.reduce((s, r) => s + (r.population_m ?? 0), 0);
    const overHealth = C.filter((r) => r.more_than_health), overEdu = C.filter((r) => r.more_than_education);
    const byRev = C.filter((r) => r.interest_pct_revenue != null).sort((a, b) => b.interest_pct_revenue - a.interest_pct_revenue);
    const rev10 = byRev.filter((r) => r.interest_pct_revenue >= 10).length;
    const top = byRev[0], second = byRev[1];
    const byRatio = C.filter((r) => r.interest_to_health != null).sort((a, b) => b.interest_to_health - a.interest_to_health);
    const G = DATA.groups, gNow = G.find((g) => g.year === Y), gEnd = G.at(-1), g15 = G.find((g) => g.year === 2015);
    const cross = G.find((g) => g.year > Y && g.world_debt >= 100);
    const UKI = DATA.uk_interest, ukFull = UKI.filter((r) => !r.partial), ukLast = ukFull.at(-1), ukNowY = UKI.at(-1);
    const ukPeak = ukFull.reduce((a, b) => (b.interest_pct_receipts > a.interest_pct_receipts ? b : a));
    const UKD = DATA.uk_debt, ukd = UKD.at(-1), ukd0 = UKD.find((r) => r.month === "2007-12") ?? UKD[0];
    const uk = BY.GBR, us = BY.USA;
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const ukRatio = uk.interest_pct_gdp / uk.health_pct_gdp;

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "debt",
      name: "Debt",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (v) => `<i style="background:var(${v})"></i>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, fc, bigText, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(fc.source)}>${bigText}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, num, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;
    const options = [...C].sort((a, b) => a.country.localeCompare(b.country));

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Debt · IMF figures for ${Y}, UK to ${monthName(ukd.month)}</p>
        <h1><b>${either.length} countries</b>, home to ${bn(eitherPop)} people, <span class="accent">pay more in interest than they spend on health or education</span></h1>
        <p class="em-lede">Government debt reached <b ${t(gNow.world_source)}>${pct(gNow.world_debt, 0)}</b> of world GDP in ${Y}, and the IMF projects it will pass 100% in ${cross?.year ?? "the next decade"}. ${esc(top.country)} spends <b ${t(top.fiscal_source)}>${pct(top.interest_pct_revenue, 0)}</b> of its government revenue on interest, ${esc(second.country)} <b ${t(second.fiscal_source)}>${pct(second.interest_pct_revenue, 0)}</b>. Developing countries paid <b ${t(f.dcinterest.source)}>$${f.dcinterest.value} billion</b> in net interest in ${Y}.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Interest is crowding out <span class="accent">schools and hospitals</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Interest above health or education", `${either.length} countries`, `Home to <span ${t("wb-pop")}>${bn(eitherPop)}</span> people. ${overHealth.length} pay more interest than they spend on health, ${overEdu.length} more than on education`, "imf-fm", true)}
          ${kpi("World government debt", pct(gNow.world_debt, 0) + " of GDP", `In ${Y}, up from <span ${t(g15.world_source)}>${pct(g15.world_debt, 0)}</span> in 2015. Projected <span ${t(gEnd.world_source)}>${pct(gEnd.world_debt, 0)}</span> by ${gEnd.year}`, gNow.world_source)}
          ${kpi("Spend a tenth of revenue or more on interest", `${rev10} countries`, `In ${Y}. The median developing country spent <span ${t(f.median.source)}>${f.median.value}%</span>, nearly double 2010`, "imf-fm")}
          ${kpi("Developing countries' interest bill", `$${f.dcinterest.value}bn`, `Net interest on public debt in ${Y}, on <span ${t(f.dcdebt.source)}>$${f.dcdebt.value} trillion</span> of debt`, f.dcinterest.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Interest, revenue and debt <span class="accent">in ${C.length} countries</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="db-mode" data-mode="health" aria-pressed="true">Interest vs health</button>
                <button type="button" class="db-mode" data-mode="revenue" aria-pressed="false">Share of revenue</button>
                <button type="button" class="db-mode" data-mode="debt" aria-pressed="false">Debt</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="db-map" role="region" aria-label="${MAPS.health.label}"></div>
            <div class="db-scale" id="db-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="db-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="services">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Interest against services</p><h2>${esc(byRatio[0].country)} pays <span class="accent">${times(byRatio[0].interest_to_health)}</span> as much in interest as its government spends on health</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Net interest against government health and education spending · % of GDP</p>
            <h3>The twelve countries where interest most outweighs health</h3>
            <p class="note">Interest is for ${Y}; health and education are each country's latest year, mostly 2023. Health counts only what governments pay from their own resources, not foreign aid.</p>
            <div class="db-key"><span>${dot("--em-accent")}Net interest</span><span>${dot("--db-health")}Health</span><span>${dot("--db-edu")}Education</span></div>
            <div class="db-pairs" id="db-pairs"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Share of government revenue spent on interest · ${Y}</p>
            <h3>${esc(top.country)} spends ${pct(top.interest_pct_revenue, 0)} of its revenue on interest</h3>
            <p class="note">Net interest as a share of all government revenue, including taxes and grants. Every pound or dollar here is one that can't go to services.</p>
            <div class="em-bars" id="db-rev"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Africa", f.africa, `${f.africa.value}%`, `of Africa's people lived in countries spending more on interest than on health or education in 2023, up from 24% in 2010.`, true)}
          ${factCard("Latin America and the Caribbean", f.latam, `${f.latam.value}%`, `of the region's people, up from 34% in 2010. In both regions governments now spend more per person on interest than on health or on education.`)}
        </div>
      </section>

      <section class="em-sec" id="trend">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Over time</p><h2>World debt is heading <span class="accent">past 100% of GDP</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World government gross debt · % of world GDP, ${G[0].year} to ${gEnd.year}</p>
            <h3>Up from ${pct(G[0].world_debt, 0)} in ${G[0].year} to ${pct(gNow.world_debt, 0)} in ${Y}</h3>
            <p class="note">The pandemic pushed debt to <b ${t(G.find((g) => g.year === 2020).world_source)}>${pct(G.find((g) => g.year === 2020).world_debt, 1)}</b> in 2020. The dashed line from ${Y + 1} is the IMF's projection, which passes 100% in ${cross?.year ?? "n/a"}.</p>
            <div id="db-world"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Net interest as a share of government revenue · by country group</p>
            <h3>Low-income countries spend ${pct(gNow.lic_interest_rev, 0)} of revenue on interest, rich ones ${pct(gNow.adv_interest_rev, 0)}</h3>
            <p class="note">Low-income countries owe less relative to their economies, ${pct(gNow.lic_debt, 0)} of GDP against ${pct(gNow.adv_debt, 0)} for advanced economies, but they borrow at higher rates and collect less tax, so interest takes a bigger bite. Dashed lines are IMF projections.</p>
            <div id="db-groups"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="squeeze">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>The squeeze on poorer countries</p><h2>More money is flowing out <span class="accent">than coming in</span></h2></div></div>
        <p class="em-lede db-lede2">Most poorer countries owe part of their debt abroad, in dollars or euros, to bondholders, banks, China and other governments. The World Bank tracks what they pay back against what they newly borrow.</p>
        <div class="em-grid">
          ${factCard("World Bank · 2022 to 2024", f.outflow, `$${f.outflow.value} billion`, `more paid out in principal and interest on external debt than developing countries received in new financing, the largest gap in more than five decades.`, true)}
          ${factCard("World Bank · 2024", f.idrinterest, `$${f.idrinterest.value} billion`, `paid in interest alone on external debt by low- and middle-income countries, a record. Their external debt reached <b ${t(f.idrstock.source)}>$${f.idrstock.value} trillion</b>.`)}
          ${factCard("UNCTAD", f.savings, `$${f.savings.value} billion`, `a year could be saved in interest if developing countries borrowed at the rates developed countries pay.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>The UK paid <span class="accent">£${ukLast.interest_bn.toFixed(1)} billion</span> in debt interest in ${ukLast.fiscal_year}</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">UK central government debt interest · share of public sector receipts, ${UKI[0].fiscal_year} to ${ukLast.fiscal_year}</p>
            <h3>Interest took ${pct(ukPeak.interest_pct_receipts)} of receipts in ${ukPeak.fiscal_year}</h3>
            <p class="note">The bill jumped to <b ${t(ukPeak.source)}>£${ukPeak.interest_bn.toFixed(1)} billion</b> in ${ukPeak.fiscal_year}, the year inflation peaked. In ${ukLast.fiscal_year} it was <b ${t(ukLast.source)}>${pct(ukLast.interest_pct_receipts)}</b> of receipts.</p>
            <div id="db-ukint"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">UK public sector net debt · % of GDP, ${monthName(UKD[0].month)} to ${monthName(ukd.month)}</p>
            <h3>Net debt is ${pct(ukd.net_debt_pct_gdp)} of GDP, up from ${pct(ukd0.net_debt_pct_gdp, 0)} before the financial crisis</h3>
            <p class="note">Excluding public sector banks. It rose with the 2008 bank rescues and again in the pandemic.</p>
            <div id="db-ukdebt"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("ONS · September 2026", f.ukseptember, `£${f.ukseptember.value} billion`, `of central government debt interest in one month. In ${ukNowY.fiscal_year} so far (${esc(ukNowY.partial.toLowerCase())}) it is <b ${t(ukNowY.source)}>£${ukNowY.interest_bn.toFixed(1)} billion</b>.`, true)}
          ${factCard("UK against health", { source: uk.fiscal_source }, `${Math.round(100 * ukRatio)}p`, `in net interest for every £1 the UK government spends on health: <b ${t(uk.fiscal_source)}>${pct(uk.interest_pct_gdp)}</b> of GDP in ${Y} against <b ${t(uk.health_source)}>${pct(uk.health_pct_gdp)}</b> in ${uk.health_year}.`)}
          ${factCard("The US", { source: us.fiscal_source }, `${Math.round((100 * us.interest_pct_gdp) / us.health_pct_gdp)}¢`, `in net interest for every $1 the US government spends on health: <b ${t(us.fiscal_source)}>${pct(us.interest_pct_gdp)}</b> of GDP against <b ${t(us.health_source)}>${pct(us.health_pct_gdp)}</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="db-search" id="db-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap db-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="interest_pct_revenue" aria-sort="descending"><button type="button">Interest, % revenue</button></th>
                <th class="r" data-key="interest_pct_gdp" aria-sort="none"><button type="button">Interest, % GDP</button></th>
                <th class="r hide-n" data-key="health_pct_gdp" aria-sort="none"><button type="button">Health, % GDP</button></th>
                <th class="r hide-n" data-key="education_pct_gdp" aria-sort="none"><button type="button">Education, % GDP</button></th>
                <th class="r hide-n" data-key="debt_pct_gdp" aria-sort="none"><button type="button">Debt, % GDP</button></th>
              </tr></thead>
              <tbody id="db-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Debt</b> is general government gross debt: what central, state and local governments and social security funds owe, as a share of GDP, from the IMF's Fiscal Monitor (October 2026). <b>Net interest</b> is interest paid minus interest received, worked out as the IMF's primary balance minus its overall balance. For ${Y} many values are IMF estimates; ${Y + 1} onward are projections. <b>Share of revenue</b> divides net interest by all general government revenue, including grants.</p>
        <p><b>Health</b> is domestic general government health expenditure from the WHO's Global Health Expenditure Database, which leaves out foreign aid and private spending; the latest year is mostly 2023. <b>Education</b> is government education spending from the UNESCO Institute for Statistics, latest year since 2019. A country counts as paying more in interest than on health or education when its ${Y} net interest is larger than either, both as shares of GDP. Populations are the World Bank's. UNCTAD runs a similar test on developing countries only and finds 51 countries and 3.7 billion people; our count of ${either.length} includes all countries with data. <b>UK</b> figures are ONS public sector finances: central government net interest payable, summed over April to March, against public sector current receipts.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("count", "01", "The test", `<span class="accent">${either.length} countries</span> pay more in interest than on health or education`, `They are home to ${bn(eitherPop)} people, nearly half the world. UNCTAD, counting developing countries only, finds <b ${t(f.people.source)}>${f.people.value} billion</b>.`)}
            ${step("pairs", "02", "Side by side", `${esc(byRatio[0].country)} pays <span class="accent">${times(byRatio[0].interest_to_health)}</span> as much in interest as on health`, `In ${esc(byRatio[1].country)} it is ${times(byRatio[1].interest_to_health)}, in ${esc(byRatio[2].country)} ${times(byRatio[2].interest_to_health)}.`)}
            ${step("revenue", "03", "Revenue", `${esc(top.country)} spends <span class="accent"><b ${t(top.fiscal_source)}>${pct(top.interest_pct_revenue, 0)}</b></span> of its revenue on interest`, `${rev10} countries spend a tenth or more of their revenue on interest.`)}
            ${step("world", "04", "The trend", `World debt is <span class="accent">${pct(gNow.world_debt, 0)}</span> of GDP`, `The IMF projects it will pass 100% in ${cross?.year ?? "n/a"}.`)}
            ${step("outflow", "05", "Outflows", `Developing countries paid <span class="accent"><b ${t(f.outflow.source)}>$${f.outflow.value} billion</b></span> more than they got`, `That is the gap between external debt service and new financing in 2022 to 2024, the largest in more than five decades.`)}
            ${step("uk", "06", "The UK", `The UK paid <span class="accent">£${ukLast.interest_bn.toFixed(1)} billion</span> in debt interest in ${ukLast.fiscal_year}`, `That is <b ${t(ukLast.source)}>${pct(ukLast.interest_pct_receipts)}</b> of everything the public sector took in.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="db-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "health", sel: "EGY" };
    const mapEl = main.querySelector("#db-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return { ...ft, properties: { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name, health: r ? bandIdx("health", r.health_band) : -1, revenue: r ? bandIdx("revenue", r.revenue_band) : -1, debt: r ? bandIdx("debt", r.debt_band) : -1 } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: SEQ.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (r, mode) =>
      mode === "health" ? (r.interest_to_health != null ? `interest ${times(r.interest_to_health)} health spending` : "No comparison")
        : mode === "revenue" ? (r.interest_pct_revenue != null ? `${pct(r.interest_pct_revenue)} of revenue on interest` : "No revenue figure")
          : r.debt_pct_gdp != null ? `debt ${pct(r.debt_pct_gdp, 0)} of GDP` : "No debt figure";
    map = new maplibregl.Map({
      container: mapEl, style: { version: 8, sources: {}, layers: [] }, center: [10, 22], zoom: 0.6, minZoom: -2, maxZoom: 5, renderWorldCopies: false,
      attributionControl: { compact: true, customAttribution: "Boundaries: Natural Earth" }, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "em-popup" });
    const fit = (animate) => map.fitBounds([[-168, -50], [178, 74]], { padding: 16, animate, maxZoom: 4 });
    const ready = new Promise((res) =>
      map.on("load", () => {
        const c = colors();
        map.addSource("countries", { type: "geojson", data: geo });
        map.addLayer({ id: "bg", type: "background", paint: { "background-color": c.bg } });
        map.addLayer({ id: "fill", type: "fill", source: "countries", paint: { "fill-color": fillExpr(c) } });
        map.addLayer({ id: "borders", type: "line", source: "countries", paint: { "line-color": c.bg, "line-width": 0.6 } });
        map.addLayer({ id: "sel", type: "line", source: "countries", filter: ["==", ["get", "iso3"], state.sel], paint: { "line-color": c.fg, "line-width": 2 } });
        map.on("mousemove", "fill", (e) => {
          const ft = e.features?.[0];
          if (!ft) return;
          const r = BY[ft.properties.iso3];
          map.getCanvas().style.cursor = r ? "pointer" : "";
          popup.setLngLat(e.lngLat).setText(`${ft.properties.nm} · ${r ? valueText(r, state.mode) : "No data"}`).addTo(map);
        });
        map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
        map.on("click", "fill", (e) => { const iso3 = e.features?.[0]?.properties.iso3; if (iso3 && BY[iso3]) select(iso3); });
        fit(false);
        res();
      })
    );
    new ResizeObserver(() => { map.resize(); if (map.getProjection?.()?.type !== "globe") fit(false); }).observe(mapEl);
    async function repaint() {
      await ready;
      const c = colors();
      map.setPaintProperty("bg", "background-color", c.bg);
      map.setPaintProperty("borders", "line-color", c.bg);
      map.setPaintProperty("sel", "line-color", c.fg);
      map.setPaintProperty("fill", "fill-color", fillExpr(c));
      map.setFilter("sel", ["==", ["get", "iso3"], state.sel]);
    }
    const scaleEl = main.querySelector("#db-scale");
    const SCALE_TITLE = { health: `Net interest ÷ government health spending:`, revenue: `Share of revenue spent on net interest, ${Y}:`, debt: `Government gross debt, % of GDP, ${Y}:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#db-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const head = state.mode === "health"
        ? { eb: `Net interest ÷ health spending`, big: times(r.interest_to_health), s: r.fiscal_source, sub: r.interest_to_health == null ? "" : r.more_than_health ? "pays more in interest than its government spends on health" : "spends more on health than on interest" }
        : state.mode === "revenue"
          ? { eb: `Revenue spent on interest · ${Y}`, big: pct(r.interest_pct_revenue), s: r.fiscal_source, sub: `median developing country <span ${t(f.median.source)}>${f.median.value}%</span>` }
          : { eb: `Government debt · ${Y}`, big: r.debt_pct_gdp != null ? `${pct(r.debt_pct_gdp, 0)} of GDP` : "n/a", s: r.fiscal_source, sub: `world <span ${t(gNow.world_source)}>${pct(gNow.world_debt, 0)}</span>` };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="db-pick"><span class="em-eyebrow">Choose</span><select id="db-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${t(head.s)}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.interest_pct_gdp != null ? row(`Net interest · ${Y}`, `<span ${t(r.fiscal_source)}>${pct(r.interest_pct_gdp)} of GDP</span>`) : ""}
          ${r.interest_pct_revenue != null ? row("Share of revenue", `<span ${t(r.fiscal_source)}>${pct(r.interest_pct_revenue)}</span>`) : ""}
          ${r.health_pct_gdp != null ? row(`Health · ${r.health_year}`, `<span ${t(r.health_source)}>${pct(r.health_pct_gdp)} of GDP</span>`) : ""}
          ${r.education_pct_gdp != null ? row(`Education · ${r.education_year}`, `<span ${t(r.education_source)}>${pct(r.education_pct_gdp)} of GDP</span>`) : ""}
          ${r.debt_pct_gdp != null ? row(`Debt · ${Y}`, `<span ${t(r.fiscal_source)}>${pct(r.debt_pct_gdp, 0)} of GDP</span>`) : ""}
          ${r.debt_2031 != null ? row("Debt · 2031, projected", `<span ${t(r.fiscal_source)}>${pct(r.debt_2031, 0)}</span>`) : ""}
          ${r.interest_2015 != null ? row("Net interest · 2015", `<span ${t(r.fiscal_source)}>${pct(r.interest_2015)} of GDP</span>`) : ""}
          ${r.population_m != null ? row(`Population · ${r.population_year}`, `<span ${t(r.population_source)}>${r.population_m >= 1 ? bn(r.population_m) : `${Math.round(r.population_m * 1000)},000`}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#db-select").addEventListener("change", (e) => select(e.target.value, true));
      src.footnotes(detail);
    }
    async function select(iso3, fly = false) {
      state.sel = iso3;
      drawDetail();
      await ready;
      map.setFilter("sel", ["==", ["get", "iso3"], iso3]);
      if (!fly) return;
      const ft = geo.features.find((x) => x.properties.iso3 === iso3);
      if (!ft) return;
      const pts = (ft.geometry.type === "Polygon" ? [ft.geometry.coordinates] : ft.geometry.coordinates).flat(2);
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      if (map.getProjection?.()?.type === "globe") map.easeTo({ center: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2], duration: 800 });
      else map.fitBounds([[Math.min(...xs) - 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.max(...ys) + 4]], { padding: 24, maxZoom: 4 });
    }
    main.querySelectorAll(".db-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".db-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mapEl.setAttribute("aria-label", MAPS[state.mode].label);
      drawScale();
      drawDetail();
      repaint();
    }));
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [20, 10], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- Line charts ----------
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash, noEnd }]. Labels each line at its end
    // unless noEnd. A series without a name is labelled with its value only.
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name && !s.noEnd) ? (narrow ? 104 : 150) : 58, b: 22, l: 40 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.filter((s) => !s.noEnd).map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="db-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="db-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity="${s.dash ? ".06" : ".12"}"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.dash ? 1.8 : 2.4}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const decades = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    // Splits a yearly series at the last actual year so projections draw dashed.
    const split = (key, opts) => {
      const act = G.filter((g) => g.year <= Y && g[key] != null).map((g) => [g.year, g[key]]);
      const proj = G.filter((g) => g.year >= Y && g[key] != null).map((g) => [g.year, g[key]]);
      return [{ ...opts, pts: act, noEnd: true }, { ...opts, pts: proj, dash: true }];
    };
    const drawWorld = (el, h) => lineChart(el, {
      series: split("world_debt", { v: "--em-accent", endText: pct(gEnd.world_debt, 0) }),
      yMax: 120, yStep: 20, fmtY: (v) => `${v}%`, ref: { v: 100, label: "100% of GDP" }, xTicks: decades(2005, 2030, 5), h, area: true,
      aria: `World government debt: ${pct(G[0].world_debt, 0)} of GDP in ${G[0].year}, ${pct(gNow.world_debt, 0)} in ${Y}, projected ${pct(gEnd.world_debt, 0)} in ${gEnd.year}`,
    });
    const GRP = [["lic_interest_rev", "Low-income", "Low-income", "--db-lic"], ["em_interest_rev", "Emerging", "Emerging", "--db-b3"], ["adv_interest_rev", "Advanced", "Advanced", "--db-muted"]];
    const drawGroups = (el, h) => lineChart(el, {
      series: GRP.flatMap(([k, name, short, v]) => split(k, { name, short, v })),
      yMax: 20, yStep: 5, fmtY: (v) => `${v}%`, xTicks: decades(2005, 2030, 5), h,
      aria: `Net interest as a share of revenue in ${Y}: low-income countries ${pct(gNow.lic_interest_rev)}, emerging ${pct(gNow.em_interest_rev)}, advanced ${pct(gNow.adv_interest_rev)}`,
    });
    const drawUkInt = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: ukFull.map((r) => [r.start, r.interest_pct_receipts]), endText: pct(ukLast.interest_pct_receipts) }],
      yMax: 12, yStep: 3, fmtY: (v) => `${v}%`, xTicks: decades(2000, 2020, 5), xFmt: (v) => `${v}/${String((v + 1) % 100).padStart(2, "0")}`, h, area: true,
      aria: `UK debt interest as a share of receipts: ${pct(ukFull[0].interest_pct_receipts)} in ${ukFull[0].fiscal_year}, ${pct(ukPeak.interest_pct_receipts)} in ${ukPeak.fiscal_year}, ${pct(ukLast.interest_pct_receipts)} in ${ukLast.fiscal_year}`,
    });
    const drawUkDebt = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: UKD.map((r) => [xOf(r.month), r.net_debt_pct_gdp]), endText: pct(ukd.net_debt_pct_gdp, 0) }],
      yMax: 100, yStep: 25, fmtY: (v) => `${v}%`, xTicks: decades(1995, 2020, 5), xEnd: monthName(ukd.month), h, area: true,
      aria: `UK public sector net debt: ${pct(UKD[0].net_debt_pct_gdp, 0)} of GDP in ${monthName(UKD[0].month)}, ${pct(ukd.net_debt_pct_gdp)} in ${monthName(ukd.month)}`,
    });
    const drawAll = () => {
      drawWorld(main.querySelector("#db-world"), 240);
      drawGroups(main.querySelector("#db-groups"), 240);
      drawUkInt(main.querySelector("#db-ukint"), 220);
      drawUkDebt(main.querySelector("#db-ukdebt"), 220);
    };
    drawAll();

    // ---------- Bars ----------
    function pairBars(el, rows) {
      const max = Math.max(...rows.flatMap((r) => [r.interest_pct_gdp, r.health_pct_gdp, r.education_pct_gdp ?? 0]));
      const bar = (v, c, s, label) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${(100 * (v ?? 0)) / max}%;background:var(${c})"></b></div><span class="v" ${v != null ? t(s) : ""}>${v == null ? "n/a" : pct(v)}</span></div>`;
      el.innerHTML = rows.map((r) => `<div class="it"><div class="lb">${esc(r.country)} <span class="db-x">interest ${times(r.interest_to_health)} health</span></div><div class="tr">
        ${bar(r.interest_pct_gdp, "--em-accent", r.fiscal_source, `${r.country}: net interest ${pct(r.interest_pct_gdp)} of GDP`)}
        ${bar(r.health_pct_gdp, "--db-health", r.health_source, `${r.country}: health ${pct(r.health_pct_gdp)} of GDP`)}
        ${bar(r.education_pct_gdp, "--db-edu", r.education_source, `${r.country}: education ${r.education_pct_gdp == null ? "no figure" : pct(r.education_pct_gdp) + " of GDP"}`)}</div></div>`).join("");
    }
    pairBars(main.querySelector("#db-pairs"), byRatio.slice(0, 12));
    const revBars = (el) => bars(el, byRev.slice(0, 10).map((r, i) => ({ label: r.country, value: r.interest_pct_revenue, muted: i > 0, src: r.fiscal_source })), (v) => pct(v, 0), byRev[0].interest_pct_revenue, t);
    revBars(main.querySelector("#db-rev"));

    // ---------- Table ----------
    const tbody = main.querySelector("#db-tbody"), search = main.querySelector("#db-search");
    let key = "interest_pct_revenue", dir = -1;
    const cell = (v, s, hide, d = 1) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : v.toFixed(d)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="db-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.interest_pct_revenue != null ? t(r.fiscal_source) : ""}>${r.revenue_band ? `<i class="db-sw" style="background:var(${SEQ[bandIdx("revenue", r.revenue_band)]})"></i>${r.interest_pct_revenue.toFixed(1)}` : "–"}</td>
        ${cell(r.interest_pct_gdp, r.fiscal_source, false)}
        ${cell(r.health_pct_gdp, r.health_source, true)}
        ${cell(r.education_pct_gdp, r.education_source, true)}
        ${cell(r.debt_pct_gdp, r.fiscal_source, true, 0)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
    }
    main.querySelectorAll(".em-table th[aria-sort]").forEach((th) => th.querySelector("button").addEventListener("click", () => {
      const k = th.dataset.key;
      dir = key === k ? -dir : k === "country" ? 1 : -1;
      key = k;
      main.querySelectorAll(".em-table th[aria-sort]").forEach((x) => x.setAttribute("aria-sort", x === th ? (dir > 0 ? "ascending" : "descending") : "none"));
      drawTable();
    }));
    search.addEventListener("input", drawTable);
    tbody.addEventListener("click", (e) => {
      const b = e.target.closest(".db-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#db-vis");
    function miniMap(el, mode) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", MAPS[mode].label);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso], i = r ? bandIdx(mode, r[MAPS[mode].key]) : -1; return i < 0 ? "var(--em-land)" : `var(${SEQ[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${valueText(r, mode)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = (mode) => `<div class="db-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "count") {
        vis.innerHTML = `<p class="vt">Net interest ÷ government health spending</p><div class="m"></div>${legend("health")}`;
        miniMap(vis.querySelector(".m"), "health");
      } else if (id === "pairs") {
        vis.innerHTML = `<p class="vt">Net interest against health and education, % of GDP</p><div class="db-key"><span>${dot("--em-accent")}Interest</span><span>${dot("--db-health")}Health</span><span>${dot("--db-edu")}Education</span></div><div class="db-pairs" id="db-vpairs"></div>`;
        pairBars(vis.querySelector("#db-vpairs"), byRatio.slice(0, 3));
      } else if (id === "revenue") {
        vis.innerHTML = `<p class="vt">Share of revenue spent on interest, ${Y}</p><div class="em-bars" id="db-vbars"></div>`;
        revBars(vis.querySelector("#db-vbars"));
      } else if (id === "world") {
        vis.innerHTML = `<p class="vt">World government debt, % of GDP</p><div class="m"></div>`;
        drawWorld(vis.querySelector(".m"), 240);
      } else if (id === "outflow") {
        vis.innerHTML = `<p class="vt">External debt, 2022 to 2024</p><div class="vbig">$${f.outflow.value} billion</div><p class="vsub">more paid out by developing countries than they received in new financing.</p>`;
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">UK debt interest, share of receipts</p><div class="m"></div>`;
        drawUkInt(vis.querySelector(".m"), 240);
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); drawAll(); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { story.redraw(); drawAll(); }, 150); });
  },
};
