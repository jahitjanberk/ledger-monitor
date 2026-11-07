// The embeddable chart page (embed/?d=<dashboard>): a dashboard's headline chart, drawn
// from the published data by the same code as on the dashboard (figs.js). Inside an iframe
// it shows the chart alone; opened directly it also gives the code to paste.
import { FIGS } from "./figs.js";

const SITE = new URL("../", import.meta.url);
const root = document.getElementById("eb");
const params = new URLSearchParams(location.search);
const theme = params.get("theme");
if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
let framed = true;
try { framed = window.self !== window.top; } catch { /* a cross-origin parent: we are framed */ }
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ids = Object.keys(FIGS);
const id = ids.includes(params.get("d")) ? params.get("d") : null;

// The dashboard's own stylesheet carries its accent colour. `id` is one of FIGS' keys, so the path is safe.
const useAccent = (d) => {
  document.getElementById("eb-accent")?.remove();
  const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: new URL(`${d}/assets/${d}.css`, SITE).href, id: "eb-accent" });
  document.head.append(link);
};

const titles = fetch(new URL("assets/search.json", SITE)).then((r) => r.json())
  .then((j) => Object.fromEntries(j.dashboards.map((x) => [x.d, x.t]))).catch(() => ({}));

function figure(d, title) {
  const cfg = FIGS[d];
  const fig = document.createElement("figure");
  fig.className = "em-fig eb-fig";
  fig.innerHTML = `<figcaption class="em-fig-t">${esc(cfg.title)}</figcaption><div class="em-fig-plot"></div>`
    + `<p class="em-fig-s">Source: ${esc(cfg.source)} · <a href="${new URL(`${d}/`, SITE)}" target="_blank" rel="noopener">${esc(title ?? "Ledger Monitor")}, on Ledger Monitor ↗</a></p>`;
  const plot = fig.querySelector(".em-fig-plot");
  const h = cfg.height ?? 200;
  plot.style.minHeight = `${h}px`;
  Promise.all(cfg.files.map((f) => fetch(new URL(`data/${d}/${f}.json`, SITE)).then((r) => r.json()).then((j) => j.records)))
    .then((data) => {
      let drawnAt = 0;
      const draw = () => {
        const w = Math.round(plot.clientWidth);
        if (!w || w === drawnAt) return;
        drawnAt = w;
        const { svg, label } = cfg.draw(data, w, h);
        plot.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${svg}</svg>`;
      };
      draw();
      new ResizeObserver(draw).observe(plot);
    })
    .catch(() => { plot.innerHTML = `<p class="eb-msg">The data for this chart could not be loaded.</p>`; });
  return fig;
}

const code = (d) => {
  const h = (FIGS[d].height ?? 200) + 110;
  const src = new URL(`embed/?d=${d}`, SITE).href;
  return `<iframe src="${src}" title="${esc(FIGS[d].title)}, from Ledger Monitor" width="100%" height="${h}" style="border:0;max-width:640px" loading="lazy"></iframe>`;
};

titles.then((T) => {
  if (framed) {
    root.classList.add("eb-framed");
    if (!id) { root.innerHTML = `<p class="eb-msg">No chart chosen. <a href="${SITE}" target="_blank" rel="noopener">Ledger Monitor ↗</a></p>`; return; }
    useAccent(id);
    document.title = `${FIGS[id].title} · Ledger Monitor`;
    root.replaceChildren(figure(id, T[id]));
    return;
  }

  // Opened directly: pick a chart, preview it, copy the code.
  const d = id ?? "chokepoints";
  useAccent(d);
  root.innerHTML = `<p class="eb-eyebrow"><a href="${SITE}">Ledger Monitor</a></p>
<h1>Embed a chart</h1>
<p class="eb-lede">Put a dashboard's headline chart on your own site. It is drawn from the published data each time it loads, names its source and links back to the dashboard. The charts and data are free to reuse under CC BY 4.0.</p>
<label class="eb-field" for="eb-pick">Chart<select id="eb-pick">${ids.map((k) => `<option value="${k}"${k === d ? " selected" : ""}>${esc(T[k] ?? k)}: ${esc(FIGS[k].title)}</option>`).join("")}</select></label>
<div class="eb-preview" aria-label="Preview"></div>
<label class="eb-field" for="eb-code">Code to paste into your page<textarea id="eb-code" readonly rows="4"></textarea></label>
<p class="eb-actions"><button type="button" id="eb-copy">Copy the code</button> <a href="${new URL(`${d}/`, SITE)}">Open the dashboard</a></p>
<p class="eb-note">The chart follows the reader's light or dark setting. To fix it, add <code>&amp;theme=light</code> or <code>&amp;theme=dark</code> to the address in the code.</p>`;
  document.title = "Embed a chart · Ledger Monitor";
  const pick = root.querySelector("#eb-pick"), box = root.querySelector("#eb-code"), copy = root.querySelector("#eb-copy");
  const show = (k) => {
    useAccent(k);
    root.querySelector(".eb-preview").replaceChildren(figure(k, T[k]));
    box.value = code(k);
    root.querySelector(".eb-actions a").href = new URL(`${k}/`, SITE).href;
    history.replaceState(null, "", `?d=${k}`);
  };
  pick.addEventListener("change", () => show(pick.value));
  copy.addEventListener("click", () => {
    const done = (t) => { copy.textContent = t; setTimeout(() => { copy.textContent = "Copy the code"; }, 2000); };
    (navigator.clipboard ? navigator.clipboard.writeText(box.value) : Promise.reject()).then(() => done("Copied"), () => { box.select(); done("Press Ctrl+C to copy"); });
  });
  show(d);
});
