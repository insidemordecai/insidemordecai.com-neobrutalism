---
title: Cloudflare Tunnel for Homelab Services
slug: homelab-cloudflare-tunnel
summary: Using Cloudflare Tunnel to securely expose my homelab services.
description: How I use Cloudflare Tunnel to securely expose my Docker homelab services without opening ports or revealing my public IP. 
date: 2026-03-09T20:05:15+03:00
categories: [Technical]
tags: [Homelab, Cloudflare Tunnel]
draft: false
---

After getting my media stack stable as shown in my [previous post]({{< ref "posts/202602-self-hosted-media-with-docker/index.md" >}}), the next question was remote
access.

As a side note, since I'll be changing my homelab setup, I'm thinking of adding [Tailscale](https://tailscale.com/) as a VPN to securely connect to certain services.

Anyway, I already manage my domains on Cloudflare, so using Cloudflare Tunnel would always the cleanest option.
I had used it before in Fedora and tried a containerized version on Arch. 
So it was only natural for me to side-step to a Docker Compose setup. 

This is how I set mine up.

## Why Cloudflare Tunnel

-   No port forwarding
-   No exposing my public IP
-   Encrypted traffic by default
-   Works well if you already use Cloudflare for DNS

It's simple. 
It's predictable. 
And it removes a lot of the usual home network headache.

That being said, exposing internal services always carries risk. 
Try to understand what you're doing before making anything public.

## Setup Process

Create a tunnel from the Cloudflare dashboard: **Zero Trust → Network → Connectors**.

After creating it, Cloudflare gives you a command to run the connector.
For Docker, it looks like this:

``` shell
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token randomTextHereAsTokenlSP1kY34p8^jKaX28XGo5xR5uVXftLHP0Y3+pBmT$jg
```

Copy the token that appears after `--token` and add it to your `.env` file:

    TOKEN=randomTextHereAsTokenlSP1kY34p8^jKaX28XGo5xR5uVXftLHP0Y3+pBmT$jg

Deploy the container using your compose setup.
If you look at my setup in the previous post, I create a shared network. 
This is simply to make it easy for the containers to communicate with each other since I have Cloudflared and the Arr Apps running in different stacks.

## Application Routes

Back in the Cloudflare dashboard, configure application routes for the tunnel.

Each route maps:

-   A public hostname (for example `seerr.yourdomain.com`)
-   To a local service (for example `http://seerr:5055`)

You can point different subdomains to different containers inside your Docker network.
Once saved, traffic flows through Cloudflare to your connector, and then into your local container.
No open ports required.

## A Note on Security

Just because you can expose something doesn't mean you should.

Make sure:

-   Strong authentication is enabled (check out Explore Further section below for guide on Access Control)
-   Default credentials are changed
-   Services are updated
-   You actually need remote access

Cloudflare Tunnel makes exposure safer, not magically safe.

If you're unsure, keep everything local.

## That's It

Once the tunnel is running, it's mostly invisible. 
It just works in the background.

For me, this paired perfectly with my Docker media stack. 
Clean internal networking, and controlled external access when needed.

You can find compose files here:
[github.com/insidemordecai/homelab/tree/blog-media-stack-2026](https://github.com/insidemordecai/homelab/tree/blog-media-stack-2026)

## Explore Further 

- [Cloudflare Tunnel Official Docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- How to [create a tunnel (dashboard)](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/) - step‑by‑step guide to creating and connecting your first tunnel directly from the Cloudflare dashboard.
- [Cloudflare Tunnels for Your Home Server](https://benjamintseng.com/2025/07/cloudflare-tunnels-for-your-home-server/) - [Benjamin Tseng ](https://benjamintseng.com/)has a solid section on authentication and access control that you can adapt for your media stack.
- [How to SECURELY gain access to your locally self-hosted services from outside](https://www.reddit.com/r/selfhosted/comments/1bf9si9/guide_how_to_securely_gain_access_to_your_locally/) - a Reddit guide on [r/selfhosted](https://www.reddit.com/r/selfhosted/).
- [Securing Cloudflare with Cloudflare: a Zero Trust journey](https://blog.cloudflare.com/securing-cloudflare-with-cloudflare-zero-trust/) - a deeper dive into how Cloudflare applies Zero Trust principles to its own stack.

