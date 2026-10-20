# insidemordecai.com — neobrutalist clone

A static, neobrutalist rebuild of [insidemordecai.com](https://insidemordecai.com). It keeps all 54 posts, the standalone pages, categories, tags, series, pagination, RSS, and the old URL aliases — but drops Hugo, Blowfish, analytics, client-side JavaScript, and every third-party runtime request.

The output is plain HTML, one locally compiled Tailwind stylesheet, and local images. There is no CDN, no web font, no tracking script, and no client-side framework.

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
| `npm run check` | Checks internal links, images, anchors, alt text, and duplicate IDs |
| `npm run dev` | Build, then serve |

## Project structure

```text
content/              Markdown posts and pages (the source of truth)
  posts/              one folder per post, optional img/ inside
  about/ links/ ...   standalone pages
assets/img/           profile and Open Graph image
static/               favicons, CNAME, manifest source
src/input.css         Tailwind theme, components, article typography
build.mjs             static site generator and page templates
scripts/serve.mjs     dependency-free preview server
scripts/check-links.mjs
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
- redirect pages for aliases such as `/hello`, `/privacy`, and `/blogroll`
- a neobrutalist `404.html`

It also handles the Hugo shortcodes used by the original content:

- `{{< ref >}}` → internal links
- `{{< alert >}}` → bordered callout boxes
- `{{< accordion >}}` / `{{< accordionItem >}}` → native `<details>` elements
- `{{< carousel >}}` → a CSS grid gallery

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

- **Palette:** warm paper `#FFF8E7`, ink `#111111`, acid yellow `#FFD23F`, sky `#6EE7F2`, bubblegum `#FF90E8`, lime `#B8F24A`, tangerine `#FF8A3D`, grape `#B69CFF`, tomato `#FF5C5C`.
- **Shape:** 3–4 px black borders, hard offset shadows, square corners, rotated stickers, visible focus outlines.
- **Type:** system sans and system mono stacks. No web fonts are downloaded.
- **Background:** a CSS grid instead of the original Unsplash image.
- **Interaction:** CSS hover/active transforms only. No JavaScript, no theme toggle, no search box.
- **Accessibility:** skip link, semantic landmarks, one `h1` per page, alt text from Markdown, `aria-current` navigation, and reduced-motion support.

## No third-party resources

The page loads only:

- `/assets/style.css` (compiled locally by Tailwind)
- local images and favicons
- an optional local RSS feed

External domains appear only as ordinary `<a href>` links, and nothing is requested from them until a visitor clicks.

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
