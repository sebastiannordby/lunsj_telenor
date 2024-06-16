import requests
import sys
from bs4 import BeautifulSoup
from datetime import datetime

def fetch_menu(url, language='no'):
    # Send a GET request to the website
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find all elements with the class 'menu-item-holder'
        menu_item_holders = soup.find_all(class_='menu-item-holder')

        # Create separate lists for Norwegian and English menus
        norwegian_menu = []
        english_menu = []

        # Iterate over each menu-item-holder element
        for holder in menu_item_holders:
            menu_items = holder.find_all(class_='menu-item')
            for item in menu_items:
                # Remove all 'menu-item-allergens' elements from the item
                for allergen in item.find_all(class_='menu-item-allergens'):
                    allergen.decompose()

                # Get the text content of the modified item
                item_text = item.get_text(strip=True)

                # Skip empty or blank items
                if item_text:
                    # Append to the appropriate menu list
                    if 'second-holder' in holder['class']:
                        english_menu.append(item_text)
                    else:
                        norwegian_menu.append(item_text)

        # Return the desired menu based on the language parameter
        if language == 'no':
            return norwegian_menu
        else:
            return english_menu
    else:
        print(f'Failed to retrieve the webpage {url}. Status code: {response.status_code}')
        return []

# URLs of the websites for the four canteens
urls = {
    "Eat The Street": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=59db31f7-6775-43a1-a4bb-76a2bfb197ac&scaleToFit=true',
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
day = int(sys.argv[1])
language = sys.argv[2]

if language == "en":
    bygg = "Building"
else:
    bygg = "Bygg"

# Get the current day of the week (0: Monday, 1: Tuesday, ..., 6: Sunday)
current_day = datetime.today().weekday()

# Check if today is Saturday (5) or Sunday (6)
if current_day not in (5, 6):
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
