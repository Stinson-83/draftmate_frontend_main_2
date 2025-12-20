import os
import google.generativeai as genai
from google.generativeai  import types
from dotenv import load_dotenv
from web_search import web_search_tool
load_dotenv()

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LLM_MODEL = "gemini-2.5-flash"
NO_CHANGES_MSG = "No significant suggestions"

# Initialize Client
client = None
try:
    if GEMINI_API_KEY :
        genai.configure(api_key=GEMINI_API_KEY)
        print("Gemini client initialized.")
except Exception as e:
    print(f"Warning: Client init failed ({e}). Using mock mode.")

def enhance_clause(selected_text: str, case_context: str) -> str:
    """
    Analyzes a legal clause and returns a revision suggestion or 'No significant suggestions'.
    """
    # 1. Handle Mock/Fallback Mode
    if not GEMINI_API_KEY:
        if "governing law" in selected_text.lower() and "Delaware" in case_context:
            return NO_CHANGES_MSG
        return "Revised clause based on mock logic."

    # 2. Construct Prompt
    system_instruction = f"""
    You are an expert Senior Legal Editor. Your task is to ENHANCE the 'Input Clause' based on the provided Case Context..

    INPUT DATA:
    1. Case Context: The facts and background of the case.

    Your Goal: Use the Case Context to find specific legal terminology, relevant sections, or standard phrasing. Rewrite the Input Clause to be more professional, legally precise, and impactful.

    STRICT OUTPUT RULES:
    1. Output ONLY the enhanced version of the text.
    2. Do NOT provide explanations, preambles, or quotes.
    3. The output must be a direct replacement for the input text.
    4. If the text is already perfect, return it exactly as is.
    """
    
    contents = f"""
    Contexts:
    - Case_context: {case_context}
    
    Input Clause: {selected_text}
    """

    # 3. Call API
    try:
        
        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )

        response = model.generate_content(
            contents=[contents],
            generation_config={
                "temperature": 0.1,
                "max_output_tokens": 512
            },
            safety_settings={
                types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
            }
        )
        try:
            result = response.text.strip()
            # Ensure we match the "No significant suggestions" format strictly if close
            if result.lower() == NO_CHANGES_MSG.lower() or "no changes" in result.lower():
                return NO_CHANGES_MSG
            return result
        except ValueError:
            return "Unable to enhance text due to safety filters."

    except Exception as e:
        return f"Error: {e}"

def enhance_content(selected_text: str, user_context: str) -> str:
    """
    Enhances the overall content of the legal draft based on user_context.
    CRITICAL: Must strictly preserve all placeholders like [Date], [Name], etc.
    """
    if not GEMINI_API_KEY:
        return "Enhancement unavailable: Mock mode active."

    system_instruction = f"""
    You are an Expert Legal Editor. Your task is to ENHANCE the entire document content based on the User Context.
    
    USER CONTEXT: {user_context}

    STRICT GUIDELINES:
    1. **Preserve Placeholders**: You must NOT change, remove, or fill in any placeholders (e.g., [Date], [Name of Party], [Amount]). They must remain exactly as they are.
    2. **Improve Quality**: Make the language more professional, legally sound, and coherent. Fix grammar and flow.
    3. **Consistency**: Ensure terminology is consistent throughout.
    4. **Output**: Return ONLY the enhanced full text. No conversational filler.
    """

    contents = f"""
    Input Document Content:
    {selected_text}
    """

    try:
        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )

        response = model.generate_content(
            contents=[contents],
            generation_config={
                "temperature": 0.3, # Slightly higher for creative flow but still low for precision
                "max_output_tokens": 2048 # Increased token limit for full documents
            },
            safety_settings={
                types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
            }
        )
        try:
            return response.text.strip()
        except ValueError:
             return "Unable to enhance content due to safety filters."

    except Exception as e:
        return f"Error: {e}"

# def get_legal_context_from_web(case_context: str) -> str:
#     prompt="""
#     Case Context: {case_context}
    
#     Task: Identify the specific Act, Section, or Legal Topic most relevant to this case context for a web search.
    
#     STRICT OUTPUT RULES:
#     1. Output ONLY a single search query (e.g., "Indian Penal Code Section 302 details", "Arbitration Act 1996 appointment of arbitrator").
#     2. Do not explain.
#     """   

#     model = genai.GenerativeModel(
#             model_name=LLM_MODEL,
#             system_instruction=prompt
#     )

#     response = model.generate_content(
#             contents=case_context,
#             generation_config={
#                 "temperature": 0.1,
#                 "max_output_tokens": 64
#             },
#             safety_settings={
#                 types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
#                 types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
#                 types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
#                 types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
#             }
#         )
    
#     try:
#         search_query = response.text.strip()
#     except ValueError:
#         print("Warning: Model blocked response. Using fallback query.")
#         search_query = "Indian Penal Code relevant section"
#     print(f"DEBUG: Searching web for: {search_query}")
#     web_context, _ = web_search_tool.run(search_query)
#     return web_context

# --- EXAMPLE USAGE ---
if __name__ == "__main__":
    selected_text= "That the Applicant was arrested on [Date of arrest] and has been in judicial custody since [Date when judicial custody began]. The Applicant is currently"
    case_context= """dated [Date of FIR registration], registered at Police Station [Name of Police Station], under Sections [Relevant Sections of Law, e.g., 302, 307, 323, 34 of IPC] of the [Name of Act, e.g., Indian Penal Code, 1860]. 

                    2. That the Applicant was arrested on [Date of arrest] and has been in judicial custody since [Date when judicial custody began]. The Applicant is currently lodged in [Name of Jail/Custodial Institution]. 

                    3. hat the allegations levelled against the Applicant are false, fabricated, and motivated by . The Applicant has not committed any offence as alleged in the FIR. """
    # Step 1: Get Context from Web
    # web_context_data = get_legal_context_from_web(case_context)
    # print(f"DEBUG: Web Context Length: {len(web_context_data)}")
    
    # Step 2: Enhance Text using that context
    # enhanced_text = legal_drafting_assistant(selected_text, case_context, web_context_data)
    # print("\n--- ENHANCED TEXT ---\n")
    # print(enhanced_text)

    test_content = "The applicant was arrested on [Date]. He is innocent. The police station is [Station Name]."
    test_context = "Bail Application for a theft case."
    
    print("--- Original ---")
    print(test_content)
    print("\n--- Enhanced ---")
    print(enhance_content(test_content, test_context))
