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

# Dictionary to store conversation histories
conversation_contexts = {}

def ask_llm_with_context(query, conversation_id="default", is_new_conversation=False):
    """
    Retrieves relevant legal texts and queries Llama 3.2 with conversation context.
    
    Args:
        query: The user's question
        conversation_id: Unique identifier for this conversation
        is_new_conversation: Boolean indicating if this is a new conversation
    """
    # Reset context if this is a new conversation
    if is_new_conversation:
        logger.debug(f"Starting new conversation with ID: {conversation_id}")
        conversation_contexts[conversation_id] = []
    
    # Get or initialize the conversation history
    if conversation_id not in conversation_contexts:
        logger.debug(f"Initializing context for conversation ID: {conversation_id}")
        conversation_contexts[conversation_id] = []
    
    # Search for relevant documents
    relevant_docs = search_documents(query)
    context = "\n".join(relevant_docs)
    
    # Build conversation history string
    conversation_history = ""
    if conversation_contexts[conversation_id]:
        conversation_history = "Previous conversation:\n"
        for exchange in conversation_contexts[conversation_id]:
            conversation_history += f"User: {exchange['user']}\n"
            conversation_history += f"Assistant: {exchange['assistant']}\n"
    
    # Create the prompt with context and conversation history
    prompt = f"""You are an AI expert in Indian law. Use the legal documents provided to answer queries.

    Context:
    {context}
    
    {conversation_history}
    
    Current Question: {query}
    Answer:
    """

    logger.debug(f"Sending prompt with conversation history for ID: {conversation_id}")
    
    url = "http://localhost:11434/api/generate"

    payload = {
        "model": "llama3.2",  
        "prompt": prompt,
        "stream": False
    }

    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=100)
        response.raise_for_status()

        data = response.json()
        
        if "response" in data:
            assistant_response = data["response"]
            
            # Store this exchange in the conversation history
            conversation_contexts[conversation_id].append({
                "user": query,
                "assistant": assistant_response
            })
            
            # Keep conversation history to a reasonable size (last 5 exchanges)
            if len(conversation_contexts[conversation_id]) > 5:
                conversation_contexts[conversation_id] = conversation_contexts[conversation_id][-5:]
                
            logger.debug(f"Updated conversation history for ID: {conversation_id}")
            return assistant_response
        else:
            logger.error("No 'response' key found in API response")
            return "Error: No response received from LLM"

    except requests.exceptions.RequestException as e:
        logger.error(f"Request failed: {e}")
        return f"Error: Unable to reach LLM API - {e}"

# Keep the original function for backward compatibility
def ask_llm(query):
    """Legacy function that calls the new context-aware function"""
    return ask_llm_with_context(query)