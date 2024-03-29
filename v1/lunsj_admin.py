import sys
import requests
from datetime import datetime, date, timedelta


def get_menu(canteen: str, weekday: int | None = None) -> dict[str, list[str]]:
    """
    Returns dict with list of dishes (menu) for langs no/en as a tuple
    """

    # Scraped from URLs, ordered list from Monday to Friday
    canteen_ids = {
        "Eat The Street": [200131936, 200132048, 200132156, 200132264, 200132372],
        "Flow": [200131963, 200132488, 200132183, 200147040, 200132399],
        "Fresh 4 You": [200147073, 200132021, 200132129, 200132237, 200132345],
        "Middag - Eat The Street": [200131990, 200132102, 200132210, 200132318, 200132426]
    }

    if weekday == -1:
        weekday = datetime.now().weekday()
    if weekday > 4:
        raise ValueError("No data for Saturday and Sunday. Choose weekday =< 4")
    if weekday < -1:
        raise ValueError("Choose weekday -1 =< 4")

    # Get JSON data from API
    r = requests.get(
        f"https://snaroyveien30-gg.issfoodservices.no/api/articles/article/{canteen_ids[canteen][weekday]}/p200011994/200004464/200005204")
    data = r.json()

    dividerLine = "-" * 10
    dividerDot = "." * 10
    menus_with_divider1 = data["article"]["description"].split(dividerLine)
    menus_with_divider2 = [menu.split(dividerDot) for menu in menus_with_divider1]

    # Flatten the list of menus (which are now lists themselves)
    menus = [dish for sublist in menus_with_divider2 for dish in sublist]

    weekdayy = data["article"]["name"].split(dividerLine)
    weekdayyy = weekdayy[0].strip(" ")

    # Clean menu text
    menu = {}
    for i, m in enumerate(menus):
        # Norwegian text above divider
        lang = "no" if i == 0 else "en"

        dishes = []
        for dish in m.split("\r\n"):
            dish = dish.strip("-").strip()

            # Skip non-menu items
            if dish == "" or "--" in dish or "ÅPENT" in dish or "........" in dish or "Åpning" in dish or "Åpent" in dish or "We are" in dish or "OPEN" in dish:
                continue

            # Remove allergy information (all trailing after " AL"), and add extra strip just in case
            dish = dish.split(" (")[0].strip().split(" AL")[0].strip().split(" Al")[0].strip()
            dishes.append(dish)

        menu[lang] = dishes

    return menu, weekdayyy


def format_menu(canteen_menu: dict[str, list[str]], lang: str = 'no') -> str:
    """
    Formats menu as text, defaults to Norwegian
    """
    return "\n".join("- " + dish for dish in canteen_menu[lang])


if __name__ == "__main__":

    canteens = [
        "Eat The Street",
        "Flow",
        "Fresh 4 You",
        "Middag - Eat The Street"
    ]

    lang = 'no'
    today = datetime.today()
    weekday = datetime.now()
    ddmmttmm = weekday.strftime("%d.%m.%y kl: %H:%M")
    weekday_name = weekday.strftime('%A')

    # dag = int(sys.argv[1])
    dag = -1
    
    try:
        meny, ukedag = get_menu(canteens[0], dag)
    except:
        ukedag = weekday_name

    if -1 <= dag <= 4:
        if dag == -1 and today.weekday() > 4:
            print("Dagens lunsj:\n\nIngen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
        elif dag == -1:
            print("Sjekker og oppdaterer dagens lunsjmeny: \n")
        for c in canteens:
            y, v = get_menu(c, dag)
            canteen_menu = y
            fil = open(r"Menyer/" + ukedag + " - " + c + ".txt", "r")
            innhold = fil.read()
            if format_menu(canteen_menu) in innhold:
                print(c + " - Meny er korrekt.", innhold.split("\n")[0])
            else:
                fil = open(r"Menyer/" + ukedag + " - " + c + ".txt", "w")
                fil.write("Sist oppdatert: " + ddmmttmm + "\n")
                fil.write(format_menu(canteen_menu))
                fil.close()
                print(c + " - Feil meny. Tekstfil oppdatert")
