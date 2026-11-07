// Fills the <!--spark:id-->…<!--/spark--> placeholders in index.html with small
// inline SVG charts built from the published data. Re-run after updating data/:
//   node scripts/hub-sparks.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rec = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", p), "utf8")).records;

const W = 240, H = 56;
const ACC = "var(--c)";
const MUTED = "color-mix(in srgb, var(--fg) 16%, transparent)";
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const r1 = (n) => Math.round(n * 10) / 10;

function linePath(vals, max, min = 0) {
  return vals.map((v, i) => `${i ? "L" : "M"}${r1((i / (vals.length - 1)) * W)},${r1(H - ((v - min) / (max - min)) * H)}`).join("");
}
function line(vals, max, color, extra = "") {
  return `<path d="${linePath(vals, max)}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" ${extra}/>`;
}
function area(vals, max, color) {
  return `<path d="${linePath(vals, max)}L${W},${H}L0,${H}Z" fill="${color}" opacity=".14"/>`;
}
function bars(vals, max, colorOf, gap = 0.25) {
  const bw = W / vals.length;
  return vals.map((v, i) => {
    const h = Math.max(1, (Math.min(v, max) / max) * H);
    return `<rect x="${r1(i * bw)}" y="${r1(H - h)}" width="${r1(Math.max(0.6, bw * (1 - gap)))}" height="${r1(h)}" fill="${colorOf(v, i)}"/>`;
  }).join("");
}
function hline(v, max, color, label = "") {
  const y = r1(H - (v / max) * H);
  return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"><title>${esc(label)}</title></line>`;
}
function fig(svgInner, aria, left, right) {
  return `<figure class="hb-spark"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(aria)}">${svgInner}</svg><figcaption><span>${esc(left)}</span><span>${esc(right)}</span></figcaption></figure>`;
}
const bn = (v) => `$${(v / 1e9).toFixed(1)}bn`;

const SPARKS = {
  internet() {
    const years = rec("internet/cables.json").map((c) => parseInt(c.rfs, 10)).filter((y) => y > 1980 && y < 2100);
    const y0 = Math.min(...years), y1 = Math.max(...years);
    const cum = []; let n = 0;
    for (let y = y0; y <= y1; y++) { n += years.filter((v) => v === y).length; cum.push(n); }
    return fig(area(cum, n, ACC) + line(cum, n, ACC), `Cumulative count of ${n} cable systems by ready-for-service year, ${y0} to ${y1}, from the 2021 snapshot (later years were planned)`, `Cable systems in service, by year ready (2021 snapshot)`, `${y0}–${y1}`);
  },
  housing() {
    const m = rec("housing/markets.json").map((r) => r.median_multiple).sort((a, b) => a - b);
    const max = Math.ceil(m.at(-1));
    return fig(bars(m, max, (v, i) => (i === m.length - 1 ? ACC : MUTED), 0.2) + hline(3, max, "var(--muted)", "Affordable: 3.0 or less"),
      `${m.length} markets from ${m[0]} to ${m.at(-1)} times income; none below the affordable line of 3.0`, `Each bar a market; dashed line: affordable (3.0)`, `${m[0]} to ${m.at(-1)}`);
  },
  scams() {
    const us = rec("scams/trend.json").filter((r) => r.country === "United States").sort((a, b) => a.year - b.year);
    const v = us.map((r) => r.losses_local), max = Math.max(...v);
    return fig(bars(v, max, (_, i) => (i === v.length - 1 ? ACC : MUTED), 0.35),
      `US losses reported to the FBI rose from ${bn(v[0])} in ${us[0].year} to ${bn(v.at(-1))} in ${us.at(-1).year}`, `Losses reported to the FBI, ${us[0].year} to ${us.at(-1).year}`, `${bn(v[0])} → ${bn(v.at(-1))}`);
  },
  water() {
    const s = rec("water/stress.json").map((r) => r.stress_pct).filter((v) => v != null).sort((a, b) => a - b);
    const cap = 200, over = s.filter((v) => v > 100).length;
    return fig(bars(s, cap, (v) => (v > 100 ? ACC : MUTED), 0.15) + hline(100, cap, "var(--muted)", "100%: all renewable freshwater"),
      `${s.length} countries by water stress; ${over} withdraw more than 100% of their renewable freshwater`, `Each bar a country; dashed line: 100%`, `${over} above`);
  },
  electricity() {
    const w = rec("electricity/world.json").sort((a, b) => a.year - b.year);
    const ren = w.map((r) => r.renewables_pct), coal = w.map((r) => r.coal_pct), max = 45;
    return fig(line(coal, max, "var(--muted)", 'stroke-dasharray="4 3"') + line(ren, max, ACC),
      `Renewables rose from ${ren[0]}% to ${ren.at(-1)}% of world electricity between ${w[0].year} and ${w.at(-1).year}; coal went from ${coal[0]}% to ${coal.at(-1)}%`,
      `Renewables, and coal (dashed), share of world power`, `${w[0].year}–${w.at(-1).year}`);
  },
  chokepoints() {
    const h = rec("chokepoints/weekly.json").filter((r) => r.chokepoint === "Strait of Hormuz").sort((a, b) => a.week.localeCompare(b.week));
    const v = h.map((r) => r.transits), max = Math.ceil(Math.max(...v) / 10) * 10;
    const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    return fig(area(v, max, ACC) + line(v, max, ACC),
      `Ships a day through the Strait of Hormuz, weekly average, from ${v[0]} in ${fmt(h[0].week)} to ${v.at(-1)} in ${fmt(h.at(-1).week)}`, `Ships a day through Hormuz, weekly average`, `${fmt(h[0].week)}–${fmt(h.at(-1).week)}`);
  },
  orbit() {
    const y = rec("orbit/yearly.json").sort((a, b) => a.year - b.year);
    const max = Math.max(...y.map((r) => r.world));
    const world = bars(y.map((r) => r.world), max, () => MUTED, 0.1);
    const us = bars(y.map((r) => r.united_states), max, () => ACC, 0.1);
    return fig(world + us, `Objects launched per year from ${y[0].year} to ${y.at(-1).year}, peaking at ${max.toLocaleString("en-GB")}; US share highlighted`, `Objects launched each year, the US in colour`, `${y[0].year}–${y.at(-1).year}`);
  },
  food() {
    const p = rec("food/prices.json").sort((a, b) => a.month.localeCompare(b.month));
    const v = p.map((r) => r.food), max = 175;
    const fmt = (m) => new Date(m + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    return fig(hline(100, max, "var(--muted)", "2014–2016 average: 100") + area(v, max, ACC) + line(v, max, ACC),
      `FAO Food Price Index, monthly, from ${v[0]} in ${fmt(p[0].month)} to ${v.at(-1)} in ${fmt(p.at(-1).month)}, peaking at ${Math.max(...v)}`, `FAO Food Price Index; dashed line: 2014–2016 average`, `${p[0].month.slice(0, 4)}–${p.at(-1).month.slice(0, 4)}`);
  },
  debt() {
    const g = rec("debt/groups.json").filter((r) => r.world_debt != null).sort((a, b) => a.year - b.year);
    const v = g.map((r) => r.world_debt), max = 120, last = g.findLastIndex((r) => !r.projection), n = v.length - 1;
    const seg = (from, to) => v.slice(from, to + 1).map((x, i) => `${i ? "L" : "M"}${r1(((from + i) / n) * W)},${r1(H - (x / max) * H)}`).join("");
    return fig(hline(100, max, "var(--muted)", "100% of GDP")
      + `<path d="${seg(0, last)}L${r1((last / n) * W)},${H}L0,${H}Z" fill="${ACC}" opacity=".14"/>`
      + `<path d="${seg(0, last)}" fill="none" stroke="${ACC}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
      + `<path d="${seg(last, n)}" fill="none" stroke="${ACC}" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`,
      `World government debt, % of GDP, from ${v[0]}% in ${g[0].year} to ${v[last]}% in ${g[last].year}, projected ${v[n]}% in ${g[n].year}`, `World government debt, % of GDP; dashed: IMF projection`, `${g[0].year}–${g[n].year}`);
  },
  heat() {
    const g = rec("heat/global.json").sort((a, b) => a.year - b.year);
    const v = g.map((r) => r.anomaly_preindustrial), min = -0.4, max = 1.8;
    const p = v.map((x, i) => `${i ? "L" : "M"}${r1((i / (v.length - 1)) * W)},${r1(H - ((x - min) / (max - min)) * H)}`).join("");
    const y15 = r1(H - ((1.5 - min) / (max - min)) * H);
    return fig(`<line x1="0" x2="${W}" y1="${y15}" y2="${y15}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"><title>1.5°C above 1850–1900</title></line>`
      + `<path d="${p}" fill="none" stroke="${ACC}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`,
      `Global temperature against 1850–1900, from ${v[0]}°C in ${g[0].year} to ${v.at(-1)}°C in ${g.at(-1).year}, peaking at ${Math.max(...v)}°C`, `Global temperature vs 1850–1900; dashed: 1.5°C`, `${g[0].year}–${g.at(-1).year}`);
  },
  minerals() {
    const p = rec("minerals/metals.json").sort((a, b) => a.month.localeCompare(b.month));
    const v = p.map((r) => r.copper), max = 16000;
    const fmt = (m) => new Date(m + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    return fig(area(v, max, ACC) + line(v, max, ACC),
      `Copper price, monthly, from ${v[0].toLocaleString("en-GB")} a tonne in ${fmt(p[0].month)} to ${v.at(-1).toLocaleString("en-GB")} in ${fmt(p.at(-1).month)}`, `Copper, US dollars a tonne, monthly`, `${p[0].month.slice(0, 4)}–${p.at(-1).month.slice(0, 4)}`);
  },
  air() {
    const p = rec("air/world_pm25.json").sort((a, b) => a.year - b.year);
    const v = p.map((r) => r.pm25), max = 35;
    return fig(hline(5, max, "var(--muted)", "WHO guideline: 5 µg/m³") + area(v, max, ACC) + line(v, max, ACC),
      `World population-weighted PM2.5 from ${v[0]} µg/m³ in ${p[0].year} to ${v.at(-1)} in ${p.at(-1).year}, against a WHO guideline of 5`, `World average PM2.5; dashed line: WHO guideline`, `${p[0].year}–${p.at(-1).year}`);
  },
  vaccines() {
    const p = rec("vaccines/world.json").filter((r) => r.year >= 2000 && r.zero_dose_m != null).sort((a, b) => a.year - b.year);
    const v = p.map((r) => r.zero_dose_m), max = 25;
    return fig(area(v, max, ACC) + line(v, max, ACC),
      `Children who got no vaccines, worldwide, from ${v[0].toFixed(1)} million in ${p[0].year} to ${v.at(-1).toFixed(1)} million in ${p.at(-1).year}`, `Zero-dose children worldwide, millions`, `${p[0].year}–${p.at(-1).year}`);
  },
  energy() {
    const g = rec("energy/regions.json").filter((r) => r.code === "WLD").sort((a, b) => a.year - b.year);
    const e = g.map((r) => r.electricity_pct), c = g.map((r) => r.cooking_pct), a = g[0], z = g.at(-1);
    return fig(hline(100, 100, "var(--muted)", "Everyone") + line(c, 100, MUTED) + area(e, 100, ACC) + line(e, 100, ACC),
      `World access to electricity from ${a.electricity_pct}% in ${a.year} to ${z.electricity_pct}% in ${z.year}; clean cooking from ${a.cooking_pct}% to ${z.cooking_pct}%`, `Share of people with electricity; grey: clean cooking`, `${a.year}–${z.year}`);
  },
  medicines() {
    const p = rec("medicines/uk_concessions.json").sort((a, b) => a.month.localeCompare(b.month));
    const v = p.map((r) => r.concessions), max = 300;
    const fmt = (m) => new Date(m + "-01").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    const peak = p.reduce((a, b) => (b.concessions >= a.concessions ? b : a));
    return fig(area(v, max, ACC) + line(v, max, ACC),
      `Price concessions granted in England each month, from ${v[0]} in ${fmt(p[0].month)} to ${v.at(-1)} in ${fmt(p.at(-1).month)}, peaking at ${peak.concessions} in ${fmt(peak.month)}`,
      `Price concessions in England, per month`, `${p[0].month.slice(0, 4)}–${p.at(-1).month.slice(0, 4)}`);
  },
  fertilizer() {
    const p = rec("fertilizer/prices.json").filter((r) => r.month >= "2019-01" && r.urea != null).sort((a, b) => a.month.localeCompare(b.month));
    const v = p.map((r) => r.urea), max = 1000;
    const fmt = (m) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
    const hi = p.reduce((a, b) => (b.urea > a.urea ? b : a));
    return fig(area(v, max, ACC) + line(v, max, ACC),
      `Urea price, US dollars a tonne, monthly, from $${Math.round(v[0])} in ${fmt(p[0].month)} to $${Math.round(v.at(-1))} in ${fmt(p.at(-1).month)}, peaking at $${Math.round(hi.urea)} in ${fmt(hi.month)}`, `Urea, US$ a tonne, monthly`, `${p[0].month.slice(0, 4)}–${p.at(-1).month.slice(0, 4)}`);
  },
  remittances() {
    const p = rec("remittances/world.json").filter((r) => r.cost_global != null).sort((a, b) => a.year - b.year);
    const v = p.map((r) => r.cost_global), max = 10;
    return fig(area(v, max, ACC) + line(v, max, ACC) + hline(3, max, MUTED, "UN target: 3%"),
      `Average cost of sending $200 abroad, from ${v[0].toFixed(2)}% in ${p[0].year} to ${v.at(-1).toFixed(2)}% in ${p.at(-1).year}, against a 3% target`, `Cost of sending $200, %`, `${p[0].year}–${p.at(-1).year}`);
  },
};

const file = path.join(ROOT, "index.html");
let html = fs.readFileSync(file, "utf8");
for (const [id, make] of Object.entries(SPARKS)) {
  const re = new RegExp(`<!--spark:${id}-->[\\s\\S]*?<!--/spark-->`);
  if (!re.test(html)) throw new Error(`No placeholder for ${id}`);
  html = html.replace(re, () => `<!--spark:${id}-->${make()}<!--/spark-->`);
}
fs.writeFileSync(file, html);
console.log("Updated", Object.keys(SPARKS).length, "spark charts in index.html");
