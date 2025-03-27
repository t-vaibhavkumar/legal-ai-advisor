import logging
from pydantic import BaseModel
from chatbot import ask_llm  # Ensure chatbot.py exists
from flask import Flask, request, jsonify
from flask_cors import CORS

#Configure Logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)



app = Flask(__name__)
CORS(app)

# ✅ Define request model
# class QueryRequest(BaseModel):
#     query: str

@app.route('/ask', methods=['POST'])
async def ask_question():
    data = request.get_json()
    logger.debug(f"Received query: {data}")
    query = data["query"]
    logger.debug(f"Received query: {query}")

    try:
        response = ask_llm(query)
        logger.debug(f"LLM Response: {response}")
        data = {"response" : response}
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {"error": "Internal server error. Check logs for details."}

if __name__ == '__main__':
    print("hello")
    app.run(debug=True)
