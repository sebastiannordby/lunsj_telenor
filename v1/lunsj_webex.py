import os
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

    for menu in non_middag_menus:
        print(f"**{menu[0]}** 🍽️ (10:30 - 13:00)\n")
        print(menu[1])

    for menu in middag_menus:
        print(f"**_{menu[0]}_** 🍴 (15:00 - 17:00)\n")
        print(menu[1])

if __name__ == "__main__":
    dag = int(sys.argv[1])
    print_menu_for_day(dag)
