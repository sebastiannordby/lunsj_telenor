#!/usr/bin/env python3
"""
Henter Bakern sin ukesmeny automatisk.

Bakern legger menyen ut som et BILDE i en inisign-widget, så vanlig
HTML-parsing gir ingen tekst. Dette skriptet:

  1. Henter widget-HTML-en og finner bildet (<img>, CSS background-image
     eller data:-URI). Finner det ikke noe bilde (siden bygges med JS),
     tas et skjermbilde av siden med Playwright i stedet, hvis installert.
  2. Sammenligner bildet med forrige kjøring (SHA-256). Er bildet uendret,
     gjøres ingenting - da blir også manuelle endringer fra /admin stående.
  3. Sender bildet til OpenAI (vision) og ber om rettene som JSON på
     norsk og engelsk.
  4. Skriver Menyer/bakern.txt i det statiske formatet build_menu_json.py
     og webex-leseren forventer:

         Norsk
         - Rett 1

         Engelsk
         - Dish 1

Kjøres fra v1/, f.eks. én gang i uka via cron:
    5 7 * * 1  cd /home/marius/git/lunsj_telenor/v1 && python3 scrape_bakern.py && python3 build_menu_json.py

Valg:
    --force     tolk bildet selv om det er uendret siden sist
    --dry-run   skriv resultatet til skjerm, ikke til bakern.txt
    --image F   bruk en lokal bildefil i stedet for å hente fra widgeten (testing)
    --json      forhåndsvisning for /admin: tolker alltid bildet, skriver ingen
                menyfil, og avslutter med én linje 'JSON:{"text":..., "hash":...}'
"""
import argparse
import base64
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

SCRIPT_DIR = Path(__file__).resolve().parent
MENYER_DIR = SCRIPT_DIR / "Menyer"
RAW_HTML_DIR = SCRIPT_DIR / "raw_html"
OUT_FILE = MENYER_DIR / "bakern.txt"
HASH_FILE = RAW_HTML_DIR / "bakern_image.sha256"

BAKERN_URL = os.environ.get("BAKERN_URL") or (
    "https://widget.inisign.com/Widget/Customers/Customer.aspx"
    "?token=e7420bcd-79cf-4268-abb6-08ccca3a7e89&scaleToFit=true"
)
OPENAI_URL = os.environ.get("OPENAI_URL", "https://api.openai.com/v1/chat/completions")

KEY_FILE = Path("/home/marius/git/key.txt")
MODEL = os.environ.get("BAKERN_MODEL", "gpt-4.1-mini")
UA = {"User-Agent": "Mozilla/5.0 (compatible; LunchMenuBot/2.0)"}

IMG_EXT_RE = re.compile(r"""["'(]([^"'()\s]+?\.(?:png|jpe?g|webp|gif)(?:\?[^"'()\s]*)?)["')]""", re.I)
BG_URL_RE = re.compile(r"""url\(\s*["']?([^"')]+)["']?\s*\)""", re.I)
DATA_URI_RE = re.compile(r"data:image/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)", re.I)
MIN_IMAGE_BYTES = 15_000   # dropper ikoner, logoer og spacer-gif-er


# ----------------------------------------------------------------- nøkkel

def openai_key() -> str:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key and KEY_FILE.is_file():
        key = KEY_FILE.read_text(encoding="utf-8").strip()
    if not key:
        sys.exit("Mangler OpenAI-nøkkel (OPENAI_API_KEY eller /home/marius/git/key.txt).")
    return key


# ----------------------------------------------------------------- bilde

def image_candidates(html: str, base_url: str) -> list[str]:
    """Alle bilde-URL-er vi finner i HTML-en, i rekkefølgen de dukker opp."""
    soup = BeautifulSoup(html, "html.parser")
    urls = []
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-original"):
            if img.get(attr):
                urls.append(img[attr])
    for tag in soup.find_all(style=True):
        urls += BG_URL_RE.findall(tag["style"])
    for style in soup.find_all("style"):
        urls += BG_URL_RE.findall(style.get_text())
    urls += IMG_EXT_RE.findall(html)   # URL-er gjemt i inline-JS/JSON

    seen, out = set(), []
    for u in urls:
        u = u.strip()
        if not u or u.startswith("data:"):
            continue
        full = urljoin(base_url, u)
        if full not in seen:
            seen.add(full)
            out.append(full)
    return out


def largest_image_from_html(html: str, base_url: str) -> tuple[bytes, str] | None:
    """Laster ned kandidatene og returnerer den største (menyen er det største bildet)."""
    best: tuple[bytes, str] | None = None

    for m in DATA_URI_RE.finditer(html):
        data = base64.b64decode(m.group(2))
        if len(data) >= MIN_IMAGE_BYTES and (best is None or len(data) > len(best[0])):
            best = (data, f"image/{m.group(1).lower().replace('jpg', 'jpeg')}")

    for url in image_candidates(html, base_url):
        try:
            r = requests.get(url, timeout=30, headers=UA)
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"  Hoppet over {url}: {e}")
            continue
        ctype = r.headers.get("Content-Type", "").split(";")[0].strip()
        if not ctype.startswith("image/"):
            continue
        print(f"  Fant bilde: {url} ({len(r.content) // 1024} kB)")
        if len(r.content) >= MIN_IMAGE_BYTES and (best is None or len(r.content) > len(best[0])):
            best = (r.content, ctype)
    return best


def screenshot_page(url: str) -> tuple[bytes, str] | None:
    """Reserve: render siden i headless Chromium og ta skjermbilde."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("  Playwright er ikke installert - kan ikke ta skjermbilde.")
        print("  (pip install playwright && playwright install chromium)")
        return None
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(url, wait_until="networkidle", timeout=60_000)
        page.wait_for_timeout(3000)   # la eventuelle slides/animasjoner lande
        png = page.screenshot(full_page=True)
        browser.close()
    print(f"  Tok skjermbilde av siden ({len(png) // 1024} kB)")
    return png, "image/png"


def get_menu_image() -> tuple[bytes, str] | None:
    try:
        r = requests.get(BAKERN_URL, timeout=30, headers=UA)
        r.raise_for_status()
        html = r.text
    except requests.RequestException as e:
        print(f"Feil ved henting av widget: {e}")
        return None

    RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_HTML_DIR / "bakern.html").write_text(html, encoding="utf-8")

    found = largest_image_from_html(html, BAKERN_URL)
    if found:
        return found
    print("  Fant ikke noe bilde i HTML-en - prøver skjermbilde.")
    return screenshot_page(BAKERN_URL)


# ----------------------------------------------------------------- OpenAI

PROMPT = """Bildet er en meny-plakat fra et bakeri i en bedriftskantine.
Les av rettene/produktene som står på menyen.

Regler:
- Bruk kun det som faktisk står på bildet.
- Én rett per element. Ta med en kort beskrivelse hvis den står ved retten.
- Dropp priser, allergentall, åpningstider, logoer og pynt-tekst.
- Står menyen bare på ett språk, oversett til det andre.
- Legg én passende emoji bakerst på hver rett.
- Svar KUN med JSON på formen:
  {"no": ["Rett 1 🥐", "Rett 2 🥪"], "en": ["Dish 1 🥐", "Dish 2 🥪"]}
- Finner du ingen meny på bildet, svar {"no": [], "en": []}."""


def read_menu_with_ai(image: bytes, mime: str) -> dict | None:
    data_url = f"data:{mime};base64,{base64.b64encode(image).decode()}"
    body = {
        "model": MODEL,
        "response_format": {"type": "json_object"},
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": PROMPT},
                {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},
            ],
        }],
    }
    try:
        r = requests.post(
            OPENAI_URL,
            headers={"Authorization": f"Bearer {openai_key()}", "Content-Type": "application/json"},
            json=body,
            timeout=120,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (requests.RequestException, KeyError, ValueError) as e:
        print(f"Feil fra OpenAI: {e}")
        return None

    clean = {}
    for lang in ("no", "en"):
        items = parsed.get(lang) or []
        clean[lang] = [re.sub(r"^[-•*]\s*", "", str(i)).strip() for i in items if str(i).strip()]
    return clean


# ----------------------------------------------------------------- fil

def format_static(menu: dict) -> str:
    lines = ["Norsk"] + [f"- {i}" for i in menu["no"]]
    lines += ["", "Engelsk"] + [f"- {i}" for i in menu["en"]]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Hent Bakern sin meny fra bildet i widgeten.")
    ap.add_argument("--force", action="store_true", help="tolk bildet selv om det er uendret")
    ap.add_argument("--dry-run", action="store_true", help="ikke skriv bakern.txt")
    ap.add_argument("--image", help="lokal bildefil i stedet for widgeten")
    ap.add_argument("--json", action="store_true", help="forhåndsvisning for /admin")
    args = ap.parse_args()
    if args.json:
        args.force = args.dry_run = True

    if args.image:
        path = Path(args.image)
        ext = path.suffix.lower().lstrip(".").replace("jpg", "jpeg")
        found = (path.read_bytes(), f"image/{ext}")
    else:
        print("Henter Bakern-widgeten ...")
        found = get_menu_image()
    if not found:
        sys.exit("Fant ikke noe menybilde - beholder eksisterende bakern.txt.")
    image, mime = found

    RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)
    for old in RAW_HTML_DIR.glob("bakern_meny.*"):
        old.unlink()                      # bare ett menybilde, så /admin viser riktig
    (RAW_HTML_DIR / f"bakern_meny.{mime.split('/')[-1]}").write_bytes(image)

    digest = hashlib.sha256(image).hexdigest()
    previous = HASH_FILE.read_text().strip() if HASH_FILE.is_file() else ""
    if digest == previous and OUT_FILE.is_file() and not args.force:
        print("Menybildet er uendret siden sist - gjør ingenting.")
        return

    print(f"Sender bildet til {MODEL} ...")
    menu = read_menu_with_ai(image, mime)
    if not menu or not menu["no"] or not menu["en"]:
        sys.exit("Fikk ingen retter tilbake - beholder eksisterende bakern.txt.")

    text = format_static(menu)
    print("\n" + text)
    if args.json:
        print("JSON:" + json.dumps({"text": text, "hash": digest}, ensure_ascii=False))
        return
    if args.dry_run:
        print("(--dry-run: skrev ikke til fil)")
        return

    MENYER_DIR.mkdir(parents=True, exist_ok=True)
    tmp = OUT_FILE.with_suffix(".txt.tmp")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, OUT_FILE)          # atomisk, samme som /admin gjør
    HASH_FILE.write_text(digest + "\n")
    print(f"Skrev {OUT_FILE}")


if __name__ == "__main__":
    main()
