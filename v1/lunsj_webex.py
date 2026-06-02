import re
import requests
import sys
from bs4 import BeautifulSoup, Tag
from datetime import datetime

# =========================
# KONFIG
# =========================

key_file_path = "/home/marius/git/key.txt"

with open(key_file_path, "r") as file:
    OPENAI_API_KEY = file.read().strip()

MODEL = "gpt-4o-mini"

MAX_HTML_CHARS = 60000

urls = {
    "Eat The Street": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=bbf807d7-b1ed-4493-8853-e40077f6adde&scaleToFit=true",
        "opening_hours": "10:30 - 14:00",
        "building": "J/K"
    },
    "Flow": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=4a0457f8-dbfa-4783-8ebe-b5ee0486843f&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "B"
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=aa1358ee-d30e-4289-a630-892cd1210857&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "C/D"
    },
    #"Bakern": {
    #    "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=e7420bcd-79cf-4268-abb6-08ccca3a7e89&scaleToFit=true",
    #    "opening_hours": "10:30 - 13:00",
    #    "building": "C"
    #},
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=8469c383-d042-4d2d-8b18-30b6f9f90393&scaleToFit=true",
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
            verify=False,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LunchMenuBot/1.0)"}
        )
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Feil ved henting av {url}: {e}")
        return None


# =========================
# HTML-TRIMMING (fra v1)
# =========================

def normalize_whitespace(text: str) -> str:
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def is_effectively_empty(tag: Tag) -> bool:
    return normalize_whitespace(tag.get_text(" ", strip=True)) == ""


def unwrap_nonsemantic_tags(container: Tag) -> None:
    for t in container.find_all(["span", "font", "strong", "em", "b", "i"]):
        t.unwrap()


def remove_noise_tags(container: Tag) -> None:
    for t in container.find_all([
        "script", "style", "noscript", "svg", "meta", "link",
        "iframe", "canvas", "picture", "source"
    ]):
        t.decompose()
    for img in container.find_all("img"):
        img.decompose()
    for table in container.find_all("table"):
        table.decompose()


def strip_heavy_attributes(container: Tag) -> None:
    for tag in container.find_all(True):
        allowed_attrs = {}
        if tag.name == "a" and tag.get("href"):
            href = tag.get("href", "").strip()
            if href and len(href) < 300:
                allowed_attrs["href"] = href
        tag.attrs = allowed_attrs


def remove_redundant_breaks(container: Tag) -> None:
    for br in container.find_all("br"):
        parent = br.parent
        if parent and normalize_whitespace(parent.get_text(" ", strip=True)) == "":
            br.decompose()
    for tag in list(container.find_all(True)):
        if tag.name in ["div", "p", "h1", "h2", "h3", "h4", "section", "article"]:
            if is_effectively_empty(tag):
                tag.decompose()


def simplify_structure(container: Tag) -> None:
    unwrap_nonsemantic_tags(container)
    remove_noise_tags(container)
    strip_heavy_attributes(container)
    remove_redundant_breaks(container)


def minify_html(html: str) -> str:
    html = re.sub(r">\s+<", "><", html)
    html = re.sub(r"\s{2,}", " ", html)
    return html.strip()


def choose_best_container(soup: BeautifulSoup) -> Tag | None:
    for selector in [".data-handler-container", ".menu-item-holder", ".menu-item", "body"]:
        node = soup.select_one(selector)
        if node:
            return node
    return None


def compress_container_to_textish_html(container: Tag) -> str:
    chunks = []
    for el in container.find_all(["h1", "h2", "h3", "h4", "p", "div", "li"]):
        text = normalize_whitespace(el.get_text(" ", strip=True))
        if not text or len(text) == 1:
            continue
        if el.name in ["h1", "h2", "h3", "h4"]:
            chunks.append(f"<h>{text}</h>")
        else:
            chunks.append(f"<p>{text}</p>")

    deduped = []
    prev = None
    for chunk in chunks:
        if chunk != prev:
            deduped.append(chunk)
        prev = chunk

    return minify_html("".join(deduped))[:MAX_HTML_CHARS]


def trim_html_for_llm(raw_html: str) -> str | None:
    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup.find_all(["script", "style", "noscript", "svg", "meta", "link", "head"]):
        tag.decompose()

    container = choose_best_container(soup)
    if not container:
        return None

    container_soup = BeautifulSoup(str(container), "html.parser")
    working_root = container_soup.find()
    if not working_root:
        return None

    simplify_structure(working_root)
    trimmed_html = minify_html(str(working_root))

    if len(trimmed_html) > MAX_HTML_CHARS:
        trimmed_html = compress_container_to_textish_html(working_root)

    if len(trimmed_html) > MAX_HTML_CHARS:
        trimmed_html = trimmed_html[:MAX_HTML_CHARS]

    return trimmed_html


# =========================
# OPENAI
# =========================

def send_to_chatgpt(canteen_name: str, trimmed_html: str) -> str | None:
    prompt = f"""
Her er HTML-en fra kantine-menyen for {canteen_name}. Ekstraher menyen på norsk, formater den i følgende struktur, sett inn en passende emoji bak hver matrett og returner KUN menyen:

* [Matrett 1]
* [Matrett 2]

HTML:
{trimmed_html}
""".strip()

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": "Du er en assistent som ekstraherer menydata fra HTML og returnerer meny på norsk. Ikke gjenta matretter."
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5
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
# MAIN
# =========================

day = -1
language = "no"

bygg = "Building" if language == "en" else "Bygg"

current_day = datetime.today().weekday()

if current_day in (5, 6):
    if language == "en":
        print("No menus for Saturday or Sunday. Come back on Monday or select a weekday.")
    else:
        print("Ingen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
else:
    weekdays_norwegian = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"]
    today = datetime.today()
    weekday = weekdays_norwegian[today.weekday()]
    print("## Dagens lunsj ---", weekday + " " + today.strftime("%d.%m.%Y:"))

    for canteen, info in urls.items():
        html_content = fetch_html(info["url"])
        if not html_content:
            print(f"Kunne ikke hente HTML for {canteen}.")
            continue

        trimmed_html = trim_html_for_llm(html_content)
        if not trimmed_html:
            print(f"Kunne ikke trimme HTML for {canteen}.")
            continue

        print(f"  [debug] Trimmet HTML for {canteen}: {len(trimmed_html)} tegn")

        menu = send_to_chatgpt(canteen, trimmed_html)
        if menu:
            print(f"\n**{canteen}** ({info['opening_hours']}) - {bygg}: {info['building']}")
            print(menu)
        else:
            print(f"Kunne ikke ekstrahere meny for {canteen}.")
