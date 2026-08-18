"""
Parser for "DAGENS MENY"-widgetene (v1-tokens).

Disse sidene viser KUN dagens rett (kantinene oppdaterer selv hver morgen),
så vi trenger ingen ukedag-deteksjon i det hele tatt - bare et språkbytte
mellom "DAGENS LUNSJ"-seksjonen og "Todays LUNCH"-seksjonen.

Struktur observert på siden (leaf-tekst i dokumentrekkefølge):
    DAGENS LUNSj
    <rettnavn>
    Allergener: <tall,tall>
    <rettnavn>
    Allergener: <tall>
    ...
    Todays LUNCH
    <dish name>
    Allergens: <tall,tall>
    ...
    [allergen-forklaringstabell - ignoreres]

Output: matcher parse_daily() i build_menu_json.py nøyaktig:
    Kantinenavn (hours) - Bygg: X
    - Rett 1
    - Rett 2
"""

import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup, Tag

OUTPUT_DIR = Path("outputs")
RAW_HTML_DIR = Path("raw_html")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)

CANTEENS = {
    "Eat The Street": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=bbf807d7-b1ed-4493-8853-e40077f6adde&scaleToFit=true",
        "opening_hours": "10:30 - 14:00",
        "building": "J/K",
    },
    "Kantine M": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=4a0457f8-dbfa-4783-8ebe-b5ee0486843f&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "M, 2. etasje",
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=aa1358ee-d30e-4289-a630-892cd1210857&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "C/D",
    },
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=8469c383-d042-4d2d-8b18-30b6f9f90393&scaleToFit=true",
        "opening_hours": "15:00 - 17:00",
        "building": "J/K",
    },
}

ALLERGEN_MAP = {
    1: "Egg", 2: "Fish", 3: "Gluten", 4: "Milk", 5: "Nuts", 6: "Peanuts",
    7: "Celery", 8: "Mustard", 9: "Sesame seed", 10: "Shellfish",
    11: "Soy", 12: "Sulfites", 13: "Molluscs", 14: "Lupine",
}

NO_HEADER_RE = re.compile(r"^dagens\s+lunsj", re.IGNORECASE)
EN_HEADER_RE = re.compile(r"^today'?s\s+lunch", re.IGNORECASE)
ALLERGEN_LINE_RE = re.compile(r"^(?:allergener|allergens)\s*:\s*(?P<codes>[\d,\s]+)$", re.IGNORECASE)
# Legend-tabellrader ser ut som "1   Egg" eller "10   Skalldyr/Shellfish" - kort, starter med 1-14 etterfulgt av ord.
LEGEND_ROW_RE = re.compile(r"^(1[0-4]|[1-9])\s+\S")


def fetch_html(url: str) -> str | None:
    try:
        resp = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0 (compatible; LunchMenuBot/2.0)"})
        resp.raise_for_status()
        return resp.text
    except requests.exceptions.RequestException as e:
        print(f"  Feil ved henting: {e}")
        return None


def extract_leaf_texts(soup: BeautifulSoup) -> list[str]:
    for tag in soup.find_all(["script", "style", "noscript", "img", "svg"]):
        tag.decompose()

    texts, seen = [], set()
    for el in soup.find_all(True):
        if any(c.get_text(strip=True) for c in el.find_all(True, recursive=False)):
            continue
        text = re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip()
        if not text or id(el) in seen:
            continue
        seen.add(id(el))
        texts.append(text)

    if len(texts) < 3:
        raw = soup.get_text("\n", strip=True)
        texts = [line.strip() for line in raw.split("\n") if line.strip()]
    return texts


def parse_dagens(html: str) -> dict[str, list[tuple[str, list[int]]]]:
    """Returnerer {"no": [(navn, [koder]), ...], "en": [...]}."""
    soup = BeautifulSoup(html, "html.parser")
    texts = extract_leaf_texts(soup)

    result = {"no": [], "en": []}
    current_lang = None

    for text in texts:
        if NO_HEADER_RE.match(text):
            current_lang = "no"
            continue
        if EN_HEADER_RE.match(text):
            current_lang = "en"
            continue
        if current_lang is None:
            continue  # tekst før første overskrift (bør ikke skje, men vær robust)

        m = ALLERGEN_LINE_RE.match(text)
        if m:
            codes = [int(c) for c in re.findall(r"\d+", m.group("codes"))]
            if result[current_lang]:
                name, _ = result[current_lang][-1]
                result[current_lang][-1] = (name, codes)
            continue

        if LEGEND_ROW_RE.match(text) and len(text) < 40:
            continue  # allergen-forklaringstabell på slutten - ikke en rett

        # Vanlig rettnavn
        result[current_lang].append((text, []))

    return result


def format_block(canteen: str, info: dict, dishes: list[tuple[str, list[int]]], lang: str, allergen_names: bool) -> str:
    label = "Bygg" if lang == "no" else "Building"
    lines = [f"{canteen} ({info['opening_hours']}) - {label}: {info['building']}"]
    if not dishes:
        lines.append("Ingen meny" if lang == "no" else "No menu")
    else:
        for name, codes in dishes:
            if allergen_names and codes:
                allergens = ", ".join(ALLERGEN_MAP[c] for c in codes if c in ALLERGEN_MAP)
                lines.append(f"- {name} ({allergens})")
            else:
                lines.append(f"- {name}")
    return "\n".join(lines)


def main():
    no_blocks, en_blocks, al_blocks = [], [], []

    for canteen, info in CANTEENS.items():
        print(f"Behandler: {canteen}")
        html = fetch_html(info["url"])

        raw_path = RAW_HTML_DIR / f"{canteen.replace(' ', '_').replace('/', '_').lower()}_dagens.html"
        raw_path.write_text(html or "", encoding="utf-8")

        parsed = parse_dagens(html) if html else {"no": [], "en": []}

        no_blocks.append(format_block(canteen, info, parsed["no"], "no", allergen_names=False))
        en_blocks.append(format_block(canteen, info, parsed["en"], "en", allergen_names=False))
        al_blocks.append(format_block(canteen, info, parsed["en"], "en", allergen_names=True))

    (OUTPUT_DIR / "menus_no.txt").write_text("\n\n".join(no_blocks) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "menus_en.txt").write_text("\n\n".join(en_blocks) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "menus_al.txt").write_text("\n\n".join(al_blocks) + "\n", encoding="utf-8")
    print("Skrev outputs/menus_no.txt, menus_en.txt, menus_al.txt")


if __name__ == "__main__":
    main()
