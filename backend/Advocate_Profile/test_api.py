import urllib.request
import json

try:
    req = urllib.request.Request('http://localhost:8005/api/v1/discovery/search')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Status code:", response.status)
        results = data.get("data", {}).get("results", [])
        print("Number of search results:", len(results))
        if len(results) > 0:
            print("First result:", results[0])
            
    req2 = urllib.request.Request('http://localhost:8005/api/v1/discovery/featured')
    with urllib.request.urlopen(req2) as response2:
        data2 = json.loads(response2.read().decode())
        print("Number of featured advocates:", len(data2.get("data", [])))
except Exception as e:
    print("Error:", e)
