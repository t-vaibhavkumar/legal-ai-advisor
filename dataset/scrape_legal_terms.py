import requests
import json
from bs4 import BeautifulSoup
import time

# Load the JSON file containing legal sources
with open("legal_sources.json", "r", encoding="utf-8") as f:
    legal_sources = json.load(f)

# Headers to mimic a real browser request
HEADERS = {"User-Agent": "Mozilla/5.0"}

# Function to scrape the legal text from Indian Kanoon
def scrape_law(url):
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            print(f"❌ Failed to fetch {url} (Status Code: {response.status_code})")
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        # Try different containers
        law_sections = soup.find_all(["span", "section", "div"], class_=["akn-act", "akn-preface", "judgments"])

        # Extract text
        law_text = "\n".join(section.get_text(separator="\n", strip=True) for section in law_sections)

        if law_text:
            print(f"📜 Extracted text from {url}:\n{'-'*40}\n{law_text[:500]}...\n{'-'*40}\n")  # Print first 500 chars for debugging
            return law_text
        else:
            print(f"⚠️ No legal text found on {url}")
            return None

    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return None

# Dictionary to store scraped laws
scraped_laws = {}

# Loop through each legal source
for source in legal_sources:
    print(f"📜 Scraping: {source['name']}")
    law_text = scrape_law(source["url"])

    if law_text:
        scraped_laws[source["name"]] = law_text
        print(f"✅ Successfully scraped {source['name']}")
    else:
        print(f"❌ Skipping {source['name']} (No data found)")

    time.sleep(2)  # Add delay to avoid getting blocked

# Save the scraped data to a JSON file
with open("law_data.json", "w", encoding="utf-8") as f:
    json.dump(scraped_laws, f, indent=4, ensure_ascii=False)

print("✅ All laws scraped and saved to law_data.json")
