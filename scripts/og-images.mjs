// Renders the 1200x630 link-preview images in assets/og/ from the hub cards in index.html.
// Needs Microsoft Edge or Chrome (set BROWSER to its path). Run: node scripts/og-images.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const S = fs.mkdtempSync(path.join(os.tmpdir(), "em-og-"));
const E = process.env.BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 8799;
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": f.endsWith(".css") ? "text/css" : f.endsWith(".woff2") ? "font/woff2" : "application/octet-stream" }); r.end(b); }); }).listen(PORT);
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();

const cards = [...html.matchAll(/<article class="hb-card(?: hb-feat)?" style="--c-light:(#[0-9A-F]+)[^"]*">([\s\S]*?)<\/article>/g)].map(([, color, body]) => ({
  id: body.match(/<h2><a href="([a-z]+)\//)[1],
  color,
  eyebrow: strip(body.match(/<p class="hb-eyebrow">([\s\S]*?)<\/p>/)[1]).split(" · ")[0],
  title: strip(body.match(/<h2>([\s\S]*?)<\/h2>/)[1]),
  big: strip(body.match(/<p class="hb-big">([\s\S]*?)<\/p>/)[1]),
  label: strip(body.match(/<p class="hb-label">([\s\S]*?)<span/)[1]),
  src: strip(body.match(/<span class="hb-src">· ([\s\S]*?)<\/span>/)[1]),
}));
cards.push({ id: "hub", color: "#2E4BFF", eyebrow: "8 open data dashboards", title: "Economy Monitor", big: "", label: "The systems behind everyday life, measured from public sources", src: "Every number cited · all data downloadable" });

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const page = (c) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/fonts.css"><style>
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#F5F5F1;color:#0A0A0A;font-family:"Inter Tight",sans-serif;padding:56px 64px;display:flex;flex-direction:column;border-top:14px solid ${c.color}}
.top{display:flex;justify-content:space-between;align-items:center;font:500 22px/1 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase}
.brand{display:flex;align-items:center;gap:14px}.brand i{width:22px;height:22px;background:${c.color};display:inline-block}
.eb{color:#5C5C57}
h1{font-size:${c.big ? 60 : 104}px;line-height:1.02;letter-spacing:-.035em;font-weight:600;margin:${c.big ? 44 : 64}px 0 0;max-width:20ch}
.big{font-size:150px;font-weight:600;letter-spacing:-.045em;line-height:1;color:${c.color};margin-top:auto}
.label{font-size:${c.big ? 30 : 44}px;line-height:1.25;max-width:${c.big ? 34 : 24}ch;margin:${c.big ? "14px 0 0" : "auto 0 0"};${c.big ? "" : `color:${c.color};font-weight:600;letter-spacing:-.02em`}}
.src{font:500 20px/1.3 "JetBrains Mono",monospace;color:#5C5C57;margin-top:18px;text-transform:uppercase;letter-spacing:.04em}
</style></head><body>
<div class="top"><span class="brand"><i></i>Economy Monitor</span><span class="eb">${esc(c.eyebrow)}</span></div>
<h1>${esc(c.title)}</h1>${c.big ? `<div class="big">${esc(c.big)}</div>` : ""}<p class="label">${esc(c.label)}</p><p class="src">${esc(c.src)}</p>
</body></html>`;

const p = spawn(E, ["--headless=new", "--remote-debugging-port=9338", `--user-data-dir=${S}/prof-og`, "about:blank"]);
await new Promise((r) => setTimeout(r, 2500));
const t = await (await fetch("http://127.0.0.1:9338/json/new?about:blank", { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
ws.setMaxListeners?.(100);
const call = (m, params) => new Promise((r) => { const i = ++id; ws.addEventListener("message", (e) => { const d = JSON.parse(e.data); if (d.id === i) r(d.result); }); ws.send(JSON.stringify({ id: i, method: m, params })); });
await call("Emulation.setDeviceMetricsOverride", { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
await call("Page.navigate", { url: `http://localhost:${PORT}/assets/fonts.css` });
await new Promise((r) => setTimeout(r, 800));
const { frameTree } = await call("Page.getFrameTree", {});
fs.mkdirSync(path.join(ROOT, "assets/og"), { recursive: true });
for (const c of cards) {
  await call("Page.setDocumentContent", { frameId: frameTree.frame.id, html: page(c) });
  await call("Runtime.evaluate", { expression: "document.fonts.ready.then(()=>1)", awaitPromise: true });
  await new Promise((r) => setTimeout(r, 300));
  const s = await call("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ROOT, "assets/og", `${c.id}.png`), Buffer.from(s.data, "base64"));
  console.log("wrote", c.id);
}
ws.close();
const exited = new Promise((r) => { p.once("exit", r); setTimeout(r, 3000); });
p.kill();
server.closeAllConnections();
server.close();
await exited;
try { fs.rmSync(S, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* temp profile still locked; the OS cleans temp */ }
process.exit(0);
