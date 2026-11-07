"""Tester for menyskraperne.

Kjør fra v1-mappen:
    .venv/bin/python -m unittest discover -s tests -v

Fixturene i tests/fixtures er ekte sider fra inisign (lagret fra raw_html/)
pluss noen små, håndlagde sider for spesialtilfeller. expected.json er fasiten
for hva parserne skal gi. Endrer du parserne med vilje, oppdater fasiten med:
    .venv/bin/python tests/test_scrapers.py --update

Kommer det en ny side som parserne bommer på: legg HTML-en fra raw_html/ (eller
«Rå HTML» i admin) i tests/fixtures, kjør --update og se over diffen.
"""
import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import scrape_dagens_menu as dagens  # noqa: E402
import scrape_ukens_menu as ukens  # noqa: E402

FIX = Path(__file__).resolve().parent / "fixtures"
EXPECTED = FIX / "expected.json"

DAGENS = ["kantine_m_dagens", "fresh_4_you_dagens", "cafe_m_dagens"]
UKENS = ["kantine_m_ukens", "fresh_4_you_ukens", "cafe_m_ukens_tom"]


def norm(obj):
    """Tupler -> lister og tallnøkler -> tekst, så resultatet kan sammenlignes med JSON."""
    return json.loads(json.dumps(obj, ensure_ascii=False))


def parse(name):
    html = (FIX / f"{name}.html").read_text(encoding="utf-8")
    return norm(dagens.parse_dagens(html) if name.endswith("_dagens") else ukens.parse_week(html))


# Tegn på at noe har gått galt: tall først, allergentabellen, ukedager som rett
BAD_DISH = re.compile(r"^\d|allergen|^(mandag|tirsdag|onsdag|torsdag|fredag|monday|tuesday|wednesday|thursday|friday)$", re.I)
GLUED_CODES = re.compile(r"\d,\d")


class TestKodesplitting(unittest.TestCase):
    CASES = [
        ("Kylling (1,3)", "Kylling", [1, 3]),
        ("Pizza mozzarella4", "Pizza mozzarella", [4]),
        ("Grønnsaksuppe 3,4", "Grønnsaksuppe", [3, 4]),
        ("Stenbitkaker med eggesmør, råkost og 2,4potet", "Stenbitkaker med eggesmør, råkost og potet", [2, 4]),
        ("2 egg og bacon 1,3", "2 egg og bacon", [1, 3]),
        ("Pris 12,50kr", "Pris 12,50kr", []),
        ("Bolle 15", "Bolle 15", []),  # 15 er ikke en allergenkode
        ("Asian vegetable soup (79,11)", "Asian vegetable soup", [7, 9, 11]),  # manglende komma
    ]

    def test_begge_skraperne(self):
        for mod in (dagens, ukens):
            for text, name, codes in self.CASES:
                with self.subTest(mod=mod.__name__, text=text):
                    self.assertEqual(mod.split_trailing_codes(text), (name, codes))


class TestDagensMeny(unittest.TestCase):
    def test_som_fasit(self):
        exp = json.loads(EXPECTED.read_text(encoding="utf-8"))
        for name in DAGENS:
            with self.subTest(name=name):
                self.assertEqual(parse(name), exp[name])

    def test_fornuftige_retter(self):
        for name in DAGENS:
            r = parse(name)
            with self.subTest(name=name):
                self.assertTrue(r["no"], "ingen norske retter")
                self.assertEqual(len(r["no"]), len(r["en"]), "ulikt antall norske og engelske retter")
                for dish, codes in r["no"] + r["en"]:
                    self.assertFalse(BAD_DISH.search(dish), f"rar rett: {dish!r}")
                    self.assertFalse(GLUED_CODES.search(dish), f"allergenkoder i teksten: {dish!r}")
                    self.assertTrue(all(1 <= c <= 14 for c in codes), f"ugyldige koder: {codes}")


class TestUkensMeny(unittest.TestCase):
    def test_som_fasit(self):
        exp = json.loads(EXPECTED.read_text(encoding="utf-8"))
        for name in UKENS:
            with self.subTest(name=name):
                self.assertEqual(parse(name), exp[name])

    def test_fem_dager_med_retter(self):
        for name in ("kantine_m_ukens", "fresh_4_you_ukens"):
            r = parse(name)
            with self.subTest(name=name):
                for lang in ("no", "en"):
                    days = [d for d in r[lang] if r[lang][d]]
                    self.assertEqual(len(days), 5, f"{lang}: forventet retter alle fem dager")
                    for dish in sum(r[lang].values(), []):
                        self.assertFalse(BAD_DISH.search(dish), f"rar rett: {dish!r}")
                        self.assertFalse(GLUED_CODES.search(dish), f"allergenkoder i teksten: {dish!r}")

    def test_tom_ukesmeny_gir_ingen_retter(self):
        # Cafe M legger ut en tom ukesmeny - den skal ikke bli til «retter»
        r = parse("cafe_m_ukens_tom")
        self.assertEqual(sum(len(v) for v in r["no"].values()), 0)


def update_expected():
    exp = {name: parse(name) for name in DAGENS + UKENS}
    EXPECTED.write_text(json.dumps(exp, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Oppdaterte {EXPECTED}")


if __name__ == "__main__":
    if "--update" in sys.argv:
        update_expected()
    else:
        unittest.main()
