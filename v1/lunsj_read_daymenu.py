import os
import sys


def read_menu_file(filepath):
    """
    Leser innholdet fra en menyfil og returnerer det som en streng.
    """
    if not os.path.isfile(filepath):
        print(f"Feil: Finner ikke filen '{filepath}'")
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def main(langs=None, offset=None):
    """
    Leser menyfiler for gitt liste av språk (for eksempel ['no', 'en']).
    Offset-argumentet (tall) ignoreres i dag, men scriptet håndterer det uten feil.
    Hvis ingen språk gis, leses alle 'menus_*.txt' i 'outputs/'-mappen.
    """
    outputs_dir = "outputs"
    if langs:
        files = [os.path.join(outputs_dir, f"menus_{lang}.txt") for lang in langs]
    else:
        files = [os.path.join(outputs_dir, fname)
                 for fname in os.listdir(outputs_dir)
                 if fname.startswith("menus_") and fname.endswith(".txt")]

    for filepath in files:
        content = read_menu_file(filepath)
        if content is not None:
            print(content)


if __name__ == "__main__":
    # Hent argumenter
    args = sys.argv[1:]
    offset = None

    # Hvis første argument er et heltall, ta det som offset og fjern det
    if args:
        try:
            potential_offset = int(args[0])
            offset = potential_offset
            args = args[1:]
        except ValueError:
            pass

    # Resten av argumentene tolkes som språk
    langs = args if args else None
    main(langs=langs, offset=offset)
