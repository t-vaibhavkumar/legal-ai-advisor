import requests
import os
import sys
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dataset.vector_database import search_documents

def ask_llm(query):
    """Retrieves relevant legal texts and queries Llama 3.2 running on Ollama locally."""
    relevant_docs = search_documents(query)
    context = "\n".join(relevant_docs)

    prompt = f"""You are an AI expert in Indian law. Use the legal documents provided to answer queries.

    Context:
    {context}

    Question: {query}
    Answer:
    """

    url = "http://localhost:11434/api/generate"  # Ollama's local API endpoint

    payload = {
        "model": "llama3.2",  # Replace with your actual model name
        "prompt": prompt,
        "stream": False
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, data=json.dumps(payload), headers=headers)

    if response.status_code == 200:
        return response.json().get("response", "No response received.")
    else:
        return f"Error: {response.status_code}, {response.text}"
