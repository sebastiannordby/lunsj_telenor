import requests
import os
from datetime import datetime

# OpenAI API-nøkkel (sett inn din egen nøkkel her)
key_file_path = "/home/marius/git/key.txt"

with open(key_file_path, "r") as file:
    OPENAI_API_KEY = file.read().strip()

# URLs for kantiner
urls = {
    "Eat The Street": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=bbf807d7-b1ed-4493-8853-e40077f6adde&scaleToFit=true",
        "opening_hours": "10:30 - 14:00",
        "building": "J/K"
    },
    "Flow": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=4a0457f8-dbfa-4783-8ebe-b5ee0486843f&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "B"
    },
    "Fresh 4 You": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=aa1358ee-d30e-4289-a630-892cd1210857&scaleToFit=true",
        "opening_hours": "10:30 - 13:00",
        "building": "C/D"
    },
    "Eat The Street - Middag": {
        "url": "https://widget.inisign.com/Widget/Customers/Customer.aspx?token=8469c383-d042-4d2d-8b18-30b6f9f90393&scaleToFit=true",
        "opening_hours": "15:00 - 17:00",
        "building": "J/K"
    }
}

def fetch_html(url):
    """
    Henter HTML fra kantine-nettsiden.
    """
    try:
        response = requests.get(url, timeout=10, verify=False)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def send_to_chatgpt(html_content, system_prompt):
    """
    Sender HTML til ChatGPT med angitt system-instruks og returnerer meny.
    """
    prompt = f"""
    Her er HTML-en fra en kantine-meny. Ekstraher menyen, formater den i følgende struktur, sett inn en passende emoji bak hver matrett og returner KUN menyen:

    - [Matrett 1]
    - [Matrett 2]

    HTML:
    {html_content}
    """

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.5
    }

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=data
    )

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        print(f"Error from OpenAI API: {response.text}")
        return None

if __name__ == "__main__":
    # Finn dagens dato og ukedag
    weekdays_norwegian = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
    weekdays_english = ['Monday', 'Tueday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    today = datetime.today()
    weekday = weekdays_norwegian[today.weekday()]
    weekday_en = weekdays_english[today.weekday()]
    date_str = today.strftime("%d.%m.%Y")

    # System-instrukser per språk
    system_prompts = {
        "no": "Du er en hjelpsom assistent som svarer på norsk.",
        "en": "You are a helpful assistant that responds menu items in English.",
        "al": "You are an assistant that responds menu items in English, and includes the allergies in words behind each meal in parenteces. These are the allergies: 1Egg    5Nøtter / Nuts    9Sesamfrø / Sesame seed    13Bløtdyr / Mulluscs 2Fisk / Fish  6Peanøtter / Peanuts    10Skalldyr / Shellfish    14Lupin / Lupine 3Gluten    7Selleri / Celery  11Soya / Soy 4Melk / Milk    8Sennep / Mustard    12Sulfitter / Sulfites"
    }

    # Sørg for at outputs-mappe finnes
    os.makedirs("outputs", exist_ok=True)

    # Loop over språk og hent menyer
    for lang, system_prompt in system_prompts.items():
        # Start tekst for fil
        if lang == "no":
            output_text = f"Dagens lunsj --- {weekday} {date_str}\n\n"
        else:
            output_text = f"Todays lunch --- {weekday_en} {date_str}\n\n"

        for canteen, info in urls.items():
            html_content = fetch_html(info["url"])
            if html_content:
                menu = send_to_chatgpt(html_content, system_prompt)
                if menu:
                    if lang == "no":
                        output_text += f"{canteen} ({info['opening_hours']}) - Bygg: {info['building']}\n"
                    else:
                        output_text += f"{canteen} ({info['opening_hours']}) - Building: {info['building']}\n"
                    output_text += f"{menu}\n\n"
                else:
                    output_text += f"Kunne ikke ekstrahere meny for {canteen}.\n\n"
            else:
                output_text += f"Kunne ikke hente HTML for {canteen}.\n\n"

        # Skriv til fil
        filename = f"menus_{lang}.txt"
        filepath = os.path.join("outputs", filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(output_text)

print("Menyer oppdatert")

