---
title: Things To Do After Installing Fedora Workstation
slug: fedora-linux-setup-guide
summary: A beginner friendly way of how I go about setting up Fedora Linux and GNOME. 
description: A beginner friendly way of how I go about setting up Fedora Linux and GNOME. 
date: 2022-10-27T23:05:20+03:00
categories: [Technical]
tags: [Operating Systems, Linux, Fedora, Post Install]
draft: false
---

This is exactly as the title suggest - setting up [Fedora Workstation][fedora], feel free to follow my guide tweaking where necessary.

## DNF Configuration

By default DNF is slow (maybe DNF5 might change that in the future), to fix that we shall add a DNF flag to allow more than one download at a time and set yes as the default option for future DNF commands.

```sh
echo 'max_parallel_downloads=10' | sudo tee -a /etc/dnf/dnf.conf
echo 'defaultyes=True' | sudo tee -a /etc/dnf/dnf.conf
```

## System Update

```sh
sudo dnf update -y
```

## Enable RPM Fusion

This will give us access to way more apps/software that are not available on the standard Fedora repository.

```sh
sudo dnf install https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
sudo dnf groupupdate core
```

For more information, check out the [RPM Fusion][rpm-fusion] website

## Enable Flathub

Older Fedora versions ship with a filtered Flathub enabled,therefore, we need to add [unfiltered Flathub][flathub] to use their store.

```sh
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

## Install Media Codecs

After setting up RPM Fusion, you can add these multimedia packages:

```sh
sudo dnf groupupdate multimedia --setop="install_weak_deps=False" --exclude=PackageKit-gstreamer-plugin
sudo dnf groupupdate sound-and-video
sudo dnf group upgrade --with-optional Multimedia
```

Recently, Fedora removed some hardware accelerated codecs from their default install but the guys at RPM Fusion have done their magic. Head over to the [Multimedia page of RPM Fusion][rpm-fusion-mm] and under the Hardware Accelerated Codec section, pick the command(s) for your setup. For those running Intel 5th Gen (Broadwell) and above pick the `intel-media-driver` option while those running older processors can opt for `libva-intel-driver`. 

For more information, check out the [RPM Fusion][rpm-fusion] website.

## Add Extra Fonts

```sh
sudo dnf install fira-code-fonts 'mozilla-fira*' 'google-roboto*' -y
```

For compatibility, Microsoft fonts may be needed:

```sh
sudo dnf install -y curl cabextract xorg-x11-font-utils fontconfig
sudo rpm -i https://downloads.sourceforge.net/project/mscorefonts2/rpms/msttcore-fonts-installer-2.6-1.noarch.rpm
```

<!--
And finally adding, [an alternative to proprietary fonts:][fedora-better-fonts]

```sh
sudo dnf copr enable dawid/better_fonts -y
sudo dnf install fontconfig-font-replacements -y
```
-->

I also add these fonts to `~/.local/share/fonts` since I use them in my terminal emulator and other apps:

- [Comic Mono][comicmono]
- [SF Mono Nerd Font][sf-mono-nf]

{{<alert "circle-info">}}
If not satisfied, there is always the option of adding fonts into the fonts directory from Windows or another Operating System
{{</alert>}}

## Install GNOME Tweaks

This allows us to make some customization changes like adding/removing titlebar buttons (maximize/minimize), changing themes and fonts among other things. I tend to change the Monospace Text font to a Nerd Font.

```sh
sudo dnf install gnome-tweaks
```

In my experience, changing these helps a lot:

- **Hinting**: Slight
- **Antialiasing**: Subpixel (this may vary depending on your display setup).

Use [adw-gtk3] as the theme for legacy apps for them to look more cohesive with other apps using [libadwaita][libadwaita].

## Install Apps and Extensions

Apps I use include:

- **Browsers**: Firefox (flatpak version), [Brave Browser][brave]
- **Coding**: VS Code, [Android Studio][android-studio], Neovim
- **Gaming**: Steam
- **Multimedia**: Spotify, VLC, Jellyfin
- **Terminal Emulator**: Alacritty (including [nautilus-open-any-terminal] and [starship])
- **Torrent Client**: qBittorrent
- **Utilities**: htop, [Xtreme Download Manager][xdm] (only for YouTube and large downloads)
- **Others**: Discord, Extension Manager, gThumb, [ProtonVPN][protonvpn-fedora-download], [Solaar][solaar] (for Logitech peripherals)

Afterwards, I remove the extra apps thats I don't need, for me these include totem (GNOME Videos), GNOME Weather, Firefox (pre-installed version), GNOME Terminal etc.

Typically I play around with some extensions or have mixed feelings about some (**\***) but these are the extensions that I install from the Extensions Manager app and use:

- AppIndicator and KStatusNotifierItem Support
- Blur my Shell **\***
- Caffeine
- Dash to Dock
- GSConnect
- Pano - Clipboard Manager
- Rounded Window Corners

{{<alert>}}
I do not recommend installing a lot of extensions as they could slow down your system or some could be left unmaintained/lose support across GNOME updates.
{{</alert>}}

## Firefox Tweaks

On Firefox, YouTube shows the scrollbars in fullscreen which makes it very easy for me to accidentally click it and suddenly move down the page. To fix this, I add this line to my [uBlock Origin][ublock-origin] filter:

```text
www.youtube.com##ytd-app:style(overflow: hidden !important;)
```

That line disables YouTube's scroll-to-comments "feature" which to me is not as important but used to be to quickly check video publish date.

[Credit: This Reddit comment][reddit-comment-firefox]

By default, hardware acceleration is disabled but head over to `about:config` and toggle this option:

```text
media.ffmpeg.vaapi.enabled
```

I've also noticed that the flatpak version of Firefox does not have two finger swipe by default, run this command to fix that:

```sh
sudo flatpak override --env=MOZ_ENABLE_WAYLAND=1
```

## Setup Coding Environment and Dotfiles

I usually create a directory in `~` where I set up Flutter and any other SDK in this directory. Afterwards, I create another directory in `~` to store most of my projects.

At this point, I clone my [dotfiles backup][.dotfiles] into `~` and run the script to setup my config files.

## Make It Yours

- Change wallpaper
- Schedule night light
- Add online accounts
- Mute system sounds and mic
- Switch to 24h clock format
- Add, reorder and remove items from the dock

Anyway, feel free to reach out.

Cheers ✌️


## Note To Self

The curled scripts below are meant for my personal use. It performs most of the things listed in this article apart from: installing extensions, installing Android Studio, Firefox tweaks, changing GNOME Tweaks, setting up Flutter
```sh
curl -s -o- https://raw.githubusercontent.com/insidemordecai/.dotfiles/main/quick-setup/fedora.sh | bash
curl -s -o- https://raw.githubusercontent.com/insidemordecai/.dotfiles/main/quick-setup/rpm-apps-install.sh | bash
curl -s -o- https://raw.githubusercontent.com/insidemordecai/.dotfiles/main/quick-setup/flatpaks-install.sh | bash
```

<!-- Links - place alphabetically -->

[adw-gtk3]: https://github.com/lassekongo83/adw-gtk3 "An unofficial GTK3 port of libadwaita."
[android-studio]: https://developer.android.com/studio "The official Integrated Development Environment (IDE) for Android app development."
[brave]: https://brave.com/ "Brave Browser - Browser Privately!"
[comicmono]: https://github.com/dtinth/comic-mono-font "A legible monospace font...  the very typeface you’ve been trained to recognize since childhood"
[.dotfiles]: https://github.com/insidemordecai/.dotfiles "My dotfiles backup repository on GitHub"
[feature-source]: https://www.reddit.com/r/Fedora/comments/yawrfu/5120_x_1440_oc_i_present_you_my_simple_fedora/ "r/Fedora post"
[fedora]: https://getfedora.org "Fedora - Welcome to Freedom."
[fedora-better-fonts]: https://github.com/silenc3r/fedora-better-fonts "Free substitutions for popular proprietary fonts from Microsoft and Apple operating systems"
[flathub]: https://flathub.org "An app store and build service for Linux"
[libadwaita]: https://gitlab.gnome.org/GNOME/libadwaita "Libadwaita on GNOME's GitLab - Building blocks for modern GNOME applications"
[nautilus-open-any-terminal]: https://github.com/Stunkymonkey/nautilus-open-any-terminal "Nautilus plugin to allow opening any terminal"
[protonvpn-fedora-download]: https://protonvpn.com/support/official-linux-vpn-fedora/ "ProtonVPN installation guide for Fedora"
[reddit-comment-firefox]: https://www.reddit.com/r/firefox/comments/lija24/comment/gph104v/?utm_source=share&utm_medium=web2x&context=3 "comment on r/Firefox"
[rpm-fusion]: https://rpmfusion.org/Configuration "RPM Fusion's Configuration Page"
[rpm-fusion-mm]: https://rpmfusion.org/Howto/Multimedia "RPM Fusion's Multimedia Page"
[sf-mono-nf]: https://github.com/epk/SF-Mono-Nerd-Font "Apple's SF Mono font patched with the Nerd Fonts patcher"
[shortwave]: https://flathub.org/apps/details/de.haeckerfelix.Shortwave "Shortwave is an internet radio player that provides access to a station database with over 25,000 stations."
[solaar]: https://pwr-solaar.github.io/Solaar/ "Linux Device Manager for Logitech Unifying Receivers and Devices."
[starship]: https://starship.rs/ "Command line prompt"
[ublock-origin]: https://ublockorigin.com/ "uBlock Origin - Free, open-source ad content blocker."
[xdm]: https://xtremedownloadmanager.com/ "Powerfull download accelerator and video downloader."
