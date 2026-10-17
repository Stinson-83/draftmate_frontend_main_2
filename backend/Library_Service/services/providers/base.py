import abc
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from models import LegalJudgment, LegalAct, LegalSection

class BaseLegalProvider(abc.ABC):
    """Abstract base class for all legal data providers."""

    @abc.abstractmethod
    async def search_judgments(self, query: str, **kwargs) -> List[LegalJudgment]:
        """Search for judgments based on a query."""
        pass

    @abc.abstractmethod
    async def get_judgment(self, judgment_id: str) -> Optional[LegalJudgment]:
        """Retrieve a specific judgment by ID."""
        pass

    @abc.abstractmethod
    async def search_legislation(self, query: str, **kwargs) -> List[LegalAct]:
        """Search for legislation acts."""
        pass

    @abc.abstractmethod
    async def get_act(self, act_id: str) -> Optional[LegalAct]:
        """Retrieve a specific act by ID."""
        pass
