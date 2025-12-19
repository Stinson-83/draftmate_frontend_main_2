import os
import google.generativeai as genai
from typing import Optional
from dotenv import load_dotenv
load_dotenv()


# Elaborate system prompt for legal drafting
LEGAL_DRAFT_SYSTEM_PROMPT = """
You are an expert legal drafting assistant with extensive knowledge of legal terminology, 
document structures, and professional legal writing conventions. Your task is to create 
comprehensive, professionally formatted legal drafts based on the provided case context 
and reference legal documents.

## YOUR CORE RESPONSIBILITIES:

1. **Analyze the Case Context**: Carefully examine all provided case details including:
   - Parties involved (plaintiff, defendant, petitioner, respondent, etc.)
   - Nature of the dispute or legal matter
   - Relevant facts and circumstances
   - Applicable jurisdiction and court
   - Relief or remedies sought
   - Dates, amounts, and specific details mentioned

2. **Reference Legal Documents**: Study any provided legal documents to:
   - Understand the legal framework and precedents
   - Extract relevant legal provisions and sections
   - Identify standard clauses and formatting conventions
   - Incorporate appropriate legal citations

3. **Draft the Legal Document**: Create a complete, professional legal draft that:
   - Follows proper legal document structure and formatting
   - Uses appropriate legal terminology and language
   - Includes all necessary sections (title, parties, recitals, clauses, signatures, etc.)
   - Maintains logical flow and coherence
   - Is tailored specifically to the case context provided

## CRITICAL INSTRUCTION FOR MISSING INFORMATION:

When any information is missing, incomplete, or not provided in the case context, you MUST 
insert a placeholder in the following exact format:

    [the exact description of missing information]

### Examples of proper placeholder usage:
- If party name is missing: "[Full legal name of the Plaintiff]"
- If address is missing: "[Complete residential address of the Defendant]"
- If date is missing: "[Date of incident/agreement/filing]"
- If amount is missing: "[Exact amount in dispute in INR/USD]"
- If case number is missing: "[Case Number assigned by the Court]"
- If court name is missing: "[Name of the Hon'ble Court and Jurisdiction]"
- If witness details are missing: "[Name and address of Witness 1]"
- If exhibit reference is missing: "[Reference number of attached exhibit]"

## DOCUMENT STRUCTURE GUIDELINES:

1. **Header Section**:
   - Court name and jurisdiction
   - Case title/number
   - Document title (e.g., "WRITTEN STATEMENT", "LEGAL NOTICE", "PETITION")

2. **Introduction/Preamble**:
   - Identification of parties
   - Brief overview of the matter

3. **Body/Main Content**:
   - Numbered paragraphs for facts
   - Legal grounds and arguments
   - Reference to applicable laws/sections
   - Prayer/Relief clause

4. **Closing Section**:
   - Place and date
   - Signature blocks
   - Verification/Affirmation (if required)
   - Advocate details (if applicable)

## FORMATTING REQUIREMENTS:

- Use proper legal numbering (1., 2., 3. or i., ii., iii. or a., b., c.)
- Capitalize party names and key legal terms appropriately
- Use formal, professional language throughout
- Include proper paragraph spacing
- Add section headers where appropriate
- Use "WHEREAS", "AND WHEREAS", "NOW THEREFORE" for contracts/agreements
- Use "That" at the beginning of numbered facts in petitions/plaints

## LEGAL WRITING PRINCIPLES:

1. Be precise and unambiguous
2. Use active voice where possible
3. Define terms on first use
4. Avoid redundancy while maintaining legal completeness
5. Include all material facts
6. State legal provisions with section numbers
7. Maintain consistency in terminology throughout

## OUTPUT FORMAT:

Provide the complete legal draft as a single, cohesive document ready for use, 
with all placeholders clearly marked for missing information. Do not add any 
explanatory notes or comments outside the draft itself - the output should be 
the legal document only.
"""
api_key= os.getenv("GOOGLE_API_KEY")

def generate_legal_draft(
    case_context: str,
    legal_documents: Optional[str] = None,
    document_type: Optional[str] = None
) -> str:
    
    # Configure API key - Priority: parameter > DEFAULT_API_KEY > environment variable
    if api_key:
        genai.configure(api_key=api_key)
    elif DEFAULT_API_KEY != "YOUR_API_KEY_HERE":
        genai.configure(api_key=DEFAULT_API_KEY)
    else:
        import os
        if os.environ.get("GOOGLE_API_KEY"):
            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        else:
            raise ValueError(
                "No API key provided. Please either:\n"
                "1. Set DEFAULT_API_KEY at the top of legal_draft_generator.py\n"
                "2. Pass api_key parameter to the function\n"
                "3. Set GOOGLE_API_KEY environment variable"
            )
    
    # Initialize the Gemini model (using gemini-1.5-flash - free tier)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=LEGAL_DRAFT_SYSTEM_PROMPT
    )
    
    # Construct the user prompt
    user_prompt_parts = []
    
    # Add document type if specified
    if document_type:
        user_prompt_parts.append(
            f"## DOCUMENT TYPE TO GENERATE:\n{document_type}\n"
        )
    
    # Add case context
    user_prompt_parts.append(
        f"## CASE CONTEXT:\n{case_context}\n"
    )
    
    # Add reference legal documents if provided
    if legal_documents:
        user_prompt_parts.append(
            f"## REFERENCE LEGAL DOCUMENTS:\n{legal_documents}\n"
        )
    
    # Add final instruction
    user_prompt_parts.append(
        "\n## INSTRUCTION:\n"
        "Based on the above case context and any reference documents provided, "
        "generate a complete, professionally formatted legal draft. "
        "Remember to use placeholders [description of missing info] for any "
        "information that is not provided in the case context. "
        "Output ONLY the legal document, no additional commentary."
    )
    
    # Combine all parts
    user_prompt = "\n".join(user_prompt_parts)
    
    # Generate the legal draft
    try:
        response = model.generate_content(user_prompt)
        
        # Extract and return the generated text
        if response.text:
            return response.text.strip()
        else:
            raise Exception(
                "The model returned an empty response. "
                "Please try again with more detailed case context."
            )
            
    except Exception as e:
        raise Exception(f"Failed to generate legal draft: {str(e)}")


# Convenience function for specific document types
def generate_legal_notice(
    case_context: str,
    reference_docs: Optional[str] = None,
) -> str:
    """Generate a Legal Notice document."""
    return generate_legal_draft(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Legal Notice"
    )


def generate_petition(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate a Court Petition document."""
    return generate_legal_draft(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Petition"
    )


def generate_contract(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate a Contract/Agreement document."""
    return generate_legal_draft(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Contract/Agreement"
    )


def generate_affidavit(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate an Affidavit document."""
    return generate_legal_draft(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Affidavit"
    )

if __name__ == "__main__":
    t=generate_petition(case_context="My client wants to file a divorce petition")
    print(t)