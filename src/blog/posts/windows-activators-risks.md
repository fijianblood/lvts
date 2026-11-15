Search "activate Windows free" and you'll find videos, posts and forum replies telling you to paste one line into PowerShell. Millions of people have done it, including many here in Fiji, where a genuine licence can feel expensive next to the price of the PC. This article explains what these activation tools are, how they're spread, and the risks that the tutorials don't mention.

## First: what Windows activation is

Activation is how Windows checks that it has a valid licence. On most home PCs it's a **digital licence** linked to the hardware. Businesses often activate through their own **KMS server**, a licensing server on the company network. Office has its own licensing on top.

When Windows isn't activated, it still works, but it shows a watermark and locks some personalisation settings.

## What activation tools actually do

The best-known tool is **Microsoft Activation Scripts (MAS)**, an open-source project from a group called **Massgrave**. One of its developers, known on GitHub as **WitherOrNot**, is a respected reverse engineer: their public work documents how Microsoft's activation and code-protection systems work inside, and includes **TSforge**, a method that changes the data Windows' licensing system keeps so that it records the system as activated.

In plain terms, these tools don't "find" a free licence. They use what researchers have learned about how Windows stores and checks activation to make Windows believe it's licensed, either by getting a digital licence, imitating a company KMS server, or editing the licensing records directly.

The code is public, and the genuine project is widely used without causing infections. **The danger is mostly not the original tool. It's everything around it.**

## How it's pushed around the internet

The usual instruction is a single line: open PowerShell **as administrator** and paste a command that downloads a script from a web address and runs it immediately.

That's quick, and it's exactly what makes it risky:

- **You run whatever that address sends at that moment**, with full control of your PC. You never see the code first.
- **The command gets copied** from video descriptions, comments, chat groups and screenshots. One wrong letter, or a copy from the wrong post, and it points somewhere else.
- **Nobody checks.** People trust it because "everyone uses it".

## Risk 1: lookalike addresses

In December 2025, attackers registered a web address one letter different from the genuine MAS address (`get[.]activate[.]win`, missing a "d"). People who typed or copied the wrong one ran a malicious PowerShell script instead. Researchers reported it installed a malware loader called **Cosmali Loader**, linked to cryptominers and a remote-access trojan. [BleepingComputer reported it](https://www.bleepingcomputer.com/news/security/fake-mas-windows-activation-domain-used-to-spread-powershell-malware/), and victims discussed it [on MalwareTips](https://malwaretips.com/threads/fake-mas-windows-activation-domain-used-to-spread-powershell-malware.138889/).

One missing letter, and the PC was handed to criminals, with administrator rights the victim gave them. [Read our step-by-step breakdown of this attack](../one-letter-typosquat-attack/).

## Risk 2: you can't check what ran

In January 2026, some users found Microsoft Defender blocking the script with a detection named `Trojan:PowerShell/FakeMas.DA!MTB`. Notebookcheck couldn't reproduce the block with the genuine script and suggested that affected users may have been getting a **fake version** through network or DNS problems, in which case Defender was doing its job. [Read their test](https://www.notebookcheck.net/Microsoft-Defender-might-be-right-to-block-Microsoft-Activation-Scripts-MAS.1200734.0.html).

The point for you: when a command downloads and runs code in one step, **you can't tell afterwards whether you got the real one.**

## Risk 3: the habits it teaches

The bigger damage is often what comes next:

- **Turning off antivirus** "because it blocks the activator". That's the moment real malware gets in.
- **Downloading "pre-activated" Windows or Office** from torrents and file-sharing sites. These are a favourite way to hide malware inside trusted programs. We explain how in [our cracked software article](../cracked-software-malware/).
- **Assuming it's safe because it worked.** Malware is designed to let the program keep working.

## Risk 4: it isn't a genuine licence

Activating this way doesn't give you a licence under Microsoft's terms. For a home user, that mostly means no right to the software and no Microsoft support for activation problems. For a business, school or organisation, unlicensed software can be a real problem when a client, auditor or funder asks.

## Will Microsoft shut it down?

The project has been on GitHub, which Microsoft owns, for years. Microsoft hasn't explained publicly why it hasn't removed it. Copies of the code exist on many other sites, so removing one page wouldn't make it disappear. Defender does detect fake copies, as above. Either way, "Microsoft hasn't stopped it" doesn't mean it's licensed or safe for your PC.

## Making genuine software affordable

- **Buy PCs and laptops with Windows already licensed.** The licence is part of the price, usually cheaper than buying it separately.
- **Microsoft 365 subscriptions** spread the cost of Office over months instead of one big payment.
- **Students:** check with your university. Many give students Microsoft 365 through their student account.
- **Free alternatives** such as LibreOffice cover documents, spreadsheets and presentations for many people.

## How LvTS helps

When a client brings in a machine running cracked or activated software, we don't lecture. We open Process Explorer and show them, on their own PC, what is loading and whether it's signed. Seeing it is usually enough. Then we help them move to genuine software at the lowest cost that fits.

[Message us on WhatsApp](https://wa.me/6797466941) or call 833 1088 for a check-up or advice on genuine licences.
