"""
2023-02-23 Filip Gornitzka Abelson
Script to fetch menus from FBU canteen API and return JSON/dict with language[en/no]->menu for each canteen
#### Examples API endpoints and web pages (removed unnecessary bloat from links in Python script, not as you find them on web or below)
# Fresh 4 You
curl "https://snaroyveien30-gg.issfoodservices.no/api/articles/article/200147073/p200011994--c200029061/200004464/200005204"
https://snaroyveien30-gg.issfoodservices.no/articles/r200004464-selvbetjent-kantine--p200011994-kantine-1--c200029061-fresh-4-you/mandag--200147073
# Eat The Street Lunch
curl "https://snaroyveien30-gg.issfoodservices.no/api/articles/article/200132372/p200011994--c200028866/200004464/200005204"
https://snaroyveien30-gg.issfoodservices.no/articles/r200004464-selvbetjent-kantine--o200005204-kantine--p200011994-kantine-1--c200028866-eat-the-street-lunsj/fredag--200132372
# Flow
curl "https://snaroyveien30-gg.issfoodservices.no/api/articles/article/200132488/p200011994--c200028863/200004464/200005204"
https://snaroyveien30-gg.issfoodservices.no/articles/r200004464-selvbetjent-kantine--o200005204-kantine--p200011994-kantine-1--c200028863-flow/tirsdag--200132488
"""

import requests
from datetime import datetime, date


def get_menu(canteen: str, weekday: int | None = None) -> dict[str, list[str]]:
    """
    Returns dict with list of dishes (menu) for langs no/en as a tuple
    """

    # Scraped from URLs, ordered list from Monday to Friday
    canteen_ids = {
        "**Eat The Street**": [200131936, 200132048, 200132156, 200132264, 200132372],
        "**Flow**": [200131963, 200132488, 200132183, 200147040, 200132399],
        "**Fresh 4 You**": [200147073, 200132021, 200132129, 200132237, 200132345],
        "**_Eat The Street - Middag_**": [200131990, 200132102, 200132210, 200132318, 200132426]
    }

    if weekday is None:
        weekday = datetime.now().weekday()
    if weekday > 4:
        raise ValueError("No data for Saturday and Sunday. Choose weekday =< 4")

    # Get JSON data from API
    r = requests.get(
        f"https://snaroyveien30-gg.issfoodservices.no/api/articles/article/{canteen_ids[canteen][weekday]}/p200011994/200004464/200005204")
    data = r.json()

    # Divider (here using arbitrary length) between Norwegian and English menu
    divider = "-" * 10
    menus = data["article"]["description"].split(divider)
    weekdayy = data["article"]["name"].split(divider)

    # Clean menu text
    menu = {}
    for i, m in enumerate(menus):
        # Norwegian text above divider
        lang = "no" if i == 0 else "en"

        dishes = []
        for dish in m.split("\r\n"):
            dish = dish.strip("-").strip()

            # Skip non-menu items
            if dish == "" or "--" in dish or "ÅPENT" in dish:
                continue

            # Remove allergy information (all trailing after " AL"), and add extra strip just in case
            dish = dish.split(" AL")[0].strip()
            dishes.append(dish)

        menu[lang] = dishes

    return menu


def format_menu(canteen_menu: dict[str, list[str]], lang: str = 'no') -> str:
    """
    Formats menu as text, defaults to Norwegian
    """
    return "\n".join("* " + dish for dish in canteen_menu[lang])


if __name__ == "__main__":
    canteens = [
        "**Eat The Street**",
        "**Flow**",
        "**Fresh 4 You**",
        "**_Eat The Street - Middag_**"
    ]

    # Choose lang and format output text
    lang = 'no'
    header = "## Dagens lunsj -" if lang == "no" else "## Today's lunch -"

    today = datetime.today()
    weekday = datetime.now()
    weekday_name = weekday.strftime('%A')

    if lang == 'no':
        if weekday_name == "Monday":
            weekday_name = "Mandag"
        elif weekday_name == "Tuesday":
            weekday_name = "Tirsdag"
        elif weekday_name == "Wednesday":
            weekday_name = "Onsdag"
        elif weekday_name == "Thursday":
            weekday_name = "Torsdag"
        elif weekday_name == "Friday":
            weekday_name = "GOD FREDAG"
        elif weekday_name == "Sunday":
            weekday_name = "Søndag"

    # Printing today's menu for all canteens, as no weekday is set
    print(header, weekday_name + ",", today.strftime("%d.%m.%Y:"))
    for c in canteens:
        canteen_menu = get_menu(c)
        print(c)
        print(format_menu(canteen_menu), "\n")
