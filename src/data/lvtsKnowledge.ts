export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  answer: string;
}

export const LVTS_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'about-lvts',
    keywords: [
      'who are you', 'about lvts', 'about lomavata', 'services do you offer',
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
      'broken laptop', 'laptop not working', 'screen replacement',
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
    id: 'greeting-hello',
    keywords: [
      'hi', 'hey', 'hello', 'bula', 'kia ora', 'good morning', 'good afternoon', 'good evening',
      'yo',
    ],
    answer:
      "Bula! 👋 Ask me about PC/laptop repairs, Windows 11 troubleshooting, websites, our online store, the Weave Playground contest, or anything else LvTS — what can I help with?",
  },
  {
    id: 'greeting-thanks',
    keywords: ['thank you', 'thanks', 'thank', 'vinaka', 'cheers', 'appreciate it'],
    answer: "Vinaka vakalevu! 🙏 Anything else I can help with?",
  },
  {
    id: 'greeting-bye',
    keywords: ['bye', 'goodbye', 'see you', 'moce', 'later', 'cya'],
    answer: "Moce! Feel free to come back anytime, or [message us on WhatsApp](https://wa.me/6797466941) if anything comes up. 👋",
  },
  {
    id: 'weave-playground',
    keywords: [
      'weave', 'playground', 'coding game', 'the game', 'win $50', '$50 contest', 'level 37',
      'level 36', 'level 50', 'how do i win', 'play the game', 'weave playground',
    ],
    answer:
      "**The Weave Playground**\n\n" +
      "It's a tiny coding language Joe built from scratch — real interpreter, running live in your browser, with keywords mapped to web-dev concepts (`state`, `component`, `mount`, `route`). 50 levels, plus a free sandbox to freestyle in.\n\n" +
      "**Two $50 FJD contests:**\n" +
      "- **Phase 1 (levels 1–36):** 12–30 August 2026. First to finish level 36, screenshot the victory page, and post it in the comments wins $50 FJD.\n" +
      "- **Phase 2 (levels 37–50):** locked until 10 September 2026, running to 20 October 2026. First to finish level 50 in that window wins a second $50 FJD.\n\n" +
      "Sign up with your name, email, and phone on the **Play** page to start — that's how we contact the winner.",
  },
  {
    id: 'three-d-websites',
    keywords: [
      '3d website', '3d site', '3d sites', 'animated site', 'interactive website',
      'product viewer', 'virtual showroom',
    ],
    answer:
      "**3D websites**\n\n" +
      "Interactive, animated 3D sections for your site — product viewers, virtual showrooms, animated heroes. Starting from around FJD $150 for a single animated section, or FJD $600 for a full multi-section 3D build.\n\n" +
      "Prices can vary by scope, so check the **Website** page or [message us on WhatsApp](https://wa.me/6797466941) to confirm for your project.",
  },
  {
    id: 'lomavata-rewards',
    keywords: [
      'rewards', 'lomavata rewards', 'prize draw', 'loyalty', 'giveaway', 'win a prize',
      'weekly draw', 'mega draw',
    ],
    answer:
      "**LomaVata Rewards**\n\n" +
      "A loyalty and prize draw program — buy a Single Entry or a Monthly Membership and get automatically entered into weekly draws, plus a monthly Mega Draw, for grocery vouchers, fuel vouchers, and cash prizes. Payments go through M-PAiSA or MyCash.\n\n" +
      "Check the **Rewards** page for current pricing and sign-up.",
  },
  {
    id: 'meditrack',
    keywords: [
      'meditrack', 'blood pressure', 'health dashboard', 'medical history',
      'doctor appointment tracker', 'blood results',
    ],
    answer:
      "**MediTrack Fiji**\n\n" +
      "A free personal health dashboard — track blood pressure trends, blood test results, and doctor's appointments over time. Everything is stored only on your own device; nothing gets uploaded anywhere.\n\n" +
      "Find it under the **MediTrack** page in the nav.",
  },
  {
    id: 'free-tools',
    keywords: [
      'pdf tool', 'pdf converter', 'merge pdf', 'image to pdf', 'heic', 'convert pdf',
    ],
    answer:
      "**Free browser tools**\n\n" +
      "The **Tools** page has a free Image → PDF converter and a PDF merge tool — both run entirely in your browser, nothing gets uploaded anywhere.",
  },
  {
    id: 'laptop-wont-turn-on',
    keywords: [
      "won't turn on", 'wont turn on', 'not turning on', 'no power', 'dead laptop', 'not booting',
      "doesn't power on", 'wont boot',
    ],
    answer:
      "**Laptop won't turn on**\n\n" +
      "1. Check the charger is actually delivering power — try a different outlet or cable if you have one, and look for a charging light on the laptop.\n" +
      "2. Hold the power button for 20–30 seconds with the charger unplugged (drains residual power, fixes a surprising number of \"dead\" laptops).\n" +
      "3. If the battery is removable, take it out, hold power for 30 seconds, then reconnect power without the battery and try turning it on.\n" +
      "4. Watch and listen for any signs of life — fan spinning, lights, beeps — even with a blank screen. That points to a display issue rather than a power issue.\n\n" +
      "If none of that works, it's likely a hardware fault (charging port, battery, motherboard) — best to [bring it in or message us on WhatsApp](https://wa.me/6797466941) for a proper diagnosis.",
  },
  {
    id: 'battery-charging',
    keywords: [
      'battery draining fast', 'battery life', "won't charge", 'wont charge', 'charging issue',
      'battery replacement', 'not charging', 'battery drain',
    ],
    answer:
      "**Battery draining fast or not charging**\n\n" +
      "1. Check Settings → System → Power & battery → Battery usage to see which app is draining it.\n" +
      "2. Lower screen brightness and turn off background apps you don't need (ask me about \"background apps\" for the steps).\n" +
      "3. If it won't charge at all, try a different cable/charger first — charging cables fail more often than the laptop itself.\n" +
      "4. A battery that drains fast even when new, or won't hold charge above a certain %, usually needs replacing.\n\n" +
      "For a battery replacement quote, [message us on WhatsApp](https://wa.me/6797466941) with your laptop model.",
  },
  {
    id: 'overheating',
    keywords: [
      'overheating', 'fan noise', 'laptop hot', 'fan loud', 'laptop too hot', 'thermal',
    ],
    answer:
      "**Overheating / loud fan**\n\n" +
      "1. Make sure the vents aren't blocked — use it on a hard, flat surface, not a bed or your lap.\n" +
      "2. Compressed air on the vents can clear surface dust, but built-up internal dust usually needs a proper clean.\n" +
      "3. Check Task Manager for a process pegging the CPU (ask me about \"my PC is slow\" for how).\n\n" +
      "If it's still hot after cleaning, the internal fan or thermal paste likely needs servicing — [message us on WhatsApp](https://wa.me/6797466941) to book a clean/service.",
  },
  {
    id: 'virus-malware',
    keywords: ['virus', 'malware', 'infected', 'popup ads', 'ransomware', 'suspicious program'],
    answer:
      "**Virus / malware removal**\n\n" +
      "1. Settings → **Privacy & security** → **Windows Security** → **Virus & threat protection** → **Scan options** → run a **Full scan** (takes a while, let it finish).\n" +
      "2. If pop-ups are the main symptom, check your browser's extensions and remove anything you don't recognize.\n" +
      "3. Uninstall any recently installed programs you don't recognize (Settings → Apps → Installed apps).\n\n" +
      "If it's ransomware, keeps coming back, or you're not confident doing this yourself, stop and [message us on WhatsApp](https://wa.me/6797466941) — professional removal is safer than guessing on something that could involve your data.",
  },
  {
    id: 'forgot-password',
    keywords: [
      'forgot password', 'forgot my password', 'locked out', "can't log in", 'cant log in',
      'password reset',
    ],
    answer:
      "**Forgot your Windows password**\n\n" +
      "- **Microsoft account:** go to [account.live.com/password/reset](https://account.live.com/password/reset) from another device to reset it.\n" +
      "- **Local account:** if you set up security questions, they'll appear after a few failed attempts on the login screen.\n" +
      "- No recovery option set up: this needs a password reset from installation media or professional help — it's easy to lose your files doing this wrong.\n\n" +
      "If you're locked out with no recovery option, [message us on WhatsApp](https://wa.me/6797466941) rather than trying random tools — we can usually get you back in without losing data.",
  },
  {
    id: 'windows10-eol',
    keywords: [
      'windows 10 support ending', 'windows 10 end of support', 'should i upgrade to windows 11',
      'windows 10 eol', 'windows 10 no more updates', 'upgrade to windows 11',
    ],
    answer:
      "**Windows 10 has reached end of support**\n\n" +
      "Microsoft stopped providing free security updates for Windows 10 in October 2025. Running it now means no more security patches — worth upgrading if your PC supports Windows 11.\n\n" +
      "Check eligibility: Settings → **Windows Update** → it'll tell you if your PC can upgrade for free. If it can't (older hardware), it's worth talking to us about either an upgrade path or a replacement — [message us on WhatsApp](https://wa.me/6797466941) and we'll advise honestly rather than just upselling a new machine.",
  },
  {
    id: 'printer-issues',
    keywords: [
      'printer not working', 'printer offline', 'printer is offline', 'paper jam',
      'printer not printing',
    ],
    answer:
      "**Printer not working**\n\n" +
      "1. Settings → **Bluetooth & devices** → **Printers & scanners** → click your printer → make sure \"Use printer offline\" is **off**.\n" +
      "2. Restart the **Print Spooler** service: Win + R → `services.msc` → find **Print Spooler** → right-click → Restart.\n" +
      "3. For a paper jam, always pull paper in the direction it normally feeds — pulling backward can damage the rollers.\n\n" +
      "Still stuck? [Message us on WhatsApp](https://wa.me/6797466941) with the printer model and what's happening.",
  },
  {
    id: 'no-sound',
    keywords: ['no sound', 'audio not working', 'speakers not working', 'sound not working'],
    answer:
      "**No sound**\n\n" +
      "1. Right-click the speaker icon in the taskbar → make sure the right output device is selected and volume isn't muted/at 0.\n" +
      "2. Settings → **System** → **Sound** → check the correct output device is set as default.\n" +
      "3. Try `devmgmt.msc` (Device Manager) → **Sound, video and game controllers** → right-click your audio driver → **Update driver**.\n\n" +
      "If it's still silent after that, [message us on WhatsApp](https://wa.me/6797466941) — could be a hardware fault.",
  },
  {
    id: 'bluetooth-issues',
    keywords: ['bluetooth not connecting', 'bluetooth not working', "can't pair bluetooth", 'cant pair bluetooth'],
    answer:
      "**Bluetooth not connecting**\n\n" +
      "1. Settings → **Bluetooth & devices** → make sure Bluetooth is **on**.\n" +
      "2. Remove the device and re-pair it from scratch — a stale pairing is the most common cause.\n" +
      "3. Make sure the device itself is in pairing mode (usually a button hold) and not already connected to something else.\n\n" +
      "Still not connecting? [Message us on WhatsApp](https://wa.me/6797466941) with the device you're trying to pair.",
  },
  {
    id: 'booking-warranty-payment',
    keywords: [
      'book a repair', 'drop off', 'turnaround time', 'how long does a repair take',
      'warranty on repair', 'payment methods', 'do you accept mpaisa', 'do you accept mycash',
      'how do i pay',
    ],
    answer:
      "**Booking, turnaround, and payment**\n\n" +
      "[Message us on WhatsApp](https://wa.me/6797466941) or call **833 1088 / 746 6941** with what's wrong — we'll give you a quote and you can drop the device off in Raiwai, Suva, or arrange pickup.\n\n" +
      "We accept **M-PAiSA** and **MyCash**, along with card payments. Turnaround time and warranty terms depend on the job, so we'll confirm specifics when you book — just ask.",
  },
  {
    id: 'store-shipping-returns',
    keywords: [
      'shipping', 'delivery time', 'how long does shipping take', 'return policy', 'refund',
      'can i return',
    ],
    answer:
      "**Shipping & returns**\n\n" +
      "Store items ship through our **VitiKart** marketplace listing — [www.vitikart.com.fj/marketplace/joesahib.html](https://www.vitikart.com.fj/marketplace/joesahib.html) — where shipping cost and timing are shown per item at checkout.\n\n" +
      "For returns, refunds, or anything order-specific, [message us on WhatsApp](https://wa.me/6797466941) with your order details and we'll sort it out.",
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
      'background apps', 'apps running background', 'resources',
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
      'too many apps', 'remove candy crush', 'remove xbox app',
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
  {
    id: 'clear-cache-cookies',
    keywords: [
      'clear cache', 'clear cookies', 'remove cookies', 'browser cache', 'browsing data',
      'delete cookies', 'clear browsing history', 'cache and cookies',
    ],
    answer:
      "**Clear cache & cookies (browser + laptop-wide)**\n\n" +
      "**In your browser:**\n" +
      "- **Chrome/Edge:** press `Ctrl+Shift+Delete` → pick a time range → tick **Cookies** and **Cached images and files** → Clear.\n" +
      "- **Firefox:** `Ctrl+Shift+Delete` → same idea, tick **Cookies** and **Cache** → Clear Now.\n\n" +
      "**Laptop-wide temp/cache clean-out:**\n" +
      "1. Press **Win + R**, type `%temp%`, hit Enter — a folder opens.\n" +
      "2. Select all (`Ctrl+A`) and delete. Windows will skip any files currently in use — that's normal, just skip those.\n\n" +
      "This is the single most common \"speed up my PC\" fix — browsers and Windows both accumulate junk here over time.",
  },
  {
    id: 'prefetch-folder',
    keywords: ['prefetch', 'prefetch folder', 'superfetch', 'sysmain'],
    answer:
      "**Prefetch folder**\n\n" +
      "Windows watches which programs you open and caches launch data in `C:\\Windows\\Prefetch` so they start faster next time. It's normally self-managing and best left alone.\n\n" +
      "If you're troubleshooting a slow or misbehaving PC and want to clear it anyway:\n" +
      "1. Press **Win + R**, type `prefetch`, hit Enter (Windows will ask for admin permission).\n" +
      "2. Select all and delete.\n\n" +
      "Windows just rebuilds it automatically — nothing breaks, but don't expect a dramatic speed difference either. It's a minor troubleshooting step, not a real fix for a genuinely slow PC (ask me about \"my PC is slow\" for the actual diagnosis steps).",
  },
  {
    id: 'high-disk-usage',
    keywords: [
      'high disk usage', '100% disk usage', 'disk running at 100', 'disk usage 100',
      'disk always at 100', 'disk stuck at 100', 'disk stuck',
    ],
    answer:
      "**Disk stuck at 100% usage**\n\n" +
      "1. Open **Task Manager** (`Ctrl+Shift+Esc`) → **Processes** tab → click the **Disk** column header to sort by usage and see what's hammering it.\n" +
      "2. Common culprits: Windows Search indexing (wait it out, or Settings → **Privacy & security** → **Searching Windows** → adjust what gets indexed), a pending antivirus scan, or Windows Update downloading in the background.\n" +
      "3. If it's constant even when idle, run the system file repair steps (ask me about \"repair corrupted system files\") — a corrupted install is a common cause.\n\n" +
      "If a specific app is always the culprit, [message us on WhatsApp](https://wa.me/6797466941) with the process name and we can help pin it down.",
  },
  {
    id: 'high-memory-usage',
    keywords: [
      'ram usage', 'memory usage', 'high ram usage', 'running out of memory', 'ram full',
      'out of memory',
    ],
    answer:
      "**High RAM/memory usage**\n\n" +
      "1. Task Manager (`Ctrl+Shift+Esc`) → **Processes** → click the **Memory** column to sort and see what's using it.\n" +
      "2. Browsers are the usual suspect — each tab and extension eats RAM. Close tabs you're not using, or check for a runaway extension.\n" +
      "3. Check **Startup apps** in Task Manager and disable anything unnecessary from launching at boot (ask me about \"background apps\" too).\n\n" +
      "If usage stays high with everything closed, that can point to a memory leak in a specific app or driver — [message us on WhatsApp](https://wa.me/6797466941) with what you're seeing.",
  },
  {
    id: 'onedrive-sync',
    keywords: [
      'onedrive not syncing', 'onedrive stuck', 'onedrive sync', 'onedrive issue',
      'onedrive problem',
    ],
    answer:
      "**OneDrive not syncing**\n\n" +
      "1. Click the OneDrive cloud icon in the taskbar (may be hidden under the `^` arrow) — it usually shows what's stuck or paused.\n" +
      "2. Try **Pause syncing** for a minute, then resume — this kicks a lot of stuck syncs back into gear.\n" +
      "3. If specific files show a red \"x\", the filename may have unsupported characters or be open in another program — close it and rename anything with symbols like `# % & * : < > ? / \\ { | }`.\n" +
      "4. Still stuck: sign out of OneDrive (Settings gear → Account → Unlink this PC) and sign back in — this resets the sync state without deleting your files from the cloud.\n\n" +
      "If you're not sure a step is safe with your files, [message us on WhatsApp](https://wa.me/6797466941) first.",
  },
  {
    id: 'windows-old-cleanup',
    keywords: [
      'windows.old', 'reclaim space after update', 'old windows files', 'windows old folder',
    ],
    answer:
      "**Reclaim space after a Windows upgrade (Windows.old)**\n\n" +
      "After a major update or upgrade, Windows keeps a backup copy of your old install in a `Windows.old` folder — often 10-20GB+.\n\n" +
      "1. Open **Disk Cleanup** (search for it in Start).\n" +
      "2. Click **Clean up system files**.\n" +
      "3. Tick **Previous Windows installation(s)** (and **Windows Update Cleanup**) → OK.\n\n" +
      "Only do this once you're sure the update went fine — you lose the ability to roll back to the previous version afterward.",
  },
  {
    id: 'explorer-frozen',
    keywords: [
      'start menu not opening', 'taskbar frozen', 'taskbar not working', 'explorer frozen',
      'start button not working', 'taskbar not responding',
    ],
    answer:
      "**Start menu or taskbar frozen/not responding**\n\n" +
      "1. `Ctrl+Shift+Esc` to open Task Manager.\n" +
      "2. Find **Windows Explorer** in the Processes list → right-click → **Restart**. This restarts the desktop/taskbar/Start menu without rebooting the whole PC, and fixes most freezes instantly.\n" +
      "3. Still stuck? A full restart usually clears whatever got wedged.\n\n" +
      "If it happens repeatedly, run the system file repair steps (ask me about \"repair corrupted system files\").",
  },
  {
    id: 'driver-update',
    keywords: [
      'update driver', 'update drivers', 'outdated driver', 'driver issue', 'rollback driver',
      'roll back driver', 'device manager',
    ],
    answer:
      "**Updating (or rolling back) a driver**\n\n" +
      "1. Press **Win + R**, type `devmgmt.msc`, hit Enter.\n" +
      "2. Find the device (e.g. under **Display adapters** or **Network adapters**), right-click → **Update driver** → **Search automatically**.\n" +
      "3. If a problem started right after a driver update, right-click the device instead → **Properties** → **Driver** tab → **Roll Back Driver** (only available if a previous version exists).\n\n" +
      "For graphics drivers specifically, downloading the latest directly from the manufacturer's site (NVIDIA/AMD/Intel) is usually more current than what Windows Update offers.",
  },
  {
    id: 'network-reset',
    keywords: [
      'network reset', 'reset network', 'winsock reset', 'internet keeps disconnecting',
      'network adapter issues',
    ],
    answer:
      "**Full network reset (when Wi-Fi reset alone doesn't fix it)**\n\n" +
      "If the Wi-Fi hard reset didn't do it (ask me about \"wifi not working\"), this goes deeper — resets the entire network stack, not just the adapters:\n\n" +
      "Open **Command Prompt as Administrator** and run each of these, then restart:\n```\nnetsh winsock reset\nnetsh int ip reset\nipconfig /release\nipconfig /renew\nipconfig /flushdns\n```\n" +
      "This fixes stubborn cases where internet works on other devices but not this one, or where Wi-Fi connects but has no internet access.",
  },
  {
    id: 'windows-update-stuck-advanced',
    keywords: [
      'clear update cache', 'softwaredistribution', 'update stuck downloading',
      'reset windows update',
    ],
    answer:
      "**Windows Update stuck downloading (advanced reset)**\n\n" +
      "If the built-in Update Troubleshooter didn't help (ask me about \"windows update stuck\"), this clears the update cache that's often the real culprit:\n\n" +
      "1. Open **Command Prompt as Administrator**.\n" +
      "2. Run:\n```\nnet stop wuauserv\nnet stop bits\n```\n" +
      "3. Open File Explorer, go to `C:\\Windows\\SoftwareDistribution`, delete everything inside the **Download** folder (leave the folder itself).\n" +
      "4. Back in Command Prompt, run:\n```\nnet start wuauserv\nnet start bits\n```\n" +
      "5. Try Windows Update again — it re-downloads cleanly.\n\n" +
      "This is a genuinely technical fix — if any step errors out, stop and [message us on WhatsApp](https://wa.me/6797466941) rather than forcing it.",
  },
  {
    id: 'screen-flicker',
    keywords: ['screen flickering', 'screen flicker', 'display flickering', 'monitor flickering'],
    answer:
      "**Screen flickering**\n\n" +
      "1. Update your graphics driver first (ask me about \"update driver\") — this is the #1 cause.\n" +
      "2. Check Task Manager for an app misbehaving — if flickering stops when you close a specific app, that app's the culprit.\n" +
      "3. Settings → **System** → **Display** → check your refresh rate is set correctly for your screen (under Advanced display settings).\n" +
      "4. If an external monitor flickers but the laptop screen doesn't, try a different cable — HDMI/DisplayPort cables fail more than people expect.\n\n" +
      "Flickering that persists after a driver update and reboot is often a hardware issue (cable, panel, or GPU) — [message us on WhatsApp](https://wa.me/6797466941) for a proper look.",
  },
  {
    id: 'keyboard-issues',
    keywords: [
      'keyboard not working', 'keys not working', 'spilled liquid', 'spilled water on laptop',
      'sticky keys problem', 'key stuck',
    ],
    answer:
      "**Keyboard not working, or spilled liquid on your laptop**\n\n" +
      "**If you just spilled liquid:** power off immediately (hold the power button, don't shut down normally), unplug the charger, remove the battery if removable, and **do not turn it back on**. Let it dry fully (24-48 hours) before attempting to power on. Powering on a wet laptop is the single biggest cause of permanent damage — turning it off fast is the most important thing you can do.\n\n" +
      "**If keys aren't responding (no spill):**\n" +
      "1. Check Settings → **Accessibility** → **Keyboard** — make sure Sticky Keys/Filter Keys aren't accidentally on and interfering.\n" +
      "2. Try an external USB keyboard — if that works fine, it points to the built-in keyboard hardware or its driver.\n" +
      "3. Update the keyboard driver (ask me about \"update driver\").\n\n" +
      "For a spill or a genuinely dead keyboard, [message us on WhatsApp](https://wa.me/6797466941) — keyboard replacement is a common, usually affordable repair.",
  },
  {
    id: 'touchpad-issues',
    keywords: ['touchpad not working', 'trackpad not working', 'touchpad issue', 'touchpad erratic'],
    answer:
      "**Touchpad not working or erratic**\n\n" +
      "1. Check it's not disabled — some laptops have a function key (often `Fn + F9` or similar, varies by brand) that toggles the touchpad off.\n" +
      "2. Settings → **Bluetooth & devices** → **Touchpad** — make sure it's toggled on, and that it's not set to disable automatically when a mouse is connected (if you've ever plugged one in).\n" +
      "3. Update the touchpad driver (ask me about \"update driver\").\n\n" +
      "If it's physically unresponsive even after that, [message us on WhatsApp](https://wa.me/6797466941) — could be a hardware fault.",
  },
  {
    id: 'external-display-usb',
    keywords: [
      'external monitor not detected', 'second monitor not working', 'usb device not recognized',
      'external display not working', 'monitor not detected',
    ],
    answer:
      "**External monitor or USB device not detected**\n\n" +
      "**External monitor:**\n" +
      "1. Press **Win + P** to check Windows sees it and pick a display mode (Extend/Duplicate).\n" +
      "2. Try a different cable/port — especially with HDMI/DisplayPort adapters, which fail often.\n" +
      "3. Update your graphics driver (ask me about \"update driver\").\n\n" +
      "**USB device:**\n" +
      "1. Try a different USB port — controllers can fail individually.\n" +
      "2. Device Manager (`devmgmt.msc`) — look for a yellow warning triangle on the device, right-click → Update driver.\n" +
      "3. Try the device on another PC to rule out the device itself being faulty.\n\n" +
      "Still nothing? [Message us on WhatsApp](https://wa.me/6797466941) with what you're connecting.",
  },
  {
    id: 'enter-bios',
    keywords: ['enter bios', 'access bios', 'uefi settings', 'boot menu', 'bios settings'],
    answer:
      "**Entering BIOS/UEFI settings**\n\n" +
      "Restart the PC and repeatedly tap the BIOS key during startup, before Windows loads — it varies by manufacturer:\n" +
      "- **Dell:** F2 (or F12 for boot menu)\n" +
      "- **HP:** F10 (or Esc for a startup menu)\n" +
      "- **Lenovo:** F1 or F2 (Novo button on some models)\n" +
      "- **ASUS:** F2 or Del\n" +
      "- **Acer:** F2 or Del\n\n" +
      "If you miss the window (common on fast-booting Windows 11 machines), go via Windows instead: Settings → **System** → **Recovery** → **Advanced startup** → **Restart now** → **Troubleshoot** → **Advanced options** → **UEFI Firmware Settings**.\n\n" +
      "Not sure what to change once you're in there? [Message us on WhatsApp](https://wa.me/6797466941) before changing anything you're unsure about — some BIOS settings can stop a PC from booting if set wrong.",
  },
  {
    id: 'hard-drive-clicking',
    keywords: [
      'clicking noise', 'hard drive clicking', 'drive making noise', 'grinding noise laptop',
      'hard drive failing',
    ],
    answer:
      "**Hard drive making clicking or grinding noises**\n\n" +
      "⚠️ **Back up your important files right now, before doing anything else.** A clicking or grinding noise from a traditional hard drive (not SSD) is a classic sign of imminent mechanical failure — it can go from \"still works\" to \"completely dead\" with no warning.\n\n" +
      "1. Copy anything irreplaceable (photos, documents) to a USB drive, external drive, or cloud storage immediately.\n" +
      "2. Avoid moving the laptop around while it's running — physical shock accelerates failure on a dying drive.\n" +
      "3. Once backed up, [message us on WhatsApp](https://wa.me/6797466941) about a drive replacement — and if the drive fails before you back up, don't keep power-cycling it; professional data recovery has a much better chance the less you've tried yourself.",
  },
  {
    id: 'ram-ssd-upgrade',
    keywords: [
      'upgrade ram', 'add more ram', 'upgrade to ssd', 'ssd upgrade', 'more memory laptop',
      'faster hard drive',
    ],
    answer:
      "**Upgrading RAM or switching to an SSD**\n\n" +
      "Two of the best value-for-money upgrades on an older laptop:\n" +
      "- **More RAM:** helps if you have lots of browser tabs/apps open and things slow down or stutter with them all running.\n" +
      "- **SSD instead of a spinning hard drive:** if your laptop still has a traditional HDD, this is usually the single biggest speed improvement possible — boot times and app launches go from minutes to seconds.\n\n" +
      "Not every laptop can be upgraded (some modern ultra-thins have soldered RAM), so it's worth checking your exact model first. [Message us on WhatsApp](https://wa.me/6797466941) with your laptop model and we'll tell you honestly what's upgradeable and what it'd cost.",
  },
];
