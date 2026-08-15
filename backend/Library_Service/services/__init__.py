"""
Library Service Services Package

Contains service classes for external integrations like Indian Kanoon and e-Courts.
"""

from .indiankanoon_service import (
    IndianKanoonService,
    IndianKanoonAPIError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    NormalizedJudgment as IKNormalizedJudgment
)

from .ecourts_service import (
    ECourtsService,
    ECourtsAPIError,
    NormalizedCase,
    NormalizedOrder,
    NormalizedJudgment,
    NormalizedCauseListItem
)

__all__ = [
    "IndianKanoonService",
    "IndianKanoonAPIError",
    "AuthenticationError",
    "RateLimitError",
    "NotFoundError",
    "IKNormalizedJudgment",
    "ECourtsService",
    "ECourtsAPIError",
    "NormalizedCase",
    "NormalizedOrder",
    "NormalizedJudgment",
    "NormalizedCauseListItem"
]
