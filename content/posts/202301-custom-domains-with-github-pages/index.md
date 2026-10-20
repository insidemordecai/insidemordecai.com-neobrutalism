---
title: Setting up Custom Domains on GitHub Pages
slug: custom-domains-with-github-pages
summary: How to switch from GitHub Pages' default github.io domain. 
description: How to switch from GitHub Pages' default github.io domain. 
date: 2023-01-09
categories: [Technical]
tags: [Static Site Generators, GitHub, Custom Domains, Hugo]
draft: false
---

GitHub Pages publishes your site on a domain that looks like `USERNAME.github.io`. This is all fine and good but you can make it yours by adding a custom domain and still benefit from the free hosting.

## Prerequisites

The only prerequisites are:

1. Own a domain or have access to one.
2. Have a site making use of GitHub Pages.

Have a look at [how I created this site for free with Hugo and GitHub pages](https://insidemordecai.com/how-i-created-my-site-for-free/) to get you started if you do not have a site up and running. 

For the domain, you can buy yourself one on [Namecheap](https://namecheap.com) or [Google Domains](https://domains.google.com) or any other registrar. They are relatively inexpensive.

## Update Your DNS Settings

I typically add my custom domain to GitHub Pages at the end after configuring my DNS settings.

{{< alert "circle-info">}}
Your DNS records should point to `USERNAME.github.io` and NOT the repository name. Once set up, GitHub will figure out which page to serve.
{{< /alert >}}

### Configure a subdomain

If you own a subdomain such as`blog.example.com` then all you have to do is:

1. Head over to where you manage your DNS configurations (typically your registrar) 
2. Add a CNAME pointing to your GitHub Page. For my other blog, [auto.insidemordecai.com](https://auto.insidemordecai.com), that meant adding a CNAME record called `auto` that points to `insidemordecai.github.io`

I recommend leaving the TTL setting in Auto until you understand more about it then you can tweak to your liking.

### Configure an apex domain

For an apex domain such as `example.com` or this site, then the steps are:

1. Head over to where you manage your DNS configurations (typically your registrar)
2. Add four A records with the name as your apex domain (in my case, `insidemordecai.com`) that each point to [GitHub Pages' IP addresses as seen here](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain) (just copy-paste).

I recommend also setting up a configuration for a `www` subdomain as it is easy for someone to assume your site's address starts as so. The steps for this are the same as above, for me that meant creating a CNAME record named `www` pointing to `insidemordecai.github.io`

## Update Your GitHub Repository

1. Head over to your GitHub repository and navigate to the GitHub Pages settings.
2. Under 'Custom domain', type your custom domain and click save. 

GitHub will check for the DNS configuration we made and your site should be live on this new address in a few. To not spook the visitors of your site when their browser warns them of an unsecure site, you can check the **Enforce HTTPS** box on this page.

## Fix GitHub Actions Removing the CNAME File

After adding your custom domain to the site's repository, GitHub commits a CNAME file but if you have a GitHub Actions workflow then this file is deleted with every new change and your site is inaccessible. 

For Hugo sites, we can fix this by:

1. On the root of our repository, create a directory called `static`
2. Navigate into the new directory and create a file called `CNAME`
3. Edit the file to have a single line that is just your custom domain, either your apex domain ([`insidemordecai.com`](https://insidemordecai.com)) or your subdomain ([`auto.insidemordecai.com`](https://auto.insidemordecai.com))
4. Push your local changes to GitHub.

You're done!

Till next time, feel free to reach out. Cheers!
