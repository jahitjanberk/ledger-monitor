// Writes feed.xml, an Atom feed of data refreshes and new pages, from docs/updates.json.
//   node scripts/feed.mjs                              uses the GitHub Pages address
//   node scripts/feed.mjs https://example.org/monitor/ for another host
// Feed readers need absolute links, so the site address is always required here.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/browser.mjs";

const DEFAULT_SITE = "https://jahitjanberk.github.io/ledger-monitor/";
const site = new URL(process.argv[2] ?? process.env.SITE_URL ?? DEFAULT_SITE);
if (!/^https?:$/.test(site.protocol)) throw new Error("Site URL must start with http:// or https://");
if (!site.pathname.endsWith("/")) site.pathname += "/";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const { updates } = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/updates.json"), "utf8"));
for (const u of updates) {
  for (const k of ["id", "date", "title", "summary"]) if (!u[k]) throw new Error(`docs/updates.json: an entry has no ${k}`);
  if (Number.isNaN(Date.parse(u.date))) throw new Error(`docs/updates.json: ${u.id} has a bad date`);
}
updates.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

const iso = (d) => new Date(d).toISOString().replace(/\.\d{3}Z$/, "Z");
const tag = (u) => `tag:${site.host},2026:${u.id}`;
const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Ledger Monitor updates</title>
  <subtitle>New dashboards, data refreshes and features from Ledger Monitor.</subtitle>
  <link rel="alternate" type="text/html" href="${esc(site.href)}"/>
  <link rel="self" type="application/atom+xml" href="${esc(new URL("feed.xml", site).href)}"/>
  <id>${esc(site.href)}</id>
  <updated>${iso(updates[0]?.date ?? Date.now())}</updated>
  <author><name>jahit</name><uri>https://github.com/jahitjanberk</uri></author>
  <rights>Data: CC BY 4.0 compilation. Code: MIT.</rights>
${updates.map((u) => `  <entry>
    <title>${esc(u.title)}</title>
    <link rel="alternate" type="text/html" href="${esc(new URL(u.path ?? "", site).href)}"/>
    <id>${esc(tag(u))}</id>
    <updated>${iso(u.date)}</updated>
    <summary>${esc(u.summary)}</summary>
  </entry>`).join("\n")}
</feed>
`;
fs.writeFileSync(path.join(ROOT, "feed.xml"), xml);
console.log(`Wrote feed.xml with ${updates.length} entries for ${site.href}`);
