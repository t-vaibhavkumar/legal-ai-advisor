import os
import pytest
import requests

BASE_URL = "http://127.0.0.1:5000"

@pytest.mark.local_only
def test_legal_qa_response():
    """Test a simple legal QA response"""
    query = {"query": "What is Section 420 of IPC?"}
    response = requests.post(f"{BASE_URL}/ask", json=query)
    assert response.status_code == 200
    assert "cheating" in response.json()["response"].lower()

@pytest.mark.local_only
def test_multi_turn_conversation():
    """Simulate a multi-turn conversation"""
    first = requests.post(f"{BASE_URL}/ask", json={"query": "Tell me about Indian contract law."})
    follow_up = requests.post(f"{BASE_URL}/ask", json={"query": "What are its essential elements?"})

    assert first.status_code == 200
    assert follow_up.status_code == 200
    response_text = follow_up.json()["response"].lower()
    assert any(kw in response_text for kw in ["offer", "agreement", "contract"]), response_text

@pytest.mark.local_only
def test_legal_entity_detection():
    """Check if legal entities (e.g., acts, sections) are identified"""
    query = {"query": "Explain Section 376 of IPC."}
    response = requests.post(f"{BASE_URL}/ask", json=query)
    assert response.status_code == 200
    assert "rape" in response.json()["response"].lower()
