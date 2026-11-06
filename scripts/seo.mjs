// Search and link-preview metadata for every page.
//   node scripts/seo.mjs                              Dataset markup only (relative links)
//   node scripts/seo.mjs https://example.org/monitor/ also full preview-image URLs,
//                                                     canonical links, sitemap.xml, robots.txt
// Safe to re-run: everything it writes sits between <!--seo--> markers or is regenerated.
import fs from "node:fs";
import path from "node:path";
import { ROOT, DASHBOARDS } from "./lib/browser.mjs";

let site = process.argv[2] ?? process.env.SITE_URL ?? "";
if (site) {
  const u = new URL(site); // throws on a malformed URL
  if (!/^https?:$/.test(u.protocol)) throw new Error("Site URL must start with http:// or https://");
  site = u.href.endsWith("/") ? u.href : u.href + "/";
}
const abs = (p) => (site ? new URL(p, site).href : null);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));
const meta = (html, re) => html.match(re)?.[1]?.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const today = new Date().toISOString().slice(0, 10);

function datasetLd(id, html) {
  const index = json(`data/${id}/index.json`);
  const { sources } = json(`data/${id}/sources.json`);
  const name = meta(html, /<title>([^<]*?)\s*·\s*Economy Monitor<\/title>/) ?? id;
  const description = meta(html, /<meta name="description" content="([^"]*)"/) ?? "";
  const dates = Object.values(sources).map((s) => String(s.published ?? "")).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const dataUrl = (f) => abs(`data/${id}/${f}`) ?? `../data/${id}/${f}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description: `${description} ${index.datasets.length} tables: ${index.datasets.map((d) => d.title).join("; ")}.`,
    url: abs(`${id}/`) ?? "./",
    license: index.licence === "CC BY 4.0" ? "https://creativecommons.org/licenses/by/4.0/" : index.licence,
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "Economy Monitor", url: abs("") ?? "../" },
    ...(dates.length ? { dateModified: dates.at(-1) } : {}),
    isBasedOn: Object.values(sources).map((s) => s.url).filter(Boolean),
    distribution: index.datasets.map((d) => ({ "@type": "DataDownload", name: d.title, encodingFormat: "text/csv", contentUrl: dataUrl(`${d.id}.csv`) })),
  };
  // "</" can't appear inside a <script> block.
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/<\//g, "<\\/")}</script>`;
}

function update(file, pagePath, ogImage, extra = "") {
  let html = read(file);
  const pretty = /\/>\s*$/m.test(html.match(/<meta[^>]*>/)[0]) ? " /" : "";
  const indent = html.match(/\n(\s*)<meta name="twitter:card"/)?.[1] ?? "";
  html = html.replace(/\n?\s*<!--seo-->[\s\S]*?<!--\/seo-->/, "");
  const tags = [];
  if (site) {
    tags.push(`<link rel="canonical" href="${esc(abs(pagePath))}"${pretty}>`);
    tags.push(`<meta property="og:url" content="${esc(abs(pagePath))}"${pretty}>`);
    tags.push(`<meta name="twitter:image" content="${esc(abs(ogImage))}"${pretty}>`);
  }
  if (extra) tags.push(extra);
  // og:image itself stays in place; only its value changes.
  html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(abs(ogImage) ?? path.posix.relative(path.posix.dirname("/" + pagePath + "x"), "/" + ogImage))}$2`);
  if (tags.length) html = html.replace(/(\n\s*<meta name="twitter:card"[^>]*>)/, `$1\n${indent}<!--seo-->\n${tags.map((t) => indent + t).join("\n")}\n${indent}<!--/seo-->`);
  fs.writeFileSync(path.join(ROOT, file), html);
}

update("index.html", "", "assets/og/hub.png");
for (const id of DASHBOARDS) {
  update(`${id}/index.html`, `${id}/`, `assets/og/${id}.png`, datasetLd(id, read(`${id}/index.html`)));
}

// The 404 page uses <base> so its links work at any depth on the host.
const notFound = path.join(ROOT, "404.html");
if (fs.existsSync(notFound)) {
  const base = site ? new URL(site).pathname : "/";
  fs.writeFileSync(notFound, fs.readFileSync(notFound, "utf8").replace(/<base href="[^"]*">/, `<base href="${esc(base)}">`));
}

const robots = ["User-agent: *", "Allow: /", ...(site ? ["", `Sitemap: ${abs("sitemap.xml")}`] : [])].join("\n") + "\n";
fs.writeFileSync(path.join(ROOT, "robots.txt"), robots);
if (site) {
  const urls = ["", "about/", ...DASHBOARDS.map((id) => `${id}/`), ...DASHBOARDS.map((id) => `data/${id}/index.html`)];
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(abs(u))}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
  console.log(`Wrote absolute URLs for ${site}, sitemap.xml and robots.txt.`);
} else {
  if (fs.existsSync(path.join(ROOT, "sitemap.xml"))) fs.rmSync(path.join(ROOT, "sitemap.xml"));
  console.log("No site URL given: wrote Dataset markup and robots.txt only.\nRun again with your live URL, e.g. node scripts/seo.mjs https://example.org/, for preview images that work everywhere, canonical links and sitemap.xml.");
}
