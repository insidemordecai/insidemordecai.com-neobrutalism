---
title: Migrating a Hugo Site from Cloudflare Pages to Workers
slug: hugo-migration-cloudflare-pages-workers
summary: How I moved my site to Workers, including cleaning up a Pages project with many deployments.
description: A step-by-step guide on migrating a Hugo site from Cloudflare Pages to Workers. Learn how to handle old deployments, configure Hugo for Workers, and get your site live on the edge.
date: 2026-02-21T21:47:59+03:00
categories: [Technical, Updates]
tags: [Cloudflare Pages, Cloudflare Workers, Hugo]
draft: false
---

Cloudflare has been gently (and not so gently) nudging folks away from Pages for a while now. 
Their new option, Workers, promised to be bigger and better but I didn't need it since I run a simple static site. 
Nonetheless, I tried deleting my Pages project to switch over, but it turns out you can't do that with a single click if you have a lot of deployments. 
Their guide didn't seem as straightforward as I'd hoped, but looking back, it's actually pretty easy.

So... I recently ran into an unrelated issue with my site, and my attempts to fix it pushed me try out different deployment environments. 
In the process, I gave in and moved everything over to Workers.

I won't bore you with the why, the differences, or other minutiae.
Here's what I'll cover and how I did it:

1. How to clean up old Cloudflare Pages project.
2. Configuring your Hugo site for the switch 
3. Migrating to Workers.

## Cleaning up the Old Pages Project 

The first obstacle, as mentioned, was simply **getting rid of** the old Pages project.

Cloudflare’s UI will happily let you click “Delete project” and then complain if you have a long deployment history. 
At least that's the limitation at the time of writing.
In my case I had hundreds of previous deployments since [switching to Cloudflare Pages]({{< ref "posts/202308-switched-to-cloudflare-pages/index.md" >}}) back in 2023.
The workaround is a small Node tool they document that iterates through deployments and deletes them via the API.

Here is there guide on the [Known Issues page](https://developers.cloudflare.com/pages/platform/known-issues/#delete-a-project-with-a-high-number-of-deployments).

I struggled with finding the correct Account ID, but even more with configuring the API token. 
Here's what to note / rough steps:

1. If you're like me and only have a single account, simply click the menu button next to your account name in the Cloudflare dashboard and select **Copy Account ID**. If that isn't clear or you have multiple accounts, then follow the official guide: [Find account and zone IDs](https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/).
2. For the API token, simply head into your [Cloudflare dashboard](https://dash.cloudflare.com/) and go to **My Profile** > **API Tokens**.
3. Click on **Create Token** and pick the **Create Custom Token** option.
4. Give your token a name and these permissions:
	- Scope: **account‑level**, not zone or user-level.
	- Permission: `Cloudflare Pages: Edit`
	- You can define how long the token will stay active under the TTL section or simply delete it after using it.
5. Run the script to purge deployments until only the active deployment remains. 
6. Remove any custom domains in the Cloudflare Pages project setting and now delete the project. 

It's actually pretty straighforward. 
Now we can think about migrating to Workers, but we first need to configure a few things.

## How to Deploy a Hugo Site on Cloudflare Workers

While Cloudflare hasn’t killed off Pages yet, it's no secret that it isn’t getting the attention it used to. 
They even recommend [starting with Workers](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/#start-with-workers). 

> Cloudflare Pages will continue to be supported, but, going forward, all of our investment, optimizations, and feature work will be dedicated to improving Workers.

### Add a Wrangler Config 

Start by adding a `wrangler.jsonc` file to the root of your site. 
Workers use this file to understand how your Hugo site should be built and deployed.

```json
{
  "name": "insidemordecai",
  "compatibility_date": "2026-02-21",
  "assets": {
    "directory": "./public",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
    "run_worker_first": false
  },
  "build": {
    "command": "hugo --gc --minify",
  },
    "workers_dev": true,
  "preview_urls": true
}
```

Replace the `name` field to match your domain or project name. 
You can adjust the compatibility date to the day you’re generating the config.
The remaining defaults should work as-is.

### Pin Workers to a Specific Hugo Version

> [!NOTE]
> This section is totally **optional**. If you don't need it, skip right ahead to the next section.

While attempting to fix my previously mentioned unrelated issue, I tried to force Workers to use a specific Hugo version. 
I wasted a lot of time trying this, but Workers kept using a different version.
After scouring the build logs, it turns out you don't declare this in the `wrangler.jsonc` file since that only makes it a runtime variable.

You have two options if you want Workers to use a specific Hugo version: 

1. Create a `build.sh` script and update the subsequent build line in the `wranger.jsonc` file. It worked, though in the end I didn’t need it for my issue. I’d like to think someone out there might find it helpful though.

```bash
#!/bin/bash
set -e

# Pin to a specific Hugo version (update when needed)
HUGO_VERSION="0.155.3"
HUGO_URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz"

curl -sL "$HUGO_URL" | tar xz hugo
chmod +x hugo
HUGO_ENV=production ./hugo --gc --minify
```

```json
  "build": {
    "command": "chmod a+x build.sh && ./build.sh",
  },
```

2. Configure it in your Workers project setting under the _Variables and secrets_ option of the **Build** sub-section. 
	- Variable name: `HUGO_VERSION`
	- Value: `155.3` (enter the version you want)

I didn’t realise the second option existed at first, so you’re welcome for the script.
Otherwise, I recommend the second option. 
It’s what I used back in Cloudflare Pages, and it’s just neater.

### Create the Workers Project

With everything in place, configure your Worker for deployment: 

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com/), press the **Add** button in the upper right corner, and select “Workers” from the drop down menu.
2. Click on **Continue with GitHub** (or your preferred option) and choose the project repository.
3. Name your Workers project.
4. Leave the rest at their defaults.
5. Click **Deploy**.

With everything configured, Workers will build the site and deploy it.
It should be live within a minute.

### Configure Custom Domain

Now it's time to reconfigure the custom domains you used with your Pages project and be done with it, unless you want to stick with the default  `*.workers.dev` URL.

1. Open your Workers project and navigate to the Settings tab.
2. Under the **Domains & Routes** sub-section, click **Add**.
3. Pick **Custom Domain** and enter your domain name. 
4. Click **Add domain** at the bottom and that's it.

Cloudflare will handle DNS configuration automatically. 

That's it, your Hugo site should be available on your domain in a couple of minutes.

If you deploy often and plan to keep scaling, Workers feels like the right long-term home. 
Pages still works, but it’s clear where Cloudflare’s focus is.

## Explore Further 

- [Host on Cloudflare](https://gohugo.io/host-and-deploy/host-on-cloudflare/)
- [Your frontend, backend, and database — now in one Cloudflare Worker](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)
- Workers [Compatibility dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)
- [Migrating from Cloudflare Pages to Workers - Do You Even Need To?](https://kahwee.com/2025/migrating-from-cloudflare-pages-to-workers/) - a different method to migrate.
