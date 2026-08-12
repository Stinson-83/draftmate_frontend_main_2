import os
from dotenv import load_dotenv
load_dotenv()

print(f"GOOGLE: {'Set' if os.getenv('GOOGLE_API_KEY') else 'Missing'}")
print(f"OPENAI: {'Set' if os.getenv('OPENAI_API_KEY') else 'Missing'}")
print(f"TAVILY: {'Set' if os.getenv('TAVILY_API_KEY') else 'Missing'}")
