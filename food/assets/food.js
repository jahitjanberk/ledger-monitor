// Food Prices & Hunger dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--fd-b0", "--fd-b1", "--fd-b2", "--fd-b3", "--fd-b4"];
// The inflation map gives falling prices their own colour rather than the lightest step.
const MAPS = {
  hunger: { key: "hunger_band", vars: SEQ, label: "World map of countries coloured by the share of people who are undernourished" },
  diet: { key: "diet_band", vars: SEQ, label: "World map of countries coloured by the share of people who can't afford a healthy diet" },
  inflation: { key: "inflation_band", vars: ["--fd-fall", "--fd-b0", "--fd-b1", "--fd-b3", "--fd-b4"], label: "World map of countries coloured by food price inflation" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym, long = false) => { const [y, m] = ym.split("-").map(Number); return `${(long ? MONTH : MON)[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const pct = (v, d = 1) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const signed = (v, d = 1) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`);
const mil = (m) => (m == null ? "n/a" : m >= 1000 ? `${(m / 1000).toFixed(2)} billion` : m >= 10 ? `${Math.round(m)} million` : `${m.toFixed(1)} million`);
const milShort = (m) => (m == null ? "n/a" : m >= 1000 ? `${(m / 1000).toFixed(2)}bn` : m >= 10 ? `${Math.round(m)}m` : `${m.toFixed(1)}m`);
const usd = (v) => (v == null ? "n/a" : `$${v.toFixed(2)}`);
const pouText = (r) => (r.pou_under ? "Under 2.5%" : pct(r.pou));
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
  id: "food",
  title: "Food Prices & Hunger",
  description:
    "How many people go hungry, who can afford a healthy diet, and how fast food prices are rising in every country, from FAO, the World Bank and the Global Report on Food Crises, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r]));
    const W = DATA.world, w = W.at(-1), wPeak = W.filter((r) => r.year >= 2015).reduce((a, b) => (b.undernourished_m > a.undernourished_m ? b : a));
    const wLow = W.reduce((a, b) => (b.undernourished_m < a.undernourished_m ? b : a)), w21 = W.find((r) => r.year === 2021);
    const P = DATA.prices, p = P.at(-1), pYr = P.find((r) => r.month === `${+p.month.slice(0, 4) - 1}${p.month.slice(4)}`);
    const pPeak = P.reduce((a, b) => (b.food > a.food ? b : a));
    const R = DATA.prices_real, rNow = R.at(-1), rPeak = R.reduce((a, b) => (b.real > a.real ? b : a));
    const rPeak2 = R.filter((r) => r.year >= 2000).reduce((a, b) => (b.real > a.real ? b : a));
    const I = DATA.inputs, iFeb = I.find((r) => r.month === "2026-02"), iNow = I.at(-1), iFrom = I.filter((r) => r.month >= "2025-01");
    const iYr = I.find((r) => r.month === `${+iNow.month.slice(0, 4) - 1}${iNow.month.slice(4)}`);
    const STAPLES = [["rice", "Rice"], ["wheat", "Wheat"], ["soybean_oil", "Soybean oil"], ["palm_oil", "Palm oil"], ["maize", "Maize"]]
      .map(([k, label]) => ({ k, label, chg: (100 * (iNow[k] - iYr[k])) / iYr[k] })).sort((a, b) => b.chg - a.chg);
    const iPeak = I.filter((r) => r.month >= "2026-02").reduce((a, b) => (b.urea > a.urea ? b : a));
    const UK = DATA.uk, ukNow = UK.at(-1), ukPeak = UK.reduce((a, b) => (b.food_rate > a.food_rate ? b : a)), ukApr22 = UK.find((r) => r.month === "2022-04");
    const REG = DATA.regions.filter((r) => r.group === "region"), INC = DATA.regions.filter((r) => r.group === "income");
    const africa = REG.find((r) => r.region === "Africa"), asia = REG.find((r) => r.region === "Asia");
    const f =Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const ukRow = BY.GBR;
    const infl = C.filter((r) => r.food_inflation != null);
    const inflMonth = infl.map((r) => r.inflation_month).sort().at(-1);
    const fastest = [...infl].sort((a, b) => b.food_inflation - a.food_inflation).slice(0, 10);
    const hungriest = C.filter((r) => r.pou != null).sort((a, b) => b.pou - a.pou).slice(0, 10);
    const mostHungry = C.filter((r) => r.undernourished_m != null).sort((a, b) => b.undernourished_m - a.undernourished_m).slice(0, 10);
    const shares = C.filter((r) => r.food_share != null).sort((a, b) => b.food_share - a.food_share);
    // Named by code, not by position: another country can rank below the US in a new edition.
    const usShare = shares.find((r) => r.iso3 === "USA");
    const ureaRise = Math.round((100 * (iPeak.urea - iFeb.urea)) / iFeb.urea);
    const ffYr = (100 * (p.food - pYr.food)) / pYr.food;
    const ukSince = (100 * (ukNow.food_index - ukApr22.food_index)) / ukApr22.food_index;
    const oneIn = Math.round(100 / w.undernourished_pct);

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "food",
      name: "Food",
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
    const options = [...C].sort((a, b) => a.country.localeCompare(b.country));

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Food · hunger to ${w.year}, prices to ${monthName(p.month)}</p>
        <h1><b ${t(w.hunger_source)}>${mil(w.undernourished_m)}</b> people went hungry in ${w.year}. <span class="accent">A third of the world can't afford a healthy diet</span></h1>
        <p class="em-lede">Hunger fell for the third year running, from <b ${t(wPeak.hunger_source)}>${mil(wPeak.undernourished_m)}</b> in ${wPeak.year}, but <b ${t(w.diet_source)}>${mil(w.cant_afford_m)}</b> people still can't afford a healthy diet. World food prices stood at <b ${t(p.source)}>${p.food}</b> on FAO's index in ${monthName(p.month, true)}, a third above their 2014–2016 level. Closing the Strait of Hormuz pushed the price of urea fertiliser up <b ${t(iPeak.source)}>${ureaRise}%</b> in two months.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>About 1 in ${oneIn} people don't get enough to eat</h2></div></div>
        <div class="em-kpis">
          ${kpi("Undernourished", mil(w.undernourished_m), `<span ${t(w.hunger_source)}>${pct(w.undernourished_pct)}</span> of the world's people in ${w.year}, down from ${pct(wPeak.undernourished_pct)} in ${wPeak.year}`, w.hunger_source, true)}
          ${kpi("Can't afford a healthy diet", mil(w.cant_afford_m), `<span ${t(w.diet_source)}>${pct(w.cant_afford_pct)}</span> of people in ${w.year}, down from ${pct(w21.cant_afford_pct)} in 2021`, w.diet_source)}
          ${kpi("A healthy diet costs", `${usd(w.diet_cost)} a day`, `Per person, world average in ${w.year}, in 2021 international dollars. It was <span ${t(w21.diet_source)}>${usd(w21.diet_cost)}</span> in 2021`, w.diet_source)}
          ${kpi("FAO Food Price Index", String(p.food), `${monthName(p.month, true)}, 2014–2016 = 100; <span ${t(pYr.source)}>${signed(ffYr)}</span> on a year earlier`, p.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Hunger, healthy diets and food prices <span class="accent">in ${C.length} places</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="fd-mode" data-mode="hunger" aria-pressed="true">Undernourished</button>
                <button type="button" class="fd-mode" data-mode="diet" aria-pressed="false">Healthy diet</button>
                <button type="button" class="fd-mode" data-mode="inflation" aria-pressed="false">Food inflation</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="fd-map" role="region" aria-label="${MAPS.hunger.label}"></div>
            <div class="fd-scale" id="fd-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="fd-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="prices">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>World food prices</p><h2>Prices are below the 2022 peak, <span class="accent">but a third above 2014–2016</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">FAO Food Price Index · monthly, ${monthName(P[0].month)} to ${monthName(p.month)}</p>
            <h3>Three spikes in twenty years: 2008, 2011 and 2022</h3>
            <p class="note">The index tracks what cereals, vegetable oils, dairy, meat and sugar cost on world markets. It peaked at <b ${t(pPeak.source)}>${pPeak.food}</b> in ${monthName(pPeak.month, true)}, after Russia invaded Ukraine, and was <b ${t(p.source)}>${p.food}</b> in ${monthName(p.month, true)}.</p>
            <div id="fd-ffpi"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">By food group · ${monthName(p.month)}</p>
            <h3>Vegetable oils cost twice their 2014–2016 level</h3>
            <p class="note">Each index is 100 at its 2014–2016 average, marked by the dashed line. A year earlier, in ${monthName(pYr.month, true)}, vegetable oils stood at <b ${t(pYr.source)}>${pYr.oils}</b>.</p>
            <div class="em-bars" id="fd-groups"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Adjusted for inflation · ${R[0].year} to ${rNow.year}</p>
            <h3>In real terms, food was dearest in ${rPeak.year}</h3>
            <p class="note">The real index peaked at <b ${t(rPeak.source)}>${rPeak.real}</b> in ${rPeak.year}. Since 2000 its highest year was ${rPeak2.year}, at <b ${t(rPeak2.source)}>${rPeak2.real}</b>. In ${rNow.year} so far it is <b ${t(rNow.source)}>${rNow.real}</b>. The dashed line is the 2014–2016 average, 100.</p>
            <div id="fd-real"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Staples on world markets · ${monthName(iYr.month)} to ${monthName(iNow.month)}</p>
            <h3>${esc(STAPLES[0].label)} is up ${Math.round(STAPLES[0].chg)}% in a year</h3>
            <p class="note">Change in world export prices over twelve months, in US dollars. These are prices traders pay, before shipping, processing and shop margins.</p>
            <div class="em-bars" id="fd-staples"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="hormuz">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>The Hormuz shock</p><h2>Fertiliser nearly doubled in two months, <span class="accent">then fell back</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World prices against February 2026 · ${monthName(iFrom[0].month)} to ${monthName(iNow.month)}</p>
            <h3>Urea peaked at $${Math.round(iPeak.urea)} a tonne in ${MONTH[+iPeak.month.slice(5) - 1]}</h3>
            <p class="note">Each line is 100 in February 2026, the month before the strait closed, marked by the dashed line. Urea is the most used nitrogen fertiliser. It fell back from June, to <b ${t(iNow.source)}>$${Math.round(iNow.urea)}</b> in ${monthName(iNow.month, true)}, but DAP, a phosphate fertiliser, kept rising. Crude oil went back up, and wheat is <b ${t(iNow.source)}>${signed((100 * (iNow.wheat - iFeb.wheat)) / iFeb.wheat, 0)}</b> since February.</p>
            <div id="fd-inputs"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("World Bank", f.ureashare, "Nearly 1 in 4", `tonnes of the world's urea exports pass through the Strait of Hormuz.`, true)}
          ${factCard("FAO · April 2026", f.delayed, "1.5–3m", `tonnes of fertiliser trade were being delayed each month, FAO estimated.`)}
          ${factCard("FAO", f.gulf, "70–90%", `of their staple food is imported by Gulf countries.`)}
        </div>
        <p class="note fd-link">Shipping through the strait is tracked day by day in the <a href="../chokepoints/">Chokepoints</a> dashboard.</p>
      </section>

      <section class="em-sec" id="hunger">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Who goes hungry</p><h2>Africa now has more hungry people <span class="accent">than Asia</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">World · undernourished people, ${W[0].year} to ${w.year}</p>
            <h3>Progress stopped in the 2010s and reversed with the pandemic</h3>
            <p class="note">The number fell from <b ${t(W[0].hunger_source)}>${mil(W[0].undernourished_m)}</b> in ${W[0].year} to <b ${t(wLow.hunger_source)}>${mil(wLow.undernourished_m)}</b> in ${wLow.year}, rose to ${mil(wPeak.undernourished_m)} in ${wPeak.year}, and has fallen since. FAO projects about <b ${t(f.proj2030.source)}>${f.proj2030.value} million</b> will still be hungry in 2030.</p>
            <div id="fd-world"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Undernourished people by region · ${africa.year}</p>
            <h3>${mil(africa.undernourished_m)} in Africa, ${pct(africa.undernourished_pct, 0)} of its people</h3>
            <p class="note">Asia has ${mil(asia.undernourished_m)}, ${pct(asia.undernourished_pct, 0)} of its much larger population. Northern America and Europe are under 2.5%.</p>
            <div class="em-bars" id="fd-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Highest share undernourished · ${DATA.period}</p>
            <h3>Somalia and Haiti: half the population</h3>
            <p class="note">Three-year averages, so a sudden crisis shows only gradually.</p>
            <div class="em-bars" id="fd-worst"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Can't afford a healthy diet · by income, ${DATA.diet_year}</p>
            <h3>Three in four people in low-income countries</h3>
            <p class="note">Share of people whose income, after other basic needs, can't buy the cheapest healthy diet available locally.</p>
            <div class="em-bars" id="fd-income"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="crises">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Food crises</p><h2>Famine was confirmed <span class="accent">in Gaza and Sudan</span></h2></div></div>
        <p class="em-lede fd-crisis-lede">Undernourishment is a yearly average. The Global Report on Food Crises counts people facing acute hunger right now, in countries where it has become a crisis.</p>
        <div class="em-grid">
          ${factCard("Global Report on Food Crises · 2025", f.grfc, `${f.grfc.value} million`, `people faced high levels of acute food insecurity, in ${esc(f.grfc.note.split(";")[0].replace("In ", ""))}. DR Congo, Nigeria and Sudan held nearly a third of them.`, true)}
          ${factCard("Catastrophe · IPC Phase 5", f.phase5, `${f.phase5.value} million`, `people faced catastrophic hunger, in ${esc(f.phase5.note)}.`)}
          ${factCard("Children", f.wasted, `${f.wasted.value} million`, `children aged 6 months to 5 years were acutely malnourished in these countries.`)}
        </div>
      </section>

      <section class="em-sec" id="spending">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>What food takes from a budget</p><h2>People in ${esc(shares[0].country)} spend <span class="accent">${Math.round(shares[0].food_share)}%</span> of their budget on food at home${usShare ? `. Americans spend ${Math.round(usShare.food_share)}%` : ""}</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Food as a share of household spending · ${shares[0].food_share_year}</p>
            <h3>Where food takes the most</h3>
            <p class="note">Food bought to eat at home, as a share of all household spending. Where it takes half the budget, a price rise forces cuts elsewhere or in what people eat.</p>
            <div class="em-bars" id="fd-share-hi"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Food as a share of household spending · ${shares[0].food_share_year}</p>
            <h3>Where it takes the least</h3>
            <p class="note">The UK is <b ${t(ukRow.food_share_source)}>${pct(ukRow.food_share)}</b>. Restaurant meals, alcohol and tobacco are not counted.</p>
            <div class="em-bars" id="fd-share-lo"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Fastest food inflation · year to ${monthName(inflMonth)}</p>
            <h3>Iran's food prices more than doubled</h3>
            <p class="note">Year-on-year change in each country's food price index, latest month.</p>
            <div class="em-bars" id="fd-fastest"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Close to home</p><h2>UK food inflation is down to ${pct(ukNow.food_rate)}, <span class="accent">but prices are ${Math.round(ukSince)}% higher than in 2022</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">United Kingdom · 12-month inflation, ${monthName(UK[0].month)} to ${monthName(ukNow.month)}</p>
            <h3>Food prices rose ${pct(ukPeak.food_rate)} in the year to ${monthName(ukPeak.month, true)}</h3>
            <p class="note">In ${monthName(ukNow.month, true)} food prices rose <b ${t(ukNow.source)}>${pct(ukNow.food_rate)}</b> on a year earlier, against <b ${t(ukNow.source)}>${pct(ukNow.cpi_rate)}</b> for all prices.</p>
            <div id="fd-uk"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Official · Family Resources Survey", f.ukfrs, `${f.ukfrs.value}%`, `of UK households had low or very low food security in 2024 to 2025. <b ${t(f.ukfrs.source)}>1.4%</b> had used a food bank in the past 30 days.`, true)}
          ${factCard("Food Foundation · June 2026", f.ukff, `${f.ukff.value}%`, `of households had been food insecure in the past month: ${esc(f.ukff.note)}. It asks about a shorter period than the official survey.`)}
          ${factCard(`Since April 2022`, { source: ukNow.source }, `+${ukSince.toFixed(0)}%`, `rise in UK food and non-alcoholic drink prices from ${monthName(ukApr22.month, true)} to ${monthName(ukNow.month, true)}, on the ONS food price index.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">09</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="fd-search" id="fd-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap fd-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="pou" aria-sort="descending"><button type="button">Undernourished</button></th>
                <th class="r" data-key="cant_afford_pct" aria-sort="none"><button type="button">Can't afford diet</button></th>
                <th class="r hide-n" data-key="diet_cost" aria-sort="none"><button type="button">Diet $/day</button></th>
                <th class="r hide-n" data-key="food_inflation" aria-sort="none"><button type="button">Food inflation</button></th>
                <th class="r hide-n" data-key="food_share" aria-sort="none"><button type="button">Food share</button></th>
              </tr></thead>
              <tbody id="fd-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">10</span>Method</p>
        <p><b>Undernourishment</b> is FAO's estimate of the share of people whose usual food intake doesn't give them the energy they need for a normal, active life. It is modelled from national food supply, household surveys of consumption and the population's age and sex, not counted person by person. Country figures are three-year averages (${DATA.period}); world and regional figures are for ${w.year}. FAO doesn't publish values under 2.5%. <b>Food insecurity</b> comes from FAO's Food Insecurity Experience Scale, a survey asking adults whether they ran out of food, skipped meals or went a day without eating.</p>
        <p><b>A healthy diet</b> is the cheapest mix of locally available foods that meets national dietary guidelines, priced by the World Bank's International Comparison Program and FAO. Costs are in 2021 international dollars, which adjust for price levels so countries can be compared. People can't afford it when their income, after other basic needs, is below that cost. <b>Food inflation</b> is the year-on-year change in each country's food consumer price index from FAOSTAT, latest month available. <b>World prices</b> are FAO's Food Price Index and the World Bank's monthly commodity prices, in nominal US dollars. All hunger and diet figures are from FAO's July 2026 release, which revises earlier years, so they can differ from older reports.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("hungry", "01", "Hunger", `<span class="accent"><b ${t(w.hunger_source)}>${mil(w.undernourished_m)}</b></span> people went hungry in ${w.year}`, `About 1 in ${oneIn}. That is ${mil(wPeak.undernourished_m - w.undernourished_m)} fewer than in ${wPeak.year}, the third fall in a row.`)}
            ${step("africa", "02", "A shift", `Africa now has <span class="accent"><b ${t(africa.hunger_source)}>${mil(africa.undernourished_m)}</b></span> hungry people`, `More than Asia's <b ${t(asia.hunger_source)}>${mil(asia.undernourished_m)}</b>, from a population a third the size.`)}
            ${step("diet", "03", "Beyond calories", `<span class="accent"><b ${t(w.diet_source)}>${pct(w.cant_afford_pct, 0)}</b></span> of people can't afford a healthy diet`, `It costs <b ${t(w.diet_source)}>${usd(w.diet_cost)}</b> a day on average. In low-income countries, three in four people can't pay that.`)}
            ${step("prices", "04", "World prices", `Food prices are <span class="accent">a third above</span> their 2014–2016 level`, `FAO's index was <b ${t(p.source)}>${p.food}</b> in ${monthName(p.month, true)}, down from <b ${t(pPeak.source)}>${pPeak.food}</b> in ${monthName(pPeak.month, true)}.`)}
            ${step("hormuz", "05", "The Hormuz shock", `Urea fertiliser rose <span class="accent"><b ${t(iPeak.source)}>${ureaRise}%</b></span> in two months`, `Nearly a quarter of the world's urea exports pass through the strait, which closed in March 2026.`)}
            ${step("famine", "06", "Catastrophe", `<span class="accent"><b ${t(f.phase5.source)}>${f.phase5.value} million</b></span> people faced catastrophic hunger in 2025`, `Famine was confirmed in parts of Gaza and Sudan.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="fd-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "hunger", sel: "NGA" };
    const mapEl = main.querySelector("#fd-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return {
          ...ft,
          properties: {
            ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name,
            hunger: r ? bandIdx("hunger", r.hunger_band) : -1, diet: r ? bandIdx("diet", r.diet_band) : -1, inflation: r ? bandIdx("inflation", r.inflation_band) : -1,
          },
        };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: MAPS[state.mode].vars.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (r, mode) =>
      mode === "hunger" ? (r.hunger_band ? `${pouText(r)} undernourished` : "No hunger estimate")
        : mode === "diet" ? (r.cant_afford_pct != null ? `${pct(r.cant_afford_pct)} can't afford a healthy diet` : "No diet estimate")
          : r.food_inflation != null ? `food prices ${signed(r.food_inflation)} in the year to ${monthName(r.inflation_month)}` : "No recent food inflation figure";
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
    const scaleEl = main.querySelector("#fd-scale");
    const SCALE_TITLE = { hunger: `Share undernourished, ${DATA.period}:`, diet: `Can't afford a healthy diet, ${DATA.diet_year}:`, inflation: `Food price inflation, year to ${monthName(inflMonth)}:` };
    const drawScale = () => {
      const m = MAPS[state.mode];
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(m.vars[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#fd-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const head = state.mode === "hunger"
        ? { eb: `Undernourished · ${DATA.period}`, big: r.hunger_band ? pouText(r) : "n/a", s: r.hunger_source, sub: `of people · world <span ${t(w.hunger_source)}>${pct(w.undernourished_pct)}</span>` }
        : state.mode === "diet"
          ? { eb: `Can't afford a healthy diet · ${DATA.diet_year}`, big: pct(r.cant_afford_pct), s: r.diet_source, sub: `of people · world <span ${t(w.diet_source)}>${pct(w.cant_afford_pct)}</span>` }
          : { eb: `Food inflation · year to ${r.inflation_month ? monthName(r.inflation_month) : "n/a"}`, big: signed(r.food_inflation), s: r.inflation_source, sub: `change in food prices on a year earlier` };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="fd-pick"><span class="em-eyebrow">Choose</span><select id="fd-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${t(head.s)}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.hunger_band ? row(`Undernourished · ${DATA.period}`, `<span ${t(r.hunger_source)}>${pouText(r)}${r.undernourished_m != null ? ` · ${mil(r.undernourished_m)}` : ""}</span>`) : ""}
          ${r.pou_2005 != null || r.pou_2005_under ? row("Undernourished · 2004–2006", `<span ${t(r.hunger_source)}>${r.pou_2005_under ? "Under 2.5%" : pct(r.pou_2005)}</span>`) : ""}
          ${r.food_insecure_pct != null ? row("Moderate or severe food insecurity", `<span ${t(r.hunger_source)}>${pct(r.food_insecure_pct)}</span>`) : ""}
          ${r.severe_pct != null ? row("Severe food insecurity", `<span ${t(r.hunger_source)}>${pct(r.severe_pct)}</span>`) : ""}
          ${r.stunting_pct != null ? row(`Children under 5 stunted · ${r.stunting_year}`, `<span ${t(r.hunger_source)}>${pct(r.stunting_pct)}</span>`) : ""}
          ${r.diet_cost != null ? row(`Healthy diet · ${r.diet_year}`, `<span ${t(r.diet_source)}>${usd(r.diet_cost)} a day</span>`) : ""}
          ${r.cant_afford_pct != null ? row("Can't afford it", `<span ${t(r.diet_source)}>${pct(r.cant_afford_pct)}${r.cant_afford_m != null ? ` · ${mil(r.cant_afford_m)}` : ""}</span>`) : ""}
          ${r.food_inflation != null ? row(`Food inflation · ${monthName(r.inflation_month)}`, `<span ${t(r.inflation_source)}>${signed(r.food_inflation)}</span>`) : ""}
          ${r.food_share != null ? row(`Food share of spending · ${r.food_share_year}`, `<span ${t(r.food_share_source)}>${pct(r.food_share)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#fd-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".fd-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".fd-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash }]. Labels each line at its end.
    // A series without a name is labelled with its value only. xEnd labels the last point on the axis.
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name) ? (narrow ? 104 : 150) : 58, b: 22, l: 40 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      // Interior ticks keep at least 64px from the end labels and from each other.
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="fd-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="fd-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) + 13}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.last?.[0] ?? s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.dash ? 1.8 : 2.4}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const decades = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const drawFfpi = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: P.map((r) => [xOf(r.month), r.food]) }],
      yMax: 175, yStep: 25, ref: { v: 100, label: "2014–2016 = 100" }, xTicks: decades(1995, 2020, 5), xEnd: monthName(p.month), h, area: true,
      aria: `FAO Food Price Index from ${P[0].food} in ${monthName(P[0].month)} to a peak of ${pPeak.food} in ${monthName(pPeak.month)}, and ${p.food} in ${monthName(p.month)}`,
    });
    const drawReal = (el) => lineChart(el, {
      series: [{ name: "Real", short: "Real", v: "--em-accent", pts: R.map((r) => [r.year, r.real]) }, { name: "Nominal", short: "Nominal", v: "--fd-muted", dash: true, pts: R.map((r) => [r.year, r.nominal]) }],
      yMax: 150, yStep: 50, ref: { v: 100 }, xTicks: decades(R[0].year, rNow.year, 20), h: 220,
      aria: `FAO Food Price Index in real terms peaked at ${rPeak.real} in ${rPeak.year}; it is ${rNow.real} in ${rNow.year}. In nominal terms it rose from ${R[0].nominal} in ${R[0].year} to ${rNow.nominal}`,
    });
    const IDX = [["urea", "Urea", "--em-accent"], ["brent", "Crude oil", "--fd-oil"], ["dap", "DAP fertiliser", "--fd-b2"], ["wheat", "Wheat", "--fd-muted"]];
    const drawInputs = (el, h) => lineChart(el, {
      series: IDX.map(([k, name, v]) => ({ name, short: name.split(" ")[0], v, pts: iFrom.map((r) => [xOf(r.month), (100 * r[k]) / iFeb[k]]), endText: String(Math.round((100 * iNow[k]) / iFeb[k])) })),
      yMax: 200, yMin: 50, yStep: 50, ref: { v: 100 }, fmtY: (v) => String(Math.round(v)), xTicks: [2025.5, 2026], h,
      xFmt: (v) => { const yy = Math.floor(v + 1e-6), m = Math.round((v - yy) * 12); return `${MON[m]} ${yy}`; }, xEnd: monthName(iNow.month),
      aria: `Prices relative to February 2026. Urea rose to ${Math.round((100 * iPeak.urea) / iFeb.urea)} in ${monthName(iPeak.month)} and was ${Math.round((100 * iNow.urea) / iFeb.urea)} in ${monthName(iNow.month)}; crude oil ${Math.round((100 * iNow.brent) / iFeb.brent)}, DAP ${Math.round((100 * iNow.dap) / iFeb.dap)}, wheat ${Math.round((100 * iNow.wheat) / iFeb.wheat)}`,
    });
    const drawWorld = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: W.map((r) => [r.year, r.undernourished_m]), endText: `${Math.round(w.undernourished_m)}m` }],
      yMax: 900, yStep: 300, fmtY: (v) => (v ? `${v}m` : "0"), xTicks: decades(W[0].year, w.year, 5), h, area: true,
      aria: `Undernourished people: ${mil(W[0].undernourished_m)} in ${W[0].year}, ${mil(wPeak.undernourished_m)} in ${wPeak.year}, ${mil(w.undernourished_m)} in ${w.year}`,
    });
    const drawUk = (el, h) => lineChart(el, {
      series: [{ name: "Food", short: "Food", v: "--em-accent", pts: UK.map((r) => [xOf(r.month), r.food_rate]) }, { name: "All prices", short: "All", v: "--fd-muted", dash: true, pts: UK.map((r) => [xOf(r.month), r.cpi_rate]) }],
      yMax: 20, yMin: -5, yStep: 5, fmtY: (v) => `${v}%`, xTicks: decades(2017, 2025, 2), xEnd: monthName(ukNow.month), h,
      aria: `UK food inflation peaked at ${ukPeak.food_rate}% in ${monthName(ukPeak.month)} and was ${ukNow.food_rate}% in ${monthName(ukNow.month)}; all-items inflation was ${ukNow.cpi_rate}%`,
    });
    const drawAll = () => {
      drawFfpi(main.querySelector("#fd-ffpi"), 260);
      drawReal(main.querySelector("#fd-real"));
      drawInputs(main.querySelector("#fd-inputs"), 260);
      drawWorld(main.querySelector("#fd-world"), 220);
      drawUk(main.querySelector("#fd-uk"), 240);
    };
    drawAll();

    // ---------- Bars ----------
    const GROUPS = [["oils", "Vegetable oils"], ["meat", "Meat"], ["sugar", "Sugar"], ["dairy", "Dairy"], ["cereals", "Cereals"]];
    bars(main.querySelector("#fd-groups"), GROUPS.map(([k, label]) => ({ label, value: p[k], src: p.source, muted: k !== "oils" })), (v) => v.toFixed(1), 220, t);
    main.querySelectorAll("#fd-groups .em-bars-track").forEach((tr) => tr.insertAdjacentHTML("beforeend", `<i class="fd-mark" style="left:${100 * 100 / 220}%" title="2014–2016 = 100"></i>`));
    bars(main.querySelector("#fd-regions"), [...REG].sort((a, b) => (b.undernourished_m ?? 0) - (a.undernourished_m ?? 0)).map((r, i) => ({ label: r.region, value: r.undernourished_m ?? 0, muted: i > 0, src: r.hunger_source })), (v) => (v ? mil(v) : "Under 2.5%"), africa.undernourished_m, t);
    const stMax = Math.max(...STAPLES.map((s) => Math.abs(s.chg)));
    bars(main.querySelector("#fd-staples"), STAPLES.map((s, i) => ({ label: s.label, value: Math.max(0, s.chg), muted: i > 0, src: iNow.source })), (v) => signed(v, 0), stMax, t);
    main.querySelectorAll("#fd-staples .em-bars-val").forEach((el, i) => (el.textContent = signed(STAPLES[i].chg, 0)));
    const hb = (v) => `var(${SEQ[bandIdx("hunger", BANDS.hunger.find((b) => (b.min == null || v >= b.min) && (b.max == null || v < b.max)).band)]})`;
    bars(main.querySelector("#fd-worst"), hungriest.map((r) => ({ label: r.country, value: r.pou, src: r.hunger_source })), (v) => pct(v), 60, t);
    main.querySelectorAll("#fd-worst .em-bars-fill").forEach((el, i) => (el.style.background = hb(hungriest[i].pou)));
    bars(main.querySelector("#fd-income"), INC.map((r, i) => ({ label: r.region.replace(" countries", ""), value: r.cant_afford_pct, muted: i > 0, src: r.diet_source })), (v) => pct(v), 100, t);
    bars(main.querySelector("#fd-share-hi"), shares.slice(0, 8).map((r, i) => ({ label: r.country, value: r.food_share, muted: i > 0, src: r.food_share_source })), (v) => pct(v), 60, t);
    const lo = shares.slice(-8).reverse();
    bars(main.querySelector("#fd-share-lo"), lo.map((r) => ({ label: r.country, value: r.food_share, muted: r.iso3 !== "GBR", src: r.food_share_source })), (v) => pct(v), 60, t);
    bars(main.querySelector("#fd-fastest"), fastest.map((r, i) => ({ label: r.country, value: r.food_inflation, muted: i > 0, src: r.inflation_source })), (v) => signed(v), fastest[0].food_inflation, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#fd-tbody"), search = main.querySelector("#fd-search");
    const sortVal = (r, k) => (k === "pou" ? r.pou ?? (r.pou_under ? 0 : null) : r[k]);
    let key = "pou", dir = -1;
    const cell = (v, s, f) => `<td class="r${f.hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : f.fmt(v)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = sortVal(a, key), y = sortVal(b, key);
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="fd-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.hunger_band ? t(r.hunger_source) : ""}>${r.hunger_band ? `<i class="fd-sw" style="background:var(${SEQ[bandIdx("hunger", r.hunger_band)]})"></i>${r.pou_under ? "&lt;2.5" : r.pou.toFixed(1)}` : "–"}</td>
        ${cell(r.cant_afford_pct, r.diet_source, { fmt: (v) => v.toFixed(1) })}
        ${cell(r.diet_cost, r.diet_source, { hide: true, fmt: (v) => v.toFixed(2) })}
        ${cell(r.food_inflation, r.inflation_source, { hide: true, fmt: (v) => signed(v).replace("%", "") })}
        ${cell(r.food_share, r.food_share_source, { hide: true, fmt: (v) => v.toFixed(1) })}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".fd-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#fd-vis");
    function miniMap(el, mode) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", MAPS[mode].label);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso], i = r ? bandIdx(mode, r[MAPS[mode].key]) : -1; return i < 0 ? "var(--em-land)" : `var(${MAPS[mode].vars[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${valueText(r, mode)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = (mode) => `<div class="fd-scale">${BANDS[mode].map((b, i) => `<span>${dot(MAPS[mode].vars[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const waffle = (n, cls = "") => `<div class="em-waffle${cls}">${Array.from({ length: 100 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "hungry") {
        vis.innerHTML = `<p class="vt">Share undernourished, ${DATA.period}</p><div class="m"></div>${legend("hunger")}`;
        miniMap(vis.querySelector(".m"), "hunger");
      } else if (id === "africa") {
        vis.innerHTML = `<p class="vt">Undernourished people, ${africa.year}</p><div class="em-bars" id="fd-vbars"></div><p class="vsub">Africa ${pct(africa.undernourished_pct, 0)} of its people; Asia ${pct(asia.undernourished_pct, 0)}.</p>`;
        bars(vis.querySelector("#fd-vbars"), [...REG].sort((a, b) => (b.undernourished_m ?? 0) - (a.undernourished_m ?? 0)).map((r, i) => ({ label: r.region, value: r.undernourished_m ?? 0, muted: i > 0, src: r.hunger_source })), (v) => (v ? mil(v) : "Under 2.5%"), africa.undernourished_m, t);
      } else if (id === "diet") {
        vis.innerHTML = `<p class="vt">Out of every 100 people, ${w.year}</p>${waffle(Math.round(w.cant_afford_pct))}<p class="vsub">About <b>${Math.round(w.cant_afford_pct)}</b> can't afford a healthy diet.</p>`;
      } else if (id === "prices") {
        vis.innerHTML = `<p class="vt">FAO Food Price Index, monthly</p><div class="m"></div>`;
        drawFfpi(vis.querySelector(".m"), 240);
      } else if (id === "hormuz") {
        vis.innerHTML = `<p class="vt">Prices against February 2026</p><div class="m"></div>`;
        drawInputs(vis.querySelector(".m"), 240);
      } else if (id === "famine") {
        vis.innerHTML = `<p class="vt">Acute food insecurity, 2025</p><div class="vbig">${f.grfc.value} million</div><p class="vsub">people in ${esc(f.grfc.note.split(";")[0].replace("In ", ""))} faced high levels of acute hunger; ${f.phase5.value} million of them catastrophic.</p>`;
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
