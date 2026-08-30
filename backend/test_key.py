import requests

token = "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"
headers = {"Authorization": f"Bearer {token}"}

# Test 1: Image captioning model
print("Testing Salesforce/blip-image-captioning-large...")
url = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"

# Use a tiny test image (1x1 red pixel PNG)
import base64
# Create a simple test with a URL-based image
r = requests.post(url, headers=headers, json={"inputs": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"}, timeout=30)
print(f"Status: {r.status_code}")
print(f"Response: {r.text[:300]}")

print("\n---\n")

# Test 2: Text generation model
print("Testing mistralai/Mistral-7B-Instruct-v0.3...")
url2 = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
r2 = requests.post(url2, headers=headers, json={"inputs": "Classify urgency as Low, Medium, High, or Critical: A water pipe burst on a main road. Answer with one word:"}, timeout=30)
print(f"Status: {r2.status_code}")
print(f"Response: {r2.text[:300]}")
