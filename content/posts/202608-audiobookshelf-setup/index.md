---
title: Self-Hosting Audiobooks with Audiobookshelf and Docker
slug: audiobookshelf-setup
summary: Adding audiobooks to my homelab setup.
description: Extending my Docker media stack with Audiobookshelf to self-host audiobooks. The post walks through folder layout, docker-compose setup, Cloudflare Tunnel networking, and the iOS app I use for listening. 
date: 2026-08-30T22:26:48+03:00
categories: [Technical]
tags: [Audiobooks, Audiobookshelf, Docker, Homelab, Self-Hosting]
draft: false
---

Like many people with the homelab itch, you'll inevitably want to self-host more and more applications. 
The challenge lies in striking a balance between self-hosting and using other solutions. 
One can easily spiral into hosting everything in their closet and struggling to maintain it when other great options are available.
That said, I occasionally get that itch.

My [existing Docker media stack]({{< ref"posts/202602-self-hosted-media-with-docker/index.md" >}}) already handled movies, TV shows, requests, subtitles, and playback through the *arr* applications and Jellyfin.
The only major thing missing was a way to self-host my Audiobooks. 
I had previously liberated my Audiobooks from Audible using [Libation](https://getlibation.com/) years ago and so this was the next logical step. 
The first part was simply settling on the same folder structure as my films and TV shows where everything lives under `/data` on the host:

    data
    ├── torrents
    │   ├── completed
    │   └── incomplete
    └── media
        ├── audiobooks
        ├── movies
        └── tv

I followed that by copying Audiobookshelf's [docker-compose.yml template](https://audiobookshelf.org/docs/documentation/install/docker#docker-compose),  tweaking it to match my setup (directory structure and network) and naming the container.

```yml
services:
  audiobookshelf:
    image: ghcr.io/advplyr/audiobookshelf:latest
    container_name: audiobookshelf
    ports:
      - 13378:80
    volumes:
      - ./appdata/audiobookshelf:/config
      - ./appdata/audiobookshelf/metadata:/metadata
      - ${DATA_VOLUME}/data:/data
    environment:
      - TZ=${TZ}
    networks: 
      - stacknet
    restart: unless-stopped
```

It is safe to simply use the same as a starter and change the variables I've used.
In this instance, `${DATA_VOLUME}` is the location in which my `/data` directory is located while `${TZ}` points to my timezone, both configured in a `.env` file. 

To safely expose my applications to the internet, I rely on Cloudflare's `cloudflared` tunnelling service. 
This lives in a separate Docker stack and as such I set up a custom shared network (named `stacknet`) to allow containers in different stacks to easily communicate with each other. 
I acknowledge a better solution might exist but this was the easiest for me to get going but I'm open to suggestions. 

Beyond this, the process is pretty straightforward in comparison to setting up Radarr or Sonarr. 
Simply fire up the container, set up your user account, and point to where your audiobooks (or podcasts) are. 

When it comes to mobile applications, I haven't tried any on the Android side but I'm sure a lot of options exist on there. 
On iOS, I currently use [AudioBooth](https://apps.apple.com/us/app/id6753017503?platform=iphone) and I love it a lot. 
The app allows offline downloads, it's super customisable, and the UI is clean and at home on iOS. 

And that is my Audiobooks setup with Audiobookshelf and Docker. 

## Explore Further 
- [Audiobookshelf Official Documentation](https://audiobookshelf.org/docs/documentation/introduction)
- [Setting up a home instance of AudioBookShelf](https://quannguyen.ca/setting-up-audiobookshelf/) by Rambles of Q
