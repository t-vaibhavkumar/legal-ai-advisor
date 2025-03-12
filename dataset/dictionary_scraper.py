import requests
from bs4 import BeautifulSoup
import json
import string

def scrape_legal_definitions(letter):
    url = f"https://thelawdictionary.org/letter/{letter}/"
    response = requests.get(url)

    if response.status_code != 200:
        print(f"Failed to retrieve data for letter '{letter}'.")
        return None

    soup = BeautifulSoup(response.text, "html.parser")
    definitions = {}

    for term_section in soup.find_all("h2"):
        term = term_section.get_text(strip=True)

        # Filter out unnecessary entries
        if term.lower() in ["the law dictionary"] or term.startswith("Topic Archives:"):
            continue

        description_section = term_section.find_next("p")
        if description_section:
            description = description_section.get_text(strip=True)
            definitions[term] = description

    return definitions

# Scrape definitions for a specific letter
for letter in string.ascii_lowercase:
    definitions = scrape_legal_definitions(letter)

    # Save the results as a JSON file
    if definitions:
        with open(f"legal_definitions_{letter}.json", "w", encoding="utf-8") as file:
            json.dump(definitions, file, indent=4, ensure_ascii=False)
        print(f"Definitions saved to legal_definitions_{letter}.json")
    else:
        print(f"No definitions found for {letter}")