import requests  # type: ignore
from bs4 import BeautifulSoup  # type: ignore
import json
import time
import re
import fitz  # PyMuPDF
import io

# Load the JSON file with legal sources
LEGAL_SOURCES_FILE = "legal_sources.json"
OUTPUT_JSON_FILE = "law_data.json"

# Function to clean extracted text
def clean_text(text):
    """Remove unwanted symbols and extra spaces from text."""
    text = re.sub(r"\{\|.*?\|\}", "", text, flags=re.DOTALL)  # Remove table-like formatting
    text = re.sub(r"\n{2,}", "\n", text)  # Remove excessive newlines
    return text.strip()

# Function to extract text from PDF URL
def scrape_pdf_text(pdf_url):
    """Download and extract text from a PDF file given its URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(pdf_url, headers=headers, timeout=15)
        response.raise_for_status()

        with fitz.open(stream=io.BytesIO(response.content), filetype="pdf") as doc:
            text = "\n".join(page.get_text() for page in doc)
            return clean_text(text) if text else None

    except Exception as e:
        print(f"❌ Error processing PDF {pdf_url}: {e}")
        return None

# Function to scrape legal text from an HTML page
def scrape_law_text(url):
    """Scrapes the main legal content from the given URL."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract text using common legal content classes
        law_sections = soup.find_all(["span", "section", "div", "p", "pre"], class_=lambda x: x and "akn-" in x)

        # Combine extracted text
        law_text = "\n".join(section.get_text(separator="\n", strip=True) for section in law_sections)
        return clean_text(law_text) if law_text else None

    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching {url}: {e}")
        return None

# Function to save data in JSON format
def save_json(data, filename=OUTPUT_JSON_FILE):
    """Save scraped legal text into a properly formatted JSON file."""
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"✅ Data saved successfully to {filename}")
    except Exception as e:
        print(f"❌ Error saving JSON: {e}")

# Load legal sources from JSON
try:
    with open(LEGAL_SOURCES_FILE, "r", encoding="utf-8") as f:
        laws = json.load(f)
except Exception as e:
    print(f"❌ Error loading {LEGAL_SOURCES_FILE}: {e}")
    exit(1)

# Dictionary to store scraped data
legal_data = {}

# Iterate through legal sources and scrape data
for law in laws:
    law_name = law["name"]
    url = law["url"]

    print(f"📜 Scraping: {law_name} ({url})")

    if url.lower().endswith(".pdf"):
        law_text = scrape_pdf_text(url)
    else:
        law_text = scrape_law_text(url)

    if law_text:
        legal_data[law_name] = law_text
        print(f"✅ Successfully scraped: {law_name}")
    else:
        print(f"⚠️ No data found for {law_name}, skipping...")

    time.sleep(2)  # Avoid being rate-limited or blocked

# Save scraped data to JSON
save_json(legal_data)
