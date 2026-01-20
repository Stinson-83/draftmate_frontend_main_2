import sys
import os
import time

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bot import enhance_clause

print("Starting reproduction test...")

selected_text = "The applicant was arrested on [Date]. He is innocent."
case_context = "Bail Application for a theft case."
user_prompt = "Make it stronger."

start_time = time.time()
try:
    print("Calling enhance_clause...")
    result = enhance_clause(
        selected_text=selected_text,
        case_context=case_context,
        user_prompt=user_prompt,
        use_web_search=False,
        preset="stronger",
        suggest_only=False
    )
    print(f"Result: {result}")
except Exception as e:
    print(f"Error: {e}")
finally:
    print(f"Time taken: {time.time() - start_time:.2f}s")
