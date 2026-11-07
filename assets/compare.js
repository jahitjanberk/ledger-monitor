// The compare page: up to four countries side by side, from country/profiles.json
// (written by scripts/countries.mjs). The choice is kept in the address, e.g.
// compare/?c=KEN,IND, so a comparison can be shared.
const SITE = new URL("../", import.meta.url);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const nf = (v, d) => v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026-06" reads as Jun 2026; Eurostat half-years ("2026-S1") as H1 2026.
const when = (y) => {
  const s = String(y ?? "");
  if (/^\d{4}-\d{2}$/.test(s)) return `${MON[+s.slice(5) - 1]} ${s.slice(0, 4)}`;
  const h = s.match(/^(\d{4})-S([12])$/);
  return h ? `H${h[2]} ${h[1]}` : s;
};

const inputs = [...document.querySelectorAll("#cp-pick input")];
const out = document.getElementById("cp-out");

function fmt(m, v, under) {
  if (v == null && under) return `Under ${nf(under, 1)}${m.unit === "%" ? "%" : ""}`;
  if (v == null) return null;
  if (m.money) return `$${nf(v, 2)}`;
  const s = (m.signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "") + nf(Math.abs(v), m.dec);
  return s + (m.unit === "%" ? "%" : "");
}

fetch(new URL("country/profiles.json", SITE))
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then((P) => {
    const byName = new Map(Object.entries(P.countries).map(([iso, c]) => [c.name.toLowerCase(), iso]));
    const resolve = (s) => {
      const q = s.trim();
      if (!q) return null;
      if (P.countries[q.toUpperCase()]) return q.toUpperCase();
      return byName.get(q.toLowerCase()) ?? null;
    };

    const fromUrl = (new URLSearchParams(location.search).get("c") ?? "").split(",").map(resolve).filter(Boolean).slice(0, 4);
    fromUrl.forEach((iso, i) => { inputs[i].value = P.countries[iso].name; });

    function render() {
      const picked = [];
      inputs.forEach((el) => {
        const iso = resolve(el.value);
        el.setAttribute("aria-invalid", el.value.trim() && !iso ? "true" : "false");
        if (iso && !picked.includes(iso)) picked.push(iso);
      });
      const url = new URL(location.href);
      if (picked.length) url.searchParams.set("c", picked.join(",")); else url.searchParams.delete("c");
      history.replaceState(null, "", url.pathname + url.search.replace(/%2C/g, ","));
      document.title = picked.length ? `${picked.map((i) => P.countries[i].name).join(" vs ")} · Compare · Ledger Monitor` : "Compare countries · Ledger Monitor";

      if (!picked.length) { out.innerHTML = `<p class="cp-empty">Choose a country to start.</p>`; return; }
      const C = picked.map((iso) => ({ iso, ...P.countries[iso] }));
      let rows = "", lastDash = null;
      for (const m of P.metrics) {
        const cells = C.map((c) => c.m[m.id] ?? null);
        if (cells.every((x) => !x)) continue;
        if (m.dash !== lastDash) {
          const d = P.dashboards[m.dash];
          rows += `<tr class="cp-dash" style="--c-light:${d.light};--c-dark:${d.dark}"><th colspan="${C.length + 1}" scope="colgroup"><a href="${new URL(`${m.dash}/#${m.section}`, SITE)}">${esc(d.title)}</a></th></tr>`;
          lastDash = m.dash;
        }
        const max = Math.max(...cells.map((x) => (x && x[0] != null ? Math.abs(x[0]) : 0)));
        const d = P.dashboards[m.dash];
        rows += `<tr><th scope="row">${esc(m.label)}${m.unit && m.unit !== "%" ? `<small>${esc(m.unit)}</small>` : ""}</th>${cells.map((x) => {
          if (!x) return `<td class="cp-na">no figure</td>`;
          const [v, y, src, under] = x;
          const w = v != null && max > 0 ? Math.max(2, (Math.abs(v) / max) * 100) : 2;
          return `<td title="${esc(P.sources[src] ?? "")}"><span class="cp-v">${esc(fmt(m, v, under))}</span><span class="cp-y">${esc(when(y))}</span><span class="cp-bar" style="--c-light:${d.light};--c-dark:${d.dark};width:${w.toFixed(1)}%" aria-hidden="true"></span></td>`;
        }).join("")}</tr>`;
      }
      out.innerHTML = `<div class="cp-wrap" tabindex="0" role="region" aria-label="Comparison table"><table class="cp-table"><thead><tr><th scope="col"><span class="cp-y">Figure</span></th>${C.map((c) => `<th scope="col"><a href="${new URL(`country/${c.iso.toLowerCase()}/`, SITE)}">${esc(c.name)}</a></th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    inputs.forEach((el) => {
      el.addEventListener("change", render);
      el.addEventListener("input", () => { if (resolve(el.value) || !el.value.trim()) render(); });
    });
    document.getElementById("cp-pick").addEventListener("submit", (e) => { e.preventDefault(); render(); });
    render();
  })
  .catch((e) => { console.error(e); out.innerHTML = `<p class="cp-empty">The country data could not be loaded. Reload the page, or open a <a href="${new URL("country/", SITE)}">country profile</a> instead.</p>`; });
