"""
Base Agent - Foundation for all specialized agents

Supports:
- Dual LLM modes (fast/reasoning)
- Both Gemini and OpenAI providers
- Query enhancement for better search
"""

import os
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.language_models.chat_models import BaseChatModel

from lex_bot.core.llm_factory import LLMFactory, get_llm
from lex_bot.config import LLM_PROVIDER


class BaseAgent:
    """
    Base class for all Lex Bot agents.
    
    Provides:
    - LLM initialization with mode selection
    - Query enhancement for search optimization
    """
    
    def __init__(
        self,
        mode: Literal["fast", "reasoning"] = "fast",
        provider: Literal["gemini", "openai"] = None
    ):
        """
        Initialize agent with specified LLM configuration.
        
        Args:
            mode: "fast" for quick responses, "reasoning" for complex analysis
            provider: "gemini" or "openai". Defaults to config.
        """
        self.mode = mode
        self.provider = provider or LLM_PROVIDER
        self.llm = self._init_llm()
    
    def _init_llm(self) -> BaseChatModel:
        """Initialize LLM using factory."""
        return LLMFactory.create(mode=self.mode, provider=self.provider)
    
    def switch_mode(self, mode: Literal["fast", "reasoning"]):
        """Switch LLM mode dynamically."""
        self.mode = mode
        self.llm = self._init_llm()
    
    def enhance_query(self, query: str, agent_type: str) -> str:
        """
        Enhance the user query for better search results.
        
        Args:
            query: Original user query
            agent_type: Type of agent ("law", "case", "general")
            
        Returns:
            Enhanced query string
        """
        system_prompt = ""
        
        if agent_type == "law":
            system_prompt = """You are a legal search optimizer.
            Input: A user query about Indian Law.
            Output: A single line of 5-8 relevant search keywords.
            - Include the specific act or section if relevant (e.g. "Article 21").
            - NO explanations, NO lists, NO markdown. Just keywords separated by spaces."""
        
        elif agent_type == "case":
            system_prompt = """You are a case law research specialist.
            Input: An unstructured user query about Indian legal cases.
            Output: A single line of 5-8 relevant search keywords.
            Instructions:
            - Structure roughly as: "Case Name + Court Name + Date of Judgment"
            - Extract case name, court, date from query if available
            - Focus on landmark case names or specific doctrines.
            - NO explanations, NO lists, NO markdown. Just keywords."""
        
        else:
            system_prompt = """You are a legal search optimizer.
            Input: A legal research query.
            Output: A single line of 5-8 search keywords. Just keywords, no formatting."""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            return chain.invoke({"query": query})
        except Exception as e:
            # Fallback to original query
            return query

