import openpyxl
import sys
import random
from datetime import datetime, date, timedelta

def read_menu(filename, day, language):
    # Map day index to row index
    day_row_mapping = {
        0: 6,
        1: 12,
        2: 18,
        3: 24,
        4: 30
    }

    if day == -1:
        ukedag = datetime.now().weekday()
        day
        if day == -1 and ukedag > 4:
            print("Ingen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
            return

    # Map language to column index
    language_column_mapping = {
        'no': 'A',
        'en': 'B'
    }

    emojies = [
        "\U0001f354", "\U0001f356", "\U0001f969", "\U0001f953", "\U0001f96A", "\U0001f32E", "\U0001f959",
        "\U0001f9C6", "\U0001f958", "\U0001f957", "\U0001f980", "\U0001f967", "\U0001f364", "\U0001f35C",
        "\U0001f372", "\U0001f32F", "\U0001f355", "\U0001f357"
    ]

    # Map day index to weekday name
    weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    weekdays_english = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    weekday = weekdays_norwegian[day] if language == 'no' else weekdays_english[day]

    # Load the workbook
    wb = openpyxl.load_workbook(filename)

    # Print the weekday
    today = datetime.today()
    print("## Dagens lunsj ---", weekday + " " + today.strftime("%d.%m.%Y:") + "\n")

    for sheet_name in ["Eat The Street", "Flow", "Fresh 4 You", "Eat The Street - Middag"]:
        sheet = wb[sheet_name]

        # Read canteen details
        canteen_name = sheet['A2'].value
        opening_hours = sheet['B3'].value
        emoji_selection = random.choice(range(0, len(emojies)))
        emoji = emojies[emoji_selection]

        # Print canteen details
        print(f"**{canteen_name}** {emoji} ({opening_hours}):")

        # Read and print menu for the specified day and language
        start_row = day_row_mapping[day]
        end_row = start_row + 5  # There are 5 menu items for each day
        for row in range(start_row, end_row):
            cell = f"{language_column_mapping[language]}{row}"
            menu_item = sheet[cell].value
            if menu_item is not None:
                print(f"- {menu_item}")

        print()


filename = "Lunsj_Fornebu.xlsx"
day = int(sys.argv[1])
language = sys.argv[2]

read_menu(filename, day, language)
