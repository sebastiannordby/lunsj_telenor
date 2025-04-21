import requests
from bs4 import BeautifulSoup
import re
import sys
from datetime import datetime


def fetch_menu(url, language, day):
    # Define weekdays
    weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    weekdays_english = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    # Determine the correct day name
    if day == -1:
        # Use today's day of the week
        current_day = datetime.today().weekday()
    else:
        current_day = day

    if language == 'no':
        day_name = weekdays_norwegian[current_day]
        lang_class = 'left-item'
    else:
        day_name = weekdays_english[current_day]
        lang_class = 'right-item'

    # Send a GET request to the website
    response = requests.get(url)
    if response.status_code != 200:
        print(f'Failed to retrieve the webpage {url}. Status code: {response.status_code}')
        return []

    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the relevant day in the HTML
    day_menu = []
    menu_sections = soup.find_all('div', class_=lang_class)

    for section in menu_sections:
        day_name_in_html = section.find('h1').get_text(strip=True)
        if day_name_in_html == day_name:
            # Find all divs containing menu items
            menu_items_divs = section.find_all('div', class_='col-12 menu-container')

            # Combine all text into one single string
            combined_text = " ".join(div.get_text(strip=True) for div in menu_items_divs)

            # Split text into items by looking for patterns
            split_items = re.split(r'\s*\d+(?:,\d+)*\s*(?:<br/>|<br/>)?\s*', combined_text)

            # Process each item
            for item in split_items:
                # Remove trailing numbers and unwanted text like "AL"
                cleaned_item = re.sub(r'\s*\d+(?:,\d+)*\s*$', '', item).strip()

                # Skip empty items and those containing "AL"
                if cleaned_item and 'AL' not in cleaned_item:
                    day_menu.append(cleaned_item)
            break

    return day_menu


# Example usage
urls = {
    "Eat The Street": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=6e5cc038-e918-4f97-9a59-d2afa0456abf&scaleToFit=true',
        "opening_hours": "10:30 - 14:00",
        "building": "J/K"
    },
    "Flow": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=756a5aa2-a95f-4d15-ad5a-59829741075b&scaleToFit=true',
        "opening_hours": "10:30 - 13:00",
        "building": "B"
    },
    "Fresh 4 You": {
        "url": 'https://widget.inisign.com/Widget/Customers/Customer.aspx?token=a8923cdb-9d92-46bc-b6a4-d026c2cf9a89&scaleToFit=true',
        "opening_hours": "10:30 - 13:00",
        "building": "C/D"
    },
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=9b060d7e-6658-4d96-b953-23079d7df3b2&scaleToFit=true",
        "opening_hours": "15:00 - 17:00",
        "building": "J/K"
    }
}

# Example for different days
# day_input = -1  # Use -1 for today's date, or use numbers 0-6 for Monday to Sunday
# language = 'no'  # Change to 'en' for English

day = int(sys.argv[1])
# day = -1
language = sys.argv[2]

weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
weekdays_english = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

current_day = datetime.today().weekday()

weekday = weekdays_norwegian[day] if language == 'no' else weekdays_english[day]

# Print the weekday
if day == -1 and language == "no":
    weekday = weekdays_norwegian[current_day]
    print(weekday)
elif day == -1 and language == "en":
    weekday = weekdays_english[current_day]
    print(weekday)
else:
    print(weekday)

# Get the menu for the specified day
for canteen, info in urls.items():
    menu = fetch_menu(info["url"], language, day)
    print(f"\n{canteen} ({info['opening_hours']}) - Bygg: {info['building']}")
    for item in menu:
        print(f"- {item}")
