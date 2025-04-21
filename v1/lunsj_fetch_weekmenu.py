import requests
from bs4 import BeautifulSoup
import re
import sys
from datetime import datetime
import openai

# OpenAI API-nøkkel (sett inn din egen nøkkel her)
key_file_path = "/home/marius/git/key.txt"

with open(key_file_path, "r") as file:
    OPENAI_API_KEY = file.read().strip()


def fetch_html(url):
    """
    Henter HTML fra kantine-nettsiden.
    """
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Sjekk for HTTP-feil
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def send_to_chatgpt(weekday, html_content):
    """
    Sender HTML til ChatGPT og ber om en strukturert meny på både norsk og engelsk.
    """
    prompt = f"""
    Her er HTML-en fra en kantine-meny. Ekstraher hele menyen for kantinen både norsk og engelsk. 
    Fjern tall, sett måltider på egne linjer. Thuesday = Tuesday.
    sett inn en passende emoji bak hver matrett, returner KUN menyen i følgende format:

    Ukedag
    - [Matrett 1]
    - [Matrett 2]
    - [Matrett 3]
    - [Matrett 4]

    Weekday
    - [Meal 1]
    - [Meal 2]
    - [Meal 3]
    - [Meal 4]

    HTML:
    {html_content}
    """

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "system", "content": "Du er en assistent som ekstraherer menydata fra HTML, og returner menyen på norsk og engelsk"},
                     {"role": "user", "content": prompt}],
        "temperature": 0.5
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print(f"Error from OpenAI API: {response.text}")
        return None


def save_menu_to_file(canteen, menu):
    """
    Lagre menyen til en .txt-fil per kantine med både norsk og engelsk versjon i samme fil.
    """
    filename = f"{canteen.replace(' ', '_').lower()}.txt"
    filepath = f"/home/marius/git/lunsj_telenor/v1/Menyer/{filename}"

    with open(filepath, "w", encoding="utf-8") as file:
        file.write(menu + "\n\n")
    print(f"Meny lagret i: {filename}")


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

day = 0  # Eksempel: Mandag
weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
weekdays_english = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
weekday = weekdays_norwegian[day] if day < 7 else "Unknown"

for canteen, info in urls.items():
    html_content = fetch_html(info["url"])
    if html_content:
        menu = send_to_chatgpt(weekday, html_content)
        if menu:
            print(f"\n{canteen} ({info['opening_hours']}) - Bygg: {info['building']}")
            print(menu)
            save_menu_to_file(canteen, menu)
        else:
            print(f"Kunne ikke ekstrahere meny for {canteen}.")
    else:
        print(f"Kunne ikke hente HTML for {canteen}.")
