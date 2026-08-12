import sys
import os

# Adjust path to include parent directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from lex_bot.graph import app
from lex_bot.state import AgentState

def run_test():
    query = "What are the rights of an arrested person in India?"
    print(f"Testing with query: {query}")
    
    initial_state = AgentState(
        messages=[],
        original_query=query,
        law_context=[],
        case_context=[],
        errors=[]
    )
    
    try:
        result = app.invoke(initial_state)
        print("\n✅ WORKFLOW SUCCESS")
        print("Final Answer Length:", len(result.get("final_answer", "")))
        print("Initial sub-queries:", result.get("law_query"), "|", result.get("case_query"))
    except Exception as e:
        print(f"\n❌ WORKFLOW FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
