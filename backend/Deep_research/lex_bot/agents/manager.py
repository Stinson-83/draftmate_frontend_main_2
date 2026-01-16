import json
from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from .base_agent import BaseAgent
from ..tools.reranker import rerank_documents
from ..core.router import ROUTER_PROMPT  # Use enhanced router prompt
from ..core.llm_factory import get_llm  # For dynamic mode switching
from ..core.fallback import router_cache  # Fast-path classification

class ManagerAgent(BaseAgent):
    def classify_and_route(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        First-stage router: Classifies query and assigns specific tasks to agents.
        Uses fast-path cache for common patterns to skip LLM call (~500ms savings).
        
        Returns:
            State update with complexity, agent_tasks, synthesis_instruction, etc.
        """
        original_query = state.get("original_query")
        print(f"🧭 Router Analyzing: {original_query}")
        
        # FAST PATH: Check cache first to skip LLM call
        cached_result = router_cache.check_cache(original_query)
        if cached_result:
            complexity = cached_result["complexity"]
            selected_agents = cached_result.get("selected_agents", [])
            print(f"   ⚡ Fast-path: {complexity.upper()} (cached)")
            return {
                "complexity": complexity,
                "selected_agents": selected_agents,
                "agent_tasks": {},
                "synthesis_instruction": "Provide helpful response",
                "synthesis_strategy": "equal_weight"
            }
        
        # Format Document Context
        doc_ctx = state.get("document_context", [])
        doc_str = "No document uploaded."
        if doc_ctx:
            doc_str = "\n\n".join([f"[Chunk]: {c['text']}" for c in doc_ctx])

        # Format Law Context
        law_ctx = state.get("law_context", [])
        law_str = "\n\n".join([f"Section {l['section']} ({l['act']}): {l['text']}" for l in law_ctx]) if law_ctx else "No specific statutes found."
        
        # Format Case Context
        case_ctx = state.get("case_context", [])
        case_str = "\n\n".join([f"Case: {c['title']}\nSummary: {c['summary']}" for c in case_ctx]) if case_ctx else "No specific cases found."

        # Format Chat History
        chat_history = state.get("messages", [])
        history_str = ""
        if chat_history:
            # Get last 3 turns
            recent = chat_history[-6:] 
            history_str = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in recent])

        prompt = ChatPromptTemplate.from_template(ROUTER_PROMPT)
        chain = prompt | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({
                "query": original_query,
                "chat_history": history_str,
                "document_context": doc_str,
                "law_context": law_str,
                "case_context": case_str
            })
            complexity = result.get("complexity", "simple")
            
            # Extract agent_tasks (new format with task_id, instruction, expected_output, dependencies)
            agent_tasks_raw = result.get("agent_tasks", [])
            
            # Build structured task data
            valid_agents = {"research", "explainer", "law", "case", "citation", "strategy"}
            selected_agents = []
            agent_tasks = {}  # agent -> full task object
            
            for task_item in agent_tasks_raw:
                agent_name = task_item.get("agent", "")
                
                if agent_name in valid_agents:
                    full_agent_name = f"{agent_name}_agent"
                    selected_agents.append(full_agent_name)
                    agent_tasks[full_agent_name] = {
                        "task_id": task_item.get("task_id", agent_name),
                        "instruction": task_item.get("instruction", "Perform research"),
                        "expected_output": task_item.get("expected_output", "Summary"),
                        "dependencies": task_item.get("dependencies", [])
                    }
            
            # Fallback for complex with no agents
            if complexity == "complex" and not selected_agents:
                selected_agents = ["law_agent", "case_agent"]
                agent_tasks["law_agent"] = {"task_id": "law_fallback", "instruction": "Find relevant statutes", "expected_output": "Statute list", "dependencies": []}
                agent_tasks["case_agent"] = {"task_id": "case_fallback", "instruction": "Find relevant cases", "expected_output": "Case list", "dependencies": []}
            
            print(f"   Complexity: {complexity.upper()}")
            if selected_agents:
                print(f"   Agents & Tasks:")
                for agent in selected_agents:
                    task = agent_tasks.get(agent, {})
                    print(f"      • {agent} [{task.get('task_id')}]: {task.get('instruction', '')[:60]}...")
            
            return {
                "complexity": complexity,
                "selected_agents": selected_agents,
                "agent_tasks": agent_tasks,
                "synthesis_instruction": result.get("synthesis_instruction", "Combine all agent outputs into cohesive response"),
                "synthesis_strategy": result.get("synthesis_strategy", "equal_weight"),
                "router_metadata": {
                    "reasoning": result.get("reasoning"),
                    "domain_tags": result.get("domain_tags", [])
                }
            }
        except Exception as e:
            print(f"❌ Router Failed: {e}")
            return {
                "complexity": "simple", 
                "selected_agents": [], 
                "agent_tasks": {},
                "synthesis_instruction": "Provide helpful response",
                "synthesis_strategy": "equal_weight"
            }


    # decompose_query is now obsolete - router assigns specific tasks directly via agent_tasks



    # def generate_outline(self, state: Dict[str, Any]) -> Dict[str, Any]:
    #     """
    #     Aggregates context and generates outline.
    #     """
    #     print("📝 Generating Outline...")
    #     law_ctx = state.get("law_context", [])
    #     case_ctx = state.get("case_context", [])
        
    #     # Combine all candidates
    #     all_docs = law_ctx + case_ctx
        
    #     # Context Management: Rerank everything against original query to find the absolute best chunks
    #     # Limit to fit context window (e.g. Top 15)
    #     top_docs = rerank_documents(state["original_query"], all_docs, top_n=15)
        
    #     # Format context
    #     context_str = ""
    #     for i, doc in enumerate(top_docs, 1):
    #         source_type = doc.get('source', 'Web')
    #         title = doc.get('title', 'Untitled')
    #         snippet = doc.get('search_hit') or doc.get('snippet') or doc.get('text', '')
    #         context_str += f"[{i}] {title} ({doc.get('url')}) [{source_type}]:\n{snippet}\n\n"
            
    #     prompt = ChatPromptTemplate.from_template("""
        # You are an Assistant to a Legal Advocate specializing in Indian Law.

        # Your task is to produce a structured OUTLINE of how you will research and answer the user's legal query.
    def generate_outline(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aggregates context and generates outline.
        """
        print("📝 Generating Outline...")
        law_ctx = state.get("law_context", [])
        case_ctx = state.get("case_context", [])
        document_ctx = state.get("document_context", []) # Assuming this will be available in state
        
        # Combine all candidates
        all_docs = law_ctx + case_ctx + document_ctx
        
        # Context Management: Rerank everything against original query to find the absolute best chunks
        # Limit to fit context window (e.g. Top 15)
        top_docs = rerank_documents(state["original_query"], all_docs, top_n=15)
        
        # Format context
        law_context_str = ""
        case_context_str = ""
        document_context_str = ""

        for i, doc in enumerate(top_docs, 1):
            source_type = doc.get('source', 'Web')
            title = doc.get('title', 'Untitled')
            snippet = doc.get('search_hit') or doc.get('snippet') or doc.get('text', '')
            formatted_doc = f"[{i}] {title} ({doc.get('url')}) [{source_type}]:\n{snippet}\n\n"
            
            if source_type == 'Law':
                law_context_str += formatted_doc
            elif source_type == 'Case':
                case_context_str += formatted_doc
            elif source_type == 'Document': # Assuming 'Document' as source type for uploaded files
                document_context_str += formatted_doc
            else: # Fallback for other types or if source not specified
                document_context_str += formatted_doc # Treat as general document context for now

        # Ensure non-empty strings for prompt
        law_context_str = law_context_str if law_context_str else "No relevant statutes found."
        case_context_str = case_context_str if case_context_str else "No relevant case law found."
        document_context_str = document_context_str if document_context_str else "No relevant documents found."
            
        prompt = ChatPromptTemplate.from_template("""
        You are an Assistant to a Legal Advocate specializing in Indian Law.

        Your task is to produce a structured OUTLINE of how you will research and answer the user's legal query.

        DO NOT provide the final answer yet.

        Using ONLY the provided context, create an outline that includes:

        1. Key legal issues raised by the query.
        2. Relevant statutes (sections of acts) found in**Document Context (from uploaded file):**
{document_context}

**Legal Context (Statutes):**
{law_context}

**Case Law Context (Precedents):**
{case_context}.
        # 4. Sub-questions that must be answered.
        # 5. Which parts of the context apply to each sub-question.
        # 6. What additional general legal principles (Indian law only) may assist, if safe.

        # Rules:
        # - Do NOT hallucinate cases or statutes not present in the context (general principles allowed, but flagged as such).
        # - Focus only on structuring the reasoning.

        # Context:
        # {context}

        # Query:
        # {query}

        # Now produce ONLY the outline.

    #     """)
        
    #     chain = prompt | self.llm | StrOutputParser()
    #     answer = chain.invoke({"context": context_str, "query": state["original_query"]})
        
    #     return {"outline": answer}

    def check_needs_clarification(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if the query is ambiguous and needs clarification from user.
        Only called for COMPLEX queries.
        """
        original_query = state.get("original_query", "")
        
        clarification_prompt = ChatPromptTemplate.from_template("""
        You are a legal research assistant. Analyze if the following query is clear enough to proceed, 
        or if you need more information from the user.
        
        Query: {query}
        
        Check for:
        1. Missing jurisdiction (which state/court?)
        2. Missing context (civil/criminal? plaintiff/defendant?)
        3. Vague terms that could mean multiple things
        4. Missing facts essential for legal analysis
        
        Respond in JSON:
        {{
            "needs_clarification": true or false,
            "clarifying_questions": ["question1", "question2"] // Only if needs_clarification is true
        }}
        """)
        
        chain = clarification_prompt | self.llm | JsonOutputParser()
        
        try:
            result = chain.invoke({"query": original_query})
            
            if result.get("needs_clarification", False):
                questions = result.get("clarifying_questions", [])
                if questions:
                    # Format as a polite request
                    clarification_msg = "I need a bit more information to provide the best answer:\n\n"
                    for i, q in enumerate(questions[:3], 1):  # Max 3 questions
                        clarification_msg += f"{i}. {q}\n"
                    
                    return {
                        "needs_clarification": True,
                        "final_answer": clarification_msg
                    }
            
            return {"needs_clarification": False}
            
        except Exception as e:
            print(f"⚠️ Clarification check failed: {e}")
            return {"needs_clarification": False}

    def generate_response(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aggregates context and generates final answer.
        Supports both normal and reasoning (CoT) modes.
        
        Note: For reasoning mode, uses Gemini Pro or GPT-4o for deeper analysis.
        """
        llm_mode = state.get("llm_mode", "fast")
        print(f"📝 Generating Final Response... (Mode: {llm_mode.upper()})")
        
        # Get the appropriate LLM based on mode (reasoning uses pro models)
        llm = get_llm(mode=llm_mode)
        
        law_ctx = state.get("law_context", [])
        case_ctx = state.get("case_context", [])
        document_ctx = state.get("document_context", [])
        
        # Combine all candidates
        all_docs = law_ctx + case_ctx + document_ctx
        
        # Context Management: Rerank everything against original query
        # Limit to 10 for token optimization
        top_docs = rerank_documents(state["original_query"], all_docs, top_n=10)
        
        # Format context
        context_str = ""
        for i, doc in enumerate(top_docs, 1):
            source_type = doc.get('source', 'Web')
            title = doc.get('title', 'Untitled')
            snippet = doc.get('search_hit') or doc.get('snippet') or doc.get('text', '')
            context_str += f"[{i}] {title} ({doc.get('url')}) [{source_type}]:\n{snippet}\n\n"
            
        # Add tool results (e.g. from Explainer or Research agent in complex mode)
        tool_results = state.get("tool_results", [])
        if tool_results:
            context_str += "\n\n=== ADDITIONAL ANALYSIS ===\n"
            agent_map = {
                "research_agent": "Legal Research Findings",
                "explainer": "Concept Explanation",
                "law_agent": "Statutory Analysis",
                "case_agent": "Case Law Analysis",
                "citation_agent": "Citation Verification",
                "strategy_agent": "Legal Strategy"
            }
            for res in tool_results:
                agent = res.get("agent", "Unknown Agent")
                friendly_name = agent_map.get(agent, agent.replace("_", " ").title())
                content = res.get("content", "")
                if content:
                    context_str += f"\n--- {friendly_name} ---\n{content}\n"
        
        # Format Chat History
        chat_history = state.get("messages", [])
        history_str = ""
        if chat_history:
            recent = chat_history[-6:]
            history_str = "\n".join([f"{msg['role'].upper()}: {msg['content']}" for msg in recent])
            context_str = f"=== CONVERSATION HISTORY ===\n{history_str}\n\n" + context_str

        # Choose prompt based on mode
        if llm_mode == "reasoning":
            # Chain-of-Thought prompt for reasoning mode
            prompt = ChatPromptTemplate.from_template("""
            You are a Senior Legal Research Assistant specializing in Indian Law.

            ## Task
            Analyze the legal query and provide a comprehensive, well-reasoned answer.

            ## Context (Retrieved Documents)
            {context}

            ## Query
            {query}

            ## Instructions
            Use Chain-of-Thought reasoning:

            **Step 1: Understand the Query**
            - Identify the core legal question(s) being asked
            - Extract key facts, parties, and circumstances
            - Determine the area of law involved (civil, criminal, constitutional, etc.)
            - Consider CONVERSATION HISTORY for follow-up context

            **Step 2: Identify Relevant Law**
            - Cite applicable statutes, sections, articles, and acts
            - Quote or paraphrase key provisions from the context
            - Note any amendments or recent changes to the law
            - Distinguish between mandatory and directory provisions where relevant

            **Step 3: Analyze Case Law**
            - Identify binding precedents (Supreme Court, relevant High Court)
            - Examine persuasive precedents from other High Courts
            - Highlight the ratio decidendi (binding principle)
            - Distinguish obiter dicta where necessary
            - Note if cases have been overruled or limited

            **Step 4: Synthesize**
            - Harmonize statutory provisions with judicial interpretations
            - Address conflicting judgments or legal positions
            - Apply law to the specific facts presented
            - Integrate any additional research findings naturally without attribution to specific agents
            - Consider procedural aspects and limitation periods if relevant

            **Step 5: Conclude**
            - Provide a clear, practical answer to the query
            - Outline possible legal remedies or courses of action
            - Highlight exceptions, caveats, or jurisdictional variations
            - Note areas requiring further factual investigation
            - Indicate confidence level based on available authority

            ## Citation Standards
            Use PROPER INDIAN LEGAL CITATIONS:
            - **Supreme Court Cases**: Case Name v. Case Name, (Year) Volume SCC Page | AIR Year SC Page
            Example: Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225
            - **High Court Cases**: Case Name v. Case Name, (Year) Volume Reporter Page (Court Abbreviation)
            Example: State of Maharashtra v. XYZ, (2023) 2 Bom CR 456
            - **Statutes**: Section/Article Number of Act Name, Year
            Example: Section 138 of Negotiable Instruments Act, 1881
            - **Rules/Regulations**: Rule X of Rules Name, Year
            Example: Rule 11 of Code of Civil Procedure Rules, 1908
            - **Constitutional Provisions**: Article X of the Constitution of India
            Example: Article 21 of the Constitution of India
            - **Writs/Appeals**: Type No./Year, Court Name
            Example: W.P.(C) No. 1234/2023, Delhi High Court

            Use [1], [2], [3] for inline citations linking to source documents.

            ## Response Format
            - Begin with a brief summary of the legal issue
            - Use clear headings for each analytical step
            - Maintain professional legal terminology
            - Be precise, authoritative, and legally sound
            - Avoid speculation; clearly distinguish between settled law and evolving jurisprudence
            """)
        else:
            # Standard prompt for fast mode
            prompt = ChatPromptTemplate.from_template("""
            You are a Legal Research Assistant specializing in Indian Law, supporting advocates with quick and accurate legal research.

            ## Context
            {context}

            ## Query
            {query}

            ## Instructions

            **Analysis Approach:**
            1. Break down the query into constituent legal issues
            2. Address each issue systematically using the provided context
            3. Integrate additional research naturally without mentioning source agents
            4. Consider conversation history for follow-up questions

            **Legal Framework:**
            - Identify applicable statutes, sections, and provisions
            - Cite relevant case law with proper precedential hierarchy (SC > HC > Tribunals)
            - Distinguish between ratio decidendi and obiter dicta in judgments
            - Note any conflict between High Courts or pending matters before larger benches

            **Citation Standards (Mandatory):**
            - **Cases**: Case Name v. Case Name, (Year) Volume Reporter Page
            - SC: Use SCC/AIR → (2024) 5 SCC 123 or AIR 2024 SC 1234
            - HC: Include court abbreviation → (2023) 2 Bom CR 456
            - **Statutes**: Section X of Act Name, Year → Section 420 of IPC, 1860
            - **Constitutional Provisions**: Article X of the Constitution of India
            - **Rules**: Rule X of Rules Name, Year
            - **Writs/Petitions**: W.P.(C)/SLP/Crl.A. No./Year, Court Name

            Use [1], [2] inline references to link citations to source documents.

            **Response Quality:**
            - Differentiate clearly between:
            * Primary legislation (Acts, Articles)
            * Subordinate legislation (Rules, Notifications, Orders)
            * Binding precedents (Ratio decidendi)
            * Persuasive authority (Obiter, foreign judgments)
            - If context is insufficient, explicitly state limitations
            - Draw on general legal principles only when safe and clearly indicate this
            - Highlight procedural requirements, limitation periods, and jurisdictional issues
            - Note any recent amendments or pending legislative changes

            **Professional Standards:**
            - Use precise legal terminology
            - Maintain objective, analytical tone
            - Avoid absolute statements where law is evolving
            - Flag areas requiring case-specific factual verification
            - Be concise but comprehensive

            ## Output Format
            Structure your response with:
            1. **Brief Answer** (2-3 lines summarizing the legal position)
            2. **Detailed Analysis** (organized by legal issues)
            3. **Relevant Citations** (with proper formatting)
            4. **Practical Implications** (if applicable)
            5. **Caveats/Limitations** (if any)
            """)
        
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context_str, "query": state["original_query"]})
        
        # Enrich sources with index for UI
        enriched_sources = []
        for i, doc in enumerate(top_docs, 1):
            doc_copy = doc.copy()
            doc_copy["index"] = i
            doc_copy["type"] = doc.get("source", "Web")
            enriched_sources.append(doc_copy)

        # For reasoning mode, extract the reasoning trace
        result = {
            "final_answer": answer,
            "sources": enriched_sources,
            "suggested_followups": self._generate_followups(state["original_query"], answer)
        }
        if llm_mode == "reasoning":
            result["reasoning_trace"] = answer  # Full CoT is the reasoning trace
        
        return result

manager_agent = ManagerAgent()


