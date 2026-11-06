// Vaccination & Health Workers dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--vx-b0", "--vx-b1", "--vx-b2", "--vx-b3", "--vx-b4"];
const MAPS = {
  dtp3: { key: "dtp3_band", label: "World map of countries coloured by the share of infants who completed three doses of DTP vaccine" },
  zero: { key: "zero_band", label: "World map of countries coloured by the share of infants who received no dose of DTP vaccine" },
  measles: { key: "measles_band", label: "World map of countries coloured by reported measles cases per million people" },
  nurses: { key: "nurses_band", label: "World map of countries coloured by nurses and midwives per 10,000 people" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const nf = (v, d = 0) => (v == null ? "n/a" : v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (v, d = 0) => (v == null ? "n/a" : `${nf(v, d)}%`);
const mn = (v, d = 1) => (v == null ? "n/a" : `${nf(v, d)} million`);
const people = (v) => (v == null ? "n/a" : v >= 1e6 ? mn(v / 1e6, v >= 1e7 ? 1 : 2) : nf(v));
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
  id: "vaccines",
  title: "Vaccination & Health Workers",
  description:
    "How many children are vaccinated, how many get no vaccines at all, where measles is spreading, and whether countries have enough doctors, nurses and midwives, from WHO, UNICEF and UKHSA data, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year, B = DATA.base;
    const W = DATA.world, w = (y) => W.find((r) => r.year === y), wNow = w(Y), wPrev = w(Y - 1), wBase = w(B), w2000 = w(2000);
    const RG = DATA.regions, glob = RG.find((r) => r.code === "GLOBAL"), regs = RG.filter((r) => r.code !== "GLOBAL");
    const afr = RG.find((r) => r.code === "AFR"), eur = RG.find((r) => r.code === "EUR");
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const byZero = C.filter((r) => r.zero_dose != null).sort((a, b) => b.zero_dose - a.zero_dose);
    const zTotal = wNow.zero_dose_m * 1e6;
    const top10 = byZero.slice(0, 10), top10Share = (100 * top10.reduce((s, r) => s + r.zero_dose, 0)) / zTotal;
    let cum = 0; const halfN = byZero.findIndex((r) => (cum += r.zero_dose) >= zTotal / 2) + 1;
    const lead = byZero[0];
    const under80 = C.filter((r) => r.dtp3 != null && r.dtp3 < 80).length;
    const mcv2at95 = C.filter((r) => r.mcv2 != null && r.mcv2 >= 95).length, withMcv2 = C.filter((r) => r.mcv2 != null).length;
    const mLow = W.filter((r) => r.year >= 2000 && r.year <= B && r.measles_cases != null).reduce((a, b) => (b.measles_cases < a.measles_cases ? b : a));
    const m21 = w(2021);
    const mPeak = W.filter((r) => r.year > B && r.measles_cases != null).reduce((a, b) => (b.measles_cases > a.measles_cases ? b : a));
    const mRatio = wNow.measles_cases / mLow.measles_cases;
    const byInc = C.filter((r) => r.measles_per_m != null && r.measles_cases >= 500).sort((a, b) => b.measles_per_m - a.measles_per_m);
    const byFall = C.filter((r) => r.mcv1 != null && r.mcv1_2019 != null && r.surviving_infants >= 50000).map((r) => ({ ...r, fall: r.mcv1_2019 - r.mcv1 })).filter((r) => r.fall > 0).sort((a, b) => b.fall - a.fall);
    const byNurse = C.filter((r) => r.nurses_per_10k != null).sort((a, b) => a.nurses_per_10k - b.nurses_per_10k);
    const UKC = DATA.uk_cover, ukLast = UKC.at(-1), uk24 = UKC.filter((r) => r.mmr_24m != null), uk5 = UKC.filter((r) => r.mmr2_5y != null);
    const ukLow24 = uk24.filter((r) => r.start < 2008).reduce((a, b) => (b.mmr_24m < a.mmr_24m ? b : a));
    const ukPeak24 = uk24.filter((r) => r.start < ukLow24.start).reduce((a, b) => (b.mmr_24m > a.mmr_24m ? b : a)), ukHigh24 = uk24.filter((r) => r.start > ukLow24.start).reduce((a, b) => (b.mmr_24m > a.mmr_24m ? b : a));
    const uk5Peak = uk5.reduce((a, b) => (b.mmr2_5y > a.mmr2_5y ? b : a));
    const NAT = DATA.uk_nations, natRows = NAT.filter((r) => r.area !== "United Kingdom").sort((a, b) => b.mmr2_5y - a.mmr2_5y), natUK = NAT.find((r) => r.area === "United Kingdom"), natEng = NAT.find((r) => r.area === "England");
    const UKM = DATA.uk_measles.filter((r) => r.year >= 2000), ukmNow = UKM.at(-1), ukmPrev = UKM.find((r) => r.year === Y - 1);
    const uk = BY.GBR;
    const afrInfants = DATA.regions.find((r) => r.code === "AFR").surviving_infants_m;
    const zeroChange = Math.round((wPrev.zero_dose_m - wNow.zero_dose_m) * 1e6);

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "vaccines",
      name: "Vaccines",
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
        <p class="em-eyebrow"><span class="num">00</span>Vaccines · WHO/UNICEF estimates for ${Y}, England to ${esc(ukLast.fiscal_year)}</p>
        <h1><b>${mn(wNow.zero_dose_m)} babies</b> <span class="accent">did not get a single vaccine</span> in ${Y}</h1>
        <p class="em-lede">That is <b ${t(wNow.coverage_source)}>${pct(100 - wNow.dtp1)}</b> of the ${mn(wNow.surviving_infants_m)} infants who lived to their first birthday. ${esc(lead.country)} alone had <b ${t(lead.coverage_source)}>${people(lead.zero_dose)}</b>. Worldwide, <b ${t(wNow.coverage_source)}>${pct(wNow.dtp3)}</b> of infants completed three doses of DTP vaccine and <b ${t(wNow.coverage_source)}>${pct(wNow.mcv2)}</b> had both measles doses, well short of the 95% that stops outbreaks. Countries reported <b ${t(wNow.cases_source)}>${nf(wNow.measles_cases)}</b> measles cases in ${Y}.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Coverage is back near 2019 levels, <span class="accent">but not past them</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Zero-dose children", mn(wNow.zero_dose_m), `No dose of DTP vaccine by their first birthday in ${Y}. <span ${t(wPrev.coverage_source)}>${mn(wPrev.zero_dose_m)}</span> in ${Y - 1}, <span ${t(wBase.coverage_source)}>${mn(wBase.zero_dose_m)}</span> in ${B}`, wNow.coverage_source, true)}
          ${kpi("Three doses of DTP", pct(wNow.dtp3), `Of infants worldwide in ${Y}, against <span ${t(wBase.coverage_source)}>${pct(wBase.dtp3)}</span> in ${B}. ${under80} countries are below 80%`, wNow.coverage_source)}
          ${kpi("Both measles doses", pct(wNow.mcv2), `First dose <span ${t(wNow.coverage_source)}>${pct(wNow.mcv1)}</span>. 95% is needed to stop outbreaks; ${mcv2at95} of ${withMcv2} countries reach it for the second dose`, wNow.coverage_source)}
          ${kpi("Nurses the world is short of", `${f.shortage.value} million`, `In 2023, among <span ${t(f.nurses.source)}>${f.nurses.value} million</span> nurses. WHO projects a shortage of <span ${t(f.shortage2030.source)}>${f.shortage2030.value} million</span> by 2030`, f.shortage.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Vaccines, measles and nurses <span class="accent">in ${C.length} countries</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="vx-mode" data-mode="zero" aria-pressed="true">Zero-dose</button>
                <button type="button" class="vx-mode" data-mode="dtp3" aria-pressed="false">Three doses</button>
                <button type="button" class="vx-mode" data-mode="measles" aria-pressed="false">Measles</button>
                <button type="button" class="vx-mode" data-mode="nurses" aria-pressed="false">Nurses</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="vx-map" role="region" aria-label="${MAPS.zero.label}"></div>
            <div class="vx-scale" id="vx-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="vx-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="zero">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>Children with no vaccines</p><h2>Ten countries hold <span class="accent">${pct(top10Share)}</span> of the world's zero-dose children</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Zero-dose children worldwide · millions, 2000 to ${Y}</p>
            <h3>Down from ${mn(w2000.zero_dose_m)} in 2000 to ${mn(wNow.zero_dose_m)} in ${Y}</h3>
            <p class="note">The pandemic undid a decade of progress: the count rose to <b ${t(w(2021).coverage_source)}>${mn(w(2021).zero_dose_m)}</b> in 2021. It fell by <b ${t(wNow.coverage_source)}>${nf(zeroChange)}</b> in ${Y} but is still above the ${B} level.</p>
            <div id="vx-zerotrend"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Zero-dose children by country · ${Y}</p>
            <h3>${esc(lead.country)} has ${people(lead.zero_dose)}${lead.zero_dose > byZero[1].zero_dose + byZero[2].zero_dose ? ", more than the next two countries together" : ""}</h3>
            <p class="note">Infants who had no dose of DTP vaccine by their first birthday.</p>
            <div class="em-bars" id="vx-topzero"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Zero-dose children by WHO region · millions, ${Y}</p>
            <h3>WHO's African Region has ${mn(afr.zero_dose_m)}, ${pct((100 * afr.zero_dose_m) / wNow.zero_dose_m)} of the world's total</h3>
            <p class="note">It has ${pct((100 * afrInfants) / wNow.surviving_infants_m)} of the world's infants. In ${B} the region had <b ${t(afr.coverage_source)}>${mn(afr.zero_dose_2019_m)}</b>.</p>
            <div class="em-bars" id="vx-regzero"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Fragile and conflict-affected settings", f.fcv, "More than half", `of zero-dose children live in fragile, conflict-affected or vulnerable settings, which hold only about a third of the world's children.`, true)}
          <div class="em-card"><p class="em-eyebrow">Concentrated</p><div class="em-big" ${t(lead.coverage_source)}>${halfN} countries</div><p class="note">are home to half of the world's zero-dose children. ${esc(byZero[1].country)} and ${esc(byZero[2].country)} have <b ${t(byZero[1].coverage_source)}>${people(byZero[1].zero_dose)}</b> and <b ${t(byZero[2].coverage_source)}>${people(byZero[2].zero_dose)}</b>.</p><div class="em-cites"></div></div>
          ${factCard("Since 2019", f.stagnant, `${f.stagnant.value} countries`, `have DTP3 coverage that is stagnating or falling. <b ${t(f.stagnant.source)}>100</b> have kept at least 90% since 2019, and 30 have improved.`)}
          ${factCard("Fewer checks", f.surveys, `${f.surveys.value} surveys`, `of immunisation coverage were submitted for this round, down from 50 in 2024 and an average of 33 a year in 2015 to 2019.`)}
        </div>
      </section>

      <section class="em-sec" id="measles">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Measles</p><h2>Reported measles cases are <span class="accent">${nf(mRatio, 1)} times</span> their ${mLow.year} low</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Reported measles cases worldwide · 2000 to ${Y}</p>
            <h3>${nf(wNow.measles_cases)} cases in ${Y}, up from ${nf(mLow.measles_cases)} in ${mLow.year}</h3>
            <p class="note">Cases reached <b ${t(wBase.cases_source)}>${nf(wBase.measles_cases)}</b> in ${B}, dropped to <b ${t(m21.cases_source)}>${nf(m21.measles_cases)}</b> in 2021 during the pandemic, then rose to <b ${t(mPeak.cases_source)}>${nf(mPeak.measles_cases)}</b> in ${mPeak.year}. These are cases confirmed and reported by countries, not estimates of every case.</p>
            <div id="vx-measles"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Measles vaccine coverage worldwide · % of children, 2000 to ${Y}</p>
            <h3>The first dose is stuck at ${pct(wNow.mcv1)}; the second has climbed to ${pct(wNow.mcv2)}</h3>
            <p class="note">Measles spreads so easily that 95% of children need both doses to stop outbreaks. First-dose coverage was <b ${t(wBase.coverage_source)}>${pct(wBase.mcv1)}</b> in ${B}.</p>
            <div class="vx-key"><span>${dot("--em-accent")}First dose (MCV1)</span><span>${dot("--vx-alt")}Second dose (MCV2)</span></div>
            <div id="vx-mcv"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Reported measles cases per million people · ${Y}</p>
            <h3>${esc(byInc[0].country)} reported ${nf(byInc[0].measles_per_m)} cases per million people</h3>
            <p class="note">Countries with at least 500 reported cases. ${esc(BY.COD.country)} reported the most cases, <b ${t(BY.COD.measles_source)}>${nf(BY.COD.measles_cases)}</b>.</p>
            <div class="em-bars" id="vx-inc"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Fall in first-dose measles coverage · ${B} to ${Y}, percentage points</p>
            <h3>${esc(byFall[0].country)}'s coverage fell ${byFall[0].fall} points</h3>
            <p class="note">Countries with at least 50,000 infants a year. Each point lost is children left without protection.</p>
            <div class="em-bars" id="vx-fall"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Outbreaks", f.outbreaks, `${f.outbreaks.value} countries`, `reported large or disruptive measles outbreaks in ${Y}.`, true)}
        </div>
      </section>

      <section class="em-sec" id="workforce">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Health workers</p><h2>Africa has <span class="accent">${nf(afr.nurses_per_10k)} nurses and midwives</span> per 10,000 people; Europe has ${nf(eur.nurses_per_10k)}</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Health workers per 10,000 people · WHO regions, ${glob.workforce_year}</p>
            <h3>The world has ${nf(glob.nurses_per_10k, 1)} nurses and midwives and ${nf(glob.doctors_per_10k, 1)} doctors per 10,000 people</h3>
            <p class="note">Vaccines are given by nurses, midwives and community health workers. Where they are few, children are missed.</p>
            <div class="vx-key"><span>${dot("--em-accent")}Nurses and midwives</span><span>${dot("--vx-alt")}Medical doctors</span></div>
            <div class="vx-pairs" id="vx-pairs"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Fewest nurses and midwives · per 10,000 people, latest year</p>
            <h3>${esc(byNurse[0].country)} has ${nf(byNurse[0].nurses_per_10k, 1)} per 10,000 people</h3>
            <p class="note">The United Kingdom has <b ${t(uk.workforce_source)}>${nf(uk.nurses_per_10k, 1)}</b>. Latest year each country reported, mostly 2023 or 2024.</p>
            <div class="em-bars" id="vx-fewnurse"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("State of the World's Nursing 2025", f.shortage, `${f.shortage.value} million`, `more nurses were needed worldwide in 2023, down from 6.2 million in 2020. WHO projects <b ${t(f.shortage2030.source)}>${f.shortage2030.value} million</b> by 2030.`, true)}
          ${factCard("Where nurses are", f.concentration, `${f.concentration.value}%`, `of the world's nurses work in countries with 49% of its people. <b ${t(f.foreignborn.source)}>1 in 7</b> nurses worldwide was born abroad; in high-income countries, <b ${t(f.foreignhic.source)}>${f.foreignhic.value}%</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>In England, <span class="accent">${pct(ukLast.mmr2_5y, 1)}</span> of five-year-olds have had both MMR doses</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">MMR vaccine coverage in England · % of children, ${esc(uk24[0].fiscal_year)} to ${esc(ukLast.fiscal_year)}</p>
            <h3>First-dose coverage at two years is ${pct(ukLast.mmr_24m, 1)}, the lowest since ${esc(UKC.filter((r) => r.mmr_24m != null && r.mmr_24m <= ukLast.mmr_24m && r.start < ukLast.start).at(-1)?.fiscal_year ?? "records began")}</h3>
            <p class="note">Coverage at 24 months fell from <b ${t(ukPeak24.source)}>${pct(ukPeak24.mmr_24m, 1)}</b> in ${esc(ukPeak24.fiscal_year)} to <b ${t(ukLow24.source)}>${pct(ukLow24.mmr_24m, 1)}</b> in ${esc(ukLow24.fiscal_year)}, then recovered to <b ${t(ukHigh24.source)}>${pct(ukHigh24.mmr_24m, 1)}</b> in ${esc(ukHigh24.fiscal_year)}. Second-dose coverage at five years peaked at <b ${t(uk5Peak.source)}>${pct(uk5Peak.mmr2_5y, 1)}</b> in ${esc(uk5Peak.fiscal_year)}. 95% is the level needed to stop measles outbreaks. Financial years, April to March; some London figures for recent years are likely to be underestimates.</p>
            <div class="vx-key"><span>${dot("--em-accent")}MMR first dose by 24 months</span><span>${dot("--vx-alt")}Both MMR doses by 5 years</span></div>
            <div id="vx-ukmmr"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Reported measles cases in the UK · 2000 to ${ukmNow.year}</p>
            <h3>${nf(ukmPrev.measles_cases)} cases in ${ukmPrev.year}, ${nf(ukmNow.measles_cases)} in ${ukmNow.year}</h3>
            <p class="note">Confirmed cases the UK reported to WHO. In ${Y} that was <b ${t(uk.measles_source)}>${nf(uk.measles_per_m, 1)}</b> per million people.</p>
            <div id="vx-ukmeasles"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Both MMR doses by 5 years · UK nations, ${esc(natEng.fiscal_year)}</p>
            <h3>${esc(natRows[0].area)} is at ${pct(natRows[0].mmr2_5y, 1)}; England is at ${pct(natEng.mmr2_5y, 1)}</h3>
            <p class="note">Across the UK, <b ${t(natUK.source)}>${pct(natUK.mmr2_5y, 1)}</b> of ${nf(natUK.children_5y)} five-year-olds.</p>
            <div class="em-bars" id="vx-nations"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("WHO/UNICEF estimate for the UK", { source: uk.coverage_source }, people(uk.zero_dose), `UK infants had no dose of DTP vaccine by their first birthday in ${Y}, <b ${t(uk.coverage_source)}>${pct(uk.zero_dose_pct)}</b> of the cohort. <b ${t(uk.coverage_source)}>${pct(uk.mcv2)}</b> had a second measles dose.`, true)}
          ${factCard("Nurses in the UK", { source: uk.workforce_source }, nf(uk.nurses_per_10k, 1), `nurses and midwives per 10,000 people in ${uk.nurses_year}, against <b ${t(eur.workforce_source)}>${nf(eur.nurses_per_10k, 1)}</b> across WHO's European Region. In high-income countries, <b ${t(f.foreignhic.source)}>${f.foreignhic.value}%</b> of nurses were born abroad.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="vx-search" id="vx-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap vx-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="zero_dose" aria-sort="descending"><button type="button">Zero-dose children</button></th>
                <th class="r" data-key="dtp3" aria-sort="none"><button type="button">DTP3, %</button></th>
                <th class="r hide-n" data-key="mcv1" aria-sort="none"><button type="button">MCV1, %</button></th>
                <th class="r hide-n" data-key="mcv2" aria-sort="none"><button type="button">MCV2, %</button></th>
                <th class="r hide-n" data-key="measles_per_m" aria-sort="none"><button type="button">Measles per million</button></th>
                <th class="r hide-n" data-key="nurses_per_10k" aria-sort="none"><button type="button">Nurses per 10,000</button></th>
                <th class="r hide-n" data-key="doctors_per_10k" aria-sort="none"><button type="button">Doctors per 10,000</button></th>
              </tr></thead>
              <tbody id="vx-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Coverage</b> is from the WHO/UNICEF Estimates of National Immunization Coverage (WUENIC), ${Y} revision, released on 15 July 2026: the share of surviving infants (those alive at their first birthday) who received each vaccine. DTP1 and DTP3 are the first and third doses of the diphtheria, tetanus and pertussis vaccine; MCV1 and MCV2 the first and second doses of a measles vaccine, given at the age each country recommends. WHO and UNICEF re-estimate the whole series each year from countries' reports and surveys, so past years can differ from earlier releases. For countries that did not report ${Y}, the estimate carries forward their last informed value.</p>
        <p><b>Zero-dose children</b> are infants who did not receive a first dose of DTP vaccine. For each country we multiply the share without DTP1 by the number of surviving infants from the UN's World Population Prospects 2024, as given in the WUENIC country file; the country figures add up to the published world total of ${mn(wNow.zero_dose_m, 2)}. Regional and world counts are as published. <b>Measles</b> cases are confirmed cases reported by national authorities to WHO; ${C.filter((r) => r.measles_cases == null).length} countries, including the United States, have no ${Y} figure in the file, and reported cases are not estimates of every case. Incidence per million is WHO's. <b>Health workers</b> are medical doctors, and nursing and midwifery personnel, per 10,000 people, from WHO's National Health Workforce Accounts (December 2025 update), latest year reported. <b>UK</b> figures are UKHSA's COVER statistics for England and the UK nations, by financial year, which come from child health records; WUENIC's UK figure is a separate, national estimate. Regions are WHO's.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("zero", "01", "No vaccines at all", `<span class="accent">${mn(wNow.zero_dose_m)}</span> babies got no vaccines in ${Y}`, `That is <b ${t(wNow.coverage_source)}>${pct(100 - wNow.dtp1)}</b> of all infants. Most live in the darker countries on the map.`)}
            ${step("top", "02", "Concentrated", `${esc(lead.country)} has <span class="accent">${people(lead.zero_dose)}</span> of them`, `Ten countries hold ${pct(top10Share)} of the world's zero-dose children.`)}
            ${step("trend", "03", "Twenty-five years", `Down from <span class="accent">${mn(w2000.zero_dose_m)}</span> in 2000`, `The pandemic pushed the number back up to <b ${t(w(2021).coverage_source)}>${mn(w(2021).zero_dose_m)}</b> in 2021; it is still above ${B}.`)}
            ${step("measles", "04", "Measles", `<span class="accent">${nf(wNow.measles_cases)}</span> reported measles cases in ${Y}`, `${nf(mRatio, 1)} times the ${mLow.year} low. Only ${pct(wNow.mcv2)} of children had both doses.`)}
            ${step("workers", "05", "Health workers", `Africa has <span class="accent">${nf(afr.nurses_per_10k)}</span> nurses and midwives per 10,000 people`, `Europe has ${nf(eur.nurses_per_10k)}. The world is <b ${t(f.shortage.source)}>${f.shortage.value} million</b> nurses short.`)}
            ${step("uk", "06", "England", `<span class="accent">${pct(ukLast.mmr2_5y, 1)}</span> of five-year-olds have had both MMR doses`, `95% is needed to stop outbreaks. The UK reported <b ${t(ukmPrev.source)}>${nf(ukmPrev.measles_cases)}</b> measles cases in ${ukmPrev.year}.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="vx-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "zero", sel: "NGA" };
    const mapEl = main.querySelector("#vx-map");
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
      mode === "dtp3" ? (r.dtp3 != null ? `${pct(r.dtp3)} had three doses of DTP` : "No estimate")
        : mode === "zero" ? (r.zero_dose != null ? `${people(r.zero_dose)} zero-dose children, ${pct(r.zero_dose_pct)}` : "No estimate")
          : mode === "measles" ? (r.measles_per_m != null ? `${nf(r.measles_per_m, 1)} measles cases per million` : "No measles report")
            : r.nurses_per_10k != null ? `${nf(r.nurses_per_10k, 1)} nurses and midwives per 10,000` : "No workforce figure";
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
    const scaleEl = main.querySelector("#vx-scale");
    const SCALE_TITLE = { dtp3: `Infants with three doses of DTP, ${Y}:`, zero: `Infants with no DTP dose, ${Y}:`, measles: `Reported measles cases per million people, ${Y}:`, nurses: `Nurses and midwives per 10,000 people, latest year:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#vx-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const cs = (v, s) => `<span ${t(s)}>${v}</span>`;
      const head = state.mode === "dtp3"
        ? { eb: `Three doses of DTP · ${Y}`, big: pct(r.dtp3), s: r.coverage_source, sub: `world <span ${t(wNow.coverage_source)}>${pct(wNow.dtp3)}</span>${r.dtp3_2019 != null ? `; ${pct(r.dtp3_2019)} in ${B}` : ""}` }
        : state.mode === "zero"
          ? { eb: `Zero-dose children · ${Y}`, big: people(r.zero_dose), s: r.coverage_source, sub: `${pct(r.zero_dose_pct)} of infants had no dose of DTP vaccine` }
          : state.mode === "measles"
            ? { eb: `Measles cases per million · ${Y}`, big: r.measles_per_m != null ? nf(r.measles_per_m, 1) : "n/a", s: r.measles_source, sub: r.measles_cases != null ? `${nf(r.measles_cases)} reported cases; world <span ${t(glob.cases_source)}>${nf(glob.measles_per_m, 1)}</span> per million` : "no measles report for this year" }
            : { eb: `Nurses and midwives per 10,000 · ${r.nurses_year ?? "n/a"}`, big: r.nurses_per_10k != null ? nf(r.nurses_per_10k, 1) : "n/a", s: r.workforce_source, sub: `world <span ${t(glob.workforce_source)}>${nf(glob.nurses_per_10k, 1)}</span>` };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="vx-pick"><span class="em-eyebrow">Choose</span><select id="vx-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${head.s ? t(head.s) : ""}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.zero_dose != null ? row(`Zero-dose children · ${Y}`, cs(people(r.zero_dose), r.coverage_source)) : ""}
          ${r.dtp1 != null ? row("DTP first dose", cs(pct(r.dtp1), r.coverage_source)) : ""}
          ${r.dtp3 != null ? row("DTP third dose", cs(pct(r.dtp3), r.coverage_source)) : ""}
          ${r.mcv1 != null ? row("Measles first dose", cs(`${pct(r.mcv1)}${r.mcv1_2019 != null ? ` (${pct(r.mcv1_2019)} in ${B})` : ""}`, r.coverage_source)) : ""}
          ${r.mcv2 != null ? row("Measles second dose", cs(pct(r.mcv2), r.coverage_source)) : ""}
          ${r.measles_cases != null ? row(`Measles cases · ${Y}`, cs(nf(r.measles_cases), r.measles_source)) : ""}
          ${r.measles_cases_2024 != null ? row(`Measles cases · ${Y - 1}`, cs(nf(r.measles_cases_2024), "who-cases")) : ""}
          ${r.nurses_per_10k != null ? row(`Nurses, midwives · ${r.nurses_year}`, cs(`${nf(r.nurses_per_10k, 1)} per 10,000`, r.workforce_source)) : ""}
          ${r.doctors_per_10k != null ? row(`Doctors · ${r.doctors_year}`, cs(`${nf(r.doctors_per_10k, 1)} per 10,000`, r.workforce_source)) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#vx-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".vx-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".vx-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    // series: [{ name, short, v (CSS colour var), pts: [[x, y]], noEnd, endText }]. Labels each line at its end unless noEnd.
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xEnd, ref, aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name && !s.noEnd) ? (narrow ? 104 : 150) : 64, b: 22, l: 46 };
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
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="vx-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="vx-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="2.4" stroke-linejoin="round"/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const every = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const W00 = W.filter((r) => r.year >= 2000);
    const fy = (v) => `${v}/${String((v + 1) % 100).padStart(2, "0")}`;
    const drawZeroTrend = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: W00.map((r) => [r.year, r.zero_dose_m]), endText: `${nf(wNow.zero_dose_m, 1)}m` }],
      yMax: 25, yStep: 5, fmtY: (v) => `${v}m`, xTicks: every(2005, 2025, 5), h, area: true,
      aria: `Zero-dose children worldwide: ${mn(w2000.zero_dose_m)} in 2000, ${mn(wBase.zero_dose_m)} in ${B}, ${mn(w(2021).zero_dose_m)} in 2021 and ${mn(wNow.zero_dose_m)} in ${Y}`,
    });
    const drawMeasles = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: W00.filter((r) => r.measles_cases != null).map((r) => [r.year, r.measles_cases / 1000]), endText: `${nf(wNow.measles_cases / 1000)}k` }],
      yMax: 900, yStep: 300, fmtY: (v) => `${v}k`, xTicks: every(2005, 2025, 5), h, area: true,
      aria: `Reported measles cases worldwide: ${nf(w2000.measles_cases)} in 2000, a low of ${nf(mLow.measles_cases)} in ${mLow.year}, ${nf(mPeak.measles_cases)} in ${mPeak.year} and ${nf(wNow.measles_cases)} in ${Y}`,
    });
    const drawMcv = (el, h) => lineChart(el, {
      series: [
        { name: "MCV1", short: "MCV1", v: "--em-accent", pts: W00.filter((r) => r.mcv1 != null).map((r) => [r.year, r.mcv1]), endText: pct(wNow.mcv1) },
        { name: "MCV2", short: "MCV2", v: "--vx-alt", pts: W00.filter((r) => r.mcv2 != null).map((r) => [r.year, r.mcv2]), endText: pct(wNow.mcv2) },
      ],
      yMax: 100, yStep: 25, fmtY: (v) => `${v}%`, ref: { v: 95, label: "95% needed to stop outbreaks" }, xTicks: every(2005, 2025, 5), h,
      aria: `Measles vaccine coverage worldwide: first dose ${pct(w2000.mcv1)} in 2000 and ${pct(wNow.mcv1)} in ${Y}; second dose ${pct(w2000.mcv2)} in 2000 and ${pct(wNow.mcv2)} in ${Y}`,
    });
    const drawUkMmr = (el, h) => lineChart(el, {
      series: [
        { name: "MMR1 by 2", short: "MMR1", v: "--em-accent", pts: uk24.map((r) => [r.start, r.mmr_24m]), endText: pct(ukLast.mmr_24m, 1) },
        { name: "MMR2 by 5", short: "MMR2", v: "--vx-alt", pts: uk5.map((r) => [r.start, r.mmr2_5y]), endText: pct(ukLast.mmr2_5y, 1) },
      ],
      yMin: 70, yMax: 100, yStep: 10, fmtY: (v) => `${v}%`, ref: { v: 95, label: "95%" }, xTicks: every(1990, 2025, 5), xFmt: fy, h,
      aria: `MMR coverage in England: first dose by 24 months ${pct(uk24[0].mmr_24m, 1)} in ${uk24[0].fiscal_year}, ${pct(ukLow24.mmr_24m, 1)} in ${ukLow24.fiscal_year}, ${pct(ukLast.mmr_24m, 1)} in ${ukLast.fiscal_year}; both doses by 5 years ${pct(ukLast.mmr2_5y, 1)} in ${ukLast.fiscal_year}`,
    });
    const drawUkMeasles = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: UKM.map((r) => [r.year, r.measles_cases]), endText: nf(ukmNow.measles_cases) }],
      yMax: 3500, yStep: 1000, fmtY: (v) => nf(v), xTicks: every(2005, 2025, 5), h, area: true,
      aria: `Reported measles cases in the UK: ${nf(UKM[0].measles_cases)} in ${UKM[0].year}, ${nf(ukmPrev.measles_cases)} in ${ukmPrev.year} and ${nf(ukmNow.measles_cases)} in ${ukmNow.year}`,
    });
    const drawAll = () => {
      drawZeroTrend(main.querySelector("#vx-zerotrend"), 240);
      drawMeasles(main.querySelector("#vx-measles"), 240);
      drawMcv(main.querySelector("#vx-mcv"), 240);
      drawUkMmr(main.querySelector("#vx-ukmmr"), 240);
      drawUkMeasles(main.querySelector("#vx-ukmeasles"), 240);
    };
    drawAll();

    // ---------- Bars ----------
    const zeroBars = (el, n = 10) => bars(el, byZero.slice(0, n).map((r, i) => ({ label: r.country, value: r.zero_dose / 1e6, muted: i > 0, src: r.coverage_source })), (v) => (v >= 1 ? `${nf(v, 1)}m` : `${nf(v * 1000)}k`), byZero[0].zero_dose / 1e6, t);
    zeroBars(main.querySelector("#vx-topzero"));
    const regSorted = [...regs].sort((a, b) => b.zero_dose_m - a.zero_dose_m);
    bars(main.querySelector("#vx-regzero"), regSorted.map((r, i) => ({ label: r.region, value: r.zero_dose_m, muted: i > 0, src: r.coverage_source })), (v) => `${nf(v, 1)}m`, regSorted[0].zero_dose_m, t);
    bars(main.querySelector("#vx-inc"), byInc.slice(0, 10).map((r, i) => ({ label: r.country, value: r.measles_per_m, muted: i > 0, src: r.measles_source })), (v) => nf(v), byInc[0].measles_per_m, t);
    bars(main.querySelector("#vx-fall"), byFall.slice(0, 10).map((r, i) => ({ label: r.country, value: r.fall, muted: i > 0, src: r.coverage_source })), (v) => `−${v}`, byFall[0].fall, t);
    bars(main.querySelector("#vx-fewnurse"), byNurse.slice(0, 10).map((r, i) => ({ label: r.country, value: r.nurses_per_10k, muted: i > 0, src: r.workforce_source })), (v) => nf(v, 1), byNurse[9].nurses_per_10k, t);
    bars(main.querySelector("#vx-nations"), natRows.map((r) => ({ label: r.area, value: r.mmr2_5y, muted: r.area !== "England", src: r.source })), (v) => pct(v, 1), 100, t);
    function pairBars(el, rows) {
      const max = Math.max(...rows.flatMap((r) => [r.nurses_per_10k, r.doctors_per_10k]));
      const bar = (v, c, s, label) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${(100 * (v ?? 0)) / max}%;background:var(${c})"></b></div><span class="v" ${v != null ? t(s) : ""}>${v == null ? "n/a" : nf(v, 1)}</span></div>`;
      el.innerHTML = rows.map((r) => `<div class="it"><div class="lb">${esc(r.region)}</div><div class="tr">
        ${bar(r.nurses_per_10k, "--em-accent", r.workforce_source, `${r.region}: ${nf(r.nurses_per_10k, 1)} nurses and midwives per 10,000 people`)}
        ${bar(r.doctors_per_10k, "--vx-alt", r.workforce_source, `${r.region}: ${nf(r.doctors_per_10k, 1)} doctors per 10,000 people`)}</div></div>`).join("");
    }
    const pairRows = [...regs].sort((a, b) => a.nurses_per_10k - b.nurses_per_10k).concat(glob);
    pairBars(main.querySelector("#vx-pairs"), pairRows);

    // ---------- Table ----------
    const tbody = main.querySelector("#vx-tbody"), search = main.querySelector("#vx-search");
    let key = "zero_dose", dir = -1;
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
        <td><button type="button" class="vx-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.zero_dose != null ? t(r.coverage_source) : ""}>${r.zero_band ? `<i class="vx-sw" style="background:var(${SEQ[bandIdx("zero", r.zero_band)]})"></i>${nf(r.zero_dose)}` : "–"}</td>
        ${cell(r.dtp3, r.coverage_source, false)}
        ${cell(r.mcv1, r.coverage_source, true)}
        ${cell(r.mcv2, r.coverage_source, true)}
        ${cell(r.measles_per_m, r.measles_source, true, 1)}
        ${cell(r.nurses_per_10k, r.workforce_source, true, 1)}
        ${cell(r.doctors_per_10k, r.workforce_source, true, 1)}</tr>`).join("") || `<tr><td colspan="8">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".vx-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#vx-vis");
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
    const legend = (mode) => `<div class="vx-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "zero") {
        vis.innerHTML = `<p class="vt">Infants with no dose of DTP vaccine, ${Y}</p><div class="m"></div>${legend("zero")}`;
        miniMap(vis.querySelector(".m"), "zero");
      } else if (id === "top") {
        vis.innerHTML = `<p class="vt">Zero-dose children, ${Y}</p><div class="em-bars" id="vx-vbars"></div>`;
        zeroBars(vis.querySelector("#vx-vbars"), 8);
      } else if (id === "trend") {
        vis.innerHTML = `<p class="vt">Zero-dose children worldwide, millions</p><div class="m"></div>`;
        drawZeroTrend(vis.querySelector(".m"), 240);
      } else if (id === "measles") {
        vis.innerHTML = `<p class="vt">Reported measles cases worldwide</p><div class="m"></div>`;
        drawMeasles(vis.querySelector(".m"), 240);
      } else if (id === "workers") {
        vis.innerHTML = `<p class="vt">Per 10,000 people, ${glob.workforce_year}</p><div class="vx-key"><span>${dot("--em-accent")}Nurses and midwives</span><span>${dot("--vx-alt")}Doctors</span></div><div class="vx-pairs" id="vx-vpairs"></div>`;
        pairBars(vis.querySelector("#vx-vpairs"), pairRows);
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">MMR coverage in England</p><div class="m"></div>`;
        drawUkMmr(vis.querySelector(".m"), 240);
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
