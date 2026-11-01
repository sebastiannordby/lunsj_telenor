"""
Felles kjørelogg for skriptene, så /admin kan vise når hvert skript sist
kjørte og om det gikk bra - uansett om det ble startet av cron eller admin.

Bruk i et skript:
    import runlog
    if __name__ == "__main__":
        runlog.run("scrape_dagens_menu.py", main)

main() kan returnere en kort oppsummering ("Kantine M: 3 retter, ..."),
eller (ok, oppsummering) for å logge et delvis feilet løp uten å endre exit-koden.
Et unntak eller sys.exit("melding") logges som feil, og kastes videre
uendret, så cron og admin ser samme exit-kode som før.

Loggen ligger i runs.json (nyeste først, maks 200 linjer). Node-serveren
setter LUNSJ_TRIGGER=admin når den kjører skriptene, ellers står det "cron".
"""
import json
import os
import traceback
from datetime import datetime
from pathlib import Path

LOG = Path(__file__).resolve().parent / "runs.json"
MAX_ENTRIES = 200


def record(script: str, ok: bool, summary: str = "") -> None:
    try:
        data = json.loads(LOG.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        data = {}
    entry = {
        "script": script,
        "at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "ok": ok,
        "summary": (summary or "").strip()[-600:],
        "trigger": os.environ.get("LUNSJ_TRIGGER", "cron"),
    }
    data["history"] = ([entry] + list(data.get("history", [])))[:MAX_ENTRIES]
    tmp = LOG.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, LOG)
    except OSError:
        pass   # loggen skal aldri velte selve skriptet


def run(script: str, main) -> None:
    try:
        summary = main()
    except SystemExit as e:
        ok = e.code in (0, None)
        record(script, ok, "" if ok else str(e.code))
        raise
    except Exception:
        record(script, False, traceback.format_exc())
        raise
    if isinstance(summary, tuple):
        record(script, bool(summary[0]), str(summary[1]))
    else:
        record(script, True, summary if isinstance(summary, str) else "")
