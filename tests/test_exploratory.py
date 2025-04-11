import os
import pytest
import requests

BASE_URL = "http://127.0.0.1:5000"

@pytest.mark.local_only
def test_for_hallucination():
    """Check that Ollama does not hallucinate laws that don't exist"""
    query = {"query": "What is the Indian Snake Charming Act of 1950?"}
    response = requests.post(f"{BASE_URL}/ask", json=query)
    assert response.status_code == 200
    assert "no such law" in response.json()["response"].lower() or "not found" in response.json()["response"].lower()

@pytest.mark.local_only
def test_legal_misinterpretation():
    """Check that it doesn't confuse similar-sounding sections"""
    query = {"query": "What is Section 144 of CrPC?"}
    response = requests.post(f"{BASE_URL}/ask", json=query)
    assert response.status_code == 200
    assert "unlawful assembly" in response.json()["response"].lower()

@pytest.mark.local_only
def test_usability():
    """Check if response is too technical or user-friendly"""
    query = {"query": "What are the rights of a wife under Hindu Marriage Act?"}
    response = requests.post(f"{BASE_URL}/ask", json=query)
    assert response.status_code == 200
    resp_text = response.json()["response"].lower()
    assert "maintenance" in resp_text and "custody" in resp_text
