import {
  w as oe,
  s as be,
  S as ve,
  u as m,
  p as d,
  m as U,
  c as Z,
  a as z,
  e as h,
  b as E,
  y as ne,
} from "../../assets/charts.js";
import { B as ge } from "../../assets/map.js";
import {
  n as fe,
  i as we,
  c as Se,
  g as _e,
  m as $e,
  s as Ce,
} from "../../assets/d3-CYFjbSD-.js";
import { s as Ae } from "../../assets/story-Cpe0Yf6I.js";
import "../../assets/maplibre-ChAaPfnC.js";
import { SOURCES as De, DATA as Xe } from "./data.js";
function ce(l, r, n, u = !1) {
  const p = Math.max(280, l.clientWidth),
    y = Math.round(p * 0.52),
    g = fe().fitExtent(
      [
        [4, 4],
        [p - 4, y - 4],
      ],
      oe,
    ),
    M = we(g),
    G = new Set(r.map((o) => o.iso_n3)),
    b = Se("svg")
      .attr("width", "100%")
      .attr("viewBox", `0 0 ${p} ${y}`)
      .attr("role", "img")
      .attr("aria-label", r.map((o) => o.label).join("; "));
  b.append("path").datum(_e()).attr("d", M).attr("class", "em-graticule"),
    b
      .append("g")
      .selectAll("path")
      .data(oe.features)
      .join("path")
      .attr("d", M)
      .attr("class", (o) => (G.has(String(o.id)) ? "em-land on" : "em-land"));
  const $ = $e(r, (o) => o.value) ?? 1,
    k = Ce([0, $], [0, Math.min(46, p * 0.06)]),
    f = [...r].sort((o, S) => S.value - o.value);
  b
    .append("g")
    .selectAll("circle")
    .data(f)
    .join("circle")
    .attr("cx", (o) => g([o.lon, o.lat])[0])
    .attr("cy", (o) => g([o.lon, o.lat])[1])
    .attr("r", (o) => Math.max(4, k(o.value)))
    .attr("class", (o) => (o.id === n ? "em-bubble on" : "em-bubble")),
    l.replaceChildren(b.node()),
    (u ? f.slice(0, 5) : f.filter((o) => o.id === n)).forEach((o) => {
      const [S, i] = g([o.lon, o.lat]),
        I = Math.max(4, k(o.value)),
        C = b
          .append("text")
          .attr("class", "em-maplabel")
          .attr("x", S + I + 6)
          .attr("y", i + 4)
          .text(o.label.toUpperCase());
      S + I + 6 + (C.node().getComputedTextLength() || 0) > p - 4 &&
        C.attr("x", S - I - 6).attr("text-anchor", "end");
    });
}
const ke = (l) => Object.fromEntries(l.map((r) => [r.currency, r.per_usd]));
function ie(l, r, n) {
  const u = ke(n)[r];
  if (!u) throw new Error(`No exchange rate for ${r}`);
  return l / u;
}
function Fe(l, r) {
  const n = l.filter((y) => y.country === r).sort((y, g) => y.year - g.year);
  if (n.length < 2) return null;
  const [u, p] = n.slice(-2);
  return Math.round(1e3 * (p.losses_local / u.losses_local - 1)) / 10;
}
function Ue(l, r, n) {
  return l.map((u) => {
    const p = u.change_pct,
      y = p ?? Fe(n, u.country);
    return {
      ...u,
      usd: ie(u.losses_local, u.currency, r),
      change_pct: y,
      change_computed: p == null && y != null,
    };
  });
}
function Ie(l, r) {
  return l.map((n) => ({ ...n, usd: ie(n.est_local, n.currency, r) }));
}
function Te(l) {
  return l
    .filter(
      (r) => r.top_type_local != null && r.top_type.startsWith("Investment"),
    )
    .map((r) => ({
      country: r.country,
      share: r.top_type_local / r.losses_local,
      source: r.top_type_source ?? r.source,
    }))
    .sort((r, n) => n.share - r.share);
}
function Re(l, r) {
  const n = l.filter((y) => y.country === r).sort((y, g) => y.year - g.year),
    u = n[0],
    p = n[n.length - 1];
  return { first: u, last: p, ratio: p.losses_local / u.losses_local };
}
const Pe = { sources: De },
  le = { records: Xe.reported },
  xe = { records: Xe.estimates },
  Me = { records: Xe.fx },
  Le = { records: Xe.global },
  Ne = { records: Xe.us_detail },
  He = { records: Xe.response },
  We = { records: Xe.trend },
  Ve = { records: Xe.surveys },
  A = (l) => l.records,
  es = {
    id: "scams",
    title: "The Scam Economy",
    description:
      "How much the world loses to scams, from reports to national agencies and GASA surveys, with every number linked to its source.",
    mount(l) {
      var te;
      const r = A(Me),
        n = A(We),
        u = Ue(A(le), r, n).sort((e, s) => s.usd - e.usd),
        p = Ie(A(xe), r).sort((e, s) => s.usd - e.usd),
        y = A(Le),
        g = A(Ne),
        M = A(He),
        G = A(Ve),
        b = Te(A(le)),
        $ = Re(n, "United States"),
        k = r[0].source,
        f = (e) => y.find((s) => s.metric === e),
        w = (e) => M.find((s) => s.metric === e),
        o = (e) => u.find((s) => s.country === e),
        S = (e) => p.find((s) => s.country === e),
        { main: i, initialView: I } = be(l, {
          variantId: "scams",
          name: "Scams",
          views: [
            { id: "dashboard", label: "Dashboard" },
            { id: "story", label: "Story" },
          ],
          onView: (e) => ye(e),
          onTheme: () => {
            W.retheme(), X.redraw();
          },
        }),
        C = new ve(Pe.sources, l),
        t = (...e) => C.attr(...e),
        T = f("global_losses"),
        D = f("lost_money"),
        ee = f("confident"),
        K = f("encountered"),
        P = o("United States"),
        B = w("ca_reported_low"),
        x = w("ca_reported_high");
      i.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>The scam economy · 2025 data</p>
        <h1>Scams took an estimated <span class="accent"><b ${t(T.source)}>${m(T.value)}</b> from people worldwide</span></h1>
        <p class="em-lede"><b ${t(D.source)}>${d(D.value)}</b> of adults lost money to a scam in the past year, even though <b ${t(ee.source)}>${d(ee.value)}</b> said they felt confident they could spot one. Official reports capture only a fraction of it.</p>
      </header>

      <div class="em-view" data-view="dashboard">
        <section class="em-sec" id="glance">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>One scam economy, <span class="accent">measured two ways</span></h2></div></div>
          <div class="em-kpis">
            ${N("Estimated global losses", m(T.value), "GASA survey estimate, past 12 months", T.source, !0)}
            ${N("Encountered a scam", d(K.value), "Share of adults worldwide, past 12 months", K.source)}
            ${N("Lost money", d(D.value), "Share of adults worldwide, past 12 months", D.source)}
            ${N("Reported to the FBI", m(P.usd), "US losses reported to IC3 in 2025, the largest national dataset", P.source)}
          </div>
        </section>

        <section class="em-sec" id="map">
          <div class="em-sec-h">
            <div><p class="em-eyebrow"><span class="num">02</span>Where the money goes</p><h2>Losses by country, <span class="accent">in US dollars</span></h2></div>
          </div>
          <div class="em-maprow">
            <div class="em-card em-mapcard">
              <div class="em-maptools">
                <div class="em-toggle" role="group" aria-label="Map layer">
                  <button type="button" class="em-layer" data-layer="reported" aria-pressed="true">Reported</button>
                  <button type="button" class="em-layer" data-layer="estimated" aria-pressed="false">Survey estimates</button>
                </div>
                <div class="em-toggle" role="group" aria-label="Projection">
                  <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                  <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
                </div>
              </div>
              <p class="note">Reported figures are losses victims told national agencies about. Survey estimates come from GASA's national surveys, which scale self-reported losses to the whole adult population. Converted at IRS 2025 average rates.</p>
              <div class="em-map" id="em-map" role="region" aria-label="World map of scam losses"></div>
              <div class="em-legend"><span><i></i>Circle area = losses in US$</span><span><i class="land"></i>Country in this layer</span></div>
            </div>
            <div class="em-card em-detail soft" id="em-detail" aria-live="polite"></div>
          </div>
          <div class="em-grid" style="margin-top:16px">
            <div class="em-card">
              <p class="em-eyebrow">Survey snapshot · past 12 months</p>
              <h3>Adults who encountered a scam</h3>
              <p class="note">GASA surveys for markets without a comparable official total. The Philippines survey puts losses at <b ${t(G.find((e) => e.country === "Philippines").source)}>${U(G.find((e) => e.country === "Philippines").est_local, "PHP")}</b>; the UAE report's loss total is for GASA members only, so it isn't on the map.</p>
              <div class="em-bars" id="em-surveys"></div>
              <div class="em-cites"></div>
            </div>
          </div>
        </section>

        <section class="em-sec" id="trend">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Year on year</p><h2>Reported losses keep <span class="accent">climbing in most countries</span></h2></div></div>
          <div class="em-card">
            <p class="em-eyebrow">Reported losses · local currency · 2021–2025</p>
            <p class="note">Each country on its own scale and in its own currency, as each agency publishes it. Earlier UK and Australian years are rounded headline figures. The badge is the agency's published change on the year before; * means worked out from the two totals.</p>
            <div class="em-minis" id="em-trend"></div>
            <div class="em-cites"></div>
          </div>
        </section>

        <section class="em-sec" id="how">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>How it happens</p><h2>Investment scams <span class="accent">do the most damage</span></h2></div></div>
          <div class="em-grid">
            <div class="em-card">
              <p class="em-eyebrow">Share of reported losses · 2025</p>
              <h3>Investment scams' share of each country's losses</h3>
              <p class="note">For the UK, investment scams as a share of all payment fraud losses. Singapore and India don't publish losses by scam type in their annual figures.</p>
              <div class="em-bars" id="em-invest"></div>
              <div class="em-cites"></div>
            </div>
            <div class="em-card">
              <p class="em-eyebrow">Most common scams · worldwide</p>
              <h3>Share of victims hit by each scam type</h3>
              <p class="note">GASA Global State of Scams 2025, ${Z(f("respondents").value)} adults in ${f("markets").value} markets. Victims can report more than one type.</p>
              <div class="em-bars" id="em-types"></div>
              <div class="em-cites"></div>
            </div>
          </div>
        </section>

        <section class="em-sec" id="gap">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>The hidden gap</p><h2>Most losses are <span class="accent">never reported or recovered</span></h2></div></div>
          <div class="em-grid">
            ${j("Canada · reporting rate", `<b ${t(B.source)}>${d(B.value)}</b>–<b ${t(x.source)}>${d(x.value)}</b>`, "Share of frauds the Canadian Anti-Fraud Centre estimates are ever reported to it.", !0)}
            ${j("Worldwide · recovery", `<span ${t(w("gasa_recovered").source)}>${d(w("gasa_recovered").value)}</span>`, "Share of scam victims worldwide who recovered their losses (GASA Global State of Scams 2024).")}
            ${j("United Kingdom · reimbursement", `<span ${t(w("uk_reimbursed").source)}>${d(w("uk_reimbursed").value)}</span>`, "Share of authorised push payment losses UK banks reimbursed to victims in 2025.")}
            ${j("Singapore · recovery", `<span ${t(w("sg_recovered").source)}>${U(w("sg_recovered").value, "SGD")}</span>`, "Scam losses the Singapore Police Force's Anti-Scam Command recovered in 2025.")}
          </div>
        </section>

        <section class="em-sec" id="us">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close-up · United States</p><h2>Two agencies, <span class="accent">two counts</span></h2></div></div>
          <div class="em-card">
            <p class="em-eyebrow">Reported losses · 2025</p>
            <h3>Largest loss categories at the FBI and the FTC</h3>
            <p class="note">The FBI's IC3 and the FTC's Consumer Sentinel collect reports separately and partly overlap, so their totals shouldn't be added together.</p>
            <div class="em-bars" id="em-us"></div>
            <div class="em-cites"></div>
          </div>
        </section>

        <section class="em-sec" id="table">
          <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Reported losses</p><h2>National agency figures, <span class="accent">side by side</span></h2></div></div>
          <div class="em-card">
            <p class="note">Local amounts as published. US$ at the <span ${t(k)}>IRS 2025 yearly average rates</span>. Changes marked * are worked out from the two years' totals because the agency doesn't publish one. Select a column to sort.</p>
            <div class="em-tablewrap">
              <table class="em-table">
                <thead><tr>
                  <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                  <th class="hide-n">Source</th>
                  <th class="r" data-key="losses_local"><span>Local</span></th>
                  <th class="r" data-key="usd" aria-sort="descending"><button type="button">US$</button></th>
                  <th class="r hide-n" data-key="reports" aria-sort="none"><button type="button">Reports</button></th>
                  <th class="r" data-key="change_pct" aria-sort="none"><button type="button">vs 2024</button></th>
                </tr></thead>
                <tbody id="em-tbody"></tbody>
              </table>
            </div>
            <div class="em-cites"></div>
          </div>
        </section>

        <section class="em-method" id="method">
          <p class="em-eyebrow"><span class="num">08</span>Method</p>
          <p>Reported losses are what victims told national agencies, so they undercount real harm. Survey estimates (GASA) ask a sample of adults what they lost and scale it up, so they run much higher. The two are shown separately and shouldn't be compared one to one.</p>
          <p>Each agency counts differently: UK Finance covers payment fraud reported by its member banks; Australia combines Scamwatch, ReportCyber, AFCX, IDCARE and ASIC; the FBI figure covers all internet crime reported to IC3; India's is financial cyber fraud reported to the National Cybercrime Reporting Portal. Denmark's estimate is from GASA's 2026 report. The Philippines estimate is shown in pesos only, because the IRS table has no 2025 peso rate.</p>
          <p class="em-eyebrow" style="margin-top:24px">All sources</p>
          <ol class="em-srclist">${C.list()}</ol>
        </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${R("global", "01", "The scale", `Around the world, scams took an estimated <span class="accent"><b ${t(T.source)}>${m(T.value)}</b></span> in a single year.`, `<b ${t(K.source)}>${d(K.value)}</b> of adults ran into a scam, and <b ${t(D.source)}>${d(D.value)}</b> lost money to one, according to GASA's survey of ${f("markets").value} markets.`)}
            ${R("us", "02", "What gets reported", `Americans reported <span class="accent"><b ${t(P.source)}>${m(P.usd)}</b></span> in losses to the FBI in 2025.`, `That was up <b ${t(P.source)}>${z(P.change_pct)}</b> on 2024, and the United States is by far the largest circle on the map of reported losses.`)}
            ${R("growth", "03", "The trend", `That is about <span class="accent"><b ${t($.first.source, $.last.source)}>${Math.round($.ratio)} times</b></span> the losses reported in ${$.first.year}.`, `IC3 recorded <b ${t($.first.source)}>${m($.first.losses_local)}</b> in ${$.first.year}. Reported losses have risen every year since.`)}
            ${R("invest", "04", "The biggest earner", 'Investment scams take <span class="accent">the largest slice</span>.', `In Canada they account for <b ${t(b.find((e) => e.country === "Canada").source)}>${d(b.find((e) => e.country === "Canada").share)}</b> of reported losses, and in the United States <b ${t(b.find((e) => e.country === "United States").source)}>${d(b.find((e) => e.country === "United States").share)}</b>.`)}
            ${R("gap", "05", "The hidden gap", `Only <span class="accent"><b ${t(B.source)}>${d(B.value)}–${d(x.value)}</b></span> of frauds are ever reported.`, `That's the Canadian Anti-Fraud Centre's own estimate. Worldwide, just <b ${t(w("gasa_recovered").source)}>${d(w("gasa_recovered").value)}</b> of victims got their money back.`)}
            ${R("estimates", "06", "The real picture", `Surveys put Brazil's losses at <span class="accent"><b ${t(S("Brazil").source, k)}>${m(S("Brazil").usd)}</b></span>.`, `Where surveys fill the gap, the scale changes. Pakistan's estimate of <b ${t(S("Pakistan").source)}>${m(S("Pakistan").usd)}</b> is about 2.5% of its GDP, according to GASA.`)}
            ${R("end", "07", "Explore", `Dig into <span class="accent">every country's numbers</span>.`, "The dashboard has the full map, trends by country, scam types and every source.", '<p style="margin-top:24px"><span class="em-toggle"><button type="button" class="em-todash">Open the dashboard</button></span></p>')}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="em-vis"></div></div></div>
        </div>
      </div>`;
      const F = { layer: "reported", sel: null },
        ue = () =>
          F.layer === "reported"
            ? u.map((e) => ({
                id: e.country,
                iso_n3: e.iso_n3,
                lon: e.lon,
                lat: e.lat,
                value: e.usd,
                label: `${e.country} · ${m(e.usd)}${e.currency !== "USD" ? " · " + U(e.losses_local, e.currency) : ""}`,
              }))
            : p.map((e) => ({
                id: e.country,
                iso_n3: e.iso_n3,
                lon: e.lon,
                lat: e.lat,
                value: e.usd,
                label: `${e.country} · ${m(e.usd)}${e.currency !== "USD" ? " · " + U(e.est_local, e.currency) : ""}`,
              })),
        W = new ge(i.querySelector("#em-map"), {
          onPick: (e) => {
            (F.sel = e), V();
          },
        }),
        O = i.querySelector("#em-detail");
      function V() {
        const e = ue(),
          s = F.sel && e.some((a) => a.id === F.sel) ? F.sel : e[0].id;
        W.update(e, s), de(s);
      }
      function de(e) {
        const s = (a, c) => `<dt>${h(a)}</dt><dd>${c}</dd>`;
        if (F.layer === "reported") {
          const a = o(e);
          O.innerHTML = `
          <p class="em-eyebrow">Selected · reported to authorities</p>
          <p class="em-d-country">${h(a.country)}</p>
          <p class="em-d-value" ${t(a.source)}>${U(a.losses_local, a.currency)}</p>
          <p class="em-d-usd">${a.currency === "USD" ? "US dollars, as published" : `≈ <span ${t(k)}>${m(a.usd)}</span> at the 2025 average rate`}</p>
          <dl class="em-d-list">
            ${s("Source", h(a.agency))}
            ${s("Reports", `<span ${t(a.reports_source)}>${Z(a.reports)}</span>`)}
            ${s("vs 2024", a.change_pct == null ? "Not published" : `<span ${t(a.source)}>${z(a.change_pct)}${a.change_computed ? "*" : ""}</span>`)}
            ${s("Top type", h(a.top_type))}
            ${a.top_type_local != null ? s("Top type lost", `<span ${t(a.top_type_source)}>${U(a.top_type_local, a.currency)}</span>`) : ""}
          </dl>
          <div class="em-cites"></div>`;
        } else {
          const a = S(e);
          O.innerHTML = `
          <p class="em-eyebrow">Selected · survey estimate</p>
          <p class="em-d-country">${h(a.country)}</p>
          <p class="em-d-value" ${t(a.source)}>${U(a.est_local, a.currency)}</p>
          <p class="em-d-usd">${a.currency === "USD" ? "US dollars, as published" : `≈ <span ${t(k)}>${m(a.usd)}</span> at the 2025 average rate`}</p>
          <dl class="em-d-list">${s("Source", h(C.get(a.source).title))}${s("Method", "Survey, scaled to adults")}${s("Year", String(a.year))}</dl>
          <div class="em-cites"></div>`;
        }
        C.footnotes(O);
      }
      i.querySelectorAll(".em-layer").forEach((e) =>
        e.addEventListener("click", () => {
          (F.layer = e.dataset.layer),
            (F.sel = null),
            i
              .querySelectorAll(".em-layer")
              .forEach((s) => s.setAttribute("aria-pressed", String(s === e))),
            V();
        }),
      ),
        i.querySelectorAll(".em-proj").forEach((e) =>
          e.addEventListener("click", () => {
            i
              .querySelectorAll(".em-proj")
              .forEach((s) => s.setAttribute("aria-pressed", String(s === e))),
              W.setProjection(e.dataset.proj);
          }),
        ),
        V(),
        E(
          i.querySelector("#em-surveys"),
          G.map((e) => ({
            label: e.country,
            value: e.encountered,
            muted: e.country === "Worldwide",
            src: e.source,
          })).sort((e, s) => s.value - e.value),
          d,
          1,
          t,
        ),
        E(
          i.querySelector("#em-invest"),
          b.map((e, s) => ({
            label: e.country,
            value: e.share,
            muted: s !== 0,
            src: e.source,
          })),
          d,
          1,
          t,
        );
      const pe = y
        .filter((e) => e.metric.startsWith("type_"))
        .sort((e, s) => s.value - e.value);
      E(
        i.querySelector("#em-types"),
        pe.map((e, s) => ({
          label: e.label,
          value: e.value,
          muted: s !== 0,
          src: e.source,
        })),
        d,
        1,
        t,
      );
      const me = Math.max(...g.map((e) => e.value));
      E(
        i.querySelector("#em-us"),
        ["FBI IC3", "FTC"].flatMap((e) =>
          g
            .filter((s) => s.agency === e)
            .sort((s, a) => a.value - s.value)
            .map((s) => ({
              group: e,
              label: s.label,
              value: s.value,
              src: s.source,
              muted: !/^All /.test(s.label) && !s.metric.includes("investment"),
            })),
        ),
        m,
        me,
        t,
      );
      const Y = i.querySelector("#em-trend"),
        J = () => {
          const e = [...new Set(n.map((s) => s.country))]
            .map((s) => {
              const a = n
                .filter((c) => c.country === s)
                .sort((c, v) => c.year - v.year);
              return {
                country: s,
                rows: a,
                cur: a[0].currency,
                agency: a[0].agency,
              };
            })
            .sort((s, a) => a.rows.length - s.rows.length);
          (Y.innerHTML = e
            .map((s) => {
              const a = u.find((Q) => Q.country === s.country),
                [c, v] = s.rows.slice(-2),
                H =
                  (a == null ? void 0 : a.change_pct) ??
                  Math.round((v.losses_local / c.losses_local - 1) * 1e3) / 10,
                re = a ? a.change_computed : !0;
              return `<div class="em-mini" data-country="${h(s.country)}">
          <div class="mt"><span class="mn">${h(s.country)}</span><span class="mc ${H > 0 ? "up" : "down"}" ${t(a && !re ? a.source : c.source, v.source)}>${z(H)}${re ? "*" : ""}</span></div>
          <p class="ms">${h(s.agency)}</p><div class="chart" ${t(...s.rows.map((Q) => Q.source))}></div></div>`;
            })
            .join("")),
            e.forEach((s) => {
              const a = Y.querySelector(
                `.em-mini[data-country="${CSS.escape(s.country)}"] .chart`,
              );
              a.append(
                ne(
                  s.rows.map((c) => ({ year: c.year, v: c.losses_local })),
                  s.cur,
                  Math.max(200, a.clientWidth),
                  120,
                ),
              );
            }),
            C.footnotes(Y.closest(".em-card"));
        };
      J();
      const he = i.querySelector("#em-tbody");
      let L = "usd",
        q = -1;
      const se = () => {
        const e = [...u].sort((s, a) => {
          const c = s[L],
            v = a[L];
          return c == null
            ? 1
            : v == null
              ? -1
              : (typeof c == "number"
                  ? c - v
                  : String(c).localeCompare(String(v))) * q;
        });
        he.innerHTML = e
          .map((s) => {
            const a = s.change_pct;
            return `<tr>
          <td>${h(s.country)}</td><td class="hide-n">${h(s.agency)}</td>
          <td class="r" ${t(s.source)}>${U(s.losses_local, s.currency)}</td>
          <td class="r" ${t(k)}>${m(s.usd)}</td>
          <td class="r hide-n" ${t(s.reports_source)}>${Z(s.reports)}</td>
          <td class="r ${a == null ? "" : a > 0 ? "up" : "down"}">${a == null ? "n/a" : z(a) + (s.change_computed ? "*" : "")}</td></tr>`;
          })
          .join("");
      };
      i.querySelectorAll(".em-table th[aria-sort]").forEach((e) =>
        e.querySelector("button").addEventListener("click", () => {
          const s = e.dataset.key;
          (q = L === s ? -q : s === "country" ? 1 : -1),
            (L = s),
            i
              .querySelectorAll(".em-table th[aria-sort]")
              .forEach((a) =>
                a.setAttribute(
                  "aria-sort",
                  a === e ? (q > 0 ? "ascending" : "descending") : "none",
                ),
              ),
            se();
        }),
      ),
        se(),
        C.footnotes(i);
      const _ = i.querySelector("#em-vis"),
        X = Ae(i.querySelector('[data-view="story"]'), (e) => {
          if (e === "global")
            _.innerHTML = `<p class="vt">Estimated global losses · GASA 2025</p><div class="vbig">${m(T.value)}</div><p class="vsub">More than the annual economic output of most countries, taken one scam at a time.</p>`;
          else if (e === "us" || e === "end")
            (_.innerHTML =
              '<p class="vt">Reported to authorities · US$</p><div class="m"></div>'),
              ce(
                _.querySelector(".m"),
                u.map((s) => ({
                  id: s.country,
                  iso_n3: s.iso_n3,
                  lon: s.lon,
                  lat: s.lat,
                  value: s.usd,
                  label: `${s.country} ${m(s.usd)}`,
                })),
                "United States",
                e === "end",
              );
          else if (e === "estimates")
            (_.innerHTML =
              '<p class="vt">Survey estimates · US$</p><div class="m"></div>'),
              ce(
                _.querySelector(".m"),
                p.map((s) => ({
                  id: s.country,
                  iso_n3: s.iso_n3,
                  lon: s.lon,
                  lat: s.lat,
                  value: s.usd,
                  label: `${s.country} ${m(s.usd)}`,
                })),
                "Brazil",
              );
          else if (e === "growth") {
            _.innerHTML = '<p class="vt">Losses reported to FBI IC3 · US$</p>';
            const s = Math.max(260, _.clientWidth);
            _.append(
              ne(
                n
                  .filter((a) => a.country === "United States")
                  .map((a) => ({ year: a.year, v: a.losses_local })),
                "USD",
                s,
                Math.round(Math.min(360, s * 0.6)),
              ),
            );
          } else if (e === "invest")
            (_.innerHTML =
              '<p class="vt">Investment scams · share of reported losses, 2025</p><div class="em-bars"></div>'),
              E(
                _.querySelector(".em-bars"),
                b.map((s, a) => ({
                  label: s.country,
                  value: s.share,
                  muted: a !== 0,
                })),
                d,
                1,
                () => "",
              );
          else if (e === "gap") {
            const s = Array.from(
              { length: 100 },
              (a, c) =>
                `<i class="${c < B.value * 100 ? "on" : c < x.value * 100 ? "maybe" : ""}"></i>`,
            ).join("");
            _.innerHTML = `<p class="vt">Out of every 100 frauds in Canada</p><div class="em-waffle" role="img" aria-label="${d(B.value)} to ${d(x.value)} of 100 squares filled">${s}</div><p class="vsub">Dark squares: the low estimate of frauds reported. Light squares: the high estimate. The rest go unreported.</p>`;
          }
        });
      i.querySelector(".em-todash").addEventListener("click", () => {
        l.querySelector('.em-viewbtn[data-view="dashboard"]').click();
      });
      function ye(e) {
        i.querySelectorAll(".em-view").forEach((s) => {
          s.hidden = s.dataset.view !== e;
        }),
          e === "story" && X.redraw(),
          e === "dashboard" && J();
      }
      I &&
        I !== "dashboard" &&
        ((te = l.querySelector(`.em-viewbtn[data-view="${I}"]`)) == null ||
          te.click());
      let ae = 0;
      addEventListener("resize", () => {
        clearTimeout(ae),
          (ae = window.setTimeout(() => {
            J(), X.redraw();
          }, 150));
      });
      function N(e, s, a, c, v = !1) {
        return `<div class="em-kpi"><p class="em-eyebrow">${h(e)}</p><div class="big${v ? " accent" : ""}" ${t(c)}>${h(s)}</div><p class="sub">${h(a)}</p></div>`;
      }
      function j(e, s, a, c = !1) {
        return `<div class="em-card${c ? " hl" : ""}"><p class="em-eyebrow">${h(e)}</p><div class="em-big">${s}</div><p class="note">${h(a)}</p><div class="em-cites"></div></div>`;
      }
      function R(e, s, a, c, v, H = "") {
        return `<article class="em-step" data-step="${e}"><p class="em-eyebrow"><span class="num">${s}</span>${h(a)}</p><h2>${c}</h2><p class="txt">${v}</p>${H}</article>`;
      }
    },
  };
export { es as default };
