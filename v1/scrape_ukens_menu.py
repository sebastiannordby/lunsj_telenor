"""
Parser for "UKENS MENY"-widgetene (v2-tokens).

Disse sidene viser hele uken, gruppert under dag-overskrifter (Mandag/Monday
osv.), med allergen-koder limt bakpå rettnavnet ("Pizza ... 3,4"), og en
delt allergen-forklaring på slutten (ignoreres).

Output: matcher parse_weekly() i build_menu_json.py:
    Mandag
    - Rett 1
    - Rett 2

    Monday
    - Meal 1
    - Meal 2

    Tirsdag
    ...
Én fil per kantine i Menyer/, med filnavn som matcher PLACES i build_menu_json.py.
"""

import difflib
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup, Tag

import allergen_store
import runlog

MENYER_DIR = Path("Menyer")
RAW_HTML_DIR = Path("raw_html")
MENYER_DIR.mkdir(parents=True, exist_ok=True)
RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)

# url + filnavn må matche PLACES["file"] i build_menu_json.py nøyaktig
CANTEENS = {
    "Kantine M": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=756a5aa2-a95f-4d15-ad5a-59829741075b&scaleToFit=true",
        "file": "kantine_m.txt",
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=a8923cdb-9d92-46bc-b6a4-d026c2cf9a89&scaleToFit=true",
        "file": "fresh_4_you.txt",
    },
    "Fresh 4 You - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=dd6ee59b-6e03-4215-8543-a01dbda54db7&scaleToFit=true",
        "file": "fresh_4_you_-_middag.txt",
    },
    # Cafe M legger ikke alltid ut ukesmeny. optional = tom side er ikke en feil.
    "Cafe M": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=e7a0be40-4bb4-462a-8feb-0f9b3f5012b9&scaleToFit=true",
        "file": "cafe_m.txt",
        "optional": True,
    },
}

DAY_NAMES = [
    (0, "Mandag", ["mandag"], "Monday", ["monday"]),
    (1, "Tirsdag", ["tirsdag"], "Tuesday", ["tuesday", "thuesday"]),
    (2, "Onsdag", ["onsdag"], "Wednesday", ["wednesday"]),
    (3, "Torsdag", ["torsdag"], "Thursday", ["thursday"]),
    (4, "Fredag", ["fredag"], "Friday", ["friday"]),
]
ALL_DAY_STRINGS: dict[str, tuple[int, str]] = {}
for idx, _, no_variants, _, en_variants in DAY_NAMES:
    for v in no_variants:
        ALL_DAY_STRINGS[v] = (idx, "no")
    for v in en_variants:
        ALL_DAY_STRINGS[v] = (idx, "en")

# Allergen-forklaringen nederst er splittet i egne celler ("1", "Egg", ...)
BARE_NUMBER_RE = re.compile(r"^(1[0-4]|[1-9])$")


def split_trailing_codes(text: str) -> tuple[str, list[int]]:
    """Fjerner allergentall bakerst. Handterer '(1,3)', ' 3,4' og 'mozzarella4'."""
    m = re.search(r"\s*\(\s*(\d{1,2}(?:\s*,\s*\d{1,2})*)\s*\)\s*$", text)
    if not m:
        m = re.search(r"\s*(\d{1,2}(?:\s*,\s*\d{1,2})*)\s*$", text)
    if m:
        codes = [int(c) for c in re.findall(r"\d+", m.group(1))]
        if codes and all(1 <= c <= 14 for c in codes):
            return text[:m.start()].strip(), codes
    return text.strip(), []


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
    # Allergentall ligger av og til i egen <sup>/<sub>/<small> ("grønnsaker<sup>3</sup>").
    # Da blir retten ikke et blad-element, og det løse "3" ser ut som starten
    # på allergentabellen. Pakk dem ut så tallet havner sammen med retten.
    for tag in soup.find_all(["sup", "sub", "small"]):
        tag.unwrap()
    soup.smooth()

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


def is_day_header(text: str) -> tuple[int, str] | None:
    lowered = text.lower().strip()
    if lowered in ALL_DAY_STRINGS:
        return ALL_DAY_STRINGS[lowered]
    if len(lowered) <= 15:
        match = difflib.get_close_matches(lowered, ALL_DAY_STRINGS.keys(), n=1, cutoff=0.8)
        if match:
            return ALL_DAY_STRINGS[match[0]]
    return None


def is_allergen_legend(text: str) -> bool:
    return text.lower().startswith(("allergener", "allergens", "allergen"))


def parse_week(html: str) -> dict[str, dict[int, list[str]]]:
    """Returnerer {"no": {0: [rett, rett], 1: [...], ...}, "en": {...},
    "codes": {"no": {0: [[1, 3], [4]], ...}, "en": {...}}} - codes står i samme
    rekkefølge som rettene."""
    soup = BeautifulSoup(html, "html.parser")
    texts = extract_leaf_texts(soup)

    result = {"no": {i: [] for i in range(5)}, "en": {i: [] for i in range(5)}}
    codes = {"no": {i: [] for i in range(5)}, "en": {i: [] for i in range(5)}}
    current_day, current_lang = None, None
    in_legend = False

    for text in texts:
        if BARE_NUMBER_RE.match(text):
            in_legend = True          # allergen-tabellen har startet
            continue
        if in_legend:
            continue

        header = is_day_header(text)
        if header:
            current_day, current_lang = header
            continue
        if is_allergen_legend(text) or current_day is None:
            continue

        name, dish_codes = split_trailing_codes(text)
        if len(name) < 2 or name.isdigit():
            continue
        result[current_lang][current_day].append(name)
        codes[current_lang][current_day].append(dish_codes)

    result["codes"] = codes
    return result


NO_DAY_LABEL = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"]
EN_DAY_LABEL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def format_week_file(week: dict[str, dict[int, list[str]]]) -> str:
    lines = []
    for idx in range(5):
        lines.append(NO_DAY_LABEL[idx])
        dishes = week["no"][idx]
        if not dishes:
            lines.append("- Ingen meny")
        else:
            lines.extend(f"- {d}" for d in dishes)
        lines.append("")

        lines.append(EN_DAY_LABEL[idx])
        dishes = week["en"][idx]
        if not dishes:
            lines.append("- No menu")
        else:
            lines.extend(f"- {d}" for d in dishes)
        lines.append("")

    return "\n".join(lines).strip() + "\n"


def main():
    summary, failed = [], []
    allergens = {}
    for canteen, info in CANTEENS.items():
        print(f"Behandler: {canteen}")
        html = fetch_html(info["url"])

        raw_path = RAW_HTML_DIR / f"{canteen.replace(' ', '_').replace('/', '_').lower()}_ukens.html"
        raw_path.write_text(html or "", encoding="utf-8")

        filepath = MENYER_DIR / info["file"]
        week = parse_week(html) if html else None
        dishes = sum(len(d) for d in week["no"].values()) if week else 0

        # Feilet hentingen, eller fant vi ingen retter, beholder vi fila vi har.
        # Ellers ville en nettverksfeil tømt ukesmenyen for resten av uka.
        if dishes == 0 and filepath.is_file():
            print(f"  Fant ingen retter - beholder eksisterende {filepath}")
            summary.append(f"{canteen}: beholdt gammel fil")
            if not (html and info.get("optional")):
                failed.append(canteen)
            continue
        summary.append(f"{canteen}: {dishes}")
        allergens[info["file"]] = {
            lang: {str(d): [[n, c] for n, c in zip(week[lang][d], week["codes"][lang][d])] for d in range(5)}
            for lang in ("no", "en")
        }

        filepath.write_text(format_week_file(week or {"no": {i: [] for i in range(5)}, "en": {i: [] for i in range(5)}}), encoding="utf-8")
        print(f"  Skrev {filepath} ({dishes} retter)")
    if allergens:
        allergen_store.update(MENYER_DIR / "allergener.json", allergens)
    return (not failed, ", ".join(summary))


if __name__ == "__main__":
    runlog.run("scrape_ukens_menu.py", main)
