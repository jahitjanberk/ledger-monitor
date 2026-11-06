// Small RFC 4180 CSV parser: returns an array of objects keyed by the header row.
import fs from "node:fs";

export function parseCsv(text) {
  text = text.replace(/^﻿/, "");
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function readCsv(file, headerRow = 0) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const h = rows[headerRow];
  return rows.slice(headerRow + 1).filter((r) => r.length > 1 || r[0]).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
