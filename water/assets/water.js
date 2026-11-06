// Water Stress dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const BAND_VARS = ["--wt-b0", "--wt-b1", "--wt-b2", "--wt-b3", "--wt-b4"];
const BANDS = DATA.bands; // No stress, Low, Medium, High, Critical
const bandIdx = (name) => BANDS.findIndex((b) => b.band === name);
const safeIdx = (v) => (v >= 95 ? 0 : v >= 75 ? 1 : v >= 50 ? 2 : v >= 25 ? 3 : 4);
const SAFE_LABELS = ["95% or more", "75 to 95%", "50 to 75%", "25 to 50%", "Under 25%"];

const pct = (v) => (v == null ? "n/a" : v >= 100 ? `${Math.round(v).toLocaleString("en-GB")}%` : `${v.toFixed(1)}%`);
const people = (v) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}m` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v));
const litres = (v) => (v >= 1e9 ? `${Math.round(v / 1e9)}bn` : people(v));
const m3 = (v) => `${Math.round(v).toLocaleString("en-GB")} m³`;
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
  id: "water",
  title: "Water Stress",
  description:
    "Where demand for freshwater is outrunning supply, who lacks safe drinking water, and what is draining aquifers, from FAO, WHO/UNICEF, WRI and NASA-based research, with every number linked to its source.",
  mount(root) {
    const stress = DATA.stress;
    const byIso3 = (rows) => Object.fromEntries(rows.map((r) => [r.iso3, r]));
    const SECT = byIso3(DATA.sectors), RES = byIso3(DATA.resources), DRINK = byIso3(DATA.drinking), STR = byIso3(stress);
    const fact = (id) => DATA.facts.find((f) => f.id === id);
    const region = (r) => DATA.regions.find((x) => x.region === r);
    const W = region("World"), NAWA = region("Northern Africa and Western Asia"), CSA = region("Central and Southern Asia");
    const crit = stress.filter((r) => r.band === "Critical");
    const high = stress.filter((r) => r.band === "High");
    const uk = STR.GBR;
    const ladder = Object.fromEntries(DATA.ladder.map((r) => [r.level, r]));
    const withoutW = fact("jmp_without");

    let map = null, mini = null;
    const { main, initialView } = shell(root, {
      variantId: "water",
      name: "Water",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (i, vars = BAND_VARS) => `<i style="background:var(${vars[i]})"></i>`;
    const pill = (name) => `<span class="wt-pill">${dot(bandIdx(name))}${esc(name)}</span>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, f, big, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(f.source)}>${big}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, n, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${n}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;

    const options = [...stress].sort((a, b) => a.country.localeCompare(b.country));
    const gw = fact("grace_gw"), gpop = fact("grace_pop"), wq = fact("wri_quarter"), w4 = fact("wri_4bn"), w50 = fact("wri_2050_people"), wd = fact("wri_2050_demand");
    const dcD = fact("dc_direct"), dcI = fact("dc_indirect");

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Water stress · 2023 data</p>
        <h1>The world uses <b ${t(W.source)}>${pct(W.stress_pct)}</b> of its usable freshwater. <span class="accent">North Africa and West Asia use <b ${t(NAWA.source)}>${Math.round(NAWA.stress_pct)}%</b></span></h1>
        <p class="em-lede">Averages hide the pressure. <b ${t(crit[0].source)}>${crit.length}</b> countries withdraw more freshwater than they renewably have, and <b ${t(withoutW.source)}>${people(withoutW.value)}</b> people still lack safely managed drinking water.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Water stress compares what a country withdraws with what nature can spare</h2></div></div>
        <div class="em-kpis">
          ${kpi("World water stress", pct(W.stress_pct), "Share of renewable freshwater withdrawn, after leaving enough for ecosystems, 2023", W.source, true)}
          ${kpi("Critical stress", String(crit.length), `Countries withdrawing over 100% of renewable supply, plus <span ${t(high[0]?.source)}>${high.length}</span> at 75 to 100%`, crit[0].source)}
          ${kpi("No safe drinking water", people(withoutW.value), `People without safely managed drinking water, 2024 · <span ${t(ladder.safely.source)}>${pct(100 - ladder.safely.pct)}</span> of everyone`, withoutW.source)}
          ${kpi("Groundwater's share", `${gw.value}%`, "Of the freshwater the continents lost since 2002, measured from orbit", gw.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Where the pressure is</p><h2>${stress.length} countries, <span class="accent">one official measure</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="wt-mode" data-mode="stress" aria-pressed="true">Water stress</button>
                <button type="button" class="wt-mode" data-mode="safe" aria-pressed="false">Safe drinking water</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="wt-map" role="region" aria-label="World map of countries coloured by water stress"></div>
            <div class="wt-scale" id="wt-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="wt-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="regions">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>By region</p><h2>Two regions sit in the <span class="accent">medium to high band</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">SDG regions · 2023</p>
            <h3>Level of water stress</h3>
            <p class="note">Freshwater withdrawn as a share of renewable freshwater after environmental flows. Over <b>25%</b> is the start of stress.</p>
            <div class="em-bars" id="wt-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Over 100% · 2023</p>
            <h3>Withdrawing more than they have</h3>
            <p class="note">These countries draw on fossil groundwater, desalination or rivers from upstream neighbours. Bars stop at 500%; the number is the full value.</p>
            <div class="em-bars" id="wt-critical"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="drinking">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>At the tap</p><h2>Roughly <span class="accent">1 in 4 people</span> lack safely managed drinking water</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">The drinking water ladder · world, 2024</p>
            <h3>Where the world's people get drinking water</h3>
            <p class="note"><b>Safely managed</b> means on the premises, available when needed and free from contamination. <b>Basic</b> means an improved source within a 30-minute round trip.</p>
            <div class="wt-ladder" id="wt-ladder"></div>
            <div class="wt-ladder-legend" id="wt-ladder-legend"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">By income group · 2024</p>
            <h3>Share with safely managed drinking water</h3>
            <p class="note">Coverage roughly triples from low-income to high-income countries.</p>
            <div class="em-bars" id="wt-income"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="hidden">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>The water you don't see</p><h2>Aquifers, droughts and <span class="accent">the years ahead</span></h2></div></div>
        <div class="em-grid">
          ${factCard("Groundwater · GRACE satellites, 2002 on", gpop, `${gpop.value}%`, `of the world's population lives in the <b>${esc(gpop.note.split(" ")[0])}</b> countries losing freshwater. Groundwater pumping accounts for <b ${t(gw.source)}>${gw.value}%</b> of the loss.`, true)}
          ${factCard("Aqueduct 4.0 · WRI", wq, String(wq.value), `countries face <b>extremely high</b> water stress every year, using at least 80% of their supply. They are home to a quarter of humanity, and <b ${t(w4.source)}>${people(w4.value)}</b> people face high stress at least one month a year.`)}
          ${factCard("By 2050 · WRI", w50, `+${people(w50.value)}`, `more people are expected to live with extremely high water stress, as global demand grows by <b ${t(wd.source)}>${esc(wd.value)}%</b>.`)}
          <div class="em-card">
            <p class="em-eyebrow">Drought hotspots · 2023 to 2025</p>
            <h3>What the last drought cost</h3>
            <p class="note">From the UNCCD and US National Drought Mitigation Center's review of the 2023 to 2025 droughts.</p>
            <dl class="em-d-list">
              ${["unccd_hunger", "unccd_zim", "unccd_olive", "unccd_panama"].map((id) => {
                const f = fact(id);
                const v = f.unit === "people" ? `${people(f.value)}+` :f.unit === "%" ? `−${f.value}%` : esc(f.value);
                return `<dt>${esc(f.label)}</dt><dd ${t(f.source)}>${v}</dd>`;
              }).join("")}
            </dl>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="compute">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>The newest user</p><h2>Data centres drink <span class="accent">mostly through the power grid</span></h2></div></div>
        <div class="em-grid">
          ${factCard("US data centres · cooling, 2023", dcD, `${litres(dcD.value)} L`, `consumed on site to cool servers (${esc(dcD.note.replace(/^./, (c) => c.toLowerCase()))}). LBNL expects this could double by 2028.`)}
          ${factCard("US data centres · via electricity, 2023", dcI, `${litres(dcI.value)} L`, `consumed at power plants generating their electricity, about 12 times the on-site figure (${esc(dcI.note.replace(/^./, (c) => c.toLowerCase()))}).`, true)}
          <div class="em-card">
            <p class="em-eyebrow">Part of Ledger Monitor</p>
            <h3>Where the internet lives</h3>
            <p class="note">See where cloud regions and AI supercomputers sit, and the power and water they use, on the internet dashboard. Few companies publish water use per site, so these US-wide estimates are the most complete figures available.</p>
            <a class="em-back" href="../internet/index.html" style="align-self:flex-start;margin-top:auto">Open the internet dashboard →</a>
          </div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="wt-search" id="wt-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap wt-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="stress_pct" aria-sort="descending"><button type="button">Stress 2023</button></th>
                <th class="hide-n">Class</th>
                <th class="r hide-n" data-key="stress_2015" aria-sort="none"><button type="button">2015</button></th>
                <th class="r hide-n" data-key="agri" aria-sort="none"><button type="button">Farming share</button></th>
                <th class="r" data-key="safe" aria-sort="none"><button type="button">Safe water</button></th>
              </tr></thead>
              <tbody id="wt-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Water stress</b> is SDG indicator 6.4.2: total freshwater withdrawn by agriculture, industry and municipalities, divided by total renewable freshwater minus the flows ecosystems need. Countries report the inputs to FAO's AQUASTAT; FAO is the custodian agency. Values can exceed 100% where a country uses fossil groundwater, desalinated water or water flowing in from neighbours. Country figures are taken from Our World in Data's copy of the UN SDG database; the world figure matches the UN-Water SDG 6 Data Portal. Several countries report the same value for several years, so the 2015 comparison can show no change.</p>
        <p>The map colours use the official severity classes: no stress under 25%, low 25 to 50%, medium 50 to 75%, high 75 to 100% and critical over 100%. WRI's Aqueduct uses a different, basin-based model with its own thresholds (40% high, 80% extremely high), so its counts differ from the SDG figures. Drinking water figures are WHO/UNICEF JMP estimates built from household surveys and censuses. Groundwater findings come from GRACE and GRACE-FO satellite gravity data; data centre figures cover the United States only.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("world", "01", "The average", `The world withdraws <span class="accent"><b ${t(W.source)}>${pct(W.stress_pct)}</b></span> of the freshwater it can safely use`, `That sounds comfortable. It is below the 25% line where stress begins, and it has barely moved since 2000.`)}
            ${step("regions", "02", "The hotspots", `But North Africa and West Asia use <span class="accent"><b ${t(NAWA.source)}>${Math.round(NAWA.stress_pct)}%</b></span>`, `Central and Southern Asia, home to India and Pakistan, uses <b ${t(CSA.source)}>${Math.round(CSA.stress_pct)}%</b>. The average hides two regions in the high band.`)}
            ${step("critical", "03", "Over the limit", `<span class="accent"><b ${t(crit[0].source)}>${crit.length}</b></span> countries withdraw more than nature renews`, `Kuwait withdraws <b ${t(STR.KWT.source)}>${pct(STR.KWT.stress_pct)}</b> of its renewable freshwater, relying on desalination and ancient groundwater that will not refill.`)}
            ${step("ground", "04", "Under the surface", `<span class="accent"><b ${t(gw.source)}>${gw.value}%</b></span> of the water the continents lost came from underground`, `Satellites that weigh the Earth's water since 2002 show drying in countries home to <b ${t(gpop.source)}>${gpop.value}%</b> of the world's people.`)}
            ${step("tap", "05", "At the tap", `<span class="accent"><b ${t(withoutW.source)}>${people(withoutW.value)}</b></span> people lack safely managed drinking water`, `That is about <b ${t(ladder.safely.source)}>${Math.round(100 - ladder.safely.pct)} in 100</b> people. In low-income countries, fewer than a third have it.`)}
            ${step("compute", "06", "The newest user", `US data centres consumed <span class="accent"><b ${t(dcD.source)}>${litres(dcD.value)} litres</b></span> for cooling in 2023`, `And about 12 times as much again through the electricity they use. Compute is moving into water-stressed places too.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="wt-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "stress", sel: "GBR" };
    const mapEl = main.querySelector("#wt-map");
    const isoToRow = Object.fromEntries(stress.map((r) => [r.iso_n3, r]));
    const isoToSafe = Object.fromEntries(DATA.drinking.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((f) => {
        const r = isoToRow[f.properties.iso], d = isoToSafe[f.properties.iso];
        return { ...f, properties: { ...f.properties, iso3: r?.iso3 ?? d?.iso3 ?? "", sb: r ? bandIdx(r.band) : -1, db: d ? safeIdx(d.safely_managed_pct) : -1, nm: r?.country ?? d?.country ?? f.properties.name } };
      }),
    };
    function colors() {
      return { bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: BAND_VARS.map((v) => cssColor(mapEl, v)) };
    }
    function fillExpr(c) {
      const key = state.mode === "stress" ? "sb" : "db";
      return ["match", ["get", key], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    }
    map = new maplibregl.Map({
      container: mapEl,
      style: { version: 8, sources: {}, layers: [] },
      center: [10, 22], zoom: 0.6, minZoom: -2, maxZoom: 5, renderWorldCopies: false,
      attributionControl: { compact: true, customAttribution: "Boundaries: Natural Earth" },
      dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
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
          const f = e.features?.[0];
          if (!f) return;
          const r = STR[f.properties.iso3], d = DRINK[f.properties.iso3];
          const val = state.mode === "stress" ? (r ? `${pct(r.stress_pct)} · ${r.band}` : "No data") : d ? `${pct(d.safely_managed_pct)} safely managed` : "No data";
          map.getCanvas().style.cursor = f.properties.iso3 ? "pointer" : "";
          popup.setLngLat(e.lngLat).setText(`${f.properties.nm} · ${val}`).addTo(map);
        });
        map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
        map.on("click", "fill", (e) => {
          const iso3 = e.features?.[0]?.properties.iso3;
          if (iso3 && (STR[iso3] || DRINK[iso3])) select(iso3);
        });
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
    const scaleEl = main.querySelector("#wt-scale");
    function drawScale() {
      scaleEl.innerHTML =
        state.mode === "stress"
          ? BANDS.map((b, i) => `<span ${t(b.source)}>${dot(i)}${esc(b.band)} (${b.max_pct == null ? `over ${b.min_pct}%` : b.min_pct === 0 ? `under ${b.max_pct}%` : `${b.min_pct} to ${b.max_pct}%`})</span>`).join("") + `<span><i style="background:var(--em-land)"></i>No data</span>`
          : SAFE_LABELS.map((l, i) => `<span>${dot(i)}${l}</span>`).join("") + `<span><i style="background:var(--em-land)"></i>No data</span>`;
    }

    // ---------- Detail ----------
    const detail = main.querySelector("#wt-detail");
    function drawDetail() {
      const r = STR[state.sel], s = SECT[state.sel], res = RES[state.sel], d = DRINK[state.sel];
      const name = r?.country ?? d?.country ?? state.sel;
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const delta = r && r.stress_2015 != null ? r.stress_pct - r.stress_2015 : null;
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country · ${r ? r.year : d?.year ?? ""}</p>
        <label class="wt-pick"><span class="em-eyebrow">Choose</span><select id="wt-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(name)}</p>
        ${r ? `<p class="em-d-value" ${t(r.source)}>${pct(r.stress_pct)}</p>
        <p class="em-d-usd">of renewable freshwater withdrawn, after environmental flows.</p>
        <p class="wt-rate">${pill(r.band)}</p>` : `<p class="em-d-usd">No water stress figure reported.</p>`}
        ${s ? `<p class="em-eyebrow" style="margin-top:16px">Who withdraws it · ${s.year}</p>
        <div class="wt-stack" role="img" aria-label="Agriculture ${s.agriculture_pct}%, industry ${s.industry_pct}%, domestic ${s.domestic_pct}%">
          <span style="flex:${s.agriculture_pct};background:var(--wt-agri)" ${t(s.source)}></span><span style="flex:${s.industry_pct};background:var(--wt-ind)" ${t(s.source)}></span><span style="flex:${s.domestic_pct};background:var(--wt-dom)" ${t(s.source)}></span>
        </div>
        <p class="wt-stack-key"><span><i style="background:var(--wt-agri)"></i>Farming ${pct(s.agriculture_pct)}</span><span><i style="background:var(--wt-ind)"></i>Industry ${pct(s.industry_pct)}</span><span><i style="background:var(--wt-dom)"></i>Homes ${pct(s.domestic_pct)}</span></p>` : ""}
        <dl class="em-d-list" style="margin-top:16px">
          ${r && r.stress_2015 != null ? row("2015", `<span ${t(r.source)}>${pct(r.stress_2015)}</span>${delta ? ` <span class="${delta > 0 ? "up" : "down"}">(${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)} pts)</span>` : ""}`) : ""}
          ${res?.withdrawal_m3_per_person != null ? row(`Withdrawn per person · ${res.withdrawal_year}`, `<span ${t(res.withdrawal_source)}>${m3(res.withdrawal_m3_per_person)}</span>`) : ""}
          ${res?.renewable_m3_per_person != null ? row(`Renewable per person · ${res.renewable_year}`, `<span ${t(res.renewable_source)}>${m3(res.renewable_m3_per_person)}</span>`) : ""}
          ${d ? row(`Safe drinking water · ${d.year}`, `<span ${t(d.source)}>${pct(d.safely_managed_pct)}</span>`) : ""}
          ${d?.people_without ? row("People without it", `<span ${t(d.source)}>${people(d.people_without)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#wt-select").addEventListener("change", (e) => select(e.target.value, true));
      src.footnotes(detail);
    }
    async function select(iso3, fly = false) {
      state.sel = iso3;
      drawDetail();
      await ready;
      map.setFilter("sel", ["==", ["get", "iso3"], iso3]);
      if (fly) {
        const f = geo.features.find((x) => x.properties.iso3 === iso3);
        if (f) {
          const pts = (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).flat(2);
          const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
          if (map.getProjection?.()?.type === "globe") map.easeTo({ center: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2], duration: 800 });
          else map.fitBounds([[Math.min(...xs) - 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.max(...ys) + 4]], { padding: 24, maxZoom: 4 });
        }
      }
    }
    main.querySelectorAll(".wt-mode").forEach((b) =>
      b.addEventListener("click", () => {
        state.mode = b.dataset.mode;
        main.querySelectorAll(".wt-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        mapEl.setAttribute("aria-label", state.mode === "stress" ? "World map of countries coloured by water stress" : "World map of countries coloured by share with safely managed drinking water");
        drawScale();
        repaint();
      })
    );
    main.querySelectorAll(".em-proj").forEach((b) =>
      b.addEventListener("click", async () => {
        main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        await ready;
        map.setProjection({ type: b.dataset.proj });
        if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [30, 20], duration: 800 });
        else fit(true);
      })
    );
    drawScale();
    drawDetail();

    // ---------- Regions, critical, drinking ----------
    const regs = DATA.regions.filter((r) => r.region !== "World").sort((a, b) => b.stress_pct - a.stress_pct);
    bars(main.querySelector("#wt-regions"), [...regs.map((r) => ({ label: r.region, value: r.stress_pct, muted: r.stress_pct < 25, src: r.source })), { label: "World", value: W.stress_pct, muted: true, src: W.source }], pct, 100, t);
    bars(main.querySelector("#wt-critical"), crit.map((r) => ({ label: r.country, value: Math.min(r.stress_pct, 500), shown: r.stress_pct, muted: false, src: r.source })), (v) => (v >= 500 ? "500%+" : pct(v)), 500, t);
    main.querySelectorAll("#wt-critical .em-bars-val").forEach((el, i) => (el.textContent = pct(crit[i].stress_pct)));
    main.querySelectorAll("#wt-critical .em-bars-fill").forEach((el) => (el.style.background = "var(--wt-b4)"));
    main.querySelectorAll("#wt-regions .em-bars-fill").forEach((el, i) => {
      const r = i < regs.length ? regs[i] : W;
      el.style.background = `var(${BAND_VARS[r.stress_pct >= 100 ? 4 : r.stress_pct >= 75 ? 3 : r.stress_pct >= 50 ? 2 : r.stress_pct >= 25 ? 1 : 0]})`;
    });
    const LAD = [["safely", "Safely managed", "--wt-l0"], ["basic", "Basic", "--wt-l1"], ["limited", "Limited", "--wt-l2"], ["unimproved", "Unimproved", "--wt-l3"], ["surface", "Surface water", "--wt-l4"]];
    main.querySelector("#wt-ladder").innerHTML = LAD.map(([k, l, v]) => `<span style="flex:${ladder[k].pct};background:var(${v})" title="${l}: ${pct(ladder[k].pct)}" ${t(ladder[k].source)}>${ladder[k].pct >= 10 ? pct(ladder[k].pct) : ""}</span>`).join("");
    main.querySelector("#wt-ladder").setAttribute("role", "img");
    main.querySelector("#wt-ladder").setAttribute("aria-label", LAD.map(([k, l]) => `${l} ${pct(ladder[k].pct)}`).join(", "));
    main.querySelector("#wt-ladder-legend").innerHTML = LAD.map(([k, l, v]) => `<span><i style="background:var(${v})"></i>${l} · <b ${t(ladder[k].source)}>${pct(ladder[k].pct)}</b></span>`).join("");
    bars(main.querySelector("#wt-income"), DATA.income.map((r) => ({ label: r.group.replace(" countries", ""), value: r.safely_managed_pct, muted: r.group.startsWith("High"), src: r.source })), pct, 100, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#wt-tbody"), search = main.querySelector("#wt-search");
    const rows = stress.map((r) => ({ ...r, agri: SECT[r.iso3]?.agriculture_pct ?? null, agriSrc: SECT[r.iso3]?.source, safe: DRINK[r.iso3]?.safely_managed_pct ?? null, safeSrc: DRINK[r.iso3]?.source }));
    let key = "stress_pct", dir = -1;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = rows.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML =
        list.map((r) => `<tr>
          <td><button type="button" class="wt-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
          <td class="r" ${t(r.source)}>${pct(r.stress_pct)}</td>
          <td class="hide-n">${pill(r.band)}</td>
          <td class="r hide-n" ${t(r.source)}>${pct(r.stress_2015)}</td>
          <td class="r hide-n" ${r.agriSrc ? t(r.agriSrc) : ""}>${r.agri == null ? "n/a" : pct(r.agri)}</td>
          <td class="r" ${r.safeSrc ? t(r.safeSrc) : ""}>${r.safe == null ? "n/a" : pct(r.safe)}</td></tr>`).join("") ||
        `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
    }
    main.querySelectorAll(".em-table th[aria-sort]").forEach((th) =>
      th.querySelector("button").addEventListener("click", () => {
        const k = th.dataset.key;
        dir = key === k ? -dir : k === "country" ? 1 : -1;
        key = k;
        main.querySelectorAll(".em-table th[aria-sort]").forEach((x) => x.setAttribute("aria-sort", x === th ? (dir > 0 ? "ascending" : "descending") : "none"));
        drawTable();
      })
    );
    search.addEventListener("input", drawTable);
    tbody.addEventListener("click", (e) => {
      const b = e.target.closest(".wt-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#wt-vis");
    function miniMap(el, highlight) {
      const w = Math.max(280, el.clientWidth), h = Math.round(w * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [w - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${w} ${h}`).attr("role", "img").attr("aria-label", "World map coloured by water stress class");
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (f) => {
          const r = isoToRow[f.properties.iso];
          if (!r) return "var(--em-land)";
          const i = bandIdx(r.band);
          return highlight && !highlight(r, i) ? "var(--em-land)" : `var(${BAND_VARS[i]})`;
        })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((f) => { const r = isoToRow[f.properties.iso]; return r ? `${r.country}: ${pct(r.stress_pct)}` : f.properties.name; });
      el.append(svg.node());
    }
    function trendSvg(el) {
      const d = DATA.trend, w = Math.max(280, el.clientWidth), h = 150, pad = 26;
      const x = (y) => pad + ((y - d[0].year) / (d[d.length - 1].year - d[0].year)) * (w - 2 * pad);
      const y = (v) => h - pad - (v / 30) * (h - 2 * pad);
      const pts = d.map((p) => `${x(p.year)},${y(p.stress_pct)}`).join(" ");
      el.insertAdjacentHTML("beforeend", `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="World water stress ${d[0].year} ${pct(d[0].stress_pct)} to ${d[d.length - 1].year} ${pct(d[d.length - 1].stress_pct)}">
        <line x1="${pad}" x2="${w - pad}" y1="${y(25)}" y2="${y(25)}" class="wt-line25"/><text x="${w - pad}" y="${y(25) - 5}" text-anchor="end" class="em-tick">25%: stress begins</text>
        <line x1="${pad}" x2="${w - pad}" y1="${h - pad}" y2="${h - pad}" class="em-axis"/>
        <polyline points="${pts}" fill="none" stroke="var(--em-accent)" stroke-width="2.5"/>
        <text x="${pad}" y="${h - 8}" class="em-tick">${d[0].year}</text><text x="${w - pad}" y="${h - 8}" text-anchor="end" class="em-tick">${d[d.length - 1].year}</text></svg>`);
    }
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "world") {
        vis.innerHTML = `<p class="vt">World water stress · SDG 6.4.2</p><div class="vbig">${pct(W.stress_pct)}</div><p class="vsub">of renewable freshwater withdrawn each year, after environmental flows.</p><div class="wt-vchart"></div>`;
        trendSvg(vis.querySelector(".wt-vchart"));
      } else if (id === "regions") {
        vis.innerHTML = `<p class="vt">By SDG region · 2023</p><div class="em-bars"></div>`;
        bars(vis.querySelector(".em-bars"), regs.map((r) => ({ label: r.region, value: r.stress_pct, muted: r.stress_pct < 50, src: r.source })), pct, 100, t);
      } else if (id === "critical") {
        vis.innerHTML = `<p class="vt">Countries at high or critical stress · 2023</p><div class="m"></div><div class="wt-scale">${[3, 4].map((i) => `<span>${dot(i)}${BANDS[i].band}</span>`).join("")}</div>`;
        miniMap(vis.querySelector(".m"), (r, i) => i >= 3);
      } else if (id === "ground") {
        vis.innerHTML = `<p class="vt">Share of continental water loss, 2002 on</p><div class="vbig">${gw.value}%</div><p class="vsub">was groundwater: pumped from aquifers faster than rain can refill them.</p>
          <div class="wt-split"><span style="flex:${gw.value}">Groundwater</span><span style="flex:${100 - gw.value}">Other</span></div>`;
      } else if (id === "tap") {
        const n = Math.round(100 - ladder.safely.pct);
        vis.innerHTML = `<p class="vt">Out of every 100 people · 2024</p><div class="em-waffle">${Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div><p class="vsub"><b>${n}</b> lack safely managed drinking water at home.</p>`;
      } else if (id === "compute") {
        vis.innerHTML = `<p class="vt">US data centres · 2023</p>
          <div class="wt-split tall"><span style="flex:${dcD.value}">Cooling ${litres(dcD.value)} L</span><span style="flex:${dcI.value}">Via electricity ${litres(dcI.value)} L</span></div>
          <p class="vsub">Water consumed on site versus at the power plants that run them.</p>`;
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => story.redraw(), 150); });
  },
};
