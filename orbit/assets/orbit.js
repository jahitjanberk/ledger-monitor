// Who Owns Orbit dashboard for Economy Monitor.
// Built on the shared Economy Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const BAND_VARS = ["--or-b0", "--or-b1", "--or-b2", "--or-b3", "--or-b4"];
const totIdx = (v) => (v >= 1000 ? 4 : v >= 100 ? 3 : v >= 10 ? 2 : v >= 2 ? 1 : 0);
const TOT_LABELS = ["1", "2 to 9", "10 to 99", "100 to 999", "1,000 or more"];
const yrIdx = (v) => (v >= 100 ? 4 : v >= 20 ? 3 : v >= 5 ? 2 : v >= 2 ? 1 : 0);
const YR_LABELS = ["1", "2 to 4", "5 to 19", "20 to 99", "100 or more"];
const n = (v) => (v == null ? "n/a" : Math.round(v).toLocaleString("en-GB"));
const big = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}m` : v >= 1e4 ? `${Math.round(v / 1e3)}k` : n(v));
const pct = (v) => `${Math.round(v)}%`;
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
  id: "orbit",
  title: "Who Owns Orbit",
  description:
    "Which countries and organisations put objects into space, how crowded low Earth orbit has become, and how much of it is debris, from the UN's register of space objects and US Space Force tracking, with every number linked to its source.",
  mount(root) {
    const L = DATA.launchers, Y = DATA.yearly, LAST = DATA.last_year;
    const K = `objects_${LAST}`;
    const ctry = L.filter((r) => r.kind === "country"), orgs = L.filter((r) => r.kind !== "country");
    const BY = Object.fromEntries(ctry.map((r) => [r.iso3, r]));
    const y25 = Y[Y.length - 1], y15 = Y.find((r) => r.year === 2015), y20 = Y.find((r) => r.year === 2020);
    const US = BY.USA, CN = BY.CHN, RU = BY.RUS, UK = BY.GBR;
    const usShare = (100 * y25.united_states) / y25.world;
    const O = DATA.orbits[DATA.orbits.length - 1], LEO = DATA.leo, leo25 = LEO[LEO.length - 1], leo15 = LEO.find((r) => r.year === 2015);
    const fact = (id) => DATA.facts.find((f) => f.id === id);
    const fT = fact("tracked"), fA = fact("active"), fD10 = fact("debris10"), fD1 = fact("debris1"), fR = fact("reentry"), fS = fact("starlink");
    const launchedCountries = ctry.filter((r) => r.objects_total > 0).length;

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "orbit",
      name: "Orbit",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (v) => `<i style="background:var(${v})"></i>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, f, bigText, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(f.source)}>${bigText}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, num, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Space · data to ${LAST}</p>
        <h1>In ${LAST}, the world launched <b ${t(y25.source)}>${n(y25.world)}</b> objects into space. <span class="accent">The United States launched <b ${t(y25.source)}>${pct(usShare)}</b> of them</span></h1>
        <p class="em-lede">That is <b ${t(y15.source)}>${Math.round(y25.world / y15.world)} times</b> as many as in 2015, driven by satellite megaconstellations. SpaceX's Starlink alone had <b ${t(fS.source)}>${n(fS.value)}</b> working satellites by March 2026, roughly two-thirds of all active satellites.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Objects registered with the UN, <span class="accent">and tracked from the ground</span></h2></div></div>
        <div class="em-kpis">
          ${kpi(`Launched in ${LAST}`, n(y25.world), `Satellites, probes and crewed craft, against <span ${t(y15.source)}>${n(y15.world)}</span> in 2015`, y25.source, true)}
          ${kpi("Since Sputnik", n(DATA.world_total), `Objects launched 1957 to ${LAST}, by <span ${t(US.source)}>${launchedCountries}</span> countries and ${orgs.length} organisations`, US.source)}
          ${kpi("Starlink", n(fS.value), "Active SpaceX satellites, 17 March 2026, about two-thirds of all active satellites", fS.source)}
          ${kpi("Low Earth orbit", n(leo25.payloads), `Tracked payloads at the end of ${LAST}, <span ${t(leo15.source)}>${Math.round(leo25.payloads / leo15.payloads)} times</span> the 2015 count`, leo25.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Who launches</p><h2>${launchedCountries} countries <span class="accent">have put something in space</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="or-mode" data-mode="total" aria-pressed="true">All time</button>
                <button type="button" class="or-mode" data-mode="year" aria-pressed="false">${LAST}</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="or-map" role="region" aria-label="World map of countries coloured by number of objects launched into space"></div>
            <div class="or-scale" id="or-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="or-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="years">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Year by year</p><h2>From a handful a year <span class="accent">to thousands</span></h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">Objects launched each year · 1957 to ${LAST}</p>
          <h3>The space race, then the constellation race</h3>
          <p class="note">For decades the Soviet Union and the United States launched a few hundred objects a year between them. Since 2019 constellations of small satellites have taken the count into the thousands.</p>
          <div id="or-years" class="or-years"></div>
          <p class="or-key"><span>${dot("--or-us")}United States</span><span>${dot("--or-cn")}China</span><span>${dot("--or-ru")}Russia and USSR</span><span>${dot("--or-rest")}Everyone else</span></p>
          <p class="note" id="or-years-read" style="margin-top:8px"></p>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="orbits">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Where they go</p><h2>Low Earth orbit holds <span class="accent">${pct((100 * O.low_earth_orbit) / (O.low_earth_orbit + O.medium_earth_orbit + O.geostationary_orbit + O.high_earth_orbit))}</span> of everything</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Payloads and rocket bodies by orbit · end of ${O.year}</p>
            <h3>Most satellites fly within 2,000 km</h3>
            <p class="note">Geostationary orbit, 35,786 km up, holds the big communications and weather satellites; medium orbit holds navigation systems such as GPS and Galileo. Debris is not counted here.</p>
            <div class="em-bars" id="or-orbits"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Tracked objects in low Earth orbit · 1960 to ${leo25.year}</p>
            <h3>Payloads overtook debris</h3>
            <p class="note">Tracked debris in low orbit peaked after a 2007 Chinese anti-satellite test and a 2009 satellite collision. Payloads overtook it as constellations launched.</p>
            <div id="or-leo"></div>
            <p class="or-key"><span>${dot("--em-accent")}Payloads</span><span>${dot("--or-debris")}Debris</span><span>${dot("--or-rb")}Rocket bodies</span></p>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="junk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>What we can't see</p><h2>Most of what's up there <span class="accent">is too small to track</span></h2></div></div>
        <div class="em-grid">
          ${factCard("Tracked · end of 2024", fT, `${big(fT.value)}`, `objects are tracked by space surveillance networks. About <b ${t(fA.source)}>${big(fA.value)}</b> are working satellites.`, true)}
          ${factCard("Estimated · over 1 cm", fD1, `${big(fD1.value)}+`, `pieces of debris larger than 1 cm, enough to damage a satellite. Over <b ${t(fD10.source)}>${big(fD10.value)}</b> are larger than 10 cm.`)}
          ${factCard("Coming back down", fR, `${fR.value}+ a day`, `intact satellites or rocket bodies re-enter the atmosphere on average. ESA warns some orbits risk a runaway chain of collisions.`)}
        </div>
      </section>

      <section class="em-sec" id="orgs">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Not just countries</p><h2>Organisations that <span class="accent">register their own objects</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">All time · 1957 to ${LAST}</p>
            <h3>Agencies, operators and alliances</h3>
            <p class="note">International organisations such as ESA and EUMETSAT, and operators such as Intelsat and Eutelsat, register objects with the UN themselves.</p>
            <div class="em-bars" id="or-orgs"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">The top ten countries · all time</p>
            <h3>Three countries, ${pct((100 * (US.objects_total + RU.objects_total + CN.objects_total)) / DATA.world_total)} of everything</h3>
            <p class="note">The United States, Russia (including the Soviet Union) and China account for most objects ever launched.</p>
            <div class="em-bars" id="or-top"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every launcher</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="or-search" id="or-search" type="search" placeholder="Search countries and organisations" aria-label="Search countries and organisations">
          <div class="em-tablewrap or-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="launcher" aria-sort="none"><button type="button">Country or organisation</button></th>
                <th class="r" data-key="objects_total" aria-sort="descending"><button type="button">All time</button></th>
                <th class="r" data-key="${K}" aria-sort="none"><button type="button">${LAST}</button></th>
                <th class="r hide-n" data-key="objects_2015" aria-sort="none"><button type="button">2015</button></th>
                <th class="r hide-n" data-key="first_year" aria-sort="none"><button type="button">First</button></th>
              </tr></thead>
              <tbody id="or-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Objects launched</b> come from the UN Office for Outer Space Affairs' index of objects registered by the state or organisation that launched them, or had them launched, under the UN Registration Convention. They include satellites, probes, landers, crewed spacecraft and space station parts, counted by year of launch. Rocket bodies and debris are not included. The registering state is usually the owner's home country, so a satellite built abroad but operated from the UK counts for the UK. Some objects are registered late, so recent years can still rise. Russia includes objects launched by the Soviet Union.</p>
        <p><b>Objects in orbit</b> come from the US Space Force's public catalogue: tracked payloads, rocket bodies and debris still in orbit at the end of each year. Objects that re-enter are removed, and debris smaller than about 10 cm is mostly not tracked, which is why ESA's estimates of small debris are far higher. All series come from Our World in Data's processed copies.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("sputnik", "01", "Since 1957", `Humanity has launched <span class="accent"><b ${t(US.source)}>${n(DATA.world_total)}</b></span> objects into space`, `It began with Sputnik in 1957. From the mid-1960s to 2015, launches averaged around 140 objects a year.`)}
            ${step("boom", "02", "The boom", `In ${LAST} alone, <span class="accent"><b ${t(y25.source)}>${n(y25.world)}</b></span> objects were launched`, `Nearly as many as in the first 40 years of the space age combined. Most were small satellites for broadband constellations.`)}
            ${step("us", "03", "One country", `The United States launched <span class="accent"><b ${t(y25.source)}>${pct(usShare)}</b></span> of them`, `China launched <b ${t(y25.source)}>${n(y25.china)}</b> and Russia <b ${t(y25.source)}>${n(y25.russia)}</b>.`)}
            ${step("starlink", "04", "One company", `SpaceX's Starlink passed <span class="accent"><b ${t(fS.source)}>${n(fS.value)}</b></span> working satellites`, `By March 2026 that was roughly two-thirds of every active satellite in orbit.`)}
            ${step("crowd", "05", "A crowded shell", `Low Earth orbit now holds <span class="accent"><b ${t(leo25.source)}>${n(leo25.payloads)}</b></span> tracked payloads`, `Plus <b ${t(leo25.source)}>${n(leo25.debris)}</b> tracked pieces of debris and <b ${t(leo25.source)}>${n(leo25.rocket_bodies)}</b> spent rocket bodies.`)}
            ${step("junk", "06", "What we can't see", `ESA estimates <span class="accent"><b ${t(fD1.source)}>${big(fD1.value)}</b></span> pieces of debris larger than 1 cm`, `Too small to track, but fast enough to destroy a satellite.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="or-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "total", sel: "GBR" };
    const mapEl = main.querySelector("#or-map");
    const isoToRow = Object.fromEntries(ctry.filter((r) => r.iso_n3).map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((f) => {
        const r = isoToRow[f.properties.iso];
        return { ...f, properties: { ...f.properties, iso3: r?.iso3 ?? "", tb: r && r.objects_total ? totIdx(r.objects_total) : -1, yb: r && r[K] ? yrIdx(r[K]) : -1, nm: r?.launcher ?? f.properties.name } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: BAND_VARS.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode === "total" ? "tb" : "yb"], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
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
          const val = !r ? "None registered" : state.mode === "total" ? `${n(r.objects_total)} objects since ${r.first_year}` : `${n(r[K])} objects in ${LAST}`;
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
    const scaleEl = main.querySelector("#or-scale");
    const drawScale = () => {
      scaleEl.innerHTML = (state.mode === "total" ? TOT_LABELS : YR_LABELS).map((l, i) => `<span>${dot(BAND_VARS[i])}${l}</span>`).join("") + `<span>${dot("--em-land")}None</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#or-detail");
    const rank = (r) => 1 + ctry.filter((x) => x.objects_total > r.objects_total).length;
    const options = [...ctry].filter((r) => r.iso3).sort((a, b) => a.launcher.localeCompare(b.launcher));
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="or-pick"><span class="em-eyebrow">Choose</span><select id="or-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.launcher)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.launcher)}</p>
        <p class="em-d-value" ${t(r.source)}>${n(r.objects_total)}</p>
        <p class="em-d-usd">objects registered since its first in ${r.first_year}, ${(100 * r.objects_total / DATA.world_total).toFixed(r.objects_total / DATA.world_total < 0.01 ? 2 : 1)}% of all</p>
        <p class="em-eyebrow" style="margin-top:12px">Each year since 2000</p><div id="or-spark" class="or-spark"></div>
        <dl class="em-d-list" style="margin-top:12px">
          ${row("Rank, all time", `<span ${t(r.source)}>${rank(r)} of ${launchedCountries}</span>`)}
          ${row(`Launched in ${LAST}`, `<span ${t(r.source)}>${n(r[K])}</span>`)}
          ${row("Launched in 2015", `<span ${t(r.source)}>${n(r.objects_2015)}</span>`)}
          ${row("First object", `<span ${t(r.source)}>${r.first_year}</span>`)}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#or-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".or-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".or-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      drawScale();
      repaint();
    }));
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [10, 30], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- Year chart (stacked bars) ----------
    const STACK = [["united_states", "--or-us", "United States"], ["china", "--or-cn", "China"], ["russia", "--or-ru", "Russia and USSR"], ["rest", "--or-rest", "Everyone else"]];
    const yearsEl = main.querySelector("#or-years"), yearsRead = main.querySelector("#or-years-read");
    function drawYears(el, h = 280, from = Y[0].year, hover = true, to = Y[Y.length - 1].year) {
      const data = Y.filter((r) => r.year >= from && r.year <= to);
      const w = Math.max(300, el.clientWidth), pad = { t: 10, r: 6, b: 22, l: 40 };
      const max = Math.ceil(Math.max(...data.map((r) => r.world)) / 1000) * 1000;
      const bw = (w - pad.l - pad.r) / data.length;
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      let rects = "";
      data.forEach((r, i) => {
        let acc = 0;
        for (const [k, v] of STACK) {
          const val = Math.max(0, r[k]);
          rects += `<rect x="${pad.l + i * bw + 0.5}" width="${Math.max(0.6, bw - 1)}" y="${y(acc + val)}" height="${y(acc) - y(acc + val)}" fill="var(${v})"/>`;
          acc += val;
        }
      });
      const ticks = [0, max / 2, max].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="or-grid"/><text x="${pad.l - 4}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${n(v)}</text>`).join("");
      const lab = [from, 1980, 2000, to].filter((yr, i, a) => yr >= from && yr <= to && a.indexOf(yr) === i).map((yr) => `<text x="${pad.l + (yr - from + 0.5) * bw}" y="${h - 6}" text-anchor="middle" class="em-tick">${yr}</text>`).join("");
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="Objects launched each year, ${from} to ${to}">${ticks}${rects}${lab}<rect class="or-cursor" y="${pad.t}" height="${h - pad.t - pad.b}" width="${bw}" visibility="hidden"/></svg>`;
      if (!hover) return;
      const svg = el.querySelector("svg"), cur = svg.querySelector(".or-cursor");
      const show = (r, i) => {
        cur.setAttribute("x", pad.l + i * bw); cur.setAttribute("visibility", "visible");
        yearsRead.innerHTML = `<b>${r.year}</b> · ${n(r.world)} objects · United States ${n(r.united_states)} · China ${n(r.china)} · Russia ${n(r.russia)} · everyone else ${n(r.rest)}`;
      };
      const pick = (ev) => {
        const b = svg.getBoundingClientRect(), px = ((ev.clientX - b.left) / b.width) * w;
        const i = Math.max(0, Math.min(data.length - 1, Math.floor((px - pad.l) / bw)));
        show(data[i], i);
      };
      svg.addEventListener("pointermove", pick);
      svg.addEventListener("pointerdown", pick);
      show(data[data.length - 1], data.length - 1);
    }
    const drawYearsMain = () => drawYears(yearsEl);
    drawYearsMain();

    // ---------- Orbits, LEO, orgs, top ----------
    const ORB = [["low_earth_orbit", "Low Earth orbit (up to 2,000 km)"], ["medium_earth_orbit", "Medium Earth orbit"], ["geostationary_orbit", "Geostationary orbit"], ["high_earth_orbit", "High Earth orbit"]];
    bars(main.querySelector("#or-orbits"), ORB.map(([k, l]) => ({ label: l, value: O[k], muted: k !== "low_earth_orbit", src: O.source })), n, O.low_earth_orbit, t);
    function drawLeo(el, h = 200) {
      const data = LEO.filter((r) => r.year >= 1960), w = Math.max(280, el.clientWidth), pad = { t: 10, r: 6, b: 22, l: 40 };
      const max = Math.ceil(Math.max(...data.flatMap((r) => [r.payloads, r.debris, r.rocket_bodies])) / 2000) * 2000;
      const x = (yr) => pad.l + ((yr - data[0].year) / (data[data.length - 1].year - data[0].year)) * (w - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      const line = (k, v) => `<polyline points="${data.map((r) => `${x(r.year)},${y(r[k])}`).join(" ")}" fill="none" stroke="var(${v})" stroke-width="2.2"/>`;
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tracked objects in low Earth orbit: payloads ${n(leo25.payloads)}, debris ${n(leo25.debris)}, rocket bodies ${n(leo25.rocket_bodies)} at the end of ${leo25.year}">
        ${[0, max / 2, max].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="or-grid"/><text x="${pad.l - 4}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${n(v)}</text>`).join("")}
        ${line("rocket_bodies", "--or-rb")}${line("debris", "--or-debris")}${line("payloads", "--em-accent")}
        <text x="${pad.l}" y="${h - 6}" class="em-tick">${data[0].year}</text><text x="${w - pad.r}" y="${h - 6}" text-anchor="end" class="em-tick">${data[data.length - 1].year}</text></svg>`;
    }
    drawLeo(main.querySelector("#or-leo"));
    main.querySelector("#or-leo").insertAdjacentHTML("afterend", `<span hidden ${t(leo25.source)}></span>`);
    bars(main.querySelector("#or-orgs"), orgs.slice(0, 10).map((r) => ({ label: r.launcher, value: r.objects_total, src: r.source })), n, orgs[0].objects_total, t);
    bars(main.querySelector("#or-top"), ctry.slice(0, 10).map((r, i) => ({ label: r.launcher, value: r.objects_total, muted: i > 2, src: r.source })), n, ctry[0].objects_total, t);
    // spark of selected country's yearly launches isn't in the per-country data; draw share bars instead
    const spark = () => {
      const el = detail.querySelector("#or-spark");
      if (!el) return;
      const r = BY[state.sel];
      el.innerHTML = `<div class="or-mini"><span>${LAST}</span><b style="width:${Math.max(1, (100 * r[K]) / Math.max(1, ...ctry.map((c) => c[K])))}%"></b><em>${n(r[K])}</em></div><div class="or-mini"><span>2015</span><b class="m" style="width:${Math.max(1, (100 * r.objects_2015) / Math.max(1, ...ctry.map((c) => c.objects_2015)))}%"></b><em>${n(r.objects_2015)}</em></div>`;
      el.previousElementSibling.textContent = "Objects launched, against the top country";
    };
    spark();
    const obs = new MutationObserver(spark);
    obs.observe(detail, { childList: true });

    // ---------- Table ----------
    const tbody = main.querySelector("#or-tbody"), search = main.querySelector("#or-search");
    let key = "objects_total", dir = -1;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = L.filter((r) => !q || r.launcher.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td>${r.iso3 && BY[r.iso3] ? `<button type="button" class="or-rowbtn" data-iso="${r.iso3}">${esc(r.launcher)}</button>` : `${esc(r.launcher)} <span class="or-org">organisation</span>`}</td>
        <td class="r" ${t(r.source)}>${n(r.objects_total)}</td><td class="r" ${t(r.source)}>${n(r[K])}</td>
        <td class="r hide-n" ${t(r.source)}>${n(r.objects_2015)}</td><td class="r hide-n">${r.first_year}</td></tr>`).join("") || `<tr><td colspan="5">Nothing matches “${esc(search.value)}”.</td></tr>`;
    }
    main.querySelectorAll(".em-table th[aria-sort]").forEach((th) => th.querySelector("button").addEventListener("click", () => {
      const k = th.dataset.key;
      dir = key === k ? -dir : k === "launcher" || k === "first_year" ? 1 : -1;
      key = k;
      main.querySelectorAll(".em-table th[aria-sort]").forEach((x) => x.setAttribute("aria-sort", x === th ? (dir > 0 ? "ascending" : "descending") : "none"));
      drawTable();
    }));
    search.addEventListener("input", drawTable);
    tbody.addEventListener("click", (e) => {
      const b = e.target.closest(".or-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#or-vis");
    function miniMap(el) {
      const w = Math.max(280, el.clientWidth), h = Math.round(w * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [w - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${w} ${h}`).attr("role", "img").attr("aria-label", `World map coloured by objects launched in ${LAST}`);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso]; return r && r[K] ? `var(${BAND_VARS[yrIdx(r[K])]})` : "var(--em-land)"; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.launcher}: ${n(r[K])}` : ft.properties.name; });
      el.append(svg.node());
    }
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "sputnik") {
        vis.innerHTML = `<p class="vt">Objects launched each year · 1957 to 2015</p><div class="m"></div>`;
        drawYears(vis.querySelector(".m"), 240, 1957, false, 2015);
      } else if (id === "boom") {
        vis.innerHTML = `<p class="vt">Objects launched each year · 2000 to ${LAST}</p><div class="m"></div>`;
        drawYears(vis.querySelector(".m"), 240, 2000, false);
      } else if (id === "us") {
        vis.innerHTML = `<p class="vt">Objects launched in ${LAST}, by country</p><div class="m"></div><div class="or-scale">${YR_LABELS.map((l, i) => `<span>${dot(BAND_VARS[i])}${l}</span>`).join("")}</div>`;
        miniMap(vis.querySelector(".m"));
      } else if (id === "starlink") {
        const share = 67;
        vis.innerHTML = `<p class="vt">Active satellites, March 2026 · out of every 100</p><div class="em-waffle">${Array.from({ length: 100 }, (_, i) => `<i class="${i < share ? "on" : ""}"></i>`).join("")}</div><p class="vsub">About <b>two-thirds</b> are Starlink.</p>`;
      } else if (id === "crowd") {
        vis.innerHTML = `<p class="vt">Tracked objects in low Earth orbit</p><div class="m"></div><p class="or-key"><span>${dot("--em-accent")}Payloads</span><span>${dot("--or-debris")}Debris</span><span>${dot("--or-rb")}Rocket bodies</span></p>`;
        drawLeo(vis.querySelector(".m"), 240);
      } else if (id === "junk") {
        vis.innerHTML = `<p class="vt">Debris larger than 1 cm · ESA estimate</p><div class="vbig">${big(fD1.value)}</div><p class="vsub">against about ${big(fT.value)} objects big enough to be tracked.</p>`;
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); drawYearsMain(); drawLeo(main.querySelector("#or-leo")); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { story.redraw(); drawYearsMain(); drawLeo(main.querySelector("#or-leo")); }, 150); });
  },
};
