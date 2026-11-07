// Medicine Shortages & Supply dashboard for Ledger Monitor.
// Built on the shared Ledger Monitor shell, source drawer, bars, map library and world shapes.
import { s as shell, S as Sources, e as esc, b as bars, d as maplibregl, w as world } from "../../assets/charts.js";
import { n as geoNE, i as geoPath, c as create, g as graticule } from "../../assets/d3-CYFjbSD-.js";
import { s as scrolly } from "../../assets/story-Cpe0Yf6I.js";
import { DATA, SOURCES } from "./data.js";

const SEQ = ["--md-b0", "--md-b1", "--md-b2", "--md-b3", "--md-b4"];
const DIV = ["--md-n0", "--md-n1", "--md-n2", "--md-n3", "--md-n4"];
const MAPS = {
  exports: { key: "exports_band", pal: SEQ, label: "World map of countries coloured by the value of their pharmaceutical exports" },
  net: { key: "net_band", pal: DIV, label: "World map of countries coloured by pharmaceutical exports minus imports" },
  abx: { key: "abx_band", pal: SEQ, label: "World map of countries coloured by the value of their antibiotic ingredient exports" },
};
const BANDS = Object.fromEntries(Object.keys(MAPS).map((m) => [m, DATA.bands.filter((b) => b.map === m)]));
const bandIdx = (map, name) => BANDS[map].findIndex((b) => b.band === name);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (ym, long = false) => { const [y, m] = ym.split("-").map(Number); return `${(long ? MONTH : MON)[m - 1]} ${y}`; };
const dayName = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${dd} ${MONTH[m - 1]} ${y}`; };
const xOf = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 1) / 12; };
const pct = (v, d = 1) => (v == null ? "n/a" : `${v.toFixed(d)}%`);
const nf = (v) => v.toLocaleString("en-GB");
const usd = (bn) => (bn == null ? "n/a" : Math.abs(bn) >= 1 ? `$${Math.abs(bn).toFixed(1)}bn` : `$${Math.round(Math.abs(bn) * 1000)}m`);
const usdm = (m) => (m == null ? "n/a" : m >= 1000 ? `$${(m / 1000).toFixed(1)}bn` : m >= 1 ? `$${Math.round(m)}m` : `$${Math.round(m * 1000)}k`);
const yrs = (v) => `${v.toFixed(1)} years`;
const cssColor = (el, v) => {
  const s = document.createElement("span");
  s.style.color = `var(${v})`;
  s.style.display = "none";
  el.append(s);
  const c = getComputedStyle(s).color;
  s.remove();
  return c || "#888";
};
// Generic names in the FDA database are long ("Fentanyl Citrate Injection"); show them in sentence case.
const drug = (n) => n.charAt(0) + n.slice(1).toLowerCase();

export default {
  id: "medicines",
  title: "Medicine Shortages & Supply",
  description:
    "How many medicines are in short supply and for how long, why they run short, where the world's medicines and their ingredients are made, and what shortages look like in the UK, from the FDA, EMA, UN Comtrade and NHS sources, with every number linked to its source.",
  mount(root) {
    const C = DATA.countries, BY = Object.fromEntries(C.map((r) => [r.iso3, r])), TY = DATA.trade_year;
    const S = DATA.shortages, n = S.length, inj = S.filter((s) => s.injectable).length;
    const byLen = [...S].sort((a, b) => b.years - a.years);
    const med = [...S].map((s) => s.years).sort((a, b) => a - b)[n >> 1];
    const over5 = S.filter((s) => s.years >= 5).length, over10 = S.filter((s) => s.years >= 10).length;
    const oldest = byLen[0];
    const UY = DATA.us_years, uy = UY.at(-1), uyPeak = UY.reduce((a, b) => (b.new_shortages > a.new_shortages ? b : a));
    const uyOngoingPeak = UY.filter((r) => r.ongoing_end_year != null).reduce((a, b) => (b.ongoing_end_year > a.ongoing_end_year ? b : a));
    const uyLow = UY.filter((r) => r.ongoing_end_year != null).reduce((a, b) => (b.ongoing_end_year < a.ongoing_end_year ? b : a));
    const f = Object.fromEntries(DATA.facts.map((x) => [x.id, x]));
    const exp = C.filter((r) => r.exports_bn != null).sort((a, b) => b.exports_bn - a.exports_bn);
    const top5 = exp.slice(0, 5), top5share = top5.reduce((s, r) => s + r.exports_share_pct, 0);
    const abx = C.filter((r) => r.abx_exports_m != null).sort((a, b) => b.abx_exports_m - a.abx_exports_m);
    const chn = BY.CHN, ind = BY.IND, gbr = BY.GBR, usa = BY.USA;
    const API = DATA.api_sites;
    const apiOf = (r) => API.find((x) => x.region === r);
    const R = DATA.reasons.filter((r) => r.reason !== "Not stated");
    const noReason = DATA.reasons.find((r) => r.reason === "Not stated");
    const demand = DATA.reasons.find((r) => r.reason === "Demand increase for the drug");
    const CAT = DATA.categories;
    const EUC = DATA.eu_critical, euInf = EUC[0];
    const EUS = DATA.eu_shortages.filter((r) => r.status === "Shortage ongoing");
    const UKC = DATA.uk_concessions, ukc = UKC.at(-1);
    const ukPeak = UKC.reduce((a, b) => (b.concessions >= a.concessions ? b : a));
    const ukYearAgo = UKC.find((r) => r.month === `${+ukPeak.month.slice(0, 4) - 1}${ukPeak.month.slice(4)}`);
    const ukPre = UKC.filter((r) => r.month < "2026-01" && r.month >= "2016-01").reduce((a, b) => (b.concessions > a.concessions ? b : a));
    const ukAvg = (y) => { const a = UKC.filter((r) => r.month.startsWith(String(y))); return a.length ? Math.round(a.reduce((s, r) => s + r.concessions, 0) / a.length) : null; };
    const SSP = DATA.uk_ssp;
    // Examples for the EMA card, named only when they are in the ongoing list.
    const has = (re) => EUS.filter((r) => re.test(r.medicine)).length;
    const euEx = [has(/insulin/i) > 1 && `${has(/insulin/i)} insulin products`, has(/ADHD/) && "ADHD medicines", has(/immunoglobulin/i) && "human immunoglobulins", has(/quetiapine|risperidone|paliperidone|olanzapine/i) > 1 && "several antipsychotics"].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " and $1") || "medicines for several conditions";
    const BINS = [["Under a year", 0, 1], ["1 to 2 years", 1, 2], ["2 to 5 years", 2, 5], ["5 to 10 years", 5, 10], ["10 years or more", 10, Infinity]];
    const bins = BINS.map(([label, a, b]) => ({ label, value: S.filter((s) => s.years >= a && s.years < b).length }));

    let map = null;
    const { main, initialView } = shell(root, {
      variantId: "medicines",
      name: "Medicines",
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
        <p class="em-eyebrow"><span class="num">00</span>Medicines · FDA data to ${dayName(DATA.fda_date)}, England to ${monthName(ukc.month)}</p>
        <h1><b>${n} medicines</b> are in short supply in the US, and <span class="accent">the typical shortage has lasted ${med.toFixed(1)} years</span></h1>
        <p class="em-lede">${inj} of them are injections. New US shortages have fallen from <b ${t(uyPeak.new_source)}>${uyPeak.new_shortages}</b> in ${uyPeak.year} to <b ${t(uy.new_source)}>${uy.new_shortages}</b> in ${uy.year}, but old ones are slow to clear. In England, pharmacies could not buy <b ${t(ukPeak.source)}>${ukPeak.concessions}</b> generic medicine lines at the NHS price in ${monthName(ukPeak.month, true)}, the most in any month since at least ${UKC[0].month.slice(0, 4)}.</p>
      </header>

      <div class="em-view" data-view="dashboard">
      <section class="em-sec" id="glance">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">01</span>At a glance</p><h2>Fewer new shortages, <span class="accent">but the old ones linger</span></h2></div></div>
        <div class="em-kpis">
          ${kpi("Current US shortages", String(n), `Medicines listed as short in the FDA database on ${dayName(DATA.fda_date)}. ${inj} are injections. A further <span ${t("openfda")}>${DATA.discontinuing}</span> are being discontinued`, "openfda", true)}
          ${kpi("Typical length", yrs(med), `Median time since the shortage was first posted. ${over5} have lasted five years or more, ${over10} over ten`, "openfda")}
          ${kpi("New US shortages", `${uy.new_shortages} in ${uy.year}`, `Down from <span ${t(uyPeak.new_source)}>${uyPeak.new_shortages}</span> in ${uyPeak.year}. FDA says it helped prevent <span ${t(uy.prevented_source)}>${uy.prevented}</span> in ${uy.year}`, uy.new_source)}
          ${kpi("England price concessions", `${ukc.concessions} in ${MON[+ukc.month.slice(5) - 1]}`, `Medicine lines pharmacies could not buy at the NHS price. A record <span ${t(ukPeak.source)}>${ukPeak.concessions}</span> in ${monthName(ukPeak.month)}, against <span ${t(ukYearAgo.source)}>${ukYearAgo.concessions}</span> a year earlier`, ukc.source)}
        </div>
      </section>

      <section class="em-sec" id="map">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">02</span>Where medicines are made</p><h2>Five countries ship <span class="accent">${pct(top5share, 0)}</span> of the medicines countries export</h2></div></div>
        <p class="em-lede md-lede2">${top5.map((r) => esc(r.country)).join(", ").replace(/, ([^,]*)$/, " and $1")} lead the trade in finished medicines. Some ingredients are more concentrated still: China alone exports <b ${t(chn.trade_source)}>${pct(chn.abx_share_pct, 0)}</b> of the antibiotic ingredients that countries report exporting.</p>
        <div class="em-maprow">
          <div class="em-card em-mapcard">
            <div class="em-maptools">
              <div class="em-toggle" role="group" aria-label="Colour by">
                <button type="button" class="md-mode" data-mode="exports" aria-pressed="true">Exports</button>
                <button type="button" class="md-mode" data-mode="net" aria-pressed="false">Net trade</button>
                <button type="button" class="md-mode" data-mode="abx" aria-pressed="false">Antibiotics</button>
              </div>
              <div class="em-toggle" role="group" aria-label="Projection">
                <button type="button" class="em-proj" data-proj="mercator" aria-pressed="true">Flat</button>
                <button type="button" class="em-proj" data-proj="globe" aria-pressed="false">Globe</button>
              </div>
            </div>
            <div class="em-map" id="md-map" role="region" aria-label="${MAPS.exports.label}"></div>
            <div class="md-scale" id="md-scale"></div>
          </div>
          <div class="em-card em-detail soft" id="md-detail" aria-live="polite"></div>
        </div>
      </section>

      <section class="em-sec md-wide" id="shortages">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">03</span>How many, and for how long</p><h2>${over5} of today's US shortages <span class="accent">began five or more years ago</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">US drug shortages per year · ${UY[0].year} to ${uy.year}</p>
            <h3>New shortages fell to ${uy.new_shortages}, but ${uy.ongoing_end_year} were still ongoing at the end of ${uy.year}</h3>
            <p class="note">Columns are shortages that began each year; the line is shortages still unresolved on 31 December. The backlog fell to <b ${t(uyLow.ongoing_source)}>${uyLow.ongoing_end_year}</b> in ${uyLow.year} and has since reached <b ${t(uyOngoingPeak.ongoing_source)}>${uyOngoingPeak.ongoing_end_year}</b> (${uyOngoingPeak.year}). Before 2016 the counts cover medicines only; from 2016 they include vaccines and blood products.</p>
            <div class="md-key"><span>${dot("--em-accent")}New shortages</span><span>${dot("--md-alt")}Ongoing at year end</span></div>
            <div id="md-years"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Current US shortages by time since first posted</p>
            <h3>The median shortage has lasted ${yrs(med)}</h3>
            <p class="note">Counted from the date each shortage first appeared in the FDA database, to ${dayName(DATA.fda_date)}.</p>
            <div class="em-bars" id="md-bins"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">The longest-running US shortages</p>
            <h3>${esc(drug(oldest.name))} has been short since ${oldest.started.slice(0, 4)}</h3>
            <p class="note">Years since first posted. ${byLen.slice(0, 8).filter((s) => s.injectable).length} of these eight are injections.</p>
            <div class="em-bars" id="md-long"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Current US shortages by FDA therapeutic category</p>
            <h3>${esc(CAT[0].category)} medicines are the most affected, with ${CAT[0].shortages} shortages</h3>
            <p class="note">A medicine can fall in more than one category, so the bars add up to more than ${n}.</p>
            <div class="em-bars" id="md-cats"></div>
            <div class="em-cites"></div>
          </div>
        </div>
      </section>

      <section class="em-sec" id="causes">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">04</span>Why medicines run short</p><h2>Demand jumps, factories stop, <span class="accent">and ingredients come from few places</span></h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Reasons manufacturers gave for current US shortages</p>
            <h3>${demand.shortages} of ${n} shortages cite a rise in demand</h3>
            <p class="note">Each maker of a medicine reports its own reason, so one shortage can have several. ${noReason ? `${noReason.shortages} give none.` : ""} "Other" is the most common answer.</p>
            <div class="em-bars" id="md-reasons"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Where active ingredients are made for US medicines · share of sites</p>
            <h3>India now has ${pct(apiOf("India").api_share_2025)} of ingredient sites, ahead of the US</h3>
            <p class="note">Active-ingredient (API) manufacturing locations for products whose applicant is in the US, 2020 against 2025. China's share rose from ${pct(apiOf("China").api_share_2020)} to ${pct(apiOf("China").api_share_2025)}.</p>
            <div class="md-key"><span>${dot("--md-muted")}2020</span><span>${dot("--em-accent")}2025</span></div>
            <div class="md-pairs" id="md-api"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Antibiotic ingredient exports (HS 2941) · share of world, ${TY}</p>
            <h3>China exports ${pct(chn.abx_share_pct, 0)} of antibiotic ingredients, India ${pct(ind.abx_share_pct, 0)}</h3>
            <p class="note">Bulk antibiotics that factories turn into tablets, capsules and injections. Shares are of the ${usdm(abx.reduce((s, r) => s + r.abx_exports_m, 0))} total reported by all countries.</p>
            <div class="em-bars" id="md-abx"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("Early warnings · " + uy.year, f.notices, nf(f.notices.value), `times manufacturers warned FDA of a possible shortage in ${uy.year}, from 167 companies. FDA counts ${uy.prevented} shortages it helped prevent that year.`, true)}
          ${factCard("FDA inspections · FY2025", f.inspections, nf(f.inspections.value), `drug quality inspections, 702 in the US and 546 abroad. Factory quality problems are one cause of shortages. FDA lists <b ${t(f.sites.source)}>${nf(f.sites.value)}</b> sites making medicines for the US, ${f.sitesus.value}% of them in the US.`)}
        </div>
      </section>

      <section class="em-sec" id="europe">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">05</span>Europe</p><h2>The EU lists <span class="accent">${f.eucritical.value} medicines</span> it cannot afford to run out of</h2></div></div>
        <div class="em-grid">
          <div class="em-card">
            <p class="em-eyebrow">Union list of critical medicines · active substances by body system</p>
            <h3>${esc(euInf.group)} make up ${euInf.substances} of the ${f.eucritical.value}</h3>
            <p class="note">Medicines for which a shortage would cause serious harm and alternatives are few. The EU uses the list to watch supply chains and plan stockpiles.</p>
            <div class="em-bars" id="md-eu"></div>
            <div class="em-cites"></div>
          </div>
          ${factCard("EMA · " + dayName(DATA.fda_date), f.euongoing, `${f.euongoing.value}`, `shortages still ongoing in the catalogue of the European Medicines Agency, which follows shortages that affect several countries or centrally authorised medicines. They include ${euEx}.`, true)}
        </div>
      </section>

      <section class="em-sec" id="uk">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">06</span>Close to home</p><h2>Pharmacies in England could not buy <span class="accent">${ukPeak.concessions} medicine lines</span> at the NHS price in ${monthName(ukPeak.month, true)}</h2></div></div>
        <div class="em-grid">
          <div class="em-card" style="grid-column:1/-1">
            <p class="em-eyebrow">Price concessions granted in England · generic medicines and pack sizes per month, ${monthName(UKC[0].month)} to ${monthName(ukc.month)}</p>
            <h3>From about ${ukAvg(2015)} a month in 2015 to ${ukc.concessions} in ${monthName(ukc.month, true)}</h3>
            <p class="note">When community pharmacies cannot buy a medicine at or below its NHS Drug Tariff price, the Department of Health and Social Care can grant a higher price for that month. Each line is one medicine in one pack size. It is not a count of shortages, but it shows how many medicines could not be had at the usual price. Before this year the high was <b ${t(ukPre.source)}>${ukPre.concessions}</b> in ${monthName(ukPre.month, true)}.</p>
            <div id="md-ukpc"></div>
            <div class="em-cites"></div>
          </div>
          <div class="em-card">
            <p class="em-eyebrow">Serious Shortage Protocols in force · ${dayName(DATA.fda_date)}</p>
            <h3>${SSP.length} protocols let pharmacists swap a scarce medicine</h3>
            <p class="note">A protocol lets a pharmacist supply a different strength, form or quantity without going back to the prescriber. Protocols were introduced in 2019; their reference numbers now run to <span ${t(f.sspmax.source)}>SSP${String(f.sspmax.value).padStart(3, "0")}</span>.</p>
            <ul class="md-ssp">${SSP.map((s) => `<li><b ${t(s.source)}>${esc(s.medicine)}</b><span>${esc(s.ref)} · to ${esc(dayName(s.end))}</span></li>`).join("")}</ul>
            <div class="em-cites"></div>
          </div>
          ${factCard("UK medicine trade · " + TY, { source: gbr.trade_source }, usd(gbr.exports_bn), `of medicines exported by the UK, against <b ${t(gbr.trade_source)}>${usd(gbr.imports_bn)}</b> imported. That makes it the ${ordinal(exp.indexOf(gbr) + 1)} largest exporter, with ${pct(gbr.exports_share_pct)} of the world total.`)}
          ${factCard("The US · " + TY, { source: usa.trade_source }, usd(usa.imports_bn), `of medicines imported by the US, the most of any country and ${pct(usa.imports_share_pct, 0)} of all imports reported. It exported <b ${t(usa.trade_source)}>${usd(usa.exports_bn)}</b>.`)}
        </div>
      </section>

      <section class="em-sec" id="table">
        <div class="em-sec-h"><div><p class="em-eyebrow"><span class="num">07</span>Every country</p><h2>The full table</h2></div></div>
        <div class="em-card">
          <p class="note md-lede2">Pharmaceutical trade in ${TY}, US$. Select a country to see it on the map.</p>
          <input class="md-search" id="md-search" type="search" placeholder="Search countries" aria-label="Search countries">
          <div class="em-tablewrap md-tablebox">
            <table class="em-table">
              <thead><tr>
                <th data-key="country" aria-sort="none"><button type="button">Country</button></th>
                <th class="r" data-key="exports_bn" aria-sort="descending"><button type="button">Exports, $bn</button></th>
                <th class="r" data-key="imports_bn" aria-sort="none"><button type="button">Imports, $bn</button></th>
                <th class="r hide-n" data-key="net_bn" aria-sort="none"><button type="button">Net, $bn</button></th>
                <th class="r hide-n" data-key="exports_share_pct" aria-sort="none"><button type="button">Share of exports</button></th>
                <th class="r hide-n" data-key="abx_exports_m" aria-sort="none"><button type="button">Antibiotics, $m</button></th>
              </tr></thead>
              <tbody id="md-tbody"></tbody>
            </table>
          </div>
          <div class="em-cites"></div>
        </div>
      </section>

      <section class="em-method" id="method">
        <p class="em-eyebrow"><span class="num">08</span>Method</p>
        <p><b>US shortages</b> come from the FDA Drug Shortages Database through openFDA, downloaded on ${dayName(DATA.fda_date)}. FDA lists each affected product presentation separately; we group them by generic name and count a shortage as current when any presentation is listed as current. Its start is the earliest date any presentation was first posted, and its length runs from then to the download date. Reasons and therapeutic categories are those listed by FDA, which come from each manufacturer. The database covers medicines tracked by FDA's Center for Drug Evaluation and Research; FDA's own year-end count of <b ${t(f.ongoing2025.source)}>${f.ongoing2025.value}</b> also includes ${f.ongoing2025.value - f.ongoingcder.value} vaccine, blood and other biological product shortages. <b>Shortages per year</b> are quoted from FDA's annual reports to Congress for 2017 to 2025; counts before 2016 cover CDER only.</p>
        <p><b>Trade</b> is from UN Comtrade: each country's reported exports and imports of HS chapter 30 (pharmaceutical products: finished medicines, vaccines, blood products) and HS 2941 (antibiotics as bulk ingredients) with the world, in current US dollars, for ${TY}, the latest year most countries have reported. Shares are of the sum of all reporting countries. Taiwan and a few territories report as "Other Asia, not elsewhere specified" and are left out. Trade by value overstates countries where multinationals book sales or route goods, such as Switzerland, Ireland, Belgium and Slovenia. <b>Ingredient sites</b> are quoted from FDA's FY2025 Report on the State of Pharmaceutical Quality. <b>Europe</b>: the Union list of critical medicines and EMA's shortages catalogue, both downloaded on ${dayName(DATA.fda_date)}. <b>UK</b>: price concessions are counted from Community Pharmacy England's monthly lists, one per distinct product and pack size, and match the monthly totals CPE publishes; Serious Shortage Protocols are from the NHS Business Services Authority.</p>
        <p class="em-eyebrow" style="margin-top:24px">All sources</p>
        <ol class="em-srclist">${src.list()}</ol>
      </section>
      </div>

      <div class="em-view" data-view="story" hidden>
        <div class="em-story">
          <div class="em-steps">
            ${step("count", "01", "Right now", `<span class="accent">${n} medicines</span> are in short supply in the US`, `${inj} are injections. The typical shortage has lasted ${yrs(med)}, and ${over5} began five or more years ago.`)}
            ${step("years", "02", "The trend", `New shortages fell from <span class="accent">${uyPeak.new_shortages}</span> to ${uy.new_shortages}`, `But <b ${t(uy.ongoing_source)}>${uy.ongoing_end_year}</b> were still unresolved at the end of ${uy.year}, against ${uyLow.ongoing_end_year} at the end of ${uyLow.year}.`)}
            ${step("reasons", "03", "Why", `<span class="accent">${demand.shortages}</span> shortages cite a rise in demand`, `Others follow a factory closing a line, shipping delays or a missing ingredient.`)}
            ${step("map", "04", "Where", `Five countries ship <span class="accent">${pct(top5share, 0)}</span> of medicine exports`, `${top5.slice(0, 3).map((r) => esc(r.country)).join(", ").replace(/, ([^,]*)$/, " and $1")} lead in finished medicines.`)}
            ${step("abx", "05", "Ingredients", `China exports <span class="accent"><b ${t(chn.trade_source)}>${pct(chn.abx_share_pct, 0)}</b></span> of antibiotic ingredients`, `India is next with ${pct(ind.abx_share_pct, 0)}. India also has the largest share of ingredient sites serving US medicines.`)}
            ${step("uk", "06", "The UK", `England granted <span class="accent">${ukPeak.concessions}</span> price concessions in ${monthName(ukPeak.month, true)}`, `A record, against ${ukYearAgo.concessions} a year earlier.`)}
          </div>
          <div class="em-stick"><div class="em-card"><div class="em-vis" id="md-vis"></div></div></div>
        </div>
      </div>`;

    function ordinal(k) { const s = ["th", "st", "nd", "rd"], v = k % 100; return k + (s[(v - 20) % 10] || s[v] || s[0]); }

    // ---------- Map ----------
    const state = { mode: "exports", sel: "IND" };
    const mapEl = main.querySelector("#md-map");
    const isoToRow = Object.fromEntries(C.map((r) => [r.iso_n3, r]));
    const geo = {
      type: "FeatureCollection",
      features: world.features.map((ft) => {
        const r = isoToRow[ft.properties.iso];
        return { ...ft, properties: { ...ft.properties, iso3: r?.iso3 ?? "", nm: r?.country ?? ft.properties.name, exports: r ? bandIdx("exports", r.exports_band) : -1, net: r ? bandIdx("net", r.net_band) : -1, abx: r ? bandIdx("abx", r.abx_band) : -1 } };
      }),
    };
    const colors = () => ({ bg: cssColor(mapEl, "--em-panel"), land: cssColor(mapEl, "--em-land"), fg: cssColor(mapEl, "--em-fg"), b: MAPS[state.mode].pal.map((v) => cssColor(mapEl, v)) });
    const fillExpr = (c) => ["match", ["get", state.mode], 0, c.b[0], 1, c.b[1], 2, c.b[2], 3, c.b[3], 4, c.b[4], c.land];
    const netText = (v) => (v == null ? "n/a" : v >= 0 ? `exports ${usd(v)} more than imports` : `imports ${usd(-v)} more than exports`);
    const valueText = (r, mode) =>
      mode === "exports" ? (r.exports_bn != null ? `medicine exports ${usd(r.exports_bn)}` : "No exports reported")
        : mode === "net" ? (r.net_bn != null ? netText(r.net_bn) : "No figure")
          : r.abx_exports_m != null ? `antibiotic exports ${usdm(r.abx_exports_m)}` : "No antibiotic exports reported";
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
    const scaleEl = main.querySelector("#md-scale");
    const SCALE_TITLE = { exports: `Pharmaceutical exports, ${TY}:`, net: `Exports minus imports, ${TY}:`, abx: `Antibiotic ingredient exports, ${TY}:` };
    const drawScale = () => {
      scaleEl.innerHTML = `<span>${SCALE_TITLE[state.mode]}</span>` + BANDS[state.mode].map((b, i) => `<span ${t(b.source)}>${dot(MAPS[state.mode].pal[i])}${esc(b.band)}</span>`).join("") + `<span>${dot("--em-land")}No data</span>`;
    };

    // ---------- Detail ----------
    const detail = main.querySelector("#md-detail");
    const rankOf = (key, r) => { const a = C.filter((x) => x[key] != null).sort((x, y) => y[key] - x[key]); const i = a.indexOf(r); return i < 0 ? null : `${ordinal(i + 1)} of ${a.length}`; };
    function drawDetail() {
      const r = BY[state.sel];
      const row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
      const s = r.trade_source;
      const head = state.mode === "exports"
        ? { eb: `Medicine exports · ${TY}`, big: usd(r.exports_bn), sub: r.exports_bn != null ? `${pct(r.exports_share_pct)} of world exports, ${rankOf("exports_bn", r)}` : "No exports reported" }
        : state.mode === "net"
          ? { eb: `Exports minus imports · ${TY}`, big: r.net_bn == null ? "n/a" : `${r.net_bn >= 0 ? "+" : "−"}${usd(r.net_bn)}`, sub: r.net_bn == null ? "" : r.net_bn >= 0 ? "sells more medicines abroad than it buys" : "buys more medicines abroad than it sells" }
          : { eb: `Antibiotic ingredient exports · ${TY}`, big: usdm(r.abx_exports_m), sub: r.abx_exports_m != null ? `${pct(r.abx_share_pct)} of world exports, ${rankOf("abx_exports_m", r)}` : "No exports reported" };
      detail.innerHTML = `
        <p class="em-eyebrow">Selected country</p>
        <label class="md-pick"><span class="em-eyebrow">Choose</span><select id="md-select">${options.map((o) => `<option value="${o.iso3}"${o.iso3 === state.sel ? " selected" : ""}>${esc(o.country)}</option>`).join("")}</select></label>
        <p class="em-d-country">${esc(r.country)}</p>
        <p class="em-eyebrow" style="margin-top:8px">${esc(head.eb)}</p>
        <p class="em-d-value" ${t(s)}>${esc(head.big)}</p>
        <p class="em-d-usd">${esc(head.sub)}</p>
        <dl class="em-d-list" style="margin-top:12px">
          ${r.exports_bn != null ? row(`Medicine exports · ${TY}`, `<span ${t(s)}>${usd(r.exports_bn)}</span>`) : ""}
          ${r.imports_bn != null ? row(`Medicine imports · ${TY}`, `<span ${t(s)}>${usd(r.imports_bn)}</span>`) : ""}
          ${r.imports_share_pct != null ? row("Share of world imports", `<span ${t(s)}>${pct(r.imports_share_pct)}</span>`) : ""}
          ${r.exports_2025_bn != null ? row("Exports · 2025", `<span ${t(s)}>${usd(r.exports_2025_bn)}</span>`) : ""}
          ${r.imports_2025_bn != null ? row("Imports · 2025", `<span ${t(s)}>${usd(r.imports_2025_bn)}</span>`) : ""}
          ${r.abx_exports_m != null ? row(`Antibiotic exports · ${TY}`, `<span ${t(s)}>${usdm(r.abx_exports_m)}</span>`) : ""}
          ${r.abx_imports_m != null ? row(`Antibiotic imports · ${TY}`, `<span ${t(s)}>${usdm(r.abx_imports_m)}</span>`) : ""}
        </dl>
        <div class="em-cites"></div>`;
      detail.querySelector("#md-select").addEventListener("change", (e) => select(e.target.value, true));
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
    main.querySelectorAll(".md-mode").forEach((b) => b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      main.querySelectorAll(".md-mode").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
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

    // ---------- Charts ----------
    // Columns for new shortages per year with a line for those still ongoing at year end.
    function yearsChart(el, h = 240) {
      const wd = Math.max(300, el.clientWidth), narrow = wd < 520;
      const pad = { t: 14, r: narrow ? 30 : 40, b: 22, l: 34 };
      const yMax = 260, y = (v) => pad.t + (1 - v / yMax) * (h - pad.t - pad.b);
      const bw = (wd - pad.l - pad.r) / UY.length, x = (i) => pad.l + i * bw;
      const ticks = [0, 50, 100, 150, 200, 250];
      const on = UY.map((r, i) => [r, i]).filter(([r]) => r.ongoing_end_year != null);
      const line = on.map(([r, i], k) => `${k ? "L" : "M"}${(x(i) + bw / 2).toFixed(1)},${y(r.ongoing_end_year).toFixed(1)}`).join("");
      const lastO = on.at(-1);
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(`New US drug shortages per year: ${UY.map((r) => `${r.year} ${r.new_shortages}`).join(", ")}. Ongoing at the end of ${uy.year}: ${uy.ongoing_end_year}.`)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="md-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${v}</text>`).join("")}
        ${UY.map((r, i) => `<rect x="${(x(i) + bw * 0.16).toFixed(1)}" y="${y(r.new_shortages).toFixed(1)}" width="${(bw * 0.68).toFixed(1)}" height="${(y(0) - y(r.new_shortages)).toFixed(1)}" fill="var(--em-accent)" opacity="${i === UY.length - 1 || r === uyPeak ? 1 : 0.55}"><title>${r.year}: ${r.new_shortages} new</title></rect>`).join("")}
        <path d="${line}" fill="none" stroke="var(--md-alt)" stroke-width="2.4" stroke-linejoin="round"/>
        ${on.map(([r, i]) => `<circle cx="${(x(i) + bw / 2).toFixed(1)}" cy="${y(r.ongoing_end_year).toFixed(1)}" r="2.6" fill="var(--md-alt)"><title>${r.year}: ${r.ongoing_end_year} ongoing</title></circle>`).join("")}
        <text x="${(x(UY.indexOf(uyPeak)) + bw / 2).toFixed(1)}" y="${(y(uyPeak.new_shortages) - 5).toFixed(1)}" text-anchor="middle" class="em-endlabel">${uyPeak.new_shortages}</text>
        <text x="${(x(UY.length - 1) + bw / 2).toFixed(1)}" y="${(y(uy.new_shortages) - 5).toFixed(1)}" text-anchor="middle" class="em-endlabel">${uy.new_shortages}</text>
        <text x="${(x(lastO[1]) + bw / 2).toFixed(1)}" y="${(y(lastO[0].ongoing_end_year) - 8).toFixed(1)}" text-anchor="middle" class="em-endlabel">${lastO[0].ongoing_end_year}</text>
        ${UY.map((r, i) => (i % (narrow ? 4 : 2) === 0 || i === UY.length - 1) && !(narrow && i === UY.length - 2) ? `<text x="${(x(i) + bw / 2).toFixed(1)}" y="${h - 6}" text-anchor="middle" class="em-tick">${narrow && i ? `’${String(r.year).slice(2)}` : r.year}</text>` : "").join("")}</svg>`;
    }
    // Monthly line, as in the Debt dashboard.
    function lineChart(el, { pts, yMax, yStep, xTicks, xEnd, aria, h = 240, endText }) {
      const wd = Math.max(300, el.clientWidth);
      const pad = { t: 12, r: 58, b: 22, l: 40 };
      const x0 = pts[0][0], x1 = pts.at(-1)[0];
      const x = (v) => pad.l + ((v - x0) / (x1 - x0)) * (wd - pad.l - pad.r);
      const y = (v) => pad.t + (1 - v / yMax) * (h - pad.t - pad.b);
      const ticks = []; for (let v = 0; v <= yMax + 1e-9; v += yStep) ticks.push(v);
      const path = pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a).toFixed(1)},${y(b).toFixed(1)}`).join("");
      const xt = []; let lastX = x(x0);
      for (const v of xTicks) { const px = x(v); if (px - lastX >= 64 && x(x1) - px >= 96) { xt.push(v); lastX = px; } }
      const e = pts.at(-1);
      el.innerHTML = `<svg width="100%" viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(aria)}">
        ${ticks.map((v) => `<line x1="${pad.l}" x2="${wd - pad.r}" y1="${y(v)}" y2="${y(v)}" class="md-grid"/><text x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end" class="em-tick">${v}</text>`).join("")}
        <path d="${path}L${x(x1)},${y(0)}L${x(x0)},${y(0)}Z" fill="var(--em-accent)" opacity=".12"/>
        <path d="${path}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="${x(e[0])}" cy="${y(e[1])}" r="3" fill="var(--em-accent)"/><text x="${x(e[0]) + 8}" y="${y(e[1]) + 4}" class="em-endlabel">${esc(endText)}</text>
        <text x="${x(x0)}" y="${h - 6}" class="em-tick">${Math.floor(x0)}</text>
        ${xt.map((v) => `<text x="${x(v)}" y="${h - 6}" text-anchor="middle" class="em-tick">${v}</text>`).join("")}
        <text x="${x(x1)}" y="${h - 6}" text-anchor="end" class="em-tick">${esc(xEnd)}</text></svg>`;
    }
    const drawUkpc = (el, h) => lineChart(el, {
      pts: UKC.map((r) => [xOf(r.month), r.concessions]), yMax: 300, yStep: 50, xTicks: [2016, 2018, 2020, 2022, 2024], xEnd: monthName(ukc.month), h, endText: String(ukc.concessions),
      aria: `Price concessions granted in England each month: ${UKC[0].concessions} in ${monthName(UKC[0].month)}, ${ukPeak.concessions} in ${monthName(ukPeak.month)}, ${ukc.concessions} in ${monthName(ukc.month)}`,
    });
    const drawAll = () => {
      yearsChart(main.querySelector("#md-years"), 250);
      drawUkpc(main.querySelector("#md-ukpc"), 230);
    };
    drawAll();

    // ---------- Bars ----------
    const binBars = (el) => bars(el, bins.map((b) => ({ label: b.label, value: b.value, muted: b.value < Math.max(...bins.map((x) => x.value)), src: "openfda" })), (v) => String(v), Math.max(...bins.map((x) => x.value)), t);
    binBars(main.querySelector("#md-bins"));
    bars(main.querySelector("#md-long"), byLen.slice(0, 8).map((s, i) => ({ label: drug(s.name), value: s.years, muted: i > 0, src: s.source })), (v) => v.toFixed(1), byLen[0].years, t);
    bars(main.querySelector("#md-cats"), CAT.slice(0, 12).map((c, i) => ({ label: c.category, value: c.shortages, muted: i > 0, src: c.source })), (v) => String(v), CAT[0].shortages, t);
    const reasonBars = (el) => bars(el, R.map((c, i) => ({ label: c.label, value: c.shortages, muted: c.reason !== demand.reason, src: c.source })), (v) => String(v), Math.max(...R.map((c) => c.shortages)), t);
    reasonBars(main.querySelector("#md-reasons"));
    const abxBars = (el, k = 8) => bars(el, abx.slice(0, k).map((r, i) => ({ label: r.country, value: r.abx_share_pct, muted: i > 0, src: r.trade_source })), (v) => pct(v, 0), abx[0].abx_share_pct, t);
    abxBars(main.querySelector("#md-abx"));
    bars(main.querySelector("#md-eu"), EUC.slice(0, 10).map((g, i) => ({ label: g.group, value: g.substances, muted: i > 0, src: g.source })), (v) => String(v), EUC[0].substances, t);
    const apiEl = main.querySelector("#md-api"), apiMax = Math.max(...API.flatMap((r) => [r.api_share_2020, r.api_share_2025]));
    const pbar = (v, c, s, label) => `<div class="row"><div class="bar" role="img" aria-label="${esc(label)}"><b style="width:${(100 * v) / apiMax}%;background:var(${c})"></b></div><span class="v" ${t(s)}>${pct(v)}</span></div>`;
    apiEl.innerHTML = API.map((r) => `<div class="it"><div class="lb">${esc(r.region)}</div><div class="tr">${pbar(r.api_share_2020, "--md-muted", r.source, `${r.region}: ${pct(r.api_share_2020)} in 2020`)}${pbar(r.api_share_2025, "--em-accent", r.source, `${r.region}: ${pct(r.api_share_2025)} in 2025`)}</div></div>`).join("");

    // ---------- Table ----------
    const tbody = main.querySelector("#md-tbody"), search = main.querySelector("#md-search");
    let key = "exports_bn", dir = -1;
    const cell = (v, s, hide, d = 1) => `<td class="r${hide ? " hide-n" : ""}" ${v != null && s ? t(s) : ""}>${v == null ? "–" : v.toFixed(d)}</td>`;
    function drawTable() {
      const q = search.value.trim().toLowerCase();
      const list = C.filter((r) => !q || r.country.toLowerCase().includes(q)).sort((a, b) => {
        const x = a[key], y = b[key];
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
      tbody.innerHTML = list.map((r) => `<tr>
        <td><button type="button" class="md-rowbtn" data-iso="${r.iso3}">${esc(r.country)}</button></td>
        <td class="r" ${r.exports_bn != null ? t(r.trade_source) : ""}>${r.exports_band ? `<i class="md-sw" style="background:var(${SEQ[bandIdx("exports", r.exports_band)]})"></i>${r.exports_bn.toFixed(2)}` : "–"}</td>
        ${cell(r.imports_bn, r.trade_source, false, 2)}
        ${cell(r.net_bn, r.trade_source, true, 2)}
        <td class="r hide-n" ${r.exports_share_pct != null ? t(r.trade_source) : ""}>${r.exports_share_pct == null ? "–" : pct(r.exports_share_pct, 2)}</td>
        ${cell(r.abx_exports_m, r.trade_source, true, 1)}</tr>`).join("") || `<tr><td colspan="6">No country matches “${esc(search.value)}”.</td></tr>`;
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
      const b = e.target.closest(".md-rowbtn");
      if (!b) return;
      select(b.dataset.iso, true);
      main.querySelector("#map").scrollIntoView({ behavior: "smooth" });
    });
    drawTable();
    src.footnotes(main);

    // ---------- Story ----------
    const vis = main.querySelector("#md-vis");
    function miniMap(el, mode) {
      const wd = Math.max(280, el.clientWidth), h = Math.round(wd * 0.52);
      const proj = geoNE().fitExtent([[4, 4], [wd - 4, h - 4]], world), path = geoPath(proj);
      const svg = create("svg").attr("width", "100%").attr("viewBox", `0 0 ${wd} ${h}`).attr("role", "img").attr("aria-label", MAPS[mode].label);
      svg.append("path").datum(graticule()).attr("d", path).attr("class", "em-graticule");
      svg.append("g").selectAll("path").data(world.features).join("path").attr("d", path)
        .attr("fill", (ft) => { const r = isoToRow[ft.properties.iso], i = r ? bandIdx(mode, r[MAPS[mode].key]) : -1; return i < 0 ? "var(--em-land)" : `var(${MAPS[mode].pal[i]})`; })
        .attr("stroke", "var(--em-panel)").attr("stroke-width", 0.5)
        .append("title").text((ft) => { const r = isoToRow[ft.properties.iso]; return r ? `${r.country}: ${valueText(r, mode)}` : ft.properties.name; });
      el.append(svg.node());
    }
    const legend = (mode) => `<div class="md-scale">${BANDS[mode].map((b, i) => `<span>${dot(MAPS[mode].pal[i])}${esc(b.band)}</span>`).join("")}</div>`;
    const story = scrolly(main.querySelector('[data-view="story"]'), (id) => {
      if (id === "count") {
        vis.innerHTML = `<p class="vt">Current US shortages by time since first posted</p><div class="em-bars" id="md-vbins"></div>`;
        binBars(vis.querySelector("#md-vbins"));
      } else if (id === "years") {
        vis.innerHTML = `<p class="vt">New US shortages per year, and those ongoing at year end</p><div class="md-key"><span>${dot("--em-accent")}New</span><span>${dot("--md-alt")}Ongoing</span></div><div class="m"></div>`;
        yearsChart(vis.querySelector(".m"), 240);
      } else if (id === "reasons") {
        vis.innerHTML = `<p class="vt">Reasons given for current US shortages</p><div class="em-bars" id="md-vreasons"></div>`;
        reasonBars(vis.querySelector("#md-vreasons"));
      } else if (id === "map") {
        vis.innerHTML = `<p class="vt">Pharmaceutical exports, ${TY}</p><div class="m"></div>${legend("exports")}`;
        miniMap(vis.querySelector(".m"), "exports");
      } else if (id === "abx") {
        vis.innerHTML = `<p class="vt">Share of antibiotic ingredient exports, ${TY}</p><div class="em-bars" id="md-vabx"></div>`;
        abxBars(vis.querySelector("#md-vabx"), 6);
      } else if (id === "uk") {
        vis.innerHTML = `<p class="vt">Price concessions granted in England each month</p><div class="m"></div>`;
        drawUkpc(vis.querySelector(".m"), 240);
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
