import time
import threading
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class DomainRateLimiter:
    """
    Thread-safe rate limiter that enforces a minimum delay between requests per domain.
    Includes timeout capability to prevent thread-pool exhaustion (latent deadlocks).
    """
    def __init__(self):
        self.last_request: Dict[str, float] = {}
        self.lock = threading.Lock()
        self.condition = threading.Condition(self.lock)

    def acquire(self, domain: str, delay_seconds: float, timeout: float = 15.0) -> bool:
        """
        Acquire permission to make a request to the domain.
        Blocks the current thread until the delay has passed, or until timeout.
        
        Args:
            domain: The domain to rate limit (e.g., 'indiankanoon.org')
            delay_seconds: Minimum seconds required between requests to this domain
            timeout: Maximum seconds to wait before giving up (fail fast)
            
        Returns:
            True if acquired, False if timed out
        """
        start_time = time.monotonic()
        with self.condition:
            while True:
                now = time.monotonic()
                last_req = self.last_request.get(domain, 0.0)
                elapsed = now - last_req
                
                if elapsed >= delay_seconds:
                    # We can proceed
                    self.last_request[domain] = now
                    return True
                
                # We need to wait
                wait_time = delay_seconds - elapsed
                remaining_timeout = timeout - (now - start_time)
                
                if remaining_timeout <= 0:
                    logger.warning(f"Rate limit timeout ({timeout}s) exceeded for domain: {domain}")
                    return False
                
                actual_wait = min(wait_time, remaining_timeout)
                # Releases lock while waiting, then re-acquires
                self.condition.wait(actual_wait)

# Global singleton
domain_limiter = DomainRateLimiter()
