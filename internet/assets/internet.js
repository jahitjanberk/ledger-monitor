var Ma = Object.defineProperty;
var Ta = (s, n, t) =>
  n in s
    ? Ma(s, n, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (s[n] = t);
var E = (s, n, t) => Ta(s, typeof n != "symbol" ? n + "" : n, t);
import {
  d as ke,
  w as ra,
  s as Ia,
  S as va,
  p as _,
  e as u,
  c as fe,
  b as U,
} from "../../assets/charts.js";
import { s as La } from "../../assets/story-Cpe0Yf6I.js";
import { b as Ua, a as Xe, m as Fa } from "../../assets/d3-CYFjbSD-.js";
import "../../assets/maplibre-ChAaPfnC.js";
import { DATA as IN_DATA, SOURCES as IN_SOURCES } from "./data.js";
function k(s, n) {
  const t = document.createElement("span");
  (t.style.color = `var(${n})`), (t.style.display = "none"), s.append(t);
  const o = getComputedStyle(t).color;
  return t.remove(), o || "#888";
}
class ea {
  constructor(n, t = {}) {
    E(this, "map");
    E(this, "ready");
    E(this, "specs", new Map());
    E(this, "highlight", []);
    E(
      this,
      "popup",
      new ke.Popup({
        closeButton: !1,
        closeOnClick: !1,
        offset: 10,
        className: "em-popup",
      }),
    );
    E(this, "choro", null);
    var g, p;
    (this.el = n), (this.opts = t);
    const o = t.interactive ?? !0;
    (this.map = new ke.Map({
      container: n,
      style: { version: 8, sources: {}, layers: [] },
      center: ((g = t.view) == null ? void 0 : g.center) ?? [10, 25],
      zoom: ((p = t.view) == null ? void 0 : p.zoom) ?? 0.8,
      minZoom: -2,
      maxZoom: 7,
      renderWorldCopies: !1,
      attributionControl: {
        compact: !0,
        customAttribution: "Boundaries: Natural Earth",
      },
      dragRotate: !1,
      pitchWithRotate: !1,
      interactive: o,
      cooperativeGestures: o,
    })),
      o &&
        this.map.addControl(
          new ke.NavigationControl({ showCompass: !1 }),
          "top-right",
        ),
      (this.ready = new Promise((S) =>
        this.map.on("load", () => {
          this.base(), S();
        }),
      )),
      new ResizeObserver(() => this.map.resize()).observe(n);
  }
  whenReady() {
    return this.ready;
  }
  base() {
    this.map.addSource("countries", { type: "geojson", data: ra }),
      this.map.addLayer({
        id: "bg",
        type: "background",
        paint: { "background-color": k(this.el, "--em-panel") },
      }),
      this.map.addLayer({
        id: "land",
        type: "fill",
        source: "countries",
        paint: { "fill-color": k(this.el, "--em-land") },
      }),
      this.map.addLayer({
        id: "borders",
        type: "line",
        source: "countries",
        paint: { "line-color": k(this.el, "--em-panel"), "line-width": 0.6 },
      });
  }
  pointColor(n) {
    if (typeof n.color == "string") return k(this.el, n.color);
    const t = Object.entries(n.color.map).flatMap(([o, g]) => [
      o,
      k(this.el, g),
    ]);
    return ["match", ["get", n.color.prop], ...t, k(this.el, "--em-accent")];
  }
  async addLines(n, t, o) {
    await this.ready,
      this.specs.set(n, { kind: "line", spec: o }),
      this.map.addSource(n, { type: "geojson", data: t }),
      this.map.addLayer({
        id: n,
        type: "line",
        source: n,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": k(this.el, o.color),
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            (o.width ?? 1) * 0.7,
            6,
            (o.width ?? 1) * 2.2,
          ],
          "line-opacity": o.opacity ?? 0.7,
        },
      }),
      this.hover(n, o.hover),
      o.onClick &&
        this.map.on("click", n, (g) => {
          var S;
          const p = (S = g.features) == null ? void 0 : S[0];
          p && o.onClick(p.properties);
        });
  }
  async addPoints(n, t, o) {
    await this.ready, this.specs.set(n, { kind: "point", spec: o });
    const g = {
      type: "FeatureCollection",
      features: t.map((S) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [S.lon, S.lat] },
        properties: { ...S },
      })),
    };
    this.map.addSource(n, { type: "geojson", data: g });
    const p = o.radius ?? 4;
    this.map.addLayer({
      id: n,
      type: "circle",
      source: n,
      paint: {
        "circle-color": this.pointColor(o),
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, p, 6, p * 2],
        "circle-stroke-color": k(this.el, "--em-panel"),
        "circle-stroke-width": 1,
        "circle-opacity": 0.9,
      },
    }),
      this.hover(n, o.hover),
      o.onClick &&
        this.map.on("click", n, (S) => {
          var F;
          const T = (F = S.features) == null ? void 0 : F[0];
          T && o.onClick(T.properties);
        });
  }
  hover(n, t) {
    !t ||
      this.opts.interactive === !1 ||
      (this.map.on("mousemove", n, (o) => {
        var p;
        const g = (p = o.features) == null ? void 0 : p[0];
        g &&
          ((this.map.getCanvas().style.cursor = "pointer"),
          this.popup
            .setLngLat(o.lngLat)
            .setText(t(g.properties))
            .addTo(this.map));
      }),
      this.map.on("mouseleave", n, () => {
        (this.map.getCanvas().style.cursor = ""), this.popup.remove();
      }));
  }
  async setFilter(n, t) {
    await this.ready, this.map.getLayer(n) && this.map.setFilter(n, t);
  }
  async setChoropleth(n, t = []) {
    await this.ready,
      (this.choro = n ? { bands: n, palette: t } : null),
      this.paintLand();
  }
  onLandClick(n) {
    this.ready.then(() => {
      this.map.on("click", "land", (t) => {
        var p;
        if (
          this.map
            .queryRenderedFeatures(t.point)
            .filter(
              (S) =>
                S.layer.id !== "land" &&
                S.layer.id !== "borders" &&
                S.layer.id !== "bg",
            ).length
        )
          return;
        const g = (p = t.features) == null ? void 0 : p[0];
        g && n(String(g.properties.iso), String(g.properties.name));
      });
    });
  }
  paintLand() {
    const n = k(this.el, "--em-land");
    if (this.choro) {
      const t = this.choro.palette.map((g) => k(this.el, g)),
        o = Object.entries(this.choro.bands).flatMap(([g, p]) => [
          g,
          t[p] ?? n,
        ]);
      this.map.setPaintProperty(
        "land",
        "fill-color",
        o.length ? ["match", ["get", "iso"], ...o, n] : n,
      );
    } else
      this.map.setPaintProperty("land", "fill-color", [
        "case",
        ["in", ["get", "iso"], ["literal", this.highlight]],
        k(this.el, "--em-soft"),
        n,
      ]);
  }
  async setVisible(n, t) {
    await this.ready,
      this.map.getLayer(n) &&
        this.map.setLayoutProperty(n, "visibility", t ? "visible" : "none");
  }
  async setHighlight(n) {
    await this.ready, (this.highlight = n), this.paintLand();
  }
  async go(n, t = !0) {
    await this.ready;
    const o = matchMedia("(prefers-reduced-motion: reduce)").matches;
    t && !o
      ? this.map.flyTo({
          center: n.center,
          zoom: n.zoom,
          duration: 1600,
          essential: !1,
        })
      : this.map.jumpTo({ center: n.center, zoom: n.zoom });
  }
  async setProjection(n) {
    await this.ready, this.map.setProjection({ type: n });
  }
  async retheme() {
    await this.ready,
      this.map.setPaintProperty(
        "bg",
        "background-color",
        k(this.el, "--em-panel"),
      ),
      this.map.setPaintProperty(
        "borders",
        "line-color",
        k(this.el, "--em-panel"),
      ),
      await this.setHighlight(this.highlight);
    for (const [n, t] of this.specs)
      t.kind === "line"
        ? this.map.setPaintProperty(n, "line-color", k(this.el, t.spec.color))
        : (this.map.setPaintProperty(
            n,
            "circle-color",
            this.pointColor(t.spec),
          ),
          this.map.setPaintProperty(
            n,
            "circle-stroke-color",
            k(this.el, "--em-panel"),
          ));
  }
}
function Z(s, n) {
  const t = new Map();
  return (
    s.forEach((o) => t.set(n(o), (t.get(n(o)) ?? 0) + 1)),
    [...t.entries()]
      .map(([o, g]) => ({ key: o, n: g }))
      .sort((o, g) => g.n - o.n || o.key.localeCompare(g.key))
  );
}
function Pa(s) {
  return Z(s, (n) => n.country).map(({ key: n, n: t }) => ({
    country: n,
    n: t,
    byProvider: Z(
      s.filter((o) => o.country === n),
      (o) => o.provider,
    ),
  }));
}
function Na(s) {
  const n = s.filter((t) => t.length_km != null);
  return {
    km: n.reduce((t, o) => t + o.length_km, 0),
    missing: s.length - n.length,
  };
}
const Ga = 25e5,
  aa = (s) => s / Ga,
  na = (s, n) => s * n;
function Ae(s, n) {
  const t = s.find((o) => o.metric === n);
  if (!t) throw new Error(`Missing metric ${n}`);
  return t;
}
const ce = { "Hong Kong": "China" },
  ia = (s) => (s.countries ? s.countries.split("|") : []);
function Ea(s, n) {
  const t = ce[n] ?? n;
  return s
    .filter((o) => ia(o).includes(t))
    .sort((o, g) => (g.length_km ?? 0) - (o.length_km ?? 0));
}
function Ba(s) {
  const n = new Map();
  return (
    s.forEach((t) => ia(t).forEach((o) => n.set(o, (n.get(o) ?? 0) + 1))), n
  );
}
const Me = [
  { min: 1, max: 1, label: "Single cable" },
  { min: 2, max: 3, label: "Limited" },
  { min: 4, max: 9, label: "Moderate" },
  { min: 10, max: 1 / 0, label: "Well connected" },
];
function ta(s) {
  if (s <= 0) return { band: -1, label: "No cable in the data" };
  const n = Me.findIndex((t) => s >= t.min && s <= t.max);
  return { band: n, label: Me[n].label };
}
const ge = ["Google", "Meta", "Microsoft", "Amazon"];
function B(s) {
  if (!s) return [];
  const n = s.toLowerCase();
  return ge.filter((t) =>
    t === "Meta"
      ? n.includes("facebook") || /\bmeta\b/.test(n)
      : n.includes(t.toLowerCase()),
  );
}
const Ka = 6371.0088;
function za(s, n) {
  const t = Math.PI / 180,
    o = (n.lat - s.lat) * t,
    g = (n.lon - s.lon) * t,
    p =
      Math.sin(o / 2) ** 2 +
      Math.cos(s.lat * t) * Math.cos(n.lat * t) * Math.sin(g / 2) ** 2;
  return 2 * Ka * Math.asin(Math.min(1, Math.sqrt(p)));
}
const Da = 299792.458 / 1.468,
  Oa = (s) => ((2 * s) / Da) * 1e3,
  Ra = { sources: IN_SOURCES },
  Va = { records: IN_DATA.cloud_regions },
  oa = { records: IN_DATA.cables },
  Ha = { records: IN_DATA.landings },
  qa = { records: IN_DATA.energy },
  Za = { records: IN_DATA.water },
  Xa = { records: IN_DATA.cables_now },
  an = { records: IN_DATA.ai_compute },
  tn = { records: IN_DATA.ai_clusters },
  rn = { records: IN_DATA.top500_countries },
  ln = { records: IN_DATA.supercomputers },
  cn = { features: IN_DATA.routes },
  mn = { records: IN_DATA.countries },
  yn = { records: IN_DATA.azure_latency },
  f = (s) => s.records,
  y = (s, n = 0) => s.toLocaleString("en-GB", { maximumFractionDigits: n }),
  K = (s) => `${y(s / 1e9, 1).replace(/\.0$/, "")}bn litres`,
  ue = { AWS: "--in-aws", Azure: "--in-azure", "Google Cloud": "--in-gcp" },
  z = {
    "United States": "840",
    China: "156",
    Ireland: "372",
    "United Kingdom": "826",
    Indonesia: "360",
  },
  _n = {
    id: "internet",
    title: "Where the Internet Lives",
    description:
      "The submarine cables, cloud regions and AI supercomputers behind the internet, and the electricity and water they use, with every number linked to its source.",
    mount(s) {
      var Ze;
      const n = f(Va),
        t = f(oa),
        o = f(Ha),
        g = f(qa),
        p = f(Za),
        S = f(Xa),
        T = f(an),
        F = f(tn),
        Te = f(rn),
        j = f(ln),
        c = (e) => Ae(g, e),
        D = (e) => Ae(p, e),
        Ie = (e) => Ae(S, e),
        ve = Pa(n),
        Y = Z(n, (e) => e.provider),
        Le = Z(o, (e) => e.country),
        me = (e) => Le.find((a) => a.key === e),
        { km: sa } = Na(t),
        la = ve.find((e) => e.country === "United States"),
        X = T.find((e) => e.country === "United States"),
        C = t[0].source,
        O = f(oa),
        de = f(mn),
        J = f(yn),
        Ue = Ba(O),
        ye = (e) => Ue.get(ce[e] ?? e) ?? 0,
        ee = [
          ...new Set([...de.map((e) => e.country), ...n.map((e) => e.country)]),
        ].sort((e, a) => e.localeCompare(a)),
        ae = ge.map((e) => ({
          b: e,
          cables: O.filter((a) => B(a.owners).includes(e)),
        })),
        pe = O.filter((e) => B(e.owners).length),
        Fe = ee.filter((e) => ye(e) === 1),
        Pe = ee.filter((e) => {
          const a = ye(e);
          return a >= 2 && a <= 3;
        }),
        ua = J[0].source,
        { main: l, initialView: he } = Ia(s, {
          variantId: "internet",
          name: "Internet",
          views: [
            { id: "dashboard", label: "Dashboard" },
            { id: "story", label: "Story" },
          ],
          onView: (e) => _a(e),
          onTheme: () => {
            b.retheme(), A.retheme();
          },
        }),
        ne = new va(Ra.sources, s),
        i = (...e) => ne.attr(...e),
        w = (e, a = !1) =>
          `<i class="${a ? "line" : ""}" style="background:var(${e})"></i>`,
        I = c("global_2024_twh"),
        Ne = c("global_2030_twh"),
        Ge = c("global_2024_share"),
        R = c("ie_2025_share"),
        W = c("ie_2015_share"),
        H = Ie("km_in_service"),
        x = Ie("cables_tracked"),
        $ = D("us_direct_2023_l"),
        q = D("us_indirect_2023_l");
      l.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Where the internet lives · cables, cloud, compute, power</p>
        <h1>The internet runs on <span class="accent"><b ${i(H.source)}>${y(H.value / 1e6, 1)} million km</b> of cable</span>, and the data centres it connects</h1>
        <p class="em-lede">Data centres used <b ${i(I.source)}>${y(I.value)} TWh</b> of electricity in 2024, about <b ${i(Ge.source)}>${(Ge.value * 100).toFixed(1)}%</b> of the world's total. The IEA expects that to more than double, to around <b ${i(Ne.source)}>${y(Ne.value)} TWh</b> by 2030.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>The physical internet, <span class="accent">by the numbers</span></h2></div></div>
        <div class="em-kpis">
          ${se("Submarine cables", `${y(x.value)}+`, "Active and planned, tracked by TeleGeography in 2026", x.source, !0)}
          ${se("Cloud regions", String(n.length), `AWS ${Y.find((e) => e.key === "AWS").n}, Azure ${Y.find((e) => e.key === "Azure").n}, Google Cloud ${Y.find((e) => e.key === "Google Cloud").n}`, n[0].source)}
          ${se("AI compute in the US", _(X.share), "Share of AI chips (H100-equivalents) acquired since 2022", X.source)}
          ${se("Ireland's electricity", _(R.value), "Used by data centres in 2025, up from " + _(W.value) + " in 2015", R.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h">
          <div><p class="em-eyebrow"><span class="num">02</span>The map</p><h2>Cables, clouds and <span class="accent">supercomputers</span></h2></div>
          <div class="em-toggle" role="group" aria-label="Projection">
            <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
            <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
          </div>
        </div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="in-layers" role="group" aria-label="Map layers">
              <button type="button" class="in-layer" data-layer="cables" aria-pressed="true">${w("--in-cable", !0)}Cables</button>
              <button type="button" class="in-layer" data-layer="landings" aria-pressed="false">${w("--in-landing")}Landing points</button>
              <button type="button" class="in-layer" data-layer="regions" aria-pressed="true">${w("--in-azure")}Cloud regions</button>
              <button type="button" class="in-layer" data-layer="hpc" aria-pressed="true">${w("--in-hpc")}Top supercomputers</button>
              <button type="button" class="in-layer" data-layer="connectivity" aria-pressed="false"><i style="background:var(--in-c3)"></i>Cables per country</button>
              <label class="in-owner" for="in-owner"><span class="em-eyebrow">Cable owner</span>
                <select id="in-owner"><option value="">All cables</option><option value="any">Any big tech</option>${ge.map((e) => `<option value="${e}">${e}</option>`).join("")}</select>
              </label>
            </div>
            <div class="em-map in-map" id="in-map" role="region" aria-label="World map of submarine cables, cloud regions and supercomputers"></div>
            <div class="in-scale" id="in-scale" hidden>${Me.map((e, a) => `<span><i style="background:var(--in-c${a})"></i>${u(e.label)} (${e.max === 1 / 0 ? e.min + "+" : e.min === e.max ? e.min : e.min + "–" + e.max})</span>`).join("")}</div>
            <p class="note" style="margin:10px 0 0">Select a country for its profile. Cable routes are TeleGeography's January 2021 open-data snapshot, so cables built since then are missing. Cloud regions are plotted at a representative city in the area each provider names. Select a cable, region or supercomputer for details.</p>
          </div>
          <div class="em-card em-detail">
            <p class="em-eyebrow">On the map</p>
            <dl class="in-legend">
              <div><dt>${w("--in-cable", !0)}Cable systems (2021)</dt><dd ${i(C)}>${fe(t.length)}</dd></div>
              <div><dt>${w("--in-landing")}Landing points (2021)</dt><dd ${i(C)}>${fe(o.length)}</dd></div>
              ${Y.map((e) => `<div><dt>${w(ue[e.key])}${u(e.key)} regions</dt><dd ${i(n.find((a) => a.provider === e.key).source)}>${e.n}</dd></div>`).join("")}
              <div><dt>${w("--in-hpc")}TOP500 top-ten sites</dt><dd ${i(j[0].source)}>${j.length}</dd></div>
            </dl>
            <div class="in-pick" id="in-pick" aria-live="polite"><p class="em-eyebrow">Selected</p><p class="s">Select a cable, cloud region or supercomputer on the map.</p></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>


      <section class="em-sec" id="profile">
        <div class="em-sec-h">
          <div><p class="em-eyebrow"><span class="num">03</span>Country profile</p><h2>How connected is <span class="accent" id="in-pc-title">a country</span>?</h2></div>
          <label class="in-owner" for="in-country"><span class="em-eyebrow">Country</span><select id="in-country">${ee.map((e) => `<option value="${u(e)}">${u(e)}</option>`).join("")}</select></label>
        </div>
        <div class="em-grid in-profile">
          <div class="em-card" id="in-pc" aria-live="polite"></div>
          <div class="em-card">
            <p class="em-eyebrow">Connectivity bands · 2021 snapshot</p>
            <h3>Countries that rely on very few cables</h3>
            <p class="note">Our own bands, based on how many cable systems land in each country. With fewer cables, one cut or repair delay matters more. Select a country to open its profile.</p>
            <p class="em-eyebrow" style="margin-top:4px"><i class="in-dot" style="background:var(--in-c0)"></i> Single cable · ${Fe.length} countries and territories</p>
            <div class="in-chips" id="in-fragile"></div>
            <p class="em-eyebrow" style="margin-top:14px"><i class="in-dot" style="background:var(--in-c1)"></i> Limited (2–3 cables) · ${Pe.length}</p>
            <div class="in-chips" id="in-limited"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="latency">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Latency</p><h2>How fast can data cross <span class="accent">between two regions</span>?</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Region to region</p>
            <h3>Pick two cloud regions</h3>
            <p class="note">The floor is the round trip for light over a straight fibre path between the two plotted cities, at about 204,000 km/s. Real routes are longer and pass through routers, so measured times are higher. Where both regions are in Azure's published table, its measured median is shown too.</p>
            <div class="in-latpick">
              <label for="in-lat-a"><span class="em-eyebrow">From</span><select id="in-lat-a"></select></label>
              <button type="button" class="em-iconbtn" id="in-lat-swap" aria-label="Swap regions">⇄</button>
              <label for="in-lat-b"><span class="em-eyebrow">To</span><select id="in-lat-b"></select></label>
            </div>
            <div class="in-bigpair in-lat" id="in-lat-out" style="margin-top:14px"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Azure backbone · median round trip, ms · 30 days to 30 July 2026</p>
            <h3>Measured latency between 11 Azure regions</h3>
            <p class="note">Rows are where traffic starts. Select a cell to load that pair into the calculator.</p>
            <div class="em-tablewrap"><table class="in-matrix" id="in-matrix"></table></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="owners">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Ownership</p><h2>Big tech has moved <span class="accent">onto the seabed</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Cables part-owned by big tech · 2021 snapshot</p>
            <h3>${pe.length} of ${t.length} cables name Google, Meta, Microsoft or Amazon as an owner</h3>
            <p class="note">Most are shared with telecoms carriers in a consortium. Meta appears under its former name, Facebook, in the data. Choose a company to show its cables on the map.</p>
            <div class="em-bars" id="in-bt"></div>
            <div class="in-chips" style="margin-top:14px" id="in-bt-pick">${["", ...ge].map((e) => `<button type="button" class="hs-chip in-btchip" data-owner="${e || "any"}" aria-pressed="false">${e || "Any big tech"}</button>`).join("")}</div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">The cables</p>
            <h3 id="in-bt-title">Every big tech cable, longest first</h3>
            <div class="em-tablewrap" style="max-height:420px;overflow:auto"><table class="em-table"><thead><tr><th>Cable</th><th>Big tech owners</th><th class="r">Length</th><th class="r hide-n">Ready</th></tr></thead><tbody id="in-bt-list"></tbody></table></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="cloud">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Cloud</p><h2>The cloud is <span class="accent">concentrated</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Cloud regions by country · AWS, Azure, Google Cloud</p>
            <h3>Where the three largest public clouds put their regions</h3>
            <p class="note">Each provider's published region list. Azure includes restricted and preview regions.</p>
            <div class="em-bars" id="in-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Landing points by country · 2021 snapshot</p>
            <h3>Where cables come ashore</h3>
            <p class="note">Indonesia, an archipelago, had more landing points than the United States.</p>
            <div class="em-bars" id="in-landings"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="compute">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>AI compute</p><h2>Most AI compute sits <span class="accent">in one country</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">AI chips acquired since 2022 · as of Q2 2026</p>
            <h3>Share of AI compute by country</h3>
            <p class="note">Epoch AI estimates the compute each country has added, in H100-equivalents, from chip import records. Epoch put the US share of GPU cluster performance at about <b ${i(F[0].source)}>${_(F[0].share)}</b> in May 2025, with China at <b ${i(F[1].source)}>${_(F[1].share)}</b>.</p>
            <div class="em-bars" id="in-compute"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">TOP500 · June 2026</p>
            <h3>Supercomputers on the list, by country</h3>
            <p class="note">The TOP500 ranks systems by a traditional scientific benchmark, so it leaves out clusters whose owners don't submit them.</p>
            <div class="em-bars" id="in-top500"></div>
            <ul class="in-top" id="in-supers" style="margin-top:16px"></ul>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="power">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Power</p><h2>Data centres' electricity use is <span class="accent">set to more than double by 2030</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">World · IEA · 2024</p>
            <h3>Who uses the ${y(I.value)} TWh</h3>
            <p class="note">Shares of global data centre electricity use in 2024, with the TWh they imply.</p>
            <div class="em-bars" id="in-world"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">United States · LBNL</p>
            <h3>US data centres, 2018 to 2028</h3>
            <p class="note">Lawrence Berkeley National Laboratory's estimate for 2018 and 2023, and its range for 2028. Shares are of all US electricity use.</p>
            <div class="em-bars" id="in-us"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card hl">
            <p class="em-eyebrow">Ireland · CSO</p>
            <h3>Data centres' share of Ireland's metered electricity</h3>
            <div class="em-bars" id="in-ie" style="margin-top:12px"></div>
            <p class="note" style="margin-top:14px">Ireland's data centres used <b ${i(c("ie_2025_gwh").source)}>${y(c("ie_2025_gwh").value)} GWh</b> in 2025, up from <b ${i(c("ie_2024_gwh").source)}>${y(c("ie_2024_gwh").value)} GWh</b> in 2024.</p>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="water">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">09</span>Water</p><h2>Cooling US data centres took <span class="accent">${K($.value)}</span> in 2023</h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">United States · 2023</p>
          <p class="note">Direct use is water used on site to cool data centres. Indirect use is water consumed by the power stations that supply them, which is far larger. An Olympic pool holds 2.5 million litres.</p>
          <div class="in-bigpair">
            <div><p class="em-eyebrow">Direct (cooling)</p><div class="em-big accent" ${i($.source)}>${K($.value)}</div><p class="note">≈ ${y(aa($.value))} Olympic pools</p></div>
            <div><p class="em-eyebrow">Indirect (power stations)</p><div class="em-big" ${i(q.source)}>${K(q.value)}</div><p class="note">≈ ${y(aa(q.value))} Olympic pools</p></div>
            <div><p class="em-eyebrow">Google data centres</p><div class="em-big" ${i(D("google_dc_2023_l").source)}>${K(D("google_dc_2023_l").value)}</div><p class="note">Worldwide, 2023</p></div>
            <div><p class="em-eyebrow">Meta data centres</p><div class="em-big" ${i(D("meta_dc_2023_l").source)}>${K(D("meta_dc_2023_l").value)}</div><p class="note">Worldwide, 2023</p></div>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="cables">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">10</span>Cables</p><h2>The longest cables <span class="accent">in the snapshot</span></h2></div></div>
        <div class="em-card">
          <p class="note">From the 2021 snapshot, which lists ${fe(t.length)} systems with ${y(sa / 1e6, 2)} million km of published length. TeleGeography now counts over ${y(H.value / 1e6, 1)} million km in service.</p>
          <div class="em-tablewrap"><table class="em-table"><thead><tr><th>Cable</th><th class="r">Length</th><th class="r">Ready for service</th><th class="r hide-n">Landings</th></tr></thead><tbody id="in-longest"></tbody></table></div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">11</span>Method</p>
        <p>Cable routes and landing points come from TeleGeography's Submarine Cable Map open data, in a public mirror whose last update was January 2021. TeleGeography publishes that data under CC BY-NC-SA 3.0, which allows reuse with credit, for non-commercial purposes, under the same licence. The headline figures for 2026 come from TeleGeography's own FAQ. Routes are stylised and don't show exact seabed paths.</p>
        <p>Cloud regions are each provider's published list: AWS's regions page, Microsoft's list of Azure regions and Google's Cloud Run locations. Providers name an area, not a building, so each region is plotted at a representative city using GeoNames coordinates, and regions in the same city are nudged apart. Regional electricity figures for the US, China and Europe are the IEA's percentage shares of the global total, converted to TWh here.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${ne.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${M("cables", "The network", `<span class="accent">${y(x.value)}+ cables</span> carry the internet under the sea.`, `TeleGeography tracks more than <b ${i(x.source)}>${y(x.value)}</b> active and planned submarine cables, with over <b ${i(H.source)}>${y(H.value / 1e6, 1)} million km</b> in service. The map shows its 2021 open snapshot.`)}
            ${M("owners", "New owners", `<span class="accent"><b ${i(C)}>${pe.length}</b> cables</span> are part-owned by big tech.`, `Google is named on <b ${i(C)}>${ae[0].cables.length}</b> of them and Meta, as Facebook, on <b ${i(C)}>${ae[1].cables.length}</b>. Most are shared with telecoms carriers in a consortium.`)}
            ${M("uk", "Coming ashore", `Britain had <span class="accent"><b ${i(C)}>${me("United Kingdom").n}</b> cable landing points</span>.`, `Cables come ashore at landing stations, then run inland to the networks and data centres they serve. The United States had <b ${i(C)}>${me("United States").n}</b>.`)}
            ${M("indonesia", "Islands", `Indonesia had the most: <span class="accent"><b ${i(C)}>${me("Indonesia").n}</b> landings</span>.`, "Connecting an archipelago takes many short cables between islands, so landing points pile up.")}
            ${M("cloud", "The cloud", `AWS, Azure and Google Cloud list <span class="accent"><b ${i(n[0].source)}>${n.length}</b> regions</span>.`, `<b ${i(n[0].source)}>${la.n}</b> of them are in the United States. Each region is a group of data centres in one area.`)}
            ${M("ai", "AI compute", `<span class="accent"><b ${i(X.source)}>${_(X.share)}</b> of AI compute</span> added since 2022 is in the US.`, `China follows with <b ${i(T[1].source)}>${_(T[1].share)}</b>, then the EU with <b ${i(T[2].source)}>${_(T[2].share)}</b>, according to Epoch AI's estimate from chip imports.`)}
            ${M("power", "Power", `Data centres used <span class="accent"><b ${i(I.source)}>${y(I.value)} TWh</b></span> in 2024.`, `The US accounted for <b ${i(c("share_us").source)}>${_(c("share_us").value)}</b>, China <b ${i(c("share_china").source)}>${_(c("share_china").value)}</b> and Europe <b ${i(c("share_europe").source)}>${_(c("share_europe").value)}</b>, according to the IEA.`)}
            ${M("ireland", "One country", `In Ireland, data centres use <span class="accent"><b ${i(R.source)}>${_(R.value)}</b> of the electricity</span>.`, `That was in 2025, up from <b ${i(W.source)}>${_(W.value)}</b> in 2015, according to the CSO. AWS and Azure both run cloud regions there.`)}
            ${M("water", "Water", `US data centres used <span class="accent"><b ${i($.source)}>${K($.value)}</b> of water</span> for cooling in 2023.`, `The power stations supplying them consumed about <b ${i(q.source)}>${K(q.value)}</b> more, according to Lawrence Berkeley National Laboratory.`)}
            ${M("end", "Explore", 'Dig into <span class="accent">every layer</span>.', "The dashboard has the full map with layer controls, every cloud region and supercomputer, power and water by country, and every source.", '<p style="margin-top:24px"><span class="em-toggle"><button type="button" class="em-todash">Open the dashboard</button></span></p>')}
          </div>
          <div class="em-stick"><div class="em-card in-storycard"><div class="in-storymap" id="in-storymap" role="img" aria-label="Map following the story"></div><div class="in-caption" id="in-caption"></div></div></div>
        </div>
      </div>`;
      const Se = new Map(O.map((e) => [e.id, e])),
        Ee = {
          type: "FeatureCollection",
          features: cn.features.map((e) => {
            var a, r;
            return {
              ...e,
              properties: {
                ...e.properties,
                bt:
                  "|" +
                  B(
                    ((r = Se.get(
                      String((a = e.properties) == null ? void 0 : a.id),
                    )) == null
                      ? void 0
                      : r.owners) ?? null,
                  ).join("|") +
                  "|",
              },
            };
          }),
        },
        Be = (e) =>
          e === "any"
            ? ["!=", ["get", "bt"], "||"]
            : ["in", `|${e}|`, ["get", "bt"]],
        ca = l.querySelector("#in-pick"),
        te = (e, a, r, m) => {
          ca.innerHTML = `<p class="em-eyebrow">${u(e)}</p><p class="t">${u(a)}</p><p class="s" ${i(m)}>${u(r)}</p>`;
        },
        b = new ea(l.querySelector("#in-map"), {
          view: { center: [15, 25], zoom: 0.9 },
        }),
        Ke = new Map(),
        ze = n.map((e) => {
          const a = `${e.lon},${e.lat}`,
            r = Ke.get(a) ?? 0;
          return Ke.set(a, r + 1), { ...e, lon: e.lon + r * 0.35, lat: e.lat };
        }),
        ga = (e) => {
          const a = Se.get(String(e.id));
          return a
            ? `${a.name}${a.length_km ? " · " + y(a.length_km) + " km" : ""}${a.rfs ? " · " + a.rfs : ""}`
            : String(e.name);
        };
      b.addLines("cables", Ee, {
        color: "--in-cable",
        width: 1,
        opacity: 0.65,
        hover: ga,
        onClick: (e) => {
          const a = Se.get(String(e.id));
          a &&
            te(
              "Submarine cable",
              a.name,
              `${a.length_km ? y(a.length_km) + " km · " : ""}${a.landings} landings · ready for service ${a.rfs ?? "n/a"}`,
              a.source,
            );
        },
      }),
        b.addPoints("landings", o, {
          color: "--in-landing",
          radius: 1.6,
          hover: (e) => String(e.name),
        }),
        b.addPoints("regions", ze, {
          color: { prop: "provider", map: ue },
          radius: 4,
          hover: (e) => `${e.provider} · ${e.code} · ${e.location}`,
          onClick: (e) =>
            te(
              `${e.provider} region${e.status !== "available" ? " · " + e.status : ""}`,
              `${e.name}`,
              `${e.code} · ${e.location}, ${e.country}`,
              String(e.source),
            ),
        }),
        b.addPoints("hpc", j, {
          color: "--in-hpc",
          radius: 6,
          hover: (e) => `#${e.rank} ${e.system} · ${e.site}`,
          onClick: (e) =>
            te(
              `TOP500 #${e.rank} · June 2026`,
              String(e.system),
              `${e.site}, ${e.country}${e.rmax_eflops ? ` · ${e.rmax_eflops} exaflops` : ""}`,
              String(e.source),
            ),
        }),
        (() => { const e = [...j].sort((a, r) => a.rank - r.rank)[0]; e && te(`TOP500 #${e.rank} · June 2026 · select any point to compare`, String(e.system), `${e.site}, ${e.country}${e.rmax_eflops ? ` · ${e.rmax_eflops} exaflops` : ""}`, String(e.source)); })(),
        b.setVisible("landings", !1),
        l.querySelectorAll(".in-layer").forEach((e) =>
          e.addEventListener("click", () => {
            const a = e.getAttribute("aria-pressed") !== "true";
            e.setAttribute("aria-pressed", String(a)),
              b.setVisible(e.dataset.layer, a);
          }),
        ),
        l.querySelectorAll(".em-proj").forEach((e) =>
          e.addEventListener("click", () => {
            l
              .querySelectorAll(".em-proj")
              .forEach((a) => a.setAttribute("aria-pressed", String(a === e))),
              b.setProjection(e.dataset.proj),
              b.go(
                e.dataset.proj === "globe"
                  ? { center: [10, 30], zoom: 1.4 }
                  : { center: [15, 25], zoom: 0.9 },
              );
          }),
        );
      const oe = new Map(
          de.filter((e) => e.iso_n3).map((e) => [e.country, e.iso_n3]),
        ),
        De = {};
      for (const [e, a] of Ue) {
        const r = oe.get(e);
        r && (De[r] = ta(a).band);
      }
      const ma = l.querySelector("#in-scale");
      l.querySelectorAll('.in-layer[data-layer="connectivity"]').forEach((e) =>
        e.addEventListener(
          "click",
          () => {
            const a = e.getAttribute("aria-pressed") !== "true";
            b.setChoropleth(a ? De : null, [
              "--in-c0",
              "--in-c1",
              "--in-c2",
              "--in-c3",
            ]),
              (ma.hidden = !a);
          },
          !0,
        ),
      );
      const be = l.querySelector("#in-owner"),
        Oe = (e) => {
          (be.value = e),
            b.setFilter("cables", e ? Be(e) : null),
            l
              .querySelectorAll(".in-btchip")
              .forEach((a) =>
                a.setAttribute("aria-pressed", String(a.dataset.owner === e)),
              ),
            We(e);
        };
      be.addEventListener("change", () => Oe(be.value)),
        b.onLandClick((e, a) => {
          var m;
          const r =
            ((m = de.find((h) => h.iso_n3 === e)) == null
              ? void 0
              : m.country) ?? ee.find((h) => h === a);
          r &&
            (re(r),
            te(
              "Country",
              r,
              `${ye(r)} cables land here · see the profile below`,
              C,
            ));
        });
      const Je = l.querySelector("#in-pc"),
        Ce = l.querySelector("#in-country");
      function re(e, a = !1) {
        (Ce.value = e), (l.querySelector("#in-pc-title").textContent = e);
        const r = Ea(O, e),
          m = r.length,
          h = ta(m),
          v = o.filter((d) => d.country === (ce[e] ?? e)).length,
          V = n.filter((d) => d.country === e),
          ka = Z(V, (d) => d.provider),
          fa = r.filter((d) => B(d.owners).length),
          le = ce[e];
        if (
          ((Je.innerHTML = `
        <p class="em-eyebrow">Profile · cables from the 2021 snapshot, regions from 2026</p>
        <h3 style="font-size:1.6rem;margin:6px 0 10px">${u(e)}</h3>
        <p class="in-badge" data-band="${h.band}"><i style="background:var(${h.band >= 0 ? "--in-c" + h.band : "--em-line"})"></i>${u(h.label)}</p>
        <div class="in-bigpair" style="margin-top:12px">
          <div><p class="em-eyebrow">Cables landing</p><div class="em-big accent" ${i(C)}>${m}</div></div>
          <div><p class="em-eyebrow">Landing points</p><div class="em-big" ${i(C)}>${v}</div></div>
          <div><p class="em-eyebrow">Cloud regions</p><div class="em-big" ${i(...new Set(V.map((d) => d.source)))}>${V.length}</div><p class="note">${ka.map((d) => `${u(d.key)} ${d.n}`).join(" · ") || "None of the three providers"}</p></div>
          <div><p class="em-eyebrow">Big tech cables</p><div class="em-big" ${i(C)}>${fa.length}</div></div>
        </div>
        ${le ? `<p class="note" style="margin-top:12px">The cable data files ${u(e)}'s landings under ${u(le)}, so these cable figures are ${u(le)}'s.</p>` : ""}
        ${m === 0 ? '<p class="note" style="margin-top:12px">No cable lands here in the data. Traffic reaches submarine cables over land links through neighbouring countries.</p>' : ""}
        ${
          m
            ? `<p class="em-eyebrow" style="margin-top:16px">Longest cables landing here</p><ul class="in-top">${r
                .slice(0, 6)
                .map(
                  (d) =>
                    `<li><span class="rk">${u((d.rfs ?? "").slice(0, 4))}</span><span class="nm">${u(d.name)}<span class="st">${u(B(d.owners).join(", "))}</span></span><span class="vl" ${i(d.source)}>${d.length_km ? y(d.length_km) + " km" : "n/a"}</span></li>`,
                )
                .join(
                  "",
                )}</ul>${m > 6 ? `<p class="note" style="margin-top:8px">and ${m - 6} more.</p>` : ""}`
            : ""
        }
        ${V.length ? `<p class="em-eyebrow" style="margin-top:16px">Cloud regions</p><div class="in-chips">${V.map((d) => `<span class="in-chip-static"><i style="background:var(${ue[d.provider]})"></i>${u(d.provider === "Google Cloud" ? "GCP" : d.provider)} ${u(d.code)}</span>`).join("")}</div>` : ""}
        <div class="em-cites"></div>`),
          ne.footnotes(Je),
          a)
        ) {
          const d = ra.features.find((L) => L.properties.iso === oe.get(e));
          if (d) {
            const [[L, G], [Ye, Aa]] = Ua(d);
            Ye - L < 180 &&
              b.map.fitBounds(
                [
                  [L, G],
                  [Ye, Aa],
                ],
                { padding: 40, maxZoom: 5 },
              );
          } else {
            const L = [...o.filter((G) => G.country === (le ?? e)), ...V];
            L.length &&
              b.go({
                center: [Xe(L, (G) => G.lon), Xe(L, (G) => G.lat)],
                zoom: 4,
              });
          }
          b.setHighlight(oe.get(e) ? [oe.get(e)] : []);
        }
      }
      Ce.addEventListener("change", () => re(Ce.value, !0));
      const Re = (e) =>
        `<button type="button" class="hs-chip in-cchip" data-country="${u(e)}">${u(e)}</button>`;
      (l.querySelector("#in-fragile").innerHTML = Fe.map(Re).join("")),
        (l.querySelector("#in-limited").innerHTML = Pe.map(Re).join("")),
        l.querySelectorAll(".in-cchip").forEach((e) =>
          e.addEventListener("click", () => {
            re(e.dataset.country, !0),
              l
                .querySelector("#profile")
                .scrollIntoView({ behavior: "smooth" });
          }),
        ),
        l
          .querySelector("#in-fragile")
          .closest(".em-card")
          .querySelector("h3")
          .setAttribute("data-src", C),
        re("United Kingdom");
      const P = l.querySelector("#in-lat-a"),
        N = l.querySelector("#in-lat-b"),
        $e = ["Azure", "AWS", "Google Cloud"]
          .map(
            (e) =>
              `<optgroup label="${e}">${n
                .filter((a) => a.provider === e)
                .sort((a, r) => a.name.localeCompare(r.name))
                .map(
                  (a) =>
                    `<option value="${u(e + "|" + a.code)}">${u(a.name === a.code ? a.code + " · " + a.location : a.name)}</option>`,
                )
                .join("")}</optgroup>`,
          )
          .join("");
      (P.innerHTML = $e),
        (N.innerHTML = $e),
        (P.value = "Azure|uksouth"),
        (N.value = "Azure|eastus");
      const Ve = (e) => {
          const [a, r] = e.split("|");
          return n.find((m) => m.provider === a && m.code === r);
        },
        da = l.querySelector("#in-lat-out");
      function ie() {
        const e = Ve(P.value),
          a = Ve(N.value),
          r = za(e, a),
          m = Oa(r),
          h =
            e.provider === "Azure" && a.provider === "Azure"
              ? J.find((v) => v.from_code === e.code && v.to_code === a.code)
              : void 0;
        (da.innerHTML = `
        <div><p class="em-eyebrow">Distance</p><div class="em-big" ${i(e.geo_source)}>${y(r)} km</div><p class="note">${u(e.location)} to ${u(a.location)}, great circle</p></div>
        <div><p class="em-eyebrow">Physical floor</p><div class="em-big accent">${e === a ? "0" : y(m, m < 10 ? 1 : 0)} ms</div><p class="note">Round trip at the speed of light in fibre</p></div>
        <div><p class="em-eyebrow">Measured (Azure P50)</p><div class="em-big" ${h ? i(h.source) : ""}>${h ? h.rtt_ms + " ms" : "—"}</div><p class="note">${h ? `${y(h.rtt_ms / m, 1)}× the floor` : e.code === a.code ? "Same region" : "Only published for 11 Azure regions"}</p></div>`),
          l
            .querySelectorAll("#in-matrix td[data-a]")
            .forEach((v) =>
              v.classList.toggle(
                "on",
                v.dataset.a === e.code && v.dataset.b === a.code,
              ),
            );
      }
      [P, N].forEach((e) => e.addEventListener("change", ie)),
        l.querySelector("#in-lat-swap").addEventListener("click", () => {
          const e = P.value;
          (P.value = N.value), (N.value = e), ie();
        });
      const we = [...new Set(J.map((e) => e.from_code))],
        Q = (e) => J.find((a) => a.from_code === e).from_name,
        je = Fa(J, (e) => e.rtt_ms);
      (l.querySelector("#in-matrix").innerHTML =
        `<thead><tr><th></th>${we.map((e) => `<th scope="col" title="${u(Q(e))}">${u(Q(e))}</th>`).join("")}</tr></thead><tbody>${we
          .map(
            (e) =>
              `<tr><th scope="row">${u(Q(e))}</th>${we
                .map((a) => {
                  if (e === a) return '<td class="self">—</td>';
                  const r = J.find(
                    (m) => m.from_code === e && m.to_code === a,
                  ).rtt_ms;
                  return `<td data-a="${e}" data-b="${a}" class="${r / je > 0.55 ? "deep" : ""}" style="--t:${(r / je).toFixed(3)}" ${i(ua)} title="${u(Q(e))} → ${u(Q(a))}: ${r} ms">${r}</td>`;
                })
                .join("")}</tr>`,
          )
          .join("")}</tbody>`),
        l.querySelector("#in-matrix").addEventListener(
          "click",
          (e) => {
            const a = e.target.closest("td[data-a]");
            a &&
              (e.stopPropagation(),
              (P.value = "Azure|" + a.dataset.a),
              (N.value = "Azure|" + a.dataset.b),
              ie());
          },
          !0,
        ),
        ie(),
        U(
          l.querySelector("#in-bt"),
          ae.map((e, a) => ({
            label: e.b,
            value: e.cables.length,
            muted: a !== 0,
            src: C,
          })),
          (e) => String(e),
          ae[0].cables.length,
          i,
        );
      const ya = l.querySelector("#in-bt-list");
      function We(e) {
        const a = (
          e && e !== "any" ? O.filter((r) => B(r.owners).includes(e)) : pe
        )
          .slice()
          .sort((r, m) => (m.length_km ?? 0) - (r.length_km ?? 0));
        (l.querySelector("#in-bt-title").textContent =
          e && e !== "any"
            ? `${e}: ${a.length} cables, longest first`
            : "Every big tech cable, longest first"),
          (ya.innerHTML = a
            .map(
              (r) =>
                `<tr><td>${u(r.name)}</td><td>${u(B(r.owners).join(", "))}</td><td class="r" ${i(r.source)}>${r.length_km ? y(r.length_km) + " km" : "n/a"}</td><td class="r hide-n">${u(r.rfs ?? "n/a")}</td></tr>`,
            )
            .join(""));
      }
      l.querySelectorAll(".in-btchip").forEach((e) =>
        e.addEventListener("click", () => {
          Oe(e.getAttribute("aria-pressed") === "true" ? "" : e.dataset.owner),
            l.querySelector("#map").scrollIntoView({ behavior: "smooth" });
        }),
      ),
        We("");
      const _e = ve.slice(0, 12);
      U(
        l.querySelector("#in-regions"),
        _e.map((e, a) => ({
          label: `${e.country}  ${e.byProvider.map((r) => `${r.key === "Google Cloud" ? "GCP" : r.key} ${r.n}`).join(" · ")}`,
          value: e.n,
          muted: a !== 0,
          src: n.find((r) => r.country === e.country).source,
        })),
        (e) => String(e),
        _e[0].n,
        i,
      ),
        l.querySelectorAll("#in-regions .em-bars-val").forEach((e, a) => {
          e.setAttribute(
            "data-src",
            [
              ...new Set(
                n
                  .filter((r) => r.country === _e[a].country)
                  .map((r) => r.source),
              ),
            ].join(" "),
          );
        });
      const He = Le.slice(0, 10);
      U(
        l.querySelector("#in-landings"),
        He.map((e, a) => ({ label: e.key, value: e.n, muted: a > 1, src: C })),
        (e) => String(e),
        He[0].n,
        i,
      ),
        U(
          l.querySelector("#in-compute"),
          T.map((e, a) => ({
            label: e.country,
            value: e.share,
            muted: a !== 0,
            src: e.source,
          })),
          (e) => (e * 100).toFixed(1) + "%",
          1,
          i,
        ),
        U(
          l.querySelector("#in-top500"),
          Te.map((e, a) => ({
            label: e.country,
            value: e.systems,
            muted: a !== 0,
            src: e.source,
          })),
          (e) => String(e),
          Te[0].systems,
          i,
        ),
        (l.querySelector("#in-supers").innerHTML = j
          .map(
            (e) =>
              `<li><span class="rk">#${e.rank}</span><span class="nm">${u(e.system)}<span class="st">${u(e.site)}, ${u(e.country)}</span></span><span class="vl" ${i(e.source)}>${e.rmax_eflops ? e.rmax_eflops + " EF" : "top 10"}</span></li>`,
          )
          .join(""));
      const xe = [
          ["United States", "share_us"],
          ["China", "share_china"],
          ["Europe", "share_europe"],
        ],
        qe = 1 - xe.reduce((e, [, a]) => e + c(a).value, 0);
      U(
        l.querySelector("#in-world"),
        [
          ...xe.map(([e, a], r) => ({
            label: `${e} · ${y(na(I.value, c(a).value))} TWh`,
            value: c(a).value,
            muted: r !== 0,
            src: c(a).source,
          })),
          {
            label: `Rest of world · ${y(na(I.value, qe))} TWh`,
            value: qe,
            muted: !0,
            src: I.source,
          },
        ],
        _,
        1,
        i,
      ),
        U(
          l.querySelector("#in-us"),
          [
            {
              label: `2018 · ${(c("us_2018_share").value * 100).toFixed(1)}%`,
              value: c("us_2018_twh").value,
              muted: !0,
              src: c("us_2018_twh").source,
            },
            {
              label: `2023 · ${(c("us_2023_share").value * 100).toFixed(1)}%`,
              value: c("us_2023_twh").value,
              muted: !1,
              src: c("us_2023_twh").source,
            },
            {
              label: `2028 low · ${(c("us_2028_low_share").value * 100).toFixed(1)}%`,
              value: c("us_2028_low_twh").value,
              muted: !0,
              src: c("us_2028_low_twh").source,
            },
            {
              label: `2028 high · ${(c("us_2028_high_share").value * 100).toFixed(1)}%`,
              value: c("us_2028_high_twh").value,
              muted: !0,
              src: c("us_2028_high_twh").source,
            },
          ],
          (e) => `${y(e)} TWh`,
          c("us_2028_high_twh").value,
          i,
        ),
        U(
          l.querySelector("#in-ie"),
          [
            { label: "2015", value: W.value, muted: !0, src: W.source },
            {
              label: "2024",
              value: c("ie_2024_share").value,
              muted: !0,
              src: c("ie_2024_share").source,
            },
            { label: "2025", value: R.value, muted: !1, src: R.source },
          ],
          _,
          0.3,
          i,
        );
      const pa = [...t]
        .filter((e) => e.length_km != null)
        .sort((e, a) => a.length_km - e.length_km)
        .slice(0, 12);
      (l.querySelector("#in-longest").innerHTML = pa
        .map(
          (e) =>
            `<tr><td>${u(e.name)}</td><td class="r" ${i(e.source)}>${y(e.length_km)} km</td><td class="r">${u(e.rfs ?? "n/a")}</td><td class="r hide-n">${e.landings}</td></tr>`,
        )
        .join("")),
        ne.footnotes(l);
      const ha = l.querySelector("#in-storymap"),
        Sa = l.querySelector("#in-caption"),
        A = new ea(ha, {
          interactive: !1,
          view: { center: [15, 20], zoom: 0.8 },
        });
      A.addLines("cables", Ee, { color: "--in-cable", width: 1, opacity: 0.7 }),
        A.addPoints("landings", o, { color: "--in-landing", radius: 1.8 }),
        A.addPoints("regions", ze, {
          color: { prop: "provider", map: ue },
          radius: 4,
        }),
        A.addPoints("hpc", j, { color: "--in-hpc", radius: 6 });
      const ba = {
          cables: {
            view: { center: [15, 20], zoom: 0.8 },
            layers: ["cables"],
            cap: ["cable"],
          },
          owners: {
            view: { center: [15, 20], zoom: 0.8 },
            layers: ["cables"],
            cap: ["bt"],
            filter: "any",
          },
          uk: {
            view: { center: [-4, 53], zoom: 3.6 },
            layers: ["cables", "landings"],
            hi: [z["United Kingdom"]],
            cap: ["cable", "landing"],
          },
          indonesia: {
            view: { center: [117, -2], zoom: 2.9 },
            layers: ["cables", "landings"],
            hi: [z.Indonesia],
            cap: ["cable", "landing"],
          },
          cloud: {
            view: { center: [15, 25], zoom: 0.9 },
            layers: ["cables", "regions"],
            cap: ["aws", "azure", "gcp"],
          },
          ai: {
            view: { center: [-40, 38], zoom: 1.3 },
            layers: ["hpc", "regions"],
            hi: [z["United States"]],
            cap: ["hpc"],
          },
          power: {
            view: { center: [15, 25], zoom: 0.9 },
            layers: ["regions"],
            hi: [z["United States"], z.China],
            cap: ["aws", "azure", "gcp"],
          },
          ireland: {
            view: { center: [-7.5, 53.3], zoom: 5 },
            layers: ["cables", "landings", "regions"],
            hi: [z.Ireland],
            cap: ["cable", "aws", "azure", "gcp"],
          },
          water: {
            view: { center: [-97, 39], zoom: 2.7 },
            layers: ["regions"],
            hi: [z["United States"]],
            cap: ["aws", "azure", "gcp"],
          },
          end: {
            view: { center: [15, 20], zoom: 0.8 },
            layers: ["cables", "regions", "hpc"],
            cap: ["cable", "aws", "azure", "gcp", "hpc"],
          },
        },
        Ca = {
          cable: `${w("--in-cable", !0)}Cables (2021)`,
          landing: `${w("--in-landing")}Landing points`,
          aws: `${w("--in-aws")}AWS`,
          azure: `${w("--in-azure")}Azure`,
          gcp: `${w("--in-gcp")}Google Cloud`,
          hpc: `${w("--in-hpc")}Top supercomputers`,
          bt: `${w("--in-cable", !0)}Big tech cables (2021)`,
        };
      let Qe = !0;
      const wa = La(l.querySelector('[data-view="story"]'), (e) => {
        const a = ba[e];
        a &&
          (["cables", "landings", "regions", "hpc"].forEach((r) =>
            A.setVisible(r, a.layers.includes(r)),
          ),
          A.setHighlight(a.hi ?? []),
          A.setFilter("cables", a.filter ? Be(a.filter) : null),
          A.go(a.view, !Qe),
          (Qe = !1),
          (Sa.innerHTML = a.cap.map((r) => `<span>${Ca[r]}</span>`).join("")));
      });
      l.querySelector(".em-todash").addEventListener("click", () =>
        s.querySelector('.em-viewbtn[data-view="dashboard"]').click(),
      );
      function _a(e) {
        l.querySelectorAll(".em-view").forEach((a) => {
          a.hidden = a.dataset.view !== e;
        }),
          requestAnimationFrame(() => {
            b.map.resize(), A.map.resize(), e === "story" && wa.redraw();
          });
      }
      he &&
        he !== "dashboard" &&
        ((Ze = s.querySelector(`.em-viewbtn[data-view="${he}"]`)) == null ||
          Ze.click());
      function se(e, a, r, m, h = !1) {
        return `<div class="em-kpi"><p class="em-eyebrow">${u(e)}</p><div class="big${h ? " accent" : ""}" ${i(m)}>${u(a)}</div><p class="sub">${u(r)}</p></div>`;
      }
      function M(e, a, r, m, h = "") {
        return `<article class="em-step" data-step="${e}"><p class="em-eyebrow">${u(a)}</p><h2>${r}</h2><p class="txt">${m}</p>${h}</article>`;
      }
    },
  };
export { _n as default };
