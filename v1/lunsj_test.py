import requests
import sys
from bs4 import BeautifulSoup
from datetime import datetime


def fetch_menu(url, language='no'):
    # Send a GET request
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f'Failed to retrieve the webpage {url}. Status code: {response.status_code}')
        return []

    # Parse the HTML
    soup = BeautifulSoup(response.content, 'html.parser')

    norwegian_menu = set()
    english_menu = set()

    # Find all menu holders
    menu_item_holders = soup.find_all('div', class_='menu-item-holder')

    for holder in menu_item_holders:
        # Determine if this is Norwegian or English menu
        if 'first-holder' in holder.get('class', []):
            current_menu = norwegian_menu
        elif 'second-holder' in holder.get('class', []):
            current_menu = english_menu
        else:
            continue

        # Extract menu items
        for menu_item in holder.find_all(['h2', 'div'], class_=lambda x: x and 'menu-item' in x):
            # Get text but exclude known allergen-related elements
            text = menu_item.get_text(strip=True)
            
            # Ignore empty or allergen-related lines
            if text and 'Allergener' not in text and 'open' not in text:
                current_menu.add(text)

    # Convert sets to lists and return based on language selection
    return list(norwegian_menu) if language == 'no' else list(english_menu)

# URLs of the websites for the four canteens
urls = {
    "Eat The Street": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=bbf807d7-b1ed-4493-8853-e40077f6adde&scaleToFit=true',
        "opening_hours": "10:30 - 14:00",
        "building": "J/K"
    },
    "Flow": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=4a0457f8-dbfa-4783-8ebe-b5ee0486843f&scaleToFit=true',
        "opening_hours": "10:30 - 13:00",
        "building": "B"
    },
    "Fresh 4 You": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=aa1358ee-d30e-4289-a630-892cd1210857&scaleToFit=true',
        "opening_hours": "10:30 - 13:00",
        "building": "C/D"
    },
    "Eat The Street - Middag": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=8469c383-d042-4d2d-8b18-30b6f9f90393&scaleToFit=true',
        "opening_hours": "15:00 - 17:00",
        "building": "J/K"
    }
}

# Choose the language of the menu to print ('no' for Norwegian or 'en' for English)
# day = int(sys.argv[1])
day = -1
# language = sys.argv[2]
language = "no"

if language == "en":
    bygg = "Building"
else:
    bygg = "Bygg"

# Get the current day of the week (0: Monday, 1: Tuesday, ..., 6: Sunday)
current_day = datetime.today().weekday()

# Check if today is Saturday (5) or Sunday (6)
if current_day in (5, 6):
    if language == "en":
        print("No menues for saturday or sunday. Come back on monday or select day.")
    else:
        print("Ingen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
else:
    # Initialize a dictionary to hold menus for each canteen
    canteen_menus = {canteen: [] for canteen in urls}

    # Fetch and store menus for all canteens
    for canteen, info in urls.items():
        menu = fetch_menu(info["url"], language)
        canteen_menus[canteen] = menu

    if language == "en":
        print("Today's lunch:")
    else:
        print("Dagens lunsj:")

    # Print the menus for each canteen along with additional information
    for canteen, menu in canteen_menus.items():
        opening_hours = urls[canteen]['opening_hours']
        building = urls[canteen]['building']
        print(f"\n{canteen} ({opening_hours}) - {bygg}: {building}")
        for item in menu:
            print("-", item)
