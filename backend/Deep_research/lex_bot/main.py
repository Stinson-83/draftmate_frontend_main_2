import sys
import os

# Ensure parent dir is in path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.dirname(current_dir))

from lex_bot.graph import app
from lex_bot.state import AgentState

def main():
    print("⚖️  Indian Law Research Bot (Agentic Mode) Initialized")
    print("-----------------------------------------------------")
    
    while True:
        query = input("\nEnter your legal query (or 'exit'): ").strip()
        if query.lower() in ['exit', 'quit']:
            break
        
        if not query:
            continue
            
        print("\n🚀 Starting Agent Workflow...\n")
        
        initial_state = AgentState(
            messages=[],
            original_query=query,
            law_context=[],
            case_context=[],
            errors=[]
        )
        
        try:
            result = app.invoke(initial_state)
            
            print("\n" + "="*50)
            print("📝 FINAL ANSWER")
            print("="*50 + "\n")
            print(result.get("final_answer", "No answer generated."))
            
        except Exception as e:
            print(f"\n❌ Error in workflow: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
