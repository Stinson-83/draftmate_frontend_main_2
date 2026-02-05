import os
import json
import logging
import google.generativeai as genai
from google.generativeai import types
from google.api_core import exceptions
import time
from dotenv import load_dotenv
from web_search import web_search_tool

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LLM_MODEL = "gemini-2.5-flash"
NO_CHANGES_MSG = "No significant suggestions"

# --- ENHANCEMENT PRESETS ---
ENHANCEMENT_PRESETS = {
    "stronger": {
        "name": "Stronger",
        "prompt": "Make the language more assertive, persuasive, and impactful. Use stronger verbs and more decisive phrasing."
    },
    "concise": {
        "name": "Concise",
        "prompt": "Shorten and tighten the language significantly. Remove redundant words while preserving all legal meaning."
    },
    "formal": {
        "name": "Formal",
        "prompt": "Make the language more formal, professional, and suitable for court submissions. Use proper legal terminology."
    },
    "citations": {
        "name": "Citations",
        "prompt": "Where appropriate, suggest relevant legal citations, case references, statutory provisions, or legal principles that support the argument."
    }
}

# --- SECTION DETECTION ---
# Comprehensive keywords for detecting legal document sections
# Only applies section-specific enhancement if a section is detected
SECTION_KEYWORDS = {
    "title": [
        "in the court of", "in the high court", "in the supreme court", 
        "before the", "hon'ble", "honourable", "criminal case", "civil case",
        "writ petition", "special leave petition", "criminal appeal", "civil appeal",
        "arbitration petition", "company petition", "original jurisdiction"
    ],
    "facts": [
        "that the applicant", "that the petitioner", "that the accused",
        "that on", "dated", "fir no", "fir bearing", "police station",
        "was arrested", "was registered", "occurred on", "took place",
        "the brief facts", "facts of the case", "factual matrix",
        "it is submitted that", "the complainant", "the deceased"
    ],
    "grounds": [
        "grounds for", "ground no", "because", "submitted that",
        "contended that", "argued that", "it is humbly submitted",
        "on the ground", "grounds of appeal", "grounds of revision",
        "without prejudice", "in the alternative", "further submitted",
        "the learned", "trial court erred", "lower court failed"
    ],
    "prayer": [
        "prayer", "relief sought", "reliefs claimed", "wherefore",
        "in light of the above", "humbly prays", "respectfully prays",
        "this hon'ble court may", "be pleased to", "grant bail",
        "set aside", "quash", "stay", "direct the respondent",
        "pass such other order", "deemed fit and proper"
    ],
    "verification": [
        "verification", "verified at", "solemnly affirm", "solemnly declare",
        "true to my knowledge", "true and correct", "belief and information",
        "on oath", "deponent", "verifier", "sworn before"
    ],
    "arguments": [
        "legal submissions", "arguments advanced", "it is well settled",
        "the hon'ble supreme court", "held in", "observed in",
        "ratio decidendi", "precedent", "binding authority",
        "constitution of india", "article", "section", "under section"
    ]
}

SECTION_PROMPTS = {
    "title": "This is a document title/caption. Ensure proper legal formatting, court names, and case details are accurate and professionally presented.",
    "facts": "This is the FACTS section. Keep the language precise, factual, and chronological. Avoid argumentative language. Focus on clarity and accuracy of events, dates, and persons involved.",
    "grounds": "This is the GROUNDS/ARGUMENTS section. Make the language persuasive and assertive. Strengthen legal arguments. Use compelling language to support the case.",
    "prayer": "This is the PRAYER/RELIEF section. Use formal legal language for requesting relief. Ensure the reliefs sought are clearly and precisely stated.",
    "verification": "This is the VERIFICATION section. Use standard legal verification language. Keep it formal and in the required legal format.",
    "arguments": "This is the LEGAL ARGUMENTS section. Strengthen citations, legal principles, and precedents. Make arguments more compelling and legally sound."
}

# --- LEGAL DICTIONARY ---
# Load once at startup for efficiency
LEGAL_DICTIONARY = []
LEGAL_TERMS_INDEX = {}  # Quick lookup by lowercase term

def _load_legal_dictionary():
    """Load the legal dictionary JSON file."""
    global LEGAL_DICTIONARY, LEGAL_TERMS_INDEX
    try:
        dict_path = os.path.join(os.path.dirname(__file__), "legal_dictionary.json")
        with open(dict_path, "r", encoding="utf-8") as f:
            LEGAL_DICTIONARY = json.load(f)
        
        # Build index for quick lookup (strip asterisks from terms)
        for entry in LEGAL_DICTIONARY:
            term = entry.get("Word", "").replace("*", "").strip().lower()
            if term:
                LEGAL_TERMS_INDEX[term] = entry.get("Meaning", "")
        
        print(f"Legal dictionary loaded: {len(LEGAL_DICTIONARY)} terms")
    except Exception as e:
        logger.error(f"Failed to load legal dictionary: {e}")
        print(f"Legal dictionary load failed: {e}")

_load_legal_dictionary()

def get_relevant_latin_terms(text: str, case_context: str, limit: int = 10) -> str:
    """
    Find Latin legal terms relevant to the given text and context.
    Returns a formatted string of terms with meanings.
    """
    if not LEGAL_DICTIONARY:
        return ""
    
    # Common legal concepts to match
    concept_mappings = {
        "beginning": ["ab initio"],
        "start": ["ab initio"],
        "good faith": ["bona fide"],
        "bad faith": ["mala fide"],
        "from the start": ["ab initio"],
        "jurisdiction": ["forum non conveniens", "in personam", "in rem"],
        "contract": ["consensus ad idem", "pacta sunt servanda", "quid pro quo"],
        "evidence": ["prima facie", "res ipsa loquitur", "corpus delicti"],
        "court": ["amicus curiae", "in camera", "ex parte"],
        "person": ["in personam", "per se"],
        "thing": ["in rem", "res"],
        "law": ["de jure", "de facto", "lex loci"],
        "time": ["ex ante", "ex post", "nunc pro tunc"],
        "innocent": ["presumption of innocence", "actus reus", "mens rea"],
        "guilty": ["actus reus", "mens rea", "mala fide"],
        "liability": ["res ipsa loquitur", "respondeat superior"],
        "bail": ["habeas corpus", "in custodia legis"],
        "arrest": ["habeas corpus", "in custodia legis"],
        "custody": ["habeas corpus", "in custodia legis"],
        "property": ["in rem", "bona vacantia", "res nullius"],
        "intent": ["mens rea", "animus contrahendi", "animus nocendi"],
        "void": ["ab initio", "void ab initio", "ultra vires"],
        "death": ["in articulo mortis", "donatio mortis causa"],
        "will": ["animus testandi", "testator"],
        "arbitration": ["ad hoc", "in personam"],
        "appeal": ["certiorari", "a quo", "ad quem"],
        "injunction": ["status quo", "in terrorem"],
    }
    
    combined_text = (text + " " + case_context).lower()
    relevant_terms = set()
    
    # Find matching concepts
    for concept, terms in concept_mappings.items():
        if concept in combined_text:
            relevant_terms.update(terms)
    
    # Look up actual definitions
    result_terms = []
    for term in relevant_terms:
        term_lower = term.lower()
        if term_lower in LEGAL_TERMS_INDEX:
            meaning = LEGAL_TERMS_INDEX[term_lower]
            result_terms.append(f"- {term}: {meaning}")
    
    # Limit results
    result_terms = result_terms[:limit]
    
    if result_terms:
        return "\n".join(result_terms)
    return ""

def get_web_legal_context(case_context: str, selected_text: str) -> str:
    """
    Fetch legal context from web search based on the case context.
    Returns scraped content from relevant legal sources.
    """
    try:
        # Build a focused search query
        search_query = f"Indian law {case_context[:200]}"
        
        print(f"Web search: {search_query[:100]}...")
        
        # Use web_search_tool with Indian legal domains
        legal_domains = ["indiankanoon.org", "scconline.com", "livelaw.in", "barandbench.com"]
        context, results = web_search_tool.run(search_query, domains=legal_domains)
        
        # Limit context to avoid token overflow
        if context and len(context) > 2000:
            context = context[:2000] + "..."
        
        if context:
            print(f"Web context fetched: {len(context)} chars")
            return context
        else:
            print("No web context found")
            return ""
            
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        print(f"Web search error: {e}")
        return ""

def detect_section_type(text: str, context: str) -> str:
    """
    Detect the type of legal document section based on keywords.
    Returns None if no section is detected (skips section-aware enhancement).
    """
    combined = (text + " " + context).lower()
    
    # Count matches for each section type
    section_scores = {}
    for section, keywords in SECTION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in combined)
        if score > 0:
            section_scores[section] = score
    
    # Return the section with highest score, or None if no matches
    if section_scores:
        best_section = max(section_scores, key=section_scores.get)
        # Only return if we have at least 2 keyword matches for confidence
        if section_scores[best_section] >= 2:
            print(f"Section detected: {best_section} (score: {section_scores[best_section]})")
            return best_section
    
    return None  # No section detected, skip section-aware enhancement

# --- GEMINI INITIALIZATION ---
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        print("Gemini client initialized.")
except Exception as e:
    print(f"Gemini client init failed ({e}). Using mock mode.")

def enhance_clause(
    selected_text: str, 
    case_context: str, 
    user_prompt: str = None, 
    use_web_search: bool = False,
    preset: str = None,
    suggest_only: bool = False
) -> dict:
    """
    Analyzes a legal clause and returns an enhanced version.
    
    Args:
        selected_text: The clause/text to enhance
        case_context: Context about the case/document
        user_prompt: Optional user instructions
        use_web_search: If True, fetch additional legal context from web
        preset: Enhancement preset (stronger, concise, formal, citations)
        suggest_only: If True, return both original and enhanced for diff preview
    
    Returns:
        If suggest_only=False: Enhanced text string
        If suggest_only=True: Dict with 'original', 'enhanced', 'section_detected'
    """
    # 1. Handle Mock/Fallback Mode
    if not GEMINI_API_KEY:
        if suggest_only:
            return {"original": selected_text, "enhanced": "Mock enhanced text", "section_detected": None}
        return "Revised clause based on mock logic."

    # 2. Build additional instructions from preset
    preset_instruction = ""
    if preset and preset in ENHANCEMENT_PRESETS:
        preset_instruction = f"\n\nPRESET INSTRUCTION: {ENHANCEMENT_PRESETS[preset]['prompt']}"
        print(f"Using preset: {preset}")

    # 3. Detect section type (only applies if detected)
    section_type = detect_section_type(selected_text, case_context)
    section_instruction = ""
    if section_type and section_type in SECTION_PROMPTS:
        section_instruction = f"\n\nSECTION CONTEXT: {SECTION_PROMPTS[section_type]}"

    # 4. Get relevant Latin terms
    latin_terms = get_relevant_latin_terms(selected_text, case_context)
    latin_section = ""
    if latin_terms:
        latin_section = f"""

LATIN LEGAL TERMS (use only if naturally appropriate):
{latin_terms}
"""

    # 5. Get web context if requested
    web_context = ""
    if use_web_search:
        web_data = get_web_legal_context(case_context, selected_text)
        if web_data:
            web_context = f"""

LEGAL REFERENCE CONTEXT (from web research):
{web_data[:1500]}
"""
    
    # 6. Construct Enhanced Prompt
    system_instruction = f"""You are an expert Senior Legal Editor specializing in Indian law. Your task is to ENHANCE the 'Input Clause' based on the provided context and instructions.

INPUT DATA:
1. Case Context: Background information about the case/document.
2. User Instructions: Specific enhancement directions from the user.
{preset_instruction}{section_instruction}{latin_section}{web_context}

YOUR GOAL: 
- Rewrite the Input Clause to be more professional, legally precise, and impactful
- Follow any preset or section-specific instructions provided
- Ensure the language is suitable for court submissions or legal documents

IMPORTANT RULES:
- Use Latin terms ONLY when they naturally fit
- Do NOT force Latin terms into every sentence
- Output ONLY the enhanced text, no explanations
- Do NOT wrap output in quotes or markdown
- If text is already perfect, return it as is"""
    
    contents = f"""Contexts:
- Case Context: {case_context}
- User Instructions: {user_prompt if user_prompt else "Enhance for clarity and legal impact"}
    
Input Clause: {selected_text}"""

    # 7. Call Gemini API
    try:
        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )

        # Retry logic for 504/Timeout errors
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    contents=[contents],
                    generation_config={
                        "temperature": 0.1,
                        "max_output_tokens": 512 * 4
                    },
                    safety_settings={
                        types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
                    },
                    request_options={"timeout": 60}  # Explicit 60s timeout
                )
                break # Success
            except exceptions.DeadlineExceeded:
                if attempt < max_retries - 1:
                    print(f"Gemini 504 Deadline Exceeded. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2 # Exponential backoff
                else:
                    raise # Re-raise on last attempt
            except Exception as e:
                # For other errors, we might not want to retry or handle differently
                # But for now, let's just re-raise to be safe unless it's clearly transient
                if "504" in str(e) or "deadline" in str(e).lower():
                     if attempt < max_retries - 1:
                        print(f"Gemini Error {e}. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                     else:
                        raise
                else:
                    raise
        
        try:
            result = response.text.strip()
            # Clean up common LLM artifacts
            if result.startswith('"') and result.endswith('"'):
                result = result[1:-1]
            if result.startswith("'") and result.endswith("'"):
                result = result[1:-1]
            
            # Check for no-op response
            if result.lower() == NO_CHANGES_MSG.lower() or "no changes" in result.lower():
                result = selected_text  # Return original if no changes
            
            print(f"Enhancement complete: {len(result)} chars")
            
            # Return appropriate format based on suggest_only
            if suggest_only:
                return {
                    "original": selected_text,
                    "enhanced": result,
                    "section_detected": section_type
                }
            return result
            
        except ValueError:
            error_msg = "Unable to enhance text due to safety filters."
            if suggest_only:
                return {"original": selected_text, "enhanced": error_msg, "section_detected": None}
            return error_msg

    except Exception as e:
        logger.error(f"Enhance Clause Error: {e}")
        with open("error.log", "a") as f:
            f.write(f"Enhance Clause Error: {str(e)}\n")
        error_msg = f"Error: {e}"
        if suggest_only:
            return {"original": selected_text, "enhanced": error_msg, "section_detected": None}
        return error_msg

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
    2. **Preserve HTML Structure**: The input is HTML. You MUST return valid HTML. Do NOT strip tags, classes, or styles. Keep the structure exactly as is.
    3. **Improve Quality**: Make the language more professional, legally sound, and coherent. Fix grammar and flow.
    4. **Consistency**: Ensure terminology is consistent throughout.
    5. **Output**: Return ONLY the enhanced full HTML content. No markdown formatting (no ```html ... ```).
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

        # Retry logic for enhance_content
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = model.generate_content(
                    contents=[contents],
                    generation_config={
                        "temperature": 0.3, 
                        "max_output_tokens": 8192 
                    },
                    safety_settings={
                        types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_HARASSMENT: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: types.HarmBlockThreshold.BLOCK_NONE,
                        types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: types.HarmBlockThreshold.BLOCK_NONE,
                    },
                    request_options={"timeout": 90} # Longer timeout for full content
                )
                break
            except exceptions.DeadlineExceeded:
                if attempt < max_retries - 1:
                    print(f"Gemini 504 (Content). Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    raise
            except Exception as e:
                if "504" in str(e) or "deadline" in str(e).lower():
                     if attempt < max_retries - 1:
                        print(f"Gemini Error {e}. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                     else:
                        raise
                else:
                    raise
        try:
            res_text = response.text.strip()
            print(f"DEBUG: Enhance Response (First 500 chars): {res_text[:500]}")
            return res_text
        except ValueError:
             print("DEBUG: Enhance blocked by safety filters.")
             return "Unable to enhance content due to safety filters."

    except Exception as e:
        with open("error.log", "a") as f:
            f.write(f"Enhance Content Error: {str(e)}\n")
        return f"Error: {e}"

from bs4 import BeautifulSoup

def create_placeholders(html_content: str) -> str:
    """
    Identifies legal variables using Gemini and prepares spans 
    for the React Blueprint Layout Engine.
    """
    if not GEMINI_API_KEY:
        return html_content

    try:
        # Use html.parser to avoid forced <html>/<body> wrapping
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Target spans with absolute positioning (standard PDF-to-HTML fragments)
        spans = [s for s in soup.find_all('span') if s.get('style') and 'absolute' in s.get('style', '')]
        
        if not spans:
            return html_content

        # 1. Prepare JSON payload for the LLM
        payload = [{"id": i, "text": s.get_text()} for i, s in enumerate(spans)]
        
        system_instruction = """
        You are a Legal Document Formatter specialized in creating placeholder templates.

        TASK: Replace specific entity values and visual blanks with standardized placeholders while preserving ALL other content EXACTLY as written.

        ENTITIES TO REPLACE:
        - Names (people, companies, parties)
        - Dates (any format)
        - Monetary amounts
        - Addresses and locations
        - Contact info (email, phone)
        - ID numbers (registration, license, etc.)
        - Visual blanks: _______ or ......... or similar

        PLACEHOLDER FORMAT:
        Use descriptive UPPERCASE labels in square brackets:
        [PARTY 1 NAME], [PARTY 2 NAME], [DATE], [AMOUNT], [ADDRESS], [COMPANY NAME], [EMAIL], [PHONE], [ID NUMBER], etc.

        EXAMPLES:

        Input: "Agreement dated 15th March 2024 between Acme Corp and John Smith for Rs. 50,000/-"
        Output: "Agreement dated [DATE] between [COMPANY NAME] and [PARTY NAME] for Rs. [AMOUNT]/-"

        Input: "Signed at _________________ on _________________"
        Output: "Signed at [LOCATION] on [DATE]"

        Input: "Contact: john.doe@email.com or call 555-123-4567"
        Output: "Contact: [EMAIL] or call [PHONE]"

        CRITICAL RULES:
        1. Return EXACTLY in format: "ID_{number}: {processed_text}"
        2. Each ID must appear exactly once
        3. Maintain 1-to-1 mapping - do NOT merge or skip lines
        4. If a line has no entities, return it UNCHANGED
        5. Preserve ALL: grammar, punctuation, spacing, line breaks, formatting, boilerplate text
        6. NEVER use angle brackets < > or HTML tags
        7. NEVER rephrase or "fix" the original text
        8. Only the entity values themselves should become placeholders - nothing else

        OUTPUT FORMAT (JSON ARRAY):
        [
            {"id": 0, "text": "Agreement dated [DATE]..."},
            {"id": 1, "text": "Signed at [LOCATION]..."}
        ]
        """

        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )

        # 2. Generate placeholders
        response = model.generate_content(
            contents=[json.dumps(payload)],
            generation_config={
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        )
        
        try:
            processed_data = json.loads(response.text)
            
            # Robust parsing: Handle List vs Dict usage
            param_map = {}
            if isinstance(processed_data, list):
                # Expected format: [{"id": 0, "text": "Code"}, ...]
                for item in processed_data:
                    if isinstance(item, dict) and 'id' in item and 'text' in item:
                        param_map[item['id']] = item['text']
            elif isinstance(processed_data, dict):
                # Fallback format: {"0": "Text", "1": "Text"} or {"ID_0": "Text"}
                for key, val in processed_data.items():
                    # extract numeric ID
                    clean_key = key.lower().replace('id_', '').replace('id', '')
                    if clean_key.isdigit():
                        param_map[int(clean_key)] = val
        except Exception as e:
            print(f"JSON Parsing Error in placeholders: {e}")
            return html_content

        # 3. Re-inject and add Layout Engine metadata
        for i, span in enumerate(spans):
            if i in param_map:
                span.string = param_map[i]
            
            # CRITICAL: Add class for the React collision engine
            classes = span.get('class', [])
            if 'content-element' not in classes:
                span['class'] = classes + ['content-element']
            
            # Ensure the browser treats absolute spans as editable blocks
            span['contenteditable'] = 'true'

        return str(soup)

    except Exception as e:
        print(f"Error in create_placeholders: {e}")
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
