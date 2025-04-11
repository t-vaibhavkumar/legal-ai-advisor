from flask import jsonify
import logging
import requests
import os
import sys
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dataset.vector_database import search_documents

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

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

    url = "http://localhost:11434/api/generate"

    payload = {
        "model": "llama3.2",  
        "prompt": prompt,
        "stream": False
    }

    headers = {"Content-Type": "application/json"}

    logger.debug(f"prompt: {prompt}")

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
        response.raise_for_status()  # Check for HTTP errors

        data = response.json()
        logger.debug(f"Received data: {data}")

        if "response" in data:
            logger.debug(f"Received response: {data['response']}")
            return data["response"]
        else:
            logger.error("No 'response' key found in API response")
            return "Error: No response received from LLM"

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        return f"Error: Unable to reach LLM API - {e}"
