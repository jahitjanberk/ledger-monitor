// Wages & the Cost of Living dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--wg-b0", "--wg-b1", "--wg-b2", "--wg-b3", "--wg-b4"];
const MAPS = {
  minwage: { key: "minwage_band", label: "World map of countries coloured by the statutory monthly minimum wage in PPP dollars" },
  poverty: { key: "poverty_band", label: "World map of countries coloured by the share of workers living on less than $3 a day" },
  diet: { key: "diet_band", label: "World map of countries coloured by the cost of a healthy diet for one person as a share of a month's minimum wage" },
  labour: { key: "labour_band", label: "World map of countries coloured by the labour income share of GDP" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthName = (ym) => { const [y, m] = ym.split("-").map(Number); return `${MON[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const nf = (v, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 1) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const sgn = (v, d = 1) => (v == null ? "n/a" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`);
const usd = (v) => (v == null ? "n/a" : `$${nf(v)}`);
const gbp = (v) => `£${v.toFixed(2)}`;
const ordinal = (n) => (n === 1 ? "the" : `the ${["", "", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"][n] ?? `${n}th`}`);
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
  id: "wages",
  title: "Wages & the Cost of Living",
  description:
    "What people earn against what things cost: minimum and average wages by country, real wage growth, working poverty, labour's share of income and what a healthy diet costs on the minimum wage, from the ILO, the OECD, the FAO and the ONS, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r]));
    const W = DATA.world, wNow = W.filter((w) => w.wp_world != null).at(-1), w10 = W.find((w) => w.year === 2010), w00 = W.find((w) => w.year === 2000);
    const lsAct = W.filter((w) => w.ls_world != null && !w.ls_extrapolated), lsNow = lsAct.at(-1), ls0 = W.find((w) => w.ls_world != null);
    const lsEnd = W.filter((w) => w.ls_world != null).at(-1);
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const MW = C.filter((r) => r.min_wage_ppp != null).sort((a, b) => b.min_wage_ppp - a.min_wage_ppp);
    // Rankings use recent years only; older figures stay on the map with their year.
    const MWR = MW.filter((r) => r.min_wage_year >= 2023), mwMed = MWR[Math.floor(MWR.length / 2)];
    const DIET = C.filter((r) => r.diet_share != null).sort((a, b) => b.diet_share - a.diet_share);
    const dietOver = DIET.filter((r) => r.diet_share >= 100), dietQ = DIET.filter((r) => r.diet_share >= 25);
    const POV = C.filter((r) => r.working_poverty != null && r.working_poverty_year === wNow.year).sort((a, b) => b.working_poverty - a.working_poverty);
    const LSC = C.filter((r) => r.labour_share != null);
    const RMW = C.filter((r) => r.oecd_real_min_change_2015 != null).sort((a, b) => b.oecd_real_min_change_2015 - a.oecd_real_min_change_2015);
    const MED = C.filter((r) => r.oecd_min_to_median != null).sort((a, b) => b.oecd_min_to_median - a.oecd_min_to_median);
    const AVW = C.filter((r) => r.oecd_real_change_2019 != null && r.oecd_avg_year === Math.max(...C.map((x) => x.oecd_avg_year ?? 0))).sort((a, b) => b.oecd_real_change_2019 - a.oecd_real_change_2019);
    const avwDown = AVW.filter((r) => r.oecd_real_change_2019 < 0);
    const O = DATA.oecd, oEnd = O.filter((o) => o.avg_oecd != null).at(-1), o19 = O.find((o) => o.year === 2019);
    const oecdChg = 100 * (oEnd.avg_oecd / o19.avg_oecd - 1);
    const AWE = DATA.uk_awe, awe = AWE.at(-1), aweR = AWE.filter((r) => r.real_index_2008 != null);
    const awePeak = aweR.filter((r) => r.month < "2010-01").reduce((a, b) => (b.real_pay_gbp > a.real_pay_gbp ? b : a));
    const aweBack = aweR.find((r) => r.month > awePeak.month && r.real_pay_gbp > awePeak.real_pay_gbp);
    const aweLow = aweR.filter((r) => r.month > awePeak.month && r.month < "2020-01").reduce((a, b) => (b.real_pay_gbp < a.real_pay_gbp ? b : a));
    const NLW = DATA.uk_nlw, nlwNow = NLW.filter((r) => !r.announced).at(-1), nlwNext = NLW.at(-1), nlw0 = NLW[0];
    const LP = DATA.uk_lowpay, lpNow = LP.at(-1), lp0 = LP[0];
    const uk = BY.GBR, us = BY.USA;
    const gwr = [["2022", f.gwr2022, f.adv2022, f.em2022], ["2023", f.gwr2023, f.adv2023, f.em2023], ["2024 (projected)", f.gwr2024, null, null]];
    const mwYears = [...new Set(MW.map((r) => r.min_wage_year))].sort();

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "wages",
      name: "Wages",
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
    const top = MWR[0], bottom = MWR.at(-1);

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Wages · ILO minimum wages to ${mwYears.at(-1)}, UK earnings to ${monthName(awe.month)}</p>
        <h1><b ${t(wNow.wp_source)}>${pct(wNow.wp_world)} of the world's workers</b>, nearly <span ${t(f.poor.source)}>${f.poor.value} million</span> people, <span class="accent">live on less than $3 a day despite having a job</span></h1>
        <p class="em-lede">A full-time minimum wage is worth <b ${t(top.min_wage_source)}>${usd(top.min_wage_ppp)}</b> a month in ${esc(top.country)} and <b ${t(bottom.min_wage_source)}>${usd(bottom.min_wage_ppp)}</b> in ${esc(bottom.country)}, in dollars adjusted for local prices. In <b ${t("fao-cohd")}>${dietQ.length} of ${DIET.length} countries</b>, the cheapest healthy diet for one person costs a quarter or more of a month's minimum wage. Real wages worldwide grew an estimated <b ${t(f.gwr2024.source)}>${f.gwr2024.value}%</b> in 2024, after falling <b ${t(f.gwr2022.source)}>${Math.abs(f.gwr2022.value)}%</b> in 2022.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Pay has recovered from the price shock, <span class="accent">but not everywhere</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Workers living on under $3 a day", pct(wNow.wp_world), `Of all employed people worldwide in ${wNow.year}, down from <span ${t(w10.wp_source)}>${pct(w10.wp_world)}</span> in 2010. In low-income countries it is <span ${t(wNow.wp_source)}>${pct(wNow.wp_low)}</span>`, wNow.wp_source, true)}
          ${kpi("Minimum wage a month, middle country", usd(mwMed.min_wage_ppp), `In PPP dollars, across ${MWR.length} countries with a statutory minimum set since 2023, mostly ${mwYears.includes(2024) ? 2024 : mwYears.at(-1)}. ${esc(mwMed.country)} sits in the middle`, mwMed.min_wage_source)}
          ${kpi("Labour's share of world income", pct(lsNow.ls_world), `Of world GDP in ${lsNow.year}, the share paid to workers, against <span ${t(ls0.ls_source)}>${pct(ls0.ls_world)}</span> in ${ls0.year}`, lsNow.ls_source)}
          ${kpi("Real wage growth, world", `+${f.gwr2024.value}%`, `ILO projection for 2024, the highest in more than 15 years, after <span ${t(f.gwr2022.source)}>${f.gwr2022.value}%</span> in 2022`, f.gwr2024.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Minimum wages, working poverty and food costs <span class="accent">in ${C.length} countries</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="wg-mode" data-mode="minwage" aria-pressed="true">Minimum wage</button>
                <button type="button" class="wg-mode" data-mode="poverty" aria-pressed="false">Working poverty</button>
                <button type="button" class="wg-mode" data-mode="diet" aria-pressed="false">Healthy diet</button>
                <button type="button" class="wg-mode" data-mode="labour" aria-pressed="false">Labour share</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="wg-map" role="region" aria-label="${MAPS.minwage.label}"></div>
            <div class="wg-scale" id="wg-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="wg-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="minimum">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Minimum wages</p><h2>The legal floor ranges from <span class="accent">${usd(bottom.min_wage_ppp)} to ${usd(top.min_wage_ppp)}</span> a month</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Statutory gross monthly minimum wage · PPP dollars a month, latest year</p>
            <h3>The ten highest and ten lowest, figures for 2023 or later</h3>
            <p class="note">PPP dollars adjust for what money buys locally, so they compare living standards better than exchange rates. Where the law sets an hourly or daily rate, the ILO converts it to a full-time month (for example 40 hours a week for 4.33 weeks). Some countries set rates by sector or region; the ILO then uses a representative one. Countries that leave minimum pay to collective bargaining have no figure.</p>
            <div class="em-bars" id="wg-mwbars"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Real hourly minimum wage, change 2015 to ${RMW[0]?.oecd_min_year ?? 2025} · OECD, constant 2025 prices</p>
            <h3>${esc(RMW[0].country)}'s rose ${sgn(RMW[0].oecd_real_min_change_2015, 0)}; the US federal minimum fell ${sgn(us.oecd_real_min_change_2015, 0)}</h3>
            <p class="note">After inflation. The US federal minimum, <b ${t(us.min_wage_source)}>$${nf(us.min_wage_lcu)}</b> a month in the ILO's data, has not changed in cash terms since at least 2010, so rising prices have cut its value every year.</p>
            <div class="wg-div" id="wg-rmw"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Minimum wage as % of the median full-time wage · OECD, latest year</p>
            <h3>The UK's minimum is ${pct(uk.oecd_min_to_median, 0)} of the median, ${ordinal(MED.findIndex((r) => r.iso3 === "GBR") + 1)} highest of ${MED.length} countries</h3>
            <p class="note">How far the floor sits below typical pay. Close to 100% means the minimum is near what the middle full-time worker earns.</p>
            <div class="em-bars" id="wg-med"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="real">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>After inflation</p><h2>Real pay in <span class="accent">${avwDown.length} of ${AVW.length} OECD countries</span> is below its 2019 level</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Real average wage growth · % a year, ILO Global Wage Report 2024-25</p>
            <h3>Prices outran pay in 2022, hitting richer countries hardest</h3>
            <p class="note">Average wages after inflation. G20 groups are the advanced and emerging members of the G20; the ILO did not publish 2024 group figures.</p>
            <div class="wg-gwr" id="wg-gwr"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Average annual wage, change 2019 to ${oEnd.year} · OECD, constant 2025 prices and PPPs</p>
            <h3>${esc(AVW[0].country)} ${sgn(AVW[0].oecd_real_change_2019, 0)}, ${esc(AVW.at(-1).country)} ${sgn(AVW.at(-1).oecd_real_change_2019, 0)}</h3>
            <p class="note">Average pay per full-time-equivalent employee, adjusted for inflation. The UK is ${sgn(uk.oecd_real_change_2019)}, the OECD as a whole ${sgn(oecdChg)}.</p>
            <div class="wg-div" id="wg-avw"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Average annual wage · US dollars at constant 2025 prices and PPPs, ${O[0].year} to ${oEnd.year}</p>
            <h3>The average OECD worker earns ${usd(oEnd.avg_oecd)} a year; the average British worker ${usd(oEnd.avg_gbr)}</h3>
            <p class="note">Full-time equivalent, before tax. UK pay is only ${sgn(uk.oecd_real_change_2008)} higher in real terms than in 2008; Japan's and Italy's are lower.</p>
            <div id="wg-oecd"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="diet">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Wages against food</p><h2>In ${dietOver.length} countries a healthy diet for one person costs <span class="accent">more than the whole minimum wage</span></h2></div></div>
        <p class="em-lede wg-lede2">The FAO prices the cheapest locally available foods that make up a healthy diet. Here that daily cost, for one person, is set against a full month of the minimum wage, both in local currency for the same year. A household feeding more people on one minimum wage needs several times this share. The <a href="../food/index.html">Food dashboard</a> shows the same diet costs in PPP dollars; <a href="../housing/index.html">Housing</a> and <a href="../energy/index.html">Household Energy</a> cover rents, home prices and power bills.</p>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Cost of a healthy diet for one person for a month · % of a month's minimum wage</p>
            <h3>The twelve countries where food takes the biggest bite</h3>
            <p class="note">Mostly ${DIET[0].diet_year}. Above 100%, one person's healthy diet costs more than a full month of minimum-wage pay. A month is 365 ÷ 12 days.</p>
            <div class="em-bars" id="wg-diet"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("The UK", { source: uk.diet_source }, pct(uk.diet_share), `of a month's full-time minimum wage buys one person the cheapest healthy diet the FAO can price in ${uk.diet_year}: <b ${t(uk.diet_source)}>£${uk.diet_cost_lcu.toFixed(2)}</b> a day against <b ${t(uk.min_wage_source)}>£${nf(uk.min_wage_lcu)}</b> a month.`, true)}
          ${factCard("Low-paid workers", f.liclow, `${f.liclow.value}%`, `of wage workers in low-income countries are low-paid, the ILO estimates. Worldwide the lowest-paid tenth earn <b ${t(f.bottom10.source)}>${f.bottom10.value}%</b> of all wages, the highest-paid tenth nearly <b ${t(f.top10.source)}>${f.top10.value}%</b>.`)}
          ${factCard("Informal work", f.informal, `${f.informal.value} billion`, `workers are expected to hold informal jobs in 2026, the ILO says, with limited access to social protection, rights at work and job security.`)}
        </div>
      </section>

      <section class="em-sec" id="poverty">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Working poverty and labour's share</p><h2>Working poverty fell from ${pct(w00.wp_world, 0)} to ${pct(wNow.wp_world)} since 2000, <span class="accent">but barely moved in low-income countries</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Employed people living on less than $3 a day · % of workers, ${w00.year} to ${wNow.year}</p>
            <h3>In low-income countries, ${pct(wNow.wp_low, 0)} of workers are still poor, against ${pct(w00.wp_low, 0)} in 2000</h3>
            <p class="note">ILO modelled estimates, at the international poverty line of $3 a day in PPP terms. Upper-middle-income countries have cut it to ${pct(wNow.wp_umic)}.</p>
            <div id="wg-wp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Working poverty rate · % of workers, ${wNow.year}</p>
            <h3>${esc(POV[0].country)}: ${pct(POV[0].working_poverty, 0)} of workers live on under $3 a day</h3>
            <p class="note">The ten highest. ILO estimates cover ${POV.length} mainly low- and middle-income countries.</p>
            <div class="em-bars" id="wg-pov"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Labour income share · % of GDP, ${ls0.year} to ${lsEnd.year}</p>
            <h3>Workers' share of world income is ${pct(lsNow.ls_world)}, down from ${pct(ls0.ls_world)}</h3>
            <p class="note">The part of GDP paid as wages and as the labour part of self-employed income; the rest goes to profits, rent and interest. Dashed from ${lsAct.at(-1).year + 1}: ILO extrapolation.</p>
            <div id="wg-ls"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Close to home</p><h2>UK real pay took until ${monthName(aweBack.month)} to <span class="accent">beat its 2008 peak</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">UK average weekly earnings in real terms · index, 2008 average = 100, ${monthName(AWE[0].month)} to ${monthName(awe.month)}</p>
            <h3>Real weekly pay is ${(awe.real_index_2008 - 100).toFixed(0)}% above its 2008 level, after more than a decade below it</h3>
            <p class="note">Whole-economy total pay including bonuses, Great Britain, adjusted for CPIH inflation. It peaked in ${monthName(awePeak.month)}, fell to a low in ${monthName(aweLow.month)} and first passed that peak in ${monthName(aweBack.month)}. In cash terms, the average is <b ${t(awe.source)}>£${awe.total_pay_gbp}</b> a week (${monthName(awe.month)}); real growth over the year is <b ${t(awe.source)}>${sgn(awe.real_growth)}</b>.</p>
            <div id="wg-awe"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">National Living Wage · £ an hour, from April each year</p>
            <h3>${gbp(nlw0.rate_gbp_hour)} in ${nlw0.year}, ${gbp(nlwNow.rate_gbp_hour)} now, ${gbp(nlwNext.rate_gbp_hour)} from April ${nlwNext.year}</h3>
            <p class="note">For workers aged ${nlwNow.age_from} and over (25 and over until 2021, 23 until 2024). April ${nlwNext.year}'s rise of <b ${t(f.nlw2027pct.source)}>${f.nlw2027pct.value}%</b> was announced on 28 October 2026.</p>
            <div id="wg-nlw"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">UK employee jobs in low pay · % of jobs, April ${lp0.year} to April ${lpNow.year}</p>
            <h3>${pct(lpNow.low_pay_pct)} of jobs are low-paid, down from ${pct(lp0.low_pay_pct, 0)}</h3>
            <p class="note">Low pay is under two-thirds of the median hourly wage, <b ${t(f.lowline.source)}>${gbp(f.lowline.value)}</b> in 2026 (median <b ${t(f.median.source)}>${gbp(f.median.value)}</b>). The National Living Wage, <b ${t(nlwNow.source)}>${gbp(nlwNow.rate_gbp_hour)}</b> in April 2026, now sits just above that line. 2026 is provisional; 2023 onward may not compare directly with earlier years.</p>
            <div id="wg-lp"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("ONS · April 2026", f.below, nf(f.below.value), `UK employee jobs were paid below the minimum wage for their age, <b ${t(f.belowpct.source)}>${f.belowpct.value}%</b> of the total. The ONS says this is not a measure of non-compliance with the law.`, true)}
          ${factCard("Young workers", f.young, `${f.young.value}%`, `of employees aged 16 to 21 were low-paid in April 2026, and <b ${t(f.hospitality.source)}>${f.hospitality.value}%</b> of jobs in hotels, restaurants and cafés.`)}
          ${factCard("Against the OECD", { source: uk.oecd_wage_source }, usd(uk.oecd_avg_wage), `average UK annual wage in ${uk.oecd_avg_year}, at constant prices and PPPs: ${sgn(uk.oecd_real_change_2019)} on 2019, against <b ${t(us.oecd_wage_source)}>${sgn(us.oecd_real_change_2019)}</b> in the US.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="wg-search" id="wg-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap wg-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="min_wage_ppp" aria-sort="descending"><button type="button">Minimum wage, PPP $ a month</button></th>
                <th class="r hide-n" data-key="avg_earnings_ppp" aria-sort="none"><button type="button">Average earnings, PPP $ a month</button></th>
                <th class="r" data-key="working_poverty" aria-sort="none"><button type="button">Working poverty, %</button></th>
                <th class="r hide-n" data-key="diet_share" aria-sort="none"><button type="button">Healthy diet, % of minimum wage</button></th>
                <th class="r hide-n" data-key="labour_share" aria-sort="none"><button type="button">Labour share, % GDP</button></th>
              </tr></thead>
              <tbody id="wg-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">09</span>Method</p>
        <p><b>Minimum wages</b> are the ILO's statutory gross monthly minimum wage at the end of each year, the latest year since 2021 (mostly 2024), converted to dollars at purchasing power parities for household consumption. These PPP dollars match the World Bank's PPP conversion factor for private consumption for the same year. Where the law sets an hourly, daily or weekly rate the ILO converts it to a full-time month; where rates differ by region or sector it takes the capital's, an average, or the rate for manufacturing or unskilled work. In ${C.filter((r) => r.min_wage_flag).length} countries the ILO's minimum wage is under a tenth of ILO average earnings, a sign that it has not been raised for decades or is recorded in another unit; they are left out of the map and the comparisons. <b>Average earnings</b> are ILO mean monthly earnings of employees, latest year since 2019, from each country's own surveys.</p>
        <p><b>Healthy diet against the minimum wage</b> divides the FAO's daily cost of the cheapest healthy diet for one person, times 365 ÷ 12, by the monthly minimum wage, both in local currency for the same year. The comparison is dropped where the ILO's and FAO's local-currency-per-PPP-dollar rates disagree by more than a quarter, which would mean they use different currencies. <b>Working poverty</b> is the ILO's modelled share of employed people aged 15 and over living below $3 a day. <b>Labour income share</b> is labour income, including part of self-employed income, as a share of GDP; ILO says imputed values should not be used to compare countries, so each country's figure is its latest year based on national data. <b>OECD</b> figures are average annual wages per full-time-equivalent employee and real hourly minimum wages, both in US dollars at constant 2025 prices and 2025 PPPs; Malta's OECD minimum wage is left out because it is far below what the ILO's figure implies. <b>UK</b> figures are ONS average weekly earnings (total pay, Great Britain), deflated by CPIH; the National Living Wage from GOV.UK; and low pay from the Annual Survey of Hours and Earnings.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("poor", "01", "Working poverty", `<span class="accent">${pct(wNow.wp_world)}</span> of workers live on under $3 a day`, `Nearly <b ${t(f.poor.source)}>${f.poor.value} million</b> people with a job. In ${esc(POV[0].country)} it is <b ${t(POV[0].poverty_source)}>${pct(POV[0].working_poverty, 0)}</b> of workers.`)}
            ${step("floor", "02", "The legal floor", `A minimum wage buys <span class="accent">${usd(top.min_wage_ppp)}</span> a month in ${esc(top.country)}`, `In ${esc(bottom.country)} it is ${usd(bottom.min_wage_ppp)}, in dollars adjusted for local prices.`)}
            ${step("diet", "03", "Food", `In ${esc(DIET[0].country)} a healthy diet costs <span class="accent">${pct(DIET[0].diet_share, 0)}</span> of the minimum wage`, `For one person. In ${dietOver.length} countries it costs more than the whole wage; in the UK, <b ${t(uk.diet_source)}>${pct(uk.diet_share)}</b>.`)}
            ${step("real", "04", "Inflation", `Real wages fell <span class="accent">${Math.abs(f.adv2022.value)}%</span> in rich G20 economies in 2022`, `World real wages grew an estimated <b ${t(f.gwr2024.source)}>${f.gwr2024.value}%</b> in 2024 as inflation eased.`)}
            ${step("share", "05", "Who gets the income", `Workers get <span class="accent">${pct(lsNow.ls_world)}</span> of world GDP`, `Down from ${pct(ls0.ls_world)} in ${ls0.year}.`)}
            ${step("uk", "06", "The UK", `Real pay took until <span class="accent">${monthName(aweBack.month)}</span> to beat 2008`, `The National Living Wage rises to <b ${t(f.nlw2027.source)}>${gbp(f.nlw2027.value)}</b> an hour in April 2027.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="wg-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "minwage", sel: "IND" };
    const mapEl = main.querySelector("#wg-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        const p = { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name };
        for (const m of Object.keys(MAPS)) p[m] = r ? bandIdx(m, r[MAPS[m].key]) : -1;
        return { ...ft, properties: p };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: SEQ.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const valueText = (r, mode) =>
      mode === "minwage" ? (r.min_wage_ppp != null ? `minimum wage ${usd(r.min_wage_ppp)} a month (PPP, ${r.min_wage_year})` : "No comparable minimum wage")
        : mode === "poverty" ? (r.working_poverty != null ? `${pct(r.working_poverty)} of workers under $3 a day` : "No estimate")
          : mode === "diet" ? (r.diet_share != null ? `healthy diet ${pct(r.diet_share, 0)} of the minimum wage` : "No comparison")
            : r.labour_share != null ? `labour share ${pct(r.labour_share)} of GDP (${r.labour_share_year})` : "No national estimate";
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
    const scaleEl = main.querySelector("#wg-scale");
    const SCALE_TITLE = { minwage: "Monthly minimum wage, PPP dollars:", poverty: `Workers living on under $3 a day, ${wNow.year}:`, diet: "Healthy diet for one person, % of a month's minimum wage:", labour: "Labour income share, % of GDP, latest national data:" };
    const NODATA = { minwage: "No statutory minimum or not comparable", poverty: "Not estimated (mostly high-income)", diet: "No comparison", labour: "No national estimate" };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}${NODATA[state.mode]}</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#wg-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const H = {
        minwage: { eb: `Minimum wage · ${r.min_wage_year ?? "latest"}`, big: r.min_wage_ppp != null ? `${usd(r.min_wage_ppp)} a month` : "n/a", s: r.min_wage_source, sub: r.min_wage_ppp != null ? `in PPP dollars; the middle country is <span ${t(mwMed.min_wage_source)}>${usd(mwMed.min_wage_ppp)}</span>` : r.min_wage_flag ? esc(r.min_wage_flag) : "No statutory minimum wage in ILO's data" },
        poverty: { eb: `Workers under $3 a day · ${r.working_poverty_year ?? wNow.year}`, big: r.working_poverty != null ? pct(r.working_poverty) : "n/a", s: r.poverty_source, sub: r.working_poverty != null ? `world <span ${t(wNow.wp_source)}>${pct(wNow.wp_world)}</span>${r.working_poverty_imputed ? "; ILO imputed this estimate" : ""}` : "ILO estimates cover mainly low- and middle-income countries" },
        diet: { eb: `Healthy diet, one person · ${r.diet_year ?? "latest"}`, big: r.diet_share != null ? `${pct(r.diet_share, 0)} of the minimum wage` : "n/a", s: r.diet_source, sub: r.diet_share != null ? `${nf(r.diet_cost_lcu, 2)} ${esc(r.currency ?? "")} a day, for a month, against the monthly minimum wage` : "Needs a comparable minimum wage and FAO diet cost for the same year" },
        labour: { eb: `Labour income share · ${r.labour_share_year ?? "latest"}`, big: r.labour_share != null ? `${pct(r.labour_share)} of GDP` : "n/a", s: r.labour_share_source, sub: r.labour_share != null ? `world <span ${t(lsNow.ls_source)}>${pct(lsNow.ls_world)}</span> in ${lsNow.year}` : "No estimate based on national data" },
      }[state.mode];
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="wg-pick"><span class="em-eyebrow">Choose</span><select id="wg-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(H.eb)}</p>
        <p class="em-d-value" ${H.big !== "n/a" ? t(H.s) : ""}>${esc(H.big)}</p>
        <p class="em-d-usd">${H.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.min_wage_ppp != null ? row(`Minimum wage · ${r.min_wage_year}`, `<span ${t(r.min_wage_source)}>${usd(r.min_wage_ppp)} PPP, ${usd(r.min_wage_usd)} at market rates</span>`) : ""}
          ${r.min_wage_lcu != null && r.min_wage_ppp != null ? row("In local currency", `<span ${t(r.min_wage_source)}>${nf(r.min_wage_lcu, r.min_wage_lcu < 100 ? 2 : 0)} ${esc(r.currency ?? "")} a month</span>`) : ""}
          ${r.min_wage_type && r.min_wage_ppp != null ? row("Type", esc(r.min_wage_type)) : ""}
          ${r.avg_earnings_ppp != null ? row(`Average earnings · ${r.avg_earnings_year}`, `<span ${t(r.avg_earnings_source)}>${usd(r.avg_earnings_ppp)} PPP a month</span>`) : ""}
          ${r.min_to_avg_pct != null ? row("Minimum ÷ average", `<span ${t(r.min_wage_source, r.avg_earnings_source)}>${r.min_to_avg_pct}%</span>`) : ""}
          ${r.working_poverty != null ? row(`Working poverty · ${r.working_poverty_year}`, `<span ${t(r.poverty_source)}>${pct(r.working_poverty)}</span>${r.working_poverty_2015 != null ? ` <span class="wg-x">(${pct(r.working_poverty_2015)} in 2015)</span>` : ""}`) : ""}
          ${r.diet_share != null ? row(`Healthy diet · ${r.diet_year}`, `<span ${t(r.diet_source)}>${pct(r.diet_share, 0)} of the minimum wage</span>`) : ""}
          ${r.labour_share != null ? row(`Labour share · ${r.labour_share_year}`, `<span ${t(r.labour_share_source)}>${pct(r.labour_share)} of GDP</span>`) : ""}
          ${r.oecd_avg_wage != null ? row(`OECD average wage · ${r.oecd_avg_year}`, `<span ${t(r.oecd_wage_source)}>${usd(r.oecd_avg_wage)} a year, ${sgn(r.oecd_real_change_2019)} real since 2019</span>`) : ""}
          ${r.oecd_real_min_hourly != null ? row(`OECD real minimum · ${r.oecd_min_year}`, `<span ${t(r.oecd_min_source)}>$${r.oecd_real_min_hourly.toFixed(2)} an hour, ${sgn(r.oecd_real_min_change_2015)} since 2015</span>`) : ""}
          ${r.oecd_min_to_median != null ? row(`Minimum ÷ median · ${r.oecd_min_to_median_year}`, `<span ${t(r.oecd_min_source)}>${pct(r.oecd_min_to_median, 0)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#wg-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".wg-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".wg-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], dash, noEnd, endText }]
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name && !s.noEnd) ? (narrow ? 104 : 150) : 72, b: 22, l: 44 };
      const xs = series.flatMap((s) => s.pts.map((q) => q[0])), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.t - pad.b);
      const ticks = []; for (let v = yMin; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = (pts) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const ends = series.filter((s) => !s.noEnd).map((s) => ({ ...s, last: s.pts.at(-1), ly: y(s.pts.at(-1)[1]) })).sort((a, b) => a.ly - b.ly);
      ends.forEach((e, i) => { if (i && e.ly - ends[i - 1].ly < 14) e.ly = ends[i - 1].ly + 14; });
      const xt = []; let lastX = x(x0);
      for (const v of xTicks ?? []) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="wg-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="wg-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity="${s.dash ? ".06" : ".12"}"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="${s.dash ? 1.8 : 2.4}" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const every = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const WPS = [["wp_low", "Low-income", "Low", "--wg-neg"], ["wp_ssa", "Sub-Saharan Africa", "SSA", "--wg-b3"], ["wp_lmic", "Lower-middle", "Lower-mid", "--wg-muted"], ["wp_world", "World", "World", "--em-accent"]];
    const drawWp = (el, h) => lineChart(el, {
      series: WPS.map(([k, name, short, v]) => ({ name, short, v, pts: W.filter((w) => w[k] != null).map((w) => [w.year, w[k]]), endText: pct(wNow[k], 0) })),
      yMax: 70, yStep: 10, fmtY: (v) => `${v}%`, xTicks: every(2000, 2025, 5), h,
      aria: `Working poverty, ${w00.year} to ${wNow.year}: world ${pct(w00.wp_world)} to ${pct(wNow.wp_world)}, low-income countries ${pct(w00.wp_low)} to ${pct(wNow.wp_low)}`,
    });
    const lsSplit = (k, o) => {
      const act = W.filter((w) => w[k] != null && !w.ls_extrapolated).map((w) => [w.year, w[k]]);
      const ext = W.filter((w) => w[k] != null && (w.ls_extrapolated || w.year === act.at(-1)[0])).map((w) => [w.year, w[k]]);
      return [{ ...o, pts: act, noEnd: true }, { ...o, pts: ext, dash: true, endText: pct(ext.at(-1)[1], 1) }];
    };
    const drawLs = (el, h) => lineChart(el, {
      series: [...lsSplit("ls_high", { name: "High-income", short: "High", v: "--wg-muted" }), ...lsSplit("ls_world", { name: "World", short: "World", v: "--em-accent" }), ...lsSplit("ls_low", { name: "Low-income", short: "Low", v: "--wg-neg" })],
      yMin: 30, yMax: 60, yStep: 10, fmtY: (v) => `${v}%`, xTicks: every(2005, 2025, 5), h,
      aria: `Labour income share of world GDP: ${pct(ls0.ls_world)} in ${ls0.year}, ${pct(lsNow.ls_world)} in ${lsNow.year}`,
    });
    const OS = [["avg_usa", "US", "--wg-b3"], ["avg_deu", "Germany", "--wg-muted"], ["avg_gbr", "UK", "--em-accent"], ["avg_oecd", "OECD", "--wg-pos"], ["avg_jpn", "Japan", "--wg-neg"]];
    const drawOecd = (el, h) => lineChart(el, {
      series: OS.map(([k, name, v]) => ({ name, short: name, v, pts: O.filter((o) => o[k] != null).map((o) => [o.year, o[k] / 1000]), endText: `$${(oEnd[k] / 1000).toFixed(0)}k` })),
      yMin: 40, yMax: 90, yStep: 10, fmtY: (v) => `$${v}k`, xTicks: every(2000, 2025, 5), h,
      aria: `Average annual wage at constant 2025 prices and PPPs, ${oEnd.year}: US ${usd(oEnd.avg_usa)}, Germany ${usd(oEnd.avg_deu)}, UK ${usd(oEnd.avg_gbr)}, OECD ${usd(oEnd.avg_oecd)}, Japan ${usd(oEnd.avg_jpn)}`,
    });
    const drawAwe = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: aweR.map((r) => [xOf(r.month), r.real_index_2008]), endText: String(awe.real_index_2008.toFixed(0)) }],
      yMin: 70, yMax: 110, yStep: 10, fmtY: (v) => String(v), ref: { v: 100, label: "2008 average" }, xTicks: every(2005, 2025, 5), xEnd: monthName(awe.month), h,
      aria: `UK real average weekly earnings, index 2008 = 100: ${aweR[0].real_index_2008} in ${monthName(aweR[0].month)}, ${aweLow.real_index_2008} at the low in ${monthName(aweLow.month)}, ${awe.real_index_2008} in ${monthName(awe.month)}`,
    });
    const drawNlw = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: NLW.filter((r) => !r.announced).map((r) => [r.year, r.rate_gbp_hour]), noEnd: true }, { v: "--em-accent", dash: true, pts: NLW.slice(-2).map((r) => [r.year, r.rate_gbp_hour]), endText: gbp(nlwNext.rate_gbp_hour) }],
      yMin: 0, yMax: 15, yStep: 5, fmtY: (v) => `£${v}`, xTicks: every(2019, 2027, 2), h, area: true,
      aria: `National Living Wage: ${gbp(nlw0.rate_gbp_hour)} an hour in April ${nlw0.year}, ${gbp(nlwNow.rate_gbp_hour)} in April ${nlwNow.year}, ${gbp(nlwNext.rate_gbp_hour)} from April ${nlwNext.year}`,
    });
    const drawLp = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: LP.map((r) => [r.year, r.low_pay_pct]), endText: pct(lpNow.low_pay_pct) }],
      yMax: 25, yStep: 5, fmtY: (v) => `${v}%`, xTicks: every(2000, 2025, 5), h, area: true,
      aria: `UK low-paid jobs: ${pct(lp0.low_pay_pct)} in ${lp0.year}, ${pct(lpNow.low_pay_pct)} in ${lpNow.year}`,
    });
    const drawAll = () => {
      drawWp(main.querySelector("#wg-wp"), 260);
      drawLs(main.querySelector("#wg-ls"), 230);
      drawOecd(main.querySelector("#wg-oecd"), 260);
      drawAwe(main.querySelector("#wg-awe"), 230);
      drawNlw(main.querySelector("#wg-nlw"), 200);
      drawLp(main.querySelector("#wg-lp"), 200);
    };
    drawAll();

    // ---------- Bars ----------
    const mwRows = [...MWR.slice(0, 10).map((r, i) => ({ label: r.country, value: r.min_wage_ppp, muted: i > 0, src: r.min_wage_source, group: "Highest" })),
      ...MWR.slice(-10).map((r) => ({ label: r.country, value: r.min_wage_ppp, muted: true, src: r.min_wage_source, group: "Lowest" }))];
    const mwBars = (el) => bars(el, mwRows, (v) => usd(v), MWR[0].min_wage_ppp, t);
    mwBars(main.querySelector("#wg-mwbars"));
    bars(main.querySelector("#wg-med"), MED.slice(0, 12).map((r) => ({ label: r.country, value: r.oecd_min_to_median, muted: r.iso3 !== "GBR", src: r.oecd_min_source })), (v) => pct(v, 0), Math.max(100, MED[0].oecd_min_to_median), t);
    const dietBars = (el, n = 12) => bars(el, DIET.slice(0, n).map((r, i) => ({ label: r.country, value: r.diet_share, muted: i > 0, src: r.diet_source })), (v) => pct(v, 0), DIET[0].diet_share, t);
    dietBars(main.querySelector("#wg-diet"));
    const povBars = (el) => bars(el, POV.slice(0, 10).map((r, i) => ({ label: r.country, value: r.working_poverty, muted: i > 0, src: r.poverty_source })), (v) => pct(v, 0), 100, t);
    povBars(main.querySelector("#wg-pov"));
    // Diverging bars: rows { label, value, src, hl }
    function divBars(el, rows, fmt) {
      const m = Math.max(...rows.map((r) => Math.abs(r.value)));
      el.innerHTML = rows.map((r) => {
        const w = (50 * Math.abs(r.value)) / m;
        return `<span class="lb${r.hl ? " hl" : ""}">${esc(r.label)}</span><span class="tr" role="img" aria-label="${esc(`${r.label}: ${fmt(r.value)}`)}"><b class="${r.value < 0 ? "neg" : "pos"}" style="${r.value < 0 ? `right:50%` : `left:50%`};width:${w}%"></b></span><span class="v" ${t(r.src)}>${esc(fmt(r.value))}</span>`;
      }).join("");
    }
    divBars(main.querySelector("#wg-rmw"), RMW.map((r) => ({ label: r.country, value: r.oecd_real_min_change_2015, src: r.oecd_min_source, hl: r.iso3 === "GBR" || r.iso3 === "USA" })), (v) => sgn(v, 0));
    divBars(main.querySelector("#wg-avw"), AVW.map((r) => ({ label: r.country, value: r.oecd_real_change_2019, src: r.oecd_wage_source, hl: r.iso3 === "GBR" })), (v) => sgn(v, 1));
    const gwrChart = (el) => {
      el.innerHTML = `<div class="wg-key"><span>${dot("--em-accent")}World</span><span>${dot("--wg-muted")}Advanced G20</span><span>${dot("--wg-pos")}Emerging G20</span></div>` +
        gwr.map(([yr, a, b, c]) => `<div class="wg-gwr-y"><span class="yr">${esc(yr)}</span>${[[a, "--em-accent", "World"], [b, "--wg-muted", "Advanced G20"], [c, "--wg-pos", "Emerging G20"]].filter(([x]) => x).map(([x, v, n]) =>
          `<span class="tr" role="img" aria-label="${esc(`${n}, ${yr}: ${sgn(x.value)}`)}"><b style="background:var(${v});${x.value < 0 ? "right:50%" : "left:50%"};width:${(50 * Math.abs(x.value)) / 6.5}%"></b></span><span class="v" ${t(x.source)}>${sgn(x.value)}</span>`).join("")}</div>`).join("");
    };
    gwrChart(main.querySelector("#wg-gwr"));

    // ---------- Table ----------
    const tbody = main.querySelector("#wg-tbody"), search = main.querySelector("#wg-search");
    let key = "min_wage_ppp", dir = -1;
    const cell = (v, s, hide, d = 1, band) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : `${band ?? ""}${nf(v, d)}`}</td>`;
    const sw = (map, b) => (b ? `<i class="wg-sw" style="background:var(${SEQ[bandIdx(map, b)]})"></i>` : "");
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => r.iso3 !== "OECD" && (!q || r.country.toLowerCase().includes(q))).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="wg-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        ${cell(r.min_wage_ppp, r.min_wage_source, false, 0, sw("minwage", r.minwage_band))}
        ${cell(r.avg_earnings_ppp, r.avg_earnings_source, true, 0)}
        ${cell(r.working_poverty, r.poverty_source, false, 1, sw("poverty", r.poverty_band))}
        ${cell(r.diet_share, r.diet_source, true, 0)}
        ${cell(r.labour_share, r.labour_share_source, true, 1)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".wg-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#wg-vis");
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
    const legend = (mode) => `<div class="wg-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "poor") {
        vis.innerHTML = `<p class="vt">Workers living on under $3 a day, ${wNow.year}</p><div class="m"></div>${legend("poverty")}`;
        miniMap(vis.querySelector(".m"), "poverty");
      } else if (id === "floor") {
        vis.innerHTML = `<p class="vt">Monthly minimum wage, PPP dollars</p><div class="m"></div>${legend("minwage")}`;
        miniMap(vis.querySelector(".m"), "minwage");
      } else if (id === "diet") {
        vis.innerHTML = `<p class="vt">Healthy diet for one person, % of a month's minimum wage</p><div class="em-bars" id="wg-vdiet"></div>`;
        dietBars(vis.querySelector("#wg-vdiet"), 10);
      } else if (id === "real") {
        vis.innerHTML = `<p class="vt">Real average wage growth, % a year</p><div class="wg-gwr" id="wg-vgwr"></div>`;
        gwrChart(vis.querySelector("#wg-vgwr"));
      } else if (id === "share") {
        vis.innerHTML = `<p class="vt">Labour income share, % of GDP</p><div class="m"></div>`;
        drawLs(vis.querySelector(".m"), 240);
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">UK real weekly pay, 2008 = 100</p><div class="m"></div>`;
        drawAwe(vis.querySelector(".m"), 240);
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
