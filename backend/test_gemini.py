import requests

api_key = "AQ.Ab8RN6ICsJzNdYyw77S2eSiOYCUawH4usXdJ8UXct5XOSDVcbA"

prompt = "Respond with exactly: OK"
payload = {
    "contents": [{"parts": [{"text": prompt}]}]
}
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

print("Testing Gemini API Key...")
try:
    r = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=15)
    print(f"Status Code: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
