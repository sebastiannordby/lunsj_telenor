#!/usr/bin/env python3
"""
Bygger menu.json for nettsiden ut fra .txt-filene i Menyer/.

Erstatter behovet for at nettsiden kaller Python per visning: nettsiden
laster menu.json statisk, og denne kjøres like ofte som dagens-skriptet.

Bruk:
    python3 build_menu_json.py                 # skriver ./menu.json
    python3 build_menu_json.py --out /var/www/html/menu.json
"""
import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path

import runlog

SCRIPT_DIR = Path(__file__).resolve().parent
MENU_DIR = SCRIPT_DIR / "Menyer"                    # ukesmenyene (kantinenavn.txt)
OVERRIDES = SCRIPT_DIR / "overrides.json"           # manuelle menyer satt fra /admin
DAILY_DIR = SCRIPT_DIR / "outputs"                  # dagsmenyene (menus_no/en/al.txt)
OUT_FILE = SCRIPT_DIR / "public" / "menu.json"      # der nettsiden leser den

DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"]
NO_DAYS = {"Mandag": "mon", "Tirsdag": "tue", "Onsdag": "wed", "Torsdag": "thu", "Fredag": "fri"}
EN_DAYS = {"Monday": "mon", "Tuesday": "tue", "Wednesday": "wed", "Thursday": "thu", "Friday": "fri"}

# id-en frontend bruker  ->  filnavn + statisk metadata
PLACES = {
    "m": {
        "file": "kantine_m.txt",
        "name": "Kantine M",
        "hours": "10:30 – 13:00",
        "building": "M, 2. etasje",
        "kind": "lunch",
    },
    "fresh4you": {
        "file": "fresh_4_you.txt",
        "name": "Fresh 4 You",
        "hours": "10:30 – 13:00",
        "building": "C/D",
        "kind": "lunch",
    },
    # Bakern: samme meny hele uka. Skrives av scrape_dagens_menu.py fra dagsmenyen.
    "bakern": {
        "file": "bakern.txt",
        "name": "Bakern",
        "hours": "07:00 – 15:00",
        "lunchHours": "10:30 – 13:00",
        "building": "C",
        "kind": "static",
    },
    # Middagen er flyttet til Fresh 4 You (Eat The Street er lagt ned)
    "dinner": {
        "file": "fresh_4_you_-_middag.txt",
        "name": "Fresh 4 You – Middag",
        "hours": "15:00 – 17:00",
        "building": "C/D",
        "kind": "dinner",
    },
}

# Filene fra dagens-skriptet (blokk per kantine med header-linje)
DAILY_FILES = {
    "no": "menus_no.txt",
    "en": "menus_en.txt",
    "allergens": "menus_al.txt",
}

# Kantinenavn slik de står i dagfilene -> id-en frontend bruker
DAILY_NAME_TO_ID = {
    "fresh 4 you - middag": "dinner",
    "fresh 4 you middag": "dinner",
    "kantine m": "m",
    "fresh 4 you": "fresh4you",
    "bakern": "bakern",
}

# Nedlagte kantiner - ignoreres hvis de dukker opp i gamle dagfiler
RETIRED_DAILY_NAMES = {"eat the street", "eat the street - middag"}

# Steder som ALDRI skal overstyres av dagfilene. Middagens dagsmeny-widget
# henger igjen med forrige dags rett, så middag kommer kun fra ukesmenyen.
WEEKLY_ONLY = {"dinner"}


def clean_item(line: str) -> str:
    """'- Rett 1 🍝' -> 'Rett 1 🍝'"""
    return re.sub(r"^[-•*]\s*", "", line.strip()).strip()


def parse_weekly(path: Path) -> dict:
    """
    Leser en ukesfil med blokker på formen:
        Mandag
        - rett
        - rett
        (blank linje)
        Monday
        - meal
    Returnerer {"no": {"mon": [...], ...}, "en": {...}}.
    Filer med 'Norsk'/'Engelsk'-headere (statisk meny) legges på alle dager.
    """
    out = {"no": {k: [] for k in DAY_KEYS}, "en": {k: [] for k in DAY_KEYS}}
    if not path.is_file():
        return out

    lang = None
    day = None
    static = {"no": [], "en": []}

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue

        bare = line.rstrip(":").strip()
        if bare in NO_DAYS:
            lang, day = "no", NO_DAYS[bare]
            continue
        if bare in EN_DAYS:
            lang, day = "en", EN_DAYS[bare]
            continue
        header = line.rstrip(":").strip()
        if header in ("Norsk", "Norwegian"):
            lang, day = "no", "static"
            continue
        if header in ("Engelsk", "English"):
            lang, day = "en", "static"
            continue

        if lang and line.startswith(("-", "•", "*")):
            item = clean_item(line)
            if not item or item.lower() in ("ingen meny", "no menu"):
                continue
            if day == "static":
                static[lang].append(item)
            elif day:
                out[lang][day].append(item)

    # Statisk meny (Bakern): samme rett hele uken
    for lg in ("no", "en"):
        if static[lg]:
            for k in DAY_KEYS:
                out[lg][k] = list(static[lg])

    return out


# "Kantine M (10:30 - 13:00) - Bygg: M"  /  "... - Building: J/K"
DAILY_HEADER = re.compile(
    r"^(?P<name>.+?)\s*\((?P<hours>[^)]+)\)\s*-\s*(?:Bygg|Building):\s*(?P<building>.+)$"
)


def parse_daily(path: Path) -> dict:
    """
    Leser en dagfil med blokker:
        Kantine M (10:30 - 13:00) - Bygg: M
        - rett
        - rett
    Returnerer {place_id: {"hours":…, "building":…, "items":[…]}}.
    Ukjente navn beholdes under en slugifisert nøkkel, så ingenting går tapt.
    """
    result = {}
    if not path.is_file():
        return result

    current = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue

        low = line.lower()
        if low.startswith("dagens lunsj") or low.startswith("todays lunch") or low.startswith("today's lunch"):
            continue

        m = DAILY_HEADER.match(line)
        if m:
            name = m.group("name").strip()
            low_name = name.lower()
            if low_name in RETIRED_DAILY_NAMES:
                current = None   # nedlagt kantine i en gammel dagfil - hopp over
                continue
            pid = DAILY_NAME_TO_ID.get(low_name)
            if pid is None:
                pid = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
                print(f"  Advarsel: ukjent kantine '{name}' i {path.name} -> id '{pid}'")
            if pid in WEEKLY_ONLY:
                current = None
                continue
            current = pid
            result[pid] = {
                "label": name,
                "hours": m.group("hours").strip().replace(" - ", " – "),
                "building": m.group("building").strip(),
                "items": [],
            }
            continue

        if current and line.startswith(("-", "•", "*")):
            item = clean_item(line)
            if item and item.lower() not in ("ingen meny", "no menu"):
                result[current]["items"].append(item)

    return result


def file_updated(path: Path) -> str:
    """Sist endret på kildefila, så nettsiden kan vise 'sist oppdatert'."""
    try:
        return datetime.fromtimestamp(path.stat().st_mtime).astimezone().isoformat(timespec="seconds")
    except OSError:
        return ""


def read_overrides() -> dict:
    """Manuelle menyer satt fra /admin. Vinner over alt annet, og blir
    stående til noen fjerner dem der."""
    try:
        data = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for pid, entry in (data or {}).items():
        if pid not in PLACES:
            continue   # f.eks. 'street' fra før Eat The Street stengte
        items = [str(i).strip() for i in (entry or {}).get("items", []) if str(i).strip()]
        if items:
            out[pid] = {"items": items, "set": entry.get("set", "")}
    return out


def today_key():
    wd = datetime.today().weekday()
    return DAY_KEYS[wd] if wd <= 4 else None


def build(menu_dir: Path, daily_dir: Path) -> dict:
    places = {}
    for pid, meta in PLACES.items():
        src = menu_dir / meta["file"] if meta.get("file") else None
        weekly = parse_weekly(src) if src else parse_weekly(menu_dir / "__ingen__")
        places[pid] = {
            "name": meta["name"],
            "hours": meta["hours"],
            "building": meta["building"],
            "kind": meta["kind"],
            "week": weekly,
            "updated": file_updated(src) if src else "",
        }
        if meta.get("lunchHours"):
            places[pid]["lunchHours"] = meta["lunchHours"]

    # Dagfila gjelder bare den dagen den ble skrevet. En fil fra fredag skal
    # ikke vises som "dagens meny" mandag morgen før første skraping.
    daily_path = daily_dir / DAILY_FILES["no"]
    daily_fresh = daily_path.is_file() and \
        datetime.fromtimestamp(daily_path.stat().st_mtime).date() == datetime.now().date()
    daily = {
        lang: (parse_daily(daily_dir / fname) if daily_fresh else {})
        for lang, fname in DAILY_FILES.items()
    }
    if not daily_fresh:
        print("  Dagfila er ikke fra i dag - bruker bare ukesmenyene.")

    # Dagfilene har autoritative åpningstider/bygg - bruk dem når de finnes.
    # Unntak: steder med eget lunsjvindu (Bakern) beholder åpningstiden fra
    # PLACES, siden dagfila oppgir lunsjtidsrommet og ikke når stedet er åpent.
    for pid, block in daily.get("no", {}).items():
        if pid in places:
            if not places[pid].get("lunchHours"):
                places[pid]["hours"] = block["hours"]
            places[pid]["building"] = block["building"]

    return {
        "generated": datetime.now().astimezone().isoformat(timespec="seconds"),
        "today": today_key(),
        "places": places,
        # Overstyrer ukesmenyen for i dag når den finnes (dagens-skriptet)
        "todayOverride": daily,
        # Sist endret på dagsfila fra scrape-skriptet
        "dailyUpdated": file_updated(daily_dir / DAILY_FILES["no"]),
        # Manuelt skrevne menyer fra /admin - vinner over alt over
        "manual": read_overrides(),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=str(MENU_DIR), help="Mappe med ukesmenyer (.txt)")
    ap.add_argument("--daily-dir", default=str(DAILY_DIR), help="Mappe med dagsmenyer (menus_*.txt)")
    ap.add_argument("--out", default=str(OUT_FILE), help="Utfil")
    args = ap.parse_args()

    data = build(Path(args.dir), Path(args.daily_dir))
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, out)  # atomisk, så nettsiden aldri leser en halvskrevet fil
    print(f"Skrev {out}")
    filled = sum(1 for p in data["places"].values() if any(p["week"]["no"].values()))
    return f"{out.name}: {filled}/{len(data['places'])} steder med meny"


if __name__ == "__main__":
    runlog.run("build_menu_json.py", main)
