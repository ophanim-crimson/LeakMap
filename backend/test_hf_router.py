import requests
import base64

hf_token = "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"
headers = {"Authorization": f"Bearer {hf_token}", "Content-Type": "application/json"}

# Download test image
print("Downloading test image...")
img_resp = requests.get("https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=300", timeout=10)
img_bytes = img_resp.content
b64 = base64.b64encode(img_bytes).decode()
print(f"Image: {len(img_bytes)} bytes\n")

# Try Llama 3.2 Vision via the router with different providers
providers = [
    ("novita-ai", "meta-llama/Llama-3.2-11B-Vision-Instruct"),
    ("fireworks-ai", "meta-llama/Llama-3.2-11B-Vision-Instruct"),
    ("together", "meta-llama/Llama-3.2-11B-Vision-Instruct"),
    ("cerebras", "meta-llama/Llama-3.2-11B-Vision-Instruct"),
    ("sambanova", "meta-llama/Llama-3.2-11B-Vision-Instruct"),
]

payload = {
    "messages": [{"role": "user", "content": [
        {"type": "text", "text": "What is in this image? Reply in 5 words."},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
    ]}],
    "max_tokens": 50
}

for provider, model in providers:
    url = f"https://router.huggingface.co/{provider}/v1/chat/completions"
    print(f"Testing provider: {provider} with {model}")
    payload["model"] = model
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        print(f"  Status: {r.status_code}")
        resp_text = r.text[:300]
        print(f"  Response: {resp_text}\n")
        if r.status_code == 200:
            print("  *** SUCCESS! ***\n")
            break
    except Exception as e:
        print(f"  Error: {e}\n")
