export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  answer: string;
}

export const LVTS_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'about-lvts',
    keywords: [
      'what do you do', 'who are you', 'about lvts', 'about lomavata', 'services do you offer',
      'what services', 'what can you help', 'who is this', 'company', 'business',
    ],
    answer:
      "**LomaVata Tech Services (LvTS)** is a locally owned IT business in Raiwai, Suva, Fiji — founded by Josese Sahib. \"Loma Vata\" means togetherness.\n\n" +
      "We handle:\n" +
      "- PC & laptop repair and Windows 11 troubleshooting\n" +
      "- Website design & development\n" +
      "- Networking setup (home/office)\n" +
      "- CCTV installation\n" +
      "- Remote IT support\n" +
      "- Laptops, accessories & software — via our online store\n\n" +
      "Ask me about any of these, or [chat with us directly on WhatsApp](https://wa.me/6797466941) for anything specific.",
  },
  {
    id: 'computer-laptop-repair',
    keywords: [
      'fix my laptop', 'fix my computer', 'laptop repair', 'computer repair', 'pc repair',
      'not turning on', 'broken laptop', 'laptop not working', 'screen replacement',
      'laptop screen', 'how much for a repair', 'repair cost', 'repair price',
    ],
    answer:
      "**PC & laptop repair**\n\n" +
      "We repair desktops and laptops — hardware issues (screens, batteries, won't turn on), software problems, virus removal, and general troubleshooting.\n\n" +
      "Pricing depends on the issue, so the best way to get an accurate quote is to [message us on WhatsApp](https://wa.me/6797466941) with what's wrong, or call **833 1088 / 746 6941**. We're in Raiwai, Suva if you'd rather drop it off.\n\n" +
      "If it's a Windows 11 software issue, try asking me about the specific symptom (e.g. \"my PC is slow\", \"black screen\", \"Wi-Fi not working\") — I might be able to walk you through a fix right now.",
  },
  {
    id: 'website-services',
    keywords: [
      'website', 'web design', 'build a website', 'web development', 'new site',
      'online presence', 'landing page', 'ecommerce site',
    ],
    answer:
      "**Website design & development**\n\n" +
      "We build websites for local businesses — from simple landing pages to full sites with online stores, booking forms, and custom features (like this chat!).\n\n" +
      "Pricing depends on scope — check out the **Website** page in the nav for details, or [message us on WhatsApp](https://wa.me/6797466941) to talk through what you need.",
  },
  {
    id: 'online-store',
    keywords: [
      'store', 'buy', 'shop', 'vitikart', 'purchase', 'for sale', 'where can i buy',
      'sell laptops', 'accessories',
    ],
    answer:
      "**Our online store**\n\n" +
      "LvTS sells laptops, accessories, software, and digital services (website design, remote IT support, PDF conversion, and more) through our **VitiKart marketplace store**:\n\n" +
      "[www.vitikart.com.fj/marketplace/joesahib.html](https://www.vitikart.com.fj/marketplace/joesahib.html)\n\n" +
      "Prices and stock change, so check the store listing directly for current pricing — or [message us on WhatsApp](https://wa.me/6797466941) if you're after something specific and we'll confirm availability.",
  },
  {
    id: 'contact-hours',
    keywords: [
      'hours', 'open', 'contact', 'phone number', 'address', 'location', 'call you',
      'where are you', 'opening hours', 'whatsapp',
    ],
    answer:
      "**Contact LvTS**\n\n" +
      "- Phone: **833 1088 / 746 6941**\n" +
      "- WhatsApp: [wa.me/6797466941](https://wa.me/6797466941)\n" +
      "- Email: lomavatatechfiji@gmail.com\n" +
      "- Location: Raiwai, Suva, Fiji\n" +
      "- Hours: Monday–Friday, 8:00am–5:00pm Fiji time (WhatsApp us anytime for after-hours or urgent issues)",
  },
  {
    id: 'talk-to-human',
    keywords: [
      'human', 'real person', 'talk to someone', 'agent', 'representative', 'speak to joe',
      'speak to someone', 'not helpful', 'talk to a person',
    ],
    answer:
      "No problem — [tap here to chat with us directly on WhatsApp](https://wa.me/6797466941) and a real person will reply. You can also call **833 1088 / 746 6941**.",
  },
  {
    id: 'wifi-reset',
    keywords: [
      'wifi', 'wi-fi', 'wireless', 'network adapter', 'internet not working',
      'no internet', 'can\'t connect', 'cant connect', 'disconnect', 'no wifi',
    ],
    answer:
      "**Wi-Fi / network not working — hard reset the network stack**\n\n" +
      "1. Open **Command Prompt as Administrator** (right-click Start → Terminal (Admin)).\n" +
      "2. Run:\n```\nnetcfg -d\n```\n" +
      "3. Restart your PC.\n" +
      "4. Reconnect to Wi-Fi — you'll need to re-enter your Wi-Fi password.\n\n" +
      "This does a full reset of all network adapters, so it fixes most stubborn Wi-Fi/Ethernet issues — but it **wipes saved Wi-Fi passwords and network profiles**, so only use it if reconnecting normally isn't working.",
  },
  {
    id: 'repair-system-files',
    keywords: [
      'corrupt', 'corrupted', 'system file', 'sfc', 'dism', 'repair windows',
      'windows broken', 'keeps crashing', 'random errors', 'file checker',
    ],
    answer:
      "**Repair corrupted Windows system files**\n\n" +
      "Open **Command Prompt as Administrator** and run these two, in order:\n\n" +
      "1. Scan and fix corrupted files:\n```\nsfc /scannow\n```\n" +
      "2. Repair the underlying Windows image (run this even if step 1 finds nothing, or if it fails):\n```\nDISM /Online /Cleanup-Image /RestoreHealth\n```\n\n" +
      "Flow: **Scan → Diagnose → Repair → Stable system**. This fixes most cases of random errors, missing files, and general instability. It can take 10–20 minutes — let it finish.",
  },
  {
    id: 'black-screen-screenshot',
    keywords: [
      'black screen', 'screenshot black', 'recording black', 'screen record',
      'streaming black', 'zoom black', 'teams black', 'obs black', 'video call black',
      'share screen black',
    ],
    answer:
      "**Black box in screenshots, screen recordings, or video calls**\n\n" +
      "This is almost always caused by **Hardware Acceleration** in your browser — the video/graphics layer doesn't get captured properly by screenshot or recording tools.\n\n" +
      "Fix it in whichever browser you use:\n" +
      "- **Chrome / Edge**: Settings → System → turn off \"Use hardware acceleration when available\"\n" +
      "- **Firefox**: Settings → General → Performance → uncheck \"Use recommended performance settings\" → uncheck \"Use hardware acceleration when available\"\n\n" +
      "Restart the browser afterward for it to take effect.",
  },
  {
    id: 'restore-previous-version',
    keywords: [
      'restore', 'previous version', 'shadow copy', 'shadow copies', 'vssadmin',
      'recover file', 'lost file', 'deleted file', 'overwrote file', 'undo save',
    ],
    answer:
      "**Recover a previous version of a file (shadow copies)**\n\n" +
      "Windows 11 can keep restore points for files via Volume Shadow Copy. To check what's available:\n\n" +
      "1. Open **Command Prompt as Administrator**.\n" +
      "2. Run:\n```\nvssadmin list shadows\n```\n" +
      "3. If shadow copies exist, right-click the file or folder in File Explorer → **Properties** → **Previous Versions** tab to restore an earlier copy.\n\n" +
      "Note: this needs admin privileges, and only works if System Restore/shadow copies were enabled on the drive beforehand.",
  },
  {
    id: 'slow-pc-diagnose',
    keywords: [
      'slow', 'laggy', 'freezing', 'freeze', 'frozen', 'high cpu', 'high memory',
      'bottleneck', 'not responding', 'lag', 'sluggish', 'why is my pc slow',
    ],
    answer:
      "**Diagnosing a slow or frozen PC — use Resource Monitor**\n\n" +
      "How to open it:\n" +
      "- Press **Win + R**, type `resmon`, hit Enter — or\n" +
      "- Search \"Resource Monitor\" in the Start menu — or\n" +
      "- Task Manager → **Performance** tab → **Open Resource Monitor**\n\n" +
      "What to check:\n" +
      "- **CPU tab** — find which process is hogging the processor, or frozen apps\n" +
      "- **Memory tab** — real-time RAM read/write, track which app is eating memory\n" +
      "- **Disk tab** — see which process is hammering the disk, causing slowdowns\n" +
      "- **Network tab** — spot unexpected data usage or connections\n\n" +
      "**Key feature**: right-click a frozen app → **Analyze Wait Chain** — this shows you exactly which process is blocking it, which is usually the real culprit.",
  },
  {
    id: 'free-disk-space',
    keywords: [
      'disk space', 'storage full', 'low on space', 'free up space', 'c drive full',
      'disk cleanup', 'temp files', 'reserved storage', 'running out of space',
    ],
    answer:
      "**Free up disk space**\n\n" +
      "1. **Disk Cleanup** — search \"Disk Cleanup\" in Start, select your drive, tick everything (including \"Previous Windows installations\" and \"Windows Update Cleanup\" if present), and run it. Removes temp files and old update leftovers.\n" +
      "2. **Clear the TEMP folder** — press Win + R, type `%temp%`, delete everything you can (skip files in use).\n" +
      "3. **Disable Reserved Storage** — Windows sets aside 7–10GB for updates. If you need the space, this can be freed via Settings → System → Storage → Storage Sense, or through the registry (ask us if you want a hand with this one — it's easy to do wrong).\n\n" +
      "Do these in order — Disk Cleanup alone recovers most space for most people.",
  },
  {
    id: 'optimize-drives',
    keywords: [
      'optimize drive', 'defrag', 'defragment', 'drive optimization', 'defragsvc',
      'disk running slow', 'hard drive slow',
    ],
    answer:
      "**Optimize / defragment your drives**\n\n" +
      "Windows 11 handles this automatically via the **Optimize drives** service (service name: `defragsvc`), which optimizes files on storage drives to run more efficiently — SSDs get TRIM, HDDs get defragmented.\n\n" +
      "To run it manually or check the schedule:\n" +
      "1. Search \"Defragment and Optimize Drives\" in Start (or open Settings → System → Storage → Advanced storage settings → Drive optimization).\n" +
      "2. Select your drive → **Optimize**.\n\n" +
      "If it's not running on schedule, check the service is enabled: press Win + R, type `services.msc`, find **Optimize drives**, and make sure it's not disabled.",
  },
  {
    id: 'windows-update-stuck',
    keywords: [
      'update stuck', 'windows update', 'update failing', 'update not installing',
      'update slow', 'update won\'t install', 'update error',
    ],
    answer:
      "**Windows Update stuck, slow, or failing**\n\n" +
      "1. Settings → **Windows Update** → run the built-in **Windows Update Troubleshooter** first (Settings → System → Troubleshoot → Other troubleshooters).\n" +
      "2. If updates are slow because it's uploading to other PCs on your network (Delivery Optimization), turn that off: Settings → Windows Update → Advanced options → Delivery Optimization → toggle **Allow downloads from other PCs** off.\n" +
      "3. Still stuck? Run the system file repair steps first (ask me about \"repair corrupted system files\") — a broken Windows image is a common cause of updates that won't install.",
  },
  {
    id: 'restore-point-create',
    keywords: [
      'restore point', 'system restore', 'backup before', 'safety net', 'undo changes',
      'rollback',
    ],
    answer:
      "**Create a System Restore point (do this before any big changes)**\n\n" +
      "1. Search \"Create a restore point\" in Start and open it.\n" +
      "2. Select your main drive (usually C:) → **Configure** → make sure protection is **On**.\n" +
      "3. Click **Create**, give it a name (e.g. \"before troubleshooting\"), and confirm.\n\n" +
      "If something goes wrong later, you can roll Windows back to this exact point via the same window → **System Restore**. Always worth doing before installing drivers, running deep tweaks, or making registry changes.",
  },
  {
    id: 'bsod',
    keywords: [
      'blue screen', 'bsod', 'crash dump', 'stop code', 'system crashed',
    ],
    answer:
      "**Blue Screen of Death (BSOD) troubleshooting**\n\n" +
      "1. Note the **stop code** shown on the blue screen (e.g. `MEMORY_MANAGEMENT`, `IRQL_NOT_LESS_OR_EQUAL`) — this tells you what actually failed.\n" +
      "2. Turn on more detail for next time: Settings → search \"Advanced startup\" isn't it — instead enable **BSoD Verbose Mode** so Windows shows full diagnostic info during a crash instead of just the summary screen.\n" +
      "3. Run the system file repair steps (`sfc /scannow` + `DISM /Online /Cleanup-Image /RestoreHealth`) — corrupted files are a common cause.\n" +
      "4. If it keeps happening after a driver or hardware change, that's usually the trigger — recently updated graphics/network drivers are the most common culprit.\n\n" +
      "If it's recurring, it's worth having us take a look — repeated BSODs are often a hardware or driver issue that's hard to fully diagnose remotely.",
  },
  {
    id: 'background-apps',
    keywords: [
      'background apps', 'apps running background', 'battery drain', 'resources',
      'startup apps', 'too many apps running',
    ],
    answer:
      "**Stop apps running in the background (frees CPU/RAM/battery)**\n\n" +
      "1. Settings → **Apps** → **Installed apps** → click the **⋯** next to an app → **Advanced options** → set \"Let this app run in the background\" to **Never** for anything you don't need running constantly.\n" +
      "2. Also check **Task Manager** → **Startup apps** tab, and disable anything you don't need launching every boot.\n\n" +
      "This is one of the easiest ways to speed up an older or lower-spec PC without changing any settings that affect stability.",
  },
  {
    id: 'visual-effects-performance',
    keywords: [
      'visual effects', 'animations', 'speed up pc', 'best performance', 'old pc slow',
      'low spec',
    ],
    answer:
      "**Set visual effects to Best Performance (speeds up older/lower-spec PCs)**\n\n" +
      "1. Search \"Advanced System Settings\" in Start.\n" +
      "2. Under the **Advanced** tab → **Performance** → **Settings**.\n" +
      "3. Select **Adjust for best performance** (or manually uncheck the animation/shadow options you don't care about).\n\n" +
      "This disables the animations and transparency effects that cost GPU/CPU on older hardware — noticeable improvement on machines that struggle to keep up.",
  },
  {
    id: 'services-manual',
    keywords: [
      'services', 'svchost', 'startup type', 'disable service', 'services.msc',
    ],
    answer:
      "**Trimming background services (advanced)**\n\n" +
      "Some services set to \"Automatic\" aren't needed on every system and can be switched to **Manual** so they only start when actually needed, reducing background load.\n\n" +
      "1. Press **Win + R**, type `services.msc`.\n" +
      "2. Find a service, right-click → **Properties** → change **Startup type** to **Manual**.\n\n" +
      "⚠️ Be careful here — disabling the wrong service can break features you rely on. If you're not sure which ones are safe to touch, it's better to have us take a look than guess.",
  },
  {
    id: 'debloat-windows',
    keywords: [
      'bloatware', 'debloat', 'remove apps', 'unwanted apps', 'pre-installed apps',
      'too many apps', 'clean up windows', 'remove candy crush', 'remove xbox app',
      'uninstall onedrive', 'uninstall edge',
    ],
    answer:
      "**Remove bloatware / unwanted pre-installed apps**\n\n" +
      "1. Settings → **Apps** → **Installed apps**.\n" +
      "2. Find the app, click the **⋯** → **Uninstall**.\n\n" +
      "Most pre-installed apps (games, Xbox extras, etc.) uninstall this way. A few (like Edge or OneDrive) resist normal uninstalling because Windows treats them as system components — removing those safely needs extra steps that can break things if done wrong.\n\n" +
      "If you want a proper clean sweep of a new or cluttered PC, that's something we do as part of setup — [message us on WhatsApp](https://wa.me/6797466941) and we'll sort it out.",
  },
  {
    id: 'privacy-telemetry',
    keywords: [
      'telemetry', 'spying', 'privacy', 'stop windows tracking', 'data collection',
      'diagnostic data', 'windows tracking me',
    ],
    answer:
      "**Reduce Windows telemetry / data collection**\n\n" +
      "1. Settings → **Privacy & security** → **Diagnostics & feedback**.\n" +
      "2. Set diagnostic data to **Required diagnostic data only** (the minimum Windows allows on Home/Pro editions).\n" +
      "3. While you're there, turn off **Tailored experiences** and review **App permissions** (location, camera, mic) for anything you don't want apps accessing.\n\n" +
      "Windows Home/Pro can't fully disable telemetry — Required diagnostic data is as low as it goes without enterprise policy tools.",
  },
  {
    id: 'classic-right-click-menu',
    keywords: [
      'right click menu', 'right-click menu', 'old context menu', 'classic context menu',
      'show more options', 'context menu missing',
    ],
    answer:
      "**Get the classic full right-click menu back**\n\n" +
      "Windows 11 hides most options behind \"Show more options\" by default. Quick way each time: **Shift + F10** (or just click \"Show more options\").\n\n" +
      "To make the full classic menu the default permanently, open **Command Prompt as Administrator** and run:\n```\nreg add \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /f /ve\n```\nThen restart Explorer (or reboot) for it to take effect. You can reverse it later by deleting that registry key.",
  },
  {
    id: 'install-multiple-apps',
    keywords: [
      'install multiple apps', 'set up new pc', 'new laptop setup', 'install software quickly',
      'winget', 'batch install apps',
    ],
    answer:
      "**Install apps quickly (new PC or reinstall)**\n\n" +
      "Windows 11 has a built-in package manager called **winget**. Open **Command Prompt** or **PowerShell** and run, e.g.:\n```\nwinget install Google.Chrome\nwinget install 7zip.7zip\n```\n" +
      "`winget search <name>` finds the right package ID for any app first.\n\n" +
      "If you'd rather not do this yourself, full new-PC setup (drivers, essential apps, debloat, updates) is something we offer — [message us on WhatsApp](https://wa.me/6797466941) for a quote.",
  },
  {
    id: 'cmd-reference',
    keywords: [
      'cmd commands', 'command line', 'command prompt commands', 'list of windows commands',
      'useful commands', 'run commands', 'run dialog', 'control panel shortcuts',
      'windows shortcuts', 'cmd cheat sheet', 'command line cheat sheet', 'terminal commands',
    ],
    answer:
      "**Handy Windows 11 Command Prompt & Run commands**\n\n" +
      "**Quick launch (Win + R, then type):**\n" +
      "- `appwiz.cpl` — Programs and Features (uninstall software)\n" +
      "- `devmgmt.msc` — Device Manager\n" +
      "- `diskmgmt.msc` — Disk Management\n" +
      "- `services.msc` — Services\n" +
      "- `compmgmt.msc` — Computer Management\n" +
      "- `msconfig` — System Configuration / startup programs\n" +
      "- `taskmgr` — Task Manager\n" +
      "- `eventvwr` — Event Viewer (see error logs)\n" +
      "- `ncpa.cpl` — Network Connections\n" +
      "- `firewall.cpl` — Windows Firewall settings\n" +
      "- `powercfg.cpl` — Power Options\n" +
      "- `regedit` — Registry Editor\n" +
      "- `dxdiag` — DirectX Diagnostic Tool\n" +
      "- `winver` — check your Windows version/build\n" +
      "- `mstsc` — Remote Desktop Connection\n" +
      "- `cleanmgr` — Disk Cleanup\n\n" +
      "**Networking:**\n" +
      "- `ipconfig /all` — full network config\n" +
      "- `ipconfig /release` then `ipconfig /renew` — force a new IP address (fixes many \"no internet\" cases)\n" +
      "- `ipconfig /flushdns` — clear the DNS cache (fixes sites that won't load after a DNS change)\n" +
      "- `ping <host>` (add `-t` for continuous) — check if a host is reachable\n" +
      "- `tracert <host>` — trace the network path to a host\n" +
      "- `netstat -af` — active connections; `-o` also shows which process (PID) owns each\n" +
      "- `getmac /v` — MAC address of your network adapters\n" +
      "- `nslookup <domain>` — DNS lookup\n" +
      "- `netsh wlan show wlanreport` — generates a detailed Wi-Fi health report (HTML)\n\n" +
      "**Disk & system health:**\n" +
      "- `chkdsk /f /r` — check and fix disk errors (needs a restart on the system drive)\n" +
      "- `sfc /scannow` — repair corrupted system files\n" +
      "- `DISM /Online /Cleanup-Image /RestoreHealth` — repair the Windows image itself\n" +
      "- `robocopy <source> <dest> /MIR` — reliable, resumable bulk copy/backup/mirror\n\n" +
      "**Processes:**\n" +
      "- `tasklist` — list running processes\n" +
      "- `taskkill /IM name.exe /F` — force-close a process by name\n\n" +
      "**Power (laptops):**\n" +
      "- `powercfg /batteryreport` — generates an HTML battery health report\n" +
      "- `powercfg /energy` — generates a power efficiency diagnostic report\n\n" +
      "**Handy one-liners:**\n" +
      "- `start .` or `explorer .` — open the current folder in File Explorer\n" +
      "- `cmd /k <command>` — run a command and keep the window open\n" +
      "- `findstr \"text\" file.txt` — search for text inside a file\n" +
      "- **F7** in Command Prompt — shows your command history\n" +
      "- `command1 && command2` — chains commands; the second only runs if the first succeeds\n" +
      "- `shutdown /r /fw /t 0` — restart straight into BIOS/UEFI firmware settings\n\n" +
      "⚠️ A couple of these (`chkdsk`, disk/firewall commands) can affect your system if used carelessly — if you're not confident, [message us on WhatsApp](https://wa.me/6797466941) and we'll walk you through it or do it for you.\n\n" +
      "Curated from a longer [community reference on ServerFault](https://serverfault.com/questions/3780/useful-command-line-commands-on-windows?rq=1).",
  },
  {
    id: 'disable-hibernation',
    keywords: [
      'hibernation', 'hiberfil.sys', 'hibernate disable', 'free up c drive space hibernation',
    ],
    answer:
      "**Disable hibernation (frees disk space)**\n\n" +
      "Hibernation reserves a file (`hiberfil.sys`) roughly the size of your RAM — on a desktop that never hibernates, that's wasted space.\n\n" +
      "Open **Command Prompt as Administrator** and run:\n```\npowercfg /hibernate off\n```\n" +
      "Only do this on a **desktop**, or a laptop you're sure you never hibernate (closing the lid may use Sleep instead, which is unaffected) — hibernation is genuinely useful on most laptops, so don't disable it there without a reason.",
  },
];
