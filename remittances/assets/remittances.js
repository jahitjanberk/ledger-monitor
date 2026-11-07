// The Cost of Sending Money Home dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--rm-b0", "--rm-b1", "--rm-b2", "--rm-b3", "--rm-b4"];
const MAPS = {
  gdp: { key: "gdp_band", label: "World map of countries coloured by personal remittances received as a share of GDP" },
  usd: { key: "usd_band", label: "World map of countries coloured by personal remittances received in US dollars" },
  cost: { key: "cost_band", label: "World map of countries coloured by the average cost of sending $200 to them" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const nf = (v, d = 0) => (v == null ? "n/a" : v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (v, d = 2) => (v == null ? "n/a" : `${nf(v, d)}%`);
const usd = (m) => (m == null ? "n/a" : m >= 1000 ? `$${nf(m / 1000, m >= 100000 ? 0 : 1)}bn` : `$${nf(m, m >= 10 ? 0 : 1)}m`);
const bn = (v, d = 1) => (v == null ? "n/a" : `$${nf(v, d)}bn`);
// RPW records a few corridors at more than the amount sent; they are kept in the data but left out of charts.
const OUTLIER = 100;
const THE = new Set(["United States", "United Kingdom", "United Arab Emirates", "Netherlands", "Russian Federation", "Philippines", "Dominican Republic", "Czech Republic", "Republic of Korea"]);
const the = (n) => (THE.has(n) ? `the ${n}` : n);
const SHORT = { "Oceania (excluding Australia and New Zealand)": "Oceania (excl. Australia, NZ)", "Latin America and the Caribbean": "Latin America, Caribbean" };
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
  id: "remittances",
  title: "The Cost of Sending Money Home",
  description:
    "How much migrants send home, how much of some economies that money is, and what it costs to send, by corridor and by type of provider, against the UN target of 3%, from World Bank and UN data, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), Y = DATA.year;
    const W = DATA.world, w = (y) => W.find((r) => r.year === y), wNow = w(Y), w2000 = w(2000), w2015 = w(2015);
    const WC = W.filter((r) => r.cost_global != null), wc0 = WC[0];
    const QT = DATA.quarterly, qNow = QT.at(-1), q0 = QT[0];
    const CO = DATA.corridors, coOk = CO.filter((r) => r.cost < OUTLIER), outliers = CO.filter((r) => r.cost >= OUTLIER);
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const BR = DATA.breakdown, brOf = (dim) => BR.filter((b) => b.dimension === dim && b.category !== "Credit card" && b.category !== "Debit card");
    const RG = DATA.regions, regNow = RG.filter((r) => r.year === Y && r.code !== "1").sort((a, b) => b.cost - a.cost);
    const under3 = CO.filter((r) => r.cost < 3).length, upto5 = CO.filter((r) => r.cost <= 5).length;
    const byGdp = C.filter((r) => r.received_gdp_pct != null).sort((a, b) => b.received_gdp_pct - a.received_gdp_pct);
    const byUsd = C.filter((r) => r.received_usd_m != null).sort((a, b) => b.received_usd_m - a.received_usd_m);
    const over10 = byGdp.filter((r) => r.received_gdp_pct >= 10).length;
    const byCostIn = C.filter((r) => r.cost_receive != null).sort((a, b) => b.cost_receive - a.cost_receive);
    const lmicShare = (100 * wNow.received_lmic_bn) / wNow.received_world_bn;
    const uk = BY.GBR, UKC = DATA.uk_cost, ukNow = UKC.at(-1), uk0 = UKC[0], UKF = DATA.uk_flows.filter((r) => r.paid_usd_m != null), ukfNow = UKF.at(-1);
    const ukCor = CO.filter((r) => r.from_iso3 === "GBR").sort((a, b) => a.cost - b.cost);
    const ukUnder3 = ukCor.filter((r) => r.cost < 3).length;
    const senders = [...new Set(CO.map((r) => r.from_iso3))].map((k) => ({ iso3: k, name: CO.find((r) => r.from_iso3 === k).from })).sort((a, b) => a.name.localeCompare(b.name));
    const bankFee = BR.find((b) => b.dimension === "Provider type" && b.category === "Banks");
    const growth = wNow.received_lmic_bn / w(2010).received_lmic_bn, fall = 100 * (1 - wNow.cost_global / wc0.cost_global), bankX = f.banks.value / f.mtos.value;
    const ratio = qNow.global / f.target.value;

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "remittances",
      name: "Remittances",
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
        <p class="em-eyebrow"><span class="num">00</span>Remittances · World Bank prices for Q3 ${Y}, flows to ${Y}</p>
        <h1>Sending $200 home costs <b>${pct(f.global.value)}</b> on average, <span class="accent">more than twice the 3% target</span></h1>
        <p class="em-lede">People working abroad sent <b ${t(wNow.flows_source)}>${bn(wNow.received_lmic_bn)}</b> to low- and middle-income countries in ${Y}, out of <b ${t(wNow.flows_source)}>${bn(wNow.received_world_bn)}</b> recorded worldwide. On a typical $200 transfer, fees and exchange-rate margins took <b ${t(f.global.source)}>${pct(f.global.value)}</b> in the third quarter of ${Y}, down from <b ${t(f.global2009.source)}>${pct(f.global2009.value)}</b> in 2009. The UN goal is under 3% by 2030. Banks charged <b ${t(f.banks.source)}>${pct(f.banks.value)}</b>; sending from the UK cost <b ${t(ukNow.source)}>${pct(ukNow.uk_send)}</b>.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Costs are falling slowly, <span class="accent">and the 2030 target is still far off</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Average cost of sending $200", pct(f.global.value), `Q3 ${Y}, across ${nf(qNow.services)} services in ${nf(CO.length)} corridors. Target: under <span ${t(f.target.source)}>3%</span> by 2030`, f.global.source, true)}
          ${kpi("Remittances received", bn(wNow.received_world_bn), `Worldwide in ${Y}, recorded flows only. <span ${t(wNow.flows_source)}>${bn(wNow.received_lmic_bn)}</span> of it went to low- and middle-income countries`, wNow.flows_source)}
          ${kpi("Sending through a bank", pct(f.banks.value), `Q3 ${Y}. Money transfer operators averaged <span ${t(f.mtos.source)}>${pct(f.mtos.value)}</span>`, f.banks.source)}
          ${kpi("Corridors at 5% or less", `${upto5} of ${CO.length}`, `Q3 ${Y}. Only ${under3} are below 3%. The target is that no corridor costs more than <span ${t(f.target.source)}>5%</span>`, "sdg-10c1")}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Country by country</p><h2>In ${over10} countries, money from abroad is <span class="accent">a tenth of GDP or more</span></h2></div></div>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="rm-mode" data-mode="gdp" aria-pressed="true">Share of GDP</button>
                <button type="button" class="rm-mode" data-mode="usd" aria-pressed="false">US dollars</button>
                <button type="button" class="rm-mode" data-mode="cost" aria-pressed="false">Cost to receive</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="rm-map" role="region" aria-label="${MAPS.gdp.label}"></div>
            <div class="rm-scale" id="rm-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="rm-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec" id="flows">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>How much is sent</p><h2>Remittances to poorer countries are <span class="accent">${nf(growth, 1)} times</span> their 2010 level</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Personal remittances received · US$ billion, 2000 to ${Y}</p>
            <h3>${bn(wNow.received_lmic_bn)} went to low- and middle-income countries in ${Y}, ${nf(lmicShare)}% of the world total</h3>
            <p class="note">Up from <b ${t(w2000.flows_source)}>${bn(w2000.received_lmic_bn)}</b> in 2000 and <b ${t(w(2010).flows_source)}>${bn(w(2010).received_lmic_bn)}</b> in 2010, in current dollars, not adjusted for inflation. These are flows recorded in countries' balance of payments; money carried by hand or sent informally is not counted.</p>
            <div class="rm-key"><span>${dot("--em-accent")}Low- and middle-income countries</span><span>${dot("--rm-muted")}World</span></div>
            <div id="rm-flowtrend"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Remittances received · % of GDP, latest year</p>
            <h3>In ${esc(byGdp[0].country)} they equal ${nf(byGdp[0].received_gdp_pct, 1)}% of GDP</h3>
            <p class="note">Mostly ${Y}. Across low- and middle-income countries, remittances were <b ${t(wNow.flows_source)}>${pct(wNow.received_lmic_gdp_pct, 1)}</b> of GDP.</p>
            <div class="em-bars" id="rm-topgdp"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Remittances received · US$, ${Y}</p>
            <h3>${esc(byUsd[0].country)} received ${usd(byUsd[0].received_usd_m)}, the most of any country</h3>
            <p class="note">Personal remittances include the pay of cross-border and seasonal workers, so some high-income countries, such as ${esc(byUsd.find((r) => r.income === "High income").country)}, rank high.</p>
            <div class="em-bars" id="rm-topusd"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="costs">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Against the target</p><h2>The average cost is down ${nf(fall)}% since ${wc0.year}, <span class="accent">but still more than twice the target</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Global average cost of sending $200 · % of the amount sent, ${wc0.year} to ${Y}</p>
            <h3>Down from ${pct(wc0.cost_global)} in ${wc0.year} to ${pct(wNow.cost_global)} in ${Y}, ${nf(ratio, 1)} times the target</h3>
            <p class="note">Third quarter of each year; the SDG series has no figure for 2012 to 2014 or 2016. Since 2021 the average has moved between <b ${t("sdg-10c1")}>${pct(Math.min(...WC.filter((r) => r.year >= 2021).map((r) => r.cost_global)))}</b> and <b ${t("sdg-10c1")}>${pct(Math.max(...WC.filter((r) => r.year >= 2021).map((r) => r.cost_global)))}</b>.</p>
            <div id="rm-costtrend"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Average cost of sending $200 by receiving region · Q3 ${Y}</p>
            <h3>Sending to ${esc(regNow[0].region)} costs ${pct(regNow[0].cost)}</h3>
            <p class="note">UN SDG regions. The cheapest is ${esc(regNow.at(-1).region)}, at <b ${t(regNow.at(-1).source)}>${pct(regNow.at(-1).cost)}</b>.</p>
            <div class="em-bars" id="rm-regions"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Costliest countries to send money to · Q3 ${Y}</p>
            <h3>Sending to ${esc(byCostIn[0].country)} costs ${pct(byCostIn[0].cost_receive)} on average</h3>
            <p class="note">Average over every corridor RPW tracks into each country. ${byCostIn.some((r) => r.iso3 === "BGR") ? `Bulgaria's figure is raised by one corridor from Türkiye that RPW records at more than the amount sent.` : ""}</p>
            <div class="em-bars" id="rm-costin"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Shopping around", f.smart, pct(f.smart.value), `is the average of the three cheapest services that most senders can use in each corridor (SmaRT), in Q3 ${Y}. <b ${t(f.smart5.source)}>${f.smart5.value}%</b> of corridors have a SmaRT average below 5%.`, true)}
          ${factCard("Online is cheaper", f.digital, pct(f.digital.value), `was the average cost of a digital transfer, paid online and received into an account, against <b ${t(f.nondigital.source)}>${pct(f.nondigital.value)}</b> for other services. Digital services were <b ${t(f.digitalshare.source)}>${f.digitalshare.value}%</b> of those surveyed.`)}
          ${factCard("Weighted by flows", f.weighted, pct(f.weighted.value), `is the average weighted by the estimated money flowing through each corridor, against a simple average of <b ${t(f.global.source)}>${pct(f.global.value)}</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="providers">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Who you send with</p><h2>Banks charge <span class="accent">${nf(bankX, 1)} times</span> as much as money transfer operators</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Average cost of sending $200 by type of provider · %, ${esc(q0.period)} to ${esc(qNow.period)}</p>
            <h3>Banks averaged ${pct(qNow.banks)} in ${esc(qNow.period)}; money transfer operators ${pct(qNow.mtos)}</h3>
            <p class="note">Simple averages over the services RPW surveys each quarter; Q2 2025 was not collected. Banks were <b ${t(q0.source)}>${pct(q0.banks)}</b> in ${esc(q0.period)}. Post offices (${qNow.post_services} services) and mobile operators (${qNow.mobile_services}) are too few to chart.</p>
            <div class="rm-key"><span>${dot("--rm-alt2")}Banks</span><span>${dot("--rm-muted")}All services</span><span>${dot("--em-accent")}Money transfer operators</span></div>
            <div id="rm-types"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">What the cost is made of · % of $200, Q3 ${Y}</p>
            <h3>Fees are most of the cost; the exchange-rate margin is ${pct(qNow.fx_margin)} on average</h3>
            <p class="note">The margin is the gap between the exchange rate a provider gives and the market rate.</p>
            <div class="rm-key"><span>${dot("--em-accent")}Fee</span><span>${dot("--rm-alt")}Exchange-rate margin</span></div>
            <div class="rm-stack" id="rm-split"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Average cost by how the sender pays · Q3 ${Y}</p>
            <h3>Paying by card cost ${pct(BR.find((b) => b.category === "Credit or debit card").cost)}; from a bank account, ${pct(BR.find((b) => b.category === "Bank account transfer").cost)}</h3>
            <p class="note">Paying at a bank branch cost <b ${t("rpw")}>${pct(BR.find((b) => b.category === "Bank branch")?.cost)}</b>, online <b ${t("rpw")}>${pct(BR.find((b) => b.category === "Internet")?.cost)}</b>.</p>
            <div class="em-bars" id="rm-pay"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Biggest global firms", f.mtoindex, pct(f.mtoindex.value), `was the average for the international money transfer operators present in more than 85% of corridors. Five digital-only operators averaged <b ${t(f.digitalmto.source)}>${pct(f.digitalmto.value)}</b>.`)}
          ${factCard("Getting the money", f.wallet, pct(f.wallet.value), `was the average cost when the money arrived in a mobile wallet. Card payment was the cheapest way to fund a transfer, at <b ${t(f.cards.source)}>${pct(f.cards.value)}</b>.`, true)}
        </div>
      </section>

      <section class="em-sec" id="corridors">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Corridor by corridor</p><h2>The same $200 can cost <span class="accent">under 2% or over 20%</span> depending on the route</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Average cost of sending $200 from one country · Q3 ${Y}</p>
            <label class="rm-pick"><span class="em-eyebrow">Sending from</span><select id="rm-sender">${senders.map((s) => `<option value="${s.iso3}"${s.iso3 === "USA" ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
            <h3 id="rm-corh"></h3>
            <p class="note" id="rm-cornote"></p>
            <div class="rm-key"><span>${dot("--em-accent")}Fee</span><span>${dot("--rm-alt")}Exchange-rate margin</span><span>┆ 3% and 5% targets</span></div>
            <div class="rm-stack rm-scroll" id="rm-corbars"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Costliest corridors · Q3 ${Y}</p>
            <h3>${esc(coOk.slice().sort((a, b) => b.cost - a.cost)[0].from)} to ${esc(coOk.slice().sort((a, b) => b.cost - a.cost)[0].to)}: ${pct(coOk.slice().sort((a, b) => b.cost - a.cost)[0].cost)}</h3>
            <p class="note">${outliers.length ? `${outliers.map((r) => `${esc(r.from)} to ${esc(r.to)}`).join(", ")} is recorded at <b ${t(outliers[0].cost_source)}>${pct(outliers[0].cost)}</b>, more than the amount sent, and is left out here. ` : ""}<b ${t(f.over20.source)}>${f.over20.value}</b> corridors cost more than 20%; nine start in Sub-Saharan Africa.</p>
            <div class="em-bars" id="rm-dear"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Cheapest corridors · Q3 ${Y}</p>
            <h3>${under3} corridors are already below 3%</h3>
            <p class="note">The cheapest single service in a corridor is often far below its average. Across all corridors, <b ${t(f.under10.source)}>${f.under10.value}%</b> average less than 10%, against 53% in 2009.</p>
            <div class="em-bars" id="rm-cheap"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Close to home</p><h2>Sending from the UK costs <span class="accent">${pct(ukNow.uk_send)}</span>, among the cheapest of the big economies</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Average cost of sending $200 from the UK and worldwide · %, ${uk0.year} to ${ukNow.year}</p>
            <h3>Down from ${pct(uk0.uk_send)} in ${uk0.year} to ${pct(ukNow.uk_send)} in ${ukNow.year}</h3>
            <p class="note">Third quarter of each year, across the ${ukCor.length} corridors from the UK that RPW tracks. Among G20 countries only Germany, at <b ${t(f.ukg20.source)}>4.49%</b>, was cheaper in Q3 ${Y}.</p>
            <div class="rm-key"><span>${dot("--em-accent")}From the UK</span><span>${dot("--rm-muted")}Global average</span></div>
            <div id="rm-uktrend"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Corridors from the UK · average cost of sending $200, Q3 ${Y}</p>
            <h3>${esc(ukCor[0].to)} is the cheapest at ${pct(ukCor[0].cost)}; ${esc(ukCor.at(-1).to)} the dearest at ${pct(ukCor.at(-1).cost)}</h3>
            <p class="note">${ukUnder3} of ${ukCor.length} UK corridors average below 3%. In Q3 2016 sending to India cost <b ${t("sdg-10c1")}>${pct(ukCor.find((r) => r.to_iso3 === "IND")?.cost_2016)}</b> and to Nigeria <b ${t("sdg-10c1")}>${pct(ukCor.find((r) => r.to_iso3 === "NGA")?.cost_2016)}</b>.</p>
            <div class="rm-stack rm-scroll" id="rm-ukbars"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Personal remittances paid from the UK · US$ billion, 2000 to ${ukfNow.year}</p>
            <h3>${usd(ukfNow.paid_usd_m)} was sent out of the UK in ${ukfNow.year}</h3>
            <p class="note">The UK received <b ${t(ukfNow.source)}>${usd(DATA.uk_flows.at(-1).received_usd_m)}</b>. Figures in current dollars, so they move with the pound.</p>
            <div id="rm-ukpaid"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">08</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <input class="rm-search" id="rm-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap rm-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="received_usd_m" aria-sort="descending"><button type="button">Received, US$m</button></th>
                <th class="r" data-key="received_gdp_pct" aria-sort="none"><button type="button">% of GDP</button></th>
                <th class="r hide-n" data-key="paid_usd_m" aria-sort="none"><button type="button">Paid, US$m</button></th>
                <th class="r hide-n" data-key="cost_receive" aria-sort="none"><button type="button">Cost to receive, %</button></th>
                <th class="r hide-n" data-key="cost_send" aria-sort="none"><button type="button">Cost to send, %</button></th>
              </tr></thead>
              <tbody id="rm-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">09</span>Method</p>
        <p><b>Costs</b> come from the World Bank's Remittance Prices Worldwide (RPW), which records what it costs to send the equivalent of $200 through each service in ${CO.length} corridors, from ${senders.length} sending countries, in the third quarter of ${Y}. The total cost is the fee plus the exchange-rate margin (the gap between the rate the provider gives and the market rate), as a share of the amount sent. Averages are simple averages over services, so a small service counts as much as a large one. Global, regional, country and corridor averages are the World Bank's figures as published in the UN SDG database (indicator 10.c.1). Averages by provider type and payment method, the split between fee and margin, and the cheapest service in each corridor are calculated here from the RPW dataset; a service listed under two provider types counts in both. They match the RPW report for banks (14.99%) and money transfer operators (within 0.01 points); the report gives 5.58% for post offices, which matches the eight services listed only as post offices. <b>Flows</b> are personal remittances from the World Bank's World Development Indicators: money sent home by migrants plus the pay of people working briefly abroad, as recorded in balance of payments data. Informal transfers are not counted, and the latest year is partly estimated. <b>Targets</b>: SDG target 10.c aims to cut the average cost below 3% by 2030 and to remove corridors costing more than 5%.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("gdp", "01", "Money from abroad", `In ${esc(byGdp[0].country)}, remittances are <span class="accent">${nf(byGdp[0].received_gdp_pct, 0)}%</span> of GDP`, `In ${over10} countries they are a tenth of the economy or more. Darker countries depend on them most.`)}
            ${step("flows", "02", "Growing", `<span class="accent">${bn(wNow.received_lmic_bn)}</span> went to low- and middle-income countries in ${Y}`, `Up from <b ${t(w2000.flows_source)}>${bn(w2000.received_lmic_bn)}</b> in 2000, in current dollars.`)}
            ${step("cost", "03", "The price", `Each $200 sent costs <span class="accent">${pct(f.global.value)}</span> on average`, `The UN target is under 3% by 2030. In ${wc0.year} it was <b ${t(wc0.cost_source)}>${pct(wc0.cost_global)}</b>.`)}
            ${step("banks", "04", "Who you send with", `Banks charge <span class="accent">${pct(f.banks.value)}</span>`, `Money transfer operators average <b ${t(f.mtos.source)}>${pct(f.mtos.value)}</b>; digital services <b ${t(f.digital.source)}>${pct(f.digital.value)}</b>.`)}
            ${step("routes", "05", "The route matters", `<span class="accent">${f.over20.value}</span> corridors cost more than 20%`, `Only ${under3} of ${CO.length} are below the 3% target. Nine of the ${f.over20.value} start in Sub-Saharan Africa.`)}
            ${step("uk", "06", "From the UK", `Sending from the UK costs <span class="accent">${pct(ukNow.uk_send)}</span>`, `Down from <b ${t(uk0.source)}>${pct(uk0.uk_send)}</b> in ${uk0.year}. Sending to India costs <b ${t(ukCor[0].cost_source)}>${pct(ukCor.find((r) => r.to_iso3 === "IND")?.cost)}</b>.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="rm-vis"></div></div></div>
        </div>
      </div>`;

    // ---------- Map ----------
    const state = { mode: "gdp", sel: "NPL" };
    const mapEl = main.querySelector("#rm-map");
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
      mode === "gdp" ? (r.received_gdp_pct != null ? `remittances ${pct(r.received_gdp_pct, 1)} of GDP (${r.received_gdp_year})` : "No figure")
        : mode === "usd" ? (r.received_usd_m != null ? `${usd(r.received_usd_m)} received (${r.received_year})` : "No figure")
          : r.cost_receive != null ? `sending $200 here costs ${pct(r.cost_receive)}` : "Not covered by RPW";
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
    const scaleEl = main.querySelector("#rm-scale");
    const SCALE_TITLE = { gdp: "Remittances received, % of GDP, latest year:", usd: "Remittances received, latest year:", cost: `Average cost of sending $200 to the country, Q3 ${Y}:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(SEQ[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}${state.mode === "cost" ? "Not covered" : "No data"}</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#rm-detail");
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const cs = (v, s) => `<span ${t(s)}>${v}</span>`;
      const head = state.mode === "gdp"
        ? { eb: `Remittances received · % of GDP, ${r.received_gdp_year ?? "n/a"}`, big: pct(r.received_gdp_pct, 1), s: r.flows_source, sub: `low- and middle-income countries <span ${t(wNow.flows_source)}>${pct(wNow.received_lmic_gdp_pct, 1)}</span>` }
        : state.mode === "usd"
          ? { eb: `Remittances received · ${r.received_year ?? "n/a"}`, big: usd(r.received_usd_m), s: r.flows_source, sub: r.paid_usd_m != null ? `paid out: ${usd(r.paid_usd_m)} in ${r.paid_year}` : "no figure for money paid out" }
          : { eb: `Cost of sending $200 here · Q3 ${Y}`, big: r.cost_receive != null ? pct(r.cost_receive) : "Not covered", s: r.cost_source, sub: r.cost_receive != null ? `average over ${r.corridors_in} corridor${r.corridors_in === 1 ? "" : "s"}; world <span ${t(f.global.source)}>${pct(f.global.value)}</span>` : "RPW does not track sending money to this country" };
      const inC = CO.filter((x) => x.to_iso3 === r.iso3).sort((a, b) => a.cost - b.cost);
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="rm-pick"><span class="em-eyebrow">Choose</span><select id="rm-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${head.s ? t(head.s) : ""}>${esc(head.big)}</p>
        <p class="em-d-usd">${head.sub}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.received_usd_m != null ? row(`Received · ${r.received_year}`, cs(usd(r.received_usd_m), r.flows_source)) : ""}
          ${r.received_gdp_pct != null ? row(`Share of GDP · ${r.received_gdp_year}`, cs(pct(r.received_gdp_pct, 1), r.flows_source)) : ""}
          ${r.paid_usd_m != null ? row(`Paid out · ${r.paid_year}`, cs(usd(r.paid_usd_m), r.flows_source)) : ""}
          ${r.cost_receive != null ? row(`Cost to receive $200 · Q3 ${Y}`, cs(`${pct(r.cost_receive)}${r.cost_receive_2017 != null ? ` (${pct(r.cost_receive_2017)} in 2017)` : ""}`, r.cost_source)) : ""}
          ${inC.length ? row("Cheapest route in", cs(`from ${esc(inC[0].from)}, ${pct(inC[0].cost)}`, inC[0].cost_source)) : ""}
          ${r.cost_send != null ? row(`Cost to send $200 · Q3 ${Y}`, cs(`${pct(r.cost_send)}${r.cost_send_2017 != null ? ` (${pct(r.cost_send_2017)} in 2017)` : ""}`, r.cost_source)) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#rm-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".rm-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".rm-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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
    function lineChart(el, { series, yMax, yMin = 0, yStep, fmtY = (v) => String(v), xTicks, xFmt = (x) => String(Math.round(x)), xStart, xEnd, ref, aria, h = 240, area = false, dots = false }) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 12, r: series.some((s) => s.name && !s.noEnd) ? (narrow ? 104 : 150) : 76, b: 22, l: 46 };
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
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="rm-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${fmtY(v)}</text>`).join("")}
        ${ref ? `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(ref.v)}" y2="${y(ref.v)}" class="rm-ref"/>${ref.label ? `<text x="${pad.l + 4}" y="${y(ref.v) - 5}" class="em-tick">${esc(ref.label)}</text>` : ""}` : ""}
        ${area ? series.map((s) => `<path d="${path(s.pts)}L${x(s.pts.at(-1)[0])},${y(yMin)}L${x(s.pts[0][0])},${y(yMin)}Z" fill="var(${s.v})" opacity=".12"/>`).join("") : ""}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="var(${s.v})" stroke-width="2.4" stroke-linejoin="round"/>`).join("")}
        ${dots ? series.map((s) => s.pts.map(([a, b]) => `<circle cx="${x(a)}" cy="${y(b)}" r="2.4" fill="var(${s.v})"/>`).join("")).join("") : ""}
        ${ends.map((e) => `<circle cx="${x(e.last[0])}" cy="${y(e.last[1])}" r="3" fill="var(${e.v})"/><text x="${x(e.last[0]) + 8}" y="${e.ly + 4}" class="em-endlabel"><tspan fill="var(${e.v})">■</tspan> ${e.name ? `${esc(narrow ? e.short ?? e.name : e.name)} ` : ""}${esc(e.endText ?? fmtY(e.last[1]))}</text>`).join("")}
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${esc(xStart ?? xFmt(x0))}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${esc(xFmt(v))}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd ?? xFmt(x1))}</text></svg>`;
    }
    const every = (a, b, s) => { const o = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) o.push(v); return o; };
    const drawFlows = (el, h) => lineChart(el, {
      series: [
        { name: "LMICs", short: "LMICs", v: "--em-accent", pts: W.filter((r) => r.received_lmic_bn != null).map((r) => [r.year, r.received_lmic_bn]), endText: bn(wNow.received_lmic_bn, 0) },
        { name: "World", short: "World", v: "--rm-muted", pts: W.filter((r) => r.received_world_bn != null).map((r) => [r.year, r.received_world_bn]), endText: bn(wNow.received_world_bn, 0) },
      ],
      yMax: 1000, yStep: 250, fmtY: (v) => `$${v}bn`, xTicks: every(2005, 2025, 5), h,
      aria: `Personal remittances received: low- and middle-income countries ${bn(w2000.received_lmic_bn)} in 2000 and ${bn(wNow.received_lmic_bn)} in ${Y}; world ${bn(w2000.received_world_bn)} in 2000 and ${bn(wNow.received_world_bn)} in ${Y}`,
    });
    const drawCost = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: WC.map((r) => [r.year, r.cost_global]), endText: pct(wNow.cost_global) }],
      yMax: 10, yStep: 2, fmtY: (v) => `${v}%`, ref: { v: 3, label: "3% target for 2030" }, xTicks: every(2013, 2025, 3), h, area: true, dots: true,
      aria: `Global average cost of sending $200: ${pct(wc0.cost_global)} in ${wc0.year}, ${pct(w2015.cost_global)} in 2015 and ${pct(wNow.cost_global)} in ${Y}, against a target of 3%`,
    });
    const qx = (r) => r.year + (r.quarter - 1) / 4;
    const drawTypes = (el, h) => lineChart(el, {
      series: [
        { name: "Banks", short: "Banks", v: "--rm-alt2", pts: QT.filter((r) => r.banks != null).map((r) => [qx(r), r.banks]), endText: pct(qNow.banks) },
        { name: "All", short: "All", v: "--rm-muted", pts: QT.map((r) => [qx(r), r.global]), endText: pct(qNow.global) },
        { name: "MTOs", short: "MTOs", v: "--em-accent", pts: QT.filter((r) => r.mtos != null).map((r) => [qx(r), r.mtos]), endText: pct(qNow.mtos) },
      ],
      yMax: 16, yStep: 4, fmtY: (v) => `${v}%`, ref: { v: 3, label: "3%" }, xTicks: every(2017, 2025, 2), xStart: q0.period, xEnd: qNow.period, h,
      aria: `Average cost of sending $200: banks ${pct(q0.banks)} in ${q0.period} and ${pct(qNow.banks)} in ${qNow.period}; money transfer operators ${pct(q0.mtos)} and ${pct(qNow.mtos)}; all services ${pct(q0.global)} and ${pct(qNow.global)}`,
    });
    const drawUk = (el, h) => lineChart(el, {
      series: [
        { name: "UK", short: "UK", v: "--em-accent", pts: UKC.map((r) => [r.year, r.uk_send]), endText: pct(ukNow.uk_send) },
        { name: "Global", short: "Global", v: "--rm-muted", pts: UKC.filter((r) => r.global != null).map((r) => [r.year, r.global]), endText: pct(ukNow.global) },
      ],
      yMax: 10, yStep: 2, fmtY: (v) => `${v}%`, ref: { v: 3, label: "3% target" }, xTicks: every(2013, 2025, 3), h, dots: true,
      aria: `Average cost of sending $200 from the UK: ${pct(uk0.uk_send)} in ${uk0.year} and ${pct(ukNow.uk_send)} in ${ukNow.year}; global average ${pct(ukNow.global)} in ${ukNow.year}`,
    });
    const drawUkPaid = (el, h) => lineChart(el, {
      series: [{ v: "--em-accent", pts: UKF.map((r) => [r.year, r.paid_usd_m / 1000]), endText: bn(ukfNow.paid_usd_m / 1000) }],
      yMax: 15, yStep: 5, fmtY: (v) => `$${v}bn`, xTicks: every(2005, 2025, 5), h, area: true,
      aria: `Personal remittances paid from the UK: ${usd(UKF[0].paid_usd_m)} in ${UKF[0].year} and ${usd(ukfNow.paid_usd_m)} in ${ukfNow.year}`,
    });
    const drawAll = () => {
      drawFlows(main.querySelector("#rm-flowtrend"), 240);
      drawCost(main.querySelector("#rm-costtrend"), 240);
      drawTypes(main.querySelector("#rm-types"), 260);
      drawUk(main.querySelector("#rm-uktrend"), 240);
      drawUkPaid(main.querySelector("#rm-ukpaid"), 200);
    };
    drawAll();

    // ---------- Bars ----------
    const gdpBars = (el, n = 10) => bars(el, byGdp.slice(0, n).map((r, i) => ({ label: r.country, value: r.received_gdp_pct, muted: i > 0, src: r.flows_source })), (v) => `${nf(v, 1)}%`, byGdp[0].received_gdp_pct, t);
    gdpBars(main.querySelector("#rm-topgdp"));
    bars(main.querySelector("#rm-topusd"), byUsd.slice(0, 10).map((r, i) => ({ label: r.country, value: r.received_usd_m / 1000, muted: i > 0, src: r.flows_source })), (v) => `$${nf(v, 1)}bn`, byUsd[0].received_usd_m / 1000, t);
    bars(main.querySelector("#rm-regions"), regNow.map((r, i) => ({ label: SHORT[r.region] ?? r.region, value: r.cost, muted: i > 0, src: r.source })), (v) => pct(v), regNow[0].cost, t);
    const costIn = byCostIn.slice(0, 10);
    bars(main.querySelector("#rm-costin"), costIn.map((r, i) => ({ label: r.country, value: r.cost_receive, muted: i > 0, src: r.cost_source })), (v) => pct(v), costIn[0].cost_receive, t);
    const payRows = brOf("Paying for the transfer").concat(brOf("Where the sender pays")).sort((a, b) => b.cost - a.cost);
    bars(main.querySelector("#rm-pay"), payRows.map((r, i) => ({ label: `${r.dimension === "Where the sender pays" ? "At or by: " : ""}${r.category}`, value: r.cost, muted: i > 0, src: r.source })), (v) => pct(v), payRows[0].cost, t);
    const dear = coOk.slice().sort((a, b) => b.cost - a.cost).slice(0, 10);
    const dearBars = (el, n = 10) => bars(el, dear.slice(0, n).map((r, i) => ({ label: `${r.from} → ${r.to}`, value: r.cost, muted: i > 0, src: r.cost_source })), (v) => pct(v, 1), dear[0].cost, t);
    dearBars(main.querySelector("#rm-dear"));
    const cheap = CO.slice().sort((a, b) => a.cost - b.cost).slice(0, 10);
    bars(main.querySelector("#rm-cheap"), cheap.map((r, i) => ({ label: `${r.from} → ${r.to}`, value: r.cost, muted: i > 0, src: r.cost_source })), (v) => pct(v), Math.max(...cheap.map((r) => r.cost)), t);

    // Stacked fee + margin bars with 3% and 5% marks
    function stack(el, rows, { label, max }) {
      const w = (v) => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;
      el.innerHTML = rows.map((r) => {
        const fee = r.fee ?? null, fx = r.fx_margin ?? null, split = fee != null && fx != null && fee >= 0 && fx >= 0;
        const fill = split
          ? `<b style="width:${w(fee * (r.cost / (fee + fx || 1)))};background:var(--em-accent)"></b><b style="width:${w(fx * (r.cost / (fee + fx || 1)))};background:var(--rm-alt)"></b>`
          : `<b style="width:${w(r.cost)};background:var(--em-accent)"></b>`;
        const marks = [3, 5].filter((m) => m < max).map((m) => `<s style="left:${w(m)}"></s>`).join("");
        const aria = `${label(r)}: ${pct(r.cost)}${split ? `, fee ${pct(fee)}, exchange-rate margin ${pct(fx)}` : ""}`;
        return `<div class="row"><span class="lb" title="${esc(label(r))}">${esc(label(r))}</span><div class="bar" role="img" aria-label="${esc(aria)}">${fill}${marks}</div><span class="v" ${t(r.cost_source ?? r.source)}>${r.cost > max ? "&gt;" : ""}${pct(r.cost, r.cost >= 10 ? 1 : 2)}</span></div>`;
      }).join("");
    }
    stack(main.querySelector("#rm-split"), ["Banks", "Money transfer operators"].map((c) => BR.find((b) => b.dimension === "Provider type" && b.category === c)).concat([{ category: "All services", cost: qNow.global, fee: qNow.fee, fx_margin: qNow.fx_margin, source: "rpw" }]), { label: (r) => r.category, max: Math.ceil(bankFee.cost / 2) * 2 });
    stack(main.querySelector("#rm-ukbars"), ukCor, { label: (r) => r.to, max: Math.ceil(ukCor.at(-1).cost / 2) * 2 });
    const corH = main.querySelector("#rm-corh"), corNote = main.querySelector("#rm-cornote"), corBars = main.querySelector("#rm-corbars"), sel = main.querySelector("#rm-sender");
    function drawCorridors() {
      const k = sel.value, rows = CO.filter((r) => r.from_iso3 === k).sort((a, b) => a.cost - b.cost), from = rows[0].from;
      const ok = rows.filter((r) => r.cost < OUTLIER), avgS = BY[k]?.cost_send;
      corH.textContent = rows.length === 1 ? `${the(from)} to ${rows[0].to}: ${pct(rows[0].cost)}` : `From ${the(from)}, ${rows[0].to} is cheapest at ${pct(rows[0].cost)}, ${rows.at(-1).to} dearest at ${pct(rows.at(-1).cost, rows.at(-1).cost >= 10 ? 1 : 2)}`;
      corNote.innerHTML = `${rows.length} corridor${rows.length === 1 ? "" : "s"} tracked${avgS != null ? `; the average cost of sending from ${esc(the(from))} was <b ${t(BY[k].cost_source)}>${pct(avgS)}</b>` : ""}. ${rows.filter((r) => r.cost <= 5).length} at 5% or less, ${rows.filter((r) => r.cost < 3).length} below 3%.${rows.length > ok.length ? " A corridor recorded at more than the amount sent is shown cut off." : ""}`;
      stack(corBars, rows, { label: (r) => r.to, max: Math.max(6, Math.ceil(Math.min(30, ok.at(-1)?.cost ?? 10) / 2) * 2) });
      src.footnotes(corBars.closest(".em-card"));
    }
    sel.addEventListener("change", drawCorridors);
    drawCorridors();

    // ---------- Table ----------
    const tbody = main.querySelector("#rm-tbody"), search = main.querySelector("#rm-search");
    let key = "received_usd_m", dir = -1;
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
        <td><button type="button" class="rm-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        ${cell(r.received_usd_m, r.flows_source, false)}
        <td class="r" ${r.received_gdp_pct != null ? t(r.flows_source) : ""}>${r.gdp_band ? `<i class="rm-sw" style="background:var(${SEQ[bandIdx("gdp", r.gdp_band)]})"></i>${nf(r.received_gdp_pct, 1)}` : "–"}</td>
        ${cell(r.paid_usd_m, r.flows_source, true)}
        ${cell(r.cost_receive, r.cost_source, true, 2)}
        ${cell(r.cost_send, r.cost_source, true, 2)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".rm-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#rm-vis");
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
    const legend = (mode) => `<div class="rm-scale">${BANDS[mode].map((b, i) => `<span>${dot(SEQ[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "gdp") {
        vis.innerHTML = `<p class="vt">Remittances received, % of GDP</p><div class="m"></div>${legend("gdp")}`;
        miniMap(vis.querySelector(".m"), "gdp");
      } else if (id === "flows") {
        vis.innerHTML = `<p class="vt">Remittances received, US$ billion</p><div class="m"></div>`;
        drawFlows(vis.querySelector(".m"), 240);
      } else if (id === "cost") {
        vis.innerHTML = `<p class="vt">Global average cost of sending $200</p><div class="m"></div>`;
        drawCost(vis.querySelector(".m"), 240);
      } else if (id === "banks") {
        vis.innerHTML = `<p class="vt">Average cost of sending $200, by provider</p><div class="m"></div>`;
        drawTypes(vis.querySelector(".m"), 240);
      } else if (id === "routes") {
        vis.innerHTML = `<p class="vt">Costliest corridors, Q3 ${Y}</p><div class="em-bars" id="rm-vbars"></div>`;
        dearBars(vis.querySelector("#rm-vbars"), 8);
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">Average cost of sending $200 from the UK</p><div class="m"></div>`;
        drawUk(vis.querySelector(".m"), 240);
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
