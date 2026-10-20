---
title: Self Hosted Media With Docker
slug: self-hosted-media-with-docker
summary: My homelab setup using a media stack on Docker with Jellyfin and the Arr apps
description: How I built and run my self hosted media stack with Docker, Jellyfin and the Arr apps.
date: 2026-02-28T12:00:00+03:00
categories: [Technical]
tags: [Homelab, Docker, Self-Hosting]
draft: false
---

I originally built this media stack as a complete beginner to homelabbing. 
It started as a way to learn Docker while automating my setup and slowly turned into something I rely on daily. 
Over time I refined it to the point where it runs quietly and flawlessly in the background.

I'm planning to migrate everything to Proxmox soon, so I'm posting my internal documentation before I tear it down. 
This isn't the only way to do it.
It's simply how I did mine.

## Hardware

This runs on my old laptop with an Intel Core i5-7200U with 8 gigs of DDR4 RAM and no dedicated GPU on bare metal Linux. 
The distro doesn't really matter since everything runs inside Docker but if you really need to know, I've used this setup with Arch Linux, Omarchy (which is basically pre-configured Arch) and CachyOS. 
Nothing fancy. 
No enterprise gear. 
Just hardware I had lying around.

## Why This Stack

-   **Jellyfin** because it's open source. No paid tiers. No "upgrade to unlock this feature". No authentication that needs to phone home. I want my media server to be mine.
-   **qBittorrent** because it's reliable and I'm used to it.
-   **Prowlarr** because managing indexers in one place is significantly cleaner.
-   **Radarr / Sonarr / Bazarr** because automation is the whole point.
-   **Docker** because I can tear this down and spin it back up anywhere.

## Folder Mapping

At a high level, all the files live under `/data` on the host.
This is my current structure:

    data
    ├── torrents
    │   ├── completed
    │   └── incomplete
    └── media
        ├── movies
        └── tv

Create your directories before proceeding.
Here's an easy command to run in your `/data` directory if you want a
similar scheme:

``` shell
mkdir -p torrents/{completed,incomplete} && mkdir -p media/{movies,tv}
```

## Setup Process

The full `docker-compose.yml` files and `.env.example` templates live in
my homelab repository: [github.com/insidemordecai/homelab/tree/blog-media-stack-2026](https://github.com/insidemordecai/homelab/tree/blog-media-stack-2026).

Clone it or download a zip of it.

### Step 0

- In the root directory, copy all `.env.example` templates as `.env` in
each subdirectory:

``` shell
find . -name '.env.example' -execdir cp .env.example .env \;
```

- Navigate to the directory with the `docker-compose.yml` file.
- Add your user to the `docker` group so you don't need `sudo` for every
command:

``` shell
sudo usermod -aG docker $USER
newgrp docker
```

- Change ownership of the data volume specified in the `.env` file so all
services can access it:

``` shell
chown -R 1000:1000 /data/volume/in/.env/file
```

- Create a shared Docker network: (I prefer this approach with Cloudflare Tunnels)

``` shell
docker network create stacknet
```

- Lastly, use the appropriate commands with the containers:

``` shell
docker compose up -d # to deploy containers
docker compose stop # to stop containers
docker compose rm # to remove containers (stop them first)
```

- Now configure each application.

> [!CAUTION]
> `.env` files in my repository are ignored by Git. 
> Do not commit or push tokens or credentials.

## qBittorrent

Launch qBittorrent and log in.
The username is `admin` while the password is randomly generated on first launch.
To find the password:

``` shell
docker logs qbittorrent
```

Change the credentials under **Web UI → Authentication**.

Configure qBittorrent to your liking.
My preferences are:

-   Web UI → Authentication
    -   Bypass authentication for clients on localhost
    -   Set "Ban client after consecutive failures" to 0 (be careful if
        exposing qBittorrent)
-   Downloads → Saving Management
    -   Default save path: `/data/torrents/completed`
    -   Keep incomplete torrents in: `/data/torrents/incomplete`
    -   Enable Automatic torrent management
-   Connections → Listening Port
    -   Match whatever you forwarded on your router
-   BitTorrent
    -   Configure queueing and seeding limits to your liking

## Arr Apps

### Prowlarr

Go to **Settings → Download Clients** and add qBittorrent.

Match the Web UI port (default 8080) and enter credentials.
Host can be `qbittorrent`, test and save.

Add your indexers, test and save.

### Flaresolverr

No configuration required in the container itself.

In Prowlarr:

-   Settings → Indexers
-   Add Flaresolverr
-   Host: `http://flaresolverr:8191/`
-   Tag: `flaresolverr`

Attach the tag to any problematic indexer that needs to bypass Cloudflare Captcha.

### Radarr

Under **Settings → Media Management**, add Root Folder: `/data/media/movies` (match your `docker-compose.yml`)

Under **Settings → Download Clients**, add qBittorrent (similar process to Prowlarr above) and test.

Configure **Remote Path Mapping**:

-   Host: `localhost`
-   Remote path: `/WHERE_YOUR_DATA_VOLUME_IS/data/torrents/completed`
-   Local path: `/data/torrents/completed`

Copy the API key from **Settings → General**.

In Prowlarr:

-   Settings → Apps
-   Add Radarr
-   Use `http://container-name:port` format in the Prowlarr/Radarr server field
-   Paste the API key

My tweaks:

-   Media Management
    -   Check "Unmonitor Delete Movies"
    -   Set "Proper and Repacks" to "Do Not Prefer"
    -   Adjust Movie Folder Format (I include IMDb ID inline with [Jellyfin's naming scheme](https://jellyfin.org/docs/general/server/media/movies))
-   Custom Formats
    -   Medium File Size  - set your minimum and max file size for media downloaded and check 'Required'. You can create another for Small and Large file sizes if desired.
    -   x264 - use preset under *Release Title* and check *Required* to find files encoded with H.264.
    -   x265 - use preset under *Release Title* and check *Required* to find files encoded with H.265.
    -   Repack/Proper from [TRaSH Guide's Collection](https://trash-guides.info/Radarr/Radarr-collection-of-custom-formats/#repackproper) to allow Radarr to still pick repacks/proper files.
-   Profiles
    -   Disable Remux, they tend to be large files.
    -   Score the custom formats according to preference e.g 1000 for Medium File Size, 100 for Repack/Proper and another score x264 and x265.

### Sonarr

Same process as Radarr, but Root Folder: `/data/media/tv`.

Configure Download Client and Remote Path Mapping the same way.
Link Sonarr to Prowlarr the same way using the API key.

In Media Management:

-   Follow [Jellyfin TV naming scheme](https://jellyfin.org/docs/general/server/media/shows) to Include IMDb ID in *Series Folder Format*.
-   Check *Rename Episodes*

### Bazarr

Under **Settings → Sonarr**, enable and configure connection.
Set the minimum score in **Options** to `90` (TRaSH-Guide recommendation).

Under **Settings → Radarr**, enable and configure the connection.
Minimum score: `80`

Under **Settings → Languages**, pick your desired language under *Languages Filter*.
Create a Language Profile under *Languages Profile* and assign it as default for Series and
Movies under *Default Language Profiles For Newly Added Shows*.

Add subtitle providers under **Settings → Providers**.
Create an account with a provider such as [opensubtitles.com](https://opensubtitles.com) first.

Under **Settings → Subtitles**:
- Enable 'Ignore Embedded PGS Subtitles' and 'Ignore Embedded ASS Subtitles' under *Embedded Subtitles Handling*. This is important if your media player has issues with these type of subtitles e.g Jellyfin for Samsung TV (check out [Jellyfin 2 Samsung](https://github.com/PatrickSt1991/Samsung-Jellyfin-Installer) and [Install Jellyfin Tizen](https://github.com/Georift/install-jellyfin-tizen) for how to sideload the app)
- Enable 'Automatic Subtitles Audio Synchronization' under *Audio Synchronization / Alignment*.
-   Score Threshold:
    -   Series: `96`
    -   Movies: `86`
## Jellyfin

Complete initial setup in browser and map your libraries:

-   Movies: `/data/media/movies`
-   TV: `/data/media/tv`

That's it.
Tweak the settings to your liking.

## Jellyseerr
> [!NOTE]
> And wouldn’t you know it, just after posting this article I learned that the Seerr team [announced](https://docs.seerr.dev/blog/seerr-release) they’ll be merging Overseerr and Jellyseerr. 
> You can find the [migration guide here](https://docs.seerr.dev/migration-guide).
> Also, you can find my Seerr implementation on my [GitHub repo](https://github.com/insidemordecai/homelab).

Follow the on-screen guide.

-   Jellyfin hostname: `jellyfin`
-   Leave the port as is unless you had changed this
-   Test and save, the API keys will auto-configure
-   Add Radarr and Sonarr

## Firewall

You may need to allow certain ports, but only if necessary.

For example, if using `ufw`:

``` shell
sudo ufw allow 6881/tcp #default qBittorrent listening port
sudo ufw allow 6881/udp
```

Be deliberate. 
Don't open ports blindly.

## A Note on Exposing Services

If you decide to expose any of these services outside your local network, understand the risks first.

Do not just forward ports and hope for the best. 
Use proper authentication, reverse proxies, or secure tunnels. 
Know what you're exposing and why.

This stack runs perfectly fine entirely within a local network.
The next post will show [how to use Cloudflare Tunnels to securely expose some services]({{< ref "posts/202603-homelab-cloudflare-tunnel/index.md" >}}).

---

The full compose files and configuration templates are available here:
[github.com/insidemordecai/homelab/tree/blog-media-stack-2026](https://github.com/insidemordecai/homelab/tree/blog-media-stack-2026)

This setup has been stable for me for a long time.
If I ever need to rebuild it on another machine, it's just a matter of cloning the repo and running `docker compose up -d`.

Next step: rebuilding this properly under Proxmox.

## Explore Further

- [Servarr Wiki](https://wiki.servarr.com/)
- [TRaSH Guides](https://trash-guides.info/)
- [TechHut's Setup](https://github.com/TechHutTV/homelab/)
