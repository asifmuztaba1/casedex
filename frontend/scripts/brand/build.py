"""Build every CaseDex logo asset from brand.py.

Usage: python scripts/brand/build.py .   (from the frontend directory; see README.md)
"""
import io
import sys
from pathlib import Path

import resvg_py
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

sys.path.insert(0, str(Path(__file__).parent))
import brand
from brand import NAVY, TEAL, WHITE, MARK_W, MARK_H, FONTS

FE = Path(sys.argv[1])
PUB = FE / "public"
ICONS = PUB / "icons"


def ntos(n):
    s = f"{n:.1f}"
    return s[:-2] if s.endswith(".0") else s


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print("wrote", path.relative_to(FE.parent))


def png(svg_text, size_w, size_h=None):
    data = bytes(resvg_py.svg_to_bytes(svg_string=svg_text, width=size_w, height=size_h or size_w))
    return Image.open(io.BytesIO(data)).convert("RGBA")


def save_png(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print("wrote", path.relative_to(FE.parent))


# ---------- tiles (app icons) ----------
def tile(size, mark_frac, radius_frac, bg=NAVY, folder=WHITE, tab=TEAL):
    """Square icon: the mark centred on a navy tile. radius_frac=0 gives a full-bleed square."""
    s = size / (MARK_W / mark_frac)        # scale from mark units to tile pixels
    mw, mh = MARK_W * s, MARK_H * s
    tx, ty = (size - mw) / 2, (size - mh) / 2 + size * 0.01
    r = size * radius_frac
    inner = (f'<rect width="{size}" height="{size}" rx="{ntos(r)}" fill="{bg}"/>\n'
             + brand.mark(folder, tab, transform=f"translate({ntos(tx)} {ntos(ty)}) scale({s:.5f})"))
    return brand.svg(inner, size, size)


# Rounded tile for browsers / Android; a fuller mark on the small favicon so it survives 16px.
ICON_SVG = tile(512, 0.68, 0.22)
FAVICON_SVG = tile(64, 0.80, 0.20)
MASKABLE_SVG = tile(512, 0.56, 0)          # full bleed, mark inside the maskable safe zone
APPLE_SVG = tile(180, 0.64, 0)             # iOS rounds the corners itself

write(ICONS / "icon-512.svg", ICON_SVG)
write(ICONS / "icon-192.svg", ICON_SVG.replace('width="512" height="512"', 'width="192" height="192"'))
write(ICONS / "icon-32.svg", FAVICON_SVG.replace('width="64" height="64"', 'width="32" height="32"'))

save_png(png(ICON_SVG, 192), ICONS / "icon-192.png")
save_png(png(ICON_SVG, 512), ICONS / "icon-512.png")
save_png(png(MASKABLE_SVG, 512), ICONS / "icon-maskable-512.png")
save_png(png(APPLE_SVG, 180), ICONS / "apple-touch-icon.png")

# Notification badge: Android uses only the alpha channel, so a white silhouette on transparent.
badge_inner = brand.mark(WHITE, WHITE, transform=f"translate(6 {ntos((96 - MARK_H * 84 / MARK_W) / 2)}) scale({84 / MARK_W:.5f})")
save_png(png(brand.svg(badge_inner, 96, 96), 96), ICONS / "badge-96.png")

# favicon.ico with 16, 32 and 48 px frames
ico = [png(FAVICON_SVG, n) for n in (16, 32, 48)]
ico_path = FE / "app" / "favicon.ico"
ico[2].save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])
print("wrote", ico_path.relative_to(FE.parent))

# ---------- logos ----------
mark_svg = brand.svg(brand.mark(), MARK_W, MARK_H)
write(PUB / "logo-mark.svg", mark_svg)

inner, w, h = brand.lockup()
write(PUB / "logo-wordmark.svg", brand.svg(inner, round(w), h))
inner_w, _, _ = brand.lockup(folder=WHITE, text=WHITE)
write(PUB / "logo-wordmark-white.svg", brand.svg(inner_w, round(w), h))

# Email header logo (2x for sharp rendering at 180px wide)
email = png(brand.svg(inner, round(w), h), 360, round(360 * h / w))
save_png(email, PUB / "logo-email.png")


# ---------- share image (1200 x 630) ----------
def outline(text, font_file, wght, size, wdth=None):
    axes = {"wght": wght}
    if wdth:
        axes["wdth"] = wdth
    f = instancer.instantiateVariableFont(TTFont(font_file), axes)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm
    sc = size / upm
    pen = SVGPathPen(gs, ntos=ntos)
    x = 0
    for c in text:
        g = cmap.get(ord(c)) or cmap[ord(" ")]
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, x, 0)))
        x += gs[g].width * sc
    return pen.getCommands(), x


plex = FONTS / "IBMPlexSans.ttf"
og_lockup, lw, lh = brand.lockup(folder=WHITE, text=WHITE, mask_id="og-cut")
lscale = 520 / lw
tag_d, _ = outline("Every case, every hearing — in one place.", plex, 400, 34, 100)
sub_d, _ = outline("Structured case workspace for legal professionals", plex, 400, 22, 100)
dom_d, _ = outline("casedex.app", plex, 500, 20, 100)
og = f"""<rect width="1200" height="630" fill="{NAVY}"/>
<g opacity="0.05" transform="translate(760 150) scale(0.78)">{brand.mark(WHITE, WHITE, mask_id="og-bg")}</g>
<g transform="translate(96 170) scale({lscale:.5f})">{og_lockup}</g>
<rect x="96" y="{ntos(170 + lh * lscale + 46)}" width="64" height="4" rx="2" fill="{TEAL}"/>
<path d="{tag_d}" fill="#E6ECF3" transform="translate(96 {ntos(170 + lh * lscale + 112)})"/>
<path d="{sub_d}" fill="#9FB0C4" transform="translate(96 {ntos(170 + lh * lscale + 156)})"/>
<path d="{dom_d}" fill="#7F93AA" transform="translate(96 560)"/>
<rect y="622" width="1200" height="8" fill="{TEAL}"/>"""
og_svg = brand.svg(og, 1200, 630)
save_png(png(og_svg, 1200, 630).convert("RGB"), PUB / "og-image.png")


# ---------- React component ----------
word_d, word_w = brand.text_path("CaseDex", brand.WORD_CAP, brand.WORD_TRACKING)
lock_w = round(MARK_W + brand.WORD_GAP + word_w + brand.WORD_OVERHANG)

tsx = f'''// Generated by scripts/brand/build.py from the approved CaseDex logo. Edit the script, not this file.
import {{ useId }} from "react";

const MARK_W = {MARK_W};
const MARK_H = {MARK_H};
const LOGO_W = {lock_w};
const TEAL = "{TEAL}";

const BACK = "{brand.BACK}";
const FRONT = "{brand.FRONT}";
const TAB = "{brand.TAB}";
const WORDMARK = "{word_d}";

/** The scales, cut out of the folder so the background shows through. */
function Scales() {{
  return (
    <g fill="#000">
      <circle cx="320" cy="221" r="23" />
      <path d="M165 256Q320 232 475 256" fill="none" stroke="#000" strokeWidth="19" strokeLinecap="round" />
      <circle cx="165" cy="256" r="13.5" />
      <circle cx="475" cy="256" r="13.5" />
      <rect x="298" y="222" width="44" height="252" />
      <path d="M298 464C298 480 288 486 274 489C256 493 246 504 246 522H394C394 504 384 493 366 489C352 486 342 480 342 464Z" />
      <path d="M165 263L98 390H232Z" fill="none" stroke="#000" strokeWidth="16" strokeLinejoin="round" />
      <path d="M475 263L408 390H542Z" fill="none" stroke="#000" strokeWidth="16" strokeLinejoin="round" />
      <path d="M80 389H250A85 64 0 0 1 80 389Z" />
      <path d="M390 389H560A85 64 0 0 1 390 389Z" />
    </g>
  );
}}

function Mark({{ maskId }}: {{ maskId: string }}) {{
  return (
    <>
      <mask id={{maskId}} maskUnits="userSpaceOnUse" x="-10" y="-10" width={{MARK_W + 20}} height={{MARK_H + 30}}>
        <rect x="-10" y="-10" width={{MARK_W + 20}} height={{MARK_H + 30}} fill="#fff" />
        <Scales />
      </mask>
      <path d={{TAB}} fill={{TEAL}} />
      <g fill="currentColor" mask={{`url(#${{maskId}})`}}>
        <path d={{BACK}} />
        <path d={{FRONT}} />
      </g>
    </>
  );
}}

function useMaskId() {{
  return `cdx-${{useId().replace(/[^a-zA-Z0-9_-]/g, "")}}`;
}}

type BrandProps = {{ className?: string; title?: string }};

/** The folder-and-scales mark on its own. Takes its colour from `color` (currentColor). */
export function BrandMark({{ className, title = "CaseDex" }}: BrandProps) {{
  const maskId = useMaskId();
  return (
    <svg viewBox={{`0 0 ${{MARK_W}} ${{MARK_H}}`}} className={{className}} role="img" aria-label={{title}}>
      <Mark maskId={{maskId}} />
    </svg>
  );
}}

/** The full logo: mark plus the CaseDex wordmark. Takes its colour from `color` (currentColor). */
export function BrandLogo({{ className, title = "CaseDex" }}: BrandProps) {{
  const maskId = useMaskId();
  return (
    <svg viewBox={{`0 0 ${{LOGO_W}} ${{MARK_H}}`}} className={{className}} role="img" aria-label={{title}}>
      <Mark maskId={{maskId}} />
      <path d={{WORDMARK}} fill="currentColor" transform="translate({MARK_W + brand.WORD_GAP} {brand.WORD_BASELINE})" />
    </svg>
  );
}}
'''
write(FE / "components" / "brand-logo.tsx", tsx)
