# CaseDex logo assets

`brand.py` holds the logo: the folder-and-scales mark and the Plus Jakarta Sans
ExtraBold wordmark, with the brand colours (navy `#0D253C`, teal `#3A7C82`).
`build.py` turns it into every file the app uses:

| File | Used for |
| --- | --- |
| `app/favicon.ico`, `public/icons/icon-32.svg` | Browser tab |
| `public/icons/icon-192.png`, `icon-512.png`, `icon-512.svg` | PWA install, manifest |
| `public/icons/icon-maskable-512.png` | Android adaptive icon |
| `public/icons/apple-touch-icon.png` | iOS home screen |
| `public/icons/badge-96.png` | Push notification badge (white silhouette) |
| `public/logo-mark.svg`, `logo-wordmark.svg`, `logo-wordmark-white.svg` | Logo files for docs, decks, partners |
| `public/logo-email.png` | Email header |
| `public/og-image.png` | Link previews (WhatsApp, Facebook, X, LinkedIn) |
| `components/brand-logo.tsx` | `<BrandLogo />` and `<BrandMark />` in the app |

To change the logo, edit `brand.py` and rebuild. Never edit the generated files by hand.

```bash
cd frontend/scripts/brand
python3 -m venv .venv && .venv/bin/pip install fonttools pillow resvg-py
mkdir -p fonts
curl -sSLo fonts/PlusJakartaSans.ttf "https://github.com/google/fonts/raw/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf"
curl -sSLo fonts/IBMPlexSans.ttf "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf"
cd ../.. && scripts/brand/.venv/bin/python scripts/brand/build.py .
```
