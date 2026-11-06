// Electricity Mix & Grid Carbon dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const BAND_VARS = ["--el-b0", "--el-b1", "--el-b2", "--el-b3", "--el-b4"];
const BANDS = DATA.bands;
const bandIdx = (name) => BANDS.findIndex((b) => b.band === name);
const lcIdx = (v) => (v >= 80 ? 0 : v >= 60 ? 1 : v >= 40 ? 2 : v >= 20 ? 3 : 4);
const LC_LABELS = ["80% or more", "60 to 80%", "40 to 60%", "20 to 40%", "Under 20%"];
const MIX = [
  ["coal", "Coal"], ["gas", "Gas"], ["oil", "Oil"], ["nuclear", "Nuclear"], ["hydro", "Hydro"],
  ["wind", "Wind"], ["solar", "Solar"], ["bioenergy", "Bioenergy"], ["other_renewables", "Other renewables"],
];
const mixVar = (k) => `--el-${k.replace("_", "-")}`;

const pct = (v) => (v == null ? "n/a" : `${v.toFixed(1)}%`);
const g = (v) => (v == null ? "n/a" : `${Math.round(v).toLocaleString("en-GB")} g`);
const twh = (v) => (v == null ? "n/a" : v >= 1000 ? `${(v / 1000).toFixed(1)}k TWh` : `${v >= 10 ? Math.round(v) : v.toFixed(1)} TWh`);
const kwh = (v) => (v == null ? "n/a" : `${Math.round(v).toLocaleString("en-GB")} kWh`);
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
  id: "electricity",
  title: "Electricity Mix & Grid Carbon",
  description:
    "What the world's electricity is made from and how much carbon each kilowatt-hour carries, country by country, from Ember's yearly electricity data, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries;
    const BY = Object.fromEntries(C.map((r) => [r.iso3, r]));
    const W = DATA.world, w25 = W[W.length - 1], w15 = W.find((r) => r.year === 2015), w00 = W[0];
    const UK = DATA.uk, uk25 = UK[UK.length - 1], ukPeak = UK.reduce((a, b) => (b.coal_pct > a.coal_pct ? b : a));
    const fact = (id) => DATA.facts.find((f) => f.id === id);
    const fSolar = fact("solar_growth"), fSD = fact("solar_demand"), fWS = fact("wind_solar_demand"), fDem = fact("demand_growth"), fFos = fact("fossil_change"), fUk = fact("uk_coal_end");
    const regs = DATA.regions.filter((r) => r.region !== "World");
    const regCIhi = regs.reduce((a, b) => (b.carbon_intensity_g_kwh > a.carbon_intensity_g_kwh ? b : a)), regCIlo = regs.reduce((a, b) => (b.carbon_intensity_g_kwh < a.carbon_intensity_g_kwh ? b : a));
    const big = C.filter((r) => r.generation_twh >= 50);
    const clean = [...big].sort((a, b) => a.carbon_intensity_g_kwh - b.carbon_intensity_g_kwh).slice(0, 8);
    const dirty = [...big].sort((a, b) => b.carbon_intensity_g_kwh - a.carbon_intensity_g_kwh).slice(0, 8);
    const under100 = C.filter((r) => r.carbon_intensity_g_kwh < 100);
    const drop = Math.round((100 * (w15.carbon_intensity_g_kwh - w25.carbon_intensity_g_kwh)) / w15.carbon_intensity_g_kwh);

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "electricity",
      name: "Electricity",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (v) => `<i style="background:var(${v})"></i>`;
    const pill = (name) => `<span class="el-pill">${dot(BAND_VARS[bandIdx(name)])}${esc(name)} g</span>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, f, bigText, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(f.source)}>${bigText}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, n, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${n}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;
    const mixBar = (r, label = true) =>
      `<div class="el-stack" role="img" aria-label="${MIX.filter(([k]) => r[k + "_pct"]).map(([k, l]) => `${l} ${pct(r[k + "_pct"])}`).join(", ")}">${MIX.map(([k, l]) => (r[k + "_pct"] ? `<span style="flex:${r[k + "_pct"]};background:var(${mixVar(k)})" title="${l}: ${pct(r[k + "_pct"])}" ${t(r.source)}></span>` : "")).join("")}</div>` +
      (label ? `<p class="el-key">${MIX.filter(([k]) => r[k + "_pct"] >= 0.5).map(([k, l]) => `<span>${dot(mixVar(k))}${l} ${pct(r[k + "_pct"])}</span>`).join("")}</p>` : "");
    const options = [...C].sort((a, b) => a.country.localeCompare(b.country));

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Electricity · 2025 data</p>
        <h1>In 2025, renewables made <span class="accent"><b ${t(w25.source)}>${pct(w25.renewables_pct)}</b> of the world's electricity</span>, overtaking coal at <b ${t(w25.source)}>${pct(w25.coal_pct)}</b></h1>
        <p class="em-lede">Each kilowatt-hour now carries <b ${t(w25.source)}>${g(w25.carbon_intensity_g_kwh)}</b> of CO₂ on average, <b ${t(w15.source)}>${drop}%</b> less than in 2015. Solar grew faster than any source ever has, and met <b ${t(fSD.source)}>${fSD.value}%</b> of the growth in demand.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Grams of CO₂ per <span class="accent">kilowatt-hour</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("World grid carbon", g(w25.carbon_intensity_g_kwh), `CO₂e per kWh in 2025, down from <span ${t(w15.source)}>${g(w15.carbon_intensity_g_kwh)}</span> in 2015`, w25.source, true)}
          ${kpi("Low-carbon share", pct(w25.low_carbon_pct), "Renewables plus nuclear, share of world generation, 2025", w25.source)}
          ${kpi("Solar's share", pct(w25.solar_pct), `After a record <span ${t(fSolar.source)}>+${fSolar.value} TWh</span> in one year`, w25.source)}
          ${kpi("Clean grids", String(under100.length), "Countries under 100 g per kWh, latest year", under100[0]?.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>${C.length} grids, <span class="accent">one measure of carbon</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="el-mode" data-mode="ci" aria-pressed="true">Carbon intensity</button>
                <button type="button" class="el-mode" data-mode="lc" aria-pressed="false">Low-carbon share</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="el-map" role="region" aria-label="World map of countries coloured by carbon intensity of electricity"></div>
            <div class="el-scale" id="el-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="el-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="mix">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>The world's mix</p><h2>Twenty-five years of <span class="accent">generation by source</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World · share of generation, ${w00.year} to ${w25.year}</p>
            <h3>Coal's share has slipped as solar and wind have risen</h3>
            <p class="note">Each band is one source's share of world electricity. Hover or tap the chart for a year.</p>
            <div id="el-area" class="el-area"></div>
            <p class="el-key" id="el-area-key"></p>
            <p class="note" id="el-area-read" style="margin-top:8px"></p>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="regions">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>By region</p><h2>The ${esc(regCIhi.region)}'s grid carries <span class="accent">${(regCIhi.carbon_intensity_g_kwh / regCIlo.carbon_intensity_g_kwh).toFixed(1)} times</span> the carbon of ${esc(regCIlo.region)}'s</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Ember regions · ${regs[0].year}</p>
            <h3>Carbon intensity, g CO₂e per kWh</h3>
            <p class="note">Life-cycle emissions per unit of electricity generated. The world average is <b ${t(w25.source)}>${g(w25.carbon_intensity_g_kwh)}</b>.</p>
            <div class="em-bars" id="el-reg-ci"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Ember regions · ${regs[0].year}</p>
            <h3>Renewables' share of generation</h3>
            <p class="note">Hydro, wind, solar, bioenergy and other renewables.</p>
            <div class="em-bars" id="el-reg-re"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="rank">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Cleanest and dirtiest</p><h2>The cleanest and dirtiest of the big grids</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Lowest carbon intensity</p>
            <h3>Hydro and nuclear grids</h3>
            <p class="note">Mostly hydropower, nuclear, or both.</p>
            <div class="em-bars" id="el-clean"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Highest carbon intensity</p>
            <h3>Coal grids and old gas plants</h3>
            <p class="note">Heavy on coal, or on inefficient gas and oil plants.</p>
            <div class="em-bars" id="el-dirty"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>The UK took coal from <span class="accent">${Math.round(ukPeak.coal_pct)}% to ${pct(uk25.coal_pct)}</span> in ${uk25.year - ukPeak.year} years</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">United Kingdom · ${UK[0].year} to ${uk25.year}</p>
            <h3>Coal's share of UK electricity, and grid carbon</h3>
            <p class="note">Coal peaked at <b ${t(ukPeak.source)}>${pct(ukPeak.coal_pct)}</b> in ${ukPeak.year}. Grid carbon fell from <b ${t(ukPeak.source)}>${g(ukPeak.carbon_intensity_g_kwh)}</b> to <b ${t(uk25.source)}>${g(uk25.carbon_intensity_g_kwh)}</b> per kWh.</p>
            <div id="el-uk"></div>
            <p class="el-key"><span>${dot("--el-coal")}Coal share</span><span>${dot("--em-accent")}Carbon intensity</span></p>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">United Kingdom · ${uk25.year} mix</p>
            <h3>${uk25.wind_pct > uk25.gas_pct ? "Wind is now the biggest single source" : "Gas and wind now make about the same"}</h3>
            <p class="note">Wind made <b ${t(uk25.source)}>${pct(uk25.wind_pct)}</b> of UK electricity and gas <b ${t(uk25.source)}>${pct(uk25.gas_pct)}</b>.</p>
            ${mixBar(uk25)}
            <div class="em-cites"></div>
          </div>
          ${factCard("The last coal plant", fUk, "Sep 2024", `Ratcliffe-on-Soar, the UK's last coal power station, closed, ending more than 140 years of coal-fired electricity.`, true)}
        </div>
      </section>

      <section class="em-sec" id="y2025">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>2025 in numbers</p><h2>Clean power met <span class="accent">all the growth</span> in demand</h2></div></div>
        <div class="em-grid">
          ${factCard("Solar · 2025", fSolar, `+${fSolar.value} TWh`, `${esc(fSolar.note)}. It alone met <b ${t(fSD.source)}>${fSD.value}%</b> of the rise in demand.`, true)}
          ${factCard("Solar and wind · 2025", fWS, `${fWS.value}%`, `of the <b ${t(fDem.source)}>${fDem.value} TWh</b> rise in global electricity demand was met by solar and wind together.`)}
          ${factCard("Fossil power · 2025", fFos, `${fFos.value} TWh`, `${esc(fFos.note.replace(/^-(?=\d)/, "Down "))}.`)}
          <div class="em-card">
            <p class="em-eyebrow">Part of Ledger Monitor</p>
            <h3>Where the internet lives</h3>
            <p class="note">Data centres are one of the fastest-growing users of electricity. See how much they use, country by country, on the internet dashboard.</p>
            <a class="em-back" href="../internet/index.html" style="align-self:flex-start;margin-top:auto">Open the internet dashboard →</a>
          </div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="el-search" id="el-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap el-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="carbon_intensity_g_kwh" aria-sort="none"><button type="button">g CO₂/kWh</button></th>
                <th class="r" data-key="low_carbon_pct" aria-sort="none"><button type="button">Low-carbon</button></th>
                <th class="r hide-n" data-key="coal_pct" aria-sort="none"><button type="button">Coal</button></th>
                <th class="r hide-n" data-key="sw" aria-sort="none"><button type="button">Wind + solar</button></th>
                <th class="r hide-n" data-key="generation_twh" aria-sort="descending"><button type="button">Generation</button></th>
                <th class="r hide-n" data-key="year" aria-sort="none"><button type="button">Year</button></th>
              </tr></thead>
              <tbody id="el-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">09</span>Method</p>
        <p><b>Carbon intensity</b> is Ember's life-cycle estimate of greenhouse gases emitted per kilowatt-hour generated, in grams of CO₂ equivalent. It counts emissions from building and fuelling plants as well as burning fuel, so even wind, solar and nuclear carry a small amount. It measures where electricity is generated, not where it is used, so imports and exports are not counted.</p>
        <p>Generation shares are the share of each country's total electricity generation. Ember publishes 2025 figures for ${C.filter((r) => r.year === 2025).length} countries so far; the rest show 2024, marked in the table. Figures come from Our World in Data's copy of Ember's Yearly Electricity Data (April 2026 release). The world figures match Ember's Global Electricity Review 2026. Renewables include hydro, wind, solar, bioenergy and other renewables; low-carbon adds nuclear.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("overtake", "01", "A first", `In 2025, renewables made more of the world's electricity than <span class="accent">coal</span>`, `<b ${t(w25.source)}>${pct(w25.renewables_pct)}</b> against <b ${t(w25.source)}>${pct(w25.coal_pct)}</b>. Coal fell below a third of global generation.`)}
            ${step("solar", "02", "The surge", `Solar added <span class="accent"><b ${t(fSolar.source)}>${fSolar.value} TWh</b></span> in a single year`, `A record for any source. Solar alone met <b ${t(fSD.source)}>${fSD.value}%</b> of the rise in demand, and fossil generation fell for the first time since 2020.`)}
            ${step("trend", "03", "Cleaner each year", `Each kilowatt-hour now carries <span class="accent"><b ${t(w25.source)}>${g(w25.carbon_intensity_g_kwh)}</b></span> of CO₂`, `Down <b>${drop}%</b> since 2015, when the world's grids averaged <b ${t(w15.source)}>${g(w15.carbon_intensity_g_kwh)}</b>.`)}
            ${step("map", "04", "But not everywhere", `Grid carbon still ranges from under 30 g to <span class="accent">over 600 g</span>`, `Norway's hydropower makes <b ${t(BY.NOR.source)}>${g(BY.NOR.carbon_intensity_g_kwh)}</b> per kWh; coal-heavy South Africa makes <b ${t(BY.ZAF.source)}>${g(BY.ZAF.carbon_intensity_g_kwh)}</b>.`)}
            ${step("uk", "05", "Close to home", `The UK took coal from <span class="accent">${Math.round(ukPeak.coal_pct)}%</span> of its electricity to almost nothing`, `Its last coal plant closed in September 2024. Grid carbon has fallen by <b>${Math.round((100 * (ukPeak.carbon_intensity_g_kwh - uk25.carbon_intensity_g_kwh)) / ukPeak.carbon_intensity_g_kwh)}%</b> since ${ukPeak.year}.`)}
            ${step("left", "06", "What's left", `Fossil fuels still make <span class="accent"><b ${t(w25.source)}>${pct(w25.fossil_pct)}</b></span> of the world's electricity`, `Low-carbon sources make the other <b ${t(w25.source)}>${pct(w25.low_carbon_pct)}</b>. The question now is how fast clean power can outpace demand.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="el-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "ci", sel: "GBR" };
    const mapEl = main.querySelector("#el-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((f) => {
        const r = isoToRow[f.properties.iso];
        return { ...f, properties: { ...f.properties, iso3: r?.iso3 ?? "", cb: r ? bandIdx(r.band) : -1, lb: r && r.low_carbon_pct != null ? lcIdx(r.low_carbon_pct) : -1, nm: r?.country ?? f.properties.name } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: BAND_VARS.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode === "ci" ? "cb" : "lb"], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
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
          const val = !r ? "No data" : state.mode === "ci" ? `${g(r.carbon_intensity_g_kwh)} CO₂e/kWh · ${r.year}` : `${pct(r.low_carbon_pct)} low-carbon · ${r.year}`;
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
    const scaleEl = main.querySelector("#el-scale");
    const drawScale = () => {
      scaleEl.innerHTML = (state.mode === "ci"
        ? BANDS.map((b, i) => `<span ${t(b.source)}>${dot(BAND_VARS[i])}${esc(b.band)} g</span>`).join("")
        : LC_LABELS.map((l, i) => `<span>${dot(BAND_VARS[i])}${l}</span>`).join("")) + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#el-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const d = r.carbon_intensity_2015 != null ? r.carbon_intensity_g_kwh - r.carbon_intensity_2015 : null;
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country · ${r.year}</p>
        <label class="el-pick"><span class="em-eyebrow">Choose</span><select id="el-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-d-value" ${t(r.source)}>${g(r.carbon_intensity_g_kwh)}</p>
        <p class="em-d-usd">of CO₂ equivalent per kWh generated · world <span ${t(w25.source)}>${g(w25.carbon_intensity_g_kwh)}</span></p>
        <p class="el-rate">${pill(r.band)}</p>
        <p class="em-eyebrow" style="margin-top:16px">Generation mix · ${r.year}</p>
        ${mixBar(r)}
        <dl class="em-d-list" style="margin-top:12px">
          ${row("Low-carbon share", `<span ${t(r.source)}>${pct(r.low_carbon_pct)}</span>`)}
          ${row("Renewables share", `<span ${t(r.source)}>${pct(r.renewables_pct)}</span>`)}
          ${row("Generation", `<span ${t(r.source)}>${twh(r.generation_twh)}</span>`)}
          ${r.per_capita_kwh != null ? row("Per person", `<span ${t(r.source)}>${kwh(r.per_capita_kwh)}</span>`) : ""}
          ${r.carbon_intensity_2015 != null ? row("2015 intensity", `<span ${t(r.source)}>${g(r.carbon_intensity_2015)}</span>${d ? ` <span class="${d > 0 ? "up" : "down"}">(${d > 0 ? "+" : "−"}${Math.abs(Math.round(d))} g)</span>` : ""}`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#el-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".el-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".el-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mapEl.setAttribute("aria-label", state.mode === "ci" ? "World map of countries coloured by carbon intensity of electricity" : "World map of countries coloured by low-carbon share of electricity");
      drawScale();
      repaint();
    }));
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [30, 20], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- World stacked area ----------
    const areaEl = main.querySelector("#el-area"), areaRead = main.querySelector("#el-area-read");
    const ORDER = ["coal", "gas", "oil", "nuclear", "hydro", "bioenergy", "other_renewables", "wind", "solar"];
    const label = (k) => MIX.find((m) => m[0] === k)[1];
    function drawArea(el, w, h, withHover) {
      const pad = { t: 8, r: 8, b: 22, l: 30 };
      const x = (yr) => pad.l + ((yr - W[0].year) / (W[W.length - 1].year - W[0].year)) * (w - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / 100) * (h - pad.t - pad.b);
      const cum = W.map(() => 0);
      let paths = "";
      for (const k of ORDER) {
        const lo = [...cum];
        W.forEach((r, i) => (cum[i] += r[k + "_pct"] || 0));
        const top = W.map((r, i) => `${x(r.year)},${y(cum[i])}`);
        const bot = W.map((r, i) => `${x(r.year)},${y(lo[i])}`).reverse();
        paths += `<polygon points="${top.join(" ")} ${bot.join(" ")}" fill="var(${mixVar(k)})"><title>${label(k)}</title></polygon>`;
      }
      const ticks = [0, 25, 50, 75, 100].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="el-grid"/><text x="${pad.l - 4}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${v}%</text>`).join("");
      const yrs = [W[0].year, 2010, 2020, W[W.length - 1].year].map((yr) => `<text x="${x(yr)}" y="${h - 6}" text-anchor="middle" class="em-tick">${yr}</text>`).join("");
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="World electricity generation share by source, ${W[0].year} to ${W[W.length - 1].year}">${paths}${ticks}${yrs}<line class="el-cursor" x1="0" x2="0" y1="${pad.t}" y2="${h - pad.b}" visibility="hidden"/></svg>`;
      if (!withHover) return;
      const svg = el.querySelector("svg"), cur = svg.querySelector(".el-cursor");
      const show = (r) => {
        cur.setAttribute("x1", x(r.year)); cur.setAttribute("x2", x(r.year)); cur.setAttribute("visibility", "visible");
        areaRead.innerHTML = `<b>${r.year}</b> · ${ORDER.slice().reverse().filter((k) => r[k + "_pct"] >= 0.5).map((k) => `${label(k)} ${pct(r[k + "_pct"])}`).join(" · ")} · <b>${g(r.carbon_intensity_g_kwh)}</b> CO₂e/kWh`;
      };
      const pick = (ev) => {
        const b = svg.getBoundingClientRect(), px = ((ev.clientX - b.left) / b.width) * w;
        const yr = Math.round(W[0].year + ((px - pad.l) / (w - pad.l - pad.r)) * (W[W.length - 1].year - W[0].year));
        const r = W.find((d) => d.year === Math.max(W[0].year, Math.min(W[W.length - 1].year, yr)));
        if (r) show(r);
      };
      svg.addEventListener("pointermove", pick);
      svg.addEventListener("pointerdown", pick);
      show(w25);
    }
    const drawAreaMain = () => drawArea(areaEl, Math.max(300, areaEl.clientWidth), 260, true);
    drawAreaMain();
    main.querySelector("#el-area-key").innerHTML = ORDER.slice().reverse().map((k) => `<span>${dot(mixVar(k))}${label(k)}</span>`).join("");

    // ---------- Regions and rankings ----------
    const ciCol = (v) => `var(${BAND_VARS[v < 100 ? 0 : v < 250 ? 1 : v < 400 ? 2 : v < 600 ? 3 : 4]})`;
    const colourBars = (sel, list) => main.querySelectorAll(`${sel} .em-bars-fill`).forEach((el, i) => (el.style.background = ciCol(list[i].carbon_intensity_g_kwh)));
    const regCI = [...regs].sort((a, b) => b.carbon_intensity_g_kwh - a.carbon_intensity_g_kwh);
    bars(main.querySelector("#el-reg-ci"), regCI.map((r) => ({ label: r.region, value: r.carbon_intensity_g_kwh, src: r.source })), g, 700, t);
    colourBars("#el-reg-ci", regCI);
    const regRE = [...regs].sort((a, b) => b.renewables_pct - a.renewables_pct);
    bars(main.querySelector("#el-reg-re"), regRE.map((r) => ({ label: r.region, value: r.renewables_pct, src: r.source })), pct, 100, t);
    bars(main.querySelector("#el-clean"), clean.map((r) => ({ label: r.country, value: r.carbon_intensity_g_kwh, src: r.source })), g, 1000, t);
    colourBars("#el-clean", clean);
    bars(main.querySelector("#el-dirty"), dirty.map((r) => ({ label: r.country, value: r.carbon_intensity_g_kwh, src: r.source })), g, 1000, t);
    colourBars("#el-dirty", dirty);

    // ---------- UK chart ----------
    function drawUK(el) {
      const w = Math.max(280, el.clientWidth), h = 180, pad = { t: 10, r: 34, b: 22, l: 30 };
      const x = (yr) => pad.l + ((yr - UK[0].year) / (uk25.year - UK[0].year)) * (w - pad.l - pad.r);
      const yL = (v) => pad.t + (1 - v / 50) * (h - pad.t - pad.b);
      const yR = (v) => pad.t + (1 - v / 600) * (h - pad.t - pad.b);
      const coal = UK.map((r) => `${x(r.year)},${yL(r.coal_pct)}`).join(" ");
      const ci = UK.map((r) => `${x(r.year)},${yR(r.carbon_intensity_g_kwh)}`).join(" ");
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="UK coal share fell from ${pct(ukPeak.coal_pct)} in ${ukPeak.year} to ${pct(uk25.coal_pct)} in ${uk25.year}; carbon intensity from ${g(ukPeak.carbon_intensity_g_kwh)} to ${g(uk25.carbon_intensity_g_kwh)}">
        ${[0, 25, 50].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${yL(v)}" y2="${yL(v)}" class="el-grid"/><text x="${pad.l - 4}" y="${yL(v) + 3}" text-anchor="end" class="em-tick">${v}%</text>`).join("")}
        ${[0, 300, 600].map((v) => `<text x="${w - pad.r + 4}" y="${yR(v) + 3}" class="em-tick">${v}g</text>`).join("")}
        <polyline points="${coal}" fill="none" stroke="var(--el-coal)" stroke-width="2.5"/>
        <polyline points="${ci}" fill="none" stroke="var(--em-accent)" stroke-width="2.5"/>
        <text x="${pad.l}" y="${h - 6}" class="em-tick">${UK[0].year}</text><text x="${w - pad.r}" y="${h - 6}" text-anchor="end" class="em-tick">${uk25.year}</text></svg>`;
    }
    drawUK(main.querySelector("#el-uk"));

    // ---------- Table ----------
    const tbody = main.querySelector("#el-tbody"), search = main.querySelector("#el-search");
    const rows = C.map((r) => ({ ...r, sw: (r.wind_pct || 0) + (r.solar_pct || 0) }));
    let key = "generation_twh", dir = -1;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = rows.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
          <td><button type="button" class="el-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
          <td class="r" ${t(r.source)}><i class="el-sw" style="background:${ciCol(r.carbon_intensity_g_kwh)}"></i>${Math.round(r.carbon_intensity_g_kwh)}</td>
          <td class="r" ${t(r.source)}>${pct(r.low_carbon_pct)}</td>
          <td class="r hide-n" ${t(r.source)}>${pct(r.coal_pct)}</td>
          <td class="r hide-n" ${t(r.source)}>${pct(r.sw)}</td>
          <td class="r hide-n" ${t(r.source)}>${twh(r.generation_twh)}</td>
          <td class="r hide-n">${r.year}</td></tr>`).join("") || `<tr><td colspan="7">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".el-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#el-vis");
    function miniMap(el) {
      const w = Math.max(280, el.clientWidth), h = Math.round(w * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [w - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${w} ${h}`).attr("role", "img").attr("aria-label", "World map coloured by carbon intensity of electricity");
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso]; return r ? `var(${BAND_VARS[bandIdx(r.band)]})` : "var(--em-land)"; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${g(r.carbon_intensity_g_kwh)}` : ft.properties.name; });
      el.append(svg.node());
    }
    function lineSvg(el, data, key, max, fmt) {
      const w = Math.max(280, el.clientWidth), h = 160, pad = 26;
      const x = (yr) => pad + ((yr - data[0].year) / (data[data.length - 1].year - data[0].year)) * (w - 2 * pad);
      const y = (v) => h - pad - (v / max) * (h - 2 * pad);
      el.insertAdjacentHTML("beforeend", `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="${data[0].year} ${fmt(data[0][key])} to ${data[data.length - 1].year} ${fmt(data[data.length - 1][key])}">
        <line x1="${pad}" x2="${w - pad}" y1="${h - pad}" y2="${h - pad}" class="em-axis"/>
        <polyline points="${data.map((d) => `${x(d.year)},${y(d[key])}`).join(" ")}" fill="none" stroke="var(--em-accent)" stroke-width="2.5"/>
        <text x="${pad}" y="${h - 8}" class="em-tick">${data[0].year}</text><text x="${w - pad}" y="${h - 8}" text-anchor="end" class="em-tick">${data[data.length - 1].year}</text></svg>`);
    }
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "overtake") {
        vis.innerHTML = `<p class="vt">Share of world electricity · 2025</p><div class="em-bars"></div>`;
        bars(vis.querySelector(".em-bars"), [{ label: "Renewables", value: w25.renewables_pct, src: w25.source }, { label: "Coal", value: w25.coal_pct, muted: true, src: w25.source }, { label: "Gas", value: w25.gas_pct, muted: true, src: w25.source }, { label: "Nuclear", value: w25.nuclear_pct, muted: true, src: w25.source }], pct, 40, t);
      } else if (id === "solar") {
        vis.innerHTML = `<p class="vt">Solar's share of world electricity</p><div class="vbig">${pct(w25.solar_pct)}</div><p class="vsub">in 2025, up from ${pct(w15.solar_pct)} in 2015.</p><div class="el-vchart"></div>`;
        lineSvg(vis.querySelector(".el-vchart"), W, "solar_pct", 10, pct);
      } else if (id === "trend") {
        vis.innerHTML = `<p class="vt">World carbon intensity · g CO₂e per kWh</p><div class="vbig">${Math.round(w25.carbon_intensity_g_kwh)}</div><p class="vsub">grams per kilowatt-hour in 2025.</p><div class="el-vchart"></div>`;
        lineSvg(vis.querySelector(".el-vchart"), W, "carbon_intensity_g_kwh", 600, g);
      } else if (id === "map") {
        vis.innerHTML = `<p class="vt">Carbon intensity by country · latest year</p><div class="m"></div><div class="el-scale">${BANDS.map((b, i) => `<span>${dot(BAND_VARS[i])}${esc(b.band)} g</span>`).join("")}</div>`;
        miniMap(vis.querySelector(".m"));
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">United Kingdom · coal share and grid carbon</p><div class="m"></div><p class="el-key"><span>${dot("--el-coal")}Coal share</span><span>${dot("--em-accent")}Carbon intensity</span></p>`;
        drawUK(vis.querySelector(".m"));
      } else if (id === "left") {
        vis.innerHTML = `<p class="vt">World generation mix · 2025</p><div class="m"></div>`;
        vis.querySelector(".m").innerHTML = mixBar(w25);
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); drawAreaMain(); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { story.redraw(); drawAreaMain(); drawUK(main.querySelector("#el-uk")); }, 150); });
  },
};
