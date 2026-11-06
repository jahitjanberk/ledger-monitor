// Air We Breathe dashboard for Economy Monitor.
// Built on the shared Economy Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const BAND_VARS = ["--ai-b0", "--ai-b1", "--ai-b2", "--ai-b3", "--ai-b4"];
const BANDS = DATA.bands;
const bandIdx = (name) => BANDS.findIndex((b) => b.band === name);
const rateIdx = (v) => (v < 20 ? 0 : v < 40 ? 1 : v < 60 ? 2 : v < 100 ? 3 : 4);
const RATE_LABELS = ["Under 20", "20 to 40", "40 to 60", "60 to 100", "100 or more"];
const ug = (v) => (v == null ? "n/a" : `${v.toFixed(1)} µg/m³`);
const n = (v) => (v == null ? "n/a" : Math.round(v).toLocaleString("en-GB"));
const ppl = (v) => (v == null ? "n/a" : v >= 1e6 ? `${(v / 1e6).toFixed(1)}m` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : n(v));
const pct = (v) => (v == null ? "n/a" : `${v.toFixed(1)}%`);
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
  id: "air",
  title: "The Air We Breathe",
  description:
    "How much fine-particle pollution people breathe in every country, how far that is from the WHO guideline, and the deaths attributed to it, from satellite-based estimates, WHO, IHME and IQAir, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, AQG = DATA.aqg;
    const BY = Object.fromEntries(C.map((r) => [r.iso3, r]));
    const WP = DATA.world_pm25, wp = WP[WP.length - 1], wp00 = WP.find((r) => r.year === 2000) ?? WP[0];
    const WD = DATA.world_deaths, wd = WD[WD.length - 1], wd90 = WD[0];
    const fact = (id) => DATA.facts.find((f) => f.id === id);
    const fAqg = fact("aqg"), f99 = fact("who99"), fIq14 = fact("iq14"), fIq13 = fact("iq13"), fCity = fact("iqcity");
    const within = C.filter((r) => r.pm25 <= AQG);
    const big = C.filter((r) => (r.deaths_air ?? 0) >= 1000);
    const worst = [...big].sort((a, b) => b.pm25 - a.pm25).slice(0, 10);
    const best = [...big].sort((a, b) => a.pm25 - b.pm25).slice(0, 10);
    const mostDeaths = [...big].sort((a, b) => b.deaths_air - a.deaths_air).slice(0, 10);
    const UK = BY.GBR, CN = BY.CHN, IN = BY.IND;
    const shareW = DATA.world_share_deaths;

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "air",
      name: "Air",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (v) => `<i style="background:var(${v})"></i>`;
    const pill = (name) => `<span class="ai-pill">${dot(BAND_VARS[bandIdx(name)])}${esc(name)}</span>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, f, bigText, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(f.source)}>${bigText}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, num, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;
    const options = [...C].sort((a, b) => a.country.localeCompare(b.country));

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Air quality · PM2.5 to ${wp.year}</p>
        <h1>The average person breathes <b ${t(wp.source)}>${wp.pm25.toFixed(1)} µg/m³</b> of fine particles. <span class="accent">That is <b ${t(fAqg.source)}>${Math.round(wp.pm25 / AQG)} times</b> the WHO guideline</span></h1>
        <p class="em-lede">Air pollution was linked to <b ${t(wd.source)}>${ppl(wd.air)}</b> deaths in ${wd.year}, about <b ${t(wd.source)}>1 in 8</b> worldwide. Only <b ${t(within[0]?.source)}>${within.length}</b> countries and territories, almost all remote islands, meet the guideline of <b ${t(fAqg.source)}>${AQG} µg/m³</b>.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>PM2.5 particles are small enough to reach the blood</h2></div></div>
        <div class="em-kpis">
          ${kpi("World exposure", ug(wp.pm25), `Population-weighted PM2.5, ${wp.year}; WHO guideline <span ${t(fAqg.source)}>${AQG} µg/m³</span>`, wp.source, true)}
          ${kpi("Deaths linked", ppl(wd.air), `From outdoor particles, household fuel smoke and ozone, ${wd.year}`, wd.source)}
          ${kpi("Within the guideline", String(within.length), "Countries and territories at 5 µg/m³ or less, mostly small islands", within[0]?.source)}
          ${kpi("Cities that pass", `${fIq14.value}%`, `Of <span ${t(fIq14.source)}>9,446</span> monitored cities met the guideline in 2025`, fIq14.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>${C.length} places, <span class="accent">measured against one guideline</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="ai-mode" data-mode="pm" aria-pressed="true">PM2.5 exposure</button>
                <button type="button" class="ai-mode" data-mode="rate" aria-pressed="false">Death rate</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="ai-map" role="region" aria-label="World map of countries coloured by PM2.5 exposure"></div>
            <div class="ai-scale" id="ai-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="ai-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="deaths">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>The toll over time</p><h2>Cleaner kitchens, <span class="accent">dirtier outdoor air</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World · deaths attributed to air pollution, ${wd90.year} to ${wd.year}</p>
            <h3>Household smoke deaths fell; outdoor particle deaths nearly doubled</h3>
            <p class="note">Deaths from cooking and heating with solid fuels fell from <b ${t(wd90.source)}>${ppl(wd90.household)}</b> to <b ${t(wd.source)}>${ppl(wd.household)}</b>. Deaths from outdoor particles rose from <b ${t(wd90.source)}>${ppl(wd90.ambient_pm)}</b> to <b ${t(wd.source)}>${ppl(wd.ambient_pm)}</b> as populations grew and aged.</p>
            <div id="ai-deaths"></div>
            <p class="ai-key"><span>${dot("--em-accent")}Outdoor particles (PM2.5)</span><span>${dot("--ai-hh")}Household fuel smoke</span><span>${dot("--ai-oz")}Ozone</span></p>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="where">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Where it's worst</p><h2>${esc(DATA.regions[0].region)} breathes <span class="accent">${Math.round(DATA.regions[0].pm25 / DATA.regions[DATA.regions.length - 1].pm25)} times</span> Oceania's pollution</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">By continent · ${DATA.regions[0].year}</p>
            <h3>Population-weighted PM2.5</h3>
            <p class="note">The dashed line is the WHO guideline of ${AQG} µg/m³.</p>
            <div class="em-bars" id="ai-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Highest exposure · ${wp.year}</p>
            <h3>Dust and smoke</h3>
            <p class="note">Gulf states breathe desert dust as well as pollution; South Asia and West Africa breathe smoke from fuel, crops and traffic. Countries with at least 1,000 attributed deaths.</p>
            <div class="em-bars" id="ai-worst"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Most deaths attributed · ${wd.year}</p>
            <h3>China and India: half the toll</h3>
            <p class="note">Deaths from all three types of air pollution.</p>
            <div class="em-bars" id="ai-mostdeaths"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="monitors">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>On the ground</p><h2>What city air monitors <span class="accent">recorded in 2025</span></h2></div></div>
        <div class="em-grid">
          ${factCard("WHO", f99, `${f99.value}%`, `of the world's population lived where WHO air quality guidelines were not met in 2019.`, true)}
          ${factCard("IQAir · 2025", fIq13, String(fIq13.value), `countries and territories met the guideline by monitor readings: ${esc(fIq13.note)}.`)}
          ${factCard("Most polluted city · 2025", fCity, ug(fCity.value), `average in Loni, India, over 22 times the WHO guideline.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>UK air is cleaner than it was, <span class="accent">but not within the guideline</span></h2></div></div>
        <div class="em-grid">
          ${factCard("United Kingdom · PM2.5", { source: UK.source }, ug(UK.pm25), `in ${UK.year}, down from <b ${t(UK.source)}>${ug(UK.pm25_2000)}</b> in 2000. That is still <b>${UK.times_guideline}×</b> the WHO guideline.`, true)}
          ${factCard("United Kingdom · deaths", { source: UK.deaths_source }, ppl(UK.deaths_air), `deaths were attributed to air pollution in ${UK.deaths_year}, <b ${t(UK.deaths_source)}>${pct(UK.share_deaths_pct)}</b> of all deaths. Almost all came from outdoor particles.`)}
          <div class="em-card">
            <p class="em-eyebrow">Two estimates</p>
            <h3>Satellite models and WHO agree closely</h3>
            <p class="note">For the UK, the satellite-based estimate is <b ${t(UK.source)}>${ug(UK.pm25)}</b> (${UK.year}) and WHO's official figure <b ${t(UK.who_source)}>${ug(UK.who_pm25)}</b> (${UK.who_year}). Both weight pollution by where people live.</p>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="ai-search" id="ai-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap ai-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="pm25" aria-sort="descending"><button type="button">PM2.5</button></th>
                <th class="r" data-key="times_guideline" aria-sort="none"><button type="button">× guideline</button></th>
                <th class="r hide-n" data-key="pm25_2000" aria-sort="none"><button type="button">2000</button></th>
                <th class="r hide-n" data-key="deaths_air" aria-sort="none"><button type="button">Deaths ${wd.year}</button></th>
                <th class="r hide-n" data-key="pm_death_rate" aria-sort="none"><button type="button">Per 100k</button></th>
              </tr></thead>
              <tbody id="ai-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>PM2.5 exposure</b> is the annual average concentration of fine particles, 2.5 micrometres across or smaller, weighted by where people live. It comes from Washington University's SatPM estimates, which combine satellite observations of haze, a chemical transport model and ground monitors. It includes natural dust and wildfire smoke as well as human pollution, which is why desert countries rank high. WHO's own SDG 11.6.2 estimate is shown for comparison in each country's details. City monitor readings, such as IQAir's, measure air where monitors sit and can differ from these national averages.</p>
        <p><b>Deaths</b> are IHME's Global Burden of Disease 2023 estimates of deaths from all causes attributable to outdoor particulate matter, household air pollution from solid fuels, and ozone. They are modelled from exposure and the risk of disease at each level; they are not counted from death certificates. The death-rate map shows deaths from outdoor particles per 100,000 people. The WHO guideline of ${AQG} µg/m³ was set in 2021. All series come from Our World in Data's processed copies.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("guideline", "01", "The line", `In 2021 the WHO halved its safe limit to <span class="accent"><b ${t(fAqg.source)}>${AQG} µg/m³</b></span>`, `That is five millionths of a gram of fine particles in every cubic metre of air, averaged over a year.`)}
            ${step("world", "02", "Everyone over it", `The average person breathes <span class="accent"><b ${t(wp.source)}>${Math.round(wp.pm25 / AQG)} times</b></span> that`, `World exposure was <b ${t(wp.source)}>${ug(wp.pm25)}</b> in ${wp.year}, against <b ${t(wp00.source)}>${ug(wp00.pm25)}</b> in ${wp00.year}.`)}
            ${step("map", "03", "Almost nowhere passes", `Only <span class="accent"><b ${t(within[0]?.source)}>${within.length}</b></span> places are within the guideline`, `Iceland, Greenland and remote Pacific islands. Every large country is above it.`)}
            ${step("toll", "04", "The toll", `Air pollution was linked to <span class="accent"><b ${t(wd.source)}>${ppl(wd.air)}</b></span> deaths in ${wd.year}`, `About one in eight deaths worldwide, from heart disease, stroke, lung disease and cancers.`)}
            ${step("shift", "05", "A shifting problem", `Household smoke deaths fell by <span class="accent"><b ${t(wd.source)}>${Math.round((100 * (wd90.household - wd.household)) / wd90.household)}%</b></span>`, `As cleaner cooking fuels spread. Outdoor particle deaths rose from <b ${t(wd90.source)}>${ppl(wd90.ambient_pm)}</b> to <b ${t(wd.source)}>${ppl(wd.ambient_pm)}</b>.`)}
            ${step("cities", "06", "City by city", `Just <span class="accent"><b ${t(fIq14.source)}>${fIq14.value}%</b></span> of monitored cities met the guideline in 2025`, `The most polluted, Loni in India, averaged <b ${t(fCity.source)}>${ug(fCity.value)}</b>.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="ai-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "pm", sel: "GBR" };
    const mapEl = main.querySelector("#ai-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((f) => {
        const r = isoToRow[f.properties.iso];
        return { ...f, properties: { ...f.properties, iso3: r?.iso3 ?? "", pb: r ? bandIdx(r.band) : -1, rb: r && r.pm_death_rate != null ? rateIdx(r.pm_death_rate) : -1, nm: r?.country ?? f.properties.name } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: BAND_VARS.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode === "pm" ? "pb" : "rb"], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
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
          const val = !r ? "No data" : state.mode === "pm" ? `${ug(r.pm25)} · ${r.times_guideline}× guideline` : r.pm_death_rate != null ? `${r.pm_death_rate} deaths per 100k from outdoor particles` : "No death estimate";
          map.getCanvas().style.cursor = r ? "pointer" : "";
          popup.setLngLat(e.lngLat).setText(`${ft.properties.nm} · ${val}`).addTo(map);
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
    const scaleEl = main.querySelector("#ai-scale");
    const drawScale = () => {
      scaleEl.innerHTML = (state.mode === "pm" ? BANDS.map((b, i) => `<span ${t(b.source)}>${dot(BAND_VARS[i])}${esc(b.band)}</span>`).join("") : `<span>Deaths from outdoor particles per 100,000 people, ${wd.year}:</span>` + RATE_LABELS.map((l, i) => `<span>${dot(BAND_VARS[i])}${l}</span>`).join("")) + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#ai-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const tot = (r.deaths_pm ?? 0) + (r.deaths_household ?? 0) + (r.deaths_ozone ?? 0);
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country · ${r.year}</p>
        <label class="ai-pick"><span class="em-eyebrow">Choose</span><select id="ai-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-d-value" ${t(r.source)}>${ug(r.pm25)}</p>
        <p class="em-d-usd"><b>${r.times_guideline}×</b> the WHO guideline · world <span ${t(wp.source)}>${ug(wp.pm25)}</span></p>
        <p class="ai-rate">${pill(r.band)}</p>
        ${tot ? `<p class="em-eyebrow" style="margin-top:16px">Deaths attributed · ${r.deaths_year}</p>
          <div class="ai-stack" role="img" aria-label="Outdoor particles ${n(r.deaths_pm)}, household smoke ${n(r.deaths_household)}, ozone ${n(r.deaths_ozone)}">
            <span style="flex:${r.deaths_pm};background:var(--em-accent)" ${t(r.deaths_source)}></span><span style="flex:${r.deaths_household};background:var(--ai-hh)" ${t(r.deaths_source)}></span><span style="flex:${r.deaths_ozone};background:var(--ai-oz)" ${t(r.deaths_source)}></span></div>
          <p class="ai-key"><span>${dot("--em-accent")}Outdoor ${ppl(r.deaths_pm)}</span><span>${dot("--ai-hh")}Household ${ppl(r.deaths_household)}</span><span>${dot("--ai-oz")}Ozone ${ppl(r.deaths_ozone)}</span></p>` : ""}
        <dl class="em-d-list" style="margin-top:12px">
          ${r.pm25_2000 != null ? row("PM2.5 in 2000", `<span ${t(r.source)}>${ug(r.pm25_2000)}</span>`) : ""}
          ${r.pm25_human != null ? row("From human sources", `<span ${t(r.source)}>${ug(r.pm25_human)}</span>`) : ""}
          ${r.who_pm25 != null ? row(`WHO estimate · ${r.who_year}`, `<span ${t(r.who_source)}>${ug(r.who_pm25)}</span>`) : ""}
          ${r.deaths_air != null ? row("All air pollution deaths", `<span ${t(r.deaths_source)}>${n(r.deaths_air)}</span>`) : ""}
          ${r.share_deaths_pct != null ? row("Share of all deaths", `<span ${t(r.deaths_source)}>${pct(r.share_deaths_pct)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#ai-select").addEventListener("change", (e) => select(e.target.value, true));
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
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      if (map.getProjection?.()?.type === "globe") map.easeTo({ center: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2], duration: 800 });
      else map.fitBounds([[Math.min(...xs) - 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.max(...ys) + 4]], { padding: 24, maxZoom: 4 });
    }
    main.querySelectorAll(".ai-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".ai-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mapEl.setAttribute("aria-label", state.mode === "pm" ? "World map of countries coloured by PM2.5 exposure" : "World map of countries coloured by death rate from outdoor particle pollution");
      drawScale();
      repaint();
    }));
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [70, 20], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- Deaths chart ----------
    function drawDeaths(el, h = 240) {
      const w = Math.max(300, el.clientWidth), narrow = w < 520, pad = { t: 10, r: narrow ? 108 : 172, b: 22, l: 44 };
      const max = Math.ceil(Math.max(...WD.flatMap((r) => [r.ambient_pm, r.household])) / 1e6) * 1e6;
      const x = (yr) => pad.l + ((yr - WD[0].year) / (wd.year - WD[0].year)) * (w - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      const line = (k, v) => `<polyline points="${WD.map((r) => `${x(r.year)},${y(r[k])}`).join(" ")}" fill="none" stroke="var(${v})" stroke-width="2.5"/>`;
      // Label each line at its end instead of relying only on the legend.
      const ends = [["ambient_pm", "--em-accent", narrow ? "Outdoor" : "Outdoor PM2.5"], ["household", "--ai-hh", "Household"], ["ozone", "--ai-oz", "Ozone"]]
        .map(([k, v, name]) => ({ k, v, name, y: y(wd[k]) }))
        .sort((a, b) => a.y - b.y);
      ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < 13) e.y = ends[i - 1].y + 13; });
      const yTicks = Array.from({ length: max / 1e6 + 1 }, (_, i) => i * 1e6);
      const step = narrow ? 10 : 5;
      const xTicks = WD.map((r) => r.year).filter((yr) => yr % step === 0 && wd.year - yr >= 3);
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="Deaths from outdoor particles rose from ${ppl(wd90.ambient_pm)} in ${wd90.year} to ${ppl(wd.ambient_pm)} in ${wd.year}; household smoke deaths fell from ${ppl(wd90.household)} to ${ppl(wd.household)}">
        ${yTicks.map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="ai-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${v ? ppl(v) : "0"}</text>`).join("")}
        ${line("ozone", "--ai-oz")}${line("household", "--ai-hh")}${line("ambient_pm", "--em-accent")}
        ${ends.map((e) => `<circle cx="${x(wd.year)}" cy="${y(wd[e.k])}" r="3" fill="var(${e.v})"/><text x="${x(wd.year) + 8}" y="${e.y + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${esc(e.name)} ${ppl(wd[e.k])}</text>`).join("")}
        ${xTicks.map((yr) => `<text x="${x(yr)}" y="${h - 6}" text-anchor="${yr === WD[0].year ? "start" : "middle"}" class="em-tick">${yr}</text>`).join("")}<text x="${x(wd.year)}" y="${h - 6}" text-anchor="middle" class="em-tick">${wd.year}</text></svg>`;
    }
    const drawDeathsMain = () => drawDeaths(main.querySelector("#ai-deaths"));
    drawDeathsMain();

    // ---------- Bars ----------
    const pmCol = (v) => `var(${BAND_VARS[v <= 5 ? 0 : v <= 10 ? 1 : v <= 15 ? 2 : v <= 35 ? 3 : 4]})`;
    const colour = (sel, list, key = "pm25") => main.querySelectorAll(`${sel} .em-bars-fill`).forEach((el, i) => (el.style.background = pmCol(list[i][key])));
    bars(main.querySelector("#ai-regions"), DATA.regions.map((r) => ({ label: r.region, value: r.pm25, src: r.source })), ug, 40, t);
    colour("#ai-regions", DATA.regions);
    main.querySelectorAll("#ai-regions .em-bars-track").forEach((tr) => tr.insertAdjacentHTML("beforeend", `<i class="ai-aqg" style="left:${(100 * AQG) / 40}%"></i>`));
    bars(main.querySelector("#ai-worst"), worst.map((r) => ({ label: r.country, value: r.pm25, src: r.source })), ug, 80, t);
    colour("#ai-worst", worst);
    bars(main.querySelector("#ai-mostdeaths"), mostDeaths.map((r, i) => ({ label: r.country, value: r.deaths_air, muted: i > 1, src: r.deaths_source })), ppl, mostDeaths[0].deaths_air, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#ai-tbody"), search = main.querySelector("#ai-search");
    let key = "pm25", dir = -1;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="ai-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${t(r.source)}><i class="ai-sw" style="background:${pmCol(r.pm25)}"></i>${r.pm25.toFixed(1)}</td>
        <td class="r" ${t(r.source)}>${r.times_guideline}×</td>
        <td class="r hide-n" ${t(r.source)}>${r.pm25_2000 == null ? "–" : r.pm25_2000.toFixed(1)}</td>
        <td class="r hide-n" ${r.deaths_source ? t(r.deaths_source) : ""}>${r.deaths_air == null ? "–" : n(r.deaths_air)}</td>
        <td class="r hide-n" ${r.deaths_source ? t(r.deaths_source) : ""}>${r.pm_death_rate == null ? "–" : r.pm_death_rate.toFixed(1)}</td></tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".ai-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#ai-vis");
    function miniMap(el, only) {
      const w = Math.max(280, el.clientWidth), h = Math.round(w * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [w - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${w} ${h}`).attr("role", "img").attr("aria-label", "World map coloured by PM2.5 exposure");
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso]; if (!r) return "var(--em-land)"; const i = bandIdx(r.band); return only != null && i !== only ? "var(--em-land)" : `var(${BAND_VARS[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${ug(r.pm25)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "guideline") {
        vis.innerHTML = `<p class="vt">WHO annual PM2.5 guideline</p><div class="vbig">${AQG} µg/m³</div><p class="vsub">Down from 10 µg/m³ in the previous guideline.</p>`;
      } else if (id === "world") {
        vis.innerHTML = `<p class="vt">PM2.5 exposure, ${wp.year}</p><div class="m"></div><div class="ai-scale">${BANDS.map((b, i) => `<span>${dot(BAND_VARS[i])}${esc(b.band)}</span>`).join("")}</div>`;
        miniMap(vis.querySelector(".m"));
      } else if (id === "map") {
        vis.innerHTML = `<p class="vt">Within the WHO guideline, ${wp.year}</p><div class="m"></div><p class="vsub">${within.slice(0, 8).map((r) => esc(r.country)).join(", ")} and others.</p>`;
        miniMap(vis.querySelector(".m"), 0);
      } else if (id === "toll") {
        vis.innerHTML = `<p class="vt">Out of every 100 deaths, ${wd.year}</p><div class="em-waffle">${Array.from({ length: 100 }, (_, i) => `<i class="${i < Math.round(shareW) ? "on" : ""}"></i>`).join("")}</div><p class="vsub">About <b>${Math.round(shareW)}</b> are linked to air pollution.</p>`;
      } else if (id === "shift") {
        vis.innerHTML = `<p class="vt">World deaths attributed, ${WD[0].year} to ${wd.year}</p><div class="m"></div><p class="ai-key"><span>${dot("--em-accent")}Outdoor particles</span><span>${dot("--ai-hh")}Household smoke</span><span>${dot("--ai-oz")}Ozone</span></p>`;
        drawDeaths(vis.querySelector(".m"), 240);
      } else if (id === "cities") {
        const p = fIq14.value;
        vis.innerHTML = `<p class="vt">Monitored cities in 2025 · out of every 100</p><div class="em-waffle ai-pass">${Array.from({ length: 100 }, (_, i) => `<i class="${i < p ? "on" : ""}"></i>`).join("")}</div><p class="vsub"><b>${p}</b> met the WHO guideline.</p>`;
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); drawDeathsMain(); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { story.redraw(); drawDeathsMain(); }, 150); });
  },
};
