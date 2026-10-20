---
title: How to Set Up Trailarr
slug: trailarr-setup
summary: Automating trailer downloads and management for my media library.
description: How to automate trailer downloads and management for a large media library using Trailarr - a self-hosted app.
date: 2026-09-21T14:22:52+03:00
categories: [Technical]
tags: [Homelab, Self-Hosting, Trailarr]
draft: false
---

After [setting up Audiobookshelf]({{< ref"posts/202608-audiobookshelf-setup/index.md">}}), my media stack was pretty much complete. 
That was until I tried [Moonfin](https://moonfin.io/) and realised trailers would be a nice addon. 
In another post, I might write on why Moonfin is my current favourite Jellyfin client for TV and how to set it up, but what it revealed to me is that I need high quality trailers on my server instead of the default low quality YouTube options it defaulted to.
Cue in Trailarr. 

Having Radarr/Sonarr is a pre-requisite and if you have set them up, then this is going to be a piece of cake. 

The first step is to create a `docker-compose.yml` file based on the [official Docker Compose template](https://nandyalu.github.io/trailarr/getting-started/02-installation/docker-compose/) and adjusting it to match your setup. 
Read through the linked page to fully understand the available options. 
My current setup is this: 

```yml
services:
  trailarr:
    image: nandyalu/trailarr:latest
    container_name: trailarr
    environment:
      - TZ=${TZ}
    volumes:
      - ./appdata/trailarr:/config # For Trailarr's database and logs
      - ${DATA_VOLUME}/data:/data # Radarr & Sonarr map
    ports:
      - "7889:7889" # Or choose a different host port if 7889 is taken, leave the right side as is
    networks:
      - stacknet
    restart: unless-stopped
```

In line with my previous posts,  `${DATA_VOLUME}` is the location in which my `/data` directory is located while `${TZ}` points to my timezone , both configured in a `.env` file. 
Additionally, `stacknet` is my custom shared network across different Docker stacks. 

Beyond that the next steps, are as follows: 
- Log into Trailarr (use the port set up in the Docker Compose file - 7889)  with `admin`  as the default username and `trailarr` as the default password. 
- Change the credentials. Need I not mention how important this is? You can do that under **Settings → About** then click on 'Update Login' button.
- Change preference to 4K trailers **(Optional)**. Trailarr comes with pre-configured profiles for both movies and TV series, and you can definitely use it as-is but I personally tweak it to prefer 4K trailers over 1080P . The benefit is it will fall back to 1440P or 1080P if 4K is unavailable. You can do this by going to **Settings → Profiles** and clicking into the two available profiles, scroll down to *Video* and pick 2160P under *Video Resolution*.
- The final step is to connect it to Radarr and Sonarr. Head over to **Settings → Connection**, click on 'Add New' and fill in the details in line with your setup then map your media paths. 
	- You can name it however you want and add as many different connections as you want for one specific service.
	- The API Key will be in **Settings → General** of the either Radarr or Sonarr
	- For my setup, the Radarr map is as such: `/data/media/movies` maps to `/data/media/movies` Trailarr path.

Trailarr should immediately start downloading missing trailers, just be patient depending on the size of your media library. 

Et voilà!
You're trailer download automation is done. 
## Explore Further 
- [Trailarr Docs](https://nandyalu.github.io/trailarr/)
- [Missing Trailers? Set Up Trailarr on Unraid to Fix That!](https://youtu.be/Hz31zWEtY5k) - despite being on Unraid, this video helped a lot to visualise the setup.
