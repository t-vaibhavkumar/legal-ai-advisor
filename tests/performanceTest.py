import requests
import time

def test_response_time():
    url = "http://127.0.0.1:5000/ask"
    query = {"query": "What are the rights of a tenant under Indian law?"}

    start_time = time.time()
    response = requests.post(url, json=query)
    end_time = time.time()
    
    response_time = end_time - start_time
    print(f"API Response Time: {response_time:.2f} seconds")

    assert response_time < 120, "❌ Response time exceeded 2 mins!"
    print("✅ API Response Time Test Passed.")

test_response_time()

import time
# from dataset.vector_database import get_relevant_documents  # Ensure correct import

def test_db_query_time():
    query = "What is contract law?"
    url = "http://127.0.0.1:5000/debug_search"
    
    start_time = time.time()
    # results = get_relevant_documents(query)  # Fetch legal documents
    response = requests.post(url, json={"query": query})
    end_time = time.time()
    
    db_time = end_time - start_time
    print(f"Database Query Execution Time: {db_time:.2f} seconds")
    
    assert db_time < 120, "❌ Database query took too long!"
    print("✅ Database Query Performance Test Passed.")

test_db_query_time()

