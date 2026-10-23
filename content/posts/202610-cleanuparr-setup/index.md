---
title: How to Set Up Cleanuparr
slug: cleanuparr-setup
summary: Automating download cleanup in my homelab setup.
description: How to automate download management for the Servarr ecosystem and qBittorrent download client. 
date: 2026-10-22T15:36:31+03:00
categories: [Technical]
tags: [Homelab, Self-Hosting, Cleanuparr]
draft: false
---

For quite some time, I've had to manually clean up downloads in my download client. 
I experience this with mostly unaired episodes on Sonarr. 
What happens is that there often are torrents named after unaired episodes containing malware and all sorts of unwanted files. 
These files get downloaded but are not imported by Radarr/Sonarr because they don't contain the expected files. 
Typically this is malware for Windows computers so it doesn't affect my Linux setup but it prevents Sonarr from downloading the wanted files when the episode finally airs. 
Additionally, it fills up my storage necessitating frequent manual intervention. 

## Prerequisite
### Harden Radarr/Sonarr and qBittorrent
Most users recommend hardening your arr applications and download client, which is what I did. 
Even though it didn't help before I settled on Cleanuparr, I still highly recommend to tackle this issue at multiple points. 
- Go to **Settings → Indexers** and click on 'Show Advanced' at the top. 
- Click on each indexer and edit the 'Fail Downloads' option by enabling both 'Executables' and 'Potentially Dangerous'
- Go to qBittorrent's settings and under *Downloads*, tick the 'Exclude file names' box and add some filenames to exclude such as `*.exe`. You can search the web for a list of filenames to exclude (or skip to the blocklist section below) but it is important to note that if you use your download client for other downloads then it is easier to curate the list yourself.

### Prevent Unwanted Redownloads
There is a high likelihood that even on successfully configuring Cleanuparr, Radarr/Sonarr might still send previously blocked releases to your download client. 
To prevent that, configure this in Prowlarr: 
- Go to **Settings → Apps** and click on 'Show Advanced' at the top. 
- Edit each configured application and enable 'Sync Reject Blocklisted Torrent Hashes While Grabbing' 

If you are not managing your indexers with Prowlarr, then configure this individually at the application level. 

## Installation
My preference is always Docker Compose due to how easy and replicable it is.
Create a `docker-compose.yml` file based on the [official quick start template](https://cleanuparr.github.io/docs/installation/quick_start). 

```yml
services: 
 cleanuparr:
    image: ghcr.io/cleanuparr/cleanuparr:latest
    container_name: cleanuparr
    restart: unless-stopped
    ports:
      - "11011:11011"
    volumes:
      - ./appdata/cleanuparr:/config
      - ${DATA_VOLUME}/data:/data
    environment:
      - PORT=11011
      - BASE_PATH=
      - PUID=1000
      - PGID=1000
      - UMASK=022
      - TZ=${TZ}
    networks:
      - stacknet
```

You can read the full [detailed installation guide](https://cleanuparr.github.io/docs/installation/detailed) to understand the available option. 

In my case, `${DATA_VOLUME}` is my storage location while `${TZ}` points to my timezone , both configured in a `.env` file. 
Additionally, `stacknet` is my custom shared network across different Docker stacks.

## Post-Installation
1. Access the web interface (`http://localhost:11011`), create an admin account and setup 2FA. 
2. Log into the newly created account.
3. Configure the desired `*arr` applications.
	- Click on the application on the sidebar and add an instance.
	- Name your instance and fill in the required data. 
	- My personal preference is to use a container name as the hostname and as such for radarr, the host would be `http://radarr:7878`.
	- The API Key will be in **Settings → General** of the respective `*arr` application.
4. Configure your download client.
	- Click on 'Download Clients' on the sidebar and add a client. 
	- Name your instance and fill in the required data. 

That's all the necessary tweaks to make, the next steps are my personal preference to solve my initial problem while keeping the setup simple.

## Extra Configurations.
> [!TIP] Cleanuparr Blocklists
> The Cleanuparr team graciously provide these blocklists that work with Radarr and Sonarr:
> - `https://cleanuparr.pages.dev/static/blacklist`
> - `https://cleanuparr.pages.dev/static/blacklist_permissive`
> - `https://cleanuparr.pages.dev/static/whitelist`
> - `https://cleanuparr.pages.dev/static/whitelist_with_subtitles`

### General 
- I prefer to *disable the support banner*. 
- Enable *Internet Connectivity Check* and add a couple robust public domains for Cleanuparr to test your internet connection with. 
- If you don't have the application exposed to the internet then *disable authentication for local addresses*.

### Queue Cleaner
This monitors your queues and automatically removes downloads based on your configuration.
- Enable queue cleaner. 
- Enable *process downloads with no content ID*.  This is only useful if you manually download stuff. 
- Adjust your cleaning schedule. 
- Configure some extra cleanup rules such as stall rules (I have mine set to take action after 10 strikes if the download is under 50%)

I haven't had to set up anything else under this setting. 

### Malware Blocker 
It's in the name, it simply protects against malicious files in downloads based on a blocklist. 
This works in tandem with your download client's exluded file names configuration. 
- Enable malware blocker. 
- If you use private trackers, then it would be nice to *ignore private torrents*. 
- Enable *process downloads with no content ID*.  This is only useful if you manually download stuff. 
- Under the 'Arr Blocklist' section, enable the `*arr` application you want to configure, fill the blocklist path with the desired blocklist from above and choose the correct blocklist type.

### Download Cleaner
Simply enable this and you're done. 

I already handle the rest in qBittorrent so there's no need to configure the available rules.
If you don't already do that, then Cleanuparr is more granular with amazing options. 

### Blacklist Sync
This syncs blacklist entries from your configured blacklist path to qBittorrent. 
- Enable blacklist sync. Ensure you still have the "Excluded File Name" setting we configure earlier enabled in qBittorrent as Cleanuparr won't enable it for you, it will simply sync the list.
- Fill the 'Blacklist File Path' witch your preferred blacklist. 

---

And that's pretty much it. 

## Explore Further 
- [Cleanuparr Documentation](https://cleanuparr.github.io/)
- [Build a Hardened Arr Stack with Docker Compose: Gluetun, Hardlinks, and Health Checks](https://0y.lol/2026/09/01/build-a-hardened-arr-stack/)
