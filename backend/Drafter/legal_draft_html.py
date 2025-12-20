import google.generativeai as genai
from typing import Optional
from dotenv import load_dotenv
load_dotenv()

# System prompt for legal drafting with plain HTML output
LEGAL_DRAFT_PLAIN_HTML_SYSTEM_PROMPT = """
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

    _(the exact description of missing information)_

### Examples of proper placeholder usage:
- If party name is missing: "_(Full legal name of the Plaintiff)_"
- If address is missing: "_(Complete residential address of the Defendant)_"
- If date is missing: "_(Date of incident/agreement/filing)_"
- If amount is missing: "_(Exact amount in dispute in INR/USD)_"
- If case number is missing: "_(Case Number assigned by the Court)_"
- If court name is missing: "_(Name of the Hon'ble Court and Jurisdiction)_"
- If witness details are missing: "_(Name and address of Witness 1)_"
- If exhibit reference is missing: "_(Reference number of attached exhibit)_"

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

## CRITICAL HTML OUTPUT FORMAT:

You MUST output ONLY plain text wrapped in span elements with line breaks. Follow these rules EXACTLY:

1. **NO FORMATTING ALLOWED**: Do NOT use any of the following:
   - NO <strong> or <b> tags (no bold)
   - NO <em> or <i> tags (no italics)
   - NO <u> tags (no underline)
   - NO <mark> tags (no highlighting)
   - NO CSS styling for bold, italic, colors, backgrounds
   - NO class names that imply formatting

2. **MANDATORY WRAPPER**: Every piece of text content MUST be wrapped in exactly this tag:
   <span class="content-element text-span">your text content here</span>

3. **LINE BREAKS - REQUIRED**: You MUST use the <br> tag after EVERY span element for line breaks.
   The <br> tag is the ONLY additional HTML tag allowed. Place it AFTER the closing </span> tag.

4. **OUTPUT FORMAT**: Output span elements followed by <br> tags. Example:

<span class="content-element text-span">LEGAL NOTICE</span><br>
<span class="content-element text-span"></span><br>
<span class="content-element text-span">REF. NO.: _(Reference Number)_</span><br>
<span class="content-element text-span">DATE: 20th December 2024</span><br>
<span class="content-element text-span"></span><br>
<span class="content-element text-span">To,</span><br>
<span class="content-element text-span">The Managing Director,</span><br>
<span class="content-element text-span">ABC Company Private Limited,</span><br>

5. **EMPTY LINES**: For blank lines/spacing, use: <span class="content-element text-span"></span><br>

6. **ALLOWED TAGS ONLY**: 
   - <span class="content-element text-span">...</span> - for wrapping ALL text content
   - <br> - for line breaks (MUST appear after every </span>)
   
   NO other HTML tags are allowed (!DOCTYPE, html, head, body, style, div, p, etc.)

## OUTPUT:

Provide the complete legal draft with each line wrapped in the span tag as specified above.
Do not add any explanatory notes or comments - output ONLY the span-wrapped content lines.
"""

DEFAULT_API_KEY = ""


def generate_legal_draft_plain_html(
    case_context: str,
    legal_documents: Optional[str] = None,
    document_type: Optional[str] = None,
    api_key: Optional[str] = DEFAULT_API_KEY
) -> str:
    """
    Generate a legal draft as plain HTML with content in text-span elements.
    
    Args:
        case_context: Detailed description of the case including parties, facts,
                     dates, amounts, and all relevant information.
        legal_documents: Optional reference legal documents or templates to guide
                        the drafting process.
        document_type: Optional type of document to generate (e.g., "Legal Notice",
                      "Petition", "Contract", "Affidavit").
        api_key: Google API key for Gemini. If not provided, uses DEFAULT_API_KEY
                or GOOGLE_API_KEY environment variable.
    
    Returns:
        HTML content as a string with all text wrapped in span elements.
    
    Raises:
        ValueError: If no API key is available.
        Exception: If the API call fails or returns an empty response.
    """
    # Configure API key - Priority: parameter > DEFAULT_API_KEY > environment variable
    if api_key:
        genai.configure(api_key=api_key)
    elif DEFAULT_API_KEY:
        genai.configure(api_key=DEFAULT_API_KEY)
    else:
        import os
        if os.environ.get("GOOGLE_API_KEY"):
            genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
        else:
            raise ValueError(
                "No API key provided. Please either:\n"
                "1. Set DEFAULT_API_KEY at the top of legal_draft_plain_html_generator.py\n"
                "2. Pass api_key parameter to the function\n"
                "3. Set GOOGLE_API_KEY environment variable"
            )
    
    # Initialize the Gemini model
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=LEGAL_DRAFT_PLAIN_HTML_SYSTEM_PROMPT
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
        "Remember to use placeholders _(description of missing info)_ for any "
        "information that is not provided in the case context. "
        "Output ONLY span elements with class=\"content-element text-span\" followed by <br> tags. "
        "IMPORTANT: Use <br> tag after EVERY </span> for line breaks. "
        "NO bold, NO italics, NO highlighting, NO other formatting. "
        "Each line of content in its own span element followed by <br>. "
        "Start output with the first span element immediately."
    )
    
    # Combine all parts
    user_prompt = "\n".join(user_prompt_parts)
    
    # Generate the legal draft
    try:
        response = model.generate_content(user_prompt)
        
        # Extract and return the generated text
        if response.text:
            html_content = response.text.strip()
            
            # Clean up any markdown code block markers if present
            if html_content.startswith("```html"):
                html_content = html_content[7:]
            if html_content.startswith("```"):
                html_content = html_content[3:]
            if html_content.endswith("```"):
                html_content = html_content[:-3]
            
            return html_content.strip()
        else:
            raise Exception(
                "The model returned an empty response. "
                "Please try again with more detailed case context."
            )
            
    except Exception as e:
        raise Exception(f"Failed to generate legal draft: {str(e)}")


def save_legal_draft_plain_html(
    case_context: str,
    output_path: str,
    legal_documents: Optional[str] = None,
    document_type: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """
    Generate and save a legal draft as a plain HTML file.
    
    Args:
        case_context: Detailed description of the case.
        output_path: Path where the HTML file will be saved.
        legal_documents: Optional reference legal documents.
        document_type: Optional type of document to generate.
        api_key: Google API key for Gemini.
    
    Returns:
        The path to the saved HTML file.
    """
    html_content = generate_legal_draft_plain_html(
        case_context=case_context,
        legal_documents=legal_documents,
        document_type=document_type,
        api_key=api_key
    )
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_path


# Convenience functions for specific document types
def generate_legal_notice_plain_html(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate a Legal Notice document as plain HTML."""
    return generate_legal_draft_plain_html(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Legal Notice",
        api_key=api_key
    )


def generate_petition_plain_html(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate a Court Petition document as plain HTML."""
    return generate_legal_draft_plain_html(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Petition",
        api_key=api_key
    )


def generate_contract_plain_html(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate a Contract/Agreement document as plain HTML."""
    return generate_legal_draft_plain_html(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Contract/Agreement",
        api_key=api_key
    )


def generate_affidavit_plain_html(
    case_context: str,
    reference_docs: Optional[str] = None,
    api_key: Optional[str] = None
) -> str:
    """Generate an Affidavit document as plain HTML."""
    return generate_legal_draft_plain_html(
        case_context=case_context,
        legal_documents=reference_docs,
        document_type="Affidavit",
        api_key=api_key
    )
