import logging
from fastapi import FastAPI
from pydantic import BaseModel
from chatbot import ask_llm  # Ensure chatbot.py exists

# ✅ Configure Logging
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your frontend (Vite default is http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ✅ Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# app = FastAPI()

# ✅ Define request model
class QueryRequest(BaseModel):
    query: str

@app.post("/ask")
async def ask_question(request: QueryRequest):
    query = request.query
    logger.debug(f"Received query: {query}")

    try:
        response = ask_llm(query)
        logger.debug(f"LLM Response: {response}")
        return {"response": response}
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {"error": "Internal server error. Check logs for details."}
