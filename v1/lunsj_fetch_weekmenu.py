import os
import re
import requests
from bs4 import BeautifulSoup
from pathlib import Path

# =========================
# KONFIG
# =========================

key_file_path = "/home/marius/git/key.txt"

with open(key_file_path, "r") as file: OPENAI_API_KEY = file.read().strip()
if not OPENAI_API_KEY:
    raise ValueError("Manglende OPENAI_API_KEY i miljøvariabler.")

MODEL = "gpt-5-nano"

OUTPUT_DIR = Path(
    "/home/marius/git/lunsj_telenor/v1/Menyer"
)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DEBUG_DIR = OUTPUT_DIR / "_debug_trimmed_html"
DEBUG_DIR.mkdir(parents=True, exist_ok=True)

MAX_HTML_CHARS = 60000  # ekstra sikkerhetsgrense før sending til OpenAI

urls = {
    "Eat The Street": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=6e5cc038-e918-4f97-9a59-d2afa0456abf&scaleToFit=true",
        "opening_hours": "10:30 - 14:00",
        "building": "J/K"
    },
    "Flow": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=756a5aa2-a95f-4d15-ad5a-59829741075b&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "B"
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=a8923cdb-9d92-46bc-b6a4-d026c2cf9a89&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "C/D"
    },
    "Bakern": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=e7420bcd-79cf-4268-abb6-08ccca3a7e89&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "C"
    },
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=9b060d7e-6658-4d96-b953-23079d7df3b2&scaleToFit=true",
        "opening_hours": "15:00 - 17:00",
        "building": "J/K"
    }
}


# =========================
# HTTP
# =========================

def fetch_html(url: str) -> str | None:
    try:
        response = requests.get(
            url,
            timeout=20,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LunchMenuBot/1.0)"}
        )
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Feil ved henting av {url}: {e}")
        return None


# =========================
# HTML-RYDDING
# =========================

def normalize_whitespace(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_effectively_empty(tag: Tag) -> bool:
    """
    Tom node = ingen nyttig tekst og ingen nyttige barn.
    """
    text = normalize_whitespace(tag.get_text(" ", strip=True))
    return text == ""


def unwrap_nonsemantic_tags(container: Tag) -> None:
    """
    Beholder tekst, men fjerner unødvendige tags rundt teksten.
    """
    for t in container.find_all(["span", "font", "strong", "em", "b", "i"]):
        t.unwrap()


def remove_noise_tags(container: Tag) -> None:
    """
    Fjerner tunge eller irrelevante elementer.
    """
    for t in container.find_all([
        "script", "style", "noscript", "svg", "meta", "link",
        "iframe", "canvas", "picture", "source"
    ]):
        t.decompose()

    # Bilder er hovedårsaken til eksplosiv størrelse her
    for img in container.find_all("img"):
        img.decompose()

    # Layout-tabeller er ofte bare støy i disse responsene
    for table in container.find_all("table"):
        table.decompose()


def strip_heavy_attributes(container: Tag) -> None:
    """
    Fjerner attributter som blåser opp HTML-en kraftig.
    """
    for tag in container.find_all(True):
        allowed_attrs = {}

        # Behold eventuelt href dersom a-tag skulle ha nyttig tekst/lenke,
        # men i denne use-casen trengs det sjelden.
        if tag.name == "a" and tag.get("href"):
            href = tag.get("href", "").strip()
            if href and len(href) < 300:
                allowed_attrs["href"] = href

        # Ingen andre attrs beholdes
        tag.attrs = allowed_attrs


def remove_redundant_breaks(container: Tag) -> None:
    """
    Fjerner meningsløse <br>-sekvenser.
    """
    # Fjern br inni elementer som ellers er tomme
    for br in container.find_all("br"):
        parent = br.parent
        if parent and normalize_whitespace(parent.get_text(" ", strip=True)) == "":
            br.decompose()

    # Fjern helt tomme tagger etterpå
    for tag in list(container.find_all(True)):
        if tag.name in ["div", "p", "h1", "h2", "h3", "h4", "section", "article"]:
            if is_effectively_empty(tag):
                tag.decompose()


def simplify_structure(container: Tag) -> None:
    """
    Rydder opp i struktur uten å miste tekst.
    """
    unwrap_nonsemantic_tags(container)
    remove_noise_tags(container)
    strip_heavy_attributes(container)
    remove_redundant_breaks(container)

    # Fjern tomme kommentarer / whitespace-noder i praksis via stringify senere


def minify_html(html: str) -> str:
    html = re.sub(r">\s+<", "><", html)
    html = re.sub(r"\s{2,}", " ", html)
    return html.strip()


def choose_best_container(soup: BeautifulSoup) -> Tag | None:
    """
    Prioriterer kjent container, ellers body.
    """
    selectors = [
        ".data-handler-container",
        ".menu-item-holder",
        ".menu-item",
        "body"
    ]

    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            return node

    return None


def trim_html_for_llm(raw_html: str) -> str | None:
    soup = BeautifulSoup(raw_html, "html.parser")

    # Fjern global støy før vi velger container
    for tag in soup.find_all(["script", "style", "noscript", "svg", "meta", "link", "head"]):
        tag.decompose()

    container = choose_best_container(soup)
    if not container:
        return None

    # Jobb på en separat parse av containeren for å unngå sideeffekter
    container_soup = BeautifulSoup(str(container), "html.parser")
    working_root = container_soup.find()

    if not working_root:
        return None

    simplify_structure(working_root)

    trimmed_html = minify_html(str(working_root))

    # Hard fallback dersom HTML fortsatt er for stor:
    # konverter til en superenkel tekstnær HTML-struktur
    if len(trimmed_html) > MAX_HTML_CHARS:
        trimmed_html = compress_container_to_textish_html(working_root)

    if len(trimmed_html) > MAX_HTML_CHARS:
        trimmed_html = trimmed_html[:MAX_HTML_CHARS]

    return trimmed_html


def compress_container_to_textish_html(container: Tag) -> str:
    """
    Fallback: bygger en svært liten pseudo-HTML med bare overskrifter og tekstblokker.
    Bevarer litt struktur, men kaster nesten all layout.
    """
    chunks = []

    for el in container.find_all(["h1", "h2", "h3", "h4", "p", "div", "li"]):
        text = normalize_whitespace(el.get_text(" ", strip=True))
        if not text:
            continue

        # dropp åpenbart irrelevante layouttekster hvis ønskelig
        if len(text) == 1:
            continue

        if el.name in ["h1", "h2", "h3", "h4"]:
            chunks.append(f"<h>{text}</h>")
        else:
            chunks.append(f"<p>{text}</p>")

    # dedupliser nærliggende duplikater
    deduped = []
    prev = None
    for chunk in chunks:
        if chunk != prev:
            deduped.append(chunk)
        prev = chunk

    result = "".join(deduped)
    result = minify_html(result)
    return result[:MAX_HTML_CHARS]


def save_trimmed_html_debug(canteen: str, trimmed_html: str) -> None:
    filename = f"{canteen.replace(' ', '_').replace('/', '_').lower()}_trimmed.html"
    path = DEBUG_DIR / filename
    path.write_text(trimmed_html, encoding="utf-8")

# =========================
# OPENAI
# =========================

def send_to_chatgpt(canteen_name: str, trimmed_html: str) -> str | None:
    system_prompt = """
Du ekstraherer kantinemenyer fra HTML.

Regler:
- Bruk kun informasjon som faktisk finnes i HTML-en.
- Returner hele menyen for alle tilgjengelige ukedager, både på norsk og engelsk.
- Hvis en ukedag finnes men er tom, skriv:
  - Ingen meny
  - No menu
- Rett åpenbare stavefeil i ukedager, for eksempel "Thuesday" -> "Tuesday".
- Fjern allergentall og løse tall på slutten av retter, som "4", "1,2,3" osv.
- Sett hver matrett på egen linje.
- Behold meningsinnholdet i rettene, men rens opp formatering.
- Legg inn én passende emoji bak hver matrett.
- Ikke legg til forklaring, intro eller oppsummering.
- Svar kun i dette formatet:

Mandag
- Rett 1
- Rett 2

Monday
- Meal 1
- Meal 2

Tirsdag
- ...

Tuesday
- ...

osv.
""".strip()

    user_prompt = f"""
Kantine: {canteen_name}

Her er trimmet HTML med menyinnhold. Ekstraher og renskriv menyen:

{trimmed_html}
""".strip()

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=90
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        print(f"Feil fra OpenAI API for {canteen_name}: {e}")
        try:
            print(response.text)
        except Exception:
            pass
        return None


# =========================
# FIL
# =========================

def save_menu_to_file(canteen: str, menu: str) -> None:
    filename = f"{canteen.replace(' ', '_').replace('/', '_').lower()}.txt"
    filepath = OUTPUT_DIR / filename

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(menu.strip() + "\n")

    print(f"Meny lagret i: {filepath}")


# =========================
# MAIN
# =========================

def main():
    for canteen, info in urls.items():
        print(f"\nBehandler: {canteen}")

        html_content = fetch_html(info["url"])
        if not html_content:
            print(f"Kunne ikke hente HTML for {canteen}.")
            continue

        trimmed_html = trim_html_for_llm(html_content)
        if not trimmed_html:
            print(f"Kunne ikke trimme HTML for {canteen}.")
            continue

        save_trimmed_html_debug(canteen, trimmed_html)
        print(f"Trimmet HTML-lengde for {canteen}: {len(trimmed_html)} tegn")

        menu = send_to_chatgpt(canteen, trimmed_html)
        if not menu:
            print(f"Kunne ikke ekstrahere meny for {canteen}.")
            continue

        save_menu_to_file(canteen, menu)
        print(f"{canteen} ferdig.")


if __name__ == "__main__":
    main()
