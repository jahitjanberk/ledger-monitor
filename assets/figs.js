// The headline chart of each dashboard, shared by the dashboards (assets/em.js) and the
// embeddable chart page (embed/). Each entry names the data files it draws from
// (data/<dashboard>/<file>.json) and a draw(records, width, height) that returns { svg, label }.
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const fx = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
const T = (x, y, s, cls = "", anchor = "start") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ""}>${esc(s)}</text>`;
const Ln = (x1, y1, x2, y2, cls) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}"/>`;
const num = (v, d = 0) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const MUTE = "color-mix(in srgb, var(--em-fg) 18%, transparent)";
const columns = (vals, w, y, base, colour) => {
  const bw = w / vals.length;
  return vals.map((v, i) => `<rect x="${(i * bw).toFixed(1)}" y="${y(v).toFixed(1)}" width="${Math.max(0.8, bw - (bw > 4 ? 1 : 0.3)).toFixed(1)}" height="${Math.max(1, base - y(v)).toFixed(1)}" fill="${colour(v, i)}"/>`).join("");
};
export const FIGS = {
  air: {
    files: ["world_pm25"], title: "World average exposure to fine particles, µg/m³",
    source: "Washington University in St. Louis (SatPM), via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const x = fx(a.year, z.year, 0, w), y = fx(0, 35, base, 26), g = y(5);
      const pts = rows.map((r) => [x(r.year), y(r.pm25)]);
      return {
        label: `World average PM2.5 went from ${a.pm25} µg/m³ in ${a.year} to ${z.pm25} in ${z.year}. The WHO guideline is 5.`,
        svg: `<path d="${pathOf(pts)}L${w},${g}L0,${g}Z" fill="var(--em-accent)" opacity=".14"/>`
          + Ln(0, g, w, g, "rule") + T(0, g + 15, "WHO guideline: 5")
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, pts[0][1] + 18, `${a.pm25} in ${a.year}`)
          + Ln(w, 17, w, pts.at(-1)[1] - 4, "lead") + T(w, 12, `${z.pm25} in ${z.year}, ${Math.round(z.pm25 / 5)} times the guideline`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  food: {
    files: ["world"], title: "People undernourished worldwide, millions",
    source: "FAO, The State of Food Security and Nutrition in the World 2026, via FAOSTAT",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const low = rows.reduce((p, r) => (r.undernourished_m < p.undernourished_m ? r : p));
      const peak = rows.filter((r) => r.year > low.year).reduce((p, r) => (r.undernourished_m > p.undernourished_m ? r : p));
      const x = fx(a.year, z.year, 0, w), y = fx(0, 1000, base, 4);
      const pts = rows.map((r) => [x(r.year), y(r.undernourished_m)]);
      const xl = x(low.year), xp = x(peak.year);
      return {
        label: `Undernourished people: ${num(a.undernourished_m)} million in ${a.year}, a low of ${num(low.undernourished_m)} million in ${low.year}, ${num(peak.undernourished_m)} million in ${peak.year} and ${num(z.undernourished_m)} million in ${z.year}.`,
        svg: `<path d="${pathOf(pts)}L${w},${base}L0,${base}Z" fill="var(--em-accent)" opacity=".14"/>`
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, pts[0][1] - 8, `${num(a.undernourished_m)}m in ${a.year}`)
          + Ln(xl, y(low.undernourished_m) + 4, xl, base - 22, "lead") + T(xl, base - 10, `Low: ${num(low.undernourished_m)}m in ${low.year}`, "", "middle")
          + T(xp, y(peak.undernourished_m) - 22, `${num(peak.undernourished_m)}m in ${peak.year}`, "", "end")
          + T(w, y(z.undernourished_m) - 8, `${num(z.undernourished_m)}m in ${z.year}`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  heat: {
    files: ["global"], title: "Global temperature against 1850–1900, °C",
    source: "Met Office Hadley Centre and UEA, HadCRUT5",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20, top = rows.reduce((p, r) => (r.anomaly_preindustrial > p.anomaly_preindustrial ? r : p));
      const x = fx(a.year, z.year, 0, w), y = fx(-0.4, 1.8, base, 4), g = y(1.5);
      const pts = rows.map((r) => [x(r.year), y(r.anomaly_preindustrial)]);
      const sg = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}°C`;
      return {
        label: `Global temperature against 1850–1900: ${sg(a.anomaly_preindustrial)} in ${a.year}, ${sg(top.anomaly_preindustrial)} in ${top.year}, the warmest year, and ${sg(z.anomaly_preindustrial)} in ${z.year}.`,
        svg: Ln(0, g, w, g, "rule") + T(0, g - 6, "1.5°C")
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + T(0, y(0) + 24, `${a.year}: ${sg(a.anomaly_preindustrial)}`)
          + T(x(top.year) - 6, y(top.anomaly_preindustrial) + 4, `${top.year}: ${sg(top.anomaly_preindustrial)}`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  minerals: {
    files: ["minerals"], title: "Share of world mine production held by the top country, 2025",
    source: "USGS Mineral Commodity Summaries 2026", height: 244,
    draw([rows], w) {
      const r = rows.filter((c) => c.top_share != null).sort((a, b) => b.top_share - a.top_share).slice(0, 8);
      const x = fx(0, 100, 0, w), row = 30;
      const nm = (c) => (c === "Democratic Republic of Congo" ? "DR Congo" : c);
      return {
        label: `The top country's share of world mine production in 2025: ${r.map((c) => `${c.label} ${nm(c.top_country)} ${num(c.top_share, 0)}%`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, `${c.label}: ${nm(c.top_country)}`, i ? "" : "k") + T(w, top + 12, `${num(c.top_share, 0)}%`, "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.top_share).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
  housing: {
    files: ["markets"], title: "Years of income for a median-priced home, by market",
    source: "Demographia International Housing Affordability 2026, Chapman University",
    draw([rows], w, h) {
      const r = [...rows].sort((a, b) => a.median_multiple - b.median_multiple);
      const lo = r[0], hi = r.at(-1), base = h - 20;
      const y = fx(0, Math.ceil(hi.median_multiple), base, 4), a = y(3);
      const ok = r.filter((m) => m.median_multiple <= 3).length;
      return {
        label: `${r.length} markets, from ${lo.median_multiple} years of income in ${lo.market} to ${hi.median_multiple} in ${hi.market}. ${ok || "None"} ${ok === 1 ? "is" : "are"} under the affordable line of 3.0.`,
        svg: columns(r.map((m) => m.median_multiple), w, y, base, (_, i) => (i === r.length - 1 ? "var(--em-accent)" : MUTE))
          + Ln(0, a, w, a, "rule")
          + T(0, 14, "Dashed line: affordable, 3.0 or less")
          + T(0, 30, ok ? `${ok} of ${r.length} markets qualify` : `None of the ${r.length} markets qualifies`, "k")
          + Ln(0, base, w, base, "ax")
          + T(0, h - 4, `${lo.market.split(",")[0]}: ${lo.median_multiple}`) + T(w, h - 4, `${hi.market}: ${hi.median_multiple}`, "k", "end"),
      };
    },
  },
  water: {
    files: ["stress"], title: "Freshwater withdrawn as a share of what is available, by country",
    source: "FAO, SDG indicator 6.4.2, via Our World in Data",
    draw([rows], w, h) {
      const r = rows.filter((d) => d.stress_pct != null).sort((a, b) => a.stress_pct - b.stress_pct);
      const hi = r.at(-1), over = r.filter((d) => d.stress_pct > 100).length, base = h - 20, cap = 200;
      const y = fx(0, cap, base, 4), a = y(100);
      return {
        label: `${r.length} countries by water stress. ${over} withdraw more than 100% of their renewable freshwater; ${hi.country} withdraws ${num(hi.stress_pct)}%.`,
        svg: columns(r.map((d) => Math.min(d.stress_pct, cap)), w, y, base, (v) => (v > 100 ? "var(--em-accent)" : MUTE))
          + Ln(0, a, w, a, "rule")
          + T(0, 14, "Dashed line: 100%, all of it")
          + T(0, 30, `${over} countries use more than they have`, "k")
          + Ln(0, base, w, base, "ax")
          + T(0, h - 4, "Least stressed") + T(w, h - 4, `${hi.country}: ${num(hi.stress_pct)}% (bar cut off)`, "k", "end"),
      };
    },
  },
  electricity: {
    files: ["world"], title: "Share of world electricity, renewables against coal",
    source: "Ember, Yearly Electricity Data, via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20;
      const x = fx(a.year, z.year, 0, w), y = fx(0, 45, base, 4);
      const line = (k, colour) => `<path d="${pathOf(rows.map((r) => [x(r.year), y(r[k])]))}" fill="none" stroke="${colour}" stroke-width="2" stroke-linejoin="round"/>`;
      const zy = y(z.renewables_pct);
      return {
        label: `Renewables went from ${num(a.renewables_pct, 1)}% of world electricity in ${a.year} to ${num(z.renewables_pct, 1)}% in ${z.year}; coal from ${num(a.coal_pct, 1)}% to ${num(z.coal_pct, 1)}%.`,
        svg: line("coal_pct", "color-mix(in srgb, var(--em-fg) 45%, transparent)") + line("renewables_pct", "var(--em-accent)")
          + T(0, y(a.coal_pct) - 8, `Coal ${num(a.coal_pct, 1)}%`) + T(0, y(a.renewables_pct) + 18, `Renewables ${num(a.renewables_pct, 1)}%`)
          + Ln(w, 18, w, zy - 6, "lead") + `<circle cx="${w}" cy="${zy.toFixed(1)}" r="3.5" fill="var(--em-accent)"/>`
          + T(w, 13, `${z.year}: renewables ${num(z.renewables_pct, 1)}%, coal ${num(z.coal_pct, 1)}%`, "k", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  chokepoints: {
    files: ["weekly", "daily"], title: "Ships a day through the Strait of Hormuz, weekly average",
    source: "IMF PortWatch, from satellite ship tracking",
    draw([weekly, daily], w, h) {
      const H = (r) => r.chokepoint === "Strait of Hormuz";
      const wk = weekly.filter(H).sort((a, b) => a.week.localeCompare(b.week));
      const dy = daily.filter(H);
      const CLOSED = "2026-03-02";
      const mean = (rs) => rs.reduce((s, r) => s + r.transits, 0) / rs.length;
      const before = mean(dy.filter((r) => r.date < "2026-01-01")), after = mean(dy.filter((r) => r.date >= CLOSED));
      const t = (d) => Date.parse(d), base = h - 20;
      const x = fx(t(wk[0].week), t(wk.at(-1).week), 0, w);
      const y = fx(0, Math.ceil((Math.max(...wk.map((r) => r.transits)) * 1.3) / 10) * 10, base, 4);
      const pts = wk.map((r) => [x(t(r.week)), y(r.transits)]), xc = x(t(CLOSED));
      const mon = (d) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
      return {
        label: `Ships through the Strait of Hormuz averaged ${num(before, 1)} a day in 2025 and ${num(after, 1)} a day after it closed on 2 March 2026.`,
        svg: `<path d="${pathOf(pts)}L${pts.at(-1)[0]},${base}L0,${base}Z" fill="var(--em-accent)" opacity=".14"/>`
          + `<path d="${pathOf(pts)}" fill="none" stroke="var(--em-accent)" stroke-width="2" stroke-linejoin="round"/>`
          + Ln(xc, 4, xc, base, "rule") + T(xc + 6, 14, "Closed 2 Mar 2026", "k")
          + T(0, 14, `${num(before, 1)} a day in 2025`)
          + T(xc + 6, 30, `${num(after, 1)} a day since`)
          + Ln(0, base, w, base, "ax") + T(0, h - 4, mon(wk[0].week), "n") + T(w, h - 4, mon(wk.at(-1).week), "n", "end"),
      };
    },
  },
  orbit: {
    files: ["yearly"], title: "Objects launched into space each year, the United States in colour",
    source: "UN Office for Outer Space Affairs, via Our World in Data",
    draw([rows], w, h) {
      rows = [...rows].sort((a, b) => a.year - b.year);
      const a = rows[0], z = rows.at(-1), base = h - 20, max = Math.max(...rows.map((r) => r.world));
      const y = fx(0, max, base, 4), bw = w / rows.length;
      const s = rows.find((r) => r.year === 2019), xs = rows.indexOf(s) * bw + bw / 2;
      return {
        label: `Objects launched per year, ${a.year} to ${z.year}. ${num(z.world)} were launched in ${z.year}, ${Math.round((100 * z.united_states) / z.world)}% of them by the United States.`,
        svg: columns(rows.map((r) => r.world), w, y, base, () => MUTE) + columns(rows.map((r) => r.united_states), w, y, base, () => "var(--em-accent)")
          + Ln(xs, y(s.world) - 4, xs, y(max * 0.42) + 4, "lead") + T(xs + 4, y(max * 0.42) - 2, "2019: first Starlink batch", "", "end")
          + T(w - bw - 4, 14, `${num(z.world)} in ${z.year}`, "k", "end")
          + T(w - bw - 4, 30, `${Math.round((100 * z.united_states) / z.world)}% from the US`, "", "end")
          + Ln(0, base, w, base, "ax") + T(0, h - 4, a.year, "n") + T(w, h - 4, z.year, "n", "end"),
      };
    },
  },
  scams: {
    files: ["trend"], title: "Losses reported to the FBI's Internet Crime Complaint Center",
    source: "FBI IC3 annual reports",
    draw([rows], w, h) {
      const r = rows.filter((d) => d.country === "United States").sort((a, b) => a.year - b.year);
      const base = h - 20, max = Math.max(...r.map((d) => d.losses_local));
      const y = fx(0, max, base, 22), bw = w / r.length, gap = Math.min(18, bw * 0.25);
      const bn = (v) => `$${(v / 1e9).toFixed(1)}bn`;
      return {
        label: `US losses reported to the FBI, ${r.map((d) => `${d.year} ${bn(d.losses_local)}`).join(", ")}.`,
        svg: r.map((d, i) => {
          const x0 = i * bw + gap / 2, top = y(d.losses_local), last = i === r.length - 1;
          return `<rect x="${x0.toFixed(1)}" y="${top.toFixed(1)}" width="${(bw - gap).toFixed(1)}" height="${(base - top).toFixed(1)}" fill="${last ? "var(--em-accent)" : MUTE}"/>`
            + T(x0 + (bw - gap) / 2, top - 6, bn(d.losses_local), last ? "k" : "", "middle")
            + T(x0 + (bw - gap) / 2, h - 4, d.year, "n", "middle");
        }).join("") + Ln(0, base, w, base, "ax"),
      };
    },
  },
  debt: {
    files: ["countries"], title: "Share of government revenue spent on net interest, 2025",
    source: "IMF Fiscal Monitor, October 2026", height: 244,
    draw([rows], w) {
      const r = rows.filter((c) => c.interest_pct_revenue != null).sort((a, b) => b.interest_pct_revenue - a.interest_pct_revenue).slice(0, 8);
      const x = fx(0, r[0].interest_pct_revenue, 0, w), row = 30;
      return {
        label: `The largest shares of revenue spent on net interest in 2025: ${r.map((c) => `${c.country} ${num(c.interest_pct_revenue, 1)}%`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, c.country, i ? "" : "k") + T(w, top + 12, `${num(c.interest_pct_revenue, 0)}%`, "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.interest_pct_revenue).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
  internet: {
    files: ["cables"], title: "The longest submarine cable systems, km",
    source: "TeleGeography Submarine Cable Map, January 2021 snapshot", height: 244,
    draw([rows], w) {
      const r = [...rows].sort((a, b) => b.length_km - a.length_km).slice(0, 8);
      const x = fx(0, r[0].length_km, 0, w), row = 30;
      return {
        label: `The longest cable systems in the 2021 snapshot: ${r.map((c) => `${c.name} ${num(c.length_km)} km`).join(", ")}.`,
        svg: r.map((c, i) => {
          const top = i * row;
          return T(0, top + 12, c.name.replace(/\s*\(.*\)\s*$/, ""), i ? "" : "k") + T(w, top + 12, num(c.length_km), "n", "end")
            + `<rect x="0" y="${top + 17}" width="${x(c.length_km).toFixed(1)}" height="6" fill="${i ? MUTE : "var(--em-accent)"}"/>`;
        }).join(""),
      };
    },
  },
};
