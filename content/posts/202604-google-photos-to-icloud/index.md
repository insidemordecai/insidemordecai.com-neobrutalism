---
title: How I Migrated from Google Photos to iCloud Photos
slug: google-photos-to-icloud
summary: Surprisingly, getting my photos and their metadata out of Google and into iCloud is not simple.
description: Google Photos to iCloud Photos isn't straightforward. Here's what I ran into and the tool that finally got the job done. 
date: 2026-04-21T21:31:41+03:00
categories: [Technical, Updates]
tags: [Google Photos, iCloud Photos]
draft: false
---

{{< accordion >}}
  {{< accordionItem title="TLDR" open=false >}}
First of all, check out if you have the [official Google Photos to iCloud Photos](https://support.apple.com/en-us/120924) option available in [Google Takeout](https://takeout.google.com/).
If not, then try out [google-photos-migrate](https://github.com/garzj/google-photos-migrate) for a simple way to merge your Takeout metadata files and the images.
  {{< /accordionItem >}}
{{< /accordion >}}

After years and years of Apple bugging me to upgrade to iCloud+, I finally jumped ship. 
The logical next step was to migrate from Google Photos to iCloud Photos. 
But let me tell you Maina, the process was not easy. 

I knew I would likely need to get my data from [Google Takeout](https://takeout.google.com/) and so I did. 
The process was straightforward despite Google seemingly never updating that page. 
In all honesty, the UX could be improved, and finding that page in the first place is its own challenge.
It honestly feels buried on purpose.

Anyway, I downloaded my photos and that's when I discovered every image file had a separate JSON file associated with it. 
Turns out the images didn't have any metadata embedded in them and if I were to upload them as-is, all the images would show as being from the day of the download.
The actual metadata was being stored in the JSON file. 
What a pain in the a- 

However, I discovered there is an [official migration](https://support.apple.com/en-us/120924) option but lo and behold, Google didn't offer it to me. 
I had to figure out how to somehow merge my photos and the metadata files. 
So it was back to the drawing board. 

[ExifTool](https://exiftool.org/) emerged as the best option through my quick research with this [article](https://legault.me/post/correctly-migrate-away-from-google-photos-to-icloud) from Mathieu Legault (and others) shedding light on it. 
I didn't end up using the guide because once again, Google did what they do best. 
They changed the metadata naming scheme with no backward compatibility, and somehow introduced filename inconsistencies too. 

I wasn't the only one in this boat, so it was only a short time before I stumbled upon [an elegant solution](https://blog.rpanachi.com/how-to-takeout-from-google-photos-and-fix-metadata-exif-info) by Rodrigo Panachi. 
He had a simple Ruby script to fix the filenames before using ExifTool.
That gave me the idea that perhaps there may be newer scripts out there that did everything. 

That's when I found what I was looking for, a tool called [google-photos-migrate](https://github.com/garzj/google-photos-migrate).
It could do exactly what I wanted. 
It resolves the filename issue, finds duplicates, moves errored images to a separate folder, and of course corrects the photo metadata.
The hassle afterwards is that if you already had some images on iCloud Photos, it would take some time for duplicates to surface and even longer to accurately recognise faces or even recognise them at all. 

But at least all your photos AND their metadata finally made it to your new home. 
