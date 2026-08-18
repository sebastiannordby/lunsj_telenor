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

MENYER_DIR = Path("Menyer")
RAW_HTML_DIR = Path("raw_html")
MENYER_DIR.mkdir(parents=True, exist_ok=True)
RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)

# url + filnavn må matche PLACES["file"] i build_menu_json.py nøyaktig
CANTEENS = {
    "Eat The Street": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=6e5cc038-e918-4f97-9a59-d2afa0456abf&scaleToFit=true",
        "file": "eat_the_street.txt",
    },
    "Kantine M": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=756a5aa2-a95f-4d15-ad5a-59829741075b&scaleToFit=true",
        "file": "kantine_m.txt",
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=a8923cdb-9d92-46bc-b6a4-d026c2cf9a89&scaleToFit=true",
        "file": "fresh_4_you.txt",
    },
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=9b060d7e-6658-4d96-b953-23079d7df3b2&scaleToFit=true",
        "file": "eat_the_street_-_middag.txt",
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
    """Returnerer {"no": {0: [rett, rett], 1: [...], ...}, "en": {...}}."""
    soup = BeautifulSoup(html, "html.parser")
    texts = extract_leaf_texts(soup)

    result = {"no": {i: [] for i in range(5)}, "en": {i: [] for i in range(5)}}
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

        name, _codes = split_trailing_codes(text)
        if len(name) < 2 or name.isdigit():
            continue
        result[current_lang][current_day].append(name)

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
    for canteen, info in CANTEENS.items():
        print(f"Behandler: {canteen}")
        html = fetch_html(info["url"])

        raw_path = RAW_HTML_DIR / f"{canteen.replace(' ', '_').replace('/', '_').lower()}_ukens.html"
        raw_path.write_text(html or "", encoding="utf-8")

        week = parse_week(html) if html else {"no": {i: [] for i in range(5)}, "en": {i: [] for i in range(5)}}
        output = format_week_file(week)

        filepath = MENYER_DIR / info["file"]
        filepath.write_text(output, encoding="utf-8")
        print(f"  Skrev {filepath}")


if __name__ == "__main__":
    main()
