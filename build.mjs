#!/usr/bin/env node
/**
 * Static site generator for the neobrutalist insidemordecai.com clone.
 *
 * Reads the Markdown in content/, writes plain HTML to dist/.
 * No runtime dependencies, no client-side JavaScript, no third-party requests.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(ROOT, "content");
const DIST_DIR = path.join(ROOT, "dist");
const ASSETS_DIR = path.join(ROOT, "assets");
const STATIC_DIR = path.join(ROOT, "static");

const PAGE_SIZE = 20;
const POSTS_PER_HOME = 6;
/*
 * The home category grid holds eight tiles. Below that, every category is
 * already visible, so no "all categories" control is rendered. When the list
 * grows past the grid, the last visible slot becomes an "all categories" tile.
 */
const HOME_CATEGORY_TILES = 8;

const SITE = {
  url: (process.env.SITE_URL || "https://insidemordecai.com").replace(/\/$/, ""),
  title: "Mordecai Kipng’etich",
  tagline: "Welcome to my corner of the internet about everything.",
  description:
    "Personal website and blog about tech, media, books, music, homelabs, and life in Kenya.",
  email: "mk@insidemordecai.com",
  location: "Somewhere in Kenya",
  license: "CC BY-NC-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  repo: "https://github.com/insidemordecai/insidemordecai.com",
};

const SOCIALS = [
  {
    label: "Spotify",
    href: "https://open.spotify.com/user/jv19tenfbkqd9so7369kfvwxa?si=29415d195d8d41f4",
    color: "bg-lime",
  },
  {
    label: "Apple Music",
    href: "https://music.apple.com/profile/insidemordecai",
    color: "bg-blush",
  },
  {
    label: "Bluesky",
    href: "https://bsky.app/profile/insidemordecai.com",
    color: "bg-aqua",
  },
  {
    label: "Threads",
    href: "https://threads.net/insidemordecai",
    color: "bg-mist",
  },
  { label: "Twitter", href: "https://x.com/insidemordecai", color: "bg-paper" },
  {
    label: "GitHub",
    href: "https://github.com/insidemordecai",
    color: "bg-acid",
  },
  {
    label: "Goodreads",
    href: "https://goodreads.com/insidemordecai",
    color: "bg-coral",
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ACCENTS = [
  "bg-purple",
  "bg-aqua",
  "bg-blush",
  "bg-lime",
  "bg-acid",
  "bg-coral",
  "bg-mist",
];

const CATEGORY_ACCENTS = {
  technical: "bg-purple",
  opinion: "bg-coral",
  updates: "bg-lime",
  web: "bg-aqua",
};

const PAGE_ACCENTS = {
  about: "bg-mist",
  links: "bg-purple",
  subscribe: "bg-lime",
  colophon: "bg-paper",
  contact: "bg-blush",
  support: "bg-acid",
  attic: "bg-coral",
};

marked.setOptions({ gfm: true, breaks: false });

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const esc = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });

function decodeEntities(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );
}

const stripTags = (value = "") => String(value).replace(/<[^>]*>/g, "");

const smartText = (value = "") => String(value).replace(/(?<!-)--(?!-)/g, "—");

const escText = (value = "") => esc(smartText(value));

function slugify(value = "") {
  return (
    String(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function formatDate(date) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatDateShort(date) {
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function countWords(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~`-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const readingTime = (words) => Math.max(1, Math.ceil(words / 200));

function excerptFromHtml(html, length = 170) {
  const match = String(html).match(/<p>([\s\S]*?)<\/p>/);
  if (!match) return "";
  const text = decodeEntities(stripTags(match[1])).replace(/\s+/g, " ").trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getAttr(attrs, name) {
  const match = String(attrs).match(
    new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`),
  );
  return match ? (match[1] ?? match[2]) : undefined;
}

function uniqueSlug(text, used) {
  const base = slugify(text);
  const count = used.get(base) || 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

/* -------------------------------------------------------------------------- */
/* Front matter                                                               */
/* -------------------------------------------------------------------------- */

function splitList(value) {
  const parts = [];
  let current = "";
  let quote = null;

  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ",") {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts
    .map((part) => part.replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseYamlValue(raw) {
  const value = String(raw).trim();
  if (value === "") return "";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  if (value.startsWith("[") && value.endsWith("]")) {
    return splitList(value.slice(1, -1).trim());
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }

  return value;
}

function parseFrontMatter(raw) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };

  const data = {};
  let lastKey = null;

  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && lastKey) {
      if (!Array.isArray(data[lastKey])) {
        data[lastKey] = data[lastKey] ? [data[lastKey]] : [];
      }
      data[lastKey].push(parseYamlValue(listItem[1]));
      continue;
    }

    if (/^\s/.test(line) && lastKey && typeof data[lastKey] === "string") {
      data[lastKey] = `${data[lastKey]} ${line.trim()}`.trim();
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    data[key] = value === "" ? [] : parseYamlValue(value);
    lastKey = key;
  }

  return { data, body: raw.slice(match[0].length) };
}

/* -------------------------------------------------------------------------- */
/* Content discovery                                                          */
/* -------------------------------------------------------------------------- */

function findContentFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findContentFiles(fullPath));
    else if (entry.name === "index.md") files.push(fullPath);
  }
  return files;
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function loadContent() {
  const files = findContentFiles(CONTENT_DIR);
  const items = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontMatter(raw);

    if (data.draft === true) continue;

    const rel = path.relative(CONTENT_DIR, file).split(path.sep).join("/");
    const section = rel.split("/")[0];
    const dir = path.dirname(file);
    const isPost = section === "posts";
    const isAttic = section === "attic";
    const fallbackSlug = path
      .basename(dir)
      .replace(/^\d{6}-/, "");
    const slug = String(data.slug || (isPost ? fallbackSlug : section));
    const url = isPost || isAttic ? `/${slug}/` : `/${section}/`;

    const date = new Date(data.date);
    if (Number.isNaN(date.getTime())) {
      console.warn(`  ! invalid or missing date: ${rel}`);
    }

    items.push({
      file,
      dir,
      rel,
      section,
      type: isPost ? "post" : "page",
      isAttic,
      slug,
      url,
      title: smartText(String(data.title || slug)),
      summary: smartText(String(data.summary || data.description || "")),
      hasSummary: Boolean(data.summary || data.description),
      description: smartText(String(data.description || data.summary || "")),
      gallery: String(data.gallery || "").toLowerCase(),
      date: Number.isNaN(date.getTime()) ? new Date(0) : date,
      categories: asArray(data.categories).map(String),
      tags: asArray(data.tags).map(String),
      series: asArray(data.series).map(String),
      aliases: asArray(data.aliases).map(String),
      body,
      html: "",
      toc: [],
      readingTime: 1,
      wordCount: 0,
    });
  }

  items.sort((a, b) => b.date - a.date || a.title.localeCompare(b.title));
  return items;
}

function buildRefMap(items) {
  const map = new Map();

  for (const item of items) {
    const keys = new Set([
      item.rel,
      item.rel.replace(/\/index\.md$/, ""),
      item.rel.replace(/^content\//, ""),
      item.rel.replace(/^content\//, "").replace(/\/index\.md$/, ""),
    ]);

    if (item.type === "post") {
      keys.add(`posts/${path.basename(item.dir)}`);
      keys.add(`posts/${path.basename(item.dir)}/index.md`);
      keys.add(item.slug);
      keys.add(`${item.slug}/`);
    }

    for (const key of keys) map.set(key, item.url);
  }

  return map;
}

function resolveRef(raw, refMap) {
  let key = String(raw).trim().replace(/^\.?\//, "");
  if (key.startsWith("content/")) key = key.slice("content/".length);

  const candidates = [
    key,
    key.replace(/\/index\.md$/, ""),
    key.replace(/\.md$/, ""),
  ];

  for (const candidate of candidates) {
    if (refMap.has(candidate)) return refMap.get(candidate);
  }

  console.warn(`  ! unresolved ref: ${raw}`);
  return "#";
}

/* -------------------------------------------------------------------------- */
/* Markdown rendering                                                         */
/* -------------------------------------------------------------------------- */

const REF_RE = /\{\{<\s*ref\s*"?([^">\s]+)"?\s*>\}\}/g;
const ALERT_RE =
  /\{\{<\s*alert(?:\s+"([^"]*)")?\s*>\}\}([\s\S]*?)\{\{<\s*\/\s*alert\s*>\}\}/g;
const ACCORDION_RE =
  /\{\{<\s*accordion\s*>\}\}([\s\S]*?)\{\{<\s*\/\s*accordion\s*>\}\}/g;
const ACCORDION_ITEM_RE =
  /\{\{<\s*accordionItem\s+title="([^"]*)"(?:\s+open=(true|false))?\s*>\}\}([\s\S]*?)\{\{<\s*\/\s*accordionItem\s*>\}\}/g;
const CAROUSEL_RE = /\{\{<\s*carousel\s+images="([^"]+)"\s*>\}\}/g;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveGlob(dir, pattern) {
  const parts = String(pattern).split("/");
  const namePattern = parts.pop();
  let base = dir;

  for (const part of parts) base = path.join(base, part);
  if (!fs.existsSync(base)) return [];

  const matcher = new RegExp(
    `^${namePattern.split("*").map(escapeRegExp).join(".*")}$`,
  );

  return fs
    .readdirSync(base)
    .filter((file) => matcher.test(file))
    .sort()
    .map((file) => path.join(base, file));
}

function renderGallery(pattern, item) {
  const files = resolveGlob(item.dir, pattern);
  if (files.length === 0) return "";

  const images = files.map((file) => {
    const relative = path
      .relative(item.dir, file)
      .split(path.sep)
      .join("/");
    const alt = path.basename(file, path.extname(file)).replace(/[-_]+/g, " ");
    return { src: relative, alt, title: "" };
  });

  return galleryMarkup(images, "grid");
}

const IMAGE_LINE_RE =
  /^\s*!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"([^"]*)")?\s*\)\s*$/;

/**
 * Collect a run of Markdown images sitting at the very end of a post.
 * These are usually screenshots that deserve a gallery rather than a
 * mile-long stack of full-width images.
 */
function extractTrailingImages(source) {
  const lines = source.split("\n");
  let index = lines.length - 1;

  while (index >= 0 && lines[index].trim() === "") index -= 1;

  const images = [];
  while (index >= 0) {
    const line = lines[index];
    if (line.trim() === "") {
      index -= 1;
      continue;
    }
    const match = line.match(IMAGE_LINE_RE);
    if (!match) break;
    images.unshift({
      alt: match[1],
      src: match[2],
      title: match[3] || "",
    });
    index -= 1;
  }

  if (images.length < 2) return null;
  return { source: lines.slice(0, index + 1).join("\n"), images };
}

function galleryMode(item, count) {
  const preference = String(item.gallery || "").toLowerCase();
  if (["off", "none", "false"].includes(preference)) return null;
  if (preference === "carousel" || preference === "grid") return preference;
  return count >= 5 ? "carousel" : "grid";
}

function galleryMarkup(images, mode, label = "Image gallery") {
  const figures = images
    .map((image) => {
      const caption = image.title
        ? `<figcaption>${escText(image.title)}</figcaption>`
        : "";
      return `<figure><img src="${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy" decoding="async">${caption}</figure>`;
    })
    .join("");

  if (mode === "carousel") {
    return `<div class="neo-carousel" role="region" aria-label="${esc(label)}" tabindex="0"><p class="neo-carousel-hint" aria-hidden="true">Scroll →</p><div class="neo-carousel-track">${figures}</div></div>`;
  }

  return `<div class="neo-gallery" role="group" aria-label="${esc(label)}">${figures}</div>`;
}

const ALERT_LABELS = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  edit: "Work in progress",
};

function alertBlock(kind, bodyHtml, label) {
  const safeKind = ALERT_LABELS[kind] ? kind : "note";
  return `<div class="neo-alert neo-alert-${safeKind}"><p class="neo-alert-label">${escText(label || ALERT_LABELS[safeKind])}</p><div class="neo-alert-body">${bodyHtml}</div></div>`;
}

/** Turn GitHub-style blockquote alerts (`> [!NOTE]`) into callouts. */
function convertGfmAlerts(html) {
  return String(html).replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (match, inner) => {
    const marker = inner.match(
      /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/i,
    );
    if (!marker) return match;

    const kind = marker[1].toLowerCase();
    const body = inner
      .replace(
        /^\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/i,
        "<p>",
      )
      .replace(/<p>\s*<\/p>/g, "");

    return alertBlock(kind, body);
  });
}

/** Render `--` as an em dash in prose, never inside code or attributes. */
function smartDashes(html) {
  const parts = String(html).split(/(<[^>]+>)/);
  let codeDepth = 0;

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<(code|pre|script|style|textarea)\b/i.test(part)) codeDepth += 1;
        else if (/^<\/(code|pre|script|style|textarea)>/i.test(part)) {
          codeDepth = Math.max(0, codeDepth - 1);
        }
        return part;
      }
      if (codeDepth > 0) return part;
      return part.replace(/(?<!-)--(?!-)/g, "—");
    })
    .join("");
}

function renderMarkdown(markdown, item, refMap) {
  let source = String(markdown);

  // Resolve Hugo ref shortcodes to real URLs.
  source = source.replace(REF_RE, (_, ref) => resolveRef(ref, refMap));

  const blocks = [];

  // Hugo alert shortcodes -> neobrutalist callouts.
  source = source.replace(ALERT_RE, (_, type, inner) => {
    const requested = (type || "note").toLowerCase();
    const kind = requested === "edit"
      ? "edit"
      : requested.includes("warn")
        ? "warning"
        : requested.includes("danger")
          ? "caution"
          : requested.includes("tip")
            ? "tip"
            : "note";
    const label = kind === "edit" ? "Work in progress" : "";
    const index = blocks.length;
    const bodyHtml = marked.parse(inner.trim());
    blocks.push(alertBlock(kind, bodyHtml, label));
    return `\n\n%%NEO_BLOCK_${index}%%\n\n`;
  });

  // Hugo accordion shortcodes -> native <details> elements.
  source = source.replace(ACCORDION_RE, (_, inner) => {
    const index = blocks.length;
    const details = inner.replace(
      ACCORDION_ITEM_RE,
      (__, title, open, itemBody) => {
        const isOpen = open === "true";
        const bodyHtml = marked.parse(itemBody.trim());
        return `<details class="neo-details"${isOpen ? " open" : ""}><summary>${esc(title)}</summary><div class="neo-details-body">${bodyHtml}</div></details>`;
      },
    );
    blocks.push(`<div class="neo-accordion">${details}</div>`);
    return `\n\n%%NEO_BLOCK_${index}%%\n\n`;
  });

  // Hugo carousel shortcode -> CSS-only image grid.
  source = source.replace(CAROUSEL_RE, (_, pattern) => {
    const index = blocks.length;
    const gallery = renderGallery(pattern, item);
    if (!gallery) return "";
    blocks.push(gallery);
    return `\n\n%%NEO_BLOCK_${index}%%\n\n`;
  });

  // Drop any remaining shortcodes so they never leak into the final HTML.
  source = source
    .replace(/\{\{[<%][\s\S]*?[%>]\}\}/g, "")
    .replace(/<!--\s*more\s*-->/gi, "");

  // A trailing run of images becomes a grid or a scroll-snap carousel.
  const trailing = extractTrailingImages(source);
  if (trailing) {
    const mode = galleryMode(item, trailing.images.length);
    if (mode) {
      const index = blocks.length;
      blocks.push(galleryMarkup(trailing.images, mode));
      source = `${trailing.source}\n\n%%NEO_BLOCK_${index}%%\n\n`;
    }
  }

  let html = marked.parse(source);
  if (typeof html !== "string") html = String(html);

  // Re-insert the HTML blocks generated above.
  html = html
    .replace(
      /<p>\s*%%NEO_BLOCK_(\d+)%%\s*<\/p>/g,
      (_, index) => blocks[Number(index)] || "",
    )
    .replace(/%%NEO_BLOCK_(\d+)%%/g, (_, index) => blocks[Number(index)] || "");

  html = convertGfmAlerts(html);

  const { html: withIds, toc } = addHeadingIds(html);
  html = enhanceImages(withIds);
  html = wrapTables(html);
  html = externalizeLinks(html);
  html = smartDashes(html);

  return { html, toc };
}

function addHeadingIds(html) {
  const toc = [];
  const used = new Map();

  const output = html.replace(
    /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (match, level, attrs, inner) => {
      const levelNumber = Number(level);
      const existingId = getAttr(attrs, "id");
      const text = decodeEntities(stripTags(inner)).replace(/\s+/g, " ").trim();
      const id = existingId || uniqueSlug(text, used);

      if ((levelNumber === 2 || levelNumber === 3) && text) {
        toc.push({ level: levelNumber, text, id });
      }

      if (existingId) return match;

      return `<h${level}${attrs} id="${esc(id)}">${inner}<a class="heading-anchor" href="#${esc(id)}" aria-label="Link to this section">#</a></h${level}>`;
    },
  );

  return { html: output, toc };
}

function enhanceImages(html) {
  let output = html.replace(/<img\b([^>]*?)\/?>/g, (match, attrs) => {
    const src = getAttr(attrs, "src");
    if (!src) return match;

    const title = getAttr(attrs, "title");
    let clean = attrs
      .replace(/\s+title=("[^"]*"|'[^']*')/, "")
      .replace(/\s*\/\s*$/, "");

    if (!/\bloading=/.test(clean)) clean += ' loading="lazy"';
    if (!/\bdecoding=/.test(clean)) clean += ' decoding="async"';

    const image = `<img${clean}>`;
    if (!title) return image;

    return `<figure class="neo-figure">${image}<figcaption>${title}</figcaption></figure>`;
  });

  // A standalone image should not sit inside a paragraph (invalid HTML).
  output = output
    .replace(
      /<p>\s*(<figure class="neo-figure">[\s\S]*?<\/figure>)\s*<\/p>/g,
      "$1",
    )
    .replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g, "$1");

  return output;
}

function wrapTables(html) {
  return html
    .replace(/<table>/g, '<div class="neo-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

function externalizeLinks(html) {
  return html.replace(/<a\b([^>]*)>/g, (match, attrs) => {
    const hrefMatch = attrs.match(/\bhref=(["'])(.*?)\1/i);
    if (!hrefMatch) return match;

    const href = hrefMatch[2].trim();
    if (!/^(?:https?:)?\/\//i.test(href)) return match;

    let sameSite = false;
    try {
      sameSite = new URL(href, SITE.url).host === new URL(SITE.url).host;
    } catch {
      return match;
    }
    if (sameSite) return match;

    let next = attrs;
    if (/\btarget=(["']).*?\1/i.test(next)) {
      next = next.replace(/\btarget=(["']).*?\1/i, 'target="_blank"');
    } else {
      next += ' target="_blank"';
    }

    const relMatch = next.match(/\brel=(["'])(.*?)\1/i);
    if (relMatch) {
      const tokens = relMatch[2].split(/\s+/).filter(Boolean);
      for (const token of ["noopener", "noreferrer"]) {
        if (!tokens.some((value) => value.toLowerCase() === token)) {
          tokens.push(token);
        }
      }
      next = next.replace(relMatch[0], `rel="${tokens.join(" ")}"`);
    } else {
      next += ' rel="noopener noreferrer"';
    }

    return `<a${next}>`;
  });
}

/* -------------------------------------------------------------------------- */
/* Shared template fragments                                                  */
/* -------------------------------------------------------------------------- */

function categoryAccent(name) {
  const key = String(name).toLowerCase();
  return (
    CATEGORY_ACCENTS[key] ||
    ACCENTS[hashString(String(name)) % ACCENTS.length]
  );
}

function accentFor(post) {
  const category = (post.categories[0] || "").toLowerCase();
  return (
    CATEGORY_ACCENTS[category] ||
    ACCENTS[hashString(post.slug) % ACCENTS.length]
  );
}

function mutedCategoryLinks(post) {
  return post.categories
    .map(
      (category) =>
        `<a class="hover:text-ink hover:underline" href="/categories/${slugify(category)}/">${esc(category)}</a>`,
    )
    .join(`<span class="mx-1.5" aria-hidden="true">·</span>`);
}

function mutedTagLinks(post, limit = 99) {
  return post.tags
    .slice(0, limit)
    .map(
      (tag) =>
        `<a class="hover:text-ink hover:underline" href="/tags/${slugify(tag)}/">#${esc(tag)}</a>`,
    )
    .join("");
}

function seriesNav(post, allPosts) {
  if (!post.series.length) return "";

  const blocks = post.series
    .map((name) => {
      const entries = allPosts
        .filter((item) => item.series.includes(name))
        .sort((a, b) => a.date - b.date);
      const position = entries.findIndex((item) => item.slug === post.slug) + 1;
      const items = entries
        .map((entry, index) => {
          const current = entry.slug === post.slug;
          return `<li><a class="series-item${current ? " is-current" : ""}" href="${entry.url}"${current ? ' aria-current="page"' : ""}><span class="series-item-number">${String(index + 1).padStart(2, "0")}</span><span class="min-w-0"><span class="series-item-title">${esc(entry.title)}</span><span class="series-item-meta">${formatDateShort(entry.date)}${current ? " · You are here" : ""}</span></span></a></li>`;
        })
        .join("");

      return `<details class="series-nav group">
        <summary class="series-summary">
          <span class="font-mono text-[10px] uppercase tracking-widest opacity-60">Series</span>
          <span class="font-black uppercase tracking-tight">${esc(name)}</span>
          <span class="tag bg-purple">Part ${position} of ${entries.length}</span>
          <span class="series-chevron ml-auto" aria-hidden="true">▾</span>
        </summary>
        <ol class="series-list">${items}</ol>
      </details>`;
    })
    .join("");

  return `<div class="mt-5 max-w-2xl space-y-3">${blocks}</div>`;
}

function socialChips() {
  return SOCIALS.map(
    (social) =>
      `<a class="social-chip ${social.color}" href="${social.href}" rel="me">${esc(social.label)} <span aria-hidden="true">↗</span></a>`,
  ).join("");
}

function tocBox(toc) {
  if (toc.length < 2) return "";

  const links = toc
    .map(
      (heading) =>
        `<li class="${heading.level === 3 ? "pl-4" : ""}"><a class="toc-link" href="#${esc(heading.id)}">${esc(heading.text)}</a></li>`,
    )
    .join("");

  return `<nav aria-label="Table of contents" class="border-[3px] border-ink bg-paper p-4 shadow-brutal-sm"><p class="font-black uppercase tracking-tight">On this page</p><ul class="mt-3 max-h-[calc(100vh-12rem)] space-y-1.5 overflow-auto text-sm">${links}</ul></nav>`;
}

function replyCta(title) {
  const subject = encodeURIComponent(`Re: ${title}`);
  return `<div class="mt-12 border-[3px] border-ink bg-acid p-6 shadow-brutal sm:flex sm:items-center sm:justify-between sm:gap-6"><div><p class="text-xl font-black uppercase tracking-tight">Got thoughts?</p><p class="mt-1 text-sm font-bold">Reply by email — I read everything.</p></div><a class="btn mt-4 bg-paper sm:mt-0" href="mailto:${SITE.email}?subject=${subject}">Reply by email →</a></div>`;
}

function postCard(post) {
  const badges = post.categories
    .map(
      (category) =>
        `<a class="tag ${categoryAccent(category)} hover:-translate-y-0.5" href="/categories/${slugify(category)}/">${esc(category)}</a>`,
    )
    .join("");
  return `<article class="card flex h-full flex-col p-5"><div class="flex flex-wrap items-center justify-between gap-2"><span class="flex flex-wrap gap-1.5">${badges}</span><time class="font-mono text-[11px] uppercase tracking-widest text-ink/60" datetime="${isoDate(post.date)}">${formatDateShort(post.date)}</time></div><h3 class="mt-4 text-xl font-black leading-tight tracking-tight"><a class="decoration-3 decoration-teal underline-offset-4 hover:underline" href="${post.url}">${esc(post.title)}</a></h3><p class="mt-2 text-sm leading-relaxed text-ink/75">${esc(post.summary)}</p><div class="mt-auto flex items-center justify-between gap-3 border-t-2 border-dashed border-ink/20 pt-3"><span class="font-mono text-[11px] uppercase tracking-wide text-ink/60">${post.readingTime} min read</span><a class="font-mono text-[11px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:bg-acid" href="${post.url}" aria-label="Read ${esc(post.title)}">Read →</a></div></article>`;
}

function postRow(post) {
  const mobileBadges = post.categories
    .map(
      (category) =>
        `<a class="tag ${categoryAccent(category)} hover:-translate-y-0.5" href="/categories/${slugify(category)}/">${esc(category)}</a>`,
    )
    .join("");
  const desktopMeta = `${post.categories.length ? mutedCategoryLinks(post) : ""}${post.categories.length ? '<span aria-hidden="true">·</span>' : ""}<span>${post.readingTime} min read</span>`;
  return `<article class="border-[3px] border-ink bg-paper p-4 shadow-brutal-sm transition-shadow hover:shadow-brutal sm:grid sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-4 sm:p-5"><div class="hidden items-center gap-3 sm:flex sm:flex-col sm:items-start sm:gap-1"><div class="border-2 border-ink ${accentFor(post)} px-2 py-1 text-center font-mono text-xs font-black uppercase"><span class="block text-xl leading-none">${post.date.getUTCDate()}</span><span>${MONTHS_SHORT[post.date.getUTCMonth()]}</span></div><span class="font-mono text-xs text-ink/60">${post.date.getUTCFullYear()}</span></div><div class="min-w-0"><div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:hidden"><span class="flex flex-wrap items-center gap-x-2"><time datetime="${isoDate(post.date)}">${formatDateShort(post.date)}</time><span aria-hidden="true">·</span><span>${post.readingTime} min read</span></span><span class="flex flex-wrap justify-end gap-1.5">${mobileBadges}</span></div><div class="hidden flex-wrap items-center gap-x-2 font-mono text-[11px] uppercase tracking-widest text-ink/60 sm:flex">${desktopMeta}</div><h3 class="mt-3 text-xl font-black leading-tight tracking-tight sm:mt-2 sm:text-2xl"><a class="decoration-3 decoration-teal underline-offset-4 hover:underline" href="${post.url}">${esc(post.title)}</a></h3><p class="mt-1.5 text-sm leading-relaxed text-ink/75">${esc(post.summary)}</p><div class="mt-3 flex flex-wrap items-center justify-between gap-2"><div class="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-ink/60">${mutedTagLinks(post, 4)}</div><a class="font-mono text-[11px] font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:bg-acid" href="${post.url}" aria-label="Read ${esc(post.title)}">Read →</a></div></div></article>`;
}

function pager(currentPage, totalPages, base = "/posts/") {
  if (totalPages <= 1) return "";

  const pageUrl = (page) => (page === 1 ? base : `${base}page/${page}/`);
  const pageLinks = [];

  for (let page = 1; page <= totalPages; page += 1) {
    pageLinks.push(
      `<a class="inline-flex h-10 min-w-10 items-center justify-center border-[3px] border-ink px-3 font-mono text-sm font-black ${page === currentPage ? "bg-ink text-paper" : "bg-paper hover:bg-acid"}" href="${pageUrl(page)}"${page === currentPage ? ' aria-current="page"' : ""}>${page}</a>`,
    );
  }

  return `<nav aria-label="Pagination" class="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-4 border-ink pt-6"><a class="btn bg-paper ${currentPage === 1 ? "pointer-events-none opacity-40" : ""}" href="${pageUrl(Math.max(1, currentPage - 1))}"${currentPage === 1 ? ' aria-disabled="true"' : ""}>← Newer</a><div class="flex flex-wrap gap-2">${pageLinks.join("")}</div><a class="btn bg-paper ${currentPage === totalPages ? "pointer-events-none opacity-40" : ""}" href="${pageUrl(Math.min(totalPages, currentPage + 1))}"${currentPage === totalPages ? ' aria-disabled="true"' : ""}>Older →</a></nav>`;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

function layout({
  title = "",
  description = "",
  urlPath = "/",
  nav = "",
  content = "",
  ogType = "website",
  published = "",
  noIndex = false,
}) {
  const fullTitle = title
    ? `${title} · ${SITE.title}`
    : `${SITE.title} · ${SITE.tagline}`;
  const metaDescription = description || SITE.description;
  const canonical = `${SITE.url}${urlPath}`;
  const ogImage = `${SITE.url}/assets/img/social-image.webp`;

  const navItems = [
    ["about", "About", "/about/"],
    ["posts", "Posts", "/posts/"],
    ["links", "Links", "/links/"],
    ["subscribe", "Subscribe", "/subscribe/"],
  ];

  const navHtml = navItems
    .map(
      ([key, label, href]) =>
        `<a class="nav-link" href="${href}"${nav === key ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join("");

  const searchTrigger = `<a class="search-trigger" href="/posts/" data-search-open aria-label="Search posts" aria-haspopup="dialog" aria-controls="search-dialog" aria-keyshortcuts="Meta+K Control+K"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg><span class="search-keys" aria-hidden="true"><kbd class="search-kbd" data-kbd-mod>Ctrl</kbd><kbd class="search-kbd search-kbd-key">K</kbd></span></a>`;

  return externalizeLinks(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(metaDescription)}">
  <meta name="author" content="${esc(SITE.title)}">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#009bad" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0a1114" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="stylesheet" href="/assets/style.css">
  <noscript><style>@media (max-width:639px){.site-nav{display:flex!important;order:3;flex-basis:100%;flex-direction:column;align-items:stretch;gap:0;margin-top:.5rem;border-top:3px solid var(--color-ink);padding-top:.5rem}.site-nav .nav-link{display:block;border-width:0 0 2px;border-style:dashed;border-color:color-mix(in srgb,var(--color-ink) 25%,transparent);padding:.7rem .75rem}.site-nav .nav-link:last-child{border-bottom:0}.nav-toggle{display:none!important}.logo-name{display:block!important}.logo-mark{display:none!important}}</style></noscript>
  <link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)}" href="${SITE.url}/index.xml">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="${esc(ogType)}">
  <meta property="og:title" content="${esc(title || SITE.title)}">
  <meta property="og:description" content="${esc(metaDescription)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:site_name" content="${esc(SITE.title)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title || SITE.title)}">
  <meta name="twitter:description" content="${esc(metaDescription)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  ${published && ogType === "article" ? `<meta property="article:published_time" content="${esc(published)}">` : ""}
  ${noIndex ? '<meta name="robots" content="noindex">' : ""}
</head>
<body id="top" class="flex min-h-screen flex-col bg-canvas font-sans text-ink antialiased">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="sticky top-0 z-50 border-b-4 border-ink bg-paper">
    <div class="nav-shell mx-auto max-w-6xl px-4 py-3">
      <a class="group flex min-w-0 items-center" href="/" aria-label="${esc(SITE.title)} — home">
        <span class="logo-mark h-10 w-10 place-items-center border-[3px] border-ink bg-teal font-black shadow-brutal-sm transition-transform group-hover:-rotate-3">MK</span>
        <span class="logo-name truncate text-[13px] font-black uppercase tracking-tight">${esc(SITE.title)}</span>
      </a>
      <nav id="site-nav" aria-label="Main" class="site-nav text-xs font-bold sm:text-sm">${navHtml}</nav>
      <div class="nav-controls">
        ${searchTrigger}
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
          <span class="nav-toggle-bars" aria-hidden="true"><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span></span>
        </button>
      </div>
    </div>
  </header>
  <main id="main" class="flex-1">${content}</main>
  <footer class="site-footer border-t-4 border-ink">
    <div class="mx-auto max-w-6xl px-4 py-10">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <a class="inline-flex items-center gap-3" href="/" aria-label="${esc(SITE.title)} — home">
          <span class="grid h-10 w-10 place-items-center border-[3px] border-ink bg-acid font-black">MK</span>
          <span class="text-sm font-black uppercase tracking-tight">${esc(SITE.title)}</span>
        </a>
        <nav aria-label="Footer">
          <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <li><a href="/categories/">Categories</a></li>
            <li><a href="/tags/">Tags</a></li>
            <li><a href="/series/">Series</a></li>
            <li><a href="/contact/">Contact</a></li>
            <li><a href="/support/">Support</a></li>
            <li><a href="/colophon/">Colophon</a></li>
            <li><a href="/index.xml">RSS</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
  <a class="back-to-top" id="back-to-top" href="#top" aria-label="Back to top"><span aria-hidden="true">↑</span><span class="back-to-top-label">Top</span></a>
  <dialog id="search-dialog" class="search-dialog" aria-labelledby="search-dialog-title">
    <div class="search-panel">
      <h2 id="search-dialog-title" class="sr-only">Search posts</h2>
      <div class="search-bar">
        <svg class="search-bar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg>
        <label class="sr-only" for="search-input">Search posts</label>
        <input id="search-input" class="search-input" type="search" placeholder="Search posts…" autocomplete="off" spellcheck="false" aria-controls="search-results" aria-describedby="search-help">
        <button class="search-close" type="button" data-search-close aria-label="Close search">Esc</button>
      </div>
      <p class="search-help" id="search-help">Titles, tags, categories, and full text. Use <kbd data-kbd-mod>Ctrl</kbd> <kbd>K</kbd> to open, ↑↓ to move, Enter to read.</p>
      <div class="search-results" id="search-results" role="list" aria-label="Search results"></div>
      <p class="search-status" id="search-status" role="status" aria-live="polite"></p>
    </div>
  </dialog>
  <script src="/assets/site.js" defer></script>
</body>
</html>`);
}

/* -------------------------------------------------------------------------- */
/* Page templates                                                             */
/* -------------------------------------------------------------------------- */

function homePage(posts, categories) {
  const recent = posts.slice(0, POSTS_PER_HOME);
  const latest = posts[0]?.date || new Date();

  const categoryOverflows = categories.length > HOME_CATEGORY_TILES;
  const visibleCategories = categoryOverflows
    ? categories.slice(0, HOME_CATEGORY_TILES - 1)
    : categories;

  const categoryCards = visibleCategories
    .map(
      (category) =>
        `<a class="group border-[3px] border-ink bg-paper p-4 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal" href="/categories/${category.slug}/"><span class="block h-1.5 w-10 ${categoryAccent(category.name)}"></span><div class="mt-4 flex items-baseline justify-between gap-3"><p class="text-lg font-black uppercase tracking-tight">${esc(category.name)}</p><span class="font-mono text-[11px] text-ink/60">${category.posts.length}</span></div></a>`,
    )
    .join("");

  const allCategoriesTile = categoryOverflows
    ? `<a class="group flex flex-col justify-between border-[3px] border-ink bg-ink p-4 text-paper shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal" href="/categories/"><span class="block h-1.5 w-10 bg-acid"></span><div class="mt-4 flex items-baseline justify-between gap-3"><p class="text-lg font-black uppercase tracking-tight">All ${categories.length} categories</p><span aria-hidden="true" class="font-black">→</span></div></a>`
    : "";

  const content = `
  <section class="relative overflow-hidden border-b-4 border-ink">
    <div class="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
      <div>
        <div class="flex flex-wrap gap-2">
          <span class="tag bg-teal">Personal website</span>
          <span class="tag bg-aqua">Blog</span>
          <span class="tag bg-paper">Since 2022</span>
        </div>
        <h1 class="mt-6 break-words text-[2.65rem] font-black uppercase leading-[0.88] tracking-tighter sm:text-7xl">Hi, I’m<br><span class="mark px-1">Mordecai</span></h1>
        <p class="mt-5 max-w-xl text-lg font-bold leading-snug text-ink/80 sm:text-xl">But you can call me Mordz. ${esc(SITE.tagline)}</p>
        <p class="mt-3 max-w-xl text-base leading-relaxed text-ink/80">I’m a STEM instructor and freelance software developer. I write about tech, media, books, music, homelabs, and the occasional tangent.</p>
        <div class="mt-6 flex flex-wrap gap-2">${socialChips()}</div>
      </div>
      <div class="relative mx-auto hidden w-full max-w-[320px] md:block">
        <div class="rotate-2 border-4 border-ink bg-aqua p-3 shadow-brutal">
          <img src="/assets/img/profile.webp" alt="${esc(SITE.title)}" width="1080" height="1080" class="aspect-square w-full border-[3px] border-ink object-cover" fetchpriority="high">
          <p class="mt-3 border-2 border-ink bg-paper px-2 py-1 text-center font-mono text-[10px] uppercase tracking-widest">${esc(SITE.location)}</p>
        </div>
        <span class="absolute -bottom-8 left-2 rotate-[-4deg] border-[3px] border-ink bg-acid px-3 py-2 text-xs font-black uppercase shadow-brutal-sm">not from Regular Show</span>
        <span class="absolute -right-3 -top-3 rotate-6 border-[3px] border-ink bg-blush px-2 py-1 font-mono text-[10px] font-black shadow-brutal-sm">Heyyy!!!</span>
      </div>
    </div>
  </section>
  <section class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-widest text-ink/60">Fresh off the keyboard</p>
        <h2 class="text-3xl font-black uppercase tracking-tight sm:text-4xl">Recent posts</h2>
      </div>
      <a class="btn w-full justify-center bg-paper sm:w-auto" href="/posts/">All ${posts.length} posts →</a>
    </div>
    <div class="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">${recent.map(postCard).join("")}</div>
  </section>
  <section class="border-y-4 border-ink bg-mist/70">
    <div class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="font-mono text-xs uppercase tracking-widest text-ink/60">Pick a rabbit hole</p>
          <h2 class="text-3xl font-black uppercase tracking-tight sm:text-4xl">Browse by category</h2>
        </div>
      </div>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${categoryCards}${allCategoriesTile}</div>
    </div>
  </section>
  <section class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <div class="grid gap-6 border-[3px] border-ink bg-acid p-6 shadow-brutal sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p class="font-mono text-xs uppercase tracking-widest">Say hello</p>
        <h2 class="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl">Got a project, a question, or just want to chat?</h2>
        <p class="on-accent-muted mt-3 max-w-xl text-sm font-bold leading-relaxed sm:text-base">If you want to collaborate, share a link or a book, report a bug, or simply say hi, I’m all ears. Also, you can just subscribe if you prefer to keep up quietly.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a class="btn bg-paper" href="/contact/">Get in touch →</a>
        <a class="btn bg-ink text-paper" href="/subscribe/">Subscribe</a>
      </div>
    </div>
  </section>`;

  return layout({
    title: "",
    description: SITE.description,
    urlPath: "/",
    nav: "",
    content,
    published: isoDate(latest),
  });
}

function postsPage(posts, page, totalPages, categories) {
  const start = (page - 1) * PAGE_SIZE;
  const pagePosts = posts.slice(start, start + PAGE_SIZE);
  const latest = posts[0]?.date || new Date();

  const groups = new Map();
  for (const post of pagePosts) {
    const year = post.date.getUTCFullYear();
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(post);
  }

  const rows = [...groups.entries()]
    .map(
      ([year, yearPosts]) => `<section class="mt-10 first:mt-0"><div class="flex items-center gap-3"><h2 class="border-[3px] border-ink bg-ink px-3 py-1 font-mono text-lg font-black text-paper shadow-brutal-sm">${year}</h2><div class="h-[3px] flex-1 bg-ink"></div><span class="font-mono text-[11px] uppercase text-ink/60">${yearPosts.length} post${yearPosts.length === 1 ? "" : "s"}</span></div><div class="mt-5 space-y-4">${yearPosts.map(postRow).join("")}</div></section>`,
    )
    .join("");

  const categoryLinks = categories
    .map(
      (category) =>
        `<a class="font-mono text-[11px] uppercase tracking-wide text-ink/60 hover:text-ink hover:underline" href="/categories/${category.slug}/">${esc(category.name)} <span class="text-ink/50">${category.posts.length}</span></a>`,
    )
    .join("");

  const title = page === 1 ? "Posts" : `Posts — page ${page}`;
  const content = `
  <header class="border-b-4 border-ink bg-teal">
    <div class="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p class="tag bg-paper">Archive</p>
      <h1 class="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">All posts</h1>
      <p class="mt-3 max-w-2xl font-bold">${posts.length} posts about tech, media, books, music, homelabs, and life. No algorithms, no infinite scroll.</p>
      <div class="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs"><span class="chip">Page ${page} / ${totalPages}</span><span class="chip">${PAGE_SIZE} per page</span></div>
    </div>
  </header>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2"><span class="font-mono text-[11px] uppercase tracking-widest text-ink/60">Jump to</span>${categoryLinks}</div>
    ${rows}
    ${pager(page, totalPages)}
  </div>`;

  return layout({
    title,
    description: `All ${posts.length} posts on ${SITE.title} — tech, media, books, music, homelabs, and life.`,
    urlPath: page === 1 ? "/posts/" : `/posts/page/${page}/`,
    nav: "posts",
    content,
    published: isoDate(latest),
  });
}

function postPage(post, allPosts) {
  const index = allPosts.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? allPosts[index - 1] : null;
  const older = index >= 0 && index < allPosts.length - 1 ? allPosts[index + 1] : null;
  const accent = accentFor(post);
  const metaTone = accent === "bg-mist" ? "text-ink/60" : "on-accent-muted";
  const toc = tocBox(post.toc);
  const hasToc = post.toc.length >= 2;

  const filedUnder = `<div class="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-2 border-ink/20 pt-5 font-mono text-xs"><span class="uppercase tracking-widest text-ink/60">Filed under</span>${post.categories
    .map(
      (category) =>
        `<a class="underline decoration-ink/25 underline-offset-4 hover:decoration-ink" href="/categories/${slugify(category)}/">${esc(category)}</a>`,
    )
    .join("")}${post.tags
    .map(
      (tag) =>
        `<a class="text-ink/60 hover:text-ink hover:underline" href="/tags/${slugify(tag)}/">#${esc(tag)}</a>`,
    )
    .join("")}</div>`;

  const prevNext = `<nav aria-label="Post navigation" class="mt-10 grid gap-4 sm:grid-cols-2">${
    newer
      ? `<a class="card p-5" href="${newer.url}"><p class="font-mono text-[10px] uppercase tracking-widest text-ink/60">← Newer</p><p class="mt-2 font-black leading-tight">${esc(newer.title)}</p></a>`
      : ""
  }${
    older
      ? `<a class="card p-5 sm:text-right" href="${older.url}"><p class="font-mono text-[10px] uppercase tracking-widest text-ink/60">Older →</p><p class="mt-2 font-black leading-tight">${esc(older.title)}</p></a>`
      : ""
  }</nav>`;

  const content = `
  <header class="border-b-4 border-ink ${accent}">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav aria-label="Breadcrumb" class="font-mono text-[11px] uppercase tracking-widest"><a class="underline decoration-2 underline-offset-2 hover:bg-ink hover:text-paper" href="/">Home</a> <span aria-hidden="true">/</span> <a class="underline decoration-2 underline-offset-2 hover:bg-ink hover:text-paper" href="/posts/">Posts</a></nav>
      ${seriesNav(post, allPosts)}
      <h1 class="mt-5 max-w-4xl break-words text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">${esc(post.title)}</h1>
      <p class="mt-4 max-w-3xl text-lg font-bold leading-snug">${esc(post.summary)}</p>
      <div class="${metaTone} mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest"><time datetime="${isoDate(post.date)}">${formatDate(post.date)}</time><span aria-hidden="true">·</span><span>${post.readingTime} min read</span></div>
    </div>
  </header>
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div class="grid gap-8 ${hasToc ? "lg:grid-cols-[220px_minmax(0,1fr)]" : ""}">
      ${hasToc ? `<aside class="h-fit lg:sticky lg:top-24">${toc}</aside>` : ""}
      <div class="min-w-0">
        <article class="prose-neo max-w-3xl ${hasToc ? "" : "mx-auto"}">${post.html}</article>
        ${filedUnder}
        ${replyCta(post.title)}
        ${prevNext}
        <div class="mt-8"><a class="font-black underline decoration-4 decoration-teal underline-offset-4 hover:bg-acid" href="/posts/">← Back to all posts</a></div>
      </div>
    </div>
  </div>`;

  return layout({
    title: post.title,
    description: post.description || post.summary,
    urlPath: post.url,
    nav: "posts",
    content,
    ogType: "article",
    published: post.date.toISOString(),
  });
}

function pageActions(section) {
  switch (section) {
    case "about":
      return `<div class="mt-5 flex flex-wrap gap-2">${socialChips()}</div>`;
    case "contact":
      return `<a class="btn mt-5 bg-paper" href="mailto:${SITE.email}">${SITE.email} →</a>`;
    case "support":
      return `<div class="mt-5 flex flex-wrap gap-3"><a class="btn bg-paper" href="https://buymeacoffee.com/insidemordecai/" rel="noopener noreferrer">Buy me a coffee ↗</a><a class="btn bg-paper" href="https://ko-fi.com/insidemordecai/" rel="noopener noreferrer">Ko-fi ↗</a><a class="btn bg-ink text-paper" href="https://www.paypal.com/donate/?hosted_button_id=TMKDCYE64F7XW" rel="noopener noreferrer">PayPal ↗</a></div>`;
    case "subscribe":
      return `<a class="btn mt-5 bg-paper" href="/index.xml">Open RSS feed ↗</a>`;
    case "colophon":
      return `<a class="btn mt-5 bg-paper" href="${SITE.repo}" rel="noopener noreferrer">View source ↗</a>`;
    case "links":
      return `<a class="btn mt-5 bg-paper" href="mailto:${SITE.email}?subject=Link%20suggestion">Suggest a link →</a>`;
    default:
      return "";
  }
}

function pagePage(item) {
  const accent = PAGE_ACCENTS[item.section] || "bg-acid";
  const toc = tocBox(item.toc);
  const hasToc = item.toc.length >= 2;
  const label = item.section === "attic" ? "Attic" : "Page";
  const withReply = item.section === "links" || item.section === "attic";

  const content = `
  <header class="border-b-4 border-ink ${accent}">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p class="tag bg-paper">${label}</p>
      <h1 class="mt-4 break-words text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">${esc(item.title)}</h1>
      ${item.hasSummary ? `<p class="mt-4 max-w-2xl text-lg font-bold">${esc(item.summary)}</p>` : ""}
      ${pageActions(item.section)}
    </div>
  </header>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <div class="grid gap-8 ${hasToc ? "lg:grid-cols-[minmax(0,1fr)_240px]" : ""}">
      ${hasToc ? `<aside class="h-fit lg:order-2 lg:sticky lg:top-24">${toc}</aside>` : ""}
      <div class="min-w-0 lg:order-1">
        <article class="prose-neo max-w-3xl ${hasToc ? "" : "mx-auto"}">${item.html}</article>
        ${withReply ? replyCta(item.title) : ""}
      </div>
    </div>
  </div>`;

  return layout({
    title: item.title,
    description: item.description || item.summary,
    urlPath: item.url,
    nav: item.section,
    content,
    published: isoDate(item.date),
    noIndex: item.isAttic,
  });
}

function categoriesIndex(categories, latest) {
  const cards = categories
    .map((category, index) => {
      const accent =
        CATEGORY_ACCENTS[category.name.toLowerCase()] ||
        ACCENTS[index % ACCENTS.length];
      return `<a class="group border-[3px] border-ink bg-paper p-5 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal" href="/categories/${category.slug}/"><span class="block h-1.5 w-12 ${accent}"></span><div class="mt-4 flex flex-wrap items-baseline justify-between gap-2"><p class="text-2xl font-black uppercase tracking-tight">${esc(category.name)}</p><span class="font-mono text-[11px] text-ink/60">${category.posts.length} post${category.posts.length === 1 ? "" : "s"}</span></div><p class="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink/60 group-hover:text-ink">Browse →</p></a>`;
    })
    .join("");

  const content = `
  <header class="border-b-4 border-ink bg-teal">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p class="tag bg-paper">Taxonomy</p>
      <h1 class="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">Categories</h1>
      <p class="mt-3 max-w-2xl font-bold">The broad strokes. ${categories.length} buckets, no sophisticated filing system.</p>
      <div class="mt-5 flex flex-wrap gap-2"><a class="chip" href="/posts/">All posts</a><a class="chip" href="/tags/">Tags →</a></div>
    </div>
  </header>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <div class="grid gap-5 sm:grid-cols-2">${cards}</div>
  </div>`;

  return layout({
    title: "Categories",
    description: "Browse posts by category.",
    urlPath: "/categories/",
    nav: "posts",
    content,
    published: isoDate(latest),
  });
}

function tagsIndex(tags, latest) {
  const chips = tags
    .map(
      (tag) =>
        `<a class="group inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 font-mono text-xs transition-colors hover:bg-acid" href="/tags/${tag.slug}/"><span>#${esc(tag.name)}</span><span class="text-ink/50 group-hover:text-[#101314]">${tag.posts.length}</span></a>`,
    )
    .join("");

  const content = `
  <header class="border-b-4 border-ink bg-mist">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p class="tag bg-paper">Taxonomy</p>
      <h1 class="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">Tags</h1>
      <p class="mt-3 max-w-2xl font-bold">The specific stuff. ${tags.length} tags and counting.</p>
      <div class="mt-5 flex flex-wrap gap-2"><a class="chip" href="/posts/">All posts</a><a class="chip" href="/categories/">Categories →</a></div>
    </div>
  </header>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <div class="flex flex-wrap gap-2">${chips}</div>
  </div>`;

  return layout({
    title: "Tags",
    description: "Browse posts by tag.",
    urlPath: "/tags/",
    nav: "posts",
    content,
    published: isoDate(latest),
  });
}

function seriesIndex(series, latest) {
  const cards = series
    .map(
      (item) =>
        `<a class="group border-[3px] border-ink bg-paper p-5 shadow-brutal-sm transition-all hover:-translate-y-0.5 hover:shadow-brutal" href="/series/${item.slug}/"><span class="block h-1.5 w-12 bg-teal"></span><div class="mt-4 flex flex-wrap items-baseline justify-between gap-2"><p class="text-2xl font-black uppercase tracking-tight">${esc(item.name)}</p><span class="font-mono text-[11px] text-ink/60">${item.posts.length} post${item.posts.length === 1 ? "" : "s"}</span></div><p class="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink/60 group-hover:text-ink">Browse →</p></a>`,
    )
    .join("");

  const content = `
  <header class="border-b-4 border-ink bg-aqua">
    <div class="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p class="tag bg-paper">Taxonomy</p>
      <h1 class="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">Series</h1>
      <p class="mt-3 max-w-2xl font-bold">Multi-part collections. A few things are better read in order.</p>
      <div class="mt-5 flex flex-wrap gap-2"><a class="chip" href="/posts/">All posts</a><a class="chip" href="/tags/">Tags →</a></div>
    </div>
  </header>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <div class="grid gap-5 sm:grid-cols-2">${cards}</div>
  </div>`;

  return layout({
    title: "Series",
    description: "Browse posts by series.",
    urlPath: "/series/",
    nav: "posts",
    content,
    published: isoDate(latest),
  });
}

function termPage(term, kind, latest) {
  const isCategory = kind === "categories";
  const isSeries = kind === "series";
  const accent = isCategory
    ? categoryAccent(term.name)
    : isSeries
      ? "bg-aqua"
      : "bg-mist";
  const label = isCategory ? "Category" : isSeries ? "Series" : "Tag";
  const plural = isCategory ? "Categories" : isSeries ? "Series" : "Tags";
  const heading = isCategory || isSeries ? esc(term.name) : `#${esc(term.name)}`;
  const rows = term.posts.map(postRow).join("");

  const content = `
  <header class="border-b-4 border-ink ${accent}">
    <div class="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" class="font-mono text-[11px] uppercase tracking-widest"><a class="underline decoration-2 underline-offset-2 hover:bg-ink hover:text-paper" href="/">Home</a> <span aria-hidden="true">/</span> <a class="underline decoration-2 underline-offset-2 hover:bg-ink hover:text-paper" href="/${kind}/">${plural}</a></nav>
      <p class="tag mt-5 bg-paper">${label}</p>
      <h1 class="mt-4 break-words text-4xl font-black uppercase tracking-tight sm:text-6xl">${heading}</h1>
      <p class="mt-3 font-bold">${term.posts.length} post${term.posts.length === 1 ? "" : "s"} filed under this ${label.toLowerCase()}.</p>
    </div>
  </header>
  <div class="mx-auto max-w-4xl px-4 py-10">
    <div class="space-y-4">${rows}</div>
    <div class="mt-8"><a class="font-black underline decoration-4 decoration-teal underline-offset-4 hover:bg-acid" href="/${kind}/">← All ${plural.toLowerCase()}</a></div>
  </div>`;

  return layout({
    title: `${label}: ${term.name}`,
    description: `Posts filed under ${term.name}.`,
    urlPath: `/${kind}/${term.slug}/`,
    nav: "posts",
    content,
    published: isoDate(latest),
  });
}

function notFoundPage() {
  const content = `
  <section class="mx-auto grid min-h-[60vh] max-w-4xl place-items-center px-4 py-16">
    <div class="w-full border-[3px] border-ink bg-acid p-8 text-center shadow-brutal sm:p-12">
      <p class="font-mono text-xs uppercase tracking-[0.3em]">Dead end</p>
      <p class="mt-4 text-7xl font-black uppercase leading-none tracking-tighter sm:text-9xl">404</p>
      <h1 class="mt-4 text-2xl font-black uppercase tracking-tight sm:text-3xl">This page took a wrong turn</h1>
      <p class="mx-auto mt-3 max-w-md text-sm font-bold">The link is broken, the page moved, or it never existed. Either way, there is no infinite scroll to save us now.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3"><a class="btn bg-paper" href="/">Back home →</a><a class="btn bg-ink text-paper" href="/posts/">Browse posts</a></div>
    </div>
  </section>`;

  return layout({
    title: "404 — Page not found",
    description: "This page could not be found.",
    urlPath: "/404.html",
    nav: "",
    content,
    noIndex: true,
  });
}

/* -------------------------------------------------------------------------- */
/* Feeds and metadata                                                         */
/* -------------------------------------------------------------------------- */

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absolutize(html, basePath) {
  const base = `${SITE.url}${basePath}`;
  return String(html)
    .replace(/(src|href)="\/(?!\/)/g, `$1="${SITE.url}/`)
    .replace(
      /(src|href)="(?!https?:|mailto:|tel:|#|\/)([^"]+)"/g,
      `$1="${base}$2"`,
    );
}

function cdata(value) {
  return String(value).replace(/]]>/g, "]]]]><![CDATA[>");
}

const FEED_MONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

/**
 * RSS readers do not load our stylesheet, and many of them still do not
 * support <details>. Flatten accordions, inline the alert styles, unwrap
 * galleries, and add a reply-by-email button so the feed reads well anywhere.
 */
function feedContent(post) {
  let html = post.html;

  html = html.replace(/<a class="heading-anchor"[^>]*>#<\/a>/g, "");

  html = html.replace(
    /<details class="neo-details"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="neo-details-body">([\s\S]*?)<\/div>\s*<\/details>/g,
    (_, summary, body) =>
      `<div style="border:2px solid #101314;padding:12px 14px;margin:16px 0"><p style="margin:0 0 8px;font-family:${FEED_MONO};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em">${summary}</p>${body}</div>`,
  );

  html = html.replace(
    /<div class="neo-alert neo-alert-(\w+)"><p class="neo-alert-label">([^<]*)<\/p><div class="neo-alert-body">([\s\S]*?)<\/div><\/div>/g,
    (_, kind, label, body) => {
      const warm = kind === "caution" || kind === "warning" || kind === "edit";
      const background = warm ? "#ffe3d9" : "#e2f5f5";
      const rule = warm ? "#d1502f" : "#009bad";
      return `<div style="border:2px solid #101314;border-left:8px solid ${rule};background:${background};padding:12px 14px;margin:16px 0"><p style="margin:0 0 8px;font-family:${FEED_MONO};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0b4f56">${label}</p>${body}</div>`;
    },
  );

  html = html.replace(
    /<div class="neo-carousel"[^>]*>\s*<p class="neo-carousel-hint"[^>]*>[\s\S]*?<\/p>\s*<div class="neo-carousel-track">([\s\S]*?)<\/div>\s*<\/div>/g,
    "$1",
  );
  html = html.replace(
    /<div class="neo-gallery"[^>]*>([\s\S]*?)<\/div>/g,
    "$1",
  );

  html = html
    .replace(/<figure class="neo-figure">/g, "<figure>")
    .replace(/<div class="neo-accordion">/g, "<div>")
    .replace(
      /<div class="neo-table-wrap">/g,
      '<div style="overflow-x:auto;margin:16px 0">',
    )
    .replace(/<figure>/g, '<figure style="margin:16px 0">')
    .replace(/<img /g, '<img style="max-width:100%;height:auto;border:2px solid #101314" ');

  return `${html}${feedReplyCta(post)}`;
}

function feedReplyCta(post) {
  const subject = encodeURIComponent(`Re: ${post.title}`);
  return `<div style="margin:28px 0 8px;padding:16px;border:2px solid #101314;background:#ffd447"><p style="margin:0 0 10px;font-family:${FEED_MONO};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em">Got thoughts?</p><a href="mailto:${SITE.email}?subject=${subject}" style="display:inline-block;border:2px solid #101314;background:#fffdf6;padding:8px 14px;font-family:${FEED_MONO};font-size:13px;font-weight:700;text-decoration:none;color:#101314">Reply by email →</a></div>`;
}

function buildRss(posts, feedUrl, feedTitle, feedDescription) {
  const latest = posts[0]?.date || new Date();

  const items = posts
    .map((post) => {
      const categories = [...post.categories, ...post.tags, ...post.series]
        .map((name) => `      <category>${xmlEscape(name)}</category>`)
        .join("\n");

      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${xmlEscape(`${SITE.url}${post.url}`)}</link>
      <guid isPermaLink="true">${xmlEscape(`${SITE.url}${post.url}`)}</guid>
      <pubDate>${post.date.toUTCString()}</pubDate>
      <description>${xmlEscape(post.summary)}</description>
      <content:encoded><![CDATA[${cdata(absolutize(feedContent(post), post.url))}]]></content:encoded>
${categories}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(feedTitle)}</title>
    <link>${SITE.url}/</link>
    <description>${xmlEscape(feedDescription)}</description>
    <language>en</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
    <copyright>${xmlEscape(`${SITE.license} — ${SITE.title}`)}</copyright>
    <atom:link href="${xmlEscape(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function buildSitemap(entries) {
  const map = new Map();
  for (const entry of entries) {
    const current = map.get(entry.loc);
    if (!current || (entry.lastmod && entry.lastmod > current)) {
      map.set(entry.loc, entry.lastmod || "");
    }
  }

  const urls = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([loc, lastmod]) =>
        `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function manifest() {
  return JSON.stringify(
    {
      name: SITE.title,
      short_name: "Mordecai",
      description: SITE.description,
      start_url: "/",
      display: "standalone",
      background_color: "#fbfaf4",
      theme_color: "#009bad",
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    null,
    2,
  );
}

function redirectPage(target, title) {
  const absolute = `${SITE.url}${target}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting… · ${esc(SITE.title)}</title>
  <link rel="canonical" href="${esc(absolute)}">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${esc(target)}">
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body class="grid min-h-screen place-items-center bg-paper p-6 font-sans text-ink">
  <main class="w-full max-w-lg border-[3px] border-ink bg-acid p-8 text-center shadow-brutal">
    <p class="font-mono text-xs uppercase tracking-[0.3em]">Moved</p>
    <h1 class="mt-3 text-3xl font-black uppercase tracking-tight">${esc(title)}</h1>
    <p class="mt-3 text-sm font-bold">This page now lives at <a class="underline decoration-4 underline-offset-4 hover:bg-paper" href="${esc(target)}">${esc(target)}</a>.</p>
  </main>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* Terms                                                                      */
/* -------------------------------------------------------------------------- */

function collectTerms(posts) {
  const categories = new Map();
  const tags = new Map();
  const series = new Map();

  const add = (map, name, post) => {
    const slug = slugify(name);
    if (!map.has(slug)) map.set(slug, { name, slug, posts: [] });
    map.get(slug).posts.push(post);
  };

  for (const post of posts) {
    for (const category of post.categories) add(categories, category, post);
    for (const tag of post.tags) add(tags, tag, post);
    for (const name of post.series) add(series, name, post);
  }

  const sorted = (map) =>
    [...map.values()].sort(
      (a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name),
    );

  for (const term of [
    ...categories.values(),
    ...tags.values(),
    ...series.values(),
  ]) {
    term.posts.sort((a, b) => b.date - a.date);
  }

  return {
    categories: sorted(categories),
    tags: sorted(tags),
    series: sorted(series),
  };
}

function buildSearchIndex(posts) {
  return posts.map((post) => ({
    title: post.title,
    url: post.url,
    summary: post.summary,
    categories: post.categories,
    tags: post.tags,
    series: post.series,
    date: isoDate(post.date),
    dateLabel: formatDateShort(post.date),
    text: decodeEntities(
      stripTags(
        post.html.replace(
          /<\/(p|h[1-6]|li|blockquote|pre|div|figcaption|td|th)>/gi,
          " ",
        ),
      ),
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000),
  }));
}

/* -------------------------------------------------------------------------- */
/* File output                                                                */
/* -------------------------------------------------------------------------- */

function copyDirContents(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    fs.cpSync(
      path.join(source, entry.name),
      path.join(destination, entry.name),
      { recursive: true },
    );
  }
}

function writePage(urlPath, html) {
  const clean = urlPath.replace(/^\/+|\/+$/g, "");
  const dir = clean ? path.join(DIST_DIR, clean) : DIST_DIR;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

function writeFile(relativePath, contents) {
  const fullPath = path.join(DIST_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents);
}

function normalizeAlias(alias) {
  const clean = String(alias).replace(/^\/+|\/+$/g, "");
  return clean ? `/${clean}/` : "/";
}

/* -------------------------------------------------------------------------- */
/* Build                                                                      */
/* -------------------------------------------------------------------------- */

function build() {
  const startedAt = Date.now();
  console.log("Building the neobrutalist insidemordecai.com clone…");

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  copyDirContents(STATIC_DIR, DIST_DIR);
  copyDirContents(ASSETS_DIR, path.join(DIST_DIR, "assets"));

  const items = loadContent();
  const posts = items.filter((item) => item.type === "post");
  const pages = items.filter((item) => item.type === "page");

  for (const item of items) {
    item.wordCount = countWords(item.body);
    item.readingTime = readingTime(item.wordCount);
  }

  const refMap = buildRefMap(items);
  for (const item of items) {
    const rendered = renderMarkdown(item.body, item, refMap);
    item.html = rendered.html;
    item.toc = rendered.toc;
    if (!item.summary) item.summary = excerptFromHtml(item.html);
  }

  const { categories, tags, series } = collectTerms(posts);
  const latest = posts[0]?.date || new Date();
  const latestIso = isoDate(latest);
  const sitemap = [];

  // Copy post/page images to their clean URLs.
  for (const item of items) {
    const imgDir = path.join(item.dir, "img");
    if (!fs.existsSync(imgDir)) continue;

    const base =
      item.type === "post" || item.isAttic
        ? path.join(DIST_DIR, item.slug)
        : path.join(DIST_DIR, item.section);

    fs.cpSync(imgDir, path.join(base, "img"), { recursive: true });
  }

  // Home.
  writePage("/", homePage(posts, categories));
  sitemap.push({ loc: `${SITE.url}/`, lastmod: latestIso });

  // Post archive with pagination.
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  for (let page = 1; page <= totalPages; page += 1) {
    const pathName = page === 1 ? "/posts/" : `/posts/page/${page}/`;
    writePage(pathName, postsPage(posts, page, totalPages, categories));
    sitemap.push({ loc: `${SITE.url}${pathName}`, lastmod: latestIso });
  }

  // Individual posts.
  for (const post of posts) {
    writePage(post.url, postPage(post, posts));
    sitemap.push({
      loc: `${SITE.url}${post.url}`,
      lastmod: isoDate(post.date),
    });
  }

  // Client-side search data. Kept out of the sitemap and fetched on demand.
  writeFile("search-index.json", JSON.stringify(buildSearchIndex(posts)));

  // Standalone pages. The Attic stays reachable by URL but out of the sitemap.
  for (const page of pages) {
    writePage(page.url, pagePage(page));
    if (page.isAttic) continue;
    sitemap.push({
      loc: `${SITE.url}${page.url}`,
      lastmod: isoDate(page.date),
    });
  }

  // Taxonomy indexes.
  writePage("/categories/", categoriesIndex(categories, latest));
  writePage("/tags/", tagsIndex(tags, latest));
  writePage("/series/", seriesIndex(series, latest));
  sitemap.push({ loc: `${SITE.url}/categories/`, lastmod: latestIso });
  sitemap.push({ loc: `${SITE.url}/tags/`, lastmod: latestIso });
  sitemap.push({ loc: `${SITE.url}/series/`, lastmod: latestIso });

  // Term pages.
  for (const category of categories) {
    const termLatest = isoDate(category.posts[0]?.date || latest);
    writePage(
      `/categories/${category.slug}/`,
      termPage(category, "categories", category.posts[0]?.date || latest),
    );
    sitemap.push({
      loc: `${SITE.url}/categories/${category.slug}/`,
      lastmod: termLatest,
    });
  }

  for (const tag of tags) {
    const termLatest = isoDate(tag.posts[0]?.date || latest);
    writePage(
      `/tags/${tag.slug}/`,
      termPage(tag, "tags", tag.posts[0]?.date || latest),
    );
    sitemap.push({
      loc: `${SITE.url}/tags/${tag.slug}/`,
      lastmod: termLatest,
    });
  }

  for (const item of series) {
    const termLatest = isoDate(item.posts[0]?.date || latest);
    writePage(
      `/series/${item.slug}/`,
      termPage(item, "series", item.posts[0]?.date || latest),
    );
    sitemap.push({
      loc: `${SITE.url}/series/${item.slug}/`,
      lastmod: termLatest,
    });
  }

  // Aliases.
  const aliasTargets = [];
  for (const item of items) {
    for (const alias of item.aliases) {
      const aliasPath = normalizeAlias(alias);
      if (aliasPath === item.url) continue;
      writePage(aliasPath, redirectPage(item.url, item.title));
      aliasTargets.push(`${aliasPath} -> ${item.url}`);
    }
  }

  // 404.
  writeFile("404.html", notFoundPage());

  // Feeds.
  writeFile(
    "index.xml",
    buildRss(
      posts,
      `${SITE.url}/index.xml`,
      SITE.title,
      SITE.description,
    ),
  );
  writeFile(
    "posts/index.xml",
    buildRss(
      posts,
      `${SITE.url}/posts/index.xml`,
      `${SITE.title} — Posts`,
      SITE.description,
    ),
  );

  // Sitemap, robots, manifest.
  writeFile("sitemap.xml", buildSitemap(sitemap));
  writeFile(
    "robots.txt",
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
  );
  writeFile("site.webmanifest", manifest());

  console.log(
    `  ${posts.length} posts · ${pages.length} pages · ${categories.length} categories · ${tags.length} tags · ${series.length} series`,
  );
  if (aliasTargets.length) console.log(`  ${aliasTargets.length} aliases`);
  console.log(`  done in ${Date.now() - startedAt}ms — output in dist/`);
}

build();
