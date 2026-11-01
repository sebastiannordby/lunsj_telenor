#!/usr/bin/env python3
"""
Viser tekstlinjene parseren ser i en lagret HTML-fil fra raw_html/, med
markering av hva den tolker som dagoverskrift, og hvor allergentabellen
(et løst tall 1-14) får den til å slutte å lese. Brukes av /admin.

    python3 debug_raw.py raw_html/fresh_4_you_-_middag_ukens.html
"""
import sys
from pathlib import Path

from bs4 import BeautifulSoup

import scrape_ukens_menu as u


def main() -> None:
    path = Path(sys.argv[1])
    html = path.read_text(encoding="utf-8", errors="replace")
    if not html.strip():
        print("(tom fil - hentingen feilet sist)")
        return

    texts = u.extract_leaf_texts(BeautifulSoup(html, "html.parser"))
    stopped = False
    for i, text in enumerate(texts, 1):
        if stopped:
            mark = "  -  "
        elif u.BARE_NUMBER_RE.match(text):
            mark = "STOPP"
            stopped = True
        elif u.is_day_header(text):
            mark = " DAG "
        else:
            mark = "     "
        print(f"{i:3} {mark} {text}")
    if stopped:
        print("\nSTOPP = løst tall som tolkes som start på allergentabellen. Linjer etter ignoreres.")


if __name__ == "__main__":
    main()
