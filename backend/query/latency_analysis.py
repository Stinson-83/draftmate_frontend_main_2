import os
import sys
import time
import json
from fastapi.testclient import TestClient

# Ensure we can import modules from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from Query import app
except ImportError as e:
    print(f"Failed to import app: {e}")
    sys.exit(1)



queries = [
    # Simple Queries
    {"type": "simple", "query": "Rental agreement"},
    {"type": "simple", "query": "Loan acknowledgement"},
    {"type": "simple", "query": "Employment contract"},
    {"type": "simple", "query": "Non-disclosure agreement"},
    {"type": "simple", "query": "Partnership deed"},
    
    # Complex Queries
    {"type": "complex", "query": "Agreement for repayment of friendly loan with interest and security"},
    {"type": "complex", "query": "Lease deed for commercial property with lock-in period and maintenance clauses"},
    {"type": "complex", "query": "Consultancy agreement for IT services with intellectual property assignment"},
    {"type": "complex", "query": "Sale deed for residential flat including car parking and undivided share of land"},
    {"type": "complex", "query": "Franchise agreement for retail outlet with territorial exclusivity and royalty terms"}
]

def run_analysis():
    print(f"{'Type':<10} | {'Query':<60} | {'Latency (ms)':<12} | {'Path':<10} | {'Top Match':<40} | {'Score':<8}")
    print("-" * 155)
    
    results = []
    
    # Use TestClient as context manager to trigger lifespan (startup/shutdown events)
    with TestClient(app) as client:
        # Warm-up (model load)
        print("Warming up model...")
        client.post("/search", json={"user_query": "test"})
        
        for item in queries:
            q = item["query"]
            q_type = item["type"]
            
            start_time = time.perf_counter()
            # Capture stdout to see Fast-Path vs Slow-Path logs
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
            alternatives = []
            
            if response.status_code == 200:
                data = response.json()
                top_match = data.get("title", "No Title")
                score = data.get("score", 0.0)
                alternatives = data.get("alternatives", [])
            else:
                print(f"Error for query '{q}': {response.text}")
                alternatives = []
                
            print(f"{q_type:<10} | {q[:57] + '...' if len(q) > 60 else q:<60} | {latency_ms:<12.2f} | {path:<10} | {top_match[:37] + '...' if len(top_match) > 40 else top_match:<40} | {score:<8.3f}")
            
            results.append({
                "query": q,
                "type": q_type,
                "path": path,
                "latency_ms": latency_ms,
                "top_match": top_match,
                "score": score,
                "alternatives": alternatives
            })
        
    return results

if __name__ == "__main__":
    results = run_analysis()
    
    avg_latency = sum(r["latency_ms"] for r in results) / len(results)
    print("\n" + "-" * 140)
    print(f"Average Latency: {avg_latency:.2f} ms")
    
    # Save results to a file for later use in walkthrough
    with open("analysis_results.json", "w") as f:
        json.dump(results, f, indent=2)
