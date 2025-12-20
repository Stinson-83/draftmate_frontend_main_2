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
        
        print(f"DEBUG: Calling enhance_content with context: {user_context}")
        print(f"DEBUG: Input text length: {len(selected_text)}")

        response = model.generate_content(
            contents=[contents],
            generation_config={
                "temperature": 0.3, 
                "max_output_tokens": 8192 # Max for Flash to ensure full document return
            },
            safety_settings={
                types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
            }
        )
        try:
            res_text = response.text.strip()
            print(f"DEBUG: Enhance Response (First 500 chars): {res_text[:500]}")
            return res_text
        except ValueError:
             print("DEBUG: Enhance blocked by safety filters.")
             return "Unable to enhance content due to safety filters."

    except Exception as e:
        return f"Error: {e}"

def create_placeholders(html_content: str) -> str:
    """
    Parses HTML, finds content spans, and uses LLM to replace specific entity details with [Placeholders].
    """
    if not GEMINI_API_KEY:
        return html_content # Mock mode: return as is or implement simple regex mock

    try:
        from bs4 import BeautifulSoup
        # User requested strictly preserving style/attributes. 'lxml' is robust for this.
        soup = BeautifulSoup(html_content, 'lxml')
        
        # Target spans based on user description and common PDF-to-HTML output
        # Targeting 'content-element', 'text-span', or spans with absolute positioning
        spans = soup.find_all('span', class_=lambda x: x and ('content-element' in x or 'text-span' in x))
        
        print(f"DEBUG: Found {len(spans)} spans with class filter.")

        if not spans:
             # Fallback: try finding any span with styles (generic) if class not found
            spans = [s for s in soup.find_all('span') if s.get('style') and 'absolute' in s.get('style', '')]
            print(f"DEBUG: Found {len(spans)} spans with style fallback.")

        if not spans:
            print("DEBUG: No spans found. Returning original HTML.")
            return html_content

        # Extract text to send to LLM
        texts = [s.get_text() for s in spans]
        print(f"DEBUG: Sample extracted text: {texts[:5]}")
        
        # We can't send infinite text, so we might need to batch if huge, 
        # but for typical docs, sending a list of strings is efficient.
        # We format it as a numbered list to keep track.
        
        input_text_block = "\n".join([f"ID_{i}: {text}" for i, text in enumerate(texts)])

        system_instruction = """
        You are a Legal Document Formatter. 
        Task: Identify specific variable details in the provided text segments. These can be:
        1. Specific entity values (Names, Dates, Locations, Amounts).
        2. Visual placeholders like long underscores (_______) or dots (.........) representing missing info.

        Replace them with standard UPPERCASE placeholders in square brackets.
        
        Example 1 (Values): 
        Input: "This Agreement is made on 12th January 2024 between John Doe and Jane Smith."
        Output: "This Agreement is made on [DATE] between [PARTY 1 NAME] and [PARTY 2 NAME]."

        Example 2 (Blanks):
        Input: "I pay a sum of Rs........................./- to Mr.........................."
        Output: "I pay a sum of Rs [AMOUNT] /- to Mr [NAME]"

        STRICT RULES:
        1. ONLY change the specific entity values or blank lines to placeholders. Leave all legal boilerplate, grammar, and structure EXACTLY as is.
        2. Use placeholders like: [DATE], [NAME], [AMOUNT], [ADDRESS], [COMPANY NAME].
        3. Return the output in the EXACT format: "ID_{i}: {processed_text}"
        4. Do not merge lines. Maintain 1-to-1 mapping.
        """

        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )

        response = model.generate_content(
            contents=[input_text_block],
            generation_config={"temperature": 0.1},
            safety_settings={
                types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
            }
        )
        
        try:
            result_text = response.text.strip()
            print(f"DEBUG: LLM Response (First 200 chars): {result_text[:200]}")
            # Parse results
            param_map = {}
            for line in result_text.split('\n'):
                if line.startswith("ID_") and ":" in line:
                    parts = line.split(":", 1)
                    idx_str = parts[0].replace("ID_", "").strip()
                    content = parts[1].strip()
                    if idx_str.isdigit():
                        param_map[int(idx_str)] = content
            
            # Update HTML
            for i, span in enumerate(spans):
                if i in param_map:
                    # Only update if the LLM returned a valid mapping, otherwise keep original
                    span.string = param_map[i]
            
            return str(soup)

        except ValueError:
            print("DEBUG: ValueError processing LLM response (possibly blocked).")
            return html_content # Fail safe

    except Exception as e:
        print(f"Error in create_placeholders: {e}")
        import traceback
        traceback.print_exc()
        return html_content

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
