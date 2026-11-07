// Household Energy Prices & Poverty dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--en-b0", "--en-b1", "--en-b2", "--en-b3", "--en-b4"];
const MAPS = {
  cooking: { key: "cooking_band", label: "World map of countries coloured by the share of people without clean cooking fuels and technologies" },
  electricity: { key: "electricity_band", label: "World map of countries coloured by the share of people without electricity" },
  warm: { key: "warm_band", label: "Map of European countries coloured by the share of people who can't afford to keep their home warm" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pct = (v, d = 1) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const ppl = (m) => (m == null ? "n/a" : m >= 1000 ? `${(m / 1000).toFixed(2)} billion` : m >= 1 ? `${m >= 10 ? Math.round(m) : m.toFixed(1)} million` : `${Math.round(m * 1000).toLocaleString("en-GB")},000`);
const mil = (m) => (m >= 10 ? `${Math.round(m)}m` : `${m.toFixed(1)}m`);
const cents = (v) => (v == null ? "n/a" : `${(v * 100).toFixed(1)}c`);
const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
const half = (p) => (p ? `${p.endsWith("S1") ? "first" : "second"} half of ${p.slice(0, 4)}` : "");
const halfShort = (p) => `${p.endsWith("S1") ? "H1" : "H2"} ${p.slice(0, 4)}`;
const ym = (s) => { const [y, m] = s.split("-").map(Number); return `${MON[m - 1]} ${y}`; };
const xOfYm = (s) => { const [y, m] = s.split("-").map(Number); return y + (m - 1) / 12; };
const xOfHalf = (p) => +p.slice(0, 4) + (p.endsWith("S2") ? 0.5 : 0);
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
  id: "energy",
  title: "Household Energy Prices & Poverty",
  description:
    "Who still lives without electricity or clean cooking fuel, what European households pay for power and gas, who can't afford to keep warm, and the British price cap and fuel poverty, from the World Bank, WHO, Eurostat, Ofgem and DESNZ, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year, PP = DATA.price_period;
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const R = (code) => DATA.regions.filter((r) => r.code === code);
    const wld = R("WLD"), ssa = R("SSF"), sas = R("SAS");
    const wNow = wld.at(-1), w15 = wld.find((r) => r.year === 2015), ssaNow = ssa.at(-1), sasNow = sas.at(-1);
    const byNoEl = C.filter((r) => r.no_electricity_m != null).sort((a, b) => b.no_electricity_m - a.no_electricity_m);
    const byNoCk = C.filter((r) => r.no_cooking_m != null).sort((a, b) => b.no_cooking_m - a.no_cooking_m);
    const sumEl = byNoEl.reduce((s, r) => s + r.no_electricity_m, 0), top3El = byNoEl.slice(0, 3), top3ElSum = top3El.reduce((s, r) => s + r.no_electricity_m, 0);
    const noCook75 = C.filter((r) => r.no_cooking_pct != null && r.no_cooking_pct >= 75);
    const byElP = C.filter((r) => r.elec_price_eur != null).sort((a, b) => b.elec_price_eur - a.elec_price_eur);
    const byGasP = C.filter((r) => r.gas_price_eur != null).sort((a, b) => b.gas_price_eur - a.gas_price_eur);
    const byCold = C.filter((r) => r.cold_home_pct != null).sort((a, b) => b.cold_home_pct - a.cold_home_pct);
    const byArr = C.filter((r) => r.arrears_pct != null).sort((a, b) => b.arrears_pct - a.arrears_pct);
    const EUP = DATA.eu_prices, euNow = EUP.at(-1), eu21 = EUP.find((r) => r.period === "2021-S1");
    const euPeakE = EUP.reduce((a, b) => ((b.elec_eur ?? 0) > (a.elec_eur ?? 0) ? b : a));
    const EUV = DATA.eu_poverty, euv = EUV.at(-1), euvPeak = EUV.reduce((a, b) => (b.cold_home_pct > a.cold_home_pct ? b : a)), euvLow = EUV.reduce((a, b) => (b.cold_home_pct < a.cold_home_pct ? b : a));
    const CAP = DATA.uk_cap, capNow = CAP.at(-1), capPeak = CAP.reduce((a, b) => (b.dual_fuel > a.dual_fuel ? b : a)), cap0 = CAP[0];
    const preCrisis = CAP.find((r) => r.start === "2021-04");
    const FP = DATA.uk_fuel_poverty, fpNow = FP.at(-1), fp0 = FP[0];
    const FPE = DATA.uk_fpeer.filter((r) => r.fuel_poor_k > 0), fpFG = FPE.at(-1), fpD = FPE[0];

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "energy",
      name: "Energy",
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
        <p class="em-eyebrow"><span class="num">00</span>Energy · access to ${Y}, European prices to the ${half(PP)}, GB cap to ${ym(capNow.end)}</p>
        <h1><b ${t(f.noelec.source)}>${f.noelec.value} million people</b> still have no electricity, and <span class="accent">about ${f.nocook.value} billion cook with polluting fuels</span></h1>
        <p class="em-lede">More than <b ${t(f.noelec_ssa.source)}>${f.noelec_ssa.value} million</b> of the people without power live in sub-Saharan Africa, where only <b ${t(ssaNow.cooking_source)}>${pct(ssaNow.cooking_pct, 0)}</b> of people cook with clean fuels. In Europe, where almost everyone is connected, the problem is the bill: <b ${t(euv.cold_source)}>${pct(euv.cold_home_pct)}</b> of people in the EU couldn't afford to keep their home warm in ${euv.year}, and <b ${t(euv.cold_source)}>${pct(euv.cold_home_poor_pct)}</b> of those at risk of poverty. In Britain the typical household bill under the price cap is <b ${t(f.cap.source)}>£${f.cap.value.toLocaleString("en-GB")}</b> a year from October 2026.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Some can't get energy at all, <span class="accent">others can't afford it</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Without electricity", `${f.noelec.value} million`, `In ${Y}. ${esc(top3El.map((r) => r.country).join(", ").replace(/, ([^,]*)$/, " and $1"))} account for <span ${t("wb-elec", "wb-pop")}>${mil(top3ElSum)}</span> of them`, f.noelec.source, true)}
          ${kpi("Cooking with polluting fuels", `${f.nocook.value} billion`, `About a quarter of the world. In <span ${t("wb-cook")}>${noCook75.length} countries</span> three in four people or more lack clean cooking`, f.nocook.source)}
          ${kpi("EU: can't keep home warm", pct(euv.cold_home_pct), `Of people in ${euv.year}, up from <span ${t(euvLow.cold_source)}>${pct(euvLow.cold_home_pct)}</span> in ${euvLow.year}. <span ${t(euv.cold_source)}>${pct(euv.cold_home_poor_pct)}</span> of those at risk of poverty`, euv.cold_source)}
          ${kpi("GB typical bill under the cap", `£${f.cap.value.toLocaleString("en-GB")}`, `A year, dual fuel by direct debit, October to December 2026. ${esc(f.cap.note)}`, f.cap.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Clean cooking, electricity and cold homes <span class="accent">in ${C.length} countries</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="en-mode" data-mode="cooking" aria-pressed="true">No clean cooking</button>
                <button type="button" class="en-mode" data-mode="electricity" aria-pressed="false">No electricity</button>
                <button type="button" class="en-mode" data-mode="warm" aria-pressed="false">Cold homes</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="en-map" role="region" aria-label="${MAPS.cooking.label}"></div>
            <div class="en-scale" id="en-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="en-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="access">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Who is left out</p><h2>Clean cooking lags <span class="accent">far behind electricity</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">People without electricity · ${Y}</p>
            <h3>${esc(byNoEl[0].country)} has the most people without power: ${ppl(byNoEl[0].no_electricity_m)}</h3>
            <p class="note">Population times the share without access. All ten are in sub-Saharan Africa.</p>
            <div class="em-bars" id="en-noel"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">People without clean cooking · ${Y}</p>
            <h3>${esc(byNoCk[0].country)}: ${ppl(byNoCk[0].no_cooking_m)} people still cook with polluting fuels</h3>
            <p class="note">Large countries in Asia have high totals even where most people now have clean fuel.</p>
            <div class="em-bars" id="en-nock"></div>
            <div class="em-cites"></div>
          </div>
        </div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Share of people with access · ${wld[0].year} to ${Y}</p>
            <h3>The world reached ${pct(wNow.electricity_pct, 0)} for electricity but only ${pct(wNow.cooking_pct, 0)} for clean cooking</h3>
            <p class="note">Sub-Saharan Africa went from <b ${t(ssa[0].electricity_source)}>${pct(ssa[0].electricity_pct, 0)}</b> to <b ${t(ssaNow.electricity_source)}>${pct(ssaNow.electricity_pct, 0)}</b> with electricity, but clean cooking only reached <b ${t(ssaNow.cooking_source)}>${pct(ssaNow.cooking_pct, 0)}</b>. South Asia has almost closed its electricity gap, at <b ${t(sasNow.electricity_source)}>${pct(sasNow.electricity_pct, 1)}</b>.</p>
            <div class="en-key"><span>${dot("--em-accent")}Electricity</span><span>${dot("--en-cook")}Clean cooking</span><span>Solid line: world · dashed: sub-Saharan Africa</span></div>
            <div id="en-trend"></div>
            <div class="em-cites"></div>
          </div>
        </div>
        <div class="em-grid">
          ${factCard("Rural sub-Saharan Africa", f.rural_ssa, `${f.rural_ssa.value} million`, `rural people without electricity in 2024, up from 376 million in 2010, even as the region's overall access rate rose.`, true)}
          ${factCard("By 2030", f.nocook_2030, `${f.nocook_2030.value} billion`, `people could still rely on charcoal, wood, kerosene or coal for cooking at current rates. Universal electricity by 2030 needs access to grow <b ${t(f.pace.source)}>${f.pace.value} points</b> a year, about triple the current pace.`)}
          ${factCard("Health", f.hap_deaths, `${f.hap_deaths.value} million`, `deaths a year are caused by household air pollution, much of it from cooking with polluting fuels. The <a href="../air/index.html">Air dashboard</a> has the country figures.`)}
        </div>
      </section>

      <section class="em-sec" id="prices">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>What households pay in Europe</p><h2>In euros, electricity costs <span class="accent">${(byElP[0].elec_price_eur / byElP.at(-1).elec_price_eur).toFixed(0)} times as much</span> in ${esc(byElP[0].country)} as in ${esc(byElP.at(-1).country)}</h2></div></div>
        <p class="em-lede en-lede2">Prices per kWh for a typical household, with all taxes and levies, in the ${half(PP)}. Purchasing power standards (PPS) adjust for what money buys in each country, so a low price can still be hard to pay where incomes are low.</p>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <div class="em-maptools"><div class="em-toggle" role="group" aria-label="Price units">
              <button type="button" class="en-cur" data-cur="eur" aria-pressed="true">Euro cents</button>
              <button type="button" class="en-cur" data-cur="pps" aria-pressed="false">Purchasing power</button>
            </div></div>
            <div class="en-two">
              <div><p class="em-eyebrow">Electricity, per kWh · ${halfShort(PP)}</p><h3 id="en-elh"></h3><div class="em-bars" id="en-elp"></div></div>
              <div><p class="em-eyebrow">Gas, per kWh · ${halfShort(PP)}</p><h3 id="en-gash"></h3><div class="em-bars" id="en-gasp"></div></div>
            </div>
            <p class="note en-after">The twelve dearest of ${byElP.length} countries for electricity and ${byGasP.length} for gas. EU average: electricity <b ${t(euNow.elec_source)}>${cents(euNow.elec_eur)}</b>, gas <b ${t(euNow.gas_source)}>${cents(euNow.gas_eur)}</b>.</p>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">EU average household prices · euro cents per kWh, ${halfShort(EUP[0].period)} to ${halfShort(euNow.period)}</p>
            <h3>Electricity went from ${cents(EUP[0].elec_eur)} in ${halfShort(EUP[0].period)} to ${cents(euNow.elec_eur)} in ${halfShort(euNow.period)}</h3>
            <p class="note">It was <b ${t(eu21.elec_source)}>${cents(eu21.elec_eur)}</b> in the first half of 2021, before gas prices surged, and the highest so far was <b ${t(euPeakE.elec_source)}>${cents(euPeakE.elec_eur)}</b> in the ${half(euPeakE.period)}. Gas is cheaper per kWh, but homes heated by gas use far more of it: Ofgem's typical British home uses <span ${t("ofgem-letter")}>9,500 kWh of gas a year and 2,500 kWh of electricity</span>.</p>
            <div class="en-key"><span>${dot("--em-accent")}Electricity</span><span>${dot("--en-gas")}Gas</span></div>
            <div id="en-eup"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="warm">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Cold homes</p><h2>In ${esc(byCold[0].country)}, <span class="accent">${pct(byCold[0].cold_home_pct, 0)}</span> of people can't afford to keep warm</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Can't afford to keep the home adequately warm · % of people, mostly ${byCold[0].cold_home_year}</p>
            <h3>The twelve highest rates, for everyone and for people at risk of poverty</h3>
            <p class="note">People at risk of poverty live on less than 60% of their country's median income. It is what people say in a survey, not a measured temperature.</p>
            <div class="en-key"><span>${dot("--em-accent")}All people</span><span>${dot("--en-poor")}At risk of poverty</span></div>
            <div class="en-pairs" id="en-pairs"></div>
            <div class="em-cites"></div>
          </div>
        </div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">EU · % of people, ${EUV[0].year} to ${euv.year}</p>
            <h3>Cold homes rose to ${pct(euvPeak.cold_home_pct)} in ${euvPeak.year}, after the price shock</h3>
            <p class="note">Figures before 2019 are Eurostat estimates for the 27 current members. The share behind on utility bills was <b ${t(euv.arrears_source)}>${pct(euv.arrears_pct)}</b> in ${euv.year}.</p>
            <div class="en-key"><span>${dot("--em-accent")}Can't keep warm</span><span>${dot("--en-gas")}Behind on utility bills</span></div>
            <div id="en-euv"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Behind on utility bills · % of people, ${byArr[0].arrears_year}</p>
            <h3>${esc(byArr[0].country)}: ${pct(byArr[0].arrears_pct, 0)} are in arrears</h3>
            <p class="note">Behind on heating, electricity, gas or water bills in the last year because they couldn't pay.</p>
            <div class="em-bars" id="en-arr"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>The typical British bill is <span class="accent">£${f.cap.value.toLocaleString("en-GB")}</span> a year, ${Math.round((100 * capNow.dual_fuel) / preCrisis.dual_fuel - 100)}% above April 2021</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">GB energy price cap · typical dual fuel bill by direct debit, £ a year, ${ym(cap0.start)} to ${ym(capNow.end)}</p>
            <h3>The cap peaked at ${gbp(capPeak.dual_fuel)} for ${ym(capPeak.start)} to ${ym(capPeak.end)}</h3>
            <p class="note">Ofgem's levels for every period worked out at today's typical use, 2,500 kWh of electricity and 9,500 kWh of gas a year, so they can be compared. From October 2022 to June 2023 the government's <span ${t("gov-epg")}>Energy Price Guarantee</span> discounted bills, so households paid less than the shaded peak. Ofgem's own headline figure for October 2026, <b ${t(f.cap.source)}>£${f.cap.value.toLocaleString("en-GB")}</b>, includes a small levelisation charge left out here.</p>
            <div id="en-cap"></div>
            <div class="em-cites"></div>
          </div>
        </div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Households in fuel poverty · England, % of households, ${fp0.year} to ${fpNow.year}</p>
            <h3>${pct(fpNow.pct)} in ${fpNow.year}, ${(fpNow.households_k / 1000).toFixed(2)} million households</h3>
            <p class="note">England's official measure counts a household as fuel poor if it has a low income and lives in a home rated D or worse for energy efficiency. ${fpNow.year} is provisional. DESNZ projects <b ${t(f.fp2026.source)}>${f.fp2026.value} million</b> for 2026, before the effect of the Middle East conflict on prices.</p>
            <div id="en-fp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Average fuel poverty gap by energy efficiency band · England, ${fpNow.year}</p>
            <h3>Fuel poor households in the leakiest homes need ${gbp(fpFG.average_gap)} a year more</h3>
            <p class="note">The gap is how much a fuel poor household's energy costs would have to fall to lift it out. Most fuel poor homes are in band D, where the gap is <b ${t(fpD.source)}>${gbp(fpD.average_gap)}</b>.</p>
            <div class="em-bars" id="en-fpeer"></div>
            <div class="em-cites"></div>
          </div>
        </div>
        <div class="em-grid">
          ${factCard("DESNZ · England, 2025", f.ten_pct, `${f.ten_pct.value} million`, `households, <b ${t(f.ten_pct.source)}>30.4%</b>, would need to spend more than a tenth of their income after housing costs to heat and power their home adequately.`, true)}
          ${factCard("Low income households", f.low_income_share, `${f.low_income_share.value}%`, `of their income after housing costs is what low income households in England would typically need for energy, against 6.8% for all households.`)}
          ${factCard("Ofgem · October to December 2026", f.cap_wholesale, `${f.cap_wholesale.value}%`, `of the cap is wholesale energy, up from 44% the quarter before. VAT on electricity bills is cut to <b ${t(f.cap_vat.source)}>${f.cap_vat.value}%</b> until March 2027.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="en-search" id="en-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap en-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="no_cooking_pct" aria-sort="descending"><button type="button">No clean cooking, %</button></th>
                <th class="r" data-key="no_electricity_pct" aria-sort="none"><button type="button">No electricity, %</button></th>
                <th class="r hide-n" data-key="no_electricity_m" aria-sort="none"><button type="button">No electricity, millions</button></th>
                <th class="r hide-n" data-key="cold_home_pct" aria-sort="none"><button type="button">Can't keep warm, %</button></th>
                <th class="r hide-n" data-key="elec_price_eur" aria-sort="none"><button type="button">Electricity, c/kWh</button></th>
              </tr></thead>
              <tbody id="en-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Access</b> to electricity and to clean cooking fuels and technologies are the shares of people with each, from the World Bank's World Development Indicators (October 2026), which carry the estimates of the Tracking SDG 7 agencies; the latest year is ${Y}. Clean cooking means mainly using electricity, gas, LPG, biogas, solar or alcohol fuels; wood, charcoal, kerosene and coal count as polluting. <b>People without access</b> is our calculation: each country's population in ${Y} times the share without. Our country totals add up to ${Math.round(sumEl)} million without electricity, in line with the ${f.noelec.value} million in the Tracking SDG 7 2026 report. Headline world and regional figures are quoted from the report's joint news release.</p>
        <p><b>Prices</b> are Eurostat's half-yearly household prices for a medium consumer (2,500 to 4,999 kWh of electricity, 20 to 200 GJ of gas a year), including all taxes and levies, in euros and in purchasing power standards. <b>Cold homes</b> and <b>arrears</b> come from the EU Statistics on Income and Living Conditions survey and are what people report; we show each country's latest year from ${2023} on, which leaves out the UK, whose latest Eurostat figures are for 2018, and Iceland. <b>UK</b>: the price cap series is Ofgem's own recalculation of every cap period at the 2026 typical consumption values, for direct debit, before the levelisation adjustment; caps before October 2022 ran for six months. Fuel poverty is England's Low Income Low Energy Efficiency measure from DESNZ; Scotland, Wales and Northern Ireland measure it differently.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("cook", "01", "Cooking", `<span class="accent">${f.nocook.value} billion people</span> cook with polluting fuels`, `Mostly wood, charcoal, kerosene or coal. In ${noCook75.length} countries at least three in four people cook this way.`)}
            ${step("power", "02", "Electricity", `<span class="accent"><b ${t(f.noelec.source)}>${f.noelec.value} million</b></span> have no electricity`, `${esc(byNoEl[0].country)} alone has ${ppl(byNoEl[0].no_electricity_m)}, ${esc(byNoEl[1].country)} ${ppl(byNoEl[1].no_electricity_m)}.`)}
            ${step("trend", "03", "The gap", `Sub-Saharan Africa: <span class="accent">${pct(ssaNow.electricity_pct, 0)}</span> with power, ${pct(ssaNow.cooking_pct, 0)} with clean cooking`, `The world as a whole is at ${pct(wNow.electricity_pct, 0)} and ${pct(wNow.cooking_pct, 0)}.`)}
            ${step("prices", "04", "Europe's bills", `Electricity costs <span class="accent">${cents(byElP[0].elec_price_eur)}</span> a kWh in ${esc(byElP[0].country)}`, `The EU average was <b ${t(euNow.elec_source)}>${cents(euNow.elec_eur)}</b> in the ${half(euNow.period)}.`)}
            ${step("cold", "05", "Cold homes", `<span class="accent">${pct(byCold[0].cold_home_pct, 0)}</span> in ${esc(byCold[0].country)} can't keep warm`, `Across the EU it is ${pct(euv.cold_home_pct)}, and ${pct(euv.cold_home_poor_pct)} of people at risk of poverty.`)}
            ${step("uk", "06", "Britain", `The typical bill is <span class="accent"><b ${t(f.cap.source)}>£${f.cap.value.toLocaleString("en-GB")}</b></span> a year`, `${(fpNow.households_k / 1000).toFixed(2)} million households in England were in fuel poverty in ${fpNow.year}.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="en-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "cooking", sel: "NGA", cur: "eur" };
    const mapEl = main.querySelector("#en-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return { ...ft, properties: { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name, cooking: r ? bandIdx("cooking", r.cooking_band) : -1, electricity: r ? bandIdx("electricity", r.electricity_band) : -1, warm: r ? bandIdx("warm", r.warm_band) : -1 } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: SEQ.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (r, mode) =>
      mode === "cooking" ? (r.no_cooking_pct != null ? `${pct(r.no_cooking_pct, 0)} without clean cooking` : "No cooking figure")
        : mode === "electricity" ? (r.no_electricity_pct != null ? `${pct(r.no_electricity_pct, r.no_electricity_pct < 1 ? 1 : 0)} without electricity` : "No electricity figure")
          : r.cold_home_pct != null ? `${pct(r.cold_home_pct)} can't keep warm` : "Not surveyed";
    map = new maplibregl.Map({
      container: mapEl, style: { version: 8, sources: {}, layers: [] }, center: [10, 22], zoom: 0.6, minZoom: -2, maxZoom: 5, renderWorldCopies: false,
      attributionControl: { compact: true, customAttribution: "Boundaries: Natural Earth" }, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "em-popup" });
    const fit = (animate) => (state.mode === "warm"
      ? map.fitBounds([[-25, 34], [45, 71]], { padding: 16, animate, maxZoom: 4 })
      : map.fitBounds([[-168, -50], [178, 74]], { padding: 16, animate, maxZoom: 4 }));
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
    const scaleEl = main.querySelector("#en-scale");
    const SCALE_TITLE = { cooking: `People without clean cooking, ${Y}:`, electricity: `People without electricity, ${Y}:`, warm: "Can't afford to keep home warm, mostly 2025:" };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}${state.mode === "warm" ? "Not surveyed" : "No data"}</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#en-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const head = state.mode === "cooking"
        ? { eb: `Without clean cooking · ${r.cooking_year ?? Y}`, big: pct(r.no_cooking_pct, 0), s: r.cooking_source, sub: r.no_cooking_m != null ? `${ppl(r.no_cooking_m)} people` : "No estimate" }
        : state.mode === "electricity"
          ? { eb: `Without electricity · ${r.electricity_year ?? Y}`, big: pct(r.no_electricity_pct, r.no_electricity_pct != null && r.no_electricity_pct < 1 ? 1 : 0), s: r.electricity_source, sub: r.no_electricity_m != null ? `${ppl(r.no_electricity_m)} people` : "No estimate" }
          : { eb: `Can't keep home warm · ${r.cold_home_year ?? "not surveyed"}`, big: pct(r.cold_home_pct), s: r.cold_home_source, sub: r.cold_home_pct != null ? `EU <span ${t(euv.cold_source)}>${pct(euv.cold_home_pct)}</span>` : "Only European countries are surveyed" };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="en-pick"><span class="em-eyebrow">Choose</span><select id="en-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${head.s ? t(head.s) : ""}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.electricity_pct != null ? row(`Electricity access · ${r.electricity_year}`, `<span ${t(r.electricity_source)}>${pct(r.electricity_pct)}</span>`) : ""}
          ${r.electricity_rural_pct != null && r.electricity_pct < 99.5 ? row("Rural · urban", `<span ${t(r.electricity_source)}>${pct(r.electricity_rural_pct, 0)} · ${pct(r.electricity_urban_pct, 0)}</span>`) : ""}
          ${r.cooking_pct != null ? row(`Clean cooking · ${r.cooking_year}`, `<span ${t(r.cooking_source)}>${pct(r.cooking_pct, 0)}</span>`) : ""}
          ${r.cooking_2015 != null && r.cooking_pct < 99.5 ? row("Clean cooking · 2015", `<span ${t(r.cooking_source)}>${pct(r.cooking_2015, 0)}</span>`) : ""}
          ${r.cold_home_pct != null ? row(`Can't keep warm · ${r.cold_home_year}`, `<span ${t(r.cold_home_source)}>${pct(r.cold_home_pct)}</span>`) : ""}
          ${r.cold_home_poor_pct != null ? row("At risk of poverty", `<span ${t(r.cold_home_source)}>${pct(r.cold_home_poor_pct)}</span>`) : ""}
          ${r.arrears_pct != null ? row(`Behind on bills · ${r.arrears_year}`, `<span ${t(r.arrears_source)}>${pct(r.arrears_pct)}</span>`) : ""}
          ${r.elec_price_eur != null ? row(`Electricity · ${halfShort(r.price_period)}`, `<span ${t(r.elec_price_source)}>${cents(r.elec_price_eur)} per kWh</span>`) : ""}
          ${r.gas_price_eur != null ? row(`Gas · ${halfShort(r.price_period)}`, `<span ${t(r.gas_price_source)}>${cents(r.gas_price_eur)} per kWh</span>`) : ""}
          ${r.population_m != null ? row(`Population · ${r.population_year}`, `<span ${t(r.population_source)}>${ppl(r.population_m)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#en-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".en-mode").forEach((b) => b.addEventListener("click", () => {
      const was = state.mode;
      state.mode = b.dataset.mode;
      main.querySelectorAll(".en-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mapEl.setAttribute("aria-label", MAPS[state.mode].label);
      if (state.mode === "warm" && BY[state.sel]?.cold_home_pct == null) state.sel = byCold[0].iso3;
      drawScale();
      drawDetail();
      repaint();
      if ((was === "warm") !== (state.mode === "warm") && map.getProjection?.()?.type !== "globe") ready.then(() => fit(true));
    }));
    main.querySelectorAll(".em-proj").forEach((b) => b.addEventListener("click", async () => {
      main.querySelectorAll(".em-proj").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      await ready;
      map.setProjection({ type: b.dataset.proj });
      if (b.dataset.proj === "globe") map.easeTo({ zoom: 1.1, center: state.mode === "warm" ? [15, 50] : [20, 10], duration: 800 });
      else fit(true);
    }));
    drawScale();
    drawDetail();

    // ---------- Line charts ----------
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash, noEnd }]. Labels each line at its end unless noEnd.
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, aria, h = 240, area = false, shade, step: stepped = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name && !s.noEnd) ? (narrow ? 104 : 200) : 76, b: 22, l: 44 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => (stepped && i ? `H${x(a).toFixed(1)}V${y(b).toFixed(1)}` : `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`)).join("");
      const ends = series.filter((s) => !s.noEnd).map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${shade ? `<rect x="${x(shade[0])}" y="${pad.t}" width="${Math.max(0, x(shade[1]) - x(shade[0]))}" height="${h - pad.t - pad.b}" class="en-shade"/>` : ""}
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="en-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${area ? series.map((s) => `<path d="${path(s.pts)}V${y(yMin)}H${x(s.pts[0][0])}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.dash ? 1.8 : 2.4}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const every = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const drawTrend = (el, h) => lineChart(el, {
      series: [
        { name: "World", short: "World", v: "--em-accent", pts: wld.map((r) => [r.year, r.electricity_pct]) },
        { name: "Sub-Saharan Africa", short: "SSA", v: "--em-accent", dash: true, pts: ssa.map((r) => [r.year, r.electricity_pct]) },
        { name: "World", short: "World", v: "--en-cook", pts: wld.map((r) => [r.year, r.cooking_pct]) },
        { name: "Sub-Saharan Africa", short: "SSA", v: "--en-cook", dash: true, pts: ssa.map((r) => [r.year, r.cooking_pct]) },
      ],
      yMax: 100, yStep: 25, fmtY: (v) => `${Math.round(v)}%`, xTicks: every(2005, 2020, 5), h,
      aria: `Access in ${Y}: world electricity ${pct(wNow.electricity_pct)}, clean cooking ${pct(wNow.cooking_pct)}; sub-Saharan Africa electricity ${pct(ssaNow.electricity_pct)}, clean cooking ${pct(ssaNow.cooking_pct)}`,
    });
    const drawEuPrices = (el, h) => lineChart(el, {
      series: [
        { name: "Electricity", short: "Electricity", v: "--em-accent", pts: EUP.filter((r) => r.elec_eur != null).map((r) => [xOfHalf(r.period), r.elec_eur * 100]), endText: cents(euNow.elec_eur) },
        { name: "Gas", short: "Gas", v: "--en-gas", pts: EUP.filter((r) => r.gas_eur != null).map((r) => [xOfHalf(r.period), r.gas_eur * 100]), endText: cents(euNow.gas_eur) },
      ],
      yMax: 30, yStep: 10, fmtY: (v) => `${v}c`, xTicks: every(2016, 2026, 2), xEnd: halfShort(euNow.period), h, step: true,
      aria: `EU household electricity price from ${cents(EUP[0].elec_eur)} per kWh in ${halfShort(EUP[0].period)} to a peak of ${cents(euPeakE.elec_eur)} in ${halfShort(euPeakE.period)} and ${cents(euNow.elec_eur)} in ${halfShort(euNow.period)}`,
    });
    const drawEuPov = (el, h) => lineChart(el, {
      series: [
        { name: "Cold home", short: "Cold", v: "--em-accent", pts: EUV.map((r) => [r.year, r.cold_home_pct]) },
        { name: "Arrears", short: "Arrears", v: "--en-gas", pts: EUV.filter((r) => r.arrears_pct != null).map((r) => [r.year, r.arrears_pct]) },
      ],
      yMax: 12, yStep: 3, fmtY: (v) => `${v}%`, xTicks: every(2016, 2024, 2), h,
      aria: `EU share of people who can't keep their home warm: ${pct(EUV[0].cold_home_pct)} in ${EUV[0].year}, ${pct(euvPeak.cold_home_pct)} in ${euvPeak.year}, ${pct(euv.cold_home_pct)} in ${euv.year}`,
    });
    const capPts = CAP.map((r) => [xOfYm(r.start), r.dual_fuel]);
    capPts.push([xOfYm(capNow.end) + 1 / 12, capNow.dual_fuel]);
    const drawCap = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: capPts, endText: gbp(capNow.dual_fuel) }],
      yMax: 4000, yStep: 1000, fmtY: (v) => (v ? `£${v / 1000}k` : "£0"), xTicks: every(2018, 2026, 2), xEnd: ym(capNow.end), h, area: true, step: true,
      shade: [xOfYm("2022-10"), xOfYm("2023-07")],
      aria: `GB price cap for a typical dual fuel direct debit household, at 2026 typical use: ${gbp(cap0.dual_fuel)} in ${ym(cap0.start)}, a peak of ${gbp(capPeak.dual_fuel)} in ${capPeak.period}, ${gbp(capNow.dual_fuel)} in ${capNow.period}`,
    });
    const drawFp = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: FP.map((r) => [r.year, r.pct]), endText: pct(fpNow.pct) }],
      yMax: 25, yStep: 5, fmtY: (v) => `${v}%`, xTicks: every(2012, 2024, 4), h, area: true,
      aria: `Households in fuel poverty in England: ${pct(fp0.pct)} in ${fp0.year}, ${pct(fpNow.pct)} in ${fpNow.year}`,
    });
    const drawAll = () => {
      drawTrend(main.querySelector("#en-trend"), 260);
      drawEuPrices(main.querySelector("#en-eup"), 230);
      drawEuPov(main.querySelector("#en-euv"), 220);
      drawCap(main.querySelector("#en-cap"), 240);
      drawFp(main.querySelector("#en-fp"), 220);
    };
    drawAll();

    // ---------- Bars ----------
    const elBars = (el, n = 10) => bars(el, byNoEl.slice(0, n).map((r, i) => ({ label: r.country, value: r.no_electricity_m, muted: i > 0, src: r.electricity_source })), (v) => mil(v), byNoEl[0].no_electricity_m, t);
    const ckBars = (el, n = 10) => bars(el, byNoCk.slice(0, n).map((r, i) => ({ label: r.country, value: r.no_cooking_m, muted: i > 0, src: r.cooking_source })), (v) => mil(v), byNoCk[0].no_cooking_m, t);
    elBars(main.querySelector("#en-noel"));
    ckBars(main.querySelector("#en-nock"));
    const priceBars = (el, key, srcKey, n = 12) => {
      const k = `${key}_${state.cur}`;
      const rows = C.filter((r) => r[k] != null).sort((a, b) => b[k] - a[k]).slice(0, n);
      bars(el, rows.map((r, i) => ({ label: r.country, value: r[k] * 100, muted: i > 0, src: r[srcKey] })), (v) => (state.cur === "eur" ? `${v.toFixed(1)}c` : `${v.toFixed(1)}`), rows[0][k] * 100, t);
      return rows;
    };
    const drawPrices = () => {
      const unit = state.cur === "eur" ? "euro cents" : "PPS cents";
      const e = priceBars(main.querySelector("#en-elp"), "elec_price", "elec_price_source");
      const g = priceBars(main.querySelector("#en-gasp"), "gas_price", "gas_price_source");
      main.querySelector("#en-elh").textContent = `Dearest: ${e[0].country}, ${(e[0][`elec_price_${state.cur}`] * 100).toFixed(1)} ${unit}`;
      main.querySelector("#en-gash").textContent = `Dearest: ${g[0].country}, ${(g[0][`gas_price_${state.cur}`] * 100).toFixed(1)} ${unit}`;
    };
    drawPrices();
    main.querySelectorAll(".en-cur").forEach((b) => b.addEventListener("click", () => {
      state.cur = b.dataset.cur;
      main.querySelectorAll(".en-cur").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      drawPrices();
    }));
    const arrBars = (el) => bars(el, byArr.slice(0, 10).map((r, i) => ({ label: r.country, value: r.arrears_pct, muted: i > 0, src: r.arrears_source })), (v) => pct(v, 1), byArr[0].arrears_pct, t);
    arrBars(main.querySelector("#en-arr"));
    bars(main.querySelector("#en-fpeer"), FPE.map((r, i, a) => ({ label: `Band ${r.fpeer_band}`, value: r.average_gap, muted: i < a.length - 1, src: r.source })), (v) => gbp(v), fpFG.average_gap, t);
    function pairBars(el, rows) {
      const max = Math.max(...rows.flatMap((r) => [r.cold_home_pct, r.cold_home_poor_pct ?? 0]));
      const bar = (v, c, s, label) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${(100 * (v ?? 0)) / max}%;background:var(${c})"></b></div><span class="v" ${v != null ? t(s) : ""}>${v == null ? "n/a" : pct(v)}</span></div>`;
      el.innerHTML = rows.map((r) => `<div class="it"><div class="lb">${esc(r.country)} <span class="en-x">${r.cold_home_year}</span></div><div class="tr">
        ${bar(r.cold_home_pct, "--em-accent", r.cold_home_source, `${r.country}: ${pct(r.cold_home_pct)} of all people can't keep warm`)}
        ${bar(r.cold_home_poor_pct, "--en-poor", r.cold_home_source, `${r.country}: ${r.cold_home_poor_pct == null ? "no figure" : pct(r.cold_home_poor_pct)} of people at risk of poverty`)}</div></div>`).join("");
    }
    pairBars(main.querySelector("#en-pairs"), byCold.slice(0, 12));

    // ---------- Table ----------
    const tbody = main.querySelector("#en-tbody"), search = main.querySelector("#en-search");
    let key = "no_cooking_pct", dir = -1;
    const cell = (v, s, hide, d = 1, scale = 1) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : (v * scale).toFixed(d)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="en-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.no_cooking_pct != null ? t(r.cooking_source) : ""}>${r.cooking_band ? `<i class="en-sw" style="background:var(${SEQ[bandIdx("cooking", r.cooking_band)]})"></i>${r.no_cooking_pct.toFixed(1)}` : "–"}</td>
        ${cell(r.no_electricity_pct, r.electricity_source, false)}
        ${cell(r.no_electricity_m, r.electricity_source, true, 2)}
        ${cell(r.cold_home_pct, r.cold_home_source, true)}
        ${cell(r.elec_price_eur, r.elec_price_source, true, 1, 100)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".en-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#en-vis");
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
    const legend = (mode) => `<div class="en-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "cook") {
        vis.innerHTML = `<p class="vt">People without clean cooking, ${Y}</p><div class="m"></div>${legend("cooking")}`;
        miniMap(vis.querySelector(".m"), "cooking");
      } else if (id === "power") {
        vis.innerHTML = `<p class="vt">People without electricity, ${Y}</p><div class="em-bars" id="en-vbars"></div>`;
        elBars(vis.querySelector("#en-vbars"), 8);
      } else if (id === "trend") {
        vis.innerHTML = `<p class="vt">Access to electricity and clean cooking, %</p><div class="en-key"><span>${dot("--em-accent")}Electricity</span><span>${dot("--en-cook")}Clean cooking</span></div><div class="m"></div>`;
        drawTrend(vis.querySelector(".m"), 260);
      } else if (id === "prices") {
        vis.innerHTML = `<p class="vt">EU household prices, euro cents per kWh</p><div class="m"></div>`;
        drawEuPrices(vis.querySelector(".m"), 240);
      } else if (id === "cold") {
        vis.innerHTML = `<p class="vt">Can't keep home warm, % of people</p><div class="en-key"><span>${dot("--em-accent")}All</span><span>${dot("--en-poor")}At risk of poverty</span></div><div class="en-pairs" id="en-vpairs"></div>`;
        pairBars(vis.querySelector("#en-vpairs"), byCold.slice(0, 4));
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">GB price cap, typical dual fuel bill, £ a year</p><div class="m"></div>`;
        drawCap(vis.querySelector(".m"), 240);
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
