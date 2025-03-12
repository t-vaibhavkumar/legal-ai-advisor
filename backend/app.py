from fastapi import FastAPI
from pydantic import BaseModel
from chatbot import ask_llm

# Initialize FastAPI app
app = FastAPI()

# Define request schema
class QueryRequest(BaseModel):
    query: str

@app.post("/ask")
async def ask_question(request: QueryRequest):
    """Handles user queries and returns AI-generated legal responses."""
    response = ask_llm(request.query)
    return {"response": response}
