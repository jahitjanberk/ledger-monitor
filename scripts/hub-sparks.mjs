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
  air() {
    const p = rec("air/world_pm25.json").sort((a, b) => a.year - b.year);
    const v = p.map((r) => r.pm25), max = 35;
    return fig(hline(5, max, "var(--muted)", "WHO guideline: 5 µg/m³") + area(v, max, ACC) + line(v, max, ACC),
      `World population-weighted PM2.5 from ${v[0]} µg/m³ in ${p[0].year} to ${v.at(-1)} in ${p.at(-1).year}, against a WHO guideline of 5`, `World average PM2.5; dashed line: WHO guideline`, `${p[0].year}–${p.at(-1).year}`);
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
