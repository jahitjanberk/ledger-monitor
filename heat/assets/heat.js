// Extreme Heat dashboard for Economy Monitor.
// Built on the shared Economy Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--ht-b0", "--ht-b1", "--ht-b2", "--ht-b3", "--ht-b4"];
// Maps with a "cooler" or "fewer" class give it its own colour rather than the lightest step.
const DIV = ["--ht-cool", "--ht-b0", "--ht-b1", "--ht-b3", "--ht-b4"];
const MAPS = {
  anomaly: { key: "anomaly_band", vars: DIV, label: "World map of countries coloured by how much warmer 2025 was than their 1991–2020 average" },
  days: { key: "days_band", vars: SEQ, label: "World map of countries coloured by the number of days above 35°C in 2025" },
  change: { key: "change_band", vars: DIV, label: "World map of countries coloured by how many more days above 35°C they had in 2025 than their 1991–2020 average" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayName = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${dd} ${MONTH[m - 1]} ${y}`; };
const deg = (v, d = 2) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}°C`);
const days = (v) => (v == null ? "n/a" : v >= 10 ? `${Math.round(v)} days` : `${v.toFixed(1)} days`);
const sdays = (v) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v) >= 10 ? Math.round(Math.abs(v)) : Math.abs(v).toFixed(1)}`);
const n0 = (v) => v.toLocaleString("en-GB");
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
  id: "heat",
  title: "Extreme Heat",
  description:
    "How hot the world is getting, which countries face the most dangerous heat, and what it costs in lives and work, from Copernicus, the Met Office, the World Bank, the WHO and the ILO, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year;
    const G = DATA.global, g = G.at(-1), gMax = G.reduce((a, b) => (b.anomaly_preindustrial > a.anomaly_preindustrial ? b : a));
    const g1980 = G.find((r) => r.year === 1980);
    const D = DATA.daily, dLast = D.at(-1);
    const E = DATA.era5_years, e26 = E.at(-1);
    const UK = DATA.uk_summers, ukNow = UK.at(-1), ukPrev = UK.filter((r) => r.year < ukNow.year).sort((a, b) => b.summer_mean_c - a.summer_mean_c)[0];
    const uk1960 = UK.filter((r) => r.year >= 1961 && r.year <= 1990), uk6190 = uk1960.reduce((s, r) => s + r.summer_mean_c, 0) / uk1960.length;
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const byDays = C.filter((r) => r.hot_days != null).sort((a, b) => b.hot_days - a.hot_days);
    const byChange = C.filter((r) => r.hot_days_change != null).sort((a, b) => b.hot_days_change - a.hot_days_change);
    const byModel = C.filter((r) => r.model_source).map((r) => ({ ...r, model_change: r.model_days_2040_2059 - r.model_days_1995_2014 })).sort((a, b) => b.model_change - a.model_change);
    const byAnom = C.filter((r) => r.anomaly_c != null).sort((a, b) => b.anomaly_c - a.anomaly_c);
    const over1 = byAnom.filter((r) => r.anomaly_c >= 1).length;
    const moreDays = byChange.filter((r) => r.hot_days_change >= 2).length;
    const ind = BY.IND;

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "heat",
      name: "Heat",
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
        <p class="em-eyebrow"><span class="num">00</span>Heat · daily data to ${dayName(dLast.date)}</p>
        <h1>The past twelve months were <b ${t(f.last12.source)}>${f.last12.value}°C</b> warmer than before industrialisation. <span class="accent">Heat kills an estimated ${n0(f.deaths.value)} people a year</span></h1>
        <p class="em-lede">October 2026 was the warmest October on record, <b ${t(f.oct2026.source)}>${f.oct2026.value}°C</b> above the late 19th century, and August tied July 2023 as the warmest month ever measured. The UK had its hottest summer on record, at <b ${t(f.uksummer.source)}>${f.uksummer.value}°C</b>. More than <b ${t(f.workers.source)}>${f.workers.value} billion</b> workers are exposed to excessive heat on the job.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>The world is brushing against <span class="accent">the 1.5°C limit</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Last twelve months", `+${f.last12.value}°C`, `November 2025 to October 2026, above the 1850–1900 average. 2026 is forecast to be the second-warmest year`, f.last12.source, true)}
          ${kpi(`The year ${Y}`, `+${f.y2025.value}°C`, `Above 1850–1900, second or third warmest on record. 2023 to 2025 averaged <span ${t(f.three.source)}>${f.three.value}°C</span>`, f.y2025.source)}
          ${kpi("Heat-related deaths", `${Math.round(f.deaths.value / 1000)},000 a year`, `Worldwide on average. The death rate is up 23% since the 1990s`, f.deaths.source)}
          ${kpi("Workers exposed", `${f.workers.value} billion`, `7 in 10 of the world's workers face excessive heat at some point on the job`, f.workers.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>${over1} countries were at least 1°C warmer than usual in ${Y}. <span class="accent">${moreDays} had more days above 35°C</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="ht-mode" data-mode="anomaly" aria-pressed="true">Warmer than usual</button>
                <button type="button" class="ht-mode" data-mode="days" aria-pressed="false">Days above 35°C</button>
                <button type="button" class="ht-mode" data-mode="change" aria-pressed="false">Extra hot days</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="ht-map" role="region" aria-label="${MAPS.anomaly.label}"></div>
            <div class="ht-scale" id="ht-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="ht-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="warming">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>A warming world</p><h2>The eleven warmest years on record <span class="accent">are the last eleven</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Global surface temperature against 1850–1900 · ${G[0].year} to ${g.year}</p>
            <h3>${gMax.year} was the warmest year, ${deg(gMax.anomaly_preindustrial)} above pre-industrial</h3>
            <p class="note">The dashed line is 1.5°C, the Paris Agreement's limit, which refers to warming averaged over decades rather than a single year. In 1980 the world was <b ${t(g1980.source)}>${deg(g1980.anomaly_preindustrial)}</b>; in ${g.year} it was <b ${t(g.source)}>${deg(g.anomaly_preindustrial)}</b>.</p>
            <div id="ht-global"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Daily global temperature against the 1991–2020 average for the day · 2023 to ${dLast.date.slice(0, 4)}</p>
            <h3>Every day since July 2023 has been warmer than the 1991–2020 normal</h3>
            <p class="note">Each line is one year, as monthly averages of the daily figures. The hottest day ever measured was <b ${t(DATA.hottest.source)}>${dayName(DATA.hottest.date)}</b>, at ${DATA.hottest.temp_c.toFixed(2)}°C averaged over the whole planet; 2026's hottest was ${DATA.hottest2026.temp_c.toFixed(2)}°C on ${dayName(DATA.hottest2026.date)}. So far 2026 is running <b ${t(e26.source)}>${deg(e26.anomaly_9120)}</b> above 1991–2020.</p>
            <div id="ht-daily"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Copernicus · October 2026", f.oct2026, `+${f.oct2026.value}°C`, `the warmest October on record, and the third month in a row more than 1.5°C above pre-industrial.`, true)}
          ${factCard("Copernicus · August 2026", f.aug2026, `+${f.aug2026.value}°C`, `August tied July 2023 as the warmest month ever recorded.`)}
          ${factCard("ECMWF · 2025", f.stress, "Half", `of the world's land had more days than average with at least strong heat stress in 2025.`)}
        </div>
      </section>

      <section class="em-sec" id="hotdays">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Dangerous days</p><h2>In ${esc(byDays[0].country)}, it passed 35°C on <span class="accent">${Math.round(byDays[0].hot_days)} days</span> in ${Y}</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Days above 35°C · ${Y}</p>
            <h3>The Sahel and the Gulf are hottest</h3>
            <p class="note">Averaged over each country's whole area, so a big country with cool regions scores lower than its hottest places. India averaged <b ${t(ind.hot_days_source)}>${days(ind.hot_days)}</b>.</p>
            <div class="em-bars" id="ht-days"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Extra days above 35°C · ${Y} against 1991–2020</p>
            <h3>West Africa had the biggest jump</h3>
            <p class="note">Days above 35°C in ${Y} minus the average for 1991–2020. One year is noisy; a single hot year can lift a country to the top.</p>
            <div class="em-bars" id="ht-change"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Modelled · 2040–2059 against 1995–2014</p>
            <h3>By mid-century, up to ${Math.round(byModel[0].model_change)} more hot days a year</h3>
            <p class="note">Extra days above 35°C a year in climate models under a middle-of-the-road emissions path. India goes from <b ${t(ind.model_source)}>${days(ind.model_days_1995_2014)}</b> to <b ${t(ind.model_source)}>${days(ind.model_days_2040_2059)}</b>.</p>
            <div class="em-bars" id="ht-model"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="health">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Lives and work</p><h2>Heat costs lives <span class="accent">and working hours</span></h2></div></div>
        <p class="em-lede ht-lede2">Heat is seldom written on a death certificate, so its toll is estimated: researchers compare how many people die during hot spells with how many would be expected otherwise.</p>
        <div class="em-grid">
          ${factCard("Lancet Countdown 2025", f.deaths, `${n0(f.deaths.value)}`, `heat-related deaths a year worldwide on average. The average person faced <b ${t(f.days16.source)}>${f.days16.value} days</b> of dangerous heat in 2024 that wouldn't have happened without climate change.`, true)}
          ${factCard("Europe · summer 2024", f.europe, n0(f.europe.value), `heat-related deaths between June and September, in 32 countries. More than 181,000 across the summers of 2022 to 2024.`)}
          ${factCard("ILO", f.injuries, `${f.injuries.value} million`, `work injuries a year are caused by excessive heat, killing <b ${t(f.injuries.source)}>18,970</b> people.`)}
          ${factCard("Lancet Countdown · 2024", f.hours, `${f.hours.value} billion`, `potential working hours lost to heat, worth about $1.09 trillion in lost output.`)}
          ${factCard("WHO and WMO", f.prod, "2–3%", `of a worker's productivity is lost for every degree above 20°C.`)}
          ${factCard("ILO · 2020", f.workers, `${f.workers.value} billion`, `of the world's 3.4 billion workers are likely to face excessive heat at work, up from 65.5% of the workforce in 2000 to 70.9%.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>The UK's two hottest summers <span class="accent">were the last two</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">UK average temperature, June to August · ${UK[0].year} to ${ukNow.year}</p>
            <h3>${ukNow.summer_mean_c.toFixed(1)}°C in ${ukNow.year}, beating ${ukPrev.summer_mean_c.toFixed(1)}°C in ${ukPrev.year}</h3>
            <p class="note">The average of day and night temperatures across the whole UK. The dashed line is the 1961–1990 average, ${uk6190.toFixed(1)}°C. ${ukNow.year} is provisional.</p>
            <div id="ht-uk"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Met Office · summer 2026", f.uksummer, "38.2°C", `the summer's peak, at Hartpury College on 13 August. <b ${t(f.uksummer.source)}>54</b> Met Office stations broke their all-time records. Climate change made the summer about <b ${t(f.uk130.source)}>${f.uk130.value} times</b> more likely.`, true)}
          ${factCard("Met Office · hot days", f.uk28, `${f.uk28.value} days`, `when it passed 28°C somewhere in the UK in summer 2026. The previous record was 41, in 1976 and 1995.`)}
          ${factCard("UKHSA · England", f.ukdeaths2026, n0(f.ukdeaths2026.value), `heat-associated deaths in the May and June 2026 heatwaves alone, an interim estimate. For all of summer 2025 it was <b ${t(f.ukdeaths2025.source)}>${n0(f.ukdeaths2025.value)}</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="ht-search" id="ht-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap ht-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="anomaly_c" aria-sort="none"><button type="button">${Y} vs normal</button></th>
                <th class="r" data-key="hot_days" aria-sort="descending"><button type="button">Days above 35°C</button></th>
                <th class="r hide-n" data-key="hot_days_9120" aria-sort="none"><button type="button">1991–2020 average</button></th>
                <th class="r hide-n" data-key="hot_days_change" aria-sort="none"><button type="button">Extra days</button></th>
                <th class="r hide-n" data-key="model_days_2040_2059" aria-sort="none"><button type="button">2040–2059, modelled</button></th>
              </tr></thead>
              <tbody id="ht-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Global temperature</b> since 1850 is the Met Office and University of East Anglia's HadCRUT5 record. It is published against 1961–1990; we shift it so that 0 is the 1850–1900 average, the usual stand-in for pre-industrial, so its yearly values may differ by a few hundredths from figures quoted by other datasets. <b>Daily temperatures</b> are Copernicus's ERA5 reanalysis, which blends weather observations with a model, against the 1991–2020 average for each day; the latest days are preliminary. Quoted figures above pre-industrial, such as ${f.last12.value}°C for the last twelve months, are the publishers' own.</p>
        <p><b>Country warming</b> is each country's average land temperature in ${Y} against its own 1991–2020 average, from ERA5 processed by Our World in Data. <b>Days above 35°C</b> come from the World Bank's Climate Change Knowledge Portal, also from ERA5, averaged over each country's area. <b>Modelled days</b> are the median of CMIP6 climate models for 2040–2059 under the SSP2-4.5 scenario, against the same models for 1995–2014; they show the direction of change, not a forecast for a particular year. Death and work figures are estimates quoted from the Lancet Countdown, the ILO, ISGlobal and UKHSA. <b>UK summers</b> are the Met Office's HadUK-Grid average of daily mean temperature for June to August.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("global", "01", "The trend", `The world is <span class="accent"><b ${t(f.last12.source)}>${f.last12.value}°C</b></span> warmer than before industry`, `That is the last twelve months, to October 2026. ${gMax.year} was the warmest year on record.`)}
            ${step("anomaly", "02", "Everywhere", `${over1} countries were at least <span class="accent">1°C warmer</span> than usual in ${Y}`, `Against their own 1991–2020 average. ${esc(byAnom[0].country)} was ${deg(byAnom[0].anomaly_c, 1)}.`)}
            ${step("days", "03", "Dangerous days", `${esc(byDays[0].country)} passed 35°C on <span class="accent">${Math.round(byDays[0].hot_days)} days</span>`, `The Sahel and the Gulf have the most days above 35°C, and models expect more by mid-century.`)}
            ${step("deaths", "04", "The cost", `Heat kills about <span class="accent"><b ${t(f.deaths.source)}>${n0(f.deaths.value)}</b></span> people a year`, `The death rate is up 23% since the 1990s.`)}
            ${step("workers", "05", "Work", `<span class="accent"><b ${t(f.workers.source)}>${f.workers.value} billion</b></span> workers face excessive heat`, `Every degree above 20°C costs 2–3% of a worker's productivity.`)}
            ${step("uk", "06", "The UK", `Summer 2026 was the UK's hottest: <span class="accent"><b ${t(f.uksummer.source)}>${f.uksummer.value}°C</b></span>`, `The May and June heatwaves alone are linked to <b ${t(f.ukdeaths2026.source)}>${n0(f.ukdeaths2026.value)}</b> deaths in England.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="ht-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "anomaly", sel: "IND" };
    const mapEl = main.querySelector("#ht-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return { ...ft, properties: { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name, anomaly: r ? bandIdx("anomaly", r.anomaly_band) : -1, days: r ? bandIdx("days", r.days_band) : -1, change: r ? bandIdx("change", r.change_band) : -1 } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: MAPS[state.mode].vars.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (r, mode) =>
      mode === "anomaly" ? (r.anomaly_c != null ? `${deg(r.anomaly_c)} against 1991–2020` : "No figure")
        : mode === "days" ? (r.hot_days != null ? `${days(r.hot_days)} above 35°C in ${Y}` : "No figure")
          : r.hot_days_change != null ? `${sdays(r.hot_days_change)} days above 35°C against 1991–2020` : "No figure";
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
    const scaleEl = main.querySelector("#ht-scale");
    const SCALE_TITLE = { anomaly: `${Y} against each country's 1991–2020 average:`, days: `Days above 35°C, ${Y}:`, change: `Days above 35°C in ${Y}, against the 1991–2020 average:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(MAPS[state.mode].vars[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#ht-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const head = state.mode === "anomaly"
        ? { eb: `${Y} against 1991–2020`, big: deg(r.anomaly_c), s: r.anomaly_source, sub: `world land and sea <span ${t("owid-anom")}>${deg(DATA.world_anomaly)}</span>` }
        : state.mode === "days"
          ? { eb: `Days above 35°C · ${Y}`, big: days(r.hot_days), s: r.hot_days_source, sub: `1991–2020 average <span ${t(r.hot_days_source)}>${days(r.hot_days_9120)}</span>` }
          : { eb: `Extra days above 35°C · ${Y}`, big: sdays(r.hot_days_change), s: r.hot_days_source, sub: "against the 1991–2020 average" };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="ht-pick"><span class="em-eyebrow">Choose</span><select id="ht-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${head.s ? t(head.s) : ""}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.anomaly_c != null ? row(`${Y} against 1991–2020`, `<span ${t(r.anomaly_source)}>${deg(r.anomaly_c)}</span>`) : ""}
          ${r.mean_temp_c != null ? row(`Average temperature · ${Y}`, `<span ${t(r.mean_temp_source)}>${r.mean_temp_c.toFixed(1)}°C</span>`) : ""}
          ${r.hot_days != null ? row(`Days above 35°C · ${Y}`, `<span ${t(r.hot_days_source)}>${days(r.hot_days)}</span>`) : ""}
          ${r.hot_days_9120 != null ? row("Days above 35°C · 1991–2020", `<span ${t(r.hot_days_source)}>${days(r.hot_days_9120)} a year</span>`) : ""}
          ${r.model_source ? row("Modelled · 1995–2014", `<span ${t(r.model_source)}>${days(r.model_days_1995_2014)} a year</span>`) : ""}
          ${r.model_source ? row("Modelled · 2040–2059", `<span ${t(r.model_source)}>${days(r.model_days_2040_2059)} a year</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#ht-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".ht-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".ht-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash, width }]. Labels each line at its end.
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name) ? (narrow ? 64 : 96) : 58, b: 22, l: 44 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(+v.toFixed(6));
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 56 && x(x1) - px >= 64) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="ht-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="ht-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(Math.max(yMin, 0))}L${x(s.pts[0][0])},${y(Math.max(yMin, 0))}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.width ?? 2.4}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)}` : esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const decades = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const degTick = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}°`;
    const drawGlobal = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: G.map((r) => [r.year, r.anomaly_preindustrial]), endText: deg(g.anomaly_preindustrial, 2) }],
      yMax: 1.8, yMin: -0.3, yStep: 0.3, fmtY: degTick, ref: { v: 1.5, label: "1.5°C" }, xTicks: decades(1875, 2000, 25), h, area: true,
      aria: `Global temperature against 1850–1900: ${deg(G[0].anomaly_preindustrial)} in ${G[0].year}, ${deg(g1980.anomaly_preindustrial)} in 1980, ${deg(gMax.anomaly_preindustrial)} in ${gMax.year} and ${deg(g.anomaly_preindustrial)} in ${g.year}`,
    });
    // Monthly averages of the daily anomalies, one line per year; x is the month index.
    const monthly = (yr) => MON.map((_, m) => { const a = D.filter((d) => d.date.startsWith(`${yr}-${String(m + 1).padStart(2, "0")}`)); return a.length ? [m, a.reduce((s, d) => s + d.anomaly_9120, 0) / a.length] : null; }).filter(Boolean);
    const YRS = [["2023", "--ht-m1"], ["2024", "--ht-m2"], ["2025", "--ht-muted"], ["2026", "--em-accent"]];
    const drawDaily = (el, h) => lineChart(el, {
      series: YRS.map(([yr, v]) => ({ name: yr, short: yr, v, width: yr === "2026" ? 2.8 : 1.8, pts: monthly(yr) })),
      yMax: 1.2, yMin: 0, yStep: 0.3, fmtY: degTick, xTicks: [2, 4, 6, 8, 10], h, xFmt: (v) => MON[v], xEnd: "Dec",
      aria: `Daily global temperature against 1991–2020 for 2023 to 2026. 2023 averaged ${deg(E.find((e) => e.year === 2023).anomaly_9120)}, 2024 ${deg(E.find((e) => e.year === 2024).anomaly_9120)}, 2025 ${deg(E.find((e) => e.year === 2025).anomaly_9120)} and 2026 so far ${deg(e26.anomaly_9120)}`,
    });
    const drawUk = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: UK.map((r) => [r.year, r.summer_mean_c]), endText: `${ukNow.summer_mean_c.toFixed(1)}°C`, width: 1.8 }],
      yMax: 17, yMin: 12, yStep: 1, fmtY: (v) => `${v}°C`, ref: { v: uk6190 }, xTicks: decades(1900, 2000, 25), h,
      aria: `UK summer mean temperature from ${UK[0].summer_mean_c.toFixed(1)}°C in ${UK[0].year} to ${ukNow.summer_mean_c.toFixed(1)}°C in ${ukNow.year}; the 1961–1990 average is ${uk6190.toFixed(1)}°C`,
    });
    const drawAll = () => {
      drawGlobal(main.querySelector("#ht-global"), 240);
      drawDaily(main.querySelector("#ht-daily"), 240);
      drawUk(main.querySelector("#ht-uk"), 220);
    };
    drawAll();

    // ---------- Bars ----------
    const dayBars = (el) => bars(el, byDays.slice(0, 10).map((r, i) => ({ label: r.country, value: r.hot_days, muted: i > 0, src: r.hot_days_source })), (v) => String(Math.round(v)), 365, t);
    dayBars(main.querySelector("#ht-days"));
    bars(main.querySelector("#ht-change"), byChange.slice(0, 10).map((r, i) => ({ label: r.country, value: r.hot_days_change, muted: i > 0, src: r.hot_days_source })), (v) => `+${Math.round(v)}`, byChange[0].hot_days_change, t);
    bars(main.querySelector("#ht-model"), byModel.slice(0, 10).map((r, i) => ({ label: r.country, value: r.model_change, muted: i > 0, src: r.model_source })), (v) => `+${Math.round(v)}`, byModel[0].model_change, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#ht-tbody"), search = main.querySelector("#ht-search");
    let key = "hot_days", dir = -1;
    const cell = (v, s, hide, fmt) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : fmt(v)}</td>`;
    const one = (v) => (Math.abs(v) >= 10 ? String(Math.round(v)) : v.toFixed(1));
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="ht-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.anomaly_c != null ? t(r.anomaly_source) : ""}>${r.anomaly_band ? `<i class="ht-sw" style="background:var(${DIV[bandIdx("anomaly", r.anomaly_band)]})"></i>${deg(r.anomaly_c).replace("°C", "")}` : "–"}</td>
        ${cell(r.hot_days, r.hot_days_source, false, one)}
        ${cell(r.hot_days_9120, r.hot_days_source, true, one)}
        ${cell(r.hot_days_change, r.hot_days_source, true, sdays)}
        ${cell(r.model_days_2040_2059, r.model_source, true, one)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".ht-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#ht-vis");
    function miniMap(el, mode) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", MAPS[mode].label);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso], i = r ? bandIdx(mode, r[MAPS[mode].key]) : -1; return i < 0 ? "var(--em-land)" : `var(${MAPS[mode].vars[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${valueText(r, mode)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = (mode) => `<div class="ht-scale">${BANDS[mode].map((b, i) => `<span>${dot(MAPS[mode].vars[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const waffle = (n) => `<div class="em-waffle">${Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "global") {
        vis.innerHTML = `<p class="vt">Global temperature against 1850–1900</p><div class="m"></div>`;
        drawGlobal(vis.querySelector(".m"), 240);
      } else if (id === "anomaly" || id === "days") {
        const mode = id === "anomaly" ? "anomaly" : "days";
        vis.innerHTML = `<p class="vt">${id === "anomaly" ? `${Y} against each country's 1991–2020 average` : `Days above 35°C, ${Y}`}</p><div class="m"></div>${legend(mode)}`;
        miniMap(vis.querySelector(".m"), mode);
      } else if (id === "deaths") {
        vis.innerHTML = `<p class="vt">Heat-related deaths worldwide</p><div class="vbig">${n0(f.deaths.value)}</div><p class="vsub">a year on average, according to the Lancet Countdown.</p>`;
      } else if (id === "workers") {
        vis.innerHTML = `<p class="vt">Out of every 100 workers, 2020</p>${waffle(71)}<p class="vsub">About <b>71</b> are likely to face excessive heat at work.</p>`;
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">UK summer mean temperature</p><div class="m"></div>`;
        drawUk(vis.querySelector(".m"), 240);
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
