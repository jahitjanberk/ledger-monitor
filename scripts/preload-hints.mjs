// Adds <link rel="modulepreload"> for every script a dashboard imports, so the browser
// fetches them all at once instead of discovering them one import at a time.
// Re-run after changing any import:  node scripts/preload-hints.mjs
import fs from "node:fs";
import path from "node:path";
import { ROOT, DASHBOARDS } from "./lib/browser.mjs";

const IMPORT = /(?:\bimport|\bexport)\s*(?:[\w{}\s,*$]*?\bfrom\s*)?["']([^"']+\.js)["']/g;

function graph(entry) {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const m of fs.readFileSync(file, "utf8").matchAll(IMPORT)) walk(path.resolve(path.dirname(file), m[1]));
  };
  walk(entry);
  return [...seen];
}

for (const id of DASHBOARDS) {
  const dir = path.join(ROOT, id);
  const files = new Set([
    ...graph(path.join(dir, "assets/main.js")),
    ...graph(path.join(ROOT, "assets/em.js")),
  ]);
  const rel = (f) => {
    const r = path.relative(dir, f).replace(/\\/g, "/");
    return r.startsWith(".") ? r : "./" + r;
  };
  // The entry points are already <script type="module"> tags.
  const skip = new Set(["./assets/main.js", "../assets/em.js"]);
  const links = [...files].map(rel).filter((r) => !skip.has(r)).sort()
    .map((r) => `    <link rel="modulepreload" href="${r}" />`).join("\n");

  const file = path.join(dir, "index.html");
  let html = fs.readFileSync(file, "utf8").replace(/\n?\s*<!--preload-->[\s\S]*?<!--\/preload-->/, "");
  html = html.replace(/(\s*)(<script type="module" src="\.\/assets\/main\.js">)/, `$1<!--preload-->\n${links}\n    <!--/preload-->$1$2`);
  fs.writeFileSync(file, html);
  console.log(`${id}: ${files.size - 2} module preloads`);
}
