// "Save your own videos" guide. One source for both the in-app page (#videos)
// and the static, search-indexable page at /lvts/save-your-videos/ (built by
// vite.config.ts). Plain data only — vite.config.ts imports this file, so no React here.
//
// Every step was checked against the platform's own help pages on CHECKED_ON.
// Apps move their menus around; re-check the source links when updating.

export const CHECKED_ON = '31 October 2026';

export interface GuideMethod {
  title: string;
  steps: string[];
  notes?: string[];
}

export interface PlatformGuide {
  id: string;
  name: string;
  color: string;
  /** Used instead of `color` on the static page in dark mode, when `color` is too dark to see. */
  darkColor?: string;
  summary: string;
  methods: GuideMethod[];
  sources: { label: string; url: string }[];
}

export const VIDEO_GUIDES: PlatformGuide[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#ff0000',
    summary: 'Download any video you uploaded from YouTube Studio, or everything at once with Google Takeout.',
    methods: [
      {
        title: 'One video — YouTube Studio (computer)',
        steps: [
          'Go to studio.youtube.com and sign in to the channel that uploaded the video.',
          'Click Content in the left menu.',
          'Point at the video, click the Options (⋮) menu, then click Download.',
        ],
        notes: [
          'You get an MP4 file in 720p or 360p, depending on the video.',
          'Each video can be downloaded up to five times a day.',
          'Not available for videos that were removed or have a copyright or Community Guidelines strike.',
          'On a phone, the YouTube and YouTube Studio apps have a "Save to device" option for your own uploads.',
        ],
      },
      {
        title: 'All your videos — Google Takeout',
        steps: [
          'Go to takeout.google.com and sign in.',
          'Click "Deselect all", then tick only "YouTube and YouTube Music".',
          'Choose how to receive it: an email link, or Google Drive, Dropbox, Box or OneDrive.',
          'Click Create export and wait for Google to tell you it is ready.',
        ],
        notes: [
          'Videos come in their original format, or as MP4.',
          'If your videos are missing, your channel may belong to a Brand Account — switch to it before exporting.',
          'Big exports are easier to open on a computer than on a phone.',
        ],
      },
    ],
    sources: [
      { label: 'YouTube Help — Download YouTube videos that you\'ve uploaded', url: 'https://support.google.com/youtube/answer/56100' },
      { label: 'Google Account Help — How to download your Google data', url: 'https://support.google.com/accounts/answer/3024190' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#111827',
    darkColor: '#e2e8f0',
    summary: 'Save your own TikToks straight to your phone, save LIVE replays, and request a copy of your account data.',
    methods: [
      {
        title: 'A video you posted',
        steps: [
          'Open the video on your profile.',
          'Tap the Share button on the side.',
          'Tap Save video.',
        ],
        notes: [
          'To keep a copy automatically: on the Post screen, tap More options and turn on "Save to device" before you post.',
        ],
      },
      {
        title: 'A LIVE replay',
        steps: [
          'Tap the Menu (☰) on your profile and open TikTok Studio.',
          'Go to the LIVE tab and tap Replays.',
          'Tap Download on the replay you want.',
        ],
      },
      {
        title: 'Your account data',
        steps: [
          'Go to Profile → Menu (☰) → Settings and privacy → Account.',
          'Tap "Download your data".',
          'Choose the information and file format you want, then submit the request.',
          'Come back to the same screen when TikTok tells you the file is ready, and download it.',
        ],
        notes: [
          'It can take a few days to prepare, and the file is only available for up to 4 days.',
          'TikTok describes this file as account information (username, watch history, comments, settings). Use "Save video" above to keep the videos themselves.',
        ],
      },
      {
        title: 'Stop other people downloading your videos',
        steps: [
          'Go to Profile → Menu (☰) → Settings and privacy → Privacy → Downloads.',
          'Turn "Video downloads" off.',
        ],
        notes: [
          'You can still save your own videos with this turned off.',
          'Private accounts and users under 16 have this off by default.',
        ],
      },
    ],
    sources: [
      { label: 'TikTok Support — Downloading content', url: 'https://support.tiktok.com/en/using-tiktok/exploring-videos/download-content' },
      { label: 'TikTok Support — Manage video downloads', url: 'https://support.tiktok.com/en/account-and-privacy/account-privacy-settings/video-downloads' },
      { label: 'TikTok Support — TikTok LIVE Replay', url: 'https://support.tiktok.com/en/live-gifts-wallet/tiktok-live/tiktok-live-replay' },
      { label: 'TikTok Support — Requesting your data', url: 'https://support.tiktok.com/en/account-and-privacy/personalized-ads-and-data/requesting-your-data' },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877f2',
    summary: 'Download your recent reels from the app, save Live videos, or export everything with "Download your information".',
    methods: [
      {
        title: 'A reel or video you posted (from September 2025 on)',
        steps: [
          'In the Facebook app, open your profile and go to Reels.',
          'Tap the video, then tap Options (⋯).',
          'Tap Download reel. It saves to your phone\'s gallery.',
        ],
        notes: [
          'Facebook now treats every newly uploaded video as a reel.',
          'Reels that use someone else\'s original audio download without sound, and licensed music may be muted.',
          'Videos posted before September 2025 keep their old download rules — if you couldn\'t download one before, use the export below.',
        ],
      },
      {
        title: 'A Live video, after it has ended (computer)',
        steps: [
          'Click your profile picture, then open Reels.',
          'Open the Live video.',
          'Click Download video.',
        ],
      },
      {
        title: 'Everything — Download your information',
        steps: [
          'Go to Menu → Settings & privacy → Settings → Accounts Center.',
          'Open "Your information and permissions", then "Export your information" (also called "Download your information").',
          'Tap Create export, choose your Facebook profile, and choose "Export to device".',
          'Pick the information, date range, format and media quality, then start the export.',
          'When Facebook emails you, go back to "Available downloads" and download the file.',
        ],
        notes: [
          'Choose HTML to browse it easily, or JSON to move it to another service.',
          'Higher media quality means a bigger file.',
          'You have four days to download it once it is ready.',
          'A deactivated profile must be reactivated before you can export it.',
        ],
      },
    ],
    sources: [
      { label: 'Facebook Help — Download a reel you shared on Facebook to your device', url: 'https://www.facebook.com/help/1005944300373812' },
      { label: 'Facebook Help — Save your Facebook Live video after it\'s ended', url: 'https://www.facebook.com/help/248731546323140' },
      { label: 'Facebook Help — Export a copy of your Facebook information', url: 'https://www.facebook.com/help/212802592074644' },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#e1306c',
    summary: 'Save reels and stories to your camera roll before you post, save Live videos, and export all your photos and videos.',
    methods: [
      {
        title: 'A reel or story, before you post it',
        steps: [
          'Reels: on the editing screen, tap Save to keep a copy in your camera roll.',
          'Stories: tap Save at the bottom of the screen before you share.',
        ],
        notes: [
          'Music added from Instagram\'s music library is not included in the saved file.',
        ],
      },
      {
        title: 'A story you already shared',
        steps: [
          'Open your Stories Archive from your profile.',
          'Open the story, tap Options (⋯), then Save.',
        ],
      },
      {
        title: 'A Live video',
        steps: [
          'When your Live ends, tap Download to save it to your camera roll.',
        ],
      },
      {
        title: 'Everything — Export your information',
        steps: [
          'Open Accounts Center and go to "Your information and permissions".',
          'Tap "Export your information", then Create export, and choose your Instagram account.',
          'Choose "Export to device", then pick the information, date range, format and media quality.',
          'Enter your password and start the export.',
          'When Instagram emails you, download the file from "Available downloads".',
        ],
        notes: [
          'This is the reliable way to get back reels and posts you already published, including the photos and videos.',
          'Instagram\'s help pages say it can take from 48 hours up to 30 days.',
          'You have four days to download it once it is ready.',
        ],
      },
    ],
    sources: [
      { label: 'Instagram Help — Review and export a copy of your Instagram information', url: 'https://help.instagram.com/181231772500920' },
      { label: 'Instagram Help — Save and edit drafts of your reel', url: 'https://help.instagram.com/639718330257952' },
      { label: 'Instagram Help — Save your story to your camera roll', url: 'https://help.instagram.com/142167909546084' },
      { label: 'Instagram Help — Save a live video to your camera roll', url: 'https://help.instagram.com/1253487614735433' },
    ],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    color: '#0f172a',
    darkColor: '#e2e8f0',
    summary: 'Request an archive of your account — it includes the photos and videos you posted.',
    methods: [
      {
        title: 'Your X archive',
        steps: [
          'Go to Settings and privacy → Your account → "Download an archive of your data".',
          'Confirm your password and enter the code X sends to your email or phone.',
          'Tap Request archive.',
          'When X emails you, open the link while logged in on the same browser and click Download.',
        ],
        notes: [
          'It can take a few days to prepare.',
          'You get a .zip file (HTML and JSON) with your posts, messages and media.',
          'This is the only way to download all your Live broadcasts.',
        ],
      },
    ],
    sources: [
      { label: 'X Help — How to download your X archive', url: 'https://help.x.com/en/managing-your-account/how-to-download-your-x-archive' },
      { label: 'X Help — How to access your X data', url: 'https://help.x.com/en/managing-your-account/accessing-your-x-data' },
    ],
  },
];

export const GUIDE_TITLE = 'How to Save Your Own Videos from YouTube, TikTok, Facebook, Instagram & X';
export const GUIDE_DESCRIPTION =
  'Step-by-step guide to downloading the videos you posted, using each platform\'s own official download and export tools. Free from LomaVata Tech Services, Suva, Fiji.';

export const OTHER_PEOPLES_VIDEOS =
  'These official tools only work for videos you posted yourself. For someone else\'s video, ask them for the file, or use the platform\'s own save or offline feature where it offers one. Many "paste a link" downloader websites break the platforms\' terms of service and are full of pop-up ads and fake download buttons — a common way phones and laptops pick up malware.';
