// Chokepoints dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const TYPES = [["tanker", "Tankers"], ["container", "Container ships"], ["dry_bulk", "Dry bulk"], ["general_cargo", "General cargo"], ["roro", "Ro-ro (vehicles)"]];
const EIA_YEARS = ["2020", "2021", "2022", "2023", "2024", "1H25"];
const one = (v) => (v == null ? "n/a" : v >= 100 ? Math.round(v).toLocaleString("en-GB") : v.toFixed(1));
const pctc = (v) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(0)}%`);
const mbd = (v) => (v == null ? "n/a" : `${v.toFixed(1)}m b/d`);
const fmtDate = (s) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const short = (s) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
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
  id: "chokepoints",
  title: "Chokepoints",
  description:
    "Where world trade squeezes through narrow straits and canals, and what happened when the Strait of Hormuz closed in 2026, from IMF PortWatch ship-tracking data and the US EIA, with every number linked to its source.",
  mount(root) {
    const CP = DATA.chokepoints, SUM = Object.fromEntries(DATA.summary.map((r) => [r.chokepoint, r]));
    const OIL = Object.fromEntries(DATA.oil.map((r) => [r.portwatch_name, r]));
    const H = SUM["Strait of Hormuz"], SZ = SUM["Suez Canal"], BM = SUM["Bab el-Mandeb Strait"], CG = SUM["Cape of Good Hope"];
    const fact = (id) => DATA.facts.find((f) => f.id === id);
    const fClose = fact("closure"), fMou = fact("mou"), fBlk = fact("blockade"), fCrude = fact("crude_share"), fGulf = fact("gulf_exports"), fPeak = fact("oil_peak"), fQ = fact("hormuz_quarter"), fSuez = fact("suez_60");
    const oilHz = OIL["Strait of Hormuz"], oilMal = OIL["Malacca Strait"], oilS = OIL["Suez Canal"], oilB = OIL["Bab el-Mandeb Strait"], oilC = OIL["Cape of Good Hope"];
    const last = DATA.last_day;
    const ORDER = ["Strait of Hormuz", "Bab el-Mandeb Strait", "Suez Canal", "Cape of Good Hope"];
    const EVENTS = [{ d: "2026-02-28", l: "War begins" }, { d: fClose.value, l: "Closure" }, { d: fMou.value, l: "Interim deal" }, { d: fBlk.value, l: "Blockade resumes" }];

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "chokepoints",
      name: "Chokepoints",
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
    const step = (id, n, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${n}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Chokepoints · daily data to ${esc(fmtDate(last))}</p>
        <h1>Hormuz used to see <b ${t(H.source)}>${one(H.avg_2025)}</b> ships a day. <span class="accent">Since March 2026 it has averaged <b ${t(H.source)}>${one(H.avg_since_closure)}</b></span></h1>
        <p class="em-lede">The strait carried about <b ${t(fQ.source)}>a quarter</b> of the world's seaborne oil before the IRGC declared it closed on <b ${t(fClose.source)}>${esc(fmtDate(fClose.value))}</b>. Ship-tracking data shows transits down <b ${t(H.source)}>${Math.abs(Math.round(H.change_pct))}%</b> since then.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Ships through a strait, <span class="accent">counted from space</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Hormuz since the closure", one(H.avg_since_closure), `Ships a day, ${esc(short(DATA.closure))} to ${esc(short(last))}, against <span ${t(H.source)}>${one(H.avg_2025)}</span> in 2025`, H.source, true)}
          ${kpi("Hormuz tankers", one(H.tanker_since_closure), `A day since the closure, down from <span ${t(H.source)}>${one(H.tanker_2025)}</span> in 2025`, H.source)}
          ${kpi("Last 30 days", one(H.avg_last_30_days), `Hormuz ships a day, to ${esc(short(last))}`, H.source)}
          ${kpi("Biggest oil chokepoint", mbd(oilMal.mbd_1H25), "Through the Malacca Strait, first half of 2025", oilMal.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>The world's narrow places</p><h2>${CP.length} chokepoints, <span class="accent">sized by the oil they carry</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <p class="em-eyebrow">Circle size = oil flow, first half of 2025</p>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="cp-map" role="region" aria-label="World map of maritime chokepoints"></div>
            <div class="cp-scale"><span>${dot("--cp-hit")}Traffic collapsed in 2026</span><span>${dot("--em-accent")}Oil chokepoint (EIA)</span><span>${dot("--cp-other")}Other monitored chokepoint</span></div>
          </div>
          <div class="em-card em-detail soft" id="cp-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="weekly">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Week by week</p><h2>One strait emptied. <span class="accent">The others barely moved</span></h2></div></div>
        <div class="cp-multiples" id="cp-multiples"></div>
        <p class="cp-events">${EVENTS.map((e) => `<span><i></i>${esc(short(e.d))} · ${esc(e.l)}</span>`).join("")}</p>
      </section>

      <section class="em-sec" id="types">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>What stopped moving</p><h2>Hormuz ships a day by type, <span class="accent">2025 against since the closure</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Strait of Hormuz · average ships a day</p>
            <h3>Tankers fell furthest</h3>
            <p class="note">Grey bars are 2025; coloured bars are ${esc(short(DATA.closure))} to ${esc(short(last))} 2026.</p>
            <div class="em-bars" id="cp-types"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Strait of Hormuz · tonnage a day</p>
            <h3>Cargo capacity through the strait</h3>
            <p class="note">Deadweight tonnage of the ships transiting, a measure of how much they can carry.</p>
            <div class="cp-pair">
              <div><p class="em-eyebrow">2025</p><div class="em-big" ${t(H.source)}>${(H.dwt_2025 / 1e6).toFixed(1)}m t</div></div>
              <div><p class="em-eyebrow">Since the closure</p><div class="em-big accent" ${t(H.source)}>${(H.dwt_since_closure / 1e6).toFixed(2)}m t</div></div>
            </div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="oil">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Oil's narrow routes</p><h2>Two chokepoints carry <span class="accent">${(oilMal.mbd_1H25 + oilHz.mbd_1H25).toFixed(0)}m barrels a day</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">EIA · first half of 2025</p>
            <h3>Oil flows by chokepoint</h3>
            <p class="note">Crude oil and petroleum products, million barrels a day. The Cape of Good Hope is a route, not a chokepoint.</p>
            <div class="em-bars" id="cp-oil"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">The Red Sea detour · 2023 to 2024</p>
            <h3>Oil moved around Africa first</h3>
            <p class="note">After attacks on Red Sea shipping began in late 2023, oil through Bab el-Mandeb more than halved while flows around the Cape rose.</p>
            <div class="em-bars" id="cp-detour"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="ripple">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>The ripple</p><h2>What one closed strait <span class="accent">did to the rest</span></h2></div></div>
        <div class="em-grid">
          ${factCard("Before the war · UNCTAD", fCrude, `${fCrude.value}%`, `of global seaborne crude passed through Hormuz, along with ${esc(fCrude.note)}.`, true)}
          ${factCard("Gulf crude exports", fGulf, `${esc(fGulf.value)}m b/d`, `From 2025 to August 2026, ${esc(fGulf.note.replace(/^./, (c) => c.toLowerCase()))}.`)}
          ${factCard("Oil price · April 2026", fPeak, `$${fPeak.value}+`, `A barrel at the peak. By late August prices were about 20% above pre-war levels.`)}
          ${factCard("Suez Canal · January 2026", fSuez, `${fSuez.value}%`, `transits against the same week of 2023, ${esc(fSuez.note.replace(/^./, (c) => c.toLowerCase()))}. Since the closure Suez has averaged <b ${t(SZ.source)}>${one(SZ.avg_since_closure)}</b> ships a day.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>All chokepoints</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <div class="em-tablewrap">
            <table class="em-table">
              <thead><tr>
                <th data-key="chokepoint" aria-sort="none"><button type="button">Chokepoint</button></th>
                <th class="r" data-key="oil_mbd_1h25" aria-sort="descending"><button type="button">Oil 1H25</button></th>
                <th class="r hide-n" data-key="oil_mbd_2023" aria-sort="none"><button type="button">Oil 2023</button></th>
                <th class="r" data-key="transits_2025" aria-sort="none"><button type="button">Ships/day 2025</button></th>
                <th class="r hide-n" data-key="transits_since_closure" aria-sort="none"><button type="button">Since closure</button></th>
                <th class="r" data-key="transits_change_pct" aria-sort="none"><button type="button">Change</button></th>
              </tr></thead>
              <tbody id="cp-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Transits</b> are IMF PortWatch's daily counts of vessels crossing each chokepoint, estimated from satellite AIS ship-tracking signals and grouped by vessel type. Ships that switch off their transponders are missed, and PortWatch revises past days as more signals arrive. This dashboard uses PortWatch's export of 31 October 2026, covering 1 January 2025 to ${esc(fmtDate(last))}, taken from a public copy of the official download. Daily data here covers four chokepoints: Hormuz, Bab el-Mandeb, Suez and the Cape of Good Hope. "Since the closure" means from ${esc(fmtDate(DATA.closure))}, the date the IRGC confirmed it.</p>
        <p><b>Oil flows</b> are the US Energy Information Administration's estimates of crude oil and petroleum liquids passing each chokepoint, in million barrels a day, updated March 2026. Suez includes the SUMED pipeline; the Danish Straits are drawn at the Oresund and the Turkish Straits at the Bosporus. Dates of events come from news reporting, linked in the sources.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("quarter", "01", "The narrowest place", `About <span class="accent"><b ${t(fQ.source)}>a quarter</b></span> of the world's seaborne oil went through one strait`, `In the first half of 2025, <b ${t(oilHz.source)}>${mbd(oilHz.mbd_1H25)}</b> passed through the Strait of Hormuz, between Iran and Oman.`)}
            ${step("closure", "02", "The closure", `On ${esc(fmtDate(fClose.value))}, the IRGC declared the strait <span class="accent">closed</span>`, `It came two days after US and Israeli strikes on Iran. Daily transits fell from <b ${t(H.source)}>${one(H.avg_2025)}</b> to single figures, rising briefly after the June interim deal.`)}
            ${step("tankers", "03", "The tankers", `Tanker transits fell from <b ${t(H.source)}>${one(H.tanker_2025)}</b> a day to <span class="accent"><b ${t(H.source)}>${one(H.tanker_since_closure)}</b></span>`, `Container ships, bulk carriers and car carriers all but stopped too.`)}
            ${step("ripple", "04", "The ripple", `Gulf crude exports fell from <span class="accent"><b ${t(fGulf.source)}>17 to 9</b></span> million barrels a day`, `Oil peaked above <b ${t(fPeak.source)}>$${fPeak.value}</b> a barrel in April 2026.`)}
            ${step("redsea", "05", "Already detoured", `The Red Sea route had <span class="accent">emptied</span> two years earlier`, `After attacks on shipping began in late 2023, oil through Bab el-Mandeb fell from <b ${t(oilB.source)}>${mbd(oilB.mbd_2023)}</b> to <b ${t(oilB.source)}>${mbd(oilB.mbd_2024)}</b>, and ships went around Africa instead.`)}
            ${step("map", "06", "The map", `PortWatch monitors <span class="accent"><b ${t("portwatch-db")}>${CP.length}</b></span> chokepoints`, `From the Dover Strait to the Malacca Strait, each is a place where a single disruption can reroute world trade.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="cp-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { sel: "Strait of Hormuz" };
    const mapEl = main.querySelector("#cp-map");
    const maxOil = Math.max(...CP.map((c) => c.oil_mbd_1h25 || 0));
    const geo = () => ({
      type: "FeatureCollection",
      features: CP.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lon, c.lat] },
        properties: {
          name: c.chokepoint,
          cat: c.transits_change_pct != null && c.transits_change_pct < -50 ? 2 : c.oil_mbd_1h25 ? 1 : 0,
          r: c.oil_mbd_1h25 ? 5 + 22 * Math.sqrt(c.oil_mbd_1h25 / maxOil) : 4,
          sel: c.chokepoint === state.sel,
        },
      })),
    });
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), acc: cssColor(mapEl, "--em-accent"), hit: cssColor(mapEl, "--cp-hit"), oth: cssColor(mapEl, "--cp-other") });
    map = new maplibregl.Map({
      container: mapEl, style: { version: 8, sources: {}, layers: [] }, center: [40, 20], zoom: 0.6, minZoom: -2, maxZoom: 6, renderWorldCopies: false,
      attributionControl: { compact: true, customAttribution: "Boundaries: Natural Earth · Chokepoints: IMF PortWatch" }, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "em-popup" });
    const fit = (animate) => map.fitBounds([[-168, -55], [178, 70]], { padding: 16, animate, maxZoom: 4 });
    const ready = new Promise((res) =>
      map.on("load", () => {
        const c = colors();
        map.addSource("countries", { type: "geojson", data: world });
        map.addSource("cp", { type: "geojson", data: geo() });
        map.addLayer({ id: "bg", type: "background", paint: { "background-color": c.bg } });
        map.addLayer({ id: "land", type: "fill", source: "countries", paint: { "fill-color": c.land } });
        map.addLayer({ id: "borders", type: "line", source: "countries", paint: { "line-color": c.bg, "line-width": 0.6 } });
        map.addLayer({ id: "cp", type: "circle", source: "cp", paint: circlePaint(c) });
        map.on("mousemove", "cp", (e) => {
          const ft = e.features?.[0];
          if (!ft) return;
          const r = CP.find((x) => x.chokepoint === ft.properties.name);
          map.getCanvas().style.cursor = "pointer";
          popup.setLngLat(ft.geometry.coordinates).setText(`${r.chokepoint}${r.oil_mbd_1h25 ? ` · ${mbd(r.oil_mbd_1h25)} oil` : ""}${r.transits_change_pct != null ? ` · ships ${pctc(r.transits_change_pct)}` : ""}`).addTo(map);
        });
        map.on("mouseleave", "cp", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
        map.on("click", "cp", (e) => { const n = e.features?.[0]?.properties.name; if (n) select(n); });
        fit(false);
        res();
      })
    );
    function circlePaint(c) {
      return {
        "circle-color": ["match", ["get", "cat"], 2, c.hit, 1, c.acc, c.oth],
        "circle-opacity": ["case", ["get", "sel"], 0.95, 0.7],
        "circle-stroke-color": ["case", ["get", "sel"], c.fg, c.bg],
        "circle-stroke-width": ["case", ["get", "sel"], 2, 1],
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, ["get", "r"], 5, ["*", ["get", "r"], 1.8]],
      };
    }
    new ResizeObserver(() => { map.resize(); if (map.getProjection?.()?.type !== "globe") fit(false); }).observe(mapEl);
    async function repaint() {
      await ready;
      const c = colors();
      map.setPaintProperty("bg", "background-color", c.bg);
      map.setPaintProperty("land", "fill-color", c.land);
      map.setPaintProperty("borders", "line-color", c.bg);
      Object.entries(circlePaint(c)).forEach(([k, v]) => map.setPaintProperty("cp", k, v));
      map.getSource("cp").setData(geo());
    }
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [55, 20], duration: 800 });
      else fit(true);
    }));

    // ---------- Detail ----------
    const detail = main.querySelector("#cp-detail");
    const weekly = (n) => DATA.weekly.filter((w) => w.chokepoint === n);
    function spark(el, n, key = "transits", h = 70) {
      const ws = weekly(n);
      if (!ws.length) return;
      const w = Math.max(220, el.clientWidth || 260), pad = 4;
      const max = Math.max(...ws.map((d) => d[key])) * 1.08 || 1;
      const t0 = Date.parse(ws[0].week), t1 = Date.parse(ws[ws.length - 1].week);
      const x = (d) => pad + ((Date.parse(d) - t0) / (t1 - t0)) * (w - 2 * pad);
      const y = (v) => h - pad - (v / max) * (h - 2 * pad);
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(n)} weekly average ships a day, ${ws[0].week} to ${ws[ws.length - 1].week}">
        <line x1="${x(DATA.closure)}" x2="${x(DATA.closure)}" y1="0" y2="${h}" class="cp-evline"/>
        <polyline points="${ws.map((d) => `${x(d.week)},${y(d[key])}`).join(" ")}" fill="none" stroke="var(--em-accent)" stroke-width="2"/></svg>`;
    }
    function drawDetail() {
      const c = CP.find((x) => x.chokepoint === state.sel), s = SUM[state.sel], o = OIL[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      detail.innerHTML = `
        <p class="em-eyebrow">Selected chokepoint</p>
        <label class="cp-pick"><span class="em-eyebrow">Choose</span><select id="cp-select">${[...CP].sort((a, b) => a.chokepoint.localeCompare(b.chokepoint)).map((x) => `<option${x.chokepoint === state.sel ? " selected" : ""}>${esc(x.chokepoint)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(c.chokepoint)}</p>
        ${s ? `<p class="em-d-value" ${t(s.source)}>${one(s.avg_since_closure)}</p>
          <p class="em-d-usd">ships a day since ${esc(short(DATA.closure))} 2026, against <span ${t(s.source)}>${one(s.avg_2025)}</span> in 2025 (${pctc(s.change_pct)})</p>
          <p class="em-eyebrow" style="margin-top:12px">Weekly average, 2025 to ${esc(short(last))} 2026</p><div class="cp-spark" id="cp-spark"></div>` : o ? `<p class="em-d-value" ${t(o.source)}>${mbd(o.mbd_1H25)}</p><p class="em-d-usd">of oil, first half of 2025. Daily ship counts for this chokepoint aren't in this dashboard yet.</p>` : `<p class="em-d-usd">One of the chokepoints IMF PortWatch monitors. Ship counts and oil flows for it aren't in this dashboard yet.</p>`}
        <dl class="em-d-list" style="margin-top:12px">
          ${s ? row("Tankers a day, 2025", `<span ${t(s.source)}>${one(s.tanker_2025)}</span>`) + row("Tankers since closure", `<span ${t(s.source)}>${one(s.tanker_since_closure)}</span>`) + row("Last 30 days", `<span ${t(s.source)}>${one(s.avg_last_30_days)}</span> ships a day`) : ""}
          ${o ? row(`Oil, ${o.chokepoint === c.chokepoint ? "" : "EIA's " + o.chokepoint + ", "}1H25`, `<span ${t(o.source)}>${mbd(o.mbd_1H25)}</span>`) + row("Oil, 2023", `<span ${t(o.source)}>${mbd(o.mbd_2023)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#cp-select").addEventListener("change", (e) => select(e.target.value, true));
      const sp = detail.querySelector("#cp-spark");
      if (sp) spark(sp, state.sel);
      src.footnotes(detail);
    }
    async function select(name, fly = false) {
      state.sel = name;
      drawDetail();
      await ready;
      map.getSource("cp").setData(geo());
      if (fly) {
        const c = CP.find((x) => x.chokepoint === name);
        map.easeTo({ center: [c.lon, c.lat], zoom: Math.max(map.getZoom(), 2.5), duration: 800 });
      }
    }
    drawDetail();

    // ---------- Small multiples ----------
    function multiple(el, n, h = 150) {
      const ws = weekly(n), w = Math.max(240, el.clientWidth), pad = { t: 8, r: 6, b: 18, l: 28 };
      const max = Math.ceil((Math.max(...ws.map((d) => d.transits)) * 1.1) / 10) * 10;
      const t0 = Date.parse(ws[0].week), t1 = Date.parse(ws[ws.length - 1].week);
      const x = (d) => pad.l + ((Date.parse(d) - t0) / (t1 - t0)) * (w - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
      const ev = EVENTS.map((e) => `<line x1="${x(e.d)}" x2="${x(e.d)}" y1="${pad.t}" y2="${h - pad.b}" class="cp-evline"><title>${esc(short(e.d))}: ${esc(e.l)}</title></line>`).join("");
      const area = `${x(ws[0].week)},${y(0)} ${ws.map((d) => `${x(d.week)},${y(d.transits)}`).join(" ")} ${x(ws[ws.length - 1].week)},${y(0)}`;
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(n)}: weekly average ships a day">
        ${[0, max / 2, max].map((v) => `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y(v)}" y2="${y(v)}" class="cp-grid"/><text x="${pad.l - 4}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${v}</text>`).join("")}
        ${ev}<polygon points="${area}" fill="var(--em-accent)" fill-opacity=".14"/><polyline points="${ws.map((d) => `${x(d.week)},${y(d.transits)}`).join(" ")}" fill="none" stroke="var(--em-accent)" stroke-width="2"/>
        <text x="${pad.l}" y="${h - 4}" class="em-tick">Jan 2025</text><text x="${w - pad.r}" y="${h - 4}" text-anchor="end" class="em-tick">${esc(short(ws[ws.length - 1].week))} 2026</text></svg>`;
    }
    const mult = main.querySelector("#cp-multiples");
    mult.innerHTML = ORDER.map((n, i) => `<div class="em-card"><p class="em-eyebrow">${esc(n)}</p><p class="cp-mnum"><b ${t(SUM[n].source)}>${one(SUM[n].avg_since_closure)}</b> a day since the closure · <span class="${SUM[n].change_pct < -10 ? "down-bad" : ""}">${pctc(SUM[n].change_pct)}</span> on 2025</p><div class="cp-mchart" data-i="${i}"></div><div class="em-cites"></div></div>`).join("");
    const drawMultiples = () => mult.querySelectorAll(".cp-mchart").forEach((el) => multiple(el, ORDER[+el.dataset.i]));
    drawMultiples();

    // ---------- Types, oil, detour ----------
    const typeRows = TYPES.flatMap(([k, l]) => [
      { group: l, label: "2025", value: H[`${k}_2025`], muted: true, src: H.source },
      { group: null, label: "Since closure", value: H[`${k}_since`], muted: false, src: H.source },
    ]);
    bars(main.querySelector("#cp-types"), typeRows.map((r, i) => ({ ...r, group: i % 2 === 0 ? r.group : undefined })), one, Math.max(...typeRows.map((r) => r.value)), t);
    const oilRows = [...DATA.oil].sort((a, b) => b.mbd_1H25 - a.mbd_1H25);
    bars(main.querySelector("#cp-oil"), oilRows.map((r) => ({ label: r.chokepoint.replace(" and SUMED Pipeline", " + SUMED").replace(" (Dardanelles)", ""), value: r.mbd_1H25, muted: r.chokepoint === "Cape of Good Hope", src: r.source })), mbd, 25, t);
    const det = [oilB, oilS, oilC].flatMap((r) => [
      { group: r.chokepoint.replace(" and SUMED Pipeline", " + SUMED"), label: "2023", value: r.mbd_2023, muted: true, src: r.source },
      { label: "2024", value: r.mbd_2024, muted: false, src: r.source },
    ]);
    bars(main.querySelector("#cp-detour"), det, mbd, 10, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#cp-tbody");
    let key = "oil_mbd_1h25", dir = -1;
    function drawTable() {
      const list = [...CP].sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return y == null ? a.chokepoint.localeCompare(b.chokepoint) : 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="cp-rowbtn" data-n="${esc(r.chokepoint)}">${esc(r.chokepoint)}</button></td>
        <td class="r" ${r.oil_source ? t(r.oil_source) : ""}>${r.oil_mbd_1h25 == null ? "–" : r.oil_mbd_1h25.toFixed(1)}</td>
        <td class="r hide-n" ${r.oil_source ? t(r.oil_source) : ""}>${r.oil_mbd_2023 == null ? "–" : r.oil_mbd_2023.toFixed(1)}</td>
        <td class="r" ${r.transits_source ? t(r.transits_source) : ""}>${r.transits_2025 == null ? "–" : one(r.transits_2025)}</td>
        <td class="r hide-n" ${r.transits_source ? t(r.transits_source) : ""}>${r.transits_since_closure == null ? "–" : one(r.transits_since_closure)}</td>
        <td class="r ${r.transits_change_pct < -10 ? "up" : ""}">${r.transits_change_pct == null ? "–" : pctc(r.transits_change_pct)}</td></tr>`).join("");
    }
    main.querySelectorAll(".em-table th[aria-sort]").forEach((th) => th.querySelector("button").addEventListener("click", () => {
      const k = th.dataset.key;
      dir = key === k ? -dir : k === "chokepoint" ? 1 : -1;
      key = k;
      main.querySelectorAll(".em-table th[aria-sort]").forEach((x) => x.setAttribute("aria-sort", x === th ? (dir > 0 ? "ascending" : "descending") : "none"));
      drawTable();
    }));
    tbody.addEventListener("click", (e) => {
      const b = e.target.closest(".cp-rowbtn");
      if (!b) return;
      select(b.dataset.n, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    main.querySelector("#table .em-cites").insertAdjacentHTML("beforebegin", `<span hidden ${t("portwatch-db")}></span>`);
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#cp-vis");
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "quarter") {
        vis.innerHTML = `<p class="vt">Oil through chokepoints · first half of 2025</p><div class="em-bars"></div>`;
        bars(vis.querySelector(".em-bars"), oilRows.slice(0, 5).map((r) => ({ label: r.chokepoint.replace(" and SUMED Pipeline", " + SUMED"), value: r.mbd_1H25, muted: r.portwatch_name !== "Strait of Hormuz", src: r.source })), mbd, 25, t);
      } else if (id === "closure") {
        vis.innerHTML = `<p class="vt">Strait of Hormuz · ships a day, weekly average</p><div class="m"></div><p class="cp-events">${EVENTS.map((e) => `<span><i></i>${esc(short(e.d))} · ${esc(e.l)}</span>`).join("")}</p>`;
        multiple(vis.querySelector(".m"), "Strait of Hormuz", 220);
      } else if (id === "tankers") {
        vis.innerHTML = `<p class="vt">Hormuz tankers a day</p><div class="vbig">${one(H.tanker_since_closure)}</div><p class="vsub">since the closure, down from ${one(H.tanker_2025)} in 2025.</p>
          <div class="cp-split"><span style="flex:${H.tanker_2025}">2025 · ${one(H.tanker_2025)}</span></div><div class="cp-split now"><span style="flex:${Math.max(H.tanker_since_closure, 1.5)}"></span><span style="flex:${H.tanker_2025 - H.tanker_since_closure}" class="gap">${one(H.tanker_since_closure)} now</span></div>`;
      } else if (id === "ripple") {
        vis.innerHTML = `<p class="vt">Gulf crude exports · million barrels a day</p><div class="em-bars"></div>`;
        bars(vis.querySelector(".em-bars"), [{ label: "2025", value: 17, muted: true, src: fGulf.source }, { label: "August 2026", value: 9, src: fGulf.source }], (v) => `${v}m b/d`, 18, t);
      } else if (id === "redsea") {
        vis.innerHTML = `<p class="vt">Oil flows, 2023 against 2024</p><div class="em-bars"></div>`;
        bars(vis.querySelector(".em-bars"), det, mbd, 10, t);
      } else if (id === "map") {
        vis.innerHTML = `<p class="vt">The ${CP.length} chokepoints IMF PortWatch monitors</p><ul class="cp-list">${[...CP].sort((a, b) => (b.oil_mbd_1h25 || 0) - (a.oil_mbd_1h25 || 0)).map((c) => `<li>${esc(c.chokepoint)}</li>`).join("")}</ul>`;
      }
    });

    function setView(v) {
      main.querySelectorAll(".em-view").forEach((el) => (el.hidden = el.dataset.view !== v));
      if (v === "story") story.redraw();
      if (v === "dashboard") { map.resize(); fit(false); drawMultiples(); }
    }
    if (initialView && initialView !== "dashboard") root.querySelector(`.em-viewbtn[data-view="${initialView}"]`)?.click();
    let rt = 0;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { story.redraw(); drawMultiples(); const sp = detail.querySelector("#cp-spark"); if (sp) spark(sp, state.sel); }, 150); });
  },
};
