"""
Structured Logging Configuration

Production-ready logging with JSON format for easy parsing.
"""

import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add extra fields if present
        if hasattr(record, 'request_id'):
            log_data["request_id"] = record.request_id
        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id
        if hasattr(record, 'duration_ms'):
            log_data["duration_ms"] = record.duration_ms
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


class ContextLogger(logging.LoggerAdapter):
    """Logger adapter that adds context to all log messages."""
    
    def process(self, msg: str, kwargs: Dict[str, Any]) -> tuple:
        # Add context from extra dict
        extra = kwargs.get('extra', {})
        extra.update(self.extra)
        kwargs['extra'] = extra
        return msg, kwargs


def setup_logging(
    level: str = "INFO",
    json_format: bool = True,
    log_file: str = None
) -> logging.Logger:
    """
    Setup application logging.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        json_format: Use JSON format for production
        log_file: Optional file path for logs
        
    Returns:
        Root logger
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    if json_format:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(logging.Formatter(
            '%(asctime)s | %(levelname)s | %(name)s | %(message)s'
        ))
    
    root_logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    
    # Suppress noisy loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    
    return root_logger


def get_logger(name: str, **context) -> ContextLogger:
    """
    Get a logger with optional context.
    
    Usage:
        logger = get_logger("lex_bot.api", request_id="abc123")
        logger.info("Processing request")
    """
    base_logger = logging.getLogger(name)
    return ContextLogger(base_logger, context)
