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
        print("Dagens lunsj ---", ukedag + " " + today.strftime("%d.%m.%Y:"))
    elif day == -2:
        print("Dette er en mer oversiktlig versjon av NPRO sin Lunsjmeny.\n")
        print("Menyen hentes direkte fra NPRO sin side og speiler innholdet på den siden.\n")
        print("Link til NPRO sin side:")
        print("https://snaroyveien30-gg.issfoodservices.no/articles/r200004464-selvbetjent-kantine--o200005204")
        print("\nNettsiden er utviklet og satt opp av Marius Bråthen og Sebastian Nordby. Scriptet som brukes til å hente menyen er utviklet med hjelp fra Filip Gornitzka Abelson.\n")
        print("Takk til Mats Danielsen som hoster serveren og domenet.")
        return
    elif day == 5 or day == 6:
        print("Ingen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
        return

    if not (0 <= day <= 4):
        print("Ugyldig dag. Vennligst velg en dag fra mandag til fredag.")
        return

    weekday = weekdays[day]

    for filename in os.listdir("Menyer/"):
        if filename.startswith(weekday):
            canteen_name = filename.split(" - ", 1)[1][:-4]  # Henter kantinens navn fra filnavnet
            with open(os.path.join("Menyer/", filename), "r") as file:
                menu_content = file.readlines()[1:]  # Fjerner den første linjen
                menu_content = "".join(menu_content)
                if "Middag" in filename:
                    middag_menus.append((canteen_name, menu_content))
                else:
                    non_middag_menus.append((canteen_name, menu_content))

    for menu in non_middag_menus:
        print(f"\n{menu[0]}: (10:30 - 13:00)")
        print(menu[1])

    for menu in middag_menus:
        print(f"\n{menu[0]} (15:00 - 17:00):")
        print(menu[1])

if __name__ == "__main__":
    dag = int(sys.argv[1])
    print_menu_for_day(dag)
