#!/usr/bin/env node
/**
 * Validate the generated RSS feeds.
 *
 * Checks that every item has the expected elements, full content, a reply
 * button, absolute asset URLs, and no markup that feed readers cannot handle
 * (collapsed <details>, site-only classes, raw shortcodes).
 *
 * Usage: npm run check:feed
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const FEEDS = ["index.xml", "posts/index.xml"];

const problems = [];
const report = (feed, message) => problems.push(`${feed}: ${message}`);

function items(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
}

function content(item) {
  const match = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
  return match ? match[1] : "";
}

for (const feed of FEEDS) {
  const file = path.join(DIST, feed);
  if (!fs.existsSync(file)) {
    report(feed, "missing feed");
    continue;
  }

  const xml = fs.readFileSync(file, "utf8");
  const entries = items(xml);

  if (entries.length === 0) report(feed, "no items");
  if (!/<atom:link[^>]+rel="self"/.test(xml)) report(feed, "missing atom self link");
  if (!/<lastBuildDate>/.test(xml)) report(feed, "missing lastBuildDate");
  if (/https?:\/\/[^"<\s]*\/it-support\//.test(xml)) {
    report(feed, "private Attic page leaked into feed");
  }

  entries.forEach((item, index) => {
    const label = `item ${index + 1}`;
    for (const tag of ["title", "link", "guid", "pubDate", "description"]) {
      if (!new RegExp(`<${tag}[ >]`).test(item)) report(feed, `${label} missing <${tag}>`);
    }

    const html = content(item);
    if (html.length < 400) report(feed, `${label} content looks empty`);

    if (!/href="mailto:mk@insidemordecai\.com\?subject=/.test(html)) {
      report(feed, `${label} missing reply-by-email link`);
    }

    if (/<details\b/.test(html)) report(feed, `${label} still contains <details>`);
    if (/class="neo-/.test(html)) report(feed, `${label} contains site-only classes`);
    if (/\{\{[<%]/.test(html)) report(feed, `${label} contains raw shortcodes`);
    if (/%%NEO_BLOCK/.test(html)) report(feed, `${label} contains unreplaced block`);
    if (/\[![A-Z]+\]/.test(html)) report(feed, `${label} contains raw alert markers`);

    if (/(?:src|href)="\/(?!\/)/.test(html)) {
      report(feed, `${label} contains root-relative URLs`);
    }
  });

  console.log(`  ${feed}: ${entries.length} items`);
}

if (process.platform !== "win32") {
  try {
    execFileSync("xmllint", ["--noout", path.join(DIST, "index.xml")], {
      stdio: "ignore",
    });
    console.log("  index.xml: well-formed XML");
  } catch {
    report("index.xml", "xmllint reported a problem");
  }
}

if (problems.length) {
  console.error("\nFeed problems:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("RSS feeds OK");
