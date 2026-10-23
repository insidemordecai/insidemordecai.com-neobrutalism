#!/usr/bin/env node
/*
 * Copy the upstream Hugo content directory into this clone.
 *
 * Usage:
 *   node scripts/sync-content.mjs ../insidemordecai.com
 *   npm run sync:content -- ../insidemordecai.com
 *
 * The entire `content/` tree is copied. Files listed in LOCAL_OVERRIDES are
 * restored afterwards so clone-specific edits survive the sync.
 */
import fs from "node:fs";
import path from "node:path";

const LOCAL_OVERRIDES = ["colophon/index.md"];

const upstreamRoot = process.argv[2];

if (!upstreamRoot) {
  console.error("Usage: node scripts/sync-content.mjs <path-to-upstream-repo>");
  process.exit(1);
}

const source = path.resolve(upstreamRoot, "content");
const target = path.resolve("content");

if (!fs.existsSync(source)) {
  console.error(`Upstream content directory not found: ${source}`);
  process.exit(1);
}

const savedOverrides = new Map();

for (const relativePath of LOCAL_OVERRIDES) {
  const file = path.join(target, relativePath);
  if (fs.existsSync(file)) {
    savedOverrides.set(relativePath, fs.readFileSync(file));
  }
}

fs.cpSync(source, target, {
  recursive: true,
  force: true,
  filter: (entry) => path.basename(entry) !== ".DS_Store",
});

for (const [relativePath, contents] of savedOverrides) {
  const file = path.join(target, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

console.log(`Synced content from ${source}`);
console.log(`Preserved local overrides: ${LOCAL_OVERRIDES.join(", ")}`);
