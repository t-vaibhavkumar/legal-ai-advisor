import requests
from flask import jsonify

# URL of your Flask backend
backend_url = "http://127.0.0.1:5000/ask"

def test_backend_reachable():
    try:
        response = requests.post(backend_url, json={"query": "Test"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✅ Backend is reachable.")
    except Exception as e:
        print(f"❌ Backend unreachable: {e}")

test_backend_reachable()

def test_ollama_response():
    ollama_url = "http://localhost:11434/api/generate"
    data = {"model": "llama3.2", "prompt": "What is Python?", "stream": False}

    response = requests.post(ollama_url, json=data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    json_response = response.json()
    assert "response" in json_response, "Missing 'response' key in Ollama output"
    
    print("✅ Ollama server is working properly.")

test_ollama_response()

def test_knowledge_base():
    response = requests.post("http://127.0.0.1:5000/debug_search", json={"query": "contract law"})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    json_response = response.json()
    assert "retrieved" in json_response, "Missing 'retrieved' key in response"
    assert len(json_response["retrieved"]) > 0, "No knowledge retrieved"
    
    print("✅ Knowledge base retrieval is working.")

test_knowledge_base()


