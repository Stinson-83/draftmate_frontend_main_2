import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

try:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=os.getenv("GOOGLE_API_KEY"))
    res = llm.invoke("Hello")
    print(f"Success: {res.content}")
except Exception as e:
    print(f"Error: {e}")
