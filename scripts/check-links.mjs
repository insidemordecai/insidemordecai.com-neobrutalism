#!/usr/bin/env node
/**
 * Check every generated page for broken internal links, missing local assets,
 * empty anchors, missing image alts, and duplicate IDs.
 *
 * Usage: npm run check
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith(".html")) htmlFiles.push(fullPath);
  }
})(DIST);

const problems = [];

function report(file, message) {
  problems.push(`${path.relative(ROOT, file)}: ${message}`);
}

function localTargetExists(url, fromFile) {
  const clean = decodeURIComponent(url.split("#")[0].split("?")[0]);
  if (!clean) return true;

  const target = clean.startsWith("/")
    ? path.join(DIST, clean)
    : path.join(path.dirname(fromFile), clean);

  return [
    target,
    path.join(target, "index.html"),
    `${target}.html`,
  ].some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");

  if (/%%NEO_BLOCK_/.test(html)) report(file, "unreplaced content block");
  if (/\{\{[<%]/.test(html)) report(file, "unprocessed Hugo shortcode");

  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt=/.test(match[1])) report(file, "image without alt attribute");
  }

  for (const match of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    const url = match[1];
    if (!url || url === "#") {
      report(file, "empty link target");
      continue;
    }
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    if (!localTargetExists(url, file)) report(file, `missing target: ${url}`);
  }

  const ids = new Map();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) report(file, `duplicate id: ${id}`);
  }

  const h1Count = (html.match(/<h1\b/g) || []).length;
  if (h1Count !== 1) report(file, `expected one h1, found ${h1Count}`);
}

if (problems.length) {
  console.error(`Found ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files — no problems found.`);
