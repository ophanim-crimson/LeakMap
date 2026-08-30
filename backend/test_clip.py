import requests

hf_token = "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"
url = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
headers = {"Authorization": f"Bearer {hf_token}"}

# Test with a public image URL of a water leak
payload = {
    "parameters": {
        "candidate_labels": [
            "a photograph of a real water leak, burst pipe, flooding, or plumbing tap",
            "a logo, graphic, drawing, illustration, or icon",
            "an unrelated photograph of a person, car, animal, or object"
        ]
    },
    "inputs": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"
}

print("Testing Hugging Face CLIP Zero-Shot Classification...")
try:
    r = requests.post(url, headers=headers, json=payload, timeout=20)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
