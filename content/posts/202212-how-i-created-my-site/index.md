---
title: How I Created My Site For Free with Hugo and GitHub Pages
slug: how-i-created-my-site-for-free
summary: In this post we go over the ease of creating a site using Markdown
description: In this post we go over the ease of creating a site using Markdown
date: 2022-12-26T08:37:27+03:00
categories: [Technical]
tags: [Static Site Generators, Hugo, GitHub, GitHub Pages]
draft: false
---

If you are like me, then you've probably wanted to create a personal site but the available options were either expensive or simply not good enough. That was until I learnt of static site generators and their simplicity. This blog you are reading is made using Hugo and hosted on GitHub. 

Here is the process:
1. Installing Hugo 
2. Creating your new hugo site
3. Building the site
4. Hosting with GitHub Pages

## Installing Hugo

This part may differ based on your development setup. I'd recommend Chocolatey for Windows and Homebrew for Mac but Hugo has [documentation on the many installation methods.](https://gohugo.io/installation) For Linux, Hugo is most likely on your distribution's repository but you can check out the documentation.

## Creating Your New Hugo Site

1. Open your console, navigate to where you want to save your site and run `hugo new site .` to create the site in the current directory. If you'd like to create the site in a new directory, run `hugo new site SITE_NAME`. 
2. Look for a Hugo theme and setup the site skeleton based on the theme's documentation. I personally use [Blowfish](https://blowfish.page)

I recommend downloading themes as a [Git Submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) as this will make it easier to update them. It's also important to choose a theme with great documentation for your ease of use.

## Building The Site

At this point we already have a skeleton of a site and we can run `hugo server` at the root of our site. This will also allow us to observe the changes we make and their effect. You can run `hugo server -D` if you want to test out with some draft posts as by default Hugo doesn't show drafts.

Your site is now available at `http://localhost:1313`

Google as well as your theme's documentation will be your friend from hereon. You can check out the exampleSite and other sites that use the same theme for inspiration.

## Hosting with GitHub Pages

1. Create a **public** GitHub repository named `YOUR_GITHUB_USERNAME.github.io` but can use any other name. (we'll get to that later)
2. As you might have noticed, when you run `hugo` or `hugo server`, some directories are created. These aren't required and therefore we can create a .gitignore file and add `/public` and `/resources` to it.
3. Push your changes to the GitHub repository we created.
4. Set up GitHub Actions by creating a file in `.github/workflows/gh-pages.yml`. [Copy the content of the file from this section of the Hugo documentation.](https://gohugo.io/hosting-and-deployment/hosting-on-github/#build-hugo-with-github-action)
 
   What this does is once GitHub notices changes to your main branch,  it will perform a set of actions to publish your site to `gh-pages` branch.
5. Push the GitHub Actions file and you're done.

Your site is now live at `YOUR_GITHUB_USERNAME.github.io`. If you chose to use a different repository name then your site is live at `YOUR_GITHUB_USERNAME.github.io/REPOSITORY_NAME`

Some YouTube channels that I found helpful when creating my site were [Chris Stayte](https://www.youtube.com/@ChrisStayte), [Eric Murphy](https://www.youtube.com/@EricMurphyxyz) and [Luke Smith](https://www.youtube.com/@LukeSmithxyz).

Till next time, feel free to reach out. Cheers!
