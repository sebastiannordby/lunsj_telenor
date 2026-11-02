"""
Lagrer allergen-numrene (1-14) som scraperne finner, så nettsiden kan vise
allergener på riktig språk for alle dager - ikke bare dagens meny.

    Menyer/allergener.json   ukesmenyene, nøklet på filnavn:
        {"kantine_m.txt": {"no": {"0": [["Rett", [1, 3]], ...], ...}, "en": {...}},
         "bakern.txt":    {"static": {"no": [["Rett", [3, 10]]], "en": [...]}}}

    outputs/allergener.json  dagsmenyene, nøklet på kantinenavn:
        {"Kantine M": {"no": [["Rett", [1, 3]]], "en": [...]}}

Hvert skript oppdaterer bare sine egne nøkler, så de ikke overskriver hverandre.
"""
import json
import os
from pathlib import Path


def update(path: Path, entries: dict) -> None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        data = {}
    data.update(entries)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    os.replace(tmp, path)
