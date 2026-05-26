"""
latency_analysis_v2.py - Tests the v2 files with improved auto-tunnel and lower threshold.
Run this WITHOUT your manual SSH tunnel to test auto-tunneling.
"""
import time
import json
import sys

# Create a minimal test app that uses v2 files
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Import v2 versions
from main_file_v2 import get_best_template, s3_client

app = FastAPI()

@app.post("/search")
def search(data: dict):
    user_query = data.get("user_query", "")
    language = data.get("language", "en")
    result, _ = get_best_template(user_query)
    if result:
        return {"status": "success", "result": result}
    return {"status": "no_match", "result": None}


TEST_QUERIES = [
    {"query": "Rental agreement", "type": "simple"},
    {"query": "Loan acknowledgement", "type": "simple"},
    {"query": "Employment contract", "type": "simple"},
    {"query": "Non-disclosure agreement", "type": "simple"},
    {"query": "Partnership deed", "type": "simple"},
    {"query": "Agreement for repayment of friendly loan with interest and security", "type": "complex"},
    {"query": "Lease deed for commercial property with lock-in period and escalation clause", "type": "complex"},
    {"query": "Consultancy agreement for IT services with intellectual property rights", "type": "complex"},
    {"query": "Sale deed for residential flat including car parking and common areas", "type": "complex"},
    {"query": "Franchise agreement for retail outlet with territorial exclusivity", "type": "complex"},
]


def run_analysis():
    print(f"{'Type':<10} | {'Query':<60} | {'Latency (ms)':<12} | {'Path':<10} | {'Top Match':<40} | {'Score':<8}")
    print("-" * 155)
    
    client = TestClient(app)
    results = []
    
    # Warmup
    print("Warming up model...")
    client.post("/search", json={"user_query": "test", "language": "en"})
    
    for item in TEST_QUERIES:
        q = item["query"]
        q_type = item["type"]
        
        start_time = time.perf_counter()
        import io
        from contextlib import redirect_stdout
        f = io.StringIO()
        with redirect_stdout(f):
            response = client.post("/search", json={"user_query": q, "language": "en"})
        output = f.getvalue()
        end_time = time.perf_counter()
        
        path = "FAST" if "Fast-Path SUCCESS" in output else "SLOW"
        if "Parser error" in output: path += " (FALLBACK)"
        
        latency_ms = (end_time - start_time) * 1000
        
        top_match = "N/A"
        score = 0.0
        if response.status_code == 200:
            data = response.json()
            if data.get("result"):
                top_match = data["result"].get("title", "N/A")
                score = data["result"].get("score", 0.0)
        else:
            print(f"Error for query '{q}': {response.text}")
            
        print(f"{q_type:<10} | {q[:57] + '...' if len(q) > 60 else q:<60} | {latency_ms:<12.2f} | {path:<10} | {top_match[:37] + '...' if len(top_match) > 40 else top_match:<40} | {score:<8.3f}")
        
        results.append({
            "query": q,
            "type": q_type,
            "path": path,
            "latency_ms": latency_ms,
            "top_match": top_match,
            "score": score
        })
    
    # Summary
    avg_latency = sum(r["latency_ms"] for r in results) / len(results)
    fast_count = sum(1 for r in results if "FAST" in r["path"])
    
    print("-" * 155)
    print(f"Average Latency: {avg_latency:.2f} ms")
    print(f"FAST path: {fast_count}/{len(results)} queries")
    
    # Save results
    with open("analysis_results_v2.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Results saved to analysis_results_v2.json")


if __name__ == "__main__":
    run_analysis()
