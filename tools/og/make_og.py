#!/usr/bin/env python3
"""Make each page's link-preview image (1200x630) in public/og/<page id>.jpg.

These are the pictures Facebook, WhatsApp, LinkedIn and X show when someone
shares a page. The build (vite.config.ts) points every page at its own image.

Run from the repository root after adding or renaming a page or blog post:

    python3 tools/og/make_og.py

It needs Python 3 with Pillow, and Node (to read the page list from
src/data/routes.ts and the posts from src/data/blogPosts.ts). The home page
keeps its designed campaign image (public/og-discover-lvts.jpg).

Fonts: Syne and Space Grotesk, the site's own fonts, under the SIL Open Font
Licence (tools/og/fonts/OFL-*.txt).
"""
import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = Path(__file__).resolve().parent / 'fonts'
OUT = ROOT / 'public' / 'og'
W, H = 1200, 630
PAD = 56
NAVY = (15, 23, 42)
BODY = (51, 65, 85)
PURPLE = (124, 58, 237)

# What each page's picture says: the label in the corner pill, a short headline,
# one line about it, and up to three highlights (title, detail).
# Keep these true to the page. Pages not listed here use their route's heading
# and description.
PAGES = {
    'services': dict(color='#2563eb', kicker='Tech services', headline='IT services in Suva, Fiji',
                     sub='Laptop and PC repair, website design, networking and CCTV, and business email.',
                     chips=[('PC & laptop repair', 'From FJD $25, quoted upfront'),
                            ('Website design', 'Business sites that get found'),
                            ('Networking & CCTV', 'Home and office setups')]),
    'ask': dict(color='#6366f1', kicker='Ask LvTS', headline='Free tech help, any time',
                sub='Chat with Loma, the LvTS assistant, about repairs, Windows problems and prices.',
                chips=[('Instant answers', 'PC, laptop and Windows'),
                       ('A real person too', 'WhatsApp 746 6941'),
                       ('Free to use', 'No sign-up needed')]),
    'rewards': dict(color='#f59e0b', kicker='LomaVata Rewards', headline='Weekly prize draws in Fiji',
                    sub='Buy an entry or a monthly membership with M-PAiSA or MyCash.',
                    chips=[('Weekly draws', 'Grocery and fuel vouchers'),
                           ('Monthly Mega Draw', 'For members'),
                           ('Easy to pay', 'M-PAiSA or MyCash')]),
    'house': dict(color='#f59e0b', kicker='Noqublox', headline='Explore Raiwai, Suva in 3D',
                  sub='A free 3D world of Raiwai you play in your web browser, together with others online.',
                  chips=[('Free browser game', 'Nothing to download'),
                         ('Play together', 'One shared world online'),
                         ('Treasure hunt', 'Find the hidden tech parts')]),
    'kids': dict(color='#6d4aff', kicker='Kids · English + iTaukei', headline='Play and learn, for young children',
                 sub='Two free games, with words read out loud in English and iTaukei.',
                 chips=[('Noqu Vuli', 'ABC, numbers, animals, shapes'),
                        ('Little Chef', 'Pretend cooking, ages 3 to 5'),
                        ('Safe for kids', 'No ads, no sign-up')]),
    'labview': dict(color='#f5a524', kicker='LabVIEW help', headline='Stuck on your LabVIEW project?',
                    sub='One-to-one tutoring for university students in Fiji, in person or online.',
                    chips=[('NI DAQ & NI-DAQmx', 'NI MAX and simulated devices'),
                           ('Arduino Uno kit', 'Control it from LabVIEW'),
                           ('Free guide', 'Step by step, 13 chapters')]),
    'tools': dict(color='#f97316', kicker='Free tools', headline='Free tools in your browser',
                  sub='Your files stay on your device: nothing is uploaded.',
                  chips=[('Image to PDF', 'JPEG, HEIC and DNG photos'),
                         ('PDF merge & sketch', 'Join PDFs, photo to pencil'),
                         ('Whiteboard & SEO', 'Draw, plan, check a site')]),
    'meditrack': dict(color='#c1443b', kicker='MediTrack', headline='Your private health dashboard',
                      sub='Blood pressure, test results, appointments and medical history in one place.',
                      chips=[('Blood pressure', 'See the trend over time'),
                             ('Results & visits', 'Tests and appointments'),
                             ('Private', 'Stays on your device')]),
    'activation': dict(color='#8b5cf6', kicker='Activation help', headline='Windows and software activation help',
                       sub='Product keys, fixing activation problems, and step-by-step guides.'),
    'blog': dict(color='#0ea5e9', kicker='LvTS Blog', headline='Tech tips, security and IT news for Fiji',
                 sub='Practical articles from LomaVata Tech Services in Raiwai, Suva.',
                 chips=[('Security', 'Keep your PC and accounts safe'),
                        ('Windows', 'Fixes and how-tos'),
                        ('Fiji & the Pacific', 'Technology that matters here')]),
}
POST_COLOR = '#0ea5e9'


def font(name, size):
    files = {'syne800': 'syne-latin-800-normal.woff', 'syne700': 'syne-latin-700-normal.woff',
             'sg500': 'space-grotesk-latin-500-normal.woff', 'sg700': 'space-grotesk-latin-700-normal.woff'}
    return ImageFont.truetype(str(FONTS / files[name]), size)


def rgb(hex_color):
    h = hex_color.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ''
    for w in words:
        trial = f'{line} {w}'.strip()
        if draw.textlength(trial, font=fnt) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def fit(draw, text, face, sizes, width, max_lines):
    """The largest size whose wrapped text fits in max_lines."""
    for size in sizes:
        fnt = font(face, size)
        lines = wrap(draw, text, fnt, width)
        if len(lines) <= max_lines:
            return fnt, lines
    fnt = font(face, sizes[-1])
    lines = wrap(draw, text, fnt, width)[:max_lines]
    lines[-1] = lines[-1].rstrip('.,;: ') + '…'
    return fnt, lines


def gradient(size, left, right):
    w, h = size
    g = Image.new('RGB', (w, 1))
    for x in range(w):
        g.putpixel((x, 0), mix(left, right, x / max(1, w - 1)))
    return g.resize((w, h))


def rounded_paste(base, tile, xy, radius):
    mask = Image.new('L', tile.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile.size[0] - 1, tile.size[1] - 1), radius, fill=255)
    base.paste(tile, xy, mask)


def background(accent):
    """Soft light background with a tint of the page colour, like the home page image."""
    img = Image.new('RGB', (W, H))
    top_left, bottom_right = (246, 247, 253), mix((246, 247, 253), accent, 0.16)
    draw = ImageDraw.Draw(img)
    for y in range(H):
        draw.line([(0, y), (W, y)], fill=mix(top_left, bottom_right, y / H * 0.6))
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W - 520, -260, W + 260, 420), fill=70)
    img.paste(Image.new('RGB', (W, H), mix(accent, (255, 255, 255), 0.55)), (0, 0), glow)
    return img


def logo_tile():
    logo = Image.open(ROOT / 'public' / 'logo.jpg').convert('RGB')
    logo.thumbnail((196, 58), Image.LANCZOS)
    tile = Image.new('RGB', (224, 74), (255, 255, 255))
    tile.paste(logo, ((224 - logo.width) // 2, (74 - logo.height) // 2))
    return tile


def render(page_id, kicker, headline, sub, chips, color, path_text, meta=None):
    accent = rgb(color)
    img = background(accent)
    d = ImageDraw.Draw(img)
    rounded_paste(img, logo_tile(), (PAD, 44), 18)

    # Corner pill with the page name.
    kf = font('sg700', 24)
    label = kicker.upper()
    tw = d.textlength(label, font=kf) + 0.08 * 24 * len(label)
    pw, ph = int(tw + 60), 54
    pill = gradient((pw, ph), accent, PURPLE)
    rounded_paste(img, pill, (W - PAD - pw, 58), ph // 2)
    x = W - PAD - pw + 30
    for ch in label:  # letter-spaced
        d.text((x, 58 + ph / 2), ch, font=kf, fill=(255, 255, 255), anchor='lm')
        x += d.textlength(ch, font=kf) + 0.08 * 24

    width = W - 2 * PAD
    has_chips = bool(chips)
    hf, hlines = fit(d, headline, 'syne800', [84, 78, 72, 66, 60, 54, 50, 46], width, 2 if has_chips else 3)
    y = 158
    bottom = y
    for line in hlines:
        d.text((PAD, y), line, font=hf, fill=NAVY)
        bottom = d.textbbox((PAD, y), line, font=hf)[3]
        y += int(hf.size * 1.08)
    d.rounded_rectangle((PAD, bottom + 18, PAD + 120, bottom + 26), 4, fill=accent)
    y = bottom + 50
    sf, slines = fit(d, sub, 'sg500', [32, 30, 28, 26], width, 2 if has_chips else 3)
    for line in slines:
        d.text((PAD, y), line, font=sf, fill=BODY)
        y += int(sf.size * 1.35)

    if has_chips:
        gap = 18
        cw = (width - gap * (len(chips) - 1)) // len(chips)
        cy, chh = 456, 92
        for i, (title, detail) in enumerate(chips):
            cx = PAD + i * (cw + gap)
            left = mix(accent, NAVY, 0.15 + 0.12 * i)
            tile = gradient((cw, chh), left, mix(left, PURPLE, 0.45))
            rounded_paste(img, tile, (cx, cy), 20)
            tf, _ = fit(d, title, 'syne700', [30, 28, 26, 24, 22], cw - 48, 1)
            df, dl = fit(d, detail, 'sg500', [20, 19, 18], cw - 48, 1)
            d.text((cx + 24, cy + 16), title, font=tf, fill=(255, 255, 255))
            d.text((cx + 24, cy + 56), dl[0], font=df, fill=(235, 240, 255))
    elif meta:
        mf = font('sg700', 24)
        d.text((PAD, max(y + 14, 470)), meta, font=mf, fill=mix(accent, NAVY, 0.35))

    ff = font('sg700', 24)
    d.text((PAD, 590), path_text, font=ff, fill=mix(accent, NAVY, 0.25), anchor='ls')
    rf = font('sg500', 24)
    d.text((W - PAD, 590), 'Built in Raiwai, Suva, Fiji', font=rf, fill=BODY, anchor='rs')

    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / f'{page_id}.jpg', quality=86, optimize=True, progressive=True)


def load_site():
    js = ("Promise.all([import('./src/data/routes.ts'), import('./src/data/blogPosts.ts')])"
          ".then(([r, b]) => console.log(JSON.stringify({routes: r.ROUTES, posts: b.BLOG_POSTS})))")
    out = subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, check=True,
                         capture_output=True, text=True).stdout
    return json.loads(out)


def nice_date(iso):
    y, m, d = (int(v) for v in iso.split('-'))
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
              'September', 'October', 'November', 'December']
    return f'{d} {months[m - 1]} {y}'


def main():
    site = load_site()
    OUT.mkdir(parents=True, exist_ok=True)
    posts = {f"post-{p['slug']}": p for p in site['posts']}
    made = []
    for r in site['routes']:
        if r.get('aliasOf'):
            continue  # old addresses share their page's image
        pid, path_text = r['id'], f"fijianblood.github.io/lvts/{r['slug']}".rstrip('/')
        if pid == 'home':
            shutil.copyfile(ROOT / 'public' / 'og-discover-lvts.jpg', OUT / 'home.jpg')
        elif pid in posts:
            p = posts[pid]
            kicker = 'LvTS Blog · ' + p['tags'][0] if p['tags'] else 'LvTS Blog'
            render(pid, kicker, p['title'], p['description'], None, POST_COLOR, path_text,
                   meta=f"By {p['author']} · {nice_date(p['date'])}")
        else:
            c = PAGES.get(pid, {})
            render(pid, c.get('kicker', r['label']), c.get('headline', r['heading']),
                   c.get('sub', r['description']), c.get('chips'), c.get('color', '#2563eb'), path_text)
        made.append(pid)
    print(f'made {len(made)} preview images in public/og/: {", ".join(made)}')


if __name__ == '__main__':
    main()
