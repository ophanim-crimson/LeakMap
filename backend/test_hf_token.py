import requests
hf_token = "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"
headers = {"Authorization": f"Bearer {hf_token}"}
r = requests.get("https://huggingface.co/api/whoami-v2", headers=headers)
print(r.status_code)
print(r.text)
