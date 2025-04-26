#!/usr/bin/env python
import requests
import argparse
import base64
import cv2
import json
import os

def test_file_upload(api_url, image_path):
    """Test the /predict endpoint with file upload"""
    print(f"Testing file upload with {image_path}")
    
    # Prepare the file for upload
    with open(image_path, "rb") as image_file:
        files = {"file": (os.path.basename(image_path), image_file, "image/jpeg")}
        
        # Send the request to the API
        response = requests.post(f"{api_url}/predict", files=files)
    
    # Print the result
    if response.status_code == 200:
        result = response.json()
        print(f"Prediction: {result['sign']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Hand detected: {result['has_hand']}")
        print(f"Number of landmarks: {len(result['landmarks'])}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    return response.json() if response.status_code == 200 else None

def test_base64(api_url, image_path):
    """Test the /predict/base64 endpoint with base64 encoded image"""
    print(f"Testing base64 endpoint with {image_path}")
    
    # Read the image and convert to base64
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode("utf-8")
    
    # Prepare the request data
    data = {"image": encoded_string}
    
    # Send the request to the API
    response = requests.post(
        f"{api_url}/predict/base64", 
        json=data
    )
    
    # Print the result
    if response.status_code == 200:
        result = response.json()
        print(f"Prediction: {result['sign']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Hand detected: {result['has_hand']}")
        print(f"Number of landmarks: {len(result['landmarks'])}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    return response.json() if response.status_code == 200 else None

def test_health(api_url):
    """Test the health endpoint"""
    print("Testing health endpoint")
    
    # Send the request to the API
    response = requests.get(f"{api_url}/health")
    
    # Print the result
    if response.status_code == 200:
        result = response.json()
        print(f"Status: {result['status']}")
        print(f"Model loaded: {result['model_loaded']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
    
    return response.json() if response.status_code == 200 else None

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Test the ASL Recognition API")
    parser.add_argument("--api_url", type=str, default="http://localhost:8000",
                        help="URL of the ASL Recognition API")
    parser.add_argument("--image", type=str, required=True,
                        help="Path to an image file for testing")
    args = parser.parse_args()
    
    # Test the health endpoint
    test_health(args.api_url)
    print()
    
    # Test the file upload endpoint
    test_file_upload(args.api_url, args.image)
    print()
    
    # Test the base64 endpoint
    test_base64(args.api_url, args.image)

if __name__ == "__main__":
    main() 