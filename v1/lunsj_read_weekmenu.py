#!/usr/bin/env python3
"""
Leser menyer fra flere tekstfiler i Menyer-mappa og returnerer menyen for valgt dag og språk.
Filene leses alltid i forhåndsdefinert rekkefølge hvis de ligger i Menyer/.
"""
import argparse
import sys
import os
from datetime import datetime

def parse_args():
    parser = argparse.ArgumentParser(
        description="Aggregate menus for selected day and language from text files."
    )
    parser.add_argument(
        'day', type=int,
        help='Day index: -1 for today, 0-4 for Monday-Friday'
    )
    parser.add_argument(
        'language', choices=['no', 'en'],
        help='Language code: no or en'
    )
    parser.add_argument(
        'files', nargs='*',
        help='Optional: Specific menu text files. If omitted, all .txt in Menyer/ directory are used.'
    )
    return parser.parse_args()


def get_day_name(day_idx, language):
    nor = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag']
    en = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    if day_idx < 0:
        today = datetime.today()
        wd = today.weekday()
        if wd > 4:
            raise ValueError("I dag er det helg – ingen lunsjmeny tilgjengelig.")
        day_idx = wd

    if not (0 <= day_idx <= 4):
        raise ValueError("Day index must be -1 (today) or between 0 (Monday) and 4 (Friday)")

    return nor[day_idx] if language == 'no' else en[day_idx]


def extract_menu(filepath, day_name):
    meals = []
    found = False

    with open(filepath, encoding='utf-8') as f:
        for line in f:
            if not found:
                if line.strip() == day_name:
                    found = True
                continue
            stripped = line.strip()
            if stripped == '':
                break
            if stripped.startswith('-'):
                meals.append(stripped)

    return meals


def main():
    args = parse_args()

    try:
        day_name = get_day_name(args.day, args.language)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Bestem hvilke filer som skal leses
    if args.files:
        filepaths = args.files
    else:
        script_dir = os.path.dirname(os.path.realpath(__file__))
        menu_dir = os.path.join(script_dir, 'Menyer')
        if not os.path.isdir(menu_dir):
            print(f"Feil: Mappen '{menu_dir}' finnes ikke.", file=sys.stderr)
            sys.exit(1)
        # Les alle txt-filer
        filepaths = [os.path.join(menu_dir, fname)
                     for fname in os.listdir(menu_dir)
                     if fname.lower().endswith('.txt')]
        # Sørg for spesifikk rekkefølge
        desired_order = [
            'eat_the_street.txt',
            'flow.txt',
            'fresh_4_you.txt',
            'eat_the_street_-_middag.txt'
        ]
        ordered = []
        for name in desired_order:
            for path in filepaths:
                if os.path.basename(path).lower() == name:
                    ordered.append(path)
        # Legg til eventuelle øvrige filer etter
        others = [p for p in filepaths if os.path.basename(p).lower() not in desired_order]
        filepaths = ordered + sorted(others)

    if not filepaths:
        print("Feil: Ingen menylister funnet.", file=sys.stderr)
        sys.exit(1)

    # Skriv ut meny for hver fil i rekkefølge
    print(f"{day_name}:")
    for filepath in filepaths:
        if not os.path.isfile(filepath):
            print(f"Feil: Finner ikke filen '{filepath}'", file=sys.stderr)
            continue

        canteen = os.path.splitext(os.path.basename(filepath))[0].replace('_', ' ').capitalize()
        menu = extract_menu(filepath, day_name)

        print(f"\n{canteen}")
        if menu:
            for item in menu:
                print(item)
        else:
            print("Ingen meny funnet.")

if __name__ == '__main__':
    main()
