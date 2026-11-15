In December 2025, people trying to activate Windows with a popular one-line PowerShell command typed the web address with one letter missing. That single missing "d" sent them to a fake site that installed malware. Here is how the attack worked, step by step, what victims saw, and how to check a PC.

This is written so you can recognise and stop attacks like it, not repeat them.

## The short version

| Step | What happened |
| --- | --- |
| 1. The bait | A one-line command, copied and shared by millions, that downloads and runs a script from a web address |
| 2. The lookalike | Attackers registered an address one letter different from the real one |
| 3. The switch | People who typed or copied the wrong address ran the attackers' script instead, as administrator |
| 4. The loader | The script installed **Cosmali Loader**, a program whose job is to get a foothold and fetch more malware |
| 5. The payloads | The loader is reported to have delivered **cryptominers** and the **XWorm remote-access trojan** |

## Step 1: pick something everyone copies

The genuine Microsoft Activation Scripts (MAS) project tells people to open PowerShell as administrator and paste one command. That command downloads a script from `get[.]activated[.]win` and runs it immediately.

For an attacker, that's ideal. The command is short, it's shared in countless videos and posts, people type it from memory, and it already runs with full administrator rights. Nobody reads the script first.

## Step 2: register the lookalike address

The attackers used `get[.]activate[.]win`, the same address with the **"d" missing** from "activated". This is called **typosquatting**: registering addresses that people are likely to type by mistake. A web address costs only a few dollars, and nothing stops anyone registering a name that looks like a popular one.

## Step 3: wait for the mistakes

Thailand's national cyber-security agency, ThaiCERT, describes victims who mistyped the address and didn't notice before pressing Enter. Rescana also points to people who copy and paste PowerShell commands from unverified sources.

Either way, the result is the same. The victim's PowerShell, running as administrator, downloads the attackers' script instead of the real one and runs it straight away. The victim gave the attackers the highest level of access to their PC, without knowing it.

## Step 4: the loader takes hold

The malicious script installed **Cosmali Loader**. A **loader** is a small program with one job: stay on the computer and download other malware whenever its owners decide. Rescana reports that it makes sure it survives restarts, typically through registry entries or scheduled tasks, the same places we check with Autoruns.

A loader is dangerous because it isn't the end of the attack. Whoever controls it can send anything, at any time.

## Step 5: the payloads

Researcher RussianPanda linked Cosmali Loader to two kinds of malware:

- **Cryptominers**: programs that use your processor or graphics card to earn cryptocurrency for someone else. You pay with electricity, heat, a loud fan and a slower PC.
- **XWorm**: a **remote-access trojan (RAT)**. Remote-access trojans let the attacker control the PC from anywhere: see files, run programs, and steal passwords and logins.

## The twist: a warning from an unexpected place

Some victims saw a pop-up saying, in short, that they had been infected with Cosmali Loader *because they mistyped the domain*, telling them to reinstall Windows and check Task Manager for strange PowerShell processes. It also said the malware's control panel was not secure and that anyone who looked at it could access their computer.

The reports agree that the message probably didn't come from the attackers. It most likely came from someone, possibly a researcher, who got into the attackers' poorly protected control panel. On 23 December 2025, malware analyst Karsten Hahn posted: "Seems someone has hacked a malware C2" (a C2 is the server attackers use to control infected PCs). The same day, the MAS project warned its users on X about the typosquatting campaign and told them to check their commands.

That warning is a reminder of something worse: **if a stranger could reach those infected PCs through the control panel, so could anyone else.**

## Why it works so well

- **One character is easy to miss**, especially on a small screen or in a hurry.
- **The command runs instantly**, with no download to scan and nothing to click first.
- **Administrator rights** mean the script can change anything.
- **The real tool is trusted**, so people don't expect a trap.
- **There's no visible sign** until much later, if ever.

## How to check a PC

If you, or a PC you look after, ran an activation command around late 2025:

1. **Check what was actually typed.** PowerShell keeps a history of commands in `%APPDATA%\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`. Open it in Notepad and look for `activate.win` without the "d".
2. **Open Task Manager** and look for PowerShell processes running when you haven't opened PowerShell, or high CPU or GPU use while the PC is idle.
3. **Run Autoruns** (Microsoft Sysinternals) and look at **Scheduled Tasks** and **Logon** for unsigned entries or anything pointing at scripts in user or temp folders.
4. **Run a Microsoft Defender Offline scan**, then a second opinion with Malwarebytes.

A clean scan doesn't prove the PC is safe. Loaders can wait before doing anything.

## If the PC was infected

1. **Disconnect it** from Wi-Fi or the network.
2. **Change passwords from a different, clean device**: email first, then banking, M-PAiSA or MyCash, and social media. Turn on two-step verification.
3. **Back up documents and photos only**, and scan the backup on another machine.
4. **Reinstall Windows cleanly.** ThaiCERT calls a full wipe and reinstall the most reliable fix, and with a remote-access trojan involved, it's the only way to be sure.

## How not to be the next victim

- **Never run a one-line "download and run" command** you can't read and verify, especially as administrator.
- **Don't type important web addresses from memory.** Typos are exactly what typosquatters wait for.
- **Never turn off your antivirus** to make something work.
- **The safest activation is a genuine licence.** There's no script to mistype. Read [our article on activation scripts](../windows-activators-risks/) for affordable genuine options.

## Need help?

LomaVata Tech Services in Raiwai, Suva can check a PC for this and similar infections and reinstall Windows with your files kept safe. [Message us on WhatsApp](https://wa.me/6797466941) or call 833 1088.

## Sources

- [ThaiCERT advisory, 26 December 2025](https://www.thaicert.or.th/?p=10953)
- [Gigazine, 26 December 2025](https://gigazine.net/gsc_news/en/20251226-fake-mas-windows-activation-domain-powershell-malware) (includes the MAS warning and Karsten Hahn's post)
- [Rescana analysis, 25 December 2025](https://www.rescana.com/post/fake-mas-windows-activation-domain-infects-windows-systems-with-cosmali-loader-and-xworm-powershell)
- [MalwareTips discussion](https://malwaretips.com/threads/fake-mas-windows-activation-domain-used-to-spread-powershell-malware.138889/)
- BleepingComputer's original report, cited by the sources above: [Fake MAS Windows activation domain used to spread PowerShell malware](https://www.bleepingcomputer.com/news/security/fake-mas-windows-activation-domain-used-to-spread-powershell-malware/)
