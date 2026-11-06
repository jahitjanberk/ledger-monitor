// Critical Minerals dashboard for Economy Monitor.
// Built on the shared Economy Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--mn-b0", "--mn-b1", "--mn-b2", "--mn-b3", "--mn-b4"];
const BANDS = DATA.bands;
const bandOf = (v) => (v == null ? -1 : BANDS.findIndex((b) => (b.min == null || v >= b.min) && (b.max == null || v < b.max)));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym, long = false) => { const [y, m] = ym.split("-").map(Number); return `${(long ? MONTH : MON)[m - 1]} ${y}`; };
const dayName = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${dd} ${MON[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const pct = (v, d = 0) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const signed = (v, d = 0) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`);
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
  id: "minerals",
  title: "Critical Minerals",
  description:
    "Where the minerals in batteries, phones and power grids are mined and refined, who controls them, and what that means for prices and people, from USGS, the IEA and the OECD, with every number linked to its source.",
  mount(root) {
    const M = DATA.minerals, MBY = Object.fromEntries(M.map((m) => [m.mineral, m]));
    const P = DATA.production, R = DATA.refining;
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const gr = MBY.graphite, co = MBY.cobalt, re = MBY["rare-earths"], li = MBY.lithium, ni = MBY.nickel, ga = MBY.gallium;
    const withRef = M.filter((m) => m.top_refiner_share != null);
    const T20 = [...DATA.top_refiner].sort((a, b) => b.share - a.share), over90 = T20.filter((r) => r.share >= 90).length;
    const PR = [...DATA.prices].sort((a, b) => b.change_2024_2025 - a.change_2024_2025);
    const MT = DATA.metals, mNow = MT.at(-1), m0 = MT[0];
    const cuPeak = MT.reduce((a, b) => (b.copper > a.copper ? b : a));
    const CTL = DATA.controls, CODES = DATA.tariff_codes;
    const liP = DATA.prices.find((p) => p.mineral === "lithium");
    const countries = [...new Map(P.map((r) => [r.iso3, r])).values()];
    const BYC = Object.fromEntries(countries.map((r) => [r.iso3, r]));

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "minerals",
      name: "Minerals",
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
    const short = (c) => ({ "Democratic Republic of Congo": "DR Congo", "United States": "the US" })[c] ?? c;

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Minerals · production to 2025, prices to ${monthName(mNow.month)}, controls as of 6 Nov 2026</p>
        <h1>China refines <b ${t(gr.refining_source)}>${pct(gr.china_refined_share)}</b> of the world's battery graphite and ${pct(re.china_refined_share)} of its rare earths. <span class="accent">DR Congo mines ${f.drc.value}% of its cobalt</span></h1>
        <p class="em-lede">The minerals in phones, electric cars, wind turbines and weapons come from a handful of countries, and more of them now restrict exports: restrictions on critical raw materials are up <b ${t(f.fivefold.source)}>fivefold</b> since 2009. China's export controls on rare earths and battery materials announced in October 2025 are suspended only until <b ${t("mofcom-2025-70")}>10 November 2026</b>.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>A few countries hold <span class="accent">most of the supply</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("China's share of graphite refining", pct(gr.china_refined_share), `In 2025. It also refines <span ${t(co.refining_source)}>${pct(co.china_refined_share)}</span> of cobalt and <span ${t(li.refining_source)}>${pct(li.china_refined_share)}</span> of lithium`, gr.refining_source, true)}
          ${kpi("DR Congo's share of mined cobalt", `${f.drc.value}%`, `In 2025. Indonesia mines <span ${t(ni.source)}>${pct(ni.top_share)}</span> of the world's nickel`, f.drc.source)}
          ${kpi("Export restrictions since 2009", `${f.fivefold.value}×`, `On critical raw materials worldwide. <span ${t(f.restricted.source)}>${f.restricted.value}%</span> of cobalt and manganese exports faced at least one`, f.fivefold.source)}
          ${kpi("Chinese tariff codes under control", `${CODES[0].tariff_codes} → ${CODES.at(-1).tariff_codes}`, `Mineral export codes needing a licence, ${monthName(CODES[0].month)} to ${monthName(CODES.at(-1).month)}`, CODES[0].source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Who mines what</p><h2>Pick a mineral to see <span class="accent">where it is dug up</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <label class="mn-mineral"><span class="em-eyebrow">Mineral</span><select id="mn-which">${M.map((m) => `<option value="${m.mineral}"${m.mineral === "cobalt" ? " selected" : ""}>${esc(m.label)}</option>`).join("")}</select></label>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="mn-map" role="region" aria-label="World map of countries coloured by their share of world mine production of the selected mineral"></div>
            <div class="mn-scale" id="mn-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="mn-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="refining">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Mining against refining</p><h2>Ore is dug up in many places, <span class="accent">but most of it is refined in China</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Share of the leading country · mining and refining, 2025</p>
            <h3>Cobalt is mined in DR Congo and refined in China</h3>
            <p class="note">Mining shares are calculated from USGS country tables; refining shares are the IEA's. Refining turns ore into the purified chemicals and metals that factories buy, and is where China dominates.</p>
            <div class="mn-key"><span>${dot("--mn-b2")}Top mining country</span><span>${dot("--em-accent")}Top refining country</span></div>
            <div class="mn-pairs" id="mn-pairs"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Share of the top refining country · 20 minerals</p>
            <h3>China is the top refiner of 19 of 20 energy minerals</h3>
            <p class="note">Indonesia leads only for nickel. For ${over90} minerals the top refiner holds 90% or more. Latest year available for each, from the IEA's 2025 outlook.</p>
            <div class="em-bars" id="mn-top20"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("IEA · 2025", f.top72, `${f.top72.value}%`, `average share of the top refining country across key energy minerals, excluding rare earths, up from 70% in 2023. Supply is getting more concentrated, not less.`, true)}
          ${factCard("IEA · copper", f.copper90, "Over 90%", `of the growth in world copper smelting since 2005 was in China, taking its share of capacity from about 15% to 50%.`)}
        </div>
      </section>

      <section class="em-sec" id="prices">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Prices</p><h2>Copper hit a record. <span class="accent">Restricted minerals jumped the most</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">London Metal Exchange prices · indexed to January 2019 = 100, ${monthName(m0.month)} to ${monthName(mNow.month)}</p>
            <h3>Copper is ${(mNow.copper / m0.copper).toFixed(1)} times its January 2019 price</h3>
            <p class="note">Copper reached <b ${t(cuPeak.source)}>$${n0(cuPeak.copper)}</b> a tonne in ${monthName(cuPeak.month, true)}, its highest monthly average since the World Bank series began in 1960, in dollars of the day. The dashed line is the January 2019 level.</p>
            <div id="mn-metals"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Price change · 2024 to 2025</p>
            <h3>Antimony more than doubled after China restricted exports</h3>
            <p class="note">Annual average prices quoted by USGS; 2025 is estimated. Lithium kept falling while world output rose <b ${t("usgs-mcs")}>31%</b>.</p>
            <div id="mn-pchg"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("USGS · lithium", f.lithiumprice, `$${n0(liP.p2025)}`, `a tonne for lithium carbonate in 2025, against <b ${t(liP.source)}>$${n0(liP.p2022)}</b> in 2022. About <b ${t(f.batteries.source)}>${f.batteries.value}%</b> of lithium goes into batteries.`, true)}
          ${factCard("IEA · since January 2025", f.cobaltprice, `+${f.cobaltprice.value}%`, `for cobalt by April 2026, largely because of DR Congo's export restrictions. Tungsten rose <b ${t(f.tungsten6.source)}>sixfold</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="controls">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Export controls</p><h2>Minerals have become <span class="accent">a tool of trade policy</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Export bans, licences and quotas · 2020 to 2025, status on 6 November 2026</p>
            <h3>Two of China's suspensions run out this month</h3>
            <p class="note">In November 2025 China paused its October controls and its ban on sales to the United States for a year. Unless extended, the pauses end on 10 and 27 November 2026.</p>
            <ol class="mn-tl" id="mn-tl"></ol>
            <div class="em-cites"></div>
          </div>
          ${factCard("OECD · 2022 to 2024", f.restricted, `${f.restricted.value}%`, `of world cobalt and manganese exports faced at least one export restriction. Graphite 47%, rare earths 45%.`, true)}
          ${factCard("IEA · what is at risk", f.risk, `$${f.risk.value} trillion`, `a year of production outside China, from cars to electronics and defence, could be at risk if rare earth controls were fully applied.`)}
          ${factCard("IEA · prices in Europe", f.europe5, `${f.europe5.value}×`, `what buyers in China pay: the price of gallium and the heavy rare earths dysprosium and terbium in Europe.`)}
        </div>
      </section>

      <section class="em-sec" id="people">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>People and waste</p><h2>Hand-dug cobalt, <span class="accent">and phones thrown away</span></h2></div></div>
        <p class="em-lede mn-lede2">Much of DR Congo's cobalt comes from industrial mines, but a share is dug by hand, sometimes by children. Meanwhile most of the metal in discarded electronics is never recovered.</p>
        <div class="em-grid">
          ${factCard("OECD · 2019", f.artisanal, "18–30%", `of DR Congo's cobalt was estimated to come from artisanal miners digging by hand.`, true)}
          ${factCard("UNICEF estimate, 2014", f.children, n0(f.children.value), `children worked in mines across southern DR Congo, many of them in cobalt mining, as cited by Amnesty International in 2016. It is an old estimate; we found no newer official count.`)}
          ${factCard("Global E-waste Monitor · 2022", f.ewaste, `${f.ewaste.value}%`, `of the world's electronic waste was documented as properly collected and recycled. Just <b ${t(f.ree1.source)}>${f.ree1.value}%</b> of rare earth demand is met by recycling.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Close to home</p><h2>The UK and EU want <span class="accent">no single supplier above 60–65%</span></h2></div></div>
        <div class="em-grid">
          ${factCard("UK · Vision 2035", f.uk60, "60%", `at most of UK demand for critical minerals from any one country by 2035, with at least 10% from UK production and 20% from recycling, across all critical minerals together.`, true)}
          ${factCard("EU · Critical Raw Materials Act", f.eu, "65%", `at most of EU consumption of each strategic raw material from one country by 2030, with 10% mined, 40% processed and 25% recycled in the EU.`)}
          ${factCard("OECD · UK imports", f.ukimports, `${f.ukimports.value}%`, `of the UK's critical raw material imports faced at least one export restriction in 2022–2024, against 16% worldwide.`)}
          ${factCard("British Geological Survey · 2024", f.bgs, `${f.bgs.value} of 82`, `minerals were assessed as critical for the UK. Niobium, cobalt and rare earths rank highest.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Every mineral</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <div class="em-tablewrap">
            <table class="em-table">
              <thead><tr>
                <th>Mineral</th>
                <th class="hide-n">Used for</th>
                <th>Top miner, 2025</th>
                <th class="r hide-n">Top three</th>
                <th>Top refiner, 2025</th>
                <th class="r hide-n">Price, 2024–25</th>
              </tr></thead>
              <tbody>${M.map((m) => { const p = DATA.prices.find((x) => x.mineral === m.mineral); return `<tr>
                <td><b>${esc(m.label)}</b></td>
                <td class="hide-n">${esc(m.used_for)}</td>
                <td ${t(m.source)}>${esc(short(m.top_country))} ${pct(m.top_share)}</td>
                <td class="r hide-n" ${t(m.source)}>${pct(m.top3_share)}</td>
                <td ${m.refining_source ? t(m.refining_source) : ""}>${m.top_refiner ? `${esc(m.top_refiner)} ${pct(m.top_refiner_share)}` : "–"}</td>
                <td class="r hide-n" ${p ? t(p.source) : ""}>${p ? signed(p.change_2024_2025) : "–"}</td></tr>`; }).join("")}</tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">09</span>Method</p>
        <p><b>Mining</b> figures are from the US Geological Survey's <i>Mineral Commodity Summaries 2026</i>: mine production by country for 2024 and estimated 2025, and reserves. Shares divide each country's output by USGS's rounded world total, so they can differ by a point or two from the shares USGS quotes in its text, such as 73% for DR Congo's cobalt. US lithium output is withheld, so lithium shares are of the world excluding the US. Gallium is primary low-purity production. The tables were read from the USGS chapter PDFs.</p>
        <p><b>Refining</b> shares for seven minerals in 2025 are from the IEA's <i>Global Critical Minerals Outlook 2026</i>, and for twenty minerals from its 2025 edition (latest year available for each). <b>Prices</b> are USGS's annual averages, which it quotes from Benchmark Mineral Intelligence, S&amp;P Global Platts and Argus, and the World Bank's monthly London Metal Exchange prices. <b>Export controls</b> are taken from the announcements of China's Ministry of Commerce and the IEA's policy database, with status checked on 6 November 2026. The refining figures are a work derived by Economy Monitor from IEA material and are not endorsed by the IEA.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("cobalt", "01", "Mining", `DR Congo mines <span class="accent"><b ${t(f.drc.source)}>${f.drc.value}%</b></span> of the world's cobalt`, `Cobalt goes into the cathodes of many electric-car batteries.`)}
            ${step("refining", "02", "Refining", `China refines <span class="accent"><b ${t(co.refining_source)}>${pct(co.china_refined_share)}</b></span> of it`, `And ${pct(gr.china_refined_share)} of battery graphite, ${pct(li.china_refined_share)} of lithium and ${pct(re.china_refined_share)} of rare earths.`)}
            ${step("rare", "03", "Rare earths", `China mines <span class="accent"><b ${t(re.source)}>${pct(re.top_share)}</b></span> of the world's rare earths`, `They make the magnets in electric motors, wind turbines and missiles.`)}
            ${step("controls", "04", "Controls", `Export restrictions are up <span class="accent"><b ${t(f.fivefold.source)}>fivefold</b></span> since 2009`, `China's tariff codes under control rose from ${CODES[0].tariff_codes} to ${CODES.at(-1).tariff_codes} between 2023 and 2025.`)}
            ${step("prices", "05", "Prices", `Copper is <span class="accent">${(mNow.copper / m0.copper).toFixed(1)} times</span> its 2019 price`, `Antimony more than doubled in 2025 after China restricted exports.`)}
            ${step("waste", "06", "Waste", `Only <span class="accent"><b ${t(f.ewaste.source)}>${f.ewaste.value}%</b></span> of e-waste is properly recycled`, `Just ${f.ree1.value}% of rare earth demand is met from recycling.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="mn-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mineral: "cobalt", sel: "COD" };
    const shareOf = (iso3, mineral) => P.find((r) => r.iso3 === iso3 && r.mineral === mineral);
    const mapEl = main.querySelector("#mn-map");
    const isoToC = Object.fromEntries(countries.map((r) => [r.iso_n3, r]));
    const geoFor = () => ({
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const c = isoToC[ft.properties.iso], r = c ? shareOf(c.iso3, state.mineral) : null;
        return { ...ft, properties: { ...ft.properties, iso3: c?.iso3 ?? "", nm: c?.country ?? ft.properties.name, b: bandOf(r?.share_2025) } };
      }),
    });
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: SEQ.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", "b"], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (iso3, mineral) => { const r = shareOf(iso3, mineral); return r ? (r.share_2025 != null ? `${pct(r.share_2025, 1)} of world ${MBY[mineral].label.toLowerCase()} mining` : "output withheld") : "no recorded production"; };
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
        map.addSource("countries", { type: "geojson", data: geoFor() });
        map.addLayer({ id: "bg", type: "background", paint: { "background-color": c.bg } });
        map.addLayer({ id: "fill", type: "fill", source: "countries", paint: { "fill-color": fillExpr(c) } });
        map.addLayer({ id: "borders", type: "line", source: "countries", paint: { "line-color": c.bg, "line-width": 0.6 } });
        map.addLayer({ id: "sel", type: "line", source: "countries", filter: ["==", ["get", "iso3"], state.sel], paint: { "line-color": c.fg, "line-width": 2 } });
        map.on("mousemove", "fill", (e) => {
          const ft = e.features?.[0];
          if (!ft) return;
          map.getCanvas().style.cursor = BYC[ft.properties.iso3] ? "pointer" : "";
          popup.setLngLat(e.lngLat).setText(`${ft.properties.nm} · ${ft.properties.iso3 ? valueText(ft.properties.iso3, state.mineral) : "no recorded production"}`).addTo(map);
        });
        map.on("mouseleave", "fill", () => { map.getCanvas().style.cursor = ""; popup.remove(); });
        map.on("click", "fill", (e) => { const iso3 = e.features?.[0]?.properties.iso3; if (iso3 && BYC[iso3]) select(iso3); });
        fit(false);
        res();
      })
    );
    new ResizeObserver(() => { map.resize(); if (map.getProjection?.()?.type !== "globe") fit(false); }).observe(mapEl);
    async function repaint() {
      await ready;
      const c = colors();
      map.getSource("countries").setData(geoFor());
      map.setPaintProperty("bg", "background-color", c.bg);
      map.setPaintProperty("borders", "line-color", c.bg);
      map.setPaintProperty("sel", "line-color", c.fg);
      map.setPaintProperty("fill", "fill-color", fillExpr(c));
      map.setFilter("sel", ["==", ["get", "iso3"], state.sel]);
    }
    const scaleEl = main.querySelector("#mn-scale");
    const drawScale = () => {
      scaleEl.innerHTML = `<span>Share of world mine production, 2025:</span>` + BANDS.map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}None recorded</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#mn-detail");
    function drawDetail() {
      const c = BYC[state.sel], m = MBY[state.mineral], r = shareOf(state.sel, state.mineral);
      const mine = P.filter((x) => x.iso3 === state.sel && x.share_2025 != null).sort((a, b) => b.share_2025 - a.share_2025);
      const opts = [...countries].sort((a, b) => a.country.localeCompare(b.country));
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="mn-pick"><span class="em-eyebrow">Choose</span><select id="mn-select">${opts.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(c.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(m.label)} · share of world mining, 2025</p>
        <p class="em-d-value" ${r?.share_2025 != null ? t(r.source) : ""}>${r ? (r.share_2025 != null ? pct(r.share_2025, 1) : "Withheld") : "None"}</p>
        <p class="em-d-usd">${esc(m.used_for)}. World leader: ${esc(short(m.top_country))}, <span ${t(m.source)}>${pct(m.top_share)}</span></p>
        <dl class="em-d-list" style="margin-top:12px">
          ${mine.map((x) => `<dt>${esc(x.mineral_label)}</dt><dd><span ${t(x.source)}>${pct(x.share_2025, 1)}${x.reserves_share != null ? ` · reserves ${pct(x.reserves_share)}` : ""}</span></dd>`).join("")}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#mn-select").addEventListener("change", (e) => select(e.target.value, true));
      src.footnotes(detail);
    }
    async function select(iso3, fly = false) {
      state.sel = iso3;
      drawDetail();
      await ready;
      map.setFilter("sel", ["==", ["get", "iso3"], iso3]);
      if (!fly) return;
      const ft = world.features.find((x) => isoToC[x.properties.iso]?.iso3 === iso3);
      if (!ft) return;
      const pts = (ft.geometry.type === "Polygon" ? [ft.geometry.coordinates] : ft.geometry.coordinates).flat(2);
      const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      if (map.getProjection?.()?.type === "globe") map.easeTo({ center: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2], duration: 800 });
      else map.fitBounds([[Math.min(...xs) - 4, Math.min(...ys) - 4], [Math.max(...xs) + 4, Math.max(...ys) + 4]], { padding: 24, maxZoom: 4 });
    }
    main.querySelector("#mn-which").addEventListener("change", (e) => {
      state.mineral = e.target.value;
      const m = MBY[state.mineral];
      if (!shareOf(state.sel, state.mineral)) state.sel = m.top_iso3;
      drawDetail();
      repaint();
    });
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: [20, 10], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- Charts ----------
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240 }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: narrow ? 104 : 140, b: 22, l: 40 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="mn-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="mn-ref"/>` : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.w ?? 2}" stroke-linejoin="round"/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${esc(narrow ? e.short : e.name)} ${esc(fmtY(Math.round(e.last[1])))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const METALS = [["copper", "Copper", "Copper", "--mn-cu", 2.6], ["tin", "Tin", "Tin", "--mn-sn", 1.8], ["aluminium", "Aluminium", "Alum.", "--mn-al", 1.8], ["nickel", "Nickel", "Nickel", "--mn-ni", 1.8]];
    const drawMetals = (el, h) => lineChart(el, {
      series: METALS.map(([k, name, s, v, w]) => ({ name, short: s, v, w, pts: MT.filter((r) => r[k] != null).map((r) => [xOf(r.month), (100 * r[k]) / m0[k]]) })),
      yMax: 300, yMin: 50, yStep: 50, ref: { v: 100 }, xTicks: [2020, 2021, 2022, 2023, 2024, 2025, 2026], xEnd: monthName(mNow.month), h,
      aria: `Metal prices against January 2019: copper ${Math.round((100 * mNow.copper) / m0.copper)}, tin ${Math.round((100 * mNow.tin) / m0.tin)}, aluminium ${Math.round((100 * mNow.aluminium) / m0.aluminium)}, nickel ${Math.round((100 * mNow.nickel) / m0.nickel)} in ${monthName(mNow.month)}`,
    });
    function pairs(el, list) {
      const bar = (v, c, label) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${v}%;background:var(${c})"></b></div><span class="v">${pct(v)}</span></div>`;
      el.innerHTML = list.map((m) => `<div><div class="lb">${esc(m.label)}</div>
        <span class="who" ${t(m.source)}>Mined: ${esc(short(m.top_country))}</span>${bar(m.top_share, "--mn-b2", `${m.label}: ${m.top_country} mines ${pct(m.top_share)}`)}
        <span class="who" ${t(m.refining_source)}>Refined: ${esc(short(m.top_refiner))}</span>${bar(m.top_refiner_share, "--em-accent", `${m.label}: ${m.top_refiner} refines ${pct(m.top_refiner_share)}`)}</div>`).join("");
    }
    function divBars(el, list) {
      const max = Math.max(...list.map((p) => Math.abs(p.change_2024_2025)));
      el.innerHTML = `<div class="mn-div">${list.map((p) => { const v = p.change_2024_2025, w = (50 * Math.abs(v)) / max;
        return `<span>${esc(p.label.replace(" (NdPr oxide)", ""))}</span><span class="tr" role="img" aria-label="${esc(`${p.label}: ${signed(v)}`)}"><b style="${v >= 0 ? `left:50%;width:${w}%` : `right:50%;width:${w}%`};background:var(${v >= 0 ? "--mn-up" : "--mn-down"})"></b></span><span class="v" ${t(p.source)}>${signed(v)}</span>`; }).join("")}</div>`;
    }
    const tl = (el, items) => { el.innerHTML = items.map((c) => `<li><time datetime="${c.date}">${dayName(c.date)}</time><div><b ${t(c.source)}>${esc(c.country)} · ${esc(c.mineral)}</b>${esc(c.measure)}<span class="st">${esc(c.status)}</span></div></li>`).join(""); };
    const top20Bars = (el) => bars(el, T20.slice(0, 12).map((r, i) => ({ label: r.mineral, value: r.share, muted: i > 0, src: r.source })), (v) => pct(v), 100, t);
    const drawAll = () => drawMetals(main.querySelector("#mn-metals"), 260);
    drawAll();
    pairs(main.querySelector("#mn-pairs"), withRef);
    top20Bars(main.querySelector("#mn-top20"));
    divBars(main.querySelector("#mn-pchg"), PR);
    tl(main.querySelector("#mn-tl"), CTL);
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#mn-vis");
    function miniMap(el, mineral) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", `World map of shares of ${MBY[mineral].label.toLowerCase()} mine production`);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const c = isoToC[ft.properties.iso], i = c ? bandOf(shareOf(c.iso3, mineral)?.share_2025) : -1; return i < 0 ? "var(--em-land)" : `var(${SEQ[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const c = isoToC[ft.properties.iso]; return c ? `${c.country}: ${valueText(c.iso3, mineral)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = () => `<div class="mn-scale">${BANDS.map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "cobalt" || id === "rare") {
        const m = id === "cobalt" ? "cobalt" : "rare-earths";
        vis.innerHTML = `<p class="vt">Share of world ${MBY[m].label.toLowerCase()} mining, 2025</p><div class="m"></div>${legend()}`;
        miniMap(vis.querySelector(".m"), m);
      } else if (id === "refining") {
        vis.innerHTML = `<p class="vt">Top mining and refining country, 2025</p><div class="mn-pairs" id="mn-vpairs"></div>`;
        pairs(vis.querySelector("#mn-vpairs"), withRef.filter((m) => ["cobalt", "graphite", "lithium"].includes(m.mineral)));
      } else if (id === "controls") {
        vis.innerHTML = `<p class="vt">Export restrictions on critical raw materials</p><div class="vbig">5×</div><p class="vsub">as many in 2024 as in 2009, according to the OECD.</p>`;
      } else if (id === "prices") {
        vis.innerHTML = `<p class="vt">Metal prices, January 2019 = 100</p><div class="m"></div>`;
        drawMetals(vis.querySelector(".m"), 240);
      } else if (id === "waste") {
        vis.innerHTML = `<p class="vt">Out of every 100 kg of e-waste, 2022</p><div class="em-waffle">${Array.from({ length: 100 }, (_, i) => `<i class="${i < 22 ? "on" : ""}"></i>`).join("")}</div><p class="vsub">About <b>22</b> kg were documented as properly collected and recycled.</p>`;
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
