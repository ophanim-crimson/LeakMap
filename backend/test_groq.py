import requests
import base64

groq_key = "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"
headers = {
    "Authorization": f"Bearer {groq_key}",
    "Content-Type": "application/json"
}

# Download a test image
img_resp = requests.get("https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300", timeout=10)
b64_img = base64.b64encode(img_resp.content).decode("utf-8")

for model in ["llama-3.2-90b-vision-preview", "qwen/qwen3.6-27b"]:
    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is this?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                ]
            }
        ]
    }
    print(f"\nTesting Groq model: {model}...")
    try:
        r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=20)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
