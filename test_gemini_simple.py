import os
import google.generativeai as genai
from dotenv import load_dotenv
import time

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment")
    exit(1)

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.5-flash")

print("Attempting to generate content...")
start_time = time.time()
try:
    response = model.generate_content("Say hello", request_options={"timeout": 30})
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
finally:
    print(f"Time taken: {time.time() - start_time:.2f}s")
