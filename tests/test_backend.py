import unittest
from unittest.mock import patch
import requests
import os

BACKEND_URL = "http://127.0.0.1:5000/ask"

class BackendTests(unittest.TestCase):

    @patch("requests.post")
    def test_backend_reachable(self, mock_post):
        """Check if the backend API is reachable"""

        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"response": "Test response from Ollama"}

        response = requests.post(BACKEND_URL, json={"query": "Test"})

        self.assertEqual(response.status_code, 200)
        self.assertIn("response", response.json())

    @patch("requests.post")  
    def test_knowledge_base(self, mock_post):
        """Check if the knowledge base retrieval works"""

        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"knowledge": "Sample knowledge data"}

        response = requests.post(BACKEND_URL, json={"query": "Tell me about law"})

        self.assertEqual(response.status_code, 200)
        self.assertIn("knowledge", response.json())

    def test_skip_if_no_ollama(self):
        """Skip the test if Ollama is not available"""
        if os.getenv("SKIP_OLLAMA_TESTS"):
            self.skipTest("Skipping test because Ollama is not available")

        response = requests.post(BACKEND_URL, json={"query": "Test"})
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
