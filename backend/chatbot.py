import ollama
from dataset.vector_database import search_documents


def ask_llm(query):
    """Retrieves relevant legal texts and queries Ollama LLM"""
    relevant_docs = search_documents(query)
    context = "\n".join(relevant_docs)

    prompt = f"""You are an AI expert in Indian law. Use the legal documents provided to answer queries.

    Context:
    {context}

    Question: {query}
    Answer:
    """
    response = ollama.chat(model="mistral", messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]
