#!/usr/bin/env python
import requests
import time
import sys

def test_api_health():
    """Test if the ASL API is running by checking the health endpoint."""
    url = "http://localhost:8000/health"
    try:
        print(f"Testing API at {url}...")
        response = requests.get(url)
    if response.status_code == 200:
            data = response.json()
            print("API is online!")
            print(f"Status: {data['status']}")
            print(f"Model loaded: {data['model_loaded']}")
            return True
    else:
            print(f"Error: API returned status code {response.status_code}")
            return False
    except requests.ConnectionError:
        print("Error: Could not connect to the API.")
        print("Make sure the API server is running on http://localhost:8000")
        return False

if __name__ == "__main__":
    # If API is not ready, wait and retry a few times
    max_retries = 5
    for i in range(max_retries):
        if test_api_health():
            sys.exit(0)
        if i < max_retries - 1:
            print(f"Retrying in 2 seconds... (Attempt {i+1}/{max_retries})")
            time.sleep(2)
    
    print(f"Failed to connect to the API after {max_retries} attempts.")
    sys.exit(1) 