---
title: Switched to Cloudflare Pages
slug: switched-to-cloudflare-pages
summary: This website has migrated from GitHub Pages to Cloudflare Pages
description: This website has migrated from GitHub Pages to Cloudflare Pages
date: 2023-08-18
categories: [Updates]
tags: [Cloudflare Pages, Meta]
draft: false
---

For about a month, this website was not sending data to [GoatCounter](https://www.goatcounter.com/). I managed to resolve this but the rabbit hole led me to rediscover [Cloudflare Pages](https://pages.cloudflare.com).

**I still love and recommend GitHub Pages**, with a simple GitHub Action you can deploy your project and even [make use of custom domains]({{<ref "posts/202301-custom-domains-with-github-pages/index.md" >}}).

Anyway, for my use case, the top alternatives were Cloudflare Pages and [Netlify](https://www.netlify.com/). I currently manage domains on Cloudflare making it the obvious choice. 

Some of **the benefits of Cloudflare Pages** include:
- Fast site performance on the Cloudflare network.
- Easy to add a custom domain especially so if you use Cloudflare for domain management. 
- Free SSL certificate with any plan.
- Ability to have preview deployments before rolling to production.

The process of switching over was smooth. I connected Cloudflare Pages with my Git repository, set up build settings (just selecting Hugo as my framework) and deployed it. **That easy!** In my case, to setup a custom domain, Cloudflare simply added the necessary DNS records automatically.

**That's the update**, for a guide on setting up Cloudflare Pages, have a look at [Cloudflare Docs](https://developers.cloudflare.com/pages/get-started/guide/) or this [YouTube Video](https://youtu.be/MTc2CTYoszY)
