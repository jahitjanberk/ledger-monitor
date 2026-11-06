// Fertiliser Prices & Supply dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--fz-b0", "--fz-b1", "--fz-b2", "--fz-b3", "--fz-b4"];
const MAPS = {
  nitrogen: { key: "nitrogen_band", label: "World map of countries coloured by nitrogen fertiliser used per hectare of cropland" },
  imports: { key: "imports_band", label: "World map of countries coloured by net fertiliser imports as a share of what their farms use" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym, long = false) => { const [y, m] = ym.split("-").map(Number); return `${(long ? MONTH : MON)[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const nf = (v, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const usd = (v) => (v == null ? "n/a" : `$${nf(Math.round(v))}`);
const pct = (v, d = 0) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const kg = (v) => (v == null ? "n/a" : `${nf(v, v < 10 ? 1 : 0)} kg`);
const kt = (v) => (v == null ? "n/a" : v >= 1000 ? `${nf(v / 1000, 2)} million t` : `${nf(v, v < 10 ? 1 : 0)} thousand t`);
const cssColor = (el, v) => {
  const s = document.createElement("span");
  s.style.color = `var(${v})`;
  s.style.display = "none";
  el.append(s);
  const c = getComputedStyle(s).color;
  s.remove();
  return c || "#888";
};
const COM = {
  urea: { name: "Urea", short: "Urea", what: "nitrogen, made from natural gas", v: "--fz-n" },
  dap: { name: "DAP (diammonium phosphate)", short: "DAP", what: "phosphate and nitrogen", v: "--fz-p" },
  tsp: { name: "TSP (triple superphosphate)", short: "TSP", what: "phosphate", v: "--fz-p" },
  potash: { name: "Potassium chloride (potash)", short: "Potash", what: "potassium, mined", v: "--fz-k" },
  phosphate_rock: { name: "Phosphate rock", short: "Phosphate rock", what: "the raw material for phosphate fertiliser", v: "--fz-muted" },
};
const NUTS = { n: "Nitrogen", p: "Phosphate", k: "Potash" };

export default {
  id: "fertilizer",
  title: "Fertiliser Prices & Supply",
  description:
    "What fertiliser costs, who makes and exports nitrogen, phosphate and potash, how much countries rely on imports, and how gas prices and the Strait of Hormuz closure feed through, from World Bank, FAO and Defra data, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year;
    const P = DATA.prices, last = P.at(-1), PS = "wb-pinksheet", FS = "faostat-rfn";
    const pm = (ym) => P.find((r) => r.month === ym);
    // The last earlier month with a price at or above the latest one.
    const since = (k) => [...P].reverse().slice(1).find((r) => r[k] != null && r[k] >= last[k])?.month;
    const feb = pm("2026-02"), y26 = P.filter((r) => r.month >= "2026-01");
    const ureaPeak = y26.reduce((a, b) => (b.urea > a.urea ? b : a));
    const ureaRise = (100 * (ureaPeak.urea - feb.urea)) / feb.urea;
    const dapSince = since("dap"), gasSince = since("gas_europe");
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const FC = Object.fromEntries(DATA.forecasts.map((x) => [x.id, x]));
    const W = DATA.world, w0 = W.find((r) => r.year === 2000), wY = W.at(-1), w61 = W[0];
    const REG = DATA.regions, reg = (name, y = Y) => REG.find((r) => r.region === name && r.year === y);
    const africa = reg("Africa"), asia = reg("Asia"), wreg = reg("World"), ldc = reg("Least developed countries");
    const PR = DATA.producers, top = (nu, m) => PR.filter((r) => r.nutrient_id === nu && r.measure === m);
    const kTop3 = top("k", "production").slice(0, 3), kTop3Share = kTop3.reduce((s, r) => s + r.share_pct, 0);
    const pExp = top("p", "exports")[0], nExp = top("n", "exports")[0];
    const G = DATA.gulf.filter((r) => r.n_share_pct >= 0.5), gulfN = DATA.gulf.reduce((s, r) => s + (r.n_share_pct ?? 0), 0), gulfP = DATA.gulf.reduce((s, r) => s + (r.p_share_pct ?? 0), 0);
    const dep95 = C.filter((r) => r.import_dep_pct != null && r.import_dep_pct >= 95), depN = C.filter((r) => r.import_dep_pct != null).length;
    const UKP = DATA.uk_prices, ukl = UKP.at(-1), ukPeak = UKP.reduce((a, b) => (b.fertilisers > a.fertilisers ? b : a));
    const UKR = DATA.uk_rates, ukr = UKR.at(-1), ukr0 = UKR[0];
    const uk = BY.GBR;
    // Tonnes of maize that buy a tonne of urea.
    const AFF = P.filter((r) => r.urea != null && r.maize != null).map((r) => ({ month: r.month, v: r.urea / r.maize }));
    const affBase = AFF.filter((r) => r.month >= "2015-01" && r.month <= "2019-12"), affAvg = affBase.reduce((s, r) => s + r.v, 0) / affBase.length;
    const affNow = AFF.at(-1), affPeak26 = AFF.filter((r) => r.month >= "2026-01").reduce((a, b) => (b.v > a.v ? b : a));

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "fertilizer",
      name: "Fertiliser",
      views: [{ id: "dashboard", label: "Dashboard" }, { id: "story", label: "Story" }],
      onView: (v) => setView(v),
      onTheme: () => { repaint(); story.redraw(); },
    });
    const src = new Sources(SOURCES, root);
    const t = (...ids) => src.attr(...ids);
    const dot = (v) => `<i style="background:var(${v})"></i>`;
    const kpi = (label, value, sub, s, accent = false) =>
      `<div class="em-kpi"><p class="em-eyebrow">${esc(label)}</p><div class="big${accent ? " accent" : ""}" ${t(s)}>${esc(value)}</div><p class="sub">${sub}</p></div>`;
    const factCard = (eyebrow, s, bigText, note, hl = false) =>
      `<div class="em-card${hl ? " hl" : ""}"><p class="em-eyebrow">${esc(eyebrow)}</p><div class="em-big" ${t(s)}>${bigText}</div><p class="note">${note}</p><div class="em-cites"></div></div>`;
    const step = (id, num, eyebrow, h, txt) =>
      `<article class="em-step" data-step="${id}"><p class="em-eyebrow"><span class="num">${num}</span>${esc(eyebrow)}</p><h2>${h}</h2><p class="txt">${txt}</p></article>`;
    const options = [...C].sort((a, b) => a.country.localeCompare(b.country));
    const closure = new Date(f.closure.value + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Fertiliser · World Bank prices to ${monthName(last.month)}, FAO data to ${Y}</p>
        <h1>Phosphate fertiliser is at <b>its highest price since ${monthName(dapSince, true)}</b>, <span class="accent">while urea has fallen back from its Hormuz spike</span></h1>
        <p class="em-lede">After the Strait of Hormuz was declared closed on <b ${t(f.closure.source)}>${closure}</b>, the price of urea, a nitrogen fertiliser, rose <b ${t(PS)}>${pct(ureaRise)}</b> in two months to <b ${t(PS)}>${usd(ureaPeak.urea)}</b> in ${monthName(ureaPeak.month, true)}. By ${monthName(last.month, true)} it was <b ${t(PS)}>${usd(last.urea)}</b>. DAP, a phosphate fertiliser, reached <b ${t(PS)}>${usd(last.dap)}</b> a tonne. European natural gas cost <b ${t(PS)}>$${last.gas_europe.toFixed(1)}</b> per million British thermal units, the most since ${monthName(gasSince, true)}. The World Bank expects fertiliser prices to average <b ${t(FC.fert_index.source)}>${pct(FC.fert_index.chg2026_pct, 0)}</b> more in 2026 than in 2025.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Nitrogen spiked and eased; <span class="accent">phosphate kept climbing</span></h2></div></div>
        <div class="em-kpis">
          ${kpi(`Urea · ${monthName(last.month)}`, `${usd(last.urea)}/t`, `Down from <span ${t(PS)}>${usd(ureaPeak.urea)}</span> in ${monthName(ureaPeak.month)}, against <span ${t(PS)}>${usd(feb.urea)}</span> in February before the closure`, PS, true)}
          ${kpi(`DAP · ${monthName(last.month)}`, `${usd(last.dap)}/t`, `The highest since ${monthName(dapSince)}. Up from <span ${t(PS)}>${usd(feb.dap)}</span> in February`, PS)}
          ${kpi(`Potash · ${monthName(last.month)}`, `${usd(last.potash)}/t`, `Mined, mostly in Canada, Russia and Belarus, so less tied to gas or the Gulf. <span ${t(PS)}>${usd(feb.potash)}</span> in February`, PS)}
          ${kpi("World nitrogen used on farms", `${nf(wY.n_use_mt, 0)} million t`, `In ${Y}, up from <span ${t(FS)}>${nf(w0.n_use_mt, 0)} million</span> in 2000 and <span ${t(FS)}>${nf(w61.n_use_mt, 0)} million</span> in ${w61.year}`, FS)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Who uses fertiliser, and <span class="accent">who has to import it</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="fz-mode" data-mode="nitrogen" aria-pressed="true">Nitrogen per hectare</button>
                <button type="button" class="fz-mode" data-mode="imports" aria-pressed="false">Import reliance</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="fz-map" role="region" aria-label="${MAPS.nitrogen.label}"></div>
            <div class="fz-scale" id="fz-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="fz-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="prices">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Prices</p><h2>Fertiliser prices since 1990, and <span class="accent">what farmers can afford</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World Bank Pink Sheet · US$ a tonne, monthly, January 1990 to ${monthName(last.month)}</p>
            <h3 id="fz-com-h"></h3>
            <div class="em-toggle fz-tg" role="group" aria-label="Fertiliser">
              ${Object.entries(COM).map(([k, c], i) => `<button type="button" class="fz-com" data-com="${k}" aria-pressed="${i === 0}">${esc(c.short)}</button>`).join("")}
            </div>
            <p class="note" id="fz-com-note"></p>
            <div id="fz-price"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Tonnes of maize it takes to buy a tonne of urea · monthly</p>
            <h3>A tonne of urea cost ${affPeak26.v.toFixed(1)} tonnes of maize in ${monthName(affPeak26.month)}, against ${affAvg.toFixed(1)} on average in 2015–2019</h3>
            <p class="note">The urea price divided by the US maize export price, both from the World Bank. A higher ratio means fertiliser is less affordable for grain farmers; the dashed line is the 2015–2019 average. In ${monthName(affNow.month)} it was <b ${t(PS)}>${affNow.v.toFixed(1)}</b>. The World Bank said affordability in April was the weakest since <b ${t(f.afford.source)}>${esc(f.afford.value)}</b>.</p>
            <div id="fz-aff"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World Bank forecasts · annual averages, US$ a tonne</p>
            <h3>The World Bank cut its 2026 urea forecast from ${usd(FC.urea.april_f2026)} in April to ${usd(FC.urea.f2026)} in October</h3>
            <p class="note">October 2026 forecasts, with April's for comparison. Forecasts assume the conflicts disrupting supply do not escalate.</p>
            <div class="em-tablewrap"><table class="em-table fz-fc">
              <thead><tr><th>Fertiliser</th><th class="r">2025</th><th class="r">2026 forecast</th><th class="r">2027 forecast</th><th class="r hide-n">April's 2026 forecast</th></tr></thead>
              <tbody>${DATA.forecasts.map((r) => `<tr><td>${esc(r.commodity)}${r.unit === "$/t" ? "" : ` <span class="fz-x">${esc(r.unit)}</span>`}</td><td class="r" ${t(r.source)}>${nf(r.y2025, r.unit === "$/t" ? 0 : 1)}</td><td class="r" ${t(r.source)}>${nf(r.f2026, r.unit === "$/t" ? 0 : 1)} <span class="fz-x">${r.chg2026_pct > 0 ? "+" : ""}${r.chg2026_pct.toFixed(0)}%</span></td><td class="r" ${t(r.source)}>${nf(r.f2027, r.unit === "$/t" ? 0 : 1)}</td><td class="r hide-n" ${t(r.source)}>${nf(r.april_f2026, r.unit === "$/t" ? 0 : 1)}</td></tr>`).join("")}</tbody>
            </table></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="energy">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Gas and the Gulf</p><h2>Nitrogen fertiliser is <span class="accent">made from natural gas</span></h2></div></div>
        <p class="em-lede fz-lede2">Ammonia, the base of urea and other nitrogen fertilisers, is made by combining nitrogen from the air with hydrogen, mostly taken from natural gas. When gas gets dearer, so does nitrogen fertiliser, and Gulf states are major exporters. The <a href="../chokepoints/index.html">Chokepoints</a> and <a href="../food/index.html">Food</a> dashboards follow the shipping and the food prices.</p>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Natural gas, Europe · $ per million British thermal units, monthly</p>
            <h3>European gas: $${last.gas_europe.toFixed(1)} in ${monthName(last.month)}</h3>
            <div id="fz-gas"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Urea, f.o.b. Middle East · US$ a tonne, monthly</p>
            <h3>Urea: ${usd(last.urea)} in ${monthName(last.month)}</h3>
            <div id="fz-urea"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Share of world nitrogen exports · ${Y}</p>
            <h3>Gulf states shipped ${pct(gulfN, 0)} of the world's nitrogen fertiliser exports in ${Y}</h3>
            <p class="note">Before the war, as recorded by FAO. Saudi Arabia also supplied ${pct(DATA.gulf.find((r) => r.iso3 === "SAU")?.p_share_pct, 0)} of phosphate exports. FAO's figures record almost no exports from Iran, so the Gulf share is likely to be understated. The World Bank puts the Middle East at <b ${t(f.me_urea.source)}>nearly a quarter</b> of world urea exports.</p>
            <div class="em-bars" id="fz-gulf"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="supply">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Who makes it</p><h2>Three countries mine <span class="accent">${pct(kTop3Share, 0)} of the world's potash</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Largest producers and exporters · share of the world total, ${Y}</p>
            <h3 id="fz-sup-h"></h3>
            <div class="fz-tools">
              <div class="em-toggle" role="group" aria-label="Nutrient">
                ${Object.entries(NUTS).map(([k, n], i) => `<button type="button" class="fz-nut" data-nut="${k}" aria-pressed="${k === "k"}">${n}</button>`).join("")}
              </div>
              <div class="em-toggle" role="group" aria-label="Measure">
                <button type="button" class="fz-meas" data-meas="production" aria-pressed="true">Production</button>
                <button type="button" class="fz-meas" data-meas="exports" aria-pressed="false">Exports</button>
              </div>
            </div>
            <p class="note">Tonnes of nutrient: nitrogen as N, phosphate as P<sub>2</sub>O<sub>5</sub>, potash as K<sub>2</sub>O. Trade figures are partly estimated by FAO from partner countries' records.</p>
            <div class="em-bars" id="fz-sup"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Phosphate exports", FS, pct(pExp.share_pct, 0), `of the world's phosphate fertiliser exports came from ${esc(pExp.country)} in ${Y}, the largest single supplier.`, true)}
          ${factCard("Nitrogen exports", FS, pct(nExp.share_pct, 0), `of nitrogen exports came from ${esc(nExp.country)}, the largest exporter, in ${Y}.`)}
          ${factCard("Reliance on imports", FS, `${dep95.length} of ${depN}`, `countries with data imported, net, at least 95% of the fertiliser nutrients their farms used in ${Y}.`)}
        </div>
      </section>

      <section class="em-sec" id="use">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Who uses it</p><h2>Africa's farms use <span class="accent">${kg(africa.n_per_ha)} of nitrogen a hectare</span>; Asia's use ${kg(asia.n_per_ha)}</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Nitrogen fertiliser per hectare of cropland · kg, ${REG[0].year} to ${Y}</p>
            <h3>The world average rose from ${kg(reg("World", 1961).n_per_ha)} in 1961 to ${kg(wreg.n_per_ha)} in ${Y}</h3>
            <p class="note">Mineral fertiliser only, not manure. Too little fertiliser holds down yields on poor soils; too much washes into rivers and releases nitrous oxide, a greenhouse gas. The least developed countries used <b ${t(FS)}>${kg(ldc.n_per_ha)}</b> a hectare.</p>
            <div id="fz-reg"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("All three nutrients", FS, `${nf(wY.n_use_mt + wY.p_use_mt + wY.k_use_mt, 0)} million t`, `of nitrogen, phosphate and potash were used on the world's farms in ${Y}: <b ${t(FS)}>${nf(wY.n_use_mt, 0)}m</b> N, <b ${t(FS)}>${nf(wY.p_use_mt, 0)}m</b> P<sub>2</sub>O<sub>5</sub> and <b ${t(FS)}>${nf(wY.k_use_mt, 0)}m</b> K<sub>2</sub>O.`, true)}
          ${factCard("Per hectare, all nutrients", FS, kg(asia.npk_per_ha), `of N, P<sub>2</sub>O<sub>5</sub> and K<sub>2</sub>O a hectare in Asia in ${Y}, against <b ${t(FS)}>${kg(africa.npk_per_ha)}</b> in Africa and <b ${t(FS)}>${kg(wreg.npk_per_ha)}</b> worldwide.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Close to home</p><h2>UK farmers paid <span class="accent">${Math.round(ukl.fertilisers - 100)}% more</span> for fertiliser in ${monthName(ukl.month, true)} than in 2020</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">UK agricultural price indices · 2020 = 100, monthly, ${monthName(UKP[0].month)} to ${monthName(ukl.month)}</p>
            <h3>Fertiliser prices peaked at ${nf(ukPeak.fertilisers, 0)} in ${monthName(ukPeak.month)}; wheat is at ${nf(ukl.wheat, 0)}</h3>
            <p class="note">What farmers pay for fertilisers and soil improvers, against what they get for wheat. When the gap widens, fertilising a crop pays less. UK input prices overall rose <b ${t(f.ukinputs.source)}>${f.ukinputs.value}%</b> in the year to ${monthName(ukl.month, true)}.</p>
            <div class="fz-key"><span>${dot("--em-accent")}Fertilisers</span><span>${dot("--fz-p")}Wheat</span></div>
            <div id="fz-ukp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Nitrogen applied in Great Britain · kg per hectare, all fields, ${ukr0.year} to ${ukr.year}</p>
            <h3>Grassland gets ${kg(ukr.n_grass)} of nitrogen a hectare, down from ${kg(ukr0.n_grass)} in ${ukr0.year}</h3>
            <p class="note">Averaged over all fields, including those given none. Tillage crops such as wheat get <b ${t("defra-bsfp")}>${kg(ukr.n_crops)}</b>. Rates fell sharply in 2022, when prices peaked.</p>
            <div class="fz-key"><span>${dot("--em-accent")}Tillage crops</span><span>${dot("--fz-k")}Grassland</span></div>
            <div id="fz-ukr"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("UK reliance on imports", FS, pct(uk.n_import_dep_pct, 0), `of the nitrogen used on UK farms in ${uk.year} was imported, net: <b ${t(FS)}>${kt(uk.n_imp_kt)}</b> in, against <b ${t(FS)}>${kt(uk.n_prod_kt)}</b> made at home.`, true)}
          ${factCard("UK nitrogen use", FS, kg(uk.n_per_ha), `of nitrogen per hectare of cropland in ${uk.year}, down from <b ${t(FS)}>${kg(uk.n_per_ha_2000)}</b> in 2000. FAO's cropland leaves out permanent grassland, so fertiliser spread on grass raises this figure.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="fz-search" id="fz-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap fz-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="n_per_ha" aria-sort="descending"><button type="button">N, kg/ha</button></th>
                <th class="r" data-key="import_dep_pct" aria-sort="none"><button type="button">Net imports, % of use</button></th>
                <th class="r hide-n" data-key="npk_per_ha" aria-sort="none"><button type="button">N+P+K, kg/ha</button></th>
                <th class="r hide-n" data-key="n_use_kt" aria-sort="none"><button type="button">N used, 000 t</button></th>
                <th class="r hide-n" data-key="n_prod_kt" aria-sort="none"><button type="button">N made, 000 t</button></th>
              </tr></thead>
              <tbody id="fz-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">09</span>Method</p>
        <p><b>Prices</b> are the World Bank's monthly Pink Sheet (November 2026), in nominal US dollars: urea f.o.b. Middle East (Black Sea before March 2022), DAP f.o.b. US Gulf, TSP imported to the US Gulf, potassium chloride delivered to Brazil and phosphate rock f.o.b. North Africa. They are international spot prices, not what farmers pay at the farm gate, which also includes shipping, margins and local taxes. <b>Affordability</b> divides the urea price by the US maize export price. <b>Forecasts</b> are the World Bank's October 2026 Commodity Markets Outlook.</p>
        <p><b>Use, production and trade</b> are FAOSTAT's Fertilizers by Nutrient (July 2026 update), in tonnes of nutrient, ${Y} for nearly all countries. <b>Per hectare</b> divides agricultural use by cropland (arable land and permanent crops). <b>Import reliance</b> is imports minus exports of all three nutrients as a share of agricultural use; a negative value means a net exporter, and values above 100% can reflect stockbuilding or gaps in the trade records. FAO fills missing national reports with estimates and partners' trade records. <b>UK</b> prices are Defra's agricultural price indices (2020 = 100); application rates are the British Survey of Fertiliser Practice, which covers Great Britain.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("spike", "01", "The spike", `Urea rose <span class="accent">${pct(ureaRise)}</span> in two months`, `From <b ${t(PS)}>${usd(feb.urea)}</b> a tonne in February 2026 to <b ${t(PS)}>${usd(ureaPeak.urea)}</b> in ${monthName(ureaPeak.month, true)}, after the Strait of Hormuz closed. It was back to ${usd(last.urea)} by ${monthName(last.month, true)}.`)}
            ${step("dap", "02", "Phosphate", `DAP reached <span class="accent">${usd(last.dap)}</span> a tonne`, `The highest since ${monthName(dapSince, true)}. ${esc(pExp.country)} supplies <b ${t(FS)}>${pct(pExp.share_pct, 0)}</b> of phosphate exports.`)}
            ${step("gas", "03", "Gas", `European gas is at its highest <span class="accent">since ${monthName(gasSince)}</span>`, `Most nitrogen fertiliser is made from natural gas, so dearer gas means dearer nitrogen.`)}
            ${step("supply", "04", "Supply", `Three countries mine <span class="accent">${pct(kTop3Share, 0)}</span> of the world's potash`, `${kTop3.map((r) => esc(r.country)).join(", ")}.`)}
            ${step("use", "05", "Use", `Africa uses <span class="accent">${kg(africa.n_per_ha)}</span> of nitrogen a hectare`, `Against ${kg(asia.n_per_ha)} in Asia and ${kg(wreg.n_per_ha)} worldwide in ${Y}.`)}
            ${step("uk", "06", "The UK", `UK fertiliser prices are <span class="accent">${Math.round(ukl.fertilisers - 100)}%</span> above 2020`, `And the UK imports, net, <b ${t(FS)}>${pct(uk.n_import_dep_pct, 0)}</b> of the nitrogen its farms use.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="fz-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "nitrogen", sel: "IND", com: "urea", nut: "k", meas: "production" };
    const mapEl = main.querySelector("#fz-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return { ...ft, properties: { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name, nitrogen: r ? bandIdx("nitrogen", r.nitrogen_band) : -1, imports: r ? bandIdx("imports", r.imports_band) : -1 } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: SEQ.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const depText = (v) => (v == null ? "no import figure" : v < 0 ? "net exporter" : `net imports ${pct(v)} of use`);
    const valueText = (r, mode) =>
      mode === "nitrogen" ? (r.n_per_ha != null ? `${kg(r.n_per_ha)} of nitrogen a hectare` : "No figure") : depText(r.import_dep_pct);
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
    const scaleEl = main.querySelector("#fz-scale");
    const SCALE_TITLE = { nitrogen: `Nitrogen per hectare of cropland, ${Y}:`, imports: `Net imports as a share of use, N + P + K, ${Y}:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#fz-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const s = (v) => `<span ${t(r.source)}>${v}</span>`;
      const head = state.mode === "nitrogen"
        ? { eb: `Nitrogen per hectare of cropland · ${r.year}`, big: kg(r.n_per_ha), sub: `world average <span ${t(FS)}>${kg(wreg.n_per_ha)}</span>` }
        : { eb: `Net imports as a share of use · ${r.year}`, big: r.import_dep_pct == null ? "n/a" : r.import_dep_pct < 0 ? "Net exporter" : pct(r.import_dep_pct), sub: r.n_import_dep_pct == null ? "" : r.n_import_dep_pct < 0 ? "a net exporter of nitrogen" : `nitrogen alone: <span ${t(r.source)}>${pct(r.n_import_dep_pct)}</span>` };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="fz-pick"><span class="em-eyebrow">Choose</span><select id="fz-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${t(r.source)}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.n_per_ha != null ? row("Nitrogen (N) a hectare", s(kg(r.n_per_ha))) : ""}
          ${r.p_per_ha != null ? row("Phosphate (P₂O₅) a hectare", s(kg(r.p_per_ha))) : ""}
          ${r.k_per_ha != null ? row("Potash (K₂O) a hectare", s(kg(r.k_per_ha))) : ""}
          ${r.n_per_ha_2000 != null ? row("Nitrogen a hectare · 2000", s(kg(r.n_per_ha_2000))) : ""}
          ${r.n_use_kt != null ? row("Nitrogen used on farms", s(kt(r.n_use_kt))) : ""}
          ${r.n_prod_kt != null ? row("Nitrogen made", s(kt(r.n_prod_kt))) : ""}
          ${r.n_imp_kt != null ? row("Nitrogen imported", s(kt(r.n_imp_kt))) : ""}
          ${r.n_exp_kt != null ? row("Nitrogen exported", s(kt(r.n_exp_kt))) : ""}
          ${state.mode !== "imports" && r.import_dep_pct != null ? row("Net imports, all nutrients", s(r.import_dep_pct < 0 ? "net exporter" : `${pct(r.import_dep_pct)} of use`)) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#fz-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".fz-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".fz-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash, noEnd, endText }].
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(280, el.clientWidth), narrow = wd < 520;
      const endLen = Math.max(0, ...series.filter((s) => !s.noEnd).map((s) => `${s.name ? (narrow ? s.short ?? s.name : s.name) + " " : ""}${s.endText ?? ""}`.length));
      const pad = { t: 12, r: Math.max(58, 26 + endLen * 6.8), b: 22, l: 44 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.filter((s) => !s.noEnd).map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 80) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="fz-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="fz-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.thin ? 1.6 : 2.2}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const steps = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const niceMax = (v, step) => Math.ceil(v / step) * step;
    const mser = (rows, k) => rows.filter((r) => r[k] != null).map((r) => [xOf(r.month), r[k]]);
    const drawPrice = (el, h, k = state.com, from = "1990-01") => {
      const rows = P.filter((r) => r.month >= from && r[k] != null), max = Math.max(...rows.map((r) => r[k]));
      const step = max > 1000 ? 250 : max > 400 ? 200 : 50;
      lineChart(el, {
        series: [{ v: COM[k].v, pts: mser(rows, k), endText: usd(rows.at(-1)[k]) }], yMax: niceMax(max, step), yStep: step, fmtY: (v) => `$${nf(v)}`,
        xTicks: steps(+from.slice(0, 4), 2026, from >= "2020" ? 1 : 5), xEnd: monthName(rows.at(-1).month), h, area: true,
        aria: `${COM[k].name}, US dollars a tonne: ${usd(rows[0][k])} in ${monthName(rows[0].month)}, a high of ${usd(max)} in ${monthName(rows.find((r) => r[k] === max).month)}, ${usd(rows.at(-1)[k])} in ${monthName(rows.at(-1).month)}`,
      });
    };
    const comH = main.querySelector("#fz-com-h"), comNote = main.querySelector("#fz-com-note");
    const drawComText = () => {
      const k = state.com, rows = P.filter((r) => r[k] != null), max = rows.reduce((a, b) => (b[k] > a[k] ? b : a)), s = since(k);
      comH.textContent = `${COM[k].name}: ${usd(last[k])} a tonne in ${monthName(last.month)}`;
      comNote.innerHTML = `${esc(COM[k].name)} supplies ${esc(COM[k].what)}. The highest monthly price since 1990 was <b ${t(PS)}>${usd(max[k])}</b> in ${monthName(max.month, true)}. ${s ? `The latest price is the highest since ${monthName(s, true)}.` : "The latest price is the highest on record."}`;
      src.footnotes(comNote.closest(".em-card"));
    };
    const drawAff = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: AFF.map((r) => [xOf(r.month), r.v]), endText: affNow.v.toFixed(1) }], yMax: niceMax(Math.max(...AFF.map((r) => r.v)), 1), yStep: 1, fmtY: (v) => String(v),
      xTicks: steps(1990, 2026, 5), xEnd: monthName(affNow.month), h, area: true, ref: { v: affAvg },
      aria: `Tonnes of maize per tonne of urea: ${AFF[0].v.toFixed(1)} in ${monthName(AFF[0].month)}, ${affPeak26.v.toFixed(1)} in ${monthName(affPeak26.month)}, ${affNow.v.toFixed(1)} in ${monthName(affNow.month)}`,
    });
    const recent = P.filter((r) => r.month >= "2019-01");
    const drawGas = (el, h) => { const mx = Math.max(...recent.map((r) => r.gas_europe)); lineChart(el, {
      series: [{ v: "--fz-gas", pts: mser(recent, "gas_europe"), endText: `$${last.gas_europe.toFixed(1)}` }], yMax: niceMax(mx, 10), yStep: 10, fmtY: (v) => `$${v}`,
      xTicks: steps(2019, 2026, 1), xEnd: monthName(last.month), h, area: true,
      aria: `Natural gas in Europe, dollars per million British thermal units, monthly since January 2019, peaking at $${mx.toFixed(1)}, $${last.gas_europe.toFixed(1)} in ${monthName(last.month)}`,
    }); };
    const drawUrea = (el, h) => drawPrice(el, h, "urea", "2019-01");
    const drawGulf = (el) => bars(el, G.map((r, i) => ({ label: r.country, value: r.n_share_pct, muted: i > 0, src: r.source })), (v) => pct(v, 1), G[0].n_share_pct, t);
    const supH = main.querySelector("#fz-sup-h");
    const drawSup = (el, nu = state.nut, m = state.meas) => {
      const rows = top(nu, m);
      bars(el, rows.map((r, i) => ({ label: r.country, value: r.share_pct, muted: i > 2, src: r.source })), (v) => pct(v, 1), rows[0].share_pct, t);
      if (el.id === "fz-sup") {
        const s3 = rows.slice(0, 3).reduce((s, r) => s + r.share_pct, 0);
        supH.textContent = `${NUTS[nu]}: the top three supplied ${pct(s3, 0)} of world ${m} in ${Y}`;
      }
    };
    const RS = [["World", "World", "--em-accent"], ["Asia", "Asia", "--fz-k"], ["Americas", "Americas", "--fz-gas"], ["Europe", "Europe", "--fz-muted"], ["Africa", "Africa", "--fz-p"]];
    const drawReg = (el, h) => lineChart(el, {
      series: RS.map(([name, short, v]) => ({ name, short, v, pts: REG.filter((r) => r.region === name && r.n_per_ha != null).map((r) => [r.year, r.n_per_ha]), endText: kg(reg(name).n_per_ha) })),
      yMax: niceMax(Math.max(...REG.filter((r) => RS.some((s) => s[0] === r.region)).map((r) => r.n_per_ha ?? 0)), 20), yStep: 20, fmtY: (v) => String(v), xTicks: steps(1965, 2020, 10), h,
      aria: `Nitrogen fertiliser per hectare of cropland in ${Y}: ${RS.map(([n]) => `${n} ${kg(reg(n).n_per_ha)}`).join(", ")}`,
    });
    const drawUkp = (el, h) => lineChart(el, {
      series: [{ name: "Fertilisers", short: "Fertiliser", v: "--em-accent", pts: mser(UKP, "fertilisers"), endText: nf(ukl.fertilisers, 0) }, { name: "Wheat", short: "Wheat", v: "--fz-p", pts: mser(UKP, "wheat"), endText: nf(ukl.wheat, 0) }],
      yMax: niceMax(Math.max(...UKP.map((r) => r.fertilisers)), 50), yStep: 50, fmtY: (v) => String(v), ref: { v: 100 }, xTicks: steps(2014, 2026, 2), xEnd: monthName(ukl.month), h,
      aria: `UK price indices, 2020 = 100: fertilisers ${nf(UKP[0].fertilisers, 0)} in ${monthName(UKP[0].month)}, ${nf(ukPeak.fertilisers, 0)} in ${monthName(ukPeak.month)}, ${nf(ukl.fertilisers, 0)} in ${monthName(ukl.month)}; wheat ${nf(ukl.wheat, 0)}`,
    });
    const drawUkr = (el, h) => lineChart(el, {
      series: [{ name: "Tillage crops", short: "Crops", v: "--em-accent", pts: UKR.filter((r) => r.n_crops != null).map((r) => [r.year, r.n_crops]), endText: kg(ukr.n_crops) }, { name: "Grassland", short: "Grass", v: "--fz-k", pts: UKR.filter((r) => r.n_grass != null).map((r) => [r.year, r.n_grass]), endText: kg(ukr.n_grass) }],
      yMax: 160, yStep: 40, fmtY: (v) => String(v), xTicks: steps(1995, 2025, 5), h,
      aria: `Nitrogen applied in Great Britain, kg a hectare: tillage crops ${kg(ukr0.n_crops)} in ${ukr0.year} and ${kg(ukr.n_crops)} in ${ukr.year}; grassland ${kg(ukr0.n_grass)} and ${kg(ukr.n_grass)}`,
    });
    const drawAll = () => {
      drawPrice(main.querySelector("#fz-price"), 260);
      drawAff(main.querySelector("#fz-aff"), 220);
      drawGas(main.querySelector("#fz-gas"), 200);
      drawUrea(main.querySelector("#fz-urea"), 200);
      drawReg(main.querySelector("#fz-reg"), 260);
      drawUkp(main.querySelector("#fz-ukp"), 230);
      drawUkr(main.querySelector("#fz-ukr"), 220);
    };
    drawAll();
    drawComText();
    drawGulf(main.querySelector("#fz-gulf"));
    drawSup(main.querySelector("#fz-sup"));
    main.querySelectorAll(".fz-com").forEach((b) => b.addEventListener("click", () => {
      state.com = b.dataset.com;
      main.querySelectorAll(".fz-com").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      drawPrice(main.querySelector("#fz-price"), 260);
      drawComText();
    }));
    const supTool = (cls, key) => main.querySelectorAll(cls).forEach((b) => b.addEventListener("click", () => {
      state[key] = b.dataset[key];
      main.querySelectorAll(cls).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      drawSup(main.querySelector("#fz-sup"));
      src.footnotes(main.querySelector("#fz-sup").closest(".em-card"));
    }));
    supTool(".fz-nut", "nut");
    supTool(".fz-meas", "meas");

    // ---------- Table ----------
    const tbody = main.querySelector("#fz-tbody"), search = main.querySelector("#fz-search");
    let key = "n_per_ha", dir = -1;
    const cell = (v, s, hide, d = 0) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : nf(v, d)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="fz-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.n_per_ha != null ? t(r.source) : ""}>${r.nitrogen_band ? `<i class="fz-sw" style="background:var(${SEQ[bandIdx("nitrogen", r.nitrogen_band)]})"></i>${nf(r.n_per_ha, 1)}` : "–"}</td>
        <td class="r" ${r.import_dep_pct != null ? t(r.source) : ""}>${r.import_dep_pct == null ? "–" : r.import_dep_pct < 0 ? "Net exporter" : nf(r.import_dep_pct)}</td>
        ${cell(r.npk_per_ha, r.source, true, 1)}
        ${cell(r.n_use_kt, r.source, true, 1)}
        ${cell(r.n_prod_kt, r.source, true, 1)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".fz-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#fz-vis");
    function miniMap(el, mode) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", MAPS[mode].label);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso], i = r ? bandIdx(mode, r[MAPS[mode].key]) : -1; return i < 0 ? "var(--em-land)" : `var(${SEQ[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${valueText(r, mode)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = (mode) => `<div class="fz-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "spike") {
        vis.innerHTML = `<p class="vt">Urea, US$ a tonne, since 2019</p><div class="m"></div>`;
        drawUrea(vis.querySelector(".m"), 240);
      } else if (id === "dap") {
        vis.innerHTML = `<p class="vt">DAP, US$ a tonne, since 1990</p><div class="m"></div>`;
        drawPrice(vis.querySelector(".m"), 240, "dap");
      } else if (id === "gas") {
        vis.innerHTML = `<p class="vt">Natural gas in Europe, $ per mmbtu</p><div class="m"></div>`;
        drawGas(vis.querySelector(".m"), 240);
      } else if (id === "supply") {
        vis.innerHTML = `<p class="vt">Share of world potash production, ${Y}</p><div class="em-bars" id="fz-vbars"></div>`;
        drawSup(vis.querySelector("#fz-vbars"), "k", "production");
      } else if (id === "use") {
        vis.innerHTML = `<p class="vt">Nitrogen per hectare of cropland, ${Y}</p><div class="m"></div>${legend("nitrogen")}`;
        miniMap(vis.querySelector(".m"), "nitrogen");
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">UK fertiliser and wheat prices, 2020 = 100</p><div class="m"></div>`;
        drawUkp(vis.querySelector(".m"), 240);
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
