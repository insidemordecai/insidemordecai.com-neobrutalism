# insidemordecai.com — neobrutalist clone

> **Experimental project:** This is an experiment in coding agents, specifically OpenCode using DeepSeek V4.1 Flash Free. It is a static clone/rebuild, not the production site.

A static, neobrutalist rebuild of [insidemordecai.com](https://insidemordecai.com). It keeps all published posts, the standalone pages, categories, tags, series, pagination, RSS, and the old URL aliases — but drops Hugo, Blowfish, analytics, and every third-party runtime request.

The output is plain HTML, one locally compiled Tailwind stylesheet, a small local script for search and navigation, and local images. There is no CDN, no web font, no tracking script, and no client-side framework.

## Quick start

```sh
npm install
npm run build
npm run serve
```

Then open <http://localhost:4173>.

| Command | What it does |
| --- | --- |
| `npm run build` | Generates `dist/` from Markdown, then compiles Tailwind |
| `npm run generate` | Generates HTML only (no CSS) |
| `npm run css` | Compiles `src/input.css` to `dist/assets/style.css` |
| `npm run serve` | Serves `dist/` at <http://localhost:4173> |
| `npm run check` | Checks links, assets, anchors, alt text, IDs, and the RSS feeds |
| `npm run check:feed` | Validates the generated RSS feeds only |
| `npm run dev` | Build, then serve |

## Project structure

```text
content/              Markdown posts and pages (the source of truth)
  posts/              one folder per post, optional img/ inside
  about/ links/ ...   standalone pages
assets/img/           profile and Open Graph image
assets/site.js        local search, mobile navigation, and back-to-top enhancements
static/               favicons, CNAME, manifest source
src/input.css         Tailwind theme, components, article typography
build.mjs             static site generator and page templates
scripts/serve.mjs     dependency-free preview server
scripts/check-links.mjs
scripts/check-feed.mjs
dist/                 generated output (git-ignored)
```

## How the build works

`build.mjs` reads every `content/**/index.md`, parses the front matter, and renders:

- the home page with the six most recent posts
- `/posts/` and paginated archive pages (20 per page)
- every post at `/<slug>/`
- standalone pages at `/<section>/`
- `/categories/`, `/tags/`, `/series/`, and a page per term
- `index.xml` (RSS), `sitemap.xml`, `robots.txt`, `site.webmanifest`
- `search-index.json`, regenerated from every public post and fetched only when search is used
- redirect pages for aliases such as `/hello`, `/privacy`, and `/blogroll`
- a neobrutalist `404.html`

### Search and series navigation

The navbar search opens a native `<dialog>` with `Cmd K` on macOS or `Ctrl K` on Windows/Linux. It fetches `/search-index.json` on intent (hover, focus, or open), scores titles, tags, categories, summaries, and post text locally, and supports arrow keys plus Enter. Without JavaScript, the search trigger is an ordinary link to `/posts/`.

Posts that belong to a series show a `<details>` dropdown above the title with the series name, the current position (oldest post first), and links to every part. No JavaScript is required for the dropdown.

It also handles the Hugo shortcodes used by the original content:

- `{{< ref >}}` → internal links
- `{{< alert >}}` → bordered callout boxes
- `{{< accordion >}}` / `{{< accordionItem >}}` → native `<details>` elements
- `{{< carousel >}}` → a CSS image grid

GitHub-style callouts (`> [!NOTE]`, `> [!CAUTION]`, and friends) are converted into the same callout component, so both syntaxes render properly.

### Image galleries

A run of two or more Markdown images at the end of a post is automatically collected:

- 2–4 images → a two-column grid
- 5+ images → a scroll-snap carousel with no JavaScript

Override the choice per post in the front matter:

```yaml
gallery: carousel   # or grid, or off
```

Post images stay relative (`img/photo.webp`) and are copied to `dist/<slug>/img/`, so the clean URLs keep working. Feed content is rewritten with absolute URLs.

## Adding or editing a post

Create `content/posts/YYYYMM-slug/index.md`:

```yaml
---
title: A New Post
slug: a-new-post
summary: One sentence shown on cards and in the feed.
description: Optional meta description.
date: 2026-10-20T12:00:00+03:00
categories: [Technical]
tags: [Homelab, Docker]
draft: false
---
```

Put images in the same folder under `img/` and reference them as `![Alt text](img/photo.webp)`. Set `draft: true` to exclude a post. Run `npm run build` again.

Site-wide details — domain, title, email, social links, Open Graph image — live in the `SITE` and `SOCIALS` constants at the top of `build.mjs`.

## Design notes

The visual language is deliberately simple and loud:

- **Palette:** warm canvas `#F4F0E6`, paper cards `#FFFDF7`, ink `#101314`, and a teal-led accent set built around the original brand colour `#009BAD` — pale mist `#D8F1F1`, aqua `#7CE7EC`, acid yellow `#FFD447`, coral `#FF8A6B`, lime `#C9F27A`, blush `#FFD9C9`, and purple `#B79CFF`. Dark mode keeps a near-black canvas but uses the same bright accent surfaces with fixed dark ink, so purple, teal, coral, and lime stay vivid rather than turning muddy.
- **Category colour codes:** Technical is purple, Opinion is coral, Updates is lime, and Web is aqua. The colours repeat in home cards, category badges, and category headers. Post lists keep categories muted so they do not compete with the titles.
- **Shape:** 3–4 px hard borders, offset shadows, square corners, rotated stickers, visible focus outlines.
- **Type:** system sans and system mono stacks. No web fonts are downloaded.
- **Background:** a CSS grid instead of the original Unsplash image.
- **Home layout:** the recent-post cards use prominent category tags, while the category grid shows every category until it would overflow eight tiles. Past that point, the last tile becomes “All N categories” instead of showing a redundant button.
- **Navigation:** desktop keeps the initials, inline links, and search. On small screens the full name, search icon, and a three-line menu toggle stay visible; the links expand into a full-width panel with dashed dividers.
- **Interaction:** CSS hover/active transforms, a keyboard-accessible search dialog, a collapsible mobile menu, and a back-to-top control that appears after scrolling. No theme toggle and no client-side framework.
- **Dark mode:** automatic, based on `prefers-color-scheme`. There is no toggle; the small script only handles search, the mobile menu, and the back-to-top state.
- **Accessibility:** skip link, semantic landmarks, one `h1` per page, alt text from Markdown, `aria-current` navigation, native `<dialog>` focus handling, keyboard shortcuts, and reduced-motion support.

## Testing the RSS feed

Build and validate the feed:

```sh
npm run build
npm run check:feed
```

`check:feed` verifies that both feeds contain every post, full content, absolute URLs, a reply-by-email button, and no markup that feed readers cannot render (collapsed `<details>`, site-only classes, raw shortcodes).

To read the feed the way a subscriber would:

1. Run `npm run serve` and open <http://localhost:4173/index.xml>, or add that URL to a local reader such as NetNewsWire or Vienna.
2. For local testing with working images and links, build against localhost first:

   ```sh
   SITE_URL=http://localhost:4173 npm run build
   npm run serve
   ```

3. Point the reader at <http://localhost:4173/index.xml>. Rebuild without `SITE_URL` before deploying.

Feed-specific behavior:

- Accordions are flattened, so TL;DR content is always visible in readers that ignore `<details>`.
- Alerts and tables get inline styles, since readers do not load the site stylesheet.
- Galleries and carousels become stacked figures.
- Every item ends with a **Reply by email** button carrying a `Re: <post title>` subject.

## Private pages

`content/attic/` is generated at its normal URL (currently `/it-support/`) but is excluded from the sitemap, RSS feeds, navigation, footer, and search indexing. It carries `<meta name="robots" content="noindex">` and is not linked from any public page. Note that this is obscurity, not authentication: anyone with the URL can read it. If it needs real protection, put the path behind Cloudflare Access or a password-protected host.

## No third-party resources

The page loads only:

- `/assets/style.css` (compiled locally by Tailwind)
- `/assets/site.js` (local search, mobile navigation, and back-to-top behaviour)
- local images and favicons
- `/search-index.json` when you open, hover, or focus the search control
- an optional local RSS feed

External domains appear only as ordinary `<a href>` links, and nothing is requested from them until a visitor clicks. The search index and script are same-origin static files; no query or visit data is sent anywhere.

## Deploying

Build with `npm run build` and publish the `dist/` directory. On Cloudflare Pages or Workers, use:

- Build command: `npm run build`
- Output directory: `dist`

`static/CNAME` is copied into `dist/` for the custom domain. The same output works on GitHub Pages, Netlify, or any static host.

## Notes

- `dist/` is generated. Edit `content/`, `src/input.css`, or `build.mjs` instead.
- The original Hugo/Blowfish project is not used by this clone.
- The colophon page has been updated to describe the new stack and the absence of analytics.
- Content is licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), matching the original site.
