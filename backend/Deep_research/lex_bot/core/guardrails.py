"""
Guardrails and Input Sanitization

Protects the system from:
- Malicious inputs
- Excessive requests
- Invalid content
"""

import re
import logging
from typing import Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

# Limits
MAX_QUERY_LENGTH = 2000
MIN_QUERY_LENGTH = 3
MAX_REQUESTS_PER_MINUTE = 10


class InputGuard:
    """
    Input validation and sanitization.
    
    Usage:
        guard = InputGuard()
        is_valid, cleaned, error = guard.validate(query)
    """
    
    # Patterns to block (injection attempts, etc.)
    BLOCKED_PATTERNS = [
        r'<script',
        r'javascript:',
        r'data:text/html',
        r'on\w+\s*=',  # onclick, onerror, etc.
        r'\{\{\s*.*\s*\}\}',  # Template injection {{ }}
        r'\$\{.*\}',  # Template injection ${ }
    ]
    
    # Compile patterns for performance
    _compiled_patterns = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]
    
    @classmethod
    def sanitize(cls, query: str) -> str:
        """
        Sanitize a query string.
        
        - Strips whitespace
        - Normalizes whitespace
        - Removes control characters
        """
        if not query:
            return ""
        
        # Strip leading/trailing whitespace
        query = query.strip()
        
        # Normalize whitespace (multiple spaces -> single space)
        query = ' '.join(query.split())
        
        # Remove control characters except newlines
        query = ''.join(c for c in query if c >= ' ' or c == '\n')
        
        # Limit newlines
        if query.count('\n') > 10:
            lines = query.split('\n')[:10]
            query = '\n'.join(lines)
        
        return query
    
    @classmethod
    def validate(cls, query: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate and sanitize a query.
        
        Returns:
            (is_valid, sanitized_query, error_message)
        """
        # Sanitize first
        cleaned = cls.sanitize(query)
        
        # Check length
        if len(cleaned) < MIN_QUERY_LENGTH:
            return False, cleaned, f"Query too short (min {MIN_QUERY_LENGTH} chars)"
        
        if len(cleaned) > MAX_QUERY_LENGTH:
            return False, cleaned, f"Query too long (max {MAX_QUERY_LENGTH} chars)"
        
        # Check for blocked patterns
        for pattern in cls._compiled_patterns:
            if pattern.search(cleaned):
                logger.warning(f"🚫 Blocked pattern detected in query")
                return False, cleaned, "Query contains blocked content"
        
        return True, cleaned, None


class RateLimiter:
    """
    Simple in-memory rate limiter.
    
    For production, use Redis-based rate limiting.
    """
    
    def __init__(self, max_requests: int = MAX_REQUESTS_PER_MINUTE):
        self.max_requests = max_requests
        self._requests: dict = defaultdict(list)  # user_id -> [timestamps]
    
    def check(self, user_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user is within rate limit.
        
        Returns:
            (allowed, error_message)
        """
        now = datetime.now()
        cutoff = now - timedelta(minutes=1)
        
        # Clean old requests
        self._requests[user_id] = [
            ts for ts in self._requests[user_id]
            if ts > cutoff
        ]
        
        if len(self._requests[user_id]) >= self.max_requests:
            logger.warning(f"🚫 Rate limit exceeded for user {user_id}")
            return False, f"Rate limit exceeded. Max {self.max_requests} requests per minute."
        
        # Record this request
        self._requests[user_id].append(now)
        return True, None


class OutputGuard:
    """
    Output validation and sanitization.
    """
    
    MAX_RESPONSE_LENGTH = 50000  # chars
    
    @classmethod
    def sanitize(cls, response: str) -> str:
        """Sanitize response before sending to client."""
        if not response:
            return ""
        
        # Truncate if too long
        if len(response) > cls.MAX_RESPONSE_LENGTH:
            response = response[:cls.MAX_RESPONSE_LENGTH]
            response += "\n\n[Response truncated due to length]"
        
        return response


# Singletons
input_guard = InputGuard()
rate_limiter = RateLimiter()
output_guard = OutputGuard()
