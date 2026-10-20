---
title: IT Support
slug: it-support
aliases: /ksc
summary: Simple guide to some IT Support concepts
description: Simple guide to some IT Support concepts
date: 2023-09-07
categories: [Technical]
tags: []
draft: false
---

{{< alert "circle-info" >}}
Use Table of Content to quickly jump to desired section 
{{< /alert >}}

<br>

{{< alert "edit" >}}
**WIP:** Still updating this post whenever something comes up.
{{< /alert >}}

## Download Windows/Office Images

For Windows disk images, you can get the latest versions directly from Microsoft via these links:
- [Windows 10](https://www.microsoft.com/en-us/software-download/windows10ISO)
- [Windows 11](https://www.microsoft.com/software-download/windows11)

Alternatively, you can download Windows/Office using sites that host the image files.
Microsoft provides consumer ISOs for free on their [site](https://www.microsoft.com/en-us/software-download), but other versions, and crucially older ISOs are locked behind paywalls thus various sites have popped up that host the files on their servers such as:
- [massgrave.dev/genuine-installation-media](https://massgrave.dev/genuine-installation-media)
- [tb.rg-adguard.net](https://tb.rg-adguard.net/public.php) (the OG)

## Activating Windows/Office

It's a constant game of cat and mouse between Microsoft and unofficial activators and as such the information below may easily get outdated.
For the latest activation scripts, check [massgrave.dev (MAS)](https://massgrave.dev/).

### Windows 
1. Disable your third-party antivirus if applicable. For ESET, this will mean disabling real-time protection and HIPS.
2. Windows will re-enable Windows Security, so we will need to disable it. 
   - Head over to virus and threat protection settings, disable all the options 
   - Head over to app and browser control, then into reputation based settings and disable all the options 
   - For Windows 8/8.1, open Windows Defender and disable real-time protection.
3. Open KMS Auto Net (no need to unzip)
4. Run the executable 
5. Select activation and pick Windows
6. After activation, re-enable Windows Security 
7. Re-enable your third-party antivirus


### Office 

**For Office 2016**, follow the same instructions as Activating Windows but upon running the KMS software, select Office.

**For Office 2019**, open Powershell as an administrator and run this command:


```powershell
irm https://massgrave.dev/get | iex
```

From there, follow the guide selecting relevant numbers to activate Office.

**For Office 2021:**
- Copy the script below into notepad and save it.


```cmd
@echo off
title Activate Microsoft Office 2021 (ALL versions) for FREE - MSGuides.com&cls&echo =====================================================================================&echo #Project: Activating Microsoft software products for FREE without additional software&echo =====================================================================================&echo.&echo #Supported products:&echo - Microsoft Office Standard 2021&echo - Microsoft Office Professional Plus 2021&echo.&echo.&(if exist "%ProgramFiles%\Microsoft Office\Office16\ospp.vbs" cd /d "%ProgramFiles%\Microsoft Office\Office16")&(if exist "%ProgramFiles(x86)%\Microsoft Office\Office16\ospp.vbs" cd /d "%ProgramFiles(x86)%\Microsoft Office\Office16")&(for /f %%x in ('dir /b ..\root\Licenses16\ProPlus2021VL_KMS*.xrm-ms') do cscript ospp.vbs /inslic:"..\root\Licenses16\%%x" >nul)&echo.&echo =====================================================================================&echo Activating your product...&cscript //nologo slmgr.vbs /ckms >nul&cscript //nologo ospp.vbs /setprt:1688 >nul&cscript //nologo ospp.vbs /unpkey:6F7TH >nul&set i=1&cscript //nologo ospp.vbs /inpkey:FXYTK-NJJ8C-GB6DW-3DYQT-6F7TH >nul||goto notsupported
:skms
if %i% GTR 10 goto busy
if %i% EQU 1 set KMS=kms7.MSGuides.com
if %i% EQU 2 set KMS=e8.us.to
if %i% EQU 3 set KMS=e9.us.to
if %i% GTR 3 goto ato
cscript //nologo ospp.vbs /sethst:%KMS% >nul
:ato
echo =====================================================================================&echo.&echo.&cscript //nologo ospp.vbs /act | find /i "successful" && (echo.&echo =====================================================================================&echo.&echo #My official blog: MSGuides.com&echo.&echo #How it works: bit.ly/kms-server&echo.&echo #Please feel free to contact me at msguides.com@gmail.com if you have any questions or concerns.&echo.&echo #Please consider supporting this project: donate.msguides.com&echo #Your support is helping me keep my servers running 24/7!&echo.&echo =====================================================================================&choice /n /c YN /m "Would you like to visit my blog [Y,N]?" & if errorlevel 2 exit) || (echo The connection to my KMS server failed! Trying to connect to another one... & echo Please wait... & echo. & echo. & set /a i+=1 & goto skms)
explorer "http://MSGuides.com"&goto halt
:notsupported
echo =====================================================================================&echo.&echo Sorry, your version is not supported.&echo.&goto halt
:busy
echo =====================================================================================&echo.&echo Sorry, the server is busy and can't respond to your request. Please try again.&echo.
:halt
pause >nul
```
- Rename the file to change the file extension to `.cmd` (instead of `.txt`). 
  
  *If you can't see the file extension, head over to File Explorer and enable file extensions.*
- Run the script as administrator

If it fails to reach a server, try it over and over. 
When successful, it will prompt you to read the [MS Guides](https://msguides.com) blog.
Type Y if you'd like to read it or N for no. 

## Resolve 'Get genuine Office' Warning

If Office prompts you to get genuine office, copy the command below, paste into text document and save it with a `.cmd` file extension. 

```cmd
"C:\Program Files\Common Files\microsoft shared\ClickToRun\officec2rclient.exe" /update user updatetoversion=16.0.13801.20360
```

What it does is downgrade the office to an older version that doesn't have this warning. 
After which you can disable office updates otherwise it will upgrade back to a higher version with the same banner.

To avoid the banner in the first place, then activate office using [MAS](https://massgrave.dev/).

Read ['Get genuine Office' banner](https://massgrave.dev/office-license-is-not-genuine) for more info.

## Burn Windows Onto a USB Stick

### All Windows Version 
- Connect USB stick to computer 
- Run [Rufus](https://rufus.ie) software
- Ensure the program has selected the correct external storage (your USB stick)
- Click SELECT to pick your Windows ISO file 
- Choose between GPT or MBR partition scheme depending on the computer you want to install Windows. 
  General rule of thumb, pick GPT for newer computers and MBR for older ones
- Leave the remaining options as is. 
- Click START
- Once complete you can eject the USB stick (except for Windows 8.1, continue with the guide below)

### Windows 8.1 skip product key

By default, there is no option to skip adding a product key during Windows 8.1 installation but we can bring it back. 

After flashing Windows 8.1 onto a USB stick, open file explorer and head over to `/sources` folder in the USB stick.
Create a text file called `ei.cfg` and paste this. 

```text
[EditionID]

[Channel]
Retail
[VL]
0
```

Source: [Elmo on StackExchange](https://superuser.com/a/498437)

## Useful Tools
1. [Rufus](https://rufus.ie/en/)
2. [Ventoy](https://www.ventoy.net/)
3. [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/)
