"""Legal Reviewer Agent — checks drafts for legal risks and issues.

Runs after the drafter produces a draft (or when user uploads their own draft).
Uses Gemini to analyze the draft for:
  - Missing critical clauses
  - Weak legal language
  - Jurisdictional issues
  - Missing references to applicable acts/sections
  - Potential risks and vulnerabilities
  - Suggestions for improvement
"""
from __future__ import annotations

import logging
import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

REVIEWER_SYSTEM_PROMPT = """You are a senior legal risk analyst. Your job is to review legal documents and identify risks, weaknesses, and areas for improvement.

## YOUR ANALYSIS MUST COVER:

1. **Missing Critical Elements**: Required clauses, sections, or provisions that are absent
2. **Legal Language Strength**: Weak, vague, or ambiguous language that could be exploited
3. **Jurisdictional Compliance**: Whether the document follows applicable jurisdiction's requirements
4. **Statutory References**: Missing or incorrect references to applicable laws, acts, sections
5. **Risk Areas**: Clauses that expose the client to unnecessary risk
6. **Formatting Issues**: Structural problems that could affect legal validity
7. **Placeholder Review**: Identify remaining placeholders that MUST be filled before use

## OUTPUT FORMAT:

Return your analysis as a JSON object with this exact structure:
{
  "overall_risk_level": "low|medium|high",
  "risk_score": 1-10,
  "summary": "One paragraph summary of the review",
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "category": "missing_clause|weak_language|jurisdiction|statutory|risk|formatting|placeholder",
      "description": "What the issue is",
      "recommendation": "How to fix it",
      "location": "Which section/paragraph (approximate)"
    }
  ],
  "strengths": ["List of things done well"],
  "suggested_additions": ["Clauses or provisions to add"]
}

Be thorough but practical. Focus on actionable feedback. Output ONLY the JSON — no markdown fences, no explanation outside the JSON."""


def review_draft(html_content: str, draft_type: str | None = None) -> dict:
    """Review a legal draft for risks and issues.
    
    Args:
        html_content: The HTML content of the draft to review
        draft_type: Optional type of the draft for context
        
    Returns:
        Dict with review results (risk level, issues, suggestions)
    """
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("No Google/Gemini API key configured")

    genai.configure(api_key=api_key)

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=REVIEWER_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            max_output_tokens=4096,
            temperature=0.3,  # Lower temp for more consistent analysis
        ),
    )

    prompt_parts = []
    if draft_type:
        prompt_parts.append(f"Document Type: {draft_type}\n")
    prompt_parts.append(f"## LEGAL DOCUMENT TO REVIEW:\n\n{html_content}")
    prompt_parts.append(
        "\n\nAnalyze this document thoroughly. Identify all risks, issues, "
        "and areas for improvement. Output ONLY the JSON analysis."
    )

    try:
        response = model.generate_content("\n".join(prompt_parts))
        if response.text:
            text = response.text.strip()
            # Clean markdown fences
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            import json
            try:
                return json.loads(text.strip())
            except json.JSONDecodeError:
                logger.warning("reviewer: failed to parse JSON response, returning raw")
                return {
                    "overall_risk_level": "unknown",
                    "risk_score": 0,
                    "summary": text[:500],
                    "issues": [],
                    "strengths": [],
                    "suggested_additions": [],
                    "_raw_response": text,
                }
        raise Exception("Empty response from model")
    except Exception as e:
        logger.exception("legal review failed")
        return {
            "overall_risk_level": "error",
            "risk_score": 0,
            "summary": f"Review failed: {str(e)[:200]}",
            "issues": [],
            "strengths": [],
            "suggested_additions": [],
        }


def format_review_for_chat(review: dict) -> str:
    """Format the review result as a human-readable chat message."""
    risk_level = review.get("overall_risk_level", "unknown")
    risk_score = review.get("risk_score", 0)
    summary = review.get("summary", "")
    issues = review.get("issues", [])

    # Risk level emoji
    risk_emoji = {"low": "🟢", "medium": "🟡", "high": "🔴"}.get(risk_level, "⚪")

    lines = [
        f"{risk_emoji} Legal Risk Analysis: {risk_level.upper()} (score: {risk_score}/10)",
        "",
        summary,
    ]

    if issues:
        critical = [i for i in issues if i.get("severity") == "critical"]
        warnings = [i for i in issues if i.get("severity") == "warning"]
        suggestions = [i for i in issues if i.get("severity") == "suggestion"]

        if critical:
            lines.append(f"\n🔴 {len(critical)} Critical Issue{'s' if len(critical) > 1 else ''}:")
            for i, issue in enumerate(critical, 1):
                lines.append(f"  {i}. {issue['description']}")
                lines.append(f"     → {issue['recommendation']}")

        if warnings:
            lines.append(f"\n⚠️ {len(warnings)} Warning{'s' if len(warnings) > 1 else ''}:")
            for i, issue in enumerate(warnings, 1):
                lines.append(f"  {i}. {issue['description']}")

        if suggestions:
            lines.append(f"\n💡 {len(suggestions)} Suggestion{'s' if len(suggestions) > 1 else ''}:")
            for i, issue in enumerate(suggestions, 1):
                lines.append(f"  {i}. {issue['description']}")

    strengths = review.get("strengths", [])
    if strengths:
        lines.append(f"\n✅ Strengths: {', '.join(strengths[:3])}")

    return "\n".join(lines)
