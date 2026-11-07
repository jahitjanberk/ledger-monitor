import { s as me, S as pe, e as d, b as R } from "../../assets/charts.js";
import { B as ue } from "../../assets/map.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import "../../assets/maplibre-ChAaPfnC.js";
import "../../assets/d3-CYFjbSD-.js";
import { DATA, SOURCES } from "./data.js";
function Z(n, i) {
  const r = Math.round(n * 10) / 10,
    u = i.findIndex((h) => r >= h.min && r <= h.max);
  if (u < 0) throw new Error(`No rating band for ${n}`);
  return u;
}
const f = (n) =>
  n.median_multiple_prev == null
    ? null
    : Math.round((n.median_multiple - n.median_multiple_prev) * 10) / 10;
function ce(n) {
  const i = f(n);
  return i == null ? null : i < 0 ? 0 : i > 0 ? 2 : 1;
}
function j(n, i, r) {
  return r <= 0 ? 1 / 0 : (i * n) / r;
}
const _e = (n, i) => n * (1 - i);
function ge(n, i) {
  const r = i.map((u) => ({ rating: u.rating, n: 0 }));
  return n.forEach((u) => r[Z(u.median_multiple, i)].n++), r;
}
function he(n, i) {
  const r = n
      .filter((_) => _.median_multiple_prev != null)
      .map((_) => ({ ..._, d: f(_) })),
    u = [...r].sort((_, v) => _.d - v.d).slice(0, i),
    h = [...r]
      .sort((_, v) => v.d - _.d)
      .filter((_) => _.d > 0)
      .slice(0, i);
  return { better: u, worse: h };
}
const ve = SOURCES,
  ke = { sources: ve },
  Se = { records: DATA.markets },
  fe = { records: DATA.nations },
  $e = { records: DATA.ratings },
  we = { records: DATA.uk_ons },
  Me = { records: DATA.bubble },
  w = (n) => n.records,
  l = (n) => n.toFixed(1),
  y = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + Math.abs(n).toFixed(1),
  Q = (n) => "£" + new Intl.NumberFormat("en-GB").format(n),
  F = ["--hs-r0", "--hs-r1", "--hs-r2", "--hs-r3", "--hs-r4"],
  Y = ["--hs-better", "--hs-same", "--hs-worse"],
  Le = ["US", "GB", "CA", "AU", "NZ", "IE", "SG", "HK"],
  C = {
    US: "US",
    GB: "UK",
    CA: "Canada",
    AU: "Australia",
    NZ: "New Zealand",
    IE: "Ireland",
    SG: "Singapore",
    HK: "Hong Kong",
  },
  He = {
    id: "housing",
    title: "Housing Affordability",
    description:
      "How many years of income a typical home costs in 96 major housing markets, from the Demographia survey, the ONS and UBS, with every number linked to its source.",
    mount(n) {
      const i = w($e),
        r = w(Se),
        u = w(fe),
        h = w(we),
        _ = w(Me),
        v = (e) => Z(e, i),
        I = [...r].sort((e, a) => e.median_multiple - a.median_multiple),
        k = I[0],
        M = I[I.length - 1],
        U = u.find((e) => e.nation_code === "ALL"),
        b = ge(r, i),
        { better: L, worse: P } = he(r, 6),
        N = r.find((e) => e.market === "Greater London"),
        { main: t, initialView: IV } = me(n, {
          variantId: "housing",
          name: "Housing",
          views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
          onView: (e) => setView(e),
          onTheme: () => { $.retheme(); story && story.redraw(); },
        }),
        B = new pe(ke.sources, n),
        s = (...e) => B.attr(...e),
        E = (e) => `<i style="background:var(${F[e]})"></i>`,
        J = (e) =>
          `<span class="hs-pill">${E(v(e))}${d(i[v(e)].rating)}</span>`;
      t.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Housing affordability · Q3 2025 data</p>
        <h1>In ${d(M.market)}, a home costs <span class="accent"><b ${s(M.source)}>${l(M.median_multiple)} years</b> of household income</span></h1>
        <p class="em-lede">None of the <b ${s(k.source)}>${r.length}</b> major housing markets in the Demographia survey counts as affordable. Even the most affordable, <b ${s(k.source)}>${d(k.market)}</b>, sits at <b ${s(k.source)}>${l(k.median_multiple)}</b>, just above the affordable line of ${l(i[0].max)}.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Affordability here is the median home price divided by median income</h2></div></div>
        <div class="em-kpis">
          ${K("Markets tracked", String(r.length), "Major markets in 8 countries, Q3 2025", k.source)}
          ${K("Rated affordable", String(b[0].n), `A multiple of ${l(i[0].max)} or less`, i[0].source, !0)}
          ${K("Median of all markets", l(U.median_multiple), `${y(U.median_multiple - U.median_multiple_prev)} on Q3 2024 (${l(U.median_multiple_prev)})`, U.source)}
          ${K("Greater London", l(N.median_multiple), `${y(f(N))} on 2024 · ${i[v(N.median_multiple)].rating.toLowerCase()}`, N.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h">
          <div><p class="em-eyebrow"><span class="num">02</span>Where homes cost the most</p><h2>96 markets, <span class="accent">one scale</span></h2></div>
        </div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="hs-mode" data-mode="level" aria-pressed="true">2025 rating</button>
                <button type="button" class="hs-mode" data-mode="change" aria-pressed="false">Change on 2024</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="hs-chips" role="group" aria-label="Country" style="margin-bottom:12px">
              <button type="button" class="hs-chip" data-nation="" aria-pressed="true">All</button>
              ${Le.map((e) => `<button type="button" class="hs-chip" data-nation="${e}" aria-pressed="false">${d(C[e])}</button>`).join("")}
            </div>
            <div class="em-map" id="hs-map" role="region" aria-label="Map of housing markets coloured by affordability"></div>
            <div class="hs-scale" id="hs-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="hs-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="calc">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>What it means for a buyer</p><h2>Years to save a deposit, <span class="accent">market by market</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Deposit calculator</p>
            <h3>How long would a typical household need to save?</h3>
            <p class="note">For a household on the local median income buying a median-priced home. Years = deposit share × median multiple ÷ share of income saved. Income cancels out, so this works in any currency.</p>
            <div class="hs-calc">
              <div class="hs-field"><label for="hs-market">Market</label><select id="hs-market">${[
                ...r,
              ]
                .sort((e, a) => e.market.localeCompare(a.market))
                .map(
                  (e) =>
                    `<option value="${d(e.market)}">${d(e.market)} (${l(e.median_multiple)})</option>`,
                )
                .join("")}</select></div>
              <div class="hs-field"><label for="hs-dep">Deposit <output id="hs-dep-o">20%</output></label><input id="hs-dep" type="range" min="5" max="40" step="1" value="20"></div>
              <div class="hs-field"><label for="hs-sav">Saved each year <output id="hs-sav-o">10% of income</output></label><input id="hs-sav" type="range" min="2" max="40" step="1" value="10"></div>
              <div class="hs-out" id="hs-out"></div>
            </div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">By country · Q3 2025</p>
            <h3>National median multiples</h3>
            <p class="note">The median across each country's major markets in the survey, with the change on Q3 2024.</p>
            <p class="hs-key"><span><i style="background:var(--em-accent)"></i>Severely unaffordable or worse (${l(i[3].min)}+)</span><span><i style="background:var(--em-bar-muted)"></i>Seriously unaffordable or better</span></p>
            <div class="em-bars" id="hs-nations"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="dist">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>The spread</p><h2>${Math.round((100 * (b[3].n + b[4].n)) / r.length)}% of markets are <span class="accent">severely unaffordable or worse</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Markets by rating · Q3 2025</p>
            <h3>How the ${r.length} markets split</h3>
            <p class="note">Demographia's bands: up to ${l(i[0].max)} affordable, ${l(i[4].min)} and above impossibly unaffordable.</p>
            <div id="hs-dist"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Biggest moves since Q3 2024</p>
            <h3>Where affordability changed most</h3>
            <p class="note">Change in the median multiple. A fall means homes got more affordable relative to income.</p>
            <div class="em-bars" id="hs-movers"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Close-up · England and Wales</p><h2>The ONS measure, <span class="accent">down to the borough</span></h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">House price to earnings ratio · 2025</p>
          <h3>Median house price ÷ median earnings of full-time workers</h3>
          <p class="note">The ONS uses one worker's earnings, not household income, so its ratios run higher than Demographia's. England's median home cost <b ${s(h[0].source)}>${Q(h[0].median_price)}</b> against median earnings of <b ${s(h[0].source)}>${Q(h[0].median_earnings)}</b>.</p>
          <div class="em-bars" id="hs-ons"></div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="risk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Bubble risk</p><h2>Expensive isn't the same as <span class="accent">overvalued</span></h2></div></div>
        <div class="em-card">
          <p class="em-eyebrow">UBS Global Real Estate Bubble Index 2026</p>
          <p class="note">UBS rates how far prices have drifted from incomes, rents and the wider economy. Hong Kong is the least affordable market in the Demographia survey, yet UBS rates its bubble risk only as moderate.</p>
          <div class="hs-risk" id="hs-risk"></div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every market</p><h2>All ${r.length} markets, <span class="accent">ranked</span></h2></div></div>
        <div class="em-card">
          <input class="hs-search" id="hs-search" type="search" placeholder="Search a city or country" aria-label="Search markets">
          <div class="em-tablewrap hs-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="rank" aria-sort="ascending"><button type="button">Rank</button></th>
                <th data-key="market" aria-sort="none"><button type="button">Market</button></th>
                <th class="hide-n" data-key="nation" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="median_multiple" aria-sort="none"><button type="button">2025</button></th>
                <th class="r hide-n" data-key="median_multiple_prev" aria-sort="none"><button type="button">2024</button></th>
                <th class="r" data-key="change" aria-sort="none"><button type="button">Change</button></th>
                <th class="hide-n">Rating</th>
              </tr></thead>
              <tbody id="hs-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p>The <b>median multiple</b> is the median house price divided by the median gross annual household income, for each market's whole metropolitan area. Demographia compiles it for the third quarter of each year from national price and income sources. It measures purchase affordability only, not rents or mortgage costs.</p>
        <p>Markets are plotted at their main city using GeoNames coordinates; the "London Exurbs" market is plotted at Reading. The ONS ratio uses individual full-time earnings rather than household income, so it isn't directly comparable. UBS's bubble index measures overvaluation risk, not affordability.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${B.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">${storySteps()}</div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="em-vis"></div><div class="em-cites"></div></div></div>
        </div>
      </div>`;
      const p = { mode: "level", nation: "", sel: M.market },
        $ = new ue(t.querySelector("#hs-map"), {
          palette: [...F, ...Y],
          radius: (e) => 3 + e * 0.9,
          onPick: (e) => {
            (p.sel = e), A(), ae();
          },
        }),
        W = () => r.filter((e) => !p.nation || e.nation_code === p.nation),
        X = t.querySelector("#hs-scale");
      function A() {
        const e = W();
        e.some((a) => a.market === p.sel) ||
          (p.sel = [...e].sort(
            (a, o) => o.median_multiple - a.median_multiple,
          )[0].market),
          $.update(
            e.map((a) => {
              var m;
              const o = ce(a),
                g = f(a);
              return {
                id: a.market,
                iso_n3:
                  ((m = u.find((c) => c.nation_code === a.nation_code)) == null
                    ? void 0
                    : m.iso_n3) ?? "",
                lon: a.lon,
                lat: a.lat,
                value: a.median_multiple,
                cat:
                  p.mode === "level"
                    ? v(a.median_multiple)
                    : o == null
                      ? 6
                      : 5 + o,
                label: `${a.market} · ${l(a.median_multiple)}${g == null ? "" : ` (${y(g)})`}`,
              };
            }),
            p.sel,
          ),
          (X.innerHTML =
            p.mode === "level"
              ? i
                  .map(
                    (a, o) =>
                      `<span>${E(o)}${d(a.rating)} (${o === 0 ? "≤" + l(a.max) : o === 4 ? "≥" + l(a.min) : l(a.min) + "–" + l(a.max)})</span>`,
                  )
                  .join("") + "<span>Circle size = median multiple</span>"
              : ["More affordable", "No change or new", "Less affordable"]
                  .map(
                    (a, o) =>
                      `<span><i style="background:var(${Y[o]})"></i>${a}</span>`,
                  )
                  .join("")),
          z();
      }
      const V = t.querySelector("#hs-detail");
      function z() {
        const e = r.find((c) => c.market === p.sel),
          a = u.find((c) => c.nation_code === e.nation_code),
          o = f(e),
          g = v(e.median_multiple),
          m = (c, de) => `<dt>${d(c)}</dt><dd>${de}</dd>`;
        (V.innerHTML = `
        <p class="em-eyebrow">Selected market · Q3 2025</p>
        <p class="em-d-country">${d(e.market)}</p>
        <p class="em-d-value" ${s(e.source)}>${l(e.median_multiple)}×</p>
        <p class="em-d-usd">A median-priced home costs ${l(e.median_multiple)} years of median household income.</p>
        <p class="hs-rate">${E(g)}${d(i[g].rating)}</p>
        <dl class="em-d-list" style="margin-top:16px">
          ${m("Rank", `<span ${s(e.source)}>${e.rank} of ${r.length}</span>`)}
          ${m("Q3 2024", e.median_multiple_prev == null ? "Not surveyed" : `<span ${s(e.prev_source)}>${l(e.median_multiple_prev)}</span>`)}
          ${m("Change", o == null ? "n/a" : y(o))}
          ${m(d(C[e.nation_code]) + " median", `<span ${s(a.source)}>${l(a.median_multiple)}</span>`)}
          ${m("20% deposit", `${l(j(e.median_multiple, 0.2, 0.1))} yrs at 10% saved`)}
          ${e.plotted_at ? m("Plotted at", d(e.plotted_at)) : ""}
        </dl>
        <div class="em-cites"></div>`),
          B.footnotes(V);
      }
      t.querySelectorAll(".hs-mode").forEach((e) =>
        e.addEventListener("click", () => {
          (p.mode = e.dataset.mode),
            t
              .querySelectorAll(".hs-mode")
              .forEach((a) => a.setAttribute("aria-pressed", String(a === e))),
            A();
        }),
      ),
        t.querySelectorAll(".em-proj").forEach((e) =>
          e.addEventListener("click", () => {
            t
              .querySelectorAll(".em-proj")
              .forEach((a) => a.setAttribute("aria-pressed", String(a === e))),
              $.setProjection(e.dataset.proj);
          }),
        ),
        t.querySelectorAll(".hs-chip").forEach((e) =>
          e.addEventListener("click", () => {
            (p.nation = e.dataset.nation),
              t
                .querySelectorAll(".hs-chip")
                .forEach((a) =>
                  a.setAttribute("aria-pressed", String(a === e)),
                ),
              A(),
              $.focus(p.nation ? W().map((a) => a.market) : null);
          }),
        ),
        A();
      const S = t.querySelector("#hs-market"),
        x = t.querySelector("#hs-dep"),
        T = t.querySelector("#hs-sav"),
        ee = t.querySelector("#hs-out"),
        ae = () => {
          (S.value = p.sel), D();
        };
      function D() {
        const e = r.find((c) => c.market === S.value),
          a = Number(x.value) / 100,
          o = Number(T.value) / 100;
        (t.querySelector("#hs-dep-o").textContent = `${x.value}%`),
          (t.querySelector("#hs-sav-o").textContent = `${T.value}% of income`);
        const g = j(e.median_multiple, a, o),
          m = j(k.median_multiple, a, o);
        ee.innerHTML = `
        <div><p class="em-eyebrow">Years to save</p><div class="big accent" ${s(e.source)}>${l(g)}</div></div>
        <div><p class="em-eyebrow">Mortgage needed</p><div class="big" ${s(e.source)}>${l(_e(e.median_multiple, a))}×</div><p class="note" style="margin:6px 0 0">of household income</p></div>
        <div><p class="em-eyebrow">In ${d(k.market.split(",")[0])}</p><div class="big" ${s(k.source)}>${l(m)}</div><p class="note" style="margin:6px 0 0">years, the most affordable market</p></div>`;
      }
      (S.value = p.sel),
        [S, x, T].forEach((e) => e.addEventListener("input", D)),
        S.addEventListener("change", () => {
          (p.sel = S.value),
            (p.nation = ""),
            t
              .querySelectorAll(".hs-chip")
              .forEach((e) =>
                e.setAttribute("aria-pressed", String(e.dataset.nation === "")),
              ),
            A(),
            $.focus(null);
        }),
        D();
      const oe = u
        .filter((e) => e.nation_code !== "ALL")
        .sort((e, a) => a.median_multiple - e.median_multiple);
      const DEP = [M, r.find((e) => e.market.startsWith("Sydney")), r.find((e) => e.market === "Greater London"), r.find((e) => e.market.startsWith("Toronto")), r.find((e) => e.market.startsWith("New York")), r.find((e) => e.market === "Dublin"), k];
      R(
        t.querySelector("#hs-nations"),
        oe.map((e) => ({
          label: `${C[e.nation_code]}  ${y(e.median_multiple - e.median_multiple_prev)}`,
          value: e.median_multiple,
          muted: v(e.median_multiple) < 3,
          src: e.source,
        })),
        l,
        15,
        s,
      );
      const te = r.length;
      (t.querySelector("#hs-dist").innerHTML = `
      <div class="hs-dist" role="img" aria-label="${b.map((e) => `${e.rating}: ${e.n}`).join(", ")}">
        ${b.map((e, a) => (e.n ? `<span style="flex:${e.n};background:var(${F[a]})" ${s(i[a].source)}>${e.n}</span>` : "")).join("")}
      </div>
      <div class="hs-dist-legend">${b.map((e, a) => `<span>${E(a)} ${d(e.rating)} · <b>${e.n}</b> (${Math.round((100 * e.n) / te)}%)</span>`).join("")}</div>`),
        t.querySelectorAll(".hs-dist-legend i").forEach((e) => {
          e.style.cssText +=
            ";width:.7rem;height:.7rem;border-radius:50%;display:inline-block;vertical-align:-1px";
        });
      const ne = Math.max(...[...L, ...P].map((e) => Math.abs(e.d)));
      R(
        t.querySelector("#hs-movers"),
        [
          ...L.map((e) => ({
            group: "More affordable",
            label: e.market,
            value: Math.abs(e.d),
            muted: !1,
            src: e.prev_source,
          })),
          ...P.map((e) => ({
            group: "Less affordable",
            label: e.market,
            value: e.d,
            muted: !0,
            src: e.prev_source,
          })),
        ],
        (e) => e.toFixed(1),
        ne,
        s,
      ),
        t.querySelectorAll("#hs-movers .em-bars-fill").forEach((e, a) => {
          e.style.background =
            a < L.length ? "var(--hs-better)" : "var(--hs-worse)";
        }),
        t.querySelectorAll("#hs-movers .em-bars-val").forEach((e, a) => {
          e.textContent = (a < L.length ? "−" : "+") + e.textContent;
        }),
        R(
          t.querySelector("#hs-ons"),
          [...h]
            .sort((e, a) => a.ratio - e.ratio)
            .map((e) => ({
              label: `${e.area} · ${e.level.toLowerCase()}`,
              value: e.ratio,
              muted: e.area !== "England",
              src: e.source,
            })),
          l,
          26,
          s,
        );
      const ie = ["High", "Elevated", "Moderate", "Low"],
        re = ["--hs-r4", "--hs-r3", "--hs-r2", "--hs-r0"];
      t.querySelector("#hs-risk").innerHTML = ie
        .map(
          (e, a) => `
      <div><p class="lvl"><i style="background:var(${re[a]})"></i><span class="em-eyebrow">${d(e)} risk</span></p>
      <ul>${_.filter((o) => o.risk === e)
        .map((o) => `<li ${s(o.source)}>${d(o.city)}</li>`)
        .join("")}</ul></div>`,
        )
        .join("");
      const le = t.querySelector("#hs-tbody"),
        q = t.querySelector("#hs-search"),
        se = r.map((e) => ({ ...e, change: f(e) }));
      let G = "rank",
        H = 1;
      function O() {
        const e = q.value.trim().toLowerCase(),
          a = se
            .filter(
              (o) =>
                !e ||
                `${o.market} ${o.nation} ${C[o.nation_code]}`
                  .toLowerCase()
                  .includes(e),
            )
            .sort((o, g) => {
              const m = o[G],
                c = g[G];
              return m == null
                ? 1
                : c == null
                  ? -1
                  : (typeof m == "number"
                      ? m - c
                      : String(m).localeCompare(String(c))) * H;
            });
        le.innerHTML =
          a
            .map(
              (o) => `<tr>
        <td class="r" ${s(o.source)}>${o.rank}</td>
        <td>${d(o.market)}</td><td class="hide-n">${d(C[o.nation_code])}</td>
        <td class="r" ${s(o.source)}>${l(o.median_multiple)}</td>
        <td class="r hide-n" ${s(o.prev_source)}>${o.median_multiple_prev == null ? "n/a" : l(o.median_multiple_prev)}</td>
        <td class="r ${o.change == null ? "" : o.change < 0 ? "down" : o.change > 0 ? "up" : ""}">${o.change == null ? "new" : y(o.change)}</td>
        <td class="hide-n">${J(o.median_multiple)}</td></tr>`,
            )
            .join("") ||
          `<tr><td colspan="7">No market matches “${d(q.value)}”.</td></tr>`;
      }
      t.querySelectorAll(".em-table th[aria-sort]").forEach((e) =>
        e.querySelector("button").addEventListener("click", () => {
          const a = e.dataset.key;
          (H =
            G === a
              ? -H
              : a === "market" || a === "nation" || a === "rank"
                ? 1
                : -1),
            (G = a),
            t
              .querySelectorAll(".em-table th[aria-sort]")
              .forEach((o) =>
                o.setAttribute(
                  "aria-sort",
                  o === e ? (H > 0 ? "ascending" : "descending") : "none",
                ),
              ),
            O();
        }),
      ),
        q.addEventListener("input", O),
        O(),
        B.footnotes(t);
      const VIS = t.querySelector("#em-vis");
      var story = null;
      story = scrolly(t.querySelector('[data-view="story"]'), (e) => {
        VIS.innerHTML = storyVis(e);
        if (e === "nations")
          R(VIS.querySelector(".em-bars"), oe.map((a) => ({ label: C[a.nation_code], value: a.median_multiple, muted: v(a.median_multiple) < 3, src: a.source })), l, 15, s);
        if (e === "deposit")
          R(VIS.querySelector(".em-bars"), DEP.map((a) => ({ label: a.market.split(",")[0], value: j(a.median_multiple, 0.2, 0.1), muted: a !== M, src: a.source })), l, Math.ceil(j(M.median_multiple, 0.2, 0.1)), s);
        if (e === "uk")
          R(VIS.querySelector(".em-bars"), [...h].sort((a, r) => r.ratio - a.ratio).map((a) => ({ label: a.area, value: a.ratio, muted: a.area !== "Kensington and Chelsea", src: a.source })), l, 26, s);
        B.footnotes(VIS.closest(".em-card"));
      });
      t.querySelector(".em-todash").addEventListener("click", () => {
        n.querySelector('.em-viewbtn[data-view="dashboard"]').click();
      });
      function setView(e) {
        t.querySelectorAll(".em-view").forEach((a) => { a.hidden = a.dataset.view !== e; });
        e === "story" ? story && story.redraw() : $.map.resize();
      }
      IV && IV !== "dashboard" && n.querySelector(`.em-viewbtn[data-view="${IV}"]`)?.click();
      function storySteps() {
        const sy = r.find((e) => e.market.startsWith("Sydney")),
          kc = h.find((e) => e.area === "Kensington and Chelsea"),
          eng = h.find((e) => e.area === "England"),
          us = u.find((e) => e.nation_code === "US"),
          miami = _.find((e) => e.city === "Miami"),
          hkRisk = _.find((e) => e.city === "Hong Kong"),
          sev = b[3].n + b[4].n,
          top3 = u.filter((e) => e.nation_code !== "ALL").sort((e, a) => a.median_multiple - e.median_multiple).slice(0, 3).map((e) => C[e.nation_code]),
          step = (id, num, eb, head, txt, extra = "") =>
            `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${d(eb)}</p><h2>${head}</h2><p class="txt">${txt}</p>${extra}</article>`;
        return [
          step("top", "01", "The least affordable", `In ${d(M.market)}, a home costs <span class="accent"><b ${s(M.source)}>${l(M.median_multiple)} years</b></span> of household income.`,
            `That is the median house price divided by median household income. ${d(sy.market.split(",")[0])} is close behind at <b ${s(sy.source)}>${l(sy.median_multiple)}</b>.`),
          step("none", "02", "No affordable market", `Not one of the <b ${s(k.source)}>${r.length}</b> markets is <span class="accent">affordable</span>.`,
            `Demographia calls a multiple of ${l(i[0].max)} or less affordable. <b ${s(k.source)}>${sev}</b> markets, ${Math.round((100 * sev) / r.length)}%, are severely or impossibly unaffordable.`),
          step("nations", "03", "Country by country", `${d(top3[0])}, ${d(top3[1])} and ${d(top3[2])} have <span class="accent">the least affordable homes</span>.`,
            `The US median across its markets is <b ${s(us.source)}>${l(us.median_multiple)}</b>, among the lowest of the eight places surveyed.`),
          step("deposit", "04", "Saving a deposit", `A 20% deposit in ${d(M.market)} takes <span class="accent"><b ${s(M.source)}>${l(j(M.median_multiple, 0.2, 0.1))} years</b></span> to save.`,
            `That assumes a household on the local median income saves 10% of it each year. In ${d(k.market)} the same deposit takes <b ${s(k.source)}>${l(j(k.median_multiple, 0.2, 0.1))} years</b>.`),
          step("uk", "05", "Close-up · England", `In Kensington and Chelsea, a home costs <span class="accent"><b ${s(kc.source)}>${l(kc.ratio)} times</b></span> a full-time salary.`,
            `The ONS measure uses one worker's earnings, so it runs higher than Demographia's. England as a whole is <b ${s(eng.source)}>${l(eng.ratio)}</b>.`),
          step("bubble", "06", "Bubble risk", `Expensive isn't the same as <span class="accent">overvalued</span>.`,
            `UBS rates Hong Kong's bubble risk as <b ${s(hkRisk.source)}>${d(hkRisk.risk.toLowerCase())}</b>. Miami, far cheaper relative to income, is a level higher at <b ${s(miami.source)}>${d(miami.risk.toLowerCase())}</b>, down from the top of the index in the previous two editions. Only Zurich and Tokyo are rated high.`),
          step("end", "07", "Explore", `Find <span class="accent">your market</span>.`,
            "The dashboard has the full map, a deposit calculator for every market, the ONS ratios and every source.",
            '<p style="margin-top:24px"><span class="em-toggle"><button type="button" class="em-todash">Open the dashboard</button></span></p>'),
        ].join("");
      }
      function storyVis(e) {
        if (e === "top" || e === "end")
          return `<p class="vt">Median multiple · Q3 2025</p><div class="vbig" ${s(M.source)}>${l(M.median_multiple)}×</div><p class="vsub">${d(M.market)}, the least affordable of ${r.length} markets. A multiple of ${l(i[0].max)} or less counts as affordable.</p>`;
        if (e === "none") return `<p class="vt">${r.length} markets by rating · Q3 2025</p><div>${t.querySelector("#hs-dist").innerHTML}</div>`;
        if (e === "nations") return '<p class="vt">National median multiple · Q3 2025</p><div class="em-bars"></div>';
        if (e === "deposit") return '<p class="vt">Years to save a 20% deposit at 10% of income</p><div class="em-bars"></div>';
        if (e === "uk") return '<p class="vt">House price to earnings · ONS 2025</p><div class="em-bars"></div>';
        if (e === "bubble") return `<p class="vt">UBS bubble risk · 2026</p><div class="hs-risk">${t.querySelector("#hs-risk").innerHTML}</div>`;
        return "";
      }
      function K(e, a, o, g, m = !1) {
        return `<div class="em-kpi"><p class="em-eyebrow">${d(e)}</p><div class="big${m ? " accent" : ""}" ${s(g)}>${d(a)}</div><p class="sub">${d(o)}</p></div>`;
      }
    },
  };
export { He as default };
