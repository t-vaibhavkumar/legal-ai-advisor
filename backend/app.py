import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import ask_llm_with_context  # Updated import
import os

isProd = os.getenv("ISPROD", "False").lower() == "true"
if isProd:
    from vector_database import search_documents
else:
    from dataset.vector_database import search_documents

# Configure Logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
# CORS(app, resources={r"/*": {"origins": "http://172.16.239.65:5173"}})
# CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            r"https://.*\.ngrok-free\.app"
        ]
    }
})


@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    logger.debug(f"Received data: {data}")
    
    # Extract data from request
    query = data["query"]
    conversation_id = data.get("conversationId", "default")  # Get conversation ID
    is_new_conversation = data.get("isNewConversation", False)  # Check if new conversation
    
    logger.debug(f"Processing query: '{query}' for conversation: {conversation_id} (new: {is_new_conversation})")

    try:
        # Pass conversation context parameters to the chatbot function
        response = ask_llm_with_context(query, conversation_id, is_new_conversation)
        logger.debug(f"LLM Response: {response}")
        data = {"response": response}
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error. Check logs for details."})

@app.route('/debug_search', methods=['POST'])
def debug_search():
    data = request.get_json()
    query = data.get("query", "")
    
    retrieved_knowledge = search_documents(query)
    return jsonify({"retrieved": retrieved_knowledge})

if __name__ == '__main__':
    print("hello")
    app.run(host="0.0.0.0", port=5000, debug=True)