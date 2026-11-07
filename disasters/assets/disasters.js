// Floods, Disasters & Insurance Gaps dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--ds-b0", "--ds-b1", "--ds-b2", "--ds-b3", "--ds-b4"];
const MAPS = {
  flood: { key: "flood_band", label: "World map of countries coloured by the share of people exposed to significant flood risk" },
  poor: { key: "poor_band", label: "World map of countries coloured by the share of people who are both exposed to significant flood risk and living on under $5.50 a day" },
  displaced: { key: "displaced_band", label: "World map of countries coloured by disaster displacements a year per 1,000 people, 2016 to 2025 average" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const nf = (v, d = 0) => (v == null ? "n/a" : v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (v, d = 0) => (v == null ? "n/a" : `${nf(v, d)}%`);
const mn = (v, d = 1) => (v == null ? "n/a" : `${nf(v, d)} million`);
const people = (v) => (v == null ? "n/a" : v >= 1e9 ? `${nf(v / 1e9, 2)} billion` : v >= 1e6 ? mn(v / 1e6, v >= 1e7 ? 0 : 1) : nf(v));
const short = (v) => (v == null ? "n/a" : v >= 1e9 ? `${nf(v / 1e9, 2)}bn` : v >= 1e6 ? `${nf(v / 1e6, v >= 1e7 ? 0 : 1)}m` : v >= 1e3 ? `${nf(v / 1e3, v >= 1e4 ? 0 : 1)}k` : nf(v));
const usd = (v) => (v == null ? "n/a" : `$${nf(v, v < 100 && v % 1 ? 1 : 0)}bn`);
// Country names that read with "the" in a sentence.
const THE = /^(Philippines|Netherlands|United |Gambia|Bahamas|Democratic Republic|Central African|Dominican Republic|Czech|Maldives|Marshall|Solomon|Comoros|Seychelles|Northern Mariana|Cayman|Turks|Faroe)/;
const the = (n, cap = false) => (THE.test(n) ? `${cap ? "The" : "the"} ${n}` : n);
const PLURAL = { Drought: "Droughts", Earthquake: "Earthquakes", "Extreme temperature": "Extreme temperatures", Flood: "Floods", Storm: "Storms", Wildfire: "Wildfires", "Volcanic activity": "Volcanic eruptions", "Mass movement (wet)": "Landslides", "Mass movement (dry)": "Rockfalls" };
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
  id: "disasters",
  title: "Floods, Disasters & Insurance Gaps",
  description:
    "How many people disasters kill, affect and drive from their homes, which hazards do the damage, how much of the cost is insured, who lives with flood risk, and how many properties in England are at risk of flooding, from CRED, IDMC, World Bank research, Swiss Re, Munich Re and Environment Agency figures, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year, A0 = DATA.avgFrom;
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const W = DATA.world, w = (y) => W.find((r) => r.year === y), wNow = w(Y), wPrev = w(Y - 1), wMax = W.reduce((a, b) => (b.total > a.total ? b : a));
    const wAvg = W.filter((r) => r.year >= A0).reduce((s, r) => s + r.total, 0) / W.filter((r) => r.year >= A0).length;
    const HZ = DATA.hazards.filter((h) => h.deaths_avg > 50 || h.deaths_2025 > 0 || h.affected_m_avg > 0.5), hz = (id) => DATA.hazards.find((h) => h.id === id);
    const byDeaths = [...HZ].sort((a, b) => b.deaths_2025 - a.deaths_2025), byAff = [...HZ].sort((a, b) => b.affected_m_2025 - a.affected_m_2025), byLoss = [...HZ].sort((a, b) => b.losses_bn_2025 - a.losses_bn_2025);
    const L = DATA.losses, lo = (pub, per) => L.find((r) => r.publisher === pub && r.period === per);
    const mrNow = lo("Munich Re", String(Y)), srNow = lo("Swiss Re Institute", String(Y)), mrH1 = L.find((r) => r.source === "munichre-h1-2026"), mr10 = L.find((r) => r.publisher === "Munich Re" && /^10-year/.test(r.period));
    const GR = DATA.gap_regions, apac = GR.find((r) => r.region === "Asia-Pacific"), nam = GR.find((r) => /^North America/.test(r.region)), afr = GR.find((r) => r.region === "Africa"), eur = GR.find((r) => r.region === "Europe");
    const CO = DATA.costliest, DE = DATA.deadliest;
    const fl = C.filter((r) => r.flood_exposed_k != null), totalExp = fl.reduce((s, r) => s + r.flood_exposed_k, 0) * 1e3;
    const byExp = [...fl].sort((a, b) => b.flood_exposed_k - a.flood_exposed_k);
    const byShare = fl.filter((r) => r.population_k >= 1000).sort((a, b) => b.flood_exposed_pct - a.flood_exposed_pct);
    const byPoor = fl.filter((r) => r.poor550_k > 0).sort((a, b) => b.poor550_k - a.poor550_k);
    const byDisp = C.filter((r) => r.displaced_per_1000 != null && r.population_k >= 1000).sort((a, b) => b.displaced_per_1000 - a.displaced_per_1000);
    const byDisp25 = C.filter((r) => r.displaced_2025 != null).sort((a, b) => b.displaced_2025 - a.displaced_2025);
    const top2 = byExp[0].flood_exposed_k + byExp[1].flood_exposed_k;
    const over30 = fl.filter((r) => r.flood_exposed_pct >= 30).length;
    const UKR = DATA.uk_risk, ukrs = UKR.filter((r) => r.flood_source === "Rivers and the sea"), uksw = UKR.filter((r) => r.flood_source === "Surface water");
    const rsTot = ukrs.find((r) => r.band === "Total"), swTot = uksw.find((r) => r.band === "Total"), swHigh = uksw.find((r) => r.band === "High"), rsHigh = ukrs.find((r) => r.band === "High");
    const REG = DATA.uk_regions.filter((r) => r.region !== "Total").sort((a, b) => b.sw_high_medium_pct + b.rs_high_medium_pct - a.sw_high_medium_pct - a.rs_high_medium_pct), regTot = DATA.uk_regions.find((r) => r.region === "Total");
    const regRS = [...REG].sort((a, b) => b.rs_high_medium_pct - a.rs_high_medium_pct)[0], regSW = [...REG].sort((a, b) => b.sw_high_medium_pct - a.sw_high_medium_pct)[0];
    const INF = DATA.uk_infra, uk = BY.GBR;

    const { main, initialView } = shell(root, {
      variantId: "disasters",
      name: "Disasters",
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
    const keyIns = `<div class="ds-key"><span>${dot("--em-accent")}Insured</span><span>${dot("--ds-alt")}Not insured</span></div>`;
    const keyYr = `<div class="ds-key"><span>${dot("--em-accent")}${Y}</span><span>${dot("--ds-alt")}Average, 2005 to 2024</span></div>`;

    main.innerHTML = `
      <header class="em-head">
        <p class="em-eyebrow"><span class="num">00</span>Disasters · figures for ${Y} and the first half of 2026; flood exposure modelled for 2020</p>
        <h1><b>${nf(f.exposed.value, 2)} billion people</b> <span class="accent">live where a once-a-century flood would reach them</span></h1>
        <p class="em-lede">That is <b ${t(f.exposed_pct.source)}>${pct(f.exposed_pct.value)}</b> of the world's population, and <b ${t(f.lmic.source)}>${pct(f.lmic.value)}</b> of them are in low- and middle-income countries. In ${Y}, recorded disasters killed <b ${t(f.deaths.source)}>${nf(f.deaths.value)}</b> people and caused about <b ${t(mrNow.source)}>${usd(mrNow.overall_bn)}</b> of losses, of which <b ${t(mrNow.source)}>${usd(mrNow.insured_bn)}</b> was insured. Disasters forced people from their homes <b ${t(wNow.source)}>${mn(wNow.total / 1e6)}</b> times. In England, <b ${t(f.uk_total.source)}>${mn(f.uk_total.value)}</b> properties are in areas at risk of flooding.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>A quieter year than average, <span class="accent">but half the cost fell on people without cover</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Deaths in disasters", nf(f.deaths.value), `In ${Y}, including people missing and presumed dead. The 2005 to 2024 average was <span ${t(f.deaths_avg.source)}>${nf(f.deaths_avg.value)}</span> a year. Heat deaths are mostly not yet counted`, f.deaths.source, true)}
          ${kpi("People affected", `${nf(f.affected.value, 1)}m`, `Injured, made homeless or needing urgent help in ${Y}, against <span ${t(f.affected_avg.source)}>${mn(f.affected_avg.value)}</span> a year on average`, f.affected.source)}
          ${kpi("Losses, and how much was insured", usd(mrNow.overall_bn), `Overall losses in ${Y}; <span ${t(mrNow.source)}>${usd(mrNow.insured_bn)}</span> insured. Swiss Re puts it at <span ${t(srNow.source)}>${usd(srNow.overall_bn)}</span>, <span ${t(srNow.source)}>${pct(srNow.insured_pct)}</span> insured`, mrNow.source)}
          ${kpi("Disaster displacements", `${nf(wNow.total / 1e6, 1)}m`, `Times people were forced to move in ${Y}, including evacuations. <span ${t(wPrev.source)}>${mn(wPrev.total / 1e6)}</span> in ${Y - 1}${wMax.year === Y - 1 ? ", the most since records began in 2008" : ""}`, wNow.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>Flood risk, poverty and displacement <span class="accent">in ${C.length} countries and territories</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="ds-mode" data-mode="flood" aria-pressed="true">Flood risk</button>
                <button type="button" class="ds-mode" data-mode="poor" aria-pressed="false">Flood risk and poverty</button>
                <button type="button" class="ds-mode" data-mode="displaced" aria-pressed="false">Displacement</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="ds-map" role="region" aria-label="${MAPS.flood.label}"></div>
            <div class="ds-scale" id="ds-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="ds-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="hazards">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>What disasters do</p><h2>${esc(PLURAL[byDeaths[0].hazard])} caused the most deaths in ${Y}; <span class="accent">${esc(PLURAL[byAff[0].hazard].toLowerCase())} affected the most people</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Deaths by hazard · ${Y} against the 2005 to 2024 average</p>
            <h3>${esc(PLURAL[byDeaths[0].hazard])} killed ${nf(byDeaths[0].deaths_2025)} people, ${esc(PLURAL[byDeaths[1].hazard].toLowerCase())} ${nf(byDeaths[1].deaths_2025)}</h3>
            <p class="note">The Myanmar and Afghanistan earthquakes alone killed <b ${t("cred-2025")}>${nf(DE[0].deaths + DE[1].deaths)}</b>. Deaths from extreme temperatures show as <b ${t(hz("temperature").source)}>${nf(hz("temperature").deaths_2025)}</b> because heatwave deaths take months to be reported; they averaged <b ${t(hz("temperature").source)}>${nf(hz("temperature").deaths_avg)}</b> a year. The <a href="../heat/index.html">Extreme Heat dashboard</a> covers them. Drought deaths are rarely reported at all.</p>
            ${keyYr}
            <div class="ds-pairs" id="ds-deaths"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Disaster displacements worldwide · millions, 2008 to ${Y}</p>
            <h3>${mn(wNow.total / 1e6)} in ${Y}, after ${mn(wMax.total / 1e6)} in ${wMax.year}, the most since ${W[0].year}</h3>
            <p class="note">Storms caused <b ${t(wNow.source)}>${mn(wNow.storm / 1e6)}</b> displacements in ${Y} and floods <b ${t(wNow.source)}>${mn(wNow.flood / 1e6)}</b>. The ${A0} to ${Y} average was <b ${t(wNow.source)}>${mn(wAvg / 1e6)}</b> a year. Each displacement is a movement: one person evacuated twice counts twice, and evacuations before a storm are included.</p>
            <div class="ds-key"><span>${dot("--em-accent")}All disasters</span><span>${dot("--ds-alt")}Storms</span><span>${dot("--ds-b2")}Floods</span></div>
            <div id="ds-disp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Deadliest disasters of ${Y}</p>
            <h3>The earthquake in ${esc(DE[0].country)} killed ${nf(DE[0].deaths)} people</h3>
            <p class="note">Deaths include people missing and presumed dead, as recorded by ${Y === 2025 ? "March 2026" : "the report date"}.</p>
            <div class="em-bars" id="ds-deadly"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Displaced most often · per 1,000 people a year, ${A0} to ${Y}</p>
            <h3>In ${esc(the(byDisp[0].country))}, ${nf(byDisp[0].displaced_per_1000)} displacements a year for every 1,000 people</h3>
            <p class="note">Countries with at least a million people. ${esc(the(byDisp25[0].country, true))} had the most displacements in ${Y}: <b ${t(byDisp25[0].displaced_source)}>${mn(byDisp25[0].displaced_2025 / 1e6)}</b>.</p>
            <div class="em-bars" id="ds-dispc"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">People affected by hazard · millions, ${Y} against the average</p>
            <h3>${esc(PLURAL[byAff[0].hazard])} affected ${mn(byAff[0].affected_m_2025)} people</h3>
            <p class="note">Droughts affect people slowly and over large areas: <b ${t(f.syria.source)}>${mn(f.syria.value)}</b> people in Syria needed help after its record drought.</p>
            ${keyYr}
            <div class="ds-pairs one" id="ds-aff"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Economic losses by hazard · US$ billion, ${Y} against the average</p>
            <h3>${esc(PLURAL[byLoss[0].hazard])} cost ${usd(byLoss[0].losses_bn_2025)}; wildfires ${usd(hz("wildfire").losses_bn_2025)}, ${nf(hz("wildfire").losses_bn_2025 / hz("wildfire").losses_bn_avg)} times their average</h3>
            <p class="note">Losses are reported far more completely in rich countries, so these totals lean towards the United States. CRED's total for ${Y} is <b ${t(f.damage.source)}>${usd(f.damage.value)}</b>, lower than the reinsurers' estimates.</p>
            ${keyYr}
            <div class="ds-pairs one" id="ds-loss"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Drought and famine", f.somalia, nf(f.somalia.value), `estimated excess deaths in Somalia during the 30-month drought and famine of 2021 to 2024, around 40% of them children under five. Such deaths rarely appear in disaster counts.`, true)}
          ${factCard("Where people died", f.asiadeaths, pct(f.asiadeaths.value, 1), `of ${Y}'s disaster deaths were in Asia, largely from the earthquakes in Myanmar and Afghanistan.`)}
        </div>
      </section>

      <section class="em-sec" id="gap">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>The insurance gap</p><h2>About half of ${Y}'s losses were insured; <span class="accent">in Asia-Pacific, ${pct(apac.insured_pct)}</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Overall and insured losses from natural disasters · US$ billion, Munich Re</p>
            <h3>${usd(mrNow.overall_bn)} of losses in ${Y}, ${usd(mrNow.uninsured_bn)} of them uninsured</h3>
            <p class="note">Usually around 60% of losses are uninsured. The share was lower in ${Y} because so much of the Los Angeles wildfire loss was insured. In the first half of 2026, <b ${t(mrH1.source)}>${usd(mrH1.insured_bn)}</b> of <b ${t(mrH1.source)}>${usd(mrH1.overall_bn)}</b> was insured, a gap of <b ${t(f.mr_h1gap.source)}>${pct(f.mr_h1gap.value)}</b>. Averages are adjusted for inflation; droughts and heatwaves are not included.</p>
            ${keyIns}
            <div class="ds-stack" id="ds-losses"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Insured share of losses by continent · ${Y}</p>
            <h3>${pct(nam.insured_pct)} insured in North America; ${pct(apac.insured_pct)} in Asia-Pacific</h3>
            <p class="note">Africa's <b ${t(afr.source)}>${usd(afr.overall_bn)}</b> of losses had less than ${usd(afr.insured_max)} insured, while ${nf(afr.fatalities)} people died there. Europe's were <b ${t(eur.source)}>${pct(eur.insured_pct)}</b> insured.</p>
            ${keyIns}
            <div class="ds-stack" id="ds-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Costliest disasters of ${Y} · US$ billion</p>
            <h3>The Los Angeles wildfires cost ${usd(CO[0].overall_bn)}, ${pct(CO[0].insured_pct)} of it insured</h3>
            <p class="note">The Myanmar earthquake cost <b ${t(CO[1].source)}>${usd(CO[1].overall_bn)}</b>, of which <b ${t(CO[1].source)}>${pct(CO[1].insured_pct)}</b> was insured, and killed about <b ${t(CO[1].source)}>${nf(CO[1].fatalities)}</b> people.</p>
            ${keyIns}
            <div class="ds-stack" id="ds-costly"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Emerging economies", f.sr_emerging, esc(f.sr_emerging.note), `of catastrophe losses in emerging economies are typically not covered by insurance, according to Swiss Re.`, true)}
          ${factCard("Floods are rarely insured", f.sr_flood, usd(f.sr_flood.value), `of flood losses were insured worldwide in ${Y}, against a five-year average of <b ${t(f.sr_flood_avg.source)}>${usd(f.sr_flood_avg.value)}</b>. Floods caused <b ${t(hz("flood").source)}>${usd(hz("flood").losses_bn_2025)}</b> of recorded losses.`)}
          ${factCard("Why losses keep rising", f.sr_exposure, `More than ${pct(f.sr_exposure.value)}`, `of the long-term rise in weather-related insured losses since 1970 comes from more, and more valuable, property built in harm's way. On trend, insured losses would be <b ${t(f.sr_trend.source)}>${usd(f.sr_trend.value)}</b> in 2026.`)}
          ${factCard("First half of 2026", f.mr_venezuela, `About ${usd(f.mr_venezuela.value)}`, `of expected losses from the double earthquake in Venezuela on 24 June 2026, with less than $1bn insured.`)}
        </div>
      </section>

      <section class="em-sec" id="floods">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Living with flood risk</p><h2>${esc(byExp[0].country)} and ${esc(byExp[1].country)} <span class="accent">hold ${pct((100 * top2 * 1e3) / totalExp)}</span> of the world's flood-exposed people</h2></div></div>
        <p class="ds-lede2">These are people living where a flood with a 1% chance of happening in any year would be more than 15 cm deep, from rivers, heavy rain or the sea. The estimate does not account for flood defences, so in places such as the Netherlands it shows the hazard rather than the risk that remains.</p>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">People exposed to significant flood risk · millions</p>
            <h3>${esc(byExp[0].country)} has ${people(byExp[0].flood_exposed_k * 1e3)}, ${esc(byExp[1].country)} ${people(byExp[1].flood_exposed_k * 1e3)}</h3>
            <p class="note">${esc(byExp[2].country)} is next with <b ${t(byExp[2].flood_source)}>${people(byExp[2].flood_exposed_k * 1e3)}</b>, ${pct(byExp[2].flood_exposed_pct, 1)} of its people.</p>
            <div class="em-bars" id="ds-topexp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Share of people exposed · countries with at least a million people</p>
            <h3>In ${esc(the(byShare[0].country))}, ${pct(byShare[0].flood_exposed_pct, 1)}; in ${esc(the(byShare[1].country))}, ${pct(byShare[1].flood_exposed_pct, 1)}</h3>
            <p class="note">${over30} countries have 30% or more of their people in flood-prone areas. The United Kingdom has <b ${t(uk.flood_source)}>${pct(uk.flood_exposed_pct, 1)}</b>.</p>
            <div class="em-bars" id="ds-topshare"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Flood-exposed and living on under $5.50 a day · millions</p>
            <h3>${esc(byPoor[0].country)} has ${people(byPoor[0].poor550_k * 1e3)} people who are both</h3>
            <p class="note">Poor households have the least to fall back on after a flood. Across the 188 countries, over <b ${t(f.poor550.source)}>${nf(f.poor550.value)} million</b> people live on under $5.50 a day in places at high flood risk. In ${esc(the(BY.SSD.country))}, <b ${t(BY.SSD.flood_source)}>${pct(BY.SSD.poor190_pct)}</b> of people are flood-exposed and live on under $1.90 a day.</p>
            <div class="em-bars" id="ds-toppoor"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Extreme poverty", f.extreme, `${nf(f.extreme.value)} million`, `people face high flood risk and live on under $1.90 a day; 44% of them are in Sub-Saharan Africa.`, true)}
          ${factCard("South and East Asia", f.asia, `${nf(f.asia.value, 2)} billion`, `of the world's flood-exposed people live in South and East Asia.`)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>In England, <span class="accent">${mn(f.uk_total.value)} properties</span> are in areas at risk of flooding</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Properties in England in areas at flood risk · now and with climate change</p>
            <h3>${mn(swTot.properties / 1e6)} at risk from surface water and ${mn(rsTot.properties / 1e6)} from rivers and the sea</h3>
            <p class="note">Some properties are at risk from both. With climate change, the Environment Agency expects about <b ${t(f.uk_2050.source)}>${mn(f.uk_2050.value, 0)}</b> properties to be at risk by mid-century, one in four. High risk means a chance of flooding of more than 3.3% a year; medium, 1 to 3.3%; low, 0.1 to 1%. Being in an area at risk does not mean water will enter a building.</p>
            <div class="ds-key"><span>${dot("--em-accent")}Present day</span><span>${dot("--ds-alt")}With climate change, mid-century</span></div>
            <div class="ds-pairs" id="ds-ukrisk"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Properties at high or medium flood risk · % of each region's properties</p>
            <h3>${esc(regSW.region)} has the most surface water risk, ${pct(regSW.sw_high_medium_pct, 1)}; ${esc(regRS.region)} the most river and sea risk, ${pct(regRS.rs_high_medium_pct, 1)}</h3>
            <p class="note">London's river and sea risk is low partly because of the Thames Barrier. Across England, <b ${t(regTot.source)}>${pct(regTot.sw_high_medium_pct, 1)}</b> of properties are at high or medium risk from surface water and <b ${t(regTot.source)}>${pct(regTot.rs_high_medium_pct, 1)}</b> from rivers and the sea.</p>
            <div class="ds-key"><span>${dot("--em-accent")}Surface water</span><span>${dot("--ds-alt")}Rivers and the sea</span></div>
            <div class="ds-pairs one" id="ds-ukreg"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Infrastructure in areas at flood risk · % of each type, present day</p>
            <h3>${pct(INF[0].present_pct, 1)} of England's roads and ${pct(INF[1].present_pct, 1)} of its railways</h3>
            <p class="note">From rivers, the sea and surface water. With climate change, by 2040 to 2060, the share of railways at risk rises to <b ${t(INF[1].source)}>${pct(INF[1].climate_pct, 1)}</b>.</p>
            <div class="em-bars" id="ds-ukinfra"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Flood claims in 2025", f.abi_flood, `£${nf(f.abi_flood.value)} million`, `paid for domestic flood claims in the UK in 2025, up 38%. The average flood payout to a homeowner rose 60% to <b ${t(f.abi_floodavg.source)}>£${nf(f.abi_floodavg.value)}</b>. All weather damage to homes and possessions cost <b ${t(f.abi_homes.source)}>£${nf(f.abi_homes.value)} million</b>.`, true)}
          ${factCard("Flood Re", f.floodre_policies, nf(f.floodre_policies.value), `home insurance policies were passed to Flood Re, the scheme that keeps flood cover affordable for homes at high risk, in the year to March 2026. It is due to end in 2039.`)}
          ${factCard("Winter 2023 to 2024", f.uk_winter, `About ${nf(f.uk_winter.value)}`, `properties in England flooded in the storms of winter 2023 to 2024. Flood defences protected around <b ${t(f.uk_protected.source)}>${nf(f.uk_protected.value)}</b>.`)}
          ${factCard("Surface water", { source: swHigh.source }, mn(swHigh.properties / 1e6), `properties are at high risk of surface water flooding, when heavy rain overwhelms drains, against <b ${t(rsHigh.source)}>${nf(rsHigh.properties)}</b> at high risk from rivers and the sea.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="ds-search" id="ds-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap ds-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="flood_exposed_k" aria-sort="descending"><button type="button">Flood-exposed people</button></th>
                <th class="r" data-key="flood_exposed_pct" aria-sort="none"><button type="button">% of people</button></th>
                <th class="r hide-n" data-key="poor550_pct" aria-sort="none"><button type="button">Exposed, under $5.50, %</button></th>
                <th class="r hide-n" data-key="displaced_2025" aria-sort="none"><button type="button">Displacements ${Y}</button></th>
                <th class="r hide-n" data-key="displaced_avg" aria-sort="none"><button type="button">A year, ${A0}–${Y}</button></th>
                <th class="r hide-n" data-key="displaced_per_1000" aria-sort="none"><button type="button">Per 1,000 people</button></th>
              </tr></thead>
              <tbody id="ds-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>Flood exposure</b> is from Rentschler, Salhab and Jafino, <i>Flood exposure and poverty in 188 countries</i> (Nature Communications, 2022), Supplementary Table 1: people living where a 1-in-100-year flood from rivers, heavy rain or the sea would be more than 15 cm deep, on 2020 population maps, and those among them living on under $1.90, $3.20 and $5.50 a day. It describes the hazard, not the remaining risk: flood defences are not modelled, and it is not a projection. The country figures add up to the paper's totals (1.81 billion; 170 million under $1.90 a day; 780 million under $5.50). Poverty figures come from the World Bank's subnational poverty estimates, which the study had for most countries; its table shows 0 where it had none, so we treat a 0 at all three poverty lines as missing (${C.filter((r) => r.flood_exposed_k != null && r.poor190_k == null).length} countries, including Afghanistan and Somalia), and leave out China's $3.20 and $5.50 figures, which are 0 against ${people(BY.CHN.poor190_k * 1e3)} under $1.90.</p>
        <p><b>Displacement</b> is IDMC's count of new internal displacements caused by disasters, summed from its event data for each country and year, including pre-emptive evacuations; one person can be counted more than once. Per 1,000 people is the ${A0} to ${Y} yearly average divided by average population (World Bank); years with no recorded event count as zero, and countries with no event since 2008 have no figure. <b>Deaths, people affected and losses by hazard</b> are quoted from CRED's <i>2025 Disasters in Numbers</i>, which summarises the EM-DAT database; EM-DAT's own records are not republished here because its terms do not allow it. EM-DAT counts a disaster when at least 10 people die, 100 are affected, or a state of emergency or call for international help is declared, so small events and slow killers such as heat and drought are undercounted. <b>Insured losses</b> are quoted from Munich Re and Swiss Re Institute, whose estimates differ slightly; Munich Re's exclude droughts and heatwaves. <b>UK</b> figures are from the Environment Agency's National assessment of flood and coastal erosion risk (NaFRA 2024) for England, and from ABI and Flood Re releases for the UK.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("exposed", "01", "Flood risk", `<span class="accent">${nf(f.exposed.value, 2)} billion</span> people live in places a major flood would reach`, `That is <b ${t(f.exposed_pct.source)}>${pct(f.exposed_pct.value)}</b> of the world. The darker the country, the larger the share.`)}
            ${step("poor", "02", "Poverty", `<span class="accent">${nf(f.poor550.value)} million</span> of them live on under $5.50 a day`, `${esc(byPoor[0].country)} alone has <b ${t(byPoor[0].flood_source)}>${people(byPoor[0].poor550_k * 1e3)}</b>.`)}
            ${step("deaths", "03", `Deaths in ${Y}`, `Disasters killed <span class="accent">${nf(f.deaths.value)}</span> people in ${Y}`, `${esc(PLURAL[byDeaths[0].hazard])} killed the most. The yearly average since 2005 is <b ${t(f.deaths_avg.source)}>${nf(f.deaths_avg.value)}</b>.`)}
            ${step("displaced", "04", "Forced from home", `<span class="accent">${mn(wNow.total / 1e6)}</span> disaster displacements in ${Y}`, `Down from <b ${t(wMax.source)}>${mn(wMax.total / 1e6)}</b> in ${wMax.year}, the most since ${W[0].year}. Most were caused by storms and floods.`)}
            ${step("gap", "05", "Who pays", `Only <span class="accent">${pct(apac.insured_pct)}</span> of Asia-Pacific's losses were insured`, `Against <b ${t(nam.source)}>${pct(nam.insured_pct)}</b> in North America. Worldwide, about half of ${Y}'s <b ${t(mrNow.source)}>${usd(mrNow.overall_bn)}</b> was uninsured.`)}
            ${step("uk", "06", "England", `<span class="accent">${mn(f.uk_total.value)}</span> properties are in areas at flood risk`, `About <b ${t(f.uk_2050.source)}>${mn(f.uk_2050.value, 0)}</b> by mid-century with climate change.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="ds-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "flood", sel: "BGD" };
    const mapEl = main.querySelector("#ds-map");
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
      mode === "flood" ? (r.flood_exposed_pct != null ? `${pct(r.flood_exposed_pct, 1)} of people exposed to significant flood risk` : "No flood estimate")
        : mode === "poor" ? (r.poor550_pct != null ? `${pct(r.poor550_pct, 1)} flood-exposed and under $5.50 a day` : "No flood estimate")
          : r.displaced_per_1000 != null ? `${nf(r.displaced_per_1000, 1)} displacements a year per 1,000 people` : "No displacement figure";
    const map = new maplibregl.Map({
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
    const scaleEl = main.querySelector("#ds-scale");
    const SCALE_TITLE = { flood: "People exposed to significant flood risk:", poor: "Flood-exposed and living on under $5.50 a day:", displaced: `Disaster displacements a year per 1,000 people, ${A0} to ${Y}:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#ds-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const cs = (v, s) => `<span ${t(s)}>${v}</span>`;
      const head = state.mode === "flood"
        ? { eb: "Exposed to significant flood risk", big: pct(r.flood_exposed_pct, 1), s: r.flood_source, sub: r.flood_exposed_k != null ? `${people(r.flood_exposed_k * 1e3)} people` : "no estimate in the study" }
        : state.mode === "poor"
          ? { eb: "Flood-exposed and under $5.50 a day", big: pct(r.poor550_pct, 1), s: r.poor550_pct != null ? r.flood_source : null, sub: r.poor550_k != null ? `${people(r.poor550_k * 1e3)} people` : esc(r.poverty_note ?? "no estimate in the study") }
          : { eb: `Displacements per 1,000 people a year · ${A0}–${Y}`, big: r.displaced_per_1000 != null ? nf(r.displaced_per_1000, 1) : "n/a", s: r.displaced_source, sub: r.displaced_avg != null ? `${people(r.displaced_avg)} a year on average` : "no displacement recorded since 2008" };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="ds-pick"><span class="em-eyebrow">Choose</span><select id="ds-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${head.s ? t(head.s) : ""}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.flood_exposed_k != null ? row("Flood-exposed people", cs(`${people(r.flood_exposed_k * 1e3)} (${pct(r.flood_exposed_pct, 1)})`, r.flood_source)) : ""}
          ${r.poor190_k != null ? row("…and under $1.90 a day", cs(`${people(r.poor190_k * 1e3)} (${pct(r.poor190_pct, 1)})`, r.flood_source)) : ""}
          ${r.poor550_k != null ? row("…and under $5.50 a day", cs(`${people(r.poor550_k * 1e3)} (${pct(r.poor550_pct, 1)})`, r.flood_source)) : ""}
          ${r.flood_exposed_k != null && r.poverty_note ? row("Poverty figures", esc(r.poverty_note)) : ""}
          ${r.displaced_2025 != null ? row(`Displacements · ${Y}`, cs(nf(r.displaced_2025), r.displaced_source)) : ""}
          ${r.displaced_2024 != null ? row(`Displacements · ${Y - 1}`, cs(nf(r.displaced_2024), r.displaced_source)) : ""}
          ${r.displaced_avg != null ? row(`A year, ${A0}–${Y}`, cs(nf(r.displaced_avg), r.displaced_source)) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#ds-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".ds-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".ds-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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

    // ---------- Line chart ----------
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), aria, h = 240, area = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: narrow ? 104 : 150, b: 22, l: 46 };
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
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="ds-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${area ? `<path d="${path(series[0].pts)}L${x(series[0].pts.at(-1)[0])},${y(yMin)}L${x(series[0].pts[0][0])},${y(yMin)}Z" fill="var(${series[0].v})" opacity=".12"/>` : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="2.4" stroke-linejoin="round"/>`).join("")}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${esc(narrow ? e.short ?? e.name : e.name)} ${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xFmt(x1))}</text></svg>`;
    }
    const drawDisp = (el, h) => lineChart(el, {
      series: [
        { name: "All", short: "All", v: "--em-accent", pts: W.map((r) => [r.year, r.total / 1e6]), endText: `${nf(wNow.total / 1e6, 1)}m` },
        { name: "Storms", short: "Storms", v: "--ds-alt", pts: W.map((r) => [r.year, r.storm / 1e6]), endText: `${nf(wNow.storm / 1e6, 1)}m` },
        { name: "Floods", short: "Floods", v: "--ds-b2", pts: W.map((r) => [r.year, r.flood / 1e6]), endText: `${nf(wNow.flood / 1e6, 1)}m` },
      ],
      yMax: 50, yStep: 10, fmtY: (v) => `${v}m`, xTicks: [2010, 2015, 2020], h, area: true,
      aria: `Disaster displacements worldwide: ${mn(W[0].total / 1e6)} in ${W[0].year}, a high of ${mn(wMax.total / 1e6)} in ${wMax.year} and ${mn(wNow.total / 1e6)} in ${Y}; storms ${mn(wNow.storm / 1e6)} and floods ${mn(wNow.flood / 1e6)} in ${Y}`,
    });
    const drawAll = () => drawDisp(main.querySelector("#ds-disp"), 240);
    drawAll();

    // ---------- Paired and stacked bars ----------
    // rows: [{ label, a, b, sa, sb, fa, fb }] — a in the accent colour, b in the second colour.
    function pairBars(el, rows, fmt, max = Math.max(...rows.flatMap((r) => [r.a ?? 0, r.b ?? 0]))) {
      const bar = (v, c, s, label, f = fmt) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${(100 * Math.min(v ?? 0, max)) / max}%;background:var(${c})"></b></div><span class="v" ${v != null ? t(s) : ""}>${v == null ? "n/a" : f(v)}</span></div>`;
      el.innerHTML = rows.map((r) => `<div class="it"><div class="lb">${esc(r.label)}</div><div class="tr">
        ${bar(r.a, "--em-accent", r.sa, `${r.label}: ${r.la ?? ""} ${r.a == null ? "n/a" : fmt(r.a)}`)}
        ${bar(r.b, "--ds-alt", r.sb, `${r.label}: ${r.lb ?? ""} ${r.b == null ? "n/a" : fmt(r.b)}`)}</div></div>`).join("");
    }
    // rows: [{ label, total, part, partMax, s }] — the part (insured) is drawn inside the total.
    function stackBars(el, rows) {
      const max = Math.max(...rows.map((r) => r.total));
      el.innerHTML = rows.map((r) => {
        const part = r.part ?? r.partMax, ins = r.part != null ? usd(r.part) : `under ${usd(r.partMax)}`, share = r.part != null ? pct((100 * r.part) / r.total) : `<${pct(Math.ceil((100 * r.partMax) / r.total))}`;
        return `<div class="it"><div class="lb">${esc(r.label)}</div><div class="row"><div class="bar" role="img" aria-label="${esc(`${r.label}: ${usd(r.total)} of losses, ${ins} insured`)}"><b class="tot" style="width:${(100 * r.total) / max}%"></b><b class="ins" style="width:${(100 * part) / max}%"></b></div><span class="v" ${t(r.s)}>${usd(r.total)} · ${share}</span></div></div>`;
      }).join("");
    }
    const hzRows = (k, list = HZ) => list.map((h) => ({ label: h.hazard, a: h[`${k}_2025`], b: h[`${k}_avg`], sa: h.source, sb: h.source, la: String(Y), lb: "average" }));
    pairBars(main.querySelector("#ds-deaths"), hzRows("deaths", [...HZ].sort((a, b) => b.deaths_avg - a.deaths_avg)), (v) => nf(v));
    pairBars(main.querySelector("#ds-aff"), hzRows("affected_m", [...HZ].filter((h) => h.affected_m_avg >= 1 || h.affected_m_2025 >= 1).sort((a, b) => b.affected_m_avg - a.affected_m_avg)), (v) => `${nf(v, 1)}m`);
    pairBars(main.querySelector("#ds-loss"), hzRows("losses_bn", [...HZ].filter((h) => h.losses_bn_avg >= 1 || h.losses_bn_2025 >= 1).sort((a, b) => b.losses_bn_avg - a.losses_bn_avg)), (v) => usd(v));
    const lossRows = L.filter((r) => r.publisher === "Munich Re").map((r) => ({ label: r.period === String(Y) ? `${Y}` : r.period.replace(/^(\d+)-year average, (.*)$/, "$1-year average, $2 (a year)"), total: r.overall_bn, part: r.insured_bn, s: r.source }));
    stackBars(main.querySelector("#ds-losses"), lossRows);
    const regionRows = GR.map((r) => ({ label: r.region, total: r.overall_bn, part: r.insured_bn, partMax: r.insured_max, s: r.source }));
    stackBars(main.querySelector("#ds-regions"), regionRows);
    stackBars(main.querySelector("#ds-costly"), CO.map((r) => ({ label: `${r.event} · ${r.region}`, total: r.overall_bn, part: r.insured_bn, s: r.source })));
    const deadlyBars = (el, n = 10) => bars(el, DE.slice(0, n).map((r, i) => ({ label: `${r.country} · ${r.event}`, value: r.deaths, muted: i > 0, src: r.source })), (v) => nf(v), DE[0].deaths, t);
    deadlyBars(main.querySelector("#ds-deadly"));
    bars(main.querySelector("#ds-dispc"), byDisp.slice(0, 10).map((r, i) => ({ label: r.country, value: r.displaced_per_1000, muted: i > 0, src: r.displaced_source })), (v) => nf(v, 1), byDisp[0].displaced_per_1000, t);
    const expBars = (el, n = 10) => bars(el, byExp.slice(0, n).map((r, i) => ({ label: r.country, value: r.flood_exposed_k / 1e3, muted: i > 1, src: r.flood_source })), (v) => `${nf(v, v >= 10 ? 0 : 1)}m`, byExp[0].flood_exposed_k / 1e3, t);
    expBars(main.querySelector("#ds-topexp"));
    bars(main.querySelector("#ds-topshare"), byShare.slice(0, 10).map((r, i) => ({ label: r.country, value: r.flood_exposed_pct, muted: i > 0, src: r.flood_source })), (v) => pct(v, 1), 100, t);
    const poorBars = (el, n = 10) => bars(el, byPoor.slice(0, n).map((r, i) => ({ label: r.country, value: r.poor550_k / 1e3, muted: i > 0, src: r.flood_source })), (v) => `${nf(v, v >= 10 ? 0 : 1)}m`, byPoor[0].poor550_k / 1e3, t);
    poorBars(main.querySelector("#ds-toppoor"));
    const ukRiskRows = [...ukrs, ...uksw].filter((r) => r.band !== "Total" && r.band !== "Very low").map((r) => ({ label: `${r.flood_source}: ${r.band.toLowerCase()} risk`, a: r.properties, b: r.properties_climate, sa: r.source, sb: r.source, la: "present day", lb: `with climate change, ${r.climate_period}` }));
    pairBars(main.querySelector("#ds-ukrisk"), ukRiskRows, (v) => short(v));
    const regPairs = (el) => pairBars(el, REG.map((r) => ({ label: r.region, a: r.sw_high_medium_pct, b: r.rs_high_medium_pct, sa: r.source, sb: r.source, la: "surface water", lb: "rivers and the sea" })), (v) => pct(v, 1));
    regPairs(main.querySelector("#ds-ukreg"));
    bars(main.querySelector("#ds-ukinfra"), [...INF].sort((a, b) => b.present_pct - a.present_pct).map((r, i) => ({ label: r.asset, value: r.present_pct, muted: i > 1, src: r.source })), (v) => pct(v, 1), 100, t);

    // ---------- Table ----------
    const tbody = main.querySelector("#ds-tbody"), search = main.querySelector("#ds-search");
    let key = "flood_exposed_k", dir = -1;
    const cell = (v, s, hide, d = 0, fmt = (x) => nf(x, d)) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : fmt(v)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="ds-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        ${cell(r.flood_exposed_k, r.flood_source, false, 0, (v) => nf(v * 1e3))}
        <td class="r" ${r.flood_exposed_pct != null ? t(r.flood_source) : ""}>${r.flood_band ? `<i class="ds-sw" style="background:var(${SEQ[bandIdx("flood", r.flood_band)]})"></i>${nf(r.flood_exposed_pct, 1)}` : "–"}</td>
        ${cell(r.poor550_pct, r.flood_source, true, 1)}
        ${cell(r.displaced_2025, r.displaced_source, true)}
        ${cell(r.displaced_avg, r.displaced_source, true)}
        ${cell(r.displaced_per_1000, r.displaced_source, true, 1)}</tr>`).join("") || `<tr><td colspan="7">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".ds-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#ds-vis");
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
    const legend = (mode) => `<div class="ds-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "exposed") {
        vis.innerHTML = `<p class="vt">Share of people exposed to significant flood risk</p><div class="m"></div>${legend("flood")}`;
        miniMap(vis.querySelector(".m"), "flood");
      } else if (id === "poor") {
        vis.innerHTML = `<p class="vt">Flood-exposed and living on under $5.50 a day, millions</p><div class="em-bars" id="ds-vbars"></div>`;
        poorBars(vis.querySelector("#ds-vbars"), 8);
      } else if (id === "deaths") {
        vis.innerHTML = `<p class="vt">Deadliest disasters of ${Y}</p><div class="em-bars" id="ds-vbars"></div>`;
        deadlyBars(vis.querySelector("#ds-vbars"), 8);
      } else if (id === "displaced") {
        vis.innerHTML = `<p class="vt">Disaster displacements worldwide, millions</p><div class="m"></div>`;
        drawDisp(vis.querySelector(".m"), 240);
      } else if (id === "gap") {
        vis.innerHTML = `<p class="vt">Losses by continent, ${Y}, and the share insured</p>${keyIns}<div class="ds-stack" id="ds-vstack"></div>`;
        stackBars(vis.querySelector("#ds-vstack"), regionRows);
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">Properties at high or medium flood risk, % of each region</p><div class="ds-key"><span>${dot("--em-accent")}Surface water</span><span>${dot("--ds-alt")}Rivers and the sea</span></div><div class="ds-pairs one" id="ds-vpairs"></div>`;
        regPairs(vis.querySelector("#ds-vpairs"));
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
