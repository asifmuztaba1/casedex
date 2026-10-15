"""Single source for the CaseDex logo: the folder-and-scales mark plus the Plus Jakarta Sans ExtraBold wordmark.

Mark coordinates live in a 640 x 510 box. The scales are cut out of the folder with a mask,
so whatever is behind the logo shows through them.
"""
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from pathlib import Path

NAVY = "#0D253C"
TEAL = "#3A7C82"
WHITE = "#FFFFFF"

MARK_W, MARK_H = 640, 510

BACK = ("M0 14Q0 0 14 0H208Q216 0 220 7L262 78Q266 85 274 85H550Q558 85 562 92"
        "L596 142H232L196 97H0Z")
FRONT = ("M0 139Q0 125 14 125H192Q199 125 203 131L233 170H624Q640 170 640 186"
         "V494Q640 510 624 510H16Q0 510 0 494Z")
TAB = "M270 31Q268 26 274 26H410Q416 26 419 31L438 63Q441 68 435 68H296Q290 68 288 63Z"

# The scales, drawn in black inside the mask (black = cut away).
SCALES = """
  <circle cx="320" cy="221" r="23"/>
  <path d="M165 256Q320 232 475 256" fill="none" stroke="#000" stroke-width="19" stroke-linecap="round"/>
  <circle cx="165" cy="256" r="13.5"/>
  <circle cx="475" cy="256" r="13.5"/>
  <rect x="298" y="222" width="44" height="252"/>
  <path d="M298 464C298 480 288 486 274 489C256 493 246 504 246 522H394C394 504 384 493 366 489C352 486 342 480 342 464Z"/>
  <path d="M165 263L98 390H232Z" fill="none" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
  <path d="M475 263L408 390H542Z" fill="none" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
  <path d="M80 389H250A85 64 0 0 1 80 389Z"/>
  <path d="M390 389H560A85 64 0 0 1 390 389Z"/>
"""


def mark(folder=NAVY, tab=TEAL, mask_id="cdx-cut", transform=""):
    """The mark as an SVG group. `folder` colours both folder layers, `tab` the teal sheet."""
    t = f' transform="{transform}"' if transform else ""
    return f"""<g{t}>
  <mask id="{mask_id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="{MARK_W + 20}" height="{MARK_H + 30}">
    <rect x="-10" y="-10" width="{MARK_W + 20}" height="{MARK_H + 30}" fill="#fff"/>
    <g fill="#000">{SCALES}</g>
  </mask>
  <path d="{TAB}" fill="{tab}"/>
  <g fill="{folder}" mask="url(#{mask_id})">
    <path d="{BACK}"/>
    <path d="{FRONT}"/>
  </g>
</g>"""


# ---------- wordmark ----------
FONTS = Path(__file__).resolve().parent / "fonts"
_FONT_PATH = FONTS / "PlusJakartaSans.ttf"
_font = None


def _bold():
    global _font
    if _font is None:
        _font = instancer.instantiateVariableFont(TTFont(_FONT_PATH), {"wght": 800})
    return _font


def text_path(text, cap, tracking=0.0):
    """Outline `text` in Plus Jakarta Sans ExtraBold. Returns (path_d, width) with the baseline at y=0.
    `tracking` is extra space between letters, in em."""
    font = _bold()
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    scale = cap / font["OS/2"].sCapHeight
    kern = _kerning(font)
    pen = SVGPathPen(gs, ntos=_ntos)
    x = 0.0
    names = [cmap[ord(c)] for c in text]
    for i, name in enumerate(names):
        tp = TransformPen(pen, (scale, 0, 0, -scale, x, 0))
        gs[name].draw(tp)
        adv = gs[name].width
        if i + 1 < len(names):
            adv += kern.get((name, names[i + 1]), 0)
            adv += tracking * upm
        x += adv * scale
    return pen.getCommands(), x


def _ntos(n):
    s = f"{n:.1f}"
    return s[:-2] if s.endswith(".0") else s


def _kerning(font):
    """Pair kerning from GPOS (format 1 and 2 pair adjustments)."""
    pairs = {}
    if "GPOS" not in font:
        return pairs
    gpos = font["GPOS"].table
    for lookup in gpos.LookupList.Lookup:
        for st in lookup.SubTable:
            if lookup.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, "LookupType", lookup.LookupType) != 2:
                continue
            if st.Format == 1:
                firsts = st.Coverage.glyphs
                for first, ps in zip(firsts, st.PairSet):
                    for pvr in ps.PairValueRecord:
                        v = getattr(pvr.Value1, "XAdvance", 0) or 0
                        if v:
                            pairs.setdefault((first, pvr.SecondGlyph), v)
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs
                c2 = st.ClassDef2.classDefs
                for first in st.Coverage.glyphs:
                    k1 = c1.get(first, 0)
                    rec = st.Class1Record[k1]
                    for second, k2 in list(c2.items()):
                        v = getattr(rec.Class2Record[k2].Value1, "XAdvance", 0) or 0
                        if v:
                            pairs.setdefault((first, second), v)
    return pairs


# Wordmark proportions taken from the approved artwork, in mark units.
WORD_CAP = 312       # cap height, about 61% of the mark height
WORD_GAP = 60        # space between the mark and the C
WORD_BASELINE = 462  # baseline sits low, centred on the front folder
WORD_TRACKING = -0.03
WORD_OVERHANG = 14   # the x reaches a little past its advance width


def lockup(folder=NAVY, tab=TEAL, text=NAVY, mask_id="cdx-cut", pad=0):
    """Mark + wordmark side by side. Returns (svg_inner, width, height)."""
    d, w = text_path("CaseDex", WORD_CAP, WORD_TRACKING)
    x0 = MARK_W + WORD_GAP
    inner = mark(folder, tab, mask_id, transform=f"translate({pad} {pad})") + \
        f'\n<path d="{d}" fill="{text}" transform="translate({x0 + pad} {WORD_BASELINE + pad})"/>'
    return inner, x0 + w + WORD_OVERHANG + 2 * pad, MARK_H + 2 * pad


def svg(inner, w, h, vb=None, extra=""):
    vb = vb or f"0 0 {w:g} {h:g}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w:g}" height="{h:g}"{extra}>\n'
            f"{inner}\n</svg>\n")
