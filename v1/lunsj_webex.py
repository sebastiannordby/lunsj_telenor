import os
import random
from datetime import datetime
import sys

def print_menu_for_day(day: int):
    weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag']
    non_middag_menus = []
    middag_menus = []

    if day == -1:
        today = datetime.today()
        day = today.weekday()
        ukedag = weekdays[day]
        print("## Dagens lunsj -", ukedag + " " + today.strftime("%d.%m.%Y:") + "\n")

    weekday = weekdays[day]

    for filename in os.listdir("Menyer/"):
        if filename.startswith(weekday):
            canteen_name = filename.split(" - ", 1)[1][:-4]  # Henter kantinens navn fra filnavnet
            with open(os.path.join("Menyer/", filename), "r") as file:
                menu_content = file.readlines()[1:]  # Fjerner den første linjen
                menu_content = "".join(line for line in menu_content if line.strip())  # Fjerner tomme linjer
                if "Middag" in filename:
                    middag_menus.append((canteen_name, menu_content))
                else:
                    non_middag_menus.append((canteen_name, menu_content))
    emojies = [
        "\U0001f354", "\U0001f356", "\U0001f969", "\U0001f953", "\U0001f96A", "\U0001f32E", "\U0001f959",
        "\U0001f9C6", "\U0001f958", "\U0001f957", "\U0001f980", "\U0001f967", "\U0001f364", "\U0001f35C",
        "\U0001f372", "\U0001f32F", "\U0001f355", "\U0001f357"
    ]

    
    for menu in non_middag_menus:
        emoji_choice = random.choice(range(0, len(emojies)))
        print(f"**{menu[0]}** + emojies[emoji_choice] + (10:30 - 13:00)\n")
        print(menu[1])

    for menu in middag_menus:
        emoji_choice = random.choice(range(0, len(emojies)))
        print(f"**_{menu[0]}_** + emojies[emoji_choice] + (15:00 - 17:00)\n")
        print(menu[1])

if __name__ == "__main__":
    dag = int(sys.argv[1])
    print_menu_for_day(dag)
