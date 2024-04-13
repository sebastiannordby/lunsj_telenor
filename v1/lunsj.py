import openpyxl
import sys
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
    if day == -2:
        print("Dette er en mer oversiktlig versjon av NPRO sin Lunsjmeny. Menyen fås direkte fra NPRO gjennom et Google Spreadsheet.")
        print("Nettsiden er utviklet og satt opp av Marius Bråthen og Sebastian Nordby. Scriptet som brukes til å hente menyen er utviklet av Marius.")
        print("Takk til Mats Danielsen som hoster serveren og domenet.")
        return

    # Map language to column index
    language_column_mapping = {
        'no': 'A',
        'en': 'B'
    }

    # Map day index to weekday name
    weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    weekdays_english = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    weekday = weekdays_norwegian[day] if language == 'no' else weekdays_english[day]

    # Load the workbook
    wb = openpyxl.load_workbook(filename)

    # Print the weekday
    if day == -1:
        today = datetime.today()
        print("Dagens lunsj ---", weekday + " " + today.strftime("%d.%m.%Y:") + "\n")
    else:
        print(f"{weekday}:")

    for sheet_name in ["Eat The Street", "Flow", "Fresh 4 You", "Eat The Street - Middag"]:
        sheet = wb[sheet_name]

        # Read canteen details
        canteen_name = sheet['A2'].value
        opening_hours = sheet['B3'].value
        building = sheet['B2'].value

        # Print canteen details
        print(f"{canteen_name}: ({opening_hours}) - Bygg: {building}")

        # Read and print menu for the specified day and language
        start_row = day_row_mapping[day]
        end_row = start_row + 4  # There are 5 menu items for each day
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
