"""
Citation Agent - Advanced Legal Citation Research & Selection System.

Identifies legal issues, executes multi-query Indian Kanoon API searches (including newer judgments),
verifies candidates, performs multi-criteria ranking (relevance, SC/HC hierarchy, binding authority,
later treatment, statutory match, recency), and selects 5-10 authoritative citations.
"""

from typing import Dict, Any, List, Tuple
import logging
import re
from datetime import datetime

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from lex_bot.agents.base_agent import BaseAgent
from lex_bot.tools import indian_kanoon_api as ik
from lex_bot.tools.penal_code_lookup import PenalCodeLookup

logger = logging.getLogger(__name__)


CITATION_SYNTHESIS_PROMPT = """You are an expert Legal Research Specialist in Indian Law.

Analyze the legal issue, context, and the retrieved Indian Kanoon candidate judgments.
Select the top 5 to 10 most relevant, authoritative, and recent verified Indian judgments.

**Core Legal Issue / Query:**
{query}

**Statutory & Constitutional Provisions:**
{statutes}

**Retrieved Verified Judgments (Candidate Pool):**
{candidate_pool}

**Instructions:**
1. Select minimum 5 and maximum 10 judgments that represent the best combination of:
   - Recent Supreme Court judgments directly related to the issue (giving preference to 2020+ decisions over older 2005 decisions for current legal interpretation)
   - Current Supreme Court interpretation of the relevant statute
   - Relevant High Court judgments
   - Important older landmark cases that remain applicable
   - Later cases that clarify, reaffirm, or modify precedent
2. Each selected citation MUST be formatted as:
   [index] Case Name, Court Name, Judgment Date, Citation. Relevant issue: [Clear proposition].
3. Output ONLY the formatted list under the header 'Relevant Citations:'.
"""


class CitationAgent(BaseAgent):
    """
    Advanced Citation Network & Selection Agent.
    """

    def __init__(self, mode: str = "fast"):
        super().__init__(mode=mode)
        self.statute_lookup = PenalCodeLookup()

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute comprehensive citation research, verification, ranking, and selection workflow.
        Returns 'citation_context' and 'selected_citations' for Manager synthesis.
        """
        task = state.get("agent_tasks", {}).get("citation_agent", {})
        instruction = task.get("instruction", "") or state.get("original_query", "")

        logger.info(f"🔗 CitationAgent processing: {instruction[:70]}...")

        # 1. Parse Legal Issue, Statutory Provisions & Context
        doc_context = state.get("document_context", [])
        combined_text = instruction
        if doc_context:
            doc_text = " ".join([d.get("text", "") for d in doc_context[:3]])
            combined_text += " " + doc_text[:1500]

        extracted_sections = self._extract_sections(combined_text)
        articles = self._extract_articles(combined_text)
        case_names = self._extract_case_names(combined_text)

        statute_details = []
        for sec in extracted_sections:
            info = self.statute_lookup.get_section(sec)
            if info:
                statute_details.append(f"Section {info.get('section')} {info.get('code')}: {info.get('offense')}")
        statute_str = "\n".join(statute_details) if statute_details else "General Indian Law & Precedents"

        # 2. Multi-Query Indian Kanoon Search Strategy
        raw_candidates: List[Dict[str, Any]] = []

        # Query 1: Direct Legal Issue & Proposition
        q1_results = ik.search(instruction[:120], max_results=10)
        raw_candidates.extend(q1_results)

        # Query 2: Statutory Provisions & Articles
        if extracted_sections:
            for sec in extracted_sections[:2]:
                q2_results = ik.search(f"Section {sec} judgment", max_results=8)
                raw_candidates.extend(q2_results)
        if articles:
            for art in articles[:2]:
                q2_art_results = ik.search(f"Article {art} Constitution judgment", max_results=8)
                raw_candidates.extend(q2_art_results)

        # Query 3: Citing Cases / Precedent Network
        if case_names:
            for cname in case_names[:2]:
                q3_results = ik.search(f'"{cname}" cited', max_results=8)
                raw_candidates.extend(q3_results)

        # Query 4: Recent Supreme Court Judgments (2020-2026 recency requirement)
        recent_sc_query = f"{instruction[:80]} Supreme Court"
        q4_results = ik.search(recent_sc_query, max_results=10)
        raw_candidates.extend(q4_results)

        # Query 5: High Court Authorities
        recent_hc_query = f"{instruction[:80]} High Court"
        q5_results = ik.search(recent_hc_query, max_results=8)
        raw_candidates.extend(q5_results)

        # Fallback search if candidate pool is small
        if len(raw_candidates) < 5:
            fallback_query = f"{instruction[:100]} judgment precedent"
            raw_candidates.extend(ik.search(fallback_query, max_results=10))

        # 3. Deduplicate & Verify Candidates
        verified_candidates = []
        seen_ids = set()
        for cand in raw_candidates:
            docid = cand.get("docid") or cand.get("id") or cand.get("title")
            if not docid or docid in seen_ids:
                continue
            seen_ids.add(docid)

            verified_data = ik.verify_case_authority(cand)
            if verified_data.get("verified"):
                # Check later treatment for key precedents
                treatment_info = ik.check_later_treatment(docid, cand.get("title", ""))
                verified_data["treatment"] = treatment_info
                verified_candidates.append(verified_data)

        # 4. Multi-Criteria Ranking (SC > HC hierarchy, issue relevance, binding authority, recency, treatment)
        ranked_candidates = self._rank_candidates(
            candidates=verified_candidates,
            query=instruction,
            sections=extracted_sections,
            articles=articles
        )

        # 5. Select 5 to 10 Best Citations
        total_found = len(ranked_candidates)
        target_count = max(5, min(total_found, 10))
        if total_found < 5 and total_found > 0:
            target_count = total_found  # Return fewer than 5 only if fewer verified exist

        selected = ranked_candidates[:target_count]

        # 6. Format Final Citations Output
        formatted_citation_list = self._format_citation_items(selected)

        # Return structured context for Manager & frontend
        return {
            "citation_context": [{
                "content": formatted_citation_list,
                "source": "CitationAgent",
                "meta": {
                    "count": len(selected),
                    "target_min": 5,
                    "target_max": 10,
                    "total_searched": len(raw_candidates)
                }
            }],
            "selected_citations": selected
        }

    def _extract_sections(self, text: str) -> List[str]:
        return list(set(re.findall(r'\bsection\s*(\d+[A-Za-z]?)\b', text, re.IGNORECASE)))[:4]

    def _extract_articles(self, text: str) -> List[str]:
        return list(set(re.findall(r'\barticle\s*(\d+[A-Za-z]?)\b', text, re.IGNORECASE)))[:3]

    def _extract_case_names(self, text: str) -> List[str]:
        matches = re.findall(
            r'\b([A-Z][A-Za-z0-9.&\'/-]*(?:\s+[A-Z][A-Za-z0-9.&\'/-]*)*)\s+(?:vs\.?|v\.?)\s+([A-Z][A-Za-z0-9.&\'/-]*(?:\s+[A-Z][A-Za-z0-9.&\'/-]*)*)\b',
            text
        )
        case_names = []
        for m in matches[:3]:
            case_names.append(f"{m[0]} v. {m[1]}")
        return case_names

    def _rank_candidates(
        self,
        candidates: List[Dict[str, Any]],
        query: str,
        sections: List[str],
        articles: List[str]
    ) -> List[Dict[str, Any]]:
        query_words = set(re.findall(r'\w+', query.lower()))

        scored = []
        for cand in candidates:
            score = 0.0
            title = cand.get("title", "").lower()
            snippet = cand.get("snippet", "").lower()
            court = cand.get("court", "").lower()
            date_str = cand.get("publishdate", "")

            # 1. Relevance to legal issue (0-20 pts)
            matched_words = sum(1 for w in query_words if len(w) > 3 and (w in title or w in snippet))
            score += min(matched_words * 2.5, 20.0)

            # 2. Court Hierarchy (SC > HC > Tribunal) (Mandatory Hierarchy)
            if "supreme court" in court or "supreme court" in title:
                score += 35.0  # SC precedent carries highest weight
            elif "high court" in court or "high court" in title:
                score += 20.0
            else:
                score += 10.0

            # 3. Statutory Provision / Article Match (+15 pts)
            for sec in sections:
                if f"section {sec}".lower() in snippet or f"section {sec}".lower() in title:
                    score += 15.0
            for art in articles:
                if f"article {art}".lower() in snippet or f"article {art}".lower() in title:
                    score += 15.0

            # 4. Later Treatment Status (+10 / -40 pts)
            treatment = cand.get("treatment", {})
            if not treatment.get("is_good_law", True):
                score -= 40.0  # Overruled cases penalized heavily
            elif "reaffirmed" in treatment.get("treatment_summary", "").lower():
                score += 10.0

            # 5. Recency Bonus (2020-2026 = +8, 2010-2019 = +4, older = +2)
            year_match = re.search(r'\b(19\d\d|20\d\d)\b', date_str + " " + title)
            if year_match:
                year = int(year_match.group(1))
                if year >= 2020:
                    score += 8.0  # Preference given to newer judgments (e.g. 2020 over 2005)
                elif year >= 2010:
                    score += 4.0
                else:
                    score += 2.0

            cand["_score"] = score
            scored.append(cand)

        return sorted(scored, key=lambda x: x["_score"], reverse=True)

    def _format_citation_items(self, candidates: List[Dict[str, Any]]) -> str:
        if not candidates:
            return "Relevant Citations:\nNo verified authorities found."

        items = ["Relevant Citations:\n"]
        for idx, cand in enumerate(candidates, 1):
            title = cand.get("title", "Unknown Case").strip()
            court = cand.get("court", "Supreme Court of India")
            date = cand.get("publishdate") or cand.get("date") or "Date unavailable"
            citation = cand.get("citation") or f"AIR / SCC Reference (Doc #{cand.get('docid', 'N/A')})"
            docid = cand.get("docid") or ""
            url = cand.get("url") or (f"https://indiankanoon.org/doc/{docid}/" if docid else "")
            snippet = cand.get("snippet", "").strip()

            prop = snippet[:150].replace('\n', ' ') if snippet else "Direct precedent governing the legal issue."
            if not prop.endswith('.'):
                prop += '.'

            if url:
                entry = f"[{idx}] [{title}]({url}), {court}, {date}, {citation}. Case Relevance & Impact: {prop}"
            else:
                entry = f"[{idx}] {title}, {court}, {date}, {citation}. Case Relevance & Impact: {prop}"
            items.append(entry)

        return "\n\n".join(items)


# Singleton instance
citation_agent = CitationAgent()

