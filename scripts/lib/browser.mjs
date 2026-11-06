// Shared helpers for the scripts in this folder: serve the site from disk and drive a
// headless Edge or Chrome over the DevTools protocol. Set BROWSER to the browser's path
// if it is not in the default Edge location.
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".csv": "text/csv", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json",
};

/** Serves ROOT on the given port. Missing files get 404.html, like most static hosts.
 *  Listens on loopback only, so the project folder isn't shared with the local network. */
export function serve(port) {
  const server = http.createServer((q, r) => {
    let rel;
    try { rel = decodeURIComponent(q.url.split(/[?#]/)[0]); } catch { r.writeHead(400); return r.end(); }
    let f = path.resolve(ROOT, "." + path.sep + rel);
    // Must stay inside ROOT (a bare prefix check would also let ROOT-sibling folders through),
    // and never serve dotfiles or dot-folders such as .git.
    const inside = path.relative(ROOT, f);
    if (rel.includes("\0") || inside.startsWith("..") || path.isAbsolute(inside) || inside.split(path.sep).some((s) => s.startsWith("."))) {
      r.writeHead(403); return r.end();
    }
    try { if (fs.statSync(f).isDirectory()) f = path.join(f, "index.html"); } catch { /* handled below */ }
    fs.readFile(f, (e, b) => {
      if (e) {
        r.writeHead(404, { "content-type": TYPES[".html"] });
        return r.end(fs.existsSync(path.join(ROOT, "404.html")) ? fs.readFileSync(path.join(ROOT, "404.html")) : "Not found");
      }
      r.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream", "x-content-type-options": "nosniff" });
      r.end(b);
    });
  }).listen(port, "127.0.0.1");
  return {
    url: `http://localhost:${port}/`,
    close() { server.closeAllConnections(); server.close(); },
  };
}

/** Starts a headless browser. Returns { newPage, close }. */
export async function launch(debugPort = 9340) {
  const exe = process.env.BROWSER ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "em-browser-"));
  const proc = spawn(exe, ["--headless=new", `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "--no-first-run", "about:blank"]);
  const base = `http://127.0.0.1:${debugPort}`;
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${base}/json/version`); break; } catch { await new Promise((r) => setTimeout(r, 200)); }
  }

  async function newPage() {
    const t = await (await fetch(`${base}/json/new?about:blank`, { method: "PUT" })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    let id = 0;
    const pending = new Map();
    const errors = [];
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? { error: d.error }); pending.delete(d.id); return; }
      if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description?.split("\n")[0] ?? d.params.exceptionDetails.text);
      if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
      if (d.method === "Log.entryAdded" && d.params.entry.level === "error") errors.push(`${d.params.entry.text} ${d.params.entry.url ?? ""}`.trim());
    };
    const call = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    await call("Runtime.enable");
    await call("Log.enable");
    await call("Page.enable");
    return {
      call,
      errors,
      async setViewport({ width, height, mobile = false, scheme = "light" }) {
        await call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
        await call("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
        await call("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
      },
      async goto(url, settle = 5000) { await call("Page.navigate", { url }); await new Promise((r) => setTimeout(r, settle)); },
      async eval(expression) {
        const res = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
        return res.result?.value;
      },
      async screenshot(file) { const s = await call("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(file, Buffer.from(s.data, "base64")); },
      close() { ws.close(); },
    };
  }

  async function close() {
    const exited = new Promise((r) => { proc.once("exit", r); setTimeout(r, 3000); });
    proc.kill();
    await exited;
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* the OS cleans temp */ }
  }
  return { newPage, close };
}

export const DASHBOARDS = ["air", "chokepoints", "debt", "electricity", "food", "heat", "housing", "internet", "minerals", "orbit", "scams", "water"];
