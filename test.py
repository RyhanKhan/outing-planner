import urllib.request
import json

data = json.dumps({
    "location": "Bengaluru, Indiranagar",
    "people": "4",
    "budget": "500 per person",
    "category": "dinner",
    "duration": "2 hours"
}).encode("utf-8")

req = urllib.request.Request(
    "http://localhost:3000/api/search",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)

with urllib.request.urlopen(req) as response:
    result = json.loads(response.read().decode("utf-8"))
    print(json.dumps(result, indent=2, ensure_ascii=False))