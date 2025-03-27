import requests
import threading
import time

def send_request():
    url = "http://127.0.0.1:5000/ask"
    query = {"query": "What is the law on contracts?"}
    response = requests.post(url, json=query)
    print(f"Status: {response.status_code}, Response: {response.text}")

def test_high_volume_requests():
    threads = []
    start_time = time.time()
    for i in range(10):  # Simulating 100 concurrent users
        print(i)
        thread = threading.Thread(target=send_request)
        thread.start()
        threads.append(thread)

    for thread in threads:
        thread.join()

    end_time = time.time()
    total_time = end_time - start_time
    print(f"✅ High Volume Requests Test Completed in {total_time} secs")

test_high_volume_requests()

def test_large_query():
    url = "http://127.0.0.1:5000/ask"
    large_query = {"query": "law " * 10000}  # 10,000-word query
    response = requests.post(url, json=large_query)
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    assert "error" not in response.json(), "API failed for large input!"
    
    print("✅ Large Query Input Test Passed.")

test_large_query()

import time

def test_sustained_load():
    url = "http://127.0.0.1:5000/ask"
    query = {"query": "Explain Indian contract law."}
    
    start_time = time.time()
    duration = 600  # 10 minutes
    request_count = 0
    
    while time.time() - start_time < duration:
        response = requests.post(url, json=query)
        request_count += 1
        if response.status_code != 200:
            print(f"❌ API failed at {request_count} requests.")
            return
    
    print(f"✅ Sustained Load Test Passed. {request_count} requests sent in 10 min.")

test_sustained_load()
