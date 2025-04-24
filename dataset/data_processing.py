import json

# Load legal data
with open("law_data.json", "r", encoding="utf-8") as f:
    law_data = json.load(f)

# Create a formatted text file
with open("legal_texts.txt", "w", encoding="utf-8") as f:
    for law, text in law_data.items():
        f.write(f"### {law}\n")
        f.write(text + "\n\n")

print("data processing completed")
