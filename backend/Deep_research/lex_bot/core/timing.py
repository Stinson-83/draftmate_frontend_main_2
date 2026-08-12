"""
Latency Tracker — Lightweight step-level timing for pipeline profiling.

Usage:
    tracker = LatencyTracker()
    with tracker.step("query_rewrite"):
        result = rewrite_query(...)
    
    tracker.summary()  # Logs all steps
    tracker.as_dict()  # Returns {"steps": {...}, "total_ms": ...}
"""

import time
import logging
from contextlib import contextmanager
from typing import Dict, Any

logger = logging.getLogger("lex_bot.api")


class LatencyTracker:
    """Tracks latency per step in the query pipeline."""

    def __init__(self):
        self._steps: Dict[str, float] = {}  # step_name -> duration_ms
        self._start_time: float = time.monotonic()

    @contextmanager
    def step(self, name: str):
        """Context manager to time a named step."""
        t0 = time.monotonic()
        try:
            yield
        finally:
            elapsed_ms = (time.monotonic() - t0) * 1000
            self._steps[name] = round(elapsed_ms, 1)

    def record(self, name: str, duration_ms: float):
        """Manually record a step duration."""
        self._steps[name] = round(duration_ms, 1)

    @property
    def total_ms(self) -> float:
        """Total elapsed time since tracker creation."""
        return round((time.monotonic() - self._start_time) * 1000, 1)

    def as_dict(self) -> Dict[str, Any]:
        """Return timing data as a dict (for API responses)."""
        return {
            "steps": dict(self._steps),
            "total_ms": self.total_ms,
        }

    def summary(self) -> str:
        """Log a formatted summary of all steps."""
        lines = ["  Latency Breakdown:"]
        for name, ms in self._steps.items():
            lines.append(f"   {name:<30s} {ms:>8.1f}ms")
        lines.append(f"   {'TOTAL':<30s} {self.total_ms:>8.1f}ms")
        msg = "\n".join(lines)
        logger.info("\n" + msg)
        print("\n" + msg, flush=True)  # Also print for dev visibility
        return msg
