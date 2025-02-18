import requests
import sys
from datetime import datetime
import openai  # Husk å installere med: pip install openai

# OpenAI API-nøkkel (sett inn din egen nøkkel her)
key_file_path = "/git/key.txt"

with open(key_file_path, "r") as file:
    OPENAI_API_KEY = file.read().strip()

# URLs for kantiner
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


def send_to_chatgpt(html_content):
    """
    Sender HTML til ChatGPT og ber om en strukturert meny i samme format som tidligere.
    """
    prompt = f"""
    Her er HTML-en fra en kantine-meny. Ekstraher menyen på norsk, formater den i følgende struktur, sett inn en passende emoji bak hver matrett og returner KUN menyen:

    * [Matrett 1]
    * [Matrett 2]
       
    HTML:
    {html_content}
    """

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "system", "content": "Du er en assistent som ekstraherer menydata fra HTML."},
                     {"role": "user", "content": prompt}],
        "temperature": 0.5
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print(f"Error from OpenAI API: {response.text}")
        return None


# Hvilken dag skal menyen hentes for? (default: dagens dag)
# day = -1
# language = "no"

day = int(sys.argv[1])
language = sys.argv[2]

if language == "en":
    bygg = "Building"
else:
    bygg = "Bygg"

# Sjekk om det er helg (lørdag eller søndag)
current_day = datetime.today().weekday()
if current_day in (5, 6):
    if language == "en":
        print("No menus for Saturday or Sunday. Come back on Monday or select a weekday.")
    else:
        print("Ingen meny på lørdager og søndager. Kom tilbake på mandag, eller velg ukedag.")
else:
    # Gå gjennom alle kantiner
    weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    today = datetime.today()
    weekday = weekdays_norwegian[today.weekday()]
    print("## Dagens lunsj ---", weekday + " " + today.strftime("%d.%m.%Y:"))

    for canteen, info in urls.items():
        html_content = fetch_html(info["url"])

        if html_content:
            menu = send_to_chatgpt(html_content)
            if menu:

                print(f"\n**{canteen}** ({info['opening_hours']}) - {bygg}: {info['building']}")
                print(menu)
        else:
            print(f"Kunne ikke hente HTML for {canteen}.")
