// Minimal reader for an unzipped .xlsx: returns a sheet as an array of rows (arrays of strings/numbers).
import fs from "node:fs";
import path from "node:path";

const unxml = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const colIdx = (ref) => { let n = 0; for (const ch of ref.match(/^[A-Z]+/)[0]) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };

export function readSheet(dir, sheetFile) {
  const ssPath = path.join(dir, "xl/sharedStrings.xml");
  const ss = fs.existsSync(ssPath)
    ? [...fs.readFileSync(ssPath, "utf8").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")))
    : [];
  const xml = fs.readFileSync(path.join(dir, "xl/worksheets", sheetFile), "utf8");
  const rows = [];
  for (const rm of xml.matchAll(/<row [^>]*?r="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const row = [];
    for (const cm of (rm[2] ?? "").matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const t = cm[2].match(/t="(\w+)"/)?.[1];
      const v = cm[3]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const is = cm[3]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
      let val = null;
      if (t === "s") val = ss[+v];
      else if (t === "inlineStr") val = unxml(is ?? "");
      else if (t === "str") val = unxml(v ?? "");
      else if (v != null) val = Number(v);
      row[colIdx(cm[1])] = val;
    }
    rows[+rm[1] - 1] = row;
  }
  return rows;
}
