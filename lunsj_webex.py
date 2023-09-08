import random
import sys
import requests
from datetime import datetime, date, timedelta

def get_menu(canteen: str, weekday: int | None = None) -> dict[str, list[str]]:
    """
    Returns dict with list of dishes (menu) for langs no/en as a tuple
    """

    # Scraped from URLs, ordered list from Monday to Friday
    canteen_ids = {
        "**Eat The Street**": [200131936, 200132048, 200132156, 200132264, 200132372],
        "**Flow**": [200131963, 200132488, 200132183, 200147040, 200132399],
        "**Fresh 4 You**": [200147073, 200132021, 200132129, 200132237, 200132345],
        "**_Middag - Eat The Street_**": [200131990, 200132102, 200132210, 200132318, 200132426]
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

    # Divider (here using arbitrary length) between Norwegian and English menu
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
            if dish == "" or "--" in dish or "ÅPENT" in dish or "...." in dish or "Åpning" in dish:
                continue

            # Remove allergy information (all trailing after " AL"), and add extra strip just in case
            dish = dish.split(" (")[0].strip().split(" AL")[0].strip().split(" Al")[0].strip()
            if canteen == "**_Middag - Eat The Street_**":
                dishes.append("_" + dish + "_")
            else:
                dishes.append(dish)

        menu[lang] = dishes

    return menu, weekdayyy

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
        "**_Middag - Eat The Street_**"
    ]

    emojies = [
        "\U0001f354", "\U0001f356", "\U0001f969", "\U0001f953", "\U0001f96A", "\U0001f32E", "\U0001f959",
        "\U0001f9C6", "\U0001f958", "\U0001f957", "\U0001f980", "\U0001f967", "\U0001f364", "\U0001f35C",
        "\U0001f372", "\U0001f32F", "\U0001f355", "\U0001f357"
    ]

    lang = 'no'
    today = datetime.today()
    weekday = datetime.now()
    weekday_name = weekday.strftime('%A')

    dag = int(sys.argv[1])

    if dag is None:
        print("Du må gi meg noe å søke på!")

    try:
        meny, ukedag = get_menu(canteens[0], dag)
    except:
        ukedag = weekday_name

    if dag > 4:
        print("\nIngen meny på lørdag og søndag. Kom tilbake på mandag :)")
    else:
        if dag == -1:
            print("## [Dagens lunsj -", ukedag + " " + today.strftime("%d.%m.%Y:") + "](https://lunsj.regrettable.solutions/)")
        else:
            print("## Lunsjmeny - " + ukedag + " \U0001f37D :")
            print("### OBS! Nye åpningstider!")
        for c in canteens:
            y, v = get_menu(c, dag)
            canteen_menu = y
            emoji_choice = random.choice(range(0, len(emojies)))
            if c == "**_Middag - Eat The Street_**":
                print(c + " " + emojies[emoji_choice] + " (15:00 - 17:00)")
                print(format_menu(canteen_menu), "\n")
            if c == "**Flow**":
                print(c + " " + emojies[emoji_choice] + " (10:30 - 13:00)")
                print(format_menu(canteen_menu), "\n")
            if c == "**Eat The Street**":
                print(c + " " + emojies[emoji_choice] + " (10:30 - 14:00)")
                print(format_menu(canteen_menu), "\n")
            if c == "**Fresh 4 You**":
                print(c + " " + emojies[emoji_choice] + " (10:30 - 13:00)")
                print(format_menu(canteen_menu), "\n")
    print("[Hele ukas lunsjmeny finner du på denne linken](https://lunsj.regrettable.solutions/) \U0001f600")
